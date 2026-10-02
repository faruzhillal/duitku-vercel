'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatRupiah, formatTanggal, cn } from '@/lib/utils'

interface Props {
  transaksi: {
    id: string
    date: Date
    amount: number
    type: string
    note: string | null
    akun: { name: string; icon: string | null; color: string | null }
    kategori: { name: string; icon: string | null; color: string | null } | null
    akunTujuan: { name: string } | null
  }[]
}

export function RecentTransactions({ transaksi }: Props) {
  if (transaksi.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transaksi Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Belum ada transaksi
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Transaksi Terakhir</CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link href="/transactions">
            Lihat Semua
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-1">
        {transaksi.map((t) => {
          const isIncome = t.type === 'income'
          const isExpense = t.type === 'expense'
          const isTransfer = t.type === 'transfer'
          const sign = isIncome ? '+' : isExpense ? '-' : ''
          const colorClass = isIncome 
            ? 'text-green-600' 
            : isExpense 
              ? 'text-red-600' 
              : 'text-blue-600'

          return (
            <Link
              key={t.id}
              href="/transactions"
              className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div 
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
                  style={{ 
                    backgroundColor: `${t.kategori?.color || '#64748b'}20`
                  }}
                >
                  {isTransfer ? '🔄' : (t.kategori?.icon || '📝')}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {isTransfer 
                      ? `${t.akun.name} → ${t.akunTujuan?.name}` 
                      : (t.kategori?.name || t.note || 'Transaksi')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTanggal(t.date, 'dd MMM')} • {t.akun.name}
                  </p>
                </div>
              </div>
              <p className={cn('text-sm font-semibold shrink-0', colorClass)}>
                {sign}{formatRupiah(t.amount)}
              </p>
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}
