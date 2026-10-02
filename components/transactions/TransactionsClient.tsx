"use client";

import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Plus,
  Trash2,
  Search,
} from "lucide-react";
import { formatRupiah, formatTanggalIndonesia } from "@/lib/utils";
import { QuickAddModal } from "@/components/dashboard/QuickAddModal";
import { deleteTransaction } from "@/app/actions/transactions";
import { TipeTransaksi, TipeAkun } from "@/types";

interface TransactionItem {
  id: string;
  nominal: number;
  tipe: TipeTransaksi;
  tanggal: Date | string;
  catatan: string | null;
  metodePembayaran: string;
  akun: { id: string; nama: string };
  akunTujuan?: { id: string; nama: string } | null;
  kategori?: { id: string; nama: string; warna: string | null } | null;
}

interface AccountItem {
  id: string;
  nama: string;
  tipe: TipeAkun;
  saldoSekarang: number;
  isTitipan: boolean;
}

interface CategoryItem {
  id: string;
  nama: string;
  tipe: TipeTransaksi;
  warna: string | null;
}

interface TransactionsClientProps {
  initialTransactions: TransactionItem[];
  accounts: AccountItem[];
  categories: CategoryItem[];
}

export function TransactionsClient({
  initialTransactions,
  accounts,
  categories,
}: TransactionsClientProps) {
  const [transactions, setTransactions] = useState<TransactionItem[]>(
    initialTransactions
  );
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterAccount, setFilterAccount] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const filteredTransactions = transactions.filter((t) => {
    if (filterType !== "ALL" && t.tipe !== filterType) return false;
    if (filterAccount !== "ALL" && t.akun.id !== filterAccount && t.akunTujuan?.id !== filterAccount) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCat = t.kategori?.nama.toLowerCase().includes(q);
      const matchNote = t.catatan?.toLowerCase().includes(q);
      const matchAccount = t.akun.nama.toLowerCase().includes(q);
      if (!matchCat && !matchNote && !matchAccount) return false;
    }
    return true;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus transaksi ini? Saldo akun akan dikembalikan otomatis.")) {
      return;
    }

    const res = await deleteTransaction(id);
    if (res.success) {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } else {
      alert(res.error || "Gagal menghapus transaksi");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
            Riwayat Transaksi
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Daftar seluruh arus kas masuk, keluar, dan transfer antar akun.
          </p>
        </div>

        <button
          onClick={() => setIsQuickAddOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium text-xs md:text-sm flex items-center justify-center gap-2 shadow-md shadow-sky-500/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Transaksi</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari transaksi, catatan, atau kategori..."
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Filter Akun */}
          <select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            className="text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="ALL">Semua Akun</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nama}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Tipe Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { label: "Semua", val: "ALL" },
            { label: "Pengeluaran", val: TipeTransaksi.PENGELUARAN },
            { label: "Pemasukan", val: TipeTransaksi.PEMASUKAN },
            { label: "Transfer", val: TipeTransaksi.TRANSFER },
          ].map((t) => (
            <button
              key={t.val}
              onClick={() => setFilterType(t.val)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filterType === t.val
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Tidak ada transaksi yang cocok dengan filter.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTransactions.map((trx) => (
              <div
                key={trx.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 ${
                      trx.tipe === TipeTransaksi.PEMASUKAN
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600"
                        : trx.tipe === TipeTransaksi.TRANSFER
                        ? "bg-sky-50 dark:bg-sky-950/40 text-sky-600"
                        : "bg-rose-50 dark:bg-rose-950/40 text-rose-600"
                    }`}
                  >
                    {trx.tipe === TipeTransaksi.PEMASUKAN ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : trx.tipe === TipeTransaksi.TRANSFER ? (
                      <ArrowLeftRight className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {trx.catatan ||
                        (trx.tipe === TipeTransaksi.TRANSFER
                          ? `Transfer ke ${trx.akunTujuan?.nama || "Akun"}`
                          : trx.kategori?.nama || "Transaksi")}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                      <span>{trx.akun.nama}</span>
                      {trx.akunTujuan && (
                        <span>➔ {trx.akunTujuan.nama}</span>
                      )}
                      <span>•</span>
                      <span>{formatTanggalIndonesia(trx.tanggal)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p
                      className={`text-sm font-bold ${
                        trx.tipe === TipeTransaksi.PEMASUKAN
                          ? "text-emerald-600 dark:text-emerald-400"
                          : trx.tipe === TipeTransaksi.TRANSFER
                          ? "text-sky-600 dark:text-sky-400"
                          : "text-slate-900 dark:text-white"
                      }`}
                    >
                      {trx.tipe === TipeTransaksi.PEMASUKAN
                        ? `+${formatRupiah(trx.nominal)}`
                        : trx.tipe === TipeTransaksi.TRANSFER
                        ? formatRupiah(trx.nominal)
                        : `-${formatRupiah(trx.nominal)}`}
                    </p>
                    <span className="text-[10px] text-slate-400 capitalize">
                      {trx.metodePembayaran.replace("_", " ").toLowerCase()}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDelete(trx.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title="Hapus Transaksi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        accounts={accounts}
        categories={categories as any}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}
