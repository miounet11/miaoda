import { EventEmitter } from 'events'
import { app, BrowserWindow } from 'electron'
import { logger } from '../utils/Logger'
import { MultiLevelCache } from '../cache/MultiLevelCache'
import { LLMStreamingOptimizer } from '../llm/StreamingOptimizer'
import { DatabasePerformanceOptimizer } from '../db/PerformanceOptimizer'

export interface PerformanceMetrics {
  timestamp: number
  system: {
    cpu: {
      usage: number
      loadAverage: number[]
      processCount: number
    }
    memory: {
      total: number
      used: number
      free: number
      percentage: number
      heapUsed: number
      heapTotal: number
      external: number
    }
    uptime: number
  }
  database: {
    queryCount: number
    averageQueryTime: number
    slowQueries: number
    cacheHitRate: number
    indexEfficiency: number
    connectionCount: number
  }
  cache: {
    l1: { hitRate: number; size: number; itemCount: number }
    l2: { hitRate: number; size: number; itemCount: number }
    l3?: { hitRate: number; size: number; itemCount: number }
    totalHitRate: number
    memoryUsage: number
  }
  streaming: {
    activeStreams: number
    totalChunks: number
    averageLatency: number
    bufferHealth: 'healthy' | 'warning' | 'critical'
    memoryPressure: boolean
  }
  ui: {
    windowCount: number
    renderTime: number
    fps: number
    memoryUsage: number
    domNodes: number
    eventListeners: number
  }
  network: {
    requestCount: number
    responseTime: number
    errorRate: number
    bytesTransferred: number
    connectionCount: number
  }
}

export interface PerformanceAlert {
  id: string
  level: 'info' | 'warning' | 'error' | 'critical'
  category: 'system' | 'database' | 'cache' | 'streaming' | 'ui' | 'network'
  message: string
  metrics: any
  timestamp: number
  resolved?: boolean
  resolvedAt?: number
}

export interface PerformanceConfig {
  enabled: boolean
  metricsInterval: number // ms
  retentionPeriod: number // ms
  alertThresholds: {
    cpu: number
    memory: number
    queryTime: number
    cacheHitRate: number
    renderTime: number
    errorRate: number
  }
  enableProfiling: boolean
  enableMemoryTracking: boolean
  enableNetworkTracking: boolean
}

/**
 * Comprehensive performance monitoring system for MiaoDa Chat
 * Tracks system, database, cache, streaming, UI, and network performance
 */
export class PerformanceMonitor extends EventEmitter {
  private config: PerformanceConfig
  private metrics: PerformanceMetrics[] = []
  private currentMetrics: PerformanceMetrics
  private alerts: PerformanceAlert[] = []
  private metricsTimer: NodeJS.Timeout | null = null
  private cleanupTimer: NodeJS.Timeout | null = null

  // Component references for metrics collection
  private dbOptimizer?: DatabasePerformanceOptimizer
  private cacheSystem?: MultiLevelCache
  private streamingOptimizer?: LLMStreamingOptimizer

  // Performance tracking state
  private queryTimes: number[] = []
  private renderTimes: number[] = []
  private networkRequests: Array<{ timestamp: number; duration: number; success: boolean }> = []

  constructor(config: Partial<PerformanceConfig> = {}) {
    super()

    this.config = {
      enabled: true,
      metricsInterval: 5000, // 5 seconds
      retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
      alertThresholds: {
        cpu: 80, // %
        memory: 85, // %
        queryTime: 1000, // ms
        cacheHitRate: 50, // %
        renderTime: 16.67, // ms (60fps)
        errorRate: 5, // %
      },
      enableProfiling: true,
      enableMemoryTracking: true,
      enableNetworkTracking: true,
      ...config,
    }

    this.currentMetrics = this.initializeMetrics()
    this.initialize()
  }

  private initialize(): void {
    if (!this.config.enabled) {
      logger.info('Performance monitoring disabled', 'PerformanceMonitor')
      return
    }

    logger.info('Initializing performance monitor', 'PerformanceMonitor', this.config)

    // Start metrics collection
    this.startMetricsCollection()

    // Start cleanup timer
    this.startCleanupTimer()

    // Setup process monitoring
    this.setupProcessMonitoring()

    // Setup window monitoring
    this.setupWindowMonitoring()
  }

  /**
   * Register performance components for monitoring
   */
  registerComponents(components: {
    dbOptimizer?: DatabasePerformanceOptimizer
    cacheSystem?: MultiLevelCache
    streamingOptimizer?: LLMStreamingOptimizer
  }): void {
    this.dbOptimizer = components.dbOptimizer
    this.cacheSystem = components.cacheSystem
    this.streamingOptimizer = components.streamingOptimizer

    // Setup component event listeners
    this.setupComponentListeners()

    logger.info('Performance components registered', 'PerformanceMonitor', {
      database: !!this.dbOptimizer,
      cache: !!this.cacheSystem,
      streaming: !!this.streamingOptimizer,
    })
  }

  /**
   * Record a database query for performance tracking
   */
  recordQuery(duration: number, success: boolean = true): void {
    this.queryTimes.push(duration)

    // Keep only recent query times
    if (this.queryTimes.length > 1000) {
      this.queryTimes = this.queryTimes.slice(-500)
    }

    // Check for slow queries
    if (duration > this.config.alertThresholds.queryTime) {
      this.createAlert({
        level: 'warning',
        category: 'database',
        message: `Slow query detected: ${Math.round(duration)}ms`,
        metrics: { duration, success },
      })
    }
  }

  /**
   * Record UI render time for performance tracking
   */
  recordRenderTime(duration: number): void {
    this.renderTimes.push(duration)

    // Keep only recent render times
    if (this.renderTimes.length > 1000) {
      this.renderTimes = this.renderTimes.slice(-500)
    }

    // Check for slow renders
    if (duration > this.config.alertThresholds.renderTime) {
      this.createAlert({
        level: 'warning',
        category: 'ui',
        message: `Slow render detected: ${Math.round(duration)}ms`,
        metrics: { duration },
      })
    }
  }

  /**
   * Record network request for performance tracking
   */
  recordNetworkRequest(duration: number, success: boolean = true): void {
    const request = {
      timestamp: Date.now(),
      duration,
      success,
    }

    this.networkRequests.push(request)

    // Keep only recent requests
    if (this.networkRequests.length > 1000) {
      this.networkRequests = this.networkRequests.slice(-500)
    }
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): PerformanceMetrics {
    return { ...this.currentMetrics }
  }

  /**
   * Get historical metrics within a time range
   */
  getHistoricalMetrics(startTime?: number, endTime?: number): PerformanceMetrics[] {
    let filtered = [...this.metrics]

    if (startTime) {
      filtered = filtered.filter(m => m.timestamp >= startTime)
    }

    if (endTime) {
      filtered = filtered.filter(m => m.timestamp <= endTime)
    }

    return filtered
  }

  /**
   * Get performance summary for a time period
   */
  getPerformanceSummary(periodMs: number = 60 * 60 * 1000): {
    averages: Partial<PerformanceMetrics>
    peaks: Partial<PerformanceMetrics>
    trends: Record<string, 'improving' | 'degrading' | 'stable'>
    issues: PerformanceAlert[]
  } {
    const startTime = Date.now() - periodMs
    const periodMetrics = this.getHistoricalMetrics(startTime)

    if (periodMetrics.length === 0) {
      return {
        averages: {},
        peaks: {},
        trends: {},
        issues: [],
      }
    }

    // Calculate averages
    const averages = this.calculateAverages(periodMetrics)

    // Find peaks
    const peaks = this.findPeaks(periodMetrics)

    // Analyze trends
    const trends = this.analyzeTrends(periodMetrics)

    // Get issues in period
    const issues = this.alerts.filter(alert => alert.timestamp >= startTime)

    return { averages, peaks, trends, issues }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter(alert => !alert.resolved)
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.resolved = true
      alert.resolvedAt = Date.now()
      this.emit('alert-resolved', alert)
    }
  }

  /**
   * Generate comprehensive performance report
   */
  generateReport(): {
    summary: any
    recommendations: string[]
    criticalIssues: PerformanceAlert[]
    optimizationOpportunities: string[]
    } {
    const summary = this.getPerformanceSummary()
    const recommendations: string[] = []
    const criticalIssues = this.alerts.filter(a => a.level === 'critical' && !a.resolved)
    const optimizationOpportunities: string[] = []

    // Analyze current metrics for recommendations
    const current = this.currentMetrics

    // Memory recommendations
    if (current.system.memory.percentage > 80) {
      recommendations.push('Consider increasing system memory or optimizing memory usage')
      optimizationOpportunities.push('Enable aggressive garbage collection')
    }

    // Database recommendations
    if (current.database.averageQueryTime > 500) {
      recommendations.push('Optimize database queries and consider adding indexes')
      optimizationOpportunities.push('Enable query result caching')
    }

    // Cache recommendations
    if (current.cache.totalHitRate < 70) {
      recommendations.push('Improve caching strategy and increase cache sizes')
      optimizationOpportunities.push('Implement predictive caching')
    }

    // UI recommendations
    if (current.ui.renderTime > 16) {
      recommendations.push('Optimize UI rendering and reduce DOM complexity')
      optimizationOpportunities.push('Implement virtual scrolling for large lists')
    }

    return {
      summary,
      recommendations,
      criticalIssues,
      optimizationOpportunities,
    }
  }

  /**
   * Export performance data for external analysis
   */
  exportData(): {
    config: PerformanceConfig
    metrics: PerformanceMetrics[]
    alerts: PerformanceAlert[]
    summary: any
    } {
    return {
      config: this.config,
      metrics: [...this.metrics],
      alerts: [...this.alerts],
      summary: this.getPerformanceSummary(),
    }
  }

  // Private implementation methods

  private startMetricsCollection(): void {
    this.metricsTimer = setInterval(() => {
      this.collectMetrics()
    }, this.config.metricsInterval)

    // Collect initial metrics immediately
    this.collectMetrics()
  }

  private async collectMetrics(): Promise<void> {
    try {
      const timestamp = Date.now()

      // Collect system metrics
      const systemMetrics = await this.collectSystemMetrics()

      // Collect database metrics
      const databaseMetrics = this.collectDatabaseMetrics()

      // Collect cache metrics
      const cacheMetrics = this.collectCacheMetrics()

      // Collect streaming metrics
      const streamingMetrics = this.collectStreamingMetrics()

      // Collect UI metrics
      const uiMetrics = await this.collectUIMetrics()

      // Collect network metrics
      const networkMetrics = this.collectNetworkMetrics()

      this.currentMetrics = {
        timestamp,
        system: systemMetrics,
        database: databaseMetrics,
        cache: cacheMetrics,
        streaming: streamingMetrics,
        ui: uiMetrics,
        network: networkMetrics,
      }

      // Store metrics
      this.metrics.push({ ...this.currentMetrics })

      // Check for performance issues
      this.checkPerformanceThresholds()

      // Emit metrics for external monitoring
      this.emit('metrics-collected', this.currentMetrics)
    } catch (error) {
      logger.error('Failed to collect performance metrics', 'PerformanceMonitor', { error })
    }
  }

  private async collectSystemMetrics(): Promise<PerformanceMetrics['system']> {
    const memoryUsage = process.memoryUsage()
    const cpuUsage = process.cpuUsage()

    return {
      cpu: {
        usage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to ms
        loadAverage: [], // Not available on all platforms
        processCount: 1, // Simplified
      },
      memory: {
        total: memoryUsage.heapTotal + memoryUsage.external,
        used: memoryUsage.heapUsed,
        free: memoryUsage.heapTotal - memoryUsage.heapUsed,
        percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
      },
      uptime: process.uptime() * 1000,
    }
  }

  private collectDatabaseMetrics(): PerformanceMetrics['database'] {
    if (!this.dbOptimizer) {
      return {
        queryCount: 0,
        averageQueryTime: 0,
        slowQueries: 0,
        cacheHitRate: 0,
        indexEfficiency: 0,
        connectionCount: 1,
      }
    }

    const dbMetrics = this.dbOptimizer.getPerformanceMetrics()
    const slowQueries = this.queryTimes.filter(
      t => t > this.config.alertThresholds.queryTime,
    ).length

    return {
      queryCount: dbMetrics.queryCount,
      averageQueryTime: dbMetrics.averageQueryTime,
      slowQueries,
      cacheHitRate: dbMetrics.cacheHitRate,
      indexEfficiency: 85, // Placeholder - would need more sophisticated calculation
      connectionCount: 1,
    }
  }

  private collectCacheMetrics(): PerformanceMetrics['cache'] {
    if (!this.cacheSystem) {
      return {
        l1: { hitRate: 0, size: 0, itemCount: 0 },
        l2: { hitRate: 0, size: 0, itemCount: 0 },
        totalHitRate: 0,
        memoryUsage: 0,
      }
    }

    const cacheStats = this.cacheSystem.getStats()

    return {
      l1: {
        hitRate: cacheStats.memory?.hitRatio || 0,
        size: cacheStats.memory?.size || 0,
        itemCount: cacheStats.memory?.itemCount || 0,
      },
      l2: {
        hitRate: cacheStats.persistent?.hitRatio || 0,
        size: cacheStats.persistent?.size || 0,
        itemCount: cacheStats.persistent?.itemCount || 0,
      },
      l3: cacheStats.network
        ? {
          hitRate: cacheStats.network.hitRatio,
          size: cacheStats.network.size,
          itemCount: cacheStats.network.itemCount,
        }
        : undefined,
      totalHitRate: this.calculateTotalCacheHitRate(cacheStats),
      memoryUsage: (cacheStats.memory?.memoryUsage || 0) + (cacheStats.persistent?.memoryUsage || 0),
    }
  }

  private collectStreamingMetrics(): PerformanceMetrics['streaming'] {
    if (!this.streamingOptimizer) {
      return {
        activeStreams: 0,
        totalChunks: 0,
        averageLatency: 0,
        bufferHealth: 'healthy',
        memoryPressure: false,
      }
    }

    const streamingMetrics = this.streamingOptimizer.getMetrics()

    return {
      activeStreams: 0, // Would need to track active streams
      totalChunks: streamingMetrics.totalChunks,
      averageLatency: streamingMetrics.latency.average,
      bufferHealth: streamingMetrics.bufferHealth,
      memoryPressure: streamingMetrics.memoryUsage > 100 * 1024 * 1024, // 100MB threshold
    }
  }

  private async collectUIMetrics(): Promise<PerformanceMetrics['ui']> {
    const windows = BrowserWindow.getAllWindows()
    let totalMemoryUsage = 0

    // Collect metrics from all windows
    for (const window of windows) {
      try {
        if (window.webContents) {
          const processMetrics = await app.getAppMetrics()
          const rendererProcess = processMetrics.find(p => p.type === 'Renderer')
          if (rendererProcess) {
            totalMemoryUsage += rendererProcess.memory.workingSetSize || 0
          }
        }
      } catch (error) {
        // Ignore errors for individual windows
      }
    }

    const averageRenderTime =
      this.renderTimes.length > 0
        ? this.renderTimes.reduce((sum, time) => sum + time, 0) / this.renderTimes.length
        : 0

    return {
      windowCount: windows.length,
      renderTime: averageRenderTime,
      fps: averageRenderTime > 0 ? Math.min(60, 1000 / averageRenderTime) : 60,
      memoryUsage: totalMemoryUsage,
      domNodes: 0, // Would need to be collected from renderer
      eventListeners: 0, // Would need to be collected from renderer
    }
  }

  private collectNetworkMetrics(): PerformanceMetrics['network'] {
    const recentRequests = this.networkRequests.filter(
      r => Date.now() - r.timestamp < 60000, // Last minute
    )

    const successfulRequests = recentRequests.filter(r => r.success)
    const errorRate =
      recentRequests.length > 0
        ? ((recentRequests.length - successfulRequests.length) / recentRequests.length) * 100
        : 0

    const averageResponseTime =
      successfulRequests.length > 0
        ? successfulRequests.reduce((sum, r) => sum + r.duration, 0) / successfulRequests.length
        : 0

    return {
      requestCount: recentRequests.length,
      responseTime: averageResponseTime,
      errorRate,
      bytesTransferred: 0, // Would need more sophisticated tracking
      connectionCount: 1, // Simplified
    }
  }

  private checkPerformanceThresholds(): void {
    const metrics = this.currentMetrics

    // CPU threshold
    if (metrics.system.cpu.usage > this.config.alertThresholds.cpu) {
      this.createAlert({
        level: 'warning',
        category: 'system',
        message: `High CPU usage: ${Math.round(metrics.system.cpu.usage)}%`,
        metrics: { cpu: metrics.system.cpu },
      })
    }

    // Memory threshold
    if (metrics.system.memory.percentage > this.config.alertThresholds.memory) {
      this.createAlert({
        level: 'warning',
        category: 'system',
        message: `High memory usage: ${Math.round(metrics.system.memory.percentage)}%`,
        metrics: { memory: metrics.system.memory },
      })
    }

    // Cache hit rate threshold
    if (metrics.cache.totalHitRate < this.config.alertThresholds.cacheHitRate) {
      this.createAlert({
        level: 'info',
        category: 'cache',
        message: `Low cache hit rate: ${Math.round(metrics.cache.totalHitRate)}%`,
        metrics: { cache: metrics.cache },
      })
    }

    // Network error rate threshold
    if (metrics.network.errorRate > this.config.alertThresholds.errorRate) {
      this.createAlert({
        level: 'error',
        category: 'network',
        message: `High network error rate: ${Math.round(metrics.network.errorRate)}%`,
        metrics: { network: metrics.network },
      })
    }
  }

  private createAlert(alertData: Omit<PerformanceAlert, 'id' | 'timestamp'>): void {
    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...alertData,
    }

    this.alerts.push(alert)
    this.emit('performance-alert', alert)

    // Log critical alerts immediately
    if (alert.level === 'critical') {
      logger.error('Critical performance alert', 'PerformanceMonitor', alert)
    }
  }

  private setupComponentListeners(): void {
    // Listen to cache events
    if (this.cacheSystem) {
      this.cacheSystem.on('cache-access', data => {
        // Track cache access patterns
      })

      this.cacheSystem.on('memory-pressure', () => {
        this.createAlert({
          level: 'warning',
          category: 'cache',
          message: 'Memory pressure detected in cache system',
          metrics: {},
        })
      })
    }

    // Listen to streaming events
    if (this.streamingOptimizer) {
      this.streamingOptimizer.on('memory-pressure', () => {
        this.createAlert({
          level: 'warning',
          category: 'streaming',
          message: 'Memory pressure detected in streaming system',
          metrics: {},
        })
      })

      this.streamingOptimizer.on('backpressure', streamId => {
        this.createAlert({
          level: 'info',
          category: 'streaming',
          message: `Backpressure applied to stream ${streamId}`,
          metrics: { streamId },
        })
      })
    }
  }

  private setupProcessMonitoring(): void {
    // Monitor uncaught exceptions
    process.on('uncaughtException', error => {
      this.createAlert({
        level: 'critical',
        category: 'system',
        message: `Uncaught exception: ${error.message}`,
        metrics: { error: error.stack },
      })
    })

    // Monitor unhandled rejections
    process.on('unhandledRejection', reason => {
      this.createAlert({
        level: 'error',
        category: 'system',
        message: `Unhandled rejection: ${reason}`,
        metrics: { reason },
      })
    })
  }

  private setupWindowMonitoring(): void {
    app.on('browser-window-created', (_, window) => {
      // Monitor window crashes
      window.webContents.on('crashed', () => {
        this.createAlert({
          level: 'critical',
          category: 'ui',
          message: 'Renderer process crashed',
          metrics: { windowId: window.id },
        })
      })

      // Monitor unresponsive windows
      window.webContents.on('unresponsive', () => {
        this.createAlert({
          level: 'error',
          category: 'ui',
          message: 'Window became unresponsive',
          metrics: { windowId: window.id },
        })
      })
    })
  }

  private startCleanupTimer(): void {
    // Clean up old data every hour
    this.cleanupTimer = setInterval(
      () => {
        this.cleanupOldData()
      },
      60 * 60 * 1000,
    )
  }

  private cleanupOldData(): void {
    const cutoffTime = Date.now() - this.config.retentionPeriod

    // Clean up old metrics
    this.metrics = this.metrics.filter(m => m.timestamp > cutoffTime)

    // Clean up resolved alerts older than 24 hours
    this.alerts = this.alerts.filter(
      a => !a.resolved || (a.resolvedAt && a.resolvedAt > cutoffTime),
    )

    // Clean up query times
    this.queryTimes = this.queryTimes.slice(-500)
    this.renderTimes = this.renderTimes.slice(-500)
    this.networkRequests = this.networkRequests.filter(
      r => Date.now() - r.timestamp < 60 * 60 * 1000, // Keep 1 hour
    )

    logger.debug('Performance data cleanup completed', 'PerformanceMonitor', {
      metricsCount: this.metrics.length,
      alertsCount: this.alerts.length,
    })
  }

  private calculateAverages(metrics: PerformanceMetrics[]): Partial<PerformanceMetrics> {
    if (metrics.length === 0) return {}

    const avgCpuUsage = metrics.reduce((sum, m) => sum + m.system.cpu.usage, 0) / metrics.length
    const avgMemoryUsage =
      metrics.reduce((sum, m) => sum + m.system.memory.percentage, 0) / metrics.length
    const avgQueryTime =
      metrics.reduce((sum, m) => sum + m.database.averageQueryTime, 0) / metrics.length

    return {
      system: {
        cpu: { usage: avgCpuUsage, loadAverage: [], processCount: 0 },
        memory: {
          total: 0,
          used: 0,
          free: 0,
          percentage: avgMemoryUsage,
          heapUsed: 0,
          heapTotal: 0,
          external: 0,
        },
        uptime: 0,
      },
      database: {
        queryCount: 0,
        averageQueryTime: avgQueryTime,
        slowQueries: 0,
        cacheHitRate: 0,
        indexEfficiency: 0,
        connectionCount: 0,
      },
    } as any
  }

  private findPeaks(metrics: PerformanceMetrics[]): Partial<PerformanceMetrics> {
    if (metrics.length === 0) return {}

    const maxCpuUsage = Math.max(...metrics.map(m => m.system.cpu.usage))
    const maxMemoryUsage = Math.max(...metrics.map(m => m.system.memory.percentage))
    const maxQueryTime = Math.max(...metrics.map(m => m.database.averageQueryTime))

    return {
      system: {
        cpu: { usage: maxCpuUsage, loadAverage: [], processCount: 0 },
        memory: {
          total: 0,
          used: 0,
          free: 0,
          percentage: maxMemoryUsage,
          heapUsed: 0,
          heapTotal: 0,
          external: 0,
        },
        uptime: 0,
      },
      database: {
        queryCount: 0,
        averageQueryTime: maxQueryTime,
        slowQueries: 0,
        cacheHitRate: 0,
        indexEfficiency: 0,
        connectionCount: 0,
      },
    } as any
  }

  private analyzeTrends(
    metrics: PerformanceMetrics[],
  ): Record<string, 'improving' | 'degrading' | 'stable'> {
    if (metrics.length < 2) return {}

    const trends: Record<string, 'improving' | 'degrading' | 'stable'> = {}

    // Analyze CPU trend
    const cpuTrend = this.calculateTrend(metrics.map(m => m.system.cpu.usage))
    trends.cpu = cpuTrend

    // Analyze memory trend
    const memoryTrend = this.calculateTrend(metrics.map(m => m.system.memory.percentage))
    trends.memory = memoryTrend

    // Analyze query time trend
    const queryTimeTrend = this.calculateTrend(metrics.map(m => m.database.averageQueryTime))
    trends.queryTime = queryTimeTrend

    return trends
  }

  private calculateTrend(values: number[]): 'improving' | 'degrading' | 'stable' {
    if (values.length < 2) return 'stable'

    const firstHalf = values.slice(0, Math.floor(values.length / 2))
    const secondHalf = values.slice(Math.floor(values.length / 2))

    const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length

    const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100

    if (percentChange > 10) return 'degrading'
    if (percentChange < -10) return 'improving'
    return 'stable'
  }

  private calculateTotalCacheHitRate(cacheStats: any): number {
    const levels = ['memory', 'persistent', 'network'].filter(level => cacheStats[level])
    if (levels.length === 0) return 0

    const totalHitRatio = levels.reduce((sum, level) => sum + (cacheStats[level]?.hitRatio || 0), 0)
    return totalHitRatio / levels.length
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      timestamp: Date.now(),
      system: {
        cpu: { usage: 0, loadAverage: [], processCount: 0 },
        memory: {
          total: 0,
          used: 0,
          free: 0,
          percentage: 0,
          heapUsed: 0,
          heapTotal: 0,
          external: 0,
        },
        uptime: 0,
      },
      database: {
        queryCount: 0,
        averageQueryTime: 0,
        slowQueries: 0,
        cacheHitRate: 0,
        indexEfficiency: 0,
        connectionCount: 0,
      },
      cache: {
        l1: { hitRate: 0, size: 0, itemCount: 0 },
        l2: { hitRate: 0, size: 0, itemCount: 0 },
        totalHitRate: 0,
        memoryUsage: 0,
      },
      streaming: {
        activeStreams: 0,
        totalChunks: 0,
        averageLatency: 0,
        bufferHealth: 'healthy',
        memoryPressure: false,
      },
      ui: {
        windowCount: 0,
        renderTime: 0,
        fps: 60,
        memoryUsage: 0,
        domNodes: 0,
        eventListeners: 0,
      },
      network: {
        requestCount: 0,
        responseTime: 0,
        errorRate: 0,
        bytesTransferred: 0,
        connectionCount: 0,
      },
    }
  }

  /**
   * Cleanup and destroy monitor
   */
  destroy(): void {
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer)
      this.metricsTimer = null
    }

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }

    this.removeAllListeners()

    logger.info('Performance monitor destroyed', 'PerformanceMonitor')
  }
}

/**
 * Global performance monitor instance factory
 */
export function createPerformanceMonitor(config?: Partial<PerformanceConfig>): PerformanceMonitor {
  return new PerformanceMonitor(config)
}
