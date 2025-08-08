import { ref } from 'vue'
import type { ErrorInfo } from '@renderer/src/components/error/ErrorToast.vue'

// Global error toast instance ref
let errorToastInstance: any = null

export function setErrorToastInstance(instance: any) {
  errorToastInstance = instance
}

export function useErrorHandler() {
  const isRetrying = ref(false)

  const showError = (error: Omit<ErrorInfo, 'id'>) => {
    if (errorToastInstance) {
      return errorToastInstance.showError(error)
    }
    console.error('Error toast not initialized:', error)
  }

  const showSuccess = (message: string, duration = 3000) => {
    showError({
      title: 'Success',
      message,
      severity: 'info',
      duration
    })
  }

  const handleWarning = (message: string, context = 'Warning') => {
    showError({
      title: context,
      message,
      severity: 'warning'
    })
  }

  const handleInfo = (message: string, context = 'Info') => {
    showError({
      title: context,
      message,
      severity: 'info'
    })
  }

  const handleSuccess = (message: string, context = 'Success') => {
    showError({
      title: context,
      message,
      severity: 'info'
    })
  }

  const clearErrors = () => {
    if (errorToastInstance && typeof errorToastInstance.clearAll === 'function') {
      errorToastInstance.clearAll()
    }
  }

  const handleError = (error: unknown, context?: string) => {
    console.error(context ? `Error in ${context}:` : 'Error:', error)
    
    let message = 'An unexpected error occurred'
    let details = ''
    
    if (error instanceof Error) {
      message = error.message
      details = error.stack || ''
    } else if (typeof error === 'string') {
      message = error
    } else if (error && typeof error === 'object' && 'message' in error) {
      message = String(error.message)
    }
    
    showError({
      title: context || 'Error',
      message,
      severity: 'error'
    })
    
    return { message, details }
  }

  const withErrorHandler = async <T>(
    fn: () => Promise<T>,
    context?: string
  ): Promise<T | null> => {
    try {
      return await fn()
    } catch (error) {
      handleError(error, context)
      return null
    }
  }

  const withRetry = async <T>(
    fn: () => Promise<T>,
    options: {
      maxAttempts?: number
      delay?: number
      onRetry?: (attempt: number) => void
      context?: string
    } = {}
  ): Promise<T | null> => {
    const { maxAttempts = 3, delay = 1000, onRetry, context } = options
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        isRetrying.value = attempt > 1
        const result = await fn()
        isRetrying.value = false
        return result
      } catch (error) {
        isRetrying.value = false
        
        if (attempt === maxAttempts) {
          handleError(error, context)
          return null
        }
        
        if (onRetry) {
          onRetry(attempt)
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
      }
    }
    
    return null
  }

  return {
    showError,
    showSuccess,
    handleError,
    handleWarning,
    handleInfo,
    handleSuccess,
    clearErrors,
    withErrorHandler,
    withRetry,
    isRetrying
  }
}