import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { Logger } from '../Logger'

// Mock electron-log
vi.mock('electron-log', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    verbose: vi.fn(),
    transports: {
      file: {
        level: 'info',
        resolvePathFn: vi.fn(),
        format: '',
        maxSize: 0
      },
      console: {
        level: 'info',
        format: ''
      }
    }
  }
}))

// Mock electron app
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/tmp/test-app')
  }
}))

// Mock fs
vi.mock('fs', () => ({
  existsSync: vi.fn(() => false),
  mkdirSync: vi.fn()
}))

describe('Logger', () => {
  let logger: Logger

  beforeEach(() => {
    // Reset singleton for testing
    ;(Logger as any).instance = undefined
    logger = Logger.getInstance()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Singleton Pattern', () => {
    it('returns same instance on multiple calls', () => {
      const logger1 = Logger.getInstance()
      const logger2 = Logger.getInstance()

      expect(logger1).toBe(logger2)
    })

    it('initializes only once', () => {
      const mkdirSpy = vi.spyOn(require('fs'), 'mkdirSync')

      Logger.getInstance()
      Logger.getInstance()
      Logger.getInstance()

      // Should only create directories once
      expect(mkdirSpy).toHaveBeenCalledOnce()
    })
  })

  describe('Logging Methods', () => {
    it('logs info messages correctly', () => {
      const log = require('electron-log').default

      logger.info('Test info message', 'TestModule')

      expect(log.info).toHaveBeenCalledWith('[TestModule] Test info message')
    })

    it('logs error messages correctly', () => {
      const log = require('electron-log').default
      const error = new Error('Test error')

      logger.error('Test error message', 'TestModule', error)

      expect(log.error).toHaveBeenCalledWith('[TestModule] Test error message', error)
    })

    it('logs warning messages correctly', () => {
      const log = require('electron-log').default

      logger.warn('Test warning message', 'TestModule')

      expect(log.warn).toHaveBeenCalledWith('[TestModule] Test warning message')
    })

    it('logs debug messages correctly', () => {
      const log = require('electron-log').default

      logger.debug('Test debug message', 'TestModule')

      expect(log.debug).toHaveBeenCalledWith('[TestModule] Test debug message')
    })

    it('handles messages without module name', () => {
      const log = require('electron-log').default

      logger.info('Test message without module')

      expect(log.info).toHaveBeenCalledWith('Test message without module')
    })

    it('handles complex data objects', () => {
      const log = require('electron-log').default
      const complexData = {
        user: 'test',
        data: { nested: true },
        array: [1, 2, 3]
      }

      logger.info('Complex data', 'TestModule', complexData)

      expect(log.info).toHaveBeenCalledWith('[TestModule] Complex data', complexData)
    })
  })

  describe('Performance Timing', () => {
    it('tracks performance timers correctly', () => {
      const timerId = 'test-operation'

      logger.startTimer(timerId)

      // Simulate some work
      const start = performance.now()
      while (performance.now() - start < 10) {
        // Busy wait for 10ms
      }

      const duration = logger.endTimer(timerId)

      expect(duration).toBeGreaterThan(0)
      expect(duration).toBeLessThan(100) // Should be reasonable
    })

    it('handles duplicate timer names', () => {
      const timerId = 'duplicate-timer'

      logger.startTimer(timerId)
      logger.startTimer(timerId) // Start again

      const duration = logger.endTimer(timerId)

      expect(duration).toBeGreaterThanOrEqual(0)
    })

    it('handles ending non-existent timers', () => {
      const duration = logger.endTimer('non-existent-timer')

      expect(duration).toBe(0)
    })

    it('clears timers after use', () => {
      const timerId = 'clear-test'

      logger.startTimer(timerId)
      logger.endTimer(timerId)

      // Second end should return 0
      const secondDuration = logger.endTimer(timerId)
      expect(secondDuration).toBe(0)
    })
  })

  describe('Development vs Production', () => {
    it('respects development environment', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'(
        // Reset singleton to pick up new environment
        Logger as any
      ).instance = undefined
      const devLogger = Logger.getInstance()

      expect(devLogger).toBeDefined()

      process.env.NODE_ENV = originalEnv
    })

    it('respects production environment', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'(
        // Reset singleton to pick up new environment
        Logger as any
      ).instance = undefined
      const prodLogger = Logger.getInstance()

      expect(prodLogger).toBeDefined()

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Log File Management', () => {
    it('creates logs directory if it does not exist', () => {
      const { existsSync, mkdirSync } = require('fs')

      existsSync.mockReturnValue(false)(
        // Reset singleton to trigger directory creation
        Logger as any
      ).instance = undefined
      Logger.getInstance()

      expect(mkdirSync).toHaveBeenCalledWith(expect.stringContaining('logs'), { recursive: true })
    })

    it('skips directory creation if it exists', () => {
      const { existsSync, mkdirSync } = require('fs')

      existsSync.mockReturnValue(true)(
        // Reset singleton
        Logger as any
      ).instance = undefined
      Logger.getInstance()

      expect(mkdirSync).not.toHaveBeenCalled()
    })

    it('handles directory creation errors gracefully', () => {
      const { mkdirSync } = require('fs')

      mkdirSync.mockImplementation(() => {
        throw new Error('Permission denied')
      })

      // Should not throw
      expect(() => {
        ;(Logger as any).instance = undefined
        Logger.getInstance()
      }).not.toThrow()
    })
  })

  describe('Log Rotation', () => {
    it('configures log rotation correctly', () => {
      const log = (require('electron-log').default(
        // Reset singleton to trigger configuration
        Logger as any
      ).instance = undefined)
      Logger.getInstance()

      expect(log.transports.file.maxSize).toBe(10 * 1024 * 1024) // 10MB
    })

    it('clears old logs on startup', () => {
      // Mock the clearOldLogs method
      const clearOldLogsSpy = (vi
        .spyOn(Logger.prototype as any, 'clearOldLogs')
        .mockImplementation(() => {})(Logger as any).instance = undefined)
      Logger.getInstance()

      expect(clearOldLogsSpy).toHaveBeenCalled()

      clearOldLogsSpy.mockRestore()
    })
  })

  describe('Error Handling', () => {
    it('handles logging errors gracefully', () => {
      const log = require('electron-log').default

      log.info.mockImplementation(() => {
        throw new Error('Logging error')
      })

      // Should not crash the application
      expect(() => {
        logger.info('Test message')
      }).not.toThrow()
    })

    it('handles timer errors gracefully', () => {
      // Mock performance.now to throw
      const originalNow = performance.now
      performance.now = vi.fn(() => {
        throw new Error('Performance API error')
      })

      expect(() => {
        logger.startTimer('error-timer')
        logger.endTimer('error-timer')
      }).not.toThrow()

      performance.now = originalNow
    })
  })

  describe('Context and Metadata', () => {
    it('includes context information in logs', () => {
      const log = require('electron-log').default
      const context = { userId: '123', sessionId: 'abc' }

      logger.info('Test with context', 'TestModule', context)

      expect(log.info).toHaveBeenCalledWith('[TestModule] Test with context', context)
    })

    it('handles circular references in context objects', () => {
      const log = require('electron-log').default
      const circularObj: any = { prop: 'value' }
      circularObj.self = circularObj

      expect(() => {
        logger.info('Circular reference test', 'TestModule', circularObj)
      }).not.toThrow()

      expect(log.info).toHaveBeenCalled()
    })
  })

  describe('Performance Benchmarks', () => {
    it('logs performance within acceptable time', () => {
      const startTime = performance.now()

      // Log 100 messages
      for (let i = 0; i < 100; i++) {
        logger.info(`Message ${i}`, 'PerfTest')
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      // Should complete quickly
      expect(duration).toBeLessThan(100) // Less than 100ms for 100 logs
    })

    it('handles high-frequency logging', () => {
      const start = performance.now()

      // Rapid logging
      for (let i = 0; i < 1000; i++) {
        logger.debug(`Debug message ${i}`, 'HighFreq')
      }

      const duration = performance.now() - start

      // Should handle high frequency without significant performance impact
      expect(duration).toBeLessThan(500) // Less than 500ms for 1000 logs
    })
  })
})
