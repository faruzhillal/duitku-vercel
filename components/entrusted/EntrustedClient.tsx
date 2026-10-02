"use client";

import { useState } from "react";
import {
  ShieldAlert,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { formatRupiah, formatTanggalIndonesia } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import {
  createEntrustedFund,
  returnEntrustedFund,
  deleteEntrustedFund,
} from "@/app/actions/entrusted";
import { StatusTitipan, TipeAkun } from "@/types";

interface EntrustedFundItem {
  id: string;
  namaPenitip: string;
  nominal: number;
  tujuan: string | null;
  status: StatusTitipan;
  catatan: string | null;
  createdAt: Date | string;
  akun: {
    id: string;
    nama: string;
    saldoSekarang: number;
  };
}

interface AccountItem {
  id: string;
  nama: string;
  tipe: TipeAkun;
  saldoSekarang: number;
  isTitipan: boolean;
}

export function EntrustedClient({
  initialFunds,
  accounts,
}: {
  initialFunds: EntrustedFundItem[];
  accounts: AccountItem[];
}) {
  const [funds, setFunds] = useState<EntrustedFundItem[]>(initialFunds);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [namaPenitip, setNamaPenitip] = useState("");
  const [akunId, setAkunId] = useState(accounts[0]?.id || "");
  const [nominal, setNominal] = useState("");
  const [tujuan, setTujuan] = useState("");
  const [catatan, setCatatan] = useState("");
  const [tambahKeSaldoAkun, setTambahKeSaldoAkun] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const activeFunds = funds.filter((f) => f.status === StatusTitipan.AKTIF);
  const returnedFunds = funds.filter((f) => f.status === StatusTitipan.DIKEMBALIKAN);

  const totalTitipanAktif = activeFunds.reduce((sum, f) => sum + f.nominal, 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaPenitip.trim() || !nominal || Number(nominal) <= 0 || !akunId) {
      setErrorMsg("Nama penitip, nominal, dan akun penyimpan wajib diisi");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await createEntrustedFund({
        namaPenitip: namaPenitip.trim(),
        akunId,
        nominal: Number(nominal),
        tujuan: tujuan.trim() || undefined,
        catatan: catatan.trim() || undefined,
        tambahKeSaldoAkun,
      });

      if (!res.success) throw new Error(res.error || "Gagal mencatat titipan");

      window.location.reload();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturn = async (id: string, nama: string, jumlah: number) => {
    if (
      !confirm(
        `Konfirmasi pengembalian dana titipan sebesar ${formatRupiah(
          jumlah
        )} kepada "${nama}"? Saldo rekening terkait akan otomatis dikurangi.`
      )
    ) {
      return;
    }

    const res = await returnEntrustedFund(id, true);
    if (res.success) {
      window.location.reload();
    } else {
      alert(res.error || "Gagal mengembalikan uang titipan");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus catatan uang titipan ini?")) return;

    const res = await deleteEntrustedFund(id);
    if (res.success) {
      setFunds((prev) => prev.filter((f) => f.id !== id));
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
            Uang Titipan Orang Lain
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Fitur kunci DuitKu untuk memisahkan dana amanah orang lain agar tidak terpakai atau tercampur kekayaan pribadi.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs md:text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-500/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Terima Titipan Baru</span>
        </button>
      </div>

      {/* Warning Alert Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 dark:border-amber-900/60 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
          <p className="font-bold">Perhatian Penting:</p>
          <p>
            Uang titipan diperlakukan sebagai liabilitas/kewajiban amanah. Total saldo di bawah ini <strong>TIDAK dihitung ke dalam Net Worth Pribadi</strong> Anda.
          </p>
        </div>
      </div>

      {/* Summary Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" />
            <span>Total Uang Titipan Aktif yang Anda Pegang</span>
          </span>
          <p className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            {formatRupiah(totalTitipanAktif)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {activeFunds.length} titipan aktif menunggu dikembalikan / dialokasikan
          </p>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-6 h-6" />
        </div>
      </div>

      {/* List Titipan Aktif */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>Titipan Aktif</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-semibold">
            {activeFunds.length}
          </span>
        </h2>

        {activeFunds.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
            Tidak ada uang titipan aktif saat ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeFunds.map((fund) => (
              <div
                key={fund.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/40 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {fund.namaPenitip}
                    </h3>
                    {fund.tujuan && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tujuan: <span className="font-medium text-slate-700 dark:text-slate-300">{fund.tujuan}</span>
                      </p>
                    )}
                    {fund.catatan && (
                      <p className="text-[11px] text-slate-400 italic mt-0.5">
                        &ldquo;{fund.catatan}&rdquo;
                      </p>
                    )}
                  </div>

                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-semibold">
                    Disimpan di {fund.akun.nama}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400">Nominal Titipan</span>
                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                      {formatRupiah(fund.nominal)}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      Diterima: {formatTanggalIndonesia(fund.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReturn(fund.id, fund.namaPenitip, fund.nominal)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Kembalikan</span>
                    </button>

                    <button
                      onClick={() => handleDelete(fund.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Riwayat Titipan Sudah Dikembalikan */}
      {returnedFunds.length > 0 && (
        <div className="space-y-4 pt-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Riwayat Selesai / Dikembalikan</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
              {returnedFunds.length}
            </span>
          </h2>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
            {returnedFunds.map((fund) => (
              <div
                key={fund.id}
                className="p-4 flex items-center justify-between opacity-70 hover:opacity-100 transition-opacity"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {fund.namaPenitip}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Disimpan di {fund.akun.nama} • {fund.tujuan || "Titipan"}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs font-bold text-slate-900 dark:text-white line-through">
                    {formatRupiah(fund.nominal)}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-medium">
                    Telah dikembalikan
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Terima Titipan */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Catat Uang Titipan Baru"
        description="Dokumentasikan uang amanah pihak lain yang Anda simpan"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Nama Penitip (Pemilik Uang)
            </label>
            <input
              type="text"
              required
              value={namaPenitip}
              onChange={(e) => setNamaPenitip(e.target.value)}
              placeholder="Contoh: Ibu Kos, Ahmad F., Teman Magang"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Nominal Titipan (Rp)
            </label>
            <input
              type="number"
              required
              min="1"
              value={nominal}
              onChange={(e) => setNominal(e.target.value)}
              placeholder="0"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Disimpan di Rekening / Dompet Mana?
            </label>
            <select
              value={akunId}
              onChange={(e) => setAkunId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nama} ({a.isTitipan ? "Akun Khusus Titipan" : "Akun Pribadi"})
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Tambah ke saldo fisik akun ini?
              </p>
              <p className="text-[10px] text-slate-500">
                Centang jika Anda baru menerima uangnya secara fisik/transfer ke akun ini.
              </p>
            </div>
            <input
              type="checkbox"
              checked={tambahKeSaldoAkun}
              onChange={(e) => setTambahKeSaldoAkun(e.target.checked)}
              className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Tujuan Titipan (Opsional)
            </label>
            <input
              type="text"
              value={tujuan}
              onChange={(e) => setTujuan(e.target.value)}
              placeholder="cth: Uang patungan beli kado, titip simpan buat bayar UKT"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Catatan Tambahan
            </label>
            <input
              type="text"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="cth: Nanti diambil tanggal 1"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-medium text-xs transition-colors shadow-md shadow-amber-500/20"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Uang Titipan"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
