import { EventEmitter } from 'events'
import { logger } from '../utils/Logger'

export interface StreamingMetrics {
  totalChunks: number
  totalBytes: number
  averageChunkSize: number
  chunksPerSecond: number
  memoryUsage: number
  bufferHealth: 'healthy' | 'warning' | 'critical'
  latency: {
    first: number // Time to first chunk
    average: number // Average chunk latency
    p95: number // 95th percentile latency
  }
}

export interface StreamingOptimizationSettings {
  maxBufferSize: number // Max buffer size in bytes
  chunkThreshold: number // Optimal chunk size threshold
  backpressureThreshold: number // When to apply backpressure
  memoryLimit: number // Memory limit for streaming
  enableCompression: boolean
  enableAdaptiveBuffering: boolean
  metricsCollectionInterval: number
}

export interface ChunkMetadata {
  id: string
  timestamp: number
  size: number
  sequence: number
  isComplete: boolean
}

/**
 * Advanced streaming optimizer for LLM responses with memory management,
 * backpressure handling, and adaptive buffering for optimal performance
 */
export class LLMStreamingOptimizer extends EventEmitter {
  private settings: StreamingOptimizationSettings
  private activeStreams = new Map<string, StreamContext>()
  private globalMetrics: StreamingMetrics
  private metricsTimer: NodeJS.Timeout | null = null
  private memoryPressureTimer: NodeJS.Timeout | null = null
  private chunkPool: ChunkBuffer[] = []

  constructor(settings: Partial<StreamingOptimizationSettings> = {}) {
    super()

    this.settings = {
      maxBufferSize: 1024 * 1024, // 1MB
      chunkThreshold: 4096, // 4KB
      backpressureThreshold: 0.8, // 80% of buffer
      memoryLimit: 100 * 1024 * 1024, // 100MB
      enableCompression: false, // Disabled for now to avoid complexity
      enableAdaptiveBuffering: true,
      metricsCollectionInterval: 1000, // 1 second
      ...settings
    }

    this.globalMetrics = this.initializeMetrics()
    this.initialize()
  }

  private initialize(): void {
    logger.info('Initializing LLM streaming optimizer', 'StreamingOptimizer', this.settings)

    // Start metrics collection
    this.startMetricsCollection()

    // Start memory monitoring
    this.startMemoryMonitoring()

    // Pre-allocate chunk buffers for better performance
    this.preallocateChunkBuffers()
  }

  /**
   * Create optimized stream for LLM responses
   */
  public createOptimizedStream(
    streamId: string,
    options: {
      expectedSize?: number
      priority?: 'high' | 'normal' | 'low'
      onChunk?: (chunk: string, metadata: ChunkMetadata) => void
      onComplete?: (finalContent: string) => void
      onError?: (error: Error) => void
    } = {}
  ): OptimizedStreamHandler {
    const context = new StreamContext(streamId, this.settings, options)
    this.activeStreams.set(streamId, context)

    logger.debug('Created optimized stream', 'StreamingOptimizer', {
      streamId,
      expectedSize: options.expectedSize,
      priority: options.priority || 'normal'
    })

    return new OptimizedStreamHandler(context, this)
  }

  /**
   * Process incoming chunk with optimization
   */
  public processChunk(
    streamId: string,
    chunk: string,
    metadata: Partial<ChunkMetadata> = {}
  ): boolean {
    const context = this.activeStreams.get(streamId)
    if (!context) {
      logger.warn('Attempted to process chunk for unknown stream', 'StreamingOptimizer', {
        streamId
      })
      return false
    }

    const startTime = performance.now()

    try {
      // Check memory pressure before processing
      if (this.isMemoryPressureHigh()) {
        this.handleMemoryPressure(streamId)
        return false
      }

      // Apply backpressure if buffer is too full
      if (context.shouldApplyBackpressure()) {
        logger.debug('Applying backpressure', 'StreamingOptimizer', { streamId })
        this.emit('backpressure', streamId)
        return false
      }

      // Process the chunk
      const processedChunk = this.optimizeChunk(chunk, context)
      const chunkMetadata: ChunkMetadata = {
        id: `${streamId}-${context.sequenceNumber++}`,
        timestamp: Date.now(),
        size: processedChunk.length,
        sequence: context.sequenceNumber,
        isComplete: metadata.isComplete || false,
        ...metadata
      }

      // Update context
      context.addChunk(processedChunk, chunkMetadata)

      // Update metrics
      this.updateMetrics(processedChunk, performance.now() - startTime)

      // Emit chunk if ready
      if (context.options.onChunk) {
        context.options.onChunk(processedChunk, chunkMetadata)
      }

      // Check if stream is complete
      if (chunkMetadata.isComplete) {
        this.completeStream(streamId)
      }

      return true
    } catch (error) {
      logger.error('Chunk processing failed', 'StreamingOptimizer', { streamId, error })
      this.handleStreamError(streamId, error as Error)
      return false
    }
  }

  /**
   * Optimize chunk based on context and settings
   */
  private optimizeChunk(chunk: string, context: StreamContext): string {
    let optimized = chunk

    // Adaptive chunk sizing
    if (this.settings.enableAdaptiveBuffering) {
      optimized = this.adaptiveChunkSizing(optimized, context)
    }

    // Content preprocessing (remove excessive whitespace, etc.)
    optimized = this.preprocessContent(optimized)

    return optimized
  }

  /**
   * Adaptive chunk sizing based on stream characteristics
   */
  private adaptiveChunkSizing(chunk: string, context: StreamContext): string {
    const targetSize = context.getOptimalChunkSize()

    if (chunk.length < targetSize * 0.5) {
      // Chunk too small, buffer it
      context.bufferChunk(chunk)
      return ''
    }

    if (chunk.length > targetSize * 1.5) {
      // Chunk too large, split it
      return this.splitChunk(chunk, targetSize)
    }

    return chunk
  }

  /**
   * Preprocess content for optimization
   */
  private preprocessContent(content: string): string {
    // Remove excessive whitespace while preserving formatting
    return content.replace(/\n{3,}/g, '\n\n').trim()
  }

  /**
   * Split large chunks intelligently
   */
  private splitChunk(chunk: string, targetSize: number): string {
    // Find natural break points (sentence endings, paragraphs)
    const sentences = chunk.split(/([.!?]+\s+)/)
    let result = ''

    for (const sentence of sentences) {
      if ((result + sentence).length <= targetSize) {
        result += sentence
      } else {
        break
      }
    }

    return result || chunk.substring(0, targetSize)
  }

  /**
   * Complete stream processing
   */
  private completeStream(streamId: string): void {
    const context = this.activeStreams.get(streamId)
    if (!context) return

    try {
      const finalContent = context.getFinalContent()

      if (context.options.onComplete) {
        context.options.onComplete(finalContent)
      }

      logger.debug('Stream completed', 'StreamingOptimizer', {
        streamId,
        totalChunks: context.chunkCount,
        totalSize: context.totalSize,
        duration: Date.now() - context.startTime
      })

      this.emit('stream-complete', streamId, {
        totalChunks: context.chunkCount,
        totalSize: context.totalSize,
        duration: Date.now() - context.startTime
      })
    } catch (error) {
      this.handleStreamError(streamId, error as Error)
    } finally {
      this.cleanupStream(streamId)
    }
  }

  /**
   * Handle stream errors
   */
  private handleStreamError(streamId: string, error: Error): void {
    const context = this.activeStreams.get(streamId)

    if (context?.options.onError) {
      context.options.onError(error)
    }

    logger.error('Stream error', 'StreamingOptimizer', { streamId, error: error.message })
    this.emit('stream-error', streamId, error)

    this.cleanupStream(streamId)
  }

  /**
   * Cleanup stream resources
   */
  private cleanupStream(streamId: string): void {
    const context = this.activeStreams.get(streamId)
    if (context) {
      context.cleanup()
      this.activeStreams.delete(streamId)

      // Return buffers to pool
      this.returnBuffersToPool(context.getBuffers())
    }
  }

  /**
   * Check if memory pressure is high
   */
  private isMemoryPressureHigh(): boolean {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage()
      return usage.heapUsed > this.settings.memoryLimit
    }

    // Browser environment
    if ('memory' in (performance as any)) {
      const memInfo = (performance as any).memory
      return memInfo.usedJSHeapSize > this.settings.memoryLimit
    }

    return false
  }

  /**
   * Handle memory pressure by reducing buffer sizes
   */
  private handleMemoryPressure(excludeStreamId?: string): void {
    logger.warn('Memory pressure detected, reducing buffers', 'StreamingOptimizer')

    for (const [streamId, context] of this.activeStreams.entries()) {
      if (streamId !== excludeStreamId) {
        context.reduceBufferSize()
      }
    }

    // Clear chunk pool
    this.chunkPool = []

    this.emit('memory-pressure')
  }

  /**
   * Pre-allocate chunk buffers for better performance
   */
  private preallocateChunkBuffers(): void {
    const bufferCount = Math.min(
      10,
      Math.floor(this.settings.maxBufferSize / this.settings.chunkThreshold)
    )

    for (let i = 0; i < bufferCount; i++) {
      this.chunkPool.push(new ChunkBuffer(this.settings.chunkThreshold))
    }

    logger.debug('Pre-allocated chunk buffers', 'StreamingOptimizer', { count: bufferCount })
  }

  /**
   * Return buffers to pool
   */
  private returnBuffersToPool(buffers: ChunkBuffer[]): void {
    for (const buffer of buffers) {
      buffer.reset()
      if (this.chunkPool.length < 10) {
        this.chunkPool.push(buffer)
      }
    }
  }

  /**
   * Update global metrics
   */
  private updateMetrics(chunk: string, processingTime: number): void {
    this.globalMetrics.totalChunks++
    this.globalMetrics.totalBytes += chunk.length
    this.globalMetrics.averageChunkSize =
      this.globalMetrics.totalBytes / this.globalMetrics.totalChunks

    // Update latency metrics (simplified)
    if (this.globalMetrics.latency.first === 0) {
      this.globalMetrics.latency.first = processingTime
    }

    // Moving average for average latency
    this.globalMetrics.latency.average =
      (this.globalMetrics.latency.average * (this.globalMetrics.totalChunks - 1) + processingTime) /
      this.globalMetrics.totalChunks
  }

  /**
   * Initialize metrics structure
   */
  private initializeMetrics(): StreamingMetrics {
    return {
      totalChunks: 0,
      totalBytes: 0,
      averageChunkSize: 0,
      chunksPerSecond: 0,
      memoryUsage: 0,
      bufferHealth: 'healthy',
      latency: {
        first: 0,
        average: 0,
        p95: 0
      }
    }
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    this.metricsTimer = setInterval(() => {
      this.collectMetrics()
    }, this.settings.metricsCollectionInterval)
  }

  /**
   * Collect and update metrics
   */
  private collectMetrics(): void {
    // Update buffer health
    const totalActiveStreams = this.activeStreams.size
    let criticalStreams = 0
    let warningStreams = 0

    for (const context of this.activeStreams.values()) {
      const bufferRatio = context.getBufferUtilization()
      if (bufferRatio > 0.9) criticalStreams++
      else if (bufferRatio > 0.7) warningStreams++
    }

    if (criticalStreams > 0) {
      this.globalMetrics.bufferHealth = 'critical'
    } else if (warningStreams > totalActiveStreams * 0.5) {
      this.globalMetrics.bufferHealth = 'warning'
    } else {
      this.globalMetrics.bufferHealth = 'healthy'
    }

    // Update memory usage
    if (typeof process !== 'undefined' && process.memoryUsage) {
      this.globalMetrics.memoryUsage = process.memoryUsage().heapUsed
    }

    // Emit metrics for monitoring
    this.emit('metrics', this.globalMetrics)
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    this.memoryPressureTimer = setInterval(() => {
      if (this.isMemoryPressureHigh()) {
        this.handleMemoryPressure()
      }
    }, 5000) // Check every 5 seconds
  }

  /**
   * Get current metrics
   */
  public getMetrics(): StreamingMetrics {
    return { ...this.globalMetrics }
  }

  /**
   * Get stream information
   */
  public getStreamInfo(streamId: string): any {
    const context = this.activeStreams.get(streamId)
    return context ? context.getInfo() : null
  }

  /**
   * Force cleanup of all streams
   */
  public cleanup(): void {
    for (const streamId of this.activeStreams.keys()) {
      this.cleanupStream(streamId)
    }

    if (this.metricsTimer) {
      clearInterval(this.metricsTimer)
      this.metricsTimer = null
    }

    if (this.memoryPressureTimer) {
      clearInterval(this.memoryPressureTimer)
      this.memoryPressureTimer = null
    }

    this.chunkPool = []
    this.removeAllListeners()

    logger.info('LLM streaming optimizer cleaned up', 'StreamingOptimizer')
  }
}

/**
 * Stream context for managing individual stream state
 */
class StreamContext {
  public readonly startTime = Date.now()
  public sequenceNumber = 0
  public chunkCount = 0
  public totalSize = 0

  private buffer: string[] = []
  private chunkBuffers: ChunkBuffer[] = []
  private bufferSize = 0
  private maxBufferSize: number

  constructor(
    public readonly id: string,
    private settings: StreamingOptimizationSettings,
    public readonly options: any
  ) {
    this.maxBufferSize = settings.maxBufferSize
  }

  addChunk(chunk: string, _metadata: ChunkMetadata): void {
    this.buffer.push(chunk)
    this.bufferSize += chunk.length
    this.chunkCount++
    this.totalSize += chunk.length

    // Manage buffer size
    if (this.bufferSize > this.maxBufferSize) {
      this.flushOldestChunks()
    }
  }

  bufferChunk(chunk: string): void {
    // Add to internal buffer for later processing
    this.buffer.push(chunk)
    this.bufferSize += chunk.length
  }

  shouldApplyBackpressure(): boolean {
    const utilization = this.getBufferUtilization()
    return utilization > this.settings.backpressureThreshold
  }

  getBufferUtilization(): number {
    return this.bufferSize / this.maxBufferSize
  }

  getOptimalChunkSize(): number {
    // Adaptive chunk size based on stream characteristics
    const baseSize = this.settings.chunkThreshold

    if (this.options.priority === 'high') {
      return Math.floor(baseSize * 0.8) // Smaller chunks for faster response
    }

    if (this.totalSize > 100000) {
      // Large content
      return Math.floor(baseSize * 1.5) // Larger chunks for efficiency
    }

    return baseSize
  }

  reduceBufferSize(): void {
    this.maxBufferSize = Math.floor(this.maxBufferSize * 0.7)
    if (this.bufferSize > this.maxBufferSize) {
      this.flushOldestChunks()
    }
  }

  private flushOldestChunks(): void {
    while (this.bufferSize > this.maxBufferSize * 0.8 && this.buffer.length > 0) {
      const oldChunk = this.buffer.shift()!
      this.bufferSize -= oldChunk.length
    }
  }

  getFinalContent(): string {
    return this.buffer.join('')
  }

  getBuffers(): ChunkBuffer[] {
    return [...this.chunkBuffers]
  }

  getInfo(): any {
    return {
      id: this.id,
      startTime: this.startTime,
      chunkCount: this.chunkCount,
      totalSize: this.totalSize,
      bufferUtilization: this.getBufferUtilization(),
      duration: Date.now() - this.startTime
    }
  }

  cleanup(): void {
    this.buffer = []
    this.chunkBuffers.forEach(buffer => buffer.reset())
    this.chunkBuffers = []
    this.bufferSize = 0
  }
}

/**
 * Optimized stream handler for external use
 */
class OptimizedStreamHandler {
  constructor(
    private context: StreamContext,
    private optimizer: LLMStreamingOptimizer
  ) {}

  write(chunk: string, metadata?: Partial<ChunkMetadata>): boolean {
    return this.optimizer.processChunk(this.context.id, chunk, metadata)
  }

  end(finalChunk?: string): void {
    if (finalChunk) {
      this.optimizer.processChunk(this.context.id, finalChunk, { isComplete: true })
    } else {
      this.optimizer.processChunk(this.context.id, '', { isComplete: true })
    }
  }

  getInfo(): any {
    return this.context.getInfo()
  }
}

/**
 * Reusable chunk buffer for better memory management
 */
class ChunkBuffer {
  private data: string[] = []
  private size = 0

  constructor(private capacity: number) {}

  add(chunk: string): boolean {
    if (this.size + chunk.length <= this.capacity) {
      this.data.push(chunk)
      this.size += chunk.length
      return true
    }
    return false
  }

  getContent(): string {
    return this.data.join('')
  }

  reset(): void {
    this.data = []
    this.size = 0
  }

  getSize(): number {
    return this.size
  }

  getUtilization(): number {
    return this.size / this.capacity
  }
}
