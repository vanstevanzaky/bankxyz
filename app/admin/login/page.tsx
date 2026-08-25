"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/admin");
      } else {
        setError(data.error || "Akses Ditolak: Kredensial tidak valid");
      }
    } catch {
      setError("Kesalahan koneksi peladen internal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900">
      <div className="w-full max-w-[440px] animate-fade-in flex flex-col">
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-rose-600 rounded-xl mb-6 shadow-md shadow-rose-600/20">
            <span className="font-serif text-2xl font-bold text-white">B</span>
          </div>
          <h1 className="text-3xl font-serif text-white mb-2">
            Konsol Admin
          </h1>
          <p className="text-slate-400 text-sm font-sans uppercase tracking-widest font-semibold">
            Operasi Internal
          </p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl p-8 sm:p-10 mb-8">
          
          {error && (
            <div className="mb-6 p-4 text-sm text-rose-200 border border-rose-800/50 bg-rose-900/30 rounded-lg flex items-start gap-3 animate-fade-in">
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="input-label !text-slate-400">Username (ID Staf)</label>
              <input
                id="username"
                type="text"
                className="input-field !text-white !bg-slate-900/50 !border-slate-700 focus:!border-rose-500 font-mono focus:!ring-rose-500/20"
                placeholder="Masukkan Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="input-label !text-slate-400">Kata Sandi</label>
              <input
                id="password"
                type="password"
                className="input-field !text-white !bg-slate-900/50 !border-slate-700 focus:!border-rose-500 focus:!ring-rose-500/20"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="pt-2">
              <button type="submit" className="btn-primary w-full !bg-rose-600 hover:!bg-rose-700 shadow-md shadow-rose-600/20" disabled={loading}>
                {loading ? "Mengautentikasi..." : "Otorisasi Akses"}
              </button>
            </div>
          </form>
        </div>
        
        <div className="text-center">
          <Link href="/login" className="text-xs text-slate-500 font-sans hover:text-slate-300 transition-colors inline-flex items-center gap-2">
            Kembali ke Portal Publik
          </Link>
        </div>

      </div>
    </div>
  );
}
