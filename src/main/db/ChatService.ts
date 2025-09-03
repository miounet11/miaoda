import { BaseDatabaseService } from './BaseDatabaseService'
import type { ChatRecord } from './types'

/**
 * Service for chat-related database operations
 */
export class ChatService extends BaseDatabaseService {
  /**
   * Create a new chat record
   */
  createChat(chat: ChatRecord): void {
    this.validateId(chat.id)
    this.validateText(chat.title, 'title')

    const stmt = this.db.prepare(
      'INSERT INTO chats (id, title, created_at, updated_at, tags, archived, starred, settings) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    )
    stmt.run(
      chat.id,
      chat.title,
      chat.created_at,
      chat.updated_at,
      chat.tags || null,
      chat.archived || 0,
      chat.starred || 0,
      chat.settings || null,
    )
  }

  /**
   * Update a chat's title and timestamp
   */
  updateChat(id: string, title: string, updated_at: string): void {
    this.validateId(id)
    this.validateText(title, 'title')

    const stmt = this.db.prepare('UPDATE chats SET title = ?, updated_at = ? WHERE id = ?')
    stmt.run(title, updated_at, id)
  }

  /**
   * Delete a chat record and all associated messages
   */
  deleteChat(id: string): void {
    this.validateId(id)

    // Use a transaction to ensure data consistency
    const transaction = this.db.transaction(() => {
      // Delete all messages associated with this chat
      const deleteMessagesStmt = this.db.prepare('DELETE FROM messages WHERE chat_id = ?')
      deleteMessagesStmt.run(id)

      // Delete the chat record
      const deleteChatStmt = this.db.prepare('DELETE FROM chats WHERE id = ?')
      deleteChatStmt.run(id)
    })

    transaction()
  }

  /**
   * Get a specific chat by ID
   */
  getChat(id: string): ChatRecord | undefined {
    this.validateId(id)

    const stmt = this.db.prepare('SELECT * FROM chats WHERE id = ?')
    return stmt.get(id) as ChatRecord | undefined
  }

  /**
   * Get all chats ordered by update time
   */
  getAllChats(): ChatRecord[] {
    const stmt = this.db.prepare('SELECT * FROM chats ORDER BY updated_at DESC')
    return stmt.all() as ChatRecord[]
  }

  /**
   * Archive or unarchive a chat
   */
  archiveChat(id: string, archived: boolean): void {
    this.validateId(id)

    const stmt = this.db.prepare('UPDATE chats SET archived = ? WHERE id = ?')
    stmt.run(archived ? 1 : 0, id)
  }

  /**
   * Star or unstar a chat
   */
  starChat(id: string, starred: boolean): void {
    this.validateId(id)

    const stmt = this.db.prepare('UPDATE chats SET starred = ? WHERE id = ?')
    stmt.run(starred ? 1 : 0, id)
  }

  /**
   * Update chat tags
   */
  updateChatTags(id: string, tags: string): void {
    this.validateId(id)

    const stmt = this.db.prepare('UPDATE chats SET tags = ? WHERE id = ?')
    stmt.run(tags)
  }

  /**
   * Update chat settings
   */
  updateChatSettings(id: string, settings: string): void {
    this.validateId(id)

    const stmt = this.db.prepare('UPDATE chats SET settings = ? WHERE id = ?')
    stmt.run(settings)
  }
}
