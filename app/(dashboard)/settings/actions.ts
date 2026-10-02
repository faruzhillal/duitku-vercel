'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { ActionResult } from '@/types'

async function getCurrentUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user.id
}

const profilSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(100),
})

/**
 * 1. Action: updateProfil
 */
export async function updateProfil(
  formData: { name: string }
): Promise<ActionResult> {
  try {
    const userId = await getCurrentUserId()
    const validated = profilSchema.parse(formData)

    await prisma.user.update({
      where: { id: userId },
      data: { name: validated.name },
    })

    revalidatePath('/settings')
    revalidatePath('/')

    return { success: true }
  } catch (error) {
    console.error('updateProfil error:', error)
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Gagal update profil' }
  }
}

/**
 * 2. Action: exportAllData
 */
export async function exportAllData(): Promise<
  ActionResult<{
    transaksi: string
    akun: string
    kategori: string
    utang: string
    titipan: string
  }>
> {
  try {
    const userId = await getCurrentUserId()

    const [transaksi, akun, kategori, utang, titipan] = await Promise.all([
      prisma.transaksi.findMany({
        where: { userId },
        orderBy: { date: 'asc' },
        include: { akun: true, kategori: true, akunTujuan: true },
      }),
      prisma.akun.findMany({ where: { userId }, orderBy: { name: 'asc' } }),
      prisma.kategori.findMany({ where: { userId }, orderBy: { name: 'asc' } }),
      prisma.utang.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        include: { pembayaran: true },
      }),
      prisma.uangTitipan.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      }),
    ])

    // Generate CSV strings
    const csvTransaksi = toCSV(
      transaksi.map((t) => ({
        id: t.id,
        tanggal: t.date.toISOString().split('T')[0],
        tipe: t.type,
        jumlah: Number(t.amount),
        akun: t.akun.name,
        akun_tujuan: t.akunTujuan?.name || '',
        kategori: t.kategori?.name || '',
        metode: t.paymentMethod || '',
        catatan: t.note || '',
        tags: (t.tags || []).join(';'),
      })),
      [
        'id',
        'tanggal',
        'tipe',
        'jumlah',
        'akun',
        'akun_tujuan',
        'kategori',
        'metode',
        'catatan',
        'tags',
      ]
    )

    const csvAkun = toCSV(
      akun.map((a) => ({
        id: a.id,
        nama: a.name,
        tipe: a.type,
        saldo_awal: Number(a.initialBalance),
        saldo_sekarang: Number(a.currentBalance),
        mata_uang: a.currency,
        titipan: a.isEntrusted ? 'ya' : 'tidak',
        pemilik: a.owner || '',
      })),
      [
        'id',
        'nama',
        'tipe',
        'saldo_awal',
        'saldo_sekarang',
        'mata_uang',
        'titipan',
        'pemilik',
      ]
    )

    const csvKategori = toCSV(
      kategori.map((k) => ({
        id: k.id,
        nama: k.name,
        tipe: k.type,
        ikon: k.icon || '',
        warna: k.color || '',
        default: k.isDefault ? 'ya' : 'tidak',
      })),
      ['id', 'nama', 'tipe', 'ikon', 'warna', 'default']
    )

    const csvUtang = toCSV(
      utang.map((u) => {
        const totalDibayar = u.pembayaran.reduce(
          (s, p) => s + Number(p.nominal ?? 0),
          0
        )
        const amount = Number(u.jumlah)
        return {
          id: u.id,
          orang: u.namaPihak,
          tipe: u.tipe === 'PIUTANG' ? 'receivable' : 'payable',
          jumlah: amount,
          total_dibayar: totalDibayar,
          sisa: amount - totalDibayar,
          status:
            u.status === 'LUNAS'
              ? 'paid'
              : u.status === 'DIBAYAR_SEBAGIAN'
              ? 'partial'
              : 'unpaid',
          jatuh_tempo: u.jatuhTempo
            ? u.jatuhTempo.toISOString().split('T')[0]
            : '',
          catatan: u.catatan || '',
        }
      }),
      [
        'id',
        'orang',
        'tipe',
        'jumlah',
        'total_dibayar',
        'sisa',
        'status',
        'jatuh_tempo',
        'catatan',
      ]
    )

    const csvTitipan = toCSV(
      titipan.map((t) => ({
        id: t.id,
        pemilik: t.owner,
        jumlah: Number(t.amount),
        status: t.status,
        dipinjam_oleh: t.borrowedBy || '',
        catatan: t.note || '',
        dikembalikan_pada: t.returnedAt
          ? t.returnedAt.toISOString().split('T')[0]
          : '',
      })),
      [
        'id',
        'pemilik',
        'jumlah',
        'status',
        'dipinjam_oleh',
        'catatan',
        'dikembalikan_pada',
      ]
    )

    return {
      success: true,
      data: {
        transaksi: csvTransaksi,
        akun: csvAkun,
        kategori: csvKategori,
        utang: csvUtang,
        titipan: csvTitipan,
      },
    }
  } catch (error) {
    console.error('exportAllData error:', error)
    return { success: false, error: 'Gagal export data' }
  }
}

// Helper: convert array of objects to CSV string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toCSV(rows: Record<string, any>[], headers: string[]): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const escape = (val: any) => {
    if (val === null || val === undefined) return ''
    const str = String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const headerLine = headers.join(',')
  const dataLines = rows.map((row) =>
    headers.map((h) => escape(row[h])).join(',')
  )

  return [headerLine, ...dataLines].join('\n')
}

/**
 * 3. Action: resetSemuaData
 */
export async function resetSemuaData(
  confirmation: string
): Promise<ActionResult> {
  try {
    if (confirmation !== 'HAPUS SEMUA') {
      return {
        success: false,
        error: 'Konfirmasi tidak valid. Ketik "HAPUS SEMUA" untuk konfirmasi.',
      }
    }

    const userId = await getCurrentUserId()

    // Urutan penting karena foreign key: hapus anak dulu
    await prisma.$transaction([
      prisma.pembayaranUtang.deleteMany({
        where: { utang: { userId } },
      }),
      prisma.transaksi.deleteMany({ where: { userId } }),
      prisma.utang.deleteMany({ where: { userId } }),
      prisma.uangTitipan.deleteMany({ where: { userId } }),
      prisma.rekonsiliasi.deleteMany({ where: { userId } }),
      prisma.akun.deleteMany({ where: { userId } }),
      prisma.kategori.deleteMany({ where: { userId } }),
    ])

    // Re-seed default kategori
    const { seedDefaultKategori } = await import('@/lib/seed-kategori')
    await seedDefaultKategori(userId)

    revalidatePath('/')
    revalidatePath('/accounts')
    revalidatePath('/transactions')
    revalidatePath('/categories')
    revalidatePath('/debts')
    revalidatePath('/entrusted')
    revalidatePath('/settings')

    return { success: true }
  } catch (error) {
    console.error('resetSemuaData error:', error)
    return { success: false, error: 'Gagal reset data' }
  }
}

/**
 * 4. Action: hapusAkunPermanen
 */
export async function hapusAkunPermanen(
  confirmation: string
): Promise<ActionResult> {
  try {
    if (confirmation !== 'HAPUS AKUN') {
      return {
        success: false,
        error: 'Konfirmasi tidak valid. Ketik "HAPUS AKUN" untuk konfirmasi.',
      }
    }

    const userId = await getCurrentUserId()

    // Hapus user (cascade akan hapus semua data terkait di DB)
    await prisma.user.delete({ where: { id: userId } })

    return { success: true }
  } catch (error) {
    console.error('hapusAkunPermanen error:', error)
    return { success: false, error: 'Gagal hapus akun' }
  }
}
