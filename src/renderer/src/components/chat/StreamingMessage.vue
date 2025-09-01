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
         aria-label="按钮">
          <Square :size="14" />
        </button>
      </div>
    </div>

    <!-- Message Content -->
    <div class="message-content-wrapper">
      <div class="message-content" ref="contentRef">
        <!-- Streaming Text -->
        <div class="streaming-text" :class="{ typing: isStreaming }">
          <span
            v-for="(char, index) in displayChars"
            :key="index"
            class="char"
            :style="{ animationDelay: `${index * typingSpeed}ms` }"
          >
            {{ char }}
          </span>

          <!-- Cursor -->
          <span v-if="isStreaming" class="cursor" :class="{ blinking: showCursor }">|</span>
        </div>

        <!-- Code blocks and formatting -->
        <div v-if="!isStreaming && formattedContent" class="formatted-content">
          <div v-html="formattedContent" class="content-html" />
        </div>

        <!-- Streaming indicators -->
        <div v-if="isStreaming" class="streaming-indicators">
          <div class="typing-indicator">
            <div class="typing-dots">
              <span />
              <span />
              <span />
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
          <button @click="$emit('copy')" class="action-btn" :title="$t('message.copy')" aria-label="按钮">
            <Copy :size="14" />
          </button>

          <button @click="$emit('retry')" class="action-btn" :title="$t('message.retry')" aria-label="按钮">
            <RotateCcw :size="14" />
          </button>

          <button @click="$emit('edit')" class="action-btn" :title="$t('message.edit')" aria-label="按钮">
            <Edit :size="14" />
          </button>

          <button
            @click="$emit('delete')"
            class="action-btn delete-btn"
            :title="$t('message.delete')"
           aria-label="按钮">
            <Trash2 :size="14" />
          </button>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="message.error" class="message-error">
      <AlertCircle :size="16" />
      <span>{{ errorMessage }}</span>
      <button @click="$emit('retry')" class="retry-btn" aria-label="按钮">
        <RotateCcw :size="14" />
        Retry
      </button>
    </div>

    <!-- Regeneration Controls -->
    <div v-if="showRegenerateControls" class="regenerate-controls">
      <button @click="$emit('regenerate')" class="regenerate-btn" :disabled="isStreaming" aria-label="按钮">
        <RefreshCw :size="14" />
        Regenerate Response
      </button>

      <div class="regenerate-options">
        <label class="option">
          <input id="input-8hj79pjwl" type="checkbox" v-model="regenerateWithDifferentTemp"  aria-label="输入框">
          <span>Different temperature</span>
        </label>

        <label class="option">
          <input id="input-rw9sas7gf" type="checkbox" v-model="regenerateWithDifferentModel"  aria-label="输入框">
          <span>Different model</span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import {
  User,
  Bot,
  Square,
  Copy,
  Edit,
  Trash2,
  RotateCcw,
  RefreshCw,
  AlertCircle,
  Clock,
  Hash,
  Cpu,
  Zap,
  TrendingUp
} from 'lucide-vue-next'
import {
  streamingService,
  type StreamChunk
} from '@renderer/src/services/streaming/StreamingService'
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
  return (
    !props.isStreaming &&
    props.message.role === 'assistant' &&
    (props.message.error || props.message.content)
  )
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
      tokensPerSecond.value = Math.round(currentIndex / 4 / elapsed)
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
watch(
  () => props.isStreaming,
  isStreaming => {
    if (isStreaming) {
      startCursorBlinking()
      startTypingAnimation(props.message.content || '')
    } else {
      stopCursorBlinking()
      stopTypingAnimation()
    }
  }
)

watch(
  () => props.message.content,
  newContent => {
    if (props.isStreaming && newContent) {
      // Update content during streaming
      const contentToAdd = newContent.slice(displayText.value.length)
      if (contentToAdd) {
        startTypingAnimation(newContent)
      }
    }
  }
)

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
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.cursor {
  @apply inline-block w-2 bg-primary;
  animation: blink 1s infinite;
}

.cursor.blinking {
  animation: blink 1s infinite;
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
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

.typing-dots span:nth-child(1) {
  animation-delay: -0.32s;
}
.typing-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing {
  0%,
  80%,
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
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

.option input[type='checkbox'] {
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
}</style>
