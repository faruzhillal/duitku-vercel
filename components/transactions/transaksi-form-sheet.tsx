'use client'

import { useEffect, useTransition, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { AlertTriangle } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { transaksiSchema, type TransaksiInput } from '@/lib/validators/transaksi'
import { METODE_PEMBAYARAN_OPTIONS } from '@/lib/constants'
import { createTransaksi, updateTransaksi } from '@/app/(dashboard)/transactions/actions'
import { formatRupiah, formatTanggal } from '@/lib/utils'
import type { TransaksiWithRelations, Akun, Kategori } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingTransaksi: TransaksiWithRelations | null
  akunList: Akun[]
  kategoriList: Kategori[]
}

export function TransaksiFormSheet({
  open,
  onOpenChange,
  editingTransaksi,
  akunList,
  kategoriList,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const isEdit = !!editingTransaksi

  const form = useForm<TransaksiInput>({
    resolver: zodResolver(transaksiSchema),
    defaultValues: {
      date: formatTanggal(new Date(), 'yyyy-MM-dd'),
      amount: 0,
      type: 'expense',
      accountId: akunList[0]?.id || '',
      categoryId: undefined,
      transferToId: undefined,
      paymentMethod: 'cash',
      note: '',
      tags: [],
    }
  })

  // Watch tipe transaksi untuk conditional rendering
  const tipe = form.watch('type')
  const accountId = form.watch('accountId')
  const amount = form.watch('amount')

  // Filter kategori berdasarkan tipe
  const kategoriFiltered = useMemo(() => {
    if (tipe === 'transfer') return []
    const targetType = tipe === 'income' ? 'income' : 'expense'
    return kategoriList.filter((k) => k.type === targetType)
  }, [kategoriList, tipe])

  // Cek saldo cukup (client-side warning)
  const saldoWarning = useMemo(() => {
    if (tipe === 'income') return null
    const akun = akunList.find((a) => a.id === accountId)
    if (!akun) return null
    const saldo = Number(akun.currentBalance)
    if (amount > saldo) {
      return `Saldo ${akun.name} saat ini ${formatRupiah(saldo)} — kurang ${formatRupiah(amount - saldo)}`
    }
    return null
  }, [accountId, amount, akunList, tipe])

  // Reset form saat editing
  useEffect(() => {
    if (editingTransaksi) {
      form.reset({
        date: formatTanggal(editingTransaksi.date, 'yyyy-MM-dd'),
        amount: Number(editingTransaksi.amount),
        type: editingTransaksi.type as 'income' | 'expense' | 'transfer',
        accountId: editingTransaksi.accountId,
        categoryId: editingTransaksi.categoryId || undefined,
        transferToId: editingTransaksi.transferToId || undefined,
        paymentMethod: (editingTransaksi.paymentMethod as "cash" | "qris" | "transfer" | "ewallet") || 'cash',
        note: editingTransaksi.note || '',
        tags: editingTransaksi.tags || [],
      })
    } else {
      form.reset({
        date: formatTanggal(new Date(), 'yyyy-MM-dd'),
        amount: 0,
        type: 'expense',
        accountId: akunList[0]?.id || '',
        categoryId: undefined,
        transferToId: undefined,
        paymentMethod: 'cash',
        note: '',
        tags: [],
      })
    }
  }, [editingTransaksi, akunList, form])

  const onSubmit = (data: TransaksiInput) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateTransaksi(editingTransaksi.id, data)
        : await createTransaksi(data)

      if (result.success) {
        toast.success(isEdit ? 'Transaksi berhasil diupdate' : 'Transaksi berhasil dicatat')
        onOpenChange(false)
        form.reset()
      } else {
        toast.error(result.error || 'Terjadi kesalahan')
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            form.setError(field as keyof TransaksiInput, { message: errors[0] })
          })
        }
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isEdit ? 'Edit Transaksi' : 'Tambah Transaksi'}
          </SheetTitle>
          <SheetDescription>
            {isEdit 
              ? 'Perubahan akan otomatis menyesuaikan saldo akun' 
              : 'Catat transaksi baru kamu'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
            {/* Tipe Transaksi (Tabs) */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipe</FormLabel>
                  <Tabs 
                    value={field.value} 
                    onValueChange={(val) => {
                      field.onChange(val)
                      form.setValue('categoryId', undefined)
                      form.setValue('transferToId', undefined)
                    }}
                  >
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="expense">Keluar</TabsTrigger>
                      <TabsTrigger value="income">Masuk</TabsTrigger>
                      <TabsTrigger value="transfer">Transfer</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Jumlah */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jumlah</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      inputMode="numeric"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  {field.value > 0 && (
                    <FormDescription>
                      {formatRupiah(field.value)}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Warning saldo kurang */}
            {saldoWarning && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {saldoWarning}
                </AlertDescription>
              </Alert>
            )}

            {/* Tanggal */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Akun Asal */}
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {tipe === 'transfer' ? 'Dari Akun' : 'Akun'}
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih akun" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {akunList.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.icon} {a.name} — {formatRupiah(Number(a.currentBalance))}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Akun Tujuan (khusus transfer) */}
            {tipe === 'transfer' && (
              <FormField
                control={form.control}
                name="transferToId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ke Akun</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih akun tujuan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {akunList
                          .filter((a) => a.id !== accountId)
                          .map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.icon} {a.name} — {formatRupiah(Number(a.currentBalance))}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Kategori (kecuali transfer) */}
            {tipe !== 'transfer' && (
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategori</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {kategoriFiltered.map((k) => (
                          <SelectItem key={k.id} value={k.id}>
                            {k.icon} {k.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Metode Pembayaran */}
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Metode Pembayaran</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih metode" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {METODE_PEMBAYARAN_OPTIONS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Catatan */}
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan (opsional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Misal: makan siang di kantin" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                className="flex-1"
              >
                Batal
              </Button>
              <Button type="submit" disabled={isPending} className="flex-1">
                {isPending 
                  ? 'Menyimpan...' 
                  : isEdit ? 'Simpan Perubahan' : 'Catat Transaksi'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
