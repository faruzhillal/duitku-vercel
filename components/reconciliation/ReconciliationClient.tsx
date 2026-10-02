"use client";

import { useState } from "react";
import { CheckCheck, ArrowRight, History } from "lucide-react";
import { formatRupiah, formatTanggalIndonesia } from "@/lib/utils";
import { performReconciliation } from "@/app/actions/reconciliation";
import { TipeAkun } from "@/types";

interface AccountItem {
  id: string;
  nama: string;
  tipe: TipeAkun;
  saldoSekarang: number;
  isTitipan: boolean;
}

interface ReconciliationItem {
  id: string;
  saldoSistem: number;
  saldoRiil: number;
  selisih: number;
  catatan: string | null;
  tanggal: Date | string;
  akun: {
    nama: string;
  };
}

export function ReconciliationClient({
  accounts,
  reconciliations,
}: {
  accounts: AccountItem[];
  reconciliations: ReconciliationItem[];
}) {
  const [selectedAccountId, setSelectedAccountId] = useState(
    accounts[0]?.id || ""
  );
  const [saldoRiilInput, setSaldoRiilInput] = useState("");
  const [catatan, setCatatan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const saldoSistem = selectedAccount ? selectedAccount.saldoSekarang : 0;
  const saldoRiilNumber = saldoRiilInput !== "" ? Number(saldoRiilInput) : saldoSistem;
  const selisih = saldoRiilNumber - saldoSistem;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId) {
      setErrorMsg("Pilih akun terlebih dahulu");
      return;
    }
    if (saldoRiilInput === "") {
      setErrorMsg("Masukkan saldo fisik/riil akun");
      return;
    }
    if (!catatan.trim()) {
      setErrorMsg("Alasan rekonsiliasi / selisih wajib diisi sebagai audit trail");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await performReconciliation({
        akunId: selectedAccountId,
        saldoRiil: Number(saldoRiilInput),
        catatan: catatan.trim(),
      });

      if (!res.success) {
        throw new Error(res.error || "Gagal melakukan rekonsiliasi");
      }

      setSuccessMsg("Saldo akun berhasil disesuaikan dan dicatat ke riwayat audit!");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
          Rekonsiliasi Saldo
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
          Cocokkan saldo catatan sistem DuitKu dengan saldo asli di mutasi bank atau uang tunai fisik.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Rekonsiliasi */}
        <div className="lg:col-span-1 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCheck className="w-4 h-4 text-sky-500" />
            <span>Form Rekonsiliasi</span>
          </h2>

          {errorMsg && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 text-xs rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Pilih Akun Rekening
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => {
                  setSelectedAccountId(e.target.value);
                  setSaldoRiilInput("");
                }}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nama} ({formatRupiah(a.saldoSekarang)})
                  </option>
                ))}
              </select>
            </div>

            {/* Saldo Sistem */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-0.5">
              <span className="text-[10px] text-slate-400">Saldo Catatan Sistem</span>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {formatRupiah(saldoSistem)}
              </p>
            </div>

            {/* Input Saldo Riil */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Saldo Asli / Fisik Sekarang (Rp)
              </label>
              <input
                type="number"
                required
                value={saldoRiilInput}
                onChange={(e) => setSaldoRiilInput(e.target.value)}
                placeholder="Masukkan saldo yang ada di m-Banking/dompet"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
              />
            </div>

            {/* Selisih Indicator */}
            {saldoRiilInput !== "" && (
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  selisih === 0
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-700 dark:text-emerald-400"
                    : selisih < 0
                    ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 text-rose-700 dark:text-rose-400"
                    : "bg-sky-50 dark:bg-sky-950/30 border-sky-200 text-sky-700 dark:text-sky-400"
                }`}
              >
                <span className="font-medium">Selisih:</span>
                <span className="font-bold">
                  {selisih > 0 ? `+${formatRupiah(selisih)}` : formatRupiah(selisih)}
                </span>
              </div>
            )}

            {/* Alasan penyesuaian */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Alasan Penyesuaian (Wajib)
              </label>
              <textarea
                required
                rows={2}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: Biaya admin bulanan belum dicatat, selisih uang parkir receh"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || accounts.length === 0}
              className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-md shadow-sky-500/20"
            >
              <span>{isSubmitting ? "Memproses..." : "Sesuaikan Saldo"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Audit Trail Riwayat Rekonsiliasi */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              <span>Audit Trail Riwayat Penyesuaian</span>
            </h2>
            <span className="text-xs text-slate-400">
              {reconciliations.length} riwayat tercatat
            </span>
          </div>

          {reconciliations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Belum ada riwayat rekonsiliasi yang dilakukan.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {reconciliations.map((rec) => (
                <div key={rec.id} className="py-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {rec.akun.nama}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatTanggalIndonesia(rec.tanggal)}
                      </span>
                    </div>

                    <span
                      className={`font-bold ${
                        rec.selisih === 0
                          ? "text-slate-500"
                          : rec.selisih > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      Selisih:{" "}
                      {rec.selisih > 0
                        ? `+${formatRupiah(rec.selisih)}`
                        : formatRupiah(rec.selisih)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      Sistem: {formatRupiah(rec.saldoSistem)} ➔ Riil:{" "}
                      <strong className="text-slate-800 dark:text-slate-200">
                        {formatRupiah(rec.saldoRiil)}
                      </strong>
                    </span>
                  </div>

                  {rec.catatan && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg italic">
                      &ldquo;{rec.catatan}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
