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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'
import { titipanSchema, type TitipanInput } from '@/lib/validators/titipan'
import { createTitipan, updateTitipan } from '@/app/(dashboard)/entrusted/actions'
import { formatRupiah } from '@/lib/utils'

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
  open: boolean
  onOpenChange: (open: boolean) => void
  editingTitipan: TitipanData | null
}

export function TitipanFormSheet({ open, onOpenChange, editingTitipan }: Props) {
  const [isPending, startTransition] = useTransition()
  const isEdit = !!editingTitipan

  const form = useForm<TitipanInput>({
    resolver: zodResolver(titipanSchema),
    defaultValues: {
      owner: '',
      amount: 0,
      note: '',
    },
  })

  useEffect(() => {
    if (editingTitipan) {
      form.reset({
        owner: editingTitipan.owner,
        amount: editingTitipan.amount,
        note: editingTitipan.note || '',
      })
    } else {
      form.reset({
        owner: '',
        amount: 0,
        note: '',
      })
    }
  }, [editingTitipan, form, open])

  const onSubmit = (data: TitipanInput) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateTitipan(editingTitipan.id, data)
        : await createTitipan(data)

      if (result.success) {
        toast.success(isEdit ? 'Titipan diupdate' : 'Titipan dicatat')
        onOpenChange(false)
        form.reset()
      } else {
        toast.error(result.error || 'Terjadi kesalahan')
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit' : 'Tambah'} Uang Titipan</SheetTitle>
          <SheetDescription>Catat uang orang lain yang kamu pegang</SheetDescription>
        </SheetHeader>

        <Alert className="mt-4 border-amber-500 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-xs">
            Uang ini BUKAN milik kamu. Pastikan kamu mencatat dengan benar.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            {/* Pemilik */}
            <FormField
              control={form.control}
              name="owner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Pemilik</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Saudara, Kakak, Teman" {...field} />
                  </FormControl>
                  <FormDescription>
                    Siapa yang menitipkan uang ini ke kamu?
                  </FormDescription>
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
                  <FormLabel>Jumlah Titipan</FormLabel>
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

            {/* Catatan */}
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan (opsional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Misal: titipan untuk beli tiket" {...field} />
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
