<template>
  <div class="chat-search" :class="{ 'search-active': isSearchMode }">
    <!-- Search Toggle Button -->
    <button
      @click="toggleSearch"
      class="search-toggle"
      :class="{ 'active': isSearchMode }"
      :title="$t('search.toggleSearch')"
    >
      <Search :size="18" />
    </button>
    
    <!-- Search Interface -->
    <div v-if="isSearchMode" class="search-interface">
      <div class="search-header">
        <div class="search-input-container">
          <Search :size="16" class="search-icon" />
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            :placeholder="$t('search.searchInChat')"
            class="search-input"
            @keydown.enter="performSearch"
            @keydown.escape="closeSearch"
            @input="onSearchInput"
          >
          
          <div class="search-controls">
            <button
              v-if="searchQuery"
              @click="clearSearch"
              class="clear-btn"
              :title="$t('common.clear')"
            >
              <X :size="14" />
            </button>
            
            <button
              @click="toggleGlobalSearch"
              class="global-search-btn"
              :title="$t('search.globalSearch')"
            >
              <Globe :size="14" />
            </button>
          </div>
        </div>
        
        <!-- Search Stats -->
        <div v-if="searchResults.length > 0" class="search-stats">
          <span class="results-count">
            {{ $t('search.resultsInChat', { count: searchResults.length }) }}
          </span>
          
          <div class="navigation-controls">
            <button
              @click="previousResult"
              :disabled="currentResultIndex <= 0"
              class="nav-btn"
              :title="$t('search.previousResult')"
            >
              <ChevronUp :size="14" />
            </button>
            
            <span class="result-position">
              {{ currentResultIndex + 1 }} / {{ searchResults.length }}
            </span>
            
            <button
              @click="nextResult"
              :disabled="currentResultIndex >= searchResults.length - 1"
              class="nav-btn"
              :title="$t('search.nextResult')"
            >
              <ChevronDown :size="14" />
            </button>
          </div>
        </div>
      </div>
      
      <!-- No Results -->
      <div v-if="hasSearched && searchResults.length === 0" class="no-results">
        <SearchX :size="16" />
        <span>{{ $t('search.noResultsInChat') }}</span>
      </div>
    </div>
    
    <!-- Global Search Modal -->
    <GlobalSearch
      v-if="showGlobalSearch"
      :visible="showGlobalSearch"
      @update:visible="showGlobalSearch = $event"
      @close="showGlobalSearch = false"
      @message-select="onGlobalMessageSelect"
      @chat-select="onGlobalChatSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { Search, X, Globe, ChevronUp, ChevronDown, SearchX } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { useChatStore } from '@renderer/src/stores/chat'
import { searchService, type SearchResult } from '@renderer/src/services/search/SearchService'
import GlobalSearch from '@renderer/src/components/search/GlobalSearch.vue'

// Props
interface Props {
  chatId?: string
}

const props = withDefaults(defineProps<Props>(), {
  chatId: ''
})

// Emits
const emit = defineEmits<{
  'message-highlight': [messageId: string]
  'chat-select': [chatId: string]
}>();

// Composables
const { t } = useI18n()
const chatStore = useChatStore()

// Refs
const searchInputRef = ref<HTMLInputElement>()
const isSearchMode = ref(false)
const searchQuery = ref('')
const searchResults = ref<SearchResult[]>([])
const currentResultIndex = ref(0)
const hasSearched = ref(false)
const showGlobalSearch = ref(false)

// Debounced search
let searchTimeout: NodeJS.Timeout | null = null

// Computed
const targetChatId = computed(() => props.chatId || chatStore.currentChatId || '')

// Methods
const toggleSearch = () => {
  isSearchMode.value = !isSearchMode.value
  
  if (isSearchMode.value) {
    nextTick(() => {
      searchInputRef.value?.focus()
    })
  } else {
    clearSearch()
  }
}

const closeSearch = () => {
  isSearchMode.value = false
  clearSearch()
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
  currentResultIndex.value = 0
  hasSearched.value = false
  
  // Clear any highlighting
  emit('message-highlight', '')
}

const onSearchInput = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  if (searchQuery.value.trim().length >= 2) {
    searchTimeout = setTimeout(() => {
      performSearch()
    }, 300)
  } else if (searchQuery.value.trim().length === 0) {
    clearSearch()
  }
}

const performSearch = async () => {
  if (!searchQuery.value.trim() || !targetChatId.value) {
    clearSearch()
    return
  }
  
  try {
    const results = await searchService.search({
      text: searchQuery.value.trim(),
      filters: {
        chatIds: [targetChatId.value]
      },
      options: {
        maxResults: 100,
        sortBy: 'relevance',
        highlightMatches: true
      }
    })
    
    searchResults.value = results
    currentResultIndex.value = 0
    hasSearched.value = true
    
    // Highlight first result if available
    if (results.length > 0) {
      highlightCurrentResult()
    }
  } catch (error) {
    console.error('Search failed:', error)
    searchResults.value = []
    hasSearched.value = true
  }
}

const previousResult = () => {
  if (currentResultIndex.value > 0) {
    currentResultIndex.value--
    highlightCurrentResult()
  }
}

const nextResult = () => {
  if (currentResultIndex.value < searchResults.value.length - 1) {
    currentResultIndex.value++
    highlightCurrentResult()
  }
}

const highlightCurrentResult = () => {
  if (searchResults.value.length > 0 && currentResultIndex.value >= 0) {
    const result = searchResults.value[currentResultIndex.value]
    emit('message-highlight', result.message.id)
  }
}

const toggleGlobalSearch = () => {
  showGlobalSearch.value = true
}

const onGlobalMessageSelect = (messageId: string, chatId: string) => {
  if (chatId !== targetChatId.value) {
    emit('chat-select', chatId)
  }
  
  // Highlight the selected message
  nextTick(() => {
    emit('message-highlight', messageId)
  })
  
  showGlobalSearch.value = false
}

const onGlobalChatSelect = (chatId: string) => {
  emit('chat-select', chatId)
  showGlobalSearch.value = false
}

// Global keyboard shortcuts
const handleGlobalKeydown = (event: KeyboardEvent) => {
  const { key, ctrlKey, metaKey } = event
  const cmdKey = navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? metaKey : ctrlKey
  
  // Ctrl/Cmd + F to toggle search
  if (cmdKey && key === 'f' && !showGlobalSearch.value) {
    event.preventDefault()
    if (!isSearchMode.value) {
      toggleSearch()
    } else {
      searchInputRef.value?.focus()
    }
    return
  }
  
  // Ctrl/Cmd + K for global search
  if (cmdKey && key === 'k') {
    event.preventDefault()
    toggleGlobalSearch()
    return
  }
  
  // Search navigation shortcuts (only when search is active)
  if (isSearchMode.value && searchResults.value.length > 0) {
    if (key === 'F3' || (cmdKey && key === 'g')) {
      event.preventDefault()
      nextResult()
    } else if ((key === 'F3' && event.shiftKey) || (cmdKey && event.shiftKey && key === 'g')) {
      event.preventDefault()
      previousResult()
    }
  }
}

// Watch for chat changes
watch(() => targetChatId.value, () => {
  if (searchQuery.value) {
    performSearch()
  }
})

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
})
</script>

<style scoped>
.chat-search {
  @apply relative;
}

.search-toggle {
  @apply p-2 rounded-md hover:bg-accent transition-colors;
}

.search-toggle.active {
  @apply bg-primary text-primary-foreground;
}

.search-interface {
  @apply absolute top-full right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-20 min-w-80;
  animation: slideDown 0.15s ease-out;
}

.search-header {
  @apply p-3 space-y-3;
}

.search-input-container {
  @apply relative flex items-center;
}

.search-icon {
  @apply absolute left-3 text-muted-foreground;
}

.search-input {
  @apply w-full pl-10 pr-16 py-2 border border-border rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent;
}

.search-controls {
  @apply absolute right-2 flex items-center gap-1;
}

.clear-btn,
.global-search-btn {
  @apply p-1 rounded hover:bg-accent transition-colors;
}

.search-stats {
  @apply flex items-center justify-between text-xs text-muted-foreground;
}

.navigation-controls {
  @apply flex items-center gap-1;
}

.nav-btn {
  @apply p-1 rounded hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

.result-position {
  @apply px-2 font-mono;
}

.no-results {
  @apply flex items-center gap-2 p-3 text-sm text-muted-foreground;
}

/* Animations */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Mobile responsive */
@media (max-width: 768px) {
  .search-interface {
    @apply fixed top-0 left-0 right-0 mt-0 rounded-none border-l-0 border-r-0 border-t-0;
    min-width: auto;
  }
  
  .search-header {
    @apply p-4;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .search-interface {
    @apply border-2;
  }
  
  .search-input:focus {
    @apply ring-2 ring-primary;
  }
}
</style>