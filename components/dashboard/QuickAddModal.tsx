"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import { createTransaction } from "@/app/actions/transactions";
import { TipeTransaksi, MetodePembayaran } from "@/types";

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Array<{ id: string; nama: string; saldoSekarang: number; isTitipan: boolean }>;
  categories: Array<{ id: string; nama: string; tipe: TipeTransaksi; warna: string | null }>;
  initialPrompt?: string;
  onSuccess?: () => void;
}

export function QuickAddModal({
  isOpen,
  onClose,
  accounts,
  categories,
  initialPrompt = "",
  onSuccess,
}: QuickAddModalProps) {
  const [activeTab, setActiveTab] = useState<"ai" | "manual">(
    initialPrompt ? "ai" : "manual"
  );
  const [aiPrompt, setAiPrompt] = useState(initialPrompt);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form states
  const [tipe, setTipe] = useState<TipeTransaksi>(TipeTransaksi.PENGELUARAN);
  const [nominal, setNominal] = useState<string>("");
  const [akunId, setAkunId] = useState<string>(accounts[0]?.id || "");
  const [akunTujuanId, setAkunTujuanId] = useState<string>("");
  const [kategoriId, setKategoriId] = useState<string>("");
  const [metodePembayaran, setMetodePembayaran] = useState<MetodePembayaran>(
    MetodePembayaran.TUNAI
  );
  const [tanggal, setTanggal] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [catatan, setCatatan] = useState<string>("");

  const handleAiParse = async () => {
    if (!aiPrompt.trim()) return;
    setIsParsing(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal memproses parsing AI");
      }

      const p = data.data;
      if (p.amount) setNominal(String(p.amount));
      if (p.type === "income") setTipe(TipeTransaksi.PEMASUKAN);
      else if (p.type === "transfer") setTipe(TipeTransaksi.TRANSFER);
      else setTipe(TipeTransaksi.PENGELUARAN);

      if (p.note) setCatatan(p.note);
      if (p.date) setTanggal(p.date);

      // Match account by name if possible
      if (p.account) {
        const foundAcc = accounts.find((a) =>
          a.nama.toLowerCase().includes(p.account.toLowerCase())
        );
        if (foundAcc) setAkunId(foundAcc.id);
      }

      // Match category by name if possible
      if (p.category) {
        const foundCat = categories.find((c) =>
          c.nama.toLowerCase().includes(p.category.toLowerCase())
        );
        if (foundCat) setKategoriId(foundCat.id);
      }

      // Switch to confirmation form tab
      setActiveTab("manual");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan parsing AI");
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nominal || Number(nominal) <= 0) {
      setErrorMsg("Nominal harus lebih dari 0");
      return;
    }
    if (!akunId) {
      setErrorMsg("Pilih akun pembayaran");
      return;
    }
    if (tipe === TipeTransaksi.TRANSFER && !akunTujuanId) {
      setErrorMsg("Pilih akun tujuan transfer");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await createTransaction({
        akunId,
        akunTujuanId: tipe === TipeTransaksi.TRANSFER ? akunTujuanId : undefined,
        kategoriId: tipe !== TipeTransaksi.TRANSFER && kategoriId ? kategoriId : undefined,
        nominal: Number(nominal),
        tipe,
        metodePembayaran,
        tanggal,
        catatan,
      });

      if (!res.success) {
        throw new Error(res.error || "Gagal menyimpan transaksi");
      }

      // Reset
      setNominal("");
      setCatatan("");
      setAiPrompt("");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter((c) => c.tipe === tipe);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Catat Transaksi Cepat"
      description="Gunakan bahasa alami AI atau formulir instan <5 detik"
    >
      <div className="space-y-4">
        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "manual"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Formulir Cepat
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ai")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "ai"
                ? "bg-sky-500 text-white shadow-sm shadow-sky-500/30"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Natural Language</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 text-xs rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
            {errorMsg}
          </div>
        )}

        {/* AI Input Tab */}
        {activeTab === "ai" && (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Tulis transaksi apa saja:
              </label>
              <textarea
                rows={3}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Contoh: Beli kopi 35rb barusan pakai QRIS BCA, atau Dapat transfer freelance 1.5jt ke Mandiri"
                className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <button
              type="button"
              onClick={handleAiParse}
              disabled={isParsing || !aiPrompt.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-sky-500/20"
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menganalisis Transaksi...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Parse dengan AI</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Manual Form Tab */}
        {activeTab === "manual" && (
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Tipe Transaksi */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Pengeluaran", val: TipeTransaksi.PENGELUARAN, color: "hover:border-rose-400 active:bg-rose-500" },
                { label: "Pemasukan", val: TipeTransaksi.PEMASUKAN, color: "hover:border-emerald-400 active:bg-emerald-500" },
                { label: "Transfer", val: TipeTransaksi.TRANSFER, color: "hover:border-sky-400 active:bg-sky-500" },
              ].map((t) => (
                <button
                  key={t.val}
                  type="button"
                  onClick={() => setTipe(t.val)}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                    tipe === t.val
                      ? t.val === TipeTransaksi.PENGELUARAN
                        ? "bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-500/20"
                        : t.val === TipeTransaksi.PEMASUKAN
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/20"
                        : "bg-sky-500 text-white border-sky-500 shadow-sm shadow-sky-500/20"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Nominal */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Nominal (Rp)
              </label>
              <input
                type="number"
                required
                min="1"
                value={nominal}
                onChange={(e) => setNominal(e.target.value)}
                placeholder="0"
                className="w-full text-base font-bold p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Akun Asal */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {tipe === TipeTransaksi.TRANSFER ? "Dari Akun" : "Akun"}
              </label>
              <select
                value={akunId}
                onChange={(e) => setAkunId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nama} ({a.isTitipan ? "Akun Titipan" : "Pribadi"})
                  </option>
                ))}
              </select>
            </div>

            {/* Akun Tujuan jika Transfer */}
            {tipe === TipeTransaksi.TRANSFER && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Ke Akun Tujuan
                </label>
                <select
                  value={akunTujuanId}
                  onChange={(e) => setAkunTujuanId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">Pilih Akun Tujuan</option>
                  {accounts
                    .filter((a) => a.id !== akunId)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nama} ({a.isTitipan ? "Akun Titipan" : "Pribadi"})
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Kategori jika bukan Transfer */}
            {tipe !== TipeTransaksi.TRANSFER && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Kategori
                </label>
                <select
                  value={kategoriId}
                  onChange={(e) => setKategoriId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">Pilih Kategori</option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nama}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Tanggal & Metode Bayar */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Tanggal
                </label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Metode
                </label>
                <select
                  value={metodePembayaran}
                  onChange={(e) =>
                    setMetodePembayaran(e.target.value as MetodePembayaran)
                  }
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value={MetodePembayaran.TUNAI}>Tunai</option>
                  <option value={MetodePembayaran.QRIS}>QRIS</option>
                  <option value={MetodePembayaran.TRANSFER_BANK}>Transfer Bank</option>
                  <option value={MetodePembayaran.EWALLET}>E-Wallet</option>
                  <option value={MetodePembayaran.KARTU_DEBIT}>Kartu Debit</option>
                  <option value={MetodePembayaran.KARTU_KREDIT}>Kartu Kredit</option>
                  <option value={MetodePembayaran.LAINNYA}>Lainnya</option>
                </select>
              </div>
            </div>

            {/* Catatan */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Catatan (Opsional)
              </label>
              <input
                type="text"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="cth: Makan siang sama teman"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-medium text-xs transition-colors shadow-md shadow-sky-500/25"
            >
              {isSubmitting ? "Menyimpan Transaksi..." : "Simpan Transaksi"}
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
}
