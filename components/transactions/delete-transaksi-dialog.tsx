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
import { deleteTransaksi } from '@/app/(dashboard)/transactions/actions'
import { formatRupiah, formatTanggal } from '@/lib/utils'
import type { TransaksiWithRelations } from '@/types'

interface Props {
  transaksi: TransaksiWithRelations
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function DeleteTransaksiDialog({
  transaksi,
  children,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: Props) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  const setOpen = isControlled ? (setControlledOpen || (() => {})) : setUncontrolledOpen
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteTransaksi(transaksi.id)
      if (result.success) {
        toast.success('Transaksi dihapus, saldo akun otomatis disesuaikan')
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
          <AlertDialogTitle>Hapus transaksi ini?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="p-3 bg-accent rounded-lg text-foreground">
                <p className="font-medium">
                  {transaksi.kategori?.name || transaksi.note || 'Transaksi'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatTanggal(transaksi.date)} • {transaksi.akun?.name}
                </p>
                <p className={`font-semibold ${
                  transaksi.type === 'income' ? 'text-green-600' :
                  transaksi.type === 'expense' ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {transaksi.type === 'income' ? '+' : transaksi.type === 'expense' ? '-' : ''}
                  {formatRupiah(Number(transaksi.amount))}
                </p>
              </div>
              <p className="text-destructive font-semibold">
                ⚠️ Saldo akun akan otomatis disesuaikan dengan penghapusan ini.
              </p>
            </div>
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
