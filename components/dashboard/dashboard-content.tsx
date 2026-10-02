'use client'

import Link from 'next/link'
import { Plus, Sparkles, Calculator, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { NetWorthCard } from './net-worth-card'
import { QuickStats } from './quick-stats'
import { SpendingChart } from './spending-chart'
import { CategoryBreakdown } from './category-breakdown'
import { RecentTransactions } from './recent-transactions'
import { AccountsSummary } from './accounts-summary'
import { MonthlyComparison } from './monthly-comparison'
import { EntrustedBanner } from './entrusted-banner'

interface Props {
  summary: {
    netWorth: number
    totalUangPribadi: number
    totalTitipan: number
    totalUtang: number
    totalPiutang: number
    pengeluaranHariIni: number
    pengeluaranBulanIni: number
    pemasukanBulanIni: number
    perluRekonsiliasi?: number
  }
  categoryBreakdown: {
    categoryId: string
    categoryName: string
    categoryIcon: string
    categoryColor: string
    total: number
    count: number
    percentage: number
  }[]
  spendingTrend: {
    date: string
    label: string
    income: number
    expense: number
  }[]
  recentTransactions: {
    id: string
    date: Date
    amount: number
    type: string
    note: string | null
    akun: { name: string; icon: string | null; color: string | null }
    kategori: { name: string; icon: string | null; color: string | null } | null
    akunTujuan: { name: string } | null
  }[]
  accounts: {
    id: string
    name: string
    type: string
    icon: string | null
    color: string | null
    currentBalance: number
  }[]
  monthlyComparison: {
    thisMonth: number
    lastMonth: number
    diff: number
    percentage: number
  }
  userName: string
}

export function DashboardContent({
  summary,
  categoryBreakdown,
  spendingTrend,
  recentTransactions,
  accounts,
  monthlyComparison,
  userName,
}: Props) {
  const isNewUser = accounts.length === 0

  // Onboarding untuk user baru
  if (isNewUser) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Selamat datang, {userName}!</h1>
          <p className="text-muted-foreground max-w-md">
            Mulai perjalanan keuangan kamu dengan menambahkan akun pertama.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/accounts">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Akun Pertama
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hai, {userName} 👋</h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan keuangan kamu hari ini
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="border-purple-500/30 text-purple-600 hover:bg-purple-500/10 hover:text-purple-700">
            <Link href="/transactions/ai">
              <Sparkles className="w-4 h-4 mr-1.5 text-purple-600" />
              <span>Input AI</span>
            </Link>
          </Button>
          <Button asChild className="hidden md:flex">
            <Link href="/transactions">
              <Plus className="w-4 h-4 mr-2" />
              Catat Transaksi
            </Link>
          </Button>
        </div>
      </div>

      {/* Warning uang titipan */}
      {summary.totalTitipan > 0 && (
        <EntrustedBanner total={summary.totalTitipan} />
      )}

      {/* Banner rekonsiliasi */}
      {!!summary.perluRekonsiliasi && summary.perluRekonsiliasi > 0 && (
        <Alert className="border-blue-500 bg-blue-500/10">
          <Calculator className="h-4 w-4 text-blue-600" />
          <AlertDescription className="flex items-center justify-between gap-2">
            <div className="text-sm">
              <span className="font-semibold">
                {summary.perluRekonsiliasi} akun perlu dicek
              </span>
              <p className="text-xs text-muted-foreground">
                Bandingkan saldo sistem dengan saldo asli
              </p>
            </div>
            <Link
              href="/reconciliation"
              className="text-xs font-medium shrink-0 flex items-center gap-1 hover:underline text-blue-600 dark:text-blue-400"
            >
              Cek
              <ArrowRight className="w-3 h-3" />
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Net Worth */}
      <NetWorthCard summary={summary} />

      {/* Quick Stats */}
      <QuickStats summary={summary} />

      {/* Monthly Comparison */}
      <MonthlyComparison comparison={monthlyComparison} />

      {/* Spending Chart */}
      <SpendingChart data={spendingTrend} />

      {/* Category Breakdown */}
      <CategoryBreakdown data={categoryBreakdown} />

      {/* Accounts Summary */}
      <AccountsSummary accounts={accounts} />

      {/* Recent Transactions */}
      <RecentTransactions transaksi={recentTransactions} />

      {/* Floating button mobile */}
      <Button
        asChild
        size="icon"
        className="fixed bottom-20 right-4 md:hidden w-14 h-14 rounded-full shadow-lg z-40"
      >
        <Link href="/transactions">
          <Plus className="w-6 h-6" />
        </Link>
      </Button>
    </div>
  )
}
