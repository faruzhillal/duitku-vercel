'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BOTTOM_NAV_ITEMS } from '@/lib/nav-config'
import { QuickAddSheet } from './quick-add-sheet'

export function BottomNav() {
  const pathname = usePathname()
  const [quickAddOpen, setQuickAddOpen] = useState(false)

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-background border-t pb-safe">
        <div className="grid grid-cols-5 h-full">
          {/* Kiri: 2 item */}
          {BOTTOM_NAV_ITEMS.slice(0, 2).map((item) => (
            <NavButton
              key={item.href}
              item={item}
              isActive={
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href)
              }
            />
          ))}

          {/* Tengah: tombol + */}
          <div className="relative flex items-center justify-center">
            <button
              onClick={() => setQuickAddOpen(true)}
              className={cn(
                'absolute -top-6 w-14 h-14 rounded-full bg-primary text-primary-foreground',
                'flex items-center justify-center',
                'shadow-lg shadow-primary/30',
                'transition-transform active:scale-95',
                'hover:scale-105'
              )}
              aria-label="Tambah transaksi cepat"
            >
              <Plus className="w-6 h-6" strokeWidth={2.5} />
            </button>
          </div>

          {/* Kanan: 2 item */}
          {BOTTOM_NAV_ITEMS.slice(2).map((item) => (
            <NavButton
              key={item.href}
              item={item}
              isActive={pathname.startsWith(item.href)}
            />
          ))}
        </div>
      </nav>

      {/* Quick Add Sheet */}
      <QuickAddSheet
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
      />
    </>
  )
}

function NavButton({
  item,
  isActive,
}: {
  item: (typeof BOTTOM_NAV_ITEMS)[number]
  isActive: boolean
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      className={cn(
        'flex flex-col items-center justify-center gap-1 transition-colors',
        isActive
          ? 'text-primary'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
      <span className="text-[10px] font-medium">{item.label}</span>
    </Link>
  )
}
