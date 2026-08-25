# 🏦 BankXYZ - Vulnerable-by-Design Banking Application

![BankXYZ Preview](https://img.shields.io/badge/Status-Development-blue?style=for-the-badge) ![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.js) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css) ![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?style=for-the-badge&logo=mysql)

**BankXYZ** adalah sebuah simulasi aplikasi perbankan digital premium yang sengaja dirancang memiliki berbagai celah keamanan (*Vulnerable-by-Design*). Proyek ini dibangun sebagai **Penetration Testing Lab** interaktif dan sarana edukasi bagi para antusias *Cybersecurity*, *Ethical Hackers*, dan *Software Engineers* untuk membedah bagaimana sebuah aplikasi modern bisa diretas dan bagaimana cara memitigasi serangan tersebut.

> ⚠️ **DISCLAIMER / PERINGATAN KERAS:** 
> Proyek ini penuh dengan kerentanan (*vulnerabilities*) kritis. **JANGAN PERNAH** melakukan *deploy* aplikasi ini di *production server* atau menggunakannya dengan data/kredensial nyata. Gunakan aplikasi ini secara eksklusif dalam lingkungan tertutup (*isolated environment/localhost*)!

---

## 🚀 Fitur Utama (*The Features*)

Aplikasi ini dibungkus dengan antarmuka UI/UX *Fintech Premium* (menggunakan *Tailwind CSS* & *Glassmorphism Modals*), sehingga memberikan nuansa realistis layaknya aplikasi *startup* perbankan sungguhan. Fitur fungsionalnya meliputi:
- **Retail Banking Dashboard**: Panel bagi nasabah untuk melihat total saldo, mutasi rekening, dan membuka rekening baru.
- **Fund Transfers**: Sistem transfer dana antar rekening (baik milik sendiri maupun pihak lain).
- **Profile Management**: Pengaturan profil nasabah dengan fitur unggah foto profil (*avatar*).
- **Admin Console**: Panel khusus (*Role-based*) bagi administrator untuk melihat total nasabah, dana mengendap, hingga rekapitulasi data.

---

## 🐛 Peta Kerentanan (*The Vulnerability Landscape*)

Di balik UI yang memukau, kodenya menyembunyikan lebih dari sekadar 1-2 celah. Berikut adalah beberapa kerentanan utama yang dapat Anda temukan dan eksploitasi (berdasarkan klasifikasi **OWASP Top 10**):

1. **SQL Injection (A03: Injection)**
   - *Titik Lemah*: Formulir *Login* (Nasabah & Admin). Kueri ke basis data tidak menggunakan *Prepared Statements*.
   - *Dampak*: *Authentication Bypass*, pencurian data.
2. **Insecure Direct Object Reference / IDOR (A01: Broken Access Control)**
   - *Titik Lemah*: API Transfer Dana dan API Detail Rekening.
   - *Dampak*: Penyerang dapat menguras dana dari rekening yang bukan miliknya atau melihat mutasi rekening orang lain dengan sekadar menebak ID/Nomor Rekening.
3. **Broken Access Control (A01)**
   - *Titik Lemah*: Portal publik dan pembagian (*separation*) peran *User* vs *Admin*.
   - *Dampak*: Staf internal (*Admin*) dapat mencoba *login* ke portal nasabah yang memicu *Information Disclosure* / *Username Enumeration*.
4. **Cross-Site Request Forgery / CSRF**
   - *Titik Lemah*: Mekanisme pengiriman uang (*Transfer*) tidak menggunakan token Anti-CSRF dan *Cookie Session* menggunakan `SameSite=Lax/None`.
   - *Dampak*: Penyerang dapat menjebak nasabah untuk mentransfer uang tanpa disadari dengan hanya mengeklik sebuah tautan.
5. **Cryptographic Failures (A02)**
   - *Titik Lemah*: Skema basis data.
   - *Dampak*: Kata sandi (*Password*) pengguna di basis data disimpan menggunakan metode *hashing* yang sangat usang (MD5) **tanpa *salt***, membuatnya rentan terhadap serangan *Rainbow Table*.
6. **Security Misconfiguration (A05)**
   - *Titik Lemah*: Penanganan *Error* secara global di API.
   - *Dampak*: *Stack trace* dari Node.js dan pesan eror SQL yang mentah akan langsung dimunculkan (*exposed*) ke sisi klien, memberikan cetak biru (*blueprint*) server kepada penyerang.

*(Ada beberapa kerentanan lain seperti keamanan sesi (JWT) yang lemah dan kerentanan unggah berkas (File Upload). Temukan semuanya!)*

---

## 🛠️ Technology Stack

- **Frontend & Backend**: [Next.js 14+](https://nextjs.org/) (App Router) dengan *Server-Side Rendering* (SSR) dan *API Routes*.
- **Styling**: Vanilla CSS dikombinasikan dengan kelas utilitas dari **Tailwind CSS**.
- **Database**: **MySQL** via paket `mysql2/promise` untuk koneksi *pool* dan eksekusi kueri mentah (*raw query*).
- **Authentication**: Custom JWT (JSON Web Tokens) via *HttpOnly Cookies*.

---

## 💻 Panduan Instalasi (How to Run)

### 1. Prasyarat (*Prerequisites*)
Pastikan lingkungan lokal Anda sudah terpasang:
- **Node.js** (Versi 18.x atau lebih baru)
- **MySQL Server** (XAMPP, Docker, atau instalasi lokal biasa)

### 2. Konfigurasi Basis Data (*Database Setup*)
1. Buat *database* di MySQL Anda, lalu impor skema dengan mengeksekusi berkas `db/schema.sql`.
   *(Berkas ini akan membuat basis data bernama `bankxyz_lab`, tabel-tabel struktural, serta menyuntikkan *seed data* dan beberapa akun *default*).*
2. **Kredensial Default**:
   - **Administrator:** `admin` / `admin123`
   - **Klien (Nasabah):** `budi.santoso` / `budi123`

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

## 🎯 Misi Anda (*The Mission*)

1. **Reconnaissance**: Petakan semua fitur. Cobalah *login* sebagai nasabah dan admin. Pahami alur aplikasi.
2. **Exploitation**: Bertindaklah sebagai *Attacker*. Cobalah untuk mencuri uang nasabah lain tanpa *login* sebagai mereka, atau *bypass* halaman *login* admin dengan SQLi.
3. **Mitigation**: Bertindaklah sebagai *Defender*. Tinjau kode sumber (*source code*) aplikasi dan tambal semua kerentanan yang Anda temukan (menggunakan parameter kueri, memvalidasi sesi, menambahkan token CSRF, dll).

*Selamat bersenang-senang dan belajar! Retaslah dengan bijak.* 🛡️
