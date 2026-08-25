// app/api/profil/route.ts — Update Profil Nasabah
// VULN #3: IDOR (A01) — Menerima user_id dari body, bukan dari session
// VULN #9: Security Misconfiguration (A05) — Stack trace ke client

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ResultSetHeader } from 'mysql2';

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_id, email, phone } = await request.json();

    // VULN #3: IDOR — Menggunakan user_id dari request body, BUKAN dari session
    // Seharusnya: const targetId = session.id;
    // Attacker bisa mengirim user_id orang lain untuk mengubah profil mereka
    const targetId = user_id || session.id;

    if (!email && !phone) {
      return NextResponse.json(
        { error: 'Minimal satu field (email atau phone) harus diisi' },
        { status: 400 }
      );
    }

    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (email) {
      updates.push('email = ?');
      values.push(email);
    }
    if (phone) {
      updates.push('phone = ?');
      values.push(phone);
    }

    values.push(targetId);

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Profil berhasil diperbarui' });
  } catch (error: unknown) {
    // VULN #9: Stack trace ke client
    const err = error as Error;
    return NextResponse.json(
      { error: 'Internal server error', message: err.message, stack: err.stack },
      { status: 500 }
    );
  }
}

// DELETE — Hapus foto profil
export async function DELETE() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await pool.query<ResultSetHeader>(
      'UPDATE users SET foto_path = NULL WHERE id = ?',
      [session.id]
    );

    return NextResponse.json({ message: 'Foto profil berhasil dihapus' });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: 'Internal server error', message: err.message, stack: err.stack },
      { status: 500 }
    );
  }
}
