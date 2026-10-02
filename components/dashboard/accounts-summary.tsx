'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatRupiah } from '@/lib/utils'
import { TIPE_AKUN_OPTIONS } from '@/lib/constants'

interface Props {
  accounts: {
    id: string
    name: string
    type: string
    icon: string | null
    color: string | null
    currentBalance: number
  }[]
}

export function AccountsSummary({ accounts }: Props) {
  if (accounts.length === 0) return null

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Akun Saya</CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link href="/accounts">
            Kelola
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {accounts.map((a) => {
          const tipe = TIPE_AKUN_OPTIONS.find((t) => t.value === a.type)
          return (
            <Link
              key={a.id}
              href={`/accounts/${a.id}`}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
                  style={{ backgroundColor: `${a.color || '#0ea5e9'}20` }}
                >
                  {a.icon || tipe?.icon || '💰'}
                </div>
                <div>
                  <p className="text-sm font-medium">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{tipe?.label || a.type}</p>
                </div>
              </div>
              <p className="text-sm font-semibold">
                {formatRupiah(a.currentBalance)}
              </p>
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}
