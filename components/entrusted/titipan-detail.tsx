'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, Pencil, HandCoins, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
import { TitipanFormSheet } from './titipan-form-sheet'
import { formatRupiah, formatTanggal } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { getStatusLabel, getStatusVariant } from '@/lib/titipan-helpers'
import {
  pinjamTitipan,
  batalkanPinjaman,
  kembalikanTitipan,
} from '@/app/(dashboard)/entrusted/actions'
import { toast } from 'sonner'

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
}

export function TitipanDetail({ titipan }: Props) {
  const [editOpen, setEditOpen] = useState(false)
  const [pinjamOpen, setPinjamOpen] = useState(false)
  const [pinjamBy, setPinjamBy] = useState('')
  const [isPending, startTransition] = useTransition()

  const handlePinjam = () => {
    if (!pinjamBy.trim()) {
      toast.error('Nama peminjam wajib diisi')
      return
    }
    startTransition(async () => {
      const result = await pinjamTitipan({ id: titipan.id, borrowedBy: pinjamBy })
      if (result.success) {
        toast.success('Ditandai dipinjam')
        setPinjamOpen(false)
        setPinjamBy('')
      } else {
        toast.error(result.error || 'Gagal')
      }
    })
  }

  const handleBatalkan = () => {
    startTransition(async () => {
      const result = await batalkanPinjaman(titipan.id)
      if (result.success) {
        toast.success('Pinjaman dibatalkan')
      } else {
        toast.error(result.error || 'Gagal')
      }
    })
  }

  const handleKembalikan = () => {
    startTransition(async () => {
      const result = await kembalikanTitipan(titipan.id)
      if (result.success) {
        toast.success('Titipan ditandai sudah dikembalikan')
      } else {
        toast.error(result.error || 'Gagal')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/entrusted">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Titipan {titipan.owner}</h1>
          <p className="text-sm text-muted-foreground">
            Dibuat {formatTanggal(titipan.createdAt, 'dd MMM yyyy')}
          </p>
        </div>
        {titipan.status === 'held' && (
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </Button>
        )}
      </div>

      {/* Warning */}
      {titipan.status !== 'returned' && (
        <Alert className="border-amber-500 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-sm">
            Uang ini BUKAN milik kamu. Jangan dipakai untuk keperluan pribadi.
          </AlertDescription>
        </Alert>
      )}

      {/* Card utama */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-muted-foreground">Jumlah</CardTitle>
            <Badge variant={getStatusVariant(titipan.status)}>
              {getStatusLabel(titipan.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p
            className={cn(
              'text-3xl font-bold',
              titipan.status === 'borrowed'
                ? 'text-red-600'
                : titipan.status === 'returned'
                ? 'text-muted-foreground'
                : 'text-foreground'
            )}
          >
            {formatRupiah(titipan.amount)}
          </p>

          <div className="grid grid-cols-2 gap-3 text-sm pt-3 border-t">
            <div>
              <p className="text-xs text-muted-foreground">Pemilik</p>
              <p className="font-semibold">{titipan.owner}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="font-semibold">{getStatusLabel(titipan.status)}</p>
            </div>
            {titipan.borrowedBy && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Dipinjam Oleh</p>
                <p className="font-semibold text-red-600">{titipan.borrowedBy}</p>
              </div>
            )}
            {titipan.returnedAt && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Dikembalikan Pada</p>
                <p className="font-semibold text-green-600">
                  {formatTanggal(titipan.returnedAt, 'dd MMMM yyyy')}
                </p>
              </div>
            )}
            {titipan.note && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Catatan</p>
                <p>{titipan.note}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {titipan.status === 'held' && (
        <div className="space-y-2">
          {/* Tombol pinjam */}
          <AlertDialog open={pinjamOpen} onOpenChange={setPinjamOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full" size="lg">
                <HandCoins className="w-4 h-4 mr-2" />
                Tandai Dipinjam
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tandai titipan sebagai dipinjam?</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-3 pt-2">
                    <p className="text-sm text-muted-foreground">
                      Uang titipan ini dipinjam oleh siapa?
                    </p>
                    <input
                      type="text"
                      value={pinjamBy}
                      onChange={(e) => setPinjamBy(e.target.value)}
                      placeholder="Contoh: Mama, Kakak"
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-background text-foreground"
                      autoFocus
                    />
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault()
                    handlePinjam()
                  }}
                  disabled={isPending || !pinjamBy.trim()}
                >
                  {isPending ? 'Menyimpan...' : 'Ya, Tandai Dipinjam'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Tombol kembalikan */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="default" className="w-full" size="lg">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Tandai Sudah Dikembalikan
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Konfirmasi pengembalian</AlertDialogTitle>
                <AlertDialogDescription>
                  Titipan {formatRupiah(titipan.amount)} ke {titipan.owner} sudah
                  dikembalikan? Tindakan ini tidak bisa dibatalkan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault()
                    handleKembalikan()
                  }}
                  disabled={isPending}
                >
                  {isPending ? 'Menyimpan...' : 'Ya, Sudah Dikembalikan'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {titipan.status === 'borrowed' && (
        <div className="space-y-2">
          <Alert className="border-red-500 bg-red-500/10">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-sm">
              Uang ini dipinjam oleh <strong>{titipan.borrowedBy}</strong>. Kamu
              tetap bertanggung jawab mengembalikannya ke {titipan.owner}.
            </AlertDescription>
          </Alert>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleBatalkan}
            disabled={isPending}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Batalkan Pinjaman (Uang Kembali)
          </Button>

          <Button
            variant="default"
            className="w-full"
            onClick={handleKembalikan}
            disabled={isPending}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Tandai Sudah Dikembalikan ke {titipan.owner}
          </Button>
        </div>
      )}

      {titipan.status === 'returned' && (
        <Alert className="border-green-500 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-sm">
            Titipan sudah dikembalikan ke {titipan.owner} pada{' '}
            {titipan.returnedAt && formatTanggal(titipan.returnedAt, 'dd MMMM yyyy')}.
          </AlertDescription>
        </Alert>
      )}

      <TitipanFormSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        editingTitipan={titipan}
      />
    </div>
  )
}
