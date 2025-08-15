<template>
  <div class="space-y-4">
    <h4 class="text-md font-semibold text-gray-900 dark:text-white">Batch Processing Settings</h4>
    
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Chunk Size
          <span class="text-xs text-gray-500">(messages per batch)</span>
        </label>
        <input
          type="number"
          v-model.number="batchOptions.chunkSize"
          min="10"
          max="1000"
          step="10"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
        >
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Pause Between Chunks
          <span class="text-xs text-gray-500">(milliseconds)</span>
        </label>
        <input
          type="number"
          v-model.number="batchOptions.pauseBetweenChunks"
          min="0"
          max="5000"
          step="100"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
        >
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Max Concurrency
          <span class="text-xs text-gray-500">(parallel tasks)</span>
        </label>
        <select
          v-model.number="batchOptions.maxConcurrency"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
        >
          <option :value="1">1 (Sequential)</option>
          <option :value="2">2 (Default)</option>
          <option :value="3">3</option>
          <option :value="4">4</option>
          <option :value="5">5 (Max)</option>
        </select>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Retry Attempts
          <span class="text-xs text-gray-500">(on failure)</span>
        </label>
        <select
          v-model.number="batchOptions.retryAttempts"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
        >
          <option :value="0">No Retry</option>
          <option :value="1">1 Attempt</option>
          <option :value="2">2 Attempts</option>
          <option :value="3">3 Attempts (Default)</option>
          <option :value="5">5 Attempts</option>
        </select>
      </div>
    </div>
    
    <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
      <h5 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Performance Tips</h5>
      <ul class="text-xs text-gray-600 dark:text-gray-400 space-y-1">
        <li>• Larger chunk sizes are faster but use more memory</li>
        <li>• Higher concurrency speeds up processing but may impact system performance</li>
        <li>• Add pauses between chunks to prevent overwhelming the system</li>
        <li>• Retry attempts help handle temporary failures</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BatchExportOptions } from '@renderer/src/services/export/ExportService'

interface Props {
  options?: BatchExportOptions
}

interface Emits {
  (e: 'update:options', value: BatchExportOptions): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const batchOptions = computed({
  get: () => props.options || {
    maxConcurrency: 2,
    chunkSize: 100,
    pauseBetweenChunks: 100,
    retryAttempts: 3
  },
  set: (value) => emit('update:options', value)
})
</script>