'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatRupiah, formatTanggal } from '@/lib/utils'
import { TIPE_AKUN_OPTIONS } from '@/lib/constants'
import { AkunFormSheet } from './akun-form-sheet'
import { DeleteAkunDialog } from './delete-akun-dialog'
import { useState } from 'react'
import type { Akun, Transaksi, Kategori } from '@/app/generated/prisma'
import type { AkunWithStats } from '@/types'

interface Props {
  akun: Akun
  transaksi: (Transaksi & { 
    kategori: Kategori | null
    akunTujuan: Akun | null 
  })[]
}

export function AkunDetail({ akun, transaksi }: Props) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const tipe = TIPE_AKUN_OPTIONS.find((t) => t.value === akun.type)
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/accounts">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{akun.name}</h1>
          <p className="text-sm text-muted-foreground">
            {tipe?.label}
            {akun.isEntrusted && akun.owner && ` • Milik: ${akun.owner}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setDeleteOpen(true)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Hapus
          </Button>
        </div>
      </div>
      
      {/* Saldo Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">
            Saldo Sekarang
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">
            {formatRupiah(Number(akun.currentBalance))}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Saldo awal: {formatRupiah(Number(akun.initialBalance))}
          </p>
        </CardContent>
      </Card>
      
      {/* Transaksi Terakhir */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Transaksi Terakhir</h2>
        {transaksi.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Belum ada transaksi di akun ini
          </p>
        ) : (
          <div className="space-y-2">
            {transaksi.map((t) => (
              <div 
                key={t.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {t.kategori?.icon || '📝'}
                  </span>
                  <div>
                    <p className="font-medium text-sm">
                      {t.kategori?.name || t.note || 'Transaksi'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTanggal(t.date)}
                    </p>
                  </div>
                </div>
                <p className={
                  t.type === 'income' ? 'text-green-600 font-semibold' :
                  t.type === 'expense' ? 'text-red-600 font-semibold' :
                  'text-blue-600 font-semibold'
                }>
                  {t.type === 'income' ? '+' : 
                   t.type === 'expense' ? '-' : ''}
                  {formatRupiah(Number(t.amount))}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <AkunFormSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        editingAkun={{
          ...akun,
          _count: { transaksi: transaksi.length }
        } as AkunWithStats}
      />

      <DeleteAkunDialog
        akun={{
          ...akun,
          _count: { transaksi: transaksi.length }
        }}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onSuccess={() => router.push('/accounts')}
      />
    </div>
  )
}
