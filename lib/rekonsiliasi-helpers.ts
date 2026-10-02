import type { PrismaClient } from '@/app/generated/prisma'
import { differenceInDays, startOfDay } from 'date-fns'

// Server helper to access prisma without bundling pg into client
function getPrisma(): PrismaClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = (globalThis as any).prisma
  if (!p) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return eval('require')('@/lib/prisma').prisma
  }
  return p
}

/**
 * Cek status rekonsiliasi terakhir per akun.
 * Return: hari sejak rekonsiliasi terakhir, atau null kalau belum pernah.
 */
export async function getRekonsiliasiStatus(userId: string) {
  const prisma = getPrisma()
  const akuns = await prisma.akun.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      type: true,
      icon: true,
      color: true,
      isEntrusted: true,
      currentBalance: true,
      rekonsiliasi: {
        orderBy: { date: 'desc' },
        take: 1,
        select: { date: true, difference: true },
      },
    },
  })

  const today = startOfDay(new Date())

  return akuns.map((a) => {
    const lastRekon = a.rekonsiliasi[0]
    const daysSince = lastRekon
      ? differenceInDays(today, startOfDay(lastRekon.date))
      : null

    // Status: 
    // - "belum-pernah": belum pernah rekonsiliasi
    // - "segar": < 14 hari
    // - "perlu": 14-30 hari
    // - "terlambat": > 30 hari
    let status: 'belum-pernah' | 'segar' | 'perlu' | 'terlambat'
    if (daysSince === null) status = 'belum-pernah'
    else if (daysSince <= 14) status = 'segar'
    else if (daysSince <= 30) status = 'perlu'
    else status = 'terlambat'

    return {
      id: a.id,
      name: a.name,
      type: a.type,
      icon: a.icon,
      color: a.color,
      isEntrusted: a.isEntrusted,
      currentBalance: Number(a.currentBalance),
      lastRekonsiliasiAt: lastRekon?.date ?? null,
      lastDifference: lastRekon ? Number(lastRekon.difference) : null,
      daysSince,
      status,
    }
  })
}

/**
 * Label untuk status rekonsiliasi
 */
export function getRekonStatusLabel(status: string): string {
  return {
    'belum-pernah': 'Belum pernah',
    'segar': 'Baru dicek',
    'perlu': 'Perlu dicek',
    'terlambat': 'Terlambat',
  }[status] ?? status
}

/**
 * Warna badge per status
 */
export function getRekonStatusVariant(status: string) {
  return {
    'belum-pernah': 'outline' as const,
    'segar': 'default' as const,
    'perlu': 'secondary' as const,
    'terlambat': 'destructive' as const,
  }[status] ?? 'outline'
}
