// app/api/upload-foto/route.ts — Upload Foto Profil
// VULN #4: Unrestricted File Upload (A05) — Tidak ada validasi ekstensi/MIME type
// VULN #9: Security Misconfiguration (A05) — Stack trace ke client

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ResultSetHeader } from 'mysql2';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('foto') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'File foto wajib diupload' },
        { status: 400 }
      );
    }

    // VULN #4: Unrestricted File Upload — TIDAK ADA validasi:
    // - Tidak cek ekstensi file (.php, .jsp, .exe bisa lolos)
    // - Tidak cek MIME type
    // - Tidak cek ukuran file
    // - File langsung disimpan ke public/uploads/ (accessible via URL)
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // VULN #4: Nama file original digunakan langsung (path traversal risk)
    const filename = `${Date.now()}_${file.name}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const filepath = path.join(uploadDir, filename);

    // Pastikan folder uploads ada
    const { mkdir } = await import('fs/promises');
    await mkdir(uploadDir, { recursive: true });

    // VULN #4: File langsung ditulis tanpa validasi apapun
    await writeFile(filepath, buffer);

    // Update path foto di database
    const fotoPath = `/uploads/${filename}`;
    await pool.query<ResultSetHeader>(
      'UPDATE users SET foto_path = ? WHERE id = ?',
      [fotoPath, session.id]
    );

    return NextResponse.json({
      message: 'Foto berhasil diupload',
      foto_path: fotoPath,
      original_name: file.name,
      size: file.size,
      type: file.type,
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
