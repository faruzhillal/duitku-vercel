import { Suspense } from 'react'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { ChatDetail } from '@/components/chat/chat-detail'
import { Skeleton } from '@/components/ui/skeleton'

export default async function ChatDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}) {
  const resolvedParams = await params
  const { id } = resolvedParams
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const chatSession = await prisma.chatSession.findFirst({
    where: { id, userId: session.user.id },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!chatSession) notFound()

  return (
    <Suspense
      fallback={
        <div className="flex flex-col h-screen max-w-3xl mx-auto p-4 space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-20 w-full" />
        </div>
      }
    >
      <ChatDetail
        sessionId={chatSession.id}
        initialTitle={chatSession.title}
        initialMessages={chatSession.messages.map((m) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          createdAt: m.createdAt,
        }))}
        userName={session.user.name ?? 'Kamu'}
      />
    </Suspense>
  )
}
