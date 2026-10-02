import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ChatListPage } from '@/components/chat/chat-list-page'

export default async function ChatPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const sessions = await prisma.chatSession.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { messages: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { content: true, role: true },
      },
    },
  })

  return (
    <ChatListPage
      sessions={sessions.map((s) => ({
        id: s.id,
        title: s.title,
        updatedAt: s.updatedAt,
        messageCount: s._count.messages,
        lastMessage: s.messages[0]?.content ?? null,
        lastRole: s.messages[0]?.role ?? null,
      }))}
      userName={session.user.name ?? 'Kamu'}
    />
  )
}
