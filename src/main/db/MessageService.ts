import { BaseDatabaseService } from './BaseDatabaseService'
import type { MessageRecord } from './types'
import { logger } from '../utils/Logger'

/**
 * Service for message-related database operations
 */
export class MessageService extends BaseDatabaseService {
  /**
   * Create a new message record with enhanced error handling and transaction support
   */
  createMessage(message: MessageRecord): void {
    try {
      this.validateId(message.id)
      this.validateId(message.chat_id)
      this.validateText(message.content, 'content')

      if (!['user', 'assistant', 'system'].includes(message.role)) {
        throw new Error('Invalid message role')
      }

      // Use a transaction for atomic insertion
      this.db.transaction(() => {
        // Check for existing message to prevent duplicates
        const existingMessage = this.getMessage(message.id)
        if (existingMessage) {
          throw new Error(`Message with ID ${message.id} already exists`)
        }

        // Check if timestamp column exists (for backward compatibility)
        const columns = this.db.prepare('PRAGMA table_info(messages)').all() as Array<{
          name: string
        }>
        const hasTimestamp = columns.some(col => col.name === 'timestamp')

        const createdAt = message.created_at || Date.now()

        if (hasTimestamp) {
          // Include both timestamp and created_at for backward compatibility
          const stmt = this.db.prepare(
            'INSERT INTO messages (id, chat_id, role, content, created_at, timestamp, attachments, metadata, parent_id, error, error_details) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
          )
          stmt.run(
            message.id,
            message.chat_id,
            message.role,
            message.content,
            createdAt,
            createdAt, // Also set timestamp for backward compatibility
            JSON.stringify(message.attachments) || null,
            JSON.stringify(message.metadata) || null,
            message.parent_id || null,
            message.error || null,
            message.error_details || null
          )
        } else {
          // New schema - only created_at
          const stmt = this.db.prepare(
            'INSERT INTO messages (id, chat_id, role, content, created_at, attachments, metadata, parent_id, error, error_details) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
          )
          stmt.run(
            message.id,
            message.chat_id,
            message.role,
            message.content,
            createdAt,
            JSON.stringify(message.attachments) || null,
            JSON.stringify(message.metadata) || null,
            message.parent_id || null,
            message.error || null,
            message.error_details || null
          )
        }
      })()
    } catch (error) {
      logger.error('Failed to create message', 'MessageService', {
        messageId: message.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Get all messages for a chat with comprehensive error handling
   */
  getMessages(chatId: string): MessageRecord[] {
    try {
      this.validateId(chatId)

      // Check which column exists for ordering
      const columns = this.db.prepare('PRAGMA table_info(messages)').all() as Array<{
        name: string
      }>
      const hasCreatedAt = columns.some(col => col.name === 'created_at')
      const orderColumn = hasCreatedAt ? 'created_at' : 'timestamp'

      const stmt = this.db.prepare(
        `SELECT * FROM messages WHERE chat_id = ? ORDER BY ${orderColumn} ASC`
      )
      const messages = stmt.all(chatId) as any[]

      // Safely parse JSON fields and normalize timestamp/created_at
      return messages.map(msg => ({
        ...msg,
        created_at: msg.created_at || msg.timestamp, // Ensure created_at is always set
        attachments: msg.attachments ? JSON.parse(msg.attachments) : null,
        metadata: msg.metadata ? JSON.parse(msg.metadata) : null
      }))
    } catch (error) {
      logger.error('Failed to retrieve messages', 'MessageService', {
        chatId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return []
    }
  }

  /**
   * Get a specific message by ID with robust error handling
   */
  getMessage(id: string): MessageRecord | undefined {
    try {
      this.validateId(id)

      const stmt = this.db.prepare('SELECT * FROM messages WHERE id = ?')
      const message = stmt.get(id) as MessageRecord | undefined

      if (message) {
        return {
          ...message,
          attachments: message.attachments ? JSON.parse(message.attachments) : null,
          metadata: message.metadata ? JSON.parse(message.metadata) : null
        }
      }

      return undefined
    } catch (error) {
      logger.error('Failed to retrieve message', 'MessageService', {
        messageId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return undefined
    }
  }

  /**
   * Update a message's content with transaction and validation
   */
  updateMessage(id: string, content: string): void {
    try {
      this.validateId(id)
      this.validateText(content, 'content')

      this.db.transaction(() => {
        const stmt = this.db.prepare('UPDATE messages SET content = ? WHERE id = ?')
        stmt.run(content, id)
      })()
    } catch (error) {
      logger.error('Failed to update message', 'MessageService', {
        messageId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Delete a message record with logging
   */
  deleteMessage(id: string): void {
    try {
      this.validateId(id)

      this.db.transaction(() => {
        const stmt = this.db.prepare('DELETE FROM messages WHERE id = ?')
        stmt.run(id)
      })()

      logger.info('Message deleted', 'MessageService', { messageId: id })
    } catch (error) {
      logger.error('Failed to delete message', 'MessageService', {
        messageId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Delete all messages for a chat with transaction
   */
  deleteMessagesForChat(chatId: string): void {
    try {
      this.validateId(chatId)

      this.db.transaction(() => {
        const stmt = this.db.prepare('DELETE FROM messages WHERE chat_id = ?')
        stmt.run(chatId)
      })()

      logger.info('Messages deleted for chat', 'MessageService', { chatId })
    } catch (error) {
      logger.error('Failed to delete messages for chat', 'MessageService', {
        chatId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Add error information to a message with robust error handling
   */
  addMessageError(id: string, error: string, errorDetails?: string): void {
    try {
      this.validateId(id)
      this.validateText(error, 'error')

      this.db.transaction(() => {
        const stmt = this.db.prepare(
          'UPDATE messages SET error = ?, error_details = ? WHERE id = ?'
        )
        stmt.run(error, errorDetails || null, id)
      })()
    } catch (error) {
      logger.error('Failed to add message error', 'MessageService', {
        messageId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Get message count for a chat with error handling
   */
  getMessageCount(chatId: string): number {
    try {
      this.validateId(chatId)

      const stmt = this.db.prepare('SELECT COUNT(*) as count FROM messages WHERE chat_id = ?')
      const result = stmt.get(chatId) as { count: number }
      return result.count
    } catch (error) {
      logger.error('Failed to get message count', 'MessageService', {
        chatId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return 0
    }
  }

  /**
   * Get recent messages across all chats with robust parsing
   */
  getRecentMessages(limit: number = 50): MessageRecord[] {
    try {
      // Check which column exists for ordering
      const columns = this.db.prepare('PRAGMA table_info(messages)').all() as Array<{
        name: string
      }>
      const hasCreatedAt = columns.some(col => col.name === 'created_at')
      const orderColumn = hasCreatedAt ? 'created_at' : 'timestamp'

      const stmt = this.db.prepare(`SELECT * FROM messages ORDER BY ${orderColumn} DESC LIMIT ?`)
      const messages = stmt.all(limit) as any[]

      return messages.map(msg => ({
        ...msg,
        created_at: msg.created_at || msg.timestamp, // Ensure created_at is always set
        attachments: msg.attachments ? JSON.parse(msg.attachments) : null,
        metadata: msg.metadata ? JSON.parse(msg.metadata) : null
      }))
    } catch (error) {
      logger.error('Failed to retrieve recent messages', 'MessageService', {
        limit,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return []
    }
  }
}
