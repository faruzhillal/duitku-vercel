'use client'

import { useEffect, useState, useTransition, useMemo } from 'react'
import { toast } from 'sonner'
import { Calculator, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatRupiah, cn } from '@/lib/utils'
import { rekonsiliasiAkun } from '@/app/(dashboard)/reconciliation/actions'

interface AkunData {
  id: string
  name: string
  icon: string | null
  color: string | null
  currentBalance: number
  isEntrusted: boolean
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  akun: AkunData | null
}

export function RekonsiliasiFormSheet({ open, onOpenChange, akun }: Props) {
  const [isPending, startTransition] = useTransition()
  const [actualBalance, setActualBalance] = useState<string>('')
  const [reason, setReason] = useState('')

  // Reset form saat akun berubah
  useEffect(() => {
    if (open && akun) {
      setActualBalance('')
      setReason('')
    }
  }, [open, akun])

  const actualNumber = useMemo(() => {
    const cleaned = actualBalance.replace(/[^\d-]/g, '')
    return parseInt(cleaned, 10) || 0
  }, [actualBalance])

  const difference = useMemo(() => {
    if (!akun) return 0
    return actualNumber - akun.currentBalance
  }, [actualNumber, akun])

  const hasDifference = Boolean(akun && Math.abs(difference) >= 0.01)
  const isBalanced = Boolean(akun && Math.abs(difference) < 0.01)

  const handleSubmit = () => {
    if (!akun) return

    if (actualBalance === '') {
      toast.error('Saldo riil wajib diisi')
      return
    }

    if (hasDifference && reason.trim().length < 5) {
      toast.error('Alasan wajib diisi minimal 5 karakter')
      return
    }

    startTransition(async () => {
      const result = await rekonsiliasiAkun({
        accountId: akun.id,
        actualBalance: actualNumber,
        reason: reason.trim() || 'Tidak ada selisih',
      })

      if (result.success && result.data) {
        if (result.data.adjustmentCreated) {
          toast.success(
            `Rekonsiliasi berhasil. Penyesuaian ${formatRupiah(Math.abs(result.data.difference))} dicatat.`
          )
        } else {
          toast.success('Saldo cocok! Rekonsiliasi tercatat.')
        }
        onOpenChange(false)
      } else {
        toast.error(result.error || 'Gagal rekonsiliasi')
      }
    })
  }

  if (!akun) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Rekonsiliasi {akun.name}
          </SheetTitle>
          <SheetDescription>
            Masukkan saldo asli dari rekening/dompet kamu
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          {/* Warning titipan */}
          {akun.isEntrusted && (
            <Alert className="border-amber-500 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-xs">
                Ini akun titipan. Pastikan kamu benar-benar yakin dengan saldo aslinya.
              </AlertDescription>
            </Alert>
          )}

          {/* Saldo sistem */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Saldo Sistem</Label>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xl font-semibold">
                {formatRupiah(akun.currentBalance)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Dihitung dari semua transaksi
              </p>
            </div>
          </div>

          {/* Saldo riil input */}
          <div className="space-y-1">
            <Label htmlFor="actualBalance">Saldo Riil (yang benar-benar ada)</Label>
            <Input
              id="actualBalance"
              type="text"
              inputMode="numeric"
              placeholder="Contoh: 448500"
              value={actualBalance}
              onChange={(e) => setActualBalance(e.target.value)}
              className="text-lg font-medium"
              autoFocus
            />
            {actualBalance && (
              <p className="text-xs text-muted-foreground">
                {formatRupiah(actualNumber)}
              </p>
            )}
          </div>

          {/* Selisih */}
          {actualBalance && (
            <Card className={cn(
              'border-2',
              isBalanced ? 'border-green-500/50 bg-green-500/5' :
              'border-amber-500/50 bg-amber-500/5'
            )}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isBalanced ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : difference > 0 ? (
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
                    <span className="text-sm font-medium">
                      {isBalanced ? 'Saldo cocok' : 'Selisih terdeteksi'}
                    </span>
                  </div>
                  {!isBalanced && (
                    <span className={cn(
                      'text-lg font-bold',
                      difference > 0 ? 'text-blue-600' : 'text-red-600'
                    )}>
                      {difference > 0 ? '+' : ''}{formatRupiah(difference)}
                    </span>
                  )}
                </div>
                {!isBalanced && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {difference > 0 
                      ? 'Saldo riil lebih banyak. Akan dibuat penyesuaian PEMASUKAN.'
                      : 'Saldo riil lebih sedikit. Akan dibuat penyesuaian PENGELUARAN.'}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Alasan */}
          <div className="space-y-1">
            <Label htmlFor="reason">
              Alasan {hasDifference && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                hasDifference
                  ? 'Contoh: biaya admin bulanan belum tercatat'
                  : 'Misal: dicek rutin bulanan'
              }
              rows={3}
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground text-right">
              {reason.length}/300
            </p>
          </div>

          {/* Info adjustment */}
          {hasDifference && (
            <Alert>
              <AlertDescription className="text-xs">
                Akan otomatis dibuat transaksi penyesuaian{' '}
                <strong>{difference > 0 ? 'pemasukan' : 'pengeluaran'}</strong>{' '}
                sebesar <strong>{formatRupiah(Math.abs(difference))}</strong> dengan
                kategori &quot;Lain-lain&quot;.
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending || actualBalance === '' || (hasDifference && reason.trim().length < 5)}
              className="flex-1"
            >
              {isPending ? 'Memproses...' : 'Simpan Rekonsiliasi'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
