import { GoogleGenerativeAI } from '@google/generative-ai'

// Model aktif Google Generative AI:
// gemini-3.6-flash: sangat stabil, cepat & mendukung streaming + JSON
// gemini-3.5-flash-lite: model cadangan ultra-ringan
export const PRIMARY_FLASH_MODEL = 'gemini-3.6-flash'
export const FALLBACK_FLASH_MODEL = 'gemini-3.5-flash-lite'

export function getGenAI(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY belum diset. Silakan masukkan API Key Gemini di .env.local')
  }
  return new GoogleGenerativeAI(apiKey)
}

export function getChatModel(useFallback = false) {
  const genAI = getGenAI()
  return genAI.getGenerativeModel({
    model: useFallback ? FALLBACK_FLASH_MODEL : PRIMARY_FLASH_MODEL,
    generationConfig: {
      temperature: 0.8,
      topP: 0.95,
      maxOutputTokens: 1024,
    },
  })
}

export function getParseModel(useFallback = false) {
  const genAI = getGenAI()
  return genAI.getGenerativeModel({
    model: useFallback ? FALLBACK_FLASH_MODEL : PRIMARY_FLASH_MODEL,
    generationConfig: {
      temperature: 0.1,
      topP: 0.95,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
    },
  })
}

export const geminiFlash = {
  generateContent: (args: Parameters<ReturnType<GoogleGenerativeAI['getGenerativeModel']>['generateContent']>[0]) =>
    getParseModel(false).generateContent(args),
}

export const geminiFlashChat = {
  startChat: (args?: Parameters<ReturnType<GoogleGenerativeAI['getGenerativeModel']>['startChat']>[0]) =>
    getChatModel(false).startChat(args),
}

export const geminiPro = {
  generateContent: (args: Parameters<ReturnType<GoogleGenerativeAI['getGenerativeModel']>['generateContent']>[0]) =>
    getChatModel(true).generateContent(args),
}

export function getGeminiModel() {
  return getChatModel(true)
}

/**
 * Parse JSON response dari Gemini dengan aman.
 * Kadang Gemini masih bungkus dengan ```json ... ```
 */
export function safeParseJSON<T = unknown>(text: string): T | null {
  try {
    return JSON.parse(text)
  } catch {
    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()
    try {
      return JSON.parse(cleaned)
    } catch {
      return null
    }
  }
}
