<template>
  <div class="message-search" :class="searchClasses">
    <!-- Search Header -->
    <div class="search-header">
      <div class="search-input-container">
        <div class="search-input-wrapper">
          <Search :size="18" class="search-icon" />

          <input id="input-d0xibklc4"
            ref="searchInputRef"
            type="text"
            v-model="searchQuery"
            :placeholder="searchPlaceholder"
            class="search-input"
            @keydown="onSearchKeydown"
            @focus="onSearchFocus"
            @blur="onSearchBlur"
            @input="onSearchInput"
           aria-label="输入框">

          <div class="search-actions">
            <button
              v-if="searchQuery"
              @click="clearSearch"
              class="clear-btn"
              :title="$t('common.clear')"
             aria-label="按钮">
              <X :size="16" />
            </button>

            <button
              @click="toggleAdvancedSearch"
              class="advanced-btn"
              :class="{ active: showAdvanced }"
              :title="$t('search.advancedSearch')"
             aria-label="按钮">
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
                 aria-label="按钮">
                  <Clock :size="14" />
                  <span class="suggestion-text">{{ recent.text || $t('search.filterOnly') }}</span>
                  <span
                    @click.stop="removeRecentSearch(index)"
                    class="suggestion-remove cursor-pointer"
                  >
                    <X :size="12" />
                  </span>
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
                 aria-label="按钮">
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
          :class="{ active: isQuickFilterActive(filter) }"
         aria-label="按钮">
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
              <input id="input-ei08jt8yk" type="checkbox" v-model="searchOptions.caseSensitive"  aria-label="输入框">
              <span>{{ $t('search.caseSensitive') }}</span>
            </label>

            <label class="option-item">
              <input id="input-kuhpyb0of" type="checkbox" v-model="searchOptions.wholeWords"  aria-label="输入框">
              <span>{{ $t('search.wholeWords') }}</span>
            </label>

            <label class="option-item">
              <input id="input-wswtzra6j" type="checkbox" v-model="searchOptions.useRegex"  aria-label="输入框">
              <span>{{ $t('search.useRegex') }}</span>
            </label>

            <label class="option-item">
              <input id="input-je62xa1b7" type="checkbox" v-model="searchOptions.fuzzyMatch"  aria-label="输入框">
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
                  <input id="input-jpyeqwmra" type="checkbox" :value="'user'" v-model="searchFilters.roles"  aria-label="输入框">
                  <User :size="14" />
                  <span>{{ $t('message.user') }}</span>
                </label>

                <label class="role-item">
                  <input id="input-zs0fx5c50" type="checkbox" :value="'assistant'" v-model="searchFilters.roles"  aria-label="输入框">
                  <Bot :size="14" />
                  <span>{{ $t('message.assistant') }}</span>
                </label>

                <label class="role-item">
                  <input id="input-cslq3x7gw" type="checkbox" :value="'system'" v-model="searchFilters.roles"  aria-label="输入框">
                  <Settings :size="14" />
                  <span>{{ $t('message.system') }}</span>
                </label>
              </div>
            </div>

            <!-- Date Range Filter -->
            <div class="filter-group">
              <label class="filter-label">{{ $t('search.dateRange') }}</label>
              <div class="date-inputs">
                <input id="input-0mbg5cnp2"
                  type="date"
                  v-model="dateRangeStart"
                  class="date-input"
                  :max="dateRangeEnd"
                 aria-label="输入框">
                <span class="date-separator">{{ $t('search.to') }}</span>
                <input id="input-ohk7zpfgk"
                  type="date"
                  v-model="dateRangeEnd"
                  class="date-input"
                  :min="dateRangeStart"
                 aria-label="输入框">
              </div>
            </div>

            <!-- Length Filter -->
            <div class="filter-group">
              <label class="filter-label">{{ $t('search.messageLength') }}</label>
              <div class="length-inputs">
                <input id="input-nmbncpahy"
                  type="number"
                  v-model.number="searchFilters.minLength"
                  :placeholder="$t('search.minLength')"
                  class="length-input"
                  min="0"
                 aria-label="输入框">
                <span class="length-separator">-</span>
                <input id="input-yfsbtv2hl"
                  type="number"
                  v-model.number="searchFilters.maxLength"
                  :placeholder="$t('search.maxLength')"
                  class="length-input"
                  min="0"
                 aria-label="输入框">
              </div>
            </div>

            <!-- Tags Filter -->
            <div class="filter-group">
              <label class="filter-label">{{ $t('search.tags') }}</label>
              <div class="tags-input-container">
                <input id="input-uy5fp4gvd"
                  type="text"
                  v-model="tagInput"
                  :placeholder="$t('search.enterTags')"
                  class="tags-input"
                  @keydown="onTagKeydown"
                 aria-label="输入框">

                <div
                  v-if="searchFilters.tags && searchFilters.tags.length > 0"
                  class="selected-tags"
                >
                  <span v-for="tag in searchFilters.tags" :key="tag" class="tag-item">
                    {{ tag }}
                    <button @click="removeTag(tag)" class="tag-remove" aria-label="按钮">
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

            <input id="input-pn83875jf"
              type="number"
              v-model.number="searchOptions.maxResults"
              :placeholder="$t('search.maxResults')"
              class="max-results-input"
              min="1"
              max="1000"
             aria-label="输入框">
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
        <button @click="retrySearch" class="retry-btn" aria-label="按钮">
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
          <button @click="exportResults" class="export-btn" aria-label="按钮">
            <Download :size="14" />
            {{ $t('search.export') }}
          </button>

          <button @click="clearResults" class="clear-results-btn" aria-label="按钮">
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
        <button @click="previousPage" :disabled="currentPage === 1" class="page-btn" aria-label="按钮">
          <ChevronLeft :size="16" />
          {{ $t('common.previous') }}
        </button>

        <div class="page-info">
          <span>{{ $t('search.pageInfo', { current: currentPage, total: totalPages }) }}</span>
        </div>

        <button @click="nextPage" :disabled="currentPage === totalPages" class="page-btn" aria-label="按钮">
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
  Search,
  X,
  SlidersHorizontal,
  Clock,
  User,
  Bot,
  Settings,
  Loader,
  AlertCircle,
  RotateCcw,
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { backendSearchService } from '@renderer/src/services/search/BackendSearchService'
import type {
  SearchQuery,
  SearchResult as SearchResultType,
  SearchFilters,
  SearchOptions,
  SearchStats
} from '@main/db/searchTypes'
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
  'search-complete': [results: SearchResultType[]]
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
const searchResults = ref<SearchResultType[]>([])
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

    // Use enhanced backend search
    const results = await backendSearchService.searchMessages(query)

    searchResults.value = results
    searchStats.value = await backendSearchService.getSearchStats()
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
      searchFilters.value.roles =
        searchFilters.value.roles?.filter(role => !filter.filter.roles.includes(role)) || []
    }
    if (filter.filter.dateRange) {
      searchFilters.value.dateRange = undefined
      dateRangeStart.value = ''
      dateRangeEnd.value = ''
    }
  } else {
    // Add filter
    if (filter.filter.roles) {
      searchFilters.value.roles = [...(searchFilters.value.roles || []), ...filter.filter.roles]
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
    return filter.filter.roles.every((role: string) => searchFilters.value.roles?.includes(role))
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

// Recent searches (temporarily disabled - could be enhanced later)
const loadRecentSearches = () => {
  // TODO: Implement recent searches storage in backend
  recentSearches.value = []
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
    ].filter(suggestion => suggestion.toLowerCase().includes(query) && suggestion !== query)
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

watch(
  () => searchFilters.value,
  () => {
    if (hasActiveFilters()) {
      debouncedSearch()
    }
  },
  { deep: true }
)

// Lifecycle
onMounted(() => {
  if (props.autoFocus) {
    nextTick(() => {
      searchInputRef.value?.focus()
    })
  }

  loadRecentSearches()
  backendSearchService
    .getSearchStats()
    .then(stats => {
      searchStats.value = stats
    })
    .catch(error => {
      console.error('Failed to load search stats:', error)
    })
})

onUnmounted(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
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
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
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
