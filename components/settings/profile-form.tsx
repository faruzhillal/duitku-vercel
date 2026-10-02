'use client'

import { useState, useTransition } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getInitials, formatTanggal } from '@/lib/utils'
import { updateProfil } from '@/app/(dashboard)/settings/actions'

interface Props {
  user: {
    name: string | null
    email: string | null
    image: string | null
    createdAt: string
  }
}

export function ProfileForm({ user }: Props) {
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(user.name ?? '')
  const { update } = useSession()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const result = await updateProfil({ name })
      if (result.success) {
        toast.success('Profil diperbarui')
        if (update) {
          await update({ name }) // update session
        }
      } else {
        toast.error(result.error || 'Gagal update')
      }
    })
  }

  const hasChanges = name !== (user.name ?? '')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Profil</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? ''} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {getInitials(user.name ?? 'U')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t">
          <div className="space-y-2">
            <Label htmlFor="name">Nama</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama kamu"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user.email ?? ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email tidak bisa diubah
            </p>
          </div>

          <div className="space-y-2">
            <Label>Bergabung sejak</Label>
            <p className="text-sm">
              {formatTanggal(user.createdAt, 'dd MMMM yyyy')}
            </p>
          </div>

          <Button type="submit" disabled={isPending || !hasChanges}>
            {isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
