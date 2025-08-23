/**
 * 内存监控器 - 检测和报告内存泄漏
 */

import { app } from 'electron'
import { logger } from '../utils/Logger'
import * as v8 from 'v8'
import * as process from 'process'

export interface MemorySnapshot {
  timestamp: number
  heapUsed: number
  heapTotal: number
  external: number
  rss: number
  arrayBuffers: number
}

export interface MemoryLeak {
  type: 'heap' | 'external' | 'rss'
  growth: number
  duration: number
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export class MemoryMonitor {
  private static instance: MemoryMonitor
  private snapshots: MemorySnapshot[] = []
  private monitorInterval: NodeJS.Timeout | null = null
  private readonly maxSnapshots = 60 // Keep 1 hour of data (1 snapshot per minute)
  private readonly leakThreshold = {
    heap: 50 * 1024 * 1024, // 50MB growth
    external: 20 * 1024 * 1024, // 20MB growth
    rss: 100 * 1024 * 1024 // 100MB growth
  }
  private readonly monitoringInterval = 60000 // 1 minute

  private constructor() {}

  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor()
    }
    return MemoryMonitor.instance
  }

  /**
   * 开始内存监控
   */
  startMonitoring(): void {
    if (this.monitorInterval) {
      logger.warn('Memory monitoring already started', 'MemoryMonitor')
      return
    }

    logger.info('Starting memory monitoring', 'MemoryMonitor')

    // Take initial snapshot
    this.takeSnapshot()

    // Start periodic monitoring
    this.monitorInterval = setInterval(() => {
      this.takeSnapshot()
      this.detectLeaks()
      this.cleanOldSnapshots()
    }, this.monitoringInterval)

    // Monitor garbage collection
    this.setupGCMonitoring()
  }

  /**
   * 停止内存监控
   */
  stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval)
      this.monitorInterval = null
      logger.info('Stopped memory monitoring', 'MemoryMonitor')
    }
  }

  /**
   * 拍摄内存快照
   */
  takeSnapshot(): MemorySnapshot {
    const memUsage = process.memoryUsage()

    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      arrayBuffers: memUsage.arrayBuffers || 0
    }

    this.snapshots.push(snapshot)

    // Log current memory usage
    logger.debug(
      `Memory snapshot: Heap ${this.formatBytes(snapshot.heapUsed)}/${this.formatBytes(snapshot.heapTotal)}, RSS ${this.formatBytes(snapshot.rss)}`,
      'MemoryMonitor'
    )

    return snapshot
  }

  /**
   * 检测内存泄漏
   */
  detectLeaks(): MemoryLeak[] {
    const leaks: MemoryLeak[] = []

    if (this.snapshots.length < 5) {
      return leaks // Need at least 5 snapshots to detect trends
    }

    // Check last 5 snapshots for consistent growth
    const recentSnapshots = this.snapshots.slice(-5)
    const firstSnapshot = recentSnapshots[0]
    const lastSnapshot = recentSnapshots[recentSnapshots.length - 1]
    const duration = lastSnapshot.timestamp - firstSnapshot.timestamp

    // Check heap memory growth
    const heapGrowth = lastSnapshot.heapUsed - firstSnapshot.heapUsed
    if (heapGrowth > this.leakThreshold.heap) {
      leaks.push({
        type: 'heap',
        growth: heapGrowth,
        duration,
        severity: this.calculateSeverity(heapGrowth, this.leakThreshold.heap)
      })

      logger.warn(
        `Potential heap memory leak detected: ${this.formatBytes(heapGrowth)} growth over ${Math.round(duration / 60000)} minutes`,
        'MemoryMonitor'
      )
    }

    // Check external memory growth
    const externalGrowth = lastSnapshot.external - firstSnapshot.external
    if (externalGrowth > this.leakThreshold.external) {
      leaks.push({
        type: 'external',
        growth: externalGrowth,
        duration,
        severity: this.calculateSeverity(externalGrowth, this.leakThreshold.external)
      })

      logger.warn(
        `Potential external memory leak detected: ${this.formatBytes(externalGrowth)} growth`,
        'MemoryMonitor'
      )
    }

    // Check RSS growth
    const rssGrowth = lastSnapshot.rss - firstSnapshot.rss
    if (rssGrowth > this.leakThreshold.rss) {
      leaks.push({
        type: 'rss',
        growth: rssGrowth,
        duration,
        severity: this.calculateSeverity(rssGrowth, this.leakThreshold.rss)
      })

      logger.warn(
        `Potential RSS memory leak detected: ${this.formatBytes(rssGrowth)} growth`,
        'MemoryMonitor'
      )
    }

    // Take heap snapshot if critical leak detected
    if (leaks.some(l => l.severity === 'critical')) {
      this.takeHeapSnapshot()
    }

    return leaks
  }

  /**
   * 强制垃圾回收
   */
  forceGC(): void {
    if (global.gc) {
      logger.info('Forcing garbage collection', 'MemoryMonitor')
      global.gc()

      // Take snapshot after GC
      setTimeout(() => {
        this.takeSnapshot()
      }, 1000)
    } else {
      logger.warn('Garbage collection not exposed. Run with --expose-gc flag', 'MemoryMonitor')
    }
  }

  /**
   * 获取内存统计
   */
  getMemoryStats(): {
    current: MemorySnapshot | null
    average: MemorySnapshot | null
    peak: MemorySnapshot | null
    leaks: MemoryLeak[]
  } {
    if (this.snapshots.length === 0) {
      return { current: null, average: null, peak: null, leaks: [] }
    }

    const current = this.snapshots[this.snapshots.length - 1]

    // Calculate average
    const average: MemorySnapshot = {
      timestamp: Date.now(),
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      rss: 0,
      arrayBuffers: 0
    }

    this.snapshots.forEach(s => {
      average.heapUsed += s.heapUsed
      average.heapTotal += s.heapTotal
      average.external += s.external
      average.rss += s.rss
      average.arrayBuffers += s.arrayBuffers
    })

    const count = this.snapshots.length
    average.heapUsed /= count
    average.heapTotal /= count
    average.external /= count
    average.rss /= count
    average.arrayBuffers /= count

    // Find peak
    const peak = this.snapshots.reduce((max, s) => (s.heapUsed > max.heapUsed ? s : max))

    return {
      current,
      average,
      peak,
      leaks: this.detectLeaks()
    }
  }

  /**
   * 导出内存报告
   */
  exportReport(): string {
    const stats = this.getMemoryStats()
    const report = {
      timestamp: new Date().toISOString(),
      app: {
        version: app.getVersion(),
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version
      },
      memory: {
        current: stats.current,
        average: stats.average,
        peak: stats.peak
      },
      leaks: stats.leaks,
      snapshots: this.snapshots
    }

    return JSON.stringify(report, null, 2)
  }

  // ===== Private Methods =====

  private setupGCMonitoring(): void {
    // Try to get GC statistics if available
    try {
      const gcStats = v8.getHeapStatistics()
      logger.debug('Heap statistics', 'MemoryMonitor', {
        totalHeapSize: this.formatBytes(gcStats.total_heap_size),
        usedHeapSize: this.formatBytes(gcStats.used_heap_size),
        heapSizeLimit: this.formatBytes(gcStats.heap_size_limit)
      })
    } catch (error) {
      logger.debug('Could not get heap statistics', 'MemoryMonitor')
    }
  }

  private takeHeapSnapshot(): void {
    try {
      const heapSnapshot = v8.writeHeapSnapshot()
      logger.info(`Heap snapshot written: ${heapSnapshot}`, 'MemoryMonitor')
    } catch (error) {
      logger.error('Failed to write heap snapshot', 'MemoryMonitor', error)
    }
  }

  private cleanOldSnapshots(): void {
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots = this.snapshots.slice(-this.maxSnapshots)
    }
  }

  private calculateSeverity(
    growth: number,
    threshold: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    const ratio = growth / threshold
    if (ratio < 1.5) return 'low'
    if (ratio < 2) return 'medium'
    if (ratio < 3) return 'high'
    return 'critical'
  }

  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']
    let value = bytes
    let unitIndex = 0

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024
      unitIndex++
    }

    return `${value.toFixed(2)} ${units[unitIndex]}`
  }
}

// Export singleton
export const memoryMonitor = MemoryMonitor.getInstance()
