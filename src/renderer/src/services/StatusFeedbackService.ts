/**
 * 智能状态反馈服务
 * 统一管理应用中的状态提示和用户反馈
 */

import { reactive } from 'vue'

export interface StatusMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info' | 'loading'
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    handler: () => void
  }
  timestamp: number
}

export interface ProgressIndicator {
  id: string
  title: string
  message?: string
  progress?: number // 0-100
  indeterminate?: boolean
  cancellable?: boolean
  timestamp: number
}

class StatusFeedbackService {
  private static instance: StatusFeedbackService

  // 响应式状态
  public state = reactive({
    messages: [] as StatusMessage[],
    progressIndicators: [] as ProgressIndicator[],
    isLoading: false,
    globalMessage: null as StatusMessage | null,
  })

  private messageTimeouts = new Map<string, NodeJS.Timeout>()

  static getInstance(): StatusFeedbackService {
    if (!StatusFeedbackService.instance) {
      StatusFeedbackService.instance = new StatusFeedbackService()
    }
    return StatusFeedbackService.instance
  }

  // 消息管理
  success(title: string, message?: string, duration = 3000, action?: StatusMessage['action']) {
    return this.showMessage('success', title, message, duration, action)
  }

  error(title: string, message?: string, duration = 5000, action?: StatusMessage['action']) {
    return this.showMessage('error', title, message, duration, action)
  }

  warning(title: string, message?: string, duration = 4000, action?: StatusMessage['action']) {
    return this.showMessage('warning', title, message, duration, action)
  }

  info(title: string, message?: string, duration = 3000, action?: StatusMessage['action']) {
    return this.showMessage('info', title, message, duration, action)
  }

  loading(title: string, message?: string) {
    return this.showMessage('loading', title, message, 0)
  }

  private showMessage(
    type: StatusMessage['type'],
    title: string,
    message?: string,
    duration = 3000,
    action?: StatusMessage['action'],
  ): string {
    const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const statusMessage: StatusMessage = {
      id,
      type,
      title,
      message,
      duration,
      action,
      timestamp: Date.now(),
    }

    this.state.messages.push(statusMessage)

    // 限制消息数量
    if (this.state.messages.length > 5) {
      this.state.messages.shift()
    }

    // 设置自动消失
    if (duration > 0) {
      const timeout = setTimeout(() => {
        this.removeMessage(id)
      }, duration)

      this.messageTimeouts.set(id, timeout)
    }

    // 更新全局加载状态
    if (type === 'loading') {
      this.state.isLoading = true
    }

    return id
  }

  removeMessage(id: string) {
    const index = this.state.messages.findIndex(msg => msg.id === id)
    if (index > -1) {
      const message = this.state.messages[index]

      // 清理定时器
      const timeout = this.messageTimeouts.get(id)
      if (timeout) {
        clearTimeout(timeout)
        this.messageTimeouts.delete(id)
      }

      this.state.messages.splice(index, 1)

      // 更新全局加载状态
      if (message.type === 'loading') {
        this.state.isLoading = this.state.messages.some(msg => msg.type === 'loading')
      }
    }
  }

  clearAllMessages() {
    this.state.messages.forEach(msg => {
      const timeout = this.messageTimeouts.get(msg.id)
      if (timeout) {
        clearTimeout(timeout)
      }
    })

    this.messageTimeouts.clear()
    this.state.messages = []
    this.state.isLoading = false
  }

  // 进度指示器管理
  startProgress(
    title: string,
    message?: string,
    indeterminate = false,
    cancellable = false,
  ): string {
    const id = `progress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const progress: ProgressIndicator = {
      id,
      title,
      message,
      progress: indeterminate ? undefined : 0,
      indeterminate,
      cancellable,
      timestamp: Date.now(),
    }

    this.state.progressIndicators.push(progress)
    return id
  }

  updateProgress(id: string, progress: number, message?: string) {
    const indicator = this.state.progressIndicators.find(p => p.id === id)
    if (indicator && !indicator.indeterminate) {
      indicator.progress = Math.min(100, Math.max(0, progress))
      if (message) {
        indicator.message = message
      }
    }
  }

  completeProgress(id: string, successMessage?: string) {
    const indicator = this.state.progressIndicators.find(p => p.id === id)
    if (indicator) {
      if (successMessage) {
        this.success(indicator.title, successMessage)
      }
      this.removeProgress(id)
    }
  }

  failProgress(id: string, errorMessage?: string) {
    const indicator = this.state.progressIndicators.find(p => p.id === id)
    if (indicator) {
      if (errorMessage) {
        this.error(indicator.title, errorMessage)
      }
      this.removeProgress(id)
    }
  }

  removeProgress(id: string) {
    const index = this.state.progressIndicators.findIndex(p => p.id === id)
    if (index > -1) {
      this.state.progressIndicators.splice(index, 1)
    }
  }

  // 智能反馈方法
  async withFeedback<T>(
    operation: () => Promise<T>,
    options: {
      loadingTitle: string
      loadingMessage?: string
      successTitle: string
      successMessage?: string
      errorTitle?: string
      errorMessage?: string
    },
  ): Promise<T> {
    const loadingId = this.loading(options.loadingTitle, options.loadingMessage)

    try {
      const result = await operation()
      this.removeMessage(loadingId)
      this.success(options.successTitle, options.successMessage)
      return result
    } catch (error) {
      this.removeMessage(loadingId)
      const errorMsg = error instanceof Error ? error.message : String(error)
      this.error(
        options.errorTitle || '操作失败',
        options.errorMessage || errorMsg,
      )
      throw error
    }
  }

  // 批量操作反馈
  async batchOperation<T>(
    operations: Array<{
      operation: () => Promise<T>
      title: string
      successMessage?: string
    }>,
    options: {
      overallTitle: string
      successTitle: string
      errorTitle?: string
    },
  ): Promise<T[]> {
    const progressId = this.startProgress(options.overallTitle, '', false, false)
    const results: T[] = []
    let completed = 0
    const total = operations.length

    try {
      for (const { operation, title, successMessage } of operations) {
        const result = await this.withFeedback(
          operation,
          {
            loadingTitle: title,
            successTitle: title,
            successMessage,
          },
        )

        results.push(result)
        completed++

        const progress = (completed / total) * 100
        this.updateProgress(progressId, progress, `${completed}/${total} 已完成`)
      }

      this.completeProgress(progressId, options.successTitle)
      return results
    } catch (error) {
      this.failProgress(progressId, options.errorTitle)
      throw error
    }
  }

  // 网络状态反馈
  handleNetworkError(operation: string) {
    this.error(
      '网络连接失败',
      `执行"${operation}"时出现网络问题，请检查网络连接后重试`,
      5000,
      {
        label: '重试',
        handler: () => {
          // 这里可以触发重试逻辑
          console.log('Retry operation:', operation)
        },
      },
    )
  }

  // API 错误反馈
  handleApiError(operation: string, statusCode?: number) {
    let message = `执行"${operation}"时出现API错误`

    if (statusCode) {
      switch (statusCode) {
        case 401:
          message = '认证失败，请重新登录'
          break
        case 403:
          message = '权限不足，无法执行此操作'
          break
        case 404:
          message = '请求的资源不存在'
          break
        case 429:
          message = '请求过于频繁，请稍后再试'
          break
        case 500:
          message = '服务器内部错误，请稍后重试'
          break
        default:
          message += ` (状态码: ${statusCode})`
      }
    }

    this.error('API错误', message, 5000)
  }

  // 成功操作反馈
  handleSuccess(operation: string, details?: string) {
    this.success(
      `${operation}成功`,
      details || `已成功完成"${operation}"操作`,
    )
  }

  // 文件操作反馈
  handleFileOperation(operation: string, fileName: string, success = true) {
    if (success) {
      this.success(
        `${operation}成功`,
        `文件"${fileName}"${operation}成功`,
      )
    } else {
      this.error(
        `${operation}失败`,
        `文件"${fileName}"${operation}失败，请检查文件格式和权限`,
      )
    }
  }
}

// 导出单例实例
export const statusFeedback = StatusFeedbackService.getInstance()

// 类型已在上面定义并导出，无需重复导出
