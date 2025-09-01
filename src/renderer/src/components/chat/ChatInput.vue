<template>
  <div class="chat-input-container border-t bg-background/95 backdrop-blur">
    <div class="chat-input-wrapper max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <!-- Configuration Warning -->
      <div
        v-if="!isConfigured"
        class="config-warning mb-3 p-3 bg-warning/10 border border-warning/20 rounded-lg flex items-center gap-2"
      >
        <AlertCircle :size="16" class="text-warning flex-shrink-0" />
        <span class="text-sm">Please configure an LLM provider in settings to start chatting.</span>
        <button
          @click="$emit('open-settings')"
          class="ml-auto text-sm font-medium text-primary hover:underline"
         aria-label="按钮">
          Configure now →
        </button>
      </div>

      <!-- Enhanced Attachments Preview -->
      <AttachmentsPreview
        v-if="attachments.length > 0 || showAttachmentDropZone"
        :attachments="attachments"
        :show-drop-zone="showAttachmentDropZone && attachments.length === 0"
        :current-provider="currentProvider"
        @remove="removeAttachment"
        @retry="retryAttachment"
        @select-files="selectFiles"
        @image-preview="openImagePreview"
        @drop="handleAttachmentDrop"
      />

      <!-- Image Preview Modal -->
      <ImagePreviewModal
        :is-visible="showImagePreview"
        :image="selectedImage"
        @close="closeImagePreview"
      />

      <!-- Vision Capability Notification -->
      <div
        v-if="showVisionWarning"
        class="vision-warning mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-3"
      >
        <AlertTriangle
          :size="16"
          class="text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0"
        />
        <div class="flex-1">
          <p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            当前模型不支持图片分析
          </p>
          <p class="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
            要使用图片分析功能，请切换到支持视觉的模型，如 GPT-4o、Claude 3.5 Sonnet 或 Gemini 1.5
            Pro
          </p>
          <button
            @click="$emit('open-settings')"
            class="mt-2 text-xs text-yellow-700 dark:text-yellow-300 hover:text-yellow-800 dark:hover:text-yellow-200 underline"
           aria-label="按钮">
            切换模型 →
          </button>
        </div>
        <button
          @click="dismissVisionWarning"
          class="p-1 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded transition-colors"
         aria-label="按钮">
          <X :size="14" class="text-yellow-600 dark:text-yellow-400" />
        </button>
      </div>

      <!-- Input Container -->
      <div class="input-container relative">
        <div
          class="input-wrapper flex items-end gap-2 sm:gap-3 p-3 bg-muted/40 rounded-2xl border border-transparent focus-within:border-primary/30 focus-within:bg-background/60 focus-within:shadow-sm transition-all duration-200"
          :class="inputWrapperClasses"
        >
          <!-- Action Buttons -->
          <div class="input-actions flex gap-1 pb-0.5">
            <button
              @click="selectFiles"
              class="action-btn btn-interactive ripple p-2.5 hover:bg-background rounded-xl transition-all duration-200 group hover:scale-105 active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Attach files (images, documents)"
              :disabled="disabled"
             aria-label="按钮">
              <Paperclip
                :size="18"
                class="group-hover:text-primary transition-colors sm:w-[20px] sm:h-[20px]"
              />
            </button>

            <!-- Voice Input Button -->
            <VoiceInputButton
              ref="voiceInputButtonRef"
              v-if="showVoiceInput"
              :disabled="disabled"
              size="md"
              variant="ghost"
              @recording-start="handleVoiceRecordingStart"
              @recording-stop="handleVoiceRecordingStop"
              @permission-required="handleVoicePermissionRequired"
              @error="handleVoiceError"
            />
          </div>

          <!-- Text Input -->
          <textarea
            ref="textareaRef"
            v-model="inputText"
            @keydown="handleKeydown"
            @paste="handlePaste"
            @input="handleInput"
            @focus="handleFocus"
            @blur="handleBlur"
            :placeholder="placeholder"
            :disabled="disabled"
            class="chat-input-field flex-1 min-h-[40px] sm:min-h-[44px] max-h-[160px] sm:max-h-[240px] px-3 py-2.5 bg-transparent resize-none outline-none placeholder:text-muted-foreground/60 text-sm sm:text-base leading-relaxed"
            style="
              font-family:
                system-ui,
                -apple-system,
                'PingFang SC',
                'Helvetica Neue',
                'Microsoft YaHei',
                'Source Han Sans SC',
                sans-serif;
              line-height: 1.75;
              letter-spacing: 0.02em;
              word-break: break-word;
              ime-mode: active;
            "
            rows="1"
            data-chat-input
          />

          <!-- Send Button -->
          <div class="send-button-container pb-0.5">
            <button
              @click="handleSend"
              :disabled="!canSend"
              class="send-button btn-interactive elastic-click p-2.5 sm:p-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
              :class="[sendButtonClasses, sendButtonAnimationClass]"
              :title="sendButtonTooltip"
             aria-label="按钮">
              <Send :size="18" class="sm:w-[20px] sm:h-[20px]" />
            </button>
          </div>
        </div>

        <!-- Voice Recording Interface -->
        <div
          v-if="isVoiceInputActive"
          class="voice-interface mt-3 p-4 bg-muted/30 rounded-lg border-2 border-primary/20"
        >
          <VoiceRecorder
            :show-waveform="true"
            :continuous="false"
            :auto-start="true"
            @transcript="handleVoiceTranscript"
            @recording-stop="handleRecordingStop"
            @error="handleVoiceError"
          />
        </div>

        <!-- Keyboard Hints -->
        <div
          class="keyboard-hints absolute -bottom-6 left-0 text-xs text-muted-foreground hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          Press <kbd class="kbd">Enter</kbd> to send, <kbd class="kbd">Shift+Enter</kbd> for new
          line, <kbd class="kbd">{{ isMac ? '⌘' : 'Ctrl' }}+Enter</kbd> to force send
          <span v-if="showVoiceInput" class="ml-4">
            <kbd class="kbd">{{ isMac ? '⌘' : 'Ctrl' }}+Shift+V</kbd> for voice input
          </span>
        </div>

        <!-- Character Count -->
        <div
          v-if="showCharCount && inputText.length > 0"
          class="char-count absolute -bottom-6 right-0 text-xs transition-all duration-300"
          :class="[charCountClasses, charCountAnimationClass]"
        >
          {{ inputText.length }}{{ maxLength ? `/${maxLength}` : '' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { Send, Paperclip, AlertCircle, Mic, X, AlertTriangle } from 'lucide-vue-next'
import AttachmentsPreview from './AttachmentsPreview.vue'
import ImagePreviewModal from './ImagePreviewModal.vue'
import VoiceRecorder from '@renderer/src/components/voice/VoiceRecorder.vue'
import VoiceInputButton from './VoiceInputButton.vue'
import { useErrorHandler } from '@renderer/src/composables/useErrorHandler'
import { voiceService } from '@renderer/src/services/voice/VoiceService'
import { useSettingsStore } from '@renderer/src/stores/settings'

interface Attachment {
  id: string
  name: string
  type: 'image' | 'text' | 'file'
  data?: string
  content?: string
  size?: number
  status?: 'uploading' | 'processing' | 'ready' | 'error'
  uploadProgress?: number
  error?: string
}

interface Props {
  disabled?: boolean
  isConfigured?: boolean
  isLoading?: boolean
  placeholder?: string
  maxLength?: number
  showCharCount?: boolean
  showVoiceInput?: boolean
  autoFocus?: boolean
  currentProvider?: string
  currentModel?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  isConfigured: true,
  isLoading: false,
  placeholder: 'Ask anything...',
  showCharCount: false,
  showVoiceInput: false,
  autoFocus: false,
  currentProvider: 'openai',
  currentModel: 'gpt-4o'
})

const emit = defineEmits<{
  send: [message: string, attachments: Attachment[]]
  'open-settings': []
  'voice-toggle': [enabled: boolean]
  'voice-transcript': [text: string, confidence: number]
  'voice-error': [error: string]
}>()

// Stores and services
const settingsStore = useSettingsStore()
const { handleError, showError } = useErrorHandler()

// Refs
const textareaRef = ref<HTMLTextAreaElement>()
const voiceInputButtonRef = ref<InstanceType<typeof VoiceInputButton>>()

// State
const inputText = ref('')
const attachments = ref<Attachment[]>([])
const isVoiceInputActive = ref(false)
const voiceTranscript = ref('')
const showImagePreview = ref(false)
const selectedImage = ref<Attachment | null>(null)
const showVisionWarning = ref(false)
const visionWarningDismissed = ref(false)
const showAttachmentDropZone = ref(false)

// 新增微交互状态
const isTyping = ref(false)
const isFocused = ref(false)
const sendButtonState = ref<'normal' | 'sending' | 'success' | 'error'>('normal')
const typingTimeout = ref<NodeJS.Timeout | null>(null)
const lastSendTime = ref(0)
const inputAnimationClass = ref('')
const focusRipple = ref(false)
const textHighlight = ref(false)
const charCountPulse = ref(false)

// Platform detection
const isMac = navigator.platform.toLowerCase().includes('mac')

// Vision capability detection
const visionCapableProviders = ['openai', 'anthropic', 'google']
const visionCapableModels = {
  openai: ['gpt-4o', 'gpt-4-vision-preview', 'gpt-4-turbo'],
  anthropic: [
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
    'claude-3-5-sonnet-20241022'
  ],
  google: ['gemini-pro-vision', 'gemini-1.5-pro', 'gemini-1.5-flash']
}

// Listen for shortcut events
const handleShortcutSend = () => {
  if (canSend.value) {
    handleSend()
  }
}

// Computed properties
const currentProvider = computed(() => props.currentProvider || settingsStore.llmProvider)
const currentModel = computed(() => props.currentModel || settingsStore.modelName)

const isCurrentProviderVisionCapable = computed(() => {
  const provider = currentProvider.value
  const model = currentModel.value

  if (!visionCapableProviders.includes(provider)) {
    return false
  }

  if (visionCapableModels[provider as keyof typeof visionCapableModels]) {
    return visionCapableModels[provider as keyof typeof visionCapableModels].some(
      supportedModel => model.includes(supportedModel) || supportedModel.includes(model)
    )
  }

  return false
})

const hasImageAttachments = computed(() => attachments.value.some(att => att.type === 'image'))

// Show vision warning when user has images but provider doesn't support vision
const shouldShowVisionWarning = computed(
  () =>
    hasImageAttachments.value &&
    !isCurrentProviderVisionCapable.value &&
    !visionWarningDismissed.value
)
const canSend = computed(() => {
  return (
    props.isConfigured &&
    !props.disabled &&
    !props.isLoading &&
    (inputText.value.trim() || attachments.value.length > 0)
  )
})

const sendButtonClasses = computed(() => ({
  'bg-primary text-primary-foreground hover:bg-primary/90': canSend.value,
  'bg-muted-foreground/20 text-muted-foreground': !canSend.value,
  'animate-pulse': sendButtonState.value === 'sending',
  'success-check': sendButtonState.value === 'success',
  'error-shake-enhanced': sendButtonState.value === 'error'
}))

const sendButtonAnimationClass = computed(() => {
  if (sendButtonState.value === 'sending') return 'float-breathe'
  if (sendButtonState.value === 'success') return ''
  if (sendButtonState.value === 'error') return ''
  return ''
})

const sendButtonTooltip = computed(() => {
  if (!props.isConfigured) return 'Configure LLM provider first'
  if (props.isLoading) return 'Please wait...'
  if (!inputText.value.trim() && attachments.value.length === 0) return 'Type a message'
  return 'Send message'
})

const placeholder = computed(() => {
  if (!props.isConfigured) return 'Configure LLM provider first...'
  if (props.disabled) return 'Disabled...'
  if (props.isLoading) return 'AI is responding...'
  if (isVoiceInputActive.value) return 'Speaking... Click mic to stop'
  return props.placeholder
})

// 新增计算属性用于微交互
const charCountStatus = computed(() => {
  if (!props.maxLength) return 'normal'
  const ratio = inputText.value.length / props.maxLength
  if (ratio >= 1) return 'error'
  if (ratio >= 0.8) return 'warning'
  return 'normal'
})

const inputWrapperClasses = computed(() => ({
  typing: isTyping.value,
  focused: isFocused.value,
  'drop-zone-active': showAttachmentDropZone.value,
  'focus-ripple': focusRipple.value,
  'text-highlight': textHighlight.value
}))

const sendButtonClasses = computed(() => ({
  'bg-primary text-primary-foreground hover:bg-primary/90': canSend.value,
  'bg-muted-foreground/20 text-muted-foreground': !canSend.value,
  'sent-success': sendButtonState.value === 'success'
}))

const charCountAnimationClass = computed(() => {
  if (charCountPulse.value) return 'char-count-pulse'
  if (charCountStatus.value === 'warning') return 'char-count-warning'
  if (charCountStatus.value === 'error') return 'char-count-error'
  return ''
})

const charCountClasses = computed(() => ({
  warning: charCountStatus.value === 'warning',
  error: charCountStatus.value === 'error'
}))

// Auto-resize textarea
const adjustTextareaHeight = () => {
  if (!textareaRef.value) return

  textareaRef.value.style.height = 'auto'
  textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`
}

// Handle input events
const handleInput = () => {
  adjustTextareaHeight()

  // 打字状态检测
  isTyping.value = true
  textHighlight.value = true

  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
  }

  typingTimeout.value = setTimeout(() => {
    isTyping.value = false
    textHighlight.value = false
  }, 1000)

  // 字符计数脉冲效果
  if (props.showCharCount && inputText.value.length > 0) {
    charCountPulse.value = true
    setTimeout(() => {
      charCountPulse.value = false
    }, 300)
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  const isModifierPressed = event.ctrlKey || event.metaKey

  if (event.key === 'Enter') {
    if (!event.shiftKey || (isModifierPressed && !event.shiftKey)) {
      event.preventDefault()
      handleSend()
    }
    // Shift+Enter allows new line (default behavior)
  }
}

// Focus and blur handlers for enhanced interactions
const handleFocus = () => {
  isFocused.value = true
  focusRipple.value = true

  setTimeout(() => {
    focusRipple.value = false
  }, 600)
}

const handleBlur = () => {
  isFocused.value = false
}

const handleSend = () => {
  if (!canSend.value) {
    // Error feedback for failed send
    sendButtonState.value = 'error'
    const sendButton = document.querySelector('.send-btn')
    if (sendButton) {
      sendButton.classList.add('error-shake')
      setTimeout(() => {
        sendButton.classList.remove('error-shake')
        sendButtonState.value = 'normal'
      }, 400)
    }
    return
  }

  const message = inputText.value.trim()
  const messageAttachments = [...attachments.value]

  if (!message && messageAttachments.length === 0) return

  // 防止快速重复发送
  const now = Date.now()
  if (now - lastSendTime.value < 500) return
  lastSendTime.value = now

  // 发送状态动画
  sendButtonState.value = 'sending'

  // 输入框清空动画
  const textarea = textareaRef.value
  if (textarea) {
    textarea.classList.add('clear-animation')
    setTimeout(() => {
      textarea.classList.remove('clear-animation')
    }, 300)
  }

  // Clear input
  inputText.value = ''
  attachments.value = []
  isTyping.value = false

  // Reset textarea height
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
  }

  // Emit send event
  emit('send', message, messageAttachments)

  // 成功状态动画
  setTimeout(() => {
    sendButtonState.value = 'success'
    setTimeout(() => {
      sendButtonState.value = 'normal'
    }, 800)
  }, 100)
}

// File handling
const selectFiles = async () => {
  if (props.disabled) return

  if (!window.api?.file?.select) {
    console.error('[ChatInput] File API not available')
    return
  }

  try {
    const files = await window.api.file.select()

    for (const file of files) {
      const attachment: Attachment = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        type: file.type as any,
        data: file.data,
        content: file.content,
        size: file.size
      }
      attachments.value.push(attachment)
    }
  } catch (error) {
    handleError(error, 'File Selection')
  }
}

const handlePaste = async (event: ClipboardEvent) => {
  const items = event.clipboardData?.items
  if (!items) return

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      event.preventDefault()

      try {
        const file = item.getAsFile()
        if (!file) continue

        const reader = new FileReader()
        reader.onload = async e => {
          const dataUrl = e.target?.result as string
          const fileInfo = await window.api.file.paste(dataUrl)

          attachments.value.push({
            id: Date.now().toString() + Math.random(),
            name: fileInfo.name,
            type: 'image',
            data: fileInfo.data
          })
        }
        reader.readAsDataURL(file)
      } catch (error) {
        handleError(error, 'Paste Image')
      }
    }
  }
}

const removeAttachment = (id: string) => {
  const index = attachments.value.findIndex(a => a.id === id)
  if (index > -1) {
    attachments.value.splice(index, 1)
  }
}

const retryAttachment = async (id: string) => {
  const attachment = attachments.value.find(a => a.id === id)
  if (!attachment) return

  attachment.status = 'uploading'
  attachment.uploadProgress = 0
  attachment.error = undefined

  try {
    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 20) {
      attachment.uploadProgress = progress
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    attachment.status = 'ready'
  } catch (error) {
    attachment.status = 'error'
    attachment.error = 'Upload failed'
    handleError(error, 'Attachment Retry')
  }
}

const handleAttachmentDrop = async (event: DragEvent) => {
  const files = event.dataTransfer?.files
  if (!files || files.length === 0) return

  for (const file of files) {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()

      // Create attachment with uploading status
      const attachment: Attachment = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        type: 'image',
        size: file.size,
        status: 'uploading',
        uploadProgress: 0
      }

      attachments.value.push(attachment)

      reader.onload = async e => {
        try {
          const dataUrl = e.target?.result as string
          attachment.data = dataUrl

          // Simulate processing
          attachment.status = 'processing'
          await new Promise(resolve => setTimeout(resolve, 1000))

          attachment.status = 'ready'
        } catch (error) {
          attachment.status = 'error'
          attachment.error = 'Processing failed'
        }
      }

      reader.onerror = () => {
        attachment.status = 'error'
        attachment.error = 'Failed to read file'
      }

      reader.readAsDataURL(file)
    }
  }
}

const openImagePreview = (attachment: Attachment) => {
  selectedImage.value = attachment
  showImagePreview.value = true
}

const closeImagePreview = () => {
  showImagePreview.value = false
  selectedImage.value = null
}

const dismissVisionWarning = () => {
  visionWarningDismissed.value = true
  showVisionWarning.value = false
}

// Voice input event handlers
const handleVoiceRecordingStart = () => {
  isVoiceInputActive.value = true
  voiceTranscript.value = ''
  emit('voice-toggle', true)
}

const handleVoiceRecordingStop = () => {
  isVoiceInputActive.value = false
  voiceTranscript.value = ''
  emit('voice-toggle', false)

  // Focus back to textarea
  nextTick(() => {
    textareaRef.value?.focus()
  })
}

const handleVoicePermissionRequired = () => {
  // Show a user-friendly message about granting permission
  handleError(
    new Error('Please grant microphone permission to use voice input'),
    'Voice Permission'
  )
}

const handleVoiceTranscript = (transcript: string, confidence: number) => {
  // Update the voice transcript
  voiceTranscript.value = transcript

  // Emit transcript event for parent components
  emit('voice-transcript', transcript, confidence)

  // Only add to input if confidence is high enough
  if (confidence > 0.8) {
    // Clean up the transcript before adding
    const cleanTranscript = transcript.trim()
    if (cleanTranscript) {
      if (inputText.value.trim()) {
        // Add space before appending if input is not empty
        inputText.value += ' ' + cleanTranscript
      } else {
        inputText.value = cleanTranscript
      }

      // Auto-resize textarea
      nextTick(() => {
        adjustTextareaHeight()
      })
    }
  }
}

const handleRecordingStop = () => {
  // Auto-stop voice input when recording stops
  isVoiceInputActive.value = false
  voiceTranscript.value = ''

  // Focus back to textarea
  nextTick(() => {
    textareaRef.value?.focus()
  })
}

const handleVoiceError = (error: string) => {
  handleError(new Error(error), 'Voice Input')
  emit('voice-error', error)
  isVoiceInputActive.value = false
  voiceTranscript.value = ''

  // Focus back to textarea after error
  nextTick(() => {
    textareaRef.value?.focus()
  })
}

// Keyboard shortcuts
const handleGlobalKeydown = (event: KeyboardEvent) => {
  // Ctrl+Shift+M (Cmd+Shift+M on Mac) to toggle voice input
  if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'M') {
    event.preventDefault()
    if (props.showVoiceInput && voiceInputButtonRef.value) {
      if (isVoiceInputActive.value) {
        voiceInputButtonRef.value.stopRecording()
      } else {
        voiceInputButtonRef.value.startRecording()
      }
    }
    return
  }

  // Esc to cancel voice recording
  if (event.key === 'Escape' && isVoiceInputActive.value) {
    event.preventDefault()
    voiceInputButtonRef.value?.stopRecording()
    return
  }
}

// Global shortcut event listeners
const handleSendMessageEvent = () => {
  if (canSend.value && textareaRef.value === document.activeElement) {
    handleSend()
  }
}

// Lifecycle hooks
onMounted(() => {
  // Add global keyboard event listener
  document.addEventListener('keydown', handleGlobalKeydown)

  // Add custom event listeners for shortcuts
  document.addEventListener('sendMessage', handleSendMessageEvent)
  document.addEventListener('shortcuts:send-message', handleShortcutSend)
})

onUnmounted(() => {
  // Remove global keyboard event listener
  document.removeEventListener('keydown', handleGlobalKeydown)

  // Remove custom event listeners
  document.removeEventListener('sendMessage', handleSendMessageEvent)
  document.removeEventListener('shortcuts:send-message', handleShortcutSend)
})

// Watch for prop changes
watch(
  () => props.autoFocus,
  shouldFocus => {
    if (shouldFocus && textareaRef.value) {
      nextTick(() => {
        textareaRef.value?.focus()
      })
    }
  }
)

// Watch for vision warning
watch(shouldShowVisionWarning, should => {
  showVisionWarning.value = should
})

// Reset vision warning when provider changes
watch([currentProvider, currentModel], () => {
  visionWarningDismissed.value = false
})

// Show attachment drop zone when input is focused and no attachments
watch([() => inputText.value, () => attachments.value.length], () => {
  showAttachmentDropZone.value = inputText.value === '' && attachments.value.length === 0
})

// Focus method for parent components
const focus = () => {
  textareaRef.value?.focus()
}

// Expose methods
defineExpose({
  focus,
  clear: () => {
    inputText.value = ''
    attachments.value = []
  },
  toggleVoiceInput: () => {
    if (isVoiceInputActive.value) {
      voiceInputButtonRef.value?.stopRecording()
    } else {
      voiceInputButtonRef.value?.startRecording()
    }
  }
})
</script>

<style scoped>

/* 🎨 响应式设计系统 */
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}

/* 🎨 响应式实用类 */
.container-sm { max-width: var(--breakpoint-sm); }
.container-md { max-width: var(--breakpoint-md); }
.container-lg { max-width: var(--breakpoint-lg); }
.container-xl { max-width: var(--breakpoint-xl); }

/* 响应式显示 */
.hidden-sm { display: none; }
.hidden-md { display: none; }
.hidden-lg { display: none; }

@media (min-width: 640px) {
  .hidden-sm { display: block; }
}

@media (min-width: 768px) {
  .hidden-md { display: block; }
}

@media (min-width: 1024px) {
  .hidden-lg { display: block; }
}

/* 响应式文本 */
.text-responsive-sm { font-size: clamp(0.875rem, 2vw, 1rem); }
.text-responsive-base { font-size: clamp(1rem, 2.5vw, 1.125rem); }
.text-responsive-lg { font-size: clamp(1.125rem, 3vw, 1.25rem); }
.text-responsive-xl { font-size: clamp(1.25rem, 3.5vw, 1.5rem); }

/* 响应式间距 */
.space-responsive-sm { gap: clamp(0.5rem, 2vw, 1rem); }
.space-responsive-md { gap: clamp(1rem, 3vw, 1.5rem); }
.space-responsive-lg { gap: clamp(1.5rem, 4vw, 2rem); }

/* 响应式网格 */
.grid-responsive-sm {
  grid-template-columns: repeat(auto-fit, minmax(clamp(200px, 25vw, 300px), 1fr));
}

.grid-responsive-md {
  grid-template-columns: repeat(auto-fit, minmax(clamp(250px, 30vw, 350px), 1fr));
}

.grid-responsive-lg {
  grid-template-columns: repeat(auto-fit, minmax(clamp(300px, 35vw, 400px), 1fr));
}

/* 响应式布局调整 */
@media (max-width: 640px) {
  .flex-col-mobile { flex-direction: column; }
  .grid-1-mobile { grid-template-columns: 1fr; }
  .gap-2-mobile { gap: var(--space-2); }
  .p-4-mobile { padding: var(--space-4); }
}

@media (max-width: 768px) {
  .flex-col-tablet { flex-direction: column; }
  .grid-2-tablet { grid-template-columns: repeat(2, 1fr); }
  .gap-4-tablet { gap: var(--space-4); }
  .p-6-tablet { padding: var(--space-6); }
}

@media (max-width: 1024px) {
  .sidebar-layout {
    grid-template-columns: 1fr;
  }
  .sidebar {
    position: static;
  }
}

/* 🎨 现代布局系统 */
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.flex-start {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.flex-end {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.flex-col {
  display: flex;
  flex-direction: column;
}

.flex-wrap {
  display: flex;
  flex-wrap: wrap;
}

/* 🎨 网格系统 */
.grid-auto-fit {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-4);
}

.grid-auto-fill {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-4);
}

.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

.grid-gap-2 { gap: var(--space-2); }
.grid-gap-4 { gap: var(--space-4); }
.grid-gap-6 { gap: var(--space-6); }

/* 🎨 卡片布局 */
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.card-interactive:hover {
  cursor: pointer;
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1);
}

/* 🎨 页面布局 */
.page-layout {
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr auto;
}

.page-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: white;
  border-bottom: 1px solid var(--color-gray-200);
}

.page-main {
  padding: var(--space-6) 0;
}

.page-footer {
  border-top: 1px solid var(--color-gray-200);
  background: var(--color-gray-50);
}

/* 🎨 侧边栏布局 */
.sidebar-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--space-6);
}

.sidebar {
  position: sticky;
  top: var(--space-6);
  height: fit-content;
}

.sidebar-content {
  padding: var(--space-6);
  background: white;
  border-radius: 12px;
  border: 1px solid var(--color-gray-200);
}

/* 🎨 响应式工具 */
@media (max-width: 768px) {
  .sidebar-layout {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }

  .hidden-mobile { display: none; }
  .flex-mobile-col { flex-direction: column; }
  .grid-mobile-1 { grid-template-columns: 1fr; }
}

/* 🎨 完整间距系统 - 基于4px网格 */
:root {
  --space-0: 0;
  --space-1: 0.25rem;    /* 4px */
  --space-2: 0.5rem;     /* 8px */
  --space-3: 0.75rem;    /* 12px */
  --space-4: 1rem;       /* 16px */
  --space-5: 1.25rem;    /* 20px */
  --space-6: 1.5rem;     /* 24px */
  --space-8: 2rem;       /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */
  --space-20: 5rem;      /* 80px */
  --space-24: 6rem;      /* 96px */
  --space-32: 8rem;      /* 128px */

  /* 负间距 */
  --space-neg-1: -0.25rem;
  --space-neg-2: -0.5rem;
  --space-neg-4: -1rem;
}

/* 🎨 间距实用类 */
.m-1 { margin: var(--space-1); }
.m-2 { margin: var(--space-2); }
.m-3 { margin: var(--space-3); }
.m-4 { margin: var(--space-4); }
.m-6 { margin: var(--space-6); }
.m-8 { margin: var(--space-8); }

.p-1 { padding: var(--space-1); }
.p-2 { padding: var(--space-2); }
.p-3 { padding: var(--space-3); }
.p-4 { padding: var(--space-4); }
.p-6 { padding: var(--space-6); }
.p-8 { padding: var(--space-8); }

.mx-auto { margin-left: auto; margin-right: auto; }
.my-auto { margin-top: auto; margin-bottom: auto; }

.px-1 { padding-left: var(--space-1); padding-right: var(--space-1); }
.px-2 { padding-left: var(--space-2); padding-right: var(--space-2); }
.px-3 { padding-left: var(--space-3); padding-right: var(--space-3); }
.px-4 { padding-left: var(--space-4); padding-right: var(--space-4); }
.px-6 { padding-left: var(--space-6); padding-right: var(--space-6); }

.py-1 { padding-top: var(--space-1); padding-bottom: var(--space-1); }
.py-2 { padding-top: var(--space-2); padding-bottom: var(--space-2); }
.py-3 { padding-top: var(--space-3); padding-bottom: var(--space-3); }
.py-4 { padding-top: var(--space-4); padding-bottom: var(--space-4); }
.py-6 { padding-top: var(--space-6); padding-bottom: var(--space-6); }

/* 🎨 容器和布局间距 */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding-left: var(--space-4);
  padding-right: var(--space-4);
}

.section-spacing {
  padding-top: var(--space-12);
  padding-bottom: var(--space-12);
}

.card-spacing {
  padding: var(--space-6);
}

.stack-sm > * + * { margin-top: var(--space-2); }
.stack-md > * + * { margin-top: var(--space-4); }
.stack-lg > * + * { margin-top: var(--space-6); }
.stack-xl > * + * { margin-top: var(--space-8); }

.inline-sm > * + * { margin-left: var(--space-2); }
.inline-md > * + * { margin-left: var(--space-4); }
.inline-lg > * + * { margin-left: var(--space-6); }

/* 🎨 完整字体系统 */
:root {
  /* 字体族 */
  --font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', 'Source Code Pro', monospace;

  /* 字体大小 - 基于1.25的倍数比例 */
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-3xl: 1.875rem;  /* 30px */
  --font-size-4xl: 2.25rem;   /* 36px */
  --font-size-5xl: 3rem;      /* 48px */

  /* 字体权重 */
  --font-weight-thin: 100;
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;

  /* 行高 */
  --line-height-tight: 1.25;
  --line-height-snug: 1.375;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.625;
  --line-height-loose: 2;

  /* 字母间距 */
  --letter-spacing-tighter: -0.05em;
  --letter-spacing-tight: -0.025em;
  --letter-spacing-normal: 0;
  --letter-spacing-wide: 0.025em;
  --letter-spacing-wider: 0.05em;
  --letter-spacing-widest: 0.1em;
}

/* 🎨 字体实用类 */
.font-sans { font-family: var(--font-family-sans); }
.font-mono { font-family: var(--font-family-mono); }

.text-xs { font-size: var(--font-size-xs); line-height: var(--line-height-tight); }
.text-sm { font-size: var(--font-size-sm); line-height: var(--line-height-snug); }
.text-base { font-size: var(--font-size-base); line-height: var(--line-height-normal); }
.text-lg { font-size: var(--font-size-lg); line-height: var(--line-height-relaxed); }
.text-xl { font-size: var(--font-size-xl); line-height: var(--line-height-relaxed); }
.text-2xl { font-size: var(--font-size-2xl); line-height: var(--line-height-loose); }
.text-3xl { font-size: var(--font-size-3xl); line-height: var(--line-height-loose); }

.font-thin { font-weight: var(--font-weight-thin); }
.font-light { font-weight: var(--font-weight-light); }
.font-normal { font-weight: var(--font-weight-normal); }
.font-medium { font-weight: var(--font-weight-medium); }
.font-semibold { font-weight: var(--font-weight-semibold); }
.font-bold { font-weight: var(--font-weight-bold); }

.leading-tight { line-height: var(--line-height-tight); }
.leading-snug { line-height: var(--line-height-snug); }
.leading-normal { line-height: var(--line-height-normal); }
.leading-relaxed { line-height: var(--line-height-relaxed); }

.tracking-tight { letter-spacing: var(--letter-spacing-tight); }
.tracking-normal { letter-spacing: var(--letter-spacing-normal); }
.tracking-wide { letter-spacing: var(--letter-spacing-wide); }

/* 🎨 文本层次优化 */
.heading-1 {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tighter);
  margin-bottom: 1rem;
}

.heading-2 {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tighter);
  margin-bottom: 0.875rem;
}

.heading-3 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-snug);
  letter-spacing: var(--letter-spacing-tight);
  margin-bottom: 0.75rem;
}

.body-large {
  font-size: var(--font-size-lg);
  line-height: var(--line-height-relaxed);
  letter-spacing: var(--letter-spacing-normal);
}

.body-regular {
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-normal);
}

.body-small {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-wide);
}

.caption {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-snug);
  letter-spacing: var(--letter-spacing-wide);
  color: var(--color-gray-600);
}

/* 🎨 高级色彩系统 */
:root {
  /* 基础色彩 */
  --color-primary: hsl(221 83% 53%);
  --color-primary-hover: hsl(221 83% 48%);
  --color-primary-active: hsl(221 83% 43%);

  /* 语义色彩 */
  --color-success: hsl(142 71% 45%);
  --color-warning: hsl(38 92% 50%);
  --color-error: hsl(0 84% 60%);
  --color-info: hsl(217 91% 60%);

  /* 中性色彩 */
  --color-gray-50: hsl(210 20% 98%);
  --color-gray-100: hsl(210 15% 95%);
  --color-gray-200: hsl(210 10% 89%);
  --color-gray-300: hsl(210 8% 75%);
  --color-gray-400: hsl(210 8% 56%);
  --color-gray-500: hsl(210 6% 43%);
  --color-gray-600: hsl(210 8% 35%);
  --color-gray-700: hsl(210 10% 28%);
  --color-gray-800: hsl(210 12% 21%);
  --color-gray-900: hsl(210 15% 15%);

  /* 透明度变体 */
  --color-primary-10: hsl(221 83% 53% / 0.1);
  --color-primary-20: hsl(221 83% 53% / 0.2);
  --color-primary-30: hsl(221 83% 53% / 0.3);
  --color-success-10: hsl(142 71% 45% / 0.1);
  --color-error-10: hsl(0 84% 60% / 0.1);
}

/* 🎨 色彩实用类 */
.text-primary { color: var(--color-primary); }
.text-success { color: var(--color-success); }
.text-warning { color: var(--color-warning); }
.text-error { color: var(--color-error); }
.text-gray-500 { color: var(--color-gray-500); }
.text-gray-600 { color: var(--color-gray-600); }
.text-gray-700 { color: var(--color-gray-700); }

.bg-primary { background-color: var(--color-primary); }
.bg-primary-hover:hover { background-color: var(--color-primary-hover); }
.bg-success { background-color: var(--color-success); }
.bg-warning { background-color: var(--color-warning); }
.bg-error { background-color: var(--color-error); }

.border-primary { border-color: var(--color-primary); }
.border-success { border-color: var(--color-success); }
.border-error { border-color: var(--color-error); }

/* 🎨 对比度增强 */
.high-contrast {
  --color-primary: hsl(221 100% 40%);
  --color-gray-900: hsl(210 20% 10%);
  --color-gray-100: hsl(210 15% 95%);
}

/* 🎨 暗色主题支持 */
@media (prefers-color-scheme: dark) {
  :root {
    --color-gray-50: hsl(210 15% 15%);
    --color-gray-100: hsl(210 12% 21%);
    --color-gray-200: hsl(210 10% 28%);
    --color-gray-300: hsl(210 8% 35%);
    --color-gray-400: hsl(210 6% 43%);
    --color-gray-500: hsl(210 8% 56%);
    --color-gray-600: hsl(210 8% 75%);
    --color-gray-700: hsl(210 10% 89%);
    --color-gray-800: hsl(210 15% 95%);
    --color-gray-900: hsl(210 20% 98%);
  }
}
.chat-input {
  background: rgba(var(--background-rgb), 0.95);
  backdrop-filter: blur(12px);
}

.message-input {
  field-sizing: content;
  line-height: 1.5;
}

.kbd {
  display: inline-block;
  padding: 2px 6px;
  background: var(--muted);
  border-radius: 3px;
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, monospace;
}

.action-btn {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.action-btn:hover:not(:disabled) {
  transform: scale(1.1) translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.action-btn:active:not(:disabled) {
  transform: scale(0.95) translateY(0px);
  transition-duration: 0.1s;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: scale(0.95);
}

.send-btn {
  transform: scale(1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.05) translateY(-1px);
  box-shadow: 0 8px 25px rgba(var(--primary-rgb), 0.25);
}

.send-btn:active:not(:disabled) {
  transform: scale(0.98) translateY(0px);
  transition-duration: 0.1s;
}

/* 发送按钮成功状态 */
.send-btn.sent-success {
  animation: sendSuccess 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 波纹点击效果 */
.send-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  transform: scale(0);
  opacity: 0;
  transition: all 0.4s ease;
  pointer-events: none;
}

.send-btn:active:not(:disabled)::after {
  transform: scale(1);
  opacity: 1;
  transition-duration: 0.1s;
}

.config-warning {
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 新增动画 */
@keyframes sendSuccess {
  0% {
    transform: scale(1);
    background: var(--primary);
  }
  50% {
    transform: scale(1.2);
    background: var(--success, #10b981);
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
  }
  100% {
    transform: scale(1);
    background: var(--primary);
  }
}

@keyframes typingPulse {
  0%,
  100% {
    border-color: rgba(var(--primary-rgb), 0.2);
    box-shadow: 0 0 0 1px rgba(var(--primary-rgb), 0.1);
  }
  50% {
    border-color: rgba(var(--primary-rgb), 0.4);
    box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.2);
  }
}

@keyframes charCountPulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.1);
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-3px);
  }
  20%,
  40%,
  60%,
  80% {
    transform: translateX(3px);
  }
}

@keyframes errorShake {
  0%,
  100% {
    transform: translateX(0) scale(1);
    background: var(--destructive);
  }
  25% {
    transform: translateX(-4px) scale(0.98);
    background: #dc2626;
  }
  75% {
    transform: translateX(4px) scale(0.98);
    background: #dc2626;
  }
}

@keyframes focusRipple {
  0% {
    transform: scale(0);
    opacity: 0.5;
  }
  50% {
    opacity: 0.3;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

@keyframes clearAnimation {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.98);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes textHighlight {
  0% {
    background-position: -200% center;
  }
  100% {
    background-position: 200% center;
  }
}

/* 附件拖拽区域动画 */
@keyframes dropZonePulse {
  0%,
  100% {
    border-color: rgba(var(--primary-rgb), 0.3);
    background: rgba(var(--primary-rgb), 0.05);
  }
  50% {
    border-color: rgba(var(--primary-rgb), 0.6);
    background: rgba(var(--primary-rgb), 0.1);
  }
}

.drop-zone-active {
  animation: dropZonePulse 1.5s ease-in-out infinite;
}

@keyframes slideUp {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
}

/* Voice interface */
.voice-interface {
  animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.05), rgba(var(--muted-rgb), 0.1));
  border: 2px solid rgba(var(--primary-rgb), 0.2);
  backdrop-filter: blur(8px);
  transform-origin: top center;
}

/* Focus states */
.input-wrapper {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.input-wrapper::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(var(--primary-rgb), 0.1) 0%, transparent 70%);
  opacity: 0;
  transform: scale(0);
  transition: all 0.4s ease;
  pointer-events: none;
  border-radius: inherit;
}

.input-wrapper.focus-ripple::before {
  opacity: 1;
  transform: scale(1);
  animation: focusRipple 0.6s ease-out;
}

.input-wrapper:focus-within {
  box-shadow:
    0 0 0 2px rgba(var(--primary-rgb), 0.2),
    0 8px 25px rgba(var(--primary-rgb), 0.1);
  transform: translateY(-1px);
  background: rgba(var(--background-rgb), 0.95);
}

.input-wrapper.focused {
  box-shadow:
    0 0 0 2px rgba(var(--primary-rgb), 0.3),
    0 8px 30px rgba(var(--primary-rgb), 0.15);
}

/* 输入中状态指示 */
.input-wrapper.typing {
  animation: typingPulse 2s ease-in-out infinite;
}

.input-wrapper.text-highlight .message-input {
  background: linear-gradient(90deg, transparent, rgba(var(--primary-rgb), 0.05), transparent);
  background-size: 200% 100%;
  animation: textHighlight 1s ease-in-out;
}

/* 字符计数动画 */
.char-count {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
}

.char-count.char-count-pulse {
  animation: charCountPulse 0.3s ease-out;
}

.char-count.warning {
  color: var(--warning);
  text-shadow: 0 0 8px rgba(251, 191, 36, 0.3);
}

.char-count.error {
  color: var(--destructive);
  animation: shake 0.5s ease-in-out;
  text-shadow: 0 0 8px rgba(239, 68, 68, 0.3);
}

/* Send button enhanced states */
.send-btn.error-shake {
  animation: errorShake 0.4s ease-in-out;
}

/* Text input clear animation */
.message-input.clear-animation {
  animation: clearAnimation 0.3s ease-out;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .keyboard-hints,
  .char-count {
    display: none;
  }

  .input-actions {
    gap: 0.25rem;
  }

  .action-btn {
    padding: 6px;
  }

  .voice-interface {
    margin: 0.75rem 0;
    padding: 0.75rem;
  }

  .chat-input {
    padding: 0.5rem 1rem;
  }
}

@media (max-width: 480px) {
  .voice-interface {
    border-radius: 0.5rem;
    margin: 0.5rem -0.5rem;
  }

  .input-wrapper {
    padding: 0.75rem;
    border-radius: 1rem;
  }
}

/* Theme variables */
:root {
  --background-rgb: 255, 255, 255;
  --primary-rgb: 59, 130, 246;
  --warning: hsl(38, 92%, 50%);
  --primary: hsl(221, 83%, 53%);
  --primary-foreground: hsl(0, 0%, 100%);
  --muted: hsl(210, 20%, 96%);
  --muted-foreground: hsl(215, 20%, 45%);
  --background: hsl(0, 0%, 100%);
}

:root[data-theme='dark'] {
  --background-rgb: 15, 23, 42;
  --primary: hsl(221, 83%, 65%);
  --muted: hsl(217, 33%, 17%);
  --muted-foreground: hsl(215, 20%, 65%);
  --background: hsl(222, 47%, 11%);
}


/* 无障碍支持 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* 焦点样式 */
:focus-visible {
  outline: 2px solid hsl(var(--ring, 59 130 230));
  outline-offset: 2px;
}

/* 🎨 表单用户体验优化 */
.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: hsl(var(--foreground));
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: hsl(var(--ring));
  box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2);
}

.form-input.error {
  border-color: hsl(0 84% 60%);
}

.form-error {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: hsl(0 84% 60%);
}

.form-success {
  border-color: hsl(142 71% 45%);
}

/* 加载状态 */
.form-input.loading {
  background-image: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  background-size: 200% 100%;
  animation: loading-shimmer 1.5s infinite;
}

@keyframes loading-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* 🎨 错误状态设计 */
.error-state {
  padding: 1rem;
  border: 1px solid hsl(0 84% 60% / 0.2);
  border-radius: 8px;
  background-color: hsl(0 84% 60% / 0.05);
  color: hsl(0 84% 60%);
}

.error-icon {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  margin-right: 0.5rem;
  color: hsl(0 84% 60%);
}

.error-title {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.error-message {
  font-size: 0.875rem;
  line-height: 1.4;
  margin-bottom: 1rem;
}

.error-actions {
  display: flex;
  gap: 0.5rem;
}

.error-retry-btn {
  padding: 0.5rem 1rem;
  background-color: hsl(0 84% 60%);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.error-retry-btn:hover {
  background-color: hsl(0 84% 60% / 0.9);
}</style>
