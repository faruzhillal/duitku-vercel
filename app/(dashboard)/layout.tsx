import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Header } from '@/components/layout/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar desktop */}
      <Sidebar user={session.user} />

      {/* Main content */}
      <div className="md:pl-64">
        <Header user={session.user} />
        <main className="pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* Bottom nav mobile */}
      <BottomNav />
    </div>
  )
}
