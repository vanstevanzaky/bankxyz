"use client";

import { useState, FormEvent } from "react";

// VULN #2: Reflected XSS (A03) — Search result di-render dengan dangerouslySetInnerHTML
export default function SearchNasabah() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Record<string, unknown>[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`/api/nasabah/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (res.ok) {
        setResults(data.results || []);
        setMessage(data.message || "");
      } else {
        setMessage(data.error || "Pencarian gagal");
        setResults([]);
      }
    } catch {
      setMessage("Terjadi kesalahan jaringan");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-6 p-5 rounded-2xl border border-slate-200" style={{ background: "var(--bg-muted)" }}>
        <input
          type="text"
          className="input-field flex-1"
          placeholder="Cari berdasarkan nama, username, atau email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="btn-primary whitespace-nowrap sm:h-[52px]" disabled={loading}>
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Mencari...
            </div>
          ) : (
            "Cari Data"
          )}
        </button>
      </form>

      {/* VULN #2: Reflected XSS — message dari server di-render dengan dangerouslySetInnerHTML */}
      {message && (
        <div
          className="alert alert-info"
          // VULN #2: XSS — dangerouslySetInnerHTML tanpa sanitasi
          dangerouslySetInnerHTML={{ __html: message }}
        />
      )}

      {results.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Nama Lengkap</th>
                <th>Email</th>
                <th>Hak Akses</th>
              </tr>
            </thead>
            <tbody>
              {results.map((user) => (
                <tr key={user.id as number}>
                  <td className="text-slate-400 font-mono">{String(user.id as number).padStart(3, '0')}</td>
                  <td className="font-mono text-sm font-bold text-slate-700">{user.username as string}</td>
                  <td>
                    <span className="font-bold text-slate-900">{user.full_name as string}</span>
                  </td>
                  <td className="text-sm text-slate-500">{user.email as string}</td>
                  <td>
                    <span className={`badge ${user.role === "admin" ? "badge-danger" : "badge-info"}`}>
                      {(user.role as string).toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
