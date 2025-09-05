import { EventEmitter } from 'events'
import { performance } from 'perf_hooks'
import { logger } from '../utils/Logger'

export interface TestingMetrics {
  testId: string
  testName: string
  timestamp: number
  duration: number
  status: 'passed' | 'failed' | 'timeout'
  memoryUsage: {
    heapUsed: number
    heapTotal: number
    external: number
  }
  customMetrics?: Record<string, number>
}

export interface PerformanceThresholds {
  chatRendering: number // ms
  llmFirstToken: number // ms
  databaseQuery: number // ms
  pluginExecution: number // ms
  memoryBaseline: number // MB
}

export interface BenchmarkResult {
  name: string
  duration: number
  iterations: number
  average: number
  min: number
  max: number
  standardDeviation: number
  percentiles: {
    p50: number
    p95: number
    p99: number
  }
  memoryDelta: number
  status: 'pass' | 'fail'
  threshold?: number
}

/**
 * Performance monitoring system specifically designed for testing scenarios
 * Provides utilities to measure and validate performance during automated tests
 */
export class TestingPerformanceMonitor extends EventEmitter {
  private readonly thresholds: PerformanceThresholds
  private readonly metrics: TestingMetrics[] = []
  private readonly benchmarks: BenchmarkResult[] = []
  private activeTests = new Map<string, { startTime: number; startMemory: NodeJS.MemoryUsage }>()

  constructor(thresholds: Partial<PerformanceThresholds> = {}) {
    super()

    this.thresholds = {
      chatRendering: 100, // ms
      llmFirstToken: 2000, // ms
      databaseQuery: 50, // ms
      pluginExecution: 500, // ms
      memoryBaseline: 500, // MB
      ...thresholds
    }

    logger.info('Testing performance monitor initialized', 'TestingPerformanceMonitor', {
      thresholds: this.thresholds
    })
  }

  /**
   * Start performance measurement for a specific test
   */
  startTest(testId: string, testName: string): void {
    const startTime = performance.now()
    const startMemory = process.memoryUsage()

    this.activeTests.set(testId, { startTime, startMemory })

    logger.debug('Performance test started', 'TestingPerformanceMonitor', {
      testId,
      testName,
      startMemory: {
        heapUsed: Math.round(startMemory.heapUsed / 1024 / 1024),
        heapTotal: Math.round(startMemory.heapTotal / 1024 / 1024)
      }
    })
  }

  /**
   * End performance measurement and record results
   */
  endTest(
    testId: string,
    status: 'passed' | 'failed' | 'timeout' = 'passed',
    customMetrics?: Record<string, number>
  ): TestingMetrics | null {
    const testData = this.activeTests.get(testId)
    if (!testData) {
      logger.warn('Test not found for ending', 'TestingPerformanceMonitor', { testId })
      return null
    }

    const endTime = performance.now()
    const endMemory = process.memoryUsage()
    const duration = endTime - testData.startTime

    const metrics: TestingMetrics = {
      testId,
      testName: testId, // Will be updated with actual name if provided
      timestamp: Date.now(),
      duration,
      status,
      memoryUsage: {
        heapUsed: endMemory.heapUsed - testData.startMemory.heapUsed,
        heapTotal: endMemory.heapTotal,
        external: endMemory.external
      },
      customMetrics
    }

    this.metrics.push(metrics)
    this.activeTests.delete(testId)

    // Emit event for external monitoring
    this.emit('test-completed', metrics)

    logger.debug('Performance test completed', 'TestingPerformanceMonitor', {
      testId,
      duration: Math.round(duration),
      memoryDelta: Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024),
      status
    })

    return metrics
  }

  /**
   * Measure a synchronous operation
   */
  measure<T>(operation: () => T, name: string): { result: T; metrics: TestingMetrics } {
    const testId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    this.startTest(testId, name)

    let result: T
    let status: 'passed' | 'failed' = 'passed'

    try {
      result = operation()
    } catch (error) {
      status = 'failed'
      throw error
    } finally {
      const metrics = this.endTest(testId, status)!
      return { result: result!, metrics }
    }
  }

  /**
   * Measure an asynchronous operation
   */
  async measureAsync<T>(
    operation: () => Promise<T>,
    name: string,
    timeoutMs: number = 10000
  ): Promise<{ result: T; metrics: TestingMetrics }> {
    const testId = `async_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    this.startTest(testId, name)

    let result: T
    let status: 'passed' | 'failed' | 'timeout' = 'passed'

    try {
      // Race between operation and timeout
      result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
        )
      ])
    } catch (error) {
      status =
        error instanceof Error && error.message === 'Operation timeout' ? 'timeout' : 'failed'
      throw error
    } finally {
      const metrics = this.endTest(testId, status)!
      return { result: result!, metrics }
    }
  }

  /**
   * Run a performance benchmark with multiple iterations
   */
  async benchmark<T>(
    operation: () => T | Promise<T>,
    options: {
      name: string
      iterations?: number
      warmupIterations?: number
      threshold?: number
      timeout?: number
    }
  ): Promise<BenchmarkResult> {
    const { name, iterations = 10, warmupIterations = 2, threshold, timeout = 5000 } = options

    logger.info('Starting benchmark', 'TestingPerformanceMonitor', {
      name,
      iterations,
      warmupIterations
    })

    const durations: number[] = []
    const initialMemory = process.memoryUsage()

    // Warmup iterations
    for (let i = 0; i < warmupIterations; i++) {
      try {
        await this.runBenchmarkIteration(operation, timeout)
      } catch (error) {
        logger.warn('Warmup iteration failed', 'TestingPerformanceMonitor', { i, error })
      }
    }

    // Actual benchmark iterations
    for (let i = 0; i < iterations; i++) {
      try {
        const duration = await this.runBenchmarkIteration(operation, timeout)
        durations.push(duration)
      } catch (error) {
        logger.error('Benchmark iteration failed', 'TestingPerformanceMonitor', { i, error })
        // Continue with other iterations
      }
    }

    if (durations.length === 0) {
      throw new Error(`Benchmark '${name}' failed: no successful iterations`)
    }

    const finalMemory = process.memoryUsage()
    const memoryDelta = finalMemory.heapUsed - initialMemory.heapUsed

    // Calculate statistics
    const sorted = durations.sort((a, b) => a - b)
    const average = durations.reduce((sum, d) => sum + d, 0) / durations.length
    const min = sorted[0]
    const max = sorted[sorted.length - 1]

    // Calculate standard deviation
    const variance =
      durations.reduce((sum, d) => sum + Math.pow(d - average, 2), 0) / durations.length
    const standardDeviation = Math.sqrt(variance)

    // Calculate percentiles
    const p50 = this.getPercentile(sorted, 50)
    const p95 = this.getPercentile(sorted, 95)
    const p99 = this.getPercentile(sorted, 99)

    const result: BenchmarkResult = {
      name,
      duration: average,
      iterations: durations.length,
      average,
      min,
      max,
      standardDeviation,
      percentiles: { p50, p95, p99 },
      memoryDelta,
      status: threshold ? (average <= threshold ? 'pass' : 'fail') : 'pass',
      threshold
    }

    this.benchmarks.push(result)
    this.emit('benchmark-completed', result)

    logger.info('Benchmark completed', 'TestingPerformanceMonitor', {
      name,
      average: Math.round(average),
      min: Math.round(min),
      max: Math.round(max),
      status: result.status,
      memoryDelta: Math.round(memoryDelta / 1024 / 1024)
    })

    return result
  }

  /**
   * Validate performance against thresholds
   */
  validatePerformance(
    testName: string,
    duration: number,
    category: keyof PerformanceThresholds
  ): { passed: boolean; threshold: number; actual: number } {
    const threshold = this.thresholds[category]
    const passed = duration <= threshold

    const result = { passed, threshold, actual: duration }

    if (!passed) {
      logger.warn('Performance threshold exceeded', 'TestingPerformanceMonitor', {
        testName,
        category,
        threshold,
        actual: duration
      })

      this.emit('threshold-exceeded', {
        testName,
        category,
        threshold,
        actual: duration
      })
    }

    return result
  }

  /**
   * Get performance summary for all tests
   */
  getPerformanceSummary(): {
    totalTests: number
    passedTests: number
    failedTests: number
    timeoutTests: number
    averageDuration: number
    totalMemoryUsage: number
    thresholdViolations: number
  } {
    const totalTests = this.metrics.length
    const passedTests = this.metrics.filter(m => m.status === 'passed').length
    const failedTests = this.metrics.filter(m => m.status === 'failed').length
    const timeoutTests = this.metrics.filter(m => m.status === 'timeout').length

    const averageDuration =
      totalTests > 0 ? this.metrics.reduce((sum, m) => sum + m.duration, 0) / totalTests : 0

    const totalMemoryUsage = this.metrics.reduce((sum, m) => sum + m.memoryUsage.heapUsed, 0)

    const thresholdViolations = this.benchmarks.filter(b => b.status === 'fail').length

    return {
      totalTests,
      passedTests,
      failedTests,
      timeoutTests,
      averageDuration,
      totalMemoryUsage,
      thresholdViolations
    }
  }

  /**
   * Get all test metrics
   */
  getTestMetrics(): TestingMetrics[] {
    return [...this.metrics]
  }

  /**
   * Get all benchmark results
   */
  getBenchmarkResults(): BenchmarkResult[] {
    return [...this.benchmarks]
  }

  /**
   * Export performance data for analysis
   */
  exportData(): {
    thresholds: PerformanceThresholds
    metrics: TestingMetrics[]
    benchmarks: BenchmarkResult[]
    summary: any
  } {
    return {
      thresholds: this.thresholds,
      metrics: [...this.metrics],
      benchmarks: [...this.benchmarks],
      summary: this.getPerformanceSummary()
    }
  }

  /**
   * Clear all collected data
   */
  reset(): void {
    this.metrics.length = 0
    this.benchmarks.length = 0
    this.activeTests.clear()

    logger.info('Performance monitor reset', 'TestingPerformanceMonitor')
  }

  // Private helper methods

  private async runBenchmarkIteration<T>(
    operation: () => T | Promise<T>,
    timeout: number
  ): Promise<number> {
    const startTime = performance.now()

    try {
      await Promise.race([
        Promise.resolve(operation()),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Benchmark iteration timeout')), timeout)
        )
      ])
    } catch (error) {
      throw error
    }

    return performance.now() - startTime
  }

  private getPercentile(sortedArray: number[], percentile: number): number {
    const index = (percentile / 100) * (sortedArray.length - 1)
    const lower = Math.floor(index)
    const upper = Math.ceil(index)
    const weight = index % 1

    if (upper >= sortedArray.length) return sortedArray[sortedArray.length - 1]
    if (lower === upper) return sortedArray[lower]

    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight
  }
}

/**
 * Global testing performance monitor instance
 */
export function createTestingPerformanceMonitor(
  thresholds?: Partial<PerformanceThresholds>
): TestingPerformanceMonitor {
  return new TestingPerformanceMonitor(thresholds)
}
