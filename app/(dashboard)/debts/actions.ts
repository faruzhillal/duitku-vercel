'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { utangSchema, pembayaranUtangSchema, type UtangInput, type PembayaranUtangInput } from '@/lib/validators/utang'
import type { ActionResult } from '@/types'
import { tentukanStatus } from '@/lib/utang-helpers'

async function getCurrentUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user.id
}

/**
 * 1. Action: createUtang
 */
export async function createUtang(
  formData: UtangInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await getCurrentUserId()
    const validated = utangSchema.parse(formData)

    const utang = await prisma.utang.create({
      data: {
        userId,
        namaPihak: validated.person,
        jumlah: validated.amount,
        tipe: validated.type === 'receivable' ? 'PIUTANG' : 'UTANG',
        jatuhTempo: validated.dueDate ? new Date(validated.dueDate) : null,
        catatan: validated.note || null,
        status: 'BELUM_LUNAS',
        jumlahTerbayar: 0,
      }
    })

    revalidatePath('/debts')
    revalidatePath('/')

    return { success: true, data: { id: utang.id } }
  } catch (error) {
    console.error('createUtang error:', error)
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Terjadi kesalahan' }
  }
}

/**
 * 2. Action: updateUtang
 */
export async function updateUtang(
  id: string,
  formData: UtangInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await getCurrentUserId()
    const validated = utangSchema.parse(formData)

    const existing = await prisma.utang.findFirst({
      where: { id, userId },
      include: { pembayaran: true }
    })
    if (!existing) {
      return { success: false, error: 'Utang tidak ditemukan' }
    }

    // Kalau sudah ada pembayaran, tidak boleh edit amount
    if (existing.pembayaran.length > 0 && Number(existing.jumlah) !== validated.amount) {
      return {
        success: false,
        error: 'Tidak bisa mengubah jumlah karena sudah ada pembayaran. Hapus pembayaran dulu.'
      }
    }

    // Update status berdasarkan pembayaran yang ada
    const totalDibayar = existing.pembayaran.reduce(
      (sum, p) => sum + Number(p.nominal),
      0
    )
    const rawStatus = tentukanStatus(validated.amount, totalDibayar)
    const status = rawStatus === 'paid' ? 'LUNAS' : rawStatus === 'partial' ? 'DIBAYAR_SEBAGIAN' : 'BELUM_LUNAS'

    await prisma.utang.update({
      where: { id },
      data: {
        namaPihak: validated.person,
        jumlah: validated.amount,
        tipe: validated.type === 'receivable' ? 'PIUTANG' : 'UTANG',
        jatuhTempo: validated.dueDate ? new Date(validated.dueDate) : null,
        catatan: validated.note || null,
        status,
        jumlahTerbayar: totalDibayar,
      }
    })

    revalidatePath('/debts')
    revalidatePath(`/debts/${id}`)
    revalidatePath('/')

    return { success: true, data: { id } }
  } catch (error) {
    console.error('updateUtang error:', error)
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Terjadi kesalahan' }
  }
}

/**
 * 3. Action: deleteUtang
 */
export async function deleteUtang(id: string): Promise<ActionResult> {
  try {
    const userId = await getCurrentUserId()

    const existing = await prisma.utang.findFirst({
      where: { id, userId },
      include: { _count: { select: { pembayaran: true } } }
    })
    if (!existing) {
      return { success: false, error: 'Utang tidak ditemukan' }
    }

    // Kalau ada pembayaran, wajib hapus dulu (safety)
    if (existing._count.pembayaran > 0) {
      return {
        success: false,
        error: `Utang ini punya ${existing._count.pembayaran} pembayaran. Hapus pembayarannya dulu.`
      }
    }

    await prisma.utang.delete({ where: { id } })

    revalidatePath('/debts')
    revalidatePath('/')

    return { success: true }
  } catch (error) {
    console.error('deleteUtang error:', error)
    return { success: false, error: 'Gagal menghapus utang' }
  }
}

/**
 * 4. Action: createPembayaranUtang
 */
export async function createPembayaranUtang(
  formData: PembayaranUtangInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await getCurrentUserId()
    const validated = pembayaranUtangSchema.parse(formData)

    // Ambil utang + pembayaran yang ada
    const utang = await prisma.utang.findFirst({
      where: { id: validated.debtId, userId },
      include: { pembayaran: true }
    })
    if (!utang) {
      return { success: false, error: 'Utang tidak ditemukan' }
    }

    // Hitung total dibayar + validasi tidak melebihi sisa
    const totalDibayar = utang.pembayaran.reduce(
      (sum, p) => sum + Number(p.nominal),
      0
    )
    const sisa = Number(utang.jumlah) - totalDibayar

    if (validated.amount > sisa) {
      return {
        success: false,
        error: `Jumlah pembayaran melebihi sisa utang (sisa: Rp${sisa.toLocaleString('id-ID')})`
      }
    }

    // Atomic: create payment + update status & jumlahTerbayar utang
    const newTotalDibayar = totalDibayar + validated.amount
    const rawStatus = tentukanStatus(Number(utang.jumlah), newTotalDibayar)
    const newStatus = rawStatus === 'paid' ? 'LUNAS' : rawStatus === 'partial' ? 'DIBAYAR_SEBAGIAN' : 'BELUM_LUNAS'

    const result = await prisma.$transaction(async (tx) => {
      const pembayaran = await tx.pembayaranUtang.create({
        data: {
          utangId: validated.debtId,
          nominal: validated.amount,
          tanggal: new Date(validated.date),
          catatan: validated.note || null,
        }
      })

      await tx.utang.update({
        where: { id: validated.debtId },
        data: {
          status: newStatus,
          jumlahTerbayar: newTotalDibayar,
        }
      })

      return pembayaran
    })

    revalidatePath('/debts')
    revalidatePath(`/debts/${validated.debtId}`)
    revalidatePath('/')

    return { success: true, data: { id: result.id } }
  } catch (error) {
    console.error('createPembayaranUtang error:', error)
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Terjadi kesalahan' }
  }
}

/**
 * 5. Action: deletePembayaranUtang
 */
export async function deletePembayaranUtang(
  id: string
): Promise<ActionResult> {
  try {
    const userId = await getCurrentUserId()

    const pembayaran = await prisma.pembayaranUtang.findUnique({
      where: { id },
      include: { utang: true }
    })
    if (!pembayaran || pembayaran.utang.userId !== userId) {
      return { success: false, error: 'Pembayaran tidak ditemukan' }
    }

    // Ambil semua pembayaran lain
    const semuaPembayaran = await prisma.pembayaranUtang.findMany({
      where: { utangId: pembayaran.utangId, NOT: { id } }
    })
    const totalDibayarBaru = semuaPembayaran.reduce(
      (sum, p) => sum + Number(p.nominal),
      0
    )
    const rawStatus = tentukanStatus(
      Number(pembayaran.utang.jumlah),
      totalDibayarBaru
    )
    const newStatus = rawStatus === 'paid' ? 'LUNAS' : rawStatus === 'partial' ? 'DIBAYAR_SEBAGIAN' : 'BELUM_LUNAS'

    // Atomic: delete payment + update status & jumlahTerbayar
    await prisma.$transaction([
      prisma.pembayaranUtang.delete({ where: { id } }),
      prisma.utang.update({
        where: { id: pembayaran.utangId },
        data: {
          status: newStatus,
          jumlahTerbayar: totalDibayarBaru,
        }
      })
    ])

    revalidatePath('/debts')
    revalidatePath(`/debts/${pembayaran.utangId}`)
    revalidatePath('/')

    return { success: true }
  } catch (error) {
    console.error('deletePembayaranUtang error:', error)
    return { success: false, error: 'Gagal menghapus pembayaran' }
  }
}
