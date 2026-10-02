'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Cek sudah install
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === 'accepted') {
      setInstalled(true)
    }
    setDeferredPrompt(null)
  }

  if (installed || !deferredPrompt || dismissed) return null

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">Install DuitKu</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pasang di home screen untuk akses lebih cepat, tanpa buka browser.
            </p>
            <Button size="sm" className="mt-3" onClick={handleInstall}>
              Install Sekarang
            </Button>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
