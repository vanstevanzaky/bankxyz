// lib/db.ts — Koneksi MySQL2 raw (tanpa ORM)
// Menggunakan connection pool untuk handle concurrent requests

import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'bankxyz_lab',
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
});

export default pool;
