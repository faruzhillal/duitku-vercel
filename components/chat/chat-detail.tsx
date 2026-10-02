'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  Send,
  Loader2,
  Sparkles,
  AlertTriangle,
  Trash2,
  MoreVertical,
  Pencil,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
} from '@/components/ui/alert-dialog'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { renameChatSession, deleteChatSession } from '@/app/(dashboard)/chat/actions'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

interface Props {
  sessionId: string
  initialTitle: string
  initialMessages: Message[]
  userName: string
}

export function ChatDetail({
  sessionId,
  initialTitle,
  initialMessages,
  userName,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [title, setTitle] = useState(initialTitle)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')

  // Rename & Delete state
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [newTitle, setNewTitle] = useState(initialTitle)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isActionPending, setIsActionPending] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const autoSentRef = useRef(false)

  // Auto scroll ke bawah
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  const sendMessageText = async (textToSend: string) => {
    const text = textToSend.trim()
    if (!text || isLoading) return

    // Tambahkan pesan user
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setStreamingContent('')

    // Jika ini pesan pertama dan judul masih default, update judul lokal
    if (messages.length === 0 && title === 'Chat Baru') {
      const generatedTitle = text.slice(0, 40) + (text.length > 40 ? '...' : '')
      setTitle(generatedTitle)
    }

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: text }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Gagal kirim pesan' }))
        throw new Error(err.error || 'Gagal kirim')
      }

      // Baca stream
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          fullText += chunk
          setStreamingContent(fullText)
        }
      }

      // Setelah selesai, tambahkan ke messages
      const assistantMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: fullText,
        createdAt: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setStreamingContent('')
    } catch (err) {
      console.error('Send error:', err)
      const errorMsg = err instanceof Error ? err.message : 'Gagal kirim pesan'
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle suggested prompt passed in URL query param
  useEffect(() => {
    const promptParam = searchParams.get('prompt')
    if (promptParam && !autoSentRef.current && messages.length === 0) {
      autoSentRef.current = true
      sendMessageText(promptParam)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, messages.length])

  const handleSend = () => {
    sendMessageText(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleRename = async () => {
    if (!newTitle.trim()) return
    setIsActionPending(true)
    const res = await renameChatSession(sessionId, newTitle)
    setIsActionPending(false)
    if (res.success) {
      setTitle(newTitle.trim())
      setRenameDialogOpen(false)
      toast.success('Judul berhasil diubah')
    } else {
      toast.error(res.error || 'Gagal rename')
    }
  }

  const handleDelete = async () => {
    setIsActionPending(true)
    const res = await deleteChatSession(sessionId)
    setIsActionPending(false)
    if (res.success) {
      toast.success('Chat berhasil dihapus')
      router.push('/chat')
    } else {
      toast.error(res.error || 'Gagal hapus')
    }
  }

  const isEmpty = messages.length === 0 && !isLoading

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 md:p-4 border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/chat">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold truncate flex items-center gap-2 text-sm md:text-base">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            {title}
          </h1>
          <p className="text-[11px] md:text-xs text-muted-foreground">
            AI Assistant • Powered by Gemini
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setNewTitle(title)
                setRenameDialogOpen(true)
              }}
              className="cursor-pointer"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Ganti Judul
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDeleteDialogOpen(true)}
              className="text-destructive cursor-pointer"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Hapus Chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Rename Dialog */}
      <Modal
        isOpen={renameDialogOpen}
        onClose={() => setRenameDialogOpen(false)}
        title="Ganti Judul Chat"
        description="Masukkan judul baru untuk sesi chat ini."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Judul chat..."
            maxLength={100}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setRenameDialogOpen(false)}
              disabled={isActionPending}
            >
              Batal
            </Button>
            <Button
              onClick={handleRename}
              disabled={isActionPending || !newTitle.trim()}
            >
              Simpan
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus chat ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Riwayat obrolan ini akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isActionPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disclaimer */}
      <div className="px-4 pt-3">
        <Alert className="border-amber-500/50 bg-amber-500/5 py-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-xs">
            AI ini bukan financial advisor profesional. Untuk keputusan besar,
            konsultasi ke ahlinya ya.
          </AlertDescription>
        </Alert>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isEmpty && (
          <div className="text-center py-8 space-y-3">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <p className="font-medium text-base">Hai {userName}! 👋</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Aku bisa bantu analisa keuangan, kasih saran nabung, atau jawab
              pertanyaan seputar uang kamu.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-4 max-w-md mx-auto">
              {[
                'Berapa total kekayaanku?',
                'Kategori apa yang paling boros bulan ini?',
                'Saran biar bisa nabung 500rb/bulan',
                'Cek utang dan piutangku dong',
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setInput(q)
                    textareaRef.current?.focus()
                  }}
                  className="text-xs px-3 py-1.5 rounded-full border bg-background hover:bg-accent transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}

        {/* Streaming Bubble */}
        {streamingContent && (
          <MessageBubble
            message={{
              id: 'streaming',
              role: 'assistant',
              content: streamingContent,
              createdAt: new Date(),
            }}
            isStreaming
          />
        )}

        {/* Initial Loading (3 bouncing dots) */}
        {isLoading && !streamingContent && (
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 rounded-full bg-primary/70 animate-bounce" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-background p-3 md:p-4 sticky bottom-0">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tanya apa aja soal keuangan..."
            rows={1}
            maxLength={1000}
            className="resize-none min-h-[44px] max-h-[120px] text-sm"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-11 w-11 shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Enter untuk kirim • Shift+Enter untuk baris baru
        </p>
      </div>
    </div>
  )
}

function MessageBubble({
  message,
  isStreaming,
}: {
  message: Message
  isStreaming?: boolean
}) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex items-start gap-2', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
          isUser
            ? 'bg-primary text-primary-foreground text-xs font-bold'
            : 'bg-primary/10'
        )}
      >
        {isUser ? 'K' : <Sparkles className="w-4 h-4 text-primary" />}
      </div>
      <div
        className={cn(
          'max-w-[85%] md:max-w-[80%] rounded-2xl px-4 py-2.5',
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-muted rounded-tl-sm'
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
          {message.content}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-current animate-pulse ml-0.5 align-middle" />
          )}
        </p>
      </div>
    </div>
  )
}
