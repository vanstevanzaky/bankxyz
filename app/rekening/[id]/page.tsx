"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { AlertModal } from "@/components/Modal";

interface RekeningDetail {
  id: number;
  user_id: number;
  nomor_rekening: string;
  jenis: string;
  saldo: number;
  status: string;
  created_at: string;
  full_name: string;
  username: string;
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

export default function RekeningDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [user, setUser] = useState<any>(null);
  const [rekening, setRekening] = useState<RekeningDetail | null>(null);
  const [transaksi, setTransaksi] = useState<Transaksi[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertState, setAlertState] = useState<{ isOpen: boolean, title: string, message: string, type: "error" | "success" | "info" }>({ isOpen: false, title: "", message: "", type: "error" });

  const fetchData = useCallback(async () => {
    try {
      const dashRes = await fetch("/api/dashboard");
      if (!dashRes.ok) {
        router.push("/login");
        return;
      }
      const dashData = await dashRes.json();
      setUser(dashData.user);

      // VULN #3: IDOR
      const res = await fetch(`/api/rekening/${id}`);
      if (!res.ok) {
        router.push("/dashboard");
        return;
      }
      const data = await res.json();
      setRekening(data.rekening);
      setTransaksi(data.transaksi || []);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleTutupRekening() {
    if (!confirm("Tindakan ini tidak dapat dibatalkan. Sisa saldo akan hangus. Lanjutkan?")) return;

    try {
      // VULN #3: IDOR
      const res = await fetch(`/api/rekening/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setAlertState({ isOpen: true, title: "Berhasil", message: "Rekening berhasil ditutup", type: "success" });
        setTimeout(() => router.push("/dashboard"), 1500);
      } else {
        setAlertState({ isOpen: true, title: "Gagal Menutup", message: data.error || "Gagal menutup rekening", type: "error" });
      }
    } catch {
      setAlertState({ isOpen: true, title: "Kesalahan", message: "Kesalahan koneksi sistem", type: "error" });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="w-8 h-8 border-t-2 border-blue-700 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!rekening) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <p className="font-sans font-medium text-slate-500">Berkas Rekening Tidak Ditemukan</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <Sidebar userRole={user?.role} userName={user?.full_name || "Klien"} userPhoto={user?.foto_path} />
      
      <main className="flex-1 p-6 pt-24 md:pt-14 md:p-14 animate-fade-in md:ml-[280px]">
        <div className="max-w-[1000px] mx-auto">
          
          {/* Header & Breadcrumb */}
          <div className="mb-10">
            <Link href="/dashboard" className="text-sm font-semibold text-slate-500 hover:text-blue-700 transition-colors flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Kembali ke Dashboard
            </Link>
          </div>

          {/* Account Detail Statement */}
          <section className="bg-white border border-slate-200 rounded-2xl p-10 md:p-14 mb-12 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
              <span className="font-serif text-[200px] font-bold leading-none">B</span>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12 mb-12 relative z-10">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Rekening Neo {rekening.jenis}</p>
                  {rekening.status === "aktif" ? (
                    <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border border-emerald-100 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Aktif
                    </span>
                  ) : (
                    <span className="bg-rose-50 text-rose-700 px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border border-rose-100 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Ditutup
                    </span>
                  )}
                </div>
                <h1 className="text-4xl md:text-5xl font-mono text-slate-900 tracking-widest">
                  {rekening.nomor_rekening.match(/.{1,4}/g)?.join(' ')}
                </h1>
              </div>
              <div className="text-left md:text-right">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Saldo Tersedia</p>
                <p className="text-4xl font-sans font-semibold text-emerald-600">
                  <span className="text-xl font-medium text-emerald-600/70 mr-2">Rp</span>
                  {Number(rekening.saldo).toLocaleString("id-ID")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-slate-100 relative z-10">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Pemegang</p>
                <p className="font-serif font-semibold text-lg text-slate-900">{rekening.full_name}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">ID Klien</p>
                <p className="font-mono text-sm text-slate-600">{rekening.username}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Dibuat</p>
                <p className="font-sans font-medium text-sm text-slate-600">
                  {new Date(rekening.created_at).toLocaleDateString("id-ID", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <div className="flex justify-start md:justify-end items-end">
                {rekening.status === "aktif" && (
                  <button onClick={handleTutupRekening} className="text-[10px] font-bold uppercase tracking-[0.1em] text-rose-600 hover:text-rose-700 transition-colors border-b border-rose-200 hover:border-rose-600 pb-0.5">
                    Tutup Rekening
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Transactions Ledger */}
          <section>
            <div className="border-b border-slate-200 pb-4 mb-6">
              <h3 className="font-serif text-2xl text-slate-900">Mutasi Rekening</h3>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              {transaksi.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {transaksi.map((t) => {
                    const isDebit = t.from_rekening === rekening.nomor_rekening;
                    return (
                      <div key={t.id} className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50 transition-colors">
                        <div>
                          <p className="font-semibold text-slate-900 mb-1">
                            {isDebit ? `Dana Ditransfer ke ${t.to_name}` : `Dana Diterima dari ${t.from_name}`}
                          </p>
                          <p className="font-mono text-xs text-slate-500">
                            Ref: {isDebit ? t.to_rekening : t.from_rekening}
                          </p>
                          {t.keterangan && (
                            <p className="text-sm font-medium text-slate-600 mt-3 bg-slate-100/50 inline-block px-3 py-1.5 rounded-lg border border-slate-200">
                              "{t.keterangan}"
                            </p>
                          )}
                        </div>
                        <div className="md:text-right">
                          <p className={`font-sans font-semibold text-xl ${isDebit ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {isDebit ? '-' : '+'}Rp {Number(t.jumlah).toLocaleString("id-ID")}
                          </p>
                          <p className="font-sans text-xs text-slate-400 mt-2 font-medium">
                            {new Date(t.created_at).toLocaleDateString("id-ID", { month: "short", day: "numeric", year: "numeric" })} • {new Date(t.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-16 text-center">
                  <p className="font-sans text-slate-500">Tidak ada transaksi tercatat untuk periode ini.</p>
                </div>
              )}
            </div>
          </section>

        </div>
      </main>

      <AlertModal 
        isOpen={alertState.isOpen}
        onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
      />
    </div>
  );
}
