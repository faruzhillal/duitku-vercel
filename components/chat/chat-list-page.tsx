'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, MessageSquare, Trash2, MoreVertical, Sparkles, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { formatTanggalRelatif } from '@/lib/utils'
import {
  createChatSession,
  deleteChatSession,
  clearAllChats,
} from '@/app/(dashboard)/chat/actions'

interface SessionData {
  id: string
  title: string
  updatedAt: Date
  messageCount: number
  lastMessage: string | null
  lastRole: string | null
}

interface Props {
  sessions: SessionData[]
  userName: string
}

export function ChatListPage({ sessions, userName }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')

  const filtered = sessions.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  )

  const handleNew = (initialPrompt?: string) => {
    startTransition(async () => {
      const result = await createChatSession()
      if (result.success && result.data) {
        const query = initialPrompt ? `?prompt=${encodeURIComponent(initialPrompt)}` : ''
        router.push(`/chat/${result.data.id}${query}`)
      } else {
        toast.error(result.error || 'Gagal buat chat')
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteChatSession(id)
      if (result.success) {
        toast.success('Chat dihapus')
      } else {
        toast.error(result.error || 'Gagal hapus')
      }
    })
  }

  const handleClearAll = () => {
    startTransition(async () => {
      const result = await clearAllChats()
      if (result.success) {
        toast.success('Semua chat dihapus')
      } else {
        toast.error(result.error || 'Gagal hapus')
      }
    })
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            DuitKu Assistant
          </h1>
          <p className="text-sm text-muted-foreground">
            Tanya apa aja soal keuangan kamu
          </p>
        </div>
        <Button onClick={() => handleNew()} disabled={isPending}>
          <Plus className="w-4 h-4 mr-2" />
          Chat Baru
        </Button>
      </div>

      {/* Info & Suggested questions */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <p className="text-sm">
            👋 Hai {userName}! Aku bisa bantu analisa pengeluaran, kasih saran
            nabung, atau jawab pertanyaan soal keuangan kamu. Coba tanya:
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {[
              'Berapa pengeluaran bulan ini?',
              'Saran biar bisa nabung 500rb',
              'Kategori apa yang paling boros?',
              'Cek kondisi keuanganku dong',
            ].map((q) => (
              <button
                key={q}
                onClick={() => handleNew(q)}
                disabled={isPending}
                className="text-xs px-3 py-1.5 rounded-full border bg-background hover:bg-accent transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      {sessions.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari chat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">
              {search ? 'Tidak ada chat yang cocok' : 'Belum ada chat. Mulai yang baru!'}
            </p>
            {!search && (
              <Button onClick={() => handleNew()} disabled={isPending}>
                <Plus className="w-4 h-4 mr-2" />
                Mulai Chat Baru
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors group"
            >
              <Link href={`/chat/${s.id}`} className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{s.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {s.lastMessage
                        ? `${s.lastRole === 'user' ? 'Kamu: ' : 'AI: '}${s.lastMessage}`
                        : 'Belum ada pesan'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">
                        {formatTanggalRelatif(s.updatedAt)}
                      </span>
                      {s.messageCount > 0 && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                          {s.messageCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="text-destructive cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Hapus
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus chat ini?</AlertDialogTitle>
                        <AlertDialogDescription>
                          &quot;{s.title}&quot; akan dihapus permanen.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(s.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}

          {/* Clear all */}
          <div className="flex justify-center pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive">
                  <Trash2 className="w-3 h-3 mr-1" />
                  Hapus Semua Chat
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus semua chat?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Semua riwayat chat ({sessions.length}) akan dihapus permanen.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearAll}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Hapus Semua
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  )
}
