// db/setup.js — Script otomatis untuk membuat database BankXYZ
// Jalankan: node db/setup.js
// Script ini membaca schema.sql dan mengeksekusinya ke MySQL

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Baca .env.local jika ada
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    });
  }
}

async function setup() {
  loadEnv();

  const host = process.env.MYSQL_HOST || 'localhost';
  const port = parseInt(process.env.MYSQL_PORT || '3306');
  const user = process.env.MYSQL_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || '';

  console.log('');
  console.log('  🏦 BankXYZ — Database Setup');
  console.log('  ═══════════════════════════════════════');
  console.log(`  Host     : ${host}:${port}`);
  console.log(`  User     : ${user}`);
  console.log('  ───────────────────────────────────────');
  console.log('');

  // Koneksi tanpa database (agar bisa CREATE DATABASE)
  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true, // Penting: agar bisa eksekusi banyak statement sekaligus
    });
    console.log('  ✅ Koneksi ke MySQL berhasil');
  } catch (err) {
    console.error('  ❌ Gagal terhubung ke MySQL:', err.message);
    console.error('');
    console.error('  Pastikan:');
    console.error('  1. MySQL server sedang berjalan (XAMPP/Docker/Service)');
    console.error('  2. Kredensial di .env.local sudah benar');
    process.exit(1);
  }

  // Baca schema.sql
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error('  ❌ File db/schema.sql tidak ditemukan!');
    await connection.end();
    process.exit(1);
  }

  const schema = fs.readFileSync(schemaPath, 'utf-8');
  console.log('  ✅ File schema.sql berhasil dibaca');
  console.log('');

  try {
    // Eksekusi seluruh schema (CREATE DATABASE, CREATE TABLE, INSERT)
    await connection.query(schema);
    console.log('  ✅ Database "bankxyz_lab" berhasil dibuat');
    console.log('  ✅ Tabel users, rekening, transaksi berhasil dibuat');
    console.log('  ✅ Seed data (6 akun + 6 rekening + 5 transaksi) berhasil dimasukkan');
    console.log('');
    console.log('  ═══════════════════════════════════════');
    console.log('  🎉 Setup selesai! Kredensial default:');
    console.log('  ───────────────────────────────────────');
    console.log('  Admin    : admin / admin123');
    console.log('  Nasabah  : budi.santoso / budi123');
    console.log('  ═══════════════════════════════════════');
    console.log('');
    console.log('  Jalankan aplikasi: npm run dev');
    console.log('');
  } catch (err) {
    if (err.code === 'ER_DB_CREATE_EXISTS' || err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === 'ER_DUP_ENTRY') {
      console.log('  ⚠️  Database/tabel sudah ada. Jika ingin reset:');
      console.log('     DROP DATABASE bankxyz_lab;');
      console.log('     Lalu jalankan ulang: node db/setup.js');
      console.log('');
    } else {
      console.error('  ❌ Gagal mengeksekusi schema:', err.message);
    }
  } finally {
    await connection.end();
  }
}

setup();
