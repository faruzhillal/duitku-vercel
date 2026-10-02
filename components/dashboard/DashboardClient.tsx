"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Wallet,
  ShieldAlert,
  HandCoins,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Plus,
  ChevronRight,
  Building2,
  Smartphone,
  CreditCard,
  Banknote,
  Calendar,
} from "lucide-react";
import { formatRupiah, formatTanggalIndonesia } from "@/lib/utils";
import { AIQuickBar } from "./AIQuickBar";
import { QuickAddModal } from "./QuickAddModal";
import { AIChatDrawer } from "./AIChatDrawer";
import { TipeTransaksi, TipeAkun } from "@/types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface AccountData {
  id: string;
  nama: string;
  tipe: TipeAkun;
  saldoSekarang: number;
  isTitipan: boolean;
  mataUang: string;
}

interface CategoryData {
  id: string;
  nama: string;
  tipe: TipeTransaksi;
  warna: string | null;
}

interface TransactionData {
  id: string;
  nominal: number;
  tipe: TipeTransaksi;
  tanggal: Date | string;
  catatan: string | null;
  akun: { nama: string };
  akunTujuan?: { nama: string } | null;
  kategori?: { nama: string; warna: string | null } | null;
}

interface DashboardClientProps {
  initialData: {
    netWorthRiil: number;
    saldoAkunPribadi: number;
    totalUangTitipan: number;
    totalPiutang: number;
    totalUtang: number;
    todayExpense: number;
    monthExpense: number;
    monthIncome: number;
    accounts: AccountData[];
    recentTransactions: TransactionData[];
    categoryBreakdown: { nama: string; warna: string; total: number }[];
    trendDays: { displayDate: string; pengeluaran: number; pemasukan: number }[];
  } | null;
  categories: CategoryData[];
  userName?: string;
}

export function DashboardClient({
  initialData,
  categories,
  userName = "Pengguna",
}: DashboardClientProps) {
  const data = initialData;
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddPrompt, setQuickAddPrompt] = useState("");

  const handleOpenWithPrompt = (prompt: string) => {
    setQuickAddPrompt(prompt);
    setIsQuickAddOpen(true);
  };

  const getAccountIcon = (tipe: TipeAkun) => {
    const t = String(tipe || "").toLowerCase();
    switch (t) {
      case "bank":
        return <Building2 className="w-4 h-4 text-sky-500" />;
      case "ewallet":
        return <Smartphone className="w-4 h-4 text-indigo-500" />;
      case "emoney":
        return <CreditCard className="w-4 h-4 text-amber-500" />;
      default:
        return <Banknote className="w-4 h-4 text-emerald-500" />;
    }
  };

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        Memuat data dashboard...
      </div>
    );
  }

  const netUtang = data.totalPiutang - data.totalUtang;

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
            Halo, {userName}! 👋
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Berikut ringkasan posisi keuangan dan uang titipan Anda hari ini.
          </p>
        </div>

        <button
          onClick={() => {
            setQuickAddPrompt("");
            setIsQuickAddOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium text-xs md:text-sm flex items-center justify-center gap-2 shadow-md shadow-sky-500/25 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Transaksi</span>
        </button>
      </div>

      {/* AI Quick Bar */}
      <AIQuickBar onOpenQuickAddWithPrompt={handleOpenWithPrompt} />

      {/* Grid 4 Kartu Metrik Utama */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Net Worth Riil */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Net Worth Riil</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-lg md:text-2xl font-bold text-emerald-600 dark:text-emerald-400 truncate">
            {formatRupiah(data.netWorthRiil)}
          </p>
          <p className="text-[10px] text-slate-400">
            Aset Pribadi + Piutang - Utang
          </p>
        </div>

        {/* Uang Pribadi */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Uang Pribadi</span>
            <Wallet className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white truncate">
            {formatRupiah(data.saldoAkunPribadi)}
          </p>
          <p className="text-[10px] text-slate-400">
            Di semua rekening & dompet
          </p>
        </div>

        {/* Uang Titipan (Special alert highlight) */}
        <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-900/60 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400">
            <span className="font-semibold flex items-center gap-1">
              <span>Uang Titipan</span>
            </span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-lg md:text-2xl font-bold text-amber-600 dark:text-amber-400 truncate">
            {formatRupiah(data.totalUangTitipan)}
          </p>
          <p className="text-[10px] text-amber-600/80 dark:text-amber-400/70 font-medium">
            Bukan milikmu (Liabilitas)
          </p>
        </div>

        {/* Utang Bersih */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Piutang − Utang</span>
            <HandCoins className="w-4 h-4 text-purple-500" />
          </div>
          <p
            className={`text-lg md:text-2xl font-bold truncate ${
              netUtang >= 0
                ? "text-slate-900 dark:text-white"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {formatRupiah(netUtang)}
          </p>
          <p className="text-[10px] text-slate-400 truncate">
            Piutang: {formatRupiah(data.totalPiutang)} | Utang:{" "}
            {formatRupiah(data.totalUtang)}
          </p>
        </div>
      </div>

      {/* Mini Bar Arus Kas Bulan Ini */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 p-3 md:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="text-center md:text-left space-y-0.5">
          <span className="text-[11px] text-slate-400">Hari Ini</span>
          <p className="text-xs md:text-sm font-bold text-rose-500 truncate">
            -{formatRupiah(data.todayExpense)}
          </p>
        </div>
        <div className="text-center md:text-left space-y-0.5 border-x border-slate-100 dark:border-slate-800 px-2 md:px-4">
          <span className="text-[11px] text-slate-400">Keluar Bulan Ini</span>
          <p className="text-xs md:text-sm font-bold text-rose-600 dark:text-rose-400 truncate">
            -{formatRupiah(data.monthExpense)}
          </p>
        </div>
        <div className="text-center md:text-left space-y-0.5">
          <span className="text-[11px] text-slate-400">Masuk Bulan Ini</span>
          <p className="text-xs md:text-sm font-bold text-emerald-600 dark:text-emerald-400 truncate">
            +{formatRupiah(data.monthIncome)}
          </p>
        </div>
      </div>

      {/* Grafik Tren & Breakdown Kategori */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend 7 Hari */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-500" />
              <span>Arus Kas 7 Hari Terakhir</span>
            </h3>
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Masuk
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Keluar
              </span>
            </div>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.trendDays} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="displayDate" tick={{ fontSize: 10 }} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={(val) =>
                    val >= 1000000
                      ? `${(val / 1000000).toFixed(0)}jt`
                      : val >= 1000
                      ? `${(val / 1000).toFixed(0)}rb`
                      : val
                  }
                />
                <Tooltip
                  formatter={(val: unknown) => [
                    formatRupiah(Number(val ?? 0)),
                    "",
                  ]}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pengeluaran per Kategori */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Kategori Terbesar
            </h3>
            <span className="text-[10px] text-slate-400">Bulan Ini</span>
          </div>

          {data.categoryBreakdown.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              Belum ada data pengeluaran bulan ini.
            </p>
          ) : (
            <div className="space-y-3">
              {data.categoryBreakdown.slice(0, 4).map((cat, idx) => {
                const percent =
                  data.monthExpense > 0
                    ? Math.round((cat.total / data.monthExpense) * 100)
                    : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {cat.nama}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatRupiah(cat.total)}{" "}
                        <span className="text-[10px] font-normal text-slate-400">
                          ({percent}%)
                        </span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: cat.warna || "#0ea5e9",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Akun & Transaksi Terakhir */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Akun Saldo */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Akun & Saldo
            </h3>
            <Link
              href="/accounts"
              className="text-xs font-semibold text-sky-500 hover:text-sky-600 flex items-center gap-0.5"
            >
              <span>Semua</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {data.accounts.length === 0 ? (
            <div className="p-4 text-center rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-400 space-y-2">
              <p>Belum ada akun terdaftar.</p>
              <Link
                href="/accounts"
                className="inline-block px-3 py-1.5 rounded-lg bg-sky-500 text-white font-medium text-xs"
              >
                + Tambah Akun
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {data.accounts.slice(0, 5).map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                      {getAccountIcon(acc.tipe)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">
                        {acc.nama}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {acc.isTitipan ? "Akun Titipan" : acc.tipe}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      acc.isTitipan
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {formatRupiah(acc.saldoSekarang)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transaksi Terkini */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Transaksi Terakhir
            </h3>
            <Link
              href="/transactions"
              className="text-xs font-semibold text-sky-500 hover:text-sky-600 flex items-center gap-0.5"
            >
              <span>Riwayat Lengkap</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {data.recentTransactions.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              Belum ada riwayat transaksi.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.recentTransactions.map((trx) => (
                <div
                  key={trx.id}
                  className="py-2.5 flex items-center justify-between"
                >
                  {(() => {
                    const isIncome = String(trx.tipe).toLowerCase() === "income" || trx.tipe === "PEMASUKAN";
                    const isTransfer = String(trx.tipe).toLowerCase() === "transfer" || trx.tipe === "TRANSFER";
                    return (
                      <>
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-xl shrink-0 ${
                              isIncome
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600"
                                : isTransfer
                                ? "bg-sky-50 dark:bg-sky-950/40 text-sky-600"
                                : "bg-rose-50 dark:bg-rose-950/40 text-rose-600"
                            }`}
                          >
                            {isIncome ? (
                              <ArrowDownLeft className="w-4 h-4" />
                            ) : isTransfer ? (
                              <ArrowLeftRight className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-900 dark:text-white">
                              {trx.catatan ||
                                (isTransfer
                                  ? `Transfer ke ${trx.akunTujuan?.nama || "Akun"}`
                                  : trx.kategori?.nama || "Transaksi")}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {trx.akun.nama} •{" "}
                              {formatTanggalIndonesia(trx.tanggal)}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-xs font-bold ${
                            isIncome
                              ? "text-emerald-600 dark:text-emerald-400"
                              : isTransfer
                              ? "text-sky-600 dark:text-sky-400"
                              : "text-slate-900 dark:text-white"
                          }`}
                        >
                          {isIncome
                            ? `+${formatRupiah(trx.nominal)}`
                            : isTransfer
                            ? formatRupiah(trx.nominal)
                            : `-${formatRupiah(trx.nominal)}`}
                        </span>
                      </>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        accounts={data.accounts}
        categories={categories as any}
        initialPrompt={quickAddPrompt}
        onSuccess={() => {
          // Refresh window to re-fetch Server Component data
          window.location.reload();
        }}
      />

      {/* AI Advisor Chatbot Drawer */}
      <AIChatDrawer
        contextData={{
          netWorthRiil: data.netWorthRiil,
          saldoAkunPribadi: data.saldoAkunPribadi,
          totalUangTitipan: data.totalUangTitipan,
          totalPiutang: data.totalPiutang,
          totalUtang: data.totalUtang,
          todayExpense: data.todayExpense,
          monthExpense: data.monthExpense,
          monthIncome: data.monthIncome,
        }}
      />
    </div>
  );
}
