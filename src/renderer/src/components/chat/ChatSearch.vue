<template>
  <div class="chat-search" :class="{ 'search-active': isSearchMode }">
    <!-- Search Toggle Button -->
    <button
      @click="toggleSearch"
      class="search-toggle"
      :class="{ active: isSearchMode }"
      :title="$t('search.toggleSearch')"
     aria-label="按钮">
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
           aria-label="输入框">

          <div class="search-controls">
            <button
              v-if="searchQuery"
              @click="clearSearch"
              class="clear-btn"
              :title="$t('common.clear')"
             aria-label="按钮">
              <X :size="14" />
            </button>

            <button
              @click="toggleGlobalSearch"
              class="global-search-btn"
              :title="$t('search.globalSearch')"
             aria-label="按钮">
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
             aria-label="按钮">
              <ChevronUp :size="14" />
            </button>

            <span class="result-position">
              {{ currentResultIndex + 1 }} / {{ searchResults.length }}
            </span>

            <button
              @click="nextResult"
              :disabled="currentResultIndex  aria-label="按钮">= searchResults.length - 1"
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
}>()

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
watch(
  () => targetChatId.value,
  () => {
    if (searchQuery.value) {
      performSearch()
    }
  }
)

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
