// app/api/register/route.ts — Register Nasabah Baru
// VULN #7: Cryptographic Failure (A02) — Password disimpan sebagai MD5 tanpa salt
// VULN #9: Security Misconfiguration (A05) — Stack trace ke client

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import md5 from 'md5';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function POST(request: NextRequest) {
  try {
    const { username, password, full_name, email, phone } = await request.json();

    if (!username || !password || !full_name || !email) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi (username, password, full_name, email)' },
        { status: 400 }
      );
    }

    // Cek username sudah ada atau belum
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Username sudah digunakan' },
        { status: 409 }
      );
    }

    // VULN #7: Cryptographic Failure — password di-hash MD5 tanpa salt
    const hashedPassword = md5(password);

    // Insert user baru
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO users (username, password, full_name, email, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, full_name, email, phone || null, 'nasabah']
    );

    const userId = result.insertId;

    // Auto-generate nomor rekening (format: 1001 + 6 digit random)
    const nomorRekening = '1001' + String(Math.floor(100000 + Math.random() * 900000));

    // Buat rekening tabungan otomatis dengan saldo bonus awal (Starter Kit)
    await pool.query(
      'INSERT INTO rekening (user_id, nomor_rekening, jenis, saldo, status) VALUES (?, ?, ?, ?, ?)',
      [userId, nomorRekening, 'Tabungan Utama', 10000000, 'aktif']
    );

    return NextResponse.json(
      {
        message: 'Registrasi berhasil',
        user: { id: userId, username, full_name },
        rekening: { nomor_rekening: nomorRekening },
      },
      { status: 201 }
    );
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
