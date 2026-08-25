// app/api/dashboard/route.ts — Dashboard Data (untuk user yang login)

import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ambil data user
    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT id, username, full_name, email, phone, role, tier, foto_path, created_at FROM users WHERE id = ?',
      [session.id]
    );

    if (users.length === 0) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    // Ambil rekening user
    const [rekening] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM rekening WHERE user_id = ? ORDER BY id',
      [session.id]
    );

    // Ambil total saldo
    const totalSaldo = rekening.reduce(
      (sum: number, r: RowDataPacket) => sum + (r.status === 'aktif' ? Number(r.saldo) : 0),
      0
    );

    // Ambil riwayat transaksi terbaru
    const rekeningIds = rekening.map((r: RowDataPacket) => r.id);
    let transaksi: RowDataPacket[] = [];

    if (rekeningIds.length > 0) {
      const placeholders = rekeningIds.map(() => '?').join(',');
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT t.*, 
          rf.nomor_rekening as from_rekening, 
          rt.nomor_rekening as to_rekening,
          uf.full_name as from_name,
          ut.full_name as to_name
        FROM transaksi t 
        JOIN rekening rf ON t.from_rekening_id = rf.id 
        JOIN rekening rt ON t.to_rekening_id = rt.id
        JOIN users uf ON rf.user_id = uf.id
        JOIN users ut ON rt.user_id = ut.id
        WHERE t.from_rekening_id IN (${placeholders}) OR t.to_rekening_id IN (${placeholders})
        ORDER BY t.created_at DESC
        LIMIT 10`,
        [...rekeningIds, ...rekeningIds]
      );
      transaksi = rows;
    }

    return NextResponse.json({
      user: users[0],
      rekening,
      total_saldo: totalSaldo,
      transaksi_terbaru: transaksi,
    });
  } catch (error: unknown) {
    // VULN #9: Stack trace ke client
    const err = error as Error;
    return NextResponse.json(
      { error: 'Internal server error', message: err.message, stack: err.stack },
      { status: 500 }
    );
  }
}
