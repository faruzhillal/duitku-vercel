'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { transaksiSchema, type TransaksiInput } from '@/lib/validators/transaksi'
import type { ActionResult } from '@/types'
import {
  hitungDeltaTransaksi,
  buildSaldoUpdates,
} from '@/lib/transaksi-helpers'

async function getCurrentUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user.id
}

/**
 * Simpan transaksi hasil AI parse.
 * Data sudah dikonfirmasi user, jadi langsung create.
 */
export async function simpanDariAI(
  formData: TransaksiInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await getCurrentUserId()
    const validated = transaksiSchema.parse(formData)

    // Validasi akun milik user
    const akun = await prisma.akun.findFirst({
      where: { id: validated.accountId, userId }
    })
    if (!akun) return { success: false, error: 'Akun tidak ditemukan' }

    if (validated.type === 'transfer' && validated.transferToId) {
      const to = await prisma.akun.findFirst({
        where: { id: validated.transferToId, userId }
      })
      if (!to) return { success: false, error: 'Akun tujuan tidak ditemukan' }
    }

    const deltas = hitungDeltaTransaksi({
      type: validated.type,
      amount: validated.amount,
      accountId: validated.accountId,
      transferToId: validated.transferToId,
    })

    const result = await prisma.$transaction(async (tx) => {
      const trx = await tx.transaksi.create({
        data: {
          userId,
          accountId: validated.accountId,
          categoryId: validated.categoryId || null,
          transferToId: validated.transferToId || null,
          date: new Date(validated.date),
          amount: validated.amount,
          type: validated.type,
          paymentMethod: validated.paymentMethod,
          note: validated.note,
          tags: validated.tags || [],
        }
      })

      const updates = buildSaldoUpdates(tx, deltas)
      await Promise.all(updates)

      return trx
    })

    revalidatePath('/transactions')
    revalidatePath('/accounts')
    revalidatePath('/')

    return { success: true, data: { id: result.id } }
  } catch (error) {
    console.error('simpanDariAI error:', error)
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Gagal menyimpan' }
  }
}
