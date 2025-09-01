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
                <input id="input-qczt8lp7n"
                  ref="searchInput"
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search messages, chats, or commands..."
                  class="w-full pl-12 pr-4 py-2 bg-transparent text-lg focus:outline-none"
                  @keydown.enter="performSearch"
                  @keydown.esc="closeSearch"
                  @keydown.down.prevent="navigateResults(1)"
                  @keydown.up.prevent="navigateResults(-1)"
                 aria-label="输入框">
                <div class="flex items-center gap-2 ml-4">
                  <!-- Search Options -->
                  <button
                    @click="toggleOptions"
                    class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    :class="{ 'bg-gray-100 dark:bg-gray-700': showOptions }"
                   aria-label="按钮">
                    <Settings2 class="w-4 h-4 text-gray-500" />
                  </button>
                  <!-- Close Button -->
                  <button
                    @click="closeSearch"
                    class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                   aria-label="按钮">
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
                          <input id="input-z3ssltyho"
                            type="radio"
                            v-model="searchOptions.scope"
                            value="all"
                            class="text-blue-600 focus:ring-blue-500"
                           aria-label="输入框">
                          <span class="text-sm">All Messages</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                          <input id="input-jbyvvkdmp"
                            type="radio"
                            v-model="searchOptions.scope"
                            value="current"
                            class="text-blue-600 focus:ring-blue-500"
                           aria-label="输入框">
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
                          <input id="input-sx53tbp9q"
                            type="checkbox"
                            v-model="searchOptions.includeUser"
                            class="text-blue-600 focus:ring-blue-500 rounded"
                           aria-label="输入框">
                          <span class="text-sm">User Messages</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                          <input id="input-1gbdbzfjh"
                            type="checkbox"
                            v-model="searchOptions.includeAssistant"
                            class="text-blue-600 focus:ring-blue-500 rounded"
                           aria-label="输入框">
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
                      <input id="input-o9tm6b7b2"
                        type="date"
                        v-model="searchOptions.dateFrom"
                        class="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
                       aria-label="输入框">
                      <span class="text-gray-500 self-center">to</span>
                      <input id="input-o7asm1exn"
                        type="date"
                        v-model="searchOptions.dateTo"
                        class="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
                       aria-label="输入框">
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
                     aria-label="按钮">
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
                     aria-label="按钮">
                      <User class="w-4 h-4 text-blue-500 mb-1" />
                      <div class="text-gray-700 dark:text-gray-300">My Messages</div>
                    </button>
                    <button
                      @click="
                        searchQuery = 'today:'
                        performSearch()
                      "
                      class="px-3 py-2 text-sm text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                     aria-label="按钮">
                      <Calendar class="w-4 h-4 text-green-500 mb-1" />
                      <div class="text-gray-700 dark:text-gray-300">Today's Chats</div>
                    </button>
                    <button
                      @click="
                        searchQuery = 'has:code'
                        performSearch()
                      "
                      class="px-3 py-2 text-sm text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                     aria-label="按钮">
                      <Code class="w-4 h-4 text-purple-500 mb-1" />
                      <div class="text-gray-700 dark:text-gray-300">Code Snippets</div>
                    </button>
                    <button
                      @click="
                        searchQuery = 'has:link'
                        performSearch()
                      "
                      class="px-3 py-2 text-sm text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                     aria-label="按钮">
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
import { useEnhancedShortcuts } from '@renderer/src/composables/useEnhancedShortcuts'

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
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Custom scrollbar */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: hsl(0, 0%, 89%) #f9fafb;
}

.dark .overflow-y-auto {
  scrollbar-color: hsl(215 14% 34%); #1f2937;
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
  background: hsl(0, 0%, 89%);
  border-radius: 4px;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background: #4b5563;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: hsl(0, 0%, 82%);
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: hsl(0, 0%, 44%);
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
}</style>
