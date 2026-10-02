'use client'

import { TrendingUp, TrendingDown, Wallet, HandCoins, HandHeart } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatRupiah, cn } from '@/lib/utils'

interface Props {
  summary: {
    netWorth: number
    totalUangPribadi: number
    totalUtang: number
    totalPiutang: number
  }
}

export function NetWorthCard({ summary }: Props) {
  const isPositive = summary.netWorth >= 0

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Net Worth</p>
            <p
              className={cn(
                'text-3xl md:text-4xl font-bold',
                isPositive ? 'text-foreground' : 'text-destructive'
              )}
            >
              {formatRupiah(summary.netWorth)}
            </p>
          </div>
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              isPositive ? 'bg-green-500/10' : 'bg-destructive/10'
            )}
          >
            {isPositive ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-destructive" />
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-4 border-t">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Wallet className="w-3 h-3" />
              <span>Uang Pribadi</span>
            </div>
            <p className="text-sm font-semibold">
              {formatRupiah(summary.totalUangPribadi)}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <HandHeart className="w-3 h-3" />
              <span>Piutang</span>
            </div>
            <p className="text-sm font-semibold text-green-600">
              +{formatRupiah(summary.totalPiutang)}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <HandCoins className="w-3 h-3" />
              <span>Utang</span>
            </div>
            <p className="text-sm font-semibold text-destructive">
              -{formatRupiah(summary.totalUtang)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
