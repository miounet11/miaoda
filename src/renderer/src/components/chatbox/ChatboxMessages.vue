<template>
  <div class="messages-container" ref="messagesContainer">
    <!-- Messages List -->
    <div class="messages-list">
      <div 
        v-for="message in messages" 
        :key="message.id"
        class="message-wrapper"
        :class="[`message-${message.role}`]"
      >
        <div class="message-avatar">
          <div v-if="message.role === 'user'" class="avatar-user">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="3" stroke="currentColor" stroke-width="1.5"/>
              <path d="M6 20c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
          <div v-else class="avatar-ai">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="6" y="6" width="12" height="12" rx="3" stroke="currentColor" stroke-width="1.5"/>
              <circle cx="9" cy="10" r="1" fill="currentColor"/>
              <circle cx="15" cy="10" r="1" fill="currentColor"/>
              <path d="M9 14h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
        </div>
        
        <div class="message-content">
          <div class="message-header">
            <span class="message-role">{{ message.role === 'user' ? 'You' : 'Assistant' }}</span>
            <span class="message-time">{{ formatTime(message.timestamp) }}</span>
          </div>
          
          <div class="message-body">
            <!-- Text Content -->
            <div v-if="message.content" class="message-text" v-html="renderMarkdown(message.content)"></div>
            
            <!-- Loading State -->
            <div v-if="message.pending || message.isLoading" class="message-loading">
              <span class="loading-dot"></span>
              <span class="loading-dot"></span>
              <span class="loading-dot"></span>
            </div>
            
            <!-- Error State -->
            <div v-if="message.error" class="message-error">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
                <path d="M8 5v3m0 2v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <span>{{ message.error }}</span>
            </div>
          </div>
          
          <!-- Message Actions -->
          <div class="message-actions" v-if="!message.pending && !message.isLoading && message.role === 'assistant'">
            <button class="action-btn" @click="copyMessage(message.content)" title="Copy">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="4" y="4" width="8" height="8" rx="1" stroke="currentColor" stroke-width="1.5"/>
                <path d="M10 4V3a1 1 0 00-1-1H3a1 1 0 00-1 1v6a1 1 0 001 1h1" stroke="currentColor" stroke-width="1.5"/>
              </svg>
            </button>
            <button class="action-btn" @click="regenerateMessage(message)" title="Regenerate">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7a5 5 0 0110 0M12 7a5 5 0 01-10 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M12 4v3h-3M2 10v-3h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Scroll to Bottom Button -->
    <transition name="fade">
      <button 
        v-if="!isAtBottom"
        class="scroll-to-bottom"
        @click="scrollToBottom"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 14l-4-4M10 14l4-4M10 14V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  isLoading?: boolean
  error?: string
}

const props = defineProps<{
  messages: Message[]
}>()

const emit = defineEmits<{
  'regenerate': [message: Message]
}>()

const messagesContainer = ref<HTMLElement>()
const isAtBottom = ref(true)

// Format timestamp
const formatTime = (timestamp: Date) => {
  const date = new Date(timestamp)
  const hours = date.getHours()
  const minutes = date.getMinutes()
  return `${hours}:${minutes < 10 ? '0' : ''}${minutes}`
}

// Render markdown content
const renderMarkdown = (content: string) => {
  const html = marked(content, {
    breaks: true,
    gfm: true
  })
  return DOMPurify.sanitize(html as string)
}

// Copy message to clipboard
const copyMessage = async (content: string) => {
  try {
    await navigator.clipboard.writeText(content)
    // Show simple feedback
    const btn = event?.currentTarget as HTMLElement
    if (btn) {
      const originalTitle = btn.title
      btn.title = 'Copied!'
      btn.style.color = 'var(--chatbox-accent)'
      setTimeout(() => {
        btn.title = originalTitle
        btn.style.color = ''
      }, 2000)
    }
  } catch (err) {
    console.error('Failed to copy:', err)
    // Try fallback method
    const textarea = document.createElement('textarea')
    textarea.value = content
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
    } catch (e) {
      console.error('Fallback copy failed:', e)
    }
    document.body.removeChild(textarea)
  }
}

// Regenerate message
const regenerateMessage = (message: Message) => {
  emit('regenerate', message)
}

// Scroll to bottom
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// Check if scrolled to bottom
const checkScrollPosition = () => {
  if (messagesContainer.value) {
    const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value
    isAtBottom.value = scrollHeight - scrollTop - clientHeight < 50
  }
}

// Watch for new messages
watch(() => props.messages.length, () => {
  nextTick(() => {
    if (isAtBottom.value) {
      scrollToBottom()
    }
  })
})

onMounted(() => {
  scrollToBottom()
  messagesContainer.value?.addEventListener('scroll', checkScrollPosition)
})

onUnmounted(() => {
  messagesContainer.value?.removeEventListener('scroll', checkScrollPosition)
})
</script>

<style scoped>
.messages-container {
  flex: 1;
  overflow-y: auto;
  position: relative;
}

.messages-list {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

/* Message Wrapper */
.message-wrapper {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  animation: message-appear 0.3s ease-out;
}

@keyframes message-appear {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Avatars */
.message-avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
}

.avatar-user,
.avatar-ai {
  width: 36px;
  height: 36px;
  border-radius: var(--chatbox-radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-user {
  background: var(--chatbox-accent-light);
  color: var(--chatbox-accent);
}

.avatar-ai {
  background: var(--chatbox-bg-secondary);
  color: var(--chatbox-text-secondary);
}

/* Message Content */
.message-content {
  flex: 1;
  min-width: 0;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.message-role {
  font-weight: 600;
  font-size: 14px;
  color: var(--chatbox-text-primary);
}

.message-time {
  font-size: 12px;
  color: var(--chatbox-text-tertiary);
}

.message-body {
  position: relative;
}

.message-text {
  font-size: 15px;
  line-height: 1.6;
  color: var(--chatbox-text-primary);
}

/* Markdown Styles */
.message-text :deep(p) {
  margin: 0 0 12px 0;
}

.message-text :deep(p:last-child) {
  margin-bottom: 0;
}

.message-text :deep(code) {
  background: var(--chatbox-bg-secondary);
  padding: 2px 6px;
  border-radius: var(--chatbox-radius-sm);
  font-size: 13px;
}

.message-text :deep(pre) {
  background: var(--chatbox-bg-secondary);
  padding: 12px;
  border-radius: var(--chatbox-radius-lg);
  overflow-x: auto;
  margin: 12px 0;
}

.message-text :deep(ul),
.message-text :deep(ol) {
  margin: 12px 0;
  padding-left: 24px;
}

/* Loading State */
.message-loading {
  display: flex;
  gap: 4px;
  padding: 8px 0;
}

.loading-dot {
  width: 8px;
  height: 8px;
  background: var(--chatbox-text-secondary);
  border-radius: 50%;
  animation: loading-bounce 1.4s ease-in-out infinite;
}

.loading-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes loading-bounce {
  0%, 80%, 100% {
    transform: scale(1);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}

/* Error State */
.message-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--chatbox-error);
  background-opacity: 0.1;
  border-radius: var(--chatbox-radius-md);
  color: var(--chatbox-error);
  font-size: 14px;
}

/* Message Actions */
.message-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  opacity: 0;
  transition: opacity var(--chatbox-transition-fast);
}

.message-wrapper:hover .message-actions {
  opacity: 1;
}

.action-btn {
  width: 28px;
  height: 28px;
  border: 1px solid var(--chatbox-border);
  background: var(--chatbox-bg-primary);
  color: var(--chatbox-text-secondary);
  border-radius: var(--chatbox-radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--chatbox-transition-fast);
}

.action-btn:hover {
  background: var(--chatbox-bg-secondary);
  color: var(--chatbox-text-primary);
  border-color: var(--chatbox-accent);
}

/* Scroll to Bottom */
.scroll-to-bottom {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  background: var(--chatbox-bg-primary);
  border: 1px solid var(--chatbox-border);
  border-radius: var(--chatbox-radius-full);
  box-shadow: var(--chatbox-shadow-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--chatbox-transition-base);
}

.scroll-to-bottom:hover {
  background: var(--chatbox-accent);
  color: white;
  border-color: var(--chatbox-accent);
  transform: translateY(-2px);
}

/* Fade Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>