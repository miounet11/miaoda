<template>
  <Teleport to="body">
    <TransitionGroup name="toast" tag="div" class="toast-container">
      <div
        v-for="error in errors"
        :key="error.id"
        class="error-toast"
        :class="[`severity-${error.severity}`]"
      >
        <div class="toast-icon">
          <AlertCircle v-if="error.severity === 'error'" :size="20" />
          <AlertTriangle v-else-if="error.severity === 'warning'" :size="20" />
          <Info v-else :size="20" />
        </div>
        
        <div class="toast-content">
          <h4 class="toast-title">{{ error.title }}</h4>
          <p v-if="error.message" class="toast-message">{{ error.message }}</p>
        </div>
        
        <button
          @click="dismissError(error.id)"
          class="toast-close"
          :aria-label="`Dismiss ${error.title}`"
        >
          <X :size="16" />
        </button>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-vue-next'

export interface ErrorInfo {
  id: string
  title: string
  message?: string
  severity: 'error' | 'warning' | 'info'
  duration?: number
}

const errors = ref<ErrorInfo[]>([])
const timers = new Map<string, NodeJS.Timeout>()

const showError = (error: Omit<ErrorInfo, 'id'>) => {
  const id = Date.now().toString()
  const errorWithId = { ...error, id }
  
  errors.value.push(errorWithId)
  
  // Auto dismiss after duration (default 5 seconds)
  const duration = error.duration ?? 5000
  if (duration > 0) {
    const timer = setTimeout(() => {
      dismissError(id)
    }, duration)
    timers.set(id, timer)
  }
  
  return id
}

const dismissError = (id: string) => {
  const index = errors.value.findIndex(e => e.id === id)
  if (index > -1) {
    errors.value.splice(index, 1)
  }
  
  // Clear timer if exists
  const timer = timers.get(id)
  if (timer) {
    clearTimeout(timer)
    timers.delete(id)
  }
}

const dismissAll = () => {
  errors.value = []
  timers.forEach(timer => clearTimeout(timer))
  timers.clear()
}

// Global error handler
const handleGlobalError = (event: ErrorEvent) => {
  showError({
    title: 'Application Error',
    message: event.message,
    severity: 'error'
  })
}

// Unhandled promise rejection handler
const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  showError({
    title: 'Unhandled Error',
    message: event.reason?.message || 'An unexpected error occurred',
    severity: 'error'
  })
}

onMounted(() => {
  window.addEventListener('error', handleGlobalError)
  window.addEventListener('unhandledrejection', handleUnhandledRejection)
})

onUnmounted(() => {
  window.removeEventListener('error', handleGlobalError)
  window.removeEventListener('unhandledrejection', handleUnhandledRejection)
  dismissAll()
})

// Expose methods for external use
defineExpose({
  showError,
  dismissError,
  dismissAll
})
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  pointer-events: none;
}

.error-toast {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 320px;
  max-width: 420px;
  padding: 16px;
  margin-bottom: 12px;
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  pointer-events: auto;
}

.toast-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: var(--text);
}

.toast-message {
  font-size: 13px;
  margin: 0;
  color: var(--text-secondary);
  word-wrap: break-word;
}

.toast-close {
  flex-shrink: 0;
  padding: 4px;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.toast-close:hover {
  background: var(--muted);
  color: var(--text);
}

/* Severity styles */
.severity-error {
  border-color: var(--error);
}

.severity-error .toast-icon {
  color: var(--error);
}

.severity-warning {
  border-color: var(--warning);
}

.severity-warning .toast-icon {
  color: var(--warning);
}

.severity-info {
  border-color: var(--info);
}

.severity-info .toast-icon {
  color: var(--info);
}

/* Animations */
.toast-enter-active {
  transition: all 0.3s ease-out;
}

.toast-leave-active {
  transition: all 0.2s ease-in;
}

.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.toast-move {
  transition: transform 0.3s ease;
}

/* Theme variables */
:root {
  --background: hsl(0, 0%, 100%);
  --border: hsl(214, 32%, 91%);
  --text: hsl(222, 47%, 11%);
  --text-secondary: hsl(215, 20%, 45%);
  --muted: hsl(210, 20%, 96%);
  --error: hsl(0, 84%, 60%);
  --warning: hsl(38, 92%, 50%);
  --info: hsl(199, 89%, 48%);
}

:root[data-theme="dark"] {
  --background: hsl(222, 47%, 11%);
  --border: hsl(215, 20%, 25%);
  --text: hsl(210, 20%, 98%);
  --text-secondary: hsl(215, 20%, 65%);
  --muted: hsl(217, 33%, 17%);
}

/* Responsive */
@media (max-width: 640px) {
  .toast-container {
    top: 10px;
    right: 10px;
    left: 10px;
  }
  
  .error-toast {
    min-width: auto;
    max-width: none;
  }
}
</style>