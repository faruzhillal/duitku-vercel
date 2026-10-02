'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calculator, AlertTriangle, CheckCircle2, ChevronRight, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RekonsiliasiFormSheet } from './rekonsiliasi-form-sheet'
import { formatRupiah, formatTanggal, cn } from '@/lib/utils'
import { getRekonStatusLabel, getRekonStatusVariant } from '@/lib/rekonsiliasi-helpers'

interface AkunStatus {
  id: string
  name: string
  type: string
  icon: string | null
  color: string | null
  isEntrusted: boolean
  currentBalance: number
  lastRekonsiliasiAt: Date | null
  lastDifference: number | null
  daysSince: number | null
  status: 'belum-pernah' | 'segar' | 'perlu' | 'terlambat'
}

interface Riwayat {
  id: string
  date: Date
  accountId: string
  account: { id: string; name: string; icon: string | null; color: string | null }
  systemBalance: number
  actualBalance: number
  difference: number
  reason: string
  adjustmentTx: { id: string; type: string; amount: number } | null
}

interface Props {
  akunStatus: AkunStatus[]
  riwayat: Riwayat[]
}

export function RekonsiliasiList({ akunStatus, riwayat }: Props) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedAkunId, setSelectedAkunId] = useState<string | null>(null)

  // Kategori: perlu dicek vs sudah ok
  const perluDicek = akunStatus.filter(
    (a) => a.status === 'belum-pernah' || a.status === 'perlu' || a.status === 'terlambat'
  )
  const sudahOk = akunStatus.filter((a) => a.status === 'segar')

  const handleRekon = (akunId: string) => {
    setSelectedAkunId(akunId)
    setIsFormOpen(true)
  }

  const handleClose = () => {
    setIsFormOpen(false)
    setSelectedAkunId(null)
  }

  const akunSelected = akunStatus.find((a) => a.id === selectedAkunId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Rekonsiliasi Saldo</h1>
        <p className="text-sm text-muted-foreground">
          Cek apakah saldo sistem sama dengan saldo asli
        </p>
      </div>

      {/* Info */}
      <Alert>
        <Calculator className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <span className="font-semibold">Apa itu rekonsiliasi?</span> Bandingkan
          saldo yang dicatat DuitKu dengan saldo asli di rekening/dompet kamu.
          Kalau ada selisih, catat alasannya supaya pembukuan tetap akurat.
        </AlertDescription>
      </Alert>

      {/* Perlu dicek */}
      {perluDicek.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Perlu Dicek ({perluDicek.length})
          </h2>
          <div className="space-y-2">
            {perluDicek.map((a) => (
              <AkunRekonCard
                key={a.id}
                akun={a}
                onRekon={() => handleRekon(a.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sudah OK */}
      {sudahOk.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Sudah Ok ({sudahOk.length})
          </h2>
          <div className="space-y-2">
            {sudahOk.map((a) => (
              <AkunRekonCard
                key={a.id}
                akun={a}
                onRekon={() => handleRekon(a.id)}
              />
            ))}
          </div>
        </div>
      )}

      {akunStatus.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Belum ada akun. Tambah akun dulu di{' '}
              <Link href="/accounts" className="text-primary underline">
                halaman Akun
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      )}

      {/* Riwayat */}
      {riwayat.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <History className="w-4 h-4" />
            Riwayat Rekonsiliasi
          </h2>
          <Card>
            <CardContent className="p-2">
              {riwayat.map((r) => (
                <Link
                  key={r.id}
                  href={`/reconciliation/${r.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
                      style={{ backgroundColor: `${r.account.color || '#64748b'}20` }}
                    >
                      {r.account.icon || '💰'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{r.account.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTanggal(r.date, 'dd MMM yyyy, HH:mm')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 mr-2">
                    <p className={cn(
                      'text-sm font-semibold',
                      r.difference === 0 ? 'text-green-600' :
                      r.difference > 0 ? 'text-blue-600' : 'text-red-600'
                    )}>
                      {r.difference === 0 ? 'Cocok' :
                       r.difference > 0 ? '+' : ''}
                      {r.difference !== 0 && formatRupiah(r.difference)}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <RekonsiliasiFormSheet
        open={isFormOpen}
        onOpenChange={handleClose}
        akun={akunSelected ?? null}
      />
    </div>
  )
}

function AkunRekonCard({
  akun,
  onRekon,
}: {
  akun: AkunStatus
  onRekon: () => void
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
            style={{ backgroundColor: `${akun.color || '#0ea5e9'}20` }}
          >
            {akun.icon || '💰'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium truncate">{akun.name}</p>
              <Badge variant={getRekonStatusVariant(akun.status)} className="text-[10px] px-1.5 py-0 h-4">
                {getRekonStatusLabel(akun.status)}
              </Badge>
              {akun.isEntrusted && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                  Titipan
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Saldo sistem: {formatRupiah(akun.currentBalance)}
            </p>
            {akun.lastRekonsiliasiAt && (
              <p className="text-[10px] text-muted-foreground">
                Terakhir dicek:{' '}
                {akun.daysSince === 0 ? 'hari ini' :
                 akun.daysSince === 1 ? 'kemarin' :
                 `${akun.daysSince} hari lalu`}
              </p>
            )}
          </div>
          <Button size="sm" onClick={onRekon} className="shrink-0">
            Cek
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
