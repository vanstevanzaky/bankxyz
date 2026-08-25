"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Rekening {
  id: number;
  nomor_rekening: string;
  saldo: number;
  status: string;
}

export default function TransferForm({ rekeningList, onSuccess }: { rekeningList: Rekening[], onSuccess: () => void }) {
  const router = useRouter();
  const [fromId, setFromId] = useState("");
  const [toNomor, setToNomor] = useState("");
  const [jumlah, setJumlah] = useState<number | "">("");
  const [jumlahInput, setJumlahInput] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error", message: string } | null>(null);

  // Auto-select the first active account
  useEffect(() => {
    if (!fromId) {
      const active = rekeningList.find(r => r.status === "aktif");
      if (active) {
        setFromId(String(active.id));
      }
    }
  }, [rekeningList, fromId]);

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    if (!fromId) {
      setResult({ type: "error", message: "Rekening sumber wajib diisi." });
      setLoading(false);
      return;
    }

    try {
      const fromRek = rekeningList.find(r => r.id === Number(fromId));
      if (!fromRek) throw new Error("Rekening tidak ditemukan");

      // VULN #6 & VULN #7
      const res = await fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_rekening_id: fromRek.id,
          to_rekening_nomor: toNomor,
          jumlah: Number(jumlah),
          keterangan: keterangan
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({ type: "success", message: "Transaksi berhasil diproses." });
        setFromId("");
        setToNomor("");
        setJumlah("");
        setKeterangan("");
        onSuccess();
      } else {
        setResult({ type: "error", message: data.error || "Transaksi gagal." });
      }
    } catch {
      setResult({ type: "error", message: "Masalah koneksi sistem." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleTransfer} className="space-y-6 animate-fade-in">
      {result && (
        <div className={`p-4 text-sm font-medium rounded-lg flex items-start gap-3 ${
          result.type === "success" 
            ? "border border-emerald-200 bg-emerald-50 text-emerald-800" 
            : "border border-rose-200 bg-rose-50 text-rose-800"
        }`}>
          <span>{result.message}</span>
        </div>
      )}

      <div>
        <label className="input-label">Rekening Sumber</label>
        <select
          className="input-field cursor-pointer bg-slate-50"
          value={fromId}
          onChange={(e) => setFromId(e.target.value)}
          required
        >
          <option value="">Pilih rekening</option>
          {rekeningList.filter(r => r.status === "aktif").map(r => (
            <option key={r.id} value={r.id}>
              {r.jenis} ({r.nomor_rekening.match(/.{1,4}/g)?.join(' ')}) — Rp {Number(r.saldo).toLocaleString("id-ID")}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="input-label">Rekening Tujuan</label>
        <input
          type="text"
          className="input-field font-mono text-lg tracking-widest bg-slate-50"
          placeholder="Nomor Rekening"
          value={toNomor}
          onChange={(e) => setToNomor(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="input-label">Jumlah (IDR)</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <span className="font-sans font-semibold text-slate-500">Rp</span>
          </div>
          <input
            type="text"
            className="input-field !pl-12 font-sans text-xl font-semibold bg-slate-50"
            placeholder="0"
            value={jumlahInput}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, "");
              if (raw) {
                setJumlah(Number(raw));
                setJumlahInput(Number(raw).toLocaleString("id-ID"));
              } else {
                setJumlah(0);
                setJumlahInput("");
              }
            }}
            required
          />
        </div>
      </div>

      <div>
        <label className="input-label">Catatan / Keterangan</label>
        <input
          type="text"
          className="input-field bg-slate-50"
          placeholder="Catatan opsional"
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
        />
      </div>

      <div className="pt-4">
        <button type="submit" className="btn-primary w-full shadow-md shadow-blue-700/20" disabled={loading}>
          {loading ? "Memproses..." : "Eksekusi Transfer"}
        </button>
      </div>
    </form>
  );
}
