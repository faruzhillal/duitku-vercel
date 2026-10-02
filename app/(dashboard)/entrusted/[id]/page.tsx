import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { TitipanDetail } from '@/components/entrusted/titipan-detail'

export default async function TitipanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const titipanRaw = await prisma.uangTitipan.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!titipanRaw) notFound()

  const titipan = {
    ...titipanRaw,
    amount: Number(titipanRaw.amount),
    status: titipanRaw.status as 'held' | 'borrowed' | 'returned',
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <TitipanDetail titipan={titipan} />
    </div>
  )
}
