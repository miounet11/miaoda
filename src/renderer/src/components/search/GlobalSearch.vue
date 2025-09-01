<template>
  <div class="global-search-overlay" v-if="isVisible" @click.self="close">
    <div class="global-search-modal" :class="modalClasses">
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="header-content">
          <Search :size="20" class="header-icon" />
          <h2 class="modal-title">{{ $t('search.globalSearch') }}</h2>
        </div>

        <div class="header-actions">
          <button
            @click="toggleFullscreen"
            class="action-btn"
            :title="$t('search.toggleFullscreen')"
           aria-label="按钮">
            <component :is="fullscreenIcon" :size="18" />
          </button>

          <button @click="close" class="action-btn close-btn" :title="$t('common.close')" aria-label="按钮">
            <X :size="18" />
          </button>
        </div>
      </div>

      <!-- Search Interface -->
      <div class="search-content">
        <MessageSearch
          ref="searchRef"
          :auto-focus="true"
          :show-quick-filters="true"
          :max-height="searchMaxHeight"
          @message-click="onMessageClick"
          @chat-click="onChatClick"
          @search-complete="onSearchComplete"
          @search-clear="onSearchClear"
        />
      </div>

      <!-- Search Stats -->
      <div v-if="showStats" class="search-stats">
        <div class="stats-content">
          <div class="stat-item">
            <Database :size="14" />
            <span
              >{{ $t('search.indexedMessages') }}: {{ searchStats.indexedMessages }}/{{
                searchStats.totalMessages
              }}</span
            >
            <div
              v-if="indexStatus.needsRebuild"
              class="status-indicator warning"
              title="搜索索引需要重建"
            >
              !
            </div>
          </div>

          <div class="stat-item">
            <Clock :size="14" />
            <span>{{ $t('search.lastUpdated') }}: {{ formatTime(searchStats.lastUpdated) }}</span>
          </div>

          <div v-if="searchStats.performanceMetrics?.avgSearchTime" class="stat-item">
            <TrendingUp :size="14" />
            <span
              >{{ $t('search.avgSearchTime') }}:
              {{ Math.round(searchStats.performanceMetrics.avgSearchTime) }}ms</span
            >
          </div>

          <div class="stat-actions">
            <button
              @click="rebuildIndex"
              :disabled="isIndexing"
              class="stat-action-btn"
              title="重建搜索索引"
             aria-label="按钮">
              <component
                :is="isIndexing ? Clock : Database"
                :size="12"
                :class="{ 'animate-spin': isIndexing }"
              />
              {{ isIndexing ? '重建中...' : '重建索引' }}
            </button>

            <button
              @click="optimizeIndex"
              :disabled="isOptimizing"
              class="stat-action-btn"
              title="优化搜索性能"
             aria-label="按钮">
              <component
                :is="isOptimizing ? Clock : TrendingUp"
                :size="12"
                :class="{ 'animate-spin': isOptimizing }"
              />
              {{ isOptimizing ? '优化中...' : '优化索引' }}
            </button>
          </div>
        </div>

        <button @click="showStats = false" class="stats-close" aria-label="按钮">
          <ChevronUp :size="14" />
        </button>
      </div>

      <!-- Keyboard Shortcuts Help -->
      <div v-if="showKeyboardHelp" class="keyboard-shortcuts">
        <div class="shortcuts-header">
          <Keyboard :size="16" />
          <span>{{ $t('search.keyboardShortcuts') }}</span>
          <button @click="showKeyboardHelp = false" class="shortcuts-close" aria-label="按钮">
            <X :size="14" />
          </button>
        </div>

        <div class="shortcuts-list">
          <div class="shortcut-item">
            <kbd>{{ isMac ? '⌘' : 'Ctrl' }} + K</kbd>
            <span>{{ $t('search.openGlobalSearch') }}</span>
          </div>

          <div class="shortcut-item">
            <kbd>{{ isMac ? '⌘' : 'Ctrl' }} + F</kbd>
            <span>{{ $t('search.focusSearchInput') }}</span>
          </div>

          <div class="shortcut-item">
            <kbd>Esc</kbd>
            <span>{{ $t('search.closeSearch') }}</span>
          </div>

          <div class="shortcut-item">
            <kbd>↑ ↓</kbd>
            <span>{{ $t('search.navigateResults') }}</span>
          </div>

          <div class="shortcut-item">
            <kbd>Enter</kbd>
            <span>{{ $t('search.openResult') }}</span>
          </div>

          <div class="shortcut-item">
            <kbd>{{ isMac ? '⌘' : 'Ctrl' }} + Enter</kbd>
            <span>{{ $t('search.openInNewTab') }}</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <div class="footer-left">
          <button @click="showStats = !showStats" class="footer-btn" :class="{ active: showStats }" aria-label="按钮">
            <BarChart3 :size="14" />
            {{ $t('search.statistics') }}
          </button>

          <button
            @click="showKeyboardHelp = !showKeyboardHelp"
            class="footer-btn"
            :class="{ active: showKeyboardHelp }"
           aria-label="按钮">
            <Keyboard :size="14" />
            {{ $t('search.shortcuts') }}
          </button>
        </div>

        <div class="footer-right">
          <span class="footer-text">
            {{ resultSummary }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import {
  Search,
  X,
  Database,
  Clock,
  TrendingUp,
  ChevronUp,
  Keyboard,
  BarChart3,
  Maximize2,
  Minimize2
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { debounce } from '@renderer/src/utils/performance'
import { backendSearchService } from '@renderer/src/services/search/BackendSearchService'
import type { SearchResult, SearchStats } from '@main/db/searchTypes'
import MessageSearch from './MessageSearch.vue'

// Props
interface Props {
  visible?: boolean
  fullscreenByDefault?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  fullscreenByDefault: false
})

// Emits
const emit = defineEmits<{
  'update:visible': [visible: boolean]
  'message-select': [messageId: string, chatId: string]
  'chat-select': [chatId: string]
  close: []
}>()

// Composables
const { t } = useI18n()

// Refs
const searchRef = ref<InstanceType<typeof MessageSearch>>()
const isVisible = ref(props.visible)
const isFullscreen = ref(props.fullscreenByDefault)
const showStats = ref(false)
const showKeyboardHelp = ref(false)

// Enhanced search state with performance tracking
const searchResults = ref<SearchResult[]>([])
const searchQuery = ref('')
const isSearching = ref(false)
const searchError = ref<string | null>(null)
const searchCache = ref(new Map<string, { results: SearchResult[]; timestamp: number }>())
const searchPerformance = ref({
  searchStartTime: 0,
  lastSearchTime: 0,
  averageSearchTime: 0,
  searchCount: 0
})
const searchStats = ref<SearchStats>({
  totalMessages: 0,
  indexedMessages: 0,
  searchTime: 0,
  resultCount: 0,
  lastUpdated: new Date()
})

const indexStatus = ref({
  needsRebuild: false,
  messageCount: 0,
  indexedCount: 0
})

const isIndexing = ref(false)
const isOptimizing = ref(false)

// Platform detection
const isMac = ref(false)

// Computed properties
const modalClasses = computed(() => ({
  'modal-fullscreen': isFullscreen.value,
  'modal-windowed': !isFullscreen.value
}))

const fullscreenIcon = computed(() => {
  return isFullscreen.value ? Minimize2 : Maximize2
})

const searchMaxHeight = computed(() => {
  if (isFullscreen.value) {
    return 'calc(100vh - 200px)'
  }
  return '70vh'
})

const resultSummary = computed(() => {
  if (searchResults.value.length === 0) {
    return t('search.noResultsSelected')
  }

  return t('search.resultsSelected', {
    count: searchResults.value.length,
    indexed: searchStats.value.indexedMessages
  })
})

// Methods
const open = () => {
  isVisible.value = true
  emit('update:visible', true)

  nextTick(() => {
    // Auto-focus is handled by the MessageSearch component
    updateStats()
  })
}

const close = () => {
  isVisible.value = false
  emit('update:visible', false)
  showStats.value = false
  showKeyboardHelp.value = false
  emit('close')
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

const onMessageClick = (message: any) => {
  emit('message-select', message.id, message.chatId)

  // Optionally close modal after selection
  if (!isFullscreen.value) {
    close()
  }
}

const onChatClick = (chatId: string) => {
  emit('chat-select', chatId)

  // Optionally close modal after selection
  if (!isFullscreen.value) {
    close()
  }
}

const onSearchComplete = (results: SearchResult[], query?: string, searchTime?: number) => {
  searchResults.value = results
  isSearching.value = false
  searchError.value = null

  // Update performance metrics
  if (searchTime !== undefined) {
    updateSearchPerformance(searchTime)
  }

  // Cache results for faster subsequent access
  if (query && query.trim()) {
    searchCache.value.set(query.toLowerCase().trim(), {
      results: [...results],
      timestamp: Date.now()
    })

    // Limit cache size
    if (searchCache.value.size > 50) {
      const entries = Array.from(searchCache.value.entries())
      searchCache.value.clear()
      // Keep most recent 25 entries
      entries.slice(-25).forEach(([k, v]) => searchCache.value.set(k, v))
    }
  }

  updateStats()

  // Announce results for accessibility
  announceSearchResults(results.length)
}

const updateSearchPerformance = (searchTime: number) => {
  searchPerformance.value.lastSearchTime = searchTime
  searchPerformance.value.searchCount++

  // Calculate rolling average
  const currentAvg = searchPerformance.value.averageSearchTime
  const count = searchPerformance.value.searchCount
  searchPerformance.value.averageSearchTime = (currentAvg * (count - 1) + searchTime) / count
}

const announceSearchResults = (count: number) => {
  // For screen readers
  const message =
    count === 0 ? 'No results found' : `Found ${count} result${count !== 1 ? 's' : ''}`

  console.log(`Search announcement: ${message}`)
}

const onSearchClear = () => {
  searchResults.value = []
  searchQuery.value = ''
  isSearching.value = false
  searchError.value = null
  updateStats()

  // Focus back to search input for better UX
  nextTick(() => {
    searchRef.value?.$refs?.searchInputRef?.focus()
  })
}

const updateStats = async () => {
  try {
    searchStats.value = await backendSearchService.getSearchStats()
    indexStatus.value = await backendSearchService.getSearchIndexStatus()
  } catch (error) {
    console.error('Failed to update search stats:', error)
  }
}

const rebuildIndex = async () => {
  if (isIndexing.value) return

  try {
    isIndexing.value = true
    await backendSearchService.rebuildSearchIndex()
    await updateStats()

    // Show success message (could use toast service)
    console.log('Search index rebuilt successfully')
  } catch (error) {
    console.error('Failed to rebuild search index:', error)
    // Show error message
  } finally {
    isIndexing.value = false
  }
}

const optimizeIndex = async () => {
  if (isOptimizing.value) return

  try {
    isOptimizing.value = true
    await backendSearchService.optimizeSearchIndex()
    await updateStats()

    // Show success message
    console.log('Search index optimized successfully')
  } catch (error) {
    console.error('Failed to optimize search index:', error)
    // Show error message
  } finally {
    isOptimizing.value = false
  }
}

const formatTime = (date: Date): string => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) {
    return t('time.justNow')
  } else if (diff < 3600000) {
    return t('time.minutesAgo', { minutes: Math.floor(diff / 60000) })
  } else if (diff < 86400000) {
    return t('time.hoursAgo', { hours: Math.floor(diff / 3600000) })
  } else {
    return date.toLocaleDateString()
  }
}

// Keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  // Only handle shortcuts when modal is visible
  if (!isVisible.value) return

  const { key, ctrlKey, metaKey, shiftKey } = event
  const cmdKey = isMac.value ? metaKey : ctrlKey

  // Escape to close
  if (key === 'Escape') {
    event.preventDefault()
    close()
    return
  }

  // Ctrl/Cmd + F to focus search
  if (cmdKey && key === 'f') {
    event.preventDefault()
    searchRef.value?.$refs.searchInputRef?.focus()
    return
  }

  // F11 or Ctrl/Cmd + Shift + F to toggle fullscreen
  if (key === 'F11' || (cmdKey && shiftKey && key === 'F')) {
    event.preventDefault()
    toggleFullscreen()
    return
  }

  // Ctrl/Cmd + / to show keyboard shortcuts
  if (cmdKey && key === '/') {
    event.preventDefault()
    showKeyboardHelp.value = !showKeyboardHelp.value
    return
  }

  // Ctrl/Cmd + I to show stats
  if (cmdKey && key === 'i') {
    event.preventDefault()
    showStats.value = !showStats.value
    return
  }
}

// Global keyboard shortcut to open search
const handleGlobalKeydown = (event: KeyboardEvent) => {
  const { key, ctrlKey, metaKey } = event
  const cmdKey = isMac.value ? metaKey : ctrlKey

  // Ctrl/Cmd + K to open global search
  if (cmdKey && key === 'k') {
    event.preventDefault()
    if (!isVisible.value) {
      open()
    }
    return
  }

  // If modal is visible, handle modal-specific shortcuts
  if (isVisible.value) {
    handleKeydown(event)
  }
}

// Lifecycle
onMounted(() => {
  // Detect platform
  isMac.value = navigator.platform.toUpperCase().indexOf('MAC') >= 0

  // Add global keyboard listener
  document.addEventListener('keydown', handleGlobalKeydown)

  // Update initial stats
  updateStats()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
})

// Watch for prop changes
watch(
  () => props.visible,
  newValue => {
    if (newValue !== isVisible.value) {
      if (newValue) {
        open()
      } else {
        close()
      }
    }
  }
)

// Expose methods for parent components
defineExpose({
  open,
  close,
  toggle: () => (isVisible.value ? close() : open())
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
.global-search-overlay {
  @apply fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4;
  animation: fadeIn 0.2s ease-out;
}

.global-search-modal {
  @apply bg-background border border-border rounded-lg shadow-2xl overflow-hidden flex flex-col;
  animation: slideUp 0.3s ease-out;
}

.modal-windowed {
  @apply w-full max-w-4xl h-[80vh];
}

.modal-fullscreen {
  @apply w-full h-full max-w-none rounded-none;
}

.modal-header {
  @apply flex items-center justify-between p-4 border-b border-border bg-muted/30;
}

.header-content {
  @apply flex items-center gap-3;
}

.header-icon {
  @apply text-primary;
}

.modal-title {
  @apply text-lg font-semibold;
}

.header-actions {
  @apply flex items-center gap-1;
}

.action-btn {
  @apply p-2 rounded-md hover:bg-accent transition-colors;
}

.close-btn {
  @apply text-muted-foreground hover:text-destructive;
}

.search-content {
  @apply flex-1 overflow-hidden;
}

.search-stats {
  @apply flex items-center justify-between p-3 border-t border-border bg-muted/20;
}

.stats-content {
  @apply flex items-center gap-6 text-sm text-muted-foreground;
}

.stat-item {
  @apply flex items-center gap-2 relative;
}

.status-indicator {
  @apply w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold;
}

.status-indicator.warning {
  @apply bg-yellow-500 text-yellow-900;
}

.stat-actions {
  @apply flex items-center gap-2 ml-auto;
}

.stat-action-btn {
  @apply flex items-center gap-1 px-2 py-1 text-xs rounded border border-border 
         hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

.stats-close {
  @apply p-1 rounded hover:bg-accent transition-colors;
}

.keyboard-shortcuts {
  @apply border-t border-border bg-muted/20;
}

.shortcuts-header {
  @apply flex items-center justify-between p-3 border-b border-border;
}

.shortcuts-close {
  @apply p-1 rounded hover:bg-accent transition-colors;
}

.shortcuts-list {
  @apply p-4 grid grid-cols-1 md:grid-cols-2 gap-3;
}

.shortcut-item {
  @apply flex items-center justify-between text-sm;
}

.shortcut-item kbd {
  @apply px-2 py-1 bg-muted border border-border rounded text-xs font-mono font-medium;
}

.modal-footer {
  @apply flex items-center justify-between p-4 border-t border-border bg-muted/30;
}

.footer-left {
  @apply flex items-center gap-2;
}

.footer-btn {
  @apply flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors hover:bg-accent;
}

.footer-btn.active {
  @apply bg-primary text-primary-foreground;
}

.footer-right {
  @apply flex items-center gap-2;
}

.footer-text {
  @apply text-xs text-muted-foreground;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .global-search-overlay {
    @apply p-2;
  }

  .modal-windowed {
    @apply w-full h-[90vh];
  }

  .modal-header {
    @apply p-3;
  }

  .shortcuts-list {
    @apply grid-cols-1;
  }

  .footer-left {
    @apply flex-col items-start gap-1;
  }

  .modal-footer {
    @apply flex-col items-start gap-3;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .global-search-modal {
    @apply border-2;
  }

  .action-btn:focus {
    @apply ring-2 ring-primary;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .global-search-overlay {
    animation: none;
  }

  .global-search-modal {
    animation: none;
  }
}


/* 焦点样式 */
:focus-visible {
  outline: 2px solid hsl(var(--ring, 59 130 230));
  outline-offset: 2px;
}</style>
