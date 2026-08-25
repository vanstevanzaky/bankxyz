// app/api/nasabah/search/route.ts — Search Nasabah
// VULN #2: Reflected XSS (A03) — Search query dikembalikan mentah tanpa sanitasi
// VULN #9: Security Misconfiguration (A05) — Stack trace ke client

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';

    if (!q) {
      return NextResponse.json(
        { error: 'Parameter pencarian (q) wajib diisi', results: [], query: '' },
        { status: 400 }
      );
    }

    // Query search (ini aman pakai prepared statement, XSS-nya di rendering frontend)
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, username, full_name, email, phone, role, created_at FROM users WHERE full_name LIKE ? OR username LIKE ? OR email LIKE ?',
      [`%${q}%`, `%${q}%`, `%${q}%`]
    );

    // VULN #2: Reflected XSS — query dikembalikan mentah tanpa sanitasi
    // Frontend akan render ini dengan dangerouslySetInnerHTML
    return NextResponse.json({
      query: q, // VULN #2: input user dikembalikan mentah
      results: rows,
      count: rows.length,
      message: `Ditemukan ${rows.length} hasil untuk pencarian: ${q}`, // VULN #2: XSS di message
    });
  } catch (error: unknown) {
    // VULN #9: Security Misconfiguration — stack trace ke client
    const err = error as Error;
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: err.message,
        stack: err.stack,
      },
      { status: 500 }
    );
  }
}
