'use client'

import Link from 'next/link'
import { MoreVertical, Pencil, Trash2, HandCoins, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DeleteTitipanDialog } from './delete-titipan-dialog'
import { formatRupiah, formatTanggal } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { getStatusLabel, getStatusVariant } from '@/lib/titipan-helpers'

interface TitipanData {
  id: string
  owner: string
  amount: number
  status: 'held' | 'borrowed' | 'returned'
  borrowedBy: string | null
  note: string | null
  returnedAt: Date | null
  createdAt: Date
}

interface Props {
  titipan: TitipanData
  onEdit: () => void
}

export function TitipanItem({ titipan, onEdit }: Props) {
  const statusLabel = getStatusLabel(titipan.status)
  const statusVariant = getStatusVariant(titipan.status)

  // Icon per status
  const statusIcon = {
    held: <CheckCircle2 className="w-3 h-3" />,
    borrowed: <HandCoins className="w-3 h-3" />,
    returned: <CheckCircle2 className="w-3 h-3" />,
  }[titipan.status]

  return (
    <div
      className={cn(
        'border rounded-lg p-3 hover:bg-accent/50 transition-colors group',
        titipan.status === 'returned' && 'opacity-60'
      )}
    >
      <Link href={`/entrusted/${titipan.id}`} className="block">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0',
                titipan.status === 'held' && 'bg-primary/10',
                titipan.status === 'borrowed' && 'bg-red-500/10',
                titipan.status === 'returned' && 'bg-muted'
              )}
            >
              🛡️
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">Milik: {titipan.owner}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant={statusVariant} className="text-[10px] px-1.5 py-0 h-4">
                  {statusIcon}
                  <span className="ml-1">{statusLabel}</span>
                </Badge>
                {titipan.borrowedBy && titipan.status === 'borrowed' && (
                  <span className="text-xs text-muted-foreground">
                    Dipinjam: {titipan.borrowedBy}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p
              className={cn(
                'font-bold',
                titipan.status === 'borrowed'
                  ? 'text-red-600'
                  : titipan.status === 'returned'
                  ? 'text-muted-foreground'
                  : 'text-foreground'
              )}
            >
              {formatRupiah(titipan.amount)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {formatTanggal(titipan.createdAt, 'dd MMM yy')}
            </p>
          </div>
        </div>

        {titipan.note && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
            {titipan.note}
          </p>
        )}
      </Link>

      {/* Actions — hanya untuk held */}
      {titipan.status === 'held' && (
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
              <DeleteTitipanDialog titipan={titipan}>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus
                </DropdownMenuItem>
              </DeleteTitipanDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}
