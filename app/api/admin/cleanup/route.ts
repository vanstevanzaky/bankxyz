// app/api/admin/cleanup/route.ts — Pembersihan Massal Akun Tidak Aktif
// VULN #5: Broken Access Control — Tidak ada cek role admin
// Fitur berbahaya tanpa rate-limit: bisa dieksploitasi untuk mass deletion

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// POST — Cari & hapus akun dormant
// VULN #5: Siapapun yang tahu endpoint bisa menghapus akun massal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const hari_tidak_aktif = body.hari_tidak_aktif || 365;

    // Cari nasabah yang:
    // 1. Semua rekeningnya berstatus 'tutup' ATAU total saldo = 0
    // 2. Tidak memiliki transaksi dalam X hari terakhir
    // 3. Bukan admin
    const [dormant] = await pool.query<RowDataPacket[]>(
      `SELECT u.id, u.username, u.full_name, u.email, u.created_at,
        COALESCE(SUM(r.saldo), 0) as total_saldo,
        COUNT(CASE WHEN r.status = 'aktif' THEN 1 END) as rek_aktif,
        (SELECT MAX(t.created_at) FROM transaksi t 
         JOIN rekening rk ON (t.from_rekening_id = rk.id OR t.to_rekening_id = rk.id) 
         WHERE rk.user_id = u.id) as last_transaction
      FROM users u
      LEFT JOIN rekening r ON r.user_id = u.id
      WHERE u.role = 'nasabah'
      GROUP BY u.id
      HAVING (rek_aktif = 0 OR total_saldo = 0)
        AND (last_transaction IS NULL OR last_transaction < DATE_SUB(NOW(), INTERVAL ? DAY))`,
      [hari_tidak_aktif]
    );

    if (body.preview) {
      // Mode preview — hanya tampilkan daftar tanpa menghapus
      return NextResponse.json({
        message: `Ditemukan ${dormant.length} akun dormant`,
        preview: true,
        accounts: dormant,
      });
    }

    // Mode eksekusi — hapus semua akun dormant
    if (dormant.length === 0) {
      return NextResponse.json({ message: 'Tidak ada akun dormant yang ditemukan', deleted: 0 });
    }

    const ids = dormant.map((d: RowDataPacket) => d.id);
    const placeholders = ids.map(() => '?').join(',');

    const [result] = await pool.query<ResultSetHeader>(
      `DELETE FROM users WHERE id IN (${placeholders})`,
      ids
    );

    return NextResponse.json({
      message: `${result.affectedRows} akun dormant berhasil dihapus`,
      deleted: result.affectedRows,
      accounts: dormant,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: 'Internal server error', message: err.message, stack: err.stack },
      { status: 500 }
    );
  }
}
