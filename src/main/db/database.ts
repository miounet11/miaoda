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
    
    // Initialize FTS index
    this.initializeSearchIndex()
    
    // Create indexes after migrations
    this.db.exec(`
      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
      CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON chats(updated_at);
      CREATE INDEX IF NOT EXISTS idx_chats_archived ON chats(archived);
      CREATE INDEX IF NOT EXISTS idx_chats_starred ON chats(starred);
      
      -- Full-text search virtual table with enhanced tokenization
      CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
        content,
        content_normalized,
        role,
        chat_title,
        created_at UNINDEXED,
        tokenize = 'porter unicode61 remove_diacritics 1'
      );

      -- Triggers to keep FTS in sync with enhanced data
      CREATE TRIGGER IF NOT EXISTS messages_ai AFTER INSERT ON messages BEGIN
        INSERT INTO messages_fts(rowid, content, content_normalized, role, chat_title, created_at) 
        SELECT new.rowid, new.content, LOWER(new.content), new.role, 
               COALESCE(c.title, ''), new.created_at
        FROM chats c WHERE c.id = new.chat_id;
      END;

      CREATE TRIGGER IF NOT EXISTS messages_ad AFTER DELETE ON messages BEGIN
        DELETE FROM messages_fts WHERE rowid = old.rowid;
      END;

      CREATE TRIGGER IF NOT EXISTS messages_au AFTER UPDATE ON messages BEGIN
        UPDATE messages_fts 
        SET content = new.content, 
            content_normalized = LOWER(new.content),
            role = new.role
        WHERE rowid = new.rowid;
      END;

      -- Trigger to update FTS when chat title changes
      CREATE TRIGGER IF NOT EXISTS chats_au AFTER UPDATE OF title ON chats BEGIN
        UPDATE messages_fts 
        SET chat_title = new.title
        WHERE rowid IN (SELECT rowid FROM messages WHERE chat_id = new.id);
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

  private initializeSearchIndex() {
    try {
      // Check if FTS table needs to be populated
      const ftsCount = this.db.prepare('SELECT COUNT(*) as count FROM messages_fts').get() as { count: number }
      const messagesCount = this.db.prepare('SELECT COUNT(*) as count FROM messages').get() as { count: number }
      
      if (ftsCount.count < messagesCount.count) {
        console.log('[Database] Rebuilding FTS index...')
        
        // Clear existing FTS data
        this.db.prepare('DELETE FROM messages_fts').run()
        
        // Rebuild FTS index with all existing messages
        this.db.prepare(`
          INSERT INTO messages_fts(rowid, content, content_normalized, role, chat_title, created_at)
          SELECT m.rowid, m.content, LOWER(m.content), m.role, 
                 COALESCE(c.title, ''), m.created_at
          FROM messages m
          LEFT JOIN chats c ON m.chat_id = c.id
        `).run()
        
        console.log(`[Database] FTS index rebuilt with ${messagesCount.count} messages`)
      }
    } catch (error) {
      console.error('[Database] Failed to initialize search index:', error)
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
    
    // Use enhanced FTS5 for text search if query text is provided
    if (query.text && query.text.trim()) {
      sql += `,
        bm25(messages_fts, 2.0, 1.0, 0.5, 1.5) as rank,
        snippet(messages_fts, 0, '<mark>', '</mark>', '...', 32) as snippet
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
    
    // Add sorting with enhanced relevance
    sql += this.buildEnhancedSortClause(query.options, !!query.text?.trim())
    
    // Add limit
    if (query.options.maxResults && query.options.maxResults > 0) {
      sql += ` LIMIT ${Math.min(query.options.maxResults, 1000)}`
    } else {
      sql += ` LIMIT 100` // Default limit
    }
    
    return sql
  }

  private buildSearchParams(query: SearchQuery): any[] {
    const params: any[] = []
    
    // Add search text parameter for FTS5
    if (query.text && query.text.trim()) {
      let searchText = query.text.trim()
      
      // Handle different search modes
      if (query.options.useRegex) {
        // For regex search, use direct pattern
        params.push(searchText)
      } else if (query.options.wholeWords) {
        // Add word boundaries for whole word search
        searchText = searchText.split(/\s+/).map(word => `"${word}"`).join(' ')
        params.push(searchText)
      } else if (query.options.fuzzyMatch) {
        // For fuzzy matching, use prefix matching
        const terms = searchText.split(/\s+/)
        const fuzzyTerms = terms.map(term => term.length > 2 ? `${term}*` : `"${term}"`).join(' ')
        params.push(fuzzyTerms)
      } else {
        // Default: phrase search for multiple words, term search for single word
        const words = searchText.split(/\s+/)
        if (words.length > 1) {
          searchText = `"${searchText}"` // Phrase search
        }
        params.push(searchText)
      }
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

  private buildEnhancedSortClause(options: SearchOptions, hasSearchText: boolean): string {
    const sortBy = options.sortBy || 'relevance'
    const sortOrder = options.sortOrder || 'desc'
    
    let orderClause = ' ORDER BY '
    
    switch (sortBy) {
      case 'relevance':
        if (hasSearchText) {
          // Multi-factor relevance scoring
          orderClause += `
            (
              rank * 
              CASE WHEN c.starred = 1 THEN 1.5 ELSE 1.0 END *
              CASE WHEN c.archived = 1 THEN 0.7 ELSE 1.0 END *
              CASE 
                WHEN m.role = 'user' THEN 1.2 
                WHEN m.role = 'assistant' THEN 1.0 
                ELSE 0.8 
              END *
              (1.0 + (julianday('now') - julianday(m.created_at)) / -365.0 * 0.1)
            )
          `
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
    
    // Secondary sort by date for consistency
    if (sortBy !== 'date') {
      orderClause += ', m.created_at DESC'
    }
    
    return orderClause
  }

  private extractMatches(content: string, searchText: string, options: SearchOptions): SearchMatch[] {
    const matches: SearchMatch[] = []
    
    if (!searchText || !searchText.trim()) {
      return matches
    }
    
    // Clean search text - remove FTS5 syntax for match extraction
    const cleanSearchText = searchText.replace(/[*"]/g, '').trim()
    const searchTerms = cleanSearchText.toLowerCase().split(/\s+/)
    const contentLower = content.toLowerCase()
    
    // Create a set to avoid duplicate matches
    const matchSet = new Set<string>()
    
    for (const term of searchTerms) {
      if (term.length < 2) continue // Skip very short terms
      
      let index = 0
      while ((index = contentLower.indexOf(term, index)) !== -1) {
        const matchKey = `${index}-${index + term.length}`
        if (matchSet.has(matchKey)) {
          index += 1
          continue
        }
        
        matchSet.add(matchKey)
        
        // Calculate context window
        const contextSize = options.contextLines ? options.contextLines * 50 : 60
        const start = Math.max(0, index - contextSize)
        const end = Math.min(content.length, index + term.length + contextSize)
        
        // Find word boundaries for better context
        let contextStart = start
        let contextEnd = end
        
        if (start > 0) {
          const spaceIndex = content.indexOf(' ', start)
          if (spaceIndex !== -1 && spaceIndex < index) {
            contextStart = spaceIndex + 1
          }
        }
        
        if (end < content.length) {
          const spaceIndex = content.lastIndexOf(' ', end)
          if (spaceIndex > index + term.length) {
            contextEnd = spaceIndex
          }
        }
        
        matches.push({
          field: 'content',
          text: content.substring(index, index + term.length),
          startIndex: index,
          endIndex: index + term.length,
          highlighted: this.highlightMatch(
            content.substring(contextStart, contextEnd), 
            term, 
            index - contextStart
          )
        })
        
        index += 1 // Move forward to find overlapping matches
      }
    }
    
    // Sort matches by position
    return matches.sort((a, b) => a.startIndex - b.startIndex)
  }

  private highlightMatch(text: string, term: string, termIndex: number): string {
    if (termIndex < 0 || termIndex >= text.length) {
      return text // Safe fallback
    }
    
    const before = text.substring(0, termIndex)
    const match = text.substring(termIndex, termIndex + term.length)
    const after = text.substring(termIndex + term.length)
    
    return `${before}<mark class="search-highlight">${match}</mark>${after}`
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

  // Get enhanced search statistics
  getSearchStats(): any {
    try {
      const totalMessages = this.db.prepare('SELECT COUNT(*) as count FROM messages').get() as { count: number }
      const indexedMessages = this.db.prepare('SELECT COUNT(*) as count FROM messages_fts').get() as { count: number }
      const totalSearches = this.db.prepare('SELECT COUNT(*) as count FROM search_stats').get() as { count: number }
      const lastSearch = this.db.prepare('SELECT created_at FROM search_stats ORDER BY created_at DESC LIMIT 1').get() as { created_at: string } | undefined
      
      // Get average search performance
      const avgSearchTime = this.db.prepare(`
        SELECT AVG(search_time_ms) as avg_time 
        FROM search_stats 
        WHERE created_at > datetime('now', '-30 days')
      `).get() as { avg_time: number } | undefined
      
      // Get popular search terms
      const popularTerms = this.db.prepare(`
        SELECT query, COUNT(*) as count, AVG(result_count) as avg_results
        FROM search_stats 
        WHERE created_at > datetime('now', '-30 days')
        GROUP BY query 
        ORDER BY count DESC 
        LIMIT 10
      `).all() as Array<{ query: string, count: number, avg_results: number }>
      
      // Get search result distribution
      const resultDistribution = this.db.prepare(`
        SELECT 
          CASE 
            WHEN result_count = 0 THEN 'no_results'
            WHEN result_count <= 5 THEN 'few_results'
            WHEN result_count <= 20 THEN 'moderate_results'
            ELSE 'many_results'
          END as category,
          COUNT(*) as count
        FROM search_stats
        WHERE created_at > datetime('now', '-30 days')
        GROUP BY category
      `).all() as Array<{ category: string, count: number }>
      
      return {
        totalMessages: totalMessages.count,
        indexedMessages: indexedMessages.count,
        indexingComplete: indexedMessages.count >= totalMessages.count,
        searchTime: avgSearchTime?.avg_time || 0,
        resultCount: 0,
        lastUpdated: new Date(lastSearch?.created_at || Date.now()),
        totalSearches: totalSearches.count,
        lastSearchAt: lastSearch?.created_at || '',
        popularTerms: JSON.stringify(popularTerms),
        resultDistribution: JSON.stringify(resultDistribution),
        performanceMetrics: {
          avgSearchTime: avgSearchTime?.avg_time || 0,
          indexCoverage: totalMessages.count > 0 ? (indexedMessages.count / totalMessages.count) * 100 : 100
        }
      }
    } catch (error) {
      console.error('Failed to get search stats:', error)
      return {
        totalMessages: 0,
        indexedMessages: 0,
        indexingComplete: false,
        searchTime: 0,
        resultCount: 0,
        lastUpdated: new Date(),
        totalSearches: 0,
        lastSearchAt: '',
        popularTerms: '[]',
        resultDistribution: '[]',
        performanceMetrics: {
          avgSearchTime: 0,
          indexCoverage: 0
        }
      }
    }
  }

  // Search index management methods
  rebuildSearchIndex(): void {
    try {
      console.log('[Database] Starting search index rebuild...')
      const startTime = Date.now()
      
      // Clear existing FTS data
      this.db.prepare('DELETE FROM messages_fts').run()
      
      // Rebuild with all messages
      const stmt = this.db.prepare(`
        INSERT INTO messages_fts(rowid, content, content_normalized, role, chat_title, created_at)
        SELECT m.rowid, m.content, LOWER(m.content), m.role, 
               COALESCE(c.title, ''), m.created_at
        FROM messages m
        LEFT JOIN chats c ON m.chat_id = c.id
      `)
      
      const result = stmt.run()
      const endTime = Date.now()
      
      console.log(`[Database] Search index rebuilt: ${result.changes} entries in ${endTime - startTime}ms`)
    } catch (error) {
      console.error('[Database] Failed to rebuild search index:', error)
      throw error
    }
  }

  optimizeSearchIndex(): void {
    try {
      console.log('[Database] Optimizing search index...')
      const startTime = Date.now()
      
      // Optimize FTS5 index
      this.db.prepare('INSERT INTO messages_fts(messages_fts) VALUES(\'optimize\')').run()
      
      // Analyze tables for better query planning
      this.db.prepare('ANALYZE').run()
      
      const endTime = Date.now()
      console.log(`[Database] Search index optimized in ${endTime - startTime}ms`)
    } catch (error) {
      console.error('[Database] Failed to optimize search index:', error)
    }
  }

  getSearchIndexStatus(): { needsRebuild: boolean, messageCount: number, indexedCount: number } {
    try {
      const messageCount = this.db.prepare('SELECT COUNT(*) as count FROM messages').get() as { count: number }
      const indexedCount = this.db.prepare('SELECT COUNT(*) as count FROM messages_fts').get() as { count: number }
      
      return {
        needsRebuild: indexedCount.count < messageCount.count,
        messageCount: messageCount.count,
        indexedCount: indexedCount.count
      }
    } catch (error) {
      console.error('[Database] Failed to get search index status:', error)
      return { needsRebuild: true, messageCount: 0, indexedCount: 0 }
    }
  }

  close(): void {
    this.db.close()
  }
}