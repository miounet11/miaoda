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
          <button @click="retry" class="retry-btn" aria-label="按钮">
            <RefreshCw :size="16" />
            {{ $t('common.retry') }}
          </button>
          <button @click="closeTab" class="close-btn" aria-label="按钮">
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
      <button @click="showDebug = false" class="debug-close" aria-label="按钮">
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
const PluginsView = defineAsyncComponent(() => import('@/views/PluginsView.vue'))
const AnalyticsView = defineAsyncComponent(() => import('@/views/AnalyticsView.vue'))

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
  plugins: PluginsView,
  analytics: AnalyticsView,
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
watch(
  () => props.tab.type,
  () => {
    // Reset state when tab type changes
    error.value = null
    isLoading.value = false
    retryCount.value = 0
  }
)

watch(
  () => props.tab.data,
  (newData, oldData) => {
    // Handle data changes that might require component updates
    if (JSON.stringify(newData) !== JSON.stringify(oldData)) {
      // Component will re-render due to componentProps computed property
    }
  },
  { deep: true }
)

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

  .retry-btn,
  .close-btn {
    transition: none;
  }
}

/* Print styles */
@media print {
  .debug-panel {
    display: none;
  }

  .tab-error,
  .tab-loading {
    display: none;
  }
}


/* 焦点样式 */
:focus-visible {
  outline: 2px solid hsl(var(--ring, 59 130 230));
  outline-offset: 2px;
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
}

/* 🎨 微交互和动画 */
.btn-primary {
  position: relative;
  overflow: hidden;
  transition: all 0.2s ease;
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.3s ease, height 0.3s ease;
}

.btn-primary:active::before {
  width: 300px;
  height: 300px;
}

/* 悬停效果 */
.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 加载动画 */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid hsl(var(--border));
  border-top: 2px solid hsl(var(--primary));
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 淡入动画 */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-in {
  animation: fade-in 0.3s ease-out;
}

/* 成功状态动画 */
@keyframes success-bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

.success-animation {
  animation: success-bounce 1s ease;
}</style>
