// app/api/login/route.ts — Login API
// VULN #1: SQL Injection (A03) — Query pakai string concatenation
// VULN #9: Security Misconfiguration (A05) — Stack trace ke client
// VULN #7: Cryptographic Failure (A02) — Password MD5 tanpa salt

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { createToken, getSessionCookieOptions } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username dan password wajib diisi' },
        { status: 400 }
      );
    }

    // VULN #1: SQL Injection — string concatenation, BUKAN prepared statement
    // Contoh exploit: username = admin' OR '1'='1' -- 
    // Contoh exploit: username = admin' UNION SELECT 1,2,3,4,5,6,7,8,9 --
    const query = `SELECT * FROM users WHERE username = '${username}' AND password = MD5('${password}')`;
    
    const [rows] = await pool.query<RowDataPacket[]>(query);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Username atau password salah' },
        { status: 401 }
      );
    }

    const user = rows[0];

    // Mencegah Staf Admin login melalui portal publik nasabah
    if (user.role === 'admin') {
      return NextResponse.json(
        { error: 'Akses ditolak' },
        { status: 403 }
      );
    }

    const token = createToken({
      id: user.id,
      username: user.username,
      role: user.role,
      full_name: user.full_name,
    });

    const cookieOptions = getSessionCookieOptions();
    const response = NextResponse.json({
      message: 'Login berhasil',
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
      },
    });

    // VULN #6: Cookie SameSite=None — rentan CSRF
    response.cookies.set(cookieOptions.name, token, {
      httpOnly: cookieOptions.httpOnly,
      sameSite: cookieOptions.sameSite,
      secure: cookieOptions.secure,
      path: cookieOptions.path,
      maxAge: cookieOptions.maxAge,
    });

    return response;
  } catch (error: unknown) {
    // VULN #9: Security Misconfiguration — stack trace & error SQL mentah ke client
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
