'use client'

import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatRupiah, formatPersen } from '@/lib/utils'

interface Props {
  data: {
    categoryId: string
    categoryName: string
    categoryIcon: string
    categoryColor: string
    total: number
    count: number
    percentage: number
  }[]
}

export function CategoryBreakdown({ data }: Props) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pengeluaran per Kategori</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Belum ada pengeluaran bulan ini
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pengeluaran per Kategori</CardTitle>
        <p className="text-xs text-muted-foreground">Bulan ini</p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Chart */}
          <div className="w-40 h-40 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="total"
                  nameKey="categoryName"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                >
                  {data.map((item) => (
                    <Cell key={item.categoryId} fill={item.categoryColor} />
                  ))}
                </Pie>
                <Tooltip 
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => formatRupiah(Number(value) || 0)}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex-1 w-full space-y-2">
            {data.map((item) => (
              <div key={item.categoryId} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div 
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: item.categoryColor }}
                  />
                  <span className="text-sm truncate">
                    {item.categoryIcon} {item.categoryName}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">{formatRupiah(item.total)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatPersen(item.percentage)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
