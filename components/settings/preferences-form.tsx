'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Monitor, Moon, Sun } from 'lucide-react'

const PREF_KEYS = {
  theme: 'duitku-theme',
  dateFormat: 'duitku-date-format',
  firstDayOfWeek: 'duitku-first-day',
  compactMode: 'duitku-compact-mode',
}

export function PreferencesForm() {
  const { theme, setTheme } = useTheme()
  const [dateFormat, setDateFormat] = useState('dd MMM yyyy')
  const [firstDay, setFirstDay] = useState('monday')
  const [compactMode, setCompactMode] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setDateFormat(localStorage.getItem(PREF_KEYS.dateFormat) ?? 'dd MMM yyyy')
    setFirstDay(localStorage.getItem(PREF_KEYS.firstDayOfWeek) ?? 'monday')
    setCompactMode(localStorage.getItem(PREF_KEYS.compactMode) === 'true')
  }, [])

  const handleSaveDateFormat = (value: string) => {
    setDateFormat(value)
    localStorage.setItem(PREF_KEYS.dateFormat, value)
    toast.success('Format tanggal disimpan')
  }

  const handleSaveFirstDay = (value: string) => {
    setFirstDay(value)
    localStorage.setItem(PREF_KEYS.firstDayOfWeek, value)
    toast.success('Hari pertama disimpan')
  }

  const handleToggleCompact = (value: boolean) => {
    setCompactMode(value)
    localStorage.setItem(PREF_KEYS.compactMode, String(value))
    toast.success(value ? 'Mode compact aktif' : 'Mode compact nonaktif')
  }

  const handleResetPreferences = () => {
    Object.values(PREF_KEYS).forEach((k) => localStorage.removeItem(k))
    setDateFormat('dd MMM yyyy')
    setFirstDay('monday')
    setCompactMode(false)
    toast.success('Preferensi direset')
  }

  if (!mounted) return null

  return (
    <div className="space-y-4">
      {/* Tema */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setTheme('light')}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                theme === 'light' ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <Sun className="w-5 h-5" />
              <span className="text-sm font-medium">Terang</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <Moon className="w-5 h-5" />
              <span className="text-sm font-medium">Gelap</span>
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                theme === 'system' ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <Monitor className="w-5 h-5" />
              <span className="text-sm font-medium">Sistem</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Format Tanggal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Format Tanggal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Format</Label>
            <Select value={dateFormat} onValueChange={handleSaveDateFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dd MMM yyyy">01 Jan 2026</SelectItem>
                <SelectItem value="dd/MM/yyyy">01/01/2026</SelectItem>
                <SelectItem value="dd-MM-yyyy">01-01-2026</SelectItem>
                <SelectItem value="EEEE, dd MMM yyyy">Senin, 01 Jan 2026</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Hari Pertama Minggu</Label>
            <Select value={firstDay} onValueChange={handleSaveFirstDay}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monday">Senin</SelectItem>
                <SelectItem value="sunday">Minggu</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tampilan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tampilan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label>Mode Compact</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Kurangi jarak antar elemen
              </p>
            </div>
            <Switch checked={compactMode} onCheckedChange={handleToggleCompact} />
          </div>
        </CardContent>
      </Card>

      <Button variant="outline" onClick={handleResetPreferences} className="w-full">
        Reset ke Default
      </Button>
    </div>
  )
}
