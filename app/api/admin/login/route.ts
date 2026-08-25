// app/api/admin/login/route.ts
// VULN #1: SQL Injection (A03) di Portal Admin

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { createToken, getSessionCookieOptions } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password wajib diisi' }, { status: 400 });
    }

    // VULN #1: SQL Injection — string concatenation di admin portal
    // Exploit: username = admin' OR '1'='1' -- 
    const query = `SELECT * FROM users WHERE username = '${username}' AND password = MD5('${password}')`;
    const [rows] = await pool.query<RowDataPacket[]>(query);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Kredensial tidak valid' }, { status: 401 });
    }

    const user = rows[0];

    // Walaupun admin portal, jika user berhasil login via SQLi tapi rolenya bukan admin,
    // dia tetap bisa dapat token. Tapi kita restrict bahwa portal ini khusus admin.
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak. Anda bukan Administrator.' }, { status: 403 });
    }

    const token = createToken({
      id: user.id,
      username: user.username,
      role: user.role,
      full_name: user.full_name,
    });

    const cookieOptions = getSessionCookieOptions();
    const response = NextResponse.json({
      message: 'Admin login berhasil',
      user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role },
    });

    response.cookies.set(cookieOptions.name, token, {
      httpOnly: cookieOptions.httpOnly,
      sameSite: cookieOptions.sameSite,
      secure: cookieOptions.secure,
      path: cookieOptions.path,
      maxAge: cookieOptions.maxAge,
    });

    return response;
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: err.message,
        stack: err.stack,
        sql_error: (error as Record<string, unknown>).sql || null,
      },
      { status: 500 }
    );
  }
}
