'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Trash2, Calculator, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { formatRupiah, formatTanggal, cn } from '@/lib/utils'
import { deleteRekonsiliasi } from '@/app/(dashboard)/reconciliation/actions'

interface Props {
  rekon: {
    id: string
    date: Date
    systemBalance: number
    actualBalance: number
    difference: number
    reason: string
    account: {
      id: string
      name: string
      icon: string | null
      color: string | null
      type: string
    }
    adjustmentTx: {
      id: string
      type: string
      amount: number
      note: string | null
      date: Date
      kategori: { name: string; icon: string | null } | null
    } | null
  }
}

export function RekonsiliasiDetail({ rekon }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteRekonsiliasi(rekon.id)
      if (result.success) {
        toast.success('Rekonsiliasi dihapus')
        router.push('/reconciliation')
      } else {
        toast.error(result.error || 'Gagal hapus')
      }
    })
  }

  const isBalanced = rekon.difference === 0

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/reconciliation">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Rekonsiliasi
          </h1>
          <p className="text-sm text-muted-foreground">
            {formatTanggal(rekon.date, 'dd MMMM yyyy, HH:mm')}
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isPending}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus rekonsiliasi ini?</AlertDialogTitle>
              <AlertDialogDescription>
                {rekon.adjustmentTx ? (
                  <>
                    ⚠️ Rekonsiliasi ini punya transaksi penyesuaian{' '}
                    <strong>{formatRupiah(rekon.adjustmentTx.amount)}</strong>.
                    Kalau dihapus, transaksi adjustment juga akan dihapus dan
                    saldo akun dikembalikan.
                  </>
                ) : (
                  'Rekonsiliasi ini akan dihapus permanen.'
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
      </div>

      {/* Akun */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
              style={{ backgroundColor: `${rekon.account.color || '#0ea5e9'}20` }}
            >
              {rekon.account.icon || '💰'}
            </div>
            <div>
              <p className="font-medium">{rekon.account.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {rekon.account.type}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Perbandingan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Perbandingan Saldo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-[1fr,auto,1fr] gap-3 items-center">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Sistem</p>
              <p className="text-lg font-semibold">
                {formatRupiah(rekon.systemBalance)}
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Riil</p>
              <p className="text-lg font-semibold">
                {formatRupiah(rekon.actualBalance)}
              </p>
            </div>
          </div>

          <div className={cn(
            'p-4 rounded-lg text-center',
            isBalanced ? 'bg-green-500/10' :
            rekon.difference > 0 ? 'bg-blue-500/10' : 'bg-red-500/10'
          )}>
            <div className="flex items-center justify-center gap-2 mb-1">
              {isBalanced ? (
                <span className="text-green-600 font-medium text-sm">COCOK</span>
              ) : (
                <>
                  {rekon.difference > 0 ? (
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                  <span className={cn(
                    'font-medium text-sm',
                    rekon.difference > 0 ? 'text-blue-600' : 'text-red-600'
                  )}>
                    SELISIH
                  </span>
                </>
              )}
            </div>
            {!isBalanced && (
              <p className={cn(
                'text-2xl font-bold',
                rekon.difference > 0 ? 'text-blue-600' : 'text-red-600'
              )}>
                {rekon.difference > 0 ? '+' : ''}{formatRupiah(rekon.difference)}
              </p>
            )}
          </div>

          {/* Alasan */}
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-1">Alasan</p>
            <p className="text-sm">{rekon.reason}</p>
          </div>
        </CardContent>
      </Card>

      {/* Adjustment */}
      {rekon.adjustmentTx && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transaksi Penyesuaian</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href={`/transactions?search=${encodeURIComponent(rekon.adjustmentTx.id)}`}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                  {rekon.adjustmentTx.kategori?.icon || '📝'}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {rekon.adjustmentTx.kategori?.name || 'Penyesuaian'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTanggal(rekon.adjustmentTx.date, 'dd MMM yyyy')}
                  </p>
                </div>
              </div>
              <p className={cn(
                'font-semibold',
                rekon.adjustmentTx.type === 'income' ? 'text-green-600' : 'text-red-600'
              )}>
                {rekon.adjustmentTx.type === 'income' ? '+' : '-'}
                {formatRupiah(rekon.adjustmentTx.amount)}
              </p>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
