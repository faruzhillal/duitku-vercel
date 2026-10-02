import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getParseModel, safeParseJSON } from '@/lib/ai/gemini'
import { buildParsePrompt } from '@/lib/ai/prompts'
import { checkRateLimit } from '@/lib/ai/rate-limit'
import type { ParsedTransaksi } from '@/types'

export const runtime = 'nodejs' // butuh Node untuk Prisma

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    // Rate limit
    const rl = checkRateLimit(userId)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Terlalu banyak request. Coba lagi dalam 1 menit.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const text = String(body.text ?? '').trim()

    if (!text || text.length < 3) {
      return NextResponse.json(
        { error: 'Teks terlalu pendek' },
        { status: 400 }
      )
    }
    if (text.length > 500) {
      return NextResponse.json(
        { error: 'Teks terlalu panjang (max 500 karakter)' },
        { status: 400 }
      )
    }

    // Ambil konteks user
    const [accounts, categories] = await Promise.all([
      prisma.akun.findMany({
        where: { userId },
        select: { id: true, name: true, type: true, isEntrusted: true },
        orderBy: { name: 'asc' },
      }),
      prisma.kategori.findMany({
        where: { userId },
        select: { id: true, name: true, type: true },
        orderBy: { name: 'asc' },
      }),
    ])

    if (accounts.length === 0) {
      return NextResponse.json(
        { error: 'Kamu belum punya akun. Tambah akun dulu.' },
        { status: 400 }
      )
    }

    // Build prompt
    const today = new Date()
    const todayISO = today.toISOString().split('T')[0]
    const systemPrompt = buildParsePrompt({
      today: todayISO,
      timezone: 'Asia/Jakarta',
      accounts: accounts.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        isEntrusted: a.isEntrusted,
      })),
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type as 'income' | 'expense',
      })),
    })

    // Call Gemini (dengan fallback)
    let responseText = ''
    try {
      const model = getParseModel(false)
      const result = await model.generateContent([
        { text: systemPrompt },
        { text },
      ])
      responseText = result.response.text()
    } catch (err) {
      console.warn('Primary parse model error, trying fallback:', err)
      const fallbackModel = getParseModel(true)
      const result = await fallbackModel.generateContent([
        { text: systemPrompt },
        { text },
      ])
      responseText = result.response.text()
    }

    const parsed = safeParseJSON<ParsedTransaksi>(responseText)

    if (!parsed) {
      return NextResponse.json(
        { error: 'Gagal parse response AI. Coba lagi atau pakai form manual.' },
        { status: 500 }
      )
    }

    // Resolve nama → id (fuzzy match)
    const warnings: string[] = []

    const accountMatch = accounts.find((a) =>
      a.name.toLowerCase() === parsed.accountName?.toLowerCase()
    )
    if (!accountMatch) {
      warnings.push(`Akun "${parsed.accountName}" tidak ditemukan, pilih manual`)
    }

    let transferMatch: { id: string } | null = null
    if (parsed.type === 'transfer' && parsed.transferToName) {
      const found = accounts.find(
        (a) => a.name.toLowerCase() === parsed.transferToName!.toLowerCase()
      )
      if (found) transferMatch = found
      else warnings.push(`Akun tujuan "${parsed.transferToName}" tidak ditemukan`)
    }

    const categoryMatch = categories.find(
      (c) => c.name.toLowerCase() === parsed.categoryName?.toLowerCase()
    )
    if (parsed.type !== 'transfer' && !categoryMatch) {
      warnings.push(`Kategori "${parsed.categoryName}" tidak ditemukan, pilih manual`)
    }

    // Validasi jumlah
    if (!parsed.amount || parsed.amount <= 0) {
      warnings.push('Jumlah tidak terdeteksi, isi manual')
    }

    // Fallback account ke akun cash pertama kalau tidak ketemu
    const fallbackAccount = accounts.find((a) => a.type === 'cash') ?? accounts[0]

    return NextResponse.json({
      success: true,
      parsed: {
        ...parsed,
        amount: Number(parsed.amount) || 0,
        confidence: Number(parsed.confidence) || 0.5,
      },
      resolved: {
        accountId: accountMatch?.id ?? fallbackAccount.id,
        transferToId: transferMatch?.id ?? null,
        categoryId: categoryMatch?.id ?? null,
      },
      warnings,
      rateLimit: {
        remaining: rl.remaining,
        resetAt: rl.resetAt,
      },
    })
  } catch (error) {
    console.error('AI parse error:', error)
    const errorMsg = error instanceof Error ? error.message : 'Terjadi kesalahan saat memproses. Coba lagi.'
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    )
  }
}
