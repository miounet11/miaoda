<template>
  <div class="space-y-4 mt-6">
    <div class="flex items-center space-x-3">
      <input
        type="checkbox"
        v-model="enabled"
        class="w-4 h-4 text-blue-600 focus:ring-blue-500"
      />
      <h4 class="text-md font-semibold text-gray-900 dark:text-white">Time Range Filter</h4>
    </div>
    
    <div v-if="enabled" class="grid grid-cols-2 gap-4 pl-7">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">From Date</label>
        <input
          type="date"
          v-model="from"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">To Date</label>
        <input
          type="date"
          v-model="to"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  enabled: boolean
  from: string
  to: string
}

interface Emits {
  (e: 'update:enabled', value: boolean): void
  (e: 'update:from', value: string): void
  (e: 'update:to', value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const enabled = computed({
  get: () => props.enabled,
  set: (value) => emit('update:enabled', value)
})

const from = computed({
  get: () => props.from,
  set: (value) => emit('update:from', value)
})

const to = computed({
  get: () => props.to,
  set: (value) => emit('update:to', value)
})
</script>