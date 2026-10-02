'use client'

import { User, Palette, Download, Info } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProfileForm } from './profile-form'
import { PreferencesForm } from './preferences-form'
import { DataSection } from './data-section'
import { AboutSection } from './about-section'
import { DangerZone } from './danger-zone'

interface Props {
  user: {
    id: string
    name: string | null
    email: string | null
    image: string | null
    createdAt: string
  }
  stats: {
    transaksi: number
    akun: number
    kategori: number
    utang: number
    titipan: number
  }
}

export function SettingsContent({ user, stats }: Props) {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">
          Kelola profil, preferensi, dan data kamu
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger
            value="profile"
            className="flex items-center gap-1.5 text-xs md:text-sm"
          >
            <User className="w-4 h-4 hidden md:inline" />
            Profil
          </TabsTrigger>
          <TabsTrigger
            value="preferences"
            className="flex items-center gap-1.5 text-xs md:text-sm"
          >
            <Palette className="w-4 h-4 hidden md:inline" />
            Preferensi
          </TabsTrigger>
          <TabsTrigger
            value="data"
            className="flex items-center gap-1.5 text-xs md:text-sm"
          >
            <Download className="w-4 h-4 hidden md:inline" />
            Data
          </TabsTrigger>
          <TabsTrigger
            value="about"
            className="flex items-center gap-1.5 text-xs md:text-sm"
          >
            <Info className="w-4 h-4 hidden md:inline" />
            Tentang
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4 space-y-4">
          <ProfileForm user={user} />
          <DangerZone />
        </TabsContent>

        <TabsContent value="preferences" className="mt-4">
          <PreferencesForm />
        </TabsContent>

        <TabsContent value="data" className="mt-4">
          <DataSection stats={stats} />
        </TabsContent>

        <TabsContent value="about" className="mt-4">
          <AboutSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}
