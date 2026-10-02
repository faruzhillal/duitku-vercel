import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { SettingsContent } from '@/components/settings/settings-content'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  // Ambil data user + statistik
  const [user, stats] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, image: true, createdAt: true },
    }),
    Promise.all([
      prisma.transaksi.count({ where: { userId: session.user.id } }),
      prisma.akun.count({ where: { userId: session.user.id } }),
      prisma.kategori.count({ where: { userId: session.user.id } }),
      prisma.utang.count({ where: { userId: session.user.id } }),
      prisma.uangTitipan.count({ where: { userId: session.user.id } }),
    ]),
  ])

  if (!user) redirect('/login')

  const [transaksiCount, akunCount, kategoriCount, utangCount, titipanCount] = stats

  return (
    <div className="container mx-auto p-4 md:p-6">
      <SettingsContent
        user={{
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          createdAt: user.createdAt.toISOString(),
        }}
        stats={{
          transaksi: transaksiCount,
          akun: akunCount,
          kategori: kategoriCount,
          utang: utangCount,
          titipan: titipanCount,
        }}
      />
    </div>
  )
}
