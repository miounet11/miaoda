<template>
  <div v-if="open" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click="handleBackdropClick">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" @click.stop>
      <!-- Header -->
      <div class="p-6 border-b dark:border-gray-700">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Export Chat History</h2>
        <p class="text-gray-600 dark:text-gray-300 mt-2">Choose format and options to export your conversations</p>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6">
        <!-- Export Format -->
        <div class="space-y-3">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Export Format</label>
          <div class="grid grid-cols-2 gap-3">
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                v-model="options.format"
                value="markdown"
                class="text-blue-600 focus:ring-blue-500"
              >
              <span class="text-sm">Markdown (.md)</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                v-model="options.format"
                value="json"
                class="text-blue-600 focus:ring-blue-500"
              >
              <span class="text-sm">JSON (.json)</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                v-model="options.format"
                value="html"
                class="text-blue-600 focus:ring-blue-500"
              >
              <span class="text-sm">HTML (.html)</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                v-model="options.format"
                value="txt"
                class="text-blue-600 focus:ring-blue-500"
              >
              <span class="text-sm">Plain Text (.txt)</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                v-model="options.format"
                value="pdf"
                class="text-blue-600 focus:ring-blue-500"
              >
              <span class="text-sm">PDF (.pdf)</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                v-model="options.format"
                value="csv"
                class="text-blue-600 focus:ring-blue-500"
              >
              <span class="text-sm">CSV/Excel (.csv/.xlsx)</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                v-model="options.format"
                value="docx"
                class="text-blue-600 focus:ring-blue-500"
              >
              <span class="text-sm">Word Document (.docx)</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                v-model="options.format"
                value="zip"
                class="text-blue-600 focus:ring-blue-500"
              >
              <span class="text-sm">ZIP Archive (multiple formats)</span>
            </label>
          </div>
          
          <!-- PDF Options -->
          <div v-if="options.format === 'pdf'" class="ml-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <label class="text-xs font-medium text-blue-800 dark:text-blue-200 mb-2 block">PDF Generation Method:</label>
            <div class="space-y-2">
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  v-model="pdfMethod"
                  value="direct"
                  class="text-blue-600 focus:ring-blue-500"
                >
                <span class="text-xs">Direct (Faster, better for text)</span>
              </label>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  v-model="pdfMethod"
                  value="html2canvas"
                  class="text-blue-600 focus:ring-blue-500"
                >
                <span class="text-xs">HTML Canvas (Slower, better for formatting)</span>
              </label>
            </div>
          </div>
          
          <!-- CSV Options -->
          <div v-if="options.format === 'csv'" class="ml-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <label class="text-xs font-medium text-green-800 dark:text-green-200 mb-2 block">CSV Export Options:</label>
            <div class="space-y-2">
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="csvOptions.includeHeaders"
                  class="text-green-600 focus:ring-green-500"
                >
                <span class="text-xs">Include column headers</span>
              </label>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="csvOptions.flattenContent"
                  class="text-green-600 focus:ring-green-500"
                >
                <span class="text-xs">Flatten multiline content</span>
              </label>
              <div class="flex items-center space-x-2">
                <label class="text-xs text-green-700 dark:text-green-300">Format:</label>
                <select v-model="csvFormat" class="text-xs border rounded px-1 bg-white dark:bg-gray-700">
                  <option value="csv">CSV (.csv)</option>
                  <option value="excel">Excel (.xlsx)</option>
                </select>
              </div>
            </div>
          </div>
          
          <!-- DOCX Options -->
          <div v-if="options.format === 'docx'" class="ml-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <label class="text-xs font-medium text-purple-800 dark:text-purple-200 mb-2 block">Word Document Options:</label>
            <div class="space-y-2">
              <div class="flex items-center space-x-2">
                <label class="text-xs text-purple-700 dark:text-purple-300">Template:</label>
                <select v-model="docxTemplate" class="text-xs border rounded px-1 bg-white dark:bg-gray-700">
                  <option value="default">Default</option>
                  <option value="academic">Academic</option>
                  <option value="business">Business</option>
                  <option value="minimal">Minimal</option>
                </select>
              </div>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="docxOptions.includeTableOfContents"
                  class="text-purple-600 focus:ring-purple-500"
                >
                <span class="text-xs">Include table of contents</span>
              </label>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="docxOptions.pageBreakBetweenChats"
                  class="text-purple-600 focus:ring-purple-500"
                >
                <span class="text-xs">Page break between chats</span>
              </label>
            </div>
          </div>
          
          <!-- ZIP Options -->
          <div v-if="options.format === 'zip'" class="ml-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <label class="text-xs font-medium text-orange-800 dark:text-orange-200 mb-2 block">ZIP Archive Options:</label>
            <div class="space-y-2">
              <div class="text-xs text-orange-700 dark:text-orange-300 mb-2">Include formats:</div>
              <div class="grid grid-cols-2 gap-1">
                <label class="flex items-center space-x-1 cursor-pointer">
                  <input type="checkbox" v-model="zipFormats" value="markdown" class="text-orange-600 focus:ring-orange-500">
                  <span class="text-xs">Markdown</span>
                </label>
                <label class="flex items-center space-x-1 cursor-pointer">
                  <input type="checkbox" v-model="zipFormats" value="html" class="text-orange-600 focus:ring-orange-500">
                  <span class="text-xs">HTML</span>
                </label>
                <label class="flex items-center space-x-1 cursor-pointer">
                  <input type="checkbox" v-model="zipFormats" value="json" class="text-orange-600 focus:ring-orange-500">
                  <span class="text-xs">JSON</span>
                </label>
                <label class="flex items-center space-x-1 cursor-pointer">
                  <input type="checkbox" v-model="zipFormats" value="pdf" class="text-orange-600 focus:ring-orange-500">
                  <span class="text-xs">PDF</span>
                </label>
              </div>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="zipOptions.createFolderStructure"
                  class="text-orange-600 focus:ring-orange-500"
                >
                <span class="text-xs">Organize in folders</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Export Scope -->
        <div class="space-y-3">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Export Scope</label>
          <div class="space-y-2">
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                v-model="exportScope"
                value="current"
                class="text-blue-600 focus:ring-blue-500"
              >
              <span class="text-sm">Current conversation</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                v-model="exportScope"
                value="all"
                class="text-blue-600 focus:ring-blue-500"
              >
              <span class="text-sm">All conversations</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                v-model="exportScope"
                value="selected"
                class="text-blue-600 focus:ring-blue-500"
              >
              <span class="text-sm">Selected conversations</span>
            </label>
          </div>
        </div>

        <!-- Chat Selection (when selected scope is chosen) -->
        <div v-if="exportScope === 'selected'" class="space-y-3">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Select Conversations</label>
          <div class="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2 bg-gray-50 dark:bg-gray-700">
            <div v-if="loadingChats" class="text-center text-gray-500 py-4">
              Loading conversations...
            </div>
            <div v-else-if="availableChats.length === 0" class="text-center text-gray-500 py-4">
              No conversations available
            </div>
            <div v-else class="space-y-2">
              <label
                v-for="chat in availableChats"
                :key="chat.id"
                class="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  :value="chat.id"
                  v-model="selectedChatIds"
                  class="text-blue-600 focus:ring-blue-500"
                >
                <div class="flex-1 min-w-0">
                  <div class="font-medium truncate text-gray-900 dark:text-white">{{ chat.title }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {{ formatDate(chat.updated_at) }}
                  </div>
                </div>
              </label>
            </div>
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            {{ selectedChatIds.length }} conversation(s) selected
          </div>
        </div>

        <!-- Time Filter -->
        <div class="space-y-3">
          <div class="flex items-center space-x-2">
            <input
              type="checkbox"
              v-model="useTimeFilter"
              class="text-blue-600 focus:ring-blue-500"
            >
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">Filter by date range</label>
          </div>
          <div v-if="useTimeFilter" class="grid grid-cols-2 gap-3">
            <div class="space-y-2">
              <label class="text-xs text-gray-500 dark:text-gray-400">From Date</label>
              <input
                type="date"
                v-model="dateFrom"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
            </div>
            <div class="space-y-2">
              <label class="text-xs text-gray-500 dark:text-gray-400">To Date</label>
              <input
                type="date"
                v-model="dateTo"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
            </div>
          </div>
        </div>

        <!-- Export Options -->
        <div class="space-y-3">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Export Options</label>
          <div class="space-y-2">
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                v-model="options.includeTimestamps"
                class="text-blue-600 focus:ring-blue-500"
              >
              <span class="text-sm">Include timestamps</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                v-model="options.includeSystemMessages"
                class="text-blue-600 focus:ring-blue-500"
              >
              <span class="text-sm">Include system messages</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                v-model="options.includeMetadata"
                class="text-blue-600 focus:ring-blue-500"
              >
              <span class="text-sm">Include metadata</span>
            </label>
          </div>
        </div>

        <!-- Custom Information -->
        <div class="space-y-3">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Custom Information</label>
          <div class="space-y-3">
            <div class="space-y-2">
              <label class="text-xs text-gray-500 dark:text-gray-400">Export Title</label>
              <input
                type="text"
                v-model="options.title"
                placeholder="My Chat Export"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
            </div>
            <div class="space-y-2">
              <label class="text-xs text-gray-500 dark:text-gray-400">Author</label>
              <input
                type="text"
                v-model="options.author"
                placeholder="Your Name"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Export Progress -->
      <div v-if="isExporting && exportProgress" class="px-6 py-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ exportProgress.currentChat }}</span>
            <span class="text-sm text-gray-500 dark:text-gray-400">{{ Math.round(exportProgress.progress) }}%</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              class="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              :style="{ width: exportProgress.progress + '%' }"
            />
          </div>
          <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Stage: {{ exportProgress.stage }}</span>
            <span>{{ exportProgress.processedMessages }}/{{ exportProgress.totalMessages }} messages</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-6 border-t dark:border-gray-700">
        <!-- Queue Status -->        
        <div v-if="queueStats.total > 0" class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div class="flex items-center justify-between">
            <div class="text-sm text-blue-800 dark:text-blue-200">
              Export Queue: {{ queueStats.pending }} pending, {{ queueStats.running }} running, {{ queueStats.completed }} completed
            </div>
            <button
              @click="showQueueDialog = true"
              class="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Manage Queue
            </button>
          </div>
        </div>
        
        <div class="flex justify-between items-center">
          <button
            @click="showAdvancedDialog = true"
            class="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-800/30 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Settings class="w-4 h-4" />
            <span>Advanced Options</span>
          </button>
          
          <div class="flex space-x-3">
            <button
              @click="$emit('update:open', false)"
              :disabled="isExporting"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              @click="addToQueue"
              :disabled="!canExport"
              class="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <Plus class="w-4 h-4" />
              <span>Add to Queue</span>
            </button>
            <button
              @click="handleExport"
              :disabled="isExporting || !canExport"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <div v-if="isExporting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{{ isExporting ? 'Exporting...' : 'Export Now' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Export Result Dialog -->
  <div v-if="showResult" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click="showResult = false">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6" @click.stop>
      <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Export Complete</h3>
      <div v-if="exportResult" class="space-y-3">
        <div class="text-sm">
          <span class="font-medium text-gray-700 dark:text-gray-300">Filename:</span>
          <span class="ml-2 text-gray-600 dark:text-gray-400 font-mono text-xs">{{ exportResult.filename }}</span>
        </div>
        <div class="text-sm">
          <span class="font-medium text-gray-700 dark:text-gray-300">Size:</span>
          <span class="ml-2 text-gray-600 dark:text-gray-400">{{ formatFileSize(exportResult.size) }}</span>
        </div>
        <div class="text-sm">
          <span class="font-medium text-gray-700 dark:text-gray-300">Messages:</span>
          <span class="ml-2 text-gray-600 dark:text-gray-400">{{ exportResult.messageCount }}</span>
        </div>
        <div class="text-sm">
          <span class="font-medium text-gray-700 dark:text-gray-300">Conversations:</span>
          <span class="ml-2 text-gray-600 dark:text-gray-400">{{ exportResult.chatCount }}</span>
        </div>
        <div class="text-sm">
          <span class="font-medium text-gray-700 dark:text-gray-300">Processing Time:</span>
          <span class="ml-2 text-gray-600 dark:text-gray-400">{{ Math.round(exportResult.processingTime) }}ms</span>
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
  
  <!-- Export Error Dialog -->
  <ExportErrorDialog 
    v-model:open="showErrorDialog" 
    :error="exportError"
    @retry="retryExport"
  />
  
  <!-- Advanced Export Dialog -->
  <AdvancedExportDialog 
    v-model:open="showAdvancedDialog" 
    :current-chat-id="currentChatId"
  />
  
  <!-- Export Queue Dialog -->
  <ExportQueueDialog 
    v-model:open="showQueueDialog"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Settings, Plus } from 'lucide-vue-next'
import { exportService, type ExportOptions, type ExportResult, type ExportProgress } from '@renderer/src/services/export/ExportService'
import { exportQueue, type QueueStats } from '@renderer/src/services/export/ExportQueue'
import type { ChatRecord } from '@renderer/src/types'
import ExportErrorDialog from './ExportErrorDialog.vue'
import AdvancedExportDialog from './AdvancedExportDialog.vue'
import ExportQueueDialog from './ExportQueueDialog.vue'

interface Props {
  open: boolean
  currentChatId?: string
}

interface Emits {
  (e: 'update:open', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Export options
const options = ref<ExportOptions>({
  format: 'markdown',
  includeSystemMessages: false,
  includeTimestamps: true,
  includeMetadata: false,
  title: '',
  author: ''
})

// Export scope
const exportScope = ref<'current' | 'all' | 'selected'>('current')

// Time filter
const useTimeFilter = ref(false)
const dateFrom = ref('')
const dateTo = ref('')

// Chat selection
const availableChats = ref<ChatRecord[]>([])
const selectedChatIds = ref<string[]>([])
const loadingChats = ref(false)

// Export state
const isExporting = ref(false)
const showResult = ref(false)
const exportResult = ref<ExportResult | null>(null)
const exportProgress = ref<ExportProgress | null>(null)
const showErrorDialog = ref(false)
const exportError = ref<{
  message: string
  details?: string
  code?: string
  type?: string
} | null>(null)
const pdfMethod = ref<'direct' | 'html2canvas'>('direct')
const csvFormat = ref<'csv' | 'excel'>('csv')
const docxTemplate = ref<'default' | 'academic' | 'business' | 'minimal'>('default')
const zipFormats = ref<string[]>(['markdown', 'html', 'json'])

// Format-specific options
const csvOptions = ref({
  includeHeaders: true,
  flattenContent: false
})

const docxOptions = ref({
  includeTableOfContents: true,
  pageBreakBetweenChats: true
})

const zipOptions = ref({
  createFolderStructure: true
})

// Dialog states
const showAdvancedDialog = ref(false)
const showQueueDialog = ref(false)
const queueStats = ref<QueueStats>({
  total: 0,
  pending: 0,
  running: 0,
  completed: 0,
  failed: 0,
  cancelled: 0
})

// Computed
const canExport = computed(() => {
  if (exportScope.value === 'current' && !props.currentChatId) {
    return false
  }
  if (exportScope.value === 'selected' && selectedChatIds.value.length === 0) {
    return false
  }
  return true
})

// Methods
const handleBackdropClick = () => {
  if (!isExporting.value) {
    emit('update:open', false)
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } else if (diffDays < 7) {
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return weekdays[date.getDay()]
  } else {
    return date.toLocaleDateString([], { 
      month: '2-digit', 
      day: '2-digit',
      year: diffDays > 365 ? '2-digit' : undefined
    })
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const loadAvailableChats = async () => {
  if (loadingChats.value) return
  
  try {
    loadingChats.value = true
    availableChats.value = await window.api.export.getAllChats()
  } catch (error) {
    console.error('Failed to load chats:', error)
  } finally {
    loadingChats.value = false
  }
}

const handleExport = async () => {
  if (!canExport.value) return

  try {
    isExporting.value = true
    exportProgress.value = null

    // Prepare export options
    const exportOptions: ExportOptions = {
      ...options.value,
      chatId: exportScope.value === 'current' ? props.currentChatId : undefined,
      chatIds: exportScope.value === 'selected' ? selectedChatIds.value : undefined,
      dateFrom: useTimeFilter.value && dateFrom.value ? new Date(dateFrom.value) : undefined,
      dateTo: useTimeFilter.value && dateTo.value ? new Date(dateTo.value + 'T23:59:59') : undefined,
      pdfOptions: options.value.format === 'pdf' ? {
        method: pdfMethod.value,
        theme: 'light',
        fontSize: 'medium',
        pageOrientation: 'portrait',
        margins: { top: 72, right: 72, bottom: 72, left: 72 },
        includePageNumbers: true,
        includeHeader: true,
        includeFooter: true
      } : undefined,
      csvOptions: options.value.format === 'csv' ? {
        delimiter: ',',
        includeHeaders: csvOptions.value.includeHeaders,
        encoding: 'utf-8',
        flattenContent: csvOptions.value.flattenContent
      } : undefined,
      docxOptions: options.value.format === 'docx' ? {
        template: docxTemplate.value,
        fontSize: 22,
        fontFamily: 'Calibri',
        includeTableOfContents: docxOptions.value.includeTableOfContents,
        pageBreakBetweenChats: docxOptions.value.pageBreakBetweenChats
      } : undefined,
      zipOptions: options.value.format === 'zip' ? {
        compression: 'best',
        includeFormats: zipFormats.value as any[],
        separateFilePerChat: false,
        createFolderStructure: zipOptions.value.createFolderStructure
      } : undefined
    }
    
    // Handle CSV vs Excel format selection
    if (options.value.format === 'csv' && csvFormat.value === 'excel') {
      // Override format for Excel export
      exportOptions.format = 'csv' // Will be handled by CSVExporter.exportToExcel
      exportOptions.csvOptions = {
        ...exportOptions.csvOptions!,
        delimiter: ',', // Excel will ignore delimiter but keep for consistency
      }
    }

    // For Excel format, we'll modify the filename after export
    const result = await exportService.exportChats(exportOptions, (progress) => {
      exportProgress.value = progress
    })
    
    // Handle Excel format filename change
    if (options.value.format === 'csv' && csvFormat.value === 'excel') {
      result.filename = result.filename.replace('.csv', '.xlsx')
      result.mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
    
    // Download the file
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
    exportProgress.value = null
  }
}

// Retry export functionality
const retryExport = () => {
  showErrorDialog.value = false
  exportError.value = null
  handleExport()
}

// Add to queue functionality
const addToQueue = () => {
  if (!canExport.value) return

  const exportOptions: ExportOptions = {
    ...options.value,
    chatId: exportScope.value === 'current' ? props.currentChatId : undefined,
    chatIds: exportScope.value === 'selected' ? selectedChatIds.value : undefined,
    dateFrom: useTimeFilter.value && dateFrom.value ? new Date(dateFrom.value) : undefined,
    dateTo: useTimeFilter.value && dateTo.value ? new Date(dateTo.value + 'T23:59:59') : undefined,
    pdfOptions: options.value.format === 'pdf' ? {
      method: pdfMethod.value,
      theme: 'light',
      fontSize: 'medium',
      pageOrientation: 'portrait',
      margins: { top: 72, right: 72, bottom: 72, left: 72 },
      includePageNumbers: true,
      includeHeader: true,
      includeFooter: true
    } : undefined,
    csvOptions: options.value.format === 'csv' ? {
      delimiter: ',',
      includeHeaders: csvOptions.value.includeHeaders,
      encoding: 'utf-8',
      flattenContent: csvOptions.value.flattenContent
    } : undefined,
    docxOptions: options.value.format === 'docx' ? {
      template: docxTemplate.value,
      fontSize: 22,
      fontFamily: 'Calibri',
      includeTableOfContents: docxOptions.value.includeTableOfContents,
      pageBreakBetweenChats: docxOptions.value.pageBreakBetweenChats
    } : undefined,
    zipOptions: options.value.format === 'zip' ? {
      compression: 'best',
      includeFormats: zipFormats.value as any[],
      separateFilePerChat: false,
      createFolderStructure: zipOptions.value.createFolderStructure
    } : undefined
  }

  const taskName = `${options.value.format.toUpperCase()} Export - ${
    exportScope.value === 'current' ? 'Current Chat' :
    exportScope.value === 'selected' ? `${selectedChatIds.value.length} Chats` :
    'All Chats'
  }`

  exportQueue.addTask(taskName, exportOptions, 'normal')
  updateQueueStats()
}

// Update queue statistics
const updateQueueStats = () => {
  queueStats.value = exportQueue.getStats()
}

// Watch for scope changes
watch(exportScope, (newScope) => {
  if (newScope === 'selected' && availableChats.value.length === 0) {
    loadAvailableChats()
  }
})

// Initialize
onMounted(() => {
  options.value.author = 'MiaoDa Chat User'
  
  if (props.currentChatId) {
    exportScope.value = 'current'
  } else {
    exportScope.value = 'all'
  }
  
  // Set up queue monitoring
  exportQueue.setTaskCallback(async (task) => {
    return await exportService.exportChats(task.options)
  })
  
  exportQueue.addStatusCallback(updateQueueStats)
  updateQueueStats()
})
</script>

<style scoped>
/* Custom styles for better dark mode support */
input[type="radio"]:checked {
  background-color: #3b82f6;
}

input[type="checkbox"]:checked {
  background-color: #3b82f6;
}
</style>