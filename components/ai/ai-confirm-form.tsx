'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Check, Pencil, RotateCcw, AlertTriangle, Sparkles, ThumbsUp, ThumbsDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatRupiah, formatTanggal, cn } from '@/lib/utils'
import { METODE_PEMBAYARAN_OPTIONS } from '@/lib/constants'
import { simpanDariAI } from '@/app/(dashboard)/transactions/ai-actions'
import type { ParsedTransaksi, TransaksiInput } from '@/types'

interface AccountData {
  id: string
  name: string
  type: string
  icon: string | null
  color: string | null
  isEntrusted: boolean
  currentBalance: number
}

interface CategoryData {
  id: string
  name: string
  type: string
  icon: string | null
  color: string | null
}

interface Props {
  originalText: string
  parsed: ParsedTransaksi
  resolved: { accountId: string | null; transferToId: string | null; categoryId: string | null }
  warnings: string[]
  accounts: AccountData[]
  categories: CategoryData[]
  onCancel: () => void
  onSuccess: () => void
}

export function AiConfirmForm({
  originalText,
  parsed,
  resolved,
  warnings,
  accounts,
  categories,
  onCancel,
  onSuccess,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [isEditing, setIsEditing] = useState(false)
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)

  // Form state
  const [date, setDate] = useState(parsed.date)
  const [amount, setAmount] = useState(parsed.amount)
  const [type, setType] = useState(parsed.type)
  const [accountId, setAccountId] = useState(resolved.accountId ?? accounts[0]?.id ?? '')
  const [transferToId, setTransferToId] = useState(resolved.transferToId ?? '')
  const [categoryId, setCategoryId] = useState(resolved.categoryId ?? '')
  const [paymentMethod, setPaymentMethod] = useState(parsed.paymentMethod)
  const [note, setNote] = useState(parsed.note)

  const confidence = parsed.confidence
  const isHighConfidence = confidence >= 0.85
  const isLowConfidence = confidence < 0.7

  // Filter kategori
  const filteredCategories = categories.filter((c) => {
    if (type === 'transfer') return false
    return type === 'income' ? c.type === 'income' : c.type === 'expense'
  })

  const account = accounts.find((a) => a.id === accountId)
  const transferTo = accounts.find((a) => a.id === transferToId)
  const category = categories.find((c) => c.id === categoryId)

  const handleSave = () => {
    // Validasi
    if (!amount || amount <= 0) {
      toast.error('Jumlah wajib diisi')
      return
    }
    if (!accountId) {
      toast.error('Pilih akun')
      return
    }
    if (type === 'transfer' && !transferToId) {
      toast.error('Pilih akun tujuan transfer')
      return
    }
    if (type !== 'transfer' && !categoryId) {
      toast.error('Pilih kategori')
      return
    }

    const payload: TransaksiInput = {
      date,
      amount,
      type,
      accountId,
      transferToId: type === 'transfer' ? transferToId : undefined,
      categoryId: type !== 'transfer' ? categoryId : undefined,
      paymentMethod,
      note: note || undefined,
      tags: ['ai-input'],
    }

    startTransition(async () => {
      const result = await simpanDariAI(payload)
      if (result.success) {
        toast.success('Transaksi berhasil disimpan')
        onSuccess()
      } else {
        toast.error(result.error || 'Gagal menyimpan')
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Original text */}
      <Card className="bg-muted/50">
        <CardContent className="p-3">
          <p className="text-xs text-muted-foreground mb-1">Input kamu:</p>
          <p className="text-sm italic">&quot;{originalText}&quot;</p>
        </CardContent>
      </Card>

      {/* Confidence badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Hasil AI</span>
          <Badge
            variant={
              isHighConfidence ? 'default' :
              isLowConfidence ? 'destructive' : 'secondary'
            }
            className="text-[10px]"
          >
            {Math.round(confidence * 100)}% yakin
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
        >
          <Pencil className="w-3 h-3 mr-1" />
          {isEditing ? 'Selesai Edit' : 'Edit'}
        </Button>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <Alert className="border-amber-500 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            <ul className="text-xs space-y-1 list-disc list-inside">
              {warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Preview / Edit */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isEditing ? 'Edit Transaksi' : 'Konfirmasi Transaksi'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isEditing ? (
            // Preview mode
            <div className="space-y-3">
              {/* Tipe */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tipe</span>
                <Badge variant={
                  type === 'income' ? 'default' :
                  type === 'expense' ? 'destructive' : 'secondary'
                }>
                  {type === 'income' ? 'Pemasukan' :
                   type === 'expense' ? 'Pengeluaran' : 'Transfer'}
                </Badge>
              </div>

              {/* Jumlah */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Jumlah</span>
                <span className={cn(
                  'font-bold text-lg',
                  type === 'income' ? 'text-green-600' :
                  type === 'expense' ? 'text-red-600' : 'text-blue-600'
                )}>
                  {type === 'income' ? '+' : type === 'expense' ? '-' : ''}
                  {formatRupiah(amount)}
                </span>
              </div>

              {/* Tanggal */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tanggal</span>
                <span className="text-sm">{formatTanggal(date, 'dd MMM yyyy')}</span>
              </div>

              {/* Akun */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {type === 'transfer' ? 'Dari' : 'Akun'}
                </span>
                <span className="text-sm">
                  {account?.icon} {account?.name}
                </span>
              </div>

              {type === 'transfer' && transferTo && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Ke</span>
                  <span className="text-sm">
                    {transferTo.icon} {transferTo.name}
                  </span>
                </div>
              )}

              {/* Kategori */}
              {type !== 'transfer' && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Kategori</span>
                  <span className="text-sm">
                    {category?.icon} {category?.name ?? '—'}
                  </span>
                </div>
              )}

              {/* Metode */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Metode</span>
                <span className="text-sm capitalize">{paymentMethod}</span>
              </div>

              {/* Catatan */}
              {note && (
                <div className="flex items-start justify-between gap-4">
                  <span className="text-sm text-muted-foreground shrink-0">Catatan</span>
                  <span className="text-sm text-right">{note}</span>
                </div>
              )}
            </div>
          ) : (
            // Edit mode
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tipe</Label>
                <Tabs value={type} onValueChange={(v) => setType(v as 'expense' | 'income' | 'transfer')}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="expense">Keluar</TabsTrigger>
                    <TabsTrigger value="income">Masuk</TabsTrigger>
                    <TabsTrigger value="transfer">Transfer</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="space-y-2">
                <Label>Jumlah</Label>
                <Input
                  type="number"
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  inputMode="numeric"
                />
              </div>

              <div className="space-y-2">
                <Label>Tanggal</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Akun</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih akun" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.icon} {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {type === 'transfer' && (
                <div className="space-y-2">
                  <Label>Ke Akun</Label>
                  <Select value={transferToId} onValueChange={setTransferToId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih akun tujuan" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts
                        .filter((a) => a.id !== accountId)
                        .map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.icon} {a.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {type !== 'transfer' && (
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.icon} {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Metode</Label>
                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'cash' | 'qris' | 'transfer' | 'ewallet')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih metode" />
                  </SelectTrigger>
                  <SelectContent>
                    {METODE_PEMBAYARAN_OPTIONS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Catatan</Label>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={200}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feedback */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <span>Hasil AI benar?</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setFeedback('up')}
        >
          <ThumbsUp className={cn('w-3.5 h-3.5', feedback === 'up' && 'text-green-600')} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setFeedback('down')}
        >
          <ThumbsDown className={cn('w-3.5 h-3.5', feedback === 'down' && 'text-red-600')} />
        </Button>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isPending} className="flex-1">
          <RotateCcw className="w-4 h-4 mr-2" />
          Ulangi
        </Button>
        <Button onClick={handleSave} disabled={isPending} className="flex-1">
          {isPending ? (
            <span className="animate-pulse">Menyimpan...</span>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Simpan
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
