import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { AkunList } from '@/components/accounts/akun-list'
import { serializeDecimal } from '@/lib/utils'

export default async function AkunPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  
  const akunRaw = await prisma.akun.findMany({
    where: { userId: session.user.id },
    orderBy: [
      { isEntrusted: 'asc' }, // akun pribadi dulu
      { createdAt: 'asc' }
    ],
    include: {
      _count: { select: { transaksi: true } }
    }
  })
  
  // Serialize Decimal → number
  const akun = serializeDecimal(akunRaw)
  
  return (
    <div className="container mx-auto p-4 md:p-6">
      <AkunList akun={akun} />
    </div>
  )
}
