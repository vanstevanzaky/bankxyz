// app/api/profil/password/route.ts — Ganti Password
// VULN #7: Cryptographic Failure (A02) — Tetap pakai MD5 tanpa salt
// VULN #9: Security Misconfiguration (A05) — Stack trace ke client

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import md5 from 'md5';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { password_lama, password_baru } = await request.json();

    if (!password_lama || !password_baru) {
      return NextResponse.json(
        { error: 'Password lama dan password baru wajib diisi' },
        { status: 400 }
      );
    }

    if (password_baru.length < 4) {
      return NextResponse.json(
        { error: 'Password baru minimal 4 karakter' },
        { status: 400 }
      );
    }

    // Verifikasi password lama
    // VULN #7: MD5 tanpa salt
    const hashedOld = md5(password_lama);
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE id = ? AND password = ?',
      [session.id, hashedOld]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Password lama tidak cocok' },
        { status: 403 }
      );
    }

    // VULN #7: Password baru juga disimpan sebagai MD5 tanpa salt
    const hashedNew = md5(password_baru);
    await pool.query<ResultSetHeader>(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedNew, session.id]
    );

    return NextResponse.json({ message: 'Password berhasil diubah' });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: 'Internal server error', message: err.message, stack: err.stack },
      { status: 500 }
    );
  }
}
