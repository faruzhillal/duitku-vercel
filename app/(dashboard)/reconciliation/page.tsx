import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getRekonsiliasiStatus } from '@/lib/rekonsiliasi-helpers'
import { RekonsiliasiList } from '@/components/reconciliation/rekonsiliasi-list'

export default async function RekonsiliasiPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  const [akunStatus, riwayatRaw] = await Promise.all([
    getRekonsiliasiStatus(userId),
    prisma.rekonsiliasi.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 20,
      include: {
        account: { select: { id: true, name: true, icon: true, color: true } },
        adjustmentTx: { select: { id: true, type: true, amount: true } },
      },
    }),
  ])

  const riwayat = riwayatRaw.map((r) => ({
    id: r.id,
    date: r.date,
    accountId: r.accountId,
    account: r.account,
    systemBalance: Number(r.systemBalance),
    actualBalance: Number(r.actualBalance),
    difference: Number(r.difference),
    reason: r.reason,
    adjustmentTx: r.adjustmentTx
      ? {
          id: r.adjustmentTx.id,
          type: r.adjustmentTx.type,
          amount: Number(r.adjustmentTx.amount),
        }
      : null,
  }))

  return (
    <div className="container mx-auto p-4 md:p-6">
      <RekonsiliasiList akunStatus={akunStatus} riwayat={riwayat} />
    </div>
  )
}
