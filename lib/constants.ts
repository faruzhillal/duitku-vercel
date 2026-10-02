// ==========================================
// DuitKu - Global Constants
// ==========================================

export const APP_NAME = "DuitKu";
export const APP_DESCRIPTION = "PWA Personal Finance & Uang Titipan";

// 1. Label & Opsi Tipe Akun
export const TIPE_AKUN_OPTIONS = [
  { value: "cash", label: "Tunai", icon: "💵" },
  { value: "bank", label: "Bank", icon: "🏦" },
  { value: "ewallet", label: "E-Wallet", icon: "📱" },
  { value: "emoney", label: "E-Money", icon: "💳" },
] as const;

// 2. Label & Opsi Metode Pembayaran
export const METODE_PEMBAYARAN_OPTIONS = [
  { value: "cash", label: "Tunai" },
  { value: "qris", label: "QRIS" },
  { value: "transfer", label: "Transfer" },
  { value: "ewallet", label: "E-Wallet" },
] as const;

// 3. Label Tipe Transaksi
export const TIPE_TRANSAKSI_OPTIONS = [
  { value: "income", label: "Pemasukan", color: "green" },
  { value: "expense", label: "Pengeluaran", color: "red" },
  { value: "transfer", label: "Transfer", color: "blue" },
] as const;

// 4. Kategori Default (untuk seeding & inisialisasi)
export const DEFAULT_KATEGORI = {
  expense: [
    { name: "Makan & Minuman", icon: "🍔", color: "#ef4444" },
    { name: "Transport", icon: "🚗", color: "#f97316" },
    { name: "Akademik", icon: "📚", color: "#eab308" },
    { name: "Kesehatan", icon: "💊", color: "#22c55e" },
    { name: "Hiburan", icon: "🎮", color: "#a855f7" },
    { name: "Tagihan", icon: "📄", color: "#06b6d4" },
    { name: "Tabungan", icon: "💰", color: "#3b82f6" },
    { name: "Bayar Utang", icon: "💸", color: "#dc2626" },
    { name: "Lain-lain", icon: "📦", color: "#64748b" },
  ],
  income: [
    { name: "Gaji", icon: "💼", color: "#16a34a" },
    { name: "Magang", icon: "🎓", color: "#0ea5e9" },
    { name: "Uang Saku", icon: "👨👩👧", color: "#f59e0b" },
    { name: "Bonus", icon: "🎁", color: "#a855f7" },
    { name: "Lain-lain", icon: "📦", color: "#64748b" },
  ],
} as const;

// 5. Format & Locale
export const CURRENCY = "IDR";
export const LOCALE = "id-ID";
export const TIMEZONE = "Asia/Jakarta";

// 6. Palet Warna untuk Akun
export const AKUN_COLORS = [
  "#0ea5e9",
  "#22c55e",
  "#f97316",
  "#a855f7",
  "#ef4444",
  "#eab308",
  "#06b6d4",
  "#64748b",
] as const;

// 7. Navigasi & Kompatibilitas
export const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: "LayoutDashboard" },
  { label: "Akun", href: "/accounts", icon: "WalletCards" },
  { label: "Transaksi", href: "/transactions", icon: "ArrowLeftRight" },
  { label: "Kategori", href: "/categories", icon: "Tag" },
  { label: "Utang & Piutang", href: "/debts", icon: "HandCoins" },
  { label: "Uang Titipan", href: "/entrusted", icon: "Users" },
  { label: "Rekonsiliasi", href: "/reconciliation", icon: "CheckCheck" },
  { label: "Pengaturan", href: "/settings", icon: "Settings" },
] as const;

// Backward-compatibility alias
export const DEFAULT_CATEGORIES = [
  ...DEFAULT_KATEGORI.expense.map((c) => ({ ...c, type: "expense" })),
  ...DEFAULT_KATEGORI.income.map((c) => ({ ...c, type: "income" })),
];
export const ACCOUNT_TYPES = TIPE_AKUN_OPTIONS;
