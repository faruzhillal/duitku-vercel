'use client'

import Link from 'next/link'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatRupiah } from '@/lib/utils'

interface Props {
  total: number
}

export function EntrustedBanner({ total }: Props) {
  return (
    <Alert className="border-amber-500 bg-amber-500/10">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex items-center justify-between gap-2">
        <div className="text-sm">
          <span className="font-semibold">Uang titipan: {formatRupiah(total)}</span>
          <p className="text-xs text-muted-foreground">
            Ini BUKAN milik kamu. Jangan dipakai untuk keperluan pribadi.
          </p>
        </div>
        <Link 
          href="/entrusted"
          className="text-xs font-medium shrink-0 flex items-center gap-1 hover:underline"
        >
          Detail
          <ArrowRight className="w-3 h-3" />
        </Link>
      </AlertDescription>
    </Alert>
  )
}
