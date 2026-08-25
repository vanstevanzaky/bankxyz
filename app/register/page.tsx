"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    full_name: "",
    email: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("Profil klien berhasil dibuat. Menunggu pengalihan...");
        setTimeout(() => router.push("/login?registered=true"), 2500);
      } else {
        setError(data.error || "Pendaftaran gagal. Silakan periksa detail Anda.");
      }
    } catch {
      setError("Kesalahan koneksi jaringan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 py-12 bg-[#F8F9FA]">
      <div className="w-full max-w-[540px] animate-fade-in flex flex-col">
        
        {/* Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-700 rounded-xl mb-6 shadow-md shadow-blue-700/20">
            <span className="font-serif text-2xl font-bold text-white">B</span>
          </div>
          <h1 className="text-3xl font-serif text-slate-900 mb-2">
            Aplikasi Klien
          </h1>
          <p className="text-slate-500 text-sm font-sans">
            Buka rekening digital aman Anda dalam hitungan menit.
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 sm:p-10 mb-8">
          
          {error && (
            <div className="mb-6 p-4 text-sm text-rose-800 border border-rose-200 bg-rose-50 rounded-lg flex items-start gap-3 animate-fade-in">
              <span className="font-medium">{error}</span>
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 text-sm text-emerald-800 border border-emerald-200 bg-emerald-50 rounded-lg flex items-start gap-3 animate-fade-in">
              <span className="font-medium">{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="full_name" className="input-label">Nama Sesuai Identitas</label>
              <input
                id="full_name"
                type="text"
                className="input-field"
                placeholder="Sesuai KTP / Paspor"
                value={formData.full_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="username" className="input-label">Username</label>
                <input
                  id="username"
                  type="text"
                  className="input-field font-mono"
                  placeholder="Min. 6 karakter"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="phone" className="input-label">Nomor Kontak</label>
                <input
                  id="phone"
                  type="tel"
                  className="input-field font-mono"
                  placeholder="Format internasional"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="input-label">Email Utama</label>
              <input
                id="email"
                type="email"
                className="input-field"
                placeholder="Untuk korespondensi resmi"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="input-label">Kata Sandi</label>
              <input
                id="password"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="pt-4">
              <button type="submit" className="btn-primary w-full shadow-md shadow-blue-700/20" disabled={loading || !!success}>
                {loading ? "Memproses..." : "Kirim Aplikasi"}
              </button>
            </div>
          </form>
        </div>
        
        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-slate-500 font-sans">
            Sudah Menjadi Klien?{" "}
            <Link href="/login" className="font-semibold text-blue-700 hover:text-blue-800 transition-colors">
              Masuk
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
