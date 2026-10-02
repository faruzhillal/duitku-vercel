'use client'

import { useState } from 'react'
import { Plus, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AkunCard } from './akun-card'
import { AkunFormSheet } from './akun-form-sheet'
import { formatRupiah } from '@/lib/utils'
import type { AkunWithStats } from '@/types'

interface Props {
  akun: AkunWithStats[]
}

export function AkunList({ akun }: Props) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAkun, setEditingAkun] = useState<AkunWithStats | null>(null)
  
  // Pisahkan akun pribadi vs titipan
  const akunPribadi = akun.filter((a) => !a.isEntrusted)
  const akunTitipan = akun.filter((a) => a.isEntrusted)
  
  // Total saldo pribadi
  const totalPribadi = akunPribadi.reduce(
    (sum, a) => sum + Number(a.currentBalance), 0
  )
  
  const handleEdit = (akun: AkunWithStats) => {
    setEditingAkun(akun)
    setIsFormOpen(true)
  }
  
  const handleClose = () => {
    setIsFormOpen(false)
    setEditingAkun(null)
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Akun Saya</h1>
          <p className="text-sm text-muted-foreground">
            Total uang pribadi: {formatRupiah(totalPribadi)}
          </p>
        </div>
        <Button 
          onClick={() => setIsFormOpen(true)}
          className="hidden md:flex"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Akun
        </Button>
      </div>
      
      {/* Akun Pribadi */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase">
          Uang Pribadi
        </h2>
        {akunPribadi.length === 0 ? (
          <EmptyState onAdd={() => setIsFormOpen(true)} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {akunPribadi.map((a) => (
              <AkunCard key={a.id} akun={a} onEdit={() => handleEdit(a)} />
            ))}
          </div>
        )}
      </section>
      
      {/* Akun Titipan */}
      {akunTitipan.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase">
            Uang Titipan (bukan aset kamu)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {akunTitipan.map((a) => (
              <AkunCard key={a.id} akun={a} onEdit={() => handleEdit(a)} />
            ))}
          </div>
        </section>
      )}
      
      {/* Floating button mobile */}
      <Button
        onClick={() => setIsFormOpen(true)}
        size="icon"
        className="fixed bottom-20 right-4 md:hidden w-14 h-14 rounded-full shadow-lg z-40"
      >
        <Plus className="w-6 h-6" />
      </Button>
      
      {/* Form Sheet */}
      <AkunFormSheet
        open={isFormOpen}
        onOpenChange={handleClose}
        editingAkun={editingAkun}
      />
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="border-2 border-dashed rounded-lg p-8 text-center">
      <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
      <p className="text-muted-foreground mb-4">
        Belum ada akun. Mulai dengan menambahkan akun pertama kamu.
      </p>
      <Button onClick={onAdd}>
        <Plus className="w-4 h-4 mr-2" />
        Tambah Akun Pertama
      </Button>
    </div>
  )
}
