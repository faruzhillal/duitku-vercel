'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Plus, Receipt, Filter, X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TransaksiItem } from './transaksi-item'
import { TransaksiFormSheet } from './transaksi-form-sheet'
import { TransaksiFilters } from './transaksi-filters'
import { formatRupiah, formatTanggal } from '@/lib/utils'
import type { TransaksiWithRelations, Akun, Kategori } from '@/types'

interface Props {
  transaksi: TransaksiWithRelations[]
  akunList: Akun[]
  kategoriList: Kategori[]
  filters: {
    accountId?: string
    categoryId?: string
    type?: string
    from?: string
    to?: string
  }
}

export function TransaksiList({ transaksi, akunList, kategoriList, filters }: Props) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTransaksi, setEditingTransaksi] = useState<TransaksiWithRelations | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  useEffect(() => {
    // Kalau ada ?action=new, buka form
    if (searchParams.get('action') === 'new') {
      setIsFormOpen(true)
      // Bersihkan query param
      router.replace(pathname, { scroll: false })
    }
  }, [searchParams, router, pathname])

  // Group transaksi by date
  const grouped = useMemo(() => {
    const map = new Map<string, TransaksiWithRelations[]>()
    for (const t of transaksi) {
      const key = formatTanggal(t.date, 'yyyy-MM-dd')
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [transaksi])

  // Hitung total per hari
  const dailyTotals = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>()
    for (const t of transaksi) {
      const key = formatTanggal(t.date, 'yyyy-MM-dd')
      if (!map.has(key)) map.set(key, { income: 0, expense: 0 })
      const curr = map.get(key)!
      const amt = Number(t.amount)
      if (t.type === 'income') curr.income += amt
      else if (t.type === 'expense') curr.expense += amt
    }
    return map
  }, [transaksi])

  const activeFiltersCount = Object.values(filters).filter(Boolean).length

  const handleEdit = (t: TransaksiWithRelations) => {
    setEditingTransaksi(t)
    setIsFormOpen(true)
  }

  const handleClose = () => {
    setIsFormOpen(false)
    setEditingTransaksi(null)
  }

  const clearFilters = () => {
    router.push('/transactions')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transaksi</h1>
          <p className="text-sm text-muted-foreground">
            {transaksi.length} transaksi terakhir
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <Filter className="w-4 h-4" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-purple-500/30 text-purple-600 hover:bg-purple-500/10 hover:text-purple-700"
          >
            <Link href="/transactions/ai">
              <Sparkles className="w-4 h-4 mr-1.5 text-purple-600" />
              <span>Input AI</span>
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1 py-0 h-4 bg-purple-500/10 text-purple-600 border border-purple-500/20">
                Beta
              </Badge>
            </Link>
          </Button>
          <Button
            onClick={() => {
              setEditingTransaksi(null)
              setIsFormOpen(true)
            }}
            className="hidden md:flex"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Transaksi
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Filter Transaksi</h3>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Reset
              </Button>
            )}
          </div>
          <TransaksiFilters
            akunList={akunList}
            kategoriList={kategoriList}
          />
        </Card>
      )}

      {/* List */}
      {transaksi.length === 0 ? (
        <EmptyState 
          onAdd={() => {
            setEditingTransaksi(null)
            setIsFormOpen(true)
          }} 
          hasFilters={activeFiltersCount > 0} 
        />
      ) : (
        <div className="space-y-6">
          {grouped.map(([date, items]) => {
            const totals = dailyTotals.get(date) || { income: 0, expense: 0 }
            return (
              <div key={date} className="space-y-2">
                {/* Date header */}
                <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10 py-2">
                  <h3 className="text-sm font-semibold">
                    {formatTanggal(date, 'EEEE, dd MMM yyyy')}
                  </h3>
                  <div className="flex gap-2 text-xs">
                    {totals.income > 0 && (
                      <Badge variant="outline" className="text-green-600 border-green-600 dark:text-green-400">
                        +{formatRupiah(totals.income)}
                      </Badge>
                    )}
                    {totals.expense > 0 && (
                      <Badge variant="outline" className="text-red-600 border-red-600 dark:text-red-400">
                        -{formatRupiah(totals.expense)}
                      </Badge>
                    )}
                  </div>
                </div>
                {/* Items */}
                <div className="space-y-2">
                  {items.map((t) => (
                    <TransaksiItem
                      key={t.id}
                      transaksi={t}
                      onEdit={() => handleEdit(t)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Floating button mobile */}
      <Button
        onClick={() => {
          setEditingTransaksi(null)
          setIsFormOpen(true)
        }}
        size="icon"
        className="fixed bottom-20 right-4 md:hidden w-14 h-14 rounded-full shadow-lg z-40"
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Form */}
      <TransaksiFormSheet
        open={isFormOpen}
        onOpenChange={handleClose}
        editingTransaksi={editingTransaksi}
        akunList={akunList}
        kategoriList={kategoriList}
      />
    </div>
  )
}

function EmptyState({ onAdd, hasFilters }: { onAdd: () => void; hasFilters: boolean }) {
  return (
    <div className="border-2 border-dashed rounded-lg p-8 text-center">
      <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
      <p className="text-muted-foreground mb-4">
        {hasFilters 
          ? 'Tidak ada transaksi yang cocok dengan filter' 
          : 'Belum ada transaksi. Mulai catat pengeluaran pertama kamu!'}
      </p>
      {!hasFilters && (
        <Button onClick={onAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Transaksi
        </Button>
      )}
    </div>
  )
}
