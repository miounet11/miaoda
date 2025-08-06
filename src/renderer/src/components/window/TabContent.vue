<template>
  <div class="tab-content" :class="contentClasses">
    <!-- Loading State -->
    <div v-if="isLoading" class="tab-loading">
      <div class="loading-spinner">
        <Loader :size="32" class="animate-spin" />
      </div>
      <p>{{ $t('tab.loading') }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="tab-error">
      <div class="error-content">
        <AlertCircle :size="48" class="error-icon" />
        <h3>{{ $t('tab.error.title') }}</h3>
        <p>{{ error }}</p>
        <div class="error-actions">
          <button @click="retry" class="retry-btn">
            <RefreshCw :size="16" />
            {{ $t('common.retry') }}
          </button>
          <button @click="closeTab" class="close-btn">
            <X :size="16" />
            {{ $t('common.close') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Content based on tab type -->
    <component
      v-else
      :is="contentComponent"
      :key="componentKey"
      :tab="tab"
      :window-id="windowId"
      v-bind="componentProps"
      @title-change="handleTitleChange"
      @modified-change="handleModifiedChange"
      @close="closeTab"
      @error="handleError"
      @loading="handleLoading"
    />

    <!-- Development Debug Panel (only in dev mode) -->
    <div v-if="isDev && showDebug" class="debug-panel">
      <h4>Tab Debug Info</h4>
      <pre>{{ debugInfo }}</pre>
      <button @click="showDebug = false" class="debug-close">
        <X :size="12" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Loader, AlertCircle, RefreshCw, X } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import type { WindowTab } from '@renderer/src/services/window/WindowManager'

// Content Components - Dynamic imports for code splitting
import { defineAsyncComponent } from 'vue'

const ChatView = defineAsyncComponent(() => import('@/views/ChatViewImproved.vue'))
const SettingsView = defineAsyncComponent(() => import('@/views/SettingsView.vue'))
const ToolsView = defineAsyncComponent(() => import('@/views/ToolsView.vue'))
const PluginsView = defineAsyncComponent(() => import('@/views/PluginsView.vue'))
const FileView = defineAsyncComponent(() => import('@/views/FileView.vue'))
const BrowserView = defineAsyncComponent(() => import('@/views/BrowserView.vue'))
const TerminalView = defineAsyncComponent(() => import('@/views/TerminalView.vue'))
const NotesView = defineAsyncComponent(() => import('@/views/NotesView.vue'))

// Props
interface Props {
  tab: WindowTab
  windowId: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'tab-title-change': [tabId: string, title: string]
  'tab-modified-change': [tabId: string, modified: boolean]
  'tab-close': [tabId: string]
}>()

// Composables
const { t } = useI18n()

// State
const isLoading = ref(false)
const error = ref<string | null>(null)
const showDebug = ref(false)
const retryCount = ref(0)
const maxRetries = 3

// Development mode check
const isDev = computed(() => import.meta.env.DEV)

// Component mapping
const componentMap = {
  chat: ChatView,
  settings: SettingsView,
  tools: ToolsView,
  plugins: PluginsView,
  file: FileView,
  browser: BrowserView,
  terminal: TerminalView,
  notes: NotesView,
  custom: null // Will be handled dynamically
}

// Computed
const contentComponent = computed(() => {
  const tabType = props.tab.type as keyof typeof componentMap
  
  // Handle custom tab types
  if (tabType === 'custom' && props.tab.data?.component) {
    return props.tab.data.component
  }
  
  return componentMap[tabType] || ChatView // Default to ChatView
})

const componentKey = computed(() => {
  // Use tab ID + type to ensure proper component re-mounting
  return `${props.tab.id}-${props.tab.type}`
})

const componentProps = computed(() => {
  const baseProps = {
    tabId: props.tab.id,
    chatId: props.tab.chatId,
    initialData: props.tab.data
  }

  // Add type-specific props
  switch (props.tab.type) {
    case 'chat':
      return {
        ...baseProps,
        chatId: props.tab.chatId || 'new',
        messages: props.tab.data?.messages || [],
        model: props.tab.data?.model || 'claude-3-5-sonnet'
      }
    
    case 'settings':
      return {
        ...baseProps,
        section: props.tab.data?.section || 'general',
        searchQuery: props.tab.data?.searchQuery || ''
      }
    
    case 'tools':
      return {
        ...baseProps,
        selectedTool: props.tab.data?.selectedTool,
        toolCategory: props.tab.data?.category || 'all'
      }
    
    case 'plugins':
      return {
        ...baseProps,
        selectedPlugin: props.tab.data?.selectedPlugin,
        pluginAction: props.tab.data?.action || 'browse'
      }
    
    case 'file':
      return {
        ...baseProps,
        filePath: props.tab.data?.filePath,
        fileType: props.tab.data?.fileType,
        readOnly: props.tab.data?.readOnly || false
      }
    
    case 'browser':
      return {
        ...baseProps,
        url: props.tab.data?.url || 'about:blank',
        allowNavigation: props.tab.data?.allowNavigation !== false
      }
    
    case 'terminal':
      return {
        ...baseProps,
        workingDirectory: props.tab.data?.workingDirectory,
        shellType: props.tab.data?.shellType || 'bash'
      }
    
    case 'notes':
      return {
        ...baseProps,
        noteId: props.tab.data?.noteId,
        noteContent: props.tab.data?.content || '',
        noteFormat: props.tab.data?.format || 'markdown'
      }
    
    default:
      return baseProps
  }
})

const contentClasses = computed(() => ({
  [`tab-content-${props.tab.type}`]: true,
  'tab-content-loading': isLoading.value,
  'tab-content-error': error.value !== null,
  'tab-content-modified': props.tab.modified
}))

const debugInfo = computed(() => ({
  tab: props.tab,
  windowId: props.windowId,
  componentProps: componentProps.value,
  isLoading: isLoading.value,
  error: error.value,
  retryCount: retryCount.value
}))

// Methods
const handleTitleChange = (title: string) => {
  emit('tab-title-change', props.tab.id, title)
}

const handleModifiedChange = (modified: boolean) => {
  emit('tab-modified-change', props.tab.id, modified)
}

const handleError = (errorMessage: string) => {
  error.value = errorMessage
  isLoading.value = false
}

const handleLoading = (loading: boolean) => {
  isLoading.value = loading
  if (loading) {
    error.value = null
  }
}

const closeTab = () => {
  emit('tab-close', props.tab.id)
}

const retry = async () => {
  if (retryCount.value >= maxRetries) {
    error.value = t('tab.error.maxRetriesReached')
    return
  }

  retryCount.value++
  error.value = null
  isLoading.value = true

  try {
    // Force component re-mount by changing key
    await new Promise(resolve => setTimeout(resolve, 100))
    isLoading.value = false
  } catch (err) {
    handleError(err instanceof Error ? err.message : String(err))
  }
}

// Tab title management
const updateTabTitle = (newTitle: string) => {
  if (newTitle && newTitle !== props.tab.title) {
    handleTitleChange(newTitle)
  }
}

// Auto-save for modified content
const autoSaveInterval = ref<NodeJS.Timeout | null>(null)

const startAutoSave = () => {
  if (autoSaveInterval.value) {
    clearInterval(autoSaveInterval.value)
  }

  // Auto-save every 30 seconds for modified tabs
  autoSaveInterval.value = setInterval(() => {
    if (props.tab.modified && contentComponent.value) {
      // Trigger auto-save if component supports it
      const componentInstance = contentComponent.value as any
      if (componentInstance?.autoSave) {
        componentInstance.autoSave()
      }
    }
  }, 30000)
}

const stopAutoSave = () => {
  if (autoSaveInterval.value) {
    clearInterval(autoSaveInterval.value)
    autoSaveInterval.value = null
  }
}

// Keyboard shortcuts
const handleKeyDown = (event: KeyboardEvent) => {
  const { key, ctrlKey, metaKey, shiftKey } = event
  const cmd = ctrlKey || metaKey

  // Ctrl/Cmd + S: Save
  if (cmd && key === 's') {
    event.preventDefault()
    // Trigger save if component supports it
    const componentInstance = contentComponent.value as any
    if (componentInstance?.save) {
      componentInstance.save()
    }
    return
  }

  // Ctrl/Cmd + R: Refresh/Reload
  if (cmd && key === 'r') {
    event.preventDefault()
    retry()
    return
  }

  // F12: Toggle debug panel (dev mode only)
  if (isDev.value && key === 'F12') {
    event.preventDefault()
    showDebug.value = !showDebug.value
    return
  }

  // Escape: Close error state
  if (key === 'Escape' && error.value) {
    event.preventDefault()
    error.value = null
    return
  }
}

// Tab visibility handling
const isTabVisible = ref(true)

const handleVisibilityChange = () => {
  isTabVisible.value = !document.hidden
  
  // Pause/resume heavy operations based on tab visibility
  if (isTabVisible.value) {
    startAutoSave()
  } else {
    stopAutoSave()
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  startAutoSave()
  
  // Set initial title if not set
  if (!props.tab.title || props.tab.title === 'New Tab') {
    const defaultTitles = {
      chat: 'New Chat',
      settings: 'Settings',
      tools: 'Tools',
      plugins: 'Plugins',
      file: 'File',
      browser: 'Browser',
      terminal: 'Terminal',
      notes: 'Notes'
    }
    
    const defaultTitle = defaultTitles[props.tab.type as keyof typeof defaultTitles] || 'New Tab'
    updateTabTitle(defaultTitle)
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  stopAutoSave()
})

// Watch for tab changes
watch(() => props.tab.type, () => {
  // Reset state when tab type changes
  error.value = null
  isLoading.value = false
  retryCount.value = 0
})

watch(() => props.tab.data, (newData, oldData) => {
  // Handle data changes that might require component updates
  if (JSON.stringify(newData) !== JSON.stringify(oldData)) {
    // Component will re-render due to componentProps computed property
  }
}, { deep: true })

// Expose methods for parent components
defineExpose({
  retry,
  closeTab,
  updateTabTitle,
  getComponentInstance: () => contentComponent.value,
  getTabState: () => ({
    isLoading: isLoading.value,
    error: error.value,
    isVisible: isTabVisible.value
  })
})
</script>

<style scoped>
.tab-content {
  @apply flex-1 h-full overflow-hidden relative;
}

.tab-content-loading {
  @apply pointer-events-none;
}

.tab-content-error {
  @apply bg-red-50 dark:bg-red-950/20;
}

.tab-content-modified {
  position: relative;
}

.tab-content-modified::before {
  content: '';
  @apply absolute top-0 left-0 w-1 h-full bg-orange-400 z-10;
}

/* Loading State */
.tab-loading {
  @apply flex flex-col items-center justify-center h-full space-y-4 text-muted-foreground;
}

.loading-spinner {
  @apply text-primary;
}

/* Error State */
.tab-error {
  @apply flex items-center justify-center h-full p-8;
}

.error-content {
  @apply text-center space-y-4 max-w-md;
}

.error-icon {
  @apply mx-auto text-red-500;
}

.error-content h3 {
  @apply text-lg font-semibold text-red-700 dark:text-red-400;
}

.error-content p {
  @apply text-muted-foreground;
}

.error-actions {
  @apply flex items-center justify-center gap-3 mt-6;
}

.retry-btn {
  @apply flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors;
}

.close-btn {
  @apply flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors;
}

/* Debug Panel */
.debug-panel {
  @apply absolute bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg shadow-lg max-w-md max-h-64 overflow-auto z-50;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
}

.debug-panel h4 {
  @apply font-semibold mb-2 text-yellow-400;
}

.debug-panel pre {
  @apply whitespace-pre-wrap text-xs;
}

.debug-close {
  @apply absolute top-2 right-2 p-1 hover:bg-white/20 rounded transition-colors;
}

/* Tab Type Specific Styles */
.tab-content-chat {
  @apply bg-background;
}

.tab-content-settings {
  @apply bg-muted/20;
}

.tab-content-tools {
  @apply bg-background;
}

.tab-content-plugins {
  @apply bg-background;
}

.tab-content-file {
  @apply bg-background font-mono;
}

.tab-content-browser {
  @apply bg-white dark:bg-background;
}

.tab-content-terminal {
  @apply bg-black text-green-400 font-mono;
}

.tab-content-notes {
  @apply bg-yellow-50 dark:bg-yellow-950/10;
}

/* Responsive */
@media (max-width: 768px) {
  .debug-panel {
    @apply bottom-2 right-2 left-2 max-w-none;
  }
  
  .error-actions {
    @apply flex-col;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .tab-content-modified::before {
    @apply w-2;
  }
  
  .error-icon {
    @apply text-red-600;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .loading-spinner {
    animation: none;
  }
  
  .retry-btn, .close-btn {
    transition: none;
  }
}

/* Print styles */
@media print {
  .debug-panel {
    display: none;
  }
  
  .tab-error, .tab-loading {
    display: none;
  }
}
</style>