/**
 * Global Error Boundary Service
 * Prevents console spam by throttling repeated errors and implementing circuit breakers
 */

import { logger } from './Logger'

interface ErrorTracker {
  count: number
  firstOccurrence: number
  lastOccurrence: number
  message: string
  stack?: string
}

interface CircuitBreaker {
  isOpen: boolean
  failureCount: number
  lastFailure: number
  resetTimeout?: NodeJS.Timeout
}

class ErrorBoundaryService {
  private errorCounts = new Map<string, ErrorTracker>()
  private circuitBreakers = new Map<string, CircuitBreaker>()
  private readonly MAX_ERRORS_PER_MINUTE = 5
  private readonly CIRCUIT_BREAKER_THRESHOLD = 10
  private readonly CIRCUIT_BREAKER_RESET_TIME = 60000 // 1 minute
  private readonly ERROR_SPAM_WINDOW = 60000 // 1 minute
  
  constructor() {
    this.setupGlobalErrorHandlers()
  }
  
  private setupGlobalErrorHandlers() {
    // Catch unhandled errors
    window.addEventListener('error', (event) => {
      this.handleGlobalError(event.error || new Error(event.message), 'window.error')
    })
    
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleGlobalError(event.reason, 'unhandledrejection')
      // Prevent default behavior to avoid console spam
      event.preventDefault()
    })
    
    // Override console.error to catch and throttle repeated errors
    this.setupConsoleErrorThrottling()
  }
  
  private setupConsoleErrorThrottling() {
    const originalConsoleError = console.error
    const originalConsoleWarn = console.warn
    
    console.error = (...args: any[]) => {
      const errorMessage = args.map(arg => String(arg)).join(' ')
      if (this.shouldSuppressError('console.error', errorMessage)) {
        return
      }
      originalConsoleError.apply(console, args)
    }
    
    console.warn = (...args: any[]) => {
      const warningMessage = args.map(arg => String(arg)).join(' ')
      if (this.shouldSuppressError('console.warn', warningMessage)) {
        return
      }
      originalConsoleWarn.apply(console, args)
    }
  }
  
  private generateErrorKey(source: string, message: string): string {
    // Create a unique key for each type of error to track occurrences
    const shortMessage = message.substring(0, 100) // Limit key length
    return `${source}:${shortMessage}`
  }
  
  private shouldSuppressError(source: string, message: string): boolean {
    const now = Date.now()
    const errorKey = this.generateErrorKey(source, message)
    
    // Check circuit breaker
    const circuitBreaker = this.circuitBreakers.get(errorKey)
    if (circuitBreaker?.isOpen) {
      return true
    }
    
    // Track error occurrences
    let tracker = this.errorCounts.get(errorKey)
    if (!tracker) {
      tracker = {
        count: 0,
        firstOccurrence: now,
        lastOccurrence: now,
        message
      }
      this.errorCounts.set(errorKey, tracker)
    }
    
    // Reset count if outside spam window
    if (now - tracker.firstOccurrence > this.ERROR_SPAM_WINDOW) {
      tracker.count = 0
      tracker.firstOccurrence = now
    }
    
    tracker.count++
    tracker.lastOccurrence = now
    
    // Check if we should suppress due to spam
    if (tracker.count > this.MAX_ERRORS_PER_MINUTE) {
      this.activateCircuitBreaker(errorKey, message)
      return true
    }
    
    return false
  }
  
  private activateCircuitBreaker(errorKey: string, message: string) {
    const circuitBreaker: CircuitBreaker = {
      isOpen: true,
      failureCount: this.errorCounts.get(errorKey)?.count || 0,
      lastFailure: Date.now()
    }
    
    this.circuitBreakers.set(errorKey, circuitBreaker)
    
    // Log once that we're suppressing errors
    logger.warn('Circuit breaker activated - suppressing repeated errors', 'ErrorBoundary', {
      errorType: errorKey,
      failureCount: circuitBreaker.failureCount,
      suppressedMessage: message.substring(0, 200)
    })
    
    // Reset circuit breaker after timeout
    circuitBreaker.resetTimeout = setTimeout(() => {
      this.resetCircuitBreaker(errorKey)
    }, this.CIRCUIT_BREAKER_RESET_TIME)
  }
  
  private resetCircuitBreaker(errorKey: string) {
    const circuitBreaker = this.circuitBreakers.get(errorKey)
    if (circuitBreaker) {
      circuitBreaker.isOpen = false
      circuitBreaker.failureCount = 0
      if (circuitBreaker.resetTimeout) {
        clearTimeout(circuitBreaker.resetTimeout)
      }
      logger.info('Circuit breaker reset', 'ErrorBoundary', { errorType: errorKey })
    }
  }
  
  public handleGlobalError(error: any, source: string) {
    const message = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : undefined
    
    if (this.shouldSuppressError(source, message)) {
      return
    }
    
    logger.error('Global error caught', source, {
      message,
      stack,
      timestamp: new Date().toISOString()
    })
  }
  
  public handleComponentError(error: any, componentName: string, context?: any) {
    const message = error instanceof Error ? error.message : String(error)
    
    if (this.shouldSuppressError(`component:${componentName}`, message)) {
      return
    }
    
    logger.error(`Component error in ${componentName}`, 'ErrorBoundary', {
      error: message,
      stack: error instanceof Error ? error.stack : undefined,
      context
    })
  }
  
  public handleServiceError(error: any, serviceName: string, operation: string) {
    const message = error instanceof Error ? error.message : String(error)
    
    if (this.shouldSuppressError(`service:${serviceName}:${operation}`, message)) {
      return
    }
    
    logger.error(`Service error in ${serviceName}.${operation}`, 'ErrorBoundary', {
      error: message,
      stack: error instanceof Error ? error.stack : undefined
    })
  }
  
  public getErrorStats() {
    return {
      totalErrors: this.errorCounts.size,
      activeCircuitBreakers: Array.from(this.circuitBreakers.entries())
        .filter(([_, cb]) => cb.isOpen).length,
      errorSummary: Array.from(this.errorCounts.entries())
        .map(([key, tracker]) => ({
          errorType: key,
          count: tracker.count,
          firstSeen: new Date(tracker.firstOccurrence).toISOString(),
          lastSeen: new Date(tracker.lastOccurrence).toISOString()
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10) // Top 10 errors
    }
  }
  
  public clearErrorHistory() {
    this.errorCounts.clear()
    
    // Clear circuit breaker timeouts
    for (const [key, cb] of this.circuitBreakers.entries()) {
      if (cb.resetTimeout) {
        clearTimeout(cb.resetTimeout)
      }
    }
    this.circuitBreakers.clear()
    
    logger.info('Error history cleared', 'ErrorBoundary')
  }
}

// Export singleton instance
export const errorBoundary = new ErrorBoundaryService()

// Export utility functions
export function withErrorBoundary<T extends (...args: any[]) => any>(
  fn: T,
  componentName: string
): T {
  return ((...args: any[]) => {
    try {
      const result = fn.apply(this, args)
      
      // Handle async functions
      if (result && typeof result.catch === 'function') {
        return result.catch((error: any) => {
          errorBoundary.handleComponentError(error, componentName)
          throw error
        })
      }
      
      return result
    } catch (error) {
      errorBoundary.handleComponentError(error, componentName, { args })
      throw error
    }
  }) as T
}

export function suppressErrorSpam(errorMessage: string, source: string = 'unknown'): boolean {
  return errorBoundary['shouldSuppressError'](source, errorMessage)
}