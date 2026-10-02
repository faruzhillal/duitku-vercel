'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { titipanSchema, pinjamTitipanSchema, type TitipanInput } from '@/lib/validators/titipan'
import type { ActionResult } from '@/types'

async function getCurrentUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user.id
}

/**
 * 1. Action: createTitipan
 */
export async function createTitipan(
  formData: TitipanInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await getCurrentUserId()
    const validated = titipanSchema.parse(formData)

    const titipan = await prisma.uangTitipan.create({
      data: {
        userId,
        owner: validated.owner,
        amount: validated.amount,
        note: validated.note,
        status: 'held',
      },
    })

    revalidatePath('/entrusted')
    revalidatePath('/')

    return { success: true, data: { id: titipan.id } }
  } catch (error) {
    console.error('createTitipan error:', error)
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Terjadi kesalahan' }
  }
}

/**
 * 2. Action: updateTitipan (hanya owner, amount, note — TIDAK status)
 */
export async function updateTitipan(
  id: string,
  formData: TitipanInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await getCurrentUserId()
    const validated = titipanSchema.parse(formData)

    const existing = await prisma.uangTitipan.findFirst({
      where: { id, userId },
    })
    if (!existing) {
      return { success: false, error: 'Titipan tidak ditemukan' }
    }
    if (existing.status === 'returned') {
      return {
        success: false,
        error: 'Titipan sudah dikembalikan, tidak bisa diedit',
      }
    }
    if (existing.status === 'borrowed') {
      return {
        success: false,
        error: 'Titipan sedang dipinjam. Kembalikan dulu atau batalkan pinjaman.',
      }
    }

    await prisma.uangTitipan.update({
      where: { id },
      data: {
        owner: validated.owner,
        amount: validated.amount,
        note: validated.note,
      },
    })

    revalidatePath('/entrusted')
    revalidatePath(`/entrusted/${id}`)
    revalidatePath('/')

    return { success: true, data: { id } }
  } catch (error) {
    console.error('updateTitipan error:', error)
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Terjadi kesalahan' }
  }
}

/**
 * 3. Action: deleteTitipan (hanya kalau status held)
 */
export async function deleteTitipan(id: string): Promise<ActionResult> {
  try {
    const userId = await getCurrentUserId()

    const existing = await prisma.uangTitipan.findFirst({
      where: { id, userId },
    })
    if (!existing) {
      return { success: false, error: 'Titipan tidak ditemukan' }
    }

    if (existing.status === 'borrowed') {
      return {
        success: false,
        error: 'Titipan sedang dipinjam. Batalkan pinjaman dulu.',
      }
    }
    if (existing.status === 'returned') {
      return {
        success: false,
        error: 'Titipan sudah dikembalikan dan tercatat sebagai history',
      }
    }

    await prisma.uangTitipan.delete({ where: { id } })

    revalidatePath('/entrusted')
    revalidatePath('/')

    return { success: true }
  } catch (error) {
    console.error('deleteTitipan error:', error)
    return { success: false, error: 'Gagal menghapus titipan' }
  }
}

/**
 * 4. Action: pinjamTitipan (mark as borrowed)
 */
export async function pinjamTitipan(
  formData: { id: string; borrowedBy: string }
): Promise<ActionResult> {
  try {
    const userId = await getCurrentUserId()
    const validated = pinjamTitipanSchema.parse(formData)

    const existing = await prisma.uangTitipan.findFirst({
      where: { id: validated.id, userId },
    })
    if (!existing) {
      return { success: false, error: 'Titipan tidak ditemukan' }
    }
    if (existing.status !== 'held') {
      return {
        success: false,
        error: `Titipan berstatus "${existing.status}", tidak bisa ditandai dipinjam`,
      }
    }

    await prisma.uangTitipan.update({
      where: { id: validated.id },
      data: {
        status: 'borrowed',
        borrowedBy: validated.borrowedBy,
      },
    })

    revalidatePath('/entrusted')
    revalidatePath(`/entrusted/${validated.id}`)
    revalidatePath('/')

    return { success: true }
  } catch (error) {
    console.error('pinjamTitipan error:', error)
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Terjadi kesalahan' }
  }
}

/**
 * 5. Action: batalkanPinjaman (dari borrowed kembali ke held)
 */
export async function batalkanPinjaman(id: string): Promise<ActionResult> {
  try {
    const userId = await getCurrentUserId()

    const existing = await prisma.uangTitipan.findFirst({
      where: { id, userId },
    })
    if (!existing) {
      return { success: false, error: 'Titipan tidak ditemukan' }
    }
    if (existing.status !== 'borrowed') {
      return {
        success: false,
        error: 'Titipan tidak sedang dipinjam',
      }
    }

    await prisma.uangTitipan.update({
      where: { id },
      data: {
        status: 'held',
        borrowedBy: null,
      },
    })

    revalidatePath('/entrusted')
    revalidatePath(`/entrusted/${id}`)
    revalidatePath('/')

    return { success: true }
  } catch (error) {
    console.error('batalkanPinjaman error:', error)
    return { success: false, error: 'Gagal membatalkan pinjaman' }
  }
}

/**
 * 6. Action: kembalikanTitipan (mark as returned)
 */
export async function kembalikanTitipan(id: string): Promise<ActionResult> {
  try {
    const userId = await getCurrentUserId()

    const existing = await prisma.uangTitipan.findFirst({
      where: { id, userId },
    })
    if (!existing) {
      return { success: false, error: 'Titipan tidak ditemukan' }
    }
    if (existing.status === 'returned') {
      return { success: false, error: 'Titipan sudah dikembalikan' }
    }

    await prisma.uangTitipan.update({
      where: { id },
      data: {
        status: 'returned',
        returnedAt: new Date(),
        borrowedBy: null,
      },
    })

    revalidatePath('/entrusted')
    revalidatePath(`/entrusted/${id}`)
    revalidatePath('/')

    return { success: true }
  } catch (error) {
    console.error('kembalikanTitipan error:', error)
    return { success: false, error: 'Gagal menandai titipan dikembalikan' }
  }
}
