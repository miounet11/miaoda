import { Database } from 'better-sqlite3'
import { BaseDatabaseService } from './BaseDatabaseService'
import type { MessageRecord } from './types'

/**
 * Smart Context Management Service
 * Provides intelligent conversation memory and linking capabilities
 */

interface UserPreference {
  key: string
  value: string
  frequency: number
  lastUsed: string
  category: string
}

interface ConversationContext {
  id: string
  chatId: string
  userId: string
  topicKeywords: string[]
  contextSummary: string
  participants: string[]
  createdAt: Date
  updatedAt: Date
  metadata: Record<string, any>
}

interface ConversationLink {
  id: string
  fromChatId: string
  toChatId: string
  linkType: 'semantic' | 'temporal' | 'user_created' | 'topic_continuation'
  strength: number
  reason: string
  createdAt: Date
}

interface RealTimeSummary {
  chatId: string
  currentSummary: string
  keyTopics: string[]
  participantActions: Record<string, string[]>
  lastUpdated: Date
  messagesSummarized: number
}

export class ContextService extends BaseDatabaseService {
  constructor(db: Database) {
    super(db)
    this.initializeTables()
  }

  private initializeTables(): void {
    try {
      // User preferences table for remembering user settings and patterns
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS user_preferences (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL DEFAULT 'default',
          key TEXT NOT NULL,
          value TEXT NOT NULL,
          frequency INTEGER DEFAULT 1,
          last_used TEXT NOT NULL,
          category TEXT NOT NULL,
          metadata TEXT DEFAULT '{}',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          UNIQUE(user_id, key, category)
        );

        CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_preferences_category ON user_preferences(category);
        CREATE INDEX IF NOT EXISTS idx_user_preferences_frequency ON user_preferences(frequency);
      `)

      // Conversation context table for storing conversation summaries and topics
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS conversation_contexts (
          id TEXT PRIMARY KEY,
          chat_id TEXT NOT NULL,
          user_id TEXT NOT NULL DEFAULT 'default',
          topic_keywords TEXT NOT NULL DEFAULT '[]',
          context_summary TEXT NOT NULL,
          participants TEXT NOT NULL DEFAULT '[]',
          sentiment REAL DEFAULT 0,
          complexity_level INTEGER DEFAULT 1,
          message_count INTEGER DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          metadata TEXT DEFAULT '{}',
          FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_conversation_contexts_chat_id ON conversation_contexts(chat_id);
        CREATE INDEX IF NOT EXISTS idx_conversation_contexts_user_id ON conversation_contexts(user_id);
        CREATE INDEX IF NOT EXISTS idx_conversation_contexts_updated ON conversation_contexts(updated_at);
      `)

      // Conversation links table for semantic linking between chats
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS conversation_links (
          id TEXT PRIMARY KEY,
          from_chat_id TEXT NOT NULL,
          to_chat_id TEXT NOT NULL,
          link_type TEXT NOT NULL,
          strength REAL NOT NULL DEFAULT 0.5,
          reason TEXT NOT NULL,
          shared_keywords TEXT DEFAULT '[]',
          created_at TEXT NOT NULL,
          metadata TEXT DEFAULT '{}',
          FOREIGN KEY (from_chat_id) REFERENCES chats(id) ON DELETE CASCADE,
          FOREIGN KEY (to_chat_id) REFERENCES chats(id) ON DELETE CASCADE,
          UNIQUE(from_chat_id, to_chat_id, link_type)
        );

        CREATE INDEX IF NOT EXISTS idx_conversation_links_from_chat ON conversation_links(from_chat_id);
        CREATE INDEX IF NOT EXISTS idx_conversation_links_to_chat ON conversation_links(to_chat_id);
        CREATE INDEX IF NOT EXISTS idx_conversation_links_strength ON conversation_links(strength);
      `)

      // Real-time summaries table for live conversation summarization
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS realtime_summaries (
          chat_id TEXT PRIMARY KEY,
          current_summary TEXT NOT NULL,
          key_topics TEXT NOT NULL DEFAULT '[]',
          participant_actions TEXT NOT NULL DEFAULT '{}',
          last_updated TEXT NOT NULL,
          messages_summarized INTEGER DEFAULT 0,
          summary_version INTEGER DEFAULT 1,
          FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
        );
      `)

      // Topic evolution tracking
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS topic_evolution (
          id TEXT PRIMARY KEY,
          chat_id TEXT NOT NULL,
          topic_name TEXT NOT NULL,
          evolution_stage TEXT NOT NULL,
          keywords TEXT NOT NULL DEFAULT '[]',
          message_range_start TEXT NOT NULL,
          message_range_end TEXT,
          confidence REAL NOT NULL DEFAULT 0.5,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_topic_evolution_chat_id ON topic_evolution(chat_id);
        CREATE INDEX IF NOT EXISTS idx_topic_evolution_topic ON topic_evolution(topic_name);
      `)

    } catch (error) {
      throw new Error(`Failed to initialize context service tables: ${error}`)
    }
  }

  /**
   * Remember user preferences based on conversation patterns
   */
  async rememberUserPreference(
    userId: string,
    key: string,
    value: string,
    category: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const now = new Date().toISOString()
    
    try {
      const existing = this.db.prepare(`
        SELECT frequency FROM user_preferences 
        WHERE user_id = ? AND key = ? AND category = ?
      `).get(userId, key, category) as { frequency: number } | undefined

      if (existing) {
        // Update existing preference
        this.db.prepare(`
          UPDATE user_preferences 
          SET value = ?, frequency = frequency + 1, last_used = ?, updated_at = ?, metadata = ?
          WHERE user_id = ? AND key = ? AND category = ?
        `).run(value, now, now, JSON.stringify(metadata), userId, key, category)
      } else {
        // Create new preference
        this.db.prepare(`
          INSERT INTO user_preferences 
          (id, user_id, key, value, frequency, last_used, category, metadata, created_at, updated_at)
          VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?)
        `).run(
          `pref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          key,
          value,
          now,
          category,
          JSON.stringify(metadata),
          now,
          now
        )
      }
    } catch (error) {
      console.error('Failed to remember user preference:', error)
    }
  }

  /**
   * Get user preferences for context-aware assistance
   */
  getUserPreferences(userId: string, category?: string): UserPreference[] {
    try {
      let query = 'SELECT * FROM user_preferences WHERE user_id = ?'
      const params: any[] = [userId]

      if (category) {
        query += ' AND category = ?'
        params.push(category)
      }

      query += ' ORDER BY frequency DESC, last_used DESC LIMIT 50'

      const rows = this.db.prepare(query).all(...params) as any[]

      return rows.map(row => ({
        key: row.key,
        value: row.value,
        frequency: row.frequency,
        lastUsed: row.last_used,
        category: row.category
      }))
    } catch (error) {
      console.error('Failed to get user preferences:', error)
      return []
    }
  }

  /**
   * Update or create conversation context
   */
  async updateConversationContext(
    chatId: string,
    userId: string,
    summary: string,
    topicKeywords: string[],
    messageCount: number,
    participants: string[] = ['user', 'assistant'],
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const now = new Date().toISOString()
    const contextId = `ctx_${chatId}_${Date.now()}`

    try {
      const existing = this.db.prepare(`
        SELECT id FROM conversation_contexts WHERE chat_id = ?
      `).get(chatId) as { id: string } | undefined

      if (existing) {
        // Update existing context
        this.db.prepare(`
          UPDATE conversation_contexts 
          SET context_summary = ?, topic_keywords = ?, message_count = ?, 
              participants = ?, updated_at = ?, metadata = ?
          WHERE chat_id = ?
        `).run(
          summary,
          JSON.stringify(topicKeywords),
          messageCount,
          JSON.stringify(participants),
          now,
          JSON.stringify(metadata),
          chatId
        )
      } else {
        // Create new context
        this.db.prepare(`
          INSERT INTO conversation_contexts 
          (id, chat_id, user_id, topic_keywords, context_summary, participants, 
           message_count, created_at, updated_at, metadata)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          contextId,
          chatId,
          userId,
          JSON.stringify(topicKeywords),
          summary,
          JSON.stringify(participants),
          messageCount,
          now,
          now,
          JSON.stringify(metadata)
        )
      }
    } catch (error) {
      console.error('Failed to update conversation context:', error)
    }
  }

  /**
   * Create semantic links between conversations
   */
  async createConversationLink(
    fromChatId: string,
    toChatId: string,
    linkType: 'semantic' | 'temporal' | 'user_created' | 'topic_continuation',
    strength: number,
    reason: string,
    sharedKeywords: string[] = []
  ): Promise<void> {
    if (fromChatId === toChatId) return // Don't link to self

    const now = new Date().toISOString()
    const linkId = `link_${fromChatId}_${toChatId}_${Date.now()}`

    try {
      this.db.prepare(`
        INSERT OR REPLACE INTO conversation_links 
        (id, from_chat_id, to_chat_id, link_type, strength, reason, shared_keywords, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        linkId,
        fromChatId,
        toChatId,
        linkType,
        strength,
        reason,
        JSON.stringify(sharedKeywords),
        now
      )
    } catch (error) {
      console.error('Failed to create conversation link:', error)
    }
  }

  /**
   * Find related conversations based on semantic similarity
   */
  getRelatedConversations(chatId: string, limit: number = 5): any[] {
    try {
      const query = `
        SELECT 
          cl.to_chat_id as related_chat_id,
          c.title as related_title,
          cl.strength,
          cl.reason,
          cl.link_type,
          cl.shared_keywords,
          cc.context_summary,
          cc.topic_keywords
        FROM conversation_links cl
        JOIN chats c ON cl.to_chat_id = c.id
        LEFT JOIN conversation_contexts cc ON cl.to_chat_id = cc.chat_id
        WHERE cl.from_chat_id = ?
        UNION
        SELECT 
          cl.from_chat_id as related_chat_id,
          c.title as related_title,
          cl.strength,
          cl.reason,
          cl.link_type,
          cl.shared_keywords,
          cc.context_summary,
          cc.topic_keywords
        FROM conversation_links cl
        JOIN chats c ON cl.from_chat_id = c.id
        LEFT JOIN conversation_contexts cc ON cl.from_chat_id = cc.chat_id
        WHERE cl.to_chat_id = ?
        ORDER BY strength DESC
        LIMIT ?
      `

      const results = this.db.prepare(query).all(chatId, chatId, limit) as any[]

      return results.map(row => ({
        chatId: row.related_chat_id,
        title: row.related_title,
        strength: row.strength,
        reason: row.reason,
        linkType: row.link_type,
        sharedKeywords: JSON.parse(row.shared_keywords || '[]'),
        contextSummary: row.context_summary,
        topicKeywords: JSON.parse(row.topic_keywords || '[]')
      }))
    } catch (error) {
      console.error('Failed to get related conversations:', error)
      return []
    }
  }

  /**
   * Update real-time conversation summary
   */
  async updateRealTimeSummary(
    chatId: string,
    messages: MessageRecord[]
  ): Promise<void> {
    try {
      // Generate summary from recent messages
      const recentMessages = messages.slice(-10) // Last 10 messages
      const summary = this.generateQuickSummary(recentMessages)
      const keyTopics = this.extractKeyTopics(recentMessages)
      
      const now = new Date().toISOString()

      this.db.prepare(`
        INSERT OR REPLACE INTO realtime_summaries 
        (chat_id, current_summary, key_topics, participant_actions, last_updated, messages_summarized)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        chatId,
        summary,
        JSON.stringify(keyTopics),
        JSON.stringify(this.analyzeParticipantActions(recentMessages)),
        now,
        messages.length
      )

      // Update conversation context as well
      await this.updateConversationContext(
        chatId,
        'default',
        summary,
        keyTopics,
        messages.length
      )

    } catch (error) {
      console.error('Failed to update real-time summary:', error)
    }
  }

  /**
   * Get real-time summary for a conversation
   */
  getRealTimeSummary(chatId: string): RealTimeSummary | null {
    try {
      const row = this.db.prepare(`
        SELECT * FROM realtime_summaries WHERE chat_id = ?
      `).get(chatId) as any

      if (!row) return null

      return {
        chatId: row.chat_id,
        currentSummary: row.current_summary,
        keyTopics: JSON.parse(row.key_topics || '[]'),
        participantActions: JSON.parse(row.participant_actions || '{}'),
        lastUpdated: new Date(row.last_updated),
        messagesSummarized: row.messages_summarized
      }
    } catch (error) {
      console.error('Failed to get real-time summary:', error)
      return null
    }
  }

  /**
   * Auto-discover semantic links between conversations
   */
  async discoverSemanticLinks(chatId: string): Promise<void> {
    try {
      const currentContext = this.db.prepare(`
        SELECT topic_keywords, context_summary FROM conversation_contexts WHERE chat_id = ?
      `).get(chatId) as { topic_keywords: string, context_summary: string } | undefined

      if (!currentContext) return

      const currentKeywords = JSON.parse(currentContext.topic_keywords || '[]')
      if (currentKeywords.length === 0) return

      // Find other conversations with similar keywords
      const similarContexts = this.db.prepare(`
        SELECT chat_id, topic_keywords, context_summary 
        FROM conversation_contexts 
        WHERE chat_id != ? 
        ORDER BY updated_at DESC 
        LIMIT 20
      `).all(chatId) as any[]

      for (const context of similarContexts) {
        const otherKeywords = JSON.parse(context.topic_keywords || '[]')
        const sharedKeywords = currentKeywords.filter((kw: string) => 
          otherKeywords.includes(kw)
        )

        if (sharedKeywords.length >= 2) {
          const strength = sharedKeywords.length / Math.max(currentKeywords.length, otherKeywords.length)
          
          if (strength > 0.3) { // Only create links with reasonable strength
            await this.createConversationLink(
              chatId,
              context.chat_id,
              'semantic',
              strength,
              `Shared topics: ${sharedKeywords.join(', ')}`,
              sharedKeywords
            )
          }
        }
      }
    } catch (error) {
      console.error('Failed to discover semantic links:', error)
    }
  }

  /**
   * Get conversation context with related information
   */
  getEnhancedContext(chatId: string): any {
    try {
      const context = this.db.prepare(`
        SELECT * FROM conversation_contexts WHERE chat_id = ?
      `).get(chatId) as any

      const realTimeSummary = this.getRealTimeSummary(chatId)
      const relatedConversations = this.getRelatedConversations(chatId, 5)
      const userPreferences = this.getUserPreferences('default')

      return {
        context: context ? {
          summary: context.context_summary,
          topicKeywords: JSON.parse(context.topic_keywords || '[]'),
          participants: JSON.parse(context.participants || '[]'),
          messageCount: context.message_count,
          updatedAt: new Date(context.updated_at)
        } : null,
        realTimeSummary,
        relatedConversations,
        userPreferences: userPreferences.slice(0, 10), // Top 10 preferences
        hasContext: !!context || !!realTimeSummary
      }
    } catch (error) {
      console.error('Failed to get enhanced context:', error)
      return {
        context: null,
        realTimeSummary: null,
        relatedConversations: [],
        userPreferences: [],
        hasContext: false
      }
    }
  }

  // Private helper methods

  private generateQuickSummary(messages: MessageRecord[]): string {
    if (messages.length === 0) return 'No messages yet'

    const userMessages = messages.filter(m => m.role === 'user')
    const assistantMessages = messages.filter(m => m.role === 'assistant')

    let summary = `Conversation with ${userMessages.length} user messages and ${assistantMessages.length} assistant responses. `
    
    if (userMessages.length > 0) {
      const lastUserMessage = userMessages[userMessages.length - 1]
      const preview = lastUserMessage.content.substring(0, 100)
      summary += `Latest user input: "${preview}${lastUserMessage.content.length > 100 ? '...' : ''}"`
    }

    return summary
  }

  private extractKeyTopics(messages: MessageRecord[]): string[] {
    const allText = messages.map(m => m.content).join(' ').toLowerCase()
    const words = allText.split(/\s+/).filter(word => word.length > 3)
    
    // Simple keyword extraction (in production, would use NLP)
    const wordFreq: Record<string, number> = {}
    words.forEach(word => {
      const cleaned = word.replace(/[^\w]/g, '')
      if (cleaned.length > 3) {
        wordFreq[cleaned] = (wordFreq[cleaned] || 0) + 1
      }
    })

    return Object.entries(wordFreq)
      .filter(([_, count]) => count >= 2)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 10)
      .map(([word, _]) => word)
  }

  private analyzeParticipantActions(messages: MessageRecord[]): Record<string, string[]> {
    const actions: Record<string, string[]> = {}
    
    messages.forEach(msg => {
      if (!actions[msg.role]) {
        actions[msg.role] = []
      }
      
      // Simple action extraction based on content patterns
      const content = msg.content.toLowerCase()
      if (content.includes('question') || content.includes('?')) {
        actions[msg.role].push('asked_question')
      }
      if (content.includes('explain') || content.includes('help')) {
        actions[msg.role].push('requested_explanation')
      }
      if (content.includes('code') || content.includes('function')) {
        actions[msg.role].push('discussed_code')
      }
    })

    return actions
  }

  /**
   * Cleanup old context data based on retention policies
   */
  async cleanupOldContext(retentionDays: number = 90): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)
    const cutoffIso = cutoffDate.toISOString()

    try {
      // Clean up old conversation links
      this.db.prepare(`
        DELETE FROM conversation_links WHERE created_at < ?
      `).run(cutoffIso)

      // Clean up old user preferences (keep frequently used ones)
      this.db.prepare(`
        DELETE FROM user_preferences 
        WHERE updated_at < ? AND frequency < 5
      `).run(cutoffIso)

      // Update old topic evolution entries
      this.db.prepare(`
        DELETE FROM topic_evolution WHERE updated_at < ?
      `).run(cutoffIso)

    } catch (error) {
      console.error('Failed to cleanup old context:', error)
    }
  }
}