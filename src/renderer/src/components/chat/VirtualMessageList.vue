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
</style>
