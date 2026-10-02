'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatRupiah, formatPersen, cn } from '@/lib/utils'

interface Props {
  comparison: {
    thisMonth: number
    lastMonth: number
    diff: number
    percentage: number
  }
}

export function MonthlyComparison({ comparison }: Props) {
  const isUp = comparison.diff > 0
  const isSame = comparison.diff === 0

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Pengeluaran vs Bulan Lalu
            </p>
            <p className="text-lg font-bold">
              {formatRupiah(comparison.thisMonth)}
            </p>
            <p className="text-xs text-muted-foreground">
              Bulan lalu: {formatRupiah(comparison.lastMonth)}
            </p>
          </div>
          <div
            className={cn(
              'flex items-center gap-1 px-3 py-2 rounded-lg',
              isSame
                ? 'bg-muted'
                : isUp
                ? 'bg-red-500/10'
                : 'bg-green-500/10'
            )}
          >
            {isSame ? (
              <span className="text-xs font-semibold">Sama</span>
            ) : (
              <>
                {isUp ? (
                  <TrendingUp className="w-4 h-4 text-red-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-green-600" />
                )}
                <span
                  className={cn(
                    'text-sm font-bold',
                    isUp ? 'text-red-600' : 'text-green-600'
                  )}
                >
                  {isUp ? '+' : ''}
                  {formatPersen(comparison.percentage)}
                </span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
