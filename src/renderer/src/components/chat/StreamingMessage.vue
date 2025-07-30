<template>
  <div class="streaming-message" :class="messageClasses">
    <!-- Message Header -->
    <div v-if="showHeader" class="message-header">
      <div class="message-avatar">
        <div class="avatar-circle" :class="avatarClasses">
          <component :is="avatarIcon" :size="16" />
        </div>
      </div>
      
      <div class="message-meta">
        <span class="message-role">{{ roleDisplayName }}</span>
        <span v-if="showTimestamp" class="message-time">
          {{ formatTime(message.timestamp) }}
        </span>
      </div>
      
      <div class="message-actions">
        <button
          v-if="canAbort"
          @click="$emit('abort')"
          class="action-btn abort-btn"
          :title="$t('message.abort')"
        >
          <Square :size="14" />
        </button>
      </div>
    </div>
    
    <!-- Message Content -->
    <div class="message-content-wrapper">
      <div class="message-content" ref="contentRef">
        <!-- Streaming Text -->
        <div class="streaming-text" :class="{ 'typing': isStreaming }">
          <span 
            v-for="(char, index) in displayChars" 
            :key="index"
            class="char"
            :style="{ animationDelay: `${index * typingSpeed}ms` }"
          >
            {{ char }}
          </span>
          
          <!-- Cursor -->
          <span 
            v-if="isStreaming" 
            class="cursor"
            :class="{ 'blinking': showCursor }"
          >|</span>
        </div>
        
        <!-- Code blocks and formatting -->
        <div v-if="!isStreaming && formattedContent" class="formatted-content">
          <div v-html="formattedContent" class="content-html"></div>
        </div>
        
        <!-- Streaming indicators -->
        <div v-if="isStreaming" class="streaming-indicators">
          <div class="typing-indicator">
            <div class="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span class="typing-text">{{ typingText }}</span>
          </div>
          
          <!-- Token counter -->
          <div v-if="showTokens" class="token-counter">
            <Zap :size="12" />
            <span>{{ tokenCount }} tokens</span>
          </div>
          
          <!-- Speed indicator -->
          <div v-if="showSpeed" class="speed-indicator">
            <TrendingUp :size="12" />
            <span>{{ tokensPerSecond }} t/s</span>
          </div>
        </div>
      </div>
      
      <!-- Message Footer -->
      <div v-if="!isStreaming" class="message-footer">
        <div class="message-stats">
          <span v-if="message.metadata?.tokens" class="stat">
            <Hash :size="12" />
            {{ message.metadata.tokens }} tokens
          </span>
          
          <span v-if="streamDuration" class="stat">
            <Clock :size="12" />
            {{ streamDuration }}ms
          </span>
          
          <span v-if="message.metadata?.model" class="stat">
            <Cpu :size="12" />
            {{ message.metadata.model }}
          </span>
        </div>
        
        <div class="message-actions-footer">
          <button
            @click="$emit('copy')"
            class="action-btn"
            :title="$t('message.copy')"
          >
            <Copy :size="14" />
          </button>
          
          <button
            @click="$emit('retry')"
            class="action-btn"
            :title="$t('message.retry')"
          >
            <RotateCcw :size="14" />
          </button>
          
          <button
            @click="$emit('edit')"
            class="action-btn"
            :title="$t('message.edit')"
          >
            <Edit :size="14" />
          </button>
          
          <button
            @click="$emit('delete')"
            class="action-btn delete-btn"
            :title="$t('message.delete')"
          >
            <Trash2 :size="14" />
          </button>
        </div>
      </div>
    </div>
    
    <!-- Error State -->
    <div v-if="message.error" class="message-error">
      <AlertCircle :size="16" />
      <span>{{ errorMessage }}</span>
      <button @click="$emit('retry')" class="retry-btn">
        <RotateCcw :size="14" />
        Retry
      </button>
    </div>
    
    <!-- Regeneration Controls -->
    <div v-if="showRegenerateControls" class="regenerate-controls">
      <button
        @click="$emit('regenerate')"
        class="regenerate-btn"
        :disabled="isStreaming"
      >
        <RefreshCw :size="14" />
        Regenerate Response
      </button>
      
      <div class="regenerate-options">
        <label class="option">
          <input type="checkbox" v-model="regenerateWithDifferentTemp" />
          <span>Different temperature</span>
        </label>
        
        <label class="option">
          <input type="checkbox" v-model="regenerateWithDifferentModel" />
          <span>Different model</span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { 
  User, Bot, Square, Copy, Edit, Trash2, RotateCcw, RefreshCw,
  AlertCircle, Clock, Hash, Cpu, Zap, TrendingUp
} from 'lucide-vue-next'
import { streamingService, type StreamChunk } from '@renderer/src/services/streaming/StreamingService'
import { useI18n } from 'vue-i18n'
import type { Message } from '@renderer/src/types'

// Props
interface Props {
  message: Message
  isStreaming?: boolean
  showHeader?: boolean
  showTimestamp?: boolean
  showTokens?: boolean
  showSpeed?: boolean
  typingSpeed?: number
  enableSound?: boolean
  autoScroll?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isStreaming: false,
  showHeader: true,
  showTimestamp: true,
  showTokens: false,
  showSpeed: false,
  typingSpeed: 50,
  enableSound: false,
  autoScroll: true
})

// Emits
const emit = defineEmits<{
  abort: []
  copy: []
  retry: []
  edit: []
  delete: []
  regenerate: []
  streamComplete: [content: string]
  streamChunk: [chunk: StreamChunk]
}>()

// Composables
const { t } = useI18n()

// Refs
const contentRef = ref<HTMLElement>()
const displayText = ref('')
const displayChars = ref<string[]>([])
const showCursor = ref(true)
const tokenCount = ref(0)
const tokensPerSecond = ref(0)
const streamStartTime = ref<number>()
const streamDuration = ref<number>()
const regenerateWithDifferentTemp = ref(false)
const regenerateWithDifferentModel = ref(false)

// Typing animation state
let typingTimer: NodeJS.Timeout | null = null
let cursorTimer: NodeJS.Timeout | null = null
let currentIndex = 0

// Computed properties
const messageClasses = computed(() => ({
  'message-user': props.message.role === 'user',
  'message-assistant': props.message.role === 'assistant',
  'message-system': props.message.role === 'system',
  'message-streaming': props.isStreaming,
  'message-error': props.message.error,
  'message-pending': props.message.pending
}))

const avatarClasses = computed(() => ({
  'avatar-user': props.message.role === 'user',
  'avatar-assistant': props.message.role === 'assistant',
  'avatar-system': props.message.role === 'system'
}))

const avatarIcon = computed(() => {
  switch (props.message.role) {
    case 'user':
      return User
    case 'assistant':
      return Bot
    default:
      return Bot
  }
})

const roleDisplayName = computed(() => {
  switch (props.message.role) {
    case 'user':
      return t('message.you')
    case 'assistant':
      return t('message.assistant')
    case 'system':
      return t('message.system')
    default:
      return props.message.role
  }
})

const canAbort = computed(() => {
  return props.isStreaming && streamingService.isStreaming(props.message.id)
})

const typingText = computed(() => {
  const phrases = [
    t('message.thinking'),
    t('message.typing'),
    t('message.generating'),
    t('message.processing')
  ]
  
  const phraseIndex = Math.floor(Date.now() / 2000) % phrases.length
  return phrases[phraseIndex]
})

const formattedContent = computed(() => {
  if (props.isStreaming || !props.message.content) return null
  
  // Format markdown, code blocks, etc.
  return formatMessageContent(props.message.content)
})

const errorMessage = computed(() => {
  if (!props.message.error) return ''
  
  if (typeof props.message.error === 'string') {
    return props.message.error
  }
  
  return t('message.errorGeneric')
})

const showRegenerateControls = computed(() => {
  return !props.isStreaming && 
         props.message.role === 'assistant' && 
         (props.message.error || props.message.content)
})

// Methods
const startTypingAnimation = (content: string) => {
  displayText.value = ''
  displayChars.value = []
  currentIndex = 0
  
  if (!content) return
  
  const chars = content.split('')
  tokenCount.value = Math.ceil(content.length / 4) // Rough token estimate
  streamStartTime.value = Date.now()
  
  const typeChar = () => {
    if (currentIndex >= chars.length) {
      stopTypingAnimation()
      return
    }
    
    const char = chars[currentIndex]
    displayChars.value.push(char)
    displayText.value += char
    currentIndex++
    
    // Update tokens per second
    if (streamStartTime.value) {
      const elapsed = (Date.now() - streamStartTime.value) / 1000
      tokensPerSecond.value = Math.round((currentIndex / 4) / elapsed)
    }
    
    // Auto-scroll if enabled
    if (props.autoScroll) {
      nextTick(() => {
        scrollToBottom()
      })
    }
    
    // Play typing sound
    if (props.enableSound) {
      playTypingSound()
    }
    
    typingTimer = setTimeout(typeChar, props.typingSpeed)
  }
  
  typeChar()
}

const stopTypingAnimation = () => {
  if (typingTimer) {
    clearTimeout(typingTimer)
    typingTimer = null
  }
  
  if (streamStartTime.value) {
    streamDuration.value = Date.now() - streamStartTime.value
  }
  
  emit('streamComplete', displayText.value)
}

const scrollToBottom = () => {
  if (contentRef.value) {
    contentRef.value.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'end' 
    })
  }
}

const playTypingSound = () => {
  // Create subtle typing sound
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
  
  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.1)
}

const formatMessageContent = (content: string): string => {
  // Basic markdown formatting
  let formatted = content
  
  // Code blocks
  formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre class="code-block" data-lang="${lang || ''}"><code>${escapeHtml(code.trim())}</code></pre>`
  })
  
  // Inline code
  formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
  
  // Bold
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  
  // Italic
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>')
  
  // Line breaks
  formatted = formatted.replace(/\n/g, '<br>')
  
  return formatted
}

const escapeHtml = (text: string): string => {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

const formatTime = (timestamp?: Date): string => {
  if (!timestamp) return ''
  
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  
  if (diff < 60000) {
    return t('time.justNow')
  } else if (diff < 3600000) {
    return t('time.minutesAgo', { minutes: Math.floor(diff / 60000) })
  } else if (diff < 86400000) {
    return t('time.hoursAgo', { hours: Math.floor(diff / 3600000) })
  } else {
    return timestamp.toLocaleDateString()
  }
}

// Cursor blinking
const startCursorBlinking = () => {
  cursorTimer = setInterval(() => {
    showCursor.value = !showCursor.value
  }, 500)
}

const stopCursorBlinking = () => {
  if (cursorTimer) {
    clearInterval(cursorTimer)
    cursorTimer = null
  }
  showCursor.value = false
}

// Watch for streaming changes
watch(() => props.isStreaming, (isStreaming) => {
  if (isStreaming) {
    startCursorBlinking()
    startTypingAnimation(props.message.content || '')
  } else {
    stopCursorBlinking()
    stopTypingAnimation()
  }
})

watch(() => props.message.content, (newContent) => {
  if (props.isStreaming && newContent) {
    // Update content during streaming
    const contentToAdd = newContent.slice(displayText.value.length)
    if (contentToAdd) {
      startTypingAnimation(newContent)
    }
  }
})

// Lifecycle
onMounted(() => {
  if (props.isStreaming) {
    startCursorBlinking()
    if (props.message.content) {
      startTypingAnimation(props.message.content)
    }
  }
})

onUnmounted(() => {
  if (typingTimer) clearTimeout(typingTimer)
  if (cursorTimer) clearInterval(cursorTimer)
})
</script>

<style scoped>
.streaming-message {
  @apply flex flex-col gap-2 p-4 border-b border-border/50;
  contain: layout style paint;
}

.message-user {
  @apply bg-primary/5;
}

.message-assistant {
  @apply bg-transparent;
}

.message-streaming {
  @apply bg-accent/30;
}

.message-error {
  @apply bg-destructive/5 border-destructive/20;
}

.message-header {
  @apply flex items-center gap-3;
}

.message-avatar {
  @apply flex-shrink-0;
}

.avatar-circle {
  @apply w-8 h-8 rounded-full flex items-center justify-center;
}

.avatar-user {
  @apply bg-primary text-primary-foreground;
}

.avatar-assistant {
  @apply bg-secondary text-secondary-foreground;
}

.avatar-system {
  @apply bg-muted text-muted-foreground;
}

.message-meta {
  @apply flex items-center gap-2 flex-1;
}

.message-role {
  @apply font-medium text-sm;
}

.message-time {
  @apply text-xs text-muted-foreground;
}

.message-actions {
  @apply flex items-center gap-1;
}

.action-btn {
  @apply p-1.5 rounded-md hover:bg-muted transition-colors opacity-0 group-hover:opacity-100;
}

.abort-btn {
  @apply text-destructive hover:bg-destructive/10;
}

.delete-btn {
  @apply text-destructive hover:bg-destructive/10;
}

.message-content-wrapper {
  @apply ml-11;
}

.message-content {
  @apply prose prose-sm dark:prose-invert max-w-none;
}

.streaming-text {
  @apply font-mono leading-relaxed;
}

.char {
  @apply inline;
  animation: fadeIn 0.1s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.cursor {
  @apply inline-block w-2 bg-primary;
  animation: blink 1s infinite;
}

.cursor.blinking {
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.formatted-content {
  @apply mt-2;
}

.content-html {
  @apply leading-relaxed;
}

.code-block {
  @apply bg-muted p-4 rounded-lg overflow-x-auto text-sm;
}

.inline-code {
  @apply bg-muted px-1.5 py-0.5 rounded text-sm font-mono;
}

.streaming-indicators {
  @apply flex items-center gap-4 mt-3 text-sm text-muted-foreground;
}

.typing-indicator {
  @apply flex items-center gap-2;
}

.typing-dots {
  @apply flex gap-1;
}

.typing-dots span {
  @apply w-1.5 h-1.5 bg-muted-foreground/50 rounded-full;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing {
  0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

.token-counter,
.speed-indicator {
  @apply flex items-center gap-1 text-xs;
}

.message-footer {
  @apply flex items-center justify-between mt-4 pt-2 border-t border-border;
}

.message-stats {
  @apply flex items-center gap-4 text-xs text-muted-foreground;
}

.stat {
  @apply flex items-center gap-1;
}

.message-actions-footer {
  @apply flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity;
}

.message-error {
  @apply flex items-center gap-2 mt-2 p-3 bg-destructive/10 text-destructive rounded-lg;
}

.retry-btn {
  @apply flex items-center gap-1 px-2 py-1 bg-destructive text-destructive-foreground rounded text-sm hover:bg-destructive/90 transition-colors;
}

.regenerate-controls {
  @apply mt-4 p-3 bg-muted/50 rounded-lg border border-border;
}

.regenerate-btn {
  @apply flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

.regenerate-options {
  @apply flex gap-4 mt-3;
}

.option {
  @apply flex items-center gap-2 text-sm cursor-pointer;
}

.option input[type="checkbox"] {
  @apply w-4 h-4;
}

/* Performance optimizations */
.streaming-message {
  will-change: contents;
}

.streaming-text {
  will-change: contents;
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .char {
    animation: none;
  }
  
  .cursor {
    animation: none;
    opacity: 1;
  }
  
  .typing-dots span {
    animation: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .message-content {
    @apply border-2 border-border;
  }
  
  .action-btn:focus {
    @apply ring-2 ring-primary;
  }
}
</style>