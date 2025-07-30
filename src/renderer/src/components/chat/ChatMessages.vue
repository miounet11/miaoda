<template>
  <div class="chat-messages flex-1 overflow-y-auto px-2 sm:px-4 py-4 sm:py-6" ref="messagesContainer">
    <div class="max-w-3xl mx-auto">
      <!-- Empty State -->
      <div v-if="!messages.length" class="empty-state text-center py-20">
        <div class="inline-flex items-center justify-center w-20 h-20 mb-6 bg-primary/10 rounded-full">
          <MessageSquare :size="40" class="text-primary" />
        </div>
        <h2 class="text-2xl font-semibold mb-4">{{ emptyStateTitle }}</h2>
        <p class="text-muted-foreground mb-8">{{ emptyStateDescription }}</p>
        
        <!-- Quick start suggestions -->
        <div v-if="quickSuggestions.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 max-w-lg mx-auto px-4 sm:px-0">
          <button
            v-for="suggestion in quickSuggestions"
            :key="suggestion"
            @click="$emit('send-suggestion', suggestion)"
            class="text-left p-3 sm:p-4 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
          >
            <p class="text-sm">{{ suggestion }}</p>
          </button>
        </div>
      </div>
      
      <!-- Messages -->
      <div v-else class="messages-list space-y-6">
        <MessageItem
          v-for="(message, index) in messages"
          :key="message.id"
          :message="message"
          :is-last="index === messages.length - 1"
          :is-loading="isLoading && message.role === 'assistant' && index === messages.length - 1"
          @retry="$emit('retry-message', message)"
          @edit="$emit('edit-message', message)"
          @delete="$emit('delete-message', message)"
          @copy="copyMessage"
        />
        
        <!-- Loading indicator for new message -->
        <div v-if="isGenerating" class="message-loading">
          <MessageSkeleton />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { MessageSquare } from 'lucide-vue-next'
import MessageItem from './MessageItem.vue'
import MessageSkeleton from '../loading/MessageSkeleton.vue'
import { useErrorHandler } from '@renderer/src/composables/useErrorHandler'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  error?: string
  attachments?: Array<{
    type: 'image' | 'file'
    url: string
    name: string
  }>
}

interface Props {
  messages: Message[]
  isLoading?: boolean
  isGenerating?: boolean
  emptyStateTitle?: string
  emptyStateDescription?: string
  quickSuggestions?: string[]
  autoScroll?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  isGenerating: false,
  emptyStateTitle: 'Welcome to MiaoDa Chat',
  emptyStateDescription: 'Start a conversation with your AI assistant',
  quickSuggestions: () => [
    "Explain quantum computing in simple terms",
    "Write a Python function to sort a list",
    "What are the benefits of meditation?",
    "Help me plan a healthy meal"
  ],
  autoScroll: true
})

defineEmits<{
  'send-suggestion': [suggestion: string]
  'retry-message': [message: Message]
  'edit-message': [message: Message]
  'delete-message': [message: Message]
  'scroll-to-bottom': []
}>()

const messagesContainer = ref<HTMLElement>()
const { showSuccess } = useErrorHandler()

// Auto scroll to bottom
const scrollToBottom = (smooth = true) => {
  if (!messagesContainer.value) return
  
  messagesContainer.value.scrollTo({
    top: messagesContainer.value.scrollHeight,
    behavior: smooth ? 'smooth' : 'auto'
  })
}

// Check if user is near bottom
const isNearBottom = () => {
  if (!messagesContainer.value) return true
  
  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value
  return scrollHeight - scrollTop - clientHeight < 100
}

// Handle scroll events
const handleScroll = () => {
  // Could emit scroll events for parent component if needed
}

// Copy message content
const copyMessage = async (message: Message) => {
  try {
    await navigator.clipboard.writeText(message.content)
    showSuccess('Message copied to clipboard')
  } catch (error) {
    console.error('Failed to copy message:', error)
  }
}

// Watch for new messages and auto-scroll
watch(() => props.messages.length, (newLength, oldLength) => {
  if (newLength > oldLength && props.autoScroll && isNearBottom()) {
    nextTick(() => scrollToBottom())
  }
})

// Watch for loading state changes
watch(() => props.isLoading, (isLoading) => {
  if (isLoading && props.autoScroll) {
    nextTick(() => scrollToBottom())
  }
})

// Setup scroll listener
onMounted(() => {
  if (messagesContainer.value) {
    messagesContainer.value.addEventListener('scroll', handleScroll, { passive: true })
  }
  
  // Initial scroll to bottom
  nextTick(() => scrollToBottom(false))
})

onUnmounted(() => {
  if (messagesContainer.value) {
    messagesContainer.value.removeEventListener('scroll', handleScroll)
  }
})

// Expose methods for parent component
defineExpose({
  scrollToBottom,
  isNearBottom
})
</script>

<style scoped>
.chat-messages {
  scroll-behavior: smooth;
}

/* Custom scrollbar */
.chat-messages::-webkit-scrollbar {
  width: 8px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}

/* Dark theme scrollbar */
:root[data-theme="dark"] .chat-messages::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
}

:root[data-theme="dark"] .chat-messages::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Empty state animation */
.empty-state {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Messages list animations */
.messages-list > * {
  animation: messageSlideIn 0.3s ease-out;
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Loading state */
.message-loading {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .empty-state h2 {
    font-size: 1.5rem;
  }
  
  .empty-state p {
    font-size: 0.875rem;
  }
}
</style>