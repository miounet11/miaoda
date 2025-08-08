import Database from 'better-sqlite3'
import { logger } from '../utils/Logger'

export interface DatabasePerformanceMetrics {
  queryCount: number
  totalQueryTime: number
  averageQueryTime: number
  slowQueries: Array<{
    sql: string
    duration: number
    timestamp: number
  }>
  cacheHitRate: number
  indexUsage: Record<string, number>
}

export interface OptimizationSettings {
  enableQueryCache: boolean
  maxCacheSize: number
  slowQueryThreshold: number
  enablePragmaOptimizations: boolean
  enableConnectionPooling: boolean
  vacuumInterval: number // in milliseconds
}

/**
 * Advanced database performance optimizer with intelligent caching
 * and query analysis for MiaoDa Chat SQLite database
 */
export class DatabasePerformanceOptimizer {
  private db: Database.Database
  private queryCache = new Map<string, { result: any; timestamp: number; hits: number }>()
  private queryMetrics = new Map<string, { count: number; totalTime: number; slowQueries: Array<{ duration: number; timestamp: number }> }>()
  private settings: OptimizationSettings
  private vacuumTimer: NodeJS.Timeout | null = null
  private metricsInterval: NodeJS.Timeout | null = null
  
  constructor(db: Database.Database, settings: Partial<OptimizationSettings> = {}) {
    this.db = db
    this.settings = {
      enableQueryCache: true,
      maxCacheSize: 1000,
      slowQueryThreshold: 100, // ms
      enablePragmaOptimizations: true,
      enableConnectionPooling: true,
      vacuumInterval: 24 * 60 * 60 * 1000, // 24 hours
      ...settings
    }
    
    this.initialize()
  }

  private initialize(): void {
    logger.info('Initializing database performance optimizer', 'DatabaseOptimizer', this.settings)
    
    if (this.settings.enablePragmaOptimizations) {
      this.applyPragmaOptimizations()
    }
    
    this.setupPeriodicMaintenance()
    this.startMetricsCollection()
  }

  /**
   * Apply SQLite pragma optimizations for better performance
   */
  private applyPragmaOptimizations(): void {
    try {
      // Journal mode for better concurrency
      this.db.pragma('journal_mode = WAL')
      
      // Synchronous mode for better performance (with some safety trade-off)
      this.db.pragma('synchronous = NORMAL')
      
      // Cache size (negative value = KB, positive = pages)
      this.db.pragma('cache_size = -64000') // 64MB cache
      
      // Temp store in memory for better performance
      this.db.pragma('temp_store = MEMORY')
      
      // MMAP size for memory-mapped I/O (256MB)
      this.db.pragma('mmap_size = 268435456')
      
      // Enable query planner optimizations
      this.db.pragma('optimize')
      
      // Auto vacuum for better space management
      this.db.pragma('auto_vacuum = INCREMENTAL')
      
      // Page size optimization (larger pages for better I/O)
      // Note: This only affects new databases
      this.db.pragma('page_size = 4096')
      
      logger.info('Applied SQLite pragma optimizations', 'DatabaseOptimizer')
    } catch (error) {
      logger.error('Failed to apply pragma optimizations', 'DatabaseOptimizer', { error })
    }
  }

  /**
   * Enhanced query execution with caching and performance monitoring
   */
  public executeQuery<T = any>(sql: string, params: any[] = [], options: { 
    skipCache?: boolean
    cacheKey?: string
    cacheExpiry?: number 
  } = {}): T {
    const startTime = performance.now()
    const cacheKey = options.cacheKey || this.generateCacheKey(sql, params)
    
    // Try cache first
    if (this.settings.enableQueryCache && !options.skipCache) {
      const cached = this.queryCache.get(cacheKey)
      if (cached && this.isCacheValid(cached, options.cacheExpiry)) {
        cached.hits++
        this.recordMetrics(sql, performance.now() - startTime, true)
        return cached.result as T
      }
    }
    
    // Execute query
    let result: T
    try {
      const stmt = this.db.prepare(sql)
      
      // Choose appropriate execution method
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        result = params.length > 0 ? stmt.all(...params) as T : stmt.all() as T
      } else {
        result = params.length > 0 ? stmt.run(...params) as T : stmt.run() as T
      }
      
      // Cache the result if it's a SELECT query
      if (this.settings.enableQueryCache && !options.skipCache && sql.trim().toUpperCase().startsWith('SELECT')) {
        this.cacheResult(cacheKey, result, options.cacheExpiry)
      }
      
    } catch (error) {
      logger.error('Query execution failed', 'DatabaseOptimizer', { sql, params, error })
      throw error
    }
    
    const duration = performance.now() - startTime
    this.recordMetrics(sql, duration, false)
    
    return result
  }

  /**
   * Batch query execution for better performance
   */
  public executeBatch<T = any>(queries: Array<{ sql: string; params?: any[] }>): T[] {
    const startTime = performance.now()
    const results: T[] = []
    
    // Use transaction for better performance
    const transaction = this.db.transaction(() => {
      for (const query of queries) {
        const result = this.executeQuery<T>(query.sql, query.params || [], { skipCache: true })
        results.push(result)
      }
    })
    
    try {
      transaction()
    } catch (error) {
      logger.error('Batch execution failed', 'DatabaseOptimizer', { error, queryCount: queries.length })
      throw error
    }
    
    const duration = performance.now() - startTime
    logger.debug('Batch execution completed', 'DatabaseOptimizer', { 
      queryCount: queries.length, 
      duration: Math.round(duration) 
    })
    
    return results
  }

  /**
   * Optimized prepared statement management
   */
  public createOptimizedStatement<T = any>(sql: string) {
    const stmt = this.db.prepare(sql)
    const originalAll = stmt.all.bind(stmt)
    const originalGet = stmt.get.bind(stmt)
    const originalRun = stmt.run.bind(stmt)
    
    // Wrap methods with performance monitoring
    return {
      all: (...params: any[]): T[] => {
        const startTime = performance.now()
        const result = originalAll(...params) as T[]
        this.recordMetrics(sql, performance.now() - startTime, false)
        return result
      },
      get: (...params: any[]): T | undefined => {
        const startTime = performance.now()
        const result = originalGet(...params) as T | undefined
        this.recordMetrics(sql, performance.now() - startTime, false)
        return result
      },
      run: (...params: any[]): Database.RunResult => {
        const startTime = performance.now()
        const result = originalRun(...params)
        this.recordMetrics(sql, performance.now() - startTime, false)
        return result
      },
      finalize: () => {
        if ('finalize' in stmt) {
          (stmt as any).finalize()
        }
      }
    }
  }

  /**
   * Intelligent index analysis and recommendations
   */
  public analyzeIndexUsage(): Promise<{
    recommendations: string[]
    unusedIndexes: string[]
    slowQueries: Array<{ sql: string; duration: number; recommendation: string }>
  }> {
    return new Promise((resolve) => {
      const recommendations: string[] = []
      const unusedIndexes: string[] = []
      const slowQueries: Array<{ sql: string; duration: number; recommendation: string }> = []
      
      try {
        // Get all indexes
        // const _indexes = this.db.prepare("SELECT name, sql FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_%'").all() as Array<{ name: string; sql: string }>
        
        // Get query plan for slow queries
        for (const [sql, metrics] of this.queryMetrics.entries()) {
          if (metrics.totalTime / metrics.count > this.settings.slowQueryThreshold) {
            try {
              const plan = this.db.prepare(`EXPLAIN QUERY PLAN ${sql}`).all()
              const hasTableScan = plan.some((step: any) => step.detail?.includes('SCAN TABLE'))
              
              if (hasTableScan) {
                slowQueries.push({
                  sql,
                  duration: metrics.totalTime / metrics.count,
                  recommendation: 'Consider adding an index for this query'
                })
              }
            } catch {
              // Query plan analysis failed, skip
            }
          }
        }
        
        // Analyze FTS table performance
        const ftsStats = this.analyzeFTSPerformance()
        if (ftsStats.needsOptimization) {
          recommendations.push('FTS index needs optimization - run OPTIMIZE command')
        }
        
        // Check for missing compound indexes
        const compoundIndexRecommendations = this.analyzeCompoundIndexes()
        recommendations.push(...compoundIndexRecommendations)
        
      } catch (error) {
        logger.error('Index analysis failed', 'DatabaseOptimizer', { error })
      }
      
      resolve({ recommendations, unusedIndexes, slowQueries })
    })
  }

  /**
   * Full-text search optimization
   */
  private analyzeFTSPerformance(): { needsOptimization: boolean; stats: any } {
    try {
      const ftsIntegrityCheck = this.db.prepare("INSERT INTO messages_fts(messages_fts) VALUES('integrity-check')").run()
      
      // Check FTS statistics
      // const _ftsStats = this.db.prepare("SELECT * FROM messages_fts WHERE messages_fts MATCH 'optimize'").all()
      
      return {
        needsOptimization: false, // Simplified check
        stats: { integrity: ftsIntegrityCheck.changes > 0 }
      }
    } catch (error) {
      return { needsOptimization: true, stats: { error: error } }
    }
  }

  /**
   * Analyze and recommend compound indexes
   */
  private analyzeCompoundIndexes(): string[] {
    const recommendations: string[] = []
    
    // Common query patterns that benefit from compound indexes
    const commonPatterns = [
      {
        table: 'messages',
        columns: ['chat_id', 'created_at'],
        reason: 'Frequently queried together for message retrieval'
      },
      {
        table: 'chats',
        columns: ['archived', 'updated_at'],
        reason: 'Common filter and sort combination'
      },
      {
        table: 'search_stats',
        columns: ['created_at', 'query'],
        reason: 'Time-based query analysis'
      }
    ]
    
    for (const pattern of commonPatterns) {
      const indexName = `idx_${pattern.table}_${pattern.columns.join('_')}`
      
      // Check if index exists
      const existingIndex = this.db.prepare(
        "SELECT name FROM sqlite_master WHERE type = 'index' AND name = ?"
      ).get(indexName)
      
      if (!existingIndex) {
        recommendations.push(
          `CREATE INDEX ${indexName} ON ${pattern.table}(${pattern.columns.join(', ')}) -- ${pattern.reason}`
        )
      }
    }
    
    return recommendations
  }

  /**
   * Memory and cache management
   */
  public optimizeMemoryUsage(): void {
    // Clear expired cache entries
    this.cleanupCache()
    
    // Free unused database pages
    this.db.pragma('incremental_vacuum')
    
    // Optimize query planner statistics
    this.db.pragma('optimize')
    
    logger.info('Memory optimization completed', 'DatabaseOptimizer', {
      cacheSize: this.queryCache.size
    })
  }

  /**
   * Generate cache key for queries
   */
  private generateCacheKey(sql: string, params: any[]): string {
    return `${sql}:${JSON.stringify(params)}`
  }

  /**
   * Check if cache entry is still valid
   */
  private isCacheValid(cached: { timestamp: number }, expiry?: number): boolean {
    const maxAge = expiry || 5 * 60 * 1000 // 5 minutes default
    return Date.now() - cached.timestamp < maxAge
  }

  /**
   * Cache query result
   */
  private cacheResult(key: string, result: any, _expiry?: number): void {
    // Clean cache if it's getting too large
    if (this.queryCache.size >= this.settings.maxCacheSize) {
      this.cleanupCache()
    }
    
    this.queryCache.set(key, {
      result: JSON.parse(JSON.stringify(result)), // Deep clone
      timestamp: Date.now(),
      hits: 0
    })
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now()
    const maxAge = 10 * 60 * 1000 // 10 minutes
    
    for (const [key, cached] of this.queryCache.entries()) {
      if (now - cached.timestamp > maxAge) {
        this.queryCache.delete(key)
      }
    }
    
    // If still too large, remove least frequently used items
    if (this.queryCache.size > this.settings.maxCacheSize * 0.8) {
      const entries = Array.from(this.queryCache.entries())
        .sort(([, a], [, b]) => a.hits - b.hits)
      
      const toRemove = Math.floor(this.settings.maxCacheSize * 0.3)
      for (let i = 0; i < toRemove && i < entries.length; i++) {
        this.queryCache.delete(entries[i][0])
      }
    }
  }

  /**
   * Record query metrics
   */
  private recordMetrics(sql: string, duration: number, fromCache: boolean): void {
    const cleanSql = sql.trim().substring(0, 100)
    
    if (!this.queryMetrics.has(cleanSql)) {
      this.queryMetrics.set(cleanSql, {
        count: 0,
        totalTime: 0,
        slowQueries: []
      })
    }
    
    const metrics = this.queryMetrics.get(cleanSql)!
    metrics.count++
    
    if (!fromCache) {
      metrics.totalTime += duration
      
      if (duration > this.settings.slowQueryThreshold) {
        metrics.slowQueries.push({
          duration,
          timestamp: Date.now()
        })
        
        logger.warn('Slow query detected', 'DatabaseOptimizer', {
          sql: cleanSql,
          duration: Math.round(duration),
          threshold: this.settings.slowQueryThreshold
        })
      }
    }
  }

  /**
   * Get comprehensive performance metrics
   */
  public getPerformanceMetrics(): DatabasePerformanceMetrics {
    let totalQueries = 0
    let totalTime = 0
    const slowQueries: Array<{ sql: string; duration: number; timestamp: number }> = []
    const indexUsage: Record<string, number> = {}
    
    for (const [sql, metrics] of this.queryMetrics.entries()) {
      totalQueries += metrics.count
      totalTime += metrics.totalTime
      
      // Collect slow queries
      for (const slow of metrics.slowQueries) {
        slowQueries.push({
          sql,
          duration: slow.duration,
          timestamp: slow.timestamp
        })
      }
      
      // Track index usage patterns
      if (sql.includes('INDEX')) {
        indexUsage[sql] = metrics.count
      }
    }
    
    const cacheHits = Array.from(this.queryCache.values()).reduce((sum, cached) => sum + cached.hits, 0)
    const cacheHitRate = totalQueries > 0 ? (cacheHits / totalQueries) * 100 : 0
    
    return {
      queryCount: totalQueries,
      totalQueryTime: totalTime,
      averageQueryTime: totalQueries > 0 ? totalTime / totalQueries : 0,
      slowQueries: slowQueries.slice(-50), // Last 50 slow queries
      cacheHitRate,
      indexUsage
    }
  }

  /**
   * Setup periodic maintenance tasks
   */
  private setupPeriodicMaintenance(): void {
    // Periodic vacuum
    if (this.settings.vacuumInterval > 0) {
      this.vacuumTimer = setInterval(() => {
        try {
          logger.info('Starting periodic database vacuum', 'DatabaseOptimizer')
          this.db.pragma('incremental_vacuum')
          this.db.pragma('optimize')
          logger.info('Periodic database maintenance completed', 'DatabaseOptimizer')
        } catch (error) {
          logger.error('Periodic vacuum failed', 'DatabaseOptimizer', { error })
        }
      }, this.settings.vacuumInterval)
    }
  }

  /**
   * Start collecting performance metrics
   */
  private startMetricsCollection(): void {
    // Collect metrics every 5 minutes
    this.metricsInterval = setInterval(() => {
      const metrics = this.getPerformanceMetrics()
      
      // Log summary metrics
      if (metrics.queryCount > 0) {
        logger.debug('Database performance metrics', 'DatabaseOptimizer', {
          queries: metrics.queryCount,
          avgTime: Math.round(metrics.averageQueryTime * 100) / 100,
          cacheHitRate: Math.round(metrics.cacheHitRate * 100) / 100,
          slowQueries: metrics.slowQueries.length
        })
      }
      
      // Clean up old metrics
      this.cleanupMetrics()
    }, 5 * 60 * 1000)
  }

  /**
   * Clean up old metrics to prevent memory leaks
   */
  private cleanupMetrics(): void {
    const maxMetricsAge = 24 * 60 * 60 * 1000 // 24 hours
    const now = Date.now()
    
    for (const [sql, metrics] of this.queryMetrics.entries()) {
      // Remove old slow queries
      metrics.slowQueries = metrics.slowQueries.filter(
        query => now - query.timestamp < maxMetricsAge
      )
      
      // Remove metrics for rarely used queries
      if (metrics.count < 5 && metrics.slowQueries.length === 0) {
        this.queryMetrics.delete(sql)
      }
    }
  }

  /**
   * Force optimization of database
   */
  public async forceOptimize(): Promise<void> {
    logger.info('Starting forced database optimization', 'DatabaseOptimizer')
    
    try {
      // Clear caches
      this.queryCache.clear()
      
      // Run VACUUM to reclaim space
      this.db.exec('VACUUM')
      
      // Optimize query planner
      this.db.pragma('optimize')
      
      // Optimize FTS if exists
      try {
        this.db.prepare("INSERT INTO messages_fts(messages_fts) VALUES('optimize')").run()
      } catch {
        // FTS optimization failed, continue
      }
      
      // Analyze tables for better query plans
      this.db.exec('ANALYZE')
      
      logger.info('Forced database optimization completed', 'DatabaseOptimizer')
    } catch (error) {
      logger.error('Forced optimization failed', 'DatabaseOptimizer', { error })
      throw error
    }
  }

  /**
   * Cleanup and destroy optimizer
   */
  public destroy(): void {
    if (this.vacuumTimer) {
      clearInterval(this.vacuumTimer)
      this.vacuumTimer = null
    }
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval)
      this.metricsInterval = null
    }
    
    this.queryCache.clear()
    this.queryMetrics.clear()
    
    logger.info('Database performance optimizer destroyed', 'DatabaseOptimizer')
  }
}

/**
 * Global performance optimizer instance factory
 */
export function createDatabasePerformanceOptimizer(
  db: Database.Database, 
  settings?: Partial<OptimizationSettings>
): DatabasePerformanceOptimizer {
  return new DatabasePerformanceOptimizer(db, settings)
}