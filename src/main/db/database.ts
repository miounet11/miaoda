import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { mkdirSync, existsSync } from 'fs'
import type { 
  SearchQuery, 
  SearchResult, 
  SearchMatch,
  DBSearchResult,
  SearchFilters,
  SearchOptions
} from './searchTypes'

export interface ChatRecord {
  id: string
  title: string
  created_at: string
  updated_at: string
  tags?: string
  archived?: number
  starred?: number
  settings?: string
}

export interface MessageRecord {
  id: string
  chat_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
  attachments?: string
  metadata?: string
  parent_id?: string
  error?: string
  error_details?: string
}

export interface SearchIndex {
  message_id: string
  chat_id: string
  content_normalized: string
  tokens: string
  created_at: string
}


export class LocalDatabase {
  private db: Database.Database

  constructor() {
    console.log('[Database] Constructor called')
    const userDataPath = app.getPath('userData')
    console.log('[Database] User data path:', userDataPath)
    const dbPath = join(userDataPath, 'data')
    
    if (!existsSync(dbPath)) {
      console.log('[Database] Creating database directory:', dbPath)
      mkdirSync(dbPath, { recursive: true })
    }

    try {
      const dbFile = join(dbPath, 'chats.db')
      console.log('[Database] Opening database file:', dbFile)
      this.db = new Database(dbFile)
      console.log('[Database] Database opened successfully')
      this.init()
      console.log('[Database] Database initialized successfully')
    } catch (error) {
      console.error('[Database] Failed to initialize database:', error)
      throw error
    }
  }

  private init() {
    // Enable foreign keys
    this.db.pragma('foreign_keys = ON')
    
    // Create tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        tags TEXT DEFAULT NULL,
        archived INTEGER DEFAULT 0,
        starred INTEGER DEFAULT 0,
        settings TEXT DEFAULT NULL
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        chat_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        attachments TEXT DEFAULT NULL,
        metadata TEXT DEFAULT NULL,
        parent_id TEXT DEFAULT NULL,
        error TEXT DEFAULT NULL,
        error_details TEXT DEFAULT NULL,
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS search_index (
        message_id TEXT PRIMARY KEY,
        chat_id TEXT NOT NULL,
        content_normalized TEXT NOT NULL,
        tokens TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS search_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query TEXT NOT NULL,
        result_count INTEGER NOT NULL,
        search_time_ms INTEGER NOT NULL,
        created_at TEXT NOT NULL
      );
    `)
    
    // Run migrations
    this.runMigrations()
    
    // Create indexes after migrations
    this.db.exec(`
      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
      CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON chats(updated_at);
      CREATE INDEX IF NOT EXISTS idx_chats_archived ON chats(archived);
      CREATE INDEX IF NOT EXISTS idx_chats_starred ON chats(starred);
      
      -- Full-text search virtual table
      CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
        content,
        content_normalized,
        tokenize = 'porter unicode61'
      );

      -- Triggers to keep FTS in sync
      CREATE TRIGGER IF NOT EXISTS messages_ai AFTER INSERT ON messages BEGIN
        INSERT INTO messages_fts(rowid, content, content_normalized) 
        VALUES (new.rowid, new.content, LOWER(new.content));
      END;

      CREATE TRIGGER IF NOT EXISTS messages_ad AFTER DELETE ON messages BEGIN
        DELETE FROM messages_fts WHERE rowid = old.rowid;
      END;

      CREATE TRIGGER IF NOT EXISTS messages_au AFTER UPDATE ON messages BEGIN
        UPDATE messages_fts 
        SET content = new.content, 
            content_normalized = LOWER(new.content) 
        WHERE rowid = new.rowid;
      END;
    `)
  }

  private runMigrations() {
    try {
      // Check if chats table exists
      const tables = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='chats'").all()
      if (tables.length === 0) {
        console.log('Chats table does not exist yet, skipping migrations')
        return
      }

      // Check if archived column exists in chats table
      const columns = this.db.prepare("PRAGMA table_info(chats)").all() as Array<{name: string}>
      const hasArchived = columns.some(col => col.name === 'archived')
      const hasStarred = columns.some(col => col.name === 'starred')
      const hasTags = columns.some(col => col.name === 'tags')
      const hasSettings = columns.some(col => col.name === 'settings')
    
    // Add missing columns
    if (!hasArchived) {
      this.db.exec('ALTER TABLE chats ADD COLUMN archived INTEGER DEFAULT 0')
    }
    if (!hasStarred) {
      this.db.exec('ALTER TABLE chats ADD COLUMN starred INTEGER DEFAULT 0')
    }
    if (!hasTags) {
      this.db.exec('ALTER TABLE chats ADD COLUMN tags TEXT DEFAULT NULL')
    }
    if (!hasSettings) {
      this.db.exec('ALTER TABLE chats ADD COLUMN settings TEXT DEFAULT NULL')
    }

    // Check if messages table exists
    const messagesTables = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='messages'").all()
    if (messagesTables.length === 0) {
      console.log('Messages table does not exist yet, skipping messages migrations')
      return
    }

    // Check if messages table needs updates
    const messageColumns = this.db.prepare("PRAGMA table_info(messages)").all() as Array<{name: string}>
    const hasAttachments = messageColumns.some(col => col.name === 'attachments')
    const hasMetadata = messageColumns.some(col => col.name === 'metadata')
    const hasParentId = messageColumns.some(col => col.name === 'parent_id')
    const hasError = messageColumns.some(col => col.name === 'error')
    const hasErrorDetails = messageColumns.some(col => col.name === 'error_details')
    
    if (!hasAttachments) {
      this.db.exec('ALTER TABLE messages ADD COLUMN attachments TEXT DEFAULT NULL')
    }
    if (!hasMetadata) {
      this.db.exec('ALTER TABLE messages ADD COLUMN metadata TEXT DEFAULT NULL')
    }
    if (!hasParentId) {
      this.db.exec('ALTER TABLE messages ADD COLUMN parent_id TEXT DEFAULT NULL')
    }
    if (!hasError) {
      this.db.exec('ALTER TABLE messages ADD COLUMN error TEXT DEFAULT NULL')
    }
    if (!hasErrorDetails) {
      this.db.exec('ALTER TABLE messages ADD COLUMN error_details TEXT DEFAULT NULL')
    }
    } catch (error) {
      console.error('Failed to run migrations:', error)
      throw error
    }
  }

  // Chat operations
  createChat(chat: ChatRecord): void {
    const stmt = this.db.prepare(
      'INSERT INTO chats (id, title, created_at, updated_at, tags, archived, starred, settings) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    stmt.run(
      chat.id, 
      chat.title, 
      chat.created_at, 
      chat.updated_at,
      chat.tags || null,
      chat.archived || 0,
      chat.starred || 0,
      chat.settings || null
    )
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

  // Advanced search functionality
  searchMessages(query: SearchQuery): SearchResult[] {
    const startTime = Date.now()
    const results: SearchResult[] = []
    
    try {
      // Build the search query
      let sql = this.buildSearchQuery(query)
      const params = this.buildSearchParams(query)
      
      // Execute search
      const stmt = this.db.prepare(sql)
      const rows = stmt.all(...params) as DBSearchResult[]
      
      // Process results
      for (const row of rows) {
        const matches = this.extractMatches(row.content, query.text, query.options)
        
        results.push({
          message: {
            id: row.id,
            chatId: row.chat_id,
            role: row.role as 'user' | 'assistant' | 'system',
            content: row.content,
            timestamp: new Date(row.created_at),
            metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
            tags: row.chat_tags ? row.chat_tags.split(',') : [],
            attachments: row.attachments ? JSON.parse(row.attachments) : [],
            error: row.error || undefined
          },
          score: row.rank || this.calculateScore(row, query),
          matches
        })
      }
      
      // Log search stats
      this.logSearchStats(query, results.length, Date.now() - startTime)
      
      return results
    } catch (error) {
      console.error('Search error:', error)
      throw error
    }
  }

  private buildSearchQuery(query: SearchQuery): string {
    let sql = `
      SELECT 
        m.id,
        m.chat_id,
        m.role,
        m.content,
        m.created_at,
        m.attachments,
        m.metadata,
        m.error,
        m.error_details,
        c.title as chat_title,
        c.tags as chat_tags,
        c.archived as chat_archived,
        c.starred as chat_starred
    `
    
    // Use FTS5 for text search if query text is provided
    if (query.text && query.text.trim()) {
      sql += `,
        bm25(messages_fts) as rank
      FROM messages m
      JOIN chats c ON m.chat_id = c.id
      JOIN messages_fts ON messages_fts.rowid = m.rowid
      WHERE messages_fts MATCH ?
      `
    } else {
      sql += `
      FROM messages m
      JOIN chats c ON m.chat_id = c.id
      WHERE 1=1
      `
    }
    
    // Add filter conditions
    const filterConditions = this.buildFilterConditions(query.filters)
    if (filterConditions) {
      sql += ` AND ${filterConditions}`
    }
    
    // Add sorting
    sql += this.buildSortClause(query.options)
    
    // Add limit
    if (query.options.maxResults) {
      sql += ` LIMIT ${query.options.maxResults}`
    }
    
    return sql
  }

  private buildSearchParams(query: SearchQuery): any[] {
    const params: any[] = []
    
    // Add search text parameter for FTS5
    if (query.text && query.text.trim()) {
      // Prepare search text for FTS5
      let searchText = query.text.trim()
      
      if (query.options.wholeWords) {
        // Add word boundaries for whole word search
        searchText = searchText.split(/\s+/).map(word => `"${word}"`).join(' ')
      }
      
      params.push(searchText)
    }
    
    // Add filter parameters
    if (query.filters.dateRange) {
      params.push(query.filters.dateRange.start)
      params.push(query.filters.dateRange.end)
    }
    
    return params
  }

  private buildFilterConditions(filters: SearchFilters): string {
    const conditions: string[] = []
    
    // Role filter
    if (filters.roles && filters.roles.length > 0) {
      const roleList = filters.roles.map(r => `'${r}'`).join(',')
      conditions.push(`m.role IN (${roleList})`)
    }
    
    // Date range filter
    if (filters.dateRange) {
      conditions.push(`m.created_at BETWEEN ? AND ?`)
    }
    
    // Chat IDs filter
    if (filters.chatIds && filters.chatIds.length > 0) {
      const chatIdList = filters.chatIds.map(id => `'${id}'`).join(',')
      conditions.push(`m.chat_id IN (${chatIdList})`)
    }
    
    // Attachments filter
    if (filters.hasAttachments !== undefined) {
      if (filters.hasAttachments) {
        conditions.push(`m.attachments IS NOT NULL`)
      } else {
        conditions.push(`m.attachments IS NULL`)
      }
    }
    
    // Length filters
    if (filters.minLength !== undefined) {
      conditions.push(`LENGTH(m.content) >= ${filters.minLength}`)
    }
    
    if (filters.maxLength !== undefined) {
      conditions.push(`LENGTH(m.content) <= ${filters.maxLength}`)
    }
    
    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      const tagConditions = filters.tags.map(tag => `c.tags LIKE '%${tag}%'`)
      conditions.push(`(${tagConditions.join(' OR ')})`)
    }
    
    // Archived filter
    if (filters.archived !== undefined) {
      conditions.push(`c.archived = ${filters.archived ? 1 : 0}`)
    }
    
    // Starred filter
    if (filters.starred !== undefined) {
      conditions.push(`c.starred = ${filters.starred ? 1 : 0}`)
    }
    
    return conditions.length > 0 ? conditions.join(' AND ') : ''
  }

  private buildSortClause(options: SearchOptions): string {
    const sortBy = options.sortBy || 'relevance'
    const sortOrder = options.sortOrder || 'desc'
    
    let orderClause = ' ORDER BY '
    
    switch (sortBy) {
      case 'relevance':
        if (options.highlightMatches) {
          orderClause += 'rank'
        } else {
          orderClause += 'm.created_at'
        }
        break
      case 'date':
        orderClause += 'm.created_at'
        break
      case 'length':
        orderClause += 'LENGTH(m.content)'
        break
      default:
        orderClause += 'm.created_at'
    }
    
    orderClause += ` ${sortOrder.toUpperCase()}`
    
    return orderClause
  }

  private extractMatches(content: string, searchText: string, _options: SearchOptions): SearchMatch[] {
    const matches: SearchMatch[] = []
    
    if (!searchText || !searchText.trim()) {
      return matches
    }
    
    const searchTerms = searchText.toLowerCase().split(/\s+/)
    const contentLower = content.toLowerCase()
    
    for (const term of searchTerms) {
      let index = 0
      while ((index = contentLower.indexOf(term, index)) !== -1) {
        const start = Math.max(0, index - 30)
        const end = Math.min(content.length, index + term.length + 30)
        
        matches.push({
          field: 'content',
          text: content.substring(index, index + term.length),
          startIndex: index,
          endIndex: index + term.length,
          highlighted: this.highlightMatch(content.substring(start, end), term, index - start)
        })
        
        index += term.length
      }
    }
    
    return matches
  }

  private highlightMatch(text: string, term: string, termIndex: number): string {
    return text.substring(0, termIndex) +
           '<mark>' + text.substring(termIndex, termIndex + term.length) + '</mark>' +
           text.substring(termIndex + term.length)
  }

  private calculateScore(row: DBSearchResult, _query: SearchQuery): number {
    let score = 1.0
    
    // Boost recent messages
    const messageDate = new Date(row.created_at)
    const daysSinceMessage = (Date.now() - messageDate.getTime()) / (1000 * 60 * 60 * 24)
    score *= Math.max(0.5, 1 - (daysSinceMessage / 365))
    
    // Boost starred chats
    if (row.chat_starred) {
      score *= 1.5
    }
    
    // Reduce score for archived chats
    if (row.chat_archived) {
      score *= 0.7
    }
    
    return score
  }

  private logSearchStats(query: SearchQuery, resultCount: number, searchTime: number): void {
    try {
      const stmt = this.db.prepare(
        'INSERT INTO search_stats (query, result_count, search_time_ms, created_at) VALUES (?, ?, ?, ?)'
      )
      stmt.run(
        JSON.stringify({ text: query.text, filters: query.filters }),
        resultCount,
        searchTime,
        new Date().toISOString()
      )
    } catch (error) {
      console.error('Failed to log search stats:', error)
    }
  }

  // Get search statistics
  getSearchStats(): any {
    const totalSearches = this.db.prepare('SELECT COUNT(*) as count FROM search_stats').get() as { count: number }
    const lastSearch = this.db.prepare('SELECT created_at FROM search_stats ORDER BY created_at DESC LIMIT 1').get() as { created_at: string } | undefined
    const popularTerms = this.db.prepare(`
      SELECT query, COUNT(*) as count 
      FROM search_stats 
      GROUP BY query 
      ORDER BY count DESC 
      LIMIT 10
    `).all() as Array<{ query: string, count: number }>
    
    return {
      totalMessages: 0, // Would need to get from messages table
      indexedMessages: 0, // Would need to get from messages table
      searchTime: 0,
      resultCount: 0,
      lastUpdated: new Date(lastSearch?.created_at || Date.now()),
      totalSearches: totalSearches.count,
      lastSearchAt: lastSearch?.created_at || '',
      popularTerms: JSON.stringify(popularTerms)
    }
  }


  close(): void {
    this.db.close()
  }
}