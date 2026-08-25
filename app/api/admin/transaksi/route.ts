// app/api/admin/transaksi/route.ts — Admin: Lihat Semua Transaksi Global
// VULN #5: Broken Access Control — Tidak ada cek role admin

import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// VULN #5: Siapapun yang tahu URL bisa melihat semua transaksi
export async function GET() {
  try {
    const [transaksi] = await pool.query<RowDataPacket[]>(
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
      ORDER BY t.created_at DESC
      LIMIT 100`
    );

    return NextResponse.json({ transaksi });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: 'Internal server error', message: err.message, stack: err.stack },
      { status: 500 }
    );
  }
}
