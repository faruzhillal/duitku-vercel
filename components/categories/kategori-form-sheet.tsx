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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { kategoriSchema, type KategoriInput } from '@/lib/validators/kategori'
import { AKUN_COLORS } from '@/lib/constants'
import { createKategori, updateKategori } from '@/app/(dashboard)/categories/actions'
import type { Kategori } from '@/app/generated/prisma'
import { cn } from '@/lib/utils'

// Daftar emoji populer untuk kategori
const EMOJI_OPTIONS = [
  '🍔', '🍕', '☕', '🍜', '🍰',
  '🚗', '🚌', '⛽', '🚕', '✈️',
  '📚', '✏️', '🎓', '💻', '📱',
  '💊', '🏥', '💉', '🩺', '🧘',
  '🎮', '🎬', '🎵', '🎨', '🎭',
  '📄', '💡', '💧', '🔥', '📡',
  '💰', '💵', '💸', '🏦', '💳',
  '🎁', '👕', '👟', '💄', '🏠',
  '📦', '❓', '⭐', '❤️', '🎯',
]

type KategoriWithCount = Kategori & {
  _count: { transaksi: number }
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingKategori: KategoriWithCount | null
  defaultType?: 'income' | 'expense'
}

export function KategoriFormSheet({ 
  open, 
  onOpenChange, 
  editingKategori,
  defaultType = 'expense',
}: Props) {
  const [isPending, startTransition] = useTransition()
  const isEdit = !!editingKategori
  const isDefault = editingKategori?.isDefault ?? false

  const form = useForm<KategoriInput>({
    resolver: zodResolver(kategoriSchema),
    defaultValues: {
      name: '',
      type: defaultType,
      icon: '📝',
      color: AKUN_COLORS[0],
    }
  })

  useEffect(() => {
    if (editingKategori) {
      form.reset({
        name: editingKategori.name,
        type: editingKategori.type as 'income' | 'expense',
        icon: editingKategori.icon || '📝',
        color: editingKategori.color || AKUN_COLORS[0],
        parentId: editingKategori.parentId || undefined,
      })
    } else {
      form.reset({
        name: '',
        type: defaultType,
        icon: '📝',
        color: AKUN_COLORS[0],
        parentId: undefined,
      })
    }
  }, [editingKategori, defaultType, form])

  const onSubmit = (data: KategoriInput) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateKategori(editingKategori.id, data)
        : await createKategori(data)

      if (result.success) {
        toast.success(isEdit ? 'Kategori berhasil diupdate' : 'Kategori berhasil dibuat')
        onOpenChange(false)
        form.reset()
      } else {
        toast.error(result.error || 'Terjadi kesalahan')
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            form.setError(field as keyof KategoriInput, { message: errors[0] })
          })
        }
      }
    })
  }

  const selectedIcon = form.watch('icon')
  const selectedColor = form.watch('color')
  const selectedType = form.watch('type')

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isEdit ? 'Edit Kategori' : 'Tambah Kategori Baru'}
          </SheetTitle>
          <SheetDescription>
            {isDefault 
              ? 'Kategori default hanya bisa di-rename dan ubah ikon/warna'
              : isEdit 
                ? 'Ubah informasi kategori' 
                : 'Buat kategori baru untuk transaksi kamu'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
            {/* Preview */}
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-accent/30">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${selectedColor || '#0ea5e9'}20` }}
              >
                {selectedIcon || '📝'}
              </div>
              <div>
                <p className="font-medium">
                  {form.watch('name') || 'Nama Kategori'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedType === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                </p>
              </div>
            </div>

            {/* Nama */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Kategori</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Makan Siang" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipe (disabled kalau default) */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipe</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={isDefault}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="expense">Pengeluaran</SelectItem>
                      <SelectItem value="income">Pemasukan</SelectItem>
                    </SelectContent>
                  </Select>
                  {isDefault && (
                    <FormDescription>
                      Tipe kategori default tidak bisa diubah
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Ikon Picker */}
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ikon</FormLabel>
                  <div className="grid grid-cols-9 gap-1 max-h-40 overflow-y-auto p-2 border rounded-lg">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => field.onChange(emoji)}
                        className={cn(
                          'w-8 h-8 rounded flex items-center justify-center text-lg transition-all hover:bg-accent',
                          field.value === emoji && 'bg-accent ring-2 ring-primary'
                        )}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <FormControl>
                    <Input 
                      placeholder="Atau ketik emoji manual" 
                      maxLength={2}
                      {...field} 
                      className="mt-2"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Warna */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Warna</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {AKUN_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => field.onChange(color)}
                        className={cn(
                          'w-8 h-8 rounded-full border-2 transition-all',
                          field.value === color 
                            ? 'border-foreground scale-110' 
                            : 'border-transparent'
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
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
                  : isEdit ? 'Simpan Perubahan' : 'Tambah Kategori'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
