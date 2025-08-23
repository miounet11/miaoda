<template>
  <div
    v-if="open"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click="handleBackdropClick"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      @click.stop
    >
      <!-- Header -->
      <div class="p-6 border-b dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Export Queue Manager</h2>
            <p class="text-gray-600 dark:text-gray-300 mt-2">Manage your export tasks</p>
          </div>
          <button
            @click="$emit('update:open', false)"
            class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
          >
            <X class="w-6 h-6" />
          </button>
        </div>

        <!-- Queue Stats -->
        <div class="flex items-center justify-between mt-4">
          <div class="flex items-center space-x-6 text-sm">
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 bg-gray-400 rounded-full" />
              <span class="text-gray-600 dark:text-gray-400">Total: {{ queueStats.total }}</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 bg-yellow-400 rounded-full" />
              <span class="text-gray-600 dark:text-gray-400"
                >Pending: {{ queueStats.pending }}</span
              >
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
              <span class="text-gray-600 dark:text-gray-400"
                >Running: {{ queueStats.running }}</span
              >
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 bg-green-400 rounded-full" />
              <span class="text-gray-600 dark:text-gray-400"
                >Completed: {{ queueStats.completed }}</span
              >
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 bg-red-400 rounded-full" />
              <span class="text-gray-600 dark:text-gray-400">Failed: {{ queueStats.failed }}</span>
            </div>
          </div>

          <div class="flex items-center space-x-2">
            <button
              @click="clearCompleted"
              :disabled="queueStats.completed === 0"
              class="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
            >
              Clear Completed
            </button>
            <button
              @click="pauseQueue"
              :disabled="queueStats.running === 0 && queueStats.pending === 0"
              class="px-3 py-1 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {{ isProcessing ? 'Pause Queue' : 'Resume Queue' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Task List -->
      <div class="flex-1 overflow-y-auto">
        <div
          v-if="tasks.length === 0"
          class="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400"
        >
          <ClipboardList class="w-16 h-16 mb-4 opacity-50" />
          <h3 class="text-lg font-medium mb-2">No Export Tasks</h3>
          <p class="text-sm">Export tasks will appear here when you add them to the queue</p>
        </div>

        <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
          <div
            v-for="task in tasks"
            :key="task.id"
            class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <div class="flex items-center space-x-3">
                  <div
                    :class="[
                      'w-3 h-3 rounded-full flex-shrink-0',
                      getStatusColor(task.status),
                      task.status === 'running' ? 'animate-pulse' : ''
                    ]"
                  />
                  <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {{ task.name }}
                    </h4>
                    <div class="flex items-center space-x-4 mt-1">
                      <span class="text-xs text-gray-500 dark:text-gray-400">
                        {{ formatTaskStatus(task) }}
                      </span>
                      <span class="text-xs text-gray-500 dark:text-gray-400">
                        {{ formatDate(task.createdAt) }}
                      </span>
                      <span
                        v-if="task.priority !== 'normal'"
                        :class="[
                          'px-2 py-0.5 text-xs font-medium rounded-full',
                          task.priority === 'high'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        ]"
                      >
                        {{ task.priority }} priority
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Progress Bar -->
                <div v-if="task.status === 'running' && task.progress > 0" class="mt-3">
                  <div
                    class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1"
                  >
                    <span>Progress</span>
                    <span>{{ task.progress }}%</span>
                  </div>
                  <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      :style="{ width: task.progress + '%' }"
                    />
                  </div>
                </div>

                <!-- Error Message -->
                <div
                  v-if="task.error"
                  class="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                >
                  <div class="flex items-start space-x-2">
                    <AlertCircle class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 class="text-sm font-medium text-red-800 dark:text-red-200">
                        Export Failed
                      </h5>
                      <p class="text-sm text-red-700 dark:text-red-300 mt-1">{{ task.error }}</p>
                    </div>
                  </div>
                </div>

                <!-- Completed Result -->
                <div
                  v-if="task.status === 'completed' && task.result"
                  class="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <h5 class="text-sm font-medium text-green-800 dark:text-green-200">
                        Export Completed
                      </h5>
                      <div class="text-sm text-green-700 dark:text-green-300 mt-1">
                        {{ task.result.filename }} • {{ formatFileSize(task.result.size) }}
                      </div>
                    </div>
                    <button
                      @click="downloadResult(task)"
                      class="px-3 py-1 text-sm font-medium text-green-800 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-800/30 rounded-lg transition-colors"
                    >
                      <Download class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex items-center space-x-2 ml-4">
                <button
                  v-if="task.status === 'failed' && task.retryCount < task.maxRetries"
                  @click="retryTask(task.id)"
                  class="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                  title="Retry"
                >
                  <RotateCw class="w-4 h-4" />
                </button>

                <button
                  v-if="task.status === 'pending' || task.status === 'running'"
                  @click="cancelTask(task.id)"
                  class="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Cancel"
                >
                  <X class="w-4 h-4" />
                </button>

                <button
                  @click="removeTask(task.id)"
                  class="p-2 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Remove"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div class="flex items-center space-x-4">
            <span>Queue processing: {{ isProcessing ? 'Active' : 'Paused' }}</span>
            <span v-if="estimatedTime > 0">ETA: {{ formatTime(estimatedTime) }}</span>
          </div>
          <div class="flex items-center space-x-2">
            <span>Concurrency:</span>
            <select
              v-model="concurrency"
              @change="updateConcurrency"
              class="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
            >
              <option :value="1">1</option>
              <option :value="2">2</option>
              <option :value="3">3</option>
              <option :value="4">4</option>
              <option :value="5">5</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { X, ClipboardList, AlertCircle, Download, RotateCw, Trash2 } from 'lucide-vue-next'
import {
  exportQueue,
  type ExportTask,
  type QueueStats
} from '@renderer/src/services/export/ExportQueue'
import { exportService } from '@renderer/src/services/export/ExportService'

interface Props {
  open: boolean
}

interface Emits {
  (e: 'update:open', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const tasks = ref<ExportTask[]>([])
const queueStats = ref<QueueStats>({
  total: 0,
  pending: 0,
  running: 0,
  completed: 0,
  failed: 0,
  cancelled: 0
})
const concurrency = ref(2)

// Computed
const isProcessing = computed(() => exportQueue.getIsProcessing())
const estimatedTime = computed(() => exportQueue.getEstimatedCompletionTime())

// Methods
const handleBackdropClick = () => {
  emit('update:open', false)
}

const updateQueueData = () => {
  tasks.value = exportQueue.getAllTasks()
  queueStats.value = exportQueue.getStats()
}

const clearCompleted = () => {
  const count = exportQueue.clearCompleted()
  console.log(`Cleared ${count} completed tasks`)
  updateQueueData()
}

const pauseQueue = () => {
  // In a real implementation, you'd have pause/resume functionality
  console.log('Queue pause/resume not implemented yet')
}

const retryTask = (taskId: string) => {
  exportQueue.retryTask(taskId)
  updateQueueData()
}

const cancelTask = (taskId: string) => {
  exportQueue.cancelTask(taskId)
  updateQueueData()
}

const removeTask = (taskId: string) => {
  exportQueue.removeTask(taskId)
  updateQueueData()
}

const updateConcurrency = () => {
  exportQueue.setMaxConcurrency(concurrency.value)
}

const downloadResult = (task: ExportTask) => {
  if (task.result) {
    exportService.downloadFile(task.result)
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-400'
    case 'running':
      return 'bg-blue-400'
    case 'completed':
      return 'bg-green-400'
    case 'failed':
      return 'bg-red-400'
    case 'cancelled':
      return 'bg-gray-400'
    default:
      return 'bg-gray-400'
  }
}

const formatTaskStatus = (task: ExportTask) => {
  switch (task.status) {
    case 'pending':
      return 'Waiting in queue'
    case 'running':
      return 'Processing...'
    case 'completed':
      return `Completed in ${
        task.completedAt && task.startedAt
          ? Math.round((task.completedAt.getTime() - task.startedAt.getTime()) / 1000)
          : 0
      }s`
    case 'failed':
      return `Failed (${task.retryCount}/${task.maxRetries} retries)`
    case 'cancelled':
      return 'Cancelled'
    default:
      return task.status
  }
}

const formatDate = (date: Date) => {
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffTime / (1000 * 60))
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
}

const formatTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Status update callback
const handleStatusUpdate = (task: ExportTask) => {
  updateQueueData()
}

// Lifecycle
onMounted(() => {
  updateQueueData()

  // Set up task execution callback
  exportQueue.setTaskCallback(async task => {
    return await exportService.exportChats(task.options)
  })

  // Listen for status updates
  exportQueue.addStatusCallback(handleStatusUpdate)
})

onUnmounted(() => {
  exportQueue.removeStatusCallback(handleStatusUpdate)
})
</script>
