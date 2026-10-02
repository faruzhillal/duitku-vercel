'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { deleteKategori } from '@/app/(dashboard)/categories/actions'
import type { Kategori } from '@/app/generated/prisma'

type KategoriWithCount = Kategori & {
  _count: { transaksi: number }
}

interface Props {
  kategori: KategoriWithCount
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function DeleteKategoriDialog({
  kategori,
  children,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: Props) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  const setOpen = isControlled ? (setControlledOpen || (() => {})) : setUncontrolledOpen
  const [isPending, startTransition] = useTransition()
  const hasTransaksi = (kategori._count?.transaksi ?? 0) > 0

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteKategori(kategori.id)
      if (result.success) {
        toast.success('Kategori berhasil dihapus')
        setOpen(false)
      } else {
        toast.error(result.error || 'Gagal menghapus')
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {children && (
        <AlertDialogTrigger asChild>
          {children}
        </AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Hapus kategori &ldquo;{kategori.name}&rdquo;?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {hasTransaksi ? (
              <>
                Kategori ini punya <strong>{kategori._count.transaksi} transaksi</strong>.
                Semua transaksi akan dipindahkan ke kategori{' '}
                <strong>&ldquo;Lain-lain&rdquo;</strong> secara otomatis.
                Tindakan ini tidak bisa dibatalkan.
              </>
            ) : (
              'Kategori ini akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? 'Menghapus...' : 'Hapus'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
