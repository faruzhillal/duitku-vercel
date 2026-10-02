import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays } from 'date-fns'
import { toZonedTime, fromZonedTime, format } from 'date-fns-tz'
import { getTotalTitipanAktif } from '@/lib/titipan-helpers'
import { getRekonsiliasiStatus } from '@/lib/rekonsiliasi-helpers'

const TIMEZONE = 'Asia/Jakarta'

/**
 * Helper: convert date ke timezone Jakarta
 */
function toJakarta(date: Date): Date {
  return toZonedTime(date, TIMEZONE)
}

/**
 * Ambil range tanggal dalam timezone Jakarta
 */
function getDateRangeJakarta() {
  const now = new Date()
  const jakartaNow = toJakarta(now)

  const todayStart = fromZonedTime(startOfDay(jakartaNow), TIMEZONE)
  const todayEnd = fromZonedTime(endOfDay(jakartaNow), TIMEZONE)
  const monthStart = fromZonedTime(startOfMonth(jakartaNow), TIMEZONE)
  const monthEnd = fromZonedTime(endOfMonth(jakartaNow), TIMEZONE)
  const last7Days = fromZonedTime(startOfDay(subDays(jakartaNow, 6)), TIMEZONE)

  return { todayStart, todayEnd, monthStart, monthEnd, last7Days }
}

/**
 * 1. Get Dashboard Summary (net worth, totals)
 */
export async function getDashboardSummary(userId: string) {
  const { todayStart, todayEnd, monthStart, monthEnd } = getDateRangeJakarta()

  // Parallel query
  const [
    akunAggregate,
    titipanAggregate,
    titipanSummary,
    utangAggregate,
    piutangAggregate,
    pengeluaranHariIni,
    pengeluaranBulanIni,
    pemasukanBulanIni,
  ] = await Promise.all([
    // Total uang pribadi (exclude titipan)
    prisma.akun.aggregate({
      where: { userId, isEntrusted: false },
      _sum: { currentBalance: true },
    }),

    // Total uang titipan akun (bukan aset — hanya info)
    prisma.akun.aggregate({
      where: { userId, isEntrusted: true },
      _sum: { currentBalance: true },
    }),

    // Total uang titipan dari model UangTitipan aktif (jika ada)
    getTotalTitipanAktif(userId),

    // Total utang (payable) yang belum lunas
    prisma.utang.aggregate({
      where: {
        userId,
        tipe: 'UTANG',
        status: { in: ['BELUM_LUNAS', 'DIBAYAR_SEBAGIAN'] },
      },
      _sum: { jumlah: true, jumlahTerbayar: true },
    }),

    // Total piutang (receivable) yang belum lunas
    prisma.utang.aggregate({
      where: {
        userId,
        tipe: 'PIUTANG',
        status: { in: ['BELUM_LUNAS', 'DIBAYAR_SEBAGIAN'] },
      },
      _sum: { jumlah: true, jumlahTerbayar: true },
    }),

    // Pengeluaran hari ini
    prisma.transaksi.aggregate({
      where: {
        userId,
        type: 'expense',
        date: { gte: todayStart, lte: todayEnd },
      },
      _sum: { amount: true },
    }),

    // Pengeluaran bulan ini
    prisma.transaksi.aggregate({
      where: {
        userId,
        type: 'expense',
        date: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amount: true },
    }),

    // Pemasukan bulan ini
    prisma.transaksi.aggregate({
      where: {
        userId,
        type: 'income',
        date: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amount: true },
    }),
  ])

  const totalUangPribadi = Number(akunAggregate._sum.currentBalance ?? 0)
  const totalTitipan = Math.max(
    Number(titipanAggregate._sum.currentBalance ?? 0),
    titipanSummary.total
  )
  const totalUtang = Math.max(
    0,
    Number(utangAggregate._sum.jumlah ?? 0) - Number(utangAggregate._sum.jumlahTerbayar ?? 0)
  )
  const totalPiutang = Math.max(
    0,
    Number(piutangAggregate._sum.jumlah ?? 0) - Number(piutangAggregate._sum.jumlahTerbayar ?? 0)
  )
  const netWorth = totalUangPribadi + totalPiutang - totalUtang

  const rekonStatus = await getRekonsiliasiStatus(userId)
  const perluRekon = rekonStatus.filter(
    (a) => a.status === 'belum-pernah' || a.status === 'terlambat'
  ).length

  return {
    netWorth,
    totalUangPribadi,
    totalTitipan,
    totalUtang,
    totalPiutang,
    pengeluaranHariIni: Number(pengeluaranHariIni._sum.amount ?? 0),
    pengeluaranBulanIni: Number(pengeluaranBulanIni._sum.amount ?? 0),
    pemasukanBulanIni: Number(pemasukanBulanIni._sum.amount ?? 0),
    perluRekonsiliasi: perluRekon,
  }
}

/**
 * 2. Get Category Breakdown (GROUP BY kategori)
 */
export async function getCategoryBreakdown(userId: string, limit = 5) {
  const { monthStart, monthEnd } = getDateRangeJakarta()

  const result = await prisma.transaksi.groupBy({
    by: ['categoryId'],
    where: {
      userId,
      type: 'expense',
      date: { gte: monthStart, lte: monthEnd },
      categoryId: { not: null },
    },
    _sum: { amount: true },
    _count: { id: true },
    orderBy: { _sum: { amount: 'desc' } },
    take: limit,
  })

  // Fetch kategori details
  const categoryIds = result
    .map((r) => r.categoryId)
    .filter((id): id is string => id !== null)

  const kategoris = await prisma.kategori.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true, icon: true, color: true },
  })

  const kategoriMap = new Map(kategoris.map((k) => [k.id, k]))

  // Hitung total untuk percentage
  const total = result.reduce(
    (sum, r) => sum + Number(r._sum.amount ?? 0),
    0
  )

  return result.map((r) => {
    const kategori = kategoriMap.get(r.categoryId!)
    const amount = Number(r._sum.amount ?? 0)
    return {
      categoryId: r.categoryId!,
      categoryName: kategori?.name ?? 'Tanpa Kategori',
      categoryIcon: kategori?.icon ?? '📝',
      categoryColor: kategori?.color ?? '#64748b',
      total: amount,
      count: r._count.id,
      percentage: total > 0 ? (amount / total) * 100 : 0,
    }
  })
}

/**
 * 3. Get Spending Trend (7 hari terakhir)
 */
export async function getSpendingTrend(userId: string, days = 7) {
  const jakartaNow = toJakarta(new Date())
  const startDate = fromZonedTime(
    startOfDay(subDays(jakartaNow, days - 1)),
    TIMEZONE
  )
  const endDate = fromZonedTime(endOfDay(jakartaNow), TIMEZONE)

  const transaksi = await prisma.transaksi.findMany({
    where: {
      userId,
      type: { in: ['income', 'expense'] },
      date: { gte: startDate, lte: endDate },
    },
    select: { date: true, amount: true, type: true },
  })

  // Group by date di JS (bukan di SQL, karena per-hari + timezone)
  const daysArray: { date: string; label: string; income: number; expense: number }[] = []

  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(jakartaNow, i)
    const dateStr = format(date, 'yyyy-MM-dd', { timeZone: TIMEZONE })
    const label = date.toLocaleDateString('id-ID', {
      timeZone: TIMEZONE,
      weekday: 'short',
      day: 'numeric',
    })
    daysArray.push({ date: dateStr, label, income: 0, expense: 0 })
  }

  for (const t of transaksi) {
    const dateStr = format(t.date, 'yyyy-MM-dd', { timeZone: TIMEZONE })
    const day = daysArray.find((d) => d.date === dateStr)
    if (!day) continue
    const amt = Number(t.amount)
    if (t.type === 'income') day.income += amt
    else day.expense += amt
  }

  return daysArray
}

/**
 * 4. Get Recent Transactions
 */
export async function getRecentTransactions(userId: string, limit = 5) {
  const transaksi = await prisma.transaksi.findMany({
    where: { userId },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    take: limit,
    include: {
      akun: { select: { id: true, name: true, icon: true, color: true } },
      kategori: { select: { id: true, name: true, icon: true, color: true } },
      akunTujuan: { select: { id: true, name: true } },
    },
  })

  return transaksi.map((t) => ({
    ...t,
    amount: Number(t.amount),
  }))
}

/**
 * 5. Get Accounts Summary
 */
export async function getAccountsSummary(userId: string) {
  const akun = await prisma.akun.findMany({
    where: { userId, isEntrusted: false },
    orderBy: { currentBalance: 'desc' },
    select: {
      id: true,
      name: true,
      type: true,
      icon: true,
      color: true,
      currentBalance: true,
    },
  })

  return akun.map((a) => ({
    ...a,
    currentBalance: Number(a.currentBalance),
  }))
}

/**
 * 6. Get Monthly Comparison (bulan ini vs bulan lalu)
 */
export async function getMonthlyComparison(userId: string) {
  const jakartaNow = toJakarta(new Date())
  const thisMonthStart = fromZonedTime(startOfMonth(jakartaNow), TIMEZONE)
  const thisMonthEnd = fromZonedTime(endOfMonth(jakartaNow), TIMEZONE)

  const lastMonthDate = subDays(thisMonthStart, 1)
  const lastMonthJakarta = toJakarta(lastMonthDate)
  const lastMonthStart = fromZonedTime(startOfMonth(lastMonthJakarta), TIMEZONE)
  const lastMonthEnd = fromZonedTime(endOfMonth(lastMonthJakarta), TIMEZONE)

  const [thisMonth, lastMonth] = await Promise.all([
    prisma.transaksi.aggregate({
      where: {
        userId,
        type: 'expense',
        date: { gte: thisMonthStart, lte: thisMonthEnd },
      },
      _sum: { amount: true },
    }),
    prisma.transaksi.aggregate({
      where: {
        userId,
        type: 'expense',
        date: { gte: lastMonthStart, lte: lastMonthEnd },
      },
      _sum: { amount: true },
    }),
  ])

  const thisMonthTotal = Number(thisMonth._sum.amount ?? 0)
  const lastMonthTotal = Number(lastMonth._sum.amount ?? 0)
  const diff = thisMonthTotal - lastMonthTotal
  const percentage = lastMonthTotal > 0 ? (diff / lastMonthTotal) * 100 : 0

  return {
    thisMonth: thisMonthTotal,
    lastMonth: lastMonthTotal,
    diff,
    percentage,
  }
}
