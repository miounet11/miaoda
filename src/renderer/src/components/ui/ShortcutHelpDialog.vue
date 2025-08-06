<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div 
      class="w-full max-w-2xl max-h-[80vh] bg-white dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden"
      @click.stop
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
          Keyboard Shortcuts
        </h2>
        <button
          @click="close"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="overflow-y-auto max-h-[60vh]">
        <div class="p-6">
          <div v-for="group in shortcutGroups" :key="group.name" class="mb-8 last:mb-0">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {{ group.name }}
            </h3>
            <div class="space-y-3">
              <div
                v-for="shortcut in group.shortcuts"
                :key="shortcut.key"
                class="flex items-center justify-between py-2"
              >
                <span class="text-gray-700 dark:text-gray-300">
                  {{ shortcut.description }}
                </span>
                <div class="flex items-center space-x-1">
                  <span
                    v-for="(key, index) in getDisplayKeys(shortcut.key)"
                    :key="index"
                    class="inline-flex items-center px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded border shadow-sm"
                  >
                    {{ key }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Tips -->
          <div class="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 class="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
              Tips
            </h4>
            <ul class="text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <li>• Most shortcuts work globally, even when focused on other elements</li>
              <li>• Some shortcuts are context-sensitive and only work in specific areas</li>
              <li>• Press <kbd class="px-1 py-0.5 text-xs bg-blue-200 dark:bg-blue-800 rounded">Esc</kbd> to close dialogs and clear selections</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useShortcuts } from '@renderer/src/services/shortcuts/ShortcutService'

interface Props {
  isOpen: boolean
}

interface Emits {
  (e: 'close'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const shortcuts = useShortcuts()

const shortcutGroups = computed(() => shortcuts.getShortcuts())

const close = () => {
  emit('close')
}

const getDisplayKeys = (key: string): string[] => {
  return shortcuts.getDisplayKey(key).split(' + ')
}

// Close on Escape
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    close()
  }
}

// Add escape listener when open
const isOpen = computed(() => shortcuts.helpOpen.value)
</script>

<style scoped>
kbd {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
</style>