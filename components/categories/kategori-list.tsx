'use client'

import { useState, useMemo } from 'react'
import { Plus, Tag } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { KategoriItem } from './kategori-item'
import { KategoriFormSheet } from './kategori-form-sheet'
import type { Kategori } from '@/app/generated/prisma'

type KategoriWithCount = Kategori & {
  _count: { transaksi: number }
}

interface Props {
  kategori: KategoriWithCount[]
}

export function KategoriList({ kategori }: Props) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingKategori, setEditingKategori] = useState<KategoriWithCount | null>(null)
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense')

  const { expenseList, incomeList } = useMemo(() => {
    return {
      expenseList: kategori.filter((k) => k.type === 'expense'),
      incomeList: kategori.filter((k) => k.type === 'income'),
    }
  }, [kategori])

  const handleEdit = (k: KategoriWithCount) => {
    setEditingKategori(k)
    setIsFormOpen(true)
  }

  const handleClose = () => {
    setIsFormOpen(false)
    setEditingKategori(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kategori</h1>
          <p className="text-sm text-muted-foreground">
            {kategori.length} kategori terdaftar
          </p>
        </div>
        <Button 
          onClick={() => {
            setEditingKategori(null)
            setIsFormOpen(true)
          }}
          className="hidden md:flex"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Kategori
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="expense">
            Pengeluaran ({expenseList.length})
          </TabsTrigger>
          <TabsTrigger value="income">
            Pemasukan ({incomeList.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expense" className="space-y-2 mt-4">
          {expenseList.length === 0 ? (
            <EmptyState 
              onAdd={() => {
                setActiveTab('expense')
                setEditingKategori(null)
                setIsFormOpen(true)
              }}
              label="pengeluaran"
            />
          ) : (
            expenseList.map((k) => (
              <KategoriItem 
                key={k.id} 
                kategori={k} 
                onEdit={() => handleEdit(k)} 
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="income" className="space-y-2 mt-4">
          {incomeList.length === 0 ? (
            <EmptyState 
              onAdd={() => {
                setActiveTab('income')
                setEditingKategori(null)
                setIsFormOpen(true)
              }}
              label="pemasukan"
            />
          ) : (
            incomeList.map((k) => (
              <KategoriItem 
                key={k.id} 
                kategori={k} 
                onEdit={() => handleEdit(k)} 
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Floating button mobile */}
      <Button
        onClick={() => {
          setEditingKategori(null)
          setIsFormOpen(true)
        }}
        size="icon"
        className="fixed bottom-20 right-4 md:hidden w-14 h-14 rounded-full shadow-lg z-40"
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Form Sheet */}
      <KategoriFormSheet
        open={isFormOpen}
        onOpenChange={handleClose}
        editingKategori={editingKategori}
        defaultType={activeTab}
      />
    </div>
  )
}

function EmptyState({ onAdd, label }: { onAdd: () => void; label: string }) {
  return (
    <div className="border-2 border-dashed rounded-lg p-8 text-center">
      <Tag className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
      <p className="text-muted-foreground mb-4">
        Belum ada kategori {label}
      </p>
      <Button onClick={onAdd} variant="outline">
        <Plus className="w-4 h-4 mr-2" />
        Tambah Kategori
      </Button>
    </div>
  )
}
