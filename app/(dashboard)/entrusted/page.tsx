import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getTotalTitipanAktif } from '@/lib/titipan-helpers'
import { TitipanList } from '@/components/entrusted/titipan-list'

interface PageProps {
  searchParams: Promise<{
    status?: 'held' | 'borrowed' | 'returned'
  }>
}

export default async function TitipanPage({ searchParams }: PageProps) {
  const params = await searchParams
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  // Default: hanya tampilkan aktif
  const statusFilter = params.status
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { userId }
  if (statusFilter) {
    where.status = statusFilter
  } else {
    where.status = { in: ['held', 'borrowed'] } // aktif by default
  }

  const [titipanRaw, summary] = await Promise.all([
    prisma.uangTitipan.findMany({
      where,
      orderBy: [
        { status: 'asc' }, // held dulu, lalu borrowed
        { createdAt: 'desc' },
      ],
    }),
    getTotalTitipanAktif(userId),
  ])

  const titipan = titipanRaw.map((t) => ({
    ...t,
    amount: Number(t.amount),
    status: t.status as 'held' | 'borrowed' | 'returned',
  }))

  return (
    <div className="container mx-auto p-4 md:p-6">
      <TitipanList
        titipan={titipan}
        summary={summary}
        filters={{ status: statusFilter }}
      />
    </div>
  )
}
