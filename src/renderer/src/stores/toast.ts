import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ToastMessage {
  id: string
  type: 'info' | 'error' | 'success' | 'warning'
  text: string
  timeout?: number
  persistent?: boolean
  timestamp: Date
}

export const useToastStore = defineStore('toast', () => {
  const messages = ref<ToastMessage[]>([])

  function showToast(
    type: ToastMessage['type'],
    text: string,
    options: { timeout?: number; persistent?: boolean } = {}
  ) {
    const message: ToastMessage = {
      id: String(Date.now() + Math.random()),
      type,
      text,
      timeout: options.timeout ?? 5000,
      persistent: options.persistent ?? false,
      timestamp: new Date()
    }

    messages.value.push(message)

    // Auto-remove toast after timeout unless persistent
    if (!message.persistent && message.timeout && message.timeout > 0) {
      setTimeout(() => {
        removeToast(message.id)
      }, message.timeout)
    }

    return message.id
  }

  function showError(text: string, options?: { timeout?: number; persistent?: boolean }) {
    return showToast('error', text, options)
  }

  function showSuccess(text: string, options?: { timeout?: number; persistent?: boolean }) {
    return showToast('success', text, options)
  }

  function showInfo(text: string, options?: { timeout?: number; persistent?: boolean }) {
    return showToast('info', text, options)
  }

  function showWarning(text: string, options?: { timeout?: number; persistent?: boolean }) {
    return showToast('warning', text, options)
  }

  function removeToast(id: string) {
    const index = messages.value.findIndex(m => m.id === id)
    if (index > -1) {
      messages.value.splice(index, 1)
    }
  }

  function clearAllToasts() {
    messages.value = []
  }

  return {
    messages,
    showToast,
    showError,
    showSuccess,
    showInfo,
    showWarning,
    removeToast,
    clearAllToasts
  }
})
