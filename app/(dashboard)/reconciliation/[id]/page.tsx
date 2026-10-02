import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { RekonsiliasiDetail } from '@/components/reconciliation/rekonsiliasi-detail'

export default async function RekonsiliasiDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const rekonRaw = await prisma.rekonsiliasi.findFirst({
    where: { id, userId: session.user.id },
    include: {
      account: true,
      adjustmentTx: {
        include: { kategori: true },
      },
    },
  })

  if (!rekonRaw) notFound()

  const rekon = {
    id: rekonRaw.id,
    date: rekonRaw.date,
    systemBalance: Number(rekonRaw.systemBalance),
    actualBalance: Number(rekonRaw.actualBalance),
    difference: Number(rekonRaw.difference),
    reason: rekonRaw.reason,
    account: {
      id: rekonRaw.account.id,
      name: rekonRaw.account.name,
      icon: rekonRaw.account.icon,
      color: rekonRaw.account.color,
      type: rekonRaw.account.type,
    },
    adjustmentTx: rekonRaw.adjustmentTx
      ? {
          id: rekonRaw.adjustmentTx.id,
          type: rekonRaw.adjustmentTx.type,
          amount: Number(rekonRaw.adjustmentTx.amount),
          note: rekonRaw.adjustmentTx.note,
          date: rekonRaw.adjustmentTx.date,
          kategori: rekonRaw.adjustmentTx.kategori,
        }
      : null,
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <RekonsiliasiDetail rekon={rekon} />
    </div>
  )
}
