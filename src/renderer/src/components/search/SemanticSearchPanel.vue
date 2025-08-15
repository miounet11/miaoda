<template>
  <div class="semantic-search-panel" :class="{ 'expanded': isExpanded }">
    <!-- Search Header -->
    <div class="search-header">
      <div class="header-left">
        <button 
          @click="toggleExpanded"
          class="expand-button"
          :title="isExpanded ? 'Collapse Panel' : 'Expand Panel'"
        >
          <component :is="isExpanded ? ChevronDown : ChevronRight" :size="16" />
        </button>
        
        <div class="search-type-selector">
          <button
            v-for="type in searchTypes"
            :key="type.id"
            @click="setSearchType(type.id)"
            class="search-type-btn"
            :class="{ 'active': searchType === type.id }"
            :title="type.description"
          >
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
          :class="{ 'active': showSettings }"
          title="Search Settings"
        >
          <Settings :size="16" />
        </button>
      </div>
    </div>

    <!-- Search Input -->
    <div class="search-input-section">
      <div class="search-input-wrapper">
        <Search :size="20" class="search-icon" />
        
        <input
          ref="searchInputRef"
          v-model="searchQuery"
          @input="onSearchInput"
          @keydown="handleKeydown"
          class="search-input"
          type="text"
          :placeholder="getPlaceholder()"
          :disabled="isSearching"
        >

        <div class="input-actions">
          <!-- Semantic Search Toggle -->
          <button
            v-if="searchType === 'hybrid' || searchType === 'semantic'"
            @click="toggleSemanticMode"
            class="action-button semantic-toggle"
            :class="{ 'active': useSemanticSearch }"
            :title="useSemanticSearch ? 'Disable Semantic Search' : 'Enable Semantic Search'"
          >
            <Brain :size="16" />
          </button>

          <!-- Voice Input -->
          <button
            v-if="supportsVoiceInput"
            @click="startVoiceInput"
            class="action-button voice-button"
            :class="{ 'active': isListening }"
            :title="isListening ? 'Stop Listening' : 'Voice Input'"
          >
            <component :is="isListening ? MicOff : Mic" :size="16" />
          </button>

          <!-- Clear Search -->
          <button
            v-if="searchQuery"
            @click="clearSearch"
            class="action-button clear-button"
            title="Clear Search"
          >
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
          :class="{ 'active': selectedSuggestionIndex === index }"
        >
          <component :is="suggestion.type === 'recent' ? History : suggestion.type === 'similar' ? Users : Lightbulb" :size="14" />
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
              <input
                v-model="filters.dateRange.start"
                type="date"
                class="filter-input date-input"
              >
              <span class="date-separator">to</span>
              <input
                v-model="filters.dateRange.end"
                type="date"
                class="filter-input date-input"
              >
            </div>
          </div>

          <!-- Role Filter -->
          <div class="filter-group">
            <label>Message Role</label>
            <div class="checkbox-group">
              <label class="checkbox-item">
                <input
                  v-model="filters.roles"
                  type="checkbox"
                  value="user"
                >
                <span>User</span>
              </label>
              <label class="checkbox-item">
                <input
                  v-model="filters.roles"
                  type="checkbox"
                  value="assistant"
                >
                <span>Assistant</span>
              </label>
              <label class="checkbox-item">
                <input
                  v-model="filters.roles"
                  type="checkbox"
                  value="system"
                >
                <span>System</span>
              </label>
            </div>
          </div>

          <!-- Similarity Threshold (Semantic Only) -->
          <div v-if="useSemanticSearch" class="filter-group">
            <label>Similarity Threshold</label>
            <div class="slider-group">
              <input
                v-model.number="semanticOptions.threshold"
                type="range"
                min="0"
                max="1"
                step="0.1"
                class="threshold-slider"
              >
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
            <input
              v-model="semanticOptions.includeContext"
              type="checkbox"
            >
            <span>Include conversation context</span>
          </label>
          
          <label class="checkbox-item">
            <input
              v-model="semanticOptions.expandQuery"
              type="checkbox"
            >
            <span>Expand query with synonyms</span>
          </label>
          
          <label class="checkbox-item">
            <input
              v-model="semanticOptions.useCrossLingual"
              type="checkbox"
            >
            <span>Cross-lingual search</span>
          </label>
        </div>
      </div>

      <!-- Performance Settings -->
      <div class="performance-settings">
        <h4>Performance</h4>
        
        <div class="performance-controls">
          <label class="checkbox-item">
            <input
              v-model="options.useCache"
              type="checkbox"
            >
            <span>Use search cache</span>
          </label>
          
          <label class="checkbox-item">
            <input
              v-model="options.prefetchResults"
              type="checkbox"
            >
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
          :class="{ 'active': activeQuickFilters.includes(filter.id) }"
        >
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
        
        <span v-if="lastSearchTime" class="search-time">
          in {{ lastSearchTime }}ms
        </span>
      </div>

      <div class="result-actions">
        <button
          @click="exportResults"
          class="action-button export-button"
          title="Export Results"
        >
          <Download :size="14" />
          Export
        </button>
        
        <button
          @click="saveSearch"
          class="action-button save-button"
          title="Save Search"
        >
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
        <button @click="suggestSimilar" class="suggestion-button">
          <Lightbulb :size="16" />
          Get suggestions
        </button>
        <button @click="clearAllFilters" class="suggestion-button">
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
  Search, Brain, Settings, Database, Clock, Loader2, ChevronDown, ChevronRight,
  Mic, MicOff, X, History, Users, Lightbulb, Zap, Download, Bookmark,
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
const suggestions = ref<Array<{
  text: string
  type: 'recent' | 'similar' | 'suggested'
  label: string
}>>([])

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
      results = await backendSearchService.semanticSearch?.(query) || []
    } else if (searchType.value === 'hybrid') {
      results = await backendSearchService.hybridSearch?.(query) || 
               await backendSearchService.searchMessages(query)
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
      dateRange: filters.dateRange.start && filters.dateRange.end ? {
        start: filters.dateRange.start,
        end: filters.dateRange.end
      } : undefined
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
watch(() => searchType.value, (newType) => {
  if (newType === 'semantic') {
    useSemanticSearch.value = true
  } else if (newType === 'lexical') {
    useSemanticSearch.value = false
  }
})

// Clean up on unmount
onUnmounted(() => {
  // Clean up any resources
})
</script>

<style scoped>
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
</style>