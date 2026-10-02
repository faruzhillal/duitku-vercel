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
import { deleteAkun } from '@/app/(dashboard)/accounts/actions'
import type { AkunWithStats } from '@/types'
import type { Akun } from '@/app/generated/prisma'

interface Props {
  akun: AkunWithStats | (Akun & { _count?: { transaksi: number } })
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
}

export function DeleteAkunDialog({
  akun,
  children,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  onSuccess,
}: Props) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  const setOpen = isControlled ? (setControlledOpen || (() => {})) : setUncontrolledOpen
  const [isPending, startTransition] = useTransition()
  
  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteAkun(akun.id)
      if (result.success) {
        toast.success('Akun berhasil dihapus')
        setOpen(false)
        onSuccess?.()
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
          <AlertDialogTitle>Hapus akun &ldquo;{akun.name}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            Akun ini akan dihapus permanen. 
            {akun._count?.transaksi ? (
              <span className="block mt-2 text-destructive font-semibold">
                ⚠️ Akun ini punya {akun._count.transaksi} transaksi. 
                Hapus transaksinya dulu atau pindahkan ke akun lain.
              </span>
            ) : (
              ' Tindakan ini tidak bisa dibatalkan.'
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
