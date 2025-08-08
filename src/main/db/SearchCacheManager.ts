import { BaseDatabaseService } from './BaseDatabaseService'
import type { SearchQuery, SearchResult } from './searchTypes'

/**
 * Cache entry for search results
 */
interface SearchCacheEntry {
  queryHash: string
  queryText: string
  results: SearchResult[]
  searchType: 'lexical' | 'semantic' | 'hybrid'
  metadata: {
    resultCount: number
    searchTime: number
    timestamp: number
    accessCount: number
    lastAccessed: number
  }
}

/**
 * Cache statistics
 */
interface CacheStats {
  totalEntries: number
  hitRate: number
  avgSearchTime: number
  memoryUsage: number
  oldestEntry: number
  newestEntry: number
}

/**
 * High-performance search cache manager with intelligent eviction
 */
export class SearchCacheManager extends BaseDatabaseService {
  private memoryCache: Map<string, SearchCacheEntry> = new Map()
  private accessOrder: Map<string, number> = new Map() // For LRU tracking
  private cacheStats = {
    hits: 0,
    misses: 0,
    totalRequests: 0
  }

  // Configuration
  private readonly MAX_MEMORY_ENTRIES = 500
  private readonly MAX_DB_ENTRIES = 2000
  private readonly CACHE_TTL = 30 * 60 * 1000 // 30 minutes
  private readonly MIN_ACCESS_FOR_PERSISTENCE = 2
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 minutes
  
  private cleanupTimer?: NodeJS.Timeout
  private accessCounter = 0

  constructor(db: any) {
    super(db)
    this.initializeCacheTables()
    this.startCleanupTimer()
  }

  /**
   * Initialize cache tables
   */
  private initializeCacheTables(): void {
    try {
      this.db.exec(`
        -- Search results cache
        CREATE TABLE IF NOT EXISTS search_cache (
          query_hash TEXT PRIMARY KEY,
          query_text TEXT NOT NULL,
          search_type TEXT NOT NULL,
          results BLOB NOT NULL,
          result_count INTEGER NOT NULL,
          search_time_ms INTEGER NOT NULL,
          created_at TEXT NOT NULL,
          last_accessed TEXT NOT NULL,
          access_count INTEGER DEFAULT 1
        );

        -- Cache performance statistics
        CREATE TABLE IF NOT EXISTS cache_stats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          cache_hits INTEGER NOT NULL,
          cache_misses INTEGER NOT NULL,
          total_requests INTEGER NOT NULL,
          hit_rate REAL NOT NULL,
          avg_search_time REAL NOT NULL,
          created_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_cache_access ON search_cache(last_accessed);
        CREATE INDEX IF NOT EXISTS idx_cache_type ON search_cache(search_type);
        CREATE INDEX IF NOT EXISTS idx_cache_created ON search_cache(created_at);
      `)
    } catch (error) {
      throw new Error(`Failed to initialize cache tables: ${error}`)
    }
  }

  /**
   * Get cached search results
   */
  async getCachedResults(query: SearchQuery, searchType: 'lexical' | 'semantic' | 'hybrid'): Promise<SearchResult[] | null> {
    const queryHash = this.hashQuery(query, searchType)
    this.cacheStats.totalRequests++

    // Check memory cache first
    const memoryCached = this.memoryCache.get(queryHash)
    if (memoryCached && this.isValidCacheEntry(memoryCached)) {
      this.updateAccessInfo(queryHash, memoryCached)
      this.cacheStats.hits++
      return memoryCached.results
    }

    // Check database cache
    const dbCached = await this.getFromDatabaseCache(queryHash)
    if (dbCached && this.isValidCacheEntry(dbCached)) {
      // Promote to memory cache
      this.memoryCache.set(queryHash, dbCached)
      this.updateAccessInfo(queryHash, dbCached)
      this.cacheStats.hits++
      return dbCached.results
    }

    this.cacheStats.misses++
    return null
  }

  /**
   * Cache search results
   */
  async cacheResults(
    query: SearchQuery, 
    results: SearchResult[], 
    searchTime: number,
    searchType: 'lexical' | 'semantic' | 'hybrid'
  ): Promise<void> {
    const queryHash = this.hashQuery(query, searchType)
    const now = Date.now()

    const cacheEntry: SearchCacheEntry = {
      queryHash,
      queryText: query.text || '',
      results,
      searchType,
      metadata: {
        resultCount: results.length,
        searchTime,
        timestamp: now,
        accessCount: 1,
        lastAccessed: now
      }
    }

    // Store in memory cache
    this.memoryCache.set(queryHash, cacheEntry)

    // Manage memory cache size
    await this.evictFromMemoryCache()

    // Store in database cache for persistence
    await this.storeToDatabaseCache(cacheEntry)
  }

  /**
   * Invalidate cache entries for specific chat or message
   */
  async invalidateCache(chatId?: string, messageId?: string): Promise<void> {
    try {
      let condition = '1=1'
      const params: any[] = []

      if (chatId) {
        condition += ' AND (query_text LIKE ? OR results LIKE ?)'
        params.push(`%chatId":"${chatId}"%`, `%"chatId":"${chatId}"%`)
      }

      if (messageId) {
        condition += ' AND results LIKE ?'
        params.push(`%"id":"${messageId}"%`)
      }

      // Remove from database
      this.db.prepare(`DELETE FROM search_cache WHERE ${condition}`).run(...params)

      // Remove from memory cache
      if (chatId || messageId) {
        for (const [hash, entry] of this.memoryCache) {
          if (this.shouldInvalidateEntry(entry, chatId, messageId)) {
            this.memoryCache.delete(hash)
            this.accessOrder.delete(hash)
          }
        }
      }

    } catch (error) {
      console.error('Failed to invalidate cache:', error)
    }
  }

  /**
   * Clear all cache data
   */
  async clearCache(): Promise<void> {
    try {
      this.memoryCache.clear()
      this.accessOrder.clear()
      this.db.exec('DELETE FROM search_cache')
      this.resetStats()
    } catch (error) {
      console.error('Failed to clear cache:', error)
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    const hitRate = this.cacheStats.totalRequests > 0 
      ? (this.cacheStats.hits / this.cacheStats.totalRequests) * 100 
      : 0

    const memoryUsage = this.calculateMemoryUsage()
    
    const timestamps = Array.from(this.memoryCache.values())
      .map(entry => entry.metadata.timestamp)
    
    return {
      totalEntries: this.memoryCache.size,
      hitRate,
      avgSearchTime: this.calculateAverageSearchTime(),
      memoryUsage,
      oldestEntry: Math.min(...timestamps, Date.now()),
      newestEntry: Math.max(...timestamps, 0)
    }
  }

  /**
   * Optimize cache performance
   */
  async optimizeCache(): Promise<void> {
    try {
      // Remove expired entries
      await this.cleanupExpiredEntries()
      
      // Optimize database cache
      await this.optimizeDatabaseCache()
      
      // Update statistics
      await this.updateCacheStats()
      
      console.log('Search cache optimized')
    } catch (error) {
      console.error('Failed to optimize cache:', error)
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }
  }

  // Private methods

  private hashQuery(query: SearchQuery, searchType: string): string {
    const queryString = JSON.stringify({
      text: query.text || '',
      filters: query.filters || {},
      options: query.options || {},
      type: searchType
    })
    
    return this.createHash(queryString)
  }

  private createHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16)
  }

  private isValidCacheEntry(entry: SearchCacheEntry): boolean {
    const age = Date.now() - entry.metadata.timestamp
    return age < this.CACHE_TTL
  }

  private updateAccessInfo(queryHash: string, entry: SearchCacheEntry): void {
    entry.metadata.accessCount++
    entry.metadata.lastAccessed = Date.now()
    this.accessOrder.set(queryHash, ++this.accessCounter)

    // Update database if entry is frequently accessed
    if (entry.metadata.accessCount >= this.MIN_ACCESS_FOR_PERSISTENCE) {
      this.updateDatabaseCacheAccess(queryHash, entry.metadata)
    }
  }

  private async getFromDatabaseCache(queryHash: string): Promise<SearchCacheEntry | null> {
    try {
      const row = this.db.prepare(`
        SELECT query_text, search_type, results, result_count, search_time_ms, 
               created_at, last_accessed, access_count
        FROM search_cache 
        WHERE query_hash = ?
      `).get(queryHash) as {
        query_text: string
        search_type: string
        results: Buffer
        result_count: number
        search_time_ms: number
        created_at: string
        last_accessed: string
        access_count: number
      } | undefined

      if (!row) return null

      const results = this.deserializeResults(row.results)
      
      return {
        queryHash,
        queryText: row.query_text,
        results,
        searchType: row.search_type as 'lexical' | 'semantic' | 'hybrid',
        metadata: {
          resultCount: row.result_count,
          searchTime: row.search_time_ms,
          timestamp: new Date(row.created_at).getTime(),
          accessCount: row.access_count,
          lastAccessed: new Date(row.last_accessed).getTime()
        }
      }
    } catch (error) {
      console.error('Failed to get from database cache:', error)
      return null
    }
  }

  private async storeToDatabaseCache(entry: SearchCacheEntry): Promise<void> {
    try {
      const resultsBlob = this.serializeResults(entry.results)
      
      this.db.prepare(`
        INSERT OR REPLACE INTO search_cache 
        (query_hash, query_text, search_type, results, result_count, search_time_ms, 
         created_at, last_accessed, access_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        entry.queryHash,
        entry.queryText,
        entry.searchType,
        resultsBlob,
        entry.metadata.resultCount,
        entry.metadata.searchTime,
        new Date(entry.metadata.timestamp).toISOString(),
        new Date(entry.metadata.lastAccessed).toISOString(),
        entry.metadata.accessCount
      )
    } catch (error) {
      console.error('Failed to store to database cache:', error)
    }
  }

  private async evictFromMemoryCache(): Promise<void> {
    if (this.memoryCache.size <= this.MAX_MEMORY_ENTRIES) {
      return
    }

    // Sort by access order (LRU)
    const entries = Array.from(this.memoryCache.entries())
      .map(([hash, entry]) => ({
        hash,
        entry,
        accessOrder: this.accessOrder.get(hash) || 0
      }))
      .sort((a, b) => a.accessOrder - b.accessOrder)

    // Remove least recently used entries
    const toRemove = Math.floor(this.MAX_MEMORY_ENTRIES * 0.2) // Remove 20%
    for (let i = 0; i < toRemove; i++) {
      const { hash } = entries[i]
      this.memoryCache.delete(hash)
      this.accessOrder.delete(hash)
    }
  }

  private shouldInvalidateEntry(entry: SearchCacheEntry, chatId?: string, messageId?: string): boolean {
    if (!chatId && !messageId) return true

    const resultsString = JSON.stringify(entry.results)
    
    if (chatId && resultsString.includes(`"chatId":"${chatId}"`)) {
      return true
    }

    if (messageId && resultsString.includes(`"id":"${messageId}"`)) {
      return true
    }

    return false
  }

  private calculateMemoryUsage(): number {
    let totalSize = 0
    for (const entry of this.memoryCache.values()) {
      // Rough estimation of memory usage
      totalSize += JSON.stringify(entry).length * 2 // UTF-16 encoding
    }
    return totalSize
  }

  private calculateAverageSearchTime(): number {
    const entries = Array.from(this.memoryCache.values())
    if (entries.length === 0) return 0

    const totalTime = entries.reduce((sum, entry) => sum + entry.metadata.searchTime, 0)
    return totalTime / entries.length
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredEntries().catch(console.error)
    }, this.CLEANUP_INTERVAL)
  }

  private async cleanupExpiredEntries(): Promise<void> {
    const now = Date.now()
    const expiredHashes: string[] = []

    // Find expired entries in memory
    for (const [hash, entry] of this.memoryCache) {
      if (now - entry.metadata.timestamp > this.CACHE_TTL) {
        expiredHashes.push(hash)
      }
    }

    // Remove from memory
    for (const hash of expiredHashes) {
      this.memoryCache.delete(hash)
      this.accessOrder.delete(hash)
    }

    // Remove expired entries from database
    const expiredTime = new Date(now - this.CACHE_TTL).toISOString()
    this.db.prepare('DELETE FROM search_cache WHERE created_at < ?').run(expiredTime)
  }

  private async optimizeDatabaseCache(): Promise<void> {
    // Remove least accessed entries if database cache is too large
    const count = this.db.prepare('SELECT COUNT(*) as count FROM search_cache').get() as { count: number }
    
    if (count.count > this.MAX_DB_ENTRIES) {
      const toRemove = count.count - this.MAX_DB_ENTRIES
      this.db.prepare(`
        DELETE FROM search_cache 
        WHERE query_hash IN (
          SELECT query_hash FROM search_cache 
          ORDER BY access_count ASC, last_accessed ASC 
          LIMIT ?
        )
      `).run(toRemove)
    }
  }

  private updateDatabaseCacheAccess(queryHash: string, metadata: any): void {
    try {
      this.db.prepare(`
        UPDATE search_cache 
        SET access_count = ?, last_accessed = ?
        WHERE query_hash = ?
      `).run(
        metadata.accessCount,
        new Date(metadata.lastAccessed).toISOString(),
        queryHash
      )
    } catch (error) {
      // Silent failure for non-critical operation
    }
  }

  private async updateCacheStats(): Promise<void> {
    try {
      const hitRate = this.cacheStats.totalRequests > 0 
        ? (this.cacheStats.hits / this.cacheStats.totalRequests) * 100 
        : 0

      this.db.prepare(`
        INSERT INTO cache_stats 
        (cache_hits, cache_misses, total_requests, hit_rate, avg_search_time, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        this.cacheStats.hits,
        this.cacheStats.misses,
        this.cacheStats.totalRequests,
        hitRate,
        this.calculateAverageSearchTime(),
        new Date().toISOString()
      )
    } catch (error) {
      // Silent failure for non-critical operation
    }
  }

  private resetStats(): void {
    this.cacheStats = {
      hits: 0,
      misses: 0,
      totalRequests: 0
    }
    this.accessCounter = 0
  }

  private serializeResults(results: SearchResult[]): Buffer {
    const jsonString = JSON.stringify(results, (key, value) => {
      // Convert Date objects to ISO strings
      if (value instanceof Date) {
        return value.toISOString()
      }
      return value
    })
    
    return Buffer.from(jsonString, 'utf-8')
  }

  private deserializeResults(buffer: Buffer): SearchResult[] {
    const jsonString = buffer.toString('utf-8')
    
    return JSON.parse(jsonString, (key, value) => {
      // Convert ISO strings back to Date objects
      if (key === 'timestamp' && typeof value === 'string') {
        return new Date(value)
      }
      return value
    })
  }
}