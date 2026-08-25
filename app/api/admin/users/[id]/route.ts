// app/api/admin/users/[id]/route.ts — Admin: CRUD User Individual
// VULN #5: Broken Access Control (A01) — Tidak ada pengecekan role admin
// VULN #9: Security Misconfiguration (A05) — Stack trace ke client

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET — Detail lengkap satu nasabah
// VULN #5: Tidak ada cek role admin
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT id, username, full_name, email, phone, role, tier, foto_path, created_at FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    // Ambil semua rekening milik user ini
    const [rekening] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM rekening WHERE user_id = ? ORDER BY id',
      [id]
    );

    // Ambil transaksi terkait user ini
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
        LIMIT 50`,
        [...rekeningIds, ...rekeningIds]
      );
      transaksi = rows;
    }

    return NextResponse.json({
      user: users[0],
      rekening,
      transaksi,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: 'Internal server error', message: err.message, stack: err.stack },
      { status: 500 }
    );
  }
}

// PUT — Edit data nasabah (nama, email, phone, role, tier)
// VULN #5: Tidak ada cek role admin — siapapun yang tahu endpoint bisa mengubah data
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { full_name, email, phone, role, tier } = body;

    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (full_name) { updates.push('full_name = ?'); values.push(full_name); }
    if (email) { updates.push('email = ?'); values.push(email); }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
    if (role) { updates.push('role = ?'); values.push(role); }
    if (tier) { updates.push('tier = ?'); values.push(tier); }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Tidak ada data untuk diperbarui' }, { status: 400 });
    }

    values.push(id);

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Data pengguna berhasil diperbarui' });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: 'Internal server error', message: err.message, stack: err.stack },
      { status: 500 }
    );
  }
}

// DELETE — Hapus akun nasabah secara permanen (CASCADE ke rekening & transaksi)
// VULN #5: Tidak ada cek role admin
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Cegah admin menghapus dirinya sendiri
    const [check] = await pool.query<RowDataPacket[]>(
      'SELECT role FROM users WHERE id = ?',
      [id]
    );

    if (check.length === 0) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    if (check[0].role === 'admin') {
      return NextResponse.json({ error: 'Tidak dapat menghapus akun Administrator' }, { status: 403 });
    }

    // Hapus user (ON DELETE CASCADE akan menghapus rekening & transaksi terkait)
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM users WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Akun pengguna berhasil dihapus secara permanen' });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: 'Internal server error', message: err.message, stack: err.stack },
      { status: 500 }
    );
  }
}
