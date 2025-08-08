import { Database } from 'better-sqlite3'
import { BaseDatabaseService } from './BaseDatabaseService'
import { nanoid } from 'nanoid'

/**
 * Performance Service for intelligent caching, background sync, and optimization
 */

interface CacheEntry<T = any> {
  key: string
  value: T
  createdAt: Date
  lastAccessed: Date
  accessCount: number
  expiresAt?: Date
  size: number // in bytes
  metadata: Record<string, any>
}

interface SyncTask {
  id: string
  type: 'message_sync' | 'context_sync' | 'search_index' | 'backup' | 'cleanup'
  priority: 'low' | 'medium' | 'high' | 'critical'
  payload: any
  status: 'pending' | 'processing' | 'completed' | 'failed'
  scheduledAt: Date
  processedAt?: Date
  completedAt?: Date
  error?: string
  retryCount: number
  maxRetries: number
}

interface PerformanceMetrics {
  timestamp: Date
  metric: string
  value: number
  unit: string
  category: 'database' | 'network' | 'memory' | 'cpu' | 'storage'
  metadata?: Record<string, any>
}

interface OptimizationRule {
  id: string
  name: string
  condition: string
  action: string
  priority: number
  enabled: boolean
  triggerCount: number
  lastTriggered?: Date
  effectiveness: number
}

export class PerformanceService extends BaseDatabaseService {
  private cache: Map<string, CacheEntry> = new Map()
  private maxCacheSize: number = 100 * 1024 * 1024 // 100MB
  private currentCacheSize: number = 0
  private syncQueue: Map<string, SyncTask> = new Map()
  private isProcessingSyncQueue: boolean = false
  private performanceMonitor: NodeJS.Timeout | null = null

  constructor(db: Database) {
    super(db)
    this.initializeTables()
    this.initializeCache()
    this.startPerformanceMonitoring()
    this.startSyncProcessing()
  }

  private initializeTables(): void {
    try {
      // Cache entries table (persistent cache)
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS cache_entries (
          key TEXT PRIMARY KEY,
          value BLOB NOT NULL,
          value_type TEXT NOT NULL,
          created_at TEXT NOT NULL,
          last_accessed TEXT NOT NULL,
          access_count INTEGER DEFAULT 1,
          expires_at TEXT,
          size INTEGER NOT NULL,
          metadata TEXT DEFAULT '{}',
          tags TEXT DEFAULT '[]'
        );

        CREATE INDEX IF NOT EXISTS idx_cache_entries_accessed ON cache_entries(last_accessed);
        CREATE INDEX IF NOT EXISTS idx_cache_entries_expires ON cache_entries(expires_at);
        CREATE INDEX IF NOT EXISTS idx_cache_entries_size ON cache_entries(size);
      `)

      // Background sync tasks
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS sync_tasks (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
          payload TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
          scheduled_at TEXT NOT NULL,
          processed_at TEXT,
          completed_at TEXT,
          error TEXT,
          retry_count INTEGER DEFAULT 0,
          max_retries INTEGER DEFAULT 3,
          metadata TEXT DEFAULT '{}'
        );

        CREATE INDEX IF NOT EXISTS idx_sync_tasks_status ON sync_tasks(status);
        CREATE INDEX IF NOT EXISTS idx_sync_tasks_priority ON sync_tasks(priority);
        CREATE INDEX IF NOT EXISTS idx_sync_tasks_scheduled ON sync_tasks(scheduled_at);
      `)

      // Performance metrics
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS performance_metrics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp TEXT NOT NULL,
          metric TEXT NOT NULL,
          value REAL NOT NULL,
          unit TEXT NOT NULL,
          category TEXT NOT NULL CHECK (category IN ('database', 'network', 'memory', 'cpu', 'storage')),
          metadata TEXT DEFAULT '{}',
          created_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp);
        CREATE INDEX IF NOT EXISTS idx_performance_metrics_metric ON performance_metrics(metric);
        CREATE INDEX IF NOT EXISTS idx_performance_metrics_category ON performance_metrics(category);
      `)

      // Optimization rules
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS optimization_rules (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          condition_expr TEXT NOT NULL,
          action_expr TEXT NOT NULL,
          priority INTEGER DEFAULT 1,
          enabled INTEGER DEFAULT 1,
          trigger_count INTEGER DEFAULT 0,
          last_triggered TEXT,
          effectiveness REAL DEFAULT 0.5,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_optimization_rules_priority ON optimization_rules(priority);
        CREATE INDEX IF NOT EXISTS idx_optimization_rules_enabled ON optimization_rules(enabled);
      `)

      // Offline queue for when network is unavailable
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS offline_queue (
          id TEXT PRIMARY KEY,
          operation_type TEXT NOT NULL,
          table_name TEXT NOT NULL,
          operation_data TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          synced INTEGER DEFAULT 0
        );

        CREATE INDEX IF NOT EXISTS idx_offline_queue_synced ON offline_queue(synced);
        CREATE INDEX IF NOT EXISTS idx_offline_queue_timestamp ON offline_queue(timestamp);
      `)

    } catch (error) {
      throw new Error(`Failed to initialize performance service tables: ${error}`)
    }
  }

  /**
   * Initialize cache from persistent storage
   */
  private initializeCache(): void {
    try {
      const entries = this.db.prepare(`
        SELECT * FROM cache_entries 
        WHERE expires_at IS NULL OR expires_at > ?
        ORDER BY last_accessed DESC
        LIMIT 1000
      `).all(new Date().toISOString()) as any[]

      entries.forEach(entry => {
        const cacheEntry: CacheEntry = {
          key: entry.key,
          value: this.deserializeCacheValue(entry.value, entry.value_type),
          createdAt: new Date(entry.created_at),
          lastAccessed: new Date(entry.last_accessed),
          accessCount: entry.access_count,
          expiresAt: entry.expires_at ? new Date(entry.expires_at) : undefined,
          size: entry.size,
          metadata: JSON.parse(entry.metadata || '{}')
        }

        this.cache.set(entry.key, cacheEntry)
        this.currentCacheSize += entry.size
      })

      console.log(`Initialized cache with ${entries.length} entries (${Math.round(this.currentCacheSize / 1024 / 1024)}MB)`)
    } catch (error) {
      console.error('Failed to initialize cache:', error)
    }
  }

  /**
   * Get value from cache with intelligent retrieval
   */
  async get<T>(key: string, fallback?: () => Promise<T>): Promise<T | null> {
    try {
      // Check memory cache first
      const cached = this.cache.get(key)
      if (cached && (!cached.expiresAt || cached.expiresAt > new Date())) {
        // Update access stats
        cached.lastAccessed = new Date()
        cached.accessCount++
        
        // Update in persistent cache
        this.updateCacheAccess(key)
        
        return cached.value as T
      }

      // If fallback is provided and cache miss, execute fallback
      if (fallback) {
        const value = await fallback()
        await this.set(key, value, { ttl: 3600 }) // Default 1 hour TTL
        return value
      }

      return null
    } catch (error) {
      console.error('Cache get error:', error)
      return fallback ? await fallback() : null
    }
  }

  /**
   * Set value in cache with intelligent eviction
   */
  async set<T>(
    key: string, 
    value: T, 
    options: {
      ttl?: number // seconds
      tags?: string[]
      metadata?: Record<string, any>
    } = {}
  ): Promise<void> {
    try {
      const now = new Date()
      const expiresAt = options.ttl ? new Date(now.getTime() + options.ttl * 1000) : undefined
      const serializedValue = this.serializeCacheValue(value)
      const size = this.calculateSize(serializedValue)

      // Check if we need to evict entries
      await this.ensureCacheSpace(size)

      const cacheEntry: CacheEntry<T> = {
        key,
        value,
        createdAt: now,
        lastAccessed: now,
        accessCount: 1,
        expiresAt,
        size,
        metadata: options.metadata || {}
      }

      // Update memory cache
      this.cache.set(key, cacheEntry)
      this.currentCacheSize += size

      // Update persistent cache
      this.db.prepare(`
        INSERT OR REPLACE INTO cache_entries 
        (key, value, value_type, created_at, last_accessed, expires_at, size, metadata, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        key,
        serializedValue.data,
        serializedValue.type,
        now.toISOString(),
        now.toISOString(),
        expiresAt?.toISOString() || null,
        size,
        JSON.stringify(options.metadata || {}),
        JSON.stringify(options.tags || [])
      )

    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  /**
   * Invalidate cache entries by key or tags
   */
  async invalidate(keyOrPattern: string | RegExp, tags?: string[]): Promise<void> {
    try {
      if (typeof keyOrPattern === 'string') {
        // Direct key invalidation
        this.cache.delete(keyOrPattern)
        this.db.prepare('DELETE FROM cache_entries WHERE key = ?').run(keyOrPattern)
      } else {
        // Pattern-based invalidation
        const keysToDelete: string[] = []
        this.cache.forEach((_, key) => {
          if (keyOrPattern.test(key)) {
            keysToDelete.push(key)
          }
        })

        keysToDelete.forEach(key => {
          const entry = this.cache.get(key)
          if (entry) {
            this.currentCacheSize -= entry.size
            this.cache.delete(key)
          }
        })

        // Delete from persistent cache
        const placeholders = keysToDelete.map(() => '?').join(',')
        if (placeholders) {
          this.db.prepare(`DELETE FROM cache_entries WHERE key IN (${placeholders})`).run(...keysToDelete)
        }
      }

      // Tag-based invalidation
      if (tags && tags.length > 0) {
        const tagConditions = tags.map(() => 'tags LIKE ?').join(' OR ')
        const tagParams = tags.map(tag => `%"${tag}"%`)
        
        const entries = this.db.prepare(`
          SELECT key FROM cache_entries WHERE ${tagConditions}
        `).all(...tagParams) as Array<{ key: string }>

        entries.forEach(entry => {
          const cached = this.cache.get(entry.key)
          if (cached) {
            this.currentCacheSize -= cached.size
            this.cache.delete(entry.key)
          }
        })

        this.db.prepare(`DELETE FROM cache_entries WHERE ${tagConditions}`).run(...tagParams)
      }

    } catch (error) {
      console.error('Cache invalidation error:', error)
    }
  }

  /**
   * Schedule background sync task
   */
  async scheduleSync(
    type: SyncTask['type'],
    payload: any,
    priority: SyncTask['priority'] = 'medium',
    delay: number = 0
  ): Promise<string> {
    try {
      const id = nanoid()
      const scheduledAt = new Date(Date.now() + delay * 1000)

      const task: SyncTask = {
        id,
        type,
        priority,
        payload,
        status: 'pending',
        scheduledAt,
        retryCount: 0,
        maxRetries: 3
      }

      this.syncQueue.set(id, task)

      // Save to persistent storage
      this.db.prepare(`
        INSERT INTO sync_tasks 
        (id, type, priority, payload, status, scheduled_at, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        type,
        priority,
        JSON.stringify(payload),
        'pending',
        scheduledAt.toISOString(),
        '{}'
      )

      return id
    } catch (error) {
      console.error('Failed to schedule sync task:', error)
      throw error
    }
  }

  /**
   * Process sync queue in the background
   */
  private async processSyncQueue(): Promise<void> {
    if (this.isProcessingSyncQueue) return

    this.isProcessingSyncQueue = true

    try {
      // Load pending tasks from database
      const pendingTasks = this.db.prepare(`
        SELECT * FROM sync_tasks 
        WHERE status = 'pending' AND scheduled_at <= ?
        ORDER BY 
          CASE priority 
            WHEN 'critical' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3 
            WHEN 'low' THEN 4 
          END,
          scheduled_at ASC
        LIMIT 10
      `).all(new Date().toISOString()) as any[]

      for (const taskData of pendingTasks) {
        try {
          const task: SyncTask = {
            id: taskData.id,
            type: taskData.type,
            priority: taskData.priority,
            payload: JSON.parse(taskData.payload),
            status: taskData.status,
            scheduledAt: new Date(taskData.scheduled_at),
            processedAt: taskData.processed_at ? new Date(taskData.processed_at) : undefined,
            completedAt: taskData.completed_at ? new Date(taskData.completed_at) : undefined,
            error: taskData.error,
            retryCount: taskData.retry_count,
            maxRetries: taskData.max_retries
          }

          await this.processTask(task)
        } catch (error) {
          console.error(`Failed to process sync task ${taskData.id}:`, error)
        }
      }

    } catch (error) {
      console.error('Sync queue processing error:', error)
    } finally {
      this.isProcessingSyncQueue = false
    }
  }

  /**
   * Process individual sync task
   */
  private async processTask(task: SyncTask): Promise<void> {
    const now = new Date()

    try {
      // Mark as processing
      this.db.prepare(`
        UPDATE sync_tasks 
        SET status = 'processing', processed_at = ?
        WHERE id = ?
      `).run(now.toISOString(), task.id)

      // Execute task based on type
      switch (task.type) {
        case 'message_sync':
          await this.syncMessages(task.payload)
          break
        case 'context_sync':
          await this.syncContext(task.payload)
          break
        case 'search_index':
          await this.updateSearchIndex(task.payload)
          break
        case 'backup':
          await this.performBackup(task.payload)
          break
        case 'cleanup':
          await this.performCleanup(task.payload)
          break
        default:
          throw new Error(`Unknown task type: ${task.type}`)
      }

      // Mark as completed
      this.db.prepare(`
        UPDATE sync_tasks 
        SET status = 'completed', completed_at = ?
        WHERE id = ?
      `).run(new Date().toISOString(), task.id)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const retryCount = task.retryCount + 1

      if (retryCount >= task.maxRetries) {
        // Mark as failed
        this.db.prepare(`
          UPDATE sync_tasks 
          SET status = 'failed', error = ?
          WHERE id = ?
        `).run(errorMessage, task.id)
      } else {
        // Schedule retry
        const retryDelay = Math.min(300, Math.pow(2, retryCount) * 30) // Exponential backoff
        const nextScheduled = new Date(Date.now() + retryDelay * 1000)

        this.db.prepare(`
          UPDATE sync_tasks 
          SET status = 'pending', retry_count = ?, scheduled_at = ?, error = ?
          WHERE id = ?
        `).run(retryCount, nextScheduled.toISOString(), errorMessage, task.id)
      }
    }
  }

  /**
   * Record performance metric
   */
  recordMetric(
    metric: string,
    value: number,
    unit: string,
    category: PerformanceMetrics['category'],
    metadata?: Record<string, any>
  ): void {
    try {
      this.db.prepare(`
        INSERT INTO performance_metrics 
        (timestamp, metric, value, unit, category, metadata, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        new Date().toISOString(),
        metric,
        value,
        unit,
        category,
        JSON.stringify(metadata || {}),
        new Date().toISOString()
      )
    } catch (error) {
      // Silent failure for metrics
    }
  }

  /**
   * Get performance analytics
   */
  getPerformanceAnalytics(hours: number = 24): any {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

      const metrics = this.db.prepare(`
        SELECT 
          category,
          metric,
          AVG(value) as avg_value,
          MIN(value) as min_value,
          MAX(value) as max_value,
          COUNT(*) as sample_count
        FROM performance_metrics 
        WHERE timestamp > ?
        GROUP BY category, metric
      `).all(since) as any[]

      const cacheStats = {
        entries: this.cache.size,
        sizeBytes: this.currentCacheSize,
        sizeMB: Math.round(this.currentCacheSize / 1024 / 1024 * 100) / 100,
        hitRate: this.calculateCacheHitRate()
      }

      const syncStats = this.db.prepare(`
        SELECT 
          status,
          COUNT(*) as count
        FROM sync_tasks 
        WHERE scheduled_at > ?
        GROUP BY status
      `).all(since) as any[]

      return {
        metrics: metrics.reduce((acc, metric) => {
          if (!acc[metric.category]) acc[metric.category] = {}
          acc[metric.category][metric.metric] = {
            average: metric.avg_value,
            minimum: metric.min_value,
            maximum: metric.max_value,
            samples: metric.sample_count
          }
          return acc
        }, {}),
        cache: cacheStats,
        sync: syncStats.reduce((acc, stat) => {
          acc[stat.status] = stat.count
          return acc
        }, {}),
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      console.error('Failed to get performance analytics:', error)
      return { metrics: {}, cache: {}, sync: {}, timestamp: new Date().toISOString() }
    }
  }

  /**
   * Optimize database performance
   */
  async optimizeDatabase(): Promise<void> {
    try {
      console.log('Starting database optimization...')

      // Vacuum database
      this.db.exec('VACUUM')

      // Analyze tables for query optimization
      this.db.exec('ANALYZE')

      // Update statistics
      this.recordMetric('database_optimization', 1, 'count', 'database')

      console.log('Database optimization completed')
    } catch (error) {
      console.error('Database optimization failed:', error)
    }
  }

  /**
   * Clean up old data and optimize storage
   */
  async performMaintenance(): Promise<void> {
    try {
      const now = new Date()
      
      // Clean expired cache entries
      const expiredEntries = this.db.prepare(`
        SELECT key, size FROM cache_entries 
        WHERE expires_at IS NOT NULL AND expires_at < ?
      `).all(now.toISOString()) as Array<{ key: string; size: number }>

      let cleanedSize = 0
      expiredEntries.forEach(entry => {
        this.cache.delete(entry.key)
        cleanedSize += entry.size
      })

      this.db.prepare(`
        DELETE FROM cache_entries 
        WHERE expires_at IS NOT NULL AND expires_at < ?
      `).run(now.toISOString())

      this.currentCacheSize -= cleanedSize

      // Clean old performance metrics (keep 7 days)
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      this.db.prepare(`
        DELETE FROM performance_metrics WHERE timestamp < ?
      `).run(weekAgo)

      // Clean completed sync tasks (keep 3 days)
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
      this.db.prepare(`
        DELETE FROM sync_tasks 
        WHERE status IN ('completed', 'failed') AND completed_at < ?
      `).run(threeDaysAgo)

      // Optimize database
      await this.optimizeDatabase()

      console.log(`Maintenance completed. Cleaned ${Math.round(cleanedSize / 1024)}KB of cache data`)

    } catch (error) {
      console.error('Maintenance failed:', error)
    }
  }

  /**
   * Start background performance monitoring
   */
  private startPerformanceMonitoring(): void {
    this.performanceMonitor = setInterval(() => {
      try {
        // Record cache metrics
        this.recordMetric('cache_size', this.currentCacheSize, 'bytes', 'memory')
        this.recordMetric('cache_entries', this.cache.size, 'count', 'memory')

        // Record database metrics
        const dbInfo = this.db.prepare('PRAGMA quick_check').get() as any
        this.recordMetric('db_integrity', dbInfo ? 1 : 0, 'boolean', 'database')

      } catch (error) {
        console.error('Performance monitoring error:', error)
      }
    }, 60000) // Every minute
  }

  /**
   * Start background sync processing
   */
  private startSyncProcessing(): void {
    setInterval(() => {
      this.processSyncQueue()
    }, 30000) // Every 30 seconds
  }

  // Private helper methods

  private async ensureCacheSpace(requiredSize: number): Promise<void> {
    if (this.currentCacheSize + requiredSize <= this.maxCacheSize) return

    // Calculate how much space we need to free
    const spaceToFree = (this.currentCacheSize + requiredSize) - this.maxCacheSize

    // Get entries sorted by LRU + access frequency
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => {
        const aScore = a.accessCount / Math.max(1, (Date.now() - a.lastAccessed.getTime()) / 1000)
        const bScore = b.accessCount / Math.max(1, (Date.now() - b.lastAccessed.getTime()) / 1000)
        return aScore - bScore
      })

    let freedSpace = 0
    const keysToRemove: string[] = []

    for (const [key, entry] of entries) {
      if (freedSpace >= spaceToFree) break
      
      keysToRemove.push(key)
      freedSpace += entry.size
      this.currentCacheSize -= entry.size
      this.cache.delete(key)
    }

    // Remove from persistent cache
    if (keysToRemove.length > 0) {
      const placeholders = keysToRemove.map(() => '?').join(',')
      this.db.prepare(`DELETE FROM cache_entries WHERE key IN (${placeholders})`).run(...keysToRemove)
    }
  }

  private updateCacheAccess(key: string): void {
    const now = new Date().toISOString()
    this.db.prepare(`
      UPDATE cache_entries 
      SET last_accessed = ?, access_count = access_count + 1
      WHERE key = ?
    `).run(now, key)
  }

  private serializeCacheValue(value: any): { data: Buffer | string; type: string } {
    if (Buffer.isBuffer(value)) {
      return { data: value, type: 'buffer' }
    } else if (typeof value === 'string') {
      return { data: value, type: 'string' }
    } else {
      return { data: JSON.stringify(value), type: 'json' }
    }
  }

  private deserializeCacheValue(data: Buffer | string, type: string): any {
    switch (type) {
      case 'buffer':
        return Buffer.isBuffer(data) ? data : Buffer.from(data)
      case 'string':
        return data.toString()
      case 'json':
        return JSON.parse(data.toString())
      default:
        return data
    }
  }

  private calculateSize(serialized: { data: Buffer | string }): number {
    if (Buffer.isBuffer(serialized.data)) {
      return serialized.data.length
    } else {
      return Buffer.byteLength(serialized.data, 'utf8')
    }
  }

  private calculateCacheHitRate(): number {
    const totalAccesses = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.accessCount, 0)
    
    if (totalAccesses === 0) return 0
    
    // Simple approximation - in production would track hits/misses
    return Math.min(0.95, this.cache.size / Math.max(1, totalAccesses / 10))
  }

  // Sync task implementations

  private async syncMessages(payload: any): Promise<void> {
    // Implementation for message synchronization
    console.log('Syncing messages:', payload)
  }

  private async syncContext(payload: any): Promise<void> {
    // Implementation for context synchronization
    console.log('Syncing context:', payload)
  }

  private async updateSearchIndex(payload: any): Promise<void> {
    // Implementation for search index updates
    console.log('Updating search index:', payload)
  }

  private async performBackup(payload: any): Promise<void> {
    // Implementation for backup operations
    console.log('Performing backup:', payload)
  }

  private async performCleanup(payload: any): Promise<void> {
    // Implementation for cleanup operations
    console.log('Performing cleanup:', payload)
  }

  /**
   * Cleanup on service shutdown
   */
  destroy(): void {
    if (this.performanceMonitor) {
      clearInterval(this.performanceMonitor)
      this.performanceMonitor = null
    }

    // Save current cache state
    this.cache.forEach((entry, key) => {
      try {
        const serialized = this.serializeCacheValue(entry.value)
        this.db.prepare(`
          INSERT OR REPLACE INTO cache_entries 
          (key, value, value_type, created_at, last_accessed, access_count, expires_at, size, metadata)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          key,
          serialized.data,
          serialized.type,
          entry.createdAt.toISOString(),
          entry.lastAccessed.toISOString(),
          entry.accessCount,
          entry.expiresAt?.toISOString() || null,
          entry.size,
          JSON.stringify(entry.metadata)
        )
      } catch (error) {
        console.error(`Failed to persist cache entry ${key}:`, error)
      }
    })

    console.log('Performance service destroyed')
  }
}