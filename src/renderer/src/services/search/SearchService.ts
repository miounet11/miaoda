import { EventEmitter } from '@renderer/src/utils/performance'
import type { Message } from '@renderer/src/types'

// Search types
export interface SearchQuery {
  text: string
  filters: SearchFilters
  options: SearchOptions
}

export interface SearchFilters {
  roles?: Array<'user' | 'assistant' | 'system'>
  dateRange?: {
    start: Date
    end: Date
  }
  chatIds?: string[]
  messageTypes?: Array<'text' | 'image' | 'code' | 'error'>
  hasAttachments?: boolean
  minLength?: number
  maxLength?: number
  tags?: string[]
  priority?: Array<'high' | 'medium' | 'low'>
}

export interface SearchOptions {
  caseSensitive?: boolean
  wholeWords?: boolean
  useRegex?: boolean
  fuzzyMatch?: boolean
  fuzzyThreshold?: number
  maxResults?: number
  sortBy?: 'relevance' | 'date' | 'length'
  sortOrder?: 'asc' | 'desc'
  highlightMatches?: boolean
  contextLines?: number
}

export interface SearchResult {
  message: Message
  score: number
  matches: SearchMatch[]
  context?: {
    before: Message[]
    after: Message[]
  }
}

export interface SearchMatch {
  field: 'content' | 'metadata' | 'tags'
  text: string
  startIndex: number
  endIndex: number
  highlighted: string
}

export interface SearchIndex {
  messageId: string
  chatId: string
  content: string
  normalizedContent: string
  tokens: string[]
  metadata: Record<string, any>
  timestamp: Date
  role: string
  tags: string[]
  length: number
}

export interface SearchStats {
  totalMessages: number
  indexedMessages: number
  searchTime: number
  resultCount: number
  lastUpdated: Date
}

export class SearchService extends EventEmitter<{
  'index-updated': [stats: SearchStats]
  'search-completed': [results: SearchResult[], query: SearchQuery, stats: SearchStats]
  'search-error': [error: Error, query?: SearchQuery]
}> {
  private searchIndex = new Map<string, SearchIndex>()
  private reverseIndex = new Map<string, Set<string>>() // word -> messageIds
  private recentSearches: SearchQuery[] = []
  private searchHistory = new Map<string, SearchResult[]>()
  private maxRecentSearches = 50
  private maxCacheSize = 100
  
  // Performance optimization
  private worker: Worker | null = null
  private pendingIndexQueue: Message[] = []
  private isIndexing = false
  private indexBatchSize = 100
  private indexThrottleMs = 10

  // Search performance tracking
  private searchStats: SearchStats = {
    totalMessages: 0,
    indexedMessages: 0,
    searchTime: 0,
    resultCount: 0,
    lastUpdated: new Date()
  }

  constructor() {
    super()
    this.initialize()
  }

  private async initialize() {
    // Initialize web worker for heavy computations
    this.initializeWorker()
    
    // Load saved index from storage
    await this.loadIndex()
    
    // Load recent searches
    await this.loadRecentSearches()
    
    // Start batch processing
    this.startBatchProcessor()
  }

  private initializeWorker() {
    // Create inline worker for search operations
    const workerCode = `
      self.onmessage = function(e) {
        const { type, data } = e.data
        
        switch (type) {
          case 'search':
            const results = performSearch(data)
            self.postMessage({ type: 'searchResults', data: results })
            break
            
          case 'index':
            const indexed = createIndex(data)
            self.postMessage({ type: 'indexed', data: indexed })
            break
        }
      }
      
      function performSearch({ index, query, options }) {
        // Perform search in worker thread
        const results = []
        const searchTerms = query.toLowerCase().split(/\\s+/)
        
        for (const [id, item] of Object.entries(index)) {
          let score = 0
          for (const term of searchTerms) {
            if (item.normalizedContent.includes(term)) {
              score += (item.normalizedContent.match(new RegExp(term, 'g')) || []).length
            }
          }
          if (score > 0) {
            results.push({ id, score, item })
          }
        }
        
        return results.sort((a, b) => b.score - a.score)
      }
      
      function createIndex(messages) {
        const indexed = []
        for (const msg of messages) {
          const normalized = msg.content.toLowerCase()
          const tokens = normalized.split(/\\s+/).filter(t => t.length > 1)
          indexed.push({
            id: msg.id,
            normalized,
            tokens,
            original: msg
          })
        }
        return indexed
      }
    `
    
    const blob = new Blob([workerCode], { type: 'application/javascript' })
    const workerUrl = URL.createObjectURL(blob)
    
    try {
      this.worker = new Worker(workerUrl)
      this.worker.onerror = (error) => {
        console.error('Search worker error:', error)
        this.worker = null
      }
    } catch (error) {
      console.warn('Failed to create search worker:', error)
      this.worker = null
    }
  }

  private startBatchProcessor() {
    setInterval(() => {
      if (this.pendingIndexQueue.length > 0 && !this.isIndexing) {
        this.processBatchIndex()
      }
    }, this.indexThrottleMs)
  }

  private async processBatchIndex() {
    if (this.pendingIndexQueue.length === 0) return
    
    this.isIndexing = true
    const batch = this.pendingIndexQueue.splice(0, this.indexBatchSize)
    
    try {
      for (const message of batch) {
        const index = this.createMessageIndex(message)
        this.searchIndex.set(message.id, index)
        this.updateReverseIndex(message.id, index.tokens)
      }
      
      this.searchStats.indexedMessages = this.searchIndex.size
      this.searchStats.lastUpdated = new Date()
      this.emit('index-updated', this.searchStats)
      
      // Save index periodically
      if (this.searchIndex.size % 500 === 0) {
        await this.saveIndex()
      }
    } finally {
      this.isIndexing = false
    }
  }

  // Index management
  async indexMessage(message: Message): Promise<void> {
    // Add to batch queue for performance
    this.pendingIndexQueue.push(message)
    
    // For immediate indexing of single messages
    if (this.pendingIndexQueue.length === 1 && !this.isIndexing) {
      await this.processBatchIndex()
    }
  }

  async indexMessages(messages: Message[]): Promise<void> {
    const startTime = Date.now()
    
    try {
      for (const message of messages) {
        await this.indexMessage(message)
      }
      
      // Save index periodically
      if (messages.length > 10) {
        await this.saveIndex()
      }
      
      console.log(`Indexed ${messages.length} messages in ${Date.now() - startTime}ms`)
    } catch (error) {
      console.error('Failed to index messages:', error)
    }
  }

  private createMessageIndex(message: Message): SearchIndex {
    const content = message.content || ''
    const normalizedContent = this.normalizeText(content)
    const tokens = this.tokenize(normalizedContent)
    
    return {
      messageId: message.id,
      chatId: message.chatId || '',
      content,
      normalizedContent,
      tokens,
      metadata: message.metadata || {},
      timestamp: message.timestamp || new Date(),
      role: message.role,
      tags: message.tags || [],
      length: content.length
    }
  }

  private updateReverseIndex(messageId: string, tokens: string[]): void {
    // Remove old tokens for this message
    for (const [token, messageIds] of this.reverseIndex) {
      messageIds.delete(messageId)
      if (messageIds.size === 0) {
        this.reverseIndex.delete(token)
      }
    }
    
    // Add new tokens
    for (const token of tokens) {
      if (!this.reverseIndex.has(token)) {
        this.reverseIndex.set(token, new Set())
      }
      this.reverseIndex.get(token)!.add(messageId)
    }
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff]/g, ' ') // Keep alphanumeric, spaces, and Chinese characters
      .replace(/\s+/g, ' ')
      .trim()
  }

  private tokenize(text: string): string[] {
    // Split on whitespace and punctuation
    const tokens = text.split(/[\s\p{P}]+/u).filter(token => token.length > 0)
    
    // Add n-grams for better fuzzy matching
    const ngrams: string[] = []
    for (const token of tokens) {
      if (token.length > 3) {
        for (let i = 0; i < token.length - 2; i++) {
          ngrams.push(token.slice(i, i + 3))
        }
      }
    }
    
    return [...tokens, ...ngrams]
  }

  // Search functionality
  async search(query: SearchQuery): Promise<SearchResult[]> {
    const startTime = Date.now()
    
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(query)
      if (this.searchHistory.has(cacheKey)) {
        const cached = this.searchHistory.get(cacheKey)!
        this.searchStats.searchTime = Date.now() - startTime
        this.emit('search-completed', cached, query, this.searchStats)
        return cached
      }

      // Use worker for large indexes if available
      if (this.worker && this.searchIndex.size > 1000 && query.text.trim()) {
        return await this.workerSearch(query, startTime)
      }

      let results: SearchResult[] = []

      if (query.text.trim()) {
        // Text search
        results = await this.textSearch(query)
      } else {
        // Filter-only search
        results = await this.filterSearch(query)
      }

      // Apply additional filters
      results = this.applyFilters(results, query.filters)

      // Sort results
      results = this.sortResults(results, query.options)

      // Limit results
      if (query.options.maxResults) {
        results = results.slice(0, query.options.maxResults)
      }

      // Add context if requested
      if (query.options.contextLines && query.options.contextLines > 0) {
        results = await this.addContext(results, query.options.contextLines)
      }

      // Cache results
      this.cacheResults(cacheKey, results)

      // Add to recent searches
      this.addToRecentSearches(query)

      // Update stats
      this.searchStats.searchTime = Date.now() - startTime
      this.searchStats.resultCount = results.length

      this.emit('search-completed', results, query, this.searchStats)

      return results
    } catch (error) {
      this.emit('search-error', error as Error, query)
      throw error
    }
  }

  private async textSearch(query: SearchQuery): Promise<SearchResult[]> {
    const results: SearchResult[] = []
    const searchTerms = this.parseSearchText(query.text, query.options)

    for (const [messageId, index] of this.searchIndex) {
      const score = this.calculateRelevanceScore(index, searchTerms, query.options)
      
      if (score > 0) {
        const matches = this.findMatches(index, searchTerms, query.options)
        
        results.push({
          message: this.getMessageFromIndex(index),
          score,
          matches
        })
      }
    }

    return results
  }

  private async filterSearch(query: SearchQuery): Promise<SearchResult[]> {
    const results: SearchResult[] = []

    for (const [messageId, index] of this.searchIndex) {
      if (this.matchesFilters(index, query.filters)) {
        results.push({
          message: this.getMessageFromIndex(index),
          score: 1.0,
          matches: []
        })
      }
    }

    return results
  }

  private parseSearchText(text: string, options: SearchOptions = {}): string[] {
    if (options.useRegex) {
      return [text] // Return as single regex pattern
    }

    let terms: string[]

    if (options.wholeWords) {
      // Split by whitespace for whole word matching
      terms = text.split(/\s+/).filter(term => term.length > 0)
    } else {
      // Normalize and tokenize
      terms = this.tokenize(this.normalizeText(text))
    }

    if (!options.caseSensitive) {
      terms = terms.map(term => term.toLowerCase())
    }

    return terms
  }

  private calculateRelevanceScore(
    index: SearchIndex, 
    searchTerms: string[], 
    options: SearchOptions = {}
  ): number {
    let score = 0
    const content = options.caseSensitive ? index.content : index.normalizedContent
    const tokens = options.caseSensitive ? 
      this.tokenize(index.content) : 
      index.tokens

    for (const term of searchTerms) {
      if (options.useRegex) {
        try {
          const regex = new RegExp(term, options.caseSensitive ? 'g' : 'gi')
          const matches = content.match(regex)
          if (matches) {
            score += matches.length * 2 // Regex matches get higher score
          }
        } catch (error) {
          // Invalid regex, fall back to simple search
          if (content.includes(term)) {
            score += 1
          }
        }
      } else if (options.wholeWords) {
        const regex = new RegExp(`\\b${this.escapeRegex(term)}\\b`, 
          options.caseSensitive ? 'g' : 'gi')
        const matches = content.match(regex)
        if (matches) {
          score += matches.length * 1.5 // Whole word matches get bonus
        }
      } else if (options.fuzzyMatch) {
        const fuzzyScore = this.fuzzyMatchScore(term, tokens, options.fuzzyThreshold || 0.7)
        score += fuzzyScore
      } else {
        // Exact substring matching
        const termCount = this.countOccurrences(content, term)
        score += termCount
      }
    }

    // Normalize score by content length to favor shorter, more relevant messages
    return score / Math.log(index.length + 1)
  }

  private findMatches(
    index: SearchIndex, 
    searchTerms: string[], 
    options: SearchOptions = {}
  ): SearchMatch[] {
    const matches: SearchMatch[] = []
    const content = options.caseSensitive ? index.content : index.normalizedContent

    for (const term of searchTerms) {
      if (options.useRegex) {
        try {
          const regex = new RegExp(term, options.caseSensitive ? 'g' : 'gi')
          let match
          while ((match = regex.exec(content)) !== null) {
            matches.push({
              field: 'content',
              text: match[0],
              startIndex: match.index,
              endIndex: match.index + match[0].length,
              highlighted: this.highlightText(content, match.index, match.index + match[0].length)
            })
          }
        } catch (error) {
          // Invalid regex, skip
        }
      } else {
        const regex = options.wholeWords ? 
          new RegExp(`\\b${this.escapeRegex(term)}\\b`, options.caseSensitive ? 'g' : 'gi') :
          new RegExp(this.escapeRegex(term), options.caseSensitive ? 'g' : 'gi')

        let match
        while ((match = regex.exec(content)) !== null) {
          matches.push({
            field: 'content',
            text: match[0],
            startIndex: match.index,
            endIndex: match.index + match[0].length,
            highlighted: this.highlightText(content, match.index, match.index + match[0].length)
          })
        }
      }
    }

    return matches
  }

  private fuzzyMatchScore(term: string, tokens: string[], threshold: number): number {
    let maxScore = 0

    for (const token of tokens) {
      const similarity = this.stringSimilarity(term, token)
      if (similarity >= threshold) {
        maxScore = Math.max(maxScore, similarity)
      }
    }

    return maxScore
  }

  private stringSimilarity(a: string, b: string): number {
    // Levenshtein distance similarity
    const matrix: number[][] = []
    const aLen = a.length
    const bLen = b.length

    for (let i = 0; i <= bLen; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= aLen; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= bLen; i++) {
      for (let j = 1; j <= aLen; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }

    const maxLen = Math.max(aLen, bLen)
    if (maxLen === 0) return 1

    return (maxLen - matrix[bLen][aLen]) / maxLen
  }

  private countOccurrences(text: string, term: string): number {
    const regex = new RegExp(this.escapeRegex(term), 'gi')
    const matches = text.match(regex)
    return matches ? matches.length : 0
  }

  private highlightText(text: string, start: number, end: number): string {
    return text.slice(0, start) + 
           '<mark>' + text.slice(start, end) + '</mark>' + 
           text.slice(end)
  }

  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  private applyFilters(results: SearchResult[], filters: SearchFilters): SearchResult[] {
    return results.filter(result => this.matchesFilters(
      this.searchIndex.get(result.message.id)!, 
      filters
    ))
  }

  private matchesFilters(index: SearchIndex, filters: SearchFilters): boolean {
    // Role filter
    if (filters.roles && filters.roles.length > 0) {
      if (!filters.roles.includes(index.role as any)) {
        return false
      }
    }

    // Date range filter
    if (filters.dateRange) {
      const messageDate = index.timestamp
      if (messageDate < filters.dateRange.start || messageDate > filters.dateRange.end) {
        return false
      }
    }

    // Chat ID filter
    if (filters.chatIds && filters.chatIds.length > 0) {
      if (!filters.chatIds.includes(index.chatId)) {
        return false
      }
    }

    // Length filters
    if (filters.minLength !== undefined && index.length < filters.minLength) {
      return false
    }

    if (filters.maxLength !== undefined && index.length > filters.maxLength) {
      return false
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      const hasRequiredTags = filters.tags.some(tag => index.tags.includes(tag))
      if (!hasRequiredTags) {
        return false
      }
    }

    return true
  }

  private sortResults(results: SearchResult[], options: SearchOptions = {}): SearchResult[] {
    const sortBy = options.sortBy || 'relevance'
    const sortOrder = options.sortOrder || 'desc'

    results.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'relevance':
          comparison = a.score - b.score
          break
        case 'date':
          comparison = a.message.timestamp!.getTime() - b.message.timestamp!.getTime()
          break
        case 'length':
          comparison = (a.message.content?.length || 0) - (b.message.content?.length || 0)
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return results
  }

  private async addContext(results: SearchResult[], contextLines: number): Promise<SearchResult[]> {
    // This would require access to the chat store to get surrounding messages
    // For now, return results as-is
    return results
  }

  private getMessageFromIndex(index: SearchIndex): Message {
    // Reconstruct message from index
    return {
      id: index.messageId,
      chatId: index.chatId,
      role: index.role as any,
      content: index.content,
      timestamp: index.timestamp,
      metadata: index.metadata,
      tags: index.tags
    }
  }

  // Cache management
  private getCacheKey(query: SearchQuery): string {
    return JSON.stringify({
      text: query.text,
      filters: query.filters,
      options: query.options
    })
  }

  private cacheResults(key: string, results: SearchResult[]): void {
    if (this.searchHistory.size >= this.maxCacheSize) {
      // Remove oldest entry
      const firstKey = this.searchHistory.keys().next().value
      this.searchHistory.delete(firstKey)
    }

    this.searchHistory.set(key, results)
  }

  private addToRecentSearches(query: SearchQuery): void {
    // Remove duplicate if exists
    this.recentSearches = this.recentSearches.filter(
      q => this.getCacheKey(q) !== this.getCacheKey(query)
    )

    // Add to beginning
    this.recentSearches.unshift(query)

    // Limit size
    if (this.recentSearches.length > this.maxRecentSearches) {
      this.recentSearches = this.recentSearches.slice(0, this.maxRecentSearches)
    }

    this.saveRecentSearches()
  }

  // Persistence
  private async loadIndex(): Promise<void> {
    try {
      const saved = localStorage.getItem('miaoda-search-index')
      if (saved) {
        const data = JSON.parse(saved)
        
        // Reconstruct Map from saved data
        for (const [id, index] of Object.entries(data.index || {})) {
          this.searchIndex.set(id, {
            ...index as SearchIndex,
            timestamp: new Date((index as any).timestamp)
          })
        }

        // Reconstruct reverse index
        for (const [token, messageIds] of Object.entries(data.reverseIndex || {})) {
          this.reverseIndex.set(token, new Set(messageIds as string[]))
        }

        this.searchStats = {
          ...data.stats,
          lastUpdated: new Date(data.stats?.lastUpdated || Date.now())
        }
      }
    } catch (error) {
      console.warn('Failed to load search index:', error)
    }
  }

  private async saveIndex(): Promise<void> {
    try {
      const data = {
        index: Object.fromEntries(this.searchIndex),
        reverseIndex: Object.fromEntries(
          Array.from(this.reverseIndex.entries()).map(([k, v]) => [k, Array.from(v)])
        ),
        stats: this.searchStats
      }

      localStorage.setItem('miaoda-search-index', JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save search index:', error)
    }
  }

  private async loadRecentSearches(): Promise<void> {
    try {
      const saved = localStorage.getItem('miaoda-recent-searches')
      if (saved) {
        this.recentSearches = JSON.parse(saved)
      }
    } catch (error) {
      console.warn('Failed to load recent searches:', error)
    }
  }

  private async saveRecentSearches(): Promise<void> {
    try {
      localStorage.setItem('miaoda-recent-searches', JSON.stringify(this.recentSearches))
    } catch (error) {
      console.warn('Failed to save recent searches:', error)
    }
  }

  // Public API
  clearIndex(): void {
    this.searchIndex.clear()
    this.reverseIndex.clear()
    this.searchStats.indexedMessages = 0
    this.searchStats.lastUpdated = new Date()
    this.saveIndex()
    this.emit('index-updated', this.searchStats)
  }

  clearCache(): void {
    this.searchHistory.clear()
  }

  clearRecentSearches(): void {
    this.recentSearches = []
    this.saveRecentSearches()
  }

  getRecentSearches(): SearchQuery[] {
    return [...this.recentSearches]
  }

  getSearchStats(): SearchStats {
    return { ...this.searchStats }
  }

  // Quick search methods
  async quickSearch(text: string): Promise<SearchResult[]> {
    return this.search({
      text,
      filters: {},
      options: {
        maxResults: 20,
        sortBy: 'relevance',
        highlightMatches: true
      }
    })
  }

  async searchByRole(role: 'user' | 'assistant' | 'system'): Promise<SearchResult[]> {
    return this.search({
      text: '',
      filters: { roles: [role] },
      options: { sortBy: 'date', sortOrder: 'desc' }
    })
  }

  async searchByDateRange(start: Date, end: Date): Promise<SearchResult[]> {
    return this.search({
      text: '',
      filters: { dateRange: { start, end } },
      options: { sortBy: 'date', sortOrder: 'desc' }
    })
  }

  // Worker search for performance
  private async workerSearch(query: SearchQuery, startTime: number): Promise<SearchResult[]> {
    return new Promise((resolve) => {
      if (!this.worker) {
        resolve(this.textSearch(query))
        return
      }

      const handler = (e: MessageEvent) => {
        if (e.data.type === 'searchResults') {
          this.worker!.removeEventListener('message', handler)
          
          // Convert worker results to SearchResult format
          const results = e.data.data.map((r: any) => ({
            message: this.getMessageFromIndex(r.item),
            score: r.score,
            matches: []
          }))
          
          // Apply filters and complete processing
          const filtered = this.applyFilters(results, query.filters)
          const sorted = this.sortResults(filtered, query.options)
          const limited = query.options.maxResults ? sorted.slice(0, query.options.maxResults) : sorted
          
          // Update stats and cache
          this.searchStats.searchTime = Date.now() - startTime
          this.searchStats.resultCount = limited.length
          this.cacheResults(this.getCacheKey(query), limited)
          this.addToRecentSearches(query)
          
          this.emit('search-completed', limited, query, this.searchStats)
          resolve(limited)
        }
      }

      this.worker.addEventListener('message', handler)
      
      // Send search request to worker
      const indexData = Object.fromEntries(
        Array.from(this.searchIndex.entries()).map(([id, index]) => [
          id,
          {
            normalizedContent: index.normalizedContent,
            tokens: index.tokens,
            role: index.role,
            timestamp: index.timestamp.getTime()
          }
        ])
      )
      
      this.worker.postMessage({
        type: 'search',
        data: {
          index: indexData,
          query: query.text,
          options: query.options
        }
      })
    })
  }

  // Cleanup
  destroy(): void {
    this.saveIndex()
    this.saveRecentSearches()
    
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    
    this.clear()
  }
}

// Global search service instance
export const searchService = new SearchService()

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    searchService.destroy()
  })
}