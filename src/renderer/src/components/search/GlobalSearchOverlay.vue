<template>
  <Transition
    enter-active-class="transition-all duration-200 ease-out"
    leave-active-class="transition-all duration-150 ease-in"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div v-if="isOpen" class="fixed inset-0 z-50 overflow-hidden" @click="handleBackdropClick">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <!-- Search Modal -->
      <div class="relative flex items-start justify-center min-h-screen pt-[10vh] px-4">
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          leave-active-class="transition-all duration-150 ease-in"
          enter-from-class="opacity-0 scale-95 translate-y-4"
          leave-to-class="opacity-0 scale-95 translate-y-4"
        >
          <div
            v-if="isOpen"
            class="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden"
            @click.stop
          >
            <!-- Search Header -->
            <div class="relative">
              <div class="flex items-center p-4 border-b dark:border-gray-700">
                <Search class="w-5 h-5 text-gray-400 absolute left-6" />
                <input
                  ref="searchInput"
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search messages, chats, or commands..."
                  class="w-full pl-12 pr-4 py-2 bg-transparent text-lg focus:outline-none"
                  @keydown.enter="performSearch"
                  @keydown.esc="closeSearch"
                  @keydown.down.prevent="navigateResults(1)"
                  @keydown.up.prevent="navigateResults(-1)"
                />
                <div class="flex items-center gap-2 ml-4">
                  <!-- Search Options -->
                  <button
                    @click="toggleOptions"
                    class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    :class="{ 'bg-gray-100 dark:bg-gray-700': showOptions }"
                  >
                    <Settings2 class="w-4 h-4 text-gray-500" />
                  </button>
                  <!-- Close Button -->
                  <button
                    @click="closeSearch"
                    class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X class="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              <!-- Search Options Panel -->
              <Transition
                enter-active-class="transition-all duration-200 ease-out"
                leave-active-class="transition-all duration-150 ease-in"
                enter-from-class="opacity-0 -translate-y-2"
                leave-to-class="opacity-0 -translate-y-2"
              >
                <div
                  v-if="showOptions"
                  class="absolute top-full left-0 right-0 bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700 p-4 shadow-lg z-10"
                >
                  <div class="grid grid-cols-2 gap-4">
                    <!-- Search Scope -->
                    <div>
                      <label
                        class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block"
                      >
                        Search Scope
                      </label>
                      <div class="space-y-2">
                        <label class="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            v-model="searchOptions.scope"
                            value="all"
                            class="text-blue-600 focus:ring-blue-500"
                          />
                          <span class="text-sm">All Messages</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            v-model="searchOptions.scope"
                            value="current"
                            class="text-blue-600 focus:ring-blue-500"
                          />
                          <span class="text-sm">Current Chat</span>
                        </label>
                      </div>
                    </div>

                    <!-- Search Filters -->
                    <div>
                      <label
                        class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block"
                      >
                        Message Type
                      </label>
                      <div class="space-y-2">
                        <label class="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            v-model="searchOptions.includeUser"
                            class="text-blue-600 focus:ring-blue-500 rounded"
                          />
                          <span class="text-sm">User Messages</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            v-model="searchOptions.includeAssistant"
                            class="text-blue-600 focus:ring-blue-500 rounded"
                          />
                          <span class="text-sm">Assistant Messages</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <!-- Date Range -->
                  <div class="mt-4 pt-4 border-t dark:border-gray-700">
                    <label class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                      Date Range
                    </label>
                    <div class="flex gap-2">
                      <input
                        type="date"
                        v-model="searchOptions.dateFrom"
                        class="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
                      />
                      <span class="text-gray-500 self-center">to</span>
                      <input
                        type="date"
                        v-model="searchOptions.dateTo"
                        class="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
                      />
                    </div>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- Search Results -->
            <div class="relative max-h-[60vh] overflow-y-auto">
              <!-- Loading State -->
              <div v-if="isSearching" class="p-8 text-center">
                <div class="inline-flex items-center gap-2 text-gray-500">
                  <div
                    class="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"
                  />
                  <span>Searching...</span>
                </div>
              </div>

              <!-- No Results -->
              <div
                v-else-if="searchPerformed && searchResults.length === 0"
                class="p-8 text-center"
              >
                <div class="text-gray-400 dark:text-gray-500">
                  <Search class="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p class="text-lg font-medium">No results found</p>
                  <p class="text-sm mt-1">Try adjusting your search terms or filters</p>
                </div>
              </div>

              <!-- Results List -->
              <div v-else-if="searchResults.length > 0" class="divide-y dark:divide-gray-700">
                <div
                  v-for="(result, index) in searchResults"
                  :key="result.id"
                  class="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                  :class="{ 'bg-gray-50 dark:bg-gray-700/50': selectedIndex === index }"
                  @click="selectResult(result)"
                  @mouseenter="selectedIndex = index"
                >
                  <div class="flex items-start gap-3">
                    <!-- Role Icon -->
                    <div
                      class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      :class="
                        result.role === 'user'
                          ? 'bg-blue-100 dark:bg-blue-900'
                          : 'bg-gray-100 dark:bg-gray-700'
                      "
                    >
                      <User
                        v-if="result.role === 'user'"
                        class="w-4 h-4 text-blue-600 dark:text-blue-400"
                      />
                      <Bot v-else class="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>

                    <!-- Content -->
                    <div class="flex-1 min-w-0">
                      <!-- Chat Title & Time -->
                      <div
                        class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1"
                      >
                        <span class="font-medium">{{ result.chatTitle }}</span>
                        <span>•</span>
                        <span>{{ formatTime(result.timestamp) }}</span>
                      </div>

                      <!-- Message Preview -->
                      <div
                        class="text-sm text-gray-700 dark:text-gray-300 line-clamp-2"
                        v-html="highlightSearchTerms(result.content, searchQuery)"
                      />

                      <!-- Context -->
                      <div
                        v-if="result.context"
                        class="mt-1 text-xs text-gray-500 dark:text-gray-400"
                      >
                        <span class="opacity-75">{{ result.context }}</span>
                      </div>
                    </div>

                    <!-- Action -->
                    <ChevronRight class="w-4 h-4 text-gray-400 flex-shrink-0 mt-2" />
                  </div>
                </div>
              </div>

              <!-- Recent Searches (Default View) -->
              <div v-else class="p-4">
                <div v-if="recentSearches.length > 0">
                  <h3
                    class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3"
                  >
                    Recent Searches
                  </h3>
                  <div class="space-y-1">
                    <button
                      v-for="(search, index) in recentSearches"
                      :key="index"
                      @click="
                        searchQuery = search.query
                        performSearch()
                      "
                      class="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 group"
                    >
                      <Clock class="w-4 h-4 text-gray-400" />
                      <span class="text-sm text-gray-700 dark:text-gray-300">{{
                        search.query
                      }}</span>
                      <span class="text-xs text-gray-500 dark:text-gray-400 ml-auto"
                        >{{ search.count }} results</span
                      >
                    </button>
                  </div>
                </div>

                <!-- Quick Actions -->
                <div class="mt-6">
                  <h3
                    class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3"
                  >
                    Quick Actions
                  </h3>
                  <div class="grid grid-cols-2 gap-2">
                    <button
                      @click="
                        searchQuery = 'role:user'
                        performSearch()
                      "
                      class="px-3 py-2 text-sm text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <User class="w-4 h-4 text-blue-500 mb-1" />
                      <div class="text-gray-700 dark:text-gray-300">My Messages</div>
                    </button>
                    <button
                      @click="
                        searchQuery = 'today:'
                        performSearch()
                      "
                      class="px-3 py-2 text-sm text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Calendar class="w-4 h-4 text-green-500 mb-1" />
                      <div class="text-gray-700 dark:text-gray-300">Today's Chats</div>
                    </button>
                    <button
                      @click="
                        searchQuery = 'has:code'
                        performSearch()
                      "
                      class="px-3 py-2 text-sm text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Code class="w-4 h-4 text-purple-500 mb-1" />
                      <div class="text-gray-700 dark:text-gray-300">Code Snippets</div>
                    </button>
                    <button
                      @click="
                        searchQuery = 'has:link'
                        performSearch()
                      "
                      class="px-3 py-2 text-sm text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Link class="w-4 h-4 text-orange-500 mb-1" />
                      <div class="text-gray-700 dark:text-gray-300">Shared Links</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div
              class="border-t dark:border-gray-700 px-4 py-3 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between"
            >
              <div class="flex items-center gap-4">
                <span
                  ><kbd class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↑↓</kbd>
                  Navigate</span
                >
                <span
                  ><kbd class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Enter</kbd>
                  Select</span
                >
                <span
                  ><kbd class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Esc</kbd>
                  Close</span
                >
              </div>
              <div v-if="searchResults.length > 0">
                {{ searchResults.length }} result{{ searchResults.length === 1 ? '' : 's' }}
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import {
  Search,
  X,
  Settings2,
  User,
  Bot,
  ChevronRight,
  Clock,
  Calendar,
  Code,
  Link
} from 'lucide-vue-next'
import { searchService } from '@renderer/src/services/search/SearchService'
import { useRouter } from 'vue-router'
import { useChatStore } from '@renderer/src/stores/chat'
import { useKeyboardShortcuts } from '@renderer/src/composables/useKeyboardShortcuts'

interface SearchResult {
  id: string
  chatId: string
  chatTitle: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  context?: string
  score: number
}

interface Props {
  open: boolean
  initialQuery?: string
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'select', result: SearchResult): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const router = useRouter()
const chatStore = useChatStore()

// Refs
const searchInput = ref<HTMLInputElement>()
const searchQuery = ref(props.initialQuery || '')
const isSearching = ref(false)
const searchPerformed = ref(false)
const showOptions = ref(false)
const searchResults = ref<SearchResult[]>([])
const selectedIndex = ref(0)
const recentSearches = ref<Array<{ query: string; count: number }>>([])

// Search options
const searchOptions = ref({
  scope: 'all' as 'all' | 'current',
  includeUser: true,
  includeAssistant: true,
  dateFrom: '',
  dateTo: ''
})

// Computed
const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

// Methods
const closeSearch = () => {
  isOpen.value = false
  searchQuery.value = ''
  searchResults.value = []
  searchPerformed.value = false
  showOptions.value = false
  selectedIndex.value = 0
}

const handleBackdropClick = (e: Event) => {
  if (e.target === e.currentTarget) {
    closeSearch()
  }
}

const toggleOptions = () => {
  showOptions.value = !showOptions.value
}

const performSearch = async () => {
  if (!searchQuery.value.trim()) return

  isSearching.value = true
  searchPerformed.value = true

  try {
    // Build search filters
    const filters: any = {}

    if (searchOptions.value.scope === 'current' && chatStore.currentChat) {
      filters.chatIds = [chatStore.currentChat.id]
    }

    const roles = []
    if (searchOptions.value.includeUser) roles.push('user')
    if (searchOptions.value.includeAssistant) roles.push('assistant')
    if (roles.length > 0 && roles.length < 2) {
      filters.roles = roles
    }

    if (searchOptions.value.dateFrom || searchOptions.value.dateTo) {
      filters.dateRange = {
        start: searchOptions.value.dateFrom ? new Date(searchOptions.value.dateFrom) : new Date(0),
        end: searchOptions.value.dateTo
          ? new Date(searchOptions.value.dateTo + 'T23:59:59')
          : new Date()
      }
    }

    // Perform search
    const results = await searchService.search({
      text: searchQuery.value,
      filters,
      options: {
        maxResults: 50,
        sortBy: 'relevance',
        highlightMatches: true
      }
    })

    // Transform results
    searchResults.value = results.map(result => ({
      id: result.message.id,
      chatId: result.message.chatId || '',
      chatTitle: getChatTitle(result.message.chatId || ''),
      role: result.message.role as 'user' | 'assistant',
      content: result.message.content || '',
      timestamp: result.message.timestamp || new Date(),
      score: result.score,
      context: getMessageContext(result)
    }))

    // Add to recent searches
    addToRecentSearches(searchQuery.value, searchResults.value.length)

    selectedIndex.value = 0
  } catch (error) {
    console.error('Search failed:', error)
  } finally {
    isSearching.value = false
  }
}

const navigateResults = (direction: number) => {
  if (searchResults.value.length === 0) return

  selectedIndex.value = Math.max(
    0,
    Math.min(searchResults.value.length - 1, selectedIndex.value + direction)
  )

  // Scroll to selected item
  nextTick(() => {
    const selected = document.querySelector('.bg-gray-50.dark\\:bg-gray-700\\/50')
    selected?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  })
}

const selectResult = (result: SearchResult) => {
  // Navigate to the chat
  router.push(`/chat/${result.chatId}`)

  // Emit select event
  emit('select', result)

  // Close search
  closeSearch()
}

const highlightSearchTerms = (text: string, query: string): string => {
  if (!query) return text

  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter(t => t.length > 0)
  let highlighted = text

  terms.forEach(term => {
    const regex = new RegExp(`(${escapeRegex(term)})`, 'gi')
    highlighted = highlighted.replace(
      regex,
      '<mark class="bg-yellow-200 dark:bg-yellow-900 text-inherit">$1</mark>'
    )
  })

  return highlighted
}

const escapeRegex = (text: string): string => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const formatTime = (date: Date): string => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } else if (days === 1) {
    return 'Yesterday'
  } else if (days < 7) {
    return date.toLocaleDateString([], { weekday: 'short' })
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }
}

const getChatTitle = (chatId: string): string => {
  const chat = chatStore.chats.find(c => c.id === chatId)
  return chat?.title || 'Untitled Chat'
}

const getMessageContext = (result: any): string => {
  if (result.context && result.context.before.length > 0) {
    const prevMessage = result.context.before[0]
    return `In reply to: ${prevMessage.content?.substring(0, 50)}...`
  }
  return ''
}

const addToRecentSearches = (query: string, count: number) => {
  // Remove duplicate if exists
  recentSearches.value = recentSearches.value.filter(s => s.query !== query)

  // Add to beginning
  recentSearches.value.unshift({ query, count })

  // Keep only last 5
  recentSearches.value = recentSearches.value.slice(0, 5)

  // Save to localStorage
  localStorage.setItem('miaoda-recent-searches-ui', JSON.stringify(recentSearches.value))
}

const loadRecentSearches = () => {
  try {
    const saved = localStorage.getItem('miaoda-recent-searches-ui')
    if (saved) {
      recentSearches.value = JSON.parse(saved)
    }
  } catch (error) {
    console.error('Failed to load recent searches:', error)
  }
}

// Keyboard handler
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && selectedIndex.value >= 0 && searchResults.value.length > 0) {
    selectResult(searchResults.value[selectedIndex.value])
  }
}

// Watch for open state
watch(isOpen, open => {
  if (open) {
    nextTick(() => {
      searchInput.value?.focus()
    })
  }
})

// Initialize
onMounted(() => {
  loadRecentSearches()
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Custom scrollbar */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: #e5e7eb #f9fafb;
}

.dark .overflow-y-auto {
  scrollbar-color: #4b5563 #1f2937;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f9fafb;
}

.dark .overflow-y-auto::-webkit-scrollbar-track {
  background: #1f2937;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 4px;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background: #4b5563;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #d1d5db;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}
</style>
