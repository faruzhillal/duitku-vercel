'use client'

import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Moon, Sun, LogOut, User as UserIcon, Settings } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { MAIN_NAV, SECONDARY_NAV } from '@/lib/nav-config'
import Link from 'next/link'

interface Props {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function Header({ user }: Props) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  // Ambil judul halaman dari pathname
  const allNav = [...MAIN_NAV, ...SECONDARY_NAV]
  const currentNav = allNav.find((item) =>
    item.href === '/'
      ? pathname === '/'
      : pathname.startsWith(item.href)
  )
  const title = currentNav?.label ?? 'DuitKu'

  return (
    <header className="sticky top-0 z-30 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        {/* Mobile: Logo */}
        <Link href="/" className="flex items-center gap-2 md:hidden">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-sm font-bold">D</span>
          </div>
          <span className="font-semibold">DuitKu</span>
        </Link>

        {/* Desktop: Judul halaman */}
        <h1 className="hidden md:block text-lg font-semibold">{title}</h1>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Dark mode toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle tema</span>
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.image ?? undefined} alt={user.name ?? ''} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(user.name ?? 'U')}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <UserIcon className="w-4 h-4 mr-2" />
                  Profil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="w-4 h-4 mr-2" />
                  Pengaturan
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
