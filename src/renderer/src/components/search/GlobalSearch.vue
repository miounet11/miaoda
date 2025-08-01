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
          <button @click="toggleFullscreen" class="action-btn" :title="$t('search.toggleFullscreen')">
            <component :is="fullscreenIcon" :size="18" />
          </button>
          
          <button @click="close" class="action-btn close-btn" :title="$t('common.close')">
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
            <span>{{ $t('search.indexedMessages') }}: {{ searchStats.indexedMessages }}/{{ searchStats.totalMessages }}</span>
            <div v-if="indexStatus.needsRebuild" class="status-indicator warning" title="搜索索引需要重建">
              !
            </div>
          </div>
          
          <div class="stat-item">
            <Clock :size="14" />
            <span>{{ $t('search.lastUpdated') }}: {{ formatTime(searchStats.lastUpdated) }}</span>
          </div>
          
          <div v-if="searchStats.performanceMetrics?.avgSearchTime" class="stat-item">
            <TrendingUp :size="14" />
            <span>{{ $t('search.avgSearchTime') }}: {{ Math.round(searchStats.performanceMetrics.avgSearchTime) }}ms</span>
          </div>
          
          <div class="stat-actions">
            <button 
              @click="rebuildIndex" 
              :disabled="isIndexing"
              class="stat-action-btn"
              title="重建搜索索引"
            >
              <component :is="isIndexing ? Clock : Database" :size="12" :class="{ 'animate-spin': isIndexing }" />
              {{ isIndexing ? '重建中...' : '重建索引' }}
            </button>
            
            <button 
              @click="optimizeIndex" 
              :disabled="isOptimizing"
              class="stat-action-btn"
              title="优化搜索性能"
            >
              <component :is="isOptimizing ? Clock : TrendingUp" :size="12" :class="{ 'animate-spin': isOptimizing }" />
              {{ isOptimizing ? '优化中...' : '优化索引' }}
            </button>
          </div>
        </div>
        
        <button @click="showStats = false" class="stats-close">
          <ChevronUp :size="14" />
        </button>
      </div>
      
      <!-- Keyboard Shortcuts Help -->
      <div v-if="showKeyboardHelp" class="keyboard-shortcuts">
        <div class="shortcuts-header">
          <Keyboard :size="16" />
          <span>{{ $t('search.keyboardShortcuts') }}</span>
          <button @click="showKeyboardHelp = false" class="shortcuts-close">
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
          <button
            @click="showStats = !showStats"
            class="footer-btn"
            :class="{ 'active': showStats }"
          >
            <BarChart3 :size="14" />
            {{ $t('search.statistics') }}
          </button>
          
          <button
            @click="showKeyboardHelp = !showKeyboardHelp"
            class="footer-btn"
            :class="{ 'active': showKeyboardHelp }"
          >
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
  Search, X, Database, Clock, TrendingUp, ChevronUp, Keyboard, BarChart3,
  Maximize2, Minimize2
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
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
  'close': []
}>()

// Composables
const { t } = useI18n()

// Refs
const searchRef = ref<InstanceType<typeof MessageSearch>>()
const isVisible = ref(props.visible)
const isFullscreen = ref(props.fullscreenByDefault)
const showStats = ref(false)
const showKeyboardHelp = ref(false)

// Search state
const searchResults = ref<SearchResult[]>([])
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

const onSearchComplete = (results: SearchResult[]) => {
  searchResults.value = results
  updateStats()
}

const onSearchClear = () => {
  searchResults.value = []
  updateStats()
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
watch(() => props.visible, (newValue) => {
  if (newValue !== isVisible.value) {
    if (newValue) {
      open()
    } else {
      close()
    }
  }
})

// Expose methods for parent components
defineExpose({
  open,
  close,
  toggle: () => isVisible.value ? close() : open()
})
</script>

<style scoped>
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
</style>