'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { akunSchema, updateAkunSchema, type AkunInput } from '@/lib/validators/akun'
import type { ActionResult } from '@/types'
import { Prisma } from '@/app/generated/prisma'

async function getCurrentUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  return session.user.id
}

export async function createAkun(formData: AkunInput): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await getCurrentUserId()
    
    // Validasi dengan zod
    const validated = akunSchema.parse(formData)
    
    // Cek duplikat nama akun
    const existing = await prisma.akun.findFirst({
      where: { userId, name: validated.name }
    })
    if (existing) {
      return {
        success: false,
        error: 'Nama akun sudah digunakan',
        fieldErrors: { name: ['Nama akun sudah digunakan'] }
      }
    }
    
    // Create akun dengan saldo awal = saldo sekarang
    const akun = await prisma.akun.create({
      data: {
        userId,
        name: validated.name,
        type: validated.type,
        initialBalance: validated.initialBalance,
        currentBalance: validated.initialBalance, // sama dengan initial
        icon: validated.icon,
        color: validated.color,
        isEntrusted: validated.isEntrusted,
        owner: validated.owner,
      }
    })
    
    // Revalidate halaman terkait
    revalidatePath('/accounts')
    revalidatePath(`/accounts/${akun.id}`)
    revalidatePath('/')
    
    return { success: true, data: { id: akun.id } }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { success: false, error: 'Gagal menyimpan akun' }
    }
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Terjadi kesalahan' }
  }
}

export async function updateAkun(
  id: string, 
  formData: Partial<AkunInput>
): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await getCurrentUserId()
    
    // Cek kepemilikan akun
    const existing = await prisma.akun.findFirst({
      where: { id, userId }
    })
    if (!existing) {
      return { success: false, error: 'Akun tidak ditemukan' }
    }
    
    const validated = updateAkunSchema.parse(formData)
    
    // Cek duplikat nama (kecuali dirinya sendiri)
    if (validated.name) {
      const duplicate = await prisma.akun.findFirst({
        where: { userId, name: validated.name, NOT: { id } }
      })
      if (duplicate) {
        return {
          success: false,
          error: 'Nama akun sudah digunakan',
          fieldErrors: { name: ['Nama akun sudah digunakan'] }
        }
      }
    }
    
    // Update akun
    // PENTING: jangan update currentBalance kecuali initialBalance diubah
    const updateData: Prisma.AkunUpdateInput = {
      name: validated.name,
      type: validated.type,
      icon: validated.icon,
      color: validated.color,
      isEntrusted: validated.isEntrusted,
      owner: validated.owner,
    }
    
    // Kalau initialBalance diubah, hitung ulang currentBalance
    // currentBalance = initialBalance + sum(income) - sum(expense) + sum(transfers)
    if (validated.initialBalance !== undefined && 
        validated.initialBalance !== existing.initialBalance.toNumber()) {
      // Ambil semua transaksi akun ini
      const transaksi = await prisma.transaksi.findMany({
        where: { accountId: id }
      })
      
      // Hitung delta dari transaksi
      let delta = 0
      for (const t of transaksi) {
        const amount = t.amount.toNumber()
        if (t.type === 'income') delta += amount
        else if (t.type === 'expense') delta -= amount
        else if (t.type === 'transfer') delta -= amount // keluar
      }
      
      // Tambah transfer masuk dari akun lain
      const transferMasuk = await prisma.transaksi.findMany({
        where: { transferToId: id, type: 'transfer' }
      })
      for (const t of transferMasuk) {
        delta += t.amount.toNumber()
      }
      
      updateData.initialBalance = validated.initialBalance
      updateData.currentBalance = validated.initialBalance + delta
    }
    
    await prisma.akun.update({
      where: { id },
      data: updateData
    })
    
    revalidatePath('/accounts')
    revalidatePath(`/accounts/${id}`)
    revalidatePath('/')
    
    return { success: true, data: { id } }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Terjadi kesalahan' }
  }
}

export async function deleteAkun(id: string): Promise<ActionResult> {
  try {
    const userId = await getCurrentUserId()
    
    // Cek kepemilikan
    const existing = await prisma.akun.findFirst({
      where: { id, userId },
      include: { _count: { select: { transaksi: true } } }
    })
    if (!existing) {
      return { success: false, error: 'Akun tidak ditemukan' }
    }
    
    // Cek apakah ada transaksi
    if (existing._count.transaksi > 0) {
      return {
        success: false,
        error: `Akun ini masih punya ${existing._count.transaksi} transaksi. Hapus transaksinya dulu atau pindahkan ke akun lain.`
      }
    }
    
    // Cek apakah akun ini jadi tujuan transfer
    const transferCount = await prisma.transaksi.count({
      where: { transferToId: id }
    })
    if (transferCount > 0) {
      return {
        success: false,
        error: 'Akun ini masih jadi tujuan transfer. Hapus transaksinya dulu.'
      }
    }
    
    await prisma.akun.delete({ where: { id } })
    
    revalidatePath('/accounts')
    revalidatePath(`/accounts/${id}`)
    revalidatePath('/')
    
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Gagal menghapus akun' }
  }
}
