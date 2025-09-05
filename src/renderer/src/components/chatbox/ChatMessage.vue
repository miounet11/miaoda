<template>
  <div :class="['chat-message', `message-${message.role}`]">
    <div class="message-avatar">
      <div v-if="message.role === 'user'" class="avatar-user">U</div>
      <div v-else class="avatar-assistant">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 2L12.5 7L18 8L14 12L15 18L10 15L5 18L6 12L2 8L7.5 7L10 2Z"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linejoin="round"
          />
        </svg>
      </div>
    </div>
    <div class="message-content">
      <div class="message-header">
        <span class="message-role">{{ message.role === 'user' ? 'You' : 'ChatBox' }}</span>
        <span class="message-time">{{ formatTime(message.timestamp) }}</span>
      </div>
      <div class="message-text" v-html="renderMarkdown(message.content)"></div>
      <div v-if="message.role === 'assistant'" class="message-actions">
        <button class="action-button" title="Copy">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="5" y="5" width="7" height="7" rx="1" stroke="currentColor" />
            <path
              d="M9 5V3C9 2.5 8.5 2 8 2H3C2.5 2 2 2.5 2 3V8C2 8.5 2.5 9 3 9H5"
              stroke="currentColor"
            />
          </svg>
        </button>
        <button class="action-button" title="Regenerate">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M12 7C12 9.8 9.8 12 7 12C5.5 12 4.2 11.3 3.3 10.2M2 7C2 4.2 4.2 2 7 2C8.5 2 9.8 2.7 10.7 3.8"
              stroke="currentColor"
              stroke-linecap="round"
            />
            <path
              d="M10 1V4H13M4 10V13H1"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

const props = defineProps<{
  message: Message
}>()

const formatTime = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  return new Date(date).toLocaleDateString()
}

const renderMarkdown = (text: string) => {
  // Simple markdown rendering (you'd want to use a proper markdown library)
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
}
</script>

<style scoped>
.chat-message {
  display: flex;
  gap: 12px;
  padding: 16px;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-user {
  background: transparent;
}

.message-assistant {
  background: var(--chatbox-bg-secondary);
}

.message-avatar {
  flex-shrink: 0;
}

.avatar-user,
.avatar-assistant {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.avatar-user {
  background: var(--chatbox-accent);
  color: white;
  font-size: 14px;
}

.avatar-assistant {
  background: var(--chatbox-bg-tertiary);
  color: var(--chatbox-text-secondary);
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
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

.message-text {
  color: var(--chatbox-text-primary);
  font-size: 14px;
  line-height: 1.6;
  word-wrap: break-word;
}

.message-text :deep(code) {
  padding: 2px 4px;
  background: var(--chatbox-bg-tertiary);
  border-radius: 3px;
  font-family: 'SF Mono', Monaco, 'Courier New', monospace;
  font-size: 13px;
}

.message-text :deep(strong) {
  font-weight: 600;
}

.message-actions {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}

.action-button {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--chatbox-text-tertiary);
  border: 1px solid var(--chatbox-border);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-button:hover {
  background: var(--chatbox-bg-tertiary);
  color: var(--chatbox-text-primary);
}
</style>
