<template>
  <div class="mcp-tool-call" :class="callClasses">
    <!-- Call Header -->
    <div class="call-header" @click="toggleExpanded">
      <div class="call-info">
        <div class="call-icon">
          <component :is="statusIcon" :size="16" :class="statusIconClass" />
        </div>

        <div class="call-details">
          <div class="call-name">
            <Wrench :size="14" />
            <span class="tool-name">{{ call.name }}</span>
            <span v-if="call.duration" class="call-duration">
              ({{ formatDuration(call.duration) }})
            </span>
          </div>

          <div class="call-meta">
            <span class="call-time">{{ formatTime(call.timestamp) }}</span>
            <span class="call-status">{{ statusText }}</span>
          </div>
        </div>
      </div>

      <div class="call-actions">
        <button
          v-if="canAbort"
          @click.stop="abortCall"
          class="action-btn abort-btn"
          :title="$t('mcp.abortCall')"
          aria-label="按钮"
        >
          <Square :size="14" />
        </button>

        <button
          v-if="canRetry"
          @click.stop="retryCall"
          class="action-btn retry-btn"
          :title="$t('mcp.retryCall')"
          aria-label="按钮"
        >
          <RotateCcw :size="14" />
        </button>

        <button
          class="expand-btn"
          :class="{ expanded: isExpanded }"
          :title="isExpanded ? $t('common.collapse') : $t('common.expand')"
          aria-label="按钮"
        >
          <ChevronDown :size="14" />
        </button>
      </div>
    </div>

    <!-- Progress Bar -->
    <div v-if="call.status === 'running'" class="progress-bar">
      <div class="progress-fill" :style="{ width: progressWidth + '%' }" />
    </div>

    <!-- Call Details (Expandable) -->
    <Transition name="expand">
      <div v-if="isExpanded" class="call-details-expanded">
        <!-- Arguments -->
        <div v-if="hasArguments" class="call-section">
          <h4 class="section-title">
            <Settings :size="14" />
            {{ $t('mcp.arguments') }}
          </h4>

          <div class="arguments-grid">
            <div v-for="(value, key) in call.arguments" :key="key" class="argument-item">
              <div class="argument-key">{{ key }}</div>
              <div class="argument-value">
                <CodeBlock
                  v-if="isComplexValue(value)"
                  :content="JSON.stringify(value, null, 2)"
                  language="json"
                  :max-height="200"
                />
                <span v-else class="simple-value">{{ value }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Result -->
        <div v-if="call.result" class="call-section">
          <h4 class="section-title">
            <CheckCircle :size="14" />
            {{ $t('mcp.result') }}
          </h4>

          <div class="result-container">
            <CodeBlock
              v-if="isComplexResult"
              :content="formattedResult"
              :language="resultLanguage"
              :max-height="400"
            />

            <div v-else class="simple-result">
              {{ call.result }}
            </div>

            <!-- Copy Result Button -->
            <button
              @click="copyResult"
              class="copy-btn"
              :title="$t('common.copy')"
              aria-label="按钮"
            >
              <Copy :size="14" />
            </button>
          </div>
        </div>

        <!-- Error -->
        <div v-if="call.error" class="call-section error-section">
          <h4 class="section-title">
            <AlertCircle :size="14" />
            {{ $t('mcp.error') }}
          </h4>

          <div class="error-container">
            <div class="error-message">{{ call.error }}</div>

            <div v-if="errorDetails" class="error-details">
              <CodeBlock :content="errorDetails" language="json" :max-height="200" />
            </div>
          </div>
        </div>

        <!-- Tool Documentation -->
        <div v-if="toolInfo" class="call-section">
          <h4 class="section-title">
            <BookOpen :size="14" />
            {{ $t('mcp.toolInfo') }}
          </h4>

          <div class="tool-info">
            <div class="tool-description">{{ toolInfo.description }}</div>

            <div v-if="toolInfo.category" class="tool-category">
              <Tag :size="12" />
              {{ toolInfo.category }}
            </div>

            <div v-if="toolInfo.tags?.length" class="tool-tags">
              <span v-for="tag in toolInfo.tags" :key="tag" class="tool-tag">
                {{ tag }}
              </span>
            </div>
          </div>
        </div>

        <!-- Performance Metrics -->
        <div v-if="call.duration" class="call-section">
          <h4 class="section-title">
            <BarChart :size="14" />
            {{ $t('mcp.performance') }}
          </h4>

          <div class="performance-metrics">
            <div class="metric">
              <Clock :size="12" />
              <span class="metric-label">{{ $t('mcp.duration') }}</span>
              <span class="metric-value">{{ formatDuration(call.duration) }}</span>
            </div>

            <div v-if="call.result" class="metric">
              <Database :size="12" />
              <span class="metric-label">{{ $t('mcp.resultSize') }}</span>
              <span class="metric-value">{{ formatBytes(getResultSize()) }}</span>
            </div>

            <div class="metric">
              <Activity :size="12" />
              <span class="metric-label">{{ $t('mcp.status') }}</span>
              <span class="metric-value" :class="'status-' + call.status">
                {{ statusText }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Wrench,
  Settings,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Tag,
  BarChart,
  Clock,
  Database,
  Activity,
  Copy,
  Square,
  RotateCcw,
  ChevronDown,
  Play,
  Pause,
  XCircle,
  Loader
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { mcpService, type MCPToolCall } from '@renderer/src/services/mcp/MCPService'
import CodeBlock from '@renderer/src/components/ui/CodeBlock.vue'

// Props
interface Props {
  call: MCPToolCall
  expanded?: boolean
  showActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  expanded: false,
  showActions: true
})

// Emits
const emit = defineEmits<{
  retry: [call: MCPToolCall]
  abort: [call: MCPToolCall]
  expand: [expanded: boolean]
}>()

// Composables
const { t } = useI18n()

// State
const isExpanded = ref(props.expanded)
const progressWidth = ref(0)
let progressTimer: NodeJS.Timeout | null = null

// Computed
const callClasses = computed(() => ({
  'call-pending': props.call.status === 'pending',
  'call-running': props.call.status === 'running',
  'call-completed': props.call.status === 'completed',
  'call-failed': props.call.status === 'failed',
  'call-expanded': isExpanded.value
}))

const statusIcon = computed(() => {
  switch (props.call.status) {
    case 'pending':
      return Pause
    case 'running':
      return Loader
    case 'completed':
      return CheckCircle
    case 'failed':
      return XCircle
    default:
      return Play
  }
})

const statusIconClass = computed(() => ({
  'icon-pending': props.call.status === 'pending',
  'icon-running animate-spin': props.call.status === 'running',
  'icon-completed': props.call.status === 'completed',
  'icon-failed': props.call.status === 'failed'
}))

const statusText = computed(() => {
  return t(`mcp.status.${props.call.status}`)
})

const canAbort = computed(() => {
  return props.showActions && (props.call.status === 'pending' || props.call.status === 'running')
})

const canRetry = computed(() => {
  return props.showActions && props.call.status === 'failed'
})

const hasArguments = computed(() => {
  return props.call.arguments && Object.keys(props.call.arguments).length > 0
})

const isComplexResult = computed(() => {
  return typeof props.call.result === 'object' && props.call.result !== null
})

const formattedResult = computed(() => {
  if (!props.call.result) return ''

  if (typeof props.call.result === 'object') {
    return JSON.stringify(props.call.result, null, 2)
  }

  return String(props.call.result)
})

const resultLanguage = computed(() => {
  if (!props.call.result) return 'text'

  if (typeof props.call.result === 'object') {
    return 'json'
  }

  // Try to detect language from content
  const content = String(props.call.result)
  if (content.includes('<!DOCTYPE html') || content.includes('<html')) {
    return 'html'
  }
  if (content.includes('<?xml')) {
    return 'xml'
  }
  if (content.startsWith('{') || content.startsWith('[')) {
    return 'json'
  }

  return 'text'
})

const errorDetails = computed(() => {
  if (!props.call.error) return null

  try {
    // Try to parse error as JSON for better display
    return JSON.parse(props.call.error)
  } catch {
    return null
  }
})

const toolInfo = computed(() => {
  return mcpService.getTool(props.call.name)
})

// Methods
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
  emit('expand', isExpanded.value)
}

const abortCall = () => {
  mcpService.abortCall(props.call.id)
  emit('abort', props.call)
}

const retryCall = () => {
  emit('retry', props.call)
}

const copyResult = async () => {
  if (!props.call.result) return

  try {
    await navigator.clipboard.writeText(formattedResult.value)
    // Show success toast
  } catch (error) {
    console.error('Failed to copy result:', error)
  }
}

const isComplexValue = (value: any): boolean => {
  return typeof value === 'object' && value !== null
}

const formatTime = (timestamp: Date): string => {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()

  if (diff < 60000) {
    return t('time.justNow')
  } else if (diff < 3600000) {
    return t('time.minutesAgo', { minutes: Math.floor(diff / 60000) })
  } else {
    return timestamp.toLocaleTimeString()
  }
}

const formatDuration = (duration: number): string => {
  if (duration < 1000) {
    return `${duration}ms`
  } else if (duration < 60000) {
    return `${(duration / 1000).toFixed(1)}s`
  } else {
    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getResultSize = (): number => {
  if (!props.call.result) return 0

  const content = formattedResult.value
  return new Blob([content]).size
}

const startProgressAnimation = () => {
  if (props.call.status !== 'running') return

  progressWidth.value = 0
  const startTime = Date.now()

  progressTimer = setInterval(() => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(90, (elapsed / 30000) * 100) // Cap at 90% until completion

    progressWidth.value = progress

    if (props.call.status !== 'running') {
      progressWidth.value = 100
      if (progressTimer) {
        clearInterval(progressTimer)
        progressTimer = null
      }
    }
  }, 100)
}

const stopProgressAnimation = () => {
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
}

// Watch for status changes
const updateProgress = () => {
  if (props.call.status === 'running') {
    startProgressAnimation()
  } else {
    stopProgressAnimation()
    if (props.call.status === 'completed' || props.call.status === 'failed') {
      progressWidth.value = 100
    }
  }
}

// Lifecycle
onMounted(() => {
  updateProgress()
})

onUnmounted(() => {
  stopProgressAnimation()
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
.container-sm {
  max-width: var(--breakpoint-sm);
}
.container-md {
  max-width: var(--breakpoint-md);
}
.container-lg {
  max-width: var(--breakpoint-lg);
}
.container-xl {
  max-width: var(--breakpoint-xl);
}

/* 响应式显示 */
.hidden-sm {
  display: none;
}
.hidden-md {
  display: none;
}
.hidden-lg {
  display: none;
}

@media (min-width: 640px) {
  .hidden-sm {
    display: block;
  }
}

@media (min-width: 768px) {
  .hidden-md {
    display: block;
  }
}

@media (min-width: 1024px) {
  .hidden-lg {
    display: block;
  }
}

/* 响应式文本 */
.text-responsive-sm {
  font-size: clamp(0.875rem, 2vw, 1rem);
}
.text-responsive-base {
  font-size: clamp(1rem, 2.5vw, 1.125rem);
}
.text-responsive-lg {
  font-size: clamp(1.125rem, 3vw, 1.25rem);
}
.text-responsive-xl {
  font-size: clamp(1.25rem, 3.5vw, 1.5rem);
}

/* 响应式间距 */
.space-responsive-sm {
  gap: clamp(0.5rem, 2vw, 1rem);
}
.space-responsive-md {
  gap: clamp(1rem, 3vw, 1.5rem);
}
.space-responsive-lg {
  gap: clamp(1.5rem, 4vw, 2rem);
}

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
  .flex-col-mobile {
    flex-direction: column;
  }
  .grid-1-mobile {
    grid-template-columns: 1fr;
  }
  .gap-2-mobile {
    gap: var(--space-2);
  }
  .p-4-mobile {
    padding: var(--space-4);
  }
}

@media (max-width: 768px) {
  .flex-col-tablet {
    flex-direction: column;
  }
  .grid-2-tablet {
    grid-template-columns: repeat(2, 1fr);
  }
  .gap-4-tablet {
    gap: var(--space-4);
  }
  .p-6-tablet {
    padding: var(--space-6);
  }
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

.grid-cols-2 {
  grid-template-columns: repeat(2, 1fr);
}
.grid-cols-3 {
  grid-template-columns: repeat(3, 1fr);
}
.grid-cols-4 {
  grid-template-columns: repeat(4, 1fr);
}

.grid-gap-2 {
  gap: var(--space-2);
}
.grid-gap-4 {
  gap: var(--space-4);
}
.grid-gap-6 {
  gap: var(--space-6);
}

/* 🎨 卡片布局 */
.card {
  background: white;
  border-radius: 12px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.06);
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.card:hover {
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.1),
    0 2px 4px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.card-interactive:hover {
  cursor: pointer;
  transform: translateY(-2px);
  box-shadow:
    0 10px 25px rgba(0, 0, 0, 0.15),
    0 4px 10px rgba(0, 0, 0, 0.1);
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

  .hidden-mobile {
    display: none;
  }
  .flex-mobile-col {
    flex-direction: column;
  }
  .grid-mobile-1 {
    grid-template-columns: 1fr;
  }
}

/* 🎨 完整间距系统 - 基于4px网格 */
:root {
  --space-0: 0;
  --space-1: 0.25rem; /* 4px */
  --space-2: 0.5rem; /* 8px */
  --space-3: 0.75rem; /* 12px */
  --space-4: 1rem; /* 16px */
  --space-5: 1.25rem; /* 20px */
  --space-6: 1.5rem; /* 24px */
  --space-8: 2rem; /* 32px */
  --space-10: 2.5rem; /* 40px */
  --space-12: 3rem; /* 48px */
  --space-16: 4rem; /* 64px */
  --space-20: 5rem; /* 80px */
  --space-24: 6rem; /* 96px */
  --space-32: 8rem; /* 128px */

  /* 负间距 */
  --space-neg-1: -0.25rem;
  --space-neg-2: -0.5rem;
  --space-neg-4: -1rem;
}

/* 🎨 间距实用类 */
.m-1 {
  margin: var(--space-1);
}
.m-2 {
  margin: var(--space-2);
}
.m-3 {
  margin: var(--space-3);
}
.m-4 {
  margin: var(--space-4);
}
.m-6 {
  margin: var(--space-6);
}
.m-8 {
  margin: var(--space-8);
}

.p-1 {
  padding: var(--space-1);
}
.p-2 {
  padding: var(--space-2);
}
.p-3 {
  padding: var(--space-3);
}
.p-4 {
  padding: var(--space-4);
}
.p-6 {
  padding: var(--space-6);
}
.p-8 {
  padding: var(--space-8);
}

.mx-auto {
  margin-left: auto;
  margin-right: auto;
}
.my-auto {
  margin-top: auto;
  margin-bottom: auto;
}

.px-1 {
  padding-left: var(--space-1);
  padding-right: var(--space-1);
}
.px-2 {
  padding-left: var(--space-2);
  padding-right: var(--space-2);
}
.px-3 {
  padding-left: var(--space-3);
  padding-right: var(--space-3);
}
.px-4 {
  padding-left: var(--space-4);
  padding-right: var(--space-4);
}
.px-6 {
  padding-left: var(--space-6);
  padding-right: var(--space-6);
}

.py-1 {
  padding-top: var(--space-1);
  padding-bottom: var(--space-1);
}
.py-2 {
  padding-top: var(--space-2);
  padding-bottom: var(--space-2);
}
.py-3 {
  padding-top: var(--space-3);
  padding-bottom: var(--space-3);
}
.py-4 {
  padding-top: var(--space-4);
  padding-bottom: var(--space-4);
}
.py-6 {
  padding-top: var(--space-6);
  padding-bottom: var(--space-6);
}

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

.stack-sm > * + * {
  margin-top: var(--space-2);
}
.stack-md > * + * {
  margin-top: var(--space-4);
}
.stack-lg > * + * {
  margin-top: var(--space-6);
}
.stack-xl > * + * {
  margin-top: var(--space-8);
}

.inline-sm > * + * {
  margin-left: var(--space-2);
}
.inline-md > * + * {
  margin-left: var(--space-4);
}
.inline-lg > * + * {
  margin-left: var(--space-6);
}

/* 🎨 完整字体系统 */
:root {
  /* 字体族 */
  --font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', 'Source Code Pro', monospace;

  /* 字体大小 - 基于1.25的倍数比例 */
  --font-size-xs: 0.75rem; /* 12px */
  --font-size-sm: 0.875rem; /* 14px */
  --font-size-base: 1rem; /* 16px */
  --font-size-lg: 1.125rem; /* 18px */
  --font-size-xl: 1.25rem; /* 20px */
  --font-size-2xl: 1.5rem; /* 24px */
  --font-size-3xl: 1.875rem; /* 30px */
  --font-size-4xl: 2.25rem; /* 36px */
  --font-size-5xl: 3rem; /* 48px */

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
.font-sans {
  font-family: var(--font-family-sans);
}
.font-mono {
  font-family: var(--font-family-mono);
}

.text-xs {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-tight);
}
.text-sm {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-snug);
}
.text-base {
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
}
.text-lg {
  font-size: var(--font-size-lg);
  line-height: var(--line-height-relaxed);
}
.text-xl {
  font-size: var(--font-size-xl);
  line-height: var(--line-height-relaxed);
}
.text-2xl {
  font-size: var(--font-size-2xl);
  line-height: var(--line-height-loose);
}
.text-3xl {
  font-size: var(--font-size-3xl);
  line-height: var(--line-height-loose);
}

.font-thin {
  font-weight: var(--font-weight-thin);
}
.font-light {
  font-weight: var(--font-weight-light);
}
.font-normal {
  font-weight: var(--font-weight-normal);
}
.font-medium {
  font-weight: var(--font-weight-medium);
}
.font-semibold {
  font-weight: var(--font-weight-semibold);
}
.font-bold {
  font-weight: var(--font-weight-bold);
}

.leading-tight {
  line-height: var(--line-height-tight);
}
.leading-snug {
  line-height: var(--line-height-snug);
}
.leading-normal {
  line-height: var(--line-height-normal);
}
.leading-relaxed {
  line-height: var(--line-height-relaxed);
}

.tracking-tight {
  letter-spacing: var(--letter-spacing-tight);
}
.tracking-normal {
  letter-spacing: var(--letter-spacing-normal);
}
.tracking-wide {
  letter-spacing: var(--letter-spacing-wide);
}

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
.text-primary {
  color: var(--color-primary);
}
.text-success {
  color: var(--color-success);
}
.text-warning {
  color: var(--color-warning);
}
.text-error {
  color: var(--color-error);
}
.text-gray-500 {
  color: var(--color-gray-500);
}
.text-gray-600 {
  color: var(--color-gray-600);
}
.text-gray-700 {
  color: var(--color-gray-700);
}

.bg-primary {
  background-color: var(--color-primary);
}
.bg-primary-hover:hover {
  background-color: var(--color-primary-hover);
}
.bg-success {
  background-color: var(--color-success);
}
.bg-warning {
  background-color: var(--color-warning);
}
.bg-error {
  background-color: var(--color-error);
}

.border-primary {
  border-color: var(--color-primary);
}
.border-success {
  border-color: var(--color-success);
}
.border-error {
  border-color: var(--color-error);
}

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
.mcp-tool-call {
  @apply border border-border rounded-lg overflow-hidden transition-all duration-200;
  contain: layout style paint;
}

.call-pending {
  @apply border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950;
}

.call-running {
  @apply border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950;
}

.call-completed {
  @apply border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950;
}

.call-failed {
  @apply border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950;
}

.call-header {
  @apply flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors;
}

.call-info {
  @apply flex items-center gap-3 flex-1;
}

.call-icon {
  @apply flex-shrink-0;
}

.icon-pending {
  @apply text-yellow-600 dark:text-yellow-400;
}

.icon-running {
  @apply text-blue-600 dark:text-blue-400;
}

.icon-completed {
  @apply text-green-600 dark:text-green-400;
}

.icon-failed {
  @apply text-red-600 dark:text-red-400;
}

.call-details {
  @apply flex-1 min-w-0;
}

.call-name {
  @apply flex items-center gap-2 font-medium text-sm;
}

.tool-name {
  @apply font-mono;
}

.call-duration {
  @apply text-muted-foreground text-xs;
}

.call-meta {
  @apply flex items-center gap-2 text-xs text-muted-foreground mt-1;
}

.call-actions {
  @apply flex items-center gap-1;
}

.action-btn {
  @apply p-2 rounded-md hover:bg-accent transition-colors;
}

.abort-btn {
  @apply text-red-600 hover:bg-red-100 dark:hover:bg-red-900;
}

.retry-btn {
  @apply text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900;
}

.expand-btn {
  @apply p-2 rounded-md hover:bg-accent transition-all duration-200;
}

.expand-btn.expanded {
  @apply rotate-180;
}

.progress-bar {
  @apply w-full h-1 bg-muted overflow-hidden;
}

.progress-fill {
  @apply h-full bg-primary transition-all duration-300 ease-out;
}

.call-details-expanded {
  @apply border-t border-border bg-background/50;
}

.call-section {
  @apply p-4 border-b border-border last:border-b-0;
}

.error-section {
  @apply bg-destructive/5;
}

.section-title {
  @apply flex items-center gap-2 font-medium text-sm mb-3;
}

.arguments-grid {
  @apply space-y-3;
}

.argument-item {
  @apply grid grid-cols-1 lg:grid-cols-3 gap-2;
}

.argument-key {
  @apply font-mono text-sm font-medium text-muted-foreground;
}

.argument-value {
  @apply lg:col-span-2;
}

.simple-value {
  @apply text-sm bg-muted px-2 py-1 rounded font-mono;
}

.result-container {
  @apply relative;
}

.simple-result {
  @apply text-sm bg-muted p-3 rounded font-mono;
}

.copy-btn {
  @apply absolute top-2 right-2 p-1.5 bg-background border border-border rounded-md hover:bg-accent transition-colors;
}

.error-container {
  @apply space-y-2;
}

.error-message {
  @apply text-sm text-destructive bg-destructive/10 p-3 rounded font-mono;
}

.tool-info {
  @apply space-y-2;
}

.tool-description {
  @apply text-sm text-muted-foreground;
}

.tool-category {
  @apply flex items-center gap-1 text-xs text-muted-foreground;
}

.tool-tags {
  @apply flex flex-wrap gap-1;
}

.tool-tag {
  @apply px-2 py-1 bg-primary/10 text-primary text-xs rounded-full;
}

.performance-metrics {
  @apply grid grid-cols-1 md:grid-cols-3 gap-4;
}

.metric {
  @apply flex items-center gap-2 text-sm;
}

.metric-label {
  @apply text-muted-foreground flex-1;
}

.metric-value {
  @apply font-mono font-medium;
}

.status-completed {
  @apply text-green-600 dark:text-green-400;
}

.status-failed {
  @apply text-red-600 dark:text-red-400;
}

.status-running {
  @apply text-blue-600 dark:text-blue-400;
}

.status-pending {
  @apply text-yellow-600 dark:text-yellow-400;
}

/* Transitions */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 800px;
  opacity: 1;
}

/* Animations */
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

/* Responsive */
@media (max-width: 768px) {
  .call-header {
    @apply p-3;
  }

  .call-section {
    @apply p-3;
  }

  .performance-metrics {
    @apply grid-cols-1;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .mcp-tool-call {
    @apply border-2;
  }

  .action-btn:focus {
    @apply ring-2 ring-primary;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .expand-enter-active,
  .expand-leave-active {
    transition: none;
  }

  .animate-spin {
    animation: none;
  }

  .progress-fill {
    transition: none;
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
</style>
