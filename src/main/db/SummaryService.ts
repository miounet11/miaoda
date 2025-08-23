import Database from 'better-sqlite3'
import type { ChatRecord } from './types'

/**
 * Service for handling chat summary operations
 */
export class SummaryService {
  private db: Database.Database

  constructor(db: Database.Database) {
    this.db = db
  }

  /**
   * Update chat summary data
   */
  updateChatSummary(
    chatId: string,
    summary: string,
    tags: string[],
    keyPoints: string[],
    tokens?: number
  ): void {
    const updateSummary = this.db.prepare(`
      UPDATE chats 
      SET 
        summary = ?,
        summary_tags = ?,
        summary_updated_at = ?,
        summary_tokens = ?,
        key_points = ?
      WHERE id = ?
    `)

    updateSummary.run(
      summary,
      JSON.stringify(tags),
      new Date().toISOString(),
      tokens || null,
      JSON.stringify(keyPoints),
      chatId
    )
  }

  /**
   * Get chat summary data
   */
  getChatSummary(chatId: string): {
    summary?: string
    tags: string[]
    keyPoints: string[]
    summaryUpdatedAt?: Date
    summaryTokens?: number
  } | null {
    const getSummary = this.db.prepare(`
      SELECT summary, summary_tags, key_points, summary_updated_at, summary_tokens
      FROM chats 
      WHERE id = ?
    `)

    const result = getSummary.get(chatId) as any

    if (!result) {
      return null
    }

    return {
      summary: result.summary || undefined,
      tags: result.summary_tags ? JSON.parse(result.summary_tags) : [],
      keyPoints: result.key_points ? JSON.parse(result.key_points) : [],
      summaryUpdatedAt: result.summary_updated_at ? new Date(result.summary_updated_at) : undefined,
      summaryTokens: result.summary_tokens || undefined
    }
  }

  /**
   * Get all chats with summaries
   */
  getAllChatsWithSummaries(): (ChatRecord & {
    summaryData?: {
      summary?: string
      tags: string[]
      keyPoints: string[]
      summaryUpdatedAt?: Date
      summaryTokens?: number
    }
  })[] {
    const getAllChats = this.db.prepare(`
      SELECT * FROM chats 
      ORDER BY updated_at DESC
    `)

    const chats = getAllChats.all() as ChatRecord[]

    return chats.map(chat => ({
      ...chat,
      summaryData: this.getChatSummary(chat.id) || undefined
    }))
  }

  /**
   * Search chats by summary tags
   */
  searchChatsByTags(tags: string[]): ChatRecord[] {
    if (tags.length === 0) return []

    const searchByTags = this.db.prepare(`
      SELECT * FROM chats 
      WHERE summary_tags IS NOT NULL
      ORDER BY updated_at DESC
    `)

    const chats = searchByTags.all() as ChatRecord[]

    // Filter chats that have any of the specified tags
    return chats.filter(chat => {
      if (!chat.summary_tags) return false
      try {
        const chatTags = JSON.parse(chat.summary_tags) as string[]
        return chatTags.some(tag => tags.includes(tag))
      } catch {
        return false
      }
    })
  }

  /**
   * Get all unique summary tags
   */
  getAllSummaryTags(): string[] {
    const getAllTags = this.db.prepare(`
      SELECT DISTINCT summary_tags FROM chats 
      WHERE summary_tags IS NOT NULL
    `)

    const results = getAllTags.all() as Array<{ summary_tags: string }>
    const allTags = new Set<string>()

    results.forEach(result => {
      try {
        const tags = JSON.parse(result.summary_tags) as string[]
        tags.forEach(tag => allTags.add(tag))
      } catch {
        // Ignore invalid JSON
      }
    })

    return Array.from(allTags).sort()
  }

  /**
   * Clear chat summary
   */
  clearChatSummary(chatId: string): void {
    const clearSummary = this.db.prepare(`
      UPDATE chats 
      SET 
        summary = NULL,
        summary_tags = NULL,
        summary_updated_at = NULL,
        summary_tokens = NULL,
        key_points = NULL
      WHERE id = ?
    `)

    clearSummary.run(chatId)
  }

  /**
   * Check if chat needs summary update based on message count or time
   */
  needsSummaryUpdate(chatId: string, minMessages = 5, maxAgeHours = 24): boolean {
    const getInfo = this.db.prepare(`
      SELECT 
        c.summary_updated_at,
        COUNT(m.id) as message_count,
        MAX(m.created_at) as last_message_at
      FROM chats c
      LEFT JOIN messages m ON c.id = m.chat_id
      WHERE c.id = ?
      GROUP BY c.id
    `)

    const result = getInfo.get(chatId) as any

    if (!result) return false

    const messageCount = result.message_count || 0
    const lastMessageAt = result.last_message_at ? new Date(result.last_message_at) : null
    const summaryUpdatedAt = result.summary_updated_at ? new Date(result.summary_updated_at) : null

    // Need summary if we have enough messages and no existing summary
    if (messageCount >= minMessages && !summaryUpdatedAt) {
      return true
    }

    // Need update if summary is older than max age and there are new messages
    if (summaryUpdatedAt && lastMessageAt) {
      const ageHours = (Date.now() - summaryUpdatedAt.getTime()) / (1000 * 60 * 60)
      const hasNewMessages = lastMessageAt > summaryUpdatedAt

      return ageHours > maxAgeHours && hasNewMessages
    }

    return false
  }
}
