<template>
  <div class="search-settings-overlay" @click.self="$emit('close')">
    <div class="search-settings-modal">
      <!-- Header -->
      <div class="modal-header">
        <h2 class="modal-title">{{ $t('search.searchSettings') }}</h2>
        <button @click="$emit('close')" class="close-btn" aria-label="按钮">
          <X :size="20" />
        </button>
      </div>

      <!-- Content -->
      <div class="modal-content">
        <!-- General Settings -->
        <div class="settings-section">
          <div class="section-header">
            <Search :size="18" />
            <h3>{{ $t('search.generalSettings') }}</h3>
          </div>

          <div class="settings-grid">
            <!-- Default Max Results -->
            <div class="setting-item">
              <label class="setting-label">
                {{ $t('search.defaultMaxResults') }}
                <span class="setting-value">{{ settings.defaultMaxResults }}</span>
              </label>
              <input id="input-9shyhtib3"
                type="range"
                v-model.number="settings.defaultMaxResults"
                min="10"
                max="500"
                step="10"
                class="setting-slider"
                @change="saveSettings"
               aria-label="输入框">
            </div>

            <!-- Search Delay -->
            <div class="setting-item">
              <label class="setting-label">
                {{ $t('search.searchDelay') }}
                <span class="setting-value">{{ settings.searchDelay }}ms</span>
              </label>
              <input id="input-ftikzb0zj"
                type="range"
                v-model.number="settings.searchDelay"
                min="100"
                max="1000"
                step="50"
                class="setting-slider"
                @change="saveSettings"
               aria-label="输入框">
            </div>

            <!-- Auto Highlight -->
            <div class="setting-item">
              <label class="setting-label">{{ $t('search.autoHighlight') }}</label>
              <div class="setting-toggle">
                <input id="input-7oyiuak3j"
                  type="checkbox"
                  v-model="settings.autoHighlight"
                  @change="saveSettings"
                  class="toggle-input"
                 aria-label="输入框">
                <span class="toggle-slider" />
              </div>
            </div>

            <!-- Save Recent Searches -->
            <div class="setting-item">
              <label class="setting-label">{{ $t('search.saveRecentSearches') }}</label>
              <div class="setting-toggle">
                <input id="input-jqpbtatfb"
                  type="checkbox"
                  v-model="settings.saveRecentSearches"
                  @change="saveSettings"
                  class="toggle-input"
                 aria-label="输入框">
                <span class="toggle-slider" />
              </div>
            </div>
          </div>
        </div>

        <!-- Search Options -->
        <div class="settings-section">
          <div class="section-header">
            <SlidersHorizontal :size="18" />
            <h3>{{ $t('search.defaultSearchOptions') }}</h3>
          </div>

          <div class="settings-grid">
            <!-- Case Sensitive -->
            <div class="setting-item">
              <label class="setting-label">{{ $t('search.caseSensitive') }}</label>
              <div class="setting-toggle">
                <input id="input-2884eqqw9"
                  type="checkbox"
                  v-model="settings.defaultOptions.caseSensitive"
                  @change="saveSettings"
                  class="toggle-input"
                 aria-label="输入框">
                <span class="toggle-slider" />
              </div>
            </div>

            <!-- Whole Words -->
            <div class="setting-item">
              <label class="setting-label">{{ $t('search.wholeWords') }}</label>
              <div class="setting-toggle">
                <input id="input-fznj8l4bi"
                  type="checkbox"
                  v-model="settings.defaultOptions.wholeWords"
                  @change="saveSettings"
                  class="toggle-input"
                 aria-label="输入框">
                <span class="toggle-slider" />
              </div>
            </div>

            <!-- Fuzzy Match -->
            <div class="setting-item">
              <label class="setting-label">{{ $t('search.fuzzyMatch') }}</label>
              <div class="setting-toggle">
                <input id="input-2mm0zcjr8"
                  type="checkbox"
                  v-model="settings.defaultOptions.fuzzyMatch"
                  @change="saveSettings"
                  class="toggle-input"
                 aria-label="输入框">
                <span class="toggle-slider" />
              </div>
            </div>

            <!-- Fuzzy Threshold -->
            <div class="setting-item">
              <label class="setting-label">
                {{ $t('search.fuzzyThreshold') }}
                <span class="setting-value"
                  >{{ Math.round(settings.defaultOptions.fuzzyThreshold * 100) }}%</span
                >
              </label>
              <input id="input-oyqvormxs"
                type="range"
                v-model.number="settings.defaultOptions.fuzzyThreshold"
                min="0.1"
                max="1.0"
                step="0.05"
                class="setting-slider"
                @change="saveSettings"
               aria-label="输入框">
            </div>

            <!-- Highlight Matches -->
            <div class="setting-item">
              <label class="setting-label">{{ $t('search.highlightMatches') }}</label>
              <div class="setting-toggle">
                <input id="input-6d3fl43hw"
                  type="checkbox"
                  v-model="settings.defaultOptions.highlightMatches"
                  @change="saveSettings"
                  class="toggle-input"
                 aria-label="输入框">
                <span class="toggle-slider" />
              </div>
            </div>

            <!-- Default Sort -->
            <div class="setting-item">
              <label class="setting-label">{{ $t('search.defaultSort') }}</label>
              <select
                v-model="settings.defaultOptions.sortBy"
                class="setting-select"
                @change="saveSettings"
              >
                <option value="relevance">{{ $t('search.sortByRelevance') }}</option>
                <option value="date">{{ $t('search.sortByDate') }}</option>
                <option value="length">{{ $t('search.sortByLength') }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Performance Settings -->
        <div class="settings-section">
          <div class="section-header">
            <Zap :size="18" />
            <h3>{{ $t('search.performanceSettings') }}</h3>
          </div>

          <div class="settings-grid">
            <!-- Cache Size -->
            <div class="setting-item">
              <label class="setting-label">
                {{ $t('search.cacheSize') }}
                <span class="setting-value">{{ settings.performance.cacheSize }}</span>
              </label>
              <input id="input-9p1wzmygm"
                type="range"
                v-model.number="settings.performance.cacheSize"
                min="10"
                max="500"
                step="10"
                class="setting-slider"
                @change="saveSettings"
               aria-label="输入框">
            </div>

            <!-- Index Batch Size -->
            <div class="setting-item">
              <label class="setting-label">
                {{ $t('search.indexBatchSize') }}
                <span class="setting-value">{{ settings.performance.indexBatchSize }}</span>
              </label>
              <input id="input-o6ty2o18q"
                type="range"
                v-model.number="settings.performance.indexBatchSize"
                min="10"
                max="1000"
                step="10"
                class="setting-slider"
                @change="saveSettings"
               aria-label="输入框">
            </div>

            <!-- Auto Index -->
            <div class="setting-item">
              <label class="setting-label">{{ $t('search.autoIndexMessages') }}</label>
              <div class="setting-toggle">
                <input id="input-saqmqwga7"
                  type="checkbox"
                  v-model="settings.performance.autoIndex"
                  @change="saveSettings"
                  class="toggle-input"
                 aria-label="输入框">
                <span class="toggle-slider" />
              </div>
            </div>

            <!-- Background Indexing -->
            <div class="setting-item">
              <label class="setting-label">{{ $t('search.backgroundIndexing') }}</label>
              <div class="setting-toggle">
                <input id="input-4bis0yucm"
                  type="checkbox"
                  v-model="settings.performance.backgroundIndexing"
                  @change="saveSettings"
                  class="toggle-input"
                 aria-label="输入框">
                <span class="toggle-slider" />
              </div>
            </div>
          </div>
        </div>

        <!-- Data Management -->
        <div class="settings-section">
          <div class="section-header">
            <Database :size="18" />
            <h3>{{ $t('search.dataManagement') }}</h3>
          </div>

          <div class="data-actions">
            <!-- Index Statistics -->
            <div class="stats-card">
              <div class="stats-header">
                <h4>{{ $t('search.indexStatistics') }}</h4>
                <button @click="refreshStats" class="refresh-btn" :disabled="isRefreshing" aria-label="按钮">
                  <RotateCcw :size="14" :class="{ 'animate-spin': isRefreshing }" />
                </button>
              </div>

              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-label">{{ $t('search.indexedMessages') }}:</span>
                  <span class="stat-value">{{ searchStats.indexedMessages }}</span>
                </div>

                <div class="stat-item">
                  <span class="stat-label">{{ $t('search.lastUpdated') }}:</span>
                  <span class="stat-value">{{ formatTime(searchStats.lastUpdated) }}</span>
                </div>

                <div class="stat-item">
                  <span class="stat-label">{{ $t('search.indexSize') }}:</span>
                  <span class="stat-value">{{ formatBytes(indexSize) }}</span>
                </div>
              </div>
            </div>

            <!-- Management Actions -->
            <div class="action-buttons">
              <button @click="rebuildIndex" class="action-btn rebuild-btn" :disabled="isRebuilding" aria-label="按钮">
                <RefreshCw :size="14" :class="{ 'animate-spin': isRebuilding }" />
                {{ $t('search.rebuildIndex') }}
              </button>

              <button @click="clearCache" class="action-btn clear-btn" aria-label="按钮">
                <Trash2 :size="14" />
                {{ $t('search.clearCache') }}
              </button>

              <button @click="exportIndex" class="action-btn export-btn" aria-label="按钮">
                <Download :size="14" />
                {{ $t('search.exportIndex') }}
              </button>

              <button @click="importIndex" class="action-btn import-btn" aria-label="按钮">
                <Upload :size="14" />
                {{ $t('search.importIndex') }}
              </button>
            </div>

            <input id="input-ik1l5xvk9"
              ref="importFileRef"
              type="file"
              accept=".json"
              @change="handleImportFile"
              style="display: none"
             aria-label="输入框">
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <div class="footer-info">
          <span class="version-info"> {{ $t('search.searchVersion') }}: v{{ searchVersion }} </span>
        </div>

        <div class="footer-actions">
          <button @click="resetToDefaults" class="reset-btn" aria-label="按钮">
            {{ $t('search.resetToDefaults') }}
          </button>

          <button @click="$emit('close')" class="close-footer-btn" aria-label="按钮">
            {{ $t('common.close') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  X,
  Search,
  SlidersHorizontal,
  Zap,
  Database,
  RotateCcw,
  RefreshCw,
  Trash2,
  Download,
  Upload
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import {
  searchService,
  type SearchOptions,
  type SearchStats
} from '@renderer/src/services/search/SearchService'

// Emits
const emit = defineEmits<{
  close: []
  'settings-changed': [settings: SearchSettingsConfig]
}>()

// Types
interface SearchSettingsConfig {
  defaultMaxResults: number
  searchDelay: number
  autoHighlight: boolean
  saveRecentSearches: boolean
  defaultOptions: SearchOptions
  performance: {
    cacheSize: number
    indexBatchSize: number
    autoIndex: boolean
    backgroundIndexing: boolean
  }
}

// Composables
const { t } = useI18n()

// Refs
const importFileRef = ref<HTMLInputElement>()
const isRefreshing = ref(false)
const isRebuilding = ref(false)
const searchStats = ref<SearchStats>({
  totalMessages: 0,
  indexedMessages: 0,
  searchTime: 0,
  resultCount: 0,
  lastUpdated: new Date()
})
const indexSize = ref(0)
const searchVersion = '1.0.0'

// Default settings
const defaultSettings: SearchSettingsConfig = {
  defaultMaxResults: 100,
  searchDelay: 300,
  autoHighlight: true,
  saveRecentSearches: true,
  defaultOptions: {
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
  },
  performance: {
    cacheSize: 100,
    indexBatchSize: 50,
    autoIndex: true,
    backgroundIndexing: true
  }
}

const settings = ref<SearchSettingsConfig>({ ...defaultSettings })

// Methods
const loadSettings = () => {
  try {
    const saved = localStorage.getItem('miaoda-search-settings')
    if (saved) {
      const parsed = JSON.parse(saved)
      settings.value = {
        ...defaultSettings,
        ...parsed,
        defaultOptions: {
          ...defaultSettings.defaultOptions,
          ...parsed.defaultOptions
        },
        performance: {
          ...defaultSettings.performance,
          ...parsed.performance
        }
      }
    }
  } catch (error) {
    console.warn('Failed to load search settings:', error)
  }
}

const saveSettings = () => {
  try {
    localStorage.setItem('miaoda-search-settings', JSON.stringify(settings.value))
    emit('settings-changed', settings.value)
  } catch (error) {
    console.error('Failed to save search settings:', error)
  }
}

const refreshStats = async () => {
  isRefreshing.value = true
  try {
    searchStats.value = searchService.getSearchStats()
    // Calculate approximate index size
    indexSize.value = new Blob([JSON.stringify(searchStats.value)]).size * 10 // Rough estimate
  } finally {
    isRefreshing.value = false
  }
}

const rebuildIndex = async () => {
  if (!confirm(t('search.confirmRebuildIndex'))) return

  isRebuilding.value = true
  try {
    searchService.clearIndex()
    // Here you would trigger a re-index of all messages
    // This would depend on your chat store implementation
    await refreshStats()
  } finally {
    isRebuilding.value = false
  }
}

const clearCache = () => {
  if (confirm(t('search.confirmClearCache'))) {
    searchService.clearCache()
    searchService.clearRecentSearches()
  }
}

const exportIndex = () => {
  const exportData = {
    version: searchVersion,
    timestamp: new Date().toISOString(),
    stats: searchStats.value,
    settings: settings.value
  }

  const dataStr = JSON.stringify(exportData, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })

  const link = document.createElement('a')
  link.href = URL.createObjectURL(dataBlob)
  link.download = `search-index-export-${new Date().toISOString().split('T')[0]}.json`
  link.click()

  URL.revokeObjectURL(link.href)
}

const importIndex = () => {
  importFileRef.value?.click()
}

const handleImportFile = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = e => {
    try {
      const result = e.target?.result as string
      const importData = JSON.parse(result)

      if (importData.settings) {
        settings.value = {
          ...defaultSettings,
          ...importData.settings
        }
        saveSettings()
      }

      alert(t('search.importSuccess'))
    } catch (error) {
      console.error('Failed to import search settings:', error)
      alert(t('search.importError'))
    }
  }

  reader.readAsText(file)
}

const resetToDefaults = () => {
  if (confirm(t('search.confirmResetSettings'))) {
    settings.value = { ...defaultSettings }
    saveSettings()
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

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

// Lifecycle
onMounted(() => {
  loadSettings()
  refreshStats()
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
.search-settings-overlay {
  @apply fixed inset-0 z-modal-backdrop flex items-center justify-center gap-1 px-3 py-2 border border-border rounded text-sm hover:bg-accent transition-colors disabled:opacity-50;
}

.rebuild-btn {
  @apply text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950;
}

.clear-btn {
  @apply text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950;
}

.export-btn {
  @apply text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-950;
}

.import-btn {
  @apply text-purple-600 border-purple-200 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-950;
}

.modal-footer {
  @apply flex items-center justify-between p-6 border-t border-border;
}

.version-info {
  @apply text-xs text-muted-foreground;
}

.footer-actions {
  @apply flex items-center gap-2;
}

.reset-btn,
.close-footer-btn {
  @apply px-4 py-2 border border-border rounded hover:bg-accent transition-colors;
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

/* Responsive */
@media (max-width: 768px) {
  .search-settings-modal {
    @apply max-w-full mx-2;
  }

  .settings-grid {
    @apply grid-cols-1;
  }

  .action-buttons {
    @apply grid-cols-1;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .search-settings-modal {
    @apply border-2;
  }

  .setting-slider:focus {
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
