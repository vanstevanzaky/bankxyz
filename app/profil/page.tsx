"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { AlertModal } from "@/components/Modal";

interface User {
  id: number;
  username: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  foto_path: string | null;
}

export default function ProfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [alertState, setAlertState] = useState<{ isOpen: boolean, title: string, message: string, type: "error" | "success" | "info" }>({ isOpen: false, title: "", message: "", type: "error" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setUser(data.user);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  async function handleUploadFoto() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    const formData = new FormData();
    formData.append("foto", file);

    try {
      const res = await fetch("/api/upload-foto", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setUser((prev) => prev ? { ...prev, foto_path: data.foto_path } : null);
        setAlertState({ isOpen: true, title: "Berhasil", message: "Foto profil berhasil diunggah", type: "success" });
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        setAlertState({ isOpen: true, title: "Gagal Mengunggah", message: data.error || "Terjadi kesalahan saat mengunggah", type: "error" });
      }
    } catch {
      setAlertState({ isOpen: true, title: "Kesalahan", message: "Gagal terhubung ke peladen", type: "error" });
    } finally {
      setUploadLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="w-8 h-8 border-t-2 border-blue-700 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <Sidebar userRole={user?.role} userName={user?.full_name || "Klien"} userPhoto={user?.foto_path} />
      
      <main className="flex-1 p-6 pt-24 md:pt-14 md:p-14 animate-fade-in md:ml-[280px]">
        <div className="max-w-[800px] mx-auto">
          
          <header className="mb-10 pb-6 border-b border-slate-200">
            <h1 className="text-4xl font-serif text-slate-900 mb-2">Profil Klien</h1>
            <p className="text-slate-500 font-sans">Kelola informasi pribadi dan pengaturan keamanan Anda.</p>
          </header>

          <div className="bg-white border border-slate-200 rounded-xl p-10 shadow-sm flex flex-col md:flex-row gap-12">
            
            <div className="flex flex-col items-center shrink-0">
              <div className="mb-6 relative">
                {user?.foto_path ? (
                  <img src={user.foto_path} alt="Profil" className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md" />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-slate-100 flex items-center justify-center text-4xl font-sans font-bold text-slate-400 border border-slate-200 shadow-inner">
                    {user?.full_name?.charAt(0)}
                  </div>
                )}
              </div>
              
              <div className="w-full text-center">
                <label className="btn-outline w-full text-xs justify-center cursor-pointer">
                  {uploadLoading ? "Mengunggah..." : "Ubah Foto"}
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleUploadFoto} disabled={uploadLoading} accept="image/*" />
                </label>
                <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest">JPG atau PNG. Maks 2MB.</p>
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <div>
                <h3 className="font-serif text-2xl text-slate-900">{user?.full_name}</h3>
                <span className="inline-flex mt-2 bg-blue-50 text-blue-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full">
                  Klien Terverifikasi
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Alamat Email</p>
                  <p className="font-sans font-medium text-slate-900">{user?.email}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Nomor Telepon</p>
                  <p className="font-sans font-mono text-slate-900">{user?.phone || "Tidak tersedia"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">ID Klien / UID</p>
                  <p className="font-sans font-mono text-slate-900">{user?.username}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Peran Akun</p>
                  <p className="font-sans font-medium text-slate-900 capitalize">{user?.role === "admin" ? "Admin" : "Nasabah"}</p>
                </div>
              </div>
            </div>

          </div>

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
