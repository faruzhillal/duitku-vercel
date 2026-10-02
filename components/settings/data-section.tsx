'use client'

import { useTransition } from 'react'
import { Download, FileText, Database } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { exportAllData } from '@/app/(dashboard)/settings/actions'
import { InstallPWA } from './install-pwa'

interface Props {
  stats: {
    transaksi: number
    akun: number
    kategori: number
    utang: number
    titipan: number
  }
}

export function DataSection({ stats }: Props) {
  const [isPending, startTransition] = useTransition()

  const handleExport = () => {
    startTransition(async () => {
      const result = await exportAllData()
      if (!result.success || !result.data) {
        toast.error(result.error || 'Gagal export')
        return
      }

      // Download masing-masing file
      const timestamp = new Date().toISOString().split('T')[0]
      const files = [
        { name: `duitku-transaksi-${timestamp}.csv`, data: result.data.transaksi },
        { name: `duitku-akun-${timestamp}.csv`, data: result.data.akun },
        { name: `duitku-kategori-${timestamp}.csv`, data: result.data.kategori },
        { name: `duitku-utang-${timestamp}.csv`, data: result.data.utang },
        { name: `duitku-titipan-${timestamp}.csv`, data: result.data.titipan },
      ]

      for (const file of files) {
        downloadCSV(file.data, file.name)
        // Delay sedikit biar browser tidak blokir multiple downloads
        await new Promise((r) => setTimeout(r, 200))
      }

      toast.success('5 file CSV berhasil diunduh')
    })
  }

  function downloadCSV(csv: string, filename: string) {
    // BOM untuk Excel supaya baca UTF-8 dengan benar
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const totalData =
    stats.transaksi + stats.akun + stats.kategori + stats.utang + stats.titipan

  return (
    <div className="space-y-4">
      {/* PWA Install prompt */}
      <InstallPWA />

      {/* Statistik */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="w-4 h-4" />
            Data Kamu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="text-center p-3 rounded-lg bg-accent/50">
              <p className="text-2xl font-bold">{stats.transaksi}</p>
              <p className="text-xs text-muted-foreground">Transaksi</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-accent/50">
              <p className="text-2xl font-bold">{stats.akun}</p>
              <p className="text-xs text-muted-foreground">Akun</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-accent/50">
              <p className="text-2xl font-bold">{stats.kategori}</p>
              <p className="text-xs text-muted-foreground">Kategori</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-accent/50">
              <p className="text-2xl font-bold">{stats.utang}</p>
              <p className="text-xs text-muted-foreground">Utang/Piutang</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-accent/50">
              <p className="text-2xl font-bold">{stats.titipan}</p>
              <p className="text-xs text-muted-foreground">Titipan</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">
            Total {totalData} item data
          </p>
        </CardContent>
      </Card>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Unduh semua data kamu dalam format CSV. Bisa dibuka di Excel atau
            Google Sheets. Berguna untuk backup atau analisis lanjutan.
          </p>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-green-600" />
              <span>duitku-transaksi.csv ({stats.transaksi} baris)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>duitku-akun.csv ({stats.akun} baris)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-purple-600" />
              <span>duitku-kategori.csv ({stats.kategori} baris)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-red-600" />
              <span>duitku-utang.csv ({stats.utang} baris)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-amber-600" />
              <span>duitku-titipan.csv ({stats.titipan} baris)</span>
            </div>
          </div>

          <Button
            onClick={handleExport}
            disabled={isPending || totalData === 0}
            className="w-full"
            size="lg"
          >
            <Download className="w-4 h-4 mr-2" />
            {isPending ? 'Menyiapkan...' : 'Download Semua CSV'}
          </Button>

          {totalData === 0 && (
            <p className="text-xs text-muted-foreground text-center">
              Belum ada data untuk di-export
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
