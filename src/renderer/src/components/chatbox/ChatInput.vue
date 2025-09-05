<template>
  <div class="chat-input">
    <div class="input-toolbar">
      <button class="toolbar-button" title="Attach file">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M14 8.5V13.5C14 14.3 13.3 15 12.5 15H3.5C2.7 15 2 14.3 2 13.5V8.5"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
          <path
            d="M8 2V10M8 2L5 5M8 2L11 5"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>
    <div class="input-container">
      <textarea
        ref="textareaRef"
        v-model="message"
        @keydown="handleKeyDown"
        @input="adjustHeight"
        placeholder="Message ChatBox..."
        class="input-field"
        rows="1"
      />
      <div class="input-actions">
        <span class="char-count">{{ message.length }}</span>
        <button @click="handleSend" class="send-button" :disabled="!message.trim()">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M2 8L14 2L10 14L8 8L2 8Z"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

const emit = defineEmits<{
  send: [message: string]
}>()

const message = ref('')
const textareaRef = ref<HTMLTextAreaElement>()

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

const handleSend = () => {
  if (message.value.trim()) {
    emit('send', message.value)
    message.value = ''
    nextTick(() => {
      if (textareaRef.value) {
        textareaRef.value.style.height = 'auto'
      }
    })
  }
}

const adjustHeight = () => {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
    const scrollHeight = textareaRef.value.scrollHeight
    textareaRef.value.style.height = Math.min(scrollHeight, 120) + 'px'
  }
}
</script>

<style scoped>
.chat-input {
  padding: 12px 16px;
  background: var(--chatbox-bg-primary);
  border-top: 1px solid var(--chatbox-border);
}

.input-toolbar {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

.toolbar-button {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--chatbox-text-secondary);
  border: 1px solid var(--chatbox-border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-button:hover {
  background: var(--chatbox-bg-secondary);
  color: var(--chatbox-text-primary);
}

.input-container {
  position: relative;
  background: var(--chatbox-bg-secondary);
  border: 1px solid var(--chatbox-border);
  border-radius: 8px;
  transition: border-color 0.2s;
}

.input-container:focus-within {
  border-color: var(--chatbox-accent);
}

.input-field {
  width: 100%;
  padding: 10px 12px;
  padding-right: 80px;
  background: transparent;
  color: var(--chatbox-text-primary);
  border: none;
  resize: none;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  max-height: 120px;
  overflow-y: auto;
}

.input-field:focus {
  outline: none;
}

.input-field::placeholder {
  color: var(--chatbox-text-tertiary);
}

.input-actions {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.char-count {
  font-size: 11px;
  color: var(--chatbox-text-tertiary);
}

.send-button {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--chatbox-accent);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.send-button:hover:not(:disabled) {
  transform: scale(1.05);
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--chatbox-border);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--chatbox-text-tertiary);
}
</style>
