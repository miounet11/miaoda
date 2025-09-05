<template>
  <div
    v-if="open"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click="handleBackdropClick"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      @click.stop
    >
      <!-- Header -->
      <div class="p-6 border-b dark:border-gray-700">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Export Chat History</h2>
        <p class="text-gray-600 dark:text-gray-300 mt-2">
          Choose format and options to export your conversations
        </p>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6">
        <!-- Export Format -->
        <div class="space-y-3">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Export Format</label>
          <div class="grid grid-cols-2 gap-3">
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                id="input-eixcr62k8"
                type="radio"
                v-model="options.format"
                value="markdown"
                class="text-blue-600 focus:ring-blue-500"
                aria-label="输入框"
              />
              <span class="text-sm">Markdown (.md)</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                id="input-jdo0ukgty"
                type="radio"
                v-model="options.format"
                value="json"
                class="text-blue-600 focus:ring-blue-500"
                aria-label="输入框"
              />
              <span class="text-sm">JSON (.json)</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                id="input-gdxgmxlbk"
                type="radio"
                v-model="options.format"
                value="html"
                class="text-blue-600 focus:ring-blue-500"
                aria-label="输入框"
              />
              <span class="text-sm">HTML (.html)</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                id="input-rl3bvjq61"
                type="radio"
                v-model="options.format"
                value="txt"
                class="text-blue-600 focus:ring-blue-500"
                aria-label="输入框"
              />
              <span class="text-sm">Plain Text (.txt)</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                id="input-kub9dr7ju"
                type="radio"
                v-model="options.format"
                value="pdf"
                class="text-blue-600 focus:ring-blue-500"
                aria-label="输入框"
              />
              <span class="text-sm">PDF (.pdf)</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                id="input-wftp6omw8"
                type="radio"
                v-model="options.format"
                value="csv"
                class="text-blue-600 focus:ring-blue-500"
                aria-label="输入框"
              />
              <span class="text-sm">CSV/Excel (.csv/.xlsx)</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                id="input-0w4qgil3p"
                type="radio"
                v-model="options.format"
                value="docx"
                class="text-blue-600 focus:ring-blue-500"
                aria-label="输入框"
              />
              <span class="text-sm">Word Document (.docx)</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                id="input-2bjs44dvq"
                type="radio"
                v-model="options.format"
                value="zip"
                class="text-blue-600 focus:ring-blue-500"
                aria-label="输入框"
              />
              <span class="text-sm">ZIP Archive (multiple formats)</span>
            </label>
          </div>

          <!-- PDF Options -->
          <div
            v-if="options.format === 'pdf'"
            class="ml-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
          >
            <label class="text-xs font-medium text-blue-800 dark:text-blue-200 mb-2 block"
              >PDF Generation Method:</label
            >
            <div class="space-y-2">
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  id="input-vq8mu5q3e"
                  type="radio"
                  v-model="pdfMethod"
                  value="direct"
                  class="text-blue-600 focus:ring-blue-500"
                  aria-label="输入框"
                />
                <span class="text-xs">Direct (Faster, better for text)</span>
              </label>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  id="input-3kwj04j3m"
                  type="radio"
                  v-model="pdfMethod"
                  value="html2canvas"
                  class="text-blue-600 focus:ring-blue-500"
                  aria-label="输入框"
                />
                <span class="text-xs">HTML Canvas (Slower, better for formatting)</span>
              </label>
            </div>
          </div>

          <!-- CSV Options -->
          <div
            v-if="options.format === 'csv'"
            class="ml-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
          >
            <label class="text-xs font-medium text-green-800 dark:text-green-200 mb-2 block"
              >CSV Export Options:</label
            >
            <div class="space-y-2">
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  id="input-uvxmruigl"
                  type="checkbox"
                  v-model="csvOptions.includeHeaders"
                  class="text-green-600 focus:ring-green-500"
                  aria-label="输入框"
                />
                <span class="text-xs">Include column headers</span>
              </label>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  id="input-rq3m5oprs"
                  type="checkbox"
                  v-model="csvOptions.flattenContent"
                  class="text-green-600 focus:ring-green-500"
                  aria-label="输入框"
                />
                <span class="text-xs">Flatten multiline content</span>
              </label>
              <div class="flex items-center space-x-2">
                <label class="text-xs text-green-700 dark:text-green-300">Format:</label>
                <select
                  v-model="csvFormat"
                  class="text-xs border rounded px-1 bg-white dark:bg-gray-700"
                >
                  <option value="csv">CSV (.csv)</option>
                  <option value="excel">Excel (.xlsx)</option>
                </select>
              </div>
            </div>
          </div>

          <!-- DOCX Options -->
          <div
            v-if="options.format === 'docx'"
            class="ml-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg"
          >
            <label class="text-xs font-medium text-purple-800 dark:text-purple-200 mb-2 block"
              >Word Document Options:</label
            >
            <div class="space-y-2">
              <div class="flex items-center space-x-2">
                <label class="text-xs text-purple-700 dark:text-purple-300">Template:</label>
                <select
                  v-model="docxTemplate"
                  class="text-xs border rounded px-1 bg-white dark:bg-gray-700"
                >
                  <option value="default">Default</option>
                  <option value="academic">Academic</option>
                  <option value="business">Business</option>
                  <option value="minimal">Minimal</option>
                </select>
              </div>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  id="input-cyj1e24pk"
                  type="checkbox"
                  v-model="docxOptions.includeTableOfContents"
                  class="text-purple-600 focus:ring-purple-500"
                  aria-label="输入框"
                />
                <span class="text-xs">Include table of contents</span>
              </label>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  id="input-q052t6cwd"
                  type="checkbox"
                  v-model="docxOptions.pageBreakBetweenChats"
                  class="text-purple-600 focus:ring-purple-500"
                  aria-label="输入框"
                />
                <span class="text-xs">Page break between chats</span>
              </label>
            </div>
          </div>

          <!-- ZIP Options -->
          <div
            v-if="options.format === 'zip'"
            class="ml-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg"
          >
            <label class="text-xs font-medium text-orange-800 dark:text-orange-200 mb-2 block"
              >ZIP Archive Options:</label
            >
            <div class="space-y-2">
              <div class="text-xs text-orange-700 dark:text-orange-300 mb-2">Include formats:</div>
              <div class="grid grid-cols-2 gap-1">
                <label class="flex items-center space-x-1 cursor-pointer">
                  <input
                    id="input-lfa9wnnkc"
                    type="checkbox"
                    v-model="zipFormats"
                    value="markdown"
                    class="text-orange-600 focus:ring-orange-500"
                    aria-label="输入框"
                  />
                  <span class="text-xs">Markdown</span>
                </label>
                <label class="flex items-center space-x-1 cursor-pointer">
                  <input
                    id="input-ajh9s22mc"
                    type="checkbox"
                    v-model="zipFormats"
                    value="html"
                    class="text-orange-600 focus:ring-orange-500"
                    aria-label="输入框"
                  />
                  <span class="text-xs">HTML</span>
                </label>
                <label class="flex items-center space-x-1 cursor-pointer">
                  <input
                    id="input-ol7gtvrld"
                    type="checkbox"
                    v-model="zipFormats"
                    value="json"
                    class="text-orange-600 focus:ring-orange-500"
                    aria-label="输入框"
                  />
                  <span class="text-xs">JSON</span>
                </label>
                <label class="flex items-center space-x-1 cursor-pointer">
                  <input
                    id="input-gze60hzbj"
                    type="checkbox"
                    v-model="zipFormats"
                    value="pdf"
                    class="text-orange-600 focus:ring-orange-500"
                    aria-label="输入框"
                  />
                  <span class="text-xs">PDF</span>
                </label>
              </div>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  id="input-s9tc6yj56"
                  type="checkbox"
                  v-model="zipOptions.createFolderStructure"
                  class="text-orange-600 focus:ring-orange-500"
                  aria-label="输入框"
                />
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
                id="input-s94q2b8hq"
                type="radio"
                v-model="exportScope"
                value="current"
                class="text-blue-600 focus:ring-blue-500"
                aria-label="输入框"
              />
              <span class="text-sm">Current conversation</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                id="input-ahhh8ndtg"
                type="radio"
                v-model="exportScope"
                value="all"
                class="text-blue-600 focus:ring-blue-500"
                aria-label="输入框"
              />
              <span class="text-sm">All conversations</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                id="input-zrizb8j3b"
                type="radio"
                v-model="exportScope"
                value="selected"
                class="text-blue-600 focus:ring-blue-500"
                aria-label="输入框"
              />
              <span class="text-sm">Selected conversations</span>
            </label>
          </div>
        </div>

        <!-- Chat Selection (when selected scope is chosen) -->
        <div v-if="exportScope === 'selected'" class="space-y-3">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300"
            >Select Conversations</label
          >
          <div
            class="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2 bg-gray-50 dark:bg-gray-700"
          >
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
                  id="input-w892u5hwo"
                  type="checkbox"
                  :value="chat.id"
                  v-model="selectedChatIds"
                  class="text-blue-600 focus:ring-blue-500"
                  aria-label="输入框"
                />
                <div class="flex-1 min-w-0">
                  <div class="font-medium truncate text-gray-900 dark:text-white">
                    {{ chat.title }}
                  </div>
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
              id="input-ps4qt76zo"
              type="checkbox"
              v-model="useTimeFilter"
              class="text-blue-600 focus:ring-blue-500"
              aria-label="输入框"
            />
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
              >Filter by date range</label
            >
          </div>
          <div v-if="useTimeFilter" class="grid grid-cols-2 gap-3">
            <div class="space-y-2">
              <label class="text-xs text-gray-500 dark:text-gray-400">From Date</label>
              <input
                id="input-kkkiv1tgj"
                type="date"
                v-model="dateFrom"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                aria-label="输入框"
              />
            </div>
            <div class="space-y-2">
              <label class="text-xs text-gray-500 dark:text-gray-400">To Date</label>
              <input
                id="input-jwt1iawh5"
                type="date"
                v-model="dateTo"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                aria-label="输入框"
              />
            </div>
          </div>
        </div>

        <!-- Export Options -->
        <div class="space-y-3">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Export Options</label>
          <div class="space-y-2">
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                id="input-itwz1s32m"
                type="checkbox"
                v-model="options.includeTimestamps"
                class="text-blue-600 focus:ring-blue-500"
                aria-label="输入框"
              />
              <span class="text-sm">Include timestamps</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                id="input-cmxnnkysy"
                type="checkbox"
                v-model="options.includeSystemMessages"
                class="text-blue-600 focus:ring-blue-500"
                aria-label="输入框"
              />
              <span class="text-sm">Include system messages</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                id="input-p6pygswsr"
                type="checkbox"
                v-model="options.includeMetadata"
                class="text-blue-600 focus:ring-blue-500"
                aria-label="输入框"
              />
              <span class="text-sm">Include metadata</span>
            </label>
          </div>
        </div>

        <!-- Custom Information -->
        <div class="space-y-3">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300"
            >Custom Information</label
          >
          <div class="space-y-3">
            <div class="space-y-2">
              <label class="text-xs text-gray-500 dark:text-gray-400">Export Title</label>
              <input
                id="input-blhkljoq9"
                type="text"
                v-model="options.title"
                placeholder="My Chat Export"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                aria-label="输入框"
              />
            </div>
            <div class="space-y-2">
              <label class="text-xs text-gray-500 dark:text-gray-400">Author</label>
              <input
                id="input-py3env5n2"
                type="text"
                v-model="options.author"
                placeholder="Your Name"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                aria-label="输入框"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Export Progress -->
      <div
        v-if="isExporting && exportProgress"
        class="px-6 py-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
      >
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{
              exportProgress.currentChat
            }}</span>
            <span class="text-sm text-gray-500 dark:text-gray-400"
              >{{ Math.round(exportProgress.progress) }}%</span
            >
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: exportProgress.progress + '%' }"
            />
          </div>
          <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Stage: {{ exportProgress.stage }}</span>
            <span
              >{{ exportProgress.processedMessages }}/{{
                exportProgress.totalMessages
              }}
              messages</span
            >
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-6 border-t dark:border-gray-700">
        <!-- Queue Status -->
        <div
          v-if="queueStats.total > 0"
          class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
        >
          <div class="flex items-center justify-between">
            <div class="text-sm text-blue-800 dark:text-blue-200">
              Export Queue: {{ queueStats.pending }} pending, {{ queueStats.running }} running,
              {{ queueStats.completed }} completed
            </div>
            <button
              @click="showQueueDialog = true"
              class="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              aria-label="按钮"
            >
              Manage Queue
            </button>
          </div>
        </div>

        <div class="flex justify-between items-center">
          <button
            @click="showAdvancedDialog = true"
            class="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-800/30 rounded-lg transition-colors flex items-center space-x-2"
            aria-label="按钮"
          >
            <Settings class="w-4 h-4" />
            <span>Advanced Options</span>
          </button>

          <div class="flex space-x-3">
            <button
              @click="$emit('update:open', false)"
              :disabled="isExporting"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
              aria-label="按钮"
            >
              Cancel
            </button>
            <button
              @click="addToQueue"
              :disabled="!canExport"
              class="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
              aria-label="按钮"
            >
              <Plus class="w-4 h-4" />
              <span>Add to Queue</span>
            </button>
            <button
              @click="handleExport"
              :disabled="isExporting || !canExport"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
              aria-label="按钮"
            >
              <div
                v-if="isExporting"
                class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
              />
              <span>{{ isExporting ? 'Exporting...' : 'Export Now' }}</span>
            </button>
          </div>
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
          <span class="font-medium text-gray-700 dark:text-gray-300">Messages:</span>
          <span class="ml-2 text-gray-600 dark:text-gray-400">{{ exportResult.messageCount }}</span>
        </div>
        <div class="text-sm">
          <span class="font-medium text-gray-700 dark:text-gray-300">Conversations:</span>
          <span class="ml-2 text-gray-600 dark:text-gray-400">{{ exportResult.chatCount }}</span>
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
          aria-label="按钮"
        >
          Close
        </button>
      </div>
    </div>
  </div>

  <!-- Export Error Dialog -->
  <ExportErrorDialog v-model:open="showErrorDialog" :error="exportError" @retry="retryExport" />

  <!-- Advanced Export Dialog -->
  <AdvancedExportDialog v-model:open="showAdvancedDialog" :current-chat-id="currentChatId" />

  <!-- Export Queue Dialog -->
  <ExportQueueDialog v-model:open="showQueueDialog" />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Settings, Plus } from 'lucide-vue-next'
import {
  exportService,
  type ExportOptions,
  type ExportResult,
  type ExportProgress
} from '@renderer/src/services/export/ExportService'
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
      dateTo:
        useTimeFilter.value && dateTo.value ? new Date(dateTo.value + 'T23:59:59') : undefined,
      pdfOptions:
        options.value.format === 'pdf'
          ? {
              method: pdfMethod.value,
              theme: 'light',
              fontSize: 'medium',
              pageOrientation: 'portrait',
              margins: { top: 72, right: 72, bottom: 72, left: 72 },
              includePageNumbers: true,
              includeHeader: true,
              includeFooter: true
            }
          : undefined,
      csvOptions:
        options.value.format === 'csv'
          ? {
              delimiter: ',',
              includeHeaders: csvOptions.value.includeHeaders,
              encoding: 'utf-8',
              flattenContent: csvOptions.value.flattenContent
            }
          : undefined,
      docxOptions:
        options.value.format === 'docx'
          ? {
              template: docxTemplate.value,
              fontSize: 22,
              fontFamily: 'Calibri',
              includeTableOfContents: docxOptions.value.includeTableOfContents,
              pageBreakBetweenChats: docxOptions.value.pageBreakBetweenChats
            }
          : undefined,
      zipOptions:
        options.value.format === 'zip'
          ? {
              compression: 'best',
              includeFormats: zipFormats.value as any[],
              separateFilePerChat: false,
              createFolderStructure: zipOptions.value.createFolderStructure
            }
          : undefined
    }

    // Handle CSV vs Excel format selection
    if (options.value.format === 'csv' && csvFormat.value === 'excel') {
      // Override format for Excel export
      exportOptions.format = 'csv' // Will be handled by CSVExporter.exportToExcel
      exportOptions.csvOptions = {
        ...exportOptions.csvOptions!,
        delimiter: ',' // Excel will ignore delimiter but keep for consistency
      }
    }

    // For Excel format, we'll modify the filename after export
    const result = await exportService.exportChats(exportOptions, progress => {
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
    pdfOptions:
      options.value.format === 'pdf'
        ? {
            method: pdfMethod.value,
            theme: 'light',
            fontSize: 'medium',
            pageOrientation: 'portrait',
            margins: { top: 72, right: 72, bottom: 72, left: 72 },
            includePageNumbers: true,
            includeHeader: true,
            includeFooter: true
          }
        : undefined,
    csvOptions:
      options.value.format === 'csv'
        ? {
            delimiter: ',',
            includeHeaders: csvOptions.value.includeHeaders,
            encoding: 'utf-8',
            flattenContent: csvOptions.value.flattenContent
          }
        : undefined,
    docxOptions:
      options.value.format === 'docx'
        ? {
            template: docxTemplate.value,
            fontSize: 22,
            fontFamily: 'Calibri',
            includeTableOfContents: docxOptions.value.includeTableOfContents,
            pageBreakBetweenChats: docxOptions.value.pageBreakBetweenChats
          }
        : undefined,
    zipOptions:
      options.value.format === 'zip'
        ? {
            compression: 'best',
            includeFormats: zipFormats.value as any[],
            separateFilePerChat: false,
            createFolderStructure: zipOptions.value.createFolderStructure
          }
        : undefined
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

// Update queue statistics
const updateQueueStats = () => {
  queueStats.value = exportQueue.getStats()
}

// Watch for scope changes
watch(exportScope, newScope => {
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
  exportQueue.setTaskCallback(async task => {
    return await exportService.exportChats(task.options)
  })

  exportQueue.addStatusCallback(updateQueueStats)
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
.container-sm {
  max-width: var(--breakpoint-sm);
}
.container-md {
  max-width: var(--breakpoint-md);
}
.container-lg {
  max-width: var(--breakpoint-lg);
}
.container-xl {
  max-width: var(--breakpoint-xl);
}

/* 响应式显示 */
.hidden-sm {
  display: none;
}
.hidden-md {
  display: none;
}
.hidden-lg {
  display: none;
}

@media (min-width: 640px) {
  .hidden-sm {
    display: block;
  }
}

@media (min-width: 768px) {
  .hidden-md {
    display: block;
  }
}

@media (min-width: 1024px) {
  .hidden-lg {
    display: block;
  }
}

/* 响应式文本 */
.text-responsive-sm {
  font-size: clamp(0.875rem, 2vw, 1rem);
}
.text-responsive-base {
  font-size: clamp(1rem, 2.5vw, 1.125rem);
}
.text-responsive-lg {
  font-size: clamp(1.125rem, 3vw, 1.25rem);
}
.text-responsive-xl {
  font-size: clamp(1.25rem, 3.5vw, 1.5rem);
}

/* 响应式间距 */
.space-responsive-sm {
  gap: clamp(0.5rem, 2vw, 1rem);
}
.space-responsive-md {
  gap: clamp(1rem, 3vw, 1.5rem);
}
.space-responsive-lg {
  gap: clamp(1.5rem, 4vw, 2rem);
}

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
  .flex-col-mobile {
    flex-direction: column;
  }
  .grid-1-mobile {
    grid-template-columns: 1fr;
  }
  .gap-2-mobile {
    gap: var(--space-2);
  }
  .p-4-mobile {
    padding: var(--space-4);
  }
}

@media (max-width: 768px) {
  .flex-col-tablet {
    flex-direction: column;
  }
  .grid-2-tablet {
    grid-template-columns: repeat(2, 1fr);
  }
  .gap-4-tablet {
    gap: var(--space-4);
  }
  .p-6-tablet {
    padding: var(--space-6);
  }
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

.grid-cols-2 {
  grid-template-columns: repeat(2, 1fr);
}
.grid-cols-3 {
  grid-template-columns: repeat(3, 1fr);
}
.grid-cols-4 {
  grid-template-columns: repeat(4, 1fr);
}

.grid-gap-2 {
  gap: var(--space-2);
}
.grid-gap-4 {
  gap: var(--space-4);
}
.grid-gap-6 {
  gap: var(--space-6);
}

/* 🎨 卡片布局 */
.card {
  background: white;
  border-radius: 12px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.06);
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.card:hover {
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.1),
    0 2px 4px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.card-interactive:hover {
  cursor: pointer;
  transform: translateY(-2px);
  box-shadow:
    0 10px 25px rgba(0, 0, 0, 0.15),
    0 4px 10px rgba(0, 0, 0, 0.1);
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

  .hidden-mobile {
    display: none;
  }
  .flex-mobile-col {
    flex-direction: column;
  }
  .grid-mobile-1 {
    grid-template-columns: 1fr;
  }
}

/* 🎨 完整间距系统 - 基于4px网格 */
:root {
  --space-0: 0;
  --space-1: 0.25rem; /* 4px */
  --space-2: 0.5rem; /* 8px */
  --space-3: 0.75rem; /* 12px */
  --space-4: 1rem; /* 16px */
  --space-5: 1.25rem; /* 20px */
  --space-6: 1.5rem; /* 24px */
  --space-8: 2rem; /* 32px */
  --space-10: 2.5rem; /* 40px */
  --space-12: 3rem; /* 48px */
  --space-16: 4rem; /* 64px */
  --space-20: 5rem; /* 80px */
  --space-24: 6rem; /* 96px */
  --space-32: 8rem; /* 128px */

  /* 负间距 */
  --space-neg-1: -0.25rem;
  --space-neg-2: -0.5rem;
  --space-neg-4: -1rem;
}

/* 🎨 间距实用类 */
.m-1 {
  margin: var(--space-1);
}
.m-2 {
  margin: var(--space-2);
}
.m-3 {
  margin: var(--space-3);
}
.m-4 {
  margin: var(--space-4);
}
.m-6 {
  margin: var(--space-6);
}
.m-8 {
  margin: var(--space-8);
}

.p-1 {
  padding: var(--space-1);
}
.p-2 {
  padding: var(--space-2);
}
.p-3 {
  padding: var(--space-3);
}
.p-4 {
  padding: var(--space-4);
}
.p-6 {
  padding: var(--space-6);
}
.p-8 {
  padding: var(--space-8);
}

.mx-auto {
  margin-left: auto;
  margin-right: auto;
}
.my-auto {
  margin-top: auto;
  margin-bottom: auto;
}

.px-1 {
  padding-left: var(--space-1);
  padding-right: var(--space-1);
}
.px-2 {
  padding-left: var(--space-2);
  padding-right: var(--space-2);
}
.px-3 {
  padding-left: var(--space-3);
  padding-right: var(--space-3);
}
.px-4 {
  padding-left: var(--space-4);
  padding-right: var(--space-4);
}
.px-6 {
  padding-left: var(--space-6);
  padding-right: var(--space-6);
}

.py-1 {
  padding-top: var(--space-1);
  padding-bottom: var(--space-1);
}
.py-2 {
  padding-top: var(--space-2);
  padding-bottom: var(--space-2);
}
.py-3 {
  padding-top: var(--space-3);
  padding-bottom: var(--space-3);
}
.py-4 {
  padding-top: var(--space-4);
  padding-bottom: var(--space-4);
}
.py-6 {
  padding-top: var(--space-6);
  padding-bottom: var(--space-6);
}

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

.stack-sm > * + * {
  margin-top: var(--space-2);
}
.stack-md > * + * {
  margin-top: var(--space-4);
}
.stack-lg > * + * {
  margin-top: var(--space-6);
}
.stack-xl > * + * {
  margin-top: var(--space-8);
}

.inline-sm > * + * {
  margin-left: var(--space-2);
}
.inline-md > * + * {
  margin-left: var(--space-4);
}
.inline-lg > * + * {
  margin-left: var(--space-6);
}

/* 🎨 完整字体系统 */
:root {
  /* 字体族 */
  --font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', 'Source Code Pro', monospace;

  /* 字体大小 - 基于1.25的倍数比例 */
  --font-size-xs: 0.75rem; /* 12px */
  --font-size-sm: 0.875rem; /* 14px */
  --font-size-base: 1rem; /* 16px */
  --font-size-lg: 1.125rem; /* 18px */
  --font-size-xl: 1.25rem; /* 20px */
  --font-size-2xl: 1.5rem; /* 24px */
  --font-size-3xl: 1.875rem; /* 30px */
  --font-size-4xl: 2.25rem; /* 36px */
  --font-size-5xl: 3rem; /* 48px */

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
.font-sans {
  font-family: var(--font-family-sans);
}
.font-mono {
  font-family: var(--font-family-mono);
}

.text-xs {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-tight);
}
.text-sm {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-snug);
}
.text-base {
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
}
.text-lg {
  font-size: var(--font-size-lg);
  line-height: var(--line-height-relaxed);
}
.text-xl {
  font-size: var(--font-size-xl);
  line-height: var(--line-height-relaxed);
}
.text-2xl {
  font-size: var(--font-size-2xl);
  line-height: var(--line-height-loose);
}
.text-3xl {
  font-size: var(--font-size-3xl);
  line-height: var(--line-height-loose);
}

.font-thin {
  font-weight: var(--font-weight-thin);
}
.font-light {
  font-weight: var(--font-weight-light);
}
.font-normal {
  font-weight: var(--font-weight-normal);
}
.font-medium {
  font-weight: var(--font-weight-medium);
}
.font-semibold {
  font-weight: var(--font-weight-semibold);
}
.font-bold {
  font-weight: var(--font-weight-bold);
}

.leading-tight {
  line-height: var(--line-height-tight);
}
.leading-snug {
  line-height: var(--line-height-snug);
}
.leading-normal {
  line-height: var(--line-height-normal);
}
.leading-relaxed {
  line-height: var(--line-height-relaxed);
}

.tracking-tight {
  letter-spacing: var(--letter-spacing-tight);
}
.tracking-normal {
  letter-spacing: var(--letter-spacing-normal);
}
.tracking-wide {
  letter-spacing: var(--letter-spacing-wide);
}

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
.text-primary {
  color: var(--color-primary);
}
.text-success {
  color: var(--color-success);
}
.text-warning {
  color: var(--color-warning);
}
.text-error {
  color: var(--color-error);
}
.text-gray-500 {
  color: var(--color-gray-500);
}
.text-gray-600 {
  color: var(--color-gray-600);
}
.text-gray-700 {
  color: var(--color-gray-700);
}

.bg-primary {
  background-color: var(--color-primary);
}
.bg-primary-hover:hover {
  background-color: var(--color-primary-hover);
}
.bg-success {
  background-color: var(--color-success);
}
.bg-warning {
  background-color: var(--color-warning);
}
.bg-error {
  background-color: var(--color-error);
}

.border-primary {
  border-color: var(--color-primary);
}
.border-success {
  border-color: var(--color-success);
}
.border-error {
  border-color: var(--color-error);
}

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
/* Custom styles for better dark mode support */
input[type='radio']:checked {
  background-color: hsl(217 91% 60%);
}

input[type='checkbox']:checked {
  background-color: hsl(217 91% 60%);
}

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
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
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
  background-image: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  background-size: 200% 100%;
  animation: loading-shimmer 1.5s infinite;
}

@keyframes loading-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
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
}
</style>
