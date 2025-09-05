import { EventEmitter } from 'events'
import { BrowserWindow } from 'electron'
import { logger } from '../utils/Logger'

export interface MemorySnapshot {
  timestamp: number
  heapUsed: number
  heapTotal: number
  external: number
  arrayBuffers: number
  total: number
  processId: number
  windowId?: number
}

export interface MemoryLeak {
  id: string
  type: 'heap-growth' | 'external-growth' | 'event-listeners' | 'dom-nodes' | 'objects'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  firstDetected: number
  lastSeen: number
  growthRate: number // bytes per second
  samples: MemorySnapshot[]
  source?: string
  recommendations: string[]
}

export interface DetectionConfig {
  enabled: boolean
  snapshotInterval: number // ms
  analysisInterval: number // ms
  retentionPeriod: number // ms
  thresholds: {
    heapGrowthRate: number // bytes per second
    externalGrowthRate: number // bytes per second
    totalMemoryLimit: number // bytes
    consecutiveGrowthPeriods: number
  }
  enableGCTrigger: boolean
  enableDetailedAnalysis: boolean
}

export interface DetectionResult {
  leaks: MemoryLeak[]
  healthScore: number // 0-100
  recommendations: string[]
  totalMemoryUsage: number
  growthTrend: 'stable' | 'growing' | 'shrinking'
}

/**
 * Advanced memory leak detection and analysis system
 * Monitors heap growth, external memory, event listeners, and DOM nodes
 */
export class MemoryLeakDetector extends EventEmitter {
  private config: DetectionConfig
  private snapshots: MemorySnapshot[] = []
  private detectedLeaks: MemoryLeak[] = []
  private snapshotTimer: NodeJS.Timeout | null = null
  private analysisTimer: NodeJS.Timeout | null = null
  private cleanupTimer: NodeJS.Timeout | null = null

  // Advanced tracking
  private objectReferences = new Map<string, WeakRef<object>>()
  private eventListenerCount = new Map<string, number>()
  private gcCallbacks: (() => void)[] = []

  constructor(config: Partial<DetectionConfig> = {}) {
    super()

    this.config = {
      enabled: true,
      snapshotInterval: 10000, // 10 seconds
      analysisInterval: 60000, // 1 minute
      retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
      thresholds: {
        heapGrowthRate: 1024 * 1024, // 1MB per second
        externalGrowthRate: 512 * 1024, // 512KB per second
        totalMemoryLimit: 500 * 1024 * 1024, // 500MB
        consecutiveGrowthPeriods: 5
      },
      enableGCTrigger: true,
      enableDetailedAnalysis: true,
      ...config
    }

    this.initialize()
  }

  private initialize(): void {
    if (!this.config.enabled) {
      logger.info('Memory leak detector disabled', 'MemoryLeakDetector')
      return
    }

    logger.info('Initializing memory leak detector', 'MemoryLeakDetector', this.config)

    // Start periodic snapshots
    this.startSnapshotCollection()

    // Start periodic analysis
    this.startPeriodicAnalysis()

    // Start cleanup timer
    this.startCleanupTimer()

    // Setup process monitoring
    this.setupProcessMonitoring()

    // Setup GC callbacks
    this.setupGCCallbacks()
  }

  /**
   * Take a memory snapshot
   */
  takeSnapshot(windowId?: number): MemorySnapshot {
    const memoryUsage = process.memoryUsage()

    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external,
      arrayBuffers: memoryUsage.arrayBuffers,
      total: memoryUsage.heapUsed + memoryUsage.external,
      processId: process.pid,
      windowId
    }

    this.snapshots.push(snapshot)
    this.emit('snapshot-taken', snapshot)

    return snapshot
  }

  /**
   * Analyze current memory state for leaks
   */
  analyzeMemoryLeaks(): DetectionResult {
    const recentSnapshots = this.getRecentSnapshots(this.config.analysisInterval * 5)

    if (recentSnapshots.length < 2) {
      return {
        leaks: [],
        healthScore: 100,
        recommendations: [],
        totalMemoryUsage: this.getCurrentMemoryUsage(),
        growthTrend: 'stable'
      }
    }

    const leaks: MemoryLeak[] = []

    // Detect heap growth leaks
    const heapLeaks = this.detectHeapGrowthLeaks(recentSnapshots)
    leaks.push(...heapLeaks)

    // Detect external memory leaks
    const externalLeaks = this.detectExternalMemoryLeaks(recentSnapshots)
    leaks.push(...externalLeaks)

    // Detect event listener leaks (if detailed analysis enabled)
    if (this.config.enableDetailedAnalysis) {
      const listenerLeaks = this.detectEventListenerLeaks()
      leaks.push(...listenerLeaks)
    }

    // Update existing leaks
    this.updateExistingLeaks(leaks)

    // Calculate health score
    const healthScore = this.calculateHealthScore(leaks, recentSnapshots)

    // Generate recommendations
    const recommendations = this.generateRecommendations(leaks, recentSnapshots)

    // Determine growth trend
    const growthTrend = this.analyzeGrowthTrend(recentSnapshots)

    const result: DetectionResult = {
      leaks,
      healthScore,
      recommendations,
      totalMemoryUsage: this.getCurrentMemoryUsage(),
      growthTrend
    }

    this.emit('analysis-complete', result)

    return result
  }

  /**
   * Force garbage collection if available
   */
  forceGarbageCollection(): boolean {
    if (this.config.enableGCTrigger && global.gc) {
      logger.info('Forcing garbage collection', 'MemoryLeakDetector')
      global.gc()

      // Take snapshot after GC
      setTimeout(() => {
        this.takeSnapshot()
        this.emit('gc-forced')
      }, 1000)

      return true
    }

    return false
  }

  /**
   * Track object reference for leak detection
   */
  trackObject(id: string, object: object): void {
    if (this.config.enableDetailedAnalysis) {
      this.objectReferences.set(id, new WeakRef(object))
    }
  }

  /**
   * Track event listener count
   */
  trackEventListeners(source: string, count: number): void {
    if (this.config.enableDetailedAnalysis) {
      this.eventListenerCount.set(source, count)
    }
  }

  /**
   * Get current memory usage
   */
  getCurrentMemoryUsage(): number {
    const memoryUsage = process.memoryUsage()
    return memoryUsage.heapUsed + memoryUsage.external
  }

  /**
   * Get memory usage trend
   */
  getMemoryTrend(periodMs: number = 5 * 60 * 1000): {
    trend: 'growing' | 'shrinking' | 'stable'
    growthRate: number
    samples: MemorySnapshot[]
  } {
    const recentSnapshots = this.getRecentSnapshots(periodMs)

    if (recentSnapshots.length < 2) {
      return {
        trend: 'stable',
        growthRate: 0,
        samples: recentSnapshots
      }
    }

    const firstSnapshot = recentSnapshots[0]
    const lastSnapshot = recentSnapshots[recentSnapshots.length - 1]
    const timeDiff = lastSnapshot.timestamp - firstSnapshot.timestamp
    const memoryDiff = lastSnapshot.total - firstSnapshot.total
    const growthRate = (memoryDiff / timeDiff) * 1000 // bytes per second

    let trend: 'growing' | 'shrinking' | 'stable' = 'stable'
    if (Math.abs(growthRate) > 1024) {
      // 1KB/s threshold
      trend = growthRate > 0 ? 'growing' : 'shrinking'
    }

    return {
      trend,
      growthRate,
      samples: recentSnapshots
    }
  }

  /**
   * Get detailed leak report
   */
  getDetailedReport(): {
    summary: {
      totalLeaks: number
      criticalLeaks: number
      totalMemoryUsage: number
      healthScore: number
    }
    leaks: MemoryLeak[]
    snapshots: MemorySnapshot[]
    recommendations: string[]
  } {
    const analysis = this.analyzeMemoryLeaks()
    const criticalLeaks = analysis.leaks.filter(leak => leak.severity === 'critical').length

    return {
      summary: {
        totalLeaks: analysis.leaks.length,
        criticalLeaks,
        totalMemoryUsage: analysis.totalMemoryUsage,
        healthScore: analysis.healthScore
      },
      leaks: [...this.detectedLeaks],
      snapshots: [...this.snapshots].slice(-50), // Last 50 snapshots
      recommendations: analysis.recommendations
    }
  }

  /**
   * Attempt to fix detected memory leaks
   */
  attemptMemoryCleanup(): {
    actionsPerformed: string[]
    memoryFreed: number
    success: boolean
  } {
    const initialMemory = this.getCurrentMemoryUsage()
    const actionsPerformed: string[] = []

    try {
      // Force garbage collection
      if (this.forceGarbageCollection()) {
        actionsPerformed.push('Forced garbage collection')
      }

      // Clean up weak references
      this.cleanupWeakReferences()
      actionsPerformed.push('Cleaned up weak references')

      // Clear caches in windows
      this.cleanupWindowCaches()
      actionsPerformed.push('Cleared window caches')

      // Trigger manual cleanup callbacks
      this.triggerCleanupCallbacks()
      actionsPerformed.push('Triggered cleanup callbacks')

      // Wait a bit for cleanup to take effect
      return new Promise(resolve => {
        setTimeout(() => {
          const finalMemory = this.getCurrentMemoryUsage()
          const memoryFreed = initialMemory - finalMemory

          resolve({
            actionsPerformed,
            memoryFreed,
            success: memoryFreed > 0
          })
        }, 2000)
      }) as any
    } catch (error) {
      logger.error('Memory cleanup failed', 'MemoryLeakDetector', { error })
      return {
        actionsPerformed,
        memoryFreed: 0,
        success: false
      }
    }
  }

  // Private implementation methods

  private startSnapshotCollection(): void {
    this.snapshotTimer = setInterval(() => {
      this.takeSnapshot()
    }, this.config.snapshotInterval)

    // Take initial snapshot
    this.takeSnapshot()
  }

  private startPeriodicAnalysis(): void {
    this.analysisTimer = setInterval(() => {
      const result = this.analyzeMemoryLeaks()

      // Emit alerts for critical leaks
      const criticalLeaks = result.leaks.filter(leak => leak.severity === 'critical')
      if (criticalLeaks.length > 0) {
        this.emit('critical-leaks-detected', criticalLeaks)
      }

      // Auto-cleanup if health score is too low
      if (result.healthScore < 30) {
        logger.warn('Low memory health score, attempting cleanup', 'MemoryLeakDetector', {
          healthScore: result.healthScore,
          leaksCount: result.leaks.length
        })
        this.attemptMemoryCleanup()
      }
    }, this.config.analysisInterval)
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(
      () => {
        this.cleanupOldData()
      },
      60 * 60 * 1000
    ) // Every hour
  }

  private setupProcessMonitoring(): void {
    // Monitor memory warnings
    if (process.listenerCount('warning') === 0) {
      process.on('warning', warning => {
        if (warning.name === 'MaxListenersExceededWarning') {
          this.createEventListenerLeak(warning.message)
        }
      })
    }
  }

  private setupGCCallbacks(): void {
    // Setup finalization registry for object tracking
    if ('FinalizationRegistry' in global && this.config.enableDetailedAnalysis) {
      const registry = new FinalizationRegistry((id: string) => {
        this.objectReferences.delete(id)
      })

      // Track object lifecycle
      const originalTrackObject = this.trackObject.bind(this)
      this.trackObject = (id: string, object: object) => {
        originalTrackObject(id, object)
        registry.register(object, id)
      }
    }
  }

  private detectHeapGrowthLeaks(snapshots: MemorySnapshot[]): MemoryLeak[] {
    const leaks: MemoryLeak[] = []

    if (snapshots.length < this.config.thresholds.consecutiveGrowthPeriods) {
      return leaks
    }

    // Check for consistent heap growth
    let consecutiveGrowth = 0
    let totalGrowth = 0

    for (let i = 1; i < snapshots.length; i++) {
      const prev = snapshots[i - 1]
      const current = snapshots[i]
      const timeDiff = (current.timestamp - prev.timestamp) / 1000
      const heapDiff = current.heapUsed - prev.heapUsed
      const growthRate = heapDiff / timeDiff

      if (growthRate > this.config.thresholds.heapGrowthRate) {
        consecutiveGrowth++
        totalGrowth += heapDiff
      } else {
        consecutiveGrowth = 0
      }
    }

    if (consecutiveGrowth >= this.config.thresholds.consecutiveGrowthPeriods) {
      const leak: MemoryLeak = {
        id: `heap_leak_${Date.now()}`,
        type: 'heap-growth',
        severity: this.calculateLeakSeverity(totalGrowth),
        description: `Consistent heap growth detected over ${consecutiveGrowth} periods`,
        firstDetected: snapshots[snapshots.length - consecutiveGrowth].timestamp,
        lastSeen: Date.now(),
        growthRate:
          totalGrowth /
          ((snapshots[snapshots.length - 1].timestamp -
            snapshots[snapshots.length - consecutiveGrowth].timestamp) /
            1000),
        samples: snapshots.slice(-consecutiveGrowth),
        recommendations: [
          'Check for objects not being properly garbage collected',
          'Review closure usage and event listener cleanup',
          'Consider implementing weak references for large objects'
        ]
      }

      leaks.push(leak)
    }

    return leaks
  }

  private detectExternalMemoryLeaks(snapshots: MemorySnapshot[]): MemoryLeak[] {
    const leaks: MemoryLeak[] = []

    if (snapshots.length < 2) return leaks

    const recent = snapshots.slice(-10) // Last 10 snapshots
    const externalGrowth = recent[recent.length - 1].external - recent[0].external
    const timeDiff = (recent[recent.length - 1].timestamp - recent[0].timestamp) / 1000
    const growthRate = externalGrowth / timeDiff

    if (growthRate > this.config.thresholds.externalGrowthRate) {
      const leak: MemoryLeak = {
        id: `external_leak_${Date.now()}`,
        type: 'external-growth',
        severity: this.calculateLeakSeverity(externalGrowth),
        description: `External memory growing at ${Math.round(growthRate / 1024)}KB/s`,
        firstDetected: recent[0].timestamp,
        lastSeen: Date.now(),
        growthRate,
        samples: recent,
        recommendations: [
          'Check for Buffer objects not being freed',
          'Review native addon memory usage',
          'Monitor ArrayBuffer and TypedArray usage'
        ]
      }

      leaks.push(leak)
    }

    return leaks
  }

  private detectEventListenerLeaks(): MemoryLeak[] {
    const leaks: MemoryLeak[] = []

    for (const [source, count] of this.eventListenerCount.entries()) {
      if (count > 100) {
        // Threshold for too many listeners
        const leak: MemoryLeak = {
          id: `listeners_leak_${source}_${Date.now()}`,
          type: 'event-listeners',
          severity: count > 1000 ? 'critical' : count > 500 ? 'high' : 'medium',
          description: `High number of event listeners (${count}) on ${source}`,
          firstDetected: Date.now(),
          lastSeen: Date.now(),
          growthRate: 0,
          samples: [],
          source,
          recommendations: [
            'Remove unused event listeners',
            'Use WeakMap for event handler references',
            'Implement proper cleanup in component lifecycle'
          ]
        }

        leaks.push(leak)
      }
    }

    return leaks
  }

  private updateExistingLeaks(newLeaks: MemoryLeak[]): void {
    // Update existing leaks or add new ones
    for (const newLeak of newLeaks) {
      const existingIndex = this.detectedLeaks.findIndex(
        existing => existing.type === newLeak.type && existing.source === newLeak.source
      )

      if (existingIndex >= 0) {
        // Update existing leak
        const existing = this.detectedLeaks[existingIndex]
        existing.lastSeen = newLeak.lastSeen
        existing.growthRate = newLeak.growthRate
        existing.severity = newLeak.severity
        existing.samples = [...existing.samples, ...newLeak.samples].slice(-20) // Keep last 20
      } else {
        // Add new leak
        this.detectedLeaks.push(newLeak)
      }
    }

    // Remove resolved leaks (not seen for a while)
    const cutoffTime = Date.now() - 5 * 60 * 1000 // 5 minutes
    this.detectedLeaks = this.detectedLeaks.filter(leak => leak.lastSeen > cutoffTime)
  }

  private calculateHealthScore(leaks: MemoryLeak[], snapshots: MemorySnapshot[]): number {
    let score = 100

    // Penalize for leaks by severity
    for (const leak of leaks) {
      switch (leak.severity) {
        case 'critical':
          score -= 25
          break
        case 'high':
          score -= 15
          break
        case 'medium':
          score -= 10
          break
        case 'low':
          score -= 5
          break
      }
    }

    // Penalize for high memory usage
    if (snapshots.length > 0) {
      const currentMemory = snapshots[snapshots.length - 1].total
      const memoryPercentage = (currentMemory / this.config.thresholds.totalMemoryLimit) * 100

      if (memoryPercentage > 90) {
        score -= 20
      } else if (memoryPercentage > 75) {
        score -= 10
      } else if (memoryPercentage > 60) {
        score -= 5
      }
    }

    return Math.max(0, score)
  }

  private generateRecommendations(leaks: MemoryLeak[], snapshots: MemorySnapshot[]): string[] {
    const recommendations = new Set<string>()

    // Leak-specific recommendations
    for (const leak of leaks) {
      leak.recommendations.forEach(rec => recommendations.add(rec))
    }

    // General recommendations based on memory usage
    if (snapshots.length > 0) {
      const currentMemory = snapshots[snapshots.length - 1].total
      const memoryMB = currentMemory / (1024 * 1024)

      if (memoryMB > 400) {
        recommendations.add('Consider implementing memory limits for large operations')
        recommendations.add('Enable more aggressive garbage collection')
      }

      if (memoryMB > 250) {
        recommendations.add('Monitor and limit cache sizes')
        recommendations.add('Implement periodic cleanup routines')
      }
    }

    // Growth trend recommendations
    const trend = this.analyzeGrowthTrend(snapshots)
    if (trend === 'growing') {
      recommendations.add('Investigate continuous memory growth patterns')
      recommendations.add('Check for accumulating objects in global scope')
    }

    return Array.from(recommendations)
  }

  private analyzeGrowthTrend(snapshots: MemorySnapshot[]): 'stable' | 'growing' | 'shrinking' {
    if (snapshots.length < 3) return 'stable'

    const recent = snapshots.slice(-10)
    const growthValues = []

    for (let i = 1; i < recent.length; i++) {
      growthValues.push(recent[i].total - recent[i - 1].total)
    }

    const avgGrowth = growthValues.reduce((sum, val) => sum + val, 0) / growthValues.length

    if (avgGrowth > 1024 * 1024) return 'growing' // 1MB average growth
    if (avgGrowth < -1024 * 1024) return 'shrinking'
    return 'stable'
  }

  private calculateLeakSeverity(growthBytes: number): MemoryLeak['severity'] {
    const growthMB = growthBytes / (1024 * 1024)

    if (growthMB > 100) return 'critical'
    if (growthMB > 50) return 'high'
    if (growthMB > 10) return 'medium'
    return 'low'
  }

  private getRecentSnapshots(periodMs: number): MemorySnapshot[] {
    const cutoffTime = Date.now() - periodMs
    return this.snapshots.filter(snapshot => snapshot.timestamp >= cutoffTime)
  }

  private createEventListenerLeak(message: string): void {
    const leak: MemoryLeak = {
      id: `event_listener_warning_${Date.now()}`,
      type: 'event-listeners',
      severity: 'medium',
      description: `Event listener warning: ${message}`,
      firstDetected: Date.now(),
      lastSeen: Date.now(),
      growthRate: 0,
      samples: [],
      recommendations: [
        'Check for EventEmitter memory leaks',
        'Remove unused event listeners',
        'Use once() instead of on() where appropriate'
      ]
    }

    this.detectedLeaks.push(leak)
    this.emit('memory-leak-detected', leak)
  }

  private cleanupWeakReferences(): void {
    let cleaned = 0

    for (const [id, ref] of this.objectReferences.entries()) {
      if (!ref.deref()) {
        this.objectReferences.delete(id)
        cleaned++
      }
    }

    logger.debug('Cleaned up weak references', 'MemoryLeakDetector', { cleaned })
  }

  private async cleanupWindowCaches(): Promise<void> {
    const windows = BrowserWindow.getAllWindows()

    for (const window of windows) {
      try {
        if (window.webContents && !window.webContents.isDestroyed()) {
          await window.webContents.session.clearCache()
          await window.webContents.session.clearStorageData({
            storages: ['indexdb', 'websql']
          })
        }
      } catch (error) {
        // Ignore individual window errors
      }
    }
  }

  private triggerCleanupCallbacks(): void {
    for (const callback of this.gcCallbacks) {
      try {
        callback()
      } catch (error) {
        logger.warn('Cleanup callback failed', 'MemoryLeakDetector', { error })
      }
    }
  }

  private cleanupOldData(): void {
    const cutoffTime = Date.now() - this.config.retentionPeriod

    // Clean up old snapshots
    this.snapshots = this.snapshots.filter(s => s.timestamp > cutoffTime)

    // Clean up old leaks
    this.detectedLeaks = this.detectedLeaks.filter(l => l.lastSeen > cutoffTime)

    logger.debug('Memory leak detector data cleanup', 'MemoryLeakDetector', {
      snapshots: this.snapshots.length,
      leaks: this.detectedLeaks.length
    })
  }

  /**
   * Register cleanup callback to be called during memory pressure
   */
  registerCleanupCallback(callback: () => void): () => void {
    this.gcCallbacks.push(callback)

    return () => {
      const index = this.gcCallbacks.indexOf(callback)
      if (index > -1) {
        this.gcCallbacks.splice(index, 1)
      }
    }
  }

  /**
   * Cleanup and destroy detector
   */
  destroy(): void {
    if (this.snapshotTimer) {
      clearInterval(this.snapshotTimer)
      this.snapshotTimer = null
    }

    if (this.analysisTimer) {
      clearInterval(this.analysisTimer)
      this.analysisTimer = null
    }

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }

    this.objectReferences.clear()
    this.eventListenerCount.clear()
    this.gcCallbacks = []
    this.removeAllListeners()

    logger.info('Memory leak detector destroyed', 'MemoryLeakDetector')
  }
}

/**
 * Global memory leak detector factory
 */
export function createMemoryLeakDetector(config?: Partial<DetectionConfig>): MemoryLeakDetector {
  return new MemoryLeakDetector(config)
}
