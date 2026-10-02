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
import { deleteTitipan } from '@/app/(dashboard)/entrusted/actions'
import { formatRupiah } from '@/lib/utils'

interface TitipanData {
  id: string
  owner: string
  amount: number
  status: 'held' | 'borrowed' | 'returned'
}

interface Props {
  titipan: TitipanData
  children: React.ReactNode
}

export function DeleteTitipanDialog({ titipan, children }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const isBorrowed = titipan.status === 'borrowed'

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteTitipan(titipan.id)
      if (result.success) {
        toast.success('Titipan dihapus')
        setOpen(false)
      } else {
        toast.error(result.error || 'Gagal')
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus titipan {titipan.owner}?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span>
              Titipan <strong>{formatRupiah(titipan.amount)}</strong> dari{' '}
              <strong>{titipan.owner}</strong> akan dihapus dari catatan.
            </span>
            {isBorrowed && (
              <span className="block text-destructive font-semibold">
                ⚠️ Titipan sedang dipinjam. Batalkan pinjaman dulu sebelum hapus.
              </span>
            )}
            {!isBorrowed && (
              <span className="block text-amber-600 font-semibold">
                Hati-hati: ini bukan uang kamu. Hapus hanya kalau kamu yakin.
              </span>
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
            disabled={isPending || isBorrowed}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? 'Menghapus...' : 'Hapus'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
