import {
  LayoutDashboard,
  Wallet,
  Receipt,
  Tag,
  HandCoins,
  ShieldCheck,
  PieChart,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  badge?: 'new' | 'beta'
  description?: string
}

export const MAIN_NAV: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    description: 'Ringkasan keuangan kamu',
  },
  {
    label: 'Transaksi',
    href: '/transactions',
    icon: Receipt,
    description: 'Catat & lihat transaksi',
  },
  {
    label: 'Input AI',
    href: '/transactions/ai',
    icon: Sparkles,
    badge: 'beta',
    description: 'Input transaksi bahasa bebas',
  },
  {
    label: 'Akun',
    href: '/accounts',
    icon: Wallet,
    description: 'Kelola akun keuangan',
  },
  {
    label: 'Kategori',
    href: '/categories',
    icon: Tag,
    description: 'Kelola kategori',
  },
]

export const SECONDARY_NAV: NavItem[] = [
  {
    label: 'Utang & Piutang',
    href: '/debts',
    icon: HandCoins,
    description: 'Catat utang dan piutang',
  },
  {
    label: 'Uang Titipan',
    href: '/entrusted',
    icon: ShieldCheck,
    description: 'Uang orang lain yang kamu pegang',
  },
  {
    label: 'AI Assistant',
    href: '/chat',
    icon: Sparkles,
    description: 'Tanya jawab keuangan dengan AI',
    badge: 'beta',
  },
  {
    label: 'Rekonsiliasi',
    href: '/reconciliation',
    icon: PieChart,
    description: 'Cek selisih saldo',
  },
]

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/', icon: LayoutDashboard },
  { label: 'Transaksi', href: '/transactions', icon: Receipt },
  // Slot tengah untuk tombol +
  { label: 'Akun', href: '/accounts', icon: Wallet },
  { label: 'AI', href: '/chat', icon: Sparkles },
]
