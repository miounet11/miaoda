<template>
  <div
    v-if="open"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click="$emit('update:open', false)"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6" @click.stop>
      <div class="flex items-center space-x-3 mb-4">
        <div class="flex-shrink-0">
          <AlertTriangle class="w-8 h-8 text-red-500" />
        </div>
        <div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">Export Failed</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            An error occurred while exporting your data
          </p>
        </div>
      </div>

      <div class="mb-6">
        <div
          class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
        >
          <h4 class="text-sm font-medium text-red-800 dark:text-red-200 mb-2">Error Details:</h4>
          <p class="text-sm text-red-700 dark:text-red-300 font-mono break-words">
            {{ error?.message || 'Unknown error occurred' }}
          </p>

          <div v-if="error?.details" class="mt-3 pt-3 border-t border-red-200 dark:border-red-700">
            <h5 class="text-xs font-medium text-red-800 dark:text-red-200 mb-1">
              Additional Information:
            </h5>
            <pre class="text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap">{{
              error.details
            }}</pre>
          </div>
        </div>

        <!-- Troubleshooting Tips -->
        <div
          class="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
        >
          <h4 class="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            Troubleshooting Tips:
          </h4>
          <ul class="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li v-if="isMemoryError">• Try reducing the number of conversations to export</li>
            <li v-if="isNetworkError">• Check your network connection and try again</li>
            <li v-if="isPermissionError">
              • Ensure you have write permissions to the download folder
            </li>
            <li v-if="isFormatError">• Try using a different export format</li>
            <li>• Try closing other applications to free up memory</li>
            <li>• Restart the application and try again</li>
            <li>• Contact support if the problem persists</li>
          </ul>
        </div>
      </div>

      <div class="flex justify-end space-x-3">
        <button
          @click="copyErrorToClipboard"
          class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          Copy Error
        </button>
        <button
          @click="$emit('retry')"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          Try Again
        </button>
        <button
          @click="$emit('update:open', false)"
          class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle } from 'lucide-vue-next'

interface Props {
  open: boolean
  error?: {
    message: string
    details?: string
    code?: string
    type?: string
  } | null
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'retry'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Error type detection based on error message
const isMemoryError = computed(
  () =>
    props.error?.message?.toLowerCase().includes('memory') ||
    props.error?.message?.toLowerCase().includes('size') ||
    props.error?.message?.toLowerCase().includes('limit')
)

const isNetworkError = computed(
  () =>
    props.error?.message?.toLowerCase().includes('network') ||
    props.error?.message?.toLowerCase().includes('connection') ||
    props.error?.message?.toLowerCase().includes('timeout')
)

const isPermissionError = computed(
  () =>
    props.error?.message?.toLowerCase().includes('permission') ||
    props.error?.message?.toLowerCase().includes('access') ||
    props.error?.message?.toLowerCase().includes('denied')
)

const isFormatError = computed(
  () =>
    props.error?.message?.toLowerCase().includes('format') ||
    props.error?.message?.toLowerCase().includes('invalid') ||
    props.error?.message?.toLowerCase().includes('unsupported')
)

const copyErrorToClipboard = async () => {
  if (!props.error) return

  const errorInfo = `
Export Error Report
==================
Message: ${props.error.message}
Code: ${props.error.code || 'N/A'}
Type: ${props.error.type || 'N/A'}
Time: ${new Date().toISOString()}
Details: ${props.error.details || 'N/A'}
User Agent: ${navigator.userAgent}
==================
  `.trim()

  try {
    await navigator.clipboard.writeText(errorInfo)
    // Could show a toast notification here
    console.log('Error info copied to clipboard')
  } catch (err) {
    console.error('Failed to copy error info:', err)
  }
}
</script>
