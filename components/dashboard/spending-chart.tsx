'use client'

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatRupiah } from '@/lib/utils'

interface Props {
  data: {
    date: string
    label: string
    income: number
    expense: number
  }[]
}

export function SpendingChart({ data }: Props) {
  const totalIncome = data.reduce((s, d) => s + d.income, 0)
  const totalExpense = data.reduce((s, d) => s + d.expense, 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">7 Hari Terakhir</CardTitle>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">
              Masuk: {formatRupiah(totalIncome)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-muted-foreground">
              Keluar: {formatRupiah(totalExpense)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
              <XAxis 
                dataKey="label" 
                fontSize={11}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                fontSize={11}
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(v: number) =>
                  v >= 1000000 
                    ? `${(v / 1000000).toFixed(1)}jt` 
                    : v >= 1000 
                      ? `${(v / 1000).toFixed(0)}rb`
                      : String(v)
                }
              />
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
              <Bar 
                dataKey="income" 
                fill="#22c55e" 
                radius={[4, 4, 0, 0]} 
                name="Masuk"
              />
              <Bar 
                dataKey="expense" 
                fill="#ef4444" 
                radius={[4, 4, 0, 0]} 
                name="Keluar"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
