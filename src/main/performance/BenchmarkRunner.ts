import { EventEmitter } from 'events'
import { TestingPerformanceMonitor, BenchmarkResult, PerformanceThresholds } from './TestingPerformanceMonitor'
import { PerformanceMonitor } from './PerformanceMonitor'
import { logger } from '../utils/Logger'

export interface BenchmarkSuite {
  name: string
  description?: string
  benchmarks: BenchmarkDefinition[]
  setup?: () => Promise<void>
  teardown?: () => Promise<void>
}

export interface BenchmarkDefinition {
  name: string
  description?: string
  category: keyof PerformanceThresholds
  test: () => Promise<any> | any
  iterations?: number
  timeout?: number
  threshold?: number
  setup?: () => Promise<void>
  teardown?: () => Promise<void>
}

export interface SuiteResult {
  suiteName: string
  startTime: number
  endTime: number
  duration: number
  benchmarks: BenchmarkResult[]
  passed: number
  failed: number
  totalTests: number
  status: 'passed' | 'failed'
}

export interface RunnerOptions {
  thresholds?: Partial<PerformanceThresholds>
  parallel?: boolean
  maxConcurrency?: number
  verbose?: boolean
  reportFormat?: 'json' | 'text' | 'html'
  outputFile?: string
}

/**
 * Automated benchmark execution framework
 * Orchestrates performance tests and generates comprehensive reports
 */
export class BenchmarkRunner extends EventEmitter {
  private readonly performanceMonitor: TestingPerformanceMonitor
  private readonly systemMonitor?: PerformanceMonitor
  private readonly options: RunnerOptions
  private readonly suites: Map<string, BenchmarkSuite> = new Map()
  private readonly results: SuiteResult[] = []
  private isRunning = false

  constructor(options: RunnerOptions = {}) {
    super()

    this.options = {
      thresholds: {
        chatRendering: 100,
        llmFirstToken: 2000,
        databaseQuery: 50,
        pluginExecution: 500,
        memoryBaseline: 500
      },
      parallel: false,
      maxConcurrency: 4,
      verbose: true,
      reportFormat: 'text',
      ...options
    }

    this.performanceMonitor = new TestingPerformanceMonitor(this.options.thresholds)

    // Optional system monitoring during benchmarks
    if (this.options.verbose) {
      this.systemMonitor = new PerformanceMonitor({
        enabled: true,
        metricsInterval: 1000,
        enableProfiling: true
      })
    }

    logger.info('Benchmark runner initialized', 'BenchmarkRunner', this.options)
  }

  /**
   * Register a benchmark suite
   */
  registerSuite(suite: BenchmarkSuite): void {
    if (this.suites.has(suite.name)) {
      throw new Error(`Suite '${suite.name}' is already registered`)
    }

    // Validate suite
    this.validateSuite(suite)

    this.suites.set(suite.name, suite)

    logger.debug('Benchmark suite registered', 'BenchmarkRunner', {
      name: suite.name,
      benchmarkCount: suite.benchmarks.length
    })
  }

  /**
   * Run all registered benchmark suites
   */
  async runAll(): Promise<SuiteResult[]> {
    if (this.isRunning) {
      throw new Error('Benchmark runner is already running')
    }

    this.isRunning = true
    this.results.length = 0

    logger.info('Starting all benchmark suites', 'BenchmarkRunner', {
      suiteCount: this.suites.size
    })

    try {
      for (const [suiteName, suite] of this.suites) {
        try {
          const result = await this.runSuite(suiteName)
          this.results.push(result)
        } catch (error) {
          logger.error('Suite execution failed', 'BenchmarkRunner', {
            suiteName,
            error: error instanceof Error ? error.message : String(error)
          })

          // Create failed result
          this.results.push({
            suiteName,
            startTime: Date.now(),
            endTime: Date.now(),
            duration: 0,
            benchmarks: [],
            passed: 0,
            failed: 1,
            totalTests: suite.benchmarks.length,
            status: 'failed'
          })
        }
      }

      // Generate final report
      await this.generateReport()

      return [...this.results]
    } finally {
      this.isRunning = false
    }
  }

  /**
   * Run a specific benchmark suite
   */
  async runSuite(suiteName: string): Promise<SuiteResult> {
    const suite = this.suites.get(suiteName)
    if (!suite) {
      throw new Error(`Suite '${suiteName}' not found`)
    }

    logger.info('Starting benchmark suite', 'BenchmarkRunner', { suiteName })

    const startTime = Date.now()
    const benchmarks: BenchmarkResult[] = []

    try {
      // Suite setup
      if (suite.setup) {
        logger.debug('Running suite setup', 'BenchmarkRunner', { suiteName })
        await suite.setup()
      }

      // Run benchmarks
      if (this.options.parallel) {
        benchmarks.push(...await this.runBenchmarksParallel(suite.benchmarks))
      } else {
        benchmarks.push(...await this.runBenchmarksSequential(suite.benchmarks))
      }

      // Suite teardown
      if (suite.teardown) {
        logger.debug('Running suite teardown', 'BenchmarkRunner', { suiteName })
        await suite.teardown()
      }

      const endTime = Date.now()
      const passed = benchmarks.filter(b => b.status === 'pass').length
      const failed = benchmarks.filter(b => b.status === 'fail').length

      const result: SuiteResult = {
        suiteName,
        startTime,
        endTime,
        duration: endTime - startTime,
        benchmarks,
        passed,
        failed,
        totalTests: benchmarks.length,
        status: failed > 0 ? 'failed' : 'passed'
      }

      this.emit('suite-completed', result)

      logger.info('Benchmark suite completed', 'BenchmarkRunner', {
        suiteName,
        duration: result.duration,
        passed,
        failed,
        status: result.status
      })

      return result
    } catch (error) {
      logger.error('Suite execution failed', 'BenchmarkRunner', {
        suiteName,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Create a benchmark suite for database operations
   */
  createDatabaseBenchmarkSuite(): BenchmarkSuite {
    return {
      name: 'Database Performance',
      description: 'Benchmarks for database query performance',
      benchmarks: [
        {
          name: 'Simple SELECT Query',
          category: 'databaseQuery',
          threshold: this.options.thresholds!.databaseQuery,
          test: async () => {
            // Mock database query - in real implementation, would use actual DB
            await new Promise(resolve => setTimeout(resolve, Math.random() * 30))
            return { rows: 1 }
          },
          iterations: 20
        },
        {
          name: 'Complex JOIN Query',
          category: 'databaseQuery',
          threshold: this.options.thresholds!.databaseQuery! * 2,
          test: async () => {
            // Mock complex query
            await new Promise(resolve => setTimeout(resolve, Math.random() * 80))
            return { rows: 100 }
          },
          iterations: 10
        },
        {
          name: 'Full-text Search',
          category: 'databaseQuery',
          threshold: this.options.thresholds!.databaseQuery! * 3,
          test: async () => {
            // Mock FTS query
            await new Promise(resolve => setTimeout(resolve, Math.random() * 120))
            return { rows: 50 }
          },
          iterations: 10
        }
      ]
    }
  }

  /**
   * Create a benchmark suite for LLM operations
   */
  createLLMBenchmarkSuite(): BenchmarkSuite {
    return {
      name: 'LLM Performance',
      description: 'Benchmarks for LLM response times',
      benchmarks: [
        {
          name: 'First Token Response',
          category: 'llmFirstToken',
          threshold: this.options.thresholds!.llmFirstToken,
          test: async () => {
            // Mock LLM first token time
            await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))
            return { token: 'Hello' }
          },
          iterations: 5
        },
        {
          name: 'Small Message Processing',
          category: 'llmFirstToken',
          threshold: this.options.thresholds!.llmFirstToken! * 0.5,
          test: async () => {
            // Mock small message processing
            await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200))
            return { tokens: 10 }
          },
          iterations: 10
        }
      ]
    }
  }

  /**
   * Create a benchmark suite for UI rendering
   */
  createUIBenchmarkSuite(): BenchmarkSuite {
    return {
      name: 'UI Rendering Performance',
      description: 'Benchmarks for chat UI rendering performance',
      benchmarks: [
        {
          name: 'Single Message Render',
          category: 'chatRendering',
          threshold: this.options.thresholds!.chatRendering,
          test: async () => {
            // Mock message rendering
            await new Promise(resolve => setTimeout(resolve, Math.random() * 50))
            return { rendered: true }
          },
          iterations: 50
        },
        {
          name: 'Message List Render',
          category: 'chatRendering',
          threshold: this.options.thresholds!.chatRendering! * 5,
          test: async () => {
            // Mock message list rendering
            await new Promise(resolve => setTimeout(resolve, Math.random() * 200))
            return { messageCount: 50 }
          },
          iterations: 20
        }
      ]
    }
  }

  /**
   * Create a benchmark suite for plugin operations
   */
  createPluginBenchmarkSuite(): BenchmarkSuite {
    return {
      name: 'Plugin Performance',
      description: 'Benchmarks for plugin execution performance',
      benchmarks: [
        {
          name: 'Plugin Initialization',
          category: 'pluginExecution',
          threshold: this.options.thresholds!.pluginExecution,
          test: async () => {
            // Mock plugin initialization
            await new Promise(resolve => setTimeout(resolve, Math.random() * 200))
            return { initialized: true }
          },
          iterations: 10
        },
        {
          name: 'Plugin Method Execution',
          category: 'pluginExecution',
          threshold: this.options.thresholds!.pluginExecution! * 0.5,
          test: async () => {
            // Mock plugin method call
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100))
            return { result: 'success' }
          },
          iterations: 25
        }
      ]
    }
  }

  /**
   * Register all default benchmark suites
   */
  registerDefaultSuites(): void {
    this.registerSuite(this.createDatabaseBenchmarkSuite())
    this.registerSuite(this.createLLMBenchmarkSuite())
    this.registerSuite(this.createUIBenchmarkSuite())
    this.registerSuite(this.createPluginBenchmarkSuite())
  }

  /**
   * Generate performance report
   */
  private async generateReport(): Promise<void> {
    const summary = this.getOverallSummary()
    
    logger.info('Benchmark execution completed', 'BenchmarkRunner', summary)

    switch (this.options.reportFormat) {
      case 'json':
        await this.generateJSONReport()
        break
      case 'html':
        await this.generateHTMLReport()
        break
      default:
        this.generateTextReport()
    }

    this.emit('report-generated', { summary, results: this.results })
  }

  /**
   * Get overall performance summary
   */
  private getOverallSummary() {
    const totalSuites = this.results.length
    const passedSuites = this.results.filter(r => r.status === 'passed').length
    const failedSuites = this.results.filter(r => r.status === 'failed').length

    const totalBenchmarks = this.results.reduce((sum, r) => sum + r.totalTests, 0)
    const passedBenchmarks = this.results.reduce((sum, r) => sum + r.passed, 0)
    const failedBenchmarks = this.results.reduce((sum, r) => sum + r.failed, 0)

    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0)

    return {
      totalSuites,
      passedSuites,
      failedSuites,
      totalBenchmarks,
      passedBenchmarks,
      failedBenchmarks,
      totalDuration,
      successRate: totalBenchmarks > 0 ? (passedBenchmarks / totalBenchmarks) * 100 : 0
    }
  }

  // Private implementation methods

  private async runBenchmarksSequential(benchmarks: BenchmarkDefinition[]): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = []

    for (const benchmark of benchmarks) {
      try {
        const result = await this.runSingleBenchmark(benchmark)
        results.push(result)
      } catch (error) {
        logger.error('Benchmark failed', 'BenchmarkRunner', {
          benchmarkName: benchmark.name,
          error: error instanceof Error ? error.message : String(error)
        })

        // Create failed result
        results.push({
          name: benchmark.name,
          duration: 0,
          iterations: 0,
          average: 0,
          min: 0,
          max: 0,
          standardDeviation: 0,
          percentiles: { p50: 0, p95: 0, p99: 0 },
          memoryDelta: 0,
          status: 'fail',
          threshold: benchmark.threshold
        })
      }
    }

    return results
  }

  private async runBenchmarksParallel(benchmarks: BenchmarkDefinition[]): Promise<BenchmarkResult[]> {
    const concurrency = Math.min(this.options.maxConcurrency!, benchmarks.length)
    const results: BenchmarkResult[] = []
    
    // Split benchmarks into batches
    for (let i = 0; i < benchmarks.length; i += concurrency) {
      const batch = benchmarks.slice(i, i + concurrency)
      
      const batchResults = await Promise.all(
        batch.map(async benchmark => {
          try {
            return await this.runSingleBenchmark(benchmark)
          } catch (error) {
            logger.error('Parallel benchmark failed', 'BenchmarkRunner', {
              benchmarkName: benchmark.name,
              error: error instanceof Error ? error.message : String(error)
            })

            return {
              name: benchmark.name,
              duration: 0,
              iterations: 0,
              average: 0,
              min: 0,
              max: 0,
              standardDeviation: 0,
              percentiles: { p50: 0, p95: 0, p99: 0 },
              memoryDelta: 0,
              status: 'fail' as const,
              threshold: benchmark.threshold
            }
          }
        })
      )
      
      results.push(...batchResults)
    }

    return results
  }

  private async runSingleBenchmark(benchmark: BenchmarkDefinition): Promise<BenchmarkResult> {
    logger.debug('Running benchmark', 'BenchmarkRunner', { name: benchmark.name })

    try {
      // Benchmark setup
      if (benchmark.setup) {
        await benchmark.setup()
      }

      // Run the benchmark
      const result = await this.performanceMonitor.benchmark(benchmark.test, {
        name: benchmark.name,
        iterations: benchmark.iterations || 10,
        threshold: benchmark.threshold,
        timeout: benchmark.timeout || 5000
      })

      // Benchmark teardown
      if (benchmark.teardown) {
        await benchmark.teardown()
      }

      this.emit('benchmark-completed', result)
      return result

    } catch (error) {
      logger.error('Benchmark execution failed', 'BenchmarkRunner', {
        benchmarkName: benchmark.name,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  private validateSuite(suite: BenchmarkSuite): void {
    if (!suite.name) {
      throw new Error('Suite name is required')
    }

    if (!suite.benchmarks || suite.benchmarks.length === 0) {
      throw new Error('Suite must contain at least one benchmark')
    }

    for (const benchmark of suite.benchmarks) {
      if (!benchmark.name) {
        throw new Error('Benchmark name is required')
      }

      if (!benchmark.test) {
        throw new Error(`Benchmark '${benchmark.name}' must have a test function`)
      }

      if (!benchmark.category) {
        throw new Error(`Benchmark '${benchmark.name}' must have a category`)
      }
    }
  }

  private generateTextReport(): void {
    const summary = this.getOverallSummary()
    
    let report = '\n=== BENCHMARK RESULTS ===\n\n'
    report += `Total Suites: ${summary.totalSuites} (${summary.passedSuites} passed, ${summary.failedSuites} failed)\n`
    report += `Total Benchmarks: ${summary.totalBenchmarks} (${summary.passedBenchmarks} passed, ${summary.failedBenchmarks} failed)\n`
    report += `Success Rate: ${summary.successRate.toFixed(1)}%\n`
    report += `Total Duration: ${Math.round(summary.totalDuration)}ms\n\n`

    for (const result of this.results) {
      report += `--- ${result.suiteName} ---\n`
      report += `Status: ${result.status.toUpperCase()}\n`
      report += `Duration: ${Math.round(result.duration)}ms\n`
      report += `Benchmarks: ${result.passed} passed, ${result.failed} failed\n\n`

      for (const benchmark of result.benchmarks) {
        report += `  ${benchmark.name}: `
        report += `${Math.round(benchmark.average)}ms avg `
        report += `(${Math.round(benchmark.min)}-${Math.round(benchmark.max)}ms) `
        report += `[${benchmark.status.toUpperCase()}]`
        
        if (benchmark.threshold) {
          report += ` (threshold: ${benchmark.threshold}ms)`
        }
        
        report += '\n'
      }
      
      report += '\n'
    }

    logger.info(report, 'BenchmarkRunner')
  }

  private async generateJSONReport(): Promise<void> {
    const report = {
      summary: this.getOverallSummary(),
      results: this.results,
      thresholds: this.options.thresholds,
      options: this.options,
      timestamp: Date.now()
    }

    // In a real implementation, would write to file if outputFile is specified
    logger.info('JSON report generated', 'BenchmarkRunner', { reportSize: JSON.stringify(report).length })
  }

  private async generateHTMLReport(): Promise<void> {
    // In a real implementation, would generate HTML report
    logger.info('HTML report generation not implemented', 'BenchmarkRunner')
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.performanceMonitor.reset()
    this.systemMonitor?.destroy()
    this.removeAllListeners()
    
    logger.info('Benchmark runner destroyed', 'BenchmarkRunner')
  }
}

/**
 * Create a benchmark runner with default configuration
 */
export function createBenchmarkRunner(options?: RunnerOptions): BenchmarkRunner {
  return new BenchmarkRunner(options)
}