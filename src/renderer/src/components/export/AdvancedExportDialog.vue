<template>
  <div
    v-if="open"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click="handleBackdropClick"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex"
      @click.stop
    >
      <!-- Sidebar -->
      <div class="w-64 bg-gray-50 dark:bg-gray-900 border-r dark:border-gray-700 flex flex-col">
        <!-- Header -->
        <div class="p-4 border-b dark:border-gray-700">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">Advanced Export</h2>
          <p class="text-sm text-gray-600 dark:text-gray-300">Configure your export settings</p>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 p-4 space-y-2">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors',
              activeTab === tab.id
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            ]"
          >
            <component :is="tab.icon" class="w-5 h-5" />
            <span class="text-sm font-medium">{{ tab.label }}</span>
          </button>
        </nav>

        <!-- Quick Actions -->
        <div class="p-4 border-t dark:border-gray-700 space-y-2">
          <button
            @click="showPreview = !showPreview"
            :class="[
              'w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
              showPreview
                ? 'bg-green-100 dark:bg-green-900/50 text-green-900 dark:text-green-100'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            ]"
          >
            <Eye class="w-4 h-4" />
            <span>{{ showPreview ? 'Hide Preview' : 'Show Preview' }}</span>
          </button>
          <button
            @click="resetToDefaults"
            class="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <RotateCcw class="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex-1 flex">
        <!-- Settings Panel -->
        <div :class="['flex-1 flex flex-col', showPreview ? 'max-w-md' : '']">
          <!-- Tab Content -->
          <div class="flex-1 overflow-y-auto p-6">
            <!-- Format & Basic Settings -->
            <div v-if="activeTab === 'format'" class="space-y-6">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Export Format
                </h3>
                <div class="grid grid-cols-2 gap-3">
                  <div
                    v-for="format in formats"
                    :key="format.value"
                    @click="options.format = format.value"
                    :class="[
                      'p-4 border-2 rounded-lg cursor-pointer transition-all',
                      options.format === format.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    ]"
                  >
                    <div class="flex items-center space-x-3">
                      <component
                        :is="format.icon"
                        class="w-6 h-6 text-gray-600 dark:text-gray-400"
                      />
                      <div>
                        <div class="font-medium text-gray-900 dark:text-white">
                          {{ format.label }}
                        </div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                          {{ format.description }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Format-specific options -->
              <FormatOptions :format="options.format" v-model:options="options" />

              <!-- Basic Options -->
              <div>
                <h4 class="text-md font-semibold text-gray-900 dark:text-white mb-3">
                  Basic Options
                </h4>
                <div class="space-y-3">
                  <label class="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      v-model="options.includeTimestamps"
                      class="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span class="text-sm text-gray-700 dark:text-gray-300">Include timestamps</span>
                  </label>
                  <label class="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      v-model="options.includeSystemMessages"
                      class="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span class="text-sm text-gray-700 dark:text-gray-300"
                      >Include system messages</span
                    >
                  </label>
                  <label class="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      v-model="options.includeMetadata"
                      class="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span class="text-sm text-gray-700 dark:text-gray-300">Include metadata</span>
                  </label>
                  <label class="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      v-model="options.includeAttachments"
                      class="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span class="text-sm text-gray-700 dark:text-gray-300"
                      >Include attachments</span
                    >
                  </label>
                </div>
              </div>
            </div>

            <!-- Selection & Filtering -->
            <div v-else-if="activeTab === 'selection'">
              <ChatSelection
                v-model:scope="exportScope"
                v-model:selected="selectedChatIds"
                v-model:available="availableChats"
              />
              <TimeFilter
                v-model:enabled="useTimeFilter"
                v-model:from="dateFrom"
                v-model:to="dateTo"
              />
              <TagFilter v-model:tags="options.tags" />
            </div>

            <!-- Templates & Styling -->
            <div v-else-if="activeTab === 'style'">
              <TemplateSelector v-model:template="options.template" />
              <StyleCustomizer :format="options.format" v-model:options="options" />
            </div>

            <!-- Batch & Performance -->
            <div v-else-if="activeTab === 'batch'">
              <BatchSettings v-model:options="options.batchOptions" />
              <PerformanceSettings v-model:concurrency="maxConcurrency" />
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="border-t dark:border-gray-700 p-6">
            <div class="flex justify-end space-x-3">
              <button
                @click="$emit('update:open', false)"
                :disabled="isExporting"
                class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                @click="addToQueue"
                :disabled="!canExport || isExporting"
                class="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <Plus class="w-4 h-4" />
                <span>Add to Queue</span>
              </button>
              <button
                @click="handleExport"
                :disabled="!canExport || isExporting"
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <div
                  v-if="isExporting"
                  class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                />
                <Download v-else class="w-4 h-4" />
                <span>{{ isExporting ? 'Exporting...' : 'Export Now' }}</span>
              </button>
            </div>

            <!-- Export Queue Status -->
            <QueueStatus v-if="queueStats.total > 0" :stats="queueStats" />
          </div>
        </div>

        <!-- Preview Panel -->
        <div v-if="showPreview" class="flex-1 border-l dark:border-gray-700">
          <ExportPreview
            :chats="previewChats"
            :options="previewOptions"
            @close="showPreview = false"
            @error="handlePreviewError"
          />
        </div>
      </div>
    </div>
  </div>

  <!-- Export Result Dialog -->
  <div
    v-if="showResult"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click="showResult = false"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6" @click.stop>
      <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Export Complete</h3>
      <div v-if="exportResult" class="space-y-3">
        <div class="text-sm">
          <span class="font-medium text-gray-700 dark:text-gray-300">Filename:</span>
          <span class="ml-2 text-gray-600 dark:text-gray-400 font-mono text-xs">{{
            exportResult.filename
          }}</span>
        </div>
        <div class="text-sm">
          <span class="font-medium text-gray-700 dark:text-gray-300">Size:</span>
          <span class="ml-2 text-gray-600 dark:text-gray-400">{{
            formatFileSize(exportResult.size)
          }}</span>
        </div>
        <div class="text-sm">
          <span class="font-medium text-gray-700 dark:text-gray-300">Processing Time:</span>
          <span class="ml-2 text-gray-600 dark:text-gray-400"
            >{{ Math.round(exportResult.processingTime) }}ms</span
          >
        </div>
      </div>

      <div class="flex justify-end mt-6">
        <button
          @click="showResult = false"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>

  <!-- Error Dialog -->
  <ExportErrorDialog v-model:open="showErrorDialog" :error="exportError" @retry="retryExport" />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  FileText,
  File,
  Code,
  FileImage,
  Archive,
  Table,
  Settings,
  Filter,
  Palette,
  Layers,
  Eye,
  RotateCcw,
  Plus,
  Download
} from 'lucide-vue-next'
import {
  exportService,
  type ExportOptions,
  type ExportResult,
  type ExportTemplate
} from '@renderer/src/services/export/ExportService'
import { exportQueue, type QueueStats } from '@renderer/src/services/export/ExportQueue'
import type { ChatRecord } from '@renderer/src/types'
import ExportPreview from './ExportPreview.vue'
import ExportErrorDialog from './ExportErrorDialog.vue'
// import FormatOptions from './options/FormatOptions.vue'
// import ChatSelection from './options/ChatSelection.vue'
// import TimeFilter from './options/TimeFilter.vue'
// import TagFilter from './options/TagFilter.vue'
// import TemplateSelector from './options/TemplateSelector.vue'
// import StyleCustomizer from './options/StyleCustomizer.vue'
// import BatchSettings from './options/BatchSettings.vue'
// import PerformanceSettings from './options/PerformanceSettings.vue'
// import QueueStatus from './options/QueueStatus.vue'

interface Props {
  open: boolean
  currentChatId?: string
}

interface Emits {
  (e: 'update:open', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const activeTab = ref('format')
const showPreview = ref(false)
const isExporting = ref(false)
const exportResult = ref<ExportResult | null>(null)
const showResult = ref(false)
const showErrorDialog = ref(false)
const exportError = ref<any>(null)
const maxConcurrency = ref(2)

// Export options
const options = ref<ExportOptions>({
  format: 'markdown',
  includeSystemMessages: false,
  includeTimestamps: true,
  includeMetadata: false,
  includeAttachments: false,
  title: '',
  author: 'MiaoDa Chat User',
  tags: [],
  batchOptions: {
    maxConcurrency: 2,
    chunkSize: 100,
    pauseBetweenChunks: 100,
    retryAttempts: 3
  }
})

// Selection options
const exportScope = ref<'current' | 'all' | 'selected' | 'filtered'>('current')
const selectedChatIds = ref<string[]>([])
const availableChats = ref<ChatRecord[]>([])
const useTimeFilter = ref(false)
const dateFrom = ref('')
const dateTo = ref('')

// Queue state
const queueStats = ref<QueueStats>({
  total: 0,
  pending: 0,
  running: 0,
  completed: 0,
  failed: 0,
  cancelled: 0
})

// Configuration
const tabs = [
  { id: 'format', label: 'Format & Options', icon: Settings },
  { id: 'selection', label: 'Selection & Filter', icon: Filter },
  { id: 'style', label: 'Templates & Style', icon: Palette },
  { id: 'batch', label: 'Batch & Performance', icon: Layers }
]

const formats = [
  {
    value: 'markdown',
    label: 'Markdown',
    description: 'GitHub-style markdown',
    icon: FileText
  },
  {
    value: 'html',
    label: 'HTML',
    description: 'Interactive web format',
    icon: Code
  },
  {
    value: 'pdf',
    label: 'PDF',
    description: 'Portable document format',
    icon: FileImage
  },
  {
    value: 'docx',
    label: 'Word',
    description: 'Microsoft Word document',
    icon: File
  },
  {
    value: 'csv',
    label: 'CSV/Excel',
    description: 'Spreadsheet format',
    icon: Table
  },
  {
    value: 'zip',
    label: 'ZIP Archive',
    description: 'Multiple formats in archive',
    icon: Archive
  }
]

// Computed
const canExport = computed(() => {
  if (exportScope.value === 'current' && !props.currentChatId) return false
  if (exportScope.value === 'selected' && selectedChatIds.value.length === 0) return false
  return true
})

const previewChats = computed(() => {
  // Return limited chat data for preview
  const chats = getSelectedChats().slice(0, 3) // Limit to 3 chats for preview
  return chats.map(chat => ({
    ...chat,
    messages: chat.messages?.slice(0, 10) || [] // Limit messages per chat
  }))
})

const previewOptions = computed(() => ({
  ...options.value,
  preview: true
}))

// Methods
const handleBackdropClick = () => {
  if (!isExporting.value) {
    emit('update:open', false)
  }
}

const getSelectedChats = (): any[] => {
  // Implementation would depend on your data structure
  // This is a placeholder
  return availableChats.value.filter(chat => {
    if (exportScope.value === 'current') {
      return chat.id === props.currentChatId
    }
    if (exportScope.value === 'selected') {
      return selectedChatIds.value.includes(chat.id)
    }
    return true
  })
}

const handleExport = async () => {
  if (!canExport.value) return

  try {
    isExporting.value = true

    const exportOptions: ExportOptions = {
      ...options.value,
      chatId: exportScope.value === 'current' ? props.currentChatId : undefined,
      chatIds: exportScope.value === 'selected' ? selectedChatIds.value : undefined,
      dateFrom: useTimeFilter.value && dateFrom.value ? new Date(dateFrom.value) : undefined,
      dateTo: useTimeFilter.value && dateTo.value ? new Date(dateTo.value + 'T23:59:59') : undefined
    }

    const result = await exportService.exportChats(exportOptions)

    exportService.downloadFile(result)
    exportResult.value = result
    showResult.value = true
    emit('update:open', false)
  } catch (error: any) {
    console.error('Export failed:', error)
    exportError.value = {
      message: error.message || 'Unknown error occurred',
      details: error.stack || error.toString(),
      code: error.code || 'EXPORT_ERROR',
      type: error.name || 'ExportError'
    }
    showErrorDialog.value = true
  } finally {
    isExporting.value = false
  }
}

const addToQueue = () => {
  if (!canExport.value) return

  const exportOptions: ExportOptions = {
    ...options.value,
    chatId: exportScope.value === 'current' ? props.currentChatId : undefined,
    chatIds: exportScope.value === 'selected' ? selectedChatIds.value : undefined,
    dateFrom: useTimeFilter.value && dateFrom.value ? new Date(dateFrom.value) : undefined,
    dateTo: useTimeFilter.value && dateTo.value ? new Date(dateTo.value + 'T23:59:59') : undefined
  }

  const taskName = `${options.value.format.toUpperCase()} Export - ${
    exportScope.value === 'current'
      ? 'Current Chat'
      : exportScope.value === 'selected'
        ? `${selectedChatIds.value.length} Chats`
        : 'All Chats'
  }`

  exportQueue.addTask(taskName, exportOptions, 'normal')
  updateQueueStats()
}

const resetToDefaults = () => {
  options.value = {
    format: 'markdown',
    includeSystemMessages: false,
    includeTimestamps: true,
    includeMetadata: false,
    includeAttachments: false,
    title: '',
    author: 'MiaoDa Chat User',
    tags: [],
    batchOptions: {
      maxConcurrency: 2,
      chunkSize: 100,
      pauseBetweenChunks: 100,
      retryAttempts: 3
    }
  }

  exportScope.value = props.currentChatId ? 'current' : 'all'
  selectedChatIds.value = []
  useTimeFilter.value = false
  dateFrom.value = ''
  dateTo.value = ''
}

const retryExport = () => {
  showErrorDialog.value = false
  exportError.value = null
  handleExport()
}

const handlePreviewError = (error: string) => {
  console.warn('Preview error:', error)
}

const updateQueueStats = () => {
  queueStats.value = exportQueue.getStats()
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Initialize
onMounted(() => {
  if (props.currentChatId) {
    exportScope.value = 'current'
  }

  // Set up queue monitoring
  exportQueue.addStatusCallback(updateQueueStats)
  exportQueue.setMaxConcurrency(maxConcurrency.value)
  updateQueueStats()
})
</script>

<style scoped>
/* Add any additional styling here */
</style>
