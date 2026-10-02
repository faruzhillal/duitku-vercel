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
import { deleteUtang } from '@/app/(dashboard)/debts/actions'
import type { UtangWithPayments } from '@/types'

interface Props {
  utang: UtangWithPayments
  children: React.ReactNode
}

export function DeleteUtangDialog({ utang, children }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const hasPembayaran = utang.pembayaran.length > 0

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteUtang(utang.id)
      if (result.success) {
        toast.success('Utang berhasil dihapus')
        setOpen(false)
      } else {
        toast.error(result.error || 'Gagal menghapus')
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus {utang.person}?</AlertDialogTitle>
          <AlertDialogDescription>
            {hasPembayaran ? (
              <span className="text-destructive font-semibold">
                ⚠️ Ada {utang.pembayaran.length} pembayaran. Hapus pembayarannya dulu.
              </span>
            ) : (
              'Data ini akan dihapus permanen.'
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
            disabled={isPending || hasPembayaran}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? 'Menghapus...' : 'Hapus'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
