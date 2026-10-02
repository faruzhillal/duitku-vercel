import type { PrismaClient } from '@/app/generated/prisma'

export type TitipanStatus = 'held' | 'borrowed' | 'returned'

/**
 * Label status untuk UI
 */
export function getStatusLabel(status: TitipanStatus): string {
  return {
    held: 'Dipegang',
    borrowed: 'Dipinjam',
    returned: 'Dikembalikan',
  }[status]
}

/**
 * Warna badge status
 */
export function getStatusVariant(status: TitipanStatus) {
  return {
    held: 'default' as const,
    borrowed: 'destructive' as const,
    returned: 'secondary' as const,
  }[status]
}

// Server helper to access prisma without bundling pg into client
function getPrisma(): PrismaClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = (globalThis as any).prisma
  if (!p) {
    // Fallback on server if needed
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return eval('require')('@/lib/prisma').prisma
  }
  return p
}

/**
 * Hitung total titipan aktif (held + borrowed)
 */
export async function getTotalTitipanAktif(userId: string): Promise<{
  total: number
  held: number
  borrowed: number
  perPemilik: { owner: string; total: number; count: number }[]
}> {
  const prisma = getPrisma()
  const titipan = await prisma.uangTitipan.findMany({
    where: {
      userId,
      status: { in: ['held', 'borrowed'] },
    },
  })

  let held = 0
  let borrowed = 0
  const ownerMap = new Map<string, { total: number; count: number }>()

  for (const t of titipan) {
    const amount = Number(t.amount)
    if (t.status === 'held') held += amount
    if (t.status === 'borrowed') borrowed += amount

    const existing = ownerMap.get(t.owner) ?? { total: 0, count: 0 }
    ownerMap.set(t.owner, {
      total: existing.total + amount,
      count: existing.count + 1,
    })
  }

  return {
    total: held + borrowed,
    held,
    borrowed,
    perPemilik: Array.from(ownerMap.entries())
      .map(([owner, data]) => ({ owner, ...data }))
      .sort((a, b) => b.total - a.total),
  }
}

/**
 * Validasi: apakah titipan ini masih ada?
 */
export async function canModifyTitipan(id: string, userId: string) {
  const prisma = getPrisma()
  const titipan = await prisma.uangTitipan.findFirst({
    where: { id, userId },
  })
  if (!titipan) return { ok: false, reason: 'Titipan tidak ditemukan' }
  if (titipan.status === 'returned') {
    return { ok: false, reason: 'Titipan sudah dikembalikan' }
  }
  return { ok: true, titipan }
}
