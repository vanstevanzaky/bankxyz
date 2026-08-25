// app/api/rekening/[id]/route.ts — CRUD Rekening
// VULN #3: IDOR (A01) — Tidak ada pengecekan session.userId === rekening.user_id
// VULN #9: Security Misconfiguration (A05) — Stack trace ke client

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET — Lihat detail rekening (VULN #3: IDOR)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // VULN #3: IDOR — Tidak ada pengecekan apakah rekening ini milik user yang login
    // Seharusnya: WHERE id = ? AND user_id = ?
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT r.*, u.full_name, u.username FROM rekening r JOIN users u ON r.user_id = u.id WHERE r.id = ?',
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Rekening tidak ditemukan' }, { status: 404 });
    }

    // Ambil riwayat transaksi untuk rekening ini
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
      WHERE t.from_rekening_id = ? OR t.to_rekening_id = ?
      ORDER BY t.created_at DESC
      LIMIT 50`,
      [id, id]
    );

    return NextResponse.json({
      rekening: rows[0],
      transaksi,
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

// PUT — Update rekening
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { jenis } = await request.json();

    // VULN #3: IDOR — Tidak ada pengecekan kepemilikan
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE rekening SET jenis = ? WHERE id = ?',
      [jenis, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Rekening tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Rekening berhasil diupdate' });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: 'Internal server error', message: err.message, stack: err.stack },
      { status: 500 }
    );
  }
}

// DELETE — Tutup rekening
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // VULN #3: IDOR — Tidak ada pengecekan kepemilikan
    const [result] = await pool.query<ResultSetHeader>(
      "UPDATE rekening SET status = 'tutup' WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Rekening tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Rekening berhasil ditutup' });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: 'Internal server error', message: err.message, stack: err.stack },
      { status: 500 }
    );
  }
}
