'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Akun, Kategori } from '@/types'

interface Props {
  akunList: Akun[]
  kategoriList: Kategori[]
}

export function TransaksiFilters({ akunList, kategoriList }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '')
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/transactions?${params.toString()}`)
  }, [router, searchParams])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label className="text-xs">Akun</Label>
        <Select 
          value={searchParams?.get('accountId') || 'all'} 
          onValueChange={(v) => updateFilter('accountId', v === 'all' ? '' : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Semua Akun" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Akun</SelectItem>
            {akunList.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Kategori</Label>
        <Select 
          value={searchParams?.get('categoryId') || 'all'} 
          onValueChange={(v) => updateFilter('categoryId', v === 'all' ? '' : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Semua Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {kategoriList.map((k) => (
              <SelectItem key={k.id} value={k.id}>
                {k.icon} {k.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Tipe</Label>
        <Select 
          value={searchParams?.get('type') || 'all'} 
          onValueChange={(v) => updateFilter('type', v === 'all' ? '' : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Semua Tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            <SelectItem value="income">Pemasukan</SelectItem>
            <SelectItem value="expense">Pengeluaran</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Dari Tanggal</Label>
        <Input
          type="date"
          value={searchParams?.get('from') || ''}
          onChange={(e) => updateFilter('from', e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Sampai Tanggal</Label>
        <Input
          type="date"
          value={searchParams?.get('to') || ''}
          onChange={(e) => updateFilter('to', e.target.value)}
        />
      </div>
    </div>
  )
}
