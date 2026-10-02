'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { transaksiSchema, type TransaksiInput } from '@/lib/validators/transaksi'
import type { ActionResult } from '@/types'
import {
  hitungDeltaTransaksi,
  hitungDeltaRollback,
  buildSaldoUpdates,
} from '@/lib/transaksi-helpers'

async function getCurrentUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user.id
}

export async function createTransaksi(
  formData: TransaksiInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await getCurrentUserId()
    const validated = transaksiSchema.parse(formData)

    // Validasi: akun milik user
    const akun = await prisma.akun.findFirst({
      where: { id: validated.accountId, userId }
    })
    if (!akun) {
      return { success: false, error: 'Akun tidak ditemukan' }
    }

    // Validasi: kategori milik user (kalau ada)
    if (validated.categoryId) {
      const kategori = await prisma.kategori.findFirst({
        where: { id: validated.categoryId, userId }
      })
      if (!kategori) {
        return { success: false, error: 'Kategori tidak ditemukan' }
      }
      // Kategori tipe harus match dengan transaksi tipe
      if (
        (kategori.type === 'income' && validated.type === 'expense') ||
        (kategori.type === 'expense' && validated.type === 'income')
      ) {
        return { 
          success: false, 
          error: 'Tipe kategori tidak cocok dengan tipe transaksi' 
        }
      }
    }

    // Validasi: transferToId milik user (kalau ada)
    if (validated.type === 'transfer' && validated.transferToId) {
      if (validated.transferToId === validated.accountId) {
        return { success: false, error: 'Akun asal dan akun tujuan tidak boleh sama' }
      }
      const akunTujuan = await prisma.akun.findFirst({
        where: { id: validated.transferToId, userId }
      })
      if (!akunTujuan) {
        return { success: false, error: 'Akun tujuan tidak ditemukan' }
      }
    }

    // Hitung delta saldo
    const deltas = hitungDeltaTransaksi({
      type: validated.type,
      amount: validated.amount,
      accountId: validated.accountId,
      transferToId: validated.transferToId,
    })

    // Atomic: create transaksi + update semua saldo akun
    const result = await prisma.$transaction(async (tx) => {
      const transaksi = await tx.transaksi.create({
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

      // Update saldo akun (bisa 1 atau 2 akun)
      const updates = buildSaldoUpdates(tx, deltas)
      await Promise.all(updates)

      return transaksi
    })

    revalidatePath('/transactions')
    revalidatePath('/accounts')
    revalidatePath('/')
    revalidatePath(`/accounts/${validated.accountId}`)
    if (validated.transferToId) {
      revalidatePath(`/accounts/${validated.transferToId}`)
    }

    return { success: true, data: { id: result.id } }
  } catch (error) {
    console.error('createTransaksi error:', error)
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Terjadi kesalahan' }
  }
}

export async function updateTransaksi(
  id: string,
  formData: TransaksiInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await getCurrentUserId()
    const validated = transaksiSchema.parse(formData)

    // Ambil transaksi lama
    const transaksiLama = await prisma.transaksi.findFirst({
      where: { id, userId }
    })
    if (!transaksiLama) {
      return { success: false, error: 'Transaksi tidak ditemukan' }
    }

    // Validasi akun baru
    const akun = await prisma.akun.findFirst({
      where: { id: validated.accountId, userId }
    })
    if (!akun) return { success: false, error: 'Akun tidak ditemukan' }

    if (validated.categoryId) {
      const kategori = await prisma.kategori.findFirst({
        where: { id: validated.categoryId, userId }
      })
      if (!kategori) return { success: false, error: 'Kategori tidak ditemukan' }
      if (
        (kategori.type === 'income' && validated.type === 'expense') ||
        (kategori.type === 'expense' && validated.type === 'income')
      ) {
        return { 
          success: false, 
          error: 'Tipe kategori tidak cocok dengan tipe transaksi' 
        }
      }
    }

    if (validated.type === 'transfer' && validated.transferToId) {
      if (validated.transferToId === validated.accountId) {
        return { success: false, error: 'Akun asal dan akun tujuan tidak boleh sama' }
      }
      const akunTujuan = await prisma.akun.findFirst({
        where: { id: validated.transferToId, userId }
      })
      if (!akunTujuan) return { success: false, error: 'Akun tujuan tidak ditemukan' }
    }

    // Hitung delta rollback (kebalikan transaksi lama)
    const rollbackDeltas = hitungDeltaRollback({
      type: transaksiLama.type as 'income' | 'expense' | 'transfer',
      amount: Number(transaksiLama.amount),
      accountId: transaksiLama.accountId,
      transferToId: transaksiLama.transferToId,
    })

    // Hitung delta baru
    const newDeltas = hitungDeltaTransaksi({
      type: validated.type,
      amount: validated.amount,
      accountId: validated.accountId,
      transferToId: validated.transferToId,
    })

    // Gabungkan: rollback lama + apply baru
    const allDeltas = [...rollbackDeltas, ...newDeltas]

    // Atomic: update transaksi + apply semua delta
    await prisma.$transaction(async (tx) => {
      await tx.transaksi.update({
        where: { id },
        data: {
          accountId: validated.accountId,
          categoryId: validated.categoryId || null,
          transferToId: validated.transferToId || null,
          date: new Date(validated.date),
          amount: validated.amount,
          type: validated.type,
          paymentMethod: validated.paymentMethod,
          note: validated.note,
          tags: validated.tags || [],
          updatedAt: new Date(),
        }
      })

      const updates = buildSaldoUpdates(tx, allDeltas)
      await Promise.all(updates)
    })

    // Revalidate semua akun yang terlibat
    const affectedAccountIds = new Set([
      transaksiLama.accountId,
      transaksiLama.transferToId,
      validated.accountId,
      validated.transferToId,
    ].filter(Boolean) as string[])

    revalidatePath('/transactions')
    revalidatePath('/accounts')
    revalidatePath('/')
    affectedAccountIds.forEach((aid) => revalidatePath(`/accounts/${aid}`))

    return { success: true, data: { id } }
  } catch (error) {
    console.error('updateTransaksi error:', error)
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Terjadi kesalahan' }
  }
}

export async function deleteTransaksi(id: string): Promise<ActionResult> {
  try {
    const userId = await getCurrentUserId()

    const transaksi = await prisma.transaksi.findFirst({
      where: { id, userId }
    })
    if (!transaksi) {
      return { success: false, error: 'Transaksi tidak ditemukan' }
    }

    // Hitung delta rollback
    const rollbackDeltas = hitungDeltaRollback({
      type: transaksi.type as 'income' | 'expense' | 'transfer',
      amount: Number(transaksi.amount),
      accountId: transaksi.accountId,
      transferToId: transaksi.transferToId,
    })

    // Atomic: delete + rollback saldo
    await prisma.$transaction(async (tx) => {
      await tx.transaksi.delete({ where: { id } })
      const updates = buildSaldoUpdates(tx, rollbackDeltas)
      await Promise.all(updates)
    })

    const affectedAccountIds = [
      transaksi.accountId,
      transaksi.transferToId,
    ].filter(Boolean) as string[]

    revalidatePath('/transactions')
    revalidatePath('/accounts')
    revalidatePath('/')
    affectedAccountIds.forEach((aid) => revalidatePath(`/accounts/${aid}`))

    return { success: true }
  } catch (error) {
    console.error('deleteTransaksi error:', error)
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Gagal menghapus transaksi' }
  }
}

export async function getTransaksiDetail(id: string) {
  const userId = await getCurrentUserId()
  const transaksi = await prisma.transaksi.findFirst({
    where: { id, userId },
    include: { kategori: true, akun: true, akunTujuan: true }
  })
  if (!transaksi) return null

  // Serialize Decimal
  return {
    ...transaksi,
    amount: Number(transaksi.amount),
    akun: transaksi.akun ? {
      ...transaksi.akun,
      initialBalance: Number(transaksi.akun.initialBalance),
      currentBalance: Number(transaksi.akun.currentBalance),
    } : null,
    akunTujuan: transaksi.akunTujuan ? {
      ...transaksi.akunTujuan,
      initialBalance: Number(transaksi.akunTujuan.initialBalance),
      currentBalance: Number(transaksi.akunTujuan.currentBalance),
    } : null,
  }
}
