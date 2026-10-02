import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { UtangDetail } from '@/components/debts/utang-detail'
import type { UtangWithPayments } from '@/types'

export default async function UtangDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const utangRaw = await prisma.utang.findFirst({
    where: { id, userId: session.user.id },
    include: {
      pembayaran: { orderBy: { tanggal: 'desc' } },
    },
  })

  if (!utangRaw) notFound()

  const type: 'payable' | 'receivable' = utangRaw.tipe === 'PIUTANG' ? 'receivable' : 'payable'
  const status: 'unpaid' | 'partial' | 'paid' =
    utangRaw.status === 'LUNAS'
      ? 'paid'
      : utangRaw.status === 'DIBAYAR_SEBAGIAN'
      ? 'partial'
      : 'unpaid'

  const utang: UtangWithPayments = {
    id: utangRaw.id,
    userId: utangRaw.userId,
    person: utangRaw.namaPihak,
    amount: Number(utangRaw.jumlah),
    type,
    dueDate: utangRaw.jatuhTempo,
    status,
    note: utangRaw.catatan,
    createdAt: utangRaw.createdAt,
    updatedAt: utangRaw.updatedAt,
    namaPihak: utangRaw.namaPihak,
    jumlah: Number(utangRaw.jumlah),
    tipe: utangRaw.tipe,
    jatuhTempo: utangRaw.jatuhTempo,
    catatan: utangRaw.catatan,
    pembayaran: utangRaw.pembayaran.map((p) => ({
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

  return (
    <div className="container mx-auto p-4 md:p-6">
      <UtangDetail utang={utang} />
    </div>
  )
}
