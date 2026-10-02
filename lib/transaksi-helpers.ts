import { prisma } from '@/lib/prisma'
import type { Prisma } from '@/app/generated/prisma'

/**
 * Hitung delta saldo untuk transaksi.
 * Return array of { accountId, delta } untuk di-apply.
 */
export function hitungDeltaTransaksi(transaksi: {
  type: 'income' | 'expense' | 'transfer'
  amount: number
  accountId: string
  transferToId?: string | null
}): { accountId: string; delta: number }[] {
  const { type, amount, accountId, transferToId } = transaksi

  if (type === 'income') {
    return [{ accountId, delta: amount }]
  }
  if (type === 'expense') {
    return [{ accountId, delta: -amount }]
  }
  if (type === 'transfer') {
    if (!transferToId) {
      throw new Error('Transfer butuh akun tujuan')
    }
    return [
      { accountId, delta: -amount },
      { accountId: transferToId, delta: amount },
    ]
  }
  return []
}

/**
 * Kebalikan dari hitungDeltaTransaksi.
 * Untuk rollback saat update/delete.
 */
export function hitungDeltaRollback(transaksi: {
  type: 'income' | 'expense' | 'transfer'
  amount: number
  accountId: string
  transferToId?: string | null
}): { accountId: string; delta: number }[] {
  return hitungDeltaTransaksi(transaksi).map((d) => ({
    accountId: d.accountId,
    delta: -d.delta,
  }))
}

/**
 * Gabungkan multiple delta untuk akun yang sama.
 * Contoh: transfer + adjust saldo bisa mengenai akun yang sama.
 */
export function mergeDeltas(
  deltas: { accountId: string; delta: number }[]
): { accountId: string; delta: number }[] {
  const map = new Map<string, number>()
  for (const { accountId, delta } of deltas) {
    map.set(accountId, (map.get(accountId) ?? 0) + delta)
  }
  return Array.from(map.entries()).map(([accountId, delta]) => ({
    accountId,
    delta,
  }))
}

/**
 * Bangun operasi update saldo untuk prisma.$transaction.
 * Return array of PrismaPromise yang bisa langsung dipakai.
 */
export function buildSaldoUpdates(
  tx: Prisma.TransactionClient,
  deltas: { accountId: string; delta: number }[]
) {
  const merged = mergeDeltas(deltas)
  return merged
    .filter(({ delta }) => delta !== 0)
    .map(({ accountId, delta }) =>
      tx.akun.update({
        where: { id: accountId },
        data: {
          currentBalance: { increment: delta },
          updatedAt: new Date(),
        },
      })
    )
}

/**
 * Validasi: apakah akun punya saldo cukup?
 * Return true kalau cukup, false kalau tidak.
 * Bukan blocker, hanya untuk warning.
 */
export async function cekSaldoCukup(
  accountId: string,
  userId: string,
  needed: number
): Promise<{ cukup: boolean; saldoSekarang: number }> {
  const akun = await prisma.akun.findFirst({
    where: { id: accountId, userId },
    select: { currentBalance: true },
  })
  if (!akun) return { cukup: false, saldoSekarang: 0 }
  const saldo = Number(akun.currentBalance)
  return { cukup: saldo >= needed, saldoSekarang: saldo }
}
