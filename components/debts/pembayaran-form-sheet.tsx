'use client'

import { useEffect, useTransition, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
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
import { pembayaranUtangSchema, type PembayaranUtangInput } from '@/lib/validators/utang'
import { createPembayaranUtang } from '@/app/(dashboard)/debts/actions'
import { formatRupiah, formatTanggal } from '@/lib/utils'
import { hitungSisa } from '@/lib/utang-helpers'
import type { UtangWithPayments } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  utang: UtangWithPayments
}

export function PembayaranFormSheet({ open, onOpenChange, utang }: Props) {
  const [isPending, startTransition] = useTransition()

  const sisa = useMemo(
    () => hitungSisa(utang.amount, utang.pembayaran),
    [utang]
  )

  const form = useForm<PembayaranUtangInput>({
    resolver: zodResolver(pembayaranUtangSchema),
    defaultValues: {
      debtId: utang.id,
      amount: 0,
      date: formatTanggal(new Date(), 'yyyy-MM-dd'),
      note: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        debtId: utang.id,
        amount: 0,
        date: formatTanggal(new Date(), 'yyyy-MM-dd'),
        note: '',
      })
    }
  }, [open, utang.id, form])

  const onSubmit = (data: PembayaranUtangInput) => {
    startTransition(async () => {
      const result = await createPembayaranUtang(data)
      if (result.success) {
        toast.success('Pembayaran berhasil dicatat')
        onOpenChange(false)
      } else {
        toast.error(result.error || 'Terjadi kesalahan')
      }
    })
  }

  const amount = form.watch('amount')
  const isReceivable = utang.type === 'receivable'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {isReceivable ? 'Catat Penerimaan' : 'Catat Pembayaran'}
          </SheetTitle>
          <SheetDescription>
            Sisa: <span className="font-semibold">{formatRupiah(sisa)}</span>
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
            {/* Quick amount buttons */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Jumlah Cepat</p>
              <div className="flex gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => form.setValue('amount', sisa, { shouldValidate: true })}
                >
                  Lunas ({formatRupiah(sisa)})
                </Button>
                {sisa > 100000 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => form.setValue('amount', Math.floor(sisa / 2), { shouldValidate: true })}
                  >
                    ½ ({formatRupiah(Math.floor(sisa / 2))})
                  </Button>
                )}
              </div>
            </div>

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
                      {field.value > sisa && (
                        <span className="text-destructive ml-2 font-medium">
                          ⚠️ Melebihi sisa
                        </span>
                      )}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

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

            {/* Catatan */}
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan (opsional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Misal: transfer via BCA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
              <Button
                type="submit"
                disabled={isPending || amount > sisa || amount <= 0}
                className="flex-1"
              >
                {isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
