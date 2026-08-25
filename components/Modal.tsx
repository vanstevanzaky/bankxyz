import React, { useEffect } from "react";

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function BaseModal({ isOpen, onClose, title, children }: BaseModalProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-[scale-up_0.2s_ease-out]">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-serif text-xl text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "error" | "success" | "info";
}

export function AlertModal({ isOpen, onClose, title, message, type = "error" }: AlertModalProps) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
          type === 'error' ? 'bg-rose-100 text-rose-600' :
          type === 'success' ? 'bg-emerald-100 text-emerald-600' :
          'bg-blue-100 text-blue-600'
        }`}>
          {type === 'error' && <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
          {type === 'success' && <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
          {type === 'info' && <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>}
        </div>
        <p className="text-slate-600 mb-6">{message}</p>
        <button onClick={onClose} className="btn-primary w-full shadow-sm">
          Mengerti
        </button>
      </div>
    </BaseModal>
  );
}

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  description?: string;
  inputPlaceholder?: string;
  defaultValue?: string;
  submitText?: string;
  loading?: boolean;
}

export function PromptModal({ 
  isOpen, onClose, onSubmit, title, description, inputPlaceholder, defaultValue = "", submitText = "Simpan", loading = false 
}: PromptModalProps) {
  const [value, setValue] = React.useState(defaultValue);

  useEffect(() => {
    if (isOpen) setValue(defaultValue);
  }, [isOpen, defaultValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(value);
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {description && <p className="text-sm text-slate-500">{description}</p>}
        <div>
          <input
            type="text"
            className="input-field"
            placeholder={inputPlaceholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-outline flex-1 shadow-sm" disabled={loading}>
            Batal
          </button>
          <button type="submit" className="btn-primary flex-1 shadow-sm" disabled={loading || !value.trim()}>
            {loading ? "Memproses..." : submitText}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  variant?: "danger" | "warning" | "info";
}

export function ConfirmModal({
  isOpen, onClose, onConfirm, title, message,
  confirmText = "Ya, Lanjutkan", cancelText = "Batal",
  loading = false, variant = "danger"
}: ConfirmModalProps) {
  const colors = {
    danger: { bg: "bg-rose-100", text: "text-rose-600", btn: "bg-rose-600 hover:bg-rose-700 text-white" },
    warning: { bg: "bg-amber-100", text: "text-amber-600", btn: "bg-amber-600 hover:bg-amber-700 text-white" },
    info: { bg: "bg-blue-100", text: "text-blue-600", btn: "bg-blue-600 hover:bg-blue-700 text-white" },
  };
  const c = colors[variant];

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${c.bg} ${c.text}`}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <p className="text-slate-600 mb-6">{message}</p>
        <div className="flex gap-3 w-full pt-2">
          <button onClick={onClose} className="btn-outline flex-1 shadow-sm" disabled={loading}>
            {cancelText}
          </button>
          <button onClick={onConfirm} className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all shadow-sm ${c.btn}`} disabled={loading}>
            {loading ? "Memproses..." : confirmText}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

