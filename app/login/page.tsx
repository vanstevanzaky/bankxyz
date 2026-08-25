"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const sessionExpired = searchParams.get("session_expired");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/dashboard");
      } else {
        setError(data.error || "Login gagal. Periksa kembali kredensial Anda.");
      }
    } catch {
      setError("Kesalahan koneksi jaringan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F8F9FA]">
      <div className="w-full max-w-[440px] animate-fade-in flex flex-col">
        
        {/* Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-700 rounded-xl mb-6 shadow-md shadow-blue-700/20">
            <span className="font-serif text-2xl font-bold text-white">B</span>
          </div>
          <h1 className="text-3xl font-serif text-slate-900 mb-2">
            BankXYZ
          </h1>
          <p className="text-slate-500 text-sm font-sans">
            Portal Perbankan Digital Aman
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 sm:p-10 mb-8">

          {registered && (
            <div className="mb-6 p-4 text-sm text-blue-800 border border-blue-200 bg-blue-50 rounded-lg flex items-start gap-3">
              <span className="font-medium">Registrasi berhasil. Silakan masuk.</span>
            </div>
          )}
          {sessionExpired && (
            <div className="mb-6 p-4 text-sm text-slate-800 border border-slate-200 bg-slate-50 rounded-lg flex items-start gap-3">
              <span className="font-medium">Sesi telah berakhir demi keamanan Anda.</span>
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 text-sm text-rose-800 border border-rose-200 bg-rose-50 rounded-lg flex items-start gap-3 animate-fade-in">
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="input-label">Username</label>
              <input
                id="username"
                type="text"
                className="input-field font-mono"
                placeholder="Masukkan Username Anda"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="input-label !mb-0">Kata Sandi</label>
              </div>
              <input
                id="password"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="pt-2">
              <button type="submit" className="btn-primary w-full shadow-md shadow-blue-700/20" disabled={loading}>
                {loading ? "Mengautentikasi..." : "Masuk"}
              </button>
            </div>
          </form>
        </div>
        
        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-slate-500 font-sans">
            Belum menjadi klien?{" "}
            <Link href="/register" className="font-semibold text-blue-700 hover:text-blue-800 transition-colors">
              Daftar di Sini
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F9FA]" />}>
      <LoginForm />
    </Suspense>
  );
}
