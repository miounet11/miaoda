<template>
  <div class="search-settings-overlay" @click.self="$emit('close')">
    <div class="search-settings-modal">
      <!-- Header -->
      <div class="modal-header">
        <h2 class="modal-title">{{ $t('search.searchSettings') }}</h2>
        <button @click="$emit('close')" class="close-btn">
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
              <input
                type="range"
                v-model.number="settings.defaultMaxResults"
                min="10"
                max="500"
                step="10"
                class="setting-slider"
                @change="saveSettings"
              >
            </div>
            
            <!-- Search Delay -->
            <div class="setting-item">
              <label class="setting-label">
                {{ $t('search.searchDelay') }}
                <span class="setting-value">{{ settings.searchDelay }}ms</span>
              </label>
              <input
                type="range"
                v-model.number="settings.searchDelay"
                min="100"
                max="1000"
                step="50"
                class="setting-slider"
                @change="saveSettings"
              >
            </div>
            
            <!-- Auto Highlight -->
            <div class="setting-item">
              <label class="setting-label">{{ $t('search.autoHighlight') }}</label>
              <div class="setting-toggle">
                <input
                  type="checkbox"
                  v-model="settings.autoHighlight"
                  @change="saveSettings"
                  class="toggle-input"
                >
                <span class="toggle-slider" />
              </div>
            </div>
            
            <!-- Save Recent Searches -->
            <div class="setting-item">
              <label class="setting-label">{{ $t('search.saveRecentSearches') }}</label>
              <div class="setting-toggle">
                <input
                  type="checkbox"
                  v-model="settings.saveRecentSearches"
                  @change="saveSettings"
                  class="toggle-input"
                >
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
                <input
                  type="checkbox"
                  v-model="settings.defaultOptions.caseSensitive"
                  @change="saveSettings"
                  class="toggle-input"
                >
                <span class="toggle-slider" />
              </div>
            </div>
            
            <!-- Whole Words -->
            <div class="setting-item">
              <label class="setting-label">{{ $t('search.wholeWords') }}</label>
              <div class="setting-toggle">
                <input
                  type="checkbox"
                  v-model="settings.defaultOptions.wholeWords"
                  @change="saveSettings"
                  class="toggle-input"
                >
                <span class="toggle-slider" />
              </div>
            </div>
            
            <!-- Fuzzy Match -->
            <div class="setting-item">
              <label class="setting-label">{{ $t('search.fuzzyMatch') }}</label>
              <div class="setting-toggle">
                <input
                  type="checkbox"
                  v-model="settings.defaultOptions.fuzzyMatch"
                  @change="saveSettings"
                  class="toggle-input"
                >
                <span class="toggle-slider" />
              </div>
            </div>
            
            <!-- Fuzzy Threshold -->
            <div class="setting-item">
              <label class="setting-label">
                {{ $t('search.fuzzyThreshold') }}
                <span class="setting-value">{{ Math.round(settings.defaultOptions.fuzzyThreshold * 100) }}%</span>
              </label>
              <input
                type="range"
                v-model.number="settings.defaultOptions.fuzzyThreshold"
                min="0.1"
                max="1.0"
                step="0.05"
                class="setting-slider"
                @change="saveSettings"
              >
            </div>
            
            <!-- Highlight Matches -->
            <div class="setting-item">
              <label class="setting-label">{{ $t('search.highlightMatches') }}</label>
              <div class="setting-toggle">
                <input
                  type="checkbox"
                  v-model="settings.defaultOptions.highlightMatches"
                  @change="saveSettings"
                  class="toggle-input"
                >
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
              <input
                type="range"
                v-model.number="settings.performance.cacheSize"
                min="10"
                max="500"
                step="10"
                class="setting-slider"
                @change="saveSettings"
              >
            </div>
            
            <!-- Index Batch Size -->
            <div class="setting-item">
              <label class="setting-label">
                {{ $t('search.indexBatchSize') }}
                <span class="setting-value">{{ settings.performance.indexBatchSize }}</span>
              </label>
              <input
                type="range"
                v-model.number="settings.performance.indexBatchSize"
                min="10"
                max="1000"
                step="10"
                class="setting-slider"
                @change="saveSettings"
              >
            </div>
            
            <!-- Auto Index -->
            <div class="setting-item">
              <label class="setting-label">{{ $t('search.autoIndexMessages') }}</label>
              <div class="setting-toggle">
                <input
                  type="checkbox"
                  v-model="settings.performance.autoIndex"
                  @change="saveSettings"
                  class="toggle-input"
                >
                <span class="toggle-slider" />
              </div>
            </div>
            
            <!-- Background Indexing -->
            <div class="setting-item">
              <label class="setting-label">{{ $t('search.backgroundIndexing') }}</label>
              <div class="setting-toggle">
                <input
                  type="checkbox"
                  v-model="settings.performance.backgroundIndexing"
                  @change="saveSettings"
                  class="toggle-input"
                >
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
                <button @click="refreshStats" class="refresh-btn" :disabled="isRefreshing">
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
              <button @click="rebuildIndex" class="action-btn rebuild-btn" :disabled="isRebuilding">
                <RefreshCw :size="14" :class="{ 'animate-spin': isRebuilding }" />
                {{ $t('search.rebuildIndex') }}
              </button>
              
              <button @click="clearCache" class="action-btn clear-btn">
                <Trash2 :size="14" />
                {{ $t('search.clearCache') }}
              </button>
              
              <button @click="exportIndex" class="action-btn export-btn">
                <Download :size="14" />
                {{ $t('search.exportIndex') }}
              </button>
              
              <button @click="importIndex" class="action-btn import-btn">
                <Upload :size="14" />
                {{ $t('search.importIndex') }}
              </button>
            </div>
            
            <input
              ref="importFileRef"
              type="file"
              accept=".json"
              @change="handleImportFile"
              style="display: none"
            >
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="modal-footer">
        <div class="footer-info">
          <span class="version-info">
            {{ $t('search.searchVersion') }}: v{{ searchVersion }}
          </span>
        </div>
        
        <div class="footer-actions">
          <button @click="resetToDefaults" class="reset-btn">
            {{ $t('search.resetToDefaults') }}
          </button>
          
          <button @click="$emit('close')" class="close-footer-btn">
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
  X, Search, SlidersHorizontal, Zap, Database, RotateCcw, RefreshCw,
  Trash2, Download, Upload
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { searchService, type SearchOptions, type SearchStats } from '@renderer/src/services/search/SearchService'

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
  reader.onload = (e) => {
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
.search-settings-overlay {
  @apply fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4;
}

.search-settings-modal {
  @apply bg-background border border-border rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col;
}

.modal-header {
  @apply flex items-center justify-between p-6 border-b border-border;
}

.modal-title {
  @apply text-xl font-semibold;
}

.close-btn {
  @apply p-2 rounded-md hover:bg-accent transition-colors;
}

.modal-content {
  @apply flex-1 overflow-y-auto p-6 space-y-8;
}

.settings-section {
  @apply space-y-4;
}

.section-header {
  @apply flex items-center gap-2;
}

.section-header h3 {
  @apply text-lg font-medium;
}

.settings-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.setting-item {
  @apply space-y-2;
}

.setting-label {
  @apply flex items-center justify-between text-sm font-medium;
}

.setting-value {
  @apply text-xs font-mono text-muted-foreground;
}

.setting-select {
  @apply w-full px-3 py-2 border border-border rounded-md text-sm;
}

.setting-slider {
  @apply w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer;
}

.setting-slider::-webkit-slider-thumb {
  @apply appearance-none w-4 h-4 bg-primary rounded-full cursor-pointer;
}

.setting-slider::-moz-range-thumb {
  @apply w-4 h-4 bg-primary rounded-full cursor-pointer border-0;
}

.setting-toggle {
  @apply relative inline-flex h-6 w-11 items-center rounded-full bg-muted transition-colors;
}

.toggle-input {
  @apply sr-only;
}

.toggle-input:checked + .toggle-slider {
  @apply bg-primary;
}

.toggle-slider {
  @apply inline-block h-4 w-4 transform rounded-full bg-white transition-transform;
}

.toggle-input:checked + .toggle-slider {
  @apply translate-x-6;
}

.data-actions {
  @apply space-y-6;
}

.stats-card {
  @apply p-4 border border-border rounded-lg bg-muted/30;
}

.stats-header {
  @apply flex items-center justify-between mb-4;
}

.stats-header h4 {
  @apply font-medium;
}

.refresh-btn {
  @apply p-1 rounded hover:bg-accent transition-colors disabled:opacity-50;
}

.stats-grid {
  @apply space-y-2;
}

.stat-item {
  @apply flex justify-between text-sm;
}

.stat-label {
  @apply text-muted-foreground;
}

.stat-value {
  @apply font-mono;
}

.action-buttons {
  @apply grid grid-cols-2 md:grid-cols-4 gap-2;
}

.action-btn {
  @apply flex items-center justify-center gap-1 px-3 py-2 border border-border rounded text-sm hover:bg-accent transition-colors disabled:opacity-50;
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
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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
</style>