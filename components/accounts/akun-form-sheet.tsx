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
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { akunSchema, type AkunInput } from '@/lib/validators/akun'
import { TIPE_AKUN_OPTIONS, AKUN_COLORS } from '@/lib/constants'
import { createAkun, updateAkun } from '@/app/(dashboard)/accounts/actions'
import type { AkunWithStats } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingAkun: AkunWithStats | null
}

export function AkunFormSheet({ open, onOpenChange, editingAkun }: Props) {
  const [isPending, startTransition] = useTransition()
  const isEdit = !!editingAkun
  
  const form = useForm<AkunInput>({
    resolver: zodResolver(akunSchema),
    defaultValues: {
      name: '',
      type: 'cash',
      initialBalance: 0,
      icon: '',
      color: AKUN_COLORS[0],
      isEntrusted: false,
      owner: '',
    }
  })
  
  // Reset form ketika editingAkun berubah
  useEffect(() => {
    if (editingAkun) {
      form.reset({
        name: editingAkun.name,
        type: editingAkun.type as "cash" | "bank" | "ewallet" | "emoney",
        initialBalance: Number(editingAkun.initialBalance),
        icon: editingAkun.icon || '',
        color: editingAkun.color || AKUN_COLORS[0],
        isEntrusted: editingAkun.isEntrusted,
        owner: editingAkun.owner || '',
      })
    } else {
      form.reset({
        name: '',
        type: 'cash',
        initialBalance: 0,
        icon: '',
        color: AKUN_COLORS[0],
        isEntrusted: false,
        owner: '',
      })
    }
  }, [editingAkun, form])
  
  const onSubmit = (data: AkunInput) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateAkun(editingAkun.id, data)
        : await createAkun(data)
      
      if (result.success) {
        toast.success(isEdit ? 'Akun berhasil diupdate' : 'Akun berhasil dibuat')
        onOpenChange(false)
        form.reset()
      } else {
        toast.error(result.error || 'Terjadi kesalahan')
        // Set field errors kalau ada
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            form.setError(field as keyof AkunInput, {
              message: errors[0]
            })
          })
        }
      }
    })
  }
  
  const isEntrusted = form.watch('isEntrusted')
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit Akun' : 'Tambah Akun Baru'}</SheetTitle>
          <SheetDescription>
            {isEdit 
              ? 'Ubah informasi akun kamu' 
              : 'Isi informasi akun keuangan kamu'}
          </SheetDescription>
        </SheetHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
            {/* Nama Akun */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Akun</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: BCA, Tunai, GoPay" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Tipe Akun */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipe Akun</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIPE_AKUN_OPTIONS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.icon} {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Saldo Awal */}
            <FormField
              control={form.control}
              name="initialBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isEdit ? 'Saldo Awal (hati-hati mengubah ini)' : 'Saldo Awal'}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  {isEdit && (
                    <FormDescription className="text-amber-600">
                      ⚠️ Mengubah saldo awal akan menghitung ulang saldo sekarang
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Ikon (emoji) */}
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ikon (opsional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ketik emoji, misal: 🏦" 
                      maxLength={2}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Copy emoji dari keyboard HP kamu
                  </FormDescription>
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
            
            {/* Toggle Titipan */}
            <FormField
              control={form.control}
              name="isEntrusted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Uang Titipan</FormLabel>
                    <FormDescription>
                      Aktifkan kalau ini uang orang lain yang kamu pegang
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch 
                      checked={field.value} 
                      onCheckedChange={field.onChange} 
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {/* Pemilik (muncul kalau titipan) */}
            {isEntrusted && (
              <FormField
                control={form.control}
                name="owner"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Pemilik</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Contoh: Saudara, Kakak" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
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
              <Button 
                type="submit" 
                disabled={isPending}
                className="flex-1"
              >
                {isPending 
                  ? 'Menyimpan...' 
                  : isEdit ? 'Simpan Perubahan' : 'Tambah Akun'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
