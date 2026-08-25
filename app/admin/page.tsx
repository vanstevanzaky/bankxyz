"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import SearchNasabah from "@/components/SearchNasabah";

interface UserData {
  id: number;
  username: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  created_at: string;
}

interface RekeningData {
  id: number;
  nomor_rekening: string;
  jenis: string;
  saldo: number;
  status: string;
  full_name: string;
  username: string;
}

interface Stats {
  total_nasabah: number;
  total_rekening_aktif: number;
  total_saldo: number;
  total_transaksi: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [rekening, setRekening] = useState<RekeningData[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"users" | "rekening" | "search" | "export">("users");
  const [currentUser, setCurrentUser] = useState({ role: "admin", full_name: "Admin" });
  const [exportFormat, setExportFormat] = useState("csv");
  const [exportResult, setExportResult] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const dashRes = await fetch("/api/dashboard");
        if (dashRes.ok) {
          const dashData = await dashRes.json();
          setCurrentUser({ role: dashData.user.role, full_name: dashData.user.full_name });
        }

        // VULN #5: Broken Access Control
        const res = await fetch("/api/admin/users");
        if (!res.ok) {
          router.push("/admin/login");
          return;
        }
        const data = await res.json();
        setUsers(data.users || []);
        setRekening(data.rekening || []);
        setStats(data.stats || null);
      } catch {
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [router]);

  async function handleExport() {
    try {
      // VULN #8: Command Injection
      const res = await fetch(`/api/rekening/export?format=${encodeURIComponent(exportFormat)}`);
      
      if (exportFormat === "json") {
        const data = await res.json();
        setExportResult(JSON.stringify(data, null, 2));
      } else {
        const text = await res.text();
        setExportResult(text);
      }
    } catch {
      setExportResult("Gagal mengekspor");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="w-8 h-8 border-t-2 border-blue-700 rounded-full animate-spin"></div>
      </div>
    );
  }

  const tabs = [
    { key: "users", label: "Registrasi" },
    { key: "rekening", label: "Data Rekening" },
    { key: "search", label: "Intelijen" },
    { key: "export", label: "Ekspor Data" },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <Sidebar userRole={currentUser.role} userName={currentUser.full_name} />

      <main className="flex-1 p-6 pt-24 md:pt-14 md:p-14 animate-fade-in md:ml-[280px]">
        <div className="max-w-[1200px] mx-auto">
          
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 pb-6 border-b border-slate-200">
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2 tracking-widest uppercase">Ruang Kerja Eksekutif</p>
              <h1 className="text-4xl font-serif text-slate-900">
                Operasi Global
              </h1>
            </div>
            <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Akses</span>
              <span className="bg-rose-50 text-rose-700 px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border border-rose-100 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                ROOT
              </span>
            </div>
          </header>

          {/* Stats */}
          {stats && (
            <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Total Klien</p>
                <h2 className="text-3xl font-sans font-semibold text-slate-900">{stats.total_nasabah}</h2>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Rek. Aktif</p>
                <h2 className="text-3xl font-sans font-semibold text-slate-900">{stats.total_rekening_aktif}</h2>
              </div>
              <div className="bg-blue-700 rounded-xl p-6 shadow-sm text-white">
                <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-4">Total Likuiditas</p>
                <h2 className="text-2xl font-sans font-bold">
                  <span className="text-sm font-medium text-blue-300 mr-1">Rp</span>
                  {Number(stats.total_saldo || 0).toLocaleString("id-ID")}
                </h2>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Transaksi</p>
                <h2 className="text-3xl font-sans font-semibold text-slate-900">{stats.total_transaksi}</h2>
              </div>
            </section>
          )}

          {/* Tabs */}
          <div className="flex gap-4 mb-8">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`px-6 py-3 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab.key 
                    ? "bg-blue-700 text-white shadow-md shadow-blue-700/20" 
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-blue-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[500px]">
            {activeTab === "users" && (
              <div className="animate-fade-in bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">ID</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Profil Klien</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Akses</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Dibuat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-mono text-sm text-slate-500">{String(u.id).padStart(3, '0')}</td>
                          <td className="px-6 py-4">
                            <p className="font-serif font-semibold text-slate-900">{u.full_name}</p>
                            <p className="text-xs font-mono text-slate-500 mt-1">{u.username}</p>
                          </td>
                          <td className="px-6 py-4">
                            {u.role === "admin" ? (
                              <span className="bg-rose-50 text-rose-700 px-2 py-1 text-[10px] font-bold uppercase rounded-full border border-rose-100">Admin</span>
                            ) : (
                              <span className="bg-slate-100 text-slate-600 px-2 py-1 text-[10px] font-bold uppercase rounded-full">Nasabah</span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-sans text-sm text-slate-600">
                            {new Date(u.created_at).toLocaleDateString("id-ID", { month: "short", day: "numeric", year: "numeric" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "rekening" && (
              <div className="animate-fade-in bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">No Rekening</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Identitas Pemilik</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Saldo</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rekening.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-mono font-medium text-slate-900">
                            {r.nomor_rekening.match(/.{1,4}/g)?.join(' ')}
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-serif font-semibold text-slate-900">{r.full_name}</p>
                            <p className="text-xs font-mono text-slate-500 mt-1">UID: {r.username}</p>
                          </td>
                          <td className="px-6 py-4 text-right font-sans font-semibold text-emerald-600 text-lg">
                            Rp {Number(r.saldo).toLocaleString("id-ID")}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {r.status === "aktif" ? (
                              <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border border-emerald-100">Aktif</span>
                            ) : (
                              <span className="bg-rose-50 text-rose-700 px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border border-rose-100">Ditutup</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "search" && (
              <div className="animate-fade-in bg-white border border-slate-200 rounded-xl shadow-sm p-8">
                <SearchNasabah />
              </div>
            )}

            {activeTab === "export" && (
              <div className="animate-fade-in bg-white border border-slate-200 rounded-xl shadow-sm p-8">
                <div className="max-w-2xl">
                  <p className="font-sans text-slate-600 mb-8">
                    Jalankan ekspor manual untuk audit internal. Output dialirkan langsung dari cluster basis data utama perbankan.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-6 mb-12">
                    <div className="flex-1">
                      <label className="input-label">Spesifikasi Format</label>
                      <input
                        type="text"
                        className="input-field font-mono"
                        placeholder="e.g. csv, json"
                        value={exportFormat}
                        onChange={(e) => setExportFormat(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <button onClick={handleExport} className="btn-primary w-full sm:w-auto h-[48px] shadow-md shadow-blue-700/20">
                        Eksekusi Tugas
                      </button>
                    </div>
                  </div>

                  {exportResult && (
                    <div className="animate-fade-in border-t border-slate-200 pt-8">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                        Output Konsol
                      </p>
                      <pre
                        className="p-6 bg-slate-900 rounded-xl text-slate-100 font-mono text-xs overflow-x-auto shadow-inner"
                        style={{ maxHeight: "400px" }}
                      >
                        {exportResult}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
