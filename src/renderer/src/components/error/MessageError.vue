<template>
  <div class="message-error">
    <div class="error-content">
      <AlertTriangle :size="16" class="error-icon" />
      <span class="error-text">{{ error }}</span>
    </div>
    
    <div class="error-actions">
      <button
        v-if="showRetry"
        @click="$emit('retry')"
        class="retry-button"
        :disabled="retrying"
      >
        <RefreshCw :size="14" :class="{ 'animate-spin': retrying }" />
        {{ retrying ? 'Retrying...' : 'Retry' }}
      </button>
      
      <button
        @click="showDetails = !showDetails"
        class="details-button"
      >
        <ChevronDown :size="14" :class="{ 'rotate-180': showDetails }" />
        Details
      </button>
    </div>
    
    <Transition name="details">
      <div v-if="showDetails" class="error-details">
        <pre>{{ errorDetails }}</pre>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { AlertTriangle, RefreshCw, ChevronDown } from 'lucide-vue-next'

interface Props {
  error: string
  errorDetails?: string
  showRetry?: boolean
  retrying?: boolean
}

withDefaults(defineProps<Props>(), {
  showRetry: true,
  retrying: false
})

defineEmits<{
  retry: []
}>()

const showDetails = ref(false)
</script>

<style scoped>
.message-error {
  background: var(--error-bg);
  border: 1px solid var(--error-border);
  border-radius: 8px;
  padding: 12px;
  margin-top: 8px;
}

.error-content {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.error-icon {
  color: var(--error);
  flex-shrink: 0;
}

.error-text {
  font-size: 14px;
  color: var(--error-text);
  word-break: break-word;
}

.error-actions {
  display: flex;
  gap: 8px;
}

.retry-button,
.details-button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--background);
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-button:hover:not(:disabled),
.details-button:hover {
  background: var(--muted);
  border-color: var(--border-hover);
}

.retry-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.retry-button {
  border-color: var(--primary);
  color: var(--primary);
}

.error-details {
  margin-top: 12px;
  padding: 12px;
  background: var(--muted);
  border-radius: 6px;
  overflow-x: auto;
}

.error-details pre {
  margin: 0;
  font-size: 12px;
  font-family: 'Monaco', 'Consolas', monospace;
  color: var(--text-secondary);
  white-space: pre-wrap;
  word-break: break-word;
}

/* Animations */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.rotate-180 {
  transform: rotate(180deg);
}

.details-enter-active,
.details-leave-active {
  transition: all 0.3s ease;
}

.details-enter-from,
.details-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Theme variables */
:root {
  --error: hsl(0, 84%, 60%);
  --error-bg: hsl(0, 84%, 95%);
  --error-border: hsl(0, 84%, 85%);
  --error-text: hsl(0, 84%, 30%);
  --background: hsl(0, 0%, 100%);
  --border: hsl(214, 32%, 91%);
  --border-hover: hsl(214, 32%, 81%);
  --muted: hsl(210, 20%, 96%);
  --primary: hsl(221, 83%, 53%);
  --text: hsl(222, 47%, 11%);
  --text-secondary: hsl(215, 20%, 45%);
}

:root[data-theme="dark"] {
  --error: hsl(0, 84%, 70%);
  --error-bg: hsl(0, 84%, 15%);
  --error-border: hsl(0, 84%, 25%);
  --error-text: hsl(0, 84%, 80%);
  --background: hsl(222, 47%, 11%);
  --border: hsl(215, 20%, 25%);
  --border-hover: hsl(215, 20%, 35%);
  --muted: hsl(217, 33%, 17%);
  --primary: hsl(221, 83%, 65%);
  --text: hsl(210, 20%, 98%);
  --text-secondary: hsl(215, 20%, 65%);
}
</style>