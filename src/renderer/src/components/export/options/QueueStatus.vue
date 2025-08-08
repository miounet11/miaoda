<template>
  <div class="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
    <div class="flex items-center justify-between mb-3">
      <h5 class="text-sm font-medium text-gray-900 dark:text-white">Export Queue</h5>
      <button
        @click="$emit('manage-queue')"
        class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
      >
        Manage Queue
      </button>
    </div>
    
    <div class="grid grid-cols-5 gap-3 text-center">
      <div class="space-y-1">
        <div class="text-lg font-semibold text-gray-900 dark:text-white">{{ stats.total }}</div>
        <div class="text-xs text-gray-500 dark:text-gray-400">Total</div>
      </div>
      <div class="space-y-1">
        <div class="text-lg font-semibold text-yellow-600 dark:text-yellow-400">{{ stats.pending }}</div>
        <div class="text-xs text-gray-500 dark:text-gray-400">Pending</div>
      </div>
      <div class="space-y-1">
        <div class="text-lg font-semibold text-blue-600 dark:text-blue-400">{{ stats.running }}</div>
        <div class="text-xs text-gray-500 dark:text-gray-400">Running</div>
      </div>
      <div class="space-y-1">
        <div class="text-lg font-semibold text-green-600 dark:text-green-400">{{ stats.completed }}</div>
        <div class="text-xs text-gray-500 dark:text-gray-400">Done</div>
      </div>
      <div class="space-y-1">
        <div class="text-lg font-semibold text-red-600 dark:text-red-400">{{ stats.failed }}</div>
        <div class="text-xs text-gray-500 dark:text-gray-400">Failed</div>
      </div>
    </div>
    
    <div v-if="stats.running > 0 || stats.pending > 0" class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Queue processing...</span>
        <span v-if="estimatedTime > 0">ETA: {{ formatTime(estimatedTime) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { QueueStats } from '@renderer/src/services/export/ExportQueue'

interface Props {
  stats: QueueStats
}

interface Emits {
  (e: 'manage-queue'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const estimatedTime = computed(() => {
  // Simple estimation based on pending tasks
  return props.stats.pending * 30000 // 30 seconds per task
})

const formatTime = (ms: number): string => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}
</script>