'use client'

import Link from 'next/link'
import { MoreVertical, Pencil, Trash2, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DeleteUtangDialog } from './delete-utang-dialog'
import { formatRupiah } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
  hitungTotalDibayar,
  hitungSisa,
  hitungProgress,
  getDueStatus,
  getDueStatusLabel,
} from '@/lib/utang-helpers'
import type { UtangWithPayments } from '@/types'

interface Props {
  utang: UtangWithPayments
  onEdit: () => void
}

export function UtangItem({ utang, onEdit }: Props) {
  const isReceivable = utang.type === 'receivable'
  const totalDibayar = hitungTotalDibayar(utang.pembayaran)
  const sisa = hitungSisa(utang.amount, utang.pembayaran)
  const progress = hitungProgress(utang.amount, totalDibayar)
  const dueStatus = getDueStatus(utang.dueDate, utang.status)
  const dueLabel = getDueStatusLabel(dueStatus, utang.dueDate)

  // Badge status
  const statusBadge = {
    unpaid: { label: 'Belum Bayar', variant: 'destructive' as const },
    partial: { label: 'Sebagian', variant: 'default' as const },
    paid: { label: 'Lunas', variant: 'secondary' as const },
  }[utang.status] || { label: 'Belum Bayar', variant: 'destructive' as const }

  // Badge due
  const dueBadgeColor = {
    terlambat: 'border-destructive text-destructive',
    segera: 'border-amber-500 text-amber-600',
    aman: 'border-muted-foreground text-muted-foreground',
    lunas: 'border-green-600 text-green-600',
    'tanpa-jatuh-tempo': 'border-muted-foreground text-muted-foreground',
  }[dueStatus]

  return (
    <div className="border rounded-lg p-3 hover:bg-accent/50 transition-colors group">
      <Link href={`/debts/${utang.id}`} className="block">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0',
                isReceivable ? 'bg-green-500/10' : 'bg-red-500/10'
              )}
            >
              {isReceivable ? '📥' : '📤'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{utang.person}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant={statusBadge.variant} className="text-[10px] px-1.5 py-0 h-4">
                  {statusBadge.label}
                </Badge>
                {dueLabel && utang.status !== 'paid' && (
                  <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-4', dueBadgeColor)}>
                    <Calendar className="w-2.5 h-2.5 mr-0.5" />
                    {dueLabel}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p
              className={cn(
                'font-bold',
                isReceivable ? 'text-green-600' : 'text-red-600'
              )}
            >
              {formatRupiah(sisa)}
            </p>
            {totalDibayar > 0 && utang.status !== 'paid' && (
              <p className="text-xs text-muted-foreground">
                dari {formatRupiah(utang.amount)}
              </p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {utang.status !== 'unpaid' && (
          <div className="space-y-1">
            <Progress value={progress} className="h-1.5" />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Terbayar: {formatRupiah(totalDibayar)}</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
          </div>
        )}

        {/* Note preview */}
        {utang.note && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
            {utang.note}
          </p>
        )}
      </Link>

      {/* Actions */}
      <div className="flex items-center justify-end mt-2 -mb-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DeleteUtangDialog utang={utang}>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Hapus
              </DropdownMenuItem>
            </DeleteUtangDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
