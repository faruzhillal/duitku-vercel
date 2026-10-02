import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { UtangList } from '@/components/debts/utang-list'
import type { UtangWithPayments } from '@/types'

interface PageProps {
  searchParams: Promise<{
    type?: 'payable' | 'receivable'
    status?: 'unpaid' | 'partial' | 'paid'
  }>
}

export default async function UtangPage({ searchParams }: PageProps) {
  const params = await searchParams
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { userId: session.user.id }
  if (params.type) {
    where.tipe = params.type === 'receivable' ? 'PIUTANG' : 'UTANG'
  }
  if (params.status) {
    where.status =
      params.status === 'paid'
        ? 'LUNAS'
        : params.status === 'partial'
        ? 'DIBAYAR_SEBAGIAN'
        : 'BELUM_LUNAS'
  }

  const utangRaw = await prisma.utang.findMany({
    where,
    orderBy: [
      { status: 'asc' }, // unpaid dulu
      { jatuhTempo: 'asc' }, // yang paling dekat dulu
      { createdAt: 'desc' },
    ],
    include: {
      pembayaran: { orderBy: { tanggal: 'desc' } },
    },
  })

  // Serialize Decimal & convert ke format client
  const utang: UtangWithPayments[] = utangRaw.map((u) => {
    const type: 'payable' | 'receivable' = u.tipe === 'PIUTANG' ? 'receivable' : 'payable'
    const status: 'unpaid' | 'partial' | 'paid' =
      u.status === 'LUNAS'
        ? 'paid'
        : u.status === 'DIBAYAR_SEBAGIAN'
        ? 'partial'
        : 'unpaid'

    return {
      id: u.id,
      userId: u.userId,
      person: u.namaPihak,
      amount: Number(u.jumlah),
      type,
      dueDate: u.jatuhTempo,
      status,
      note: u.catatan,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      namaPihak: u.namaPihak,
      jumlah: Number(u.jumlah),
      tipe: u.tipe,
      jatuhTempo: u.jatuhTempo,
      catatan: u.catatan,
      pembayaran: u.pembayaran.map((p) => ({
        id: p.id,
        debtId: p.utangId,
        amount: Number(p.nominal),
        date: p.tanggal,
        note: p.catatan,
        utangId: p.utangId,
        nominal: Number(p.nominal),
        tanggal: p.tanggal,
        catatan: p.catatan,
        akunId: p.akunId,
      })),
    }
  })

  // Total yang belum dibayar (bukan amount)
  let totalPiutangBelumDibayar = 0
  let totalUtangBelumDibayar = 0
  for (const u of utang) {
    const totalDibayar = u.pembayaran.reduce((s, p) => s + p.amount, 0)
    const sisa = u.amount - totalDibayar
    if (u.type === 'receivable' && u.status !== 'paid') {
      totalPiutangBelumDibayar += sisa
    }
    if (u.type === 'payable' && u.status !== 'paid') {
      totalUtangBelumDibayar += sisa
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <UtangList
        utang={utang}
        summary={{
          totalPiutang: totalPiutangBelumDibayar,
          totalUtang: totalUtangBelumDibayar,
          net: totalPiutangBelumDibayar - totalUtangBelumDibayar,
        }}
        filters={params}
      />
    </div>
  )
}
