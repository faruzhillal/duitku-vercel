'use client'

import { useState, useMemo } from 'react'
import { Plus, HandCoins, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UtangItem } from './utang-item'
import { UtangFormSheet } from './utang-form-sheet'
import { formatRupiah } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { UtangWithPayments } from '@/types'

interface Props {
  utang: UtangWithPayments[]
  summary: {
    totalPiutang: number
    totalUtang: number
    net: number
  }
  filters: {
    type?: 'payable' | 'receivable'
    status?: 'unpaid' | 'partial' | 'paid'
  }
}

export function UtangList({ utang, summary, filters }: Props) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingUtang, setEditingUtang] = useState<UtangWithPayments | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'payable' | 'receivable'>(
    filters.type || 'all'
  )
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'partial' | 'paid'>(
    filters.status || 'all'
  )

  const filtered = useMemo(() => {
    let result = utang
    if (activeTab !== 'all') {
      result = result.filter((u) => u.type === activeTab)
    }
    if (statusFilter !== 'all') {
      result = result.filter((u) => u.status === statusFilter)
    }
    return result
  }, [utang, activeTab, statusFilter])

  const handleEdit = (u: UtangWithPayments) => {
    setEditingUtang(u)
    setIsFormOpen(true)
  }

  const handleClose = () => {
    setIsFormOpen(false)
    setEditingUtang(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Utang & Piutang</h1>
          <p className="text-sm text-muted-foreground">
            Catat semua pinjaman kamu
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs text-muted-foreground">
                Piutang (orang utang ke kamu)
              </span>
            </div>
            <p className="text-xl font-bold text-green-600">
              {formatRupiah(summary.totalPiutang)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-xs text-muted-foreground">
                Utang (kamu utang ke orang)
              </span>
            </div>
            <p className="text-xl font-bold text-red-600">
              {formatRupiah(summary.totalUtang)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <HandCoins className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-muted-foreground">Net</span>
            </div>
            <p
              className={cn(
                'text-xl font-bold',
                summary.net >= 0 ? 'text-green-600' : 'text-red-600'
              )}
            >
              {summary.net >= 0 ? '+' : ''}
              {formatRupiah(summary.net)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Tipe */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">Semua</TabsTrigger>
          <TabsTrigger value="receivable">Piutang</TabsTrigger>
          <TabsTrigger value="payable">Utang</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Status Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['all', 'unpaid', 'partial', 'paid'] as const).map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(status)}
            className="shrink-0"
          >
            {status === 'all'
              ? 'Semua'
              : status === 'unpaid'
              ? 'Belum Bayar'
              : status === 'partial'
              ? 'Sebagian'
              : 'Lunas'}
          </Button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          onAdd={() => setIsFormOpen(true)}
          hasFilter={activeTab !== 'all' || statusFilter !== 'all'}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => (
            <UtangItem
              key={u.id}
              utang={u}
              onEdit={() => handleEdit(u)}
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

      <UtangFormSheet
        open={isFormOpen}
        onOpenChange={handleClose}
        editingUtang={editingUtang}
      />
    </div>
  )
}

function EmptyState({
  onAdd,
  hasFilter,
}: {
  onAdd: () => void
  hasFilter: boolean
}) {
  return (
    <div className="border-2 border-dashed rounded-lg p-8 text-center">
      <HandCoins className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
      <p className="text-muted-foreground mb-4">
        {hasFilter
          ? 'Tidak ada data yang cocok dengan filter'
          : 'Belum ada utang atau piutang. Mulai catat!'}
      </p>
      {!hasFilter && (
        <Button onClick={onAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Pertama
        </Button>
      )}
    </div>
  )
}
