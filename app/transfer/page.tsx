"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TransferForm from "@/components/TransferForm";

interface User {
  id: number;
  full_name: string;
  role: string;
  foto_path: string | null;
}

interface Rekening {
  id: number;
  nomor_rekening: string;
  jenis: string;
  saldo: number;
  status: string;
}

export default function TransferPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [rekening, setRekening] = useState<Rekening[]>([]);
  const [loading, setLoading] = useState(true);

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
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="w-8 h-8 border-t-2 border-blue-700 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <Sidebar userRole={user?.role} userName={user?.full_name || "Klien"} userPhoto={user?.foto_path} userTier={user?.tier} />
      
      <main className="flex-1 p-6 pt-24 md:pt-14 md:p-14 animate-fade-in md:ml-[280px]">
        <div className="max-w-[800px] mx-auto">
          
          <header className="mb-10 pb-6 border-b border-slate-200">
            <h1 className="text-4xl font-serif text-slate-900 mb-2">Transfer Dana</h1>
            <p className="text-slate-500 font-sans">Pindahkan dana antar rekening internal dan eksternal dengan aman.</p>
          </header>

          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
            <TransferForm rekeningList={rekening} onSuccess={fetchData} />
          </div>

        </div>
      </main>
    </div>
  );
}
