/**
 * Centralized logging utility for the application
 * Replaces scattered console.log statements with structured logging
 */
export class Logger {
  private static instance: Logger
  private isDevelopment: boolean = process.env.NODE_ENV === 'development'

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  debug(message: string, context?: string, data?: any): void {
    if (this.isDevelopment) {
      this.log('DEBUG', message, context, data)
    }
  }

  info(message: string, context?: string, data?: any): void {
    this.log('INFO', message, context, data)
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
    
    if (level === 'ERROR') {
      console.error(`${timestamp} ${level} ${contextStr}${message}`, data || '')
    } else if (level === 'WARN') {
      console.warn(`${timestamp} ${level} ${contextStr}${message}`, data || '')
    } else {
      console.log(`${timestamp} ${level} ${contextStr}${message}`, data || '')
    }
  }
}

// Convenience export
export const logger = Logger.getInstance()