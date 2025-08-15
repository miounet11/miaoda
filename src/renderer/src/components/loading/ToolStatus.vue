<template>
  <Transition name="tool-status">
    <div v-if="visible" class="tool-status">
      <div class="tool-header">
        <div class="flex items-center gap-2">
          <Loader2 :size="14" class="animate-spin text-primary" />
          <span class="text-sm font-medium">{{ status.tool }}</span>
        </div>
        <span class="text-xs text-muted-foreground">{{ status.action }}</span>
      </div>
      
      <div v-if="status.progress !== undefined" class="tool-progress">
        <div class="progress-track">
          <div 
            class="progress-fill" 
            :style="{ width: `${status.progress}%` }"
          />
        </div>
        <span class="progress-text">{{ status.progress }}%</span>
      </div>
      
      <div v-if="status.details" class="tool-details">
        <pre class="text-xs">{{ status.details }}</pre>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'

interface ToolStatus {
  tool: string
  action: string
  progress?: number
  details?: string
}

interface Props {
  status: ToolStatus
  visible: boolean
}

defineProps<Props>()
</script>

<style scoped>
.tool-status {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  margin: 8px 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.tool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.tool-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.progress-track {
  flex: 1;
  height: 4px;
  background: var(--muted);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 11px;
  color: var(--text-secondary);
  min-width: 35px;
  text-align: right;
}

.tool-details {
  margin-top: 8px;
  padding: 8px;
  background: var(--muted);
  border-radius: 4px;
  max-height: 100px;
  overflow-y: auto;
}

.tool-details pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--text-secondary);
}

/* Transitions */
.tool-status-enter-active,
.tool-status-leave-active {
  transition: all 0.3s ease;
}

.tool-status-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.tool-status-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Animate spin utility */
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

/* Theme variables */
:root {
  --surface: hsl(0, 0%, 98%);
  --border: hsl(214, 32%, 91%);
  --muted: hsl(210, 20%, 96%);
  --primary: hsl(221, 83%, 53%);
  --text-secondary: hsl(215, 20%, 45%);
}

:root[data-theme="dark"] {
  --surface: hsl(222, 47%, 15%);
  --border: hsl(215, 20%, 25%);
  --muted: hsl(217, 33%, 17%);
  --primary: hsl(221, 83%, 65%);
  --text-secondary: hsl(215, 20%, 65%);
}
</style>