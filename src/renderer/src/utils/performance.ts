import { nextTick } from 'vue'

/**
 * Performance utilities for MiaoDa Chat
 */

// Debounce function with proper typing
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }
    
    const callNow = immediate && !timeout
    
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    
    if (callNow) func(...args)
  }
}

// Throttle function with proper typing
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// RequestAnimationFrame-based throttle for smooth animations
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    if (rafId !== null) return
    
    rafId = requestAnimationFrame(() => {
      func(...args)
      rafId = null
    })
  }
}

// Intersection Observer for lazy loading
export class LazyLoader {
  private observer: IntersectionObserver
  private targets = new Map<Element, () => void>()
  
  constructor(options: IntersectionObserverInit = {}) {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const callback = this.targets.get(entry.target)
          if (callback) {
            callback()
            this.unobserve(entry.target)
          }
        }
      })
    }, {
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    })
  }
  
  observe(element: Element, callback: () => void) {
    this.targets.set(element, callback)
    this.observer.observe(element)
  }
  
  unobserve(element: Element) {
    this.targets.delete(element)
    this.observer.unobserve(element)
  }
  
  disconnect() {
    this.observer.disconnect()
    this.targets.clear()
  }
}

// Virtual scrolling for large lists
export interface VirtualScrollOptions {
  itemHeight: number
  containerHeight: number
  buffer?: number
}

export function calculateVirtualScrollRange(
  scrollTop: number,
  totalItems: number,
  options: VirtualScrollOptions
) {
  const { itemHeight, containerHeight, buffer = 5 } = options
  
  const visibleStart = Math.floor(scrollTop / itemHeight)
  const visibleEnd = Math.min(
    totalItems - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight)
  )
  
  const startIndex = Math.max(0, visibleStart - buffer)
  const endIndex = Math.min(totalItems - 1, visibleEnd + buffer)
  
  return {
    startIndex,
    endIndex,
    offsetY: startIndex * itemHeight,
    visibleItems: endIndex - startIndex + 1
  }
}

// Memory-efficient event emitter
export class EventEmitter<T extends Record<string, any[]>> {
  private events = new Map<keyof T, Set<(...args: any[]) => void>>()
  
  on<K extends keyof T>(event: K, listener: (...args: T[K]) => void): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }
    
    const listeners = this.events.get(event)!
    listeners.add(listener)
    
    // Return unsubscribe function
    return () => {
      listeners.delete(listener)
      if (listeners.size === 0) {
        this.events.delete(event)
      }
    }
  }
  
  emit<K extends keyof T>(event: K, ...args: T[K]): void {
    const listeners = this.events.get(event)
    if (listeners) {
      listeners.forEach(listener => listener(...args))
    }
  }
  
  off<K extends keyof T>(event: K, listener?: (...args: T[K]) => void): void {
    if (!listener) {
      this.events.delete(event)
      return
    }
    
    const listeners = this.events.get(event)
    if (listeners) {
      listeners.delete(listener)
      if (listeners.size === 0) {
        this.events.delete(event)
      }
    }
  }
  
  clear(): void {
    this.events.clear()
  }
}

// Memoization with size limit
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  maxSize = 100
): T {
  const cache = new Map<string, ReturnType<T>>()
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args)
    
    if (cache.has(key)) {
      return cache.get(key)!
    }
    
    const result = fn(...args)
    
    // LRU eviction
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value
      cache.delete(firstKey)
    }
    
    cache.set(key, result)
    return result
  }) as T
}

// Batch DOM reads and writes
export class DOMBatcher {
  private readQueue: (() => void)[] = []
  private writeQueue: (() => void)[] = []
  private scheduled = false
  
  read(callback: () => void): void {
    this.readQueue.push(callback)
    this.schedule()
  }
  
  write(callback: () => void): void {
    this.writeQueue.push(callback)
    this.schedule()
  }
  
  private schedule(): void {
    if (this.scheduled) return
    
    this.scheduled = true
    requestAnimationFrame(() => {
      // Execute all reads first
      while (this.readQueue.length > 0) {
        const callback = this.readQueue.shift()!
        callback()
      }
      
      // Then execute all writes
      while (this.writeQueue.length > 0) {
        const callback = this.writeQueue.shift()!
        callback()
      }
      
      this.scheduled = false
    })
  }
}

// Image loading with cache and error handling
export class ImageLoader {
  private cache = new Map<string, Promise<HTMLImageElement>>()
  private maxCacheSize = 50
  
  load(src: string): Promise<HTMLImageElement> {
    if (this.cache.has(src)) {
      return this.cache.get(src)!
    }
    
    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
      
      img.src = src
    })
    
    // LRU cache management
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    
    this.cache.set(src, promise)
    return promise
  }
  
  preload(sources: string[]): Promise<HTMLImageElement[]> {
    return Promise.all(sources.map(src => this.load(src)))
  }
  
  clear(): void {
    this.cache.clear()
  }
}

// Worker pool for heavy computations
export class WorkerPool {
  private workers: Worker[] = []
  private queue: Array<{
    resolve: (value: any) => void
    reject: (reason: any) => void
    data: any
  }> = []
  private busy = new Set<Worker>()
  
  constructor(
    private workerScript: string,
    private poolSize: number = navigator.hardwareConcurrency || 4
  ) {
    this.initializeWorkers()
  }
  
  private initializeWorkers(): void {
    for (let i = 0; i < this.poolSize; i++) {
      const worker = new Worker(this.workerScript)
      this.workers.push(worker)
    }
  }
  
  async execute<T = any>(data: any): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ resolve, reject, data })
      this.processQueue()
    })
  }
  
  private processQueue(): void {
    if (this.queue.length === 0) return
    
    const availableWorker = this.workers.find(w => !this.busy.has(w))
    if (!availableWorker) return
    
    const task = this.queue.shift()!
    this.busy.add(availableWorker)
    
    const handleMessage = (event: MessageEvent) => {
      this.busy.delete(availableWorker)
      availableWorker.removeEventListener('message', handleMessage)
      availableWorker.removeEventListener('error', handleError)
      
      task.resolve(event.data)
      this.processQueue()
    }
    
    const handleError = (error: ErrorEvent) => {
      this.busy.delete(availableWorker)
      availableWorker.removeEventListener('message', handleMessage)
      availableWorker.removeEventListener('error', handleError)
      
      task.reject(error)
      this.processQueue()
    }
    
    availableWorker.addEventListener('message', handleMessage)
    availableWorker.addEventListener('error', handleError)
    availableWorker.postMessage(task.data)
  }
  
  terminate(): void {
    this.workers.forEach(worker => worker.terminate())
    this.workers = []
    this.busy.clear()
    this.queue = []
  }
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>()
  
  mark(name: string): () => void {
    const startTime = performance.now()
    
    return () => {
      const duration = performance.now() - startTime
      
      if (!this.metrics.has(name)) {
        this.metrics.set(name, [])
      }
      
      const durations = this.metrics.get(name)!
      durations.push(duration)
      
      // Keep only last 100 measurements
      if (durations.length > 100) {
        durations.shift()
      }
    }
  }
  
  getStats(name: string) {
    const durations = this.metrics.get(name) || []
    if (durations.length === 0) return null
    
    const sorted = [...durations].sort((a, b) => a - b)
    const sum = durations.reduce((a, b) => a + b, 0)
    
    return {
      count: durations.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / durations.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)]
    }
  }
  
  clear(name?: string): void {
    if (name) {
      this.metrics.delete(name)
    } else {
      this.metrics.clear()
    }
  }
  
  getAllStats() {
    const stats: Record<string, ReturnType<typeof this.getStats>> = {}
    
    for (const [name] of this.metrics) {
      stats[name] = this.getStats(name)
    }
    
    return stats
  }
}

// Global instances
export const domBatcher = new DOMBatcher()
export const imageLoader = new ImageLoader()
export const performanceMonitor = new PerformanceMonitor()

// Vue-specific performance helpers
export async function batchedUpdate(callback: () => void): Promise<void> {
  callback()
  await nextTick()
}

export function createLazyComponent<T>(
  loader: () => Promise<T>,
  loadingComponent?: any,
  errorComponent?: any,
  delay = 200,
  timeout = 10000
) {
  return {
    component: loader,
    loading: loadingComponent,
    error: errorComponent,
    delay,
    timeout
  }
}

// Cleanup utilities
export class ResourceManager {
  private resources: (() => void)[] = []
  
  add(cleanup: () => void): void {
    this.resources.push(cleanup)
  }
  
  cleanup(): void {
    this.resources.forEach(cleanup => {
      try {
        cleanup()
      } catch (error) {
        console.warn('Cleanup error:', error)
      }
    })
    this.resources = []
  }
}

export const globalResourceManager = new ResourceManager()