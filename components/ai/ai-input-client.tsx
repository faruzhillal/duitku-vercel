'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AiConfirmForm } from './ai-confirm-form'
import { AiExamples } from './ai-examples'
import type { ParsedTransaksi } from '@/types'

interface AccountData {
  id: string
  name: string
  type: string
  icon: string | null
  color: string | null
  isEntrusted: boolean
  currentBalance: number
}

interface CategoryData {
  id: string
  name: string
  type: string
  icon: string | null
  color: string | null
}

interface Props {
  accounts: AccountData[]
  categories: CategoryData[]
}

type ParseState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; parsed: ParsedTransaksi; resolved: { accountId: string | null; transferToId: string | null; categoryId: string | null }; warnings: string[] }
  | { status: 'error'; message: string }

export function AiInputClient({ accounts, categories }: Props) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [state, setState] = useState<ParseState>({ status: 'idle' })

  const handleParse = async () => {
    if (text.trim().length < 3) return
    setState({ status: 'loading' })

    try {
      const res = await fetch('/api/ai/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()

      if (!res.ok) {
        setState({ status: 'error', message: data.error ?? 'Gagal parse' })
        return
      }

      setState({
        status: 'success',
        parsed: data.parsed,
        resolved: data.resolved,
        warnings: data.warnings ?? [],
      })
    } catch {
      setState({ status: 'error', message: 'Koneksi error, coba lagi' })
    }
  }

  const handleReset = () => {
    setState({ status: 'idle' })
    setText('')
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/transactions">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Input dengan AI
          </h1>
          <p className="text-sm text-muted-foreground">
            Ketik bebas, AI yang isi form
          </p>
        </div>
      </div>

      {state.status === 'idle' && (
        <>
          {/* Input */}
          <Card>
            <CardContent className="pt-4">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Contoh: hari ini beli kopi 64rb pakai BCA"
                rows={4}
                maxLength={500}
                className="resize-none text-base"
                autoFocus
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-muted-foreground">
                  {text.length}/500
                </span>
                <Button
                  onClick={handleParse}
                  disabled={text.trim().length < 3}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Parse
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Contoh */}
          <AiExamples onSelect={setText} />
        </>
      )}

      {state.status === 'loading' && (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">
              AI sedang menganalisis teks kamu...
            </p>
          </CardContent>
        </Card>
      )}

      {state.status === 'error' && (
        <>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} className="flex-1">
              Coba Lagi
            </Button>
            <Button asChild className="flex-1">
              <Link href="/transactions?action=new">Input Manual</Link>
            </Button>
          </div>
        </>
      )}

      {state.status === 'success' && (
        <AiConfirmForm
          originalText={text}
          parsed={state.parsed}
          resolved={state.resolved}
          warnings={state.warnings}
          accounts={accounts}
          categories={categories}
          onCancel={handleReset}
          onSuccess={() => {
            router.push('/transactions')
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
