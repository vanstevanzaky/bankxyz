"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { AlertModal, PromptModal, ConfirmModal } from "@/components/Modal";
import { BaseModal } from "@/components/Modal";

interface User {
  id: number;
  username: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  tier: string;
  foto_path: string | null;
}

export default function ProfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [alertState, setAlertState] = useState<{ isOpen: boolean, title: string, message: string, type: "error" | "success" | "info" }>({ isOpen: false, title: "", message: "", type: "error" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit profil state
  const [editOpen, setEditOpen] = useState(false);
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Password state
  const [pwOpen, setPwOpen] = useState(false);
  const [pwOld, setPwOld] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  // Hapus foto state
  const [deletePhotoOpen, setDeletePhotoOpen] = useState(false);
  const [deletePhotoLoading, setDeletePhotoLoading] = useState(false);

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

  async function handleDeleteFoto() {
    setDeletePhotoLoading(true);
    try {
      const res = await fetch("/api/profil", { method: "DELETE" });
      if (res.ok) {
        setUser((prev) => prev ? { ...prev, foto_path: null } : null);
        setDeletePhotoOpen(false);
        setAlertState({ isOpen: true, title: "Berhasil", message: "Foto profil berhasil dihapus", type: "success" });
      } else {
        const data = await res.json();
        setAlertState({ isOpen: true, title: "Gagal", message: data.error, type: "error" });
      }
    } catch {
      setAlertState({ isOpen: true, title: "Kesalahan", message: "Gagal terhubung ke peladen", type: "error" });
    } finally {
      setDeletePhotoLoading(false);
    }
  }

  async function handleEditProfil(e: React.FormEvent) {
    e.preventDefault();
    setEditLoading(true);
    try {
      const res = await fetch("/api/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: editEmail, phone: editPhone }),
      });
      const data = await res.json();
      setEditOpen(false);
      if (res.ok) {
        setAlertState({ isOpen: true, title: "Berhasil", message: "Profil berhasil diperbarui", type: "success" });
        fetchDashboard();
      } else {
        setAlertState({ isOpen: true, title: "Gagal", message: data.error, type: "error" });
      }
    } catch {
      setEditOpen(false);
      setAlertState({ isOpen: true, title: "Kesalahan", message: "Gagal terhubung ke peladen", type: "error" });
    } finally {
      setEditLoading(false);
    }
  }

  async function handleGantiPassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwNew !== pwConfirm) {
      setAlertState({ isOpen: true, title: "Validasi Gagal", message: "Password baru dan konfirmasi tidak cocok", type: "error" });
      return;
    }
    setPwLoading(true);
    try {
      const res = await fetch("/api/profil/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password_lama: pwOld, password_baru: pwNew }),
      });
      const data = await res.json();
      setPwOpen(false);
      setPwOld(""); setPwNew(""); setPwConfirm("");
      if (res.ok) {
        setAlertState({ isOpen: true, title: "Berhasil", message: "Kata sandi berhasil diubah", type: "success" });
      } else {
        setAlertState({ isOpen: true, title: "Gagal", message: data.error, type: "error" });
      }
    } catch {
      setPwOpen(false);
      setAlertState({ isOpen: true, title: "Kesalahan", message: "Gagal terhubung ke peladen", type: "error" });
    } finally {
      setPwLoading(false);
    }
  }

  function openEditModal() {
    setEditEmail(user?.email || "");
    setEditPhone(user?.phone || "");
    setEditOpen(true);
  }

  const tierLabel = user?.tier === 'premium' ? 'Klien Premium' : user?.tier === 'prioritas' ? 'Klien Prioritas' : 'Klien Reguler';
  const tierColor = user?.tier === 'premium' ? 'bg-amber-50 text-amber-700' : user?.tier === 'prioritas' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700';

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
              
              <div className="w-full space-y-2 text-center">
                <label className="btn-outline w-full text-xs justify-center cursor-pointer block">
                  {uploadLoading ? "Mengunggah..." : "Ubah Foto"}
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleUploadFoto} disabled={uploadLoading} accept="image/*" />
                </label>
                {user?.foto_path && (
                  <button 
                    onClick={() => setDeletePhotoOpen(true)}
                    className="text-[10px] font-bold uppercase tracking-widest text-rose-500 hover:text-rose-700 transition-colors w-full"
                  >
                    Hapus Foto
                  </button>
                )}
                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">JPG atau PNG. Maks 2MB.</p>
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <div>
                <h3 className="font-serif text-2xl text-slate-900">{user?.full_name}</h3>
                <span className={`inline-flex mt-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full ${tierColor}`}>
                  {user?.role === 'admin' ? 'Administrator' : tierLabel}
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

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-100">
                <button onClick={openEditModal} className="btn-primary flex-1 text-sm shadow-sm">
                  Edit Profil
                </button>
                <button onClick={() => setPwOpen(true)} className="btn-outline flex-1 text-sm shadow-sm">
                  Ganti Kata Sandi
                </button>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Edit Profile Modal */}
      <BaseModal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Profil">
        <form onSubmit={handleEditProfil} className="space-y-6">
          <p className="text-sm text-slate-500">Perbarui alamat email dan nomor telepon Anda.</p>
          <div>
            <label className="input-label">Alamat Email</label>
            <input type="email" className="input-field" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="email@contoh.com" />
          </div>
          <div>
            <label className="input-label">Nomor Telepon</label>
            <input type="text" className="input-field" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="08xxxxxxxxxx" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setEditOpen(false)} className="btn-outline flex-1" disabled={editLoading}>Batal</button>
            <button type="submit" className="btn-primary flex-1" disabled={editLoading}>
              {editLoading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </BaseModal>

      {/* Change Password Modal */}
      <BaseModal isOpen={pwOpen} onClose={() => setPwOpen(false)} title="Ganti Kata Sandi">
        <form onSubmit={handleGantiPassword} className="space-y-6">
          <p className="text-sm text-slate-500">Masukkan kata sandi lama Anda, lalu tentukan kata sandi yang baru.</p>
          <div>
            <label className="input-label">Kata Sandi Lama</label>
            <input type="password" className="input-field" value={pwOld} onChange={(e) => setPwOld(e.target.value)} placeholder="••••••••" required />
          </div>
          <div>
            <label className="input-label">Kata Sandi Baru</label>
            <input type="password" className="input-field" value={pwNew} onChange={(e) => setPwNew(e.target.value)} placeholder="Minimal 4 karakter" required />
          </div>
          <div>
            <label className="input-label">Konfirmasi Kata Sandi Baru</label>
            <input type="password" className="input-field" value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} placeholder="Ketik ulang kata sandi baru" required />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setPwOpen(false)} className="btn-outline flex-1" disabled={pwLoading}>Batal</button>
            <button type="submit" className="btn-primary flex-1" disabled={pwLoading || !pwOld || !pwNew || !pwConfirm}>
              {pwLoading ? "Menyimpan..." : "Ubah Kata Sandi"}
            </button>
          </div>
        </form>
      </BaseModal>

      {/* Delete Photo Confirm */}
      <ConfirmModal
        isOpen={deletePhotoOpen}
        onClose={() => setDeletePhotoOpen(false)}
        onConfirm={handleDeleteFoto}
        title="Hapus Foto Profil"
        message="Apakah Anda yakin ingin menghapus foto profil? Foto akan diganti dengan inisial nama Anda."
        confirmText="Hapus Foto"
        loading={deletePhotoLoading}
        variant="danger"
      />

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
