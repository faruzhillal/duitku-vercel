import { differenceInDays, startOfDay } from 'date-fns'

/**
 * Hitung total yang sudah dibayar dari list pembayaran
 */
export function hitungTotalDibayar(
  pembayaran: { amount?: number | bigint | unknown; nominal?: number | bigint | unknown }[]
): number {
  return pembayaran.reduce((sum, p) => sum + Number(p.amount ?? p.nominal ?? 0), 0)
}

/**
 * Hitung sisa utang
 */
export function hitungSisa(
  amount: number,
  pembayaran: { amount?: number | bigint | unknown; nominal?: number | bigint | unknown }[]
): number {
  return amount - hitungTotalDibayar(pembayaran)
}

/**
 * Tentukan status berdasarkan sisa
 */
export function tentukanStatus(
  amount: number,
  totalDibayar: number
): 'unpaid' | 'partial' | 'paid' {
  if (totalDibayar <= 0) return 'unpaid'
  if (totalDibayar >= amount) return 'paid'
  return 'partial'
}

/**
 * Hitung progress 0-100%
 */
export function hitungProgress(
  amount: number,
  totalDibayar: number
): number {
  if (amount <= 0) return 0
  return Math.min(100, (totalDibayar / amount) * 100)
}

/**
 * Cek status jatuh tempo
 */
export type DueStatus = 'aman' | 'segera' | 'terlambat' | 'lunas' | 'tanpa-jatuh-tempo'

export function getDueStatus(
  dueDate: Date | string | null,
  status: string
): DueStatus {
  if (status === 'paid' || status === 'LUNAS') return 'lunas'
  if (!dueDate) return 'tanpa-jatuh-tempo'

  const today = startOfDay(new Date())
  const due = startOfDay(new Date(dueDate))
  const diff = differenceInDays(due, today)

  if (diff < 0) return 'terlambat'
  if (diff <= 3) return 'segera'
  return 'aman'
}

/**
 * Format label due status untuk UI
 */
export function getDueStatusLabel(
  dueStatus: DueStatus,
  dueDate: Date | string | null
): string {
  if (dueStatus === 'lunas') return 'Lunas'
  if (dueStatus === 'tanpa-jatuh-tempo') return 'Tanpa jatuh tempo'
  if (!dueDate) return ''

  const today = startOfDay(new Date())
  const due = startOfDay(new Date(dueDate))
  const diff = differenceInDays(due, today)

  if (diff === 0) return 'Hari ini'
  if (diff === 1) return 'Besok'
  if (diff === -1) return 'Kemarin'
  if (diff < 0) return `Terlambat ${Math.abs(diff)} hari`
  return `${diff} hari lagi`
}
