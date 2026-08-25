import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: user_id } = session;
    const nomor_rekening = '1001' + Math.floor(10000000 + Math.random() * 90000000).toString(); 
    
    let jenis = 'Tabungan Utama';
    try {
      const body = await request.json();
      if (body && body.nama_rekening) {
        jenis = body.nama_rekening;
      }
    } catch (e) {
      // Body might be empty
    }

    const connection = await pool.getConnection();
    try {
      // Cek apakah user sudah memiliki rekening dengan nama ini
      const [existing] = await connection.query<RowDataPacket[]>(
        'SELECT id FROM rekening WHERE user_id = ? AND jenis = ? AND status = "aktif"',
        [user_id, jenis]
      );

      if (existing.length > 0) {
        return NextResponse.json({ error: `Rekening dengan nama '${jenis}' sudah ada.` }, { status: 400 });
      }

      await connection.query<ResultSetHeader>(
        'INSERT INTO rekening (user_id, nomor_rekening, jenis, saldo, status) VALUES (?, ?, ?, ?, ?)',
        [user_id, nomor_rekening, jenis, 0, 'aktif']
      );

      return NextResponse.json({ message: 'Rekening berhasil dibuat', nomor_rekening });
    } finally {
      connection.release();
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
