// app/api/admin/users/route.ts — Admin: Lihat Semua Nasabah & Rekening
// VULN #5: Broken Access Control (A01) — Tidak ada middleware cek role admin
// VULN #9: Security Misconfiguration (A05) — Stack trace ke client

import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// VULN #5: Broken Access Control — TIDAK ADA pengecekan role admin
// Endpoint ini hanya "disembunyikan" di UI (menu admin tidak muncul untuk nasabah biasa)
// Tapi siapapun yang tahu URL-nya bisa akses langsung
export async function GET() {
  try {
    // VULN #5: Tidak ada pengecekan session atau role
    // Seharusnya: cek session, lalu cek session.role === 'admin'

    // Ambil semua users
    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT id, username, full_name, email, phone, role, tier, foto_path, created_at FROM users ORDER BY id'
    );

    // Ambil semua rekening dengan info pemilik
    const [rekening] = await pool.query<RowDataPacket[]>(
      `SELECT r.*, u.full_name, u.username 
       FROM rekening r 
       JOIN users u ON r.user_id = u.id 
       ORDER BY r.id`
    );

    // Ambil statistik
    const [stats] = await pool.query<RowDataPacket[]>(
      `SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'nasabah') as total_nasabah,
        (SELECT COUNT(*) FROM rekening WHERE status = 'aktif') as total_rekening_aktif,
        (SELECT SUM(saldo) FROM rekening WHERE status = 'aktif') as total_saldo,
        (SELECT COUNT(*) FROM transaksi) as total_transaksi`
    );

    return NextResponse.json({
      users,
      rekening,
      stats: stats[0],
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
