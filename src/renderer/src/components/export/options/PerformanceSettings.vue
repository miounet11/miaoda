<template>
  <div class="space-y-4 mt-6">
    <h4 class="text-md font-semibold text-gray-900 dark:text-white">Performance Settings</h4>

    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Queue Concurrency
          <span class="text-xs text-gray-500">(simultaneous exports)</span>
        </label>
        <div class="flex items-center space-x-4">
          <input
            type="range"
            v-model.number="concurrency"
            min="1"
            max="5"
            step="1"
            class="flex-1"
          />
          <span class="text-sm font-medium text-gray-900 dark:text-white w-8">{{
            concurrency
          }}</span>
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Higher values process exports faster but use more system resources
        </div>
      </div>

      <div
        class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4"
      >
        <div class="flex items-start space-x-3">
          <div class="text-amber-600 dark:text-amber-400">⚠️</div>
          <div>
            <h5 class="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
              Performance Note
            </h5>
            <p class="text-sm text-amber-700 dark:text-amber-300">
              Processing multiple large exports simultaneously may slow down your system. Consider
              lowering concurrency for very large datasets.
            </p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4 text-center">
        <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ estimatedSpeed }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">Est. Speed</div>
        </div>
        <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div class="text-lg font-semibold text-gray-900 dark:text-white">{{ memoryUsage }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">Memory Usage</div>
        </div>
        <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div class="text-lg font-semibold text-gray-900 dark:text-white">{{ cpuUsage }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">CPU Usage</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  concurrency: number
}

interface Emits {
  (e: 'update:concurrency', value: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const concurrency = computed({
  get: () => props.concurrency,
  set: value => emit('update:concurrency', value)
})

const estimatedSpeed = computed(() => {
  const speeds = ['Slow', 'Normal', 'Fast', 'Very Fast', 'Maximum']
  return speeds[props.concurrency - 1] || 'Normal'
})

const memoryUsage = computed(() => {
  const usage = ['Low', 'Low', 'Medium', 'High', 'Very High']
  return usage[props.concurrency - 1] || 'Low'
})

const cpuUsage = computed(() => {
  const usage = ['Light', 'Light', 'Moderate', 'Heavy', 'Intensive']
  return usage[props.concurrency - 1] || 'Light'
})
</script>
