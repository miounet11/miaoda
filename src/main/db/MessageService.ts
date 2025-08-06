import { BaseDatabaseService } from './BaseDatabaseService'
import type { MessageRecord } from './types'

/**
 * Service for message-related database operations
 */
export class MessageService extends BaseDatabaseService {
  /**
   * Create a new message record
   */
  createMessage(message: MessageRecord): void {
    this.validateId(message.id)
    this.validateId(message.chat_id)
    this.validateText(message.content, 'content')

    if (!['user', 'assistant', 'system'].includes(message.role)) {
      throw new Error('Invalid message role')
    }

    const stmt = this.db.prepare(
      'INSERT INTO messages (id, chat_id, role, content, created_at, attachments, metadata, parent_id, error, error_details) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    stmt.run(
      message.id,
      message.chat_id,
      message.role,
      message.content,
      message.created_at,
      message.attachments || null,
      message.metadata || null,
      message.parent_id || null,
      message.error || null,
      message.error_details || null
    )
  }

  /**
   * Get all messages for a chat
   */
  getMessages(chatId: string): MessageRecord[] {
    this.validateId(chatId)

    const stmt = this.db.prepare(
      'SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC'
    )
    return stmt.all(chatId) as MessageRecord[]
  }

  /**
   * Get a specific message by ID
   */
  getMessage(id: string): MessageRecord | undefined {
    this.validateId(id)

    const stmt = this.db.prepare('SELECT * FROM messages WHERE id = ?')
    return stmt.get(id) as MessageRecord | undefined
  }

  /**
   * Update a message's content
   */
  updateMessage(id: string, content: string): void {
    this.validateId(id)
    this.validateText(content, 'content')

    const stmt = this.db.prepare('UPDATE messages SET content = ? WHERE id = ?')
    stmt.run(content, id)
  }

  /**
   * Delete a message record
   */
  deleteMessage(id: string): void {
    this.validateId(id)

    const stmt = this.db.prepare('DELETE FROM messages WHERE id = ?')
    stmt.run(id)
  }

  /**
   * Delete all messages for a chat
   */
  deleteMessagesForChat(chatId: string): void {
    this.validateId(chatId)

    const stmt = this.db.prepare('DELETE FROM messages WHERE chat_id = ?')
    stmt.run(chatId)
  }

  /**
   * Add error information to a message
   */
  addMessageError(id: string, error: string, errorDetails?: string): void {
    this.validateId(id)
    this.validateText(error, 'error')

    const stmt = this.db.prepare(
      'UPDATE messages SET error = ?, error_details = ? WHERE id = ?'
    )
    stmt.run(error, errorDetails || null, id)
  }

  /**
   * Get message count for a chat
   */
  getMessageCount(chatId: string): number {
    this.validateId(chatId)

    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM messages WHERE chat_id = ?')
    const result = stmt.get(chatId) as { count: number }
    return result.count
  }

  /**
   * Get recent messages across all chats
   */
  getRecentMessages(limit: number = 50): MessageRecord[] {
    const stmt = this.db.prepare(
      'SELECT * FROM messages ORDER BY created_at DESC LIMIT ?'
    )
    return stmt.all(limit) as MessageRecord[]
  }
}