<template>
  <div class="browser-view">
    <div class="browser-toolbar">
      <div class="browser-controls">
        <button
          @click="goBack"
          :disabled="!canGoBack"
          class="control-btn"
          :title="$t('browser.back')"
        >
          <ArrowLeft :size="16" />
        </button>
        <button
          @click="goForward"
          :disabled="!canGoForward"
          class="control-btn"
          :title="$t('browser.forward')"
        >
          <ArrowRight :size="16" />
        </button>
        <button
          @click="refresh"
          :disabled="isLoading"
          class="control-btn"
          :title="$t('browser.refresh')"
        >
          <RefreshCw :size="16" :class="{ 'animate-spin': isLoading }" />
        </button>
      </div>
      
      <div class="address-bar">
        <div class="security-indicator" :class="securityLevel">
          <Lock :size="14" v-if="securityLevel === 'secure'" />
          <AlertTriangle :size="14" v-else-if="securityLevel === 'warning'" />
          <Globe :size="14" v-else />
        </div>
        <input
          v-model="addressInput"
          @keydown.enter="navigate"
          @focus="selectAll"
          class="address-input"
          :placeholder="$t('browser.enterUrl')"
        />
        <button
          @click="navigate"
          class="navigate-btn"
          :title="$t('browser.go')"
        >
          <Search :size="16" />
        </button>
      </div>
      
      <div class="browser-actions">
        <button
          @click="toggleBookmark"
          :class="['control-btn', { bookmarked: isBookmarked }]"
          :title="$t('browser.bookmark')"
        >
          <Star :size="16" />
        </button>
        <button
          @click="showOptions"
          class="control-btn"
          :title="$t('browser.options')"
        >
          <MoreVertical :size="16" />
        </button>
      </div>
    </div>
    
    <div class="browser-content">
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-content">
          <Loader :size="32" class="animate-spin" />
          <p>{{ $t('browser.loading') }}</p>
          <div class="loading-progress">
            <div
              class="progress-bar"
              :style="{ width: `${loadingProgress}%` }"
            ></div>
          </div>
        </div>
      </div>
      
      <div v-if="error" class="error-page">
        <div class="error-content">
          <AlertCircle :size="48" class="error-icon" />
          <h3>{{ $t('browser.error.title') }}</h3>
          <p>{{ error }}</p>
          <div class="error-actions">
            <button @click="refresh" class="retry-btn">
              <RefreshCw :size="16" />
              {{ $t('common.retry') }}
            </button>
            <button @click="goHome" class="home-btn">
              <Home :size="16" />
              {{ $t('browser.home') }}
            </button>
          </div>
        </div>
      </div>
      
      <iframe
        v-else
        ref="browserFrame"
        :src="currentUrl"
        class="browser-frame"
        @load="handleLoad"
        @error="handleError"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      ></iframe>
    </div>
    
    <!-- Developer Tools -->
    <div v-if="showDevTools" class="dev-tools">
      <div class="dev-tools-header">
        <h4>{{ $t('browser.devTools') }}</h4>
        <button @click="showDevTools = false" class="close-btn">
          <X :size="16" />
        </button>
      </div>
      <div class="dev-tools-content">
        <div class="console">
          <div
            v-for="(log, index) in consoleLogs"
            :key="index"
            :class="['console-entry', log.level]"
          >
            <span class="timestamp">{{ formatTime(log.timestamp) }}</span>
            <span class="message">{{ log.message }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  ArrowLeft, ArrowRight, RefreshCw, Lock, AlertTriangle, Globe,
  Search, Star, MoreVertical, Loader, AlertCircle, Home, X
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

interface Props {
  tabId: string
  url?: string
  allowNavigation?: boolean
  initialData?: any
}

const props = withDefaults(defineProps<Props>(), {
  url: 'about:blank',
  allowNavigation: true
})

const emit = defineEmits<{
  'title-change': [title: string]
  'error': [error: string]
  'loading': [loading: boolean]
}>()

const { t } = useI18n()

// State
const browserFrame = ref<HTMLIFrameElement>()
const currentUrl = ref(props.url)
const addressInput = ref(props.url)
const isLoading = ref(false)
const loadingProgress = ref(0)
const error = ref<string | null>(null)
const canGoBack = ref(false)
const canGoForward = ref(false)
const isBookmarked = ref(false)
const showDevTools = ref(false)
const consoleLogs = ref<{ level: string; message: string; timestamp: Date }[]>([])

// Navigation history
const history = ref<string[]>([])
const historyIndex = ref(-1)

// Security
const securityLevel = computed(() => {
  if (currentUrl.value.startsWith('https://')) return 'secure'
  if (currentUrl.value.startsWith('http://')) return 'warning'
  return 'local'
})

// Methods
const navigate = async () => {
  let url = addressInput.value.trim()
  
  if (!url) return
  
  // Add protocol if missing
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
    // Check if it looks like a URL
    if (url.includes('.') && !url.includes(' ')) {
      url = `https://${url}`
    } else {
      // Treat as search query
      url = `https://www.google.com/search?q=${encodeURIComponent(url)}`
    }
  }
  
  try {
    isLoading.value = true
    error.value = null
    emit('loading', true)
    
    // Add to history
    if (historyIndex.value === history.value.length - 1) {
      history.value.push(url)
      historyIndex.value++
    } else {
      // Remove forward history and add new entry
      history.value = history.value.slice(0, historyIndex.value + 1)
      history.value.push(url)
      historyIndex.value++
    }
    
    currentUrl.value = url
    addressInput.value = url
    
    updateNavigationState()
    
    // Simulate loading progress
    const progressInterval = setInterval(() => {
      if (loadingProgress.value < 90) {
        loadingProgress.value += Math.random() * 20
      }
    }, 100)
    
    setTimeout(() => {
      clearInterval(progressInterval)
      loadingProgress.value = 100
      setTimeout(() => {
        isLoading.value = false
        loadingProgress.value = 0
        emit('loading', false)
      }, 200)
    }, 1000 + Math.random() * 2000)
    
  } catch (err) {
    handleError(err instanceof Error ? err.message : String(err))
  }
}

const goBack = () => {
  if (canGoBack.value) {
    historyIndex.value--
    const url = history.value[historyIndex.value]
    currentUrl.value = url
    addressInput.value = url
    updateNavigationState()
  }
}

const goForward = () => {
  if (canGoForward.value) {
    historyIndex.value++
    const url = history.value[historyIndex.value]
    currentUrl.value = url
    addressInput.value = url
    updateNavigationState()
  }
}

const refresh = () => {
  if (browserFrame.value) {
    browserFrame.value.src = browserFrame.value.src
  }
}

const goHome = () => {
  addressInput.value = 'about:blank'
  navigate()
}

const updateNavigationState = () => {
  canGoBack.value = historyIndex.value > 0
  canGoForward.value = historyIndex.value < history.value.length - 1
}

const selectAll = (event: Event) => {
  const input = event.target as HTMLInputElement
  input.select()
}

const toggleBookmark = () => {
  isBookmarked.value = !isBookmarked.value
  // TODO: Implement bookmark functionality
}

const showOptions = () => {
  // TODO: Show browser options menu
}

const handleLoad = () => {
  isLoading.value = false
  error.value = null
  emit('loading', false)
  
  // Try to get page title
  try {
    if (browserFrame.value?.contentDocument) {
      const title = browserFrame.value.contentDocument.title
      if (title) {
        emit('title-change', title)
      }
    }
  } catch (err) {
    // Cross-origin restrictions
  }
}

const handleError = (errorMessage: string) => {
  error.value = errorMessage
  isLoading.value = false
  emit('error', errorMessage)
  emit('loading', false)
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString()
}

// Initialize
onMounted(() => {
  if (props.url && props.url !== 'about:blank') {
    addressInput.value = props.url
    history.value = [props.url]
    historyIndex.value = 0
    updateNavigationState()
  }
  
  // Set up console logging (for dev tools)
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info
  }
  
  const logLevels = ['log', 'error', 'warn', 'info']
  
  logLevels.forEach(level => {
    (console as any)[level] = (...args: any[]) => {
      consoleLogs.value.push({
        level,
        message: args.join(' '),
        timestamp: new Date()
      })
      
      // Keep only last 100 logs
      if (consoleLogs.value.length > 100) {
        consoleLogs.value = consoleLogs.value.slice(-100)
      }
      
      // Call original console method
      (originalConsole as any)[level](...args)
    }
  }
  
  // Add keyboard event listener
  document.addEventListener('keydown', handleKeyDown)
})

watch(() => props.url, (newUrl) => {
  if (newUrl && newUrl !== currentUrl.value) {
    addressInput.value = newUrl
    navigate()
  }
})

// Keyboard shortcuts
const handleKeyDown = (event: KeyboardEvent) => {
  const { key, ctrlKey, metaKey } = event
  const cmd = ctrlKey || metaKey
  
  if (cmd && key === 'r') {
    event.preventDefault()
    refresh()
  } else if (cmd && key === 'l') {
    event.preventDefault()
    // Focus address bar
    const addressBar = document.querySelector('.address-input') as HTMLInputElement
    if (addressBar) {
      addressBar.focus()
      addressBar.select()
    }
  } else if (key === 'F12') {
    event.preventDefault()
    showDevTools.value = !showDevTools.value
  }
}

// Cleanup on unmount
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})

defineExpose({
  navigate,
  goBack,
  goForward,
  refresh,
  getCurrentUrl: () => currentUrl.value
})
</script>

<style scoped>
.browser-view {
  @apply flex flex-col h-full;
}

.browser-toolbar {
  @apply flex items-center gap-3 p-2 border-b border-border bg-muted/20;
}

.browser-controls {
  @apply flex items-center gap-1;
}

.control-btn {
  @apply p-2 rounded hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

.control-btn.bookmarked {
  @apply text-yellow-500;
}

.address-bar {
  @apply flex-1 flex items-center bg-background border border-border rounded-lg;
}

.security-indicator {
  @apply flex items-center justify-center w-8 h-8 text-muted-foreground;
}

.security-indicator.secure {
  @apply text-green-600;
}

.security-indicator.warning {
  @apply text-yellow-600;
}

.address-input {
  @apply flex-1 px-3 py-2 bg-transparent outline-none;
}

.navigate-btn {
  @apply p-2 text-muted-foreground hover:text-foreground transition-colors;
}

.browser-actions {
  @apply flex items-center gap-1;
}

.browser-content {
  @apply flex-1 relative overflow-hidden;
}

.browser-frame {
  @apply w-full h-full border-none;
}

.loading-overlay {
  @apply absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10;
}

.loading-content {
  @apply text-center space-y-4;
}

.loading-progress {
  @apply w-64 h-1 bg-muted rounded-full overflow-hidden;
}

.progress-bar {
  @apply h-full bg-primary transition-all duration-200;
}

.error-page {
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

.error-actions {
  @apply flex items-center justify-center gap-3 mt-6;
}

.retry-btn, .home-btn {
  @apply flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors;
}

.dev-tools {
  @apply border-t border-border bg-muted/10;
  height: 200px;
}

.dev-tools-header {
  @apply flex items-center justify-between p-2 border-b border-border;
}

.dev-tools-header h4 {
  @apply font-semibold text-sm;
}

.close-btn {
  @apply p-1 hover:bg-accent rounded transition-colors;
}

.dev-tools-content {
  @apply h-full overflow-auto;
}

.console {
  @apply p-2 font-mono text-xs;
}

.console-entry {
  @apply flex gap-2 py-1 border-b border-border/50;
}

.console-entry.error {
  @apply text-red-600;
}

.console-entry.warn {
  @apply text-yellow-600;
}

.console-entry.info {
  @apply text-blue-600;
}

.timestamp {
  @apply text-muted-foreground flex-shrink-0;
}

.message {
  @apply flex-1;
}
</style>