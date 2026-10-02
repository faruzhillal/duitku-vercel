import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { LOCALE, CURRENCY } from "./constants";

// ==========================================
// 1. Tailwind Class Merge
// ==========================================

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ==========================================
// 2. Format Currency (Rupiah)
// ==========================================

export function formatRupiah(amount: number | bigint): string {
  const num = typeof amount === "bigint" ? Number(amount) : amount;
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(num)
    .replace(/\s+/g, "");
}

// ==========================================
// 3. Format Tanggal (Indonesia)
// ==========================================

export function formatTanggal(
  date: Date | string,
  pattern = "dd MMM yyyy"
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, pattern, { locale: localeId });
}

export function formatTanggalRelatif(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: localeId });
}

// Alias backward compatibility
export const formatTanggalIndonesia = formatTanggal;

// ==========================================
// 4. Format Persentase
// ==========================================

export function formatPersen(value: number): string {
  return `${value.toFixed(1)}%`;
}

// ==========================================
// 5. Parse Nominal dari Input User
// ==========================================

export function parseNominal(input: string): number {
  const cleaned = input.replace(/[^\d]/g, "");
  return parseInt(cleaned, 10) || 0;
}

// ==========================================
// 6. Inisial Nama Pengguna
// ==========================================

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ==========================================
// 7. Konversi Decimal Prisma ke Number
// ==========================================

export function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (value && typeof value === "object" && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value) || 0;
}

// ==========================================
// 8. Serialisasi Prisma Decimal untuk Client
// ==========================================

export function serializeDecimal<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== "object") return obj;
  if (obj instanceof Date) return obj;
  if ("toNumber" in obj && typeof (obj as { toNumber?: unknown }).toNumber === "function") {
    return (obj as { toNumber: () => number }).toNumber() as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(serializeDecimal) as unknown as T;
  }
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, serializeDecimal(v)])
  ) as unknown as T;
}
