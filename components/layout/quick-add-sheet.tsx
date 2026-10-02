'use client'

import { useRouter } from 'next/navigation'
import { Pencil, Sparkles, Camera, ArrowRight, MessageCircle } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuickAddSheet({ open, onOpenChange }: Props) {
  const router = useRouter()

  const handleManual = () => {
    onOpenChange(false)
    // Redirect ke halaman transaksi + buka form
    router.push('/transactions?action=new')
  }

  const handleAI = () => {
    onOpenChange(false)
    // Fase 3: akan ke halaman AI input
    router.push('/transactions/ai')
  }

  const handleScan = () => {
    onOpenChange(false)
    // Fase 4+: scan struk
    router.push('/transactions/scan')
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl md:max-w-md md:mx-auto">
        <SheetHeader className="text-left">
          <SheetTitle>Catat Cepat</SheetTitle>
          <SheetDescription>
            Pilih cara catat transaksi kamu
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-2 mt-4 pb-4">
          {/* Manual */}
          <button
            onClick={handleManual}
            className="w-full flex items-center gap-4 p-4 rounded-xl border hover:bg-accent transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <Pencil className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Input Manual</p>
              <p className="text-xs text-muted-foreground">
                Isi form transaksi seperti biasa
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* AI */}
          <button
            onClick={handleAI}
            className="w-full flex items-center gap-4 p-4 rounded-xl border hover:bg-accent transition-colors text-left relative"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">Input dengan AI</p>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                  Beta
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Ketik bebas: &quot;beli kopi 64rb pakai BCA&quot;
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Scan struk (Future) */}
          <button
            onClick={handleScan}
            disabled
            className="w-full flex items-center gap-4 p-4 rounded-xl border opacity-50 cursor-not-allowed text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
              <Camera className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">Scan Struk</p>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                  Nanti
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Foto struk, AI isi otomatis
              </p>
            </div>
          </button>

          {/* Tanya AI */}
          <button
            onClick={() => {
              onOpenChange(false)
              router.push('/chat')
            }}
            className="w-full flex items-center gap-4 p-4 rounded-xl border hover:bg-accent transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5 text-cyan-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Tanya AI</p>
              <p className="text-xs text-muted-foreground">
                Diskusi soal keuangan kamu
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
