/**
 * Client-side logging utility for the renderer process
 */
export class ClientLogger {
  private static instance: ClientLogger
  private isDevelopment: boolean = import.meta.env.DEV

  private constructor() {}

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
    
    if (level === 'ERROR') {
      console.error(`${timestamp} ${level} ${contextStr}${message}`, data || '')
    } else if (level === 'WARN') {
      console.warn(`${timestamp} ${level} ${contextStr}${message}`, data || '')
    } else if (this.isDevelopment) {
      console.log(`${timestamp} ${level} ${contextStr}${message}`, data || '')
    }
  }
}

// Convenience export
export const logger = ClientLogger.getInstance()