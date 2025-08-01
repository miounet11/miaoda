<template>
  <div class="chat-input border-t bg-background/95 backdrop-blur px-2 sm:px-4 py-3 sm:py-4">
    <div class="max-w-3xl mx-auto">
      <!-- Configuration Warning -->
      <div v-if="!isConfigured" class="config-warning mb-3 p-3 bg-warning/10 border border-warning/20 rounded-lg flex items-center gap-2">
        <AlertCircle :size="16" class="text-warning flex-shrink-0" />
        <span class="text-sm">Please configure an LLM provider in settings to start chatting.</span>
        <button @click="$emit('open-settings')" class="ml-auto text-sm font-medium text-primary hover:underline">
          Configure now →
        </button>
      </div>
      
      <!-- Attachments Preview -->
      <AttachmentsPreview
        v-if="attachments.length > 0"
        :attachments="attachments"
        @remove="removeAttachment"
      />
      
      <!-- Input Container -->
      <div class="input-container relative">
        <div class="input-wrapper flex items-end gap-1 sm:gap-2 p-2 bg-muted/50 rounded-2xl border border-transparent focus-within:border-primary/20 transition-all">
          <!-- Action Buttons -->
          <div class="input-actions flex gap-1 pb-1">
            <button
              @click="selectFiles"
              class="action-btn p-2 hover:bg-background rounded-lg transition-colors group"
              title="Attach files (images, documents)"
              :disabled="disabled"
            >
              <Paperclip :size="16" class="group-hover:text-primary transition-colors sm:w-[18px] sm:h-[18px]" />
            </button>
            
            <!-- Voice Input Button -->
            <button
              v-if="showVoiceInput && voiceSupported"
              @click="toggleVoiceInput"
              class="action-btn p-2 hover:bg-background rounded-lg transition-colors group"
              :class="{ 'bg-red-500 text-white': isVoiceInputActive }"
              :title="voiceButtonTitle"
              :disabled="disabled"
            >
              <Mic :size="16" class="group-hover:text-primary transition-colors sm:w-[18px] sm:h-[18px]" 
                   :class="{ 'text-white': isVoiceInputActive }" />
            </button>
          </div>
          
          <!-- Text Input -->
          <textarea
            ref="textareaRef"
            v-model="inputText"
            @keydown="handleKeydown"
            @paste="handlePaste"
            @input="handleInput"
            :placeholder="placeholder"
            :disabled="disabled"
            class="message-input flex-1 min-h-[36px] sm:min-h-[40px] max-h-[150px] sm:max-h-[200px] px-2 py-2 bg-transparent resize-none outline-none placeholder:text-muted-foreground/60 text-sm sm:text-base"
            rows="1"
          />
          
          <!-- Send Button -->
          <div class="pb-1">
            <button
              @click="handleSend"
              :disabled="!canSend"
              class="send-btn p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              :class="sendButtonClasses"
              :title="sendButtonTooltip"
            >
              <Send :size="16" class="sm:w-[18px] sm:h-[18px]" />
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
        <div class="keyboard-hints absolute -bottom-6 left-0 text-xs text-muted-foreground hidden sm:block">
          Press <kbd class="kbd">Enter</kbd> to send, 
          <kbd class="kbd">Shift+Enter</kbd> for new line
          <span v-if="showVoiceInput && voiceSupported" class="ml-4">
            Click <Mic :size="12" class="inline mx-1" /> for voice input
          </span>
        </div>
        
        <!-- Character Count -->
        <div v-if="showCharCount && inputText.length > 0" class="char-count absolute -bottom-6 right-0 text-xs text-muted-foreground">
          {{ inputText.length }}{{ maxLength ? `/${maxLength}` : '' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { Send, Paperclip, AlertCircle, Mic } from 'lucide-vue-next'
import AttachmentsPreview from './AttachmentsPreview.vue'
import VoiceRecorder from '@renderer/src/components/voice/VoiceRecorder.vue'
import { useErrorHandler } from '@renderer/src/composables/useErrorHandler'
import { voiceService } from '@renderer/src/services/voice/VoiceService'

interface Attachment {
  id: string
  name: string
  type: 'image' | 'text' | 'file'
  data?: string
  content?: string
  size?: number
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
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  isConfigured: true,
  isLoading: false,
  placeholder: 'Ask anything...',
  showCharCount: false,
  showVoiceInput: false,
  autoFocus: false
})

defineEmits<{
  'send': [message: string, attachments: Attachment[]]
  'open-settings': []
  'voice-toggle': [enabled: boolean]
}>()

const textareaRef = ref<HTMLTextAreaElement>()
const inputText = ref('')
const attachments = ref<Attachment[]>([])
const isVoiceInputActive = ref(false)
const voiceSupported = ref(false)
const voiceTranscript = ref('')
const { handleError, showError } = useErrorHandler()

// Computed properties
const canSend = computed(() => {
  return props.isConfigured && 
         !props.disabled && 
         !props.isLoading && 
         (inputText.value.trim() || attachments.value.length > 0)
})

const sendButtonClasses = computed(() => ({
  'bg-primary text-primary-foreground hover:bg-primary/90': canSend.value,
  'bg-muted-foreground/20 text-muted-foreground': !canSend.value
}))

const sendButtonTooltip = computed(() => {
  if (!props.isConfigured) return 'Configure LLM provider first'
  if (props.isLoading) return 'Please wait...'
  if (!inputText.value.trim() && attachments.value.length === 0) return 'Type a message'
  return 'Send message'
})

const computedPlaceholder = computed(() => {
  if (!props.isConfigured) return 'Configure LLM provider first...'
  if (props.disabled) return 'Disabled...'
  if (props.isLoading) return 'AI is responding...'
  if (isVoiceInputActive.value) return 'Voice input active...'
  return props.placeholder
})

const voiceButtonTitle = computed(() => {
  if (!voiceSupported.value) return 'Voice input not supported'
  if (isVoiceInputActive.value) return 'Stop voice input'
  return 'Start voice input'
})

// Auto-resize textarea
const adjustTextareaHeight = () => {
  if (!textareaRef.value) return
  
  textareaRef.value.style.height = 'auto'
  textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`
}

// Handle input events
const handleInput = () => {
  adjustTextareaHeight()
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSend()
  }
}

const handleSend = () => {
  if (!canSend.value) return
  
  const message = inputText.value.trim()
  const messageAttachments = [...attachments.value]
  
  if (!message && messageAttachments.length === 0) return
  
  // Clear input
  inputText.value = ''
  attachments.value = []
  
  // Reset textarea height
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
  }
  
  // Emit send event
  emit('send', message, messageAttachments)
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
        reader.onload = async (e) => {
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

// Voice input
const toggleVoiceInput = () => {
  isVoiceInputActive.value = !isVoiceInputActive.value
  
  if (!isVoiceInputActive.value) {
    // Clear any voice transcript when stopping
    voiceTranscript.value = ''
  }
  
  emit('voice-toggle', isVoiceInputActive.value)
}

const handleVoiceTranscript = (transcript: string, confidence: number) => {
  // Update the voice transcript
  voiceTranscript.value = transcript
  
  // If confidence is high and transcript is final, add to input
  if (confidence > 0.7) {
    if (inputText.value.trim()) {
      inputText.value += ' ' + transcript
    } else {
      inputText.value = transcript
    }
    
    // Auto-resize textarea
    nextTick(() => {
      adjustTextareaHeight()
    })
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
  isVoiceInputActive.value = false
  voiceTranscript.value = ''
}

const checkVoiceSupport = () => {
  const capabilities = voiceService.getCapabilities()
  voiceSupported.value = !!(capabilities?.speechRecognition && capabilities?.getUserMedia)
}

// Initialize voice support check
checkVoiceSupport()

// Watch for prop changes
watch(() => props.autoFocus, (shouldFocus) => {
  if (shouldFocus && textareaRef.value) {
    nextTick(() => {
      textareaRef.value?.focus()
    })
  }
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
  }
})
</script>

<style scoped>
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

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn {
  transform: scale(1);
  transition: all 0.2s ease;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.05);
}

.send-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.config-warning {
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Voice interface */
.voice-interface {
  animation: slideDown 0.3s ease-out;
  background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.05), rgba(var(--muted-rgb), 0.1));
  border: 2px solid rgba(var(--primary-rgb), 0.2);
}

/* Focus states */
.input-wrapper:focus-within {
  box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.2);
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

:root[data-theme="dark"] {
  --background-rgb: 15, 23, 42;
  --primary: hsl(221, 83%, 65%);
  --muted: hsl(217, 33%, 17%);
  --muted-foreground: hsl(215, 20%, 65%);
  --background: hsl(222, 47%, 11%);
}
</style>