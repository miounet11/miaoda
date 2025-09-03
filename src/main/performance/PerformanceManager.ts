import Database from 'better-sqlite3'
import { EventEmitter } from 'events'
import { logger } from '../utils/Logger'
import { DatabasePerformanceOptimizer } from '../db/PerformanceOptimizer'
import { LLMStreamingOptimizer } from '../llm/StreamingOptimizer'
import { MultiLevelCache } from '../cache/MultiLevelCache'
import { ElectronPerformanceOptimizer } from './ElectronOptimizer'
import { PerformanceMonitor } from './PerformanceMonitor'
import { MemoryLeakDetector } from './MemoryLeakDetector'

export interface PerformanceManagerConfig {
  enabled: boolean
  enableDatabaseOptimization: boolean
  enableStreamingOptimization: boolean
  enableMultiLevelCache: boolean
  enableElectronOptimization: boolean
  enablePerformanceMonitoring: boolean
  enableMemoryLeakDetection: boolean
  autoOptimizationEnabled: boolean
  optimizationInterval: number // ms
  alertThresholds: {
    cpuUsage: number // %
    memoryUsage: number // %
    queryTime: number // ms
    renderTime: number // ms
    errorRate: number // %
  }
}

export interface PerformanceStatus {
  overall: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
  components: {
    database: { status: string; metrics: any }
    streaming: { status: string; metrics: any }
    cache: { status: string; metrics: any }
    electron: { status: string; metrics: any }
    memory: { status: string; metrics: any }
  }
  recommendations: string[]
  alerts: Array<{ level: string; message: string; timestamp: number }>
}

/**
 * Central performance management system that coordinates all optimization components
 * Provides unified control and monitoring of system performance
 */
export class PerformanceManager extends EventEmitter {
  private config: PerformanceManagerConfig
  private isInitialized = false

  // Performance components
  private dbOptimizer?: DatabasePerformanceOptimizer
  private streamingOptimizer?: LLMStreamingOptimizer
  private cacheSystem?: MultiLevelCache
  private electronOptimizer?: ElectronPerformanceOptimizer
  private performanceMonitor?: PerformanceMonitor
  private memoryLeakDetector?: MemoryLeakDetector

  // Management state
  private optimizationTimer: NodeJS.Timeout | null = null
  private componentHealthStatus = new Map<string, { status: string; lastCheck: number }>()

  constructor(config: Partial<PerformanceManagerConfig> = {}) {
    super()

    this.config = {
      enabled: true,
      enableDatabaseOptimization: true,
      enableStreamingOptimization: true,
      enableMultiLevelCache: true,
      enableElectronOptimization: true,
      enablePerformanceMonitoring: true,
      enableMemoryLeakDetection: true,
      autoOptimizationEnabled: true,
      optimizationInterval: 5 * 60 * 1000, // 5 minutes
      alertThresholds: {
        cpuUsage: 80,
        memoryUsage: 85,
        queryTime: 1000,
        renderTime: 16.67,
        errorRate: 5,
      },
      ...config,
    }
  }

  /**
   * Initialize all performance components
   */
  async initialize(database?: Database.Database): Promise<void> {
    if (this.isInitialized || !this.config.enabled) {
      return
    }

    logger.info('Initializing Performance Manager', 'PerformanceManager', this.config)

    try {
      // Initialize database optimization
      if (this.config.enableDatabaseOptimization && database) {
        this.dbOptimizer = new DatabasePerformanceOptimizer(database, {
          enableQueryCache: true,
          maxCacheSize: 1000,
          slowQueryThreshold: this.config.alertThresholds.queryTime / 10,
          enablePragmaOptimizations: true,
          enableConnectionPooling: false, // SQLite is single-connection
          vacuumInterval: 24 * 60 * 60 * 1000, // 24 hours
        })
        logger.info('Database optimizer initialized', 'PerformanceManager')
      }

      // Initialize streaming optimization
      if (this.config.enableStreamingOptimization) {
        this.streamingOptimizer = new LLMStreamingOptimizer({
          maxBufferSize: 2 * 1024 * 1024, // 2MB
          chunkThreshold: 4096, // 4KB
          backpressureThreshold: 0.8,
          memoryLimit: 100 * 1024 * 1024, // 100MB
          enableCompression: false,
          enableAdaptiveBuffering: true,
          metricsCollectionInterval: 1000,
        })
        logger.info('Streaming optimizer initialized', 'PerformanceManager')
      }

      // Initialize multi-level cache
      if (this.config.enableMultiLevelCache) {
        this.cacheSystem = new MultiLevelCache({
          l1: {
            maxSize: 50 * 1024 * 1024, // 50MB
            maxItems: 10000,
            ttl: 5 * 60 * 1000,
            strategy: 'adaptive',
            compressionEnabled: false,
            encryptionEnabled: false,
          },
          l2: {
            maxSize: 200 * 1024 * 1024, // 200MB
            maxItems: 50000,
            ttl: 60 * 60 * 1000,
            strategy: 'lru',
            compressionEnabled: true,
            encryptionEnabled: false,
          },
          enableMetrics: true,
          metricsInterval: 30000,
          autoOptimization: true,
        })
        logger.info('Multi-level cache initialized', 'PerformanceManager')
      }

      // Initialize Electron optimization
      if (this.config.enableElectronOptimization) {
        this.electronOptimizer = new ElectronPerformanceOptimizer({
          enableGPUAcceleration: true,
          enableHardwareAcceleration: true,
          maxRendererProcesses: 4,
          memoryThreshold: 500,
          cpuThreshold: this.config.alertThresholds.cpuUsage,
          powerSaveMode: false,
          backgroundThrottling: true,
          v8CacheOptions: {
            enabled: true,
            maxSize: 50 * 1024 * 1024,
          },
          processOptimization: {
            enableSandbox: true,
            enableNodeIntegration: false,
            contextIsolation: true,
          },
        })
        logger.info('Electron optimizer initialized', 'PerformanceManager')
      }

      // Initialize performance monitoring
      if (this.config.enablePerformanceMonitoring) {
        this.performanceMonitor = new PerformanceMonitor({
          enabled: true,
          metricsInterval: 10000,
          retentionPeriod: 24 * 60 * 60 * 1000,
          alertThresholds: this.config.alertThresholds,
          enableProfiling: true,
          enableMemoryTracking: true,
          enableNetworkTracking: true,
        })

        // Register components with monitor
        this.performanceMonitor.registerComponents({
          dbOptimizer: this.dbOptimizer,
          cacheSystem: this.cacheSystem,
          streamingOptimizer: this.streamingOptimizer,
        })

        logger.info('Performance monitor initialized', 'PerformanceManager')
      }

      // Initialize memory leak detection
      if (this.config.enableMemoryLeakDetection) {
        this.memoryLeakDetector = new MemoryLeakDetector({
          enabled: true,
          snapshotInterval: 30000, // 30 seconds
          analysisInterval: 2 * 60 * 1000, // 2 minutes
          retentionPeriod: 24 * 60 * 60 * 1000,
          thresholds: {
            heapGrowthRate: 1024 * 1024, // 1MB/s
            externalGrowthRate: 512 * 1024, // 512KB/s
            totalMemoryLimit: this.config.alertThresholds.memoryUsage * 1024 * 1024 * 10, // Rough estimate
            consecutiveGrowthPeriods: 5,
          },
          enableGCTrigger: true,
          enableDetailedAnalysis: true,
        })
        logger.info('Memory leak detector initialized', 'PerformanceManager')
      }

      // Setup component event listeners
      this.setupComponentListeners()

      // Start auto-optimization if enabled
      if (this.config.autoOptimizationEnabled) {
        this.startAutoOptimization()
      }

      this.isInitialized = true
      this.emit('initialized')

      logger.info('Performance Manager initialization completed', 'PerformanceManager')
    } catch (error) {
      logger.error('Performance Manager initialization failed', 'PerformanceManager', { error })
      throw error
    }
  }

  /**
   * Get comprehensive performance status
   */
  async getPerformanceStatus(): Promise<PerformanceStatus> {
    if (!this.isInitialized) {
      return {
        overall: 'poor',
        components: {
          database: { status: 'not_initialized', metrics: {} },
          streaming: { status: 'not_initialized', metrics: {} },
          cache: { status: 'not_initialized', metrics: {} },
          electron: { status: 'not_initialized', metrics: {} },
          memory: { status: 'not_initialized', metrics: {} },
        },
        recommendations: ['Initialize Performance Manager first'],
        alerts: [],
      }
    }

    const components = {
      database: await this.getDatabaseStatus(),
      streaming: await this.getStreamingStatus(),
      cache: await this.getCacheStatus(),
      electron: await this.getElectronStatus(),
      memory: await this.getMemoryStatus(),
    }

    // Calculate overall status
    const componentScores = Object.values(components).map(comp => this.statusToScore(comp.status))
    const averageScore =
      componentScores.reduce((sum, score) => sum + score, 0) / componentScores.length
    const overall = this.scoreToStatus(averageScore)

    // Collect recommendations
    const recommendations = this.generateGlobalRecommendations(components)

    // Collect alerts
    const alerts = this.collectActiveAlerts()

    return {
      overall,
      components,
      recommendations,
      alerts,
    }
  }

  /**
   * Perform comprehensive system optimization
   */
  async optimizeSystem(): Promise<{
    success: boolean
    optimizationsPerformed: string[]
    errors: string[]
    performanceImprovement: number
  }> {
    logger.info('Starting comprehensive system optimization', 'PerformanceManager')

    const startTime = performance.now()
    const optimizationsPerformed: string[] = []
    const errors: string[] = []

    // Get initial performance baseline
    const initialStatus = await this.getPerformanceStatus()
    const initialScore = this.statusToScore(initialStatus.overall)

    try {
      // Database optimization
      if (this.dbOptimizer) {
        try {
          await this.dbOptimizer.forceOptimize()
          optimizationsPerformed.push('Database optimization')
        } catch (error) {
          errors.push(`Database optimization failed: ${error}`)
        }
      }

      // Cache optimization
      if (this.cacheSystem) {
        try {
          await this.cacheSystem.optimize()
          optimizationsPerformed.push('Cache optimization')
        } catch (error) {
          errors.push(`Cache optimization failed: ${error}`)
        }
      }

      // Electron optimization
      if (this.electronOptimizer) {
        try {
          await this.electronOptimizer.forceOptimization()
          optimizationsPerformed.push('Electron optimization')
        } catch (error) {
          errors.push(`Electron optimization failed: ${error}`)
        }
      }

      // Memory cleanup
      if (this.memoryLeakDetector) {
        try {
          const cleanupResult = await this.memoryLeakDetector.attemptMemoryCleanup()
          if (cleanupResult.success) {
            optimizationsPerformed.push(
              `Memory cleanup (freed ${Math.round(cleanupResult.memoryFreed / 1024 / 1024)}MB)`,
            )
          }
        } catch (error) {
          errors.push(`Memory cleanup failed: ${error}`)
        }
      }

      // Wait for optimizations to take effect
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Get final performance status
      const finalStatus = await this.getPerformanceStatus()
      const finalScore = this.statusToScore(finalStatus.overall)
      const performanceImprovement = ((finalScore - initialScore) / initialScore) * 100

      const duration = performance.now() - startTime

      logger.info('System optimization completed', 'PerformanceManager', {
        duration: Math.round(duration),
        optimizations: optimizationsPerformed.length,
        errors: errors.length,
        improvement: Math.round(performanceImprovement),
      })

      this.emit('optimization-completed', {
        optimizationsPerformed,
        errors,
        performanceImprovement,
        duration,
      })

      return {
        success: errors.length === 0,
        optimizationsPerformed,
        errors,
        performanceImprovement,
      }
    } catch (error) {
      logger.error('System optimization failed', 'PerformanceManager', { error })
      return {
        success: false,
        optimizationsPerformed,
        errors: [...errors, `System optimization failed: ${error}`],
        performanceImprovement: 0,
      }
    }
  }

  /**
   * Get performance metrics from all components
   */
  getMetrics(): {
    database?: any
    streaming?: any
    cache?: any
    electron?: any
    monitor?: any
    memory?: any
    } {
    return {
      database: this.dbOptimizer?.getPerformanceMetrics(),
      streaming: this.streamingOptimizer?.getMetrics(),
      cache: this.cacheSystem?.getStats(),
      electron: this.electronOptimizer?.getMetrics(),
      monitor: this.performanceMonitor?.getCurrentMetrics(),
      memory: this.memoryLeakDetector?.getDetailedReport(),
    }
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(): Promise<{
    summary: any
    components: any
    recommendations: string[]
    historicalData: any
    exportedData: any
  }> {
    const status = await this.getPerformanceStatus()
    const metrics = this.getMetrics()

    const report = {
      summary: {
        overallStatus: status.overall,
        timestamp: new Date().toISOString(),
        activeAlerts: status.alerts.length,
        componentsHealthy: Object.values(status.components).filter(c => c.status === 'healthy')
          .length,
        totalComponents: Object.keys(status.components).length,
      },
      components: {
        database: {
          status: status.components.database.status,
          metrics: metrics.database,
          recommendations: this.getDatabaseRecommendations(),
        },
        streaming: {
          status: status.components.streaming.status,
          metrics: metrics.streaming,
          recommendations: this.getStreamingRecommendations(),
        },
        cache: {
          status: status.components.cache.status,
          metrics: metrics.cache,
          recommendations: this.getCacheRecommendations(),
        },
        electron: {
          status: status.components.electron.status,
          metrics: metrics.electron,
          recommendations: this.getElectronRecommendations(),
        },
        memory: {
          status: status.components.memory.status,
          metrics: metrics.memory,
          recommendations: this.getMemoryRecommendations(),
        },
      },
      recommendations: status.recommendations,
      historicalData: {
        monitor: this.performanceMonitor?.getHistoricalMetrics(Date.now() - 60 * 60 * 1000),
        memory: this.memoryLeakDetector?.getDetailedReport(),
      },
      exportedData: {
        monitor: this.performanceMonitor?.exportData(),
        cache: this.cacheSystem?.export(),
      },
    }

    return report
  }

  /**
   * Create optimized browser window
   */
  createOptimizedWindow(options: any = {}): any {
    if (this.electronOptimizer) {
      return this.electronOptimizer.createOptimizedWindow(options)
    }

    // Fallback to basic window creation
    logger.warn(
      'Electron optimizer not available, using basic window creation',
      'PerformanceManager',
    )
    return null
  }

  // Private helper methods

  private async getDatabaseStatus(): Promise<{ status: string; metrics: any }> {
    if (!this.dbOptimizer) {
      return { status: 'disabled', metrics: {} }
    }

    try {
      const metrics = this.dbOptimizer.getPerformanceMetrics()
      const avgQueryTime = metrics.averageQueryTime

      let status = 'healthy'
      if (avgQueryTime > this.config.alertThresholds.queryTime) {
        status = 'warning'
      }
      if (avgQueryTime > this.config.alertThresholds.queryTime * 2) {
        status = 'critical'
      }

      return { status, metrics }
    } catch (error) {
      return { status: 'error', metrics: { error: error.toString() } }
    }
  }

  private async getStreamingStatus(): Promise<{ status: string; metrics: any }> {
    if (!this.streamingOptimizer) {
      return { status: 'disabled', metrics: {} }
    }

    try {
      const metrics = this.streamingOptimizer.getMetrics()

      let status = 'healthy'
      if (metrics.bufferHealth === 'warning') {
        status = 'warning'
      }
      if (metrics.bufferHealth === 'critical') {
        status = 'critical'
      }

      return { status, metrics }
    } catch (error) {
      return { status: 'error', metrics: { error: error.toString() } }
    }
  }

  private async getCacheStatus(): Promise<{ status: string; metrics: any }> {
    if (!this.cacheSystem) {
      return { status: 'disabled', metrics: {} }
    }

    try {
      const metrics = this.cacheSystem.getStats()

      // Calculate average hit rate across all levels
      const hitRates = Object.values(metrics).map((level: any) => level.hitRatio || 0)
      const avgHitRate = hitRates.reduce((sum, rate) => sum + rate, 0) / hitRates.length

      let status = 'healthy'
      if (avgHitRate < 50) {
        status = 'warning'
      }
      if (avgHitRate < 25) {
        status = 'critical'
      }

      return { status, metrics: { ...metrics, avgHitRate } }
    } catch (error) {
      return { status: 'error', metrics: { error: error.toString() } }
    }
  }

  private async getElectronStatus(): Promise<{ status: string; metrics: any }> {
    if (!this.electronOptimizer) {
      return { status: 'disabled', metrics: {} }
    }

    try {
      const metrics = this.electronOptimizer.getMetrics()

      let status = 'healthy'
      if (metrics.memory.percentage > this.config.alertThresholds.memoryUsage) {
        status = 'warning'
      }
      if (metrics.memory.percentage > this.config.alertThresholds.memoryUsage * 1.2) {
        status = 'critical'
      }

      return { status, metrics }
    } catch (error) {
      return { status: 'error', metrics: { error: error.toString() } }
    }
  }

  private async getMemoryStatus(): Promise<{ status: string; metrics: any }> {
    if (!this.memoryLeakDetector) {
      return { status: 'disabled', metrics: {} }
    }

    try {
      const report = this.memoryLeakDetector.getDetailedReport()

      let status = 'healthy'
      if (report.summary.criticalLeaks > 0) {
        status = 'critical'
      } else if (report.summary.totalLeaks > 3) {
        status = 'warning'
      } else if (report.summary.healthScore < 70) {
        status = 'warning'
      }

      return { status, metrics: report }
    } catch (error) {
      return { status: 'error', metrics: { error: error.toString() } }
    }
  }

  private setupComponentListeners(): void {
    // Performance monitor alerts
    if (this.performanceMonitor) {
      this.performanceMonitor.on('performance-alert', alert => {
        this.emit('performance-alert', alert)

        if (alert.level === 'critical') {
          this.handleCriticalAlert(alert)
        }
      })
    }

    // Memory leak detector alerts
    if (this.memoryLeakDetector) {
      this.memoryLeakDetector.on('critical-leaks-detected', leaks => {
        this.emit('critical-memory-leaks', leaks)
        this.handleMemoryLeaks(leaks)
      })
    }

    // Cache events
    if (this.cacheSystem) {
      this.cacheSystem.on('memory-pressure', () => {
        this.emit('memory-pressure')
        this.handleMemoryPressure()
      })
    }

    // Streaming events
    if (this.streamingOptimizer) {
      this.streamingOptimizer.on('memory-pressure', () => {
        this.emit('streaming-memory-pressure')
      })
    }
  }

  private startAutoOptimization(): void {
    this.optimizationTimer = setInterval(async () => {
      logger.debug('Running auto-optimization', 'PerformanceManager')

      const status = await this.getPerformanceStatus()

      // Trigger optimization if performance is poor
      if (status.overall === 'poor' || status.overall === 'critical') {
        logger.info('Auto-optimization triggered due to poor performance', 'PerformanceManager')
        this.optimizeSystem().catch(error => {
          logger.error('Auto-optimization failed', 'PerformanceManager', { error })
        })
      }
    }, this.config.optimizationInterval)
  }

  private async handleCriticalAlert(alert: any): Promise<void> {
    logger.error('Critical performance alert', 'PerformanceManager', alert)

    // Auto-optimize for critical alerts
    if (this.config.autoOptimizationEnabled) {
      await this.optimizeSystem()
    }
  }

  private async handleMemoryLeaks(leaks: any[]): Promise<void> {
    logger.error('Critical memory leaks detected', 'PerformanceManager', { count: leaks.length })

    // Attempt memory cleanup
    if (this.memoryLeakDetector) {
      await this.memoryLeakDetector.attemptMemoryCleanup()
    }
  }

  private handleMemoryPressure(): void {
    logger.warn('Memory pressure detected', 'PerformanceManager')

    // Trigger cache cleanup
    if (this.cacheSystem) {
      // Implementation would trigger cache cleanup
    }

    // Force garbage collection if available
    if (this.memoryLeakDetector) {
      this.memoryLeakDetector.forceGarbageCollection()
    }
  }

  private generateGlobalRecommendations(components: any): string[] {
    const recommendations: string[] = []

    // Analyze component statuses
    const criticalComponents = Object.entries(components)
      .filter(([_, comp]: [string, any]) => comp.status === 'critical')
      .map(([name]) => name)

    if (criticalComponents.length > 0) {
      recommendations.push(`Critical issues detected in: ${criticalComponents.join(', ')}`)
      recommendations.push('Consider immediate optimization or restart')
    }

    const warningComponents = Object.entries(components)
      .filter(([_, comp]: [string, any]) => comp.status === 'warning')
      .map(([name]) => name)

    if (warningComponents.length > 2) {
      recommendations.push('Multiple components showing performance issues')
      recommendations.push('Run comprehensive system optimization')
    }

    // Global recommendations
    recommendations.push('Monitor system regularly for performance degradation')
    recommendations.push('Consider upgrading hardware if issues persist')

    return recommendations
  }

  private collectActiveAlerts(): Array<{ level: string; message: string; timestamp: number }> {
    const alerts: Array<{ level: string; message: string; timestamp: number }> = []

    // Collect from performance monitor
    if (this.performanceMonitor) {
      const monitorAlerts = this.performanceMonitor.getActiveAlerts()
      alerts.push(
        ...monitorAlerts.map(alert => ({
          level: alert.level,
          message: alert.message,
          timestamp: alert.timestamp,
        })),
      )
    }

    // Collect from memory detector
    if (this.memoryLeakDetector) {
      const memoryReport = this.memoryLeakDetector.getDetailedReport()
      const criticalLeaks = memoryReport.leaks.filter(leak => leak.severity === 'critical')

      alerts.push(
        ...criticalLeaks.map(leak => ({
          level: 'critical',
          message: `Memory leak: ${leak.description}`,
          timestamp: leak.firstDetected,
        })),
      )
    }

    return alerts.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10) // Last 10 alerts
  }

  private statusToScore(status: string): number {
    switch (status) {
      case 'excellent':
        return 100
      case 'good':
        return 80
      case 'healthy':
        return 75
      case 'fair':
        return 60
      case 'warning':
        return 40
      case 'poor':
        return 30
      case 'critical':
        return 10
      case 'error':
        return 5
      default:
        return 50
    }
  }

  private scoreToStatus(score: number): PerformanceStatus['overall'] {
    if (score >= 90) return 'excellent'
    if (score >= 75) return 'good'
    if (score >= 60) return 'fair'
    if (score >= 30) return 'poor'
    return 'critical'
  }

  private getDatabaseRecommendations(): string[] {
    if (!this.dbOptimizer) return []

    const metrics = this.dbOptimizer.getPerformanceMetrics()
    const recommendations: string[] = []

    if (metrics.averageQueryTime > 500) {
      recommendations.push('Consider adding database indexes for slow queries')
      recommendations.push('Enable query result caching')
    }

    if (metrics.cacheHitRate < 50) {
      recommendations.push('Increase database cache size')
      recommendations.push('Review query patterns for optimization')
    }

    return recommendations
  }

  private getStreamingRecommendations(): string[] {
    if (!this.streamingOptimizer) return []

    const metrics = this.streamingOptimizer.getMetrics()
    const recommendations: string[] = []

    if (metrics.bufferHealth === 'warning' || metrics.bufferHealth === 'critical') {
      recommendations.push('Increase streaming buffer sizes')
      recommendations.push('Enable adaptive buffering')
    }

    if (metrics.latency.average > 100) {
      recommendations.push('Optimize network connection')
      recommendations.push('Consider chunking strategy adjustment')
    }

    return recommendations
  }

  private getCacheRecommendations(): string[] {
    if (!this.cacheSystem) return []

    const stats = this.cacheSystem.getStats()
    const recommendations: string[] = []

    // Implementation would analyze cache stats and provide recommendations
    recommendations.push('Monitor cache hit rates regularly')
    recommendations.push('Consider cache size adjustments based on usage patterns')

    return recommendations
  }

  private getElectronRecommendations(): string[] {
    if (!this.electronOptimizer) return []

    const recommendations: string[] = []

    recommendations.push('Monitor renderer process memory usage')
    recommendations.push('Enable hardware acceleration if available')
    recommendations.push('Consider process isolation for better stability')

    return recommendations
  }

  private getMemoryRecommendations(): string[] {
    if (!this.memoryLeakDetector) return []

    const report = this.memoryLeakDetector.getDetailedReport()
    return report.recommendations
  }

  /**
   * Cleanup and destroy manager
   */
  destroy(): void {
    logger.info('Destroying Performance Manager', 'PerformanceManager')

    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer)
      this.optimizationTimer = null
    }

    // Destroy all components
    this.dbOptimizer?.destroy()
    this.streamingOptimizer?.cleanup()
    this.cacheSystem?.destroy()
    this.electronOptimizer?.cleanup()
    this.performanceMonitor?.destroy()
    this.memoryLeakDetector?.destroy()

    this.componentHealthStatus.clear()
    this.removeAllListeners()

    this.isInitialized = false

    logger.info('Performance Manager destroyed', 'PerformanceManager')
  }
}

/**
 * Global performance manager instance factory
 */
export function createPerformanceManager(
  config?: Partial<PerformanceManagerConfig>,
): PerformanceManager {
  return new PerformanceManager(config)
}
