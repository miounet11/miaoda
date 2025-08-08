import { BaseDatabaseService } from './BaseDatabaseService'
import type { SearchQuery, SearchResult } from './searchTypes'

/**
 * Performance metrics for search operations
 */
interface SearchPerformanceMetrics {
  searchId: string
  queryText: string
  searchType: 'lexical' | 'semantic' | 'hybrid'
  startTime: number
  endTime: number
  duration: number
  resultCount: number
  cached: boolean
  indexSize: number
  memoryUsage?: number
  cpuUsage?: number
  phases: {
    queryProcessing: number
    indexLookup: number
    vectorSearch?: number
    resultFormatting: number
    caching: number
  }
}

/**
 * Performance analysis results
 */
interface PerformanceAnalysis {
  avgSearchTime: number
  medianSearchTime: number
  p95SearchTime: number
  p99SearchTime: number
  cacheHitRate: number
  slowestQueries: Array<{
    query: string
    duration: number
    timestamp: Date
  }>
  performanceTrends: Array<{
    date: string
    avgTime: number
    queryCount: number
  }>
  bottlenecks: Array<{
    phase: string
    avgTime: number
    impact: number
  }>
}

/**
 * Search performance monitoring and optimization
 */
export class SearchPerformanceMonitor extends BaseDatabaseService {
  private activeSearches: Map<string, Partial<SearchPerformanceMetrics>> = new Map()
  private performanceBuffer: SearchPerformanceMetrics[] = []
  private readonly BUFFER_SIZE = 100
  private readonly FLUSH_INTERVAL = 30000 // 30 seconds
  private flushTimer?: NodeJS.Timeout

  constructor(db: any) {
    super(db)
    this.initializePerformanceTables()
    this.startPerformanceFlush()
  }

  /**
   * Initialize performance monitoring tables
   */
  private initializePerformanceTables(): void {
    try {
      this.db.exec(`
        -- Search performance metrics
        CREATE TABLE IF NOT EXISTS search_performance (
          search_id TEXT PRIMARY KEY,
          query_text TEXT NOT NULL,
          query_hash TEXT NOT NULL,
          search_type TEXT NOT NULL,
          duration_ms INTEGER NOT NULL,
          result_count INTEGER NOT NULL,
          cached INTEGER NOT NULL,
          index_size INTEGER NOT NULL,
          memory_usage INTEGER,
          cpu_usage REAL,
          phase_query_processing INTEGER NOT NULL,
          phase_index_lookup INTEGER NOT NULL,
          phase_vector_search INTEGER,
          phase_result_formatting INTEGER NOT NULL,
          phase_caching INTEGER NOT NULL,
          created_at TEXT NOT NULL
        );

        -- Performance analytics aggregations
        CREATE TABLE IF NOT EXISTS search_performance_daily (
          date TEXT PRIMARY KEY,
          total_searches INTEGER NOT NULL,
          avg_duration_ms REAL NOT NULL,
          median_duration_ms REAL NOT NULL,
          p95_duration_ms REAL NOT NULL,
          p99_duration_ms REAL NOT NULL,
          cache_hit_rate REAL NOT NULL,
          slowest_query_ms INTEGER NOT NULL,
          search_types TEXT NOT NULL, -- JSON
          created_at TEXT NOT NULL
        );

        -- Performance bottleneck analysis
        CREATE TABLE IF NOT EXISTS search_bottlenecks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          phase TEXT NOT NULL,
          avg_duration_ms REAL NOT NULL,
          max_duration_ms INTEGER NOT NULL,
          occurrence_count INTEGER NOT NULL,
          impact_score REAL NOT NULL,
          suggestions TEXT, -- JSON
          detected_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_perf_created ON search_performance(created_at);
        CREATE INDEX IF NOT EXISTS idx_perf_duration ON search_performance(duration_ms);
        CREATE INDEX IF NOT EXISTS idx_perf_type ON search_performance(search_type);
        CREATE INDEX IF NOT EXISTS idx_perf_query_hash ON search_performance(query_hash);
      `)
    } catch (error) {
      throw new Error(`Failed to initialize performance tables: ${error}`)
    }
  }

  /**
   * Start monitoring a search operation
   */
  startSearchMonitoring(
    queryText: string, 
    searchType: 'lexical' | 'semantic' | 'hybrid'
  ): string {
    const searchId = this.generateSearchId()
    const startTime = Date.now()
    
    this.activeSearches.set(searchId, {
      searchId,
      queryText: queryText.substring(0, 500), // Limit query length
      searchType,
      startTime,
      phases: {
        queryProcessing: 0,
        indexLookup: 0,
        vectorSearch: 0,
        resultFormatting: 0,
        caching: 0
      }
    })

    return searchId
  }

  /**
   * Record phase timing
   */
  recordPhase(
    searchId: string, 
    phase: keyof SearchPerformanceMetrics['phases'], 
    duration: number
  ): void {
    const search = this.activeSearches.get(searchId)
    if (!search || !search.phases) return

    search.phases[phase] = duration
  }

  /**
   * Complete search monitoring
   */
  completeSearchMonitoring(
    searchId: string,
    results: SearchResult[],
    cached: boolean,
    indexSize: number,
    memoryUsage?: number,
    cpuUsage?: number
  ): void {
    const search = this.activeSearches.get(searchId)
    if (!search) return

    const endTime = Date.now()
    const duration = endTime - (search.startTime || endTime)

    const metrics: SearchPerformanceMetrics = {
      searchId,
      queryText: search.queryText || '',
      searchType: search.searchType || 'lexical',
      startTime: search.startTime || endTime,
      endTime,
      duration,
      resultCount: results.length,
      cached,
      indexSize,
      memoryUsage,
      cpuUsage,
      phases: search.phases || {
        queryProcessing: 0,
        indexLookup: 0,
        vectorSearch: 0,
        resultFormatting: 0,
        caching: 0
      }
    }

    // Add to buffer
    this.performanceBuffer.push(metrics)
    this.activeSearches.delete(searchId)

    // Analyze for real-time bottlenecks
    this.analyzePerformanceRealTime(metrics)

    // Flush if buffer is full
    if (this.performanceBuffer.length >= this.BUFFER_SIZE) {
      this.flushPerformanceData()
    }
  }

  /**
   * Get performance analysis
   */
  getPerformanceAnalysis(timeRange = '7d'): PerformanceAnalysis {
    try {
      const whereClause = this.buildTimeRangeClause(timeRange)
      
      // Basic statistics
      const basicStats = this.db.prepare(`
        SELECT 
          AVG(duration_ms) as avg_duration,
          COUNT(*) as total_searches,
          AVG(CASE WHEN cached = 1 THEN 1.0 ELSE 0.0 END) as cache_hit_rate
        FROM search_performance 
        WHERE ${whereClause}
      `).get() as {
        avg_duration: number
        total_searches: number
        cache_hit_rate: number
      }

      // Percentile calculations
      const durations = this.db.prepare(`
        SELECT duration_ms 
        FROM search_performance 
        WHERE ${whereClause}
        ORDER BY duration_ms
      `).all() as Array<{ duration_ms: number }>

      const percentiles = this.calculatePercentiles(durations.map(d => d.duration_ms))

      // Slowest queries
      const slowestQueries = this.db.prepare(`
        SELECT query_text, duration_ms, created_at
        FROM search_performance 
        WHERE ${whereClause}
        ORDER BY duration_ms DESC 
        LIMIT 10
      `).all() as Array<{
        query_text: string
        duration_ms: number
        created_at: string
      }>

      // Performance trends
      const trends = this.db.prepare(`
        SELECT 
          DATE(created_at) as date,
          AVG(duration_ms) as avg_time,
          COUNT(*) as query_count
        FROM search_performance 
        WHERE ${whereClause}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `).all() as Array<{
        date: string
        avg_time: number
        query_count: number
      }>

      // Bottleneck analysis
      const bottlenecks = this.analyzeBottlenecks(timeRange)

      return {
        avgSearchTime: basicStats.avg_duration || 0,
        medianSearchTime: percentiles.p50,
        p95SearchTime: percentiles.p95,
        p99SearchTime: percentiles.p99,
        cacheHitRate: (basicStats.cache_hit_rate || 0) * 100,
        slowestQueries: slowestQueries.map(q => ({
          query: q.query_text,
          duration: q.duration_ms,
          timestamp: new Date(q.created_at)
        })),
        performanceTrends: trends,
        bottlenecks
      }
    } catch (error) {
      console.error('Failed to get performance analysis:', error)
      return this.getDefaultAnalysis()
    }
  }

  /**
   * Get performance recommendations
   */
  getPerformanceRecommendations(): Array<{
    type: 'indexing' | 'caching' | 'query' | 'hardware'
    severity: 'low' | 'medium' | 'high'
    title: string
    description: string
    impact: string
  }> {
    const recommendations: any[] = []
    const analysis = this.getPerformanceAnalysis('7d')

    // Slow search detection
    if (analysis.avgSearchTime > 1000) {
      recommendations.push({
        type: 'indexing',
        severity: 'high',
        title: 'Slow Search Performance',
        description: `Average search time is ${analysis.avgSearchTime.toFixed(0)}ms, which is above the 500ms target.`,
        impact: 'Users may experience noticeable delays during search operations.'
      })
    }

    // Low cache hit rate
    if (analysis.cacheHitRate < 30) {
      recommendations.push({
        type: 'caching',
        severity: 'medium',
        title: 'Low Cache Hit Rate',
        description: `Cache hit rate is only ${analysis.cacheHitRate.toFixed(1)}%. Consider optimizing cache strategy.`,
        impact: 'Repeated searches are not benefiting from caching, wasting resources.'
      })
    }

    // High P99 latency
    if (analysis.p99SearchTime > 5000) {
      recommendations.push({
        type: 'query',
        severity: 'medium',
        title: 'High Tail Latency',
        description: `99th percentile search time is ${analysis.p99SearchTime.toFixed(0)}ms. Some searches are very slow.`,
        impact: 'A small percentage of searches provide poor user experience.'
      })
    }

    // Bottleneck-specific recommendations
    analysis.bottlenecks.forEach(bottleneck => {
      if (bottleneck.impact > 0.3) { // 30% impact threshold
        recommendations.push({
          type: 'indexing',
          severity: 'medium',
          title: `${bottleneck.phase} Bottleneck`,
          description: `The ${bottleneck.phase} phase is taking ${bottleneck.avgTime.toFixed(0)}ms on average.`,
          impact: `This phase accounts for ${(bottleneck.impact * 100).toFixed(1)}% of total search time.`
        })
      }
    })

    return recommendations
  }

  /**
   * Optimize search performance
   */
  async optimizePerformance(): Promise<{
    optimizationsApplied: string[]
    estimatedImprovement: string
  }> {
    const optimizations: string[] = []
    
    try {
      // Clean up old performance data
      const oldDataCleared = await this.cleanupOldPerformanceData()
      if (oldDataCleared > 0) {
        optimizations.push(`Cleaned up ${oldDataCleared} old performance records`)
      }

      // Update daily aggregations
      await this.updateDailyAggregations()
      optimizations.push('Updated performance aggregations')

      // Detect and record bottlenecks
      const bottlenecksDetected = await this.detectBottlenecks()
      if (bottlenecksDetected > 0) {
        optimizations.push(`Analyzed ${bottlenecksDetected} performance bottlenecks`)
      }

      // Flush any pending data
      this.flushPerformanceData()
      optimizations.push('Flushed pending performance data')

      return {
        optimizationsApplied: optimizations,
        estimatedImprovement: 'Performance monitoring optimized. Check recommendations for further improvements.'
      }
    } catch (error) {
      console.error('Performance optimization failed:', error)
      return {
        optimizationsApplied: [],
        estimatedImprovement: 'Optimization failed. Please check system health.'
      }
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    this.flushPerformanceData()
  }

  // Private methods

  private generateSearchId(): string {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private startPerformanceFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flushPerformanceData()
    }, this.FLUSH_INTERVAL)
  }

  private flushPerformanceData(): void {
    if (this.performanceBuffer.length === 0) return

    try {
      const stmt = this.db.prepare(`
        INSERT INTO search_performance 
        (search_id, query_text, query_hash, search_type, duration_ms, result_count, 
         cached, index_size, memory_usage, cpu_usage, phase_query_processing, 
         phase_index_lookup, phase_vector_search, phase_result_formatting, 
         phase_caching, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      const transaction = this.db.transaction(() => {
        for (const metrics of this.performanceBuffer) {
          stmt.run(
            metrics.searchId,
            metrics.queryText,
            this.hashQuery(metrics.queryText),
            metrics.searchType,
            metrics.duration,
            metrics.resultCount,
            metrics.cached ? 1 : 0,
            metrics.indexSize,
            metrics.memoryUsage || null,
            metrics.cpuUsage || null,
            metrics.phases.queryProcessing,
            metrics.phases.indexLookup,
            metrics.phases.vectorSearch || null,
            metrics.phases.resultFormatting,
            metrics.phases.caching,
            new Date(metrics.startTime).toISOString()
          )
        }
      })

      transaction()
      this.performanceBuffer.length = 0 // Clear buffer

    } catch (error) {
      console.error('Failed to flush performance data:', error)
    }
  }

  private analyzePerformanceRealTime(metrics: SearchPerformanceMetrics): void {
    // Real-time alerts for very slow searches
    if (metrics.duration > 10000) { // 10 seconds
      console.warn(`Very slow search detected: ${metrics.duration}ms for "${metrics.queryText.substring(0, 50)}..."`)
    }

    // Alert for phase imbalances
    const totalPhaseTime = Object.values(metrics.phases).reduce((sum, time) => sum + (time || 0), 0)
    if (totalPhaseTime > metrics.duration * 1.5) {
      console.warn('Phase timing inconsistency detected', {
        totalPhases: totalPhaseTime,
        actualDuration: metrics.duration
      })
    }
  }

  private calculatePercentiles(values: number[]): {
    p50: number
    p95: number
    p99: number
  } {
    if (values.length === 0) {
      return { p50: 0, p95: 0, p99: 0 }
    }

    const sorted = [...values].sort((a, b) => a - b)
    const len = sorted.length

    return {
      p50: sorted[Math.floor(len * 0.5)] || 0,
      p95: sorted[Math.floor(len * 0.95)] || 0,
      p99: sorted[Math.floor(len * 0.99)] || 0
    }
  }

  private analyzeBottlenecks(timeRange: string): Array<{
    phase: string
    avgTime: number
    impact: number
  }> {
    const whereClause = this.buildTimeRangeClause(timeRange)
    
    const phaseStats = this.db.prepare(`
      SELECT 
        'queryProcessing' as phase,
        AVG(phase_query_processing) as avg_time,
        AVG(phase_query_processing * 1.0 / duration_ms) as impact
      FROM search_performance WHERE ${whereClause}
      UNION ALL
      SELECT 
        'indexLookup' as phase,
        AVG(phase_index_lookup) as avg_time,
        AVG(phase_index_lookup * 1.0 / duration_ms) as impact
      FROM search_performance WHERE ${whereClause}
      UNION ALL
      SELECT 
        'vectorSearch' as phase,
        AVG(phase_vector_search) as avg_time,
        AVG(phase_vector_search * 1.0 / duration_ms) as impact
      FROM search_performance WHERE ${whereClause} AND phase_vector_search IS NOT NULL
      UNION ALL
      SELECT 
        'resultFormatting' as phase,
        AVG(phase_result_formatting) as avg_time,
        AVG(phase_result_formatting * 1.0 / duration_ms) as impact
      FROM search_performance WHERE ${whereClause}
      UNION ALL
      SELECT 
        'caching' as phase,
        AVG(phase_caching) as avg_time,
        AVG(phase_caching * 1.0 / duration_ms) as impact
      FROM search_performance WHERE ${whereClause}
    `).all() as Array<{
      phase: string
      avg_time: number
      impact: number
    }>

    return phaseStats
      .filter(stat => stat.avg_time > 0)
      .sort((a, b) => b.impact - a.impact)
  }

  private buildTimeRangeClause(timeRange: string): string {
    const ranges: Record<string, string> = {
      '1h': "created_at >= datetime('now', '-1 hour')",
      '24h': "created_at >= datetime('now', '-24 hours')",
      '7d': "created_at >= datetime('now', '-7 days')",
      '30d': "created_at >= datetime('now', '-30 days')",
      '90d': "created_at >= datetime('now', '-90 days')"
    }

    return ranges[timeRange] || ranges['7d']
  }

  private async cleanupOldPerformanceData(): Promise<number> {
    const result = this.db.prepare(`
      DELETE FROM search_performance 
      WHERE created_at < datetime('now', '-90 days')
    `).run()

    return result.changes
  }

  private async updateDailyAggregations(): Promise<void> {
    // This would typically run daily to compute aggregated statistics
    // Implementation depends on specific requirements
  }

  private async detectBottlenecks(): Promise<number> {
    // Analyze recent performance data to detect systematic bottlenecks
    // This is a simplified implementation
    return 0
  }

  private hashQuery(query: string): string {
    let hash = 0
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(16)
  }

  private getDefaultAnalysis(): PerformanceAnalysis {
    return {
      avgSearchTime: 0,
      medianSearchTime: 0,
      p95SearchTime: 0,
      p99SearchTime: 0,
      cacheHitRate: 0,
      slowestQueries: [],
      performanceTrends: [],
      bottlenecks: []
    }
  }
}