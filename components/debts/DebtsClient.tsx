"use client";

import { useState } from "react";
import {
  HandCoins,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { formatRupiah, formatTanggalIndonesia } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { createDebt, recordDebtPayment, deleteDebt } from "@/app/actions/debts";
import { TipeUtang, StatusUtang, TipeAkun } from "@/types";

interface PaymentItem {
  id: string;
  nominal: number;
  tanggal: Date | string;
  catatan: string | null;
  akun: { nama: string };
}

interface DebtItem {
  id: string;
  namaPihak: string;
  jumlah: number;
  jumlahTerbayar: number;
  sisa: number;
  tipe: TipeUtang;
  jatuhTempo: Date | string | null;
  status: StatusUtang;
  catatan: string | null;
  pembayaran: PaymentItem[];
}

interface AccountItem {
  id: string;
  nama: string;
  tipe: TipeAkun;
  saldoSekarang: number;
  isTitipan: boolean;
}

export function DebtsClient({
  initialDebts,
  accounts,
}: {
  initialDebts: DebtItem[];
  accounts: AccountItem[];
}) {
  const [debts, setDebts] = useState<DebtItem[]>(initialDebts);
  const [activeTab, setActiveTab] = useState<TipeUtang>(TipeUtang.UTANG);

  // Add Debt Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [namaPihak, setNamaPihak] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [tipeBaru, setTipeBaru] = useState<TipeUtang>(TipeUtang.UTANG);
  const [jatuhTempo, setJatuhTempo] = useState("");
  const [catatan, setCatatan] = useState("");

  // Pay Debt Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<DebtItem | null>(null);
  const [payAkunId, setPayAkunId] = useState(accounts[0]?.id || "");
  const [payNominal, setPayNominal] = useState("");
  const [payCatatan, setPayCatatan] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const totalUtangSisa = debts
    .filter((d) => d.tipe === TipeUtang.UTANG && d.status !== StatusUtang.LUNAS)
    .reduce((sum, d) => sum + d.sisa, 0);

  const totalPiutangSisa = debts
    .filter((d) => d.tipe === TipeUtang.PIUTANG && d.status !== StatusUtang.LUNAS)
    .reduce((sum, d) => sum + d.sisa, 0);

  const filteredDebts = debts.filter((d) => d.tipe === activeTab);

  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaPihak.trim() || !jumlah || Number(jumlah) <= 0) {
      setErrorMsg("Nama pihak dan jumlah nominal wajib diisi");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await createDebt({
        namaPihak: namaPihak.trim(),
        jumlah: Number(jumlah),
        tipe: tipeBaru as any,
        jatuhTempo: jatuhTempo || null,
        catatan: catatan.trim() || undefined,
      });

      if (!res.success) throw new Error(res.error || "Gagal membuat catatan utang");

      window.location.reload();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt || !payNominal || Number(payNominal) <= 0) {
      setErrorMsg("Nominal pembayaran harus lebih dari 0");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await recordDebtPayment({
        utangId: selectedDebt.id,
        akunId: payAkunId,
        nominal: Number(payNominal),
        catatan: payCatatan.trim() || undefined,
      });

      if (!res.success) throw new Error(res.error || "Gagal memproses pembayaran");

      window.location.reload();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, nama: string) => {
    if (!confirm(`Hapus catatan utang/piutang bersama "${nama}"?`)) return;

    const res = await deleteDebt(id);
    if (res.success) {
      setDebts((prev) => prev.filter((d) => d.id !== id));
    } else {
      alert(res.error || "Gagal menghapus");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
            Utang & Piutang
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Lacak kewajiban utang Anda dan tagihan piutang pihak lain dengan audit pembayaran.
          </p>
        </div>

        <button
          onClick={() => {
            setTipeBaru(activeTab);
            setIsAddModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium text-xs md:text-sm flex items-center justify-center gap-2 shadow-md shadow-sky-500/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Catat {activeTab === TipeUtang.UTANG ? "Utang" : "Piutang"} Baru</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-rose-500 font-semibold flex items-center gap-1">
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Total Utang Saya (Kewajiban)</span>
            </span>
            <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
              {formatRupiah(totalUtangSisa)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center">
            <HandCoins className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Total Piutang Saya (Aset Tagihan)</span>
            </span>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatRupiah(totalPiutangSisa)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center">
            <HandCoins className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl max-w-sm">
        <button
          onClick={() => setActiveTab(TipeUtang.UTANG)}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === TipeUtang.UTANG
              ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Utang Saya (Pinjam ke Orang)
        </button>
        <button
          onClick={() => setActiveTab(TipeUtang.PIUTANG)}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === TipeUtang.PIUTANG
              ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Piutang Saya (Orang Pinjam ke Saya)
        </button>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredDebts.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
            Tidak ada data {activeTab === TipeUtang.UTANG ? "utang" : "piutang"}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDebts.map((item) => {
              const percent = Math.min(
                100,
                Math.round((item.jumlahTerbayar / item.jumlah) * 100)
              );
              const isLunas = item.status === StatusUtang.LUNAS;

              return (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {item.namaPihak}
                      </h3>
                      {item.catatan && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.catatan}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                          isLunas
                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
                            : item.status === StatusUtang.DIBAYAR_SEBAGIAN
                            ? "bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400"
                            : "bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {isLunas ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Lunas</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            <span>
                              {item.status === StatusUtang.DIBAYAR_SEBAGIAN
                                ? "Sebagian"
                                : "Belum Lunas"}
                            </span>
                          </>
                        )}
                      </span>

                      <button
                        onClick={() => handleDelete(item.id, item.namaPihak)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Nominal info */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Total Nominal:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatRupiah(item.jumlah)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Sisa Belum Dibayar:</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        {formatRupiah(item.sisa)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Terbayar: {formatRupiah(item.jumlahTerbayar)}</span>
                        <span>{percent}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Jatuh Tempo & Bayar Action */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {item.jatuhTempo
                          ? `Jatuh tempo: ${formatTanggalIndonesia(item.jatuhTempo)}`
                          : "Tanpa batas tempo"}
                      </span>
                    </div>

                    {!isLunas && (
                      <button
                        onClick={() => {
                          setSelectedDebt(item);
                          setPayNominal(String(item.sisa));
                          setIsPayModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium text-xs transition-colors shadow-sm"
                      >
                        {item.tipe === TipeUtang.UTANG ? "Bayar Utang" : "Terima Pembayaran"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Catat Utang / Piutang */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={`Catat ${tipeBaru === TipeUtang.UTANG ? "Utang Baru" : "Piutang Baru"}`}
        description="Dokumentasikan pihak, nominal, dan batas waktu jatuh tempo"
      >
        <form onSubmit={handleCreateDebt} className="space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Nama Pihak / Teman / Lembaga
            </label>
            <input
              type="text"
              required
              value={namaPihak}
              onChange={(e) => setNamaPihak(e.target.value)}
              placeholder="Contoh: Budi Santoso, Bank Mandiri KTA"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Nominal (Rp)
            </label>
            <input
              type="number"
              required
              min="1"
              value={jumlah}
              onChange={(e) => setJumlah(e.target.value)}
              placeholder="0"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Tanggal Jatuh Tempo (Opsional)
            </label>
            <input
              type="date"
              value={jatuhTempo}
              onChange={(e) => setJatuhTempo(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Catatan Keterangan
            </label>
            <input
              type="text"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="cth: Pinjam uang tiket konser"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-medium text-xs transition-colors shadow-md shadow-sky-500/20"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Catatan"}
          </button>
        </form>
      </Modal>

      {/* Modal Pembayaran */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title={
          selectedDebt?.tipe === TipeUtang.UTANG
            ? `Bayar Utang ke ${selectedDebt?.namaPihak}`
            : `Terima Pembayaran dari ${selectedDebt?.namaPihak}`
        }
        description="Saldo akun finansial Anda akan otomatis disesuaikan"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {selectedDebt?.tipe === TipeUtang.UTANG ? "Bayar Dari Akun" : "Masuk Ke Akun"}
            </label>
            <select
              value={payAkunId}
              onChange={(e) => setPayAkunId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nama} ({formatRupiah(a.saldoSekarang)})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Nominal Pembayaran (Rp)
            </label>
            <input
              type="number"
              required
              min="1"
              value={payNominal}
              onChange={(e) => setPayNominal(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            {selectedDebt && (
              <p className="text-[10px] text-slate-400">
                Sisa tagihan: {formatRupiah(selectedDebt.sisa)}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Catatan / Bukti Bayar (Opsional)
            </label>
            <input
              type="text"
              value={payCatatan}
              onChange={(e) => setPayCatatan(e.target.value)}
              placeholder="cth: Cicilan bulan ke-1 via transfer"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-medium text-xs transition-colors shadow-md shadow-sky-500/20"
          >
            {isSubmitting ? "Memproses..." : "Konfirmasi Pembayaran"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
