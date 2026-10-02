'use client'

import { useState } from 'react'
import { Plus, ShieldCheck, AlertTriangle, HandCoins, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TitipanItem } from './titipan-item'
import { TitipanFormSheet } from './titipan-form-sheet'
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
  titipan: TitipanData[]
  summary: {
    total: number
    held: number
    borrowed: number
    perPemilik: { owner: string; total: number; count: number }[]
  }
  filters: {
    status?: 'held' | 'borrowed' | 'returned'
  }
}

export function TitipanList({ titipan, summary }: Props) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTitipan, setEditingTitipan] = useState<TitipanData | null>(null)

  const handleEdit = (t: TitipanData) => {
    setEditingTitipan(t)
    setIsFormOpen(true)
  }

  const handleClose = () => {
    setIsFormOpen(false)
    setEditingTitipan(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Uang Titipan</h1>
          <p className="text-sm text-muted-foreground">
            Uang orang lain yang kamu pegang
          </p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="hidden md:flex"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah
        </Button>
      </div>

      {/* Warning utama */}
      <Alert className="border-amber-500 bg-amber-500/10">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-sm">
          <span className="font-semibold">Perhatian!</span> Uang ini BUKAN milik kamu.
          Jangan dipakai untuk keperluan pribadi. Catat setiap perubahan status dengan teliti.
        </AlertDescription>
      </Alert>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="border-2 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Aktif</span>
            </div>
            <p className="text-2xl font-bold text-primary">
              {formatRupiah(summary.total)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.perPemilik.length} pemilik
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Dipegang</span>
            </div>
            <p className="text-xl font-bold text-green-600">
              {formatRupiah(summary.held)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Uang ada di tangan kamu
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <HandCoins className="w-4 h-4 text-red-600" />
              <span className="text-xs text-muted-foreground">Dipinjam</span>
            </div>
            <p className="text-xl font-bold text-red-600">
              {formatRupiah(summary.borrowed)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Uang dipinjam orang lain
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Per pemilik */}
      {summary.perPemilik.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-3 font-medium">Per Pemilik</p>
            <div className="space-y-2">
              {summary.perPemilik.map((p) => (
                <div key={p.owner} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{p.owner}</span>
                  <div className="text-right">
                    <span className="text-sm font-semibold">
                      {formatRupiah(p.total)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({p.count})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {titipan.length === 0 ? (
        <EmptyState onAdd={() => setIsFormOpen(true)} />
      ) : (
        <div className="space-y-2">
          {titipan.map((t) => (
            <TitipanItem
              key={t.id}
              titipan={t}
              onEdit={() => handleEdit(t)}
            />
          ))}
        </div>
      )}

      {/* Floating button mobile */}
      <Button
        onClick={() => setIsFormOpen(true)}
        size="icon"
        className="fixed bottom-20 right-4 md:hidden w-14 h-14 rounded-full shadow-lg z-40"
      >
        <Plus className="w-6 h-6" />
      </Button>

      <TitipanFormSheet
        open={isFormOpen}
        onOpenChange={handleClose}
        editingTitipan={editingTitipan}
      />
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="border-2 border-dashed rounded-lg p-8 text-center">
      <ShieldCheck className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
      <p className="text-muted-foreground mb-4">
        Belum ada uang titipan. Kalau kamu pegang uang orang lain, catat di sini.
      </p>
      <Button onClick={onAdd}>
        <Plus className="w-4 h-4 mr-2" />
        Tambah Titipan
      </Button>
    </div>
  )
}
