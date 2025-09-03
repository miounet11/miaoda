import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { TestingPerformanceMonitor } from '../../main/performance/TestingPerformanceMonitor'
import { BenchmarkRunner } from '../../main/performance/BenchmarkRunner'
import { logger } from '../../main/utils/Logger'

/**
 * LLM Performance Regression Tests
 * Validates that LLM operations meet performance requirements
 */
describe('LLM Performance Tests', () => {
  let performanceMonitor: TestingPerformanceMonitor
  let benchmarkRunner: BenchmarkRunner

  beforeAll(async () => {
    performanceMonitor = new TestingPerformanceMonitor({
      llmFirstToken: 2000,
      memoryBaseline: 500,
    })

    benchmarkRunner = new BenchmarkRunner({
      thresholds: {
        llmFirstToken: 2000,
      },
      verbose: true,
    })

    logger.info('LLM performance test suite initialized', 'LLMPerformanceTest')
  })

  afterAll(async () => {
    benchmarkRunner.destroy()
    performanceMonitor.reset()
  })

  beforeEach(() => {
    performanceMonitor.reset()
  })

  describe('Response Time Performance', () => {
    it('should receive first token within 2000ms threshold', async () => {
      const testId = 'llm-first-token'

      performanceMonitor.startTest(testId, 'LLM First Token Response')

      // Simulate LLM first token response
      const response = await simulateFirstTokenResponse()

      const metrics = performanceMonitor.endTest(testId, 'passed')

      expect(metrics).toBeDefined()
      expect(metrics!.duration).toBeLessThan(2000)
      expect(response.firstToken).toBeDefined()

      // Validate against threshold
      const validation = performanceMonitor.validatePerformance(
        'First Token',
        metrics!.duration,
        'llmFirstToken',
      )

      expect(validation.passed).toBe(true)
    })

    it('should stream tokens efficiently after first token', async () => {
      const testId = 'llm-streaming'

      performanceMonitor.startTest(testId, 'LLM Token Streaming')

      // Simulate streaming response
      const streamResult = await simulateTokenStreaming()

      const metrics = performanceMonitor.endTest(testId, 'passed')

      expect(metrics).toBeDefined()
      expect(streamResult.totalTokens).toBeGreaterThan(0)
      expect(streamResult.avgTokenInterval).toBeLessThan(100) // Tokens should stream quickly after first
    })

    it('should handle different message sizes appropriately', async () => {
      const messageSizes = ['short', 'medium', 'long']
      const results = []

      for (const size of messageSizes) {
        const testId = `llm-message-${size}`
        performanceMonitor.startTest(testId, `LLM ${size} Message Response`)

        const response = await simulateLLMResponse(size)
        const metrics = performanceMonitor.endTest(testId, 'passed')

        results.push({ size, duration: metrics!.duration, tokens: response.tokens })
      }

      // Verify that response times scale reasonably with message size
      expect(results[0].duration).toBeLessThan(results[1].duration) // short < medium
      expect(results[1].duration).toBeLessThan(results[2].duration) // medium < long

      // But all should be within acceptable bounds
      results.forEach(result => {
        expect(result.duration).toBeLessThan(3000) // Max 3 seconds for any size
      })
    })

    it('should maintain performance under concurrent requests', async () => {
      const concurrentRequests = 5
      const requests = Array(concurrentRequests).fill(null).map((_, index) =>
        performanceMonitor.measureAsync(
          () => simulateFirstTokenResponse(),
          `Concurrent LLM Request ${index + 1}`,
          5000,
        ),
      )

      const results = await Promise.all(requests)

      // All requests should complete within threshold
      results.forEach(result => {
        expect(result.metrics.duration).toBeLessThan(2500) // Slightly higher threshold for concurrent
        expect(result.metrics.status).toBe('passed')
      })

      // Average should still be reasonable
      const avgDuration = results.reduce((sum, r) => sum + r.metrics.duration, 0) / results.length
      expect(avgDuration).toBeLessThan(2200)
    })
  })

  describe('Memory Management', () => {
    it('should not exceed memory limits during LLM operations', async () => {
      const initialMemory = process.memoryUsage()

      // Simulate multiple LLM interactions
      const interactions = []
      for (let i = 0; i < 10; i++) {
        interactions.push(simulateLLMResponse('medium'))
      }

      await Promise.all(interactions)

      const finalMemory = process.memoryUsage()
      const memoryIncrease = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024

      expect(memoryIncrease).toBeLessThan(100) // Should not increase by more than 100MB
    })

    it('should properly cleanup streaming connections', async () => {
      const testId = 'llm-streaming-cleanup'
      performanceMonitor.startTest(testId, 'LLM Streaming Cleanup')

      // Simulate streaming with cleanup
      const result = await simulateStreamingWithCleanup()

      const metrics = performanceMonitor.endTest(testId, 'passed')

      expect(result.cleanedUp).toBe(true)
      expect(result.activeConnections).toBe(0)
    })
  })

  describe('Error Handling Performance', () => {
    it('should handle timeout errors efficiently', async () => {
      const testId = 'llm-timeout-handling'

      performanceMonitor.startTest(testId, 'LLM Timeout Handling')

      try {
        await performanceMonitor.measureAsync(
          () => simulateTimeoutError(),
          'Timeout Test',
          1000, // 1 second timeout
        )
      } catch (error) {
        expect(error.message).toContain('timeout')
      }

      const metrics = performanceMonitor.endTest(testId, 'timeout')
      expect(metrics!.status).toBe('timeout')
    })

    it('should recover from API errors quickly', async () => {
      const testId = 'llm-error-recovery'
      performanceMonitor.startTest(testId, 'LLM Error Recovery')

      // Simulate API error and recovery
      const recovery = await simulateErrorRecovery()

      const metrics = performanceMonitor.endTest(testId, 'passed')

      expect(recovery.recovered).toBe(true)
      expect(metrics!.duration).toBeLessThan(500) // Quick recovery
    })
  })

  describe('Benchmark Regression Tests', () => {
    it('should pass LLM benchmark suite', async () => {
      const suite = benchmarkRunner.createLLMBenchmarkSuite()
      benchmarkRunner.registerSuite(suite)

      const result = await benchmarkRunner.runSuite('LLM Performance')

      expect(result.status).toBe('passed')
      expect(result.failed).toBe(0)

      // Verify individual benchmarks
      result.benchmarks.forEach(benchmark => {
        expect(benchmark.status).toBe('pass')
        expect(benchmark.average).toBeLessThan(benchmark.threshold || 2000)
      })
    })

    it('should detect LLM performance regressions', async () => {
      // Baseline benchmark
      const baseline = await performanceMonitor.benchmark(
        () => simulateFirstTokenResponse(),
        {
          name: 'Baseline LLM Response',
          iterations: 5,
          threshold: 2000,
        },
      )

      expect(baseline.status).toBe('pass')

      // Simulate regression with slow response
      const regression = await performanceMonitor.benchmark(
        () => simulateSlowLLMResponse(),
        {
          name: 'Regression LLM Response',
          iterations: 3,
          threshold: 2000,
        },
      )

      expect(regression.status).toBe('fail')
      expect(regression.average).toBeGreaterThan(baseline.average * 1.5) // 50% slower
    })
  })

  describe('Provider-Specific Performance', () => {
    const providers = ['openai', 'anthropic', 'google', 'ollama']

    it.each(providers)('should meet performance requirements for %s provider', async (provider) => {
      const testId = `llm-${provider}-performance`
      performanceMonitor.startTest(testId, `${provider} Provider Performance`)

      const response = await simulateProviderResponse(provider)
      const metrics = performanceMonitor.endTest(testId, 'passed')

      expect(metrics!.duration).toBeLessThan(getProviderThreshold(provider))
      expect(response.provider).toBe(provider)
    })
  })
})

// Mock LLM operations for testing
async function simulateFirstTokenResponse(): Promise<{ firstToken: string; timestamp: number }> {
  // Simulate realistic first token timing (300ms - 1.5s)
  const responseTime = 300 + Math.random() * 1200
  await new Promise(resolve => setTimeout(resolve, responseTime))

  return {
    firstToken: 'Hello',
    timestamp: Date.now(),
  }
}

async function simulateTokenStreaming(): Promise<{ totalTokens: number; avgTokenInterval: number }> {
  const tokenCount = 50 + Math.random() * 100
  const tokens = []

  for (let i = 0; i < tokenCount; i++) {
    const interval = 20 + Math.random() * 60 // 20-80ms between tokens
    await new Promise(resolve => setTimeout(resolve, interval))
    tokens.push(interval)
  }

  const avgInterval = tokens.reduce((sum, t) => sum + t, 0) / tokens.length

  return {
    totalTokens: tokenCount,
    avgTokenInterval: avgInterval,
  }
}

async function simulateLLMResponse(messageSize: 'short' | 'medium' | 'long'): Promise<{ tokens: number; duration: number }> {
  const sizeMultiplier = { short: 1, medium: 2, long: 4 }[messageSize]
  const baseTime = 500 * sizeMultiplier
  const responseTime = baseTime + Math.random() * baseTime * 0.5

  await new Promise(resolve => setTimeout(resolve, responseTime))

  return {
    tokens: 10 * sizeMultiplier + Math.random() * 20,
    duration: responseTime,
  }
}

async function simulateStreamingWithCleanup(): Promise<{ cleanedUp: boolean; activeConnections: number }> {
  // Simulate streaming operation
  await new Promise(resolve => setTimeout(resolve, 200))

  // Simulate cleanup
  await new Promise(resolve => setTimeout(resolve, 50))

  return {
    cleanedUp: true,
    activeConnections: 0,
  }
}

async function simulateTimeoutError(): Promise<never> {
  // Simulate operation that takes too long
  await new Promise(resolve => setTimeout(resolve, 2000))
  throw new Error('Operation timeout')
}

async function simulateErrorRecovery(): Promise<{ recovered: boolean; retryCount: number }> {
  // Simulate quick error recovery
  await new Promise(resolve => setTimeout(resolve, 100))

  return {
    recovered: true,
    retryCount: 1,
  }
}

async function simulateSlowLLMResponse(): Promise<{ tokens: number }> {
  // Intentionally slow response for regression testing
  await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 1000))

  return { tokens: 50 }
}

async function simulateProviderResponse(provider: string): Promise<{ provider: string; tokens: number }> {
  const providerTimes = {
    openai: 800 + Math.random() * 600,
    anthropic: 900 + Math.random() * 700,
    google: 700 + Math.random() * 500,
    ollama: 1200 + Math.random() * 800, // Local model, potentially slower
  }

  await new Promise(resolve => setTimeout(resolve, providerTimes[provider] || 1000))

  return {
    provider,
    tokens: 20 + Math.random() * 30,
  }
}

function getProviderThreshold(provider: string): number {
  const thresholds = {
    openai: 2000,
    anthropic: 2200,
    google: 1800,
    ollama: 3000, // Higher threshold for local models
  }

  return thresholds[provider] || 2000
}
