<template>
  <div class="message-search" :class="searchClasses">
    <!-- Search Header -->
    <div class="search-header">
      <div class="search-input-container">
        <div class="search-input-wrapper">
          <Search :size="18" class="search-icon" />
          
          <input
            ref="searchInputRef"
            type="text"
            v-model="searchQuery"
            :placeholder="searchPlaceholder"
            class="search-input"
            @keydown="onSearchKeydown"
            @focus="onSearchFocus"
            @blur="onSearchBlur"
            @input="onSearchInput"
          />
          
          <div class="search-actions">
            <button
              v-if="searchQuery"
              @click="clearSearch"
              class="clear-btn"
              :title="$t('common.clear')"
            >
              <X :size="16" />
            </button>
            
            <button
              @click="toggleAdvancedSearch"
              class="advanced-btn"
              :class="{ 'active': showAdvanced }"
              :title="$t('search.advancedSearch')"
            >
              <SlidersHorizontal :size="16" />
            </button>
          </div>
        </div>
        
        <!-- Search Suggestions -->
        <div
          v-if="showSuggestions && (recentSearches.length > 0 || searchSuggestions.length > 0)"
          class="search-suggestions"
        >
          <div class="suggestions-content">
            <!-- Recent Searches -->
            <div v-if="recentSearches.length > 0" class="suggestion-section">
              <h4 class="suggestion-title">{{ $t('search.recentSearches') }}</h4>
              <div class="suggestion-list">
                <button
                  v-for="(recent, index) in recentSearches.slice(0, 5)"
                  :key="index"
                  @click="loadRecentSearch(recent)"
                  class="suggestion-item recent-item"
                >
                  <Clock :size="14" />
                  <span class="suggestion-text">{{ recent.text || $t('search.filterOnly') }}</span>
                  <button
                    @click.stop="removeRecentSearch(index)"
                    class="suggestion-remove"
                  >
                    <X :size="12" />
                  </button>
                </button>
              </div>
            </div>
            
            <!-- Search Suggestions -->
            <div v-if="searchSuggestions.length > 0" class="suggestion-section">
              <h4 class="suggestion-title">{{ $t('search.suggestions') }}</h4>
              <div class="suggestion-list">
                <button
                  v-for="(suggestion, index) in searchSuggestions"
                  :key="index"
                  @click="applySuggestion(suggestion)"
                  class="suggestion-item"
                >
                  <Search :size="14" />
                  <span class="suggestion-text">{{ suggestion }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Quick Filters -->
      <div class="quick-filters">
        <button
          v-for="filter in quickFilters"
          :key="filter.key"
          @click="toggleQuickFilter(filter)"
          class="quick-filter"
          :class="{ 'active': isQuickFilterActive(filter) }"
        >
          <component :is="filter.icon" :size="14" />
          <span>{{ filter.label }}</span>
        </button>
      </div>
    </div>
    
    <!-- Advanced Search -->
    <div v-if="showAdvanced" class="advanced-search">
      <div class="advanced-content">
        <!-- Search Options -->
        <div class="options-section">
          <h4 class="section-title">{{ $t('search.searchOptions') }}</h4>
          <div class="options-grid">
            <label class="option-item">
              <input type="checkbox" v-model="searchOptions.caseSensitive" />
              <span>{{ $t('search.caseSensitive') }}</span>
            </label>
            
            <label class="option-item">
              <input type="checkbox" v-model="searchOptions.wholeWords" />
              <span>{{ $t('search.wholeWords') }}</span>
            </label>
            
            <label class="option-item">
              <input type="checkbox" v-model="searchOptions.useRegex" />
              <span>{{ $t('search.useRegex') }}</span>
            </label>
            
            <label class="option-item">
              <input type="checkbox" v-model="searchOptions.fuzzyMatch" />
              <span>{{ $t('search.fuzzyMatch') }}</span>
            </label>
          </div>
        </div>
        
        <!-- Filters -->
        <div class="filters-section">
          <h4 class="section-title">{{ $t('search.filters') }}</h4>
          <div class="filters-grid">
            <!-- Role Filter -->
            <div class="filter-group">
              <label class="filter-label">{{ $t('search.roles') }}</label>
              <div class="role-filters">
                <label class="role-item">
                  <input 
                    type="checkbox" 
                    :value="'user'" 
                    v-model="searchFilters.roles"
                  />
                  <User :size="14" />
                  <span>{{ $t('message.user') }}</span>
                </label>
                
                <label class="role-item">
                  <input 
                    type="checkbox" 
                    :value="'assistant'" 
                    v-model="searchFilters.roles"
                  />
                  <Bot :size="14" />
                  <span>{{ $t('message.assistant') }}</span>
                </label>
                
                <label class="role-item">
                  <input 
                    type="checkbox" 
                    :value="'system'" 
                    v-model="searchFilters.roles"
                  />
                  <Settings :size="14" />
                  <span>{{ $t('message.system') }}</span>
                </label>
              </div>
            </div>
            
            <!-- Date Range Filter -->
            <div class="filter-group">
              <label class="filter-label">{{ $t('search.dateRange') }}</label>
              <div class="date-inputs">
                <input
                  type="date"
                  v-model="dateRangeStart"
                  class="date-input"
                  :max="dateRangeEnd"
                />
                <span class="date-separator">{{ $t('search.to') }}</span>
                <input
                  type="date"
                  v-model="dateRangeEnd"
                  class="date-input"
                  :min="dateRangeStart"
                />
              </div>
            </div>
            
            <!-- Length Filter -->
            <div class="filter-group">
              <label class="filter-label">{{ $t('search.messageLength') }}</label>
              <div class="length-inputs">
                <input
                  type="number"
                  v-model.number="searchFilters.minLength"
                  :placeholder="$t('search.minLength')"
                  class="length-input"
                  min="0"
                />
                <span class="length-separator">-</span>
                <input
                  type="number"
                  v-model.number="searchFilters.maxLength"
                  :placeholder="$t('search.maxLength')"
                  class="length-input"
                  min="0"
                />
              </div>
            </div>
            
            <!-- Tags Filter -->
            <div class="filter-group">
              <label class="filter-label">{{ $t('search.tags') }}</label>
              <div class="tags-input-container">
                <input
                  type="text"
                  v-model="tagInput"
                  :placeholder="$t('search.enterTags')"
                  class="tags-input"
                  @keydown="onTagKeydown"
                />
                
                <div v-if="searchFilters.tags && searchFilters.tags.length > 0" class="selected-tags">
                  <span
                    v-for="tag in searchFilters.tags"
                    :key="tag"
                    class="tag-item"
                  >
                    {{ tag }}
                    <button @click="removeTag(tag)" class="tag-remove">
                      <X :size="12" />
                    </button>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Sort Options -->
        <div class="sort-section">
          <h4 class="section-title">{{ $t('search.sorting') }}</h4>
          <div class="sort-options">
            <select v-model="searchOptions.sortBy" class="sort-select">
              <option value="relevance">{{ $t('search.sortByRelevance') }}</option>
              <option value="date">{{ $t('search.sortByDate') }}</option>
              <option value="length">{{ $t('search.sortByLength') }}</option>
            </select>
            
            <select v-model="searchOptions.sortOrder" class="sort-select">
              <option value="desc">{{ $t('search.descending') }}</option>
              <option value="asc">{{ $t('search.ascending') }}</option>
            </select>
            
            <input
              type="number"
              v-model.number="searchOptions.maxResults"
              :placeholder="$t('search.maxResults')"
              class="max-results-input"
              min="1"
              max="1000"
            />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Search Status -->
    <div v-if="isSearching || searchResults.length > 0 || searchError" class="search-status">
      <div v-if="isSearching" class="status-loading">
        <Loader :size="16" class="animate-spin" />
        <span>{{ $t('search.searching') }}</span>
      </div>
      
      <div v-else-if="searchError" class="status-error">
        <AlertCircle :size="16" />
        <span>{{ searchError }}</span>
        <button @click="retrySearch" class="retry-btn">
          <RotateCcw :size="14" />
          {{ $t('common.retry') }}
        </button>
      </div>
      
      <div v-else-if="searchResults.length > 0" class="status-success">
        <div class="results-info">
          <span class="results-count">
            {{ $t('search.resultsFound', { count: searchResults.length }) }}
          </span>
          <span class="search-time">
            {{ $t('search.searchTime', { time: searchStats.searchTime }) }}
          </span>
        </div>
        
        <div class="results-actions">
          <button @click="exportResults" class="export-btn">
            <Download :size="14" />
            {{ $t('search.export') }}
          </button>
          
          <button @click="clearResults" class="clear-results-btn">
            <X :size="14" />
            {{ $t('search.clearResults') }}
          </button>
        </div>
      </div>
      
      <div v-else-if="hasSearched" class="status-empty">
        <Search :size="16" />
        <span>{{ $t('search.noResults') }}</span>
      </div>
    </div>
    
    <!-- Search Results -->
    <div v-if="searchResults.length > 0" class="search-results">
      <div class="results-list">
        <SearchResult
          v-for="result in paginatedResults"
          :key="result.message.id"
          :result="result"
          :query="currentQuery"
          @message-click="$emit('message-click', result.message)"
          @chat-click="$emit('chat-click', result.message.chatId)"
        />
      </div>
      
      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          @click="previousPage"
          :disabled="currentPage === 1"
          class="page-btn"
        >
          <ChevronLeft :size="16" />
          {{ $t('common.previous') }}
        </button>
        
        <div class="page-info">
          <span>{{ $t('search.pageInfo', { current: currentPage, total: totalPages }) }}</span>
        </div>
        
        <button
          @click="nextPage"
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          {{ $t('common.next') }}
          <ChevronRight :size="16" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import {
  Search, X, SlidersHorizontal, Clock, User, Bot, Settings, Loader,
  AlertCircle, RotateCcw, Download, ChevronLeft, ChevronRight
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { searchService, type SearchQuery, type SearchResult, type SearchFilters, type SearchOptions, type SearchStats } from '@renderer/src/services/search/SearchService'
import SearchResult from './SearchResult.vue'

// Props
interface Props {
  autoFocus?: boolean
  showQuickFilters?: boolean
  maxHeight?: string
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoFocus: false,
  showQuickFilters: true,
  maxHeight: '600px',
  compact: false
})

// Emits
const emit = defineEmits<{
  'message-click': [message: any]
  'chat-click': [chatId: string]
  'search-complete': [results: SearchResult[]]
  'search-clear': []
}>()

// Composables
const { t } = useI18n()

// Refs
const searchInputRef = ref<HTMLInputElement>()
const searchQuery = ref('')
const showAdvanced = ref(false)
const showSuggestions = ref(false)
const tagInput = ref('')

// Search state
const isSearching = ref(false)
const hasSearched = ref(false)
const searchResults = ref<SearchResult[]>([])
const searchError = ref<string | null>(null)
const searchStats = ref<SearchStats>({
  totalMessages: 0,
  indexedMessages: 0,
  searchTime: 0,
  resultCount: 0,
  lastUpdated: new Date()
})
const currentQuery = ref<SearchQuery | null>(null)

// Pagination
const currentPage = ref(1)
const resultsPerPage = 20

// Search configuration
const searchOptions = ref<SearchOptions>({
  caseSensitive: false,
  wholeWords: false,
  useRegex: false,
  fuzzyMatch: false,
  fuzzyThreshold: 0.7,
  maxResults: 100,
  sortBy: 'relevance',
  sortOrder: 'desc',
  highlightMatches: true,
  contextLines: 0
})

const searchFilters = ref<SearchFilters>({
  roles: [],
  dateRange: undefined,
  chatIds: [],
  messageTypes: [],
  hasAttachments: undefined,
  minLength: undefined,
  maxLength: undefined,
  tags: [],
  priority: []
})

// Date range helpers
const dateRangeStart = ref('')
const dateRangeEnd = ref('')

// Recent searches and suggestions
const recentSearches = ref<SearchQuery[]>([])
const searchSuggestions = ref<string[]>([])

// Debounced search
let searchTimeout: NodeJS.Timeout | null = null

// Computed properties
const searchClasses = computed(() => ({
  'search-compact': props.compact,
  'search-advanced': showAdvanced.value,
  'search-focused': showSuggestions.value
}))

const searchPlaceholder = computed(() => {
  if (isSearching.value) return t('search.searching')
  return t('search.placeholder')
})

const quickFilters = computed(() => [
  {
    key: 'user',
    label: t('message.user'),
    icon: User,
    filter: { roles: ['user'] }
  },
  {
    key: 'assistant',
    label: t('message.assistant'),
    icon: Bot,
    filter: { roles: ['assistant'] }
  },
  {
    key: 'today',
    label: t('search.today'),
    icon: Clock,
    filter: { 
      dateRange: { 
        start: new Date(new Date().setHours(0, 0, 0, 0)), 
        end: new Date() 
      } 
    }
  }
])

const paginatedResults = computed(() => {
  const start = (currentPage.value - 1) * resultsPerPage
  const end = start + resultsPerPage
  return searchResults.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(searchResults.value.length / resultsPerPage)
})

// Methods
const performSearch = async () => {
  if (!searchQuery.value.trim() && !hasActiveFilters()) {
    clearResults()
    return
  }

  isSearching.value = true
  searchError.value = null
  currentPage.value = 1

  try {
    const query: SearchQuery = {
      text: searchQuery.value.trim(),
      filters: buildFilters(),
      options: { ...searchOptions.value }
    }

    currentQuery.value = query
    
    // Use hybrid search that combines both frontend and backend
    const results = await searchService.hybridSearch(query)
    
    searchResults.value = results
    searchStats.value = searchService.getSearchStats()
    hasSearched.value = true

    emit('search-complete', results)
  } catch (error) {
    searchError.value = error instanceof Error ? error.message : t('search.unknownError')
  } finally {
    isSearching.value = false
  }
}

const buildFilters = (): SearchFilters => {
  const filters: SearchFilters = { ...searchFilters.value }

  // Date range
  if (dateRangeStart.value && dateRangeEnd.value) {
    filters.dateRange = {
      start: new Date(dateRangeStart.value),
      end: new Date(dateRangeEnd.value + 'T23:59:59')
    }
  }

  return filters
}

const hasActiveFilters = (): boolean => {
  const filters = buildFilters()
  
  return !!(
    filters.roles?.length ||
    filters.dateRange ||
    filters.chatIds?.length ||
    filters.messageTypes?.length ||
    filters.hasAttachments !== undefined ||
    filters.minLength !== undefined ||
    filters.maxLength !== undefined ||
    filters.tags?.length ||
    filters.priority?.length
  )
}

const debouncedSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  searchTimeout = setTimeout(() => {
    performSearch()
  }, 300)
}

const onSearchInput = () => {
  if (searchQuery.value.trim().length >= 2 || hasActiveFilters()) {
    debouncedSearch()
  } else if (searchQuery.value.trim().length === 0) {
    clearResults()
  }

  updateSuggestions()
}

const onSearchKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    performSearch()
  } else if (event.key === 'Escape') {
    clearSearch()
  }
}

const onSearchFocus = () => {
  showSuggestions.value = true
  loadRecentSearches()
}

const onSearchBlur = () => {
  // Delay hiding to allow for suggestion clicks
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

const clearSearch = () => {
  searchQuery.value = ''
  clearResults()
  showSuggestions.value = false
  emit('search-clear')
}

const clearResults = () => {
  searchResults.value = []
  hasSearched.value = false
  searchError.value = null
  currentQuery.value = null
  currentPage.value = 1
}

const retrySearch = () => {
  performSearch()
}

const toggleAdvancedSearch = () => {
  showAdvanced.value = !showAdvanced.value
}

// Quick filters
const toggleQuickFilter = (filter: any) => {
  if (isQuickFilterActive(filter)) {
    // Remove filter
    if (filter.filter.roles) {
      searchFilters.value.roles = searchFilters.value.roles?.filter(
        role => !filter.filter.roles.includes(role)
      ) || []
    }
    if (filter.filter.dateRange) {
      searchFilters.value.dateRange = undefined
      dateRangeStart.value = ''
      dateRangeEnd.value = ''
    }
  } else {
    // Add filter
    if (filter.filter.roles) {
      searchFilters.value.roles = [
        ...(searchFilters.value.roles || []),
        ...filter.filter.roles
      ]
    }
    if (filter.filter.dateRange) {
      searchFilters.value.dateRange = filter.filter.dateRange
      dateRangeStart.value = filter.filter.dateRange.start.toISOString().split('T')[0]
      dateRangeEnd.value = filter.filter.dateRange.end.toISOString().split('T')[0]
    }
  }

  debouncedSearch()
}

const isQuickFilterActive = (filter: any): boolean => {
  if (filter.filter.roles) {
    return filter.filter.roles.every((role: string) => 
      searchFilters.value.roles?.includes(role)
    )
  }
  if (filter.filter.dateRange) {
    return !!searchFilters.value.dateRange
  }
  return false
}

// Tags management
const onTagKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && tagInput.value.trim()) {
    event.preventDefault()
    addTag(tagInput.value.trim())
  }
}

const addTag = (tag: string) => {
  if (!searchFilters.value.tags) {
    searchFilters.value.tags = []
  }
  
  if (!searchFilters.value.tags.includes(tag)) {
    searchFilters.value.tags.push(tag)
    tagInput.value = ''
    debouncedSearch()
  }
}

const removeTag = (tag: string) => {
  if (searchFilters.value.tags) {
    searchFilters.value.tags = searchFilters.value.tags.filter(t => t !== tag)
    debouncedSearch()
  }
}

// Recent searches
const loadRecentSearches = () => {
  recentSearches.value = searchService.getRecentSearches()
}

const loadRecentSearch = (recent: SearchQuery) => {
  searchQuery.value = recent.text
  searchFilters.value = { ...recent.filters }
  searchOptions.value = { ...searchOptions.value, ...recent.options }

  // Update date inputs
  if (recent.filters.dateRange) {
    dateRangeStart.value = recent.filters.dateRange.start.toISOString().split('T')[0]
    dateRangeEnd.value = recent.filters.dateRange.end.toISOString().split('T')[0]
  }

  showSuggestions.value = false
  performSearch()
}

const removeRecentSearch = (index: number) => {
  recentSearches.value.splice(index, 1)
  // Note: This doesn't remove from the service, just the local display
}

// Suggestions
const updateSuggestions = () => {
  // Generate search suggestions based on current input
  const query = searchQuery.value.toLowerCase()
  
  if (query.length >= 2) {
    // Simple suggestions - in a real app, these might come from an API
    searchSuggestions.value = [
      'error message',
      'code example',
      'user question',
      'assistant response'
    ].filter(suggestion => 
      suggestion.toLowerCase().includes(query) && 
      suggestion !== query
    )
  } else {
    searchSuggestions.value = []
  }
}

const applySuggestion = (suggestion: string) => {
  searchQuery.value = suggestion
  showSuggestions.value = false
  performSearch()
}

// Pagination
const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

// Export
const exportResults = () => {
  if (searchResults.value.length === 0) return

  const exportData = {
    query: currentQuery.value,
    results: searchResults.value.map(result => ({
      message: result.message,
      score: result.score,
      matches: result.matches
    })),
    stats: searchStats.value,
    exportedAt: new Date().toISOString()
  }

  const dataStr = JSON.stringify(exportData, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  
  const link = document.createElement('a')
  link.href = URL.createObjectURL(dataBlob)
  link.download = `search-results-${new Date().toISOString().split('T')[0]}.json`
  link.click()
  
  URL.revokeObjectURL(link.href)
}

// Watchers
watch([dateRangeStart, dateRangeEnd], () => {
  if (dateRangeStart.value && dateRangeEnd.value) {
    debouncedSearch()
  }
})

watch(() => searchFilters.value, () => {
  if (hasActiveFilters()) {
    debouncedSearch()
  }
}, { deep: true })

// Lifecycle
onMounted(() => {
  if (props.autoFocus) {
    nextTick(() => {
      searchInputRef.value?.focus()
    })
  }

  loadRecentSearches()
  searchStats.value = searchService.getSearchStats()
})

onUnmounted(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
})
</script>

<style scoped>
.message-search {
  @apply bg-background border border-border rounded-lg overflow-hidden;
  max-height: v-bind('maxHeight');
  display: flex;
  flex-direction: column;
}

.search-compact {
  @apply border-0 rounded-none;
}

.search-header {
  @apply p-4 border-b border-border space-y-4;
}

.search-input-container {
  @apply relative;
}

.search-input-wrapper {
  @apply relative flex items-center;
}

.search-icon {
  @apply absolute left-3 text-muted-foreground;
}

.search-input {
  @apply w-full pl-10 pr-20 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent;
}

.search-actions {
  @apply absolute right-2 flex items-center gap-1;
}

.clear-btn,
.advanced-btn {
  @apply p-2 rounded-md hover:bg-accent transition-colors;
}

.advanced-btn.active {
  @apply bg-primary text-primary-foreground;
}

.search-suggestions {
  @apply absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-10 max-h-80 overflow-y-auto;
}

.suggestions-content {
  @apply p-2 space-y-3;
}

.suggestion-section {
  @apply space-y-2;
}

.suggestion-title {
  @apply text-xs font-medium text-muted-foreground px-2;
}

.suggestion-list {
  @apply space-y-1;
}

.suggestion-item {
  @apply w-full flex items-center gap-2 px-2 py-2 text-sm hover:bg-accent rounded-md transition-colors text-left;
}

.recent-item {
  @apply text-muted-foreground;
}

.suggestion-text {
  @apply flex-1 truncate;
}

.suggestion-remove {
  @apply p-1 rounded hover:bg-destructive/20 text-destructive opacity-0 group-hover:opacity-100 transition-opacity;
}

.quick-filters {
  @apply flex flex-wrap gap-2;
}

.quick-filter {
  @apply flex items-center gap-2 px-3 py-2 border border-border rounded-full text-sm hover:bg-accent transition-colors;
}

.quick-filter.active {
  @apply bg-primary text-primary-foreground border-primary;
}

.advanced-search {
  @apply border-b border-border bg-muted/30;
}

.advanced-content {
  @apply p-4 space-y-6;
}

.section-title {
  @apply text-sm font-medium mb-3;
}

.options-grid {
  @apply grid grid-cols-2 md:grid-cols-4 gap-3;
}

.option-item {
  @apply flex items-center gap-2 text-sm cursor-pointer;
}

.filters-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.filter-group {
  @apply space-y-2;
}

.filter-label {
  @apply text-sm font-medium;
}

.role-filters {
  @apply flex flex-wrap gap-2;
}

.role-item {
  @apply flex items-center gap-2 px-3 py-2 border border-border rounded text-sm cursor-pointer hover:bg-accent;
}

.date-inputs,
.length-inputs {
  @apply flex items-center gap-2;
}

.date-input,
.length-input {
  @apply flex-1 px-3 py-2 border border-border rounded text-sm;
}

.date-separator,
.length-separator {
  @apply text-muted-foreground;
}

.tags-input-container {
  @apply space-y-2;
}

.tags-input {
  @apply w-full px-3 py-2 border border-border rounded text-sm;
}

.selected-tags {
  @apply flex flex-wrap gap-1;
}

.tag-item {
  @apply flex items-center gap-1 px-2 py-1 bg-primary text-primary-foreground rounded-full text-xs;
}

.tag-remove {
  @apply p-0.5 rounded-full hover:bg-primary-foreground/20;
}

.sort-options {
  @apply flex flex-wrap gap-2;
}

.sort-select,
.max-results-input {
  @apply px-3 py-2 border border-border rounded text-sm;
}

.search-status {
  @apply p-4 border-b border-border;
}

.status-loading,
.status-error,
.status-success,
.status-empty {
  @apply flex items-center gap-2 text-sm;
}

.status-error {
  @apply text-destructive;
}

.retry-btn {
  @apply flex items-center gap-1 px-2 py-1 bg-destructive text-destructive-foreground rounded text-xs hover:bg-destructive/90 transition-colors;
}

.status-success {
  @apply justify-between;
}

.results-info {
  @apply flex items-center gap-4 text-muted-foreground;
}

.results-actions {
  @apply flex items-center gap-2;
}

.export-btn,
.clear-results-btn {
  @apply flex items-center gap-1 px-2 py-1 border border-border rounded text-xs hover:bg-accent transition-colors;
}

.search-results {
  @apply flex-1 overflow-hidden flex flex-col;
}

.results-list {
  @apply flex-1 overflow-y-auto;
}

.pagination {
  @apply flex items-center justify-between p-4 border-t border-border;
}

.page-btn {
  @apply flex items-center gap-1 px-3 py-2 border border-border rounded hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

.page-info {
  @apply text-sm text-muted-foreground;
}

/* Animations */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
  .search-header {
    @apply p-3;
  }
  
  .options-grid {
    @apply grid-cols-1;
  }
  
  .filters-grid {
    @apply grid-cols-1;
  }
  
  .quick-filters {
    @apply grid grid-cols-2 gap-2;
  }
  
  .results-info {
    @apply flex-col items-start gap-1;
  }
  
  .status-success {
    @apply flex-col items-start gap-3;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .message-search {
    @apply border-2;
  }
  
  .search-input:focus {
    @apply ring-2 ring-primary;
  }
}
</style>