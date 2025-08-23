<template>
  <div
    v-if="isQuickSearchOpen"
    class="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black bg-opacity-25 backdrop-blur-sm"
    @click.self="closeQuickSearch"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[70vh] overflow-hidden"
    >
      <!-- Search Input -->
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              class="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            placeholder="Search messages..."
            class="w-full pl-10 pr-4 py-3 border border-transparent rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800"
            @keydown="handleKeydown"
          />
        </div>
      </div>

      <!-- Search Results -->
      <div v-if="searchResults.length > 0" class="max-h-96 overflow-y-auto">
        <div class="py-2">
          <div
            v-for="(result, index) in searchResults"
            :key="`${result.message.id}-${index}`"
            :class="[
              'px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700',
              selectedIndex === index ? 'bg-blue-50 dark:bg-blue-900/20' : ''
            ]"
            @click="selectResult(result)"
          >
            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0">
                <div
                  :class="[
                    'w-2 h-2 rounded-full mt-2',
                    result.message.role === 'user' ? 'bg-blue-500' : 'bg-green-500'
                  ]"
                />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {{ result.chat.title }}
                  </p>
                  <span class="text-xs text-gray-500 dark:text-gray-400">
                    {{ formatDate(result.message.timestamp || result.message.createdAt) }}
                  </span>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mt-1">
                  {{ highlightMatch(result.message.content || '', searchQuery) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="searchQuery.trim() && !isSearching"
        class="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
      >
        <svg
          class="mx-auto h-12 w-12 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.469-.784-6.171-2.083A7.963 7.963 0 014.875 10.5M12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9-9 4.03 9 9z"
          />
        </svg>
        <p>No messages found for "{{ searchQuery }}"</p>
      </div>

      <!-- Help Text -->
      <div
        v-if="!searchQuery.trim()"
        class="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
      >
        <svg
          class="mx-auto h-12 w-12 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <p class="text-lg font-medium mb-2">Search Messages</p>
        <p class="text-sm">Type to search across all your conversations</p>
      </div>

      <!-- Footer -->
      <div
        class="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50"
      >
        <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div class="flex items-center space-x-4">
            <span> <kbd class="shortcut-key">↑↓</kbd> to navigate </span>
            <span> <kbd class="shortcut-key">Enter</kbd> to select </span>
          </div>
          <span> <kbd class="shortcut-key">Escape</kbd> to close </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useUIStore } from '@renderer/src/stores/ui'
import { useChatStore } from '@renderer/src/stores/chat'
import type { Message, Chat } from '@renderer/src/types'

const uiStore = useUIStore()
const chatsStore = useChatStore()

const searchInputRef = ref<HTMLInputElement>()
const searchQuery = ref('')
const selectedIndex = ref(0)
const isSearching = ref(false)

const isQuickSearchOpen = computed(() => uiStore.isModalOpen('quickSearch'))

const searchResults = computed(() => {
  if (!searchQuery.value.trim()) return []

  // Basic search implementation
  const results: { message: Message; chat: Chat }[] = []
  const query = searchQuery.value.toLowerCase()

  for (const chat of chatsStore.chats) {
    for (const message of chat.messages) {
      if (message.content?.toLowerCase().includes(query)) {
        results.push({ message, chat })
      }
    }
  }

  return results.slice(0, 20) // Limit to 20 results
})

const closeQuickSearch = () => {
  uiStore.closeModal('quickSearch')
  searchQuery.value = ''
  selectedIndex.value = 0
}

const selectResult = async (result: { message: Message; chat: Chat }) => {
  await chatsStore.selectChat(result.chat.id)
  closeQuickSearch()
}

const handleKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, searchResults.value.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
      break
    case 'Enter':
      event.preventDefault()
      if (searchResults.value[selectedIndex.value]) {
        selectResult(searchResults.value[selectedIndex.value])
      }
      break
    case 'Escape':
      event.preventDefault()
      closeQuickSearch()
      break
  }
}

const highlightMatch = (text: string, query: string): string => {
  if (!query.trim()) return text

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    return d.toLocaleDateString()
  }
}

// Focus search input when modal opens
watch(isQuickSearchOpen, async isOpen => {
  if (isOpen) {
    await nextTick()
    searchInputRef.value?.focus()
    selectedIndex.value = 0
  }
})

// Reset selected index when search results change
watch(searchResults, () => {
  selectedIndex.value = 0
})
</script>

<style scoped>
.shortcut-key {
  @apply px-1.5 py-0.5 text-xs font-mono font-medium text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

:deep(mark) {
  @apply bg-yellow-200 dark:bg-yellow-900 text-gray-900 dark:text-gray-100;
}
</style>
