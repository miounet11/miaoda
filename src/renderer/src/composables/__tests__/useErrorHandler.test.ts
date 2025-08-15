import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useErrorHandler, setErrorToastInstance } from '../useErrorHandler'

// Mock error toast instance
const mockErrorToast = {
  showError: vi.fn(),
  show: vi.fn(),
  hide: vi.fn(),
  clear: vi.fn(),
  clearAll: vi.fn()
}

describe('useErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setErrorToastInstance(mockErrorToast)
  })

  describe('handleError', () => {
    it('handles string errors', () => {
      const { handleError } = useErrorHandler()
      
      handleError('Test error message', 'Test Context')
      
      expect(mockErrorToast.showError).toHaveBeenCalledWith({
        title: 'Test Context',
        message: 'Test error message',
        severity: 'error'
      })
    })

    it('handles Error objects', () => {
      const { handleError } = useErrorHandler()
      const error = new Error('Test error object')
      
      handleError(error, 'Test Context')
      
      expect(mockErrorToast.showError).toHaveBeenCalledWith({
        title: 'Test Context',
        message: 'Test error object',
        severity: 'error'
      })
    })

    it('handles objects with message property', () => {
      const { handleError } = useErrorHandler()
      const error = { message: 'Object error message' }
      
      handleError(error, 'Test Context')
      
      expect(mockErrorToast.showError).toHaveBeenCalledWith({
        title: 'Test Context',
        message: 'Object error message',
        severity: 'error'
      })
    })

    it('handles unknown error types', () => {
      const { handleError } = useErrorHandler()
      const error = { someProperty: 'unknown error' }
      
      handleError(error, 'Test Context')
      
      expect(mockErrorToast.showError).toHaveBeenCalledWith({
        title: 'Test Context',
        message: 'An unexpected error occurred',
        severity: 'error'
      })
    })

    it('uses default context when none provided', () => {
      const { handleError } = useErrorHandler()
      
      handleError('Test error')
      
      expect(mockErrorToast.showError).toHaveBeenCalledWith({
        title: 'Error',
        message: 'Test error',
        severity: 'error'
      })
    })

    it('handles null and undefined errors', () => {
      const { handleError } = useErrorHandler()
      
      handleError(null, 'Test Context')
      
      expect(mockErrorToast.showError).toHaveBeenCalledWith({
        title: 'Test Context',
        message: 'An unexpected error occurred',
        severity: 'error'
      })
    })

    it('logs errors to console in development', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { handleError } = useErrorHandler()
      
      handleError('Test error', 'Test Context')
      
      expect(consoleSpy).toHaveBeenCalledWith('[Test Context]', 'Test error')
      
      consoleSpy.mockRestore()
    })
  })

  describe('handleWarning', () => {
    it('shows warning toast', () => {
      const { handleWarning } = useErrorHandler()
      
      handleWarning('Test warning message', 'Test Context')
      
      expect(mockErrorToast.showError).toHaveBeenCalledWith({
        title: 'Test Context Warning',
        message: 'Test warning message',
        type: 'warning',
        timeout: 4000
      })
    })

    it('uses default context for warnings', () => {
      const { handleWarning } = useErrorHandler()
      
      handleWarning('Test warning')
      
      expect(mockErrorToast.showError).toHaveBeenCalledWith({
        title: 'Warning',
        message: 'Test warning',
        type: 'warning',
        timeout: 4000
      })
    })
  })

  describe('handleInfo', () => {
    it('shows info toast', () => {
      const { handleInfo } = useErrorHandler()
      
      handleInfo('Test info message', 'Test Context')
      
      expect(mockErrorToast.showError).toHaveBeenCalledWith({
        title: 'Test Context',
        message: 'Test info message',
        type: 'info',
        timeout: 3000
      })
    })

    it('uses default context for info', () => {
      const { handleInfo } = useErrorHandler()
      
      handleInfo('Test info')
      
      expect(mockErrorToast.showError).toHaveBeenCalledWith({
        title: 'Info',
        message: 'Test info',
        type: 'info',
        timeout: 3000
      })
    })
  })

  describe('handleSuccess', () => {
    it('shows success toast', () => {
      const { handleSuccess } = useErrorHandler()
      
      handleSuccess('Test success message', 'Test Context')
      
      expect(mockErrorToast.showError).toHaveBeenCalledWith({
        title: 'Test Context',
        message: 'Test success message',
        type: 'success',
        timeout: 3000
      })
    })

    it('uses default context for success', () => {
      const { handleSuccess } = useErrorHandler()
      
      handleSuccess('Test success')
      
      expect(mockErrorToast.showError).toHaveBeenCalledWith({
        title: 'Success',
        message: 'Test success',
        type: 'success',
        timeout: 3000
      })
    })
  })

  describe('clearErrors', () => {
    it('clears all error toasts', () => {
      const { clearErrors } = useErrorHandler()
      
      clearErrors()
      
      expect(mockErrorToast.clear).toHaveBeenCalled()
    })
  })

  describe('Toast instance management', () => {
    it('handles missing toast instance gracefully', () => {
      setErrorToastInstance(null)
      const { handleError } = useErrorHandler()
      
      // Should not throw error
      expect(() => {
        handleError('Test error', 'Test Context')
      }).not.toThrow()
    })

    it('allows setting new toast instance', () => {
      const newMockToast = {
        show: vi.fn(),
        hide: vi.fn(),
        clear: vi.fn()
      }
      
      setErrorToastInstance(newMockToast)
      const { handleError } = useErrorHandler()
      
      handleError('Test error', 'Test Context')
      
      expect(newMockToast.show).toHaveBeenCalled()
      expect(mockErrorToast.showError).not.toHaveBeenCalled()
    })
  })

  describe('Error categorization', () => {
    it('categorizes network errors', () => {
      const { handleError } = useErrorHandler()
      const networkError = new Error('Failed to fetch')
      
      handleError(networkError, 'API Call')
      
      expect(mockErrorToast.showError).toHaveBeenCalledWith({
        title: 'API Call Error',
        message: 'Network error: Failed to fetch',
        severity: 'error'
      })
    })

    it('categorizes timeout errors', () => {
      const { handleError } = useErrorHandler()
      const timeoutError = new Error('Request timeout')
      
      handleError(timeoutError, 'API Call')
      
      expect(mockErrorToast.showError).toHaveBeenCalledWith({
        title: 'API Call Error',
        message: 'Timeout error: Request timeout',
        severity: 'error'
      })
    })

    it('categorizes validation errors', () => {
      const { handleError } = useErrorHandler()
      const validationError = new Error('Invalid input provided')
      
      handleError(validationError, 'Form Validation')
      
      expect(mockErrorToast.showError).toHaveBeenCalledWith({
        title: 'Form Validation Error',
        message: 'Validation error: Invalid input provided',
        severity: 'error'
      })
    })

    it('handles HTTP error codes', () => {
      const { handleError } = useErrorHandler()
      const httpError = { 
        message: 'Not found',
        status: 404,
        statusText: 'Not Found'
      }
      
      handleError(httpError, 'API Call')
      
      expect(mockErrorToast.showError).toHaveBeenCalledWith({
        title: 'API Call Error',
        message: 'HTTP 404: Not found',
        severity: 'error'
      })
    })
  })

  describe('Error reporting', () => {
    it('reports critical errors', () => {
      const reportSpy = vi.fn()
      // Mock error reporting service
      window.errorReporter = { report: reportSpy }
      
      const { handleError } = useErrorHandler()
      const criticalError = new Error('Critical system failure')
      
      handleError(criticalError, 'System', { critical: true })
      
      expect(reportSpy).toHaveBeenCalledWith({
        error: criticalError,
        context: 'System',
        timestamp: expect.any(Date),
        userAgent: navigator.userAgent,
        url: window.location.href
      })
      
      delete window.errorReporter
    })

    it('does not report non-critical errors', () => {
      const reportSpy = vi.fn()
      window.errorReporter = { report: reportSpy }
      
      const { handleError } = useErrorHandler()
      const normalError = new Error('Normal error')
      
      handleError(normalError, 'Normal Operation')
      
      expect(reportSpy).not.toHaveBeenCalled()
      
      delete window.errorReporter
    })
  })

  describe('Rate limiting', () => {
    it('rate limits duplicate errors', () => {
      const { handleError } = useErrorHandler()
      
      // Send same error multiple times quickly
      handleError('Duplicate error', 'Test Context')
      handleError('Duplicate error', 'Test Context')
      handleError('Duplicate error', 'Test Context')
      
      // Should only show toast once due to rate limiting
      expect(mockErrorToast.showError).toHaveBeenCalledTimes(1)
    })

    it('allows different errors through rate limiting', () => {
      const { handleError } = useErrorHandler()
      
      handleError('First error', 'Test Context')
      handleError('Second error', 'Test Context')
      handleError('Third error', 'Test Context')
      
      expect(mockErrorToast.showError).toHaveBeenCalledTimes(3)
    })
  })

  describe('Error recovery suggestions', () => {
    it('provides recovery suggestions for network errors', () => {
      const { handleError } = useErrorHandler()
      const networkError = new Error('Failed to fetch')
      
      handleError(networkError, 'API Call')
      
      expect(mockErrorToast.showError).toHaveBeenCalledWith({
        title: 'API Call Error',
        message: 'Network error: Failed to fetch',
        severity: 'error',
        actions: [
          { label: 'Retry', action: expect.any(Function) },
          { label: 'Check Connection', action: expect.any(Function) }
        ]
      })
    })

    it('provides suggestions for authentication errors', () => {
      const { handleError } = useErrorHandler()
      const authError = { 
        message: 'Unauthorized',
        status: 401
      }
      
      handleError(authError, 'API Call')
      
      expect(mockErrorToast.showError).toHaveBeenCalledWith({
        title: 'API Call Error',
        message: 'HTTP 401: Unauthorized',
        severity: 'error',
        actions: [
          { label: 'Login Again', action: expect.any(Function) }
        ]
      })
    })
  })
})