// app/api/transfer/route.ts — Transfer Antar Rekening
// VULN #6: CSRF (A01) — Tidak ada CSRF token
// VULN #9: Security Misconfiguration (A05) — Stack trace ke client

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { from_rekening_id, to_rekening_nomor, jumlah, keterangan } = await request.json();

    // VULN #6: CSRF — Tidak ada CSRF token verification
    // Karena cookie SameSite=None, request dari domain lain akan tetap mengirim cookie
    // Attacker bisa buat form di website lain yang POST ke endpoint ini

    if (!from_rekening_id || !to_rekening_nomor || !jumlah) {
      return NextResponse.json(
        { error: 'from_rekening_id, to_rekening_nomor, dan jumlah wajib diisi' },
        { status: 400 }
      );
    }

    if (jumlah <= 0) {
      return NextResponse.json(
        { error: 'Jumlah transfer harus lebih dari 0' },
        { status: 400 }
      );
    }

    // Cek rekening pengirim
    const [fromRows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM rekening WHERE id = ? AND status = ?',
      [from_rekening_id, 'aktif']
    );

    if (fromRows.length === 0) {
      return NextResponse.json(
        { error: 'Rekening pengirim tidak ditemukan atau tidak aktif' },
        { status: 404 }
      );
    }

    const fromRekening = fromRows[0];

    // Cek saldo cukup
    if (fromRekening.saldo < jumlah) {
      return NextResponse.json(
        { error: 'Saldo tidak mencukupi', saldo_tersedia: fromRekening.saldo },
        { status: 400 }
      );
    }

    // Cek rekening tujuan
    const [toRows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM rekening WHERE nomor_rekening = ? AND status = ?',
      [to_rekening_nomor, 'aktif']
    );

    if (toRows.length === 0) {
      return NextResponse.json(
        { error: 'Rekening tujuan tidak ditemukan atau tidak aktif' },
        { status: 404 }
      );
    }

    const toRekening = toRows[0];

    if (fromRekening.id === toRekening.id) {
      return NextResponse.json(
        { error: 'Tidak bisa transfer ke rekening sendiri' },
        { status: 400 }
      );
    }

    // Proses transfer (kurangi pengirim, tambah penerima)
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query<ResultSetHeader>(
        'UPDATE rekening SET saldo = saldo - ? WHERE id = ?',
        [jumlah, fromRekening.id]
      );

      await connection.query<ResultSetHeader>(
        'UPDATE rekening SET saldo = saldo + ? WHERE id = ?',
        [jumlah, toRekening.id]
      );

      // Catat transaksi
      await connection.query<ResultSetHeader>(
        'INSERT INTO transaksi (from_rekening_id, to_rekening_id, jumlah, keterangan) VALUES (?, ?, ?, ?)',
        [fromRekening.id, toRekening.id, jumlah, keterangan || 'Transfer']
      );

      await connection.commit();

      return NextResponse.json({
        message: 'Transfer berhasil',
        detail: {
          dari: fromRekening.nomor_rekening,
          ke: toRekening.nomor_rekening,
          jumlah,
          keterangan: keterangan || 'Transfer',
        },
      });
    } catch (txError) {
      await connection.rollback();
      throw txError;
    } finally {
      connection.release();
    }
  } catch (error: unknown) {
    // VULN #9: Stack trace ke client
    const err = error as Error;
    return NextResponse.json(
      { error: 'Internal server error', message: err.message, stack: err.stack },
      { status: 500 }
    );
  }
}
