'use client'

import { useState, useTransition } from 'react'
import { signOut } from 'next-auth/react'
import { toast } from 'sonner'
import { AlertTriangle, Trash2, RotateCcw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  resetSemuaData,
  hapusAkunPermanen,
} from '@/app/(dashboard)/settings/actions'

export function DangerZone() {
  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2 text-destructive">
          <AlertTriangle className="w-4 h-4" />
          Zona Berbahaya
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ResetDataDialog />
        <HapusAkunDialog />
      </CardContent>
    </Card>
  )
}

function ResetDataDialog() {
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleReset = () => {
    startTransition(async () => {
      const result = await resetSemuaData(confirm)
      if (result.success) {
        toast.success('Semua data berhasil direset')
        setOpen(false)
        setConfirm('')
      } else {
        toast.error(result.error || 'Gagal reset')
      }
    })
  }

  const isValid = confirm === 'HAPUS SEMUA'

  return (
    <div className="flex items-center justify-between gap-4 pb-4 border-b">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">Reset Semua Data</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Hapus transaksi, akun, kategori, utang, titipan. Akun kamu tetap ada.
        </p>
      </div>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" className="shrink-0">
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset semua data?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2">
                <p className="text-sm text-muted-foreground">
                  Semua transaksi, akun, kategori, utang, dan titipan akan dihapus
                  permanen. Kategori default akan di-seed ulang. Tindakan ini
                  tidak bisa dibatalkan.
                </p>
                <div className="space-y-1">
                  <Label className="text-xs">
                    Ketik <span className="font-mono font-bold">HAPUS SEMUA</span>{' '}
                    untuk konfirmasi:
                  </Label>
                  <Input
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="HAPUS SEMUA"
                    className="font-mono"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleReset()
              }}
              disabled={isPending || !isValid}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? 'Menghapus...' : 'Reset Semua'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function HapusAkunDialog() {
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      const result = await hapusAkunPermanen(confirm)
      if (result.success) {
        toast.success('Akun dihapus. Sampai jumpa!')
        await signOut({ callbackUrl: '/login' })
      } else {
        toast.error(result.error || 'Gagal hapus akun')
      }
    })
  }

  const isValid = confirm === 'HAPUS AKUN'

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-destructive">
          Hapus Akun Permanen
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Hapus akun + semua data. Tidak bisa dikembalikan.
        </p>
      </div>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm" className="shrink-0">
            <Trash2 className="w-4 h-4 mr-1" />
            Hapus
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus akun permanen?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2">
                <p className="text-destructive font-semibold text-sm">
                  ⚠️ SEMUA data kamu akan dihapus permanen. Tidak bisa
                  dikembalikan.
                </p>
                <div className="space-y-1">
                  <Label className="text-xs">
                    Ketik <span className="font-mono font-bold">HAPUS AKUN</span>{' '}
                    untuk konfirmasi:
                  </Label>
                  <Input
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="HAPUS AKUN"
                    className="font-mono"
                  />
                </div>
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
              disabled={isPending || !isValid}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? 'Menghapus...' : 'Hapus Akun'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
