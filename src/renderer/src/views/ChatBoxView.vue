<template>
  <div class="chatbox-chat-view">
    <!-- Messages Container -->
    <div class="chatbox-messages-container" ref="messagesContainer">
      <!-- Welcome Screen (when no messages) -->
      <div v-if="!currentChat || messages.length === 0" class="chatbox-welcome">
        <div class="chatbox-welcome-content">
          <div class="chatbox-welcome-icon">
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="8"
                y="8"
                width="32"
                height="32"
                rx="8"
                stroke="currentColor"
                stroke-width="2"
                opacity="0.5"
              />
              <circle cx="18" cy="18" r="3" fill="currentColor" />
              <circle cx="30" cy="18" r="3" fill="currentColor" />
              <path
                d="M16 30c0-2.761 2.239-5 5-5h6c2.761 0 5 2.239 5 5"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </div>
          <h1 class="chatbox-welcome-title">Welcome to MiaoDa Chat</h1>
          <p class="chatbox-welcome-subtitle">Start a conversation to begin</p>

          <!-- Quick Actions -->
          <div class="chatbox-quick-actions">
            <button @click="startNewChat" class="chatbox-quick-action">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 4v12M4 10h12"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
              <span>New Chat</span>
            </button>
            <button @click="openSettings" class="chatbox-quick-action">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="10" cy="10" r="2" stroke="currentColor" stroke-width="1.5" />
                <path
                  d="M10 3v1.5M10 15.5V17M17 10h-1.5M4.5 10H3M15.5 15.5l-1-1M5.5 5.5l-1-1M15.5 4.5l-1 1M5.5 14.5l-1 1"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Messages List -->
      <div v-else class="chatbox-messages-list">
        <div v-for="message in messages" :key="message.id" class="chatbox-message-wrapper">
          <ChatMessage :message="message" />
        </div>

        <!-- Loading Indicator -->
        <div v-if="isGenerating" class="chatbox-message-loading">
          <div class="chatbox-loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="chatbox-input-area">
      <div class="chatbox-input-container">
        <!-- Attachments Preview -->
        <div v-if="attachments.length > 0" class="chatbox-attachments-preview">
          <div v-for="(file, index) in attachments" :key="index" class="chatbox-attachment-item">
            <span class="chatbox-attachment-name">{{ file.name }}</span>
            <button @click="removeAttachment(index)" class="chatbox-attachment-remove">
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 4L4 10M4 4l6 6"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Input Row -->
        <div class="chatbox-input-row">
          <!-- Attachment Button -->
          <button @click="handleAttachment" class="chatbox-input-button" title="Attach file">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10.5 3.5L5 9c-1.4 1.4-1.4 3.6 0 5 1.4 1.4 3.6 1.4 5 0l6-6c.9-.9.9-2.4 0-3.4-.9-.9-2.4-.9-3.4 0L6.5 10.7c-.3.3-.3.7 0 1 .3.3.7.3 1 0L13 6.2"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>

          <!-- Textarea -->
          <textarea
            v-model="inputText"
            @keydown="handleKeyDown"
            @input="adjustTextareaHeight"
            ref="textareaRef"
            class="chatbox-input-textarea"
            placeholder="Send a message..."
            :disabled="isGenerating"
            rows="1"
          ></textarea>

          <!-- Voice Input Button -->
          <button
            @click="toggleVoiceInput"
            class="chatbox-input-button"
            :class="{ 'chatbox-voice-active': isRecording }"
            title="Voice input"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="8"
                y="3"
                width="4"
                height="8"
                rx="2"
                stroke="currentColor"
                stroke-width="1.5"
              />
              <path
                d="M6 9c0 2.2 1.8 4 4 4s4-1.8 4-4M10 13v4M7 17h6"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          </button>

          <!-- Send Button -->
          <button
            @click="sendMessage"
            class="chatbox-send-button"
            :class="{
              'chatbox-send-enabled': canSend && !isGenerating,
              'chatbox-send-disabled': !canSend || isGenerating
            }"
            :disabled="!canSend || isGenerating"
          >
            <svg
              v-if="!isGenerating"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 10h10m0 0l-3.5-3.5M15 10l-3.5 3.5"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <svg
              v-else
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="6" y="6" width="8" height="8" rx="1" fill="currentColor" />
            </svg>
          </button>
        </div>

        <!-- Character Counter & Info -->
        <div class="chatbox-input-info">
          <span v-if="inputText.length > 0" class="chatbox-char-count">
            {{ inputText.length }} / 4000
          </span>
          <span class="chatbox-input-hint">
            {{
              isGenerating
                ? 'Generating response...'
                : 'Press Enter to send, Shift+Enter for new line'
            }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import { useToast } from '@/composables/useToast'
import ChatMessage from '@/components/chatbox/ChatMessage.vue'

const router = useRouter()
const chatStore = useChatStore()
const { showToast } = useToast()

// Refs
const messagesContainer = ref<HTMLElement>()
const textareaRef = ref<HTMLTextAreaElement>()

// State
const inputText = ref('')
const attachments = ref<File[]>([])
const isRecording = ref(false)
const isGenerating = ref(false)

// Computed
const currentChat = computed(() => chatStore.currentChat)
const messages = computed(() => chatStore.currentMessages)
const canSend = computed(() => {
  return inputText.value.trim().length > 0 || attachments.value.length > 0
})

// Methods
const startNewChat = () => {
  chatStore.createNewChat()
}

const openSettings = () => {
  router.push('/settings')
}

const sendMessage = async () => {
  if (!canSend.value || isGenerating.value) return

  const content = inputText.value.trim()
  if (!content && attachments.value.length === 0) return

  // Clear input immediately
  inputText.value = ''
  attachments.value = []
  isGenerating.value = true

  // Reset textarea height
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
  }

  try {
    // Add user message
    await chatStore.sendMessage(content)

    // Scroll to bottom
    await nextTick()
    scrollToBottom()

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      chatStore.addMessage({
        role: 'assistant',
        content:
          'This is a simulated response. The actual implementation will connect to the LLM backend.'
      })
      isGenerating.value = false
      nextTick(() => scrollToBottom())
    }, 1500)
  } catch (error) {
    console.error('Failed to send message:', error)
    isGenerating.value = false
  }
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

const adjustTextareaHeight = () => {
  if (!textareaRef.value) return

  textareaRef.value.style.height = 'auto'
  const scrollHeight = textareaRef.value.scrollHeight
  const maxHeight = 200

  if (scrollHeight > maxHeight) {
    textareaRef.value.style.height = `${maxHeight}px`
    textareaRef.value.style.overflowY = 'auto'
  } else {
    textareaRef.value.style.height = `${scrollHeight}px`
    textareaRef.value.style.overflowY = 'hidden'
  }
}

const handleAttachment = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = true
  input.accept = '*/*'

  input.onchange = (event: Event) => {
    const files = (event.target as HTMLInputElement).files
    if (files) {
      attachments.value = [...attachments.value, ...Array.from(files)]
    }
  }

  input.click()
}

const removeAttachment = (index: number) => {
  attachments.value.splice(index, 1)
}

const toggleVoiceInput = async () => {
  try {
    if (!isRecording.value) {
      // Start recording
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        // Here you would typically use MediaRecorder API
        isRecording.value = true
        showToast('语音录制已开始', 'success')
        
        // Auto-stop after 60 seconds
        setTimeout(() => {
          if (isRecording.value) {
            stopRecording()
          }
        }, 60000)
      } else {
        showToast('您的浏览器不支持语音录制', 'error')
      }
    } else {
      // Stop recording
      stopRecording()
    }
  } catch (error) {
    console.error('Voice recording error:', error)
    showToast('语音录制权限被拒绝', 'error')
    isRecording.value = false
  }
}

const stopRecording = () => {
  isRecording.value = false
  showToast('语音录制已停止', 'info')
  // Here you would process the recorded audio
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// Lifecycle
onMounted(() => {
  // Focus textarea on mount
  textareaRef.value?.focus()

  // Scroll to bottom if there are messages
  if (messages.value.length > 0) {
    nextTick(() => scrollToBottom())
  }
})

// Watch for new messages
watch(
  messages,
  () => {
    nextTick(() => scrollToBottom())
  },
  { deep: true }
)
</script>

<style>
@import './chatbox-view.css';
</style>
