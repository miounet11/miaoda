<template>
  <div class="chat-view">
    <div class="chat-messages-container" ref="messagesContainer">
      <!-- Messages List -->
      <div class="chat-messages">
        <div v-if="currentMessages.length === 0" class="empty-state">
          <div class="empty-state-icon">
            <MessageSquare :size="48" />
          </div>
          <h3>Start a conversation</h3>
          <p>Send a message to begin chatting with AI</p>
        </div>

        <div
          v-for="message in currentMessages"
          :key="message.id"
          class="message-wrapper"
          :class="{
            'user-message': message.role === 'user',
            'assistant-message': message.role === 'assistant',
            'system-message': message.role === 'system'
          }"
        >
          <div class="message-content">
            <div class="message-header">
              <div class="message-avatar">
                <User v-if="message.role === 'user'" :size="16" />
                <Bot v-else-if="message.role === 'assistant'" :size="16" />
                <Settings v-else :size="16" />
              </div>
              <div class="message-role">
                {{
                  message.role === 'user'
                    ? 'You'
                    : message.role === 'assistant'
                      ? 'Assistant'
                      : 'System'
                }}
              </div>
              <div class="message-time">
                {{ formatTime(message.timestamp || message.createdAt || new Date()) }}
              </div>
            </div>
            <div class="message-body">
              <div v-if="message.pending && !message.content" class="typing-indicator">
                <div class="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
              <div v-else class="message-text">{{ message.content }}</div>
              <div v-if="message.error" class="message-error">Error: {{ message.error }}</div>
            </div>
          </div>
        </div>

        <!-- Streaming Message -->
        <div
          v-if="chatStore.isGenerating && chatStore.streamingMessageId"
          class="message-wrapper assistant-message streaming"
        >
          <div class="message-content">
            <div class="message-header">
              <div class="message-avatar">
                <Bot :size="16" />
              </div>
              <div class="message-role">Assistant</div>
              <div class="message-time">Now</div>
            </div>
            <div class="message-body">
              <div v-if="!chatStore.streamingContent" class="typing-indicator">
                <div class="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
              <div v-else class="message-text">{{ chatStore.streamingContent }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Chat Input -->
    <div class="chat-input-container">
      <div class="chat-input-wrapper">
        <div class="input-group">
          <textarea
            ref="textareaRef"
            v-model="inputMessage"
            @keydown="handleKeydown"
            @input="handleInput"
            placeholder="Type your message..."
            class="message-input"
            :disabled="chatStore.isGenerating"
            rows="1"
          />
          <button
            @click="handleSend"
            class="send-button"
            :disabled="!inputMessage.trim() || chatStore.isGenerating"
          >
            <Send v-if="!chatStore.isGenerating" :size="18" />
            <Square v-else :size="18" />
          </button>
        </div>
        <div class="input-footer">
          <span class="input-hint">Press Enter to send, Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { MessageSquare, User, Bot, Settings, Send, Square } from 'lucide-vue-next'
import { useChatStore } from '@/stores/chat'
import { useToast } from '@/composables/useToast'
import type { Message } from '@/types/chat'

const props = defineProps<{
  sessionId?: string
}>()

const emit = defineEmits<{
  'toggle-sidebar': []
}>()

// Store
const chatStore = useChatStore()
const { showToast } = useToast()

// Refs
const messagesContainer = ref<HTMLElement>()
const textareaRef = ref<HTMLTextAreaElement>()
const inputMessage = ref('')

// Computed
const currentMessages = computed(() => {
  return chatStore.currentMessages || []
})

// Methods
const handleSend = async () => {
  const content = inputMessage.value.trim()
  console.log('=== handleSend START ===')
  console.log('Content:', content)
  console.log('window.api exists:', !!window.api)
  console.log('window.api.db exists:', !!window.api?.db)
  console.log('window.api keys:', Object.keys(window.api || {}))
  console.log('chatStore.isGenerating:', chatStore.isGenerating)
  console.log('chatStore.isInitialized:', chatStore.isInitialized)

  if (!content || chatStore.isGenerating) {
    console.log('Aborting send - no content or currently generating')
    return
  }

  try {
    // Clear input immediately
    inputMessage.value = ''

    // Auto-resize textarea
    if (textareaRef.value) {
      textareaRef.value.style.height = 'auto'
    }

    // Ensure chat store is initialized
    if (!chatStore.isInitialized) {
      console.log('Chat store not initialized, initializing now...')
      await chatStore.initialize()
    }

    // Send message through store
    console.log('Sending message through store:', content)
    await chatStore.sendMessage(content)

    // Scroll to bottom
    scrollToBottom()
    console.log('Message sent successfully')
  } catch (error) {
    console.error('Failed to send message:', error)
    // Restore input if there was an error
    inputMessage.value = content
    showToast('发送消息失败：' + error.message, 'error')
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSend()
  }
}

const handleInput = () => {
  // Auto-resize textarea
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
    textareaRef.value.style.height = textareaRef.value.scrollHeight + 'px'
  }
}

const formatTime = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - d.getTime()

  if (diff < 60000) return 'Just now' // Less than 1 minute
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago` // Less than 1 hour
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago` // Less than 1 day

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// Watch for new messages and scroll to bottom
watch(
  () => chatStore.currentMessages?.length,
  () => {
    scrollToBottom()
  }
)

// Watch for streaming content and scroll to bottom
watch(
  () => chatStore.streamingContent,
  () => {
    scrollToBottom()
  }
)

// Wait for API to be ready
const waitForAPI = (): Promise<void> => {
  return new Promise(resolve => {
    if (window.api?.db) {
      console.log('API already available')
      resolve()
    } else {
      console.log('Waiting for API ready event...')
      window.addEventListener(
        'api-ready',
        () => {
          console.log('API ready event received!')
          resolve()
        },
        { once: true }
      )
    }
  })
}

// Lifecycle
onMounted(async () => {
  // Wait for API to be ready
  await waitForAPI()

  // IMMEDIATE API CHECK
  console.log('=== ONMOUNTED API CHECK (after ready) ===')
  console.log('window.api exists:', !!window.api)
  console.log('window.api.db exists:', !!window.api?.db)
  console.log('window.electronAPI exists:', !!(window as any).electronAPI)
  console.log('All window properties:', Object.keys(window))

  // Try to access API directly
  try {
    if (window.api?.db) {
      console.log('API test: getAllChats exists:', typeof window.api.db.getAllChats)
    } else {
      console.error('window.api.db is undefined!')
    }
  } catch (error) {
    console.error('API access error:', error)
  }

  // Initialize the chat store if needed
  if (!chatStore.isInitialized) {
    await chatStore.initialize()
  }

  // Scroll to bottom on mount
  scrollToBottom()

  // Focus input
  if (textareaRef.value) {
    textareaRef.value.focus()
  }
})

onUnmounted(() => {
  // Cleanup if needed
})
</script>

<style scoped>
.chat-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
}

.chat-messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  scrollbar-width: thin;
}

.chat-messages-container::-webkit-scrollbar {
  width: 6px;
}

.chat-messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages-container::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: hsl(var(--muted-foreground));
}

.empty-state-icon {
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  color: hsl(var(--foreground));
}

.empty-state p {
  margin: 0;
  font-size: 0.875rem;
}

.message-wrapper {
  margin-bottom: 1.5rem;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-content {
  max-width: 800px;
  margin: 0 auto;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.message-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: hsl(var(--muted));
}

.user-message .message-avatar {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}

.assistant-message .message-avatar {
  background: hsl(var(--secondary));
  color: hsl(var(--secondary-foreground));
}

.system-message .message-avatar {
  background: hsl(var(--warning));
  color: hsl(var(--warning-foreground));
}

.message-role {
  font-weight: 600;
  color: hsl(var(--foreground));
}

.message-time {
  margin-left: auto;
  color: hsl(var(--muted-foreground));
  font-size: 0.75rem;
}

.message-body {
  background: hsl(var(--muted));
  border-radius: 0.75rem;
  padding: 1rem;
  word-wrap: break-word;
}

.user-message .message-body {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  margin-left: 2rem;
}

.assistant-message .message-body {
  background: hsl(var(--muted));
  border: 1px solid hsl(var(--border));
}

.system-message .message-body {
  background: hsl(var(--warning));
  color: hsl(var(--warning-foreground));
  font-style: italic;
}

.message-text {
  line-height: 1.6;
  white-space: pre-wrap;
}

.message-error {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: hsl(var(--destructive));
  color: hsl(var(--destructive-foreground));
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.typing-dots {
  display: flex;
  gap: 0.25rem;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.4;
  animation: typing 1.4s infinite ease-in-out both;
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
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.streaming {
  opacity: 0.9;
}

.streaming .message-text {
  position: relative;
}

.streaming .message-text::after {
  content: '|';
  animation: blink 1s infinite;
  font-weight: 100;
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

.chat-input-container {
  border-top: 1px solid hsl(var(--border));
  background: hsl(var(--background));
  padding: 1rem;
}

.chat-input-wrapper {
  max-width: 800px;
  margin: 0 auto;
}

.input-group {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  background: hsl(var(--muted));
  border: 1px solid hsl(var(--border));
  border-radius: 0.75rem;
  padding: 0.75rem;
}

.input-group:focus-within {
  border-color: hsl(var(--ring));
  box-shadow: 0 0 0 3px hsl(var(--ring) / 0.1);
}

.message-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: hsl(var(--foreground));
  font-size: 1rem;
  line-height: 1.5;
  resize: none;
  min-height: 24px;
  max-height: 120px;
}

.message-input::placeholder {
  color: hsl(var(--muted-foreground));
}

.message-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.send-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 0.5rem;
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  cursor: pointer;
  transition: all 0.2s ease;
}

.send-button:hover:not(:disabled) {
  background: hsl(var(--primary) / 0.9);
  transform: translateY(-1px);
}

.send-button:disabled {
  background: hsl(var(--muted-foreground));
  cursor: not-allowed;
  transform: none;
}

.input-footer {
  display: flex;
  justify-content: center;
  margin-top: 0.5rem;
}

.input-hint {
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
}

/* Responsive design */
@media (max-width: 768px) {
  .chat-messages-container {
    padding: 0.75rem;
  }

  .message-content {
    max-width: 100%;
  }

  .user-message .message-body {
    margin-left: 1rem;
  }
}
</style>
