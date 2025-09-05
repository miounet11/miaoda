<template>
  <div class="chatbox-input-container">
    <!-- Tool Bar -->
    <div class="input-toolbar">
      <div class="toolbar-left">
        <!-- Model Selector -->
        <button class="toolbar-btn model-selector" @click="showModelSelector">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="3" y="3" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/>
            <circle cx="8" cy="8" r="2" fill="currentColor"/>
          </svg>
          <span>{{ currentModel }}</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 5l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
        
        <div class="toolbar-divider"></div>
        
        <!-- Tool Buttons -->
        <button class="toolbar-btn" @click="attachFile" title="Attach File">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M14 8v5a1 1 0 01-1 1H3a1 1 0 01-1-1V8M8 2v8M8 2L5 5M8 2l3 3" 
                  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        
        <button class="toolbar-btn" @click="insertImage" title="Insert Image">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" stroke-width="1.5"/>
            <circle cx="6" cy="7" r="1.5" fill="currentColor"/>
            <path d="M2 10l3-3 2 2 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
        
        <button class="toolbar-btn" @click="openImageGeneration" title="Generate Image">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2l1.5 3L13 6l-2.5 2.5L10 12l-2-1.5L6 12l-.5-3.5L3 6l3.5-1L8 2z" fill="currentColor"/>
          </svg>
        </button>
        
        <button class="toolbar-btn" @click="insertCode" title="Insert Code">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M5 6L2 8l3 2M11 6l3 2-3 2M9 4l-2 8" 
                  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        
        <button class="toolbar-btn" @click="clearConversation" title="Clear">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M5 4V2a1 1 0 011-1h4a1 1 0 011 1v2M6 7v4M10 7v4" 
                  stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      
      <div class="toolbar-right">
        <!-- Token Counter -->
        <span class="token-counter" v-if="tokenCount > 0">
          {{ tokenCount }} tokens
        </span>
        
        <!-- Chat Settings Button -->
        <button class="toolbar-btn" @click="openChatSettings" title="Chat Settings">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.5"/>
            <path d="M8 2v2m0 8v2m6-6h-2M4 8H2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
        
        <!-- Settings Button -->
        <button class="toolbar-btn" @click="openSettings" title="Settings">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8.5 5.5L11 3m0 0l2 2m-2-2v6m-6 2.5L3 14m0 0l-2-2m2 2V8" 
                  stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Input Area -->
    <div class="input-wrapper">
      <!-- Attachments Preview -->
      <div v-if="attachments.length > 0" class="attachments-preview">
        <div 
          v-for="(file, index) in attachments" 
          :key="index"
          class="attachment-item"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M8 1H3a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V5L8 1z" 
                  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>{{ file.name }}</span>
          <button @click="removeAttachment(index)" class="remove-attachment">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Text Input -->
      <textarea
        ref="textInput"
        v-model="inputText"
        class="input-field"
        :placeholder="placeholder"
        @keydown="handleKeyDown"
        @input="handleInput"
        :rows="inputRows"
      ></textarea>
      
      <!-- Send Button -->
      <button 
        class="send-button"
        :class="{ 'disabled': !canSend }"
        @click="sendMessage"
        :disabled="!canSend"
      >
        <svg v-if="isLoading" class="loading-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2" fill="none" opacity="0.2"/>
          <path d="M10 2a8 8 0 018 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <svg v-else width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M18 10L4 17V3l14 7z" fill="currentColor"/>
        </svg>
      </button>
    </div>
    
    <!-- Character/Token Limit Indicator -->
    <div class="input-footer">
      <div class="input-hints">
        <span class="hint">Press Enter to send, Shift+Enter for new line</span>
      </div>
      <div class="input-stats">
        <span v-if="characterCount > 0" class="char-count">
          {{ characterCount }}/{{ maxCharacters }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useChatStore } from '../../stores/chat'
import { useChatboxUIStore } from '../../stores/chatboxUI'
import { useRouter } from 'vue-router'

const emit = defineEmits<{
  'send': [message: string, attachments?: File[]]
  'clear': []
  'openImageGeneration': []
  'openChatSettings': []
}>()

const router = useRouter()
const chatStore = useChatStore()
const chatboxUIStore = useChatboxUIStore()

// State
const textInput = ref<HTMLTextAreaElement>()
const inputText = ref('')
const attachments = ref<File[]>([])
const inputRows = ref(3)
const isLoading = computed(() => chatStore.isLoading)
const tokenCount = ref(0)
const maxCharacters = 10000

// Computed
const currentModel = computed(() => {
  // 从 chatStore 获取当前模型
  const model = chatStore.currentModel
  if (model === 'miaochat') {
    return 'MiaoChat'
  }
  return model || 'MiaoChat'
})

const placeholder = computed(() => {
  if (isLoading.value) {
    return 'Waiting for response...'
  }
  return 'Type your message here...'
})

const characterCount = computed(() => inputText.value.length)

const canSend = computed(() => {
  return inputText.value.trim().length > 0 && !isLoading.value
})

// Methods
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    if (canSend.value) {
      sendMessage()
    }
  }
}

const handleInput = () => {
  // Only auto-resize based on actual line breaks (Enter key)
  if (textInput.value) {
    // Count actual line breaks in the text
    const lines = inputText.value.split('\n').length
    const minRows = 3
    const maxRows = 10
    
    // Set rows based on actual line breaks only
    inputRows.value = Math.min(Math.max(lines, minRows), maxRows)
  }
  
  // Update token count (simplified)
  tokenCount.value = Math.ceil(inputText.value.length / 4)
}

const sendMessage = () => {
  if (!canSend.value) return
  
  const message = inputText.value.trim()
  if (message) {
    emit('send', message, attachments.value)
    inputText.value = ''
    attachments.value = []
    inputRows.value = 3
    tokenCount.value = 0
  }
}

const attachFile = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = true
  input.onchange = (e) => {
    const files = (e.target as HTMLInputElement).files
    if (files) {
      attachments.value.push(...Array.from(files))
    }
  }
  input.click()
}

const insertImage = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = (e) => {
    const files = (e.target as HTMLInputElement).files
    if (files && files[0]) {
      attachments.value.push(files[0])
    }
  }
  input.click()
}

const insertCode = () => {
  const code = '```\n// Your code here\n```'
  inputText.value += code
  handleInput()
}

const clearConversation = () => {
  // 使用中文提示
  const confirmed = window.confirm('确定要清除当前对话的所有消息吗？')
  if (confirmed) {
    console.log('Clearing conversation...')
    emit('clear')
  }
}

const removeAttachment = (index: number) => {
  attachments.value.splice(index, 1)
}

const showModelSelector = () => {
  chatboxUIStore.setShowModelSelector(true)
}

const openImageGeneration = () => {
  emit('openImageGeneration')
}

const openChatSettings = () => {
  emit('openChatSettings')
}

const openSettings = () => {
  router.push('/settings')
}

// Focus input on mount
onMounted(() => {
  textInput.value?.focus()
})

// Watch for external focus requests
watch(() => chatboxUIStore.shouldFocusInput, (shouldFocus) => {
  if (shouldFocus) {
    textInput.value?.focus()
    chatboxUIStore.setShouldFocusInput(false)
  }
})
</script>

<style scoped>
.chatbox-input-container {
  border-top: 1px solid var(--chatbox-border);
  background: var(--chatbox-bg-primary);
}

/* Tool Bar */
.input-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--chatbox-border);
  background: var(--chatbox-bg-secondary);
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-btn {
  height: 32px;
  padding: 0 10px;
  border: none;
  background: transparent;
  color: var(--chatbox-text-secondary);
  font-size: 13px;
  cursor: pointer;
  border-radius: var(--chatbox-radius-md);
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all var(--chatbox-transition-fast);
}

.toolbar-btn:hover {
  background: var(--chatbox-bg-hover);
  color: var(--chatbox-text-primary);
}

.model-selector {
  padding: 0 12px;
  background: var(--chatbox-bg-primary);
  border: 1px solid var(--chatbox-border);
  color: var(--chatbox-text-primary);
  font-weight: 500;
}

.model-selector:hover {
  border-color: var(--chatbox-accent);
  background: var(--chatbox-accent-light);
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: var(--chatbox-border);
}

.token-counter {
  font-size: 12px;
  color: var(--chatbox-text-tertiary);
  padding: 0 8px;
}

/* Input Wrapper */
.input-wrapper {
  position: relative;
  padding: 12px;
  padding-right: 60px;
}

.attachments-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: var(--chatbox-bg-secondary);
  border: 1px solid var(--chatbox-border);
  border-radius: var(--chatbox-radius-md);
  font-size: 12px;
  color: var(--chatbox-text-secondary);
}

.remove-attachment {
  width: 16px;
  height: 16px;
  border: none;
  background: transparent;
  color: var(--chatbox-text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--chatbox-radius-sm);
  transition: all var(--chatbox-transition-fast);
}

.remove-attachment:hover {
  background: var(--chatbox-error);
  color: white;
}

/* Text Input */
.input-field {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--chatbox-border);
  border-radius: var(--chatbox-radius-lg);
  background: var(--chatbox-bg-primary);
  color: var(--chatbox-text-primary);
  font-size: 15px;
  line-height: 24px;
  resize: none;
  outline: none;
  transition: all var(--chatbox-transition-fast);
}

.input-field:focus {
  border-color: var(--chatbox-accent);
  box-shadow: 0 0 0 3px var(--chatbox-accent-light);
}

.input-field::placeholder {
  color: var(--chatbox-text-tertiary);
}

/* Send Button */
.send-button {
  position: absolute;
  right: 20px;
  bottom: 20px;
  width: 36px;
  height: 36px;
  border: none;
  background: var(--chatbox-accent);
  color: white;
  border-radius: var(--chatbox-radius-full);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--chatbox-transition-base);
}

.send-button:hover:not(.disabled) {
  background: var(--chatbox-accent-dark);
  transform: scale(1.05);
}

.send-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Input Footer */
.input-footer {
  display: flex;
  justify-content: space-between;
  padding: 4px 12px 8px 12px;
  font-size: 11px;
  color: var(--chatbox-text-tertiary);
}

.hint {
  opacity: 0.7;
}

.char-count {
  font-variant-numeric: tabular-nums;
}
</style>