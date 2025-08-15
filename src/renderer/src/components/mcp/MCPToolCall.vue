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
        >
          <Square :size="14" />
        </button>
        
        <button
          v-if="canRetry"
          @click.stop="retryCall"
          class="action-btn retry-btn"
          :title="$t('mcp.retryCall')"
        >
          <RotateCcw :size="14" />
        </button>
        
        <button
          class="expand-btn"
          :class="{ 'expanded': isExpanded }"
          :title="isExpanded ? $t('common.collapse') : $t('common.expand')"
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
            <div
              v-for="(value, key) in call.arguments"
              :key="key"
              class="argument-item"
            >
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
              <CodeBlock
                :content="errorDetails"
                language="json"
                :max-height="200"
              />
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
              <span
                v-for="tag in toolInfo.tags"
                :key="tag"
                class="tool-tag"
              >
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
  Wrench, Settings, CheckCircle, AlertCircle, BookOpen, Tag,
  BarChart, Clock, Database, Activity, Copy, Square, RotateCcw,
  ChevronDown, Play, Pause, XCircle, Loader
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
  return props.showActions && 
         (props.call.status === 'pending' || props.call.status === 'running')
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
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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
</style>