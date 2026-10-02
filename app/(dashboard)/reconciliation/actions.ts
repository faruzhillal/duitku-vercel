'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
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

const rekonsiliasiSchema = z.object({
  accountId: z.string().min(1, 'Akun wajib dipilih'),
  actualBalance: z.coerce.number(),
  reason: z.string().max(300).optional(),
})

/**
 * 1. Action: rekonsiliasiAkun
 */
export async function rekonsiliasiAkun(
  formData: { accountId: string; actualBalance: number; reason?: string }
): Promise<ActionResult<{
  id: string
  difference: number
  adjustmentCreated: boolean
}>> {
  try {
    const userId = await getCurrentUserId()
    const validated = rekonsiliasiSchema.parse(formData)

    // Ambil akun
    const akun = await prisma.akun.findFirst({
      where: { id: validated.accountId, userId },
    })
    if (!akun) {
      return { success: false, error: 'Akun tidak ditemukan' }
    }

    const systemBalance = Number(akun.currentBalance)
    const actualBalance = validated.actualBalance
    const difference = actualBalance - systemBalance

    // Kalau tidak ada selisih, tetap catat rekonsiliasi (tanpa adjustment, alasan opsional)
    if (Math.abs(difference) < 0.01) {
      const rekon = await prisma.rekonsiliasi.create({
        data: {
          userId,
          accountId: validated.accountId,
          systemBalance,
          actualBalance,
          difference: 0,
          reason: validated.reason?.trim() || 'Dicek, cocok',
        },
      })

      revalidatePath('/reconciliation')
      revalidatePath(`/accounts/${validated.accountId}`)
      revalidatePath('/')

      return {
        success: true,
        data: { id: rekon.id, difference: 0, adjustmentCreated: false },
      }
    }

    // Ada selisih — alasan wajib minimal 5 karakter
    if (!validated.reason || validated.reason.trim().length < 5) {
      return {
        success: false,
        error: 'Alasan wajib diisi minimal 5 karakter jika ada selisih',
      }
    }
    const finalReason = validated.reason.trim()

    // Ada selisih — buat transaksi adjustment
    // Cari kategori "Lain-lain" untuk tipe yang sesuai
    const targetType = difference > 0 ? 'income' : 'expense'
    const fallbackKategori = await prisma.kategori.findFirst({
      where: {
        type: targetType,
        name: 'Lain-lain',
        OR: [{ userId }, { isDefault: true }],
      },
    })

    if (!fallbackKategori) {
      return {
        success: false,
        error: 'Kategori "Lain-lain" tidak ditemukan. Buat dulu di halaman Kategori.',
      }
    }

    const adjustmentAmount = Math.abs(difference)
    const adjustmentType: 'income' | 'expense' = difference > 0 ? 'income' : 'expense'

    // Atomic: create adjustment transaksi + create rekonsiliasi + update saldo akun
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create transaksi adjustment
      const adjustmentTx = await tx.transaksi.create({
        data: {
          userId,
          accountId: validated.accountId,
          categoryId: fallbackKategori.id,
          date: new Date(),
          amount: adjustmentAmount,
          type: adjustmentType,
          paymentMethod: 'transfer', // adjustment biasanya bukan cash
          note: `Penyesuaian rekonsiliasi: ${finalReason}`,
          tags: ['reconciliation'],
        },
      })

      // 2. Update saldo akun (apply delta)
      const deltas = hitungDeltaTransaksi({
        type: adjustmentType,
        amount: adjustmentAmount,
        accountId: validated.accountId,
      })
      const updates = buildSaldoUpdates(tx, deltas)
      await Promise.all(updates)

      // 3. Create rekonsiliasi record
      const rekon = await tx.rekonsiliasi.create({
        data: {
          userId,
          accountId: validated.accountId,
          systemBalance,
          actualBalance,
          difference,
          reason: finalReason,
          adjustmentTxId: adjustmentTx.id,
        },
      })

      return { rekon, adjustmentTx }
    })

    revalidatePath('/reconciliation')
    revalidatePath('/reconciliation/[id]')
    revalidatePath(`/accounts/${validated.accountId}`)
    revalidatePath('/transactions')
    revalidatePath('/')

    return {
      success: true,
      data: {
        id: result.rekon.id,
        difference,
        adjustmentCreated: true,
      },
    }
  } catch (error) {
    console.error('rekonsiliasiAkun error:', error)
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Gagal rekonsiliasi' }
  }
}

/**
 * 2. Action: deleteRekonsiliasi
 * Hapus record rekonsiliasi.
 * Kalau ada adjustment transaksi, hapus juga dan rollback saldo.
 */
export async function deleteRekonsiliasi(
  id: string
): Promise<ActionResult> {
  try {
    const userId = await getCurrentUserId()

    const rekon = await prisma.rekonsiliasi.findFirst({
      where: { id, userId },
      include: { adjustmentTx: true },
    })
    if (!rekon) {
      return { success: false, error: 'Rekonsiliasi tidak ditemukan' }
    }

    // Kalau ada adjustment transaksi, rollback
    if (rekon.adjustmentTx) {
      const tx = rekon.adjustmentTx
      const rollbackDeltas = hitungDeltaTransaksi({
        type: tx.type as 'income' | 'expense',
        amount: Number(tx.amount),
        accountId: tx.accountId,
      }).map((d) => ({ accountId: d.accountId, delta: -d.delta }))

      await prisma.$transaction(async (db) => {
        // Hapus relasi dulu
        await db.rekonsiliasi.update({
          where: { id },
          data: { adjustmentTxId: null },
        })
        // Hapus adjustment transaksi
        await db.transaksi.delete({ where: { id: tx.id } })
        // Rollback saldo
        const updates = buildSaldoUpdates(db, rollbackDeltas)
        await Promise.all(updates)
        // Hapus rekonsiliasi
        await db.rekonsiliasi.delete({ where: { id } })
      })
    } else {
      await prisma.rekonsiliasi.delete({ where: { id } })
    }

    revalidatePath('/reconciliation')
    revalidatePath(`/accounts/${rekon.accountId}`)
    revalidatePath('/transactions')
    revalidatePath('/')

    return { success: true }
  } catch (error) {
    console.error('deleteRekonsiliasi error:', error)
    return { success: false, error: 'Gagal menghapus rekonsiliasi' }
  }
}
