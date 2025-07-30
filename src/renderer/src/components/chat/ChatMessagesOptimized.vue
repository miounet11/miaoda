<template>
  <div class="chat-messages-optimized flex flex-col h-full relative">
    <!-- Loading State -->
    <div v-if="isLoading && messages.length === 0" class="loading-container">
      <MessageSkeleton v-for="i in 3" :key="i" />
    </div>
    
    <!-- Empty State -->
    <div v-else-if="messages.length === 0" class="empty-state">
      <div class="empty-state-content">
        <MessageSquare :size="48" class="empty-icon" />
        <h3 class="empty-title">{{ emptyStateTitle }}</h3>
        <p class="empty-description">{{ emptyStateDescription }}</p>
        
        <!-- Quick Suggestions -->
        <div v-if="quickSuggestions.length > 0" class="suggestions">
          <h4 class="suggestions-title">Try asking:</h4>
          <div class="suggestions-grid">
            <button
              v-for="suggestion in quickSuggestions"
              :key="suggestion"
              class="suggestion-chip"
              @click="$emit('send-suggestion', suggestion)"
            >
              <Sparkles :size="14" />
              {{ suggestion }}
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Virtual Scrolled Messages -->
    <div v-else class="messages-wrapper flex-1 relative">
      <VirtualScroll
        ref="virtualScrollRef"
        :items="groupedMessages"
        :item-height="estimateMessageHeight"
        :container-height="containerHeight"
        :buffer="5"
        :has-more="false"
        class="messages-virtual-container"
        @scroll="handleScroll"
        @item-rendered="handleItemRendered"
      >
        <template #default="{ item: group, index }">
          <div class="message-group" :class="{ 'group-user': group.role === 'user' }">
            <!-- Time separator -->
            <div v-if="group.showTimeSeparator" class="time-separator">
              <span class="time-text">{{ formatTime(group.timestamp) }}</span>
            </div>
            
            <!-- Message items in group -->
            <MessageItem
              v-for="(message, msgIndex) in group.messages"
              :key="message.id"
              :message="message"
              :show-avatar="msgIndex === 0"
              :show-timestamp="group.messages.length === 1"
              :is-first-in-group="msgIndex === 0"
              :is-last-in-group="msgIndex === group.messages.length - 1"
              :class="getMessageClasses(message, msgIndex, group)"
              @retry="$emit('retry-message', message)"
              @edit="$emit('edit-message', message)"
              @delete="$emit('delete-message', message)"
              @copy="handleCopyMessage(message)"
            />
          </div>
        </template>
        
        <template #loading>
          <div class="loading-more">
            <MessageSkeleton />
          </div>
        </template>
      </VirtualScroll>
      
      <!-- Typing Indicator -->
      <div v-if="isGenerating" class="typing-container">
        <TypingIndicator />
      </div>
    </div>
    
    <!-- Scroll to Bottom Button -->
    <Transition name="scroll-button">
      <button
        v-if="showScrollButton && !isAtBottom"
        class="scroll-to-bottom"
        @click="scrollToBottom"
        aria-label="Scroll to bottom"
      >
        <ChevronDown :size="20" />
        <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }}</span>
      </button>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { MessageSquare, Sparkles, ChevronDown } from 'lucide-vue-next'

// Components
import VirtualScroll from '@renderer/src/components/ui/VirtualScroll.vue'
import MessageItem from './MessageItem.vue'
import MessageSkeleton from '@renderer/src/components/loading/MessageSkeleton.vue'
import TypingIndicator from '@renderer/src/components/loading/TypingIndicator.vue'

// Utils
import { debounce, memoize, performanceMonitor } from '@renderer/src/utils/performance'

// Types
import type { Message, MessageGroup } from '@renderer/src/types'

interface Props {
  messages: Message[]
  isLoading?: boolean
  isGenerating?: boolean
  emptyStateTitle?: string
  emptyStateDescription?: string
  quickSuggestions?: string[]
  autoScroll?: boolean
  maxMessageHeight?: number
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  isGenerating: false,
  emptyStateTitle: 'No messages yet',
  emptyStateDescription: 'Start a conversation to see messages here',
  quickSuggestions: () => [],
  autoScroll: true,
  maxMessageHeight: 300
})

const emit = defineEmits<{
  'send-suggestion': [suggestion: string]
  'retry-message': [message: Message]
  'edit-message': [message: Message]
  'delete-message': [message: Message]
  'scroll-to-bottom': []
  'load-more': []
}>()

// Refs
const virtualScrollRef = ref<InstanceType<typeof VirtualScroll>>()
const containerHeight = ref(400)
const observer = ref<ResizeObserver>()

// State
const showScrollButton = ref(false)
const isAtBottom = ref(true)
const unreadCount = ref(0)
const lastReadMessageId = ref<string>()

// Memoized message grouping
const groupedMessages = computed(() => {
  const markEnd = performanceMonitor.mark('message-grouping')
  
  const groups: MessageGroup[] = []
  let currentGroup: MessageGroup | null = null
  
  const TIME_THRESHOLD = 5 * 60 * 1000 // 5 minutes
  const MAX_GROUP_SIZE = 5
  
  for (let i = 0; i < props.messages.length; i++) {
    const message = props.messages[i]
    const prevMessage = i > 0 ? props.messages[i - 1] : null
    
    const shouldStartNewGroup = !currentGroup ||
      currentGroup.role !== message.role ||
      currentGroup.messages.length >= MAX_GROUP_SIZE ||
      (message.timestamp && currentGroup.timestamp && 
       message.timestamp.getTime() - currentGroup.timestamp.getTime() > TIME_THRESHOLD)
    
    if (shouldStartNewGroup) {
      currentGroup = {
        id: `group-${message.id}`,
        role: message.role,
        messages: [message],
        timestamp: message.timestamp || new Date(),
        showTimeSeparator: shouldShowTimeSeparator(message, prevMessage)
      }
      groups.push(currentGroup)
    } else {
      currentGroup.messages.push(message)
    }
  }
  
  markEnd()
  return groups
})

// Memoized height estimation
const estimateMessageHeight = memoize((group: MessageGroup, index: number) => {
  let height = 0
  
  // Time separator
  if (group.showTimeSeparator) {
    height += 40
  }
  
  // Base message height
  const baseHeight = 60
  
  // Estimate based on content length and role
  for (const message of group.messages) {
    let messageHeight = baseHeight
    
    // Content length estimation
    const contentLength = message.content?.length || 0
    const estimatedLines = Math.ceil(contentLength / 80) // ~80 chars per line
    messageHeight += Math.max(0, (estimatedLines - 1) * 20) // 20px per extra line
    
    // Attachments add height
    if (message.attachments?.length) {
      messageHeight += message.attachments.length * 100
    }
    
    // Code blocks add extra height
    if (message.content?.includes('```')) {
      messageHeight += 50
    }
    
    // Limit maximum height
    messageHeight = Math.min(messageHeight, props.maxMessageHeight)
    
    height += messageHeight
    
    // Spacing between messages in group
    if (group.messages.length > 1) {
      height += 8
    }
  }
  
  // Group padding
  height += 16
  
  return height
}, 200)

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
    // Same day - show time
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } else if (diff < 7 * 24 * 60 * 60 * 1000) {
    // This week - show day and time
    return timestamp.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })
  } else {
    // Older - show date
    return timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }
}

const getMessageClasses = (message: Message, index: number, group: MessageGroup) => {
  return {
    'message-first': index === 0,
    'message-last': index === group.messages.length - 1,
    'message-error': message.error,
    'message-pending': message.pending
  }
}

const handleCopyMessage = async (message: Message) => {
  try {
    await navigator.clipboard.writeText(message.content || '')
  } catch (error) {
    console.warn('Failed to copy message:', error)
  }
}

// Scroll handling
const handleScroll = debounce((scrollTop: number, scrollHeight: number, clientHeight: number) => {
  const threshold = 100
  const nearBottom = scrollTop + clientHeight >= scrollHeight - threshold
  
  isAtBottom.value = nearBottom
  showScrollButton.value = !nearBottom && scrollTop > 200
  
  // Update unread count
  if (nearBottom) {
    unreadCount.value = 0
    lastReadMessageId.value = props.messages[props.messages.length - 1]?.id
  }
}, 100)

const handleItemRendered = (group: MessageGroup, index: number) => {
  // Track rendered groups for performance monitoring
  performanceMonitor.mark(`group-${group.id}-render`)()
}

const scrollToBottom = () => {
  virtualScrollRef.value?.scrollToBottom('smooth')
  emit('scroll-to-bottom')
}

// Auto-scroll on new messages
watch(() => props.messages.length, (newLength, oldLength) => {
  if (newLength > oldLength && props.autoScroll && isAtBottom.value) {
    nextTick(() => {
      scrollToBottom()
    })
  } else if (newLength > oldLength && !isAtBottom.value) {
    // Increment unread count for messages added while not at bottom
    unreadCount.value += newLength - oldLength
  }
})

// Container resize handling
const setupResizeObserver = () => {
  if (!virtualScrollRef.value) return
  
  observer.value = new ResizeObserver((entries) => {
    const entry = entries[0]
    if (entry) {
      containerHeight.value = entry.contentRect.height
    }
  })
  
  const container = virtualScrollRef.value.$el?.parentElement
  if (container) {
    observer.value.observe(container)
    containerHeight.value = container.clientHeight
  }
}

// Lifecycle
onMounted(() => {
  nextTick(() => {
    setupResizeObserver()
    
    if (props.messages.length > 0 && props.autoScroll) {
      scrollToBottom()
    }
  })
})

onUnmounted(() => {
  observer.value?.disconnect()
})

// Expose methods
defineExpose({
  scrollToBottom,
  scrollToTop: () => virtualScrollRef.value?.scrollToTop(),
  scrollToMessage: (messageId: string) => {
    const groupIndex = groupedMessages.value.findIndex(group =>
      group.messages.some(msg => msg.id === messageId)
    )
    if (groupIndex >= 0) {
      virtualScrollRef.value?.scrollToIndex(groupIndex)
    }
  }
})
</script>

<style scoped>
.chat-messages-optimized {
  height: 100%;
  overflow: hidden;
  contain: layout style paint;
}

.loading-container {
  padding: 1rem;
  space-y: 1rem;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
}

.empty-state-content {
  text-align: center;
  max-width: 400px;
}

.empty-icon {
  color: var(--color-textSecondary);
  margin: 0 auto 1rem;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.empty-description {
  color: var(--color-textSecondary);
  margin-bottom: 2rem;
}

.suggestions {
  text-align: left;
}

.suggestions-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 1rem;
}

.suggestions-grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 1fr;
}

.suggestion-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  color: var(--color-text);
  font-size: 0.875rem;
  text-align: left;
  transition: all 0.2s ease;
  cursor: pointer;
}

.suggestion-chip:hover {
  background: var(--color-accent);
  border-color: var(--color-primary);
  transform: translateY(-1px);
}

.messages-wrapper {
  position: relative;
  overflow: hidden;
}

.messages-virtual-container {
  height: 100%;
}

.message-group {
  padding: 0.5rem 1rem;
  contain: layout style paint;
}

.group-user {
  background: rgba(var(--color-primary-rgb), 0.02);
}

.time-separator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 1rem 0;
  position: relative;
}

.time-separator::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--color-border);
}

.time-text {
  background: var(--color-background);
  color: var(--color-textSecondary);
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  border: 1px solid var(--color-border);
  position: relative;
  z-index: 1;
}

.typing-container {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--color-background);
  border-top: 1px solid var(--color-border);
  padding: 0.5rem 1rem;
}

.scroll-to-bottom {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  width: 3rem;
  height: 3rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  position: relative;
}

.scroll-to-bottom:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.unread-badge {
  position: absolute;
  top: -0.25rem;
  right: -0.25rem;
  background: var(--color-error);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 0.75rem;
  min-width: 1.25rem;
  text-align: center;
}

.loading-more {
  padding: 1rem;
  display: flex;
  justify-content: center;
}

/* Transitions */
.scroll-button-enter-active,
.scroll-button-leave-active {
  transition: all 0.3s ease;
}

.scroll-button-enter-from,
.scroll-button-leave-to {
  opacity: 0;
  transform: translateY(100%) scale(0.8);
}

/* Message transitions */
.message-first {
  animation: messageAppear 0.3s ease-out;
}

@keyframes messageAppear {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Performance optimizations */
.message-group {
  will-change: transform;
  contain: layout style paint;
}

/* Responsive design */
@media (max-width: 768px) {
  .message-group {
    padding: 0.25rem 0.75rem;
  }
  
  .scroll-to-bottom {
    width: 2.5rem;
    height: 2.5rem;
    bottom: 0.75rem;
    right: 0.75rem;
  }
  
  .suggestions-grid {
    grid-template-columns: 1fr;
  }
}

/* Dark theme enhancements */
:root[data-theme="dark"] .group-user {
  background: rgba(var(--color-primary-rgb), 0.05);
}

:root[data-theme="dark"] .time-text {
  background: var(--color-surface);
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .suggestion-chip {
    border-width: 2px;
  }
  
  .time-separator::before {
    height: 2px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .message-first {
    animation: none;
  }
  
  .scroll-button-enter-active,
  .scroll-button-leave-active {
    transition: none;
  }
  
  .suggestion-chip:hover {
    transform: none;
  }
}
</style>