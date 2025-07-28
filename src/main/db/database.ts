import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { mkdirSync, existsSync } from 'fs'

export interface ChatRecord {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface MessageRecord {
  id: string
  chat_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

export class LocalDatabase {
  private db: Database.Database

  constructor() {
    const userDataPath = app.getPath('userData')
    const dbPath = join(userDataPath, 'data')
    
    if (!existsSync(dbPath)) {
      mkdirSync(dbPath, { recursive: true })
    }

    this.db = new Database(join(dbPath, 'chats.db'))
    this.init()
  }

  private init() {
    // Create tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        chat_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
      CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON chats(updated_at);
    `)
  }

  // Chat operations
  createChat(chat: ChatRecord): void {
    const stmt = this.db.prepare(
      'INSERT INTO chats (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)'
    )
    stmt.run(chat.id, chat.title, chat.created_at, chat.updated_at)
  }

  updateChat(id: string, title: string, updated_at: string): void {
    const stmt = this.db.prepare(
      'UPDATE chats SET title = ?, updated_at = ? WHERE id = ?'
    )
    stmt.run(title, updated_at, id)
  }

  deleteChat(id: string): void {
    const stmt = this.db.prepare('DELETE FROM chats WHERE id = ?')
    stmt.run(id)
  }

  getChat(id: string): ChatRecord | undefined {
    const stmt = this.db.prepare('SELECT * FROM chats WHERE id = ?')
    return stmt.get(id) as ChatRecord | undefined
  }

  getAllChats(): ChatRecord[] {
    const stmt = this.db.prepare('SELECT * FROM chats ORDER BY updated_at DESC')
    return stmt.all() as ChatRecord[]
  }

  // Message operations
  createMessage(message: MessageRecord): void {
    const stmt = this.db.prepare(
      'INSERT INTO messages (id, chat_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
    )
    stmt.run(message.id, message.chat_id, message.role, message.content, message.created_at)
  }

  getMessages(chatId: string): MessageRecord[] {
    const stmt = this.db.prepare(
      'SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC'
    )
    return stmt.all(chatId) as MessageRecord[]
  }

  deleteMessage(id: string): void {
    const stmt = this.db.prepare('DELETE FROM messages WHERE id = ?')
    stmt.run(id)
  }

  // Search functionality
  searchChats(query: string): ChatRecord[] {
    const stmt = this.db.prepare(
      'SELECT DISTINCT c.* FROM chats c LEFT JOIN messages m ON c.id = m.chat_id WHERE c.title LIKE ? OR m.content LIKE ? ORDER BY c.updated_at DESC'
    )
    const searchPattern = `%${query}%`
    return stmt.all(searchPattern, searchPattern) as ChatRecord[]
  }

  close(): void {
    this.db.close()
  }
}