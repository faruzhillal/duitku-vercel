import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { AiInputClient } from '@/components/ai/ai-input-client'

export default async function AiInputPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [accounts, categories] = await Promise.all([
    prisma.akun.findMany({
      where: { userId: session.user.id },
      orderBy: { name: 'asc' },
    }),
    prisma.kategori.findMany({
      where: { userId: session.user.id },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <AiInputClient
      accounts={accounts.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        icon: a.icon,
        color: a.color,
        isEntrusted: a.isEntrusted,
        currentBalance: Number(a.currentBalance),
      }))}
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        icon: c.icon,
        color: c.color,
      }))}
    />
  )
}
