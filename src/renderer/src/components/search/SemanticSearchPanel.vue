<template>
  <div class="semantic-search-panel" :class="{ expanded: isExpanded }">
    <!-- Search Header -->
    <div class="search-header">
      <div class="header-left">
        <button
          @click="toggleExpanded"
          class="expand-button"
          :title="isExpanded ? 'Collapse Panel' : 'Expand Panel'"
         aria-label="按钮">
          <component :is="isExpanded ? ChevronDown : ChevronRight" :size="16" />
        </button>

        <div class="search-type-selector">
          <button
            v-for="type in searchTypes"
            :key="type.id"
            @click="setSearchType(type.id)"
            class="search-type-btn"
            :class="{ active: searchType === type.id }"
            :title="type.description"
           aria-label="按钮">
            <component :is="type.icon" :size="16" />
            <span>{{ type.label }}</span>
          </button>
        </div>
      </div>

      <div class="header-right">
        <div class="search-stats" v-if="searchStats">
          <span class="stat-item">
            <Database :size="12" />
            {{ searchStats.embeddedMessages }}/{{ searchStats.totalMessages }}
          </span>
          <span class="stat-item" v-if="lastSearchTime">
            <Clock :size="12" />
            {{ lastSearchTime }}ms
          </span>
          <div
            v-if="!searchStats.indexingComplete"
            class="indexing-indicator"
            title="Building semantic index..."
          >
            <Loader2 :size="12" class="animate-spin" />
            Indexing...
          </div>
        </div>

        <button
          @click="showSettings = !showSettings"
          class="settings-button"
          :class="{ active: showSettings }"
          title="Search Settings"
         aria-label="按钮">
          <Settings :size="16" />
        </button>
      </div>
    </div>

    <!-- Search Input -->
    <div class="search-input-section">
      <div class="search-input-wrapper">
        <Search :size="20" class="search-icon" />

        <input id="input-j0d3dhc86"
          ref="searchInputRef"
          v-model="searchQuery"
          @input="onSearchInput"
          @keydown="handleKeydown"
          class="search-input"
          type="text"
          :placeholder="getPlaceholder()"
          :disabled="isSearching"
         aria-label="输入框">

        <div class="input-actions">
          <!-- Semantic Search Toggle -->
          <button
            v-if="searchType === 'hybrid' || searchType === 'semantic'"
            @click="toggleSemanticMode"
            class="action-button semantic-toggle"
            :class="{ active: useSemanticSearch }"
            :title="useSemanticSearch ? 'Disable Semantic Search' : 'Enable Semantic Search'"
           aria-label="按钮">
            <Brain :size="16" />
          </button>

          <!-- Voice Input -->
          <button
            v-if="supportsVoiceInput"
            @click="startVoiceInput"
            class="action-button voice-button"
            :class="{ active: isListening }"
            :title="isListening ? 'Stop Listening' : 'Voice Input'"
           aria-label="按钮">
            <component :is="isListening ? MicOff : Mic" :size="16" />
          </button>

          <!-- Clear Search -->
          <button
            v-if="searchQuery"
            @click="clearSearch"
            class="action-button clear-button"
            title="Clear Search"
           aria-label="按钮">
            <X :size="16" />
          </button>

          <!-- Search Loading -->
          <div v-if="isSearching" class="search-loading">
            <Loader2 :size="16" class="animate-spin" />
          </div>
        </div>
      </div>

      <!-- Search Suggestions -->
      <div v-if="showSuggestions && suggestions.length > 0" class="search-suggestions">
        <div
          v-for="(suggestion, index) in suggestions"
          :key="index"
          @click="applySuggestion(suggestion)"
          class="suggestion-item"
          :class="{ active: selectedSuggestionIndex === index }"
        >
          <component
            :is="
              suggestion.type === 'recent'
                ? History
                : suggestion.type === 'similar'
                  ? Users
                  : Lightbulb
            "
            :size="14"
          />
          <span class="suggestion-text">{{ suggestion.text }}</span>
          <span class="suggestion-type">{{ suggestion.label }}</span>
        </div>
      </div>
    </div>

    <!-- Advanced Filters -->
    <div v-if="showSettings" class="advanced-filters">
      <div class="filter-section">
        <h4>Search Filters</h4>

        <div class="filter-grid">
          <!-- Date Range Filter -->
          <div class="filter-group">
            <label>Date Range</label>
            <div class="date-range-inputs">
              <input id="input-lyx8u1u0c"
                v-model="filters.dateRange.start"
                type="date"
                class="filter-input date-input"
               aria-label="输入框">
              <span class="date-separator">to</span>
              <input id="input-n1nyhn7gg" v-model="filters.dateRange.end" type="date" class="filter-input date-input"  aria-label="输入框">
            </div>
          </div>

          <!-- Role Filter -->
          <div class="filter-group">
            <label>Message Role</label>
            <div class="checkbox-group">
              <label class="checkbox-item">
                <input id="input-hysqw6fpx" v-model="filters.roles" type="checkbox" value="user"  aria-label="输入框">
                <span>User</span>
              </label>
              <label class="checkbox-item">
                <input id="input-hs4pxda5m" v-model="filters.roles" type="checkbox" value="assistant"  aria-label="输入框">
                <span>Assistant</span>
              </label>
              <label class="checkbox-item">
                <input id="input-vbgg2laqt" v-model="filters.roles" type="checkbox" value="system"  aria-label="输入框">
                <span>System</span>
              </label>
            </div>
          </div>

          <!-- Similarity Threshold (Semantic Only) -->
          <div v-if="useSemanticSearch" class="filter-group">
            <label>Similarity Threshold</label>
            <div class="slider-group">
              <input id="input-4z2g928nx"
                v-model.number="semanticOptions.threshold"
                type="range"
                min="0"
                max="1"
                step="0.1"
                class="threshold-slider"
               aria-label="输入框">
              <span class="slider-value">{{ (semanticOptions.threshold * 100).toFixed(0) }}%</span>
            </div>
          </div>

          <!-- Result Limit -->
          <div class="filter-group">
            <label>Max Results</label>
            <select v-model.number="options.maxResults" class="filter-select">
              <option value="10">10 results</option>
              <option value="25">25 results</option>
              <option value="50">50 results</option>
              <option value="100">100 results</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Semantic Search Options -->
      <div v-if="useSemanticSearch" class="semantic-options">
        <h4>Semantic Search Options</h4>

        <div class="semantic-controls">
          <label class="checkbox-item">
            <input id="input-h334skpt0" v-model="semanticOptions.includeContext" type="checkbox"  aria-label="输入框">
            <span>Include conversation context</span>
          </label>

          <label class="checkbox-item">
            <input id="input-qt4exboib" v-model="semanticOptions.expandQuery" type="checkbox"  aria-label="输入框">
            <span>Expand query with synonyms</span>
          </label>

          <label class="checkbox-item">
            <input id="input-niorwjfca" v-model="semanticOptions.useCrossLingual" type="checkbox"  aria-label="输入框">
            <span>Cross-lingual search</span>
          </label>
        </div>
      </div>

      <!-- Performance Settings -->
      <div class="performance-settings">
        <h4>Performance</h4>

        <div class="performance-controls">
          <label class="checkbox-item">
            <input id="input-3cba2ratj" v-model="options.useCache" type="checkbox"  aria-label="输入框">
            <span>Use search cache</span>
          </label>

          <label class="checkbox-item">
            <input id="input-rfgvaupgf" v-model="options.prefetchResults" type="checkbox"  aria-label="输入框">
            <span>Prefetch related results</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Quick Filters -->
    <div v-if="isExpanded" class="quick-filters">
      <div class="filter-tags">
        <button
          v-for="filter in quickFilters"
          :key="filter.id"
          @click="applyQuickFilter(filter)"
          class="filter-tag"
          :class="{ active: activeQuickFilters.includes(filter.id) }"
         aria-label="按钮">
          <component :is="filter.icon" :size="14" />
          {{ filter.label }}
        </button>
      </div>
    </div>

    <!-- Search Results Summary -->
    <div v-if="searchResults.length > 0" class="results-summary">
      <div class="summary-info">
        <span class="result-count">
          {{ searchResults.length }} results
          <span v-if="searchType === 'semantic'" class="semantic-badge">
            <Brain :size="12" />
            Semantic
          </span>
          <span v-if="searchType === 'hybrid'" class="hybrid-badge">
            <Zap :size="12" />
            Hybrid
          </span>
        </span>

        <span v-if="lastSearchTime" class="search-time"> in {{ lastSearchTime }}ms </span>
      </div>

      <div class="result-actions">
        <button @click="exportResults" class="action-button export-button" title="Export Results" aria-label="按钮">
          <Download :size="14" />
          Export
        </button>

        <button @click="saveSearch" class="action-button save-button" title="Save Search" aria-label="按钮">
          <Bookmark :size="14" />
          Save
        </button>
      </div>
    </div>

    <!-- Search Results -->
    <div v-if="searchResults.length > 0" class="search-results">
      <SearchResultItem
        v-for="result in searchResults"
        :key="result.message.id"
        :result="result"
        :search-type="searchType"
        :highlight-query="searchQuery"
        @message-click="onMessageClick"
        @similar-search="onSimilarSearch"
      />
    </div>

    <!-- Empty State -->
    <div v-else-if="hasSearched && !isSearching" class="empty-results">
      <div class="empty-icon">
        <Search :size="48" />
      </div>
      <h3>No results found</h3>
      <p>Try adjusting your search terms or filters</p>

      <div class="empty-suggestions">
        <button @click="suggestSimilar" class="suggestion-button" aria-label="按钮">
          <Lightbulb :size="16" />
          Get suggestions
        </button>
        <button @click="clearAllFilters" class="suggestion-button" aria-label="按钮">
          <RefreshCw :size="16" />
          Clear filters
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import {
  Search,
  Brain,
  Settings,
  Database,
  Clock,
  Loader2,
  ChevronDown,
  ChevronRight,
  Mic,
  MicOff,
  X,
  History,
  Users,
  Lightbulb,
  Zap,
  Download,
  Bookmark,
  RefreshCw
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { debounce } from '@renderer/src/utils/performance'
import { backendSearchService } from '@renderer/src/services/search/BackendSearchService'
import type { SearchQuery, SearchResult, SearchStats } from '@main/db/searchTypes'
import SearchResultItem from './SearchResultItem.vue'

// Props
interface Props {
  autoFocus?: boolean
  showQuickFilters?: boolean
  maxHeight?: string
}

const props = withDefaults(defineProps<Props>(), {
  autoFocus: false,
  showQuickFilters: true,
  maxHeight: '60vh'
})

// Emits
const emit = defineEmits<{
  'search-complete': [results: SearchResult[], query?: string, searchTime?: number]
  'search-clear': []
  'message-click': [result: SearchResult]
}>()

// Composables
const { t } = useI18n()

// Refs
const searchInputRef = ref<HTMLInputElement>()
const isExpanded = ref(true)
const showSettings = ref(false)
const showSuggestions = ref(false)
const selectedSuggestionIndex = ref(-1)

// Search state
const searchQuery = ref('')
const searchType = ref<'lexical' | 'semantic' | 'hybrid'>('hybrid')
const useSemanticSearch = ref(true)
const isSearching = ref(false)
const hasSearched = ref(false)
const lastSearchTime = ref<number>()
const searchResults = ref<SearchResult[]>([])
const searchStats = ref<any>()

// Voice input
const isListening = ref(false)
const supportsVoiceInput = ref(false)

// Filters and options
const filters = reactive({
  dateRange: {
    start: '',
    end: ''
  },
  roles: [] as string[],
  chatIds: [] as string[]
})

const options = reactive({
  maxResults: 25,
  sortBy: 'relevance' as 'relevance' | 'date' | 'length',
  sortOrder: 'desc' as 'asc' | 'desc',
  highlightMatches: true,
  contextLines: 2,
  useCache: true,
  prefetchResults: false
})

const semanticOptions = reactive({
  threshold: 0.3,
  includeContext: true,
  expandQuery: false,
  useCrossLingual: false
})

// Search types
const searchTypes = computed(() => [
  {
    id: 'lexical',
    label: 'Text',
    icon: Search,
    description: 'Traditional keyword-based search'
  },
  {
    id: 'semantic',
    label: 'Smart',
    icon: Brain,
    description: 'AI-powered semantic understanding'
  },
  {
    id: 'hybrid',
    label: 'Hybrid',
    icon: Zap,
    description: 'Combines text and semantic search'
  }
])

// Quick filters
const quickFilters = computed(() => [
  { id: 'recent', label: 'Recent', icon: Clock },
  { id: 'long', label: 'Long messages', icon: Users },
  { id: 'errors', label: 'Errors', icon: X },
  { id: 'attachments', label: 'With files', icon: Download }
])

const activeQuickFilters = ref<string[]>([])

// Search suggestions
const suggestions = ref<
  Array<{
    text: string
    type: 'recent' | 'similar' | 'suggested'
    label: string
  }>
>([])

// Methods
const getPlaceholder = () => {
  const placeholders = {
    lexical: 'Search messages...',
    semantic: 'Ask about your conversations...',
    hybrid: 'Search or ask anything...'
  }
  return placeholders[searchType.value] || placeholders.hybrid
}

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const setSearchType = (type: 'lexical' | 'semantic' | 'hybrid') => {
  searchType.value = type
  useSemanticSearch.value = type === 'semantic' || type === 'hybrid'

  if (searchQuery.value) {
    performSearch()
  }
}

const toggleSemanticMode = () => {
  useSemanticSearch.value = !useSemanticSearch.value
  if (searchQuery.value) {
    performSearch()
  }
}

const onSearchInput = debounce((event: Event) => {
  const query = (event.target as HTMLInputElement).value

  if (query.trim()) {
    updateSuggestions(query)
    performSearch()
  } else {
    clearSearch()
  }
}, 300)

const performSearch = async () => {
  if (!searchQuery.value.trim()) return

  const query = buildSearchQuery()
  const startTime = Date.now()

  try {
    isSearching.value = true
    hasSearched.value = true

    let results: SearchResult[]

    // Choose search method based on type and options
    if (searchType.value === 'semantic' && useSemanticSearch.value) {
      results = (await backendSearchService.semanticSearch?.(query)) || []
    } else if (searchType.value === 'hybrid') {
      results =
        (await backendSearchService.hybridSearch?.(query)) ||
        (await backendSearchService.searchMessages(query))
    } else {
      results = await backendSearchService.searchMessages(query)
    }

    const searchTime = Date.now() - startTime
    lastSearchTime.value = searchTime
    searchResults.value = results

    emit('search-complete', results, searchQuery.value, searchTime)

    // Update suggestions based on results
    updateSearchSuggestions(results)
  } catch (error) {
    console.error('Search failed:', error)
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

const buildSearchQuery = (): SearchQuery => {
  return {
    text: searchQuery.value,
    filters: {
      ...filters,
      roles: filters.roles as Array<'user' | 'assistant' | 'system'>,
      dateRange:
        filters.dateRange.start && filters.dateRange.end
          ? {
              start: filters.dateRange.start,
              end: filters.dateRange.end
            }
          : undefined
    },
    options: {
      ...options,
      fuzzyMatch: searchType.value === 'lexical',
      semanticThreshold: useSemanticSearch.value ? semanticOptions.threshold : undefined
    }
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
  hasSearched.value = false
  lastSearchTime.value = undefined
  showSuggestions.value = false
  emit('search-clear')
}

const updateSuggestions = async (query: string) => {
  // Implementation would fetch suggestions from backend
  showSuggestions.value = true

  // Mock suggestions for demo
  suggestions.value = [
    { text: query, type: 'recent', label: 'Recent' },
    { text: `${query} error`, type: 'suggested', label: 'Suggested' }
  ]
}

const updateSearchSuggestions = (results: SearchResult[]) => {
  // Update suggestions based on search results
}

const applySuggestion = (suggestion: any) => {
  searchQuery.value = suggestion.text
  showSuggestions.value = false
  performSearch()
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!showSuggestions.value) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedSuggestionIndex.value = Math.min(
        selectedSuggestionIndex.value + 1,
        suggestions.value.length - 1
      )
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedSuggestionIndex.value = Math.max(selectedSuggestionIndex.value - 1, -1)
      break
    case 'Enter':
      event.preventDefault()
      if (selectedSuggestionIndex.value >= 0) {
        applySuggestion(suggestions.value[selectedSuggestionIndex.value])
      } else {
        performSearch()
      }
      break
    case 'Escape':
      showSuggestions.value = false
      selectedSuggestionIndex.value = -1
      break
  }
}

const applyQuickFilter = (filter: any) => {
  const index = activeQuickFilters.value.indexOf(filter.id)
  if (index >= 0) {
    activeQuickFilters.value.splice(index, 1)
  } else {
    activeQuickFilters.value.push(filter.id)
  }

  // Apply filter logic
  switch (filter.id) {
    case 'recent':
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      filters.dateRange.start = oneWeekAgo.toISOString().split('T')[0]
      break
    case 'errors':
      // Filter for error messages
      break
    // Add more filter implementations
  }

  if (searchQuery.value) {
    performSearch()
  }
}

const clearAllFilters = () => {
  filters.dateRange.start = ''
  filters.dateRange.end = ''
  filters.roles = []
  filters.chatIds = []
  activeQuickFilters.value = []

  if (searchQuery.value) {
    performSearch()
  }
}

const onMessageClick = (result: SearchResult) => {
  emit('message-click', result)
}

const onSimilarSearch = (messageId: string) => {
  // Implement similar message search
}

const startVoiceInput = () => {
  // Implement voice input
}

const exportResults = () => {
  // Implement result export
}

const saveSearch = () => {
  // Implement search saving
}

const suggestSimilar = () => {
  // Implement similar search suggestions
}

const updateStats = async () => {
  try {
    if (backendSearchService.getSemanticSearchStats) {
      searchStats.value = await backendSearchService.getSemanticSearchStats()
    }
  } catch (error) {
    console.error('Failed to update search stats:', error)
  }
}

// Lifecycle
onMounted(async () => {
  // Check for voice input support
  supportsVoiceInput.value = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window

  // Auto focus if requested
  if (props.autoFocus) {
    nextTick(() => {
      searchInputRef.value?.focus()
    })
  }

  // Update initial stats
  await updateStats()
})

// Watchers
watch(
  () => searchType.value,
  newType => {
    if (newType === 'semantic') {
      useSemanticSearch.value = true
    } else if (newType === 'lexical') {
      useSemanticSearch.value = false
    }
  }
)

// Clean up on unmount
onUnmounted(() => {
  // Clean up any resources
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
.semantic-search-panel {
  @apply bg-card border border-border rounded-lg overflow-hidden;
  max-height: v-bind('props.maxHeight');
}

.search-header {
  @apply flex items-center justify-between p-3 border-b border-border bg-muted/30;
}

.header-left {
  @apply flex items-center gap-3;
}

.expand-button {
  @apply p-1 rounded hover:bg-accent transition-colors;
}

.search-type-selector {
  @apply flex items-center gap-1 p-1 bg-background rounded border border-border;
}

.search-type-btn {
  @apply flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors
         hover:bg-accent;
}

.search-type-btn.active {
  @apply bg-primary text-primary-foreground;
}

.header-right {
  @apply flex items-center gap-2;
}

.search-stats {
  @apply flex items-center gap-3 text-xs text-muted-foreground;
}

.stat-item {
  @apply flex items-center gap-1;
}

.indexing-indicator {
  @apply flex items-center gap-1 text-yellow-600;
}

.settings-button {
  @apply p-2 rounded hover:bg-accent transition-colors;
}

.settings-button.active {
  @apply bg-accent;
}

.search-input-section {
  @apply relative;
}

.search-input-wrapper {
  @apply flex items-center gap-3 p-3 border-b border-border;
}

.search-icon {
  @apply text-muted-foreground flex-shrink-0;
}

.search-input {
  @apply flex-1 bg-transparent border-none outline-none text-base
         placeholder:text-muted-foreground disabled:opacity-50;
}

.input-actions {
  @apply flex items-center gap-1;
}

.action-button {
  @apply p-2 rounded hover:bg-accent transition-colors;
}

.semantic-toggle.active {
  @apply bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300;
}

.voice-button.active {
  @apply bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300;
}

.search-suggestions {
  @apply absolute top-full left-0 right-0 bg-popover border border-border
         rounded-b-lg shadow-lg z-10 max-h-48 overflow-y-auto;
}

.suggestion-item {
  @apply flex items-center gap-3 px-4 py-2 hover:bg-accent cursor-pointer
         border-b border-border last:border-b-0;
}

.suggestion-item.active {
  @apply bg-accent;
}

.suggestion-text {
  @apply flex-1;
}

.suggestion-type {
  @apply text-xs text-muted-foreground;
}

.advanced-filters {
  @apply p-4 border-b border-border bg-muted/10;
}

.filter-section h4,
.semantic-options h4,
.performance-settings h4 {
  @apply text-sm font-medium mb-3;
}

.filter-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.filter-group {
  @apply space-y-2;
}

.filter-group label {
  @apply block text-sm font-medium;
}

.filter-input,
.filter-select {
  @apply w-full px-3 py-2 border border-border rounded bg-background;
}

.date-range-inputs {
  @apply flex items-center gap-2;
}

.date-separator {
  @apply text-sm text-muted-foreground;
}

.checkbox-group,
.semantic-controls,
.performance-controls {
  @apply flex flex-wrap gap-3;
}

.checkbox-item {
  @apply flex items-center gap-2 cursor-pointer;
}

.checkbox-item input {
  @apply rounded;
}

.slider-group {
  @apply flex items-center gap-3;
}

.threshold-slider {
  @apply flex-1;
}

.slider-value {
  @apply text-sm font-medium w-12 text-right;
}

.quick-filters {
  @apply p-3 border-b border-border;
}

.filter-tags {
  @apply flex flex-wrap gap-2;
}

.filter-tag {
  @apply flex items-center gap-2 px-3 py-1.5 rounded-full border border-border
         text-sm transition-colors hover:bg-accent;
}

.filter-tag.active {
  @apply bg-primary text-primary-foreground border-primary;
}

.results-summary {
  @apply flex items-center justify-between p-3 border-b border-border bg-muted/20;
}

.summary-info {
  @apply flex items-center gap-3 text-sm;
}

.result-count {
  @apply flex items-center gap-2 font-medium;
}

.semantic-badge,
.hybrid-badge {
  @apply flex items-center gap-1 px-2 py-0.5 rounded text-xs;
}

.semantic-badge {
  @apply bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300;
}

.hybrid-badge {
  @apply bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300;
}

.search-time {
  @apply text-muted-foreground;
}

.result-actions {
  @apply flex items-center gap-1;
}

.search-results {
  @apply flex-1 overflow-y-auto;
}

.empty-results {
  @apply flex flex-col items-center justify-center p-8 text-center;
}

.empty-icon {
  @apply text-muted-foreground mb-4;
}

.empty-results h3 {
  @apply text-lg font-medium mb-2;
}

.empty-results p {
  @apply text-muted-foreground mb-4;
}

.empty-suggestions {
  @apply flex gap-2;
}

.suggestion-button {
  @apply flex items-center gap-2 px-4 py-2 border border-border rounded
         hover:bg-accent transition-colors;
}

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

/* Responsive adjustments */
@media (max-width: 768px) {
  .search-type-selector {
    @apply flex-col gap-1;
  }

  .filter-grid {
    @apply grid-cols-1;
  }

  .results-summary {
    @apply flex-col items-start gap-2;
  }

  .search-stats {
    @apply flex-col items-start gap-1;
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
}</style>
