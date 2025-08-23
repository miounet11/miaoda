<template>
  <div class="export-preview">
    <!-- Preview Header -->
    <div class="preview-header border-b dark:border-gray-700 p-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Export Preview</h3>
        <div class="flex items-center space-x-3">
          <!-- Format Selector -->
          <select
            v-model="selectedFormat"
            @change="updatePreview"
            class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="markdown">Markdown</option>
            <option value="html">HTML</option>
            <option value="txt">Plain Text</option>
            <option value="json">JSON</option>
          </select>

          <!-- Refresh Button -->
          <button
            @click="updatePreview"
            :disabled="isLoading"
            class="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw :class="{ 'animate-spin': isLoading }" class="w-4 h-4" />
          </button>

          <!-- Close Button -->
          <button
            @click="$emit('close')"
            class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Preview Stats -->
      <div class="flex items-center space-x-6 mt-3 text-sm text-gray-500 dark:text-gray-400">
        <span>{{ previewData?.chatCount || 0 }} conversation(s)</span>
        <span>{{ previewData?.messageCount || 0 }} message(s)</span>
        <span v-if="previewData?.size">{{ formatFileSize(previewData.size) }}</span>
        <span v-if="isLoading" class="text-blue-600">Generating preview...</span>
      </div>
    </div>

    <!-- Preview Content -->
    <div class="preview-content flex-1 overflow-hidden">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center h-64">
        <div class="flex items-center space-x-3 text-gray-500 dark:text-gray-400">
          <div
            class="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"
          />
          <span>Generating preview...</span>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="p-6">
        <div
          class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
        >
          <div class="flex items-center space-x-2">
            <AlertCircle class="w-5 h-5 text-red-500" />
            <h4 class="text-sm font-medium text-red-800 dark:text-red-200">Preview Error</h4>
          </div>
          <p class="mt-2 text-sm text-red-700 dark:text-red-300">{{ error }}</p>
          <button
            @click="updatePreview"
            class="mt-3 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>

      <!-- Preview Content -->
      <div v-else-if="previewContent" class="h-full overflow-auto">
        <!-- Markdown Preview -->
        <div v-if="selectedFormat === 'markdown'" class="p-6">
          <div class="prose dark:prose-invert max-w-none" v-html="renderedMarkdown" />
        </div>

        <!-- HTML Preview -->
        <div v-else-if="selectedFormat === 'html'" class="h-full">
          <iframe
            ref="htmlPreviewFrame"
            :srcdoc="previewContent"
            class="w-full h-full border-0"
            sandbox="allow-same-origin"
          />
        </div>

        <!-- JSON Preview -->
        <div v-else-if="selectedFormat === 'json'" class="p-6">
          <pre class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 overflow-auto text-sm font-mono">
            <code class="language-json" v-html="highlightedJson" />
          </pre>
        </div>

        <!-- Plain Text Preview -->
        <div v-else-if="selectedFormat === 'txt'" class="p-6">
          <pre
            class="whitespace-pre-wrap font-mono text-sm bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
            >{{ previewContent }}</pre
          >
        </div>

        <!-- Binary Format Info -->
        <div v-else class="p-6">
          <div class="text-center text-gray-500 dark:text-gray-400">
            <FileText class="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h4 class="text-lg font-medium mb-2">Binary Format Preview</h4>
            <p class="text-sm mb-4">
              Preview is not available for {{ selectedFormat.toUpperCase() }} format. The file will
              be generated during export.
            </p>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-left max-w-md mx-auto">
              <h5 class="font-medium mb-2">Export Details:</h5>
              <div class="space-y-1 text-sm">
                <div>Format: {{ selectedFormat.toUpperCase() }}</div>
                <div v-if="previewData?.size">
                  Estimated Size: {{ formatFileSize(previewData.size) }}
                </div>
                <div>Conversations: {{ previewData?.chatCount || 0 }}</div>
                <div>Messages: {{ previewData?.messageCount || 0 }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div class="text-center">
          <Eye class="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h4 class="text-lg font-medium mb-2">No Preview Available</h4>
          <p class="text-sm">Select export options to generate preview</p>
        </div>
      </div>
    </div>

    <!-- Preview Footer -->
    <div class="preview-footer border-t dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
      <div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <div class="flex items-center space-x-4">
          <span v-if="lastUpdated">Updated: {{ formatTime(lastUpdated) }}</span>
          <span v-if="previewData?.processingTime">
            Generated in {{ Math.round(previewData.processingTime) }}ms
          </span>
        </div>
        <div class="text-xs opacity-75">
          Preview shows first {{ maxPreviewMessages }} messages per conversation
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { RefreshCw, X, AlertCircle, FileText, Eye } from 'lucide-vue-next'
import { marked } from 'marked'
import hljs from 'highlight.js/lib/core'
import json from 'highlight.js/lib/languages/json'
import {
  exportService,
  type ExportOptions,
  type ExportResult
} from '@renderer/src/services/export/ExportService'
import { renderMarkdownSafely } from '@renderer/src/utils/SafeMarkdownParser'
import type { ExportChatData } from '@renderer/src/services/export/ExportService'

// Register highlight.js language
hljs.registerLanguage('json', json)

interface Props {
  chats: ExportChatData[]
  options: ExportOptions
}

interface Emits {
  (e: 'close'): void
  (e: 'error', error: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const selectedFormat = ref<'markdown' | 'html' | 'txt' | 'json'>('markdown')
const previewContent = ref<string>('')
const previewData = ref<ExportResult | null>(null)
const isLoading = ref(false)
const error = ref<string>('')
const lastUpdated = ref<Date | null>(null)
const htmlPreviewFrame = ref<HTMLIFrameElement>()

// Constants
const maxPreviewMessages = 10 // Limit preview to avoid performance issues

// Computed
const renderedMarkdown = computed(() => {
  if (selectedFormat.value !== 'markdown' || !previewContent.value) {
    return ''
  }

  try {
    return renderMarkdownSafely(previewContent.value)
  } catch (err) {
    console.error('Markdown parsing error:', err)
    return `<pre>${previewContent.value}</pre>`
  }
})

const highlightedJson = computed(() => {
  if (selectedFormat.value !== 'json' || !previewContent.value) {
    return ''
  }

  try {
    const formatted = JSON.stringify(JSON.parse(previewContent.value), null, 2)
    return hljs.highlight(formatted, { language: 'json' }).value
  } catch (err) {
    return previewContent.value
  }
})

// Methods
const updatePreview = async (): Promise<void> => {
  if (!props.chats || props.chats.length === 0) {
    previewContent.value = ''
    previewData.value = null
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    // Limit preview data to avoid performance issues
    const limitedChats = props.chats.map(chat => ({
      ...chat,
      messages: chat.messages.slice(0, maxPreviewMessages)
    }))

    // Create preview options
    const previewOptions: ExportOptions = {
      ...props.options,
      format: selectedFormat.value as any,
      preview: true
    }

    // Generate preview
    const result = await exportService.exportChats(previewOptions)

    previewContent.value = result.content
    previewData.value = result
    lastUpdated.value = new Date()

    // For HTML preview, wait for iframe to load
    if (selectedFormat.value === 'html') {
      await nextTick()
      if (htmlPreviewFrame.value) {
        htmlPreviewFrame.value.onload = () => {
          // Optional: Add any post-load styling or interactions
        }
      }
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to generate preview'
    emit('error', error.value)
    console.error('Preview generation failed:', err)
  } finally {
    isLoading.value = false
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// Watchers
watch(
  [() => props.chats, () => props.options],
  () => {
    updatePreview()
  },
  { deep: true }
)

watch(selectedFormat, () => {
  updatePreview()
})

// Lifecycle
onMounted(() => {
  // Set initial format based on export options
  if (['markdown', 'html', 'txt', 'json'].includes(props.options.format)) {
    selectedFormat.value = props.options.format as any
  }

  updatePreview()
})
</script>

<style scoped>
.export-preview {
  @apply flex flex-col h-full bg-white dark:bg-gray-900;
}

.preview-header {
  @apply flex-shrink-0;
}

.preview-content {
  @apply flex-1 overflow-hidden;
}

.preview-footer {
  @apply flex-shrink-0;
}

/* Iframe styling for better preview */
iframe {
  background: white;
  border-radius: 0.375rem;
}

/* Code highlighting styles */
.language-json {
  @apply text-sm;
}

/* Prose styling for markdown preview */
.prose {
  @apply text-gray-900;
}

.dark .prose {
  @apply text-gray-100;
}

.prose pre {
  @apply bg-gray-100 dark:bg-gray-800;
}

.prose code {
  @apply bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100;
}

.prose blockquote {
  @apply border-l-gray-300 dark:border-l-gray-600;
}
</style>
