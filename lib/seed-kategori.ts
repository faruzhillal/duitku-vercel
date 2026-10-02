import { prisma } from '@/lib/prisma'
import { DEFAULT_KATEGORI } from '@/lib/constants'

/**
 * Seed default categories untuk user baru.
 * Dipanggil saat:
 * - User pertama kali register (di NextAuth events.createUser)
 * - User pertama kali login (fallback kalau seeding gagal)
 */
export async function seedDefaultKategori(userId: string) {
  // Cek apakah sudah ada kategori
  const existing = await prisma.kategori.count({ where: { userId } })
  if (existing > 0) return { skipped: true, count: 0 }

  const data = [
    ...DEFAULT_KATEGORI.expense.map((k) => ({
      userId,
      name: k.name,
      type: 'expense' as const,
      icon: k.icon,
      color: k.color,
      isDefault: true,
    })),
    ...DEFAULT_KATEGORI.income.map((k) => ({
      userId,
      name: k.name,
      type: 'income' as const,
      icon: k.icon,
      color: k.color,
      isDefault: true,
    })),
  ]

  await prisma.kategori.createMany({ data })
  return { skipped: false, count: data.length }
}
