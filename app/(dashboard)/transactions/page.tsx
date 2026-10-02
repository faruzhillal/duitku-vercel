import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { serializeDecimal } from '@/lib/utils'
import { TransaksiList } from '@/components/transactions/transaksi-list'

interface PageProps {
  searchParams: {
    accountId?: string
    categoryId?: string
    type?: string
    from?: string
    to?: string
  } | Promise<{
    accountId?: string
    categoryId?: string
    type?: string
    from?: string
    to?: string
  }>
}

export default async function TransaksiPage({ searchParams }: PageProps) {
  const params = await searchParams
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  // Build where clause
  const where: Record<string, unknown> = { userId }
  if (params?.accountId) where.accountId = params.accountId
  if (params?.categoryId) where.categoryId = params.categoryId
  if (params?.type) where.type = params.type
  if (params?.from || params?.to) {
    const dateFilter: Record<string, Date> = {}
    if (params?.from) dateFilter.gte = new Date(params.from)
    if (params?.to) dateFilter.lte = new Date(params.to)
    where.date = dateFilter
  }

  // Fetch transaksi + referensi
  const [transaksiRaw, akun, kategori] = await Promise.all([
    prisma.transaksi.findMany({
      where,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: 100,
      include: {
        akun: true,
        kategori: true,
        akunTujuan: true,
      }
    }),
    prisma.akun.findMany({
      where: { userId },
      orderBy: { name: 'asc' }
    }),
    prisma.kategori.findMany({
      where: { userId },
      orderBy: { name: 'asc' }
    })
  ])

  const transaksi = serializeDecimal(transaksiRaw)
  const akunList = serializeDecimal(akun)
  const kategoriList = serializeDecimal(kategori)

  return (
    <div className="container mx-auto p-4 md:p-6">
      <TransaksiList
        transaksi={transaksi as any}
        akunList={akunList as any}
        kategoriList={kategoriList as any}
        filters={params || {}}
      />
    </div>
  )
}
