import { BaseDatabaseService } from './BaseDatabaseService'
import type {
  SearchQuery,
  SearchResult,
  SearchMatch,
  DBSearchResult,
  SearchFilters,
  SearchOptions
} from './searchTypes'
import type { ChatRecord } from './types'

/**
 * Service for search-related database operations
 */
export class SearchService extends BaseDatabaseService {
  /**
   * Initialize search index
   */
  initializeSearchIndex(): void {
    try {
      const ftsCount = this.db.prepare('SELECT COUNT(*) as count FROM messages_fts').get() as { count: number }
      const messagesCount = this.db.prepare('SELECT COUNT(*) as count FROM messages').get() as { count: number }

      if (ftsCount.count < messagesCount.count) {
        this.rebuildSearchIndex()
      }
    } catch (error) {
      throw new Error(`Failed to initialize search index: ${error}`)
    }
  }

  /**
   * Basic chat search by title or content
   */
  searchChats(query: string): ChatRecord[] {
    this.validateText(query, 'search query')

    const stmt = this.db.prepare(
      'SELECT DISTINCT c.* FROM chats c LEFT JOIN messages m ON c.id = m.chat_id WHERE c.title LIKE ? OR m.content LIKE ? ORDER BY c.updated_at DESC'
    )
    const searchPattern = `%${query}%`
    return stmt.all(searchPattern, searchPattern) as ChatRecord[]
  }

  /**
   * Advanced message search with filters
   */
  searchMessages(query: SearchQuery): SearchResult[] {
    const startTime = Date.now()
    const results: SearchResult[] = []

    try {
      const sql = this.buildSearchQuery(query)
      const params = this.buildSearchParams(query)

      const stmt = this.db.prepare(sql)
      const rows = stmt.all(...params) as DBSearchResult[]

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

      this.logSearchStats(query, results.length, Date.now() - startTime)
      return results
    } catch (error) {
      throw new Error(`Search error: ${error}`)
    }
  }

  /**
   * Rebuild the full-text search index
   */
  rebuildSearchIndex(): void {
    try {
      const startTime = Date.now()

      this.db.prepare('DELETE FROM messages_fts').run()

      const stmt = this.db.prepare(`
        INSERT INTO messages_fts(rowid, content, content_normalized, role, chat_title, created_at)
        SELECT m.rowid, m.content, LOWER(m.content), m.role,
               COALESCE(c.title, ''), m.created_at
        FROM messages m
        LEFT JOIN chats c ON m.chat_id = c.id
      `)

      const result = stmt.run()
      const endTime = Date.now()

      // Log rebuild completion instead of console.log
      this.logRebuildStats(result.changes, endTime - startTime)
    } catch (error) {
      throw new Error(`Failed to rebuild search index: ${error}`)
    }
  }

  /**
   * Optimize the search index for performance
   */
  optimizeSearchIndex(): void {
    try {
      const startTime = Date.now()

      this.db.prepare("INSERT INTO messages_fts(messages_fts) VALUES('optimize')").run()
      this.db.prepare('ANALYZE').run()

      const endTime = Date.now()
      this.logOptimizationStats(endTime - startTime)
    } catch (error) {
      throw new Error(`Failed to optimize search index: ${error}`)
    }
  }

  /**
   * Get search index status
   */
  getSearchIndexStatus(): { needsRebuild: boolean; messageCount: number; indexedCount: number } {
    try {
      const messageCount = this.db.prepare('SELECT COUNT(*) as count FROM messages').get() as { count: number }
      const indexedCount = this.db.prepare('SELECT COUNT(*) as count FROM messages_fts').get() as { count: number }

      return {
        needsRebuild: indexedCount.count < messageCount.count,
        messageCount: messageCount.count,
        indexedCount: indexedCount.count
      }
    } catch (error) {
      return { needsRebuild: true, messageCount: 0, indexedCount: 0 }
    }
  }

  /**
   * Get search statistics
   */
  getSearchStats(): any {
    try {
      const totalMessages = this.db.prepare('SELECT COUNT(*) as count FROM messages').get() as { count: number }
      const indexedMessages = this.db.prepare('SELECT COUNT(*) as count FROM messages_fts').get() as { count: number }
      const totalSearches = this.db.prepare('SELECT COUNT(*) as count FROM search_stats').get() as { count: number }
      const lastSearch = this.db.prepare('SELECT created_at FROM search_stats ORDER BY created_at DESC LIMIT 1').get() as { created_at: string } | undefined

      const avgSearchTime = this.db.prepare(`
        SELECT AVG(search_time_ms) as avg_time
        FROM search_stats
        WHERE created_at > datetime('now', '-30 days')
      `).get() as { avg_time: number } | undefined

      const popularTerms = this.db.prepare(`
        SELECT query, COUNT(*) as count, AVG(result_count) as avg_results
        FROM search_stats
        WHERE created_at > datetime('now', '-30 days')
        GROUP BY query
        ORDER BY count DESC
        LIMIT 10
      `).all() as Array<{ query: string; count: number; avg_results: number }>

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
        performanceMetrics: {
          avgSearchTime: avgSearchTime?.avg_time || 0,
          indexCoverage: totalMessages.count > 0 ? (indexedMessages.count / totalMessages.count) * 100 : 100
        }
      }
    } catch (error) {
      return this.getDefaultSearchStats()
    }
  }

  private buildSearchQuery(query: SearchQuery): string {
    let sql = this.buildBaseQuery()

    if (query.text?.trim()) {
      sql += this.buildFTSQuery()
    } else {
      sql += this.buildBasicQuery()
    }

    const filterConditions = this.buildFilterConditions(query.filters)
    if (filterConditions) {
      sql += ` AND ${filterConditions}`
    }

    sql += this.buildSortClause(query.options, !!query.text?.trim())
    sql += this.buildLimitClause(query.options)

    return sql
  }

  private buildBaseQuery(): string {
    return `
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
  }

  private buildFTSQuery(): string {
    return `,
        bm25(messages_fts, 2.0, 1.0, 0.5, 1.5) as rank,
        snippet(messages_fts, 0, '<mark>', '</mark>', '...', 32) as snippet
      FROM messages m
      JOIN chats c ON m.chat_id = c.id
      JOIN messages_fts ON messages_fts.rowid = m.rowid
      WHERE messages_fts MATCH ?
      `
  }

  private buildBasicQuery(): string {
    return `
      FROM messages m
      JOIN chats c ON m.chat_id = c.id
      WHERE 1=1
      `
  }

  private buildSearchParams(query: SearchQuery): any[] {
    const params: any[] = []

    if (query.text?.trim()) {
      params.push(this.processSearchText(query.text, query.options))
    }

    if (query.filters.dateRange) {
      params.push(query.filters.dateRange.start)
      params.push(query.filters.dateRange.end)
    }

    return params
  }

  private processSearchText(searchText: string, options: SearchOptions): string {
    const trimmedText = searchText.trim()

    if (options.useRegex) {
      return trimmedText
    }

    if (options.wholeWords) {
      return trimmedText.split(/\s+/).map(word => `"${word}"`).join(' ')
    }

    if (options.fuzzyMatch) {
      const terms = trimmedText.split(/\s+/)
      return terms.map(term => term.length > 2 ? `${term}*` : `"${term}"`).join(' ')
    }

    const words = trimmedText.split(/\s+/)
    return words.length > 1 ? `"${trimmedText}"` : trimmedText
  }

  private buildFilterConditions(filters: SearchFilters): string {
    const conditions: string[] = []

    if (filters.roles?.length) {
      const roleList = filters.roles.map(r => `'${r}'`).join(',')
      conditions.push(`m.role IN (${roleList})`)
    }

    if (filters.dateRange) {
      conditions.push('m.created_at BETWEEN ? AND ?')
    }

    if (filters.chatIds?.length) {
      const chatIdList = filters.chatIds.map(id => `'${id}'`).join(',')
      conditions.push(`m.chat_id IN (${chatIdList})`)
    }

    if (filters.hasAttachments !== undefined) {
      conditions.push(filters.hasAttachments ? 'm.attachments IS NOT NULL' : 'm.attachments IS NULL')
    }

    if (filters.minLength !== undefined) {
      conditions.push(`LENGTH(m.content) >= ${filters.minLength}`)
    }

    if (filters.maxLength !== undefined) {
      conditions.push(`LENGTH(m.content) <= ${filters.maxLength}`)
    }

    return conditions.join(' AND ')
  }

  private buildSortClause(options: SearchOptions, hasSearchText: boolean): string {
    const sortBy = options.sortBy || 'relevance'
    const sortOrder = options.sortOrder || 'desc'

    let orderClause = ' ORDER BY '

    switch (sortBy) {
      case 'relevance':
        if (hasSearchText) {
          orderClause += this.buildRelevanceScore()
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

    if (sortBy !== 'date') {
      orderClause += ', m.created_at DESC'
    }

    return orderClause
  }

  private buildRelevanceScore(): string {
    return `
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
      )`
  }

  private buildLimitClause(options: SearchOptions): string {
    const limit = options.maxResults && options.maxResults > 0
      ? Math.min(options.maxResults, 1000)
      : 100
    return ` LIMIT ${limit}`
  }

  private extractMatches(content: string, searchText: string, options: SearchOptions): SearchMatch[] {
    const matches: SearchMatch[] = []

    if (!searchText?.trim()) {
      return matches
    }

    const cleanSearchText = searchText.replace(/[*"]/g, '').trim()
    const searchTerms = cleanSearchText.toLowerCase().split(/\s+/)
    const contentLower = content.toLowerCase()
    const matchSet = new Set<string>()

    for (const term of searchTerms) {
      if (term.length < 2) continue

      let index = 0
      while ((index = contentLower.indexOf(term, index)) !== -1) {
        const matchKey = `${index}-${index + term.length}`
        if (matchSet.has(matchKey)) {
          index += 1
          continue
        }

        matchSet.add(matchKey)
        matches.push(this.createSearchMatch(content, term, index, options))
        index += 1
      }
    }

    return matches.sort((a, b) => a.startIndex - b.startIndex)
  }

  private createSearchMatch(content: string, term: string, index: number, options: SearchOptions): SearchMatch {
    const contextSize = options.contextLines ? options.contextLines * 50 : 60
    const start = Math.max(0, index - contextSize)
    const end = Math.min(content.length, index + term.length + contextSize)

    let contextStart = start
    let contextEnd = end

    // Find word boundaries for better context
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

    return {
      field: 'content',
      text: content.substring(index, index + term.length),
      startIndex: index,
      endIndex: index + term.length,
      highlighted: this.highlightMatch(
        content.substring(contextStart, contextEnd),
        term,
        index - contextStart
      )
    }
  }

  private highlightMatch(text: string, term: string, termIndex: number): string {
    if (termIndex < 0 || termIndex >= text.length) {
      return text
    }

    const before = text.substring(0, termIndex)
    const match = text.substring(termIndex, termIndex + term.length)
    const after = text.substring(termIndex + term.length)

    return `${before}<mark class="search-highlight">${match}</mark>${after}`
  }

  private calculateScore(row: DBSearchResult, _query: SearchQuery): number {
    let score = 1.0

    const messageDate = new Date(row.created_at)
    const daysSinceMessage = (Date.now() - messageDate.getTime()) / (1000 * 60 * 60 * 24)
    score *= Math.max(0.5, 1 - (daysSinceMessage / 365))

    if (row.chat_starred) {
      score *= 1.5
    }

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
      // Silent logging failure
    }
  }

  private logRebuildStats(changes: number, timeMs: number): void {
    // Could be used for metrics collection instead of console logging
  }

  private logOptimizationStats(timeMs: number): void {
    // Could be used for metrics collection instead of console logging
  }

  private getDefaultSearchStats(): any {
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
      performanceMetrics: {
        avgSearchTime: 0,
        indexCoverage: 0
      }
    }
  }
}