import { ref, App } from 'vue'

export interface ToastOptions {
  type?: 'success' | 'error' | 'info' | 'warning'
  title?: string
  message: string
  duration?: number
  dismissible?: boolean
}

export interface Toast extends ToastOptions {
  id: string
  show: boolean
}

class ToastService {
  private toasts = ref<Toast[]>([])
  private nextId = 1

  private createToast(options: ToastOptions): Toast {
    return {
      id: `toast-${this.nextId++}`,
      show: true,
      type: 'info',
      duration: 4000,
      dismissible: true,
      ...options
    }
  }

  show(options: ToastOptions): string {
    const toast = this.createToast(options)
    this.toasts.value.push(toast)

    // Auto-remove after duration
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        this.hide(toast.id)
      }, toast.duration)
    }

    return toast.id
  }

  success(message: string, title?: string, options?: Partial<ToastOptions>): string {
    return this.show({
      type: 'success',
      title,
      message,
      ...options
    })
  }

  error(message: string, title?: string, options?: Partial<ToastOptions>): string {
    return this.show({
      type: 'error',
      title,
      message,
      duration: 6000, // Longer duration for errors
      ...options
    })
  }

  info(message: string, title?: string, options?: Partial<ToastOptions>): string {
    return this.show({
      type: 'info',
      title,
      message,
      ...options
    })
  }

  warning(message: string, title?: string, options?: Partial<ToastOptions>): string {
    return this.show({
      type: 'warning',
      title,
      message,
      ...options
    })
  }

  hide(id: string): void {
    const index = this.toasts.value.findIndex(toast => toast.id === id)
    if (index > -1) {
      this.toasts.value.splice(index, 1)
    }
  }

  hideAll(): void {
    this.toasts.value = []
  }

  getToasts() {
    return this.toasts
  }
}

// Create singleton instance
export const toastService = new ToastService()

// Vue plugin for easy access
export default {
  install(app: App) {
    app.config.globalProperties.$toast = toastService
    app.provide('toast', toastService)
  }
}

// Composable for using toast service
export function useToast() {
  return toastService
}
