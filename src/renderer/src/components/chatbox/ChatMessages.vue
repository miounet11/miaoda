<template>
  <div class="chat-messages" ref="messagesContainer">
    <div v-if="messages.length === 0" class="empty-state">
      <div class="empty-icon">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle
            cx="24"
            cy="24"
            r="22"
            stroke="currentColor"
            stroke-width="2"
            stroke-dasharray="4 4"
          />
          <path
            d="M16 20C16 20 18 16 24 16C30 16 32 20 32 20"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
          <circle cx="18" cy="26" r="2" fill="currentColor" />
          <circle cx="30" cy="26" r="2" fill="currentColor" />
        </svg>
      </div>
      <h3 class="empty-title">Start a new conversation</h3>
      <p class="empty-text">Ask me anything or choose from the suggestions below</p>
      <div class="suggestions">
        <button
          v-for="suggestion in suggestions"
          :key="suggestion"
          @click="$emit('send', suggestion)"
          class="suggestion-chip"
        >
          {{ suggestion }}
        </button>
      </div>
    </div>
    <div v-else class="messages-list">
      <ChatMessage v-for="message in messages" :key="message.id" :message="message" />
      <div v-if="isTyping" class="typing-indicator">
        <div class="typing-avatar">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 2L12.5 7L18 8L14 12L15 18L10 15L5 18L6 12L2 8L7.5 7L10 2Z"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import ChatMessage from './ChatMessage.vue'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

const props = defineProps<{
  messages: Message[]
  isTyping?: boolean
}>()

const emit = defineEmits<{
  send: [message: string]
}>()

const messagesContainer = ref<HTMLElement>()

const suggestions = [
  'Explain quantum computing',
  'Write a Python function',
  'Help me debug my code',
  'Create a project plan'
]

// Auto-scroll to bottom when new messages arrive
watch(
  () => props.messages.length,
  () => {
    nextTick(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    })
  }
)
</script>

<style scoped>
.chat-messages {
  flex: 1;
  overflow-y: auto;
  background: var(--chatbox-bg-primary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 32px;
  text-align: center;
}

.empty-icon {
  color: var(--chatbox-text-tertiary);
  margin-bottom: 16px;
}

.empty-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--chatbox-text-primary);
  margin-bottom: 8px;
}

.empty-text {
  font-size: 14px;
  color: var(--chatbox-text-secondary);
  margin-bottom: 24px;
}

.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  max-width: 500px;
}

.suggestion-chip {
  padding: 8px 16px;
  background: var(--chatbox-bg-secondary);
  color: var(--chatbox-text-primary);
  border: 1px solid var(--chatbox-border);
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.suggestion-chip:hover {
  background: var(--chatbox-bg-tertiary);
  border-color: var(--chatbox-accent);
}

.messages-list {
  display: flex;
  flex-direction: column;
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--chatbox-bg-secondary);
}

.typing-avatar {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: var(--chatbox-bg-tertiary);
  color: var(--chatbox-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.typing-dots {
  display: flex;
  gap: 4px;
}

.typing-dots span {
  width: 8px;
  height: 8px;
  background: var(--chatbox-text-tertiary);
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: var(--chatbox-bg-primary);
}

::-webkit-scrollbar-thumb {
  background: var(--chatbox-border);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--chatbox-text-tertiary);
}
</style>
