import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getChatModel } from '@/lib/ai/gemini'
import { buildChatSystemPrompt } from '@/lib/ai/chat-prompts'
import { checkRateLimit } from '@/lib/ai/rate-limit'
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns'

export const runtime = 'nodejs'
export const maxDuration = 60 // Vercel: max 60 detik

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 })
    }
    const userId = session.user.id

    // Rate limit (30 messages per day)
    const rl = checkRateLimit(`chat:${userId}`, 30, 24 * 60 * 60 * 1000)
    if (!rl.allowed) {
      return new Response(
        JSON.stringify({ error: 'Terlalu banyak pesan. Batas 30 pesan/hari tercapai. Coba lagi nanti.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const { sessionId, message } = body

    if (!message || typeof message !== 'string' || message.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: 'Pesan tidak valid' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    if (message.length > 1000) {
      return new Response(
        JSON.stringify({ error: 'Pesan terlalu panjang (max 1000)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Ambil session + validasi ownership
    const chatSession = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 20, // ambil 20 pesan terakhir untuk context
        },
      },
    })
    if (!chatSession) {
      return new Response(
        JSON.stringify({ error: 'Chat tidak ditemukan' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Simpan pesan user dulu
    await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'user',
        content: message,
      },
    })

    // Kalau judul masih default, generate dari pesan pertama
    if (chatSession.messages.length === 0 && chatSession.title === 'Chat Baru') {
      const newTitle = message.slice(0, 40) + (message.length > 40 ? '...' : '')
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { title: newTitle },
      })
    }

    // Ambil konteks keuangan user
    const context = await buildUserFinancialContext(userId, session.user.name ?? 'User')

    // Build history untuk Gemini
    const history = chatSession.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    // Build prompt
    const systemPrompt = buildChatSystemPrompt(context)

    // Start chat dengan system context (coba primary model, fallback jika error)
    let result
    try {
      const chatModel = getChatModel(false)
      const chat = chatModel.startChat({
        history: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          {
            role: 'model',
            parts: [{ text: 'Halo! Aku siap bantu kamu soal keuangan. Ada yang bisa aku bantu?' }],
          },
          ...history,
        ],
        generationConfig: {
          temperature: 0.8,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      })
      result = await chat.sendMessageStream(message)
    } catch (err) {
      console.warn('Chat primary model error, mencoba fallback model:', err)
      const fallbackChatModel = getChatModel(true)
      const chat = fallbackChatModel.startChat({
        history: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          {
            role: 'model',
            parts: [{ text: 'Halo! Aku siap bantu kamu soal keuangan. Ada yang bisa aku bantu?' }],
          },
          ...history,
        ],
        generationConfig: {
          temperature: 0.8,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      })
      result = await chat.sendMessageStream(message)
    }

    let fullText = ''

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text()
            fullText += chunkText
            controller.enqueue(new TextEncoder().encode(chunkText))
          }

          // Simpan respons AI ke DB
          await prisma.chatMessage.create({
            data: {
              sessionId,
              role: 'assistant',
              content: fullText,
            },
          })

          // Update session timestamp
          await prisma.chatSession.update({
            where: { id: sessionId },
            data: { updatedAt: new Date() },
          })

          controller.close()
        } catch (err) {
          console.error('Stream error:', err)
          controller.error(err)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    const errorMsg = error instanceof Error ? error.message : 'Terjadi kesalahan saat memproses chat'
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

/**
 * Build konteks keuangan user untuk AI.
 * Ringkas supaya hemat token — jangan kirim semua transaksi.
 */
async function buildUserFinancialContext(userId: string, userName: string) {
  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const [
    akun,
    utang,
    titipan,
    transaksiBulanIni,
    recentTx,
    pengeluaranHariIni,
    pemasukanBulanIni,
    pengeluaranBulanIni,
  ] = await Promise.all([
    prisma.akun.findMany({
      where: { userId },
      orderBy: { currentBalance: 'desc' },
    }),
    prisma.utang.findMany({
      where: { userId, status: { in: ['BELUM_LUNAS', 'DIBAYAR_SEBAGIAN'] } },
      include: { pembayaran: true },
    }),
    prisma.uangTitipan.findMany({
      where: { userId, status: { in: ['held', 'borrowed'] } },
    }),
    prisma.transaksi.findMany({
      where: {
        userId,
        type: 'expense',
        date: { gte: monthStart, lte: monthEnd },
        categoryId: { not: null },
      },
      include: { kategori: true },
    }),
    prisma.transaksi.findMany({
      where: { userId },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: 5,
      include: { kategori: true, akun: true, akunTujuan: true },
    }),
    prisma.transaksi.aggregate({
      where: {
        userId,
        type: 'expense',
        date: { gte: todayStart, lte: todayEnd },
      },
      _sum: { amount: true },
    }),
    prisma.transaksi.aggregate({
      where: {
        userId,
        type: 'income',
        date: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amount: true },
    }),
    prisma.transaksi.aggregate({
      where: {
        userId,
        type: 'expense',
        date: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amount: true },
    }),
  ])

  // Hitung summary akun
  const akunPribadi = akun.filter((a) => !a.isEntrusted)
  const akunTitipan = akun.filter((a) => a.isEntrusted)

  const totalUangPribadi = akunPribadi.reduce(
    (s, a) => s + Number(a.currentBalance),
    0
  )
  const totalTitipan = akunTitipan.reduce(
    (s, a) => s + Number(a.currentBalance),
    0
  )

  // Utang & piutang
  let totalUtang = 0
  let totalPiutang = 0
  for (const u of utang) {
    const totalDibayar = u.pembayaran.reduce((sum, p) => sum + Number(p.nominal), 0)
    const sisa = Math.max(0, Number(u.jumlah) - totalDibayar)
    if (u.tipe === 'UTANG') totalUtang += sisa
    else totalPiutang += sisa
  }

  const netWorth = totalUangPribadi + totalPiutang - totalUtang

  // Top kategori
  const kategoriMap = new Map<string, { name: string; total: number }>()
  let totalPengeluaranKategori = 0
  for (const t of transaksiBulanIni) {
    if (!t.kategori) continue
    const amt = Number(t.amount)
    totalPengeluaranKategori += amt
    const existing = kategoriMap.get(t.kategori.id) ?? {
      name: t.kategori.name,
      total: 0,
    }
    kategoriMap.set(t.kategori.id, {
      name: existing.name,
      total: existing.total + amt,
    })
  }

  const topKategori = Array.from(kategoriMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map((k) => ({
      name: k.name,
      total: k.total,
      percentage:
        totalPengeluaranKategori > 0
          ? (k.total / totalPengeluaranKategori) * 100
          : 0,
    }))

  // Format recent transactions
  const recentTransactions = recentTx.map((t) => {
    let description = 'Transaksi'
    if (t.type === 'transfer') {
      description = `Transfer ke ${t.akunTujuan?.name ?? '?'}`
    } else {
      description = t.kategori?.name ?? t.note ?? 'Transaksi'
    }
    return {
      date: t.date.toISOString().split('T')[0],
      description,
      amount: Number(t.amount),
      type: t.type,
    }
  })

  return {
    userName,
    today: now.toISOString().split('T')[0],
    timezone: 'Asia/Jakarta',
    netWorth,
    totalUangPribadi,
    totalUtang,
    totalPiutang,
    totalTitipan,
    akunSummary: akun.map((a) => ({
      name: a.name,
      type: a.type,
      balance: Number(a.currentBalance),
      isEntrusted: a.isEntrusted,
    })),
    pengeluaranBulanIni: Number(pengeluaranBulanIni._sum.amount ?? 0),
    pemasukanBulanIni: Number(pemasukanBulanIni._sum.amount ?? 0),
    pengeluaranHariIni: Number(pengeluaranHariIni._sum.amount ?? 0),
    topKategori,
    recentTransactions,
    utangList: utang.map((u) => {
      const totalDibayar = u.pembayaran.reduce((sum, p) => sum + Number(p.nominal), 0)
      const sisa = Math.max(0, Number(u.jumlah) - totalDibayar)
      return {
        person: u.namaPihak,
        amount: sisa,
        type: u.tipe === 'UTANG' ? 'payable' : 'receivable',
        dueDate: u.jatuhTempo ? u.jatuhTempo.toISOString().split('T')[0] : null,
      }
    }),
    titipanList: titipan.map((t) => ({
      owner: t.owner,
      amount: Number(t.amount),
      status: t.status,
    })),
  }
}
