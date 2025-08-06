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
  'regenerate': [index: number]
  'copy': [content: string]
  'scroll': [position: any]
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

// Smart height estimation with caching
const estimateItemHeight = (message: any, index: number) => {
  const cacheKey = `${message.id}-${message.content?.length || 0}`
  
  if (messageHeights.value.has(cacheKey)) {
    return messageHeights.value.get(cacheKey)!
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
  
  // Cleanup cache if too large
  if (messageHeights.value.size > 1000) {
    const entries = Array.from(messageHeights.value.entries())
    messageHeights.value.clear()
    entries.slice(-500).forEach(([k, v]) => messageHeights.value.set(k, v))
  }
  
  return height
}

// Helper functions
const shouldShowTimeSeparator = (message: Message, prevMessage: Message | null) => {
  if (!prevMessage || !message.timestamp || !prevMessage.timestamp) {
    return false
  }
  
  const timeDiff = message.timestamp.getTime() - prevMessage.timestamp.getTime()
  return timeDiff > 30 * 60 * 1000 // 30 minutes
}

const formatTime = (timestamp: Date) => {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  
  if (diff < 24 * 60 * 60 * 1000) {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } else if (diff < 7 * 24 * 60 * 60 * 1000) {
    return timestamp.toLocaleDateString([], { 
      weekday: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  } else {
    return timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }
}

const getMessageClasses = (message: any) => ({
  'message-user': message.role === 'user',
  'message-assistant': message.role === 'assistant',
  'message-highlighted': message.id === props.highlightedMessageId,
  'message-error': message.error,
  'message-pending': message.pending
})

// Optimized scroll handling
const handleScroll = rafThrottle((scrollTop: number, scrollHeight: number, clientHeight: number) => {
  const threshold = 100
  const nearBottom = scrollTop + clientHeight >= scrollHeight - threshold
  
  if (isAtBottom.value !== nearBottom) {
    isAtBottom.value = nearBottom
    showScrollButton.value = !nearBottom && scrollTop > 300
    
    if (nearBottom) {
      unreadCount.value = 0
      lastReadIndex.value = props.messages.length - 1
    }
  }
  
  emit('scroll', { scrollTop, scrollHeight, clientHeight })
})

const handleItemRendered = (message: any, index: number) => {
  // Update actual height measurement
  nextTick(() => {
    const element = document.querySelector(`[data-message-id="${message.id}"]`)
    if (element) {
      const height = element.getBoundingClientRect().height
      const cacheKey = `${message.id}-${message.content?.length || 0}`
      messageHeights.value.set(cacheKey, height)
    }
  })
}

const handleEditMessage = (message: Message) => {
  // TODO: Implement edit functionality
  console.log('Edit message:', message.id)
}

const handleDeleteMessage = (message: Message) => {
  // TODO: Implement delete functionality
  console.log('Delete message:', message.id)
}

// Scroll methods
const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
  virtualScrollRef.value?.scrollToBottom(behavior)
  isAtBottom.value = true
  showScrollButton.value = false
}

const scrollToTop = (behavior: ScrollBehavior = 'smooth') => {
  virtualScrollRef.value?.scrollToTop(behavior)
}

const scrollToMessage = (messageId: string) => {
  const index = props.messages.findIndex(msg => msg.id === messageId)
  if (index >= 0) {
    virtualScrollRef.value?.scrollToIndex(index, 'smooth')
  }
}

// Auto-scroll on new messages
watch(() => props.messages.length, (newLength, oldLength) => {
  if (newLength > oldLength) {
    if (props.autoScroll && isAtBottom.value) {
      nextTick(() => scrollToBottom())
    } else if (!isAtBottom.value) {
      unreadCount.value += newLength - oldLength
    }
  }
})

// Scrolling state management
let scrollTimeout: NodeJS.Timeout
watch(isAtBottom, (newValue) => {
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

// Expose methods
defineExpose({
  scrollToBottom,
  scrollToTop,
  scrollToMessage
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
  0%, 100% { 
    background-color: transparent; 
  }
  25%, 75% { 
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

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
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
}
</style>