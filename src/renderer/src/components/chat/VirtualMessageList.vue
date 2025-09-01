<template>
  <div class="virtual-message-list" :class="{ scrolling: isScrolling }">
    <VirtualScroll
      ref="virtualScrollRef"
      :items="processedMessages"
      :item-height="estimateItemHeight"
      :container-height="containerHeight"
      :buffer="3"
      :has-more="false"
      class="message-scroll-container"
      @scroll="handleScroll"
      @item-rendered="handleItemRendered"
    >
      <template #default="{ item, index }">
        <div
          :key="item.id"
          class="message-item-container"
          :class="getMessageClasses(item)"
          :data-message-id="item.id"
        >
          <!-- Time separator -->
          <div v-if="item.showTimeSeparator" class="time-separator">
            <span class="time-text">{{ formatTime(item.timestamp) }}</span>
          </div>

          <!-- Message content with optimized rendering -->
          <MessageItem
            :message="item"
            :is-highlighted="item.id === highlightedMessageId"
            :is-streaming="item.pending"
            @retry="$emit('regenerate', index)"
            @copy="$emit('copy', item.content)"
            @edit="handleEditMessage(item)"
            @delete="handleDeleteMessage(item)"
            class="message-item-optimized"
          />
        </div>
      </template>
    </VirtualScroll>

    <!-- Scroll to bottom button with unread indicator -->
    <Transition name="scroll-button">
      <button
        v-if="showScrollButton && !isAtBottom"
        class="scroll-to-bottom-btn"
        @click="scrollToBottom"
        aria-label="Scroll to bottom"
      >
        <ChevronDown :size="20" />
        <span v-if="unreadCount > 0" class="unread-badge">
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </button>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import VirtualScroll from '../ui/VirtualScroll.vue'
import MessageItem from './MessageItem.vue'
import { debounce, rafThrottle, performanceMonitor } from '@renderer/src/utils/performance'
import type { Message } from '@renderer/src/types'

interface Props {
  messages: Message[]
  isLoading?: boolean
  highlightedMessageId?: string
  autoScroll?: boolean
  containerHeight?: number
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  autoScroll: true,
  containerHeight: 400
})

const emit = defineEmits<{
  regenerate: [index: number]
  copy: [content: string]
  scroll: [position: any]
  'item-measured': [data: { messageId: string; height: number; index: number }]
  'visibility-change': [visibleRange: { start: number; end: number }]
  'message-focus': [messageId: string]
}>()

// Refs
const virtualScrollRef = ref<InstanceType<typeof VirtualScroll>>()

// State
const isScrolling = ref(false)
const isAtBottom = ref(true)
const showScrollButton = ref(false)
const unreadCount = ref(0)
const lastReadIndex = ref(-1)
const messageHeights = ref(new Map<string, number>())

// Optimized message processing with incremental updates
const processedMessages = computed(() => {
  const markEnd = performanceMonitor.mark('process-messages')

  const processed = props.messages.map((message, index) => {
    const prevMessage = index > 0 ? props.messages[index - 1] : null

    return {
      ...message,
      showTimeSeparator: shouldShowTimeSeparator(message, prevMessage),
      index
    }
  })

  markEnd()
  return processed
})

// Enhanced height estimation with multiple caching strategies
const estimateItemHeight = (message: any, index: number) => {
  // Try exact cache first
  const cacheKey = `${message.id}-${message.content?.length || 0}`

  if (messageHeights.value.has(cacheKey)) {
    return messageHeights.value.get(cacheKey)!
  }

  // Try content hash cache for similar messages
  if (message.content) {
    const contentHash = hashString(message.content)
    const cachedHeight = messageHeights.value.get(`content-${contentHash}`)
    if (cachedHeight !== undefined) {
      // Store in main cache for faster future access
      messageHeights.value.set(cacheKey, cachedHeight)
      return cachedHeight
    }
  }

  let height = 60 // Base height

  // Time separator
  if (message.showTimeSeparator) {
    height += 32
  }

  // Content-based height estimation
  if (message.content) {
    const contentLength = message.content.length
    const lines = Math.max(1, Math.ceil(contentLength / 85))
    height += Math.min((lines - 1) * 24, 200) // Max content height limit

    // Code blocks
    if (message.content.includes('```')) {
      height += 40
    }

    // Lists
    const listItems = (message.content.match(/^[-*+]\s/gm) || []).length
    height += listItems * 18
  }

  // Attachments
  if (message.attachments?.length) {
    height += message.attachments.length * 80
  }

  // Role-specific adjustments
  if (message.role === 'user') {
    height = Math.max(height * 0.9, 50) // User messages tend to be more compact
  }

  // Cache the result
  messageHeights.value.set(cacheKey, height)

  // Intelligent cache management with LRU-like behavior
  if (messageHeights.value.size > 1000) {
    // Keep most recent and frequently accessed items
    const entries = Array.from(messageHeights.value.entries())
    const recentMessages = props.messages.slice(-200).map(m => `${m.id}-${m.content?.length || 0}`)

    messageHeights.value.clear()

    // Preserve recent messages and content hashes
    entries.forEach(([key, value]) => {
      if (recentMessages.includes(key) || key.startsWith('content-')) {
        messageHeights.value.set(key, value)
      }
    })

    // Keep last 300 entries if not enough recent ones
    if (messageHeights.value.size < 300) {
      entries.slice(-300).forEach(([k, v]) => messageHeights.value.set(k, v))
    }
  }

  return height
}

// Helper functions
const shouldShowTimeSeparator = (message: Message, prevMessage: Message | null) => {
  if (!prevMessage || !message.timestamp || !prevMessage.timestamp) {
    return false
  }

  // Convert to Date if it's a string
  const messageTime =
    message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp)
  const prevMessageTime =
    prevMessage.timestamp instanceof Date ? prevMessage.timestamp : new Date(prevMessage.timestamp)

  const timeDiff = messageTime.getTime() - prevMessageTime.getTime()
  return timeDiff > 30 * 60 * 1000 // 30 minutes
}

const formatTime = (timestamp: Date | string) => {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } else if (diff < 7 * 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString([], {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }
}

const getMessageClasses = (message: any) => ({
  'message-user': message.role === 'user',
  'message-assistant': message.role === 'assistant',
  'message-highlighted': message.id === props.highlightedMessageId,
  'message-error': message.error,
  'message-pending': message.pending
})

// Enhanced scroll handling with performance optimization
const handleScroll = rafThrottle(
  (scrollTop: number, scrollHeight: number, clientHeight: number) => {
    const threshold = 100
    const nearBottom = scrollTop + clientHeight >= scrollHeight - threshold
    const nearTop = scrollTop < 100

    // Update scroll states only when necessary
    if (isAtBottom.value !== nearBottom) {
      isAtBottom.value = nearBottom
      showScrollButton.value = !nearBottom && scrollTop > 300

      if (nearBottom) {
        unreadCount.value = 0
        lastReadIndex.value = props.messages.length - 1
      }
    }

    // Calculate visible message range for performance insights
    const visibleStartIndex = Math.floor(scrollTop / 80) // Approximate
    const visibleEndIndex = Math.min(
      props.messages.length - 1,
      Math.ceil((scrollTop + clientHeight) / 80)
    )

    // Emit visibility change for external optimization
    emit('visibility-change', {
      start: visibleStartIndex,
      end: visibleEndIndex
    })

    // Enhanced scroll event with more context
    emit('scroll', {
      scrollTop,
      scrollHeight,
      clientHeight,
      isAtBottom: nearBottom,
      isAtTop: nearTop,
      scrollPercentage: (scrollTop / (scrollHeight - clientHeight)) * 100,
      visibleRange: { start: visibleStartIndex, end: visibleEndIndex }
    })
  }
)

const handleItemRendered = (message: any, index: number) => {
  // Update actual height measurement with improved accuracy
  nextTick(() => {
    const element = document.querySelector(`[data-message-id="${message.id}"]`)
    if (element) {
      const rect = element.getBoundingClientRect()
      if (rect.height > 0) {
        const cacheKey = `${message.id}-${message.content?.length || 0}`
        messageHeights.value.set(cacheKey, rect.height)

        // Also cache by content hash for better reuse
        if (message.content) {
          const contentHash = hashString(message.content)
          messageHeights.value.set(`content-${contentHash}`, rect.height)
        }

        // Emit for performance monitoring
        emit('item-measured', {
          messageId: message.id,
          height: rect.height,
          index
        })
      }
    }
  })
}

// Simple hash function for content caching
const hashString = (str: string): string => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash.toString()
}

const handleEditMessage = (message: Message) => {
  // TODO: Implement edit functionality
  console.log('Edit message:', message.id)
}

const handleDeleteMessage = (message: Message) => {
  // TODO: Implement delete functionality
  console.log('Delete message:', message.id)
}

// Enhanced scroll methods with animation and callbacks
const scrollToBottom = (behavior: ScrollBehavior = 'smooth', callback?: () => void) => {
  if (virtualScrollRef.value) {
    virtualScrollRef.value.scrollToBottom(behavior)
    isAtBottom.value = true
    showScrollButton.value = false

    if (callback) {
      // Execute callback after scroll animation completes
      setTimeout(callback, behavior === 'smooth' ? 300 : 0)
    }
  }
}

const scrollToTop = (behavior: ScrollBehavior = 'smooth', callback?: () => void) => {
  if (virtualScrollRef.value) {
    virtualScrollRef.value.scrollToTop(behavior)

    if (callback) {
      setTimeout(callback, behavior === 'smooth' ? 300 : 0)
    }
  }
}

const scrollToMessage = (messageId: string, highlight: boolean = true, callback?: () => void) => {
  const index = props.messages.findIndex(msg => msg.id === messageId)
  if (index >= 0 && virtualScrollRef.value) {
    virtualScrollRef.value.scrollToIndex(index, 'smooth')

    if (highlight) {
      // Emit focus event for highlighting
      emit('message-focus', messageId)
    }

    if (callback) {
      setTimeout(callback, 300)
    }

    return true
  }
  return false
}

// New method: Smooth scroll to specific position
const scrollToPosition = (position: number, behavior: ScrollBehavior = 'smooth') => {
  if (virtualScrollRef.value?.containerRef) {
    virtualScrollRef.value.containerRef.scrollTo({
      top: position,
      behavior
    })
  }
}

// New method: Get current scroll information
const getScrollInfo = () => {
  if (!virtualScrollRef.value?.containerRef) return null

  const container = virtualScrollRef.value.containerRef
  return {
    scrollTop: container.scrollTop,
    scrollHeight: container.scrollHeight,
    clientHeight: container.clientHeight,
    isAtBottom: isAtBottom.value,
    scrollPercentage:
      (container.scrollTop / (container.scrollHeight - container.clientHeight)) * 100
  }
}

// Auto-scroll on new messages
watch(
  () => props.messages.length,
  (newLength, oldLength) => {
    if (newLength > oldLength) {
      if (props.autoScroll && isAtBottom.value) {
        nextTick(() => scrollToBottom())
      } else if (!isAtBottom.value) {
        unreadCount.value += newLength - oldLength
      }
    }
  }
)

// Scrolling state management
let scrollTimeout: NodeJS.Timeout
watch(isAtBottom, newValue => {
  if (newValue) {
    isScrolling.value = true
    clearTimeout(scrollTimeout)
    scrollTimeout = setTimeout(() => {
      isScrolling.value = false
    }, 150)
  }
})

// Cleanup
onUnmounted(() => {
  clearTimeout(scrollTimeout)
})

// Expose enhanced methods
defineExpose({
  scrollToBottom,
  scrollToTop,
  scrollToMessage,
  scrollToPosition,
  getScrollInfo,
  // Performance utilities
  clearHeightCache: () => messageHeights.value.clear(),
  getCacheSize: () => messageHeights.value.size,
  // State access
  getIsAtBottom: () => isAtBottom.value,
  getUnreadCount: () => unreadCount.value,
  // Direct virtual scroll access
  virtualScrollRef
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
.virtual-message-list {
  height: 100%;
  position: relative;
  contain: layout style paint;
  /* GPU acceleration */
  transform: translateZ(0);
  will-change: scroll-position;
}

.message-scroll-container {
  height: 100%;
  /* Optimize scrolling */
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

.message-item-container {
  position: relative;
  contain: layout style paint;
  /* Performance optimizations */
  will-change: transform;
  backface-visibility: hidden;
}

.message-item-optimized {
  /* Reduce layout recalculations */
  contain: layout style paint;
  transform: translateZ(0);
}

.message-user {
  /* User message styling */
}

.message-assistant {
  /* Assistant message styling */
}

.message-highlighted {
  animation: highlight-flash 2s ease-in-out;
}

.message-error {
  /* Error styling */
}

.message-pending {
  opacity: 0.7;
  /* Pending animation */
}

.time-separator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 1.5rem 0 1rem;
  position: relative;
}

.time-separator::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--border-color, #e2e8f0);
  z-index: 0;
}

.time-text {
  background: var(--background-color, white);
  color: var(--muted-foreground, #64748b);
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  border: 1px solid var(--border-color, #e2e8f0);
  position: relative;
  z-index: 1;
}

.scroll-to-bottom-btn {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  z-index: 10;
  width: 3rem;
  height: 3rem;
  background: var(--primary-color, #3b82f6);
  color: white;
  border: none;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  position: relative;
}

.scroll-to-bottom-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.unread-badge {
  position: absolute;
  top: -0.25rem;
  right: -0.25rem;
  background: var(--destructive-color, #ef4444);
  color: white;
  font-size: 0.675rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 0.75rem;
  min-width: 1.25rem;
  text-align: center;
  line-height: 1.2;
}

/* Animations */
@keyframes highlight-flash {
  0%,
  100% {
    background-color: transparent;
  }
  25%,
  75% {
    background-color: rgba(59, 130, 246, 0.1);
  }
}

.scroll-button-enter-active,
.scroll-button-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.scroll-button-enter-from,
.scroll-button-leave-to {
  opacity: 0;
  transform: translateY(100%) scale(0.8);
}

/* Performance optimizations for scrolling */
.scrolling .message-item-container {
  /* Reduce visual effects during scrolling */
  pointer-events: none;
}

.scrolling .message-item-optimized {
  /* Optimize rendering during scroll */
  will-change: transform;
  contain: strict;
}

/* Responsive design */
@media (max-width: 768px) {
  .scroll-to-bottom-btn {
    width: 2.75rem;
    height: 2.75rem;
    bottom: 1rem;
    right: 1rem;
  }

  .time-separator {
    margin: 1rem 0 0.75rem;
  }

  .unread-badge {
    font-size: 0.625rem;
    padding: 0.0625rem 0.25rem;
  }
}

/* Dark theme support */
@media (prefers-color-scheme: dark) {
  .time-text {
    background: var(--dark-background, #1a1a1a);
    border-color: var(--dark-border, #374151);
    color: var(--dark-muted, #9ca3af);
  }

  .time-separator::before {
    background: var(--dark-border, #374151);
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .time-separator::before {
    height: 2px;
  }

  .time-text {
    border-width: 2px;
  }

  .scroll-to-bottom-btn {
    border: 2px solid white;
  }
}

/* Enhanced reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .virtual-message-list,
  .message-scroll-container {
    scroll-behavior: auto;
  }

  .message-highlighted {
    animation: none;
    background-color: rgba(59, 130, 246, 0.1);
  }

  .scroll-button-enter-active,
  .scroll-button-leave-active {
    transition: opacity 0.2s ease;
  }

  .scroll-to-bottom-btn {
    transition: none;
  }

  .scroll-to-bottom-btn:hover {
    transform: none;
  }

  /* Disable transform animations */
  .message-item-container {
    will-change: auto;
    transform: none;
  }
}

/* High refresh rate display optimizations */
@media (min-resolution: 120dpi) {
  .message-item-container {
    /* Smoother animations on high DPI displays */
    transform: translate3d(0, 0, 0);
  }
}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  .virtual-message-list {
    /* Better touch scrolling */
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y;
  }

  .scroll-to-bottom-btn {
    /* Larger touch target */
    min-width: 48px;
    min-height: 48px;
  }
}

/* Modern scrollbar with better performance */
.message-scroll-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.message-scroll-container::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}

.message-scroll-container::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.4);
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.message-scroll-container::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.6);
}

/* Firefox scrollbar */
.message-scroll-container {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.4) transparent;
}

/* Dark mode scrollbar */
@media (prefers-color-scheme: dark) {
  .message-scroll-container::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
  }

  .message-scroll-container::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .message-scroll-container {
    scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
  }
}


/* 焦点样式 */
:focus-visible {
  outline: 2px solid hsl(var(--ring, 59 130 230));
  outline-offset: 2px;
}</style>
