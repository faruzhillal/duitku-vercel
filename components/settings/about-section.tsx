'use client'

import { Wallet, Heart, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const APP_VERSION = '1.0.0'

export function AboutSection() {
  return (
    <div className="space-y-4">
      {/* App info */}
      <Card>
        <CardContent className="p-6 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto">
            <Wallet className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold">DuitKu</h2>
            <p className="text-sm text-muted-foreground">Personal Finance PWA</p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary">v{APP_VERSION}</Badge>
            <Badge variant="outline">Beta</Badge>
          </div>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Aplikasi pencatat keuangan pribadi untuk mahasiswa & pekerja muda
            Indonesia. Support multi-akun, uang titipan, utang-piutang, dan AI
            input.
          </p>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-sm">Fitur Utama</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>AI input bahasa natural</span>
            </div>
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>Tracking uang titipan terpisah</span>
            </div>
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>Utang & piutang dengan cicilan</span>
            </div>
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>Rekonsiliasi saldo otomatis</span>
            </div>
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>PWA install ke home screen</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credits */}
      <Card>
        <CardContent className="p-4 text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            Dibuat dengan <Heart className="w-3 h-3 inline text-red-500" /> untuk
            kamu
          </p>
          <p className="text-xs text-muted-foreground">
            Powered by Next.js · PostgreSQL · Prisma · Gemini AI
          </p>
          <p className="text-[10px] text-muted-foreground pt-2">
            © 2026 DuitKu · Made in Indonesia 🇮🇩
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
