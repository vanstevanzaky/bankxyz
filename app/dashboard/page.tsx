"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { AlertModal, PromptModal } from "@/components/Modal";

interface User {
  id: number;
  full_name: string;
  role: string;
  tier: string;
  foto_path: string | null;
}

interface Rekening {
  id: number;
  nomor_rekening: string;
  jenis: string;
  saldo: number;
  status: string;
}

interface Transaksi {
  id: number;
  from_rekening: string;
  to_rekening: string;
  from_name: string;
  to_name: string;
  jumlah: number;
  keterangan: string;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [rekening, setRekening] = useState<Rekening[]>([]);
  const [transaksi, setTransaksi] = useState<Transaksi[]>([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);

  // Modals State
  const [alertState, setAlertState] = useState<{ isOpen: boolean, title: string, message: string, type: "error" | "success" | "info" }>({ isOpen: false, title: "", message: "", type: "error" });
  const [promptOpen, setPromptOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setUser(data.user);
      setRekening(data.rekening);
      setTransaksi(data.transaksi || []);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function executeBuatRekening(nama: string) {
    setCreateLoading(true);
    try {
      const res = await fetch("/api/rekening", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama_rekening: nama || "Tabungan Utama" })
      });
      const data = await res.json();
      setPromptOpen(false); // Selalu tutup prompt setelah request selesai
      if (res.ok) {
        setAlertState({ isOpen: true, title: "Berhasil", message: "Rekening baru berhasil dibuat", type: "success" });
        fetchData();
      } else {
        setAlertState({ isOpen: true, title: "Gagal", message: data.error || "Gagal membuat rekening baru", type: "error" });
      }
    } catch {
      setPromptOpen(false);
      setAlertState({ isOpen: true, title: "Kesalahan", message: "Masalah koneksi sistem", type: "error" });
    } finally {
      setCreateLoading(false);
    }
  }

  function handleBuatRekening() {
    setPromptOpen(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="w-8 h-8 border-t-2 border-blue-700 rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalSaldo = rekening.filter(r => r.status === "aktif").reduce((sum, r) => sum + Number(r.saldo), 0);
  const totalRekening = rekening.filter(r => r.status === "aktif").length;

  const hour = new Date().getHours();
  let greeting = "Selamat pagi";
  if (hour >= 11 && hour < 15) greeting = "Selamat siang";
  else if (hour >= 15 && hour < 18) greeting = "Selamat sore";
  else if (hour >= 18 || hour < 4) greeting = "Selamat malam";

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <Sidebar userRole={user?.role} userName={user?.full_name || "Klien"} userPhoto={user?.foto_path} userTier={user?.tier} />
      
      <main className="flex-1 p-6 pt-24 md:pt-14 md:p-14 animate-fade-in md:ml-[280px]">
        <div className="max-w-[1200px] mx-auto">
          
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 pb-6 border-b border-slate-200">
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2 tracking-widest uppercase">Ringkasan</p>
              <h1 className="text-4xl font-serif text-slate-900">
                {greeting}, {user?.full_name}
              </h1>
            </div>
            <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Status Jaringan</span>
              <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border border-emerald-100 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Aman
              </span>
            </div>
          </header>

          {/* Metrics */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-blue-700 rounded-xl p-8 shadow-md shadow-blue-700/10 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-4 relative z-10">Total Likuiditas</p>
              <h2 className="text-4xl font-sans font-bold relative z-10 tracking-tight">
                <span className="text-lg font-medium text-blue-300 mr-2">Rp</span>
                {totalSaldo.toLocaleString("id-ID")}
              </h2>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Rekening Aktif</p>
              <h2 className="text-4xl font-sans font-semibold text-slate-900">{totalRekening}</h2>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm flex flex-col justify-center">
              <Link href="/transfer" className="btn-outline w-full justify-center h-[52px]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                Kirim Uang
              </Link>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Accounts Column */}
            <div className="lg:col-span-1 space-y-6">
              <div className="flex justify-between items-end border-b border-slate-200 pb-3">
                <h3 className="font-serif text-2xl text-slate-900">Rekening Anda</h3>
                {user?.role !== "admin" && (
                  <button onClick={handleBuatRekening} disabled={createLoading} className="text-[10px] font-bold text-blue-700 uppercase tracking-widest hover:text-blue-800 transition-colors">
                    {createLoading ? "Memproses..." : "+ Minta Baru"}
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                {rekening.length > 0 ? (
                  rekening.map((r) => (
                    <Link key={r.id} href={`/rekening/${r.id}`} className="block bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Neo {r.jenis}</p>
                          <p className="font-mono text-slate-900 font-medium tracking-widest group-hover:text-blue-700 transition-colors">{r.nomor_rekening.match(/.{1,4}/g)?.join(' ')}</p>
                        </div>
                        {r.status === "aktif" ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.1)]"></span>
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_0_4px_rgba(244,63,94,0.1)]"></span>
                        )}
                      </div>
                      <p className="font-sans font-semibold text-lg text-emerald-600">
                        Rp {Number(r.saldo).toLocaleString("id-ID")}
                      </p>
                    </Link>
                  ))
                ) : (
                  <div className="border border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50">
                    <p className="font-sans text-sm text-slate-500">Belum ada rekening dibuat.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Transactions Column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="font-serif text-2xl text-slate-900">Transaksi Terakhir</h3>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                {transaksi.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {transaksi.map((t) => {
                      const isDebit = rekening.some(r => r.nomor_rekening === t.from_rekening);
                      return (
                        <div key={t.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isDebit ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                              {isDebit ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                              ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 19-7-7 7-7"/></svg>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 text-sm">
                                {isDebit ? `Transfer ke ${t.to_name}` : `Transfer dari ${t.from_name}`}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })} • {t.keterangan || "Transfer Internal"}
                              </p>
                            </div>
                          </div>
                          <div className="sm:text-right pl-14 sm:pl-0">
                            <p className={`font-sans font-semibold ${isDebit ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {isDebit ? '-' : '+'}Rp {Number(t.jumlah).toLocaleString("id-ID")}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <p className="font-sans text-slate-500">Belum ada aktivitas terbaru.</p>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Modals */}
      <AlertModal 
        isOpen={alertState.isOpen}
        onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
      />

      <PromptModal
        isOpen={promptOpen}
        onClose={() => setPromptOpen(false)}
        onSubmit={executeBuatRekening}
        title="Buka Rekening Baru"
        description="Berikan nama alias (opsional) untuk membedakan rekening Anda."
        inputPlaceholder="Misal: Dana Darurat"
        defaultValue="Tabungan"
        submitText="Buat Rekening"
        loading={createLoading}
      />
    </div>
  );
}
