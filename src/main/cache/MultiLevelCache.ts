import { EventEmitter } from 'events'
import { logger } from '../utils/Logger'

export type CacheLevel = 'memory' | 'persistent' | 'network'
export type CacheStrategy = 'lru' | 'lfu' | 'fifo' | 'adaptive'

export interface CacheEntry<T = any> {
  key: string
  value: T
  timestamp: number
  accessCount: number
  lastAccessed: number
  size: number
  ttl?: number
  metadata?: Record<string, any>
}

export interface CacheConfig {
  maxSize: number // Max size in bytes
  maxItems: number // Max number of items
  ttl: number // Time to live in milliseconds
  strategy: CacheStrategy
  compressionEnabled: boolean
  encryptionEnabled: boolean
}

export interface CacheStats {
  hits: number
  misses: number
  hitRatio: number
  size: number
  itemCount: number
  evictions: number
  memoryUsage: number
}

export interface MultiLevelCacheConfig {
  l1: CacheConfig // Memory cache (fastest)
  l2: CacheConfig // Persistent cache (medium)
  l3?: CacheConfig // Network cache (slowest)
  enableMetrics: boolean
  metricsInterval: number
  autoOptimization: boolean
}

/**
 * Multi-level cache system with intelligent data flow between cache levels
 * Implements L1 (memory), L2 (persistent), and optional L3 (network) caching
 */
export class MultiLevelCache<T = any> extends EventEmitter {
  private l1Cache!: MemoryCache<T>
  private l2Cache!: PersistentCache<T>
  private l3Cache?: NetworkCache<T>
  private config: MultiLevelCacheConfig
  private stats: Record<CacheLevel, CacheStats> = {} as any
  private metricsTimer: NodeJS.Timeout | null = null

  constructor(config: Partial<MultiLevelCacheConfig> = {}) {
    super()
    
    this.config = {
      l1: {
        maxSize: 50 * 1024 * 1024, // 50MB
        maxItems: 10000,
        ttl: 5 * 60 * 1000, // 5 minutes
        strategy: 'adaptive',
        compressionEnabled: false,
        encryptionEnabled: false
      },
      l2: {
        maxSize: 200 * 1024 * 1024, // 200MB
        maxItems: 50000,
        ttl: 60 * 60 * 1000, // 1 hour
        strategy: 'lru',
        compressionEnabled: true,
        encryptionEnabled: false
      },
      enableMetrics: true,
      metricsInterval: 30000, // 30 seconds
      autoOptimization: true,
      ...config
    }
    
    this.initialize()
  }

  private initialize(): void {
    logger.info('Initializing multi-level cache', 'MultiLevelCache', this.config)
    
    // Initialize cache levels
    this.l1Cache = new MemoryCache<T>(this.config.l1)
    this.l2Cache = new PersistentCache<T>(this.config.l2)
    
    if (this.config.l3) {
      this.l3Cache = new NetworkCache<T>(this.config.l3)
    }
    
    // Initialize stats
    this.initializeStats()
    
    // Setup cross-level event handling
    this.setupCacheInteraction()
    
    // Start metrics collection if enabled
    if (this.config.enableMetrics) {
      this.startMetricsCollection()
    }
  }

  /**
   * Get value with multi-level fallback
   */
  async get(key: string): Promise<T | undefined> {
    const startTime = performance.now()
    let result: T | undefined
    let sourceLevel: CacheLevel | null = null
    
    try {
      // Try L1 (memory) first
      result = await this.l1Cache.get(key)
      if (result !== undefined) {
        sourceLevel = 'memory'
        this.recordHit('memory')
        this.recordLatency('memory', performance.now() - startTime)
        return result
      }
      this.recordMiss('memory')
      
      // Try L2 (persistent)
      result = await this.l2Cache.get(key)
      if (result !== undefined) {
        sourceLevel = 'persistent'
        this.recordHit('persistent')
        
        // Promote to L1
        await this.promoteToL1(key, result)
        
        this.recordLatency('persistent', performance.now() - startTime)
        return result
      }
      this.recordMiss('persistent')
      
      // Try L3 (network) if available
      if (this.l3Cache) {
        result = await this.l3Cache.get(key)
        if (result !== undefined) {
          sourceLevel = 'network'
          this.recordHit('network')
          
          // Promote to L1 and L2
          await this.promoteToL2(key, result)
          await this.promoteToL1(key, result)
          
          this.recordLatency('network', performance.now() - startTime)
          return result
        }
        this.recordMiss('network')
      }
      
      // Cache miss
      return undefined
      
    } finally {
      const totalTime = performance.now() - startTime
      this.emit('cache-access', {
        key,
        hit: result !== undefined,
        sourceLevel,
        duration: totalTime
      })
    }
  }

  /**
   * Set value across appropriate cache levels
   */
  async set(key: string, value: T, options: {
    ttl?: number
    skipL1?: boolean
    skipL2?: boolean
    skipL3?: boolean
    priority?: 'low' | 'normal' | 'high'
  } = {}): Promise<void> {
    const startTime = performance.now()
    
    try {
      const serializedSize = this.estimateSize(value)
      const priority = options.priority || 'normal'
      
      // Determine which levels to write to based on size and priority
      const levels = this.determineWriteLevels(serializedSize, priority, options)
      
      const promises: Promise<void>[] = []
      
      // Write to L1 (memory) - always fast
      if (levels.includes('memory') && !options.skipL1) {
        promises.push(
          this.l1Cache.set(key, value, { ttl: options.ttl }).catch(error => {
            logger.warn('L1 cache write failed', 'MultiLevelCache', { key, error })
          })
        )
      }
      
      // Write to L2 (persistent) - can be async
      if (levels.includes('persistent') && !options.skipL2) {
        promises.push(
          this.l2Cache.set(key, value, { ttl: options.ttl }).catch(error => {
            logger.warn('L2 cache write failed', 'MultiLevelCache', { key, error })
          })
        )
      }
      
      // Write to L3 (network) - lowest priority
      if (levels.includes('network') && !options.skipL3 && this.l3Cache) {
        promises.push(
          this.l3Cache.set(key, value, { ttl: options.ttl }).catch(error => {
            logger.warn('L3 cache write failed', 'MultiLevelCache', { key, error })
          })
        )
      }
      
      // Wait for critical writes (L1 and L2)
      const criticalPromises = promises.slice(0, 2)
      await Promise.all(criticalPromises)
      
      // L3 can complete in background
      if (promises.length > 2) {
        promises[2].catch(() => {}) // Ignore L3 errors
      }
      
    } catch (error) {
      logger.error('Multi-level cache set failed', 'MultiLevelCache', { key, error })
      throw error
    } finally {
      const duration = performance.now() - startTime
      this.emit('cache-write', { key, duration, levels: Object.keys(options) })
    }
  }

  /**
   * Delete from all cache levels
   */
  async delete(key: string): Promise<boolean> {
    const promises = [
      this.l1Cache.delete(key),
      this.l2Cache.delete(key)
    ]
    
    if (this.l3Cache) {
      promises.push(this.l3Cache.delete(key))
    }
    
    const results = await Promise.all(promises)
    return results.some(result => result)
  }

  /**
   * Check if key exists in any cache level
   */
  async has(key: string): Promise<boolean> {
    return (
      await this.l1Cache.has(key) ||
      await this.l2Cache.has(key) ||
      (this.l3Cache ? await this.l3Cache.has(key) : false)
    )
  }

  /**
   * Clear all cache levels
   */
  async clear(): Promise<void> {
    const promises = [
      this.l1Cache.clear(),
      this.l2Cache.clear()
    ]
    
    if (this.l3Cache) {
      promises.push(this.l3Cache.clear())
    }
    
    await Promise.all(promises)
    this.resetStats()
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmup(items: Array<{ key: string; value: T }>): Promise<void> {
    logger.info('Starting cache warmup', 'MultiLevelCache', { itemCount: items.length })
    
    const batchSize = 50
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      const promises = batch.map(item => 
        this.set(item.key, item.value, { priority: 'high' })
      )
      
      await Promise.all(promises)
      
      // Brief pause between batches to avoid overwhelming the system
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }
    
    logger.info('Cache warmup completed', 'MultiLevelCache')
  }

  /**
   * Get comprehensive cache statistics
   */
  getStats(): Record<CacheLevel, CacheStats> {
    const stats: Record<CacheLevel, CacheStats> = {
      memory: this.l1Cache.getStats(),
      persistent: this.l2Cache.getStats(),
      network: this.l3Cache?.getStats() || {
        hits: 0,
        misses: 0,
        hitRatio: 0,
        size: 0,
        itemCount: 0,
        evictions: 0,
        memoryUsage: 0
      }
    }
    return stats
  }

  /**
   * Optimize cache performance based on usage patterns
   */
  async optimize(): Promise<void> {
    if (!this.config.autoOptimization) return
    
    logger.info('Starting cache optimization', 'MultiLevelCache')
    
    const stats = this.getStats()
    
    // Optimize L1 cache
    if (stats.memory.hitRatio < 0.5) {
      await this.optimizeL1Cache()
    }
    
    // Optimize L2 cache
    if (stats.persistent.hitRatio < 0.3) {
      await this.optimizeL2Cache()
    }
    
    // Rebalance data between levels
    await this.rebalanceCacheLevels()
    
    logger.info('Cache optimization completed', 'MultiLevelCache')
  }

  /**
   * Export cache data for backup/migration
   */
  async export(): Promise<{ level: CacheLevel; data: any }[]> {
    const exports: { level: CacheLevel; data: any }[] = []
    
    exports.push({
      level: 'memory' as CacheLevel,
      data: await this.l1Cache.export()
    })
    
    exports.push({
      level: 'persistent' as CacheLevel,
      data: await this.l2Cache.export()
    })
    
    if (this.l3Cache) {
      exports.push({
        level: 'network' as CacheLevel,
        data: await this.l3Cache.export()
      })
    }
    
    return exports
  }

  /**
   * Import cache data from backup
   */
  async import(data: { level: CacheLevel; data: any }[]): Promise<void> {
    for (const levelData of data) {
      switch (levelData.level) {
        case 'memory':
          await this.l1Cache.import(levelData.data)
          break
        case 'persistent':
          await this.l2Cache.import(levelData.data)
          break
        case 'network':
          if (this.l3Cache) {
            await this.l3Cache.import(levelData.data)
          }
          break
      }
    }
  }

  // Private helper methods

  private determineWriteLevels(
    size: number, 
    priority: string, 
    _options: any
  ): CacheLevel[] {
    const levels: CacheLevel[] = []
    
    // Always write to L1 for fast access
    if (size < this.config.l1.maxSize * 0.1) { // Small items go to L1
      levels.push('memory')
    }
    
    // Write to L2 for persistence
    if (priority !== 'low' && size < this.config.l2.maxSize * 0.05) {
      levels.push('persistent')
    }
    
    // Write to L3 for high priority or large items
    if (this.l3Cache && (priority === 'high' || size > 1024 * 1024)) {
      levels.push('network')
    }
    
    return levels
  }

  private async promoteToL1(key: string, value: T): Promise<void> {
    try {
      await this.l1Cache.set(key, value, { ttl: this.config.l1.ttl })
    } catch (error) {
      logger.debug('Failed to promote to L1', 'MultiLevelCache', { key, error })
    }
  }

  private async promoteToL2(key: string, value: T): Promise<void> {
    try {
      await this.l2Cache.set(key, value, { ttl: this.config.l2.ttl })
    } catch (error) {
      logger.debug('Failed to promote to L2', 'MultiLevelCache', { key, error })
    }
  }

  private estimateSize(value: T): number {
    try {
      return JSON.stringify(value).length * 2 // Rough estimate
    } catch {
      return 1024 // Default size estimate
    }
  }

  private initializeStats(): void {
    this.stats = {
      memory: this.createEmptyStats(),
      persistent: this.createEmptyStats(),
      network: this.createEmptyStats()
    }
  }

  private createEmptyStats(): CacheStats {
    return {
      hits: 0,
      misses: 0,
      hitRatio: 0,
      size: 0,
      itemCount: 0,
      evictions: 0,
      memoryUsage: 0
    }
  }

  private recordHit(level: CacheLevel): void {
    this.stats[level].hits++
    this.updateHitRatio(level)
  }

  private recordMiss(level: CacheLevel): void {
    this.stats[level].misses++
    this.updateHitRatio(level)
  }

  private updateHitRatio(level: CacheLevel): void {
    const stats = this.stats[level]
    const total = stats.hits + stats.misses
    stats.hitRatio = total > 0 ? stats.hits / total : 0
  }

  private recordLatency(level: CacheLevel, duration: number): void {
    this.emit('cache-latency', { level, duration })
  }

  private setupCacheInteraction(): void {
    // Listen to cache events for optimization
    this.l1Cache.on('eviction', (key: string) => {
      this.emit('l1-eviction', key)
    })
    
    this.l2Cache.on('eviction', (key: string) => {
      this.emit('l2-eviction', key)
    })
  }

  private startMetricsCollection(): void {
    this.metricsTimer = setInterval(() => {
      const stats = this.getStats()
      this.emit('metrics', stats)
      
      // Auto-optimize if needed
      if (this.config.autoOptimization) {
        this.checkOptimizationTriggers(stats)
      }
    }, this.config.metricsInterval)
  }

  private checkOptimizationTriggers(stats: Record<CacheLevel, CacheStats>): void {
    // Trigger optimization if hit ratios are low
    const avgHitRatio = Object.values(stats).reduce((sum, stat) => sum + stat.hitRatio, 0) / Object.keys(stats).length
    
    if (avgHitRatio < 0.4) {
      this.optimize().catch(error => {
        logger.warn('Auto-optimization failed', 'MultiLevelCache', { error })
      })
    }
  }

  private async optimizeL1Cache(): Promise<void> {
    // Increase L1 cache size if memory allows
    const currentSize = this.config.l1.maxSize
    const newSize = Math.min(currentSize * 1.2, 100 * 1024 * 1024) // Cap at 100MB
    
    if (newSize > currentSize) {
      this.config.l1.maxSize = newSize
      await this.l1Cache.resize(newSize)
      logger.debug('L1 cache size increased', 'MultiLevelCache', { oldSize: currentSize, newSize })
    }
  }

  private async optimizeL2Cache(): Promise<void> {
    // Switch to more aggressive caching strategy
    if (this.config.l2.strategy === 'lru') {
      this.config.l2.strategy = 'adaptive'
      await this.l2Cache.changeStrategy('adaptive')
      logger.debug('L2 cache strategy changed to adaptive', 'MultiLevelCache')
    }
  }

  private async rebalanceCacheLevels(): Promise<void> {
    // Move frequently accessed items from L2 to L1
    const hotItems = await this.l2Cache.getHotItems(100)
    
    for (const item of hotItems) {
      if (item.accessCount > 5) {
        await this.promoteToL1(item.key, item.value)
      }
    }
  }

  private resetStats(): void {
    this.initializeStats()
  }

  /**
   * Cleanup and destroy cache
   */
  destroy(): void {
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer)
      this.metricsTimer = null
    }
    
    this.l1Cache.destroy()
    this.l2Cache.destroy()
    this.l3Cache?.destroy()
    
    this.removeAllListeners()
    
    logger.info('Multi-level cache destroyed', 'MultiLevelCache')
  }
}

/**
 * Memory cache implementation (L1)
 */
class MemoryCache<T> extends EventEmitter {
  private cache = new Map<string, CacheEntry<T>>()
  private accessOrder: string[] = []
  
  constructor(private config: CacheConfig) {
    super()
  }
  
  async get(key: string): Promise<T | undefined> {
    const entry = this.cache.get(key)
    if (!entry) return undefined
    
    // Check TTL
    if (this.isExpired(entry)) {
      this.cache.delete(key)
      return undefined
    }
    
    // Update access info
    entry.lastAccessed = Date.now()
    entry.accessCount++
    this.updateAccessOrder(key)
    
    return entry.value
  }
  
  async set(key: string, value: T, options: { ttl?: number } = {}): Promise<void> {
    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
      size: this.estimateSize(value),
      ttl: options.ttl || this.config.ttl
    }
    
    // Evict if necessary
    while (this.shouldEvict(entry.size)) {
      this.evictOne()
    }
    
    this.cache.set(key, entry)
    this.updateAccessOrder(key)
  }
  
  async delete(key: string): Promise<boolean> {
    const deleted = this.cache.delete(key)
    this.removeFromAccessOrder(key)
    return deleted
  }
  
  async has(key: string): Promise<boolean> {
    return this.cache.has(key)
  }
  
  async clear(): Promise<void> {
    this.cache.clear()
    this.accessOrder = []
  }
  
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values())
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0)
    
    return {
      hits: 0, // Tracked externally
      misses: 0, // Tracked externally
      hitRatio: 0, // Calculated externally
      size: totalSize,
      itemCount: this.cache.size,
      evictions: 0, // Could track this
      memoryUsage: totalSize
    }
  }
  
  async export(): Promise<any> {
    return Array.from(this.cache.entries())
  }
  
  async import(data: any): Promise<void> {
    for (const [key, entry] of data) {
      this.cache.set(key, entry)
    }
  }
  
  async resize(newMaxSize: number): Promise<void> {
    this.config.maxSize = newMaxSize
    
    // Evict items if over new limit
    while (this.getCurrentSize() > newMaxSize) {
      this.evictOne()
    }
  }
  
  async changeStrategy(strategy: CacheStrategy): Promise<void> {
    this.config.strategy = strategy
  }
  
  async getHotItems(limit: number): Promise<CacheEntry<T>[]> {
    return Array.from(this.cache.values())
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit)
  }
  
  destroy(): void {
    this.clear()
    this.removeAllListeners()
  }
  
  private isExpired(entry: CacheEntry<T>): boolean {
    if (!entry.ttl) return false
    return Date.now() - entry.timestamp > entry.ttl
  }
  
  private shouldEvict(newItemSize: number): boolean {
    const currentSize = this.getCurrentSize()
    return (
      currentSize + newItemSize > this.config.maxSize ||
      this.cache.size >= this.config.maxItems
    )
  }
  
  private getCurrentSize(): number {
    return Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0)
  }
  
  private evictOne(): void {
    let keyToEvict: string | undefined
    
    switch (this.config.strategy) {
      case 'lru':
        keyToEvict = this.accessOrder[0]
        break
      case 'lfu':
        keyToEvict = this.findLFUKey()
        break
      case 'fifo':
        keyToEvict = this.cache.keys().next().value
        break
      case 'adaptive':
        keyToEvict = this.findAdaptiveKey()
        break
    }
    
    if (keyToEvict) {
      this.cache.delete(keyToEvict)
      this.removeFromAccessOrder(keyToEvict)
      this.emit('eviction', keyToEvict)
    }
  }
  
  private findLFUKey(): string | undefined {
    let minAccess = Infinity
    let keyToEvict: string | undefined
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount < minAccess) {
        minAccess = entry.accessCount
        keyToEvict = key
      }
    }
    
    return keyToEvict
  }
  
  private findAdaptiveKey(): string | undefined {
    // Hybrid approach: consider both recency and frequency
    let bestScore = Infinity
    let keyToEvict: string | undefined
    
    const now = Date.now()
    
    for (const [key, entry] of this.cache.entries()) {
      const recencyScore = (now - entry.lastAccessed) / 1000 // seconds
      const frequencyScore = 1 / (entry.accessCount + 1)
      const combinedScore = recencyScore * 0.7 + frequencyScore * 0.3
      
      if (combinedScore < bestScore) {
        bestScore = combinedScore
        keyToEvict = key
      }
    }
    
    return keyToEvict
  }
  
  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key)
    this.accessOrder.push(key)
  }
  
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
    }
  }
  
  private estimateSize(value: T): number {
    try {
      return JSON.stringify(value).length * 2
    } catch {
      return 1024
    }
  }
}

/**
 * Persistent cache implementation (L2)
 * Simplified version - in a real implementation this would use IndexedDB or similar
 */
class PersistentCache<T> extends EventEmitter {
  private cache = new Map<string, CacheEntry<T>>()
  
  constructor(private config: CacheConfig) {
    super()
  }
  
  async get(key: string): Promise<T | undefined> {
    const entry = this.cache.get(key)
    if (!entry) return undefined
    
    if (this.isExpired(entry)) {
      this.cache.delete(key)
      return undefined
    }
    
    entry.lastAccessed = Date.now()
    entry.accessCount++
    
    return entry.value
  }
  
  async set(key: string, value: T, options: { ttl?: number } = {}): Promise<void> {
    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
      size: this.estimateSize(value),
      ttl: options.ttl || this.config.ttl
    }
    
    this.cache.set(key, entry)
  }
  
  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key)
  }
  
  async has(key: string): Promise<boolean> {
    return this.cache.has(key)
  }
  
  async clear(): Promise<void> {
    this.cache.clear()
  }
  
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values())
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0)
    
    return {
      hits: 0,
      misses: 0,
      hitRatio: 0,
      size: totalSize,
      itemCount: this.cache.size,
      evictions: 0,
      memoryUsage: totalSize
    }
  }
  
  async export(): Promise<any> {
    return Array.from(this.cache.entries())
  }
  
  async import(data: any): Promise<void> {
    for (const [key, entry] of data) {
      this.cache.set(key, entry)
    }
  }
  
  async resize(newMaxSize: number): Promise<void> {
    this.config.maxSize = newMaxSize
  }
  
  async changeStrategy(strategy: CacheStrategy): Promise<void> {
    this.config.strategy = strategy
  }
  
  async getHotItems(limit: number): Promise<CacheEntry<T>[]> {
    return Array.from(this.cache.values())
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit)
  }
  
  destroy(): void {
    this.clear()
    this.removeAllListeners()
  }
  
  private isExpired(entry: CacheEntry<T>): boolean {
    if (!entry.ttl) return false
    return Date.now() - entry.timestamp > entry.ttl
  }
  
  private estimateSize(value: T): number {
    try {
      return JSON.stringify(value).length * 2
    } catch {
      return 1024
    }
  }
}

/**
 * Network cache implementation (L3)
 * Simplified placeholder - would implement actual network caching
 */
class NetworkCache<T> extends PersistentCache<T> {
  constructor(config: CacheConfig) {
    super(config)
  }
  
  async get(key: string): Promise<T | undefined> {
    // Would fetch from network cache service
    return super.get(key)
  }
  
  async set(key: string, value: T, options: { ttl?: number } = {}): Promise<void> {
    // Would store to network cache service
    return super.set(key, value, options)
  }
}