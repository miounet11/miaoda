<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Export Scope</h3>
      <div class="space-y-3">
        <label class="flex items-center space-x-3 cursor-pointer">
          <input
            type="radio"
            value="current"
            v-model="scope"
            class="w-4 h-4 text-blue-600 focus:ring-blue-500"
          />
          <span class="text-sm text-gray-700 dark:text-gray-300">Current conversation only</span>
        </label>
        <label class="flex items-center space-x-3 cursor-pointer">
          <input
            type="radio"
            value="selected"
            v-model="scope"
            class="w-4 h-4 text-blue-600 focus:ring-blue-500"
          />
          <span class="text-sm text-gray-700 dark:text-gray-300">Selected conversations</span>
        </label>
        <label class="flex items-center space-x-3 cursor-pointer">
          <input
            type="radio"
            value="all"
            v-model="scope"
            class="w-4 h-4 text-blue-600 focus:ring-blue-500"
          />
          <span class="text-sm text-gray-700 dark:text-gray-300">All conversations</span>
        </label>
        <label class="flex items-center space-x-3 cursor-pointer">
          <input
            type="radio"
            value="filtered"
            v-model="scope"
            class="w-4 h-4 text-blue-600 focus:ring-blue-500"
          />
          <span class="text-sm text-gray-700 dark:text-gray-300">Filtered conversations</span>
        </label>
      </div>
    </div>

    <!-- Chat Selection -->
    <div v-if="scope === 'selected'" class="space-y-3">
      <div class="flex items-center justify-between">
        <h4 class="text-md font-semibold text-gray-900 dark:text-white">Select Conversations</h4>
        <div class="flex space-x-2">
          <button
            @click="selectAll"
            class="px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
          >
            Select All
          </button>
          <button
            @click="selectNone"
            class="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
          >
            Select None
          </button>
        </div>
      </div>

      <div class="max-h-64 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg">
        <div v-if="loadingChats" class="flex items-center justify-center py-8">
          <div class="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <div
              class="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"
            />
            <span class="text-sm">Loading conversations...</span>
          </div>
        </div>

        <div
          v-else-if="available.length === 0"
          class="text-center py-8 text-gray-500 dark:text-gray-400"
        >
          <MessageCircle class="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p class="text-sm">No conversations available</p>
        </div>

        <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
          <label
            v-for="chat in available"
            :key="chat.id"
            class="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
          >
            <input
              type="checkbox"
              :value="chat.id"
              v-model="selected"
              class="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white truncate">
                {{ chat.title || 'Untitled Conversation' }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                <span>{{ formatDate(chat.updated_at) }}</span>
                <span>•</span>
                <span>{{ chat.messageCount || 0 }} messages</span>
              </div>
            </div>
          </label>
        </div>
      </div>

      <div class="text-xs text-gray-500 dark:text-gray-400 text-center">
        {{ selected.length }} of {{ available.length }} conversation(s) selected
      </div>
    </div>

    <!-- Filtered Options -->
    <div v-if="scope === 'filtered'" class="space-y-4">
      <div
        class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
      >
        <div class="flex items-start space-x-3">
          <Info class="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
              Filtered Export
            </h4>
            <p class="text-sm text-blue-700 dark:text-blue-300">
              Conversations will be filtered based on the time range and tags you specify below.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h5 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Filter Criteria</h5>
        <div class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <div v-if="hasTimeFilter">📅 Time range filter active</div>
          <div v-if="hasTagFilter">🏷️ Tag filter active</div>
          <div v-if="!hasTimeFilter && !hasTagFilter" class="text-yellow-600 dark:text-yellow-400">
            ⚠️ No filters set - will export all conversations
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { MessageCircle, Info } from 'lucide-vue-next'
import type { ChatRecord } from '@renderer/src/types'

interface Props {
  scope: 'current' | 'all' | 'selected' | 'filtered'
  selected: string[]
  available: ChatRecord[]
}

interface Emits {
  (e: 'update:scope', value: 'current' | 'all' | 'selected' | 'filtered'): void
  (e: 'update:selected', value: string[]): void
  (e: 'update:available', value: ChatRecord[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const loadingChats = ref(false)

// Computed
const hasTimeFilter = computed(() => {
  // This would be connected to parent time filter state
  return false // Placeholder
})

const hasTagFilter = computed(() => {
  // This would be connected to parent tag filter state
  return false // Placeholder
})

// Methods
const selectAll = () => {
  emit(
    'update:selected',
    props.available.map(chat => chat.id)
  )
}

const selectNone = () => {
  emit('update:selected', [])
}

const loadAvailableChats = async () => {
  if (loadingChats.value) return

  try {
    loadingChats.value = true
    // In a real implementation, this would call the API
    const chats = (await window.api?.export?.getAllChats?.()) || []
    emit('update:available', chats)
  } catch (error) {
    console.error('Failed to load chats:', error)
  } finally {
    loadingChats.value = false
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return 'Today'
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return weekdays[date.getDay()]
  } else if (diffDays < 365) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  } else {
    return date.toLocaleDateString([], { year: 'numeric', month: 'short' })
  }
}

// Watchers
watch(
  () => props.scope,
  newScope => {
    if (newScope === 'selected' && props.available.length === 0) {
      loadAvailableChats()
    }
  }
)

// Initialize
onMounted(() => {
  if (props.scope === 'selected') {
    loadAvailableChats()
  }
})
</script>
