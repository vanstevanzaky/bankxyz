// app/api/admin/rekening/[id]/route.ts — Admin: Freeze/Tutup Rekening
// VULN #5: Broken Access Control (A01) — Tidak ada pengecekan role admin

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

// PUT — Toggle status rekening (aktif <-> tutup / freeze/unfreeze)
// VULN #5: Tidak ada cek session/role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    if (!status || !['aktif', 'tutup'].includes(status)) {
      return NextResponse.json(
        { error: 'Status harus "aktif" atau "tutup"' },
        { status: 400 }
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE rekening SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Rekening tidak ditemukan' }, { status: 404 });
    }

    const action = status === 'tutup' ? 'dibekukan' : 'diaktifkan kembali';
    return NextResponse.json({ message: `Rekening berhasil ${action}` });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: 'Internal server error', message: err.message, stack: err.stack },
      { status: 500 }
    );
  }
}

// DELETE — Tutup paksa rekening (even if saldo > 0)
// VULN #5: Tidak ada cek session/role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Tutup paksa — set saldo ke 0 dan status ke tutup
    const [result] = await pool.query<ResultSetHeader>(
      "UPDATE rekening SET status = 'tutup', saldo = 0 WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Rekening tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Rekening ditutup paksa. Saldo dihanguskan.' });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: 'Internal server error', message: err.message, stack: err.stack },
      { status: 500 }
    );
  }
}
