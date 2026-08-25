# 🏦 BankXYZ - Vulnerable-by-Design Banking Application

![BankXYZ Preview](https://img.shields.io/badge/Status-Development-blue?style=for-the-badge) ![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.js) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css) ![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?style=for-the-badge&logo=mysql)

**BankXYZ** adalah sebuah simulasi aplikasi perbankan digital premium yang sengaja dirancang memiliki berbagai celah keamanan (*Vulnerable-by-Design*). Proyek ini dibangun sebagai **Penetration Testing Lab** interaktif dan sarana edukasi bagi para antusias *Cybersecurity*, *Ethical Hackers*, dan *Software Engineers* untuk membedah bagaimana sebuah aplikasi modern bisa diretas dan bagaimana cara memitigasi serangan tersebut.

> ⚠️ **DISCLAIMER / PERINGATAN KERAS:** 
> Proyek ini penuh dengan kerentanan (*vulnerabilities*) kritis. **JANGAN PERNAH** melakukan *deploy* aplikasi ini di *production server* atau menggunakannya dengan data/kredensial nyata. Gunakan aplikasi ini secara eksklusif dalam lingkungan tertutup (*isolated environment/localhost*)!

---

## 🚀 Fitur Utama (*The Features*)

Aplikasi ini dibungkus dengan antarmuka UI/UX *Fintech Premium* (menggunakan *Tailwind CSS* & *Glassmorphism Modals*), sehingga memberikan nuansa realistis layaknya aplikasi *startup* perbankan sungguhan.

### Portal Nasabah (Klien)
- **Retail Banking Dashboard**: Panel untuk melihat total saldo, daftar rekening, mutasi terkini, dan membuka rekening baru (dengan penamaan kustom).
- **Fund Transfers**: Sistem transfer dana antar rekening (baik milik sendiri maupun pihak lain) dengan format nominal bertitik ribuan.
- **Profile Management**: Pengaturan profil lengkap — edit email & telepon, ganti kata sandi, unggah & hapus foto profil (*avatar*).
- **Sistem Tier/Kelas**: Nasabah memiliki kelas keanggotaan (*Reguler*, *Prioritas*, *Premium*) yang ditampilkan secara dinamis di sidebar dan halaman profil.
- **Manajemen Rekening**: Buka rekening baru, beri nama alias, lihat detail mutasi, dan tutup rekening yang tidak diperlukan.

### Panel Admin (Staf Internal)
- **Dashboard Operasi Global**: Ringkasan statistik — total klien, rekening aktif, total likuiditas, dan jumlah transaksi.
- **Manajemen Pengguna (CRUD)**: Edit data nasabah (nama, email, telepon, kelas/tier) dan hapus akun nasabah secara permanen.
- **Manajemen Rekening**: Bekukan (*freeze*), aktifkan kembali (*unfreeze*), atau tutup paksa rekening nasabah.
- **Riwayat Transaksi Global**: Tabel seluruh transaksi dari semua nasabah yang dapat dipantau secara real-time.
- **Pembersihan Massal (*Bulk Cleanup*)**: Fitur untuk mendeteksi dan menghapus akun-akun dormant (saldo habis & tidak aktif > 1 tahun) secara otomatis.
- **Ekspor Data**: Ekspor data rekening ke format CSV atau JSON untuk keperluan audit internal.
- **Pencarian Intelijen**: Cari dan telusuri data nasabah secara spesifik.

---

## 🐛 Peta Kerentanan (*The Vulnerability Landscape*)

Di balik UI yang memukau, kodenya menyembunyikan lebih dari sekadar 1-2 celah. Berikut adalah beberapa kerentanan utama yang dapat Anda temukan dan eksploitasi (berdasarkan klasifikasi **OWASP Top 10**):

1. **SQL Injection (A03: Injection)**
   - *Titik Lemah*: Formulir *Login* (Nasabah & Admin). Kueri ke basis data tidak menggunakan *Prepared Statements*.
   - *Dampak*: *Authentication Bypass*, pencurian data.
2. **Insecure Direct Object Reference / IDOR (A01: Broken Access Control)**
   - *Titik Lemah*: API Transfer Dana, API Detail Rekening, dan **API Edit Profil** (menerima `user_id` dari *request body*).
   - *Dampak*: Penyerang dapat menguras dana dari rekening yang bukan miliknya, melihat mutasi orang lain, atau **mengubah profil nasabah lain** hanya dengan mengganti parameter ID.
3. **Broken Access Control (A01)**
   - *Titik Lemah*: Seluruh API Admin (`/api/admin/*`) — tidak memvalidasi peran (*role*) pengguna.
   - *Dampak*: Nasabah biasa yang mengetahui URL endpoint admin dapat mengakses, mengedit, bahkan **menghapus akun nasabah lain** dan **membekukan rekening** tanpa otorisasi.
4. **Cross-Site Request Forgery / CSRF**
   - *Titik Lemah*: Mekanisme pengiriman uang (*Transfer*) tidak menggunakan token Anti-CSRF dan *Cookie Session* menggunakan `SameSite=Lax/None`.
   - *Dampak*: Penyerang dapat menjebak nasabah untuk mentransfer uang tanpa disadari dengan hanya mengeklik sebuah tautan.
5. **Cryptographic Failures (A02)**
   - *Titik Lemah*: Skema basis data & fitur **Ganti Password**.
   - *Dampak*: Kata sandi pengguna disimpan menggunakan MD5 **tanpa *salt***. Bahkan saat mengganti password, hash baru tetap menggunakan MD5 — rentan terhadap *Rainbow Table*.
6. **Security Misconfiguration (A05)**
   - *Titik Lemah*: Penanganan *Error* secara global di seluruh API endpoint.
   - *Dampak*: *Stack trace* Node.js dan pesan eror SQL yang mentah langsung dimunculkan ke sisi klien, memberikan cetak biru server kepada penyerang.
7. **Mass Assignment / Bulk Deletion tanpa Rate Limit**
   - *Titik Lemah*: API Pembersihan Massal (`/api/admin/cleanup`).
   - *Dampak*: Penyerang yang menemukan endpoint ini dapat menghapus **seluruh akun nasabah** sekaligus tanpa batasan frekuensi (*rate limiting*).

*(Ada beberapa kerentanan lain seperti keamanan sesi (JWT Secret lemah), kerentanan unggah berkas (Unrestricted File Upload), dan Command Injection di fitur ekspor. Temukan semuanya!)*

---

## 🛠️ Technology Stack

- **Frontend & Backend**: [Next.js 14+](https://nextjs.org/) (App Router) dengan *Server-Side Rendering* (SSR) dan *API Routes*.
- **Styling**: Vanilla CSS dikombinasikan dengan kelas utilitas dari **Tailwind CSS**.
- **Database**: **MySQL** via paket `mysql2/promise` untuk koneksi *pool* dan eksekusi kueri mentah (*raw query*).
- **Authentication**: Custom JWT (JSON Web Tokens) via *HttpOnly Cookies*.
- **UI Components**: Custom Modals (*Alert*, *Prompt*, *Confirm*) dengan animasi *glassmorphism*.

---

## 💻 Panduan Instalasi (How to Run)

### 1. Prasyarat (*Prerequisites*)
Pastikan lingkungan lokal Anda sudah terpasang:
- **Node.js** (Versi 18.x atau lebih baru)
- **MySQL Server** (XAMPP, Docker, atau instalasi lokal biasa)

### 2. Konfigurasi Basis Data (*Database Setup*)
1. Buat *database* di MySQL Anda, lalu impor skema dengan mengeksekusi berkas `db/schema.sql`. Atau, Anda bisa menjalankan perintah otomatis ini:
   ```bash
   npm run db:setup
   ```
   *(Script ini akan membuat basis data bernama `bankxyz_lab`, tabel-tabel struktural, serta menyuntikkan *seed data* dan beberapa akun *default*).*
2. **Kredensial Default**:
   - **Administrator:** `admin` / `admin123` *(masuk via `/admin/login`)*
   - **Klien (Nasabah):** `budi.santoso` / `budi123` *(masuk via `/login`)*

### 3. Konfigurasi Lingkungan (*Environment Variables*)
Ubah nama berkas `.env.example` menjadi `.env.local` di *root* proyek. Sesuaikan *port*, pengguna, dan kata sandi sesuai dengan MySQL di komputer Anda:
```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=rahasia
MYSQL_DATABASE=bankxyz_lab
JWT_SECRET=secret123
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Eksekusi (*Install & Start*)
Buka terminal favorit Anda di direktori proyek dan jalankan perintah berikut:
```bash
npm install
npm run dev
```
Setelah *server* berjalan, buka [http://localhost:3000](http://localhost:3000) di *browser* Anda untuk menjelajahi (dan meretas) BankXYZ!

---

## 📂 Struktur Proyek (*Project Structure*)

```
bankxyz/
├── app/
│   ├── api/
│   │   ├── admin/          # API Admin (users CRUD, rekening, cleanup, transaksi)
│   │   ├── dashboard/      # API Dashboard data nasabah
│   │   ├── login/          # API Login nasabah
│   │   ├── register/       # API Registrasi nasabah baru
│   │   ├── profil/         # API Edit profil & ganti password
│   │   ├── rekening/       # API CRUD rekening + ekspor
│   │   ├── transfer/       # API Transfer dana
│   │   └── upload-foto/    # API Upload foto profil
│   ├── admin/              # Halaman Admin (login + dashboard operasi)
│   ├── dashboard/          # Halaman Dashboard nasabah
│   ├── login/              # Halaman Login nasabah
│   ├── register/           # Halaman Registrasi
│   ├── profil/             # Halaman Profil (edit, password, foto)
│   ├── rekening/           # Halaman Detail rekening + mutasi
│   └── transfer/           # Halaman Transfer dana
├── components/
│   ├── Modal.tsx           # AlertModal, PromptModal, ConfirmModal
│   ├── Sidebar.tsx         # Navigasi + tier badge dinamis
│   ├── SearchNasabah.tsx   # Komponen pencarian admin
│   └── TransferForm.tsx    # Form transfer dana
├── db/
│   └── schema.sql          # Skema database + seed data
└── lib/
    ├── auth.ts             # JWT helper (token, session, cookie)
    └── db.ts               # MySQL connection pool
```

---

## 🎯 Misi Anda (*The Mission*)

1. **Reconnaissance**: Petakan semua fitur. Cobalah *login* sebagai nasabah dan admin. Pahami alur aplikasi.
2. **Exploitation**: Bertindaklah sebagai *Attacker*. Cobalah untuk mencuri uang nasabah lain tanpa *login* sebagai mereka, atau *bypass* halaman *login* admin dengan SQLi. Coba akses endpoint admin tanpa otorisasi.
3. **Mitigation**: Bertindaklah sebagai *Defender*. Tinjau kode sumber (*source code*) aplikasi dan tambal semua kerentanan yang Anda temukan (parameterized queries, validasi sesi, CSRF tokens, bcrypt hashing, dll).

*Selamat bersenang-senang dan belajar! Retaslah dengan bijak.* 🛡️
