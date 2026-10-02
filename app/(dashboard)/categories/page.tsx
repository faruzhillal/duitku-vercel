import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { KategoriList } from '@/components/categories/kategori-list'
import { seedDefaultKategori } from '@/lib/seed-kategori'

export default async function KategoriPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  let kategori = await prisma.kategori.findMany({
    where: { userId: session.user.id },
    orderBy: [
      { isDefault: 'desc' },  // default dulu
      { name: 'asc' }
    ],
    include: {
      _count: { select: { transaksi: true } }
    }
  })

  // Fallback seeding jika user belum memiliki kategori
  if (kategori.length === 0) {
    await seedDefaultKategori(session.user.id)
    kategori = await prisma.kategori.findMany({
      where: { userId: session.user.id },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' }
      ],
      include: {
        _count: { select: { transaksi: true } }
      }
    })
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <KategoriList kategori={kategori} />
    </div>
  )
}
