<template>
  <div
    v-if="showShortcutsHelp"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
    @click.self="closeShortcutsHelp"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700"
      >
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Keyboard Shortcuts</h2>
        <button
          @click="closeShortcutsHelp"
          class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6">
        <div class="space-y-6">
          <!-- General -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">General</h3>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-gray-700 dark:text-gray-300">New Chat</span>
                <kbd class="shortcut-key">{{ cmdKey }} + N</kbd>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-700 dark:text-gray-300">Quick Search</span>
                <kbd class="shortcut-key">{{ cmdKey }} + K</kbd>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-700 dark:text-gray-300">Show Shortcuts</span>
                <kbd class="shortcut-key">{{ cmdKey }} + /</kbd>
              </div>
            </div>
          </div>

          <!-- Chat -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">Chat</h3>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-gray-700 dark:text-gray-300">Send Message</span>
                <kbd class="shortcut-key">{{ cmdKey }} + Enter</kbd>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-700 dark:text-gray-300">Switch to Chat 1-9</span>
                <kbd class="shortcut-key">{{ cmdKey }} + 1-9</kbd>
              </div>
            </div>
          </div>

          <!-- Navigation -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">Navigation</h3>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-gray-700 dark:text-gray-300">Close Modal/Cancel</span>
                <kbd class="shortcut-key">Escape</kbd>
              </div>
            </div>
          </div>

          <!-- Legacy Shortcuts -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">Additional</h3>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-gray-700 dark:text-gray-300">Toggle Sidebar</span>
                <kbd class="shortcut-key">{{ cmdKey }} + B</kbd>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-700 dark:text-gray-300">Settings</span>
                <kbd class="shortcut-key">{{ cmdKey }} + ,</kbd>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-700 dark:text-gray-300">Toggle Theme</span>
                <kbd class="shortcut-key">{{ cmdKey }} + Shift + T</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div
        class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-b-lg"
      >
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Press <kbd class="shortcut-key">Escape</kbd> or click outside to close this dialog.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUIStore } from '@renderer/src/stores/ui'

const uiStore = useUIStore()

const showShortcutsHelp = computed(() => uiStore.showShortcutHelp)

const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
const cmdKey = computed(() => (isMac ? '⌘' : 'Ctrl'))

const closeShortcutsHelp = () => {
  uiStore.closeShortcutHelp()
}
</script>

<style scoped>
.shortcut-key {
  @apply px-2 py-1 text-xs font-mono font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
</style>
