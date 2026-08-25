import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export default function Sidebar({ userRole, userName, userPhoto, userTier }: { userRole?: string, userName?: string, userPhoto?: string | null, userTier?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  }

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center shadow-md">
            <span className="font-serif text-lg font-bold text-white">B</span>
          </div>
          <h2 className="font-serif text-lg font-bold text-slate-900">BankXYZ</h2>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="text-slate-600 focus:outline-none">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isOpen ? <path d="M18 6 6 18M6 6l12 12"/> : <path d="M4 12h16M4 6h16M4 18h16"/>}
          </svg>
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-900/50 z-40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar Content */}
      <div className={`fixed md:left-0 top-0 h-screen bg-white border-r border-slate-200 w-[280px] flex flex-col shadow-xl md:shadow-sm z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        {/* Brand Profile */}
        <div className="p-8 border-b border-slate-100 flex items-center gap-4 hidden md:flex">
          <div className="w-12 h-12 bg-blue-700 rounded-xl flex items-center justify-center shadow-md shadow-blue-700/20 shrink-0">
            <span className="font-serif text-2xl font-bold text-white">B</span>
          </div>
          <div className="overflow-hidden">
            <h2 className="font-serif text-xl font-bold text-slate-900 truncate">BankXYZ</h2>
            <p className={`text-[10px] uppercase tracking-widest font-bold truncate ${userRole === 'admin' ? 'text-rose-600' : userTier === 'premium' ? 'text-amber-600' : userTier === 'prioritas' ? 'text-emerald-600' : 'text-blue-700'}`}>
              {userRole === 'admin' ? 'Staf Internal' : userTier === 'premium' ? 'Klien Premium' : userTier === 'prioritas' ? 'Klien Prioritas' : 'Klien Reguler'}
            </p>
          </div>
        </div>

        <div className="md:hidden h-16 border-b border-slate-100 flex items-center px-8">
          <p className="text-[10px] uppercase tracking-widest text-blue-700 font-bold">Navigasi Utama</p>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-4">Direktori</p>
            <nav className="space-y-1">
              <Link href="/dashboard" onClick={() => setIsOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${isActive('/dashboard') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
                Dashboard
              </Link>
              
              <Link href="/transfer" onClick={() => setIsOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${isActive('/transfer') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                Transfer Dana
              </Link>

              <Link href="/profil" onClick={() => setIsOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${isActive('/profil') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Profil Klien
              </Link>
            </nav>
          </div>

          {userRole === "admin" && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-4">Hak Istimewa Admin</p>
              <nav className="space-y-1">
                <Link href="/admin" onClick={() => setIsOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${isActive('/admin') ? 'bg-rose-50 text-rose-700' : 'text-slate-600 hover:bg-slate-50 hover:text-rose-600'}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Operasi Admin
                </Link>
              </nav>
            </div>
          )}

        </div>

        {/* User Status */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">Sesi Saat Ini</p>
          <div className="flex items-center gap-3 px-2 mb-6">
            <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm shrink-0 overflow-hidden">
              {userPhoto ? (
                <img src={userPhoto} alt="Profil" className="w-full h-full object-cover" />
              ) : (
                <span className="font-sans font-bold text-slate-600 text-lg">
                  {userName ? userName.charAt(0) : "U"}
                </span>
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate">{userName}</p>
              <p className="text-xs text-slate-500 capitalize truncate">{userRole}</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 w-full rounded-lg text-sm font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            Keluar
          </button>
        </div>

      </div>
    </>
  );
}
