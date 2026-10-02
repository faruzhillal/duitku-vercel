'use client'

import { Card, CardContent } from '@/components/ui/card'
import { formatRupiah } from '@/lib/utils'

interface Props {
  summary: {
    pengeluaranHariIni: number
    pengeluaranBulanIni: number
    pemasukanBulanIni: number
  }
}

export function QuickStats({ summary }: Props) {
  const selisihBulanIni = summary.pemasukanBulanIni - summary.pengeluaranBulanIni

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Keluar Hari Ini</p>
          <p className="text-lg font-bold text-red-600">
            {formatRupiah(summary.pengeluaranHariIni)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Keluar Bulan Ini</p>
          <p className="text-lg font-bold text-red-600">
            {formatRupiah(summary.pengeluaranBulanIni)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Masuk Bulan Ini</p>
          <p className="text-lg font-bold text-green-600">
            {formatRupiah(summary.pemasukanBulanIni)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Selisih Bulan Ini</p>
          <p
            className={`text-lg font-bold ${
              selisihBulanIni >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {selisihBulanIni >= 0 ? '+' : ''}
            {formatRupiah(selisihBulanIni)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
