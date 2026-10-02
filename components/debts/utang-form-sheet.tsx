'use client'

import { useEffect, useTransition } from 'react'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { utangSchema, type UtangInput } from '@/lib/validators/utang'
import { createUtang, updateUtang } from '@/app/(dashboard)/debts/actions'
import { formatRupiah } from '@/lib/utils'
import type { UtangWithPayments } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingUtang: UtangWithPayments | null
}

export function UtangFormSheet({ open, onOpenChange, editingUtang }: Props) {
  const [isPending, startTransition] = useTransition()
  const isEdit = !!editingUtang

  const form = useForm<UtangInput>({
    resolver: zodResolver(utangSchema),
    defaultValues: {
      person: '',
      amount: 0,
      type: 'receivable',
      dueDate: '',
      note: '',
    },
  })

  useEffect(() => {
    if (editingUtang) {
      form.reset({
        person: editingUtang.person,
        amount: editingUtang.amount,
        type: editingUtang.type as 'payable' | 'receivable',
        dueDate: editingUtang.dueDate
          ? new Date(editingUtang.dueDate).toISOString().split('T')[0]
          : '',
        note: editingUtang.note || '',
      })
    } else {
      form.reset({
        person: '',
        amount: 0,
        type: 'receivable',
        dueDate: '',
        note: '',
      })
    }
  }, [editingUtang, form, open])

  const onSubmit = (data: UtangInput) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateUtang(editingUtang.id, data)
        : await createUtang(data)

      if (result.success) {
        toast.success(isEdit ? 'Utang berhasil diupdate' : 'Berhasil dicatat')
        onOpenChange(false)
        form.reset()
      } else {
        toast.error(result.error || 'Terjadi kesalahan')
      }
    })
  }

  const tipe = form.watch('type')

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit' : 'Tambah'} Utang / Piutang</SheetTitle>
          <SheetDescription>Catat pinjaman kamu atau orang lain</SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
            {/* Tipe */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipe</FormLabel>
                  <Tabs value={field.value} onValueChange={field.onChange}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="receivable">📥 Piutang</TabsTrigger>
                      <TabsTrigger value="payable">📤 Utang</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <FormDescription>
                    {tipe === 'receivable'
                      ? 'Orang lain berutang ke kamu'
                      : 'Kamu berutang ke orang lain'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nama orang */}
            <FormField
              control={form.control}
              name="person"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {tipe === 'receivable' ? 'Yang Berutang' : 'Yang Kamu Utangi'}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Mama, Saudara, Kakak" {...field} />
                  </FormControl>
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
                    <FormDescription>{formatRupiah(field.value)}</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Jatuh tempo */}
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jatuh Tempo (opsional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>
                    Kosongkan kalau tidak ada target waktu
                  </FormDescription>
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
                    <Input placeholder="Misal: pinjam untuk makan" {...field} />
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
              <Button type="submit" disabled={isPending} className="flex-1">
                {isPending ? 'Menyimpan...' : isEdit ? 'Simpan' : 'Tambah'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
