/**
 * Client-side logging utility for the renderer process
 * Enhanced with error boundary integration to prevent console spam
 */

// Forward declaration to avoid circular dependency
let errorBoundaryService: any = null

export class ClientLogger {
  private static instance: ClientLogger
  private isDevelopment: boolean = import.meta.env.DEV

  private constructor() {
    // Lazy load error boundary to avoid circular dependency
    this.initializeErrorBoundary()
  }

  private async initializeErrorBoundary() {
    try {
      const { errorBoundary } = await import('./ErrorBoundary')
      errorBoundaryService = errorBoundary
    } catch (error) {
      // Error boundary not available, continue without it
      console.warn('Error boundary service not available:', error)
    }
  }

  static getInstance(): ClientLogger {
    if (!ClientLogger.instance) {
      ClientLogger.instance = new ClientLogger()
    }
    return ClientLogger.instance
  }

  debug(message: string, context?: string, data?: any): void {
    if (this.isDevelopment) {
      this.log('DEBUG', message, context, data)
    }
  }

  info(message: string, context?: string, data?: any): void {
    if (this.isDevelopment) {
      this.log('INFO', message, context, data)
    }
  }

  warn(message: string, context?: string, data?: any): void {
    this.log('WARN', message, context, data)
  }

  error(message: string, context?: string, error?: any): void {
    this.log('ERROR', message, context, error)
  }

  private log(level: string, message: string, context?: string, data?: any): void {
    const timestamp = new Date().toISOString()
    const contextStr = context ? `[${context}] ` : ''
    const fullMessage = `${timestamp} ${level} ${contextStr}${message}`
    
    // Check if we should suppress this log message due to spam
    if (errorBoundaryService && (level === 'ERROR' || level === 'WARN')) {
      const shouldSuppress = errorBoundaryService.shouldSuppressError ? 
        errorBoundaryService.shouldSuppressError(`logger:${level}`, message) : false
      
      if (shouldSuppress) {
        return
      }
    }
    
    // Log based on level
    if (level === 'ERROR') {
      console.error(fullMessage, data || '')
    } else if (level === 'WARN') {
      console.warn(fullMessage, data || '')
    } else if (this.isDevelopment) {
      console.log(fullMessage, data || '')
    }
  }
  
  // New method to safely log errors without triggering spam protection
  safeError(message: string, context?: string, error?: any): void {
    try {
      this.error(message, context, error)
    } catch (logError) {
      // Fallback if even logging fails
      console.error('Logger failed:', logError, 'Original message:', message)
    }
  }
  
  // Method to get error statistics from error boundary
  getErrorStats(): any {
    return errorBoundaryService?.getErrorStats?.() || { message: 'Error boundary not available' }
  }
  
  // Method to clear error history
  clearErrorHistory(): void {
    errorBoundaryService?.clearErrorHistory?.()
  }
}

// Convenience export
export const logger = ClientLogger.getInstance()