'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types'

async function getCurrentUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user.id
}

export async function createChatSession(
  title = 'Chat Baru'
): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await getCurrentUserId()

    const session = await prisma.chatSession.create({
      data: { userId, title },
    })

    revalidatePath('/chat')
    return { success: true, data: { id: session.id } }
  } catch (error) {
    console.error('createChatSession error:', error)
    return { success: false, error: 'Gagal membuat chat baru' }
  }
}

export async function deleteChatSession(
  id: string
): Promise<ActionResult> {
  try {
    const userId = await getCurrentUserId()

    const existing = await prisma.chatSession.findFirst({
      where: { id, userId },
    })
    if (!existing) return { success: false, error: 'Chat tidak ditemukan' }

    await prisma.chatSession.delete({ where: { id } })

    revalidatePath('/chat')
    return { success: true }
  } catch (error) {
    console.error('deleteChatSession error:', error)
    return { success: false, error: 'Gagal hapus chat' }
  }
}

export async function renameChatSession(
  id: string,
  title: string
): Promise<ActionResult> {
  try {
    const userId = await getCurrentUserId()
    const cleanTitle = title.trim().slice(0, 100)
    if (!cleanTitle) return { success: false, error: 'Judul tidak boleh kosong' }

    const existing = await prisma.chatSession.findFirst({
      where: { id, userId },
    })
    if (!existing) return { success: false, error: 'Chat tidak ditemukan' }

    await prisma.chatSession.update({
      where: { id },
      data: { title: cleanTitle },
    })

    revalidatePath('/chat')
    revalidatePath(`/chat/${id}`)
    return { success: true }
  } catch (error) {
    console.error('renameChatSession error:', error)
    return { success: false, error: 'Gagal rename chat' }
  }
}

export async function clearAllChats(): Promise<ActionResult> {
  try {
    const userId = await getCurrentUserId()
    await prisma.chatSession.deleteMany({ where: { userId } })
    revalidatePath('/chat')
    return { success: true }
  } catch (error) {
    console.error('clearAllChats error:', error)
    return { success: false, error: 'Gagal hapus semua chat' }
  }
}
