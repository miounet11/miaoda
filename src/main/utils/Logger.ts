/**
 * Enhanced logging utility using electron-log
 * Provides structured logging with file output, rotation, and performance tracking
 */
import log from 'electron-log'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

// Ensure logs directory exists (skip in test environment)
let logsDir: string
try {
  const userDataPath = app.getPath('userData')
  logsDir = join(userDataPath, 'logs')
  if (!existsSync(logsDir)) {
    mkdirSync(logsDir, { recursive: true })
  }
} catch (error) {
  // In test environment, app might not be available
  logsDir = join(process.cwd(), 'logs')
  if (!existsSync(logsDir)) {
    mkdirSync(logsDir, { recursive: true })
  }
}

// Configure electron-log
log.transports.file.level = 'info'
log.transports.console.level = process.env.NODE_ENV === 'development' ? 'debug' : 'info'

// Set log file location
log.transports.file.resolvePathFn = () => join(logsDir, 'main.log')

// Set log format
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'
log.transports.console.format = '[{h}:{i}:{s}] [{level}] {text}'

// Enable log rotation (max 10MB per file)
log.transports.file.maxSize = 10 * 1024 * 1024 // 10MB

export class Logger {
  private static instance: Logger
  private isDevelopment: boolean = process.env.NODE_ENV === 'development'
  private performanceTimers: Map<string, number> = new Map()

  private constructor() {
    // Clear old logs on startup
    this.clearOldLogs()
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  debug(message: string, context?: string, data?: any): void {
    if (this.isDevelopment) {
      const logMessage = context ? `[${context}] ${message}` : message
      log.debug(logMessage, data ? JSON.stringify(data) : '')
    }
  }

  info(message: string, context?: string, data?: any): void {
    const logMessage = context ? `[${context}] ${message}` : message
    log.info(logMessage, data ? JSON.stringify(data) : '')
  }

  warn(message: string, context?: string, data?: any): void {
    const logMessage = context ? `[${context}] ${message}` : message
    log.warn(logMessage, data ? JSON.stringify(data) : '')
  }

  error(message: string, context?: string, error?: any): void {
    const logMessage = context ? `[${context}] ${message}` : message

    if (error instanceof Error) {
      log.error(logMessage, error.message)
      if (error.stack && this.isDevelopment) {
        log.debug('Stack trace:', error.stack)
      }
    } else {
      log.error(logMessage, error ? JSON.stringify(error) : '')
    }
  }

  // Performance logging methods
  time(label: string): void {
    this.performanceTimers.set(label, Date.now())
    log.debug(`[PERF] Timer started: ${label}`)
  }

  timeEnd(label: string): void {
    const startTime = this.performanceTimers.get(label)
    if (startTime) {
      const duration = Date.now() - startTime
      log.info(`[PERF] ${label}: ${duration}ms`)
      this.performanceTimers.delete(label)
    }
  }

  // Verbose logging for detailed debugging
  verbose(message: string, context?: string, data?: any): void {
    if (this.isDevelopment) {
      const logMessage = context ? `[${context}] ${message}` : message
      log.verbose(logMessage, data ? JSON.stringify(data) : '')
    }
  }

  // Get log file path
  getLogPath(): string {
    return join(logsDir, 'main.log')
  }

  // Clear old logs (keep last 7 days by default)
  clearOldLogs(daysToKeep = 7): void {
    try {
      const fs = require('fs')

      if (!existsSync(logsDir)) return

      const files = fs.readdirSync(logsDir)
      const now = Date.now()
      const cutoff = now - daysToKeep * 24 * 60 * 60 * 1000

      files.forEach((file: string) => {
        if (file.endsWith('.log')) {
          const filePath = join(logsDir, file)
          const stats = fs.statSync(filePath)
          if (stats.mtime.getTime() < cutoff) {
            fs.unlinkSync(filePath)
            log.info(`Deleted old log file: ${file}`)
          }
        }
      })
    } catch (error) {
      log.error('Failed to clear old logs:', error)
    }
  }

  // Log application startup info
  logStartup(): void {
    log.info('='.repeat(50))
    log.info('Application Starting')
    log.info(`Version: ${app.getVersion()}`)
    log.info(`Electron: ${process.versions.electron}`)
    log.info(`Node: ${process.versions.node}`)
    log.info(`Platform: ${process.platform}`)
    log.info(`Environment: ${process.env.NODE_ENV || 'production'}`)
    log.info(`Log Path: ${this.getLogPath()}`)
    log.info('='.repeat(50))
  }

  // Log unhandled errors
  logUnhandledError(error: Error, origin: string): void {
    log.error('='.repeat(50))
    log.error(`UNHANDLED ERROR [${origin}]`)
    log.error(`Message: ${error.message}`)
    if (error.stack) {
      log.error('Stack Trace:')
      log.error(error.stack)
    }
    log.error('='.repeat(50))
  }
}

// Convenience export
export const logger = Logger.getInstance()

// Setup global error handlers
process.on('uncaughtException', error => {
  logger.logUnhandledError(error, 'uncaughtException')
})

process.on('unhandledRejection', (reason: any) => {
  const error = reason instanceof Error ? reason : new Error(String(reason))
  logger.logUnhandledError(error, 'unhandledRejection')
})
