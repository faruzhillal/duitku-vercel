import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { serializeDecimal } from '@/lib/utils'
import { AkunDetail } from '@/components/accounts/akun-detail'

export default async function AkunDetailPage({
  params
}: {
  params: { id: string } | Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  
  const akunRaw = await prisma.akun.findFirst({
    where: { id, userId: session.user.id },
    include: {
      transaksi: {
        orderBy: { date: 'desc' },
        take: 20,
        include: { kategori: true, akunTujuan: true }
      }
    }
  })
  
  if (!akunRaw) notFound()
  
  const akun = serializeDecimal(akunRaw)
  const transaksi = serializeDecimal(akunRaw.transaksi)
  
  return (
    <div className="container mx-auto p-4 md:p-6">
      <AkunDetail akun={akun} transaksi={transaksi} />
    </div>
  )
}
