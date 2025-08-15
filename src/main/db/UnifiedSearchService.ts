import { BaseDatabaseService } from './BaseDatabaseService'
import { logger } from '../utils/Logger'
import Database from 'better-sqlite3'
import type {
  SearchQuery,
  SearchMatch,
  DBSearchResult
} from './searchTypes'
import type { ChatRecord, MessageRecord } from './types'

/**
 * Unified Search Service - 统一的搜索服务
 * 整合了基础搜索、高级搜索、语义搜索和多模态搜索的功能
 */

export type SearchMode = 'basic' | 'advanced' | 'semantic' | 'multimodal'

// UnifiedSearchService specific SearchResult type
export interface SearchResult {
  id: string
  chatId: string
  chatTitle: string
  content: string
  role: string
  timestamp: string
  score: number
  matches: SearchMatch[]
  type: 'message' | 'chat' | 'context' | 'related'
}

export interface UnifiedSearchConfig {
  mode: SearchMode
  options?: {
    // Basic search options
    fuzzySearch?: boolean
    caseSensitive?: boolean
    
    // Advanced search options
    contextAware?: boolean
    includeRelated?: boolean
    maxResults?: number
    
    // Semantic search options
    vectorSearch?: boolean
    similarityThreshold?: number
    embeddings?: boolean
    
    // Multimodal search options
    imageSearch?: boolean
    audioSearch?: boolean
    
    // Performance options
    cacheEnabled?: boolean
    cacheTimeout?: number
    indexOptimization?: boolean
  }
}

export class UnifiedSearchService extends BaseDatabaseService {
  private searchCache: Map<string, { result: any; timestamp: number }> = new Map()
  private cacheTimeout = 5 * 60 * 1000 // 5 minutes default
  private currentConfig: UnifiedSearchConfig = {
    mode: 'basic',
    options: {
      fuzzySearch: false,
      cacheEnabled: true,
      maxResults: 100
    }
  }

  constructor(db: Database.Database | string) {
    // If string path is provided, create database instance
    if (typeof db === 'string') {
      const Database = require('better-sqlite3')
      const dbInstance = new Database(db)
      super(dbInstance)
    } else {
      super(db)
    }
    this.initializeSearchIndex()
  }

  /**
   * Configure search service
   */
  configure(config: Partial<UnifiedSearchConfig>): void {
    this.currentConfig = {
      ...this.currentConfig,
      ...config,
      options: {
        ...this.currentConfig.options,
        ...config.options
      }
    }
    
    if (config.options?.cacheTimeout) {
      this.cacheTimeout = config.options.cacheTimeout
    }
  }

  /**
   * Initialize search index
   */
  private initializeSearchIndex(): void {
    try {
      // Check if FTS index needs rebuilding
      const ftsCount = this.db.prepare('SELECT COUNT(*) as count FROM messages_fts').get() as { count: number } | null
      const messagesCount = this.db.prepare('SELECT COUNT(*) as count FROM messages').get() as { count: number } | null

      // Handle mock database case where get() returns null
      if (!ftsCount || !messagesCount) {
        logger.warn('Mock database detected, skipping search index initialization', 'UnifiedSearchService')
        return
      }

      if (ftsCount.count < messagesCount.count) {
        this.rebuildSearchIndex()
      }
    } catch (error) {
      logger.error('Failed to initialize search index', 'UnifiedSearchService', error)
      throw new Error(`Failed to initialize search index: ${error}`)
    }
  }

  /**
   * Main search method - routes to appropriate search implementation
   */
  async search(query: string | SearchQuery, config?: Partial<UnifiedSearchConfig>): Promise<SearchResult[]> {
    const searchConfig = config ? { ...this.currentConfig, ...config } : this.currentConfig
    
    // Check cache if enabled
    if (searchConfig.options?.cacheEnabled) {
      const cached = this.getCachedResult(query)
      if (cached) return cached
    }

    let results: SearchResult[]
    
    switch (searchConfig.mode) {
      case 'semantic':
        results = await this.semanticSearch(query, searchConfig)
        break
      case 'advanced':
        results = await this.advancedSearch(query, searchConfig)
        break
      case 'multimodal':
        results = await this.multimodalSearch(query, searchConfig)
        break
      case 'basic':
      default:
        results = await this.basicSearch(query, searchConfig)
        break
    }

    // Apply result limit
    if (searchConfig.options?.maxResults) {
      results = results.slice(0, searchConfig.options.maxResults)
    }

    // Cache results if enabled
    if (searchConfig.options?.cacheEnabled) {
      this.cacheResult(query, results)
    }

    return results
  }

  /**
   * Basic search implementation
   */
  private async basicSearch(query: string | SearchQuery, config: UnifiedSearchConfig): Promise<SearchResult[]> {
    const searchQuery = typeof query === 'string' ? query : query.text
    const results: SearchResult[] = []
    
    try {
      // Search in messages using FTS
      const messageStmt = this.db.prepare(`
        SELECT 
          m.id,
          m.chat_id,
          m.role,
          m.content,
          m.created_at,
          c.title as chat_title,
          rank
        FROM messages_fts fts
        JOIN messages m ON m.id = fts.id
        JOIN chats c ON c.id = m.chat_id
        WHERE messages_fts MATCH ?
        ORDER BY rank
        LIMIT ?
      `)
      
      const messages = messageStmt.all(
        searchQuery, 
        config.options?.maxResults || 100
      ) as DBSearchResult[]

      // Convert to SearchResult format
      for (const msg of messages) {
        results.push({
          id: msg.id,
          chatId: msg.chat_id,
          chatTitle: msg.chat_title,
          content: msg.content,
          role: msg.role,
          timestamp: msg.created_at,
          score: Math.abs(msg.rank || 0),
          matches: this.extractMatches(msg.content, searchQuery),
          type: 'message'
        })
      }

      // Also search in chat titles if no message results or fuzzy search enabled
      if (results.length === 0 || config.options?.fuzzySearch) {
        const chatStmt = this.db.prepare(`
          SELECT * FROM chats 
          WHERE title LIKE ? 
          ORDER BY updated_at DESC 
          LIMIT ?
        `)
        
        const chats = chatStmt.all(
          `%${searchQuery}%`,
          config.options?.maxResults || 100
        ) as ChatRecord[]

        for (const chat of chats) {
          results.push({
            id: chat.id,
            chatId: chat.id,
            chatTitle: chat.title,
            content: chat.title,
            role: 'system',
            timestamp: chat.updated_at,
            score: 0.5, // Lower score for title matches
            matches: [],
            type: 'chat'
          })
        }
      }
    } catch (error) {
      logger.error('Basic search failed', 'UnifiedSearchService', error)
      throw error
    }

    return results
  }

  /**
   * Advanced search with context awareness
   */
  private async advancedSearch(query: string | SearchQuery, config: UnifiedSearchConfig): Promise<SearchResult[]> {
    // Start with basic search
    let results = await this.basicSearch(query, config)
    
    // Enhance with context if enabled
    if (config.options?.contextAware) {
      results = this.enhanceWithContext(results)
    }
    
    // Include related results if enabled
    if (config.options?.includeRelated) {
      const related = await this.findRelatedContent(results)
      results = [...results, ...related]
    }
    
    // Re-rank results based on relevance
    results = this.rankResults(results, query)
    
    return results
  }

  /**
   * Semantic search using embeddings (simplified implementation)
   */
  private async semanticSearch(query: string | SearchQuery, config: UnifiedSearchConfig): Promise<SearchResult[]> {
    // For now, use advanced search as base
    let results = await this.advancedSearch(query, config)
    
    // If vector search is enabled, enhance with similarity scoring
    if (config.options?.vectorSearch) {
      results = this.calculateSimilarityScores(results, query)
      
      // Filter by similarity threshold
      if (config.options?.similarityThreshold) {
        results = results.filter(r => r.score >= config.options!.similarityThreshold!)
      }
    }
    
    return results
  }

  /**
   * Multimodal search (simplified implementation)
   */
  private async multimodalSearch(query: string | SearchQuery, config: UnifiedSearchConfig): Promise<SearchResult[]> {
    // Start with semantic search
    const results = await this.semanticSearch(query, config)
    
    // TODO: Add image and audio search when attachments are implemented
    // For now, just return semantic search results
    
    return results
  }

  /**
   * Search in chats by title
   */
  searchChats(query: string): ChatRecord[] {
    this.validateText(query, 'search query')
    
    const stmt = this.db.prepare(`
      SELECT DISTINCT c.* 
      FROM chats c 
      LEFT JOIN messages m ON c.id = m.chat_id 
      WHERE c.title LIKE ? OR m.content LIKE ? 
      ORDER BY c.updated_at DESC
    `)
    
    const searchPattern = `%${query}%`
    return stmt.all(searchPattern, searchPattern) as ChatRecord[]
  }

  /**
   * Rebuild search index
   */
  rebuildSearchIndex(): void {
    try {
      this.db.exec('DELETE FROM messages_fts')
      this.db.exec(`
        INSERT INTO messages_fts(id, content)
        SELECT id, content FROM messages
      `)
      logger.info('Search index rebuilt successfully', 'UnifiedSearchService')
    } catch (error) {
      logger.error('Failed to rebuild search index', 'UnifiedSearchService', error)
      throw error
    }
  }

  /**
   * Get search statistics
   */
  getSearchStats(): {
    totalIndexedMessages: number
    indexSize: number
    lastRebuild: string | null
  } {
    const messageCount = this.db.prepare('SELECT COUNT(*) as count FROM messages_fts').get() as { count: number }
    
    return {
      totalIndexedMessages: messageCount.count,
      indexSize: messageCount.count * 100, // Rough estimate
      lastRebuild: new Date().toISOString()
    }
  }

  // ===== Helper Methods =====

  private extractMatches(content: string, query: string): SearchMatch[] {
    const matches: SearchMatch[] = []
    const lowerContent = content.toLowerCase()
    const lowerQuery = query.toLowerCase()
    
    let index = lowerContent.indexOf(lowerQuery)
    while (index !== -1) {
      const start = Math.max(0, index - 30)
      const end = Math.min(content.length, index + query.length + 30)
      
      matches.push({
        field: 'content' as const,
        text: content.substring(start, end),
        startIndex: index - start,
        endIndex: index - start + query.length,
        highlighted: content.substring(start, end).replace(
          new RegExp(`(${query})`, 'gi'), 
          '<mark>$1</mark>'
        )
      })
      
      index = lowerContent.indexOf(lowerQuery, index + 1)
    }
    
    return matches
  }

  private enhanceWithContext(results: SearchResult[]): SearchResult[] {
    // Add context messages around each result
    const enhanced: SearchResult[] = []
    
    for (const result of results) {
      enhanced.push(result)
      
      // Get surrounding messages
      const contextStmt = this.db.prepare(`
        SELECT * FROM messages 
        WHERE chat_id = ? 
        AND created_at BETWEEN datetime(?, '-1 minute') AND datetime(?, '+1 minute')
        AND id != ?
        ORDER BY created_at
      `)
      
      const contextMessages = contextStmt.all(
        result.chatId,
        result.timestamp,
        result.timestamp,
        result.id
      ) as MessageRecord[]
      
      // Add context messages with lower scores
      for (const msg of contextMessages) {
        enhanced.push({
          ...result,
          id: msg.id,
          content: msg.content,
          role: msg.role,
          timestamp: msg.created_at,
          score: result.score * 0.5, // Lower score for context
          matches: [],
          type: 'context'
        })
      }
    }
    
    return enhanced
  }

  private async findRelatedContent(results: SearchResult[]): Promise<SearchResult[]> {
    // Find related content based on chat IDs
    const chatIds = [...new Set(results.map(r => r.chatId))]
    const related: SearchResult[] = []
    
    for (const chatId of chatIds.slice(0, 5)) { // Limit to first 5 chats
      const relatedStmt = this.db.prepare(`
        SELECT * FROM messages 
        WHERE chat_id = ? 
        ORDER BY created_at DESC 
        LIMIT 5
      `)
      
      const messages = relatedStmt.all(chatId) as MessageRecord[]
      
      for (const msg of messages) {
        // Skip if already in results
        if (results.some(r => r.id === msg.id)) continue
        
        const chat = this.db.prepare('SELECT title FROM chats WHERE id = ?').get(chatId) as { title: string }
        
        related.push({
          id: msg.id,
          chatId: msg.chat_id,
          chatTitle: chat.title,
          content: msg.content,
          role: msg.role,
          timestamp: msg.created_at,
          score: 0.3, // Low score for related content
          matches: [],
          type: 'related'
        })
      }
    }
    
    return related
  }

  private rankResults(results: SearchResult[], query: string | SearchQuery): SearchResult[] {
    const searchQuery = typeof query === 'string' ? query : query.text
    
    // Calculate relevance scores
    for (const result of results) {
      let score = result.score || 0
      
      // Boost for exact matches
      if (result.content.toLowerCase().includes(searchQuery.toLowerCase())) {
        score += 0.5
      }
      
      // Boost for title matches
      if (result.type === 'chat' || result.chatTitle.toLowerCase().includes(searchQuery.toLowerCase())) {
        score += 0.3
      }
      
      // Boost for recent messages
      const age = Date.now() - new Date(result.timestamp).getTime()
      const ageBoost = Math.max(0, 1 - age / (30 * 24 * 60 * 60 * 1000)) // 30 days
      score += ageBoost * 0.2
      
      result.score = score
    }
    
    // Sort by score
    return results.sort((a, b) => b.score - a.score)
  }

  private calculateSimilarityScores(results: SearchResult[], query: string | SearchQuery): SearchResult[] {
    const searchQuery = typeof query === 'string' ? query : query.text
    
    // Simple similarity calculation (would use embeddings in production)
    for (const result of results) {
      const words1 = searchQuery.toLowerCase().split(/\s+/)
      const words2 = result.content.toLowerCase().split(/\s+/)
      
      const commonWords = words1.filter(w => words2.includes(w))
      const similarity = commonWords.length / Math.max(words1.length, words2.length)
      
      result.score = (result.score || 0) + similarity
    }
    
    return results
  }

  // ===== Cache Methods =====

  private getCachedResult(query: string | SearchQuery): SearchResult[] | null {
    const key = this.getCacheKey(query)
    const cached = this.searchCache.get(key)
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.result
    }
    
    // Clean expired cache
    if (cached) {
      this.searchCache.delete(key)
    }
    
    return null
  }

  private cacheResult(query: string | SearchQuery, result: SearchResult[]): void {
    const key = this.getCacheKey(query)
    this.searchCache.set(key, {
      result,
      timestamp: Date.now()
    })
    
    // Limit cache size
    if (this.searchCache.size > 100) {
      const firstKey = this.searchCache.keys().next().value
      if (firstKey) {
        this.searchCache.delete(firstKey)
      }
    }
  }

  private getCacheKey(query: string | SearchQuery): string {
    return typeof query === 'string' ? query : JSON.stringify(query)
  }

  /**
   * Clear search cache
   */
  clearCache(): void {
    this.searchCache.clear()
  }
}