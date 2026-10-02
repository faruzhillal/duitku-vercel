'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { kategoriSchema, updateKategoriSchema, type KategoriInput } from '@/lib/validators/kategori'
import type { ActionResult } from '@/types'
import { seedDefaultKategori } from '@/lib/seed-kategori'

async function getCurrentUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user.id
}

export async function createKategori(
  formData: KategoriInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await getCurrentUserId()
    const validated = kategoriSchema.parse(formData)

    // Cek duplikat nama per user per tipe
    const existing = await prisma.kategori.findFirst({
      where: { 
        userId, 
        name: validated.name,
        type: validated.type,
      }
    })
    if (existing) {
      return {
        success: false,
        error: 'Kategori dengan nama ini sudah ada',
        fieldErrors: { name: ['Nama kategori sudah digunakan'] }
      }
    }

    const kategori = await prisma.kategori.create({
      data: {
        userId,
        name: validated.name,
        type: validated.type,
        icon: validated.icon,
        color: validated.color,
        parentId: validated.parentId,
        isDefault: false,
      }
    })

    revalidatePath('/categories')
    revalidatePath('/transactions')

    return { success: true, data: { id: kategori.id } }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Terjadi kesalahan' }
  }
}

export async function updateKategori(
  id: string,
  formData: Partial<KategoriInput>
): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await getCurrentUserId()

    const existing = await prisma.kategori.findFirst({
      where: { id, userId }
    })
    if (!existing) {
      return { success: false, error: 'Kategori tidak ditemukan' }
    }

    const validated = updateKategoriSchema.parse(formData)

    // Cek duplikat nama (kecuali dirinya sendiri)
    if (validated.name && validated.name !== existing.name) {
      const duplicate = await prisma.kategori.findFirst({
        where: { 
          userId, 
          name: validated.name,
          type: validated.type || existing.type,
          NOT: { id }
        }
      })
      if (duplicate) {
        return {
          success: false,
          error: 'Nama kategori sudah digunakan',
          fieldErrors: { name: ['Nama kategori sudah digunakan'] }
        }
      }
    }

    // Tidak boleh ubah tipe kalau kategori default
    if (existing.isDefault && validated.type && validated.type !== existing.type) {
      return { 
        success: false, 
        error: 'Tipe kategori default tidak bisa diubah' 
      }
    }

    await prisma.kategori.update({
      where: { id },
      data: {
        name: validated.name,
        type: validated.type,
        icon: validated.icon,
        color: validated.color,
        parentId: validated.parentId,
      }
    })

    revalidatePath('/categories')
    revalidatePath('/transactions')

    return { success: true, data: { id } }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Terjadi kesalahan' }
  }
}

export async function deleteKategori(id: string): Promise<ActionResult> {
  try {
    const userId = await getCurrentUserId()

    const existing = await prisma.kategori.findFirst({
      where: { id, userId },
      include: { _count: { select: { transaksi: true } } }
    })
    if (!existing) {
      return { success: false, error: 'Kategori tidak ditemukan' }
    }

    // Kategori default tidak bisa dihapus
    if (existing.isDefault) {
      return { 
        success: false, 
        error: 'Kategori default tidak bisa dihapus, hanya bisa di-rename' 
      }
    }

    // Cek anak kategori
    const childCount = await prisma.kategori.count({
      where: { parentId: id }
    })
    if (childCount > 0) {
      return {
        success: false,
        error: 'Kategori ini punya sub-kategori. Hapus sub-kategorinya dulu.'
      }
    }

    // Kalau ada transaksi terkait, pindahkan ke "Lain-lain"
    if (existing._count.transaksi > 0) {
      const fallback = await prisma.kategori.findFirst({
        where: {
          userId,
          type: existing.type,
          name: 'Lain-lain',
          isDefault: true,
        }
      })

      if (!fallback) {
        return {
          success: false,
          error: 'Kategori "Lain-lain" tidak ditemukan untuk memindahkan transaksi'
        }
      }

      // Atomic: pindahkan transaksi + hapus kategori
      await prisma.$transaction([
        prisma.transaksi.updateMany({
          where: { categoryId: id },
          data: { categoryId: fallback.id }
        }),
        prisma.kategori.delete({ where: { id } })
      ])
    } else {
      // Tidak ada transaksi, langsung hapus
      await prisma.kategori.delete({ where: { id } })
    }

    revalidatePath('/categories')
    revalidatePath('/transactions')
    revalidatePath('/')

    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Gagal menghapus kategori' }
  }
}

export async function reseedDefaultKategori(): Promise<ActionResult<{ count: number }>> {
  try {
    const userId = await getCurrentUserId()
    const result = await seedDefaultKategori(userId)
    
    if (result.skipped) {
      return { 
        success: false, 
        error: 'Kategori sudah ada, tidak perlu seeding' 
      }
    }

    revalidatePath('/categories')
    return { success: true, data: { count: result.count } }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Gagal seeding kategori' }
  }
}
