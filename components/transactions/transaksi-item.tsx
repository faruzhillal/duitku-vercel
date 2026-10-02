'use client'

import { useState } from 'react'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DeleteTransaksiDialog } from './delete-transaksi-dialog'
import { formatRupiah, cn } from '@/lib/utils'
import type { TransaksiWithRelations } from '@/types'

interface Props {
  transaksi: TransaksiWithRelations
  onEdit: () => void
}

export function TransaksiItem({ transaksi, onEdit }: Props) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isIncome = transaksi.type === 'income'
  const isExpense = transaksi.type === 'expense'
  const isTransfer = transaksi.type === 'transfer'

  const sign = isIncome ? '+' : isExpense ? '-' : ''
  const colorClass = isIncome 
    ? 'text-green-600 dark:text-green-400' 
    : isExpense 
      ? 'text-red-600 dark:text-red-400' 
      : 'text-blue-600 dark:text-blue-400'

  return (
    <>
      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors group">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
            style={{ 
              backgroundColor: transaksi.kategori?.color 
                ? `${transaksi.kategori.color}20` 
                : isTransfer 
                  ? '#3b82f620' 
                  : '#64748b20' 
            }}
          >
            {isTransfer ? '🔄' : (transaksi.kategori?.icon || '📝')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">
              {isTransfer 
                ? `${transaksi.akun?.name ?? 'Akun'} → ${transaksi.akunTujuan?.name ?? 'Tujuan'}`
                : (transaksi.kategori?.name || transaksi.note || 'Transaksi')}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{transaksi.akun?.name}</span>
              {transaksi.note && (
                <>
                  <span>•</span>
                  <span className="truncate">{transaksi.note}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <p className={cn('font-semibold text-sm', colorClass)}>
            {sign}{formatRupiah(Number(transaksi.amount))}
          </p>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setDeleteOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <DeleteTransaksiDialog
        transaksi={transaksi}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  )
}
