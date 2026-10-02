'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Pencil, Plus, Trash2, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { UtangFormSheet } from './utang-form-sheet'
import { PembayaranFormSheet } from './pembayaran-form-sheet'
import { DeletePembayaranDialog } from './delete-pembayaran-dialog'
import { formatRupiah, formatTanggal } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
  hitungTotalDibayar,
  hitungSisa,
  hitungProgress,
  getDueStatus,
  getDueStatusLabel,
} from '@/lib/utang-helpers'
import type { UtangWithPayments } from '@/types'

interface Props {
  utang: UtangWithPayments
}

export function UtangDetail({ utang }: Props) {
  const [editOpen, setEditOpen] = useState(false)
  const [bayarOpen, setBayarOpen] = useState(false)

  const isReceivable = utang.type === 'receivable'
  const totalDibayar = hitungTotalDibayar(utang.pembayaran)
  const sisa = hitungSisa(utang.amount, utang.pembayaran)
  const progress = hitungProgress(utang.amount, totalDibayar)
  const dueStatus = getDueStatus(utang.dueDate, utang.status)
  const dueLabel = getDueStatusLabel(dueStatus, utang.dueDate)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/debts">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{utang.person}</h1>
          <p className="text-sm text-muted-foreground">
            {isReceivable ? 'Piutang' : 'Utang'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil className="w-4 h-4 mr-2" />
          Edit
        </Button>
      </div>

      {/* Card utama */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">
            Sisa {isReceivable ? 'Piutang' : 'Utang'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p
            className={cn(
              'text-3xl font-bold',
              utang.status === 'paid'
                ? 'text-green-600'
                : isReceivable
                ? 'text-green-600'
                : 'text-red-600'
            )}
          >
            {utang.status === 'paid' ? 'LUNAS' : formatRupiah(sisa)}
          </p>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t">
            <div>
              <p className="text-xs text-muted-foreground">Jumlah Total</p>
              <p className="font-semibold">{formatRupiah(utang.amount)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sudah Dibayar</p>
              <p className="font-semibold text-green-600">
                {formatRupiah(totalDibayar)}
              </p>
            </div>
            {utang.dueDate && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Jatuh Tempo</p>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-semibold">
                    {formatTanggal(utang.dueDate, 'dd MMMM yyyy')}
                  </span>
                  {utang.status !== 'paid' && dueLabel && (
                    <Badge variant="outline" className="text-[10px]">
                      {dueLabel}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            {utang.note && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Catatan</p>
                <p className="mt-1 text-sm">{utang.note}</p>
              </div>
            )}
          </div>

          {/* Progress */}
          {utang.status !== 'unpaid' && (
            <div className="space-y-2 pt-2 border-t">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Progress Pembayaran</span>
                <span className="font-semibold">{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Tombol aksi */}
          {utang.status !== 'paid' && (
            <Button
              onClick={() => setBayarOpen(true)}
              className="w-full"
              size="lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isReceivable ? 'Catat Penerimaan' : 'Catat Pembayaran'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Riwayat Pembayaran */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">
            Riwayat Pembayaran ({utang.pembayaran.length})
          </h2>
        </div>

        {utang.pembayaran.length === 0 ? (
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Belum ada pembayaran
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {utang.pembayaran.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 border rounded-lg group hover:bg-accent/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                    💰
                  </div>
                  <div>
                    <p className="font-semibold text-sm">
                      {formatRupiah(p.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTanggal(p.date, 'dd MMM yyyy')}
                      {p.note && ` • ${p.note}`}
                    </p>
                  </div>
                </div>
                <DeletePembayaranDialog pembayaranId={p.id}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </DeletePembayaranDialog>
              </div>
            ))}
          </div>
        )}
      </div>

      <UtangFormSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        editingUtang={utang}
      />

      <PembayaranFormSheet
        open={bayarOpen}
        onOpenChange={setBayarOpen}
        utang={utang}
      />
    </div>
  )
}
