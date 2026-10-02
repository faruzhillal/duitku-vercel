import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { SECONDARY_NAV } from '@/lib/nav-config'

export default function MorePage() {
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Menu Lainnya</h1>
        <p className="text-sm text-muted-foreground">
          Fitur keuangan lanjutan
        </p>
      </div>

      <Card>
        <CardContent className="p-2">
          {SECONDARY_NAV.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{item.label}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {item.description}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </Link>
            )
          })}

          {/* Settings */}
          <Link
            href="/settings"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-lg">⚙️</span>
            </div>
            <div className="flex-1">
              <p className="font-medium">Pengaturan</p>
              <p className="text-xs text-muted-foreground">
                Profil, preferensi, data
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
