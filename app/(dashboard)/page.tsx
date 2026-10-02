import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { seedDefaultKategori } from '@/lib/seed-kategori'
import {
  getDashboardSummary,
  getCategoryBreakdown,
  getSpendingTrend,
  getRecentTransactions,
  getAccountsSummary,
  getMonthlyComparison,
} from '@/lib/services/dashboard'
import { DashboardContent } from '@/components/dashboard/dashboard-content'

export const revalidate = 60

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  // Fallback seeding
  const kategoriCount = await prisma.kategori.count({ where: { userId } })
  if (kategoriCount === 0) {
    await seedDefaultKategori(userId)
  }

  // Fetch semua data secara parallel
  const [
    summary,
    categoryBreakdown,
    spendingTrend,
    recentTransactions,
    accounts,
    monthlyComparison,
  ] = await Promise.all([
    getDashboardSummary(userId),
    getCategoryBreakdown(userId, 5),
    getSpendingTrend(userId, 7),
    getRecentTransactions(userId, 5),
    getAccountsSummary(userId),
    getMonthlyComparison(userId),
  ])

  return (
    <div className="container mx-auto p-4 md:p-6">
      <DashboardContent
        summary={summary}
        categoryBreakdown={categoryBreakdown}
        spendingTrend={spendingTrend}
        recentTransactions={recentTransactions}
        accounts={accounts}
        monthlyComparison={monthlyComparison}
        userName={session.user.name ?? 'Kamu'}
      />
    </div>
  )
}
