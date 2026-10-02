/**
 * Simple in-memory rate limiter.
 * Untuk production dengan multi-instance, ganti ke Redis/Upstash.
 */
const requests = new Map<string, { count: number; resetAt: number }>()

const DEFAULT_LIMIT = 20 // request
const DEFAULT_WINDOW_MS = 60 * 1000 // per menit

export function checkRateLimit(
  userId: string,
  limit?: number,
  windowMs?: number
): {
  allowed: boolean
  remaining: number
  resetAt: number
} {
  const isChat = userId.startsWith('chat:')
  const effectiveLimit = limit ?? (isChat ? 30 : DEFAULT_LIMIT)
  const effectiveWindowMs = windowMs ?? (isChat ? 24 * 60 * 60 * 1000 : DEFAULT_WINDOW_MS)

  const now = Date.now()
  const record = requests.get(userId)

  if (!record || record.resetAt < now) {
    requests.set(userId, { count: 1, resetAt: now + effectiveWindowMs })
    return { allowed: true, remaining: effectiveLimit - 1, resetAt: now + effectiveWindowMs }
  }

  if (record.count >= effectiveLimit) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt }
  }

  record.count += 1
  return {
    allowed: true,
    remaining: effectiveLimit - record.count,
    resetAt: record.resetAt,
  }
}
