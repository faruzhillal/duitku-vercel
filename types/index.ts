// ==========================================
// DuitKu - Type Definitions
// ==========================================

import type {
  User,
  Akun,
  Kategori,
  Transaksi,
  Utang,
  PembayaranUtang,
  UangTitipan,
  Rekonsiliasi,
} from "@/app/generated/prisma";

export type {
  User,
  Akun,
  Kategori,
  Transaksi,
  Utang,
  PembayaranUtang,
  UangTitipan,
  Rekonsiliasi,
};

// Runtime enums for both client and server compatibility
export const TipeAkun = {
  TUNAI: "cash",
  BANK: "bank",
  EWALLET: "ewallet",
  EMONEY: "emoney",
} as const;
export type TipeAkun =
  | (typeof TipeAkun)[keyof typeof TipeAkun]
  | "TUNAI"
  | "BANK"
  | "EWALLET"
  | "EMONEY"
  | string;

export const TipeTransaksi = {
  PEMASUKAN: "income",
  PENGELUARAN: "expense",
  TRANSFER: "transfer",
} as const;
export type TipeTransaksi =
  | (typeof TipeTransaksi)[keyof typeof TipeTransaksi]
  | "PEMASUKAN"
  | "PENGELUARAN"
  | "TRANSFER"
  | string;

export const StatusTitipan = {
  AKTIF: "AKTIF",
  DIKEMBALIKAN: "DIKEMBALIKAN",
} as const;
export type StatusTitipan =
  | (typeof StatusTitipan)[keyof typeof StatusTitipan]
  | string;

export const StatusUtang = {
  BELUM_LUNAS: "BELUM_LUNAS",
  DIBAYAR_SEBAGIAN: "DIBAYAR_SEBAGIAN",
  LUNAS: "LUNAS",
} as const;
export type StatusUtang =
  | (typeof StatusUtang)[keyof typeof StatusUtang]
  | string;

export const TipeUtang = {
  UTANG: "UTANG",
  PIUTANG: "PIUTANG",
} as const;
export type TipeUtang =
  | (typeof TipeUtang)[keyof typeof TipeUtang]
  | string;

export const MetodePembayaran = {
  TUNAI: "cash",
  TRANSFER_BANK: "transfer",
  QRIS: "qris",
  KARTU_DEBIT: "debit",
  KARTU_KREDIT: "credit",
  EWALLET: "ewallet",
  LAINNYA: "other",
} as const;
export type MetodePembayaran =
  | (typeof MetodePembayaran)[keyof typeof MetodePembayaran]
  | string;

// ==========================================
// 1. Payload Relasi Models
// ==========================================

export type AkunWithStats = Akun & {
  _count?: { transaksi: number };
};

export type TransaksiWithRelations = Transaksi & {
  akun: Akun;
  kategori: Kategori | null;
  akunTujuan: Akun | null;
};

export type SerializedPembayaranUtang = {
  id: string;
  debtId: string;
  amount: number;
  date: Date | string;
  note?: string | null;
  utangId?: string;
  nominal?: number;
  tanggal?: Date | string;
  catatan?: string | null;
  akunId?: string | null;
};

export type UtangWithPayments = {
  id: string;
  userId: string;
  person: string;
  amount: number;
  type: "payable" | "receivable";
  dueDate: Date | string | null;
  status: "unpaid" | "partial" | "paid";
  note?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  pembayaran: SerializedPembayaranUtang[];
  namaPihak?: string;
  jumlah?: number;
  tipe?: string;
  jatuhTempo?: Date | null;
  catatan?: string | null;
};

export type UangTitipanWithOwner = UangTitipan;

// ==========================================
// 2. UI-Only Form Data Types
// ==========================================

export type AkunFormData = {
  name: string;
  type: TipeAkun;
  initialBalance: number;
  icon?: string;
  color?: string;
  isEntrusted: boolean;
  owner?: string;
};

export type TransaksiFormData = {
  date: string;
  amount: number;
  type: TipeTransaksi;
  categoryId?: string;
  accountId: string;
  transferToId?: string;
  paymentMethod?: MetodePembayaran;
  note?: string;
  tags?: string[];
};

export type KategoriFormData = {
  name: string;
  type: "income" | "expense";
  icon?: string;
  color?: string;
  parentId?: string;
};

export type UtangFormData = {
  person: string;
  amount: number;
  type: TipeUtang;
  dueDate?: string;
  note?: string;
};

export type UangTitipanFormData = {
  owner: string;
  amount: number;
  note?: string;
};

// ==========================================
// 3. Dashboard Analytics Types
// ==========================================

export type DashboardSummary = {
  netWorth: number;
  totalUangPribadi: number;
  totalPiutang: number;
  totalUtang: number;
  totalTitipan: number;
  pengeluaranHariIni: number;
  pengeluaranBulanIni: number;
  pemasukanBulanIni: number;
  perluRekonsiliasi?: number;
};

export type CategoryBreakdown = {
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  total: number;
  percentage: number;
};

// ==========================================
// 4. API & Action Response Types
// ==========================================

export type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

// ==========================================
// 5. Backward Compatibility Aliases (Stores/Hooks)
// ==========================================

export type Account = Akun;
export type Transaction = Transaksi;
export type Category = Kategori;
export type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

// ==========================================
// 6. AI Natural Language Input Types
// ==========================================

export type ParsedTransaksi = {
  date: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  accountName: string;
  transferToName?: string;
  categoryName: string;
  paymentMethod: 'cash' | 'qris' | 'transfer' | 'ewallet';
  note: string;
  confidence: number;
};

export type AiParseResult = {
  parsed: ParsedTransaksi;
  resolved: {
    accountId: string | null;
    transferToId: string | null;
    categoryId: string | null;
  };
  warnings: string[];
};

export type { TransaksiInput } from '@/lib/validators/transaksi';


