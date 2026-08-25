"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import SearchNasabah from "@/components/SearchNasabah";
import { AlertModal, ConfirmModal, BaseModal } from "@/components/Modal";

interface UserData {
  id: number;
  username: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  tier: string;
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

interface TransaksiData {
  id: number;
  from_rekening: string;
  to_rekening: string;
  from_name: string;
  to_name: string;
  jumlah: number;
  keterangan: string;
  created_at: string;
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
  const [transaksi, setTransaksi] = useState<TransaksiData[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"users" | "rekening" | "transaksi" | "search" | "export">("users");
  const [currentUser, setCurrentUser] = useState({ role: "admin", full_name: "Admin" });
  const [exportFormat, setExportFormat] = useState("csv");
  const [exportResult, setExportResult] = useState("");

  // Alert & Confirm
  const [alertState, setAlertState] = useState<{ isOpen: boolean, title: string, message: string, type: "error" | "success" | "info" }>({ isOpen: false, title: "", message: "", type: "error" });
  
  // Edit User Modal
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState("nasabah");
  const [editTier, setEditTier] = useState("reguler");
  const [editLoading, setEditLoading] = useState(false);

  // Delete User Confirm
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserData | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Rekening Action
  const [rekActionOpen, setRekActionOpen] = useState(false);
  const [rekTarget, setRekTarget] = useState<RekeningData | null>(null);
  const [rekAction, setRekAction] = useState<"freeze" | "unfreeze" | "force_close">("freeze");
  const [rekLoading, setRekLoading] = useState(false);

  // Cleanup
  const [cleanupOpen, setCleanupOpen] = useState(false);
  const [cleanupPreview, setCleanupPreview] = useState<any[]>([]);
  const [cleanupLoading, setCleanupLoading] = useState(false);

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

      // Fetch transaksi global
      const txRes = await fetch("/api/admin/transaksi");
      if (txRes.ok) {
        const txData = await txRes.json();
        setTransaksi(txData.transaksi || []);
      }
    } catch {
      router.push("/admin/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [router]);

  // ---- Edit User ----
  function openEditUser(u: UserData) {
    setEditUser(u);
    setEditName(u.full_name);
    setEditEmail(u.email);
    setEditPhone(u.phone || "");
    setEditRole(u.role);
    setEditTier(u.tier || "reguler");
    setEditOpen(true);
  }

  async function handleEditUser(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    setEditLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: editName, email: editEmail, phone: editPhone, role: editRole, tier: editTier }),
      });
      const data = await res.json();
      setEditOpen(false);
      if (res.ok) {
        setAlertState({ isOpen: true, title: "Berhasil", message: "Data pengguna berhasil diperbarui", type: "success" });
        fetchData();
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

  // ---- Delete User ----
  function openDeleteUser(u: UserData) {
    setDeleteTarget(u);
    setDeleteOpen(true);
  }

  async function handleDeleteUser() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      setDeleteOpen(false);
      if (res.ok) {
        setAlertState({ isOpen: true, title: "Berhasil", message: `Akun ${deleteTarget.full_name} berhasil dihapus`, type: "success" });
        fetchData();
      } else {
        setAlertState({ isOpen: true, title: "Gagal", message: data.error, type: "error" });
      }
    } catch {
      setDeleteOpen(false);
      setAlertState({ isOpen: true, title: "Kesalahan", message: "Gagal terhubung ke peladen", type: "error" });
    } finally {
      setDeleteLoading(false);
    }
  }

  // ---- Rekening Actions ----
  function openRekAction(r: RekeningData, action: "freeze" | "unfreeze" | "force_close") {
    setRekTarget(r);
    setRekAction(action);
    setRekActionOpen(true);
  }

  async function handleRekAction() {
    if (!rekTarget) return;
    setRekLoading(true);
    try {
      let res;
      if (rekAction === "force_close") {
        res = await fetch(`/api/admin/rekening/${rekTarget.id}`, { method: "DELETE" });
      } else {
        res = await fetch(`/api/admin/rekening/${rekTarget.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: rekAction === "freeze" ? "tutup" : "aktif" }),
        });
      }
      const data = await res.json();
      setRekActionOpen(false);
      if (res.ok) {
        setAlertState({ isOpen: true, title: "Berhasil", message: data.message, type: "success" });
        fetchData();
      } else {
        setAlertState({ isOpen: true, title: "Gagal", message: data.error, type: "error" });
      }
    } catch {
      setRekActionOpen(false);
      setAlertState({ isOpen: true, title: "Kesalahan", message: "Gagal terhubung ke peladen", type: "error" });
    } finally {
      setRekLoading(false);
    }
  }

  // ---- Cleanup ----
  async function handleCleanupPreview() {
    setCleanupLoading(true);
    try {
      const res = await fetch("/api/admin/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preview: true, hari_tidak_aktif: 365 }),
      });
      const data = await res.json();
      setCleanupPreview(data.accounts || []);
      setCleanupOpen(true);
    } catch {
      setAlertState({ isOpen: true, title: "Kesalahan", message: "Gagal memuat data", type: "error" });
    } finally {
      setCleanupLoading(false);
    }
  }

  async function handleCleanupExecute() {
    setCleanupLoading(true);
    try {
      const res = await fetch("/api/admin/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hari_tidak_aktif: 365 }),
      });
      const data = await res.json();
      setCleanupOpen(false);
      if (res.ok) {
        setAlertState({ isOpen: true, title: "Pembersihan Selesai", message: data.message, type: "success" });
        fetchData();
      } else {
        setAlertState({ isOpen: true, title: "Gagal", message: data.error, type: "error" });
      }
    } catch {
      setCleanupOpen(false);
      setAlertState({ isOpen: true, title: "Kesalahan", message: "Gagal terhubung ke peladen", type: "error" });
    } finally {
      setCleanupLoading(false);
    }
  }

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
    { key: "transaksi", label: "Transaksi" },
    { key: "search", label: "Intelijen" },
    { key: "export", label: "Ekspor Data" },
  ];

  const tierBadge = (tier: string) => {
    const map: Record<string, string> = {
      premium: "bg-amber-50 text-amber-700 border-amber-100",
      prioritas: "bg-emerald-50 text-emerald-700 border-emerald-100",
      reguler: "bg-slate-100 text-slate-600 border-slate-200",
    };
    return map[tier] || map.reguler;
  };

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
            <div className="flex items-center gap-3">
              <button 
                onClick={handleCleanupPreview}
                disabled={cleanupLoading}
                className="text-xs font-bold uppercase tracking-widest text-rose-600 hover:text-rose-800 border border-rose-200 hover:border-rose-400 px-4 py-2 rounded-lg transition-all bg-white hover:bg-rose-50"
              >
                {cleanupLoading ? "Memuat..." : "🧹 Pembersihan Massal"}
              </button>
              <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Akses</span>
                <span className="bg-rose-50 text-rose-700 px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border border-rose-100 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  ROOT
                </span>
              </div>
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
          <div className="flex gap-2 md:gap-4 mb-8 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`px-4 md:px-6 py-3 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
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
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Kelas</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Dibuat</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Aksi</th>
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
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full border ${tierBadge(u.tier || 'reguler')}`}>
                              {u.tier || 'reguler'}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-sans text-sm text-slate-600">
                            {new Date(u.created_at).toLocaleDateString("id-ID", { month: "short", day: "numeric", year: "numeric" })}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {u.role !== "admin" && (
                                <>
                                  <button 
                                    onClick={() => openEditUser(u)}
                                    className="text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 px-3 py-1.5 rounded-md transition-all"
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    onClick={() => openDeleteUser(u)}
                                    className="text-[10px] font-bold uppercase tracking-widest text-rose-600 hover:text-rose-800 border border-rose-200 hover:border-rose-400 px-3 py-1.5 rounded-md transition-all"
                                  >
                                    Hapus
                                  </button>
                                </>
                              )}
                            </div>
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
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Aksi</th>
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
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {r.status === "aktif" ? (
                                <button 
                                  onClick={() => openRekAction(r, "freeze")}
                                  className="text-[10px] font-bold uppercase tracking-widest text-amber-600 hover:text-amber-800 border border-amber-200 hover:border-amber-400 px-3 py-1.5 rounded-md transition-all"
                                >
                                  Bekukan
                                </button>
                              ) : (
                                <button 
                                  onClick={() => openRekAction(r, "unfreeze")}
                                  className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 hover:text-emerald-800 border border-emerald-200 hover:border-emerald-400 px-3 py-1.5 rounded-md transition-all"
                                >
                                  Aktifkan
                                </button>
                              )}
                              <button 
                                onClick={() => openRekAction(r, "force_close")}
                                className="text-[10px] font-bold uppercase tracking-widest text-rose-600 hover:text-rose-800 border border-rose-200 hover:border-rose-400 px-3 py-1.5 rounded-md transition-all"
                              >
                                Tutup Paksa
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "transaksi" && (
              <div className="animate-fade-in bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">ID</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Pengirim</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Penerima</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Nominal</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Keterangan</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Waktu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transaksi.length > 0 ? transaksi.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-mono text-sm text-slate-500">#{String(t.id).padStart(4, '0')}</td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-slate-900 text-sm">{t.from_name}</p>
                            <p className="text-xs font-mono text-slate-500">{t.from_rekening}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-slate-900 text-sm">{t.to_name}</p>
                            <p className="text-xs font-mono text-slate-500">{t.to_rekening}</p>
                          </td>
                          <td className="px-6 py-4 text-right font-sans font-semibold text-blue-700">
                            Rp {Number(t.jumlah).toLocaleString("id-ID")}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 max-w-[200px] truncate">{t.keterangan || "-"}</td>
                          <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                            {new Date(t.created_at).toLocaleDateString("id-ID", { month: "short", day: "numeric" })} • {new Date(t.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-16 text-center text-slate-500">Belum ada transaksi tercatat.</td>
                        </tr>
                      )}
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

      {/* Edit User Modal */}
      <BaseModal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Pengguna">
        <form onSubmit={handleEditUser} className="space-y-5">
          <p className="text-sm text-slate-500">Mengubah data <strong>{editUser?.username}</strong></p>
          <div>
            <label className="input-label">Nama Lengkap</label>
            <input type="text" className="input-field" value={editName} onChange={(e) => setEditName(e.target.value)} />
          </div>
          <div>
            <label className="input-label">Email</label>
            <input type="email" className="input-field" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
          </div>
          <div>
            <label className="input-label">Telepon</label>
            <input type="text" className="input-field" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="input-label">Kelas / Tier</label>
              <select className="input-field" value={editTier} onChange={(e) => setEditTier(e.target.value)}>
                <option value="reguler">Reguler</option>
                <option value="prioritas">Prioritas</option>
                <option value="premium">Premium</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setEditOpen(false)} className="btn-outline flex-1" disabled={editLoading}>Batal</button>
            <button type="submit" className="btn-primary flex-1" disabled={editLoading}>
              {editLoading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </BaseModal>

      {/* Delete User Confirm */}
      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteUser}
        title="Hapus Pengguna"
        message={`Apakah Anda yakin ingin menghapus akun "${deleteTarget?.full_name}" secara permanen? Seluruh rekening dan riwayat transaksi terkait akan ikut terhapus. Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus Permanen"
        loading={deleteLoading}
        variant="danger"
      />

      {/* Rekening Action Confirm */}
      <ConfirmModal
        isOpen={rekActionOpen}
        onClose={() => setRekActionOpen(false)}
        onConfirm={handleRekAction}
        title={rekAction === "freeze" ? "Bekukan Rekening" : rekAction === "unfreeze" ? "Aktifkan Rekening" : "Tutup Paksa Rekening"}
        message={
          rekAction === "freeze" 
            ? `Rekening ${rekTarget?.nomor_rekening} milik ${rekTarget?.full_name} akan dibekukan. Nasabah tidak akan bisa melakukan transaksi.`
            : rekAction === "unfreeze"
            ? `Rekening ${rekTarget?.nomor_rekening} milik ${rekTarget?.full_name} akan diaktifkan kembali.`
            : `Rekening ${rekTarget?.nomor_rekening} milik ${rekTarget?.full_name} akan ditutup paksa. Saldo yang tersisa (Rp ${Number(rekTarget?.saldo || 0).toLocaleString("id-ID")}) akan DIHANGUSKAN.`
        }
        confirmText={rekAction === "force_close" ? "Ya, Tutup & Hanguskan" : "Ya, Lanjutkan"}
        loading={rekLoading}
        variant={rekAction === "force_close" ? "danger" : "warning"}
      />

      {/* Cleanup Modal */}
      <BaseModal isOpen={cleanupOpen} onClose={() => setCleanupOpen(false)} title="🧹 Pembersihan Massal">
        <div className="space-y-6">
          <p className="text-sm text-slate-500">
            Ditemukan <strong className="text-rose-600">{cleanupPreview.length}</strong> akun dormant (saldo habis / tidak aktif &gt; 1 tahun).
          </p>
          {cleanupPreview.length > 0 ? (
            <>
              <div className="max-h-[200px] overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                {cleanupPreview.map((acc: any) => (
                  <div key={acc.id} className="px-4 py-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{acc.full_name}</p>
                      <p className="text-xs font-mono text-slate-500">{acc.username}</p>
                    </div>
                    <span className="text-xs font-mono text-slate-400">Rp {Number(acc.total_saldo || 0).toLocaleString("id-ID")}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setCleanupOpen(false)} className="btn-outline flex-1" disabled={cleanupLoading}>Batal</button>
                <button onClick={handleCleanupExecute} className="flex-1 px-4 py-3 rounded-lg font-semibold text-sm bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-sm" disabled={cleanupLoading}>
                  {cleanupLoading ? "Menghapus..." : `Hapus ${cleanupPreview.length} Akun`}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500">✨ Tidak ada akun dormant yang ditemukan. Sistem bersih!</p>
              <button onClick={() => setCleanupOpen(false)} className="btn-primary mt-4">Tutup</button>
            </div>
          )}
        </div>
      </BaseModal>

      {/* Alert */}
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
