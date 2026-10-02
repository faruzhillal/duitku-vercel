'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Wallet, Settings as SettingsIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MAIN_NAV, SECONDARY_NAV } from '@/lib/nav-config'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { TooltipProvider } from '@/components/ui/tooltip'

interface Props {
  user: {
    name?: string | null
    email?: string | null
  }
}

export function Sidebar({ user }: Props) {
  const pathname = usePathname()

  return (
    <TooltipProvider delayDuration={300}>
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 md:border-r md:bg-background">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-bold text-lg leading-tight">DuitKu</p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Personal Finance
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          {/* Main */}
          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Utama
            </p>
            {MAIN_NAV.map((item) => (
              <SidebarItem
                key={item.href}
                item={item}
                isActive={
                  item.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.href)
                }
              />
            ))}
          </div>

          {/* Secondary */}
          <div className="mt-6 space-y-1">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Keuangan Lanjutan
            </p>
            {SECONDARY_NAV.map((item) => (
              <SidebarItem
                key={item.href}
                item={item}
                isActive={pathname.startsWith(item.href)}
              />
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t">
          {user.name && (
            <p className="px-3 pb-2 text-xs font-medium text-muted-foreground truncate">
              {user.name}
            </p>
          )}
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              pathname.startsWith('/settings')
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>Pengaturan</span>
          </Link>
        </div>
      </aside>
    </TooltipProvider>
  )
}

function SidebarItem({
  item,
  isActive,
}: {
  item: (typeof MAIN_NAV)[number]
  isActive: boolean
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors group',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge && (
        <Badge
          variant={isActive ? 'secondary' : 'outline'}
          className="text-[10px] px-1.5 py-0 h-4"
        >
          {item.badge}
        </Badge>
      )}
    </Link>
  )
}
