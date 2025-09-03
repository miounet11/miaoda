/**
 * 错误恢复管理器 - 提供全局错误处理和恢复机制
 */

import { app, dialog, BrowserWindow } from 'electron'
import { logger } from './utils/Logger'
import { LocalDatabase } from './db/database'
import * as fs from 'fs'
import * as path from 'path'

export interface ErrorContext {
  module: string
  operation: string
  error: Error
  timestamp: Date
  recoverable: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface RecoveryStrategy {
  type: 'retry' | 'fallback' | 'reset' | 'restart' | 'notify'
  action: () => Promise<boolean>
  maxAttempts?: number
}

export class ErrorRecoveryManager {
  private static instance: ErrorRecoveryManager
  private errorHistory: ErrorContext[] = []
  private recoveryStrategies = new Map<string, RecoveryStrategy>()
  private isRecovering = false
  private db: LocalDatabase | null = null

  private constructor() {
    this.setupDefaultStrategies()
    this.setupGlobalHandlers()
  }

  static getInstance(): ErrorRecoveryManager {
    if (!ErrorRecoveryManager.instance) {
      ErrorRecoveryManager.instance = new ErrorRecoveryManager()
    }
    return ErrorRecoveryManager.instance
  }

  /**
   * 设置数据库实例
   */
  setDatabase(db: LocalDatabase): void {
    this.db = db
  }

  /**
   * 处理错误并尝试恢复
   */
  async handleError(error: Error, context: Partial<ErrorContext>): Promise<boolean> {
    const errorContext: ErrorContext = {
      module: context.module || 'Unknown',
      operation: context.operation || 'Unknown',
      error,
      timestamp: new Date(),
      recoverable: context.recoverable ?? true,
      severity: context.severity || this.calculateSeverity(error),
    }

    // 记录错误
    this.errorHistory.push(errorContext)
    logger.error(`Error in ${errorContext.module}: ${error.message}`, errorContext.module, error)

    // 如果正在恢复，避免递归
    if (this.isRecovering) {
      logger.warn('Already recovering from another error', 'ErrorRecovery')
      return false
    }

    // 尝试恢复
    if (errorContext.recoverable) {
      return await this.attemptRecovery(errorContext)
    }

    // 不可恢复的错误
    await this.handleCriticalError(errorContext)
    return false
  }

  /**
   * 尝试恢复
   */
  private async attemptRecovery(context: ErrorContext): Promise<boolean> {
    this.isRecovering = true

    try {
      // 获取恢复策略
      const strategyKey = `${context.module}:${context.operation}`
      let strategy = this.recoveryStrategies.get(strategyKey)

      if (!strategy) {
        strategy = this.recoveryStrategies.get(context.module)
      }

      if (!strategy) {
        strategy = this.getDefaultStrategy(context)
      }

      // 执行恢复策略
      logger.info(`Attempting recovery: ${strategy.type}`, 'ErrorRecovery')

      const success = await strategy.action()

      if (success) {
        logger.info('Recovery successful', 'ErrorRecovery')
        this.notifyRecoverySuccess(context)
      } else {
        logger.warn('Recovery failed', 'ErrorRecovery')
        await this.escalateError(context)
      }

      return success
    } catch (recoveryError) {
      logger.error('Error during recovery', 'ErrorRecovery', recoveryError)
      await this.handleCriticalError(context)
      return false
    } finally {
      this.isRecovering = false
    }
  }

  /**
   * 设置默认恢复策略
   */
  private setupDefaultStrategies(): void {
    // 数据库错误恢复
    this.recoveryStrategies.set('database', {
      type: 'retry',
      action: async () => {
        try {
          // 尝试重新初始化数据库
          if (this.db) {
            logger.info('Attempting to reinitialize database', 'ErrorRecovery')
            // Database reinitialization would go here
            return true
          }
          return false
        } catch {
          return false
        }
      },
      maxAttempts: 3,
    })

    // 网络错误恢复
    this.recoveryStrategies.set('network', {
      type: 'retry',
      action: async () => {
        logger.info('Waiting for network recovery', 'ErrorRecovery')
        await new Promise(resolve => setTimeout(resolve, 5000))
        // Check network connectivity
        return true
      },
      maxAttempts: 5,
    })

    // 内存错误恢复
    this.recoveryStrategies.set('memory', {
      type: 'reset',
      action: async () => {
        logger.info('Attempting to free memory', 'ErrorRecovery')

        // Force garbage collection if available
        if (global.gc) {
          global.gc()
        }

        // Clear caches
        const windows = BrowserWindow.getAllWindows()
        for (const window of windows) {
          window.webContents.session.clearCache()
        }

        return true
      },
    })

    // 文件系统错误恢复
    this.recoveryStrategies.set('filesystem', {
      type: 'fallback',
      action: async () => {
        logger.info('Using fallback file operations', 'ErrorRecovery')
        // Implement fallback file operations
        return true
      },
    })
  }

  /**
   * 获取默认策略
   */
  private getDefaultStrategy(context: ErrorContext): RecoveryStrategy {
    // 根据错误类型选择默认策略
    if (context.error.message.includes('ENOENT')) {
      return {
        type: 'fallback',
        action: async () => {
          logger.info('File not found, using default', 'ErrorRecovery')
          return true
        },
      }
    }

    if (context.error.message.includes('ENOMEM')) {
      return this.recoveryStrategies.get('memory')!
    }

    if (context.error.message.includes('ECONNREFUSED')) {
      return this.recoveryStrategies.get('network')!
    }

    // 默认重试策略
    return {
      type: 'retry',
      action: async () => {
        await new Promise(resolve => setTimeout(resolve, 1000))
        return false // Let caller retry
      },
      maxAttempts: 3,
    }
  }

  /**
   * 处理严重错误
   */
  private async handleCriticalError(context: ErrorContext): Promise<void> {
    logger.error('Critical error detected', 'ErrorRecovery', context)

    // 保存错误报告
    await this.saveErrorReport(context)

    // 显示错误对话框
    const result = await dialog.showMessageBox({
      type: 'error',
      title: 'Critical Error',
      message: `A critical error occurred in ${context.module}`,
      detail: context.error.message,
      buttons: ['Restart', 'Quit'],
      defaultId: 0,
    })

    if (result.response === 0) {
      // Restart application
      app.relaunch()
      app.quit()
    } else {
      // Quit application
      app.quit()
    }
  }

  /**
   * 升级错误处理
   */
  private async escalateError(context: ErrorContext): Promise<void> {
    // 升级错误严重性
    const escalatedContext = {
      ...context,
      severity: 'high' as const,
    }

    // 通知用户
    await this.notifyUser(escalatedContext)

    // 如果是高严重性，考虑重启
    if (escalatedContext.severity === 'high' || escalatedContext.severity === 'critical') {
      const shouldRestart = await this.promptRestart()
      if (shouldRestart) {
        app.relaunch()
        app.quit()
      }
    }
  }

  /**
   * 通知用户
   */
  private async notifyUser(context: ErrorContext): Promise<void> {
    const windows = BrowserWindow.getAllWindows()
    if (windows.length > 0) {
      windows[0].webContents.send('error-notification', {
        title: `Error in ${context.module}`,
        message: context.error.message,
        severity: context.severity,
      })
    }
  }

  /**
   * 通知恢复成功
   */
  private notifyRecoverySuccess(context: ErrorContext): void {
    const windows = BrowserWindow.getAllWindows()
    if (windows.length > 0) {
      windows[0].webContents.send('recovery-success', {
        module: context.module,
        operation: context.operation,
      })
    }
  }

  /**
   * 提示重启
   */
  private async promptRestart(): Promise<boolean> {
    const result = await dialog.showMessageBox({
      type: 'warning',
      title: 'Restart Required',
      message: 'The application needs to restart to recover from errors.',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
    })

    return result.response === 0
  }

  /**
   * 保存错误报告
   */
  private async saveErrorReport(context: ErrorContext): Promise<void> {
    try {
      const reportDir = path.join(app.getPath('userData'), 'error-reports')

      // 确保目录存在
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true })
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `error-report-${timestamp}.json`
      const filepath = path.join(reportDir, filename)

      const report = {
        timestamp: context.timestamp,
        module: context.module,
        operation: context.operation,
        error: {
          name: context.error.name,
          message: context.error.message,
          stack: context.error.stack,
        },
        severity: context.severity,
        app: {
          version: app.getVersion(),
          platform: process.platform,
          arch: process.arch,
        },
        errorHistory: this.errorHistory.slice(-10), // Last 10 errors
      }

      fs.writeFileSync(filepath, JSON.stringify(report, null, 2))
      logger.info(`Error report saved: ${filename}`, 'ErrorRecovery')
    } catch (error) {
      logger.error('Failed to save error report', 'ErrorRecovery', error)
    }
  }

  /**
   * 设置全局错误处理器
   */
  private setupGlobalHandlers(): void {
    // 处理未捕获的异常
    process.on('uncaughtException', error => {
      this.handleError(error, {
        module: 'Global',
        operation: 'uncaughtException',
        severity: 'critical',
        recoverable: false,
      })
    })

    // 处理未处理的Promise拒绝
    process.on('unhandledRejection', (reason: any) => {
      const error = reason instanceof Error ? reason : new Error(String(reason))
      this.handleError(error, {
        module: 'Global',
        operation: 'unhandledRejection',
        severity: 'high',
        recoverable: true,
      })
    })

    // 应用错误事件
    app.on('render-process-gone', (_event, _webContents, details) => {
      this.handleError(new Error(`Render process gone: ${details.reason}`), {
        module: 'Renderer',
        operation: 'process-gone',
        severity: 'critical',
        recoverable: true,
      })
    })

    app.on('child-process-gone', (_event, details) => {
      this.handleError(new Error(`Child process gone: ${details.type}`), {
        module: 'ChildProcess',
        operation: details.type,
        severity: 'high',
        recoverable: true,
      })
    })
  }

  /**
   * 计算错误严重性
   */
  private calculateSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    if (error.message.includes('CRITICAL') || error.message.includes('FATAL')) {
      return 'critical'
    }
    if (error.message.includes('ERROR') || error.message.includes('FAIL')) {
      return 'high'
    }
    if (error.message.includes('WARN')) {
      return 'medium'
    }
    return 'low'
  }

  /**
   * 获取错误历史
   */
  getErrorHistory(): ErrorContext[] {
    return [...this.errorHistory]
  }

  /**
   * 清除错误历史
   */
  clearErrorHistory(): void {
    this.errorHistory = []
  }
}

// 导出单例
export const errorRecoveryManager = ErrorRecoveryManager.getInstance()
