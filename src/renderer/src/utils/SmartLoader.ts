// @ts-nocheck
import { ref, computed, onMounted, onUnmounted, nextTick, readonly } from 'vue'

export interface LoadingPriority {
  critical: number // Load immediately
  high: number // Load within 100ms
  normal: number // Load within 500ms
  low: number // Load when idle
  background: number // Load in background
}

export interface SmartLoadConfig {
  enablePreloading: boolean
  enableLazyLoading: boolean
  preloadDistance: number // px from viewport
  maxConcurrentLoads: number
  loadingPriorities: LoadingPriority
  cacheStrategy: 'memory' | 'persistent' | 'hybrid'
  enablePredictiveLoading: boolean
}

export interface LoadableResource {
  id: string
  type: 'component' | 'image' | 'data' | 'chunk'
  url?: string
  loader: () => Promise<any>
  priority: keyof LoadingPriority
  dependencies?: string[]
  preloadConditions?: () => boolean
  size?: number // estimated size in bytes
  metadata?: Record<string, any>
}

export interface LoadingMetrics {
  totalRequests: number
  successful: number
  failed: number
  cacheHits: number
  averageLoadTime: number
  bytesLoaded: number
  networkSavings: number
}

/**
 * Intelligent preloading and lazy loading system with predictive capabilities
 * Optimizes resource loading based on user behavior and viewport visibility
 */
export class SmartResourceLoader {
  private config: SmartLoadConfig
  private resources = new Map<string, LoadableResource>()
  private loadedResources = new Map<string, any>()
  private loadingQueue = new Map<string, Promise<any>>()
  private metrics: LoadingMetrics
  private intersectionObserver?: IntersectionObserver
  private idleCallback?: number
  private loadingScheduler?: ResourceLoadingScheduler
  private predictiveLoader?: PredictiveLoader

  constructor(config: Partial<SmartLoadConfig> = {}) {
    this.config = {
      enablePreloading: true,
      enableLazyLoading: true,
      preloadDistance: 200, // px
      maxConcurrentLoads: 3,
      loadingPriorities: {
        critical: 0,
        high: 100,
        normal: 500,
        low: 1000,
        background: 5000
      },
      cacheStrategy: 'hybrid',
      enablePredictiveLoading: true,
      ...config
    }

    this.metrics = this.initializeMetrics()
    this.initialize()
  }

  private initialize(): void {
    console.log('Initializing smart resource loader', this.config)

    // Setup intersection observer for lazy loading
    if (this.config.enableLazyLoading && 'IntersectionObserver' in window) {
      this.setupIntersectionObserver()
    }

    // Setup loading scheduler
    this.loadingScheduler = new ResourceLoadingScheduler(
      this.config.maxConcurrentLoads,
      this.config.loadingPriorities
    )

    // Setup predictive loader
    if (this.config.enablePredictiveLoading) {
      this.predictiveLoader = new PredictiveLoader()
    }

    // Setup idle loading
    this.setupIdleLoading()
  }

  /**
   * Register a resource for smart loading
   */
  registerResource(resource: LoadableResource): void {
    this.resources.set(resource.id, resource)

    // Immediate load for critical resources
    if (resource.priority === 'critical') {
      this.loadResource(resource.id)
    }

    // Schedule based on priority
    else if (this.config.enablePreloading) {
      this.scheduleResourceLoad(resource)
    }

    console.debug('Registered resource', {
      id: resource.id,
      type: resource.type,
      priority: resource.priority
    })
  }

  /**
   * Load resource immediately or return from cache
   */
  async loadResource(resourceId: string): Promise<any> {
    const resource = this.resources.get(resourceId)
    if (!resource) {
      throw new Error(`Resource not found: ${resourceId}`)
    }

    // Return from cache if available
    const cached = this.loadedResources.get(resourceId)
    if (cached) {
      this.metrics.cacheHits++
      return cached
    }

    // Return existing loading promise
    const existingLoad = this.loadingQueue.get(resourceId)
    if (existingLoad) {
      return existingLoad
    }

    // Create new loading promise
    const loadPromise = this.executeLoad(resource)
    this.loadingQueue.set(resourceId, loadPromise)

    try {
      const result = await loadPromise
      this.loadedResources.set(resourceId, result)
      this.metrics.successful++

      // Track predictive patterns
      this.predictiveLoader?.recordAccess(resourceId)

      return result
    } catch (error) {
      this.metrics.failed++
      console.error('Resource loading failed', { resourceId, error })
      throw error
    } finally {
      this.loadingQueue.delete(resourceId)
    }
  }

  /**
   * Preload resources based on conditions
   */
  async preloadResources(resourceIds: string[]): Promise<void> {
    if (!this.config.enablePreloading) return

    const validIds = resourceIds.filter(id => this.resources.has(id))
    const batchSize = Math.min(this.config.maxConcurrentLoads, validIds.length)

    console.info('Starting resource preload', {
      requested: resourceIds.length,
      valid: validIds.length,
      batchSize
    })

    // Load in batches to avoid overwhelming the system
    for (let i = 0; i < validIds.length; i += batchSize) {
      const batch = validIds.slice(i, i + batchSize)
      const batchPromises = batch.map(id =>
        this.loadResource(id).catch(error => {
          console.warn('Preload failed', { resourceId: id, error })
        })
      )

      await Promise.all(batchPromises)

      // Brief pause between batches
      if (i + batchSize < validIds.length) {
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }
  }

  /**
   * Setup viewport-based lazy loading
   */
  setupLazyElement(element: Element, resourceId: string): () => void {
    if (!this.intersectionObserver) return () => {}

    const resource = this.resources.get(resourceId)
    if (!resource) return () => {}

    const callback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadResource(resourceId).catch(error => {
            console.warn('Lazy load failed', { resourceId, error })
          })

          // Stop observing once loaded
          this.intersectionObserver?.unobserve(element)
        }
      })
    }

    this.intersectionObserver.observe(element)

    // Return cleanup function
    return () => {
      this.intersectionObserver?.unobserve(element)
    }
  }

  /**
   * Get resource loading status
   */
  getResourceStatus(resourceId: string): {
    registered: boolean
    loaded: boolean
    loading: boolean
    error?: boolean
  } {
    return {
      registered: this.resources.has(resourceId),
      loaded: this.loadedResources.has(resourceId),
      loading: this.loadingQueue.has(resourceId),
      error: false // Could track error state
    }
  }

  /**
   * Prefetch resources based on predictive analysis
   */
  async prefetchPredictiveResources(): Promise<void> {
    if (!this.predictiveLoader || !this.config.enablePredictiveLoading) return

    const predictions = await this.predictiveLoader.getPredictions()
    const resourcesToPrefetch = predictions
      .filter(p => p.confidence > 0.7 && this.resources.has(p.resourceId))
      .map(p => p.resourceId)

    if (resourcesToPrefetch.length > 0) {
      console.info('Prefetching predictive resources', {
        count: resourcesToPrefetch.length
      })

      await this.preloadResources(resourcesToPrefetch)
    }
  }

  /**
   * Get comprehensive loading metrics
   */
  getMetrics(): LoadingMetrics & {
    cacheHitRate: number
    successRate: number
    resourceCount: number
    loadedCount: number
  } {
    const total = this.metrics.successful + this.metrics.failed

    return {
      ...this.metrics,
      cacheHitRate: total > 0 ? (this.metrics.cacheHits / total) * 100 : 0,
      successRate: total > 0 ? (this.metrics.successful / total) * 100 : 0,
      resourceCount: this.resources.size,
      loadedCount: this.loadedResources.size
    }
  }

  /**
   * Clear cache and reset state
   */
  clearCache(): void {
    this.loadedResources.clear()
    this.loadingQueue.clear()
    this.metrics = this.initializeMetrics()

    console.info('Smart loader cache cleared')
  }

  // Private helper methods

  private async executeLoad(resource: LoadableResource): Promise<any> {
    const startTime = performance.now()

    try {
      // Check dependencies first
      if (resource.dependencies) {
        await this.loadDependencies(resource.dependencies)
      }

      // Execute the actual loading
      const result = await resource.loader()

      const duration = performance.now() - startTime
      this.updateMetrics(resource, duration, true)

      console.debug('Resource loaded successfully', {
        id: resource.id,
        type: resource.type,
        duration: Math.round(duration)
      })

      return result
    } catch (error) {
      const duration = performance.now() - startTime
      this.updateMetrics(resource, duration, false)
      throw error
    }
  }

  private async loadDependencies(dependencies: string[]): Promise<void> {
    const dependencyPromises = dependencies.map(dep => this.loadResource(dep))
    await Promise.all(dependencyPromises)
  }

  private scheduleResourceLoad(resource: LoadableResource): void {
    if (!this.loadingScheduler) return

    const delay = this.config.loadingPriorities[resource.priority]

    this.loadingScheduler.schedule(
      resource.id,
      () => {
        // Check preload conditions if any
        if (resource.preloadConditions && !resource.preloadConditions()) {
          return Promise.resolve(null)
        }

        return this.loadResource(resource.id)
      },
      delay,
      resource.priority
    )
  }

  private setupIntersectionObserver(): void {
    this.intersectionObserver = new IntersectionObserver(
      entries => {
        // Handled by individual lazy elements
      },
      {
        rootMargin: `${this.config.preloadDistance}px`,
        threshold: 0.1
      }
    )
  }

  private setupIdleLoading(): void {
    if (!('requestIdleCallback' in window)) return

    const scheduleIdleLoading = () => {
      this.idleCallback = requestIdleCallback(deadline => {
        // Load low priority resources during idle time
        const lowPriorityResources = Array.from(this.resources.values()).filter(
          r =>
            (r.priority === 'low' || r.priority === 'background') &&
            !this.loadedResources.has(r.id) &&
            !this.loadingQueue.has(r.id)
        )

        for (const resource of lowPriorityResources) {
          if (deadline.timeRemaining() > 10) {
            this.loadResource(resource.id).catch(() => {})
          } else {
            break
          }
        }

        // Schedule next idle callback
        scheduleIdleLoading()
      })
    }

    scheduleIdleLoading()
  }

  private updateMetrics(resource: LoadableResource, duration: number, success: boolean): void {
    this.metrics.totalRequests++
    this.metrics.averageLoadTime =
      (this.metrics.averageLoadTime * (this.metrics.totalRequests - 1) + duration) /
      this.metrics.totalRequests

    if (resource.size) {
      this.metrics.bytesLoaded += resource.size
    }
  }

  private initializeMetrics(): LoadingMetrics {
    return {
      totalRequests: 0,
      successful: 0,
      failed: 0,
      cacheHits: 0,
      averageLoadTime: 0,
      bytesLoaded: 0,
      networkSavings: 0
    }
  }

  /**
   * Cleanup and destroy loader
   */
  destroy(): void {
    this.intersectionObserver?.disconnect()

    if (this.idleCallback) {
      cancelIdleCallback(this.idleCallback)
    }

    this.loadingScheduler?.destroy()
    this.predictiveLoader?.destroy()

    this.clearCache()

    console.info('Smart resource loader destroyed')
  }
}

/**
 * Resource loading scheduler with priority queue
 */
class ResourceLoadingScheduler {
  private scheduledTasks = new Map<string, NodeJS.Timeout>()
  private activeTasks = new Set<string>()

  constructor(
    private maxConcurrent: number,
    private priorities: LoadingPriority
  ) {}

  schedule(
    id: string,
    loader: () => Promise<any>,
    delay: number,
    priority: keyof LoadingPriority
  ): void {
    // Cancel existing task if any
    const existingTimer = this.scheduledTasks.get(id)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    const timer = setTimeout(() => {
      if (this.activeTasks.size < this.maxConcurrent) {
        this.executeTask(id, loader)
      } else {
        // Re-schedule with shorter delay
        this.schedule(id, loader, Math.min(delay, 100), priority)
      }
    }, delay)

    this.scheduledTasks.set(id, timer)
  }

  private async executeTask(id: string, loader: () => Promise<any>): Promise<void> {
    this.activeTasks.add(id)
    this.scheduledTasks.delete(id)

    try {
      await loader()
    } catch (error) {
      console.debug('Scheduled task failed', { id, error })
    } finally {
      this.activeTasks.delete(id)
    }
  }

  destroy(): void {
    for (const timer of this.scheduledTasks.values()) {
      clearTimeout(timer)
    }
    this.scheduledTasks.clear()
    this.activeTasks.clear()
  }
}

/**
 * Predictive loader based on user behavior patterns
 */
class PredictiveLoader {
  private accessPatterns = new Map<
    string,
    { count: number; lastAccess: number; contexts: string[] }
  >()
  private sequencePatterns = new Map<string, Map<string, number>>()

  recordAccess(resourceId: string, context?: string): void {
    const now = Date.now()

    // Update access patterns
    const pattern = this.accessPatterns.get(resourceId) || {
      count: 0,
      lastAccess: 0,
      contexts: []
    }

    pattern.count++
    pattern.lastAccess = now

    if (context && !pattern.contexts.includes(context)) {
      pattern.contexts.push(context)
    }

    this.accessPatterns.set(resourceId, pattern)

    // Update sequence patterns (what comes after what)
    this.updateSequencePatterns(resourceId)
  }

  async getPredictions(): Promise<Array<{ resourceId: string; confidence: number }>> {
    const predictions: Array<{ resourceId: string; confidence: number }> = []
    const now = Date.now()

    // Analyze patterns and predict next likely resources
    for (const [resourceId, pattern] of this.accessPatterns.entries()) {
      const recentAccess = now - pattern.lastAccess < 5 * 60 * 1000 // 5 minutes
      const frequentAccess = pattern.count > 5

      let confidence = 0

      if (recentAccess) confidence += 0.3
      if (frequentAccess) confidence += 0.4

      // Check sequence patterns
      const sequences = this.sequencePatterns.get(resourceId)
      if (sequences) {
        const totalSequences = Array.from(sequences.values()).reduce((sum, count) => sum + count, 0)
        const maxSequenceCount = Math.max(...sequences.values())
        if (totalSequences > 3) {
          confidence += 0.3 * (maxSequenceCount / totalSequences)
        }
      }

      if (confidence > 0.5) {
        predictions.push({ resourceId, confidence })
      }
    }

    return predictions.sort((a, b) => b.confidence - a.confidence)
  }

  private updateSequencePatterns(currentResourceId: string): void {
    // Simple implementation - could be more sophisticated
    if (this.lastAccessedResource) {
      const sequences = this.sequencePatterns.get(this.lastAccessedResource) || new Map()
      const count = sequences.get(currentResourceId) || 0
      sequences.set(currentResourceId, count + 1)
      this.sequencePatterns.set(this.lastAccessedResource, sequences)
    }

    this.lastAccessedResource = currentResourceId
  }

  private lastAccessedResource?: string

  destroy(): void {
    this.accessPatterns.clear()
    this.sequencePatterns.clear()
  }
}

/**
 * Vue composable for smart resource loading
 */
export function useSmartLoader(config?: Partial<SmartLoadConfig>) {
  const loader = new SmartResourceLoader(config)
  const isLoading = ref(false)
  const loadingProgress = ref(0)

  onUnmounted(() => {
    loader.destroy()
  })

  const registerResource = (resource: LoadableResource) => {
    loader.registerResource(resource)
  }

  const loadResource = async (resourceId: string) => {
    isLoading.value = true
    try {
      const result = await loader.loadResource(resourceId)
      return result
    } finally {
      isLoading.value = false
    }
  }

  const preloadResources = async (resourceIds: string[]) => {
    isLoading.value = true
    try {
      await loader.preloadResources(resourceIds)
    } finally {
      isLoading.value = false
    }
  }

  const setupLazyElement = (element: Element, resourceId: string) => {
    return loader.setupLazyElement(element, resourceId)
  }

  const metrics = computed(() => loader.getMetrics())

  return {
    isLoading: readonly(isLoading),
    loadingProgress: readonly(loadingProgress),
    metrics: readonly(metrics),
    registerResource,
    loadResource,
    preloadResources,
    setupLazyElement,
    clearCache: () => loader.clearCache()
  }
}

/**
 * Global smart loader instance
 */
export const globalSmartLoader = new SmartResourceLoader({
  enablePreloading: true,
  enableLazyLoading: true,
  enablePredictiveLoading: true,
  maxConcurrentLoads: 3,
  cacheStrategy: 'hybrid'
})
