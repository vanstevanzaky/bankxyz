// app/api/rekening/export/route.ts — Export Data Rekening
// VULN #8: Command Injection (A08) — Parameter format masuk langsung ke exec()
// VULN #9: Security Misconfiguration (A05) — Stack trace ke client

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { exec } from 'child_process';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';

    // Ambil data rekening
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT r.id, r.nomor_rekening, r.jenis, r.saldo, r.status, r.created_at, 
              u.full_name, u.username 
       FROM rekening r 
       JOIN users u ON r.user_id = u.id 
       ORDER BY r.id`
    );

    // Format data sebagai CSV string
    const header = 'ID,Nomor Rekening,Pemilik,Username,Jenis,Saldo,Status,Tanggal Buka';
    const csvRows = rows.map(
      (r) =>
        `${r.id},${r.nomor_rekening},${r.full_name},${r.username},${r.jenis},${r.saldo},${r.status},${r.created_at}`
    );
    const csvData = [header, ...csvRows].join('\n');

    // VULN #8: Command Injection — parameter 'format' dimasukkan langsung ke exec()
    // Contoh exploit: ?format=csv;whoami atau ?format=csv|cat /etc/passwd
    // Seharusnya: whitelist format yang diizinkan (csv, json, xml) tanpa exec
    return new Promise<NextResponse>((resolve) => {
      // VULN #8: Command Injection — langsung masuk ke shell command
      const command = `echo "${csvData}" | head -n 100 && echo "Format: ${format}"`;
      
      exec(command, { timeout: 5000 }, (error, stdout, stderr) => {
        if (error) {
          // VULN #9: Error detail ke client
          resolve(
            NextResponse.json(
              {
                error: 'Export gagal',
                message: error.message,
                stack: error.stack,
                stderr,
              },
              { status: 500 }
            )
          );
          return;
        }

        if (format === 'json') {
          resolve(
            NextResponse.json({
              data: rows,
              count: rows.length,
              format: 'json',
            })
          );
        } else {
          // Default: return sebagai CSV
          resolve(
            new NextResponse(csvData, {
              status: 200,
              headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': 'attachment; filename="rekening_export.csv"',
              },
            })
          );
        }
      });
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
