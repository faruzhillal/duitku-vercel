'use client'

import { useState } from 'react'
import { MoreVertical, Pencil, Trash2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { DeleteKategoriDialog } from './delete-kategori-dialog'
import type { Kategori } from '@/app/generated/prisma'

type KategoriWithCount = Kategori & {
  _count: { transaksi: number }
}

interface Props {
  kategori: KategoriWithCount
  onEdit: () => void
}

export function KategoriItem({ kategori, onEdit }: Props) {
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
            style={{ backgroundColor: `${kategori.color || '#0ea5e9'}20` }}
          >
            {kategori.icon || '📝'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{kategori.name}</p>
              {kategori.isDefault && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  <Lock className="w-3 h-3 mr-1" />
                  Default
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {kategori._count?.transaksi ?? 0} transaksi
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="w-4 h-4 mr-2" />
              {kategori.isDefault ? 'Rename' : 'Edit'}
            </DropdownMenuItem>
            {!kategori.isDefault && (
              <DropdownMenuItem 
                onClick={() => setDeleteOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Hapus
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {!kategori.isDefault && (
        <DeleteKategoriDialog
          kategori={kategori}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
        />
      )}
    </>
  )
}
