'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatRupiah } from '@/lib/utils'
import { TIPE_AKUN_OPTIONS } from '@/lib/constants'
import type { AkunWithStats } from '@/types'
import { DeleteAkunDialog } from './delete-akun-dialog'

interface Props {
  akun: AkunWithStats
  onEdit: () => void
}

export function AkunCard({ akun, onEdit }: Props) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const tipe = TIPE_AKUN_OPTIONS.find((t) => t.value === akun.type)
  const saldo = Number(akun.currentBalance)
  
  return (
    <>
      <Card className="relative overflow-hidden">
        {/* Color indicator */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ backgroundColor: akun.color || '#0ea5e9' }}
        />
        
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{akun.icon || tipe?.icon || '💰'}</span>
              <div>
                <Link 
                  href={`/accounts/${akun.id}`}
                  className="font-semibold hover:underline"
                >
                  {akun.name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {tipe?.label}
                  {akun.isEntrusted && akun.owner && ` • Milik: ${akun.owner}`}
                </p>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
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
        
        <div className="space-y-1">
          <p className="text-2xl font-bold">{formatRupiah(saldo)}</p>
          <p className="text-xs text-muted-foreground">
            {akun._count?.transaksi || 0} transaksi
          </p>
        </div>
      </CardContent>
    </Card>

    <DeleteAkunDialog
      akun={akun}
      open={deleteOpen}
      onOpenChange={setDeleteOpen}
    />
  </>
  )
}
