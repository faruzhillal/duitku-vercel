"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { StatusUtang } from "@/app/generated/prisma";
import { startOfDay, startOfMonth, subDays, format } from "date-fns";

export async function getDashboardData() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;
  const now = new Date();
  const todayStart = startOfDay(now);
  const monthStart = startOfMonth(now);
  const sevenDaysAgo = subDays(now, 6);

  // 1. Fetch Accounts
  const accounts = await prisma.akun.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  // 2. Fetch Debts (Utang & Piutang)
  const debts = await prisma.utang.findMany({
    where: {
      userId,
      status: { in: [StatusUtang.BELUM_LUNAS, StatusUtang.DIBAYAR_SEBAGIAN] },
    },
  });

  // 3. Fetch Entrusted Funds (Uang Titipan Aktif)
  const entrustedFunds = await prisma.uangTitipan.findMany({
    where: { userId, status: { in: ["held", "borrowed"] } },
  });

  // 4. Fetch Recent Transactions
  const recentTransactions = await prisma.transaksi.findMany({
    where: { userId },
    include: {
      akun: true,
      akunTujuan: true,
      kategori: true,
    },
    orderBy: { date: "desc" },
    take: 6,
  });

  // 5. Fetch Transactions this month for analytics
  const monthTransactions = await prisma.transaksi.findMany({
    where: {
      userId,
      date: { gte: monthStart },
    },
    include: { kategori: true },
  });

  // 6. Fetch Transactions last 7 days for trend
  const weeklyTransactions = await prisma.transaksi.findMany({
    where: {
      userId,
      date: { gte: startOfDay(sevenDaysAgo) },
    },
  });

  // --- CALCULATIONS ---
  // Aset Pribadi: Saldo akun yang BUKAN akun titipan
  const saldoAkunPribadi = accounts
    .filter((a) => !a.isEntrusted)
    .reduce((sum, a) => sum + Number(a.currentBalance), 0);

  // Total Uang Titipan Aktif (Liabilitas)
  const totalUangTitipan = entrustedFunds.reduce(
    (sum, f) => sum + Number(f.amount),
    0
  );

  // Piutang (Uang kita di orang lain)
  const totalPiutang = debts
    .filter((d) => d.tipe === "PIUTANG")
    .reduce((sum, d) => sum + (Number(d.jumlah) - Number(d.jumlahTerbayar)), 0);

  // Utang (Kewajiban bayar ke orang lain)
  const totalUtang = debts
    .filter((d) => d.tipe === "UTANG")
    .reduce((sum, d) => sum + (Number(d.jumlah) - Number(d.jumlahTerbayar)), 0);

  // Net Worth Riil = Saldo Akun Pribadi + Piutang - Utang
  const netWorthRiil = saldoAkunPribadi + totalPiutang - totalUtang;

  // Pengeluaran Hari Ini
  const todayExpense = monthTransactions
    .filter(
      (t) =>
        t.type === "expense" &&
        new Date(t.date) >= todayStart
    )
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Pengeluaran Bulan Ini
  const monthExpense = monthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Pemasukan Bulan Ini
  const monthIncome = monthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Pengeluaran per Kategori (Bulan ini)
  const categoryMap = new Map<string, { nama: string; warna: string; total: number }>();
  for (const t of monthTransactions) {
    if (t.type === "expense") {
      const catName = t.kategori?.name || "Lain-lain";
      const catColor = t.kategori?.color || "#94a3b8";
      const existing = categoryMap.get(catName);
      if (existing) {
        existing.total += Number(t.amount);
      } else {
        categoryMap.set(catName, {
          nama: catName,
          warna: catColor,
          total: Number(t.amount),
        });
      }
    }
  }
  const categoryBreakdown = Array.from(categoryMap.values()).sort(
    (a, b) => b.total - a.total
  );

  // 7-day trend array
  const trendDays: { date: string; displayDate: string; pengeluaran: number; pemasukan: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = subDays(now, i);
    const dayStr = format(day, "yyyy-MM-dd");
    const displayDate = format(day, "dd MMM");

    const dayTrx = weeklyTransactions.filter(
      (t) => format(new Date(t.date), "yyyy-MM-dd") === dayStr
    );

    const pengeluaran = dayTrx
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const pemasukan = dayTrx
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    trendDays.push({ date: dayStr, displayDate, pengeluaran, pemasukan });
  }

  return {
    netWorthRiil,
    saldoAkunPribadi,
    totalUangTitipan,
    totalPiutang,
    totalUtang,
    todayExpense,
    monthExpense,
    monthIncome,
    accounts: accounts.map((a) => ({
      ...a,
      nama: a.name,
      tipe: a.type as any,
      saldoAwal: Number(a.initialBalance),
      saldoSekarang: Number(a.currentBalance),
      mataUang: a.currency || "IDR",
      isTitipan: a.isEntrusted,
    })),
    recentTransactions: recentTransactions.map((t) => ({
      ...t,
      nominal: Number(t.amount),
      tipe: t.type,
      tanggal: t.date,
      akun: {
        ...t.akun,
        nama: t.akun.name,
        saldoAwal: Number(t.akun.initialBalance),
        saldoSekarang: Number(t.akun.currentBalance),
      },
      akunTujuan: t.akunTujuan
        ? {
            ...t.akunTujuan,
            nama: t.akunTujuan.name,
            saldoAwal: Number(t.akunTujuan.initialBalance),
            saldoSekarang: Number(t.akunTujuan.currentBalance),
          }
        : null,
      kategori: t.kategori
        ? {
            ...t.kategori,
            nama: t.kategori.name,
            warna: t.kategori.color,
            ikon: t.kategori.icon,
          }
        : null,
    })),
    categoryBreakdown,
    trendDays,
  };
}
