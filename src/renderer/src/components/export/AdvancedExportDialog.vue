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
           aria-label="按钮">
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
           aria-label="按钮">
            <Eye class="w-4 h-4" />
            <span>{{ showPreview ? 'Hide Preview' : 'Show Preview' }}</span>
          </button>
          <button
            @click="resetToDefaults"
            class="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
           aria-label="按钮">
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
                    <input id="input-92e6ufj9k"
                      type="checkbox"
                      v-model="options.includeTimestamps"
                      class="w-4 h-4 text-blue-600 focus:ring-blue-500"
                     aria-label="输入框">
                    <span class="text-sm text-gray-700 dark:text-gray-300">Include timestamps</span>
                  </label>
                  <label class="flex items-center space-x-3">
                    <input id="input-accj17y7s"
                      type="checkbox"
                      v-model="options.includeSystemMessages"
                      class="w-4 h-4 text-blue-600 focus:ring-blue-500"
                     aria-label="输入框">
                    <span class="text-sm text-gray-700 dark:text-gray-300"
                      >Include system messages</span
                    >
                  </label>
                  <label class="flex items-center space-x-3">
                    <input id="input-bqfa527fi"
                      type="checkbox"
                      v-model="options.includeMetadata"
                      class="w-4 h-4 text-blue-600 focus:ring-blue-500"
                     aria-label="输入框">
                    <span class="text-sm text-gray-700 dark:text-gray-300">Include metadata</span>
                  </label>
                  <label class="flex items-center space-x-3">
                    <input id="input-t9ywrxllg"
                      type="checkbox"
                      v-model="options.includeAttachments"
                      class="w-4 h-4 text-blue-600 focus:ring-blue-500"
                     aria-label="输入框">
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
               aria-label="按钮">
                Cancel
              </button>
              <button
                @click="addToQueue"
                :disabled="!canExport || isExporting"
                class="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
               aria-label="按钮">
                <Plus class="w-4 h-4" />
                <span>Add to Queue</span>
              </button>
              <button
                @click="handleExport"
                :disabled="!canExport || isExporting"
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
               aria-label="按钮">
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
         aria-label="按钮">
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

/* 🎨 响应式设计系统 */
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}

/* 🎨 响应式实用类 */
.container-sm { max-width: var(--breakpoint-sm); }
.container-md { max-width: var(--breakpoint-md); }
.container-lg { max-width: var(--breakpoint-lg); }
.container-xl { max-width: var(--breakpoint-xl); }

/* 响应式显示 */
.hidden-sm { display: none; }
.hidden-md { display: none; }
.hidden-lg { display: none; }

@media (min-width: 640px) {
  .hidden-sm { display: block; }
}

@media (min-width: 768px) {
  .hidden-md { display: block; }
}

@media (min-width: 1024px) {
  .hidden-lg { display: block; }
}

/* 响应式文本 */
.text-responsive-sm { font-size: clamp(0.875rem, 2vw, 1rem); }
.text-responsive-base { font-size: clamp(1rem, 2.5vw, 1.125rem); }
.text-responsive-lg { font-size: clamp(1.125rem, 3vw, 1.25rem); }
.text-responsive-xl { font-size: clamp(1.25rem, 3.5vw, 1.5rem); }

/* 响应式间距 */
.space-responsive-sm { gap: clamp(0.5rem, 2vw, 1rem); }
.space-responsive-md { gap: clamp(1rem, 3vw, 1.5rem); }
.space-responsive-lg { gap: clamp(1.5rem, 4vw, 2rem); }

/* 响应式网格 */
.grid-responsive-sm {
  grid-template-columns: repeat(auto-fit, minmax(clamp(200px, 25vw, 300px), 1fr));
}

.grid-responsive-md {
  grid-template-columns: repeat(auto-fit, minmax(clamp(250px, 30vw, 350px), 1fr));
}

.grid-responsive-lg {
  grid-template-columns: repeat(auto-fit, minmax(clamp(300px, 35vw, 400px), 1fr));
}

/* 响应式布局调整 */
@media (max-width: 640px) {
  .flex-col-mobile { flex-direction: column; }
  .grid-1-mobile { grid-template-columns: 1fr; }
  .gap-2-mobile { gap: var(--space-2); }
  .p-4-mobile { padding: var(--space-4); }
}

@media (max-width: 768px) {
  .flex-col-tablet { flex-direction: column; }
  .grid-2-tablet { grid-template-columns: repeat(2, 1fr); }
  .gap-4-tablet { gap: var(--space-4); }
  .p-6-tablet { padding: var(--space-6); }
}

@media (max-width: 1024px) {
  .sidebar-layout {
    grid-template-columns: 1fr;
  }
  .sidebar {
    position: static;
  }
}

/* 🎨 现代布局系统 */
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.flex-start {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.flex-end {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.flex-col {
  display: flex;
  flex-direction: column;
}

.flex-wrap {
  display: flex;
  flex-wrap: wrap;
}

/* 🎨 网格系统 */
.grid-auto-fit {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-4);
}

.grid-auto-fill {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-4);
}

.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

.grid-gap-2 { gap: var(--space-2); }
.grid-gap-4 { gap: var(--space-4); }
.grid-gap-6 { gap: var(--space-6); }

/* 🎨 卡片布局 */
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.card-interactive:hover {
  cursor: pointer;
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1);
}

/* 🎨 页面布局 */
.page-layout {
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr auto;
}

.page-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: white;
  border-bottom: 1px solid var(--color-gray-200);
}

.page-main {
  padding: var(--space-6) 0;
}

.page-footer {
  border-top: 1px solid var(--color-gray-200);
  background: var(--color-gray-50);
}

/* 🎨 侧边栏布局 */
.sidebar-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--space-6);
}

.sidebar {
  position: sticky;
  top: var(--space-6);
  height: fit-content;
}

.sidebar-content {
  padding: var(--space-6);
  background: white;
  border-radius: 12px;
  border: 1px solid var(--color-gray-200);
}

/* 🎨 响应式工具 */
@media (max-width: 768px) {
  .sidebar-layout {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }

  .hidden-mobile { display: none; }
  .flex-mobile-col { flex-direction: column; }
  .grid-mobile-1 { grid-template-columns: 1fr; }
}

/* 🎨 完整间距系统 - 基于4px网格 */
:root {
  --space-0: 0;
  --space-1: 0.25rem;    /* 4px */
  --space-2: 0.5rem;     /* 8px */
  --space-3: 0.75rem;    /* 12px */
  --space-4: 1rem;       /* 16px */
  --space-5: 1.25rem;    /* 20px */
  --space-6: 1.5rem;     /* 24px */
  --space-8: 2rem;       /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */
  --space-20: 5rem;      /* 80px */
  --space-24: 6rem;      /* 96px */
  --space-32: 8rem;      /* 128px */

  /* 负间距 */
  --space-neg-1: -0.25rem;
  --space-neg-2: -0.5rem;
  --space-neg-4: -1rem;
}

/* 🎨 间距实用类 */
.m-1 { margin: var(--space-1); }
.m-2 { margin: var(--space-2); }
.m-3 { margin: var(--space-3); }
.m-4 { margin: var(--space-4); }
.m-6 { margin: var(--space-6); }
.m-8 { margin: var(--space-8); }

.p-1 { padding: var(--space-1); }
.p-2 { padding: var(--space-2); }
.p-3 { padding: var(--space-3); }
.p-4 { padding: var(--space-4); }
.p-6 { padding: var(--space-6); }
.p-8 { padding: var(--space-8); }

.mx-auto { margin-left: auto; margin-right: auto; }
.my-auto { margin-top: auto; margin-bottom: auto; }

.px-1 { padding-left: var(--space-1); padding-right: var(--space-1); }
.px-2 { padding-left: var(--space-2); padding-right: var(--space-2); }
.px-3 { padding-left: var(--space-3); padding-right: var(--space-3); }
.px-4 { padding-left: var(--space-4); padding-right: var(--space-4); }
.px-6 { padding-left: var(--space-6); padding-right: var(--space-6); }

.py-1 { padding-top: var(--space-1); padding-bottom: var(--space-1); }
.py-2 { padding-top: var(--space-2); padding-bottom: var(--space-2); }
.py-3 { padding-top: var(--space-3); padding-bottom: var(--space-3); }
.py-4 { padding-top: var(--space-4); padding-bottom: var(--space-4); }
.py-6 { padding-top: var(--space-6); padding-bottom: var(--space-6); }

/* 🎨 容器和布局间距 */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding-left: var(--space-4);
  padding-right: var(--space-4);
}

.section-spacing {
  padding-top: var(--space-12);
  padding-bottom: var(--space-12);
}

.card-spacing {
  padding: var(--space-6);
}

.stack-sm > * + * { margin-top: var(--space-2); }
.stack-md > * + * { margin-top: var(--space-4); }
.stack-lg > * + * { margin-top: var(--space-6); }
.stack-xl > * + * { margin-top: var(--space-8); }

.inline-sm > * + * { margin-left: var(--space-2); }
.inline-md > * + * { margin-left: var(--space-4); }
.inline-lg > * + * { margin-left: var(--space-6); }

/* 🎨 完整字体系统 */
:root {
  /* 字体族 */
  --font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', 'Source Code Pro', monospace;

  /* 字体大小 - 基于1.25的倍数比例 */
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-3xl: 1.875rem;  /* 30px */
  --font-size-4xl: 2.25rem;   /* 36px */
  --font-size-5xl: 3rem;      /* 48px */

  /* 字体权重 */
  --font-weight-thin: 100;
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;

  /* 行高 */
  --line-height-tight: 1.25;
  --line-height-snug: 1.375;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.625;
  --line-height-loose: 2;

  /* 字母间距 */
  --letter-spacing-tighter: -0.05em;
  --letter-spacing-tight: -0.025em;
  --letter-spacing-normal: 0;
  --letter-spacing-wide: 0.025em;
  --letter-spacing-wider: 0.05em;
  --letter-spacing-widest: 0.1em;
}

/* 🎨 字体实用类 */
.font-sans { font-family: var(--font-family-sans); }
.font-mono { font-family: var(--font-family-mono); }

.text-xs { font-size: var(--font-size-xs); line-height: var(--line-height-tight); }
.text-sm { font-size: var(--font-size-sm); line-height: var(--line-height-snug); }
.text-base { font-size: var(--font-size-base); line-height: var(--line-height-normal); }
.text-lg { font-size: var(--font-size-lg); line-height: var(--line-height-relaxed); }
.text-xl { font-size: var(--font-size-xl); line-height: var(--line-height-relaxed); }
.text-2xl { font-size: var(--font-size-2xl); line-height: var(--line-height-loose); }
.text-3xl { font-size: var(--font-size-3xl); line-height: var(--line-height-loose); }

.font-thin { font-weight: var(--font-weight-thin); }
.font-light { font-weight: var(--font-weight-light); }
.font-normal { font-weight: var(--font-weight-normal); }
.font-medium { font-weight: var(--font-weight-medium); }
.font-semibold { font-weight: var(--font-weight-semibold); }
.font-bold { font-weight: var(--font-weight-bold); }

.leading-tight { line-height: var(--line-height-tight); }
.leading-snug { line-height: var(--line-height-snug); }
.leading-normal { line-height: var(--line-height-normal); }
.leading-relaxed { line-height: var(--line-height-relaxed); }

.tracking-tight { letter-spacing: var(--letter-spacing-tight); }
.tracking-normal { letter-spacing: var(--letter-spacing-normal); }
.tracking-wide { letter-spacing: var(--letter-spacing-wide); }

/* 🎨 文本层次优化 */
.heading-1 {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tighter);
  margin-bottom: 1rem;
}

.heading-2 {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tighter);
  margin-bottom: 0.875rem;
}

.heading-3 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-snug);
  letter-spacing: var(--letter-spacing-tight);
  margin-bottom: 0.75rem;
}

.body-large {
  font-size: var(--font-size-lg);
  line-height: var(--line-height-relaxed);
  letter-spacing: var(--letter-spacing-normal);
}

.body-regular {
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-normal);
}

.body-small {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-wide);
}

.caption {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-snug);
  letter-spacing: var(--letter-spacing-wide);
  color: var(--color-gray-600);
}

/* 🎨 高级色彩系统 */
:root {
  /* 基础色彩 */
  --color-primary: hsl(221 83% 53%);
  --color-primary-hover: hsl(221 83% 48%);
  --color-primary-active: hsl(221 83% 43%);

  /* 语义色彩 */
  --color-success: hsl(142 71% 45%);
  --color-warning: hsl(38 92% 50%);
  --color-error: hsl(0 84% 60%);
  --color-info: hsl(217 91% 60%);

  /* 中性色彩 */
  --color-gray-50: hsl(210 20% 98%);
  --color-gray-100: hsl(210 15% 95%);
  --color-gray-200: hsl(210 10% 89%);
  --color-gray-300: hsl(210 8% 75%);
  --color-gray-400: hsl(210 8% 56%);
  --color-gray-500: hsl(210 6% 43%);
  --color-gray-600: hsl(210 8% 35%);
  --color-gray-700: hsl(210 10% 28%);
  --color-gray-800: hsl(210 12% 21%);
  --color-gray-900: hsl(210 15% 15%);

  /* 透明度变体 */
  --color-primary-10: hsl(221 83% 53% / 0.1);
  --color-primary-20: hsl(221 83% 53% / 0.2);
  --color-primary-30: hsl(221 83% 53% / 0.3);
  --color-success-10: hsl(142 71% 45% / 0.1);
  --color-error-10: hsl(0 84% 60% / 0.1);
}

/* 🎨 色彩实用类 */
.text-primary { color: var(--color-primary); }
.text-success { color: var(--color-success); }
.text-warning { color: var(--color-warning); }
.text-error { color: var(--color-error); }
.text-gray-500 { color: var(--color-gray-500); }
.text-gray-600 { color: var(--color-gray-600); }
.text-gray-700 { color: var(--color-gray-700); }

.bg-primary { background-color: var(--color-primary); }
.bg-primary-hover:hover { background-color: var(--color-primary-hover); }
.bg-success { background-color: var(--color-success); }
.bg-warning { background-color: var(--color-warning); }
.bg-error { background-color: var(--color-error); }

.border-primary { border-color: var(--color-primary); }
.border-success { border-color: var(--color-success); }
.border-error { border-color: var(--color-error); }

/* 🎨 对比度增强 */
.high-contrast {
  --color-primary: hsl(221 100% 40%);
  --color-gray-900: hsl(210 20% 10%);
  --color-gray-100: hsl(210 15% 95%);
}

/* 🎨 暗色主题支持 */
@media (prefers-color-scheme: dark) {
  :root {
    --color-gray-50: hsl(210 15% 15%);
    --color-gray-100: hsl(210 12% 21%);
    --color-gray-200: hsl(210 10% 28%);
    --color-gray-300: hsl(210 8% 35%);
    --color-gray-400: hsl(210 6% 43%);
    --color-gray-500: hsl(210 8% 56%);
    --color-gray-600: hsl(210 8% 75%);
    --color-gray-700: hsl(210 10% 89%);
    --color-gray-800: hsl(210 15% 95%);
    --color-gray-900: hsl(210 20% 98%);
  }
}
/* Add any additional styling here */


/* 无障碍支持 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* 焦点样式 */
:focus-visible {
  outline: 2px solid hsl(var(--ring, 59 130 230));
  outline-offset: 2px;
}

/* 🎨 表单用户体验优化 */
.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: hsl(var(--foreground));
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: hsl(var(--ring));
  box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2);
}

.form-input.error {
  border-color: hsl(0 84% 60%);
}

.form-error {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: hsl(0 84% 60%);
}

.form-success {
  border-color: hsl(142 71% 45%);
}

/* 加载状态 */
.form-input.loading {
  background-image: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  background-size: 200% 100%;
  animation: loading-shimmer 1.5s infinite;
}

@keyframes loading-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* 🎨 错误状态设计 */
.error-state {
  padding: 1rem;
  border: 1px solid hsl(0 84% 60% / 0.2);
  border-radius: 8px;
  background-color: hsl(0 84% 60% / 0.05);
  color: hsl(0 84% 60%);
}

.error-icon {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  margin-right: 0.5rem;
  color: hsl(0 84% 60%);
}

.error-title {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.error-message {
  font-size: 0.875rem;
  line-height: 1.4;
  margin-bottom: 1rem;
}

.error-actions {
  display: flex;
  gap: 0.5rem;
}

.error-retry-btn {
  padding: 0.5rem 1rem;
  background-color: hsl(0 84% 60%);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.error-retry-btn:hover {
  background-color: hsl(0 84% 60% / 0.9);
}</style>
