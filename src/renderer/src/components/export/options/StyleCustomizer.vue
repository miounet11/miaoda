<template>
  <div class="space-y-4 mt-6">
    <h4 class="text-md font-semibold text-gray-900 dark:text-white">Style Customization</h4>

    <div v-if="format === 'html' || format === 'pdf'" class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >Font Family</label
          >
          <select
            v-model="customStyles.fontFamily"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option value="system">System Default</option>
            <option value="serif">Serif</option>
            <option value="sans-serif">Sans Serif</option>
            <option value="monospace">Monospace</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >Font Size</label
          >
          <select
            v-model="customStyles.fontSize"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="extra-large">Extra Large</option>
          </select>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >Color Theme</label
        >
        <div class="grid grid-cols-3 gap-3">
          <div
            v-for="theme in colorThemes"
            :key="theme.name"
            @click="customStyles.colorTheme = theme.name"
            :class="[
              'p-3 border-2 rounded-lg cursor-pointer transition-all',
              customStyles.colorTheme === theme.name
                ? 'border-blue-500'
                : 'border-gray-200 dark:border-gray-700'
            ]"
          >
            <div class="flex space-x-1 mb-2">
              <div
                v-for="color in theme.colors"
                :key="color"
                :style="{ backgroundColor: color }"
                class="w-4 h-4 rounded"
              />
            </div>
            <div class="text-sm font-medium text-gray-900 dark:text-white">{{ theme.name }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="text-xs text-gray-500 dark:text-gray-400">
      Custom styles will be applied to the exported content based on the selected format.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import type { ExportOptions } from '@renderer/src/services/export/ExportService'

interface Props {
  format: string
  options: ExportOptions
}

interface Emits {
  (e: 'update:options', value: ExportOptions): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const customStyles = reactive({
  fontFamily: 'system',
  fontSize: 'medium',
  colorTheme: 'default'
})

const colorThemes = [
  {
    name: 'Default',
    colors: ['#3b82f6', '#6366f1', '#8b5cf6']
  },
  {
    name: 'Warm',
    colors: ['#f59e0b', '#ef4444', '#ec4899']
  },
  {
    name: 'Cool',
    colors: ['#10b981', '#06b6d4', '#3b82f6']
  }
]
</script>
