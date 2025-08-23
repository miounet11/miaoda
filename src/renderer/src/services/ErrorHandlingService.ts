/**
 * Enhanced Error Handling Service
 * Provides comprehensive error handling, recovery, and user feedback
 */

import { logger } from '@renderer/src/utils/Logger'
import { useToastStore } from '@renderer/src/stores/toast'

export interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  sessionId?: string
  metadata?: Record<string, any>
}

export interface ErrorReport {
  id: string
  timestamp: Date
  error: Error
  context: ErrorContext
  severity: 'low' | 'medium' | 'high' | 'critical'
  handled: boolean
  recovery?: () => Promise<void>
}

export class ErrorHandlingService {
  private static instance: ErrorHandlingService
  private errorQueue: ErrorReport[] = []
  private retryAttempts = new Map<string, number>()
  private maxRetries = 3
  private toastStore: ReturnType<typeof useToastStore> | null = null

  private constructor() {
    this.setupGlobalHandlers()
  }

  static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService()
    }
    return ErrorHandlingService.instance
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', event => {
      this.handleError(new Error(event.reason), {
        component: 'global',
        action: 'unhandledRejection'
      })
      event.preventDefault()
    })

    // Handle global errors
    window.addEventListener('error', event => {
      this.handleError(event.error || new Error(event.message), {
        component: 'global',
        action: 'windowError'
      })
    })
  }

  /**
   * Initialize toast store (called after Vue app is created)
   */
  initializeToastStore(store: ReturnType<typeof useToastStore>) {
    this.toastStore = store
  }

  /**
   * Main error handling method
   */
  async handleError(
    error: Error,
    context: ErrorContext = {},
    recovery?: () => Promise<void>
  ): Promise<void> {
    const errorReport = this.createErrorReport(error, context, recovery)

    // Log the error
    this.logError(errorReport)

    // Add to queue for batch reporting
    this.errorQueue.push(errorReport)

    // Show user-friendly message
    this.showUserMessage(errorReport)

    // Attempt recovery if provided
    if (recovery) {
      await this.attemptRecovery(errorReport)
    }

    // Report to backend if critical
    if (errorReport.severity === 'critical' || errorReport.severity === 'high') {
      await this.reportToBackend(errorReport)
    }
  }

  /**
   * Create error report with severity assessment
   */
  private createErrorReport(
    error: Error,
    context: ErrorContext,
    recovery?: () => Promise<void>
  ): ErrorReport {
    const id = this.generateErrorId()
    const severity = this.assessSeverity(error, context)

    return {
      id,
      timestamp: new Date(),
      error,
      context,
      severity,
      handled: true,
      recovery
    }
  }

  /**
   * Assess error severity
   */
  private assessSeverity(error: Error, context: ErrorContext): ErrorReport['severity'] {
    // Network errors
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'low'
    }

    // Authentication errors
    if (error.message.includes('auth') || error.message.includes('401')) {
      return 'medium'
    }

    // Database errors
    if (error.message.includes('database') || error.message.includes('sqlite')) {
      return 'high'
    }

    // Critical system errors
    if (context.component === 'global' || error.message.includes('critical')) {
      return 'critical'
    }

    return 'medium'
  }

  /**
   * Log error with appropriate level
   */
  private logError(report: ErrorReport) {
    const logMessage = `[${report.severity.toUpperCase()}] ${report.error.message}`
    const logContext = {
      id: report.id,
      component: report.context.component,
      action: report.context.action,
      stack: report.error.stack,
      metadata: report.context.metadata
    }

    switch (report.severity) {
      case 'critical':
      case 'high':
        logger.error(logMessage, report.context.component || 'unknown', logContext)
        break
      case 'medium':
        logger.warn(logMessage, report.context.component || 'unknown', logContext)
        break
      case 'low':
        logger.info(logMessage, report.context.component || 'unknown', logContext)
        break
    }
  }

  /**
   * Show user-friendly error message
   */
  private showUserMessage(report: ErrorReport) {
    if (!this.toastStore) return

    const messages = {
      network: 'Network connection issue. Please check your internet connection.',
      auth: 'Authentication failed. Please log in again.',
      database: 'Data access error. Please try again.',
      default: 'An unexpected error occurred. Please try again.'
    }

    let message = messages.default
    if (report.error.message.includes('network')) {
      message = messages.network
    } else if (report.error.message.includes('auth')) {
      message = messages.auth
    } else if (report.error.message.includes('database')) {
      message = messages.database
    }

    this.toastStore.showError(message)
  }

  /**
   * Attempt error recovery
   */
  private async attemptRecovery(report: ErrorReport): Promise<void> {
    if (!report.recovery) return

    const attempts = this.retryAttempts.get(report.id) || 0
    if (attempts >= this.maxRetries) {
      logger.error('Max retry attempts reached', report.context.component || 'unknown', {
        errorId: report.id,
        attempts
      })
      return
    }

    this.retryAttempts.set(report.id, attempts + 1)

    try {
      await report.recovery()
      logger.info('Error recovery successful', report.context.component || 'unknown', {
        errorId: report.id,
        attempts: attempts + 1
      })
      this.retryAttempts.delete(report.id)
    } catch (recoveryError) {
      logger.error('Error recovery failed', report.context.component || 'unknown', {
        errorId: report.id,
        attempts: attempts + 1,
        recoveryError
      })

      // Exponential backoff for next retry
      setTimeout(
        () => {
          this.attemptRecovery(report)
        },
        Math.pow(2, attempts) * 1000
      )
    }
  }

  /**
   * Report critical errors to backend
   */
  private async reportToBackend(report: ErrorReport): Promise<void> {
    try {
      // In production, send to error tracking service
      if (import.meta.env.PROD && window.api?.error?.report) {
        await window.api.error.report({
          id: report.id,
          timestamp: report.timestamp.toISOString(),
          message: report.error.message,
          stack: report.error.stack,
          context: report.context,
          severity: report.severity
        })
      }
    } catch (error) {
      // Silently fail - don't create error loop
      console.error('Failed to report error to backend:', error)
    }
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `error-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const stats = {
      total: this.errorQueue.length,
      bySeverity: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      byComponent: {} as Record<string, number>
    }

    this.errorQueue.forEach(report => {
      stats.bySeverity[report.severity]++
      const component = report.context.component || 'unknown'
      stats.byComponent[component] = (stats.byComponent[component] || 0) + 1
    })

    return stats
  }

  /**
   * Clear error queue
   */
  clearErrors() {
    this.errorQueue = []
    this.retryAttempts.clear()
  }

  /**
   * Export error log
   */
  exportErrorLog(): string {
    return JSON.stringify(this.errorQueue, null, 2)
  }

  private showToast(message: string, type: 'error' | 'success' = 'error') {
    if (!this.toastStore) {
      try {
        this.toastStore = useToastStore()
      } catch (e) {
        // Pinia not ready, skip
        console.warn('Toast store not available')
        return
      }
    }

    if (type === 'error') {
      this.toastStore.showError(message)
    } else {
      this.toastStore.showSuccess(message)
    }
  }
}

// Export singleton instance
export const errorHandler = ErrorHandlingService.getInstance()

// Helper function for components
export function useErrorHandler() {
  return {
    handleError: (error: Error, context?: ErrorContext, recovery?: () => Promise<void>) => {
      return errorHandler.handleError(error, context, recovery)
    },
    getStats: () => errorHandler.getErrorStats(),
    clearErrors: () => errorHandler.clearErrors(),
    exportLog: () => errorHandler.exportErrorLog()
  }
}
