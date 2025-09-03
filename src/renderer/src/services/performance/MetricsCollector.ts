import type { Ref } from 'vue'

export interface FrontendMetrics {
  timestamp: number
  performance: {
    renderTime: number
    fps: number
    domNodes: number
    eventListeners: number
    memoryUsage: number
  }
  ui: {
    messageCount: number
    scrollPosition: number
    visibleMessages: number
    activeAnimations: number
    lastInteractionTime: number
  }
  network: {
    activeRequests: number
    requestQueue: number
    responseTime: number
    bytesTransferred: number
  }
  user: {
    clicks: number
    keystrokes: number
    scrollEvents: number
    sessionDuration: number
  }
}

export interface PerformanceThresholds {
  maxRenderTime: number // ms
  minFPS: number
  maxMemoryUsage: number // MB
  maxResponseTime: number // ms
  maxDOMNodes: number
}

export interface PerformanceAlert {
  id: string
  type: 'warning' | 'error' | 'critical'
  metric: string
  value: number
  threshold: number
  timestamp: number
  message: string
}

/**
 * Frontend performance metrics collection service
 * Monitors UI performance, user interactions, and system health
 */
export class MetricsCollector {
  private metrics: FrontendMetrics[] = []
  private alerts: PerformanceAlert[] = []
  private observers: Map<string, any> = new Map()
  private isCollecting = false
  private collectionInterval: number | null = null
  private readonly thresholds: PerformanceThresholds

  // Performance tracking state
  private renderTimes: number[] = []
  private frameTimestamps: number[] = []
  private networkRequests = new Map<string, { startTime: number; size: number }>()
  private userInteractions = {
    clicks: 0,
    keystrokes: 0,
    scrollEvents: 0,
    sessionStart: Date.now(),
  }

  constructor(thresholds: Partial<PerformanceThresholds> = {}) {
    this.thresholds = {
      maxRenderTime: 100, // ms
      minFPS: 30,
      maxMemoryUsage: 500, // MB
      maxResponseTime: 2000, // ms
      maxDOMNodes: 10000,
      ...thresholds,
    }

    this.setupPerformanceObservers()
    this.setupUserInteractionTracking()
  }

  /**
   * Start metrics collection
   */
  startCollection(intervalMs: number = 5000): void {
    if (this.isCollecting) {
      return
    }

    this.isCollecting = true
    this.collectionInterval = window.setInterval(() => {
      this.collectMetrics()
    }, intervalMs)

    // Collect initial metrics immediately
    this.collectMetrics()

    console.log('Frontend metrics collection started', { interval: intervalMs })
  }

  /**
   * Stop metrics collection
   */
  stopCollection(): void {
    if (!this.isCollecting) {
      return
    }

    this.isCollecting = false

    if (this.collectionInterval) {
      clearInterval(this.collectionInterval)
      this.collectionInterval = null
    }

    this.cleanup()
    console.log('Frontend metrics collection stopped')
  }

  /**
   * Record a render operation performance
   */
  recordRender(renderTime: number): void {
    this.renderTimes.push(renderTime)

    // Keep only recent render times
    if (this.renderTimes.length > 100) {
      this.renderTimes = this.renderTimes.slice(-50)
    }

    // Check for performance issues
    if (renderTime > this.thresholds.maxRenderTime) {
      this.createAlert({
        type: 'warning',
        metric: 'renderTime',
        value: renderTime,
        threshold: this.thresholds.maxRenderTime,
        message: `Slow render detected: ${Math.round(renderTime)}ms`,
      })
    }
  }

  /**
   * Record network request performance
   */
  recordNetworkRequest(requestId: string, _url: string, size: number = 0): void {
    this.networkRequests.set(requestId, {
      startTime: performance.now(),
      size,
    })
  }

  /**
   * Complete network request tracking
   */
  completeNetworkRequest(requestId: string): number {
    const request = this.networkRequests.get(requestId)
    if (!request) {
      return 0
    }

    const duration = performance.now() - request.startTime
    this.networkRequests.delete(requestId)

    // Check response time threshold
    if (duration > this.thresholds.maxResponseTime) {
      this.createAlert({
        type: 'warning',
        metric: 'responseTime',
        value: duration,
        threshold: this.thresholds.maxResponseTime,
        message: `Slow network response: ${Math.round(duration)}ms`,
      })
    }

    return duration
  }

  /**
   * Measure Vue component render performance
   */
  measureComponentRender<T>(
    componentName: string,
    renderFunction: () => T,
  ): { result: T; renderTime: number } {
    const startTime = performance.now()

    try {
      const result = renderFunction()
      const renderTime = performance.now() - startTime

      this.recordRender(renderTime)

      console.debug(`Component ${componentName} rendered in ${Math.round(renderTime)}ms`)

      return { result, renderTime }
    } catch (error) {
      const renderTime = performance.now() - startTime
      this.recordRender(renderTime)

      this.createAlert({
        type: 'error',
        metric: 'componentRender',
        value: renderTime,
        threshold: this.thresholds.maxRenderTime,
        message: `Component ${componentName} render failed after ${Math.round(renderTime)}ms`,
      })

      throw error
    }
  }

  /**
   * Measure async operation performance
   */
  async measureAsyncOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
  ): Promise<{ result: T; duration: number }> {
    const startTime = performance.now()

    try {
      const result = await operation()
      const duration = performance.now() - startTime

      console.debug(`Operation ${operationName} completed in ${Math.round(duration)}ms`)

      return { result, duration }
    } catch (error) {
      const duration = performance.now() - startTime

      this.createAlert({
        type: 'error',
        metric: 'asyncOperation',
        value: duration,
        threshold: this.thresholds.maxResponseTime,
        message: `Operation ${operationName} failed after ${Math.round(duration)}ms`,
      })

      throw error
    }
  }

  /**
   * Monitor Vue reactive ref for performance impact
   */
  monitorReactiveRef<T>(_ref: Ref<T>, name: string): void {
    // In a real implementation, would use Vue's reactivity API to monitor changes
    // This is a simplified version for demonstration
    console.log(`Monitoring reactive ref: ${name}`)
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): FrontendMetrics {
    return this.collectMetrics()
  }

  /**
   * Get performance history
   */
  getMetricsHistory(limitToLast: number = 50): FrontendMetrics[] {
    return this.metrics.slice(-limitToLast)
  }

  /**
   * Get active performance alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    // Return alerts from last 5 minutes
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    return this.alerts.filter(alert => alert.timestamp > fiveMinutesAgo)
  }

  /**
   * Clear performance history
   */
  clearHistory(): void {
    this.metrics.length = 0
    this.alerts.length = 0
    this.renderTimes.length = 0
    this.frameTimestamps.length = 0
    this.networkRequests.clear()

    console.log('Performance history cleared')
  }

  /**
   * Export performance data for analysis
   */
  exportData(): {
    metrics: FrontendMetrics[]
    alerts: PerformanceAlert[]
    thresholds: PerformanceThresholds
    summary: any
    } {
    const summary = this.calculatePerformanceSummary()

    return {
      metrics: [...this.metrics],
      alerts: [...this.alerts],
      thresholds: this.thresholds,
      summary,
    }
  }

  /**
   * Check if performance is within acceptable bounds
   */
  isPerformanceHealthy(): {
    healthy: boolean
    issues: string[]
    score: number // 0-100
    } {
    const issues: string[] = []
    let score = 100

    const recentMetrics = this.metrics.slice(-10)
    if (recentMetrics.length === 0) {
      return { healthy: true, issues: [], score: 100 }
    }

    // Check average render time
    const avgRenderTime = this.renderTimes.length > 0
      ? this.renderTimes.reduce((sum, time) => sum + time, 0) / this.renderTimes.length
      : 0

    if (avgRenderTime > this.thresholds.maxRenderTime) {
      issues.push(`Average render time too high: ${Math.round(avgRenderTime)}ms`)
      score -= 20
    }

    // Check FPS
    const currentFPS = this.calculateCurrentFPS()
    if (currentFPS < this.thresholds.minFPS) {
      issues.push(`Low FPS detected: ${Math.round(currentFPS)}`)
      score -= 25
    }

    // Check memory usage
    const estimatedMemory = this.estimateMemoryUsage()
    if (estimatedMemory > this.thresholds.maxMemoryUsage) {
      issues.push(`High memory usage: ${Math.round(estimatedMemory)}MB`)
      score -= 20
    }

    // Check recent alerts
    const recentAlerts = this.getActiveAlerts()
    const criticalAlerts = recentAlerts.filter(alert => alert.type === 'critical')
    const errorAlerts = recentAlerts.filter(alert => alert.type === 'error')

    if (criticalAlerts.length > 0) {
      issues.push(`${criticalAlerts.length} critical performance issues`)
      score -= 30
    }

    if (errorAlerts.length > 0) {
      issues.push(`${errorAlerts.length} performance errors`)
      score -= 15
    }

    return {
      healthy: issues.length === 0,
      issues,
      score: Math.max(0, score),
    }
  }

  // Private implementation methods

  private collectMetrics(): FrontendMetrics {
    const timestamp = Date.now()

    // Collect performance metrics
    const performanceMetrics = {
      renderTime: this.getAverageRenderTime(),
      fps: this.calculateCurrentFPS(),
      domNodes: this.countDOMNodes(),
      eventListeners: this.countEventListeners(),
      memoryUsage: this.estimateMemoryUsage(),
    }

    // Collect UI metrics
    const uiMetrics = {
      messageCount: this.countMessages(),
      scrollPosition: window.scrollY,
      visibleMessages: this.countVisibleMessages(),
      activeAnimations: this.countActiveAnimations(),
      lastInteractionTime: this.getLastInteractionTime(),
    }

    // Collect network metrics
    const networkMetrics = {
      activeRequests: this.networkRequests.size,
      requestQueue: 0, // Would need more sophisticated tracking
      responseTime: this.getAverageResponseTime(),
      bytesTransferred: this.calculateBytesTransferred(),
    }

    // Collect user interaction metrics
    const userMetrics = {
      clicks: this.userInteractions.clicks,
      keystrokes: this.userInteractions.keystrokes,
      scrollEvents: this.userInteractions.scrollEvents,
      sessionDuration: timestamp - this.userInteractions.sessionStart,
    }

    const metrics: FrontendMetrics = {
      timestamp,
      performance: performanceMetrics,
      ui: uiMetrics,
      network: networkMetrics,
      user: userMetrics,
    }

    // Store metrics
    this.metrics.push(metrics)

    // Limit stored metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500)
    }

    // Check for performance issues
    this.checkPerformanceThresholds(metrics)

    return metrics
  }

  private setupPerformanceObservers(): void {
    // Performance Observer for measuring render times
    if ('PerformanceObserver' in window) {
      try {
        const perfObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach(entry => {
            if (entry.entryType === 'measure' && entry.name.includes('render')) {
              this.recordRender(entry.duration)
            }
          })
        })

        perfObserver.observe({ entryTypes: ['measure'] })
        this.observers.set('performance', perfObserver)
      } catch (error) {
        console.warn('Could not setup PerformanceObserver:', error)
      }
    }

    // ResizeObserver for monitoring DOM changes
    if ('ResizeObserver' in window) {
      try {
        const resizeObserver = new ResizeObserver(() => {
          // DOM structure changed, might affect performance
          const nodeCount = this.countDOMNodes()
          if (nodeCount > this.thresholds.maxDOMNodes) {
            this.createAlert({
              type: 'warning',
              metric: 'domNodes',
              value: nodeCount,
              threshold: this.thresholds.maxDOMNodes,
              message: `High DOM node count: ${nodeCount}`,
            })
          }
        })

        resizeObserver.observe(document.body)
        this.observers.set('resize', resizeObserver)
      } catch (error) {
        console.warn('Could not setup ResizeObserver:', error)
      }
    }

    // Monitor FPS using requestAnimationFrame
    this.startFPSMonitoring()
  }

  private setupUserInteractionTracking(): void {
    // Track clicks
    document.addEventListener('click', () => {
      this.userInteractions.clicks++
    }, { passive: true })

    // Track keystrokes
    document.addEventListener('keydown', () => {
      this.userInteractions.keystrokes++
    }, { passive: true })

    // Track scroll events
    let scrollTimeout: number | null = null
    document.addEventListener('scroll', () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }

      scrollTimeout = window.setTimeout(() => {
        this.userInteractions.scrollEvents++
      }, 100) // Debounce scroll counting
    }, { passive: true })
  }

  private startFPSMonitoring(): void {
    const trackFrame = () => {
      this.frameTimestamps.push(performance.now())

      // Keep only last second of frame data
      const oneSecondAgo = performance.now() - 1000
      this.frameTimestamps = this.frameTimestamps.filter(timestamp => timestamp > oneSecondAgo)

      if (this.isCollecting) {
        requestAnimationFrame(trackFrame)
      }
    }

    requestAnimationFrame(trackFrame)
  }

  private getAverageRenderTime(): number {
    if (this.renderTimes.length === 0) return 0
    return this.renderTimes.reduce((sum, time) => sum + time, 0) / this.renderTimes.length
  }

  private calculateCurrentFPS(): number {
    if (this.frameTimestamps.length < 2) return 60 // Assume 60fps if no data

    const recentFrames = this.frameTimestamps.slice(-60) // Last 60 frames
    if (recentFrames.length < 2) return 60

    const timespan = recentFrames[recentFrames.length - 1] - recentFrames[0]
    return Math.round((recentFrames.length - 1) * 1000 / timespan)
  }

  private countDOMNodes(): number {
    return document.querySelectorAll('*').length
  }

  private countEventListeners(): number {
    // This is a simplified estimation
    // In practice, would need more sophisticated tracking
    return document.querySelectorAll('[onclick], [onload], [onchange]').length
  }

  private estimateMemoryUsage(): number {
    // Use performance.memory if available (Chrome)
    const perfWithMemory = performance as any
    if (perfWithMemory.memory) {
      return Math.round(perfWithMemory.memory.usedJSHeapSize / 1024 / 1024)
    }

    // Fallback estimation based on DOM nodes and other factors
    const nodeCount = this.countDOMNodes()
    const estimatedMB = (nodeCount * 0.5) + (this.metrics.length * 0.1) + 10
    return Math.round(estimatedMB)
  }

  private countMessages(): number {
    return document.querySelectorAll('[data-message-id]').length
  }

  private countVisibleMessages(): number {
    const messages = document.querySelectorAll('[data-message-id]')
    let visibleCount = 0

    messages.forEach(message => {
      const rect = message.getBoundingClientRect()
      if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
        visibleCount++
      }
    })

    return visibleCount
  }

  private countActiveAnimations(): number {
    return document.getAnimations().length
  }

  private getLastInteractionTime(): number {
    // Return most recent interaction time
    return Math.max(
      Date.now() - 1000, // Fallback to 1 second ago
      this.userInteractions.sessionStart,
    )
  }

  private getAverageResponseTime(): number {
    // Would need more sophisticated network request tracking
    return 0
  }

  private calculateBytesTransferred(): number {
    // Would need network request tracking
    return 0
  }

  private checkPerformanceThresholds(metrics: FrontendMetrics): void {
    // Check render time
    if (metrics.performance.renderTime > this.thresholds.maxRenderTime) {
      this.createAlert({
        type: 'warning',
        metric: 'renderTime',
        value: metrics.performance.renderTime,
        threshold: this.thresholds.maxRenderTime,
        message: `High average render time: ${Math.round(metrics.performance.renderTime)}ms`,
      })
    }

    // Check FPS
    if (metrics.performance.fps < this.thresholds.minFPS) {
      this.createAlert({
        type: 'warning',
        metric: 'fps',
        value: metrics.performance.fps,
        threshold: this.thresholds.minFPS,
        message: `Low FPS: ${Math.round(metrics.performance.fps)}`,
      })
    }

    // Check memory usage
    if (metrics.performance.memoryUsage > this.thresholds.maxMemoryUsage) {
      this.createAlert({
        type: 'error',
        metric: 'memoryUsage',
        value: metrics.performance.memoryUsage,
        threshold: this.thresholds.maxMemoryUsage,
        message: `High memory usage: ${Math.round(metrics.performance.memoryUsage)}MB`,
      })
    }

    // Check DOM node count
    if (metrics.performance.domNodes > this.thresholds.maxDOMNodes) {
      this.createAlert({
        type: 'warning',
        metric: 'domNodes',
        value: metrics.performance.domNodes,
        threshold: this.thresholds.maxDOMNodes,
        message: `High DOM node count: ${metrics.performance.domNodes}`,
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

    // Limit stored alerts
    if (this.alerts.length > 500) {
      this.alerts = this.alerts.slice(-250)
    }

    // Log critical alerts
    if (alert.type === 'critical') {
      console.error('Critical performance alert:', alert)
    } else if (alert.type === 'error') {
      console.warn('Performance error:', alert)
    }
  }

  private calculatePerformanceSummary(): any {
    const recentMetrics = this.metrics.slice(-20)
    if (recentMetrics.length === 0) {
      return {
        averageRenderTime: 0,
        averageFPS: 60,
        averageMemoryUsage: 0,
        totalAlerts: 0,
        healthScore: 100,
      }
    }

    const avgRenderTime = recentMetrics.reduce((sum, m) => sum + m.performance.renderTime, 0) / recentMetrics.length
    const avgFPS = recentMetrics.reduce((sum, m) => sum + m.performance.fps, 0) / recentMetrics.length
    const avgMemoryUsage = recentMetrics.reduce((sum, m) => sum + m.performance.memoryUsage, 0) / recentMetrics.length

    const health = this.isPerformanceHealthy()

    return {
      averageRenderTime: Math.round(avgRenderTime),
      averageFPS: Math.round(avgFPS),
      averageMemoryUsage: Math.round(avgMemoryUsage),
      totalAlerts: this.alerts.length,
      healthScore: health.score,
      issues: health.issues,
    }
  }

  private cleanup(): void {
    // Disconnect all observers
    this.observers.forEach(observer => {
      if (observer && typeof observer.disconnect === 'function') {
        observer.disconnect()
      }
    })
    this.observers.clear()
  }
}

/**
 * Create a metrics collector instance
 */
export function createMetricsCollector(thresholds?: Partial<PerformanceThresholds>): MetricsCollector {
  return new MetricsCollector(thresholds)
}

/**
 * Global metrics collector instance for easy access
 */
let globalMetricsCollector: MetricsCollector | null = null

export function useMetricsCollector(thresholds?: Partial<PerformanceThresholds>): MetricsCollector {
  if (!globalMetricsCollector) {
    globalMetricsCollector = new MetricsCollector(thresholds)
  }
  return globalMetricsCollector
}
