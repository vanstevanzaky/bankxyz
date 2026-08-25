-- ============================================================
-- BankXYZ Vulnerable CRUD Lab — Database Schema + Seed Data
-- ============================================================
-- PERINGATAN: Database ini SENGAJA dibuat rentan untuk latihan
-- pentest. JANGAN gunakan di production atau dengan data asli.
-- ============================================================

CREATE DATABASE IF NOT EXISTS bankxyz_lab;
USE bankxyz_lab;

-- ============================================================
-- Tabel: users (Nasabah + Admin)
-- ============================================================
-- VULN #7: Cryptographic Failure (A02) — Password disimpan sebagai MD5 tanpa salt
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL COMMENT 'VULN #7: MD5 hash tanpa salt',
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role ENUM('nasabah', 'admin') DEFAULT 'nasabah',
    tier ENUM('reguler', 'prioritas', 'premium') DEFAULT 'reguler',
    foto_path VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Tabel: rekening
-- ============================================================
CREATE TABLE IF NOT EXISTS rekening (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    nomor_rekening VARCHAR(20) NOT NULL UNIQUE,
    jenis VARCHAR(100) DEFAULT 'Tabungan Utama',
    saldo DECIMAL(15,2) DEFAULT 0.00,
    status ENUM('aktif', 'tutup') DEFAULT 'aktif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Tabel: transaksi
-- ============================================================
CREATE TABLE IF NOT EXISTS transaksi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    from_rekening_id INT NOT NULL,
    to_rekening_id INT NOT NULL,
    jumlah DECIMAL(15,2) NOT NULL,
    keterangan VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_rekening_id) REFERENCES rekening(id) ON DELETE CASCADE,
    FOREIGN KEY (to_rekening_id) REFERENCES rekening(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Seed Data: Users (Password = MD5 hash tanpa salt)
-- ============================================================
-- VULN #7: Password disimpan sebagai MD5 tanpa salt
-- admin123   -> 0192023a7bbd73250516f069df18b500
-- budi123    -> MD5('budi123')
-- siti123    -> MD5('siti123')
-- ahmad123   -> MD5('ahmad123')
-- dewi123    -> MD5('dewi123')
-- rudi123    -> MD5('rudi123')

INSERT INTO users (username, password, full_name, email, phone, role) VALUES
('admin',         MD5('admin123'),  'Administrator',     'admin@bankxyz.co.id',     '081200000000', 'admin'),
('budi.santoso',  MD5('budi123'),   'Budi Santoso',      'budi.santoso@email.com',  '081234567001', 'nasabah'),
('siti.rahayu',   MD5('siti123'),   'Siti Rahayu',       'siti.rahayu@email.com',   '081234567002', 'nasabah'),
('ahmad.hidayat', MD5('ahmad123'),  'Ahmad Hidayat',     'ahmad.hidayat@email.com', '081234567003', 'nasabah'),
('dewi.lestari',  MD5('dewi123'),   'Dewi Lestari',      'dewi.lestari@email.com',  '081234567004', 'nasabah'),
('rudi.pratama',  MD5('rudi123'),   'Rudi Pratama',      'rudi.pratama@email.com',  '081234567005', 'nasabah');

-- ============================================================
-- Seed Data: Rekening
-- ============================================================
INSERT INTO rekening (user_id, nomor_rekening, jenis, saldo, status) VALUES
(1, '1001000001', 'giro',     100000000.00, 'aktif'),
(2, '1001000002', 'tabungan',  15500000.00, 'aktif'),
(3, '1001000003', 'tabungan',   8250000.00, 'aktif'),
(4, '1001000004', 'tabungan',  22000000.00, 'aktif'),
(5, '1001000005', 'tabungan',   5750000.00, 'aktif'),
(6, '1001000006', 'giro',      31000000.00, 'aktif');

-- ============================================================
-- Seed Data: Transaksi (contoh riwayat)
-- ============================================================
INSERT INTO transaksi (from_rekening_id, to_rekening_id, jumlah, keterangan) VALUES
(2, 3, 500000.00,  'Transfer ke Siti - uang makan'),
(4, 2, 1000000.00, 'Transfer ke Budi - bayar hutang'),
(6, 5, 250000.00,  'Transfer ke Dewi - patungan'),
(3, 4, 750000.00,  'Transfer ke Ahmad - beli pulsa'),
(1, 2, 5000000.00, 'Bonus dari admin');
