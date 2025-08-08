<template>
  <div class="enhanced-chat-input">
    <!-- Input Container -->
    <div 
      class="input-container"
      :class="containerClasses"
      @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave" 
      @drop.prevent="handleDrop"
    >
      <!-- Drop Zone Overlay -->
      <Transition name="drop-zone-fade">
        <div 
          v-if="isDragOver"
          class="drop-zone-overlay"
        >
          <div class="drop-zone-content">
            <Upload class="drop-zone-icon" />
            <div class="drop-zone-text">
              <h3>拖拽文件到这里</h3>
              <p>支持图片、文档等多种格式</p>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Attachments Preview -->
      <Transition name="attachments-slide">
        <div 
          v-if="attachments.length > 0"
          class="attachments-preview"
        >
          <div class="attachments-grid">
            <div
              v-for="(attachment, index) in attachments"
              :key="attachment.id"
              class="attachment-item"
              :class="attachmentItemClasses(attachment)"
            >
              <!-- Image Preview -->
              <div v-if="attachment.type === 'image'" class="image-preview">
                <img 
                  :src="attachment.data" 
                  :alt="attachment.name"
                  class="preview-image"
                />
                <!-- Image Actions -->
                <div class="image-actions">
                  <button 
                    class="image-action-btn"
                    @click="previewImage(attachment)"
                    title="预览"
                  >
                    <Eye :size="14" />
                  </button>
                  <button 
                    class="image-action-btn danger"
                    @click="removeAttachment(index)"
                    title="删除"
                  >
                    <X :size="14" />
                  </button>
                </div>
              </div>

              <!-- File Preview -->
              <div v-else class="file-preview">
                <div class="file-icon">
                  <FileText :size="20" />
                </div>
                <div class="file-info">
                  <div class="file-name">{{ attachment.name }}</div>
                  <div class="file-size">{{ formatFileSize(attachment.size) }}</div>
                </div>
                <button 
                  class="file-remove-btn"
                  @click="removeAttachment(index)"
                  title="删除"
                >
                  <X :size="14" />
                </button>
              </div>

              <!-- Upload Progress -->
              <div 
                v-if="attachment.status === 'uploading'"
                class="upload-progress"
              >
                <div 
                  class="progress-bar"
                  :style="{ width: `${attachment.progress || 0}%` }"
                />
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Main Input Area -->
      <div class="input-wrapper">
        <!-- Left Actions -->
        <div class="input-actions left-actions">
          <!-- Attach Files Button -->
          <button
            class="action-button attach-btn"
            @click="selectFiles"
            :disabled="disabled"
            title="添加附件"
          >
            <Paperclip :size="18" class="attach-icon" />
          </button>

          <!-- Voice Input Button -->
          <button
            v-if="enableVoice"
            class="action-button voice-btn"
            :class="{ 'active': isRecording }"
            @click="toggleVoiceInput"
            :disabled="disabled"
            :title="isRecording ? '停止录音' : '语音输入'"
          >
            <Mic :size="18" class="voice-icon" />
            <!-- Recording indicator -->
            <div v-if="isRecording" class="recording-indicator">
              <div class="recording-pulse"></div>
            </div>
          </button>
        </div>

        <!-- Text Input -->
        <div class="text-input-container">
          <textarea
            ref="textareaRef"
            v-model="inputText"
            :placeholder="computedPlaceholder"
            :disabled="disabled || isRecording"
            class="text-input"
            :class="textInputClasses"
            rows="1"
            @keydown="handleKeydown"
            @input="handleInput"
            @paste="handlePaste"
            @focus="handleFocus"
            @blur="handleBlur"
          />
          
          <!-- Input Enhancements -->
          <div class="input-enhancements">
            <!-- Placeholder Animation -->
            <div 
              v-if="showPlaceholderAnimation && !inputText && !isRecording"
              class="placeholder-animation"
            >
              <span class="typing-cursor">|</span>
            </div>

            <!-- Voice Transcript -->
            <div 
              v-if="isRecording && voiceTranscript"
              class="voice-transcript"
            >
              {{ voiceTranscript }}
              <span class="transcript-cursor">|</span>
            </div>
          </div>
        </div>

        <!-- Right Actions -->
        <div class="input-actions right-actions">
          <!-- Character Count -->
          <div 
            v-if="showCharCount && inputText.length > 0"
            class="char-count"
            :class="charCountClasses"
          >
            {{ inputText.length }}{{ maxLength ? `/${maxLength}` : '' }}
          </div>

          <!-- Send Button -->
          <button
            class="action-button send-btn"
            :class="sendButtonClasses"
            :disabled="!canSend"
            @click="handleSend"
            :title="sendButtonTooltip"
          >
            <Send :size="18" class="send-icon" />
            <!-- Success animation -->
            <div v-if="showSendSuccess" class="send-success">
              <Check :size="18" />
            </div>
          </button>
        </div>
      </div>

      <!-- Voice Recording Interface -->
      <Transition name="voice-interface-slide">
        <div 
          v-if="isRecording"
          class="voice-interface"
        >
          <div class="voice-visualizer">
            <div class="voice-bars">
              <div 
                v-for="i in 5" 
                :key="i"
                class="voice-bar"
                :style="{ animationDelay: `${i * 0.1}s` }"
              />
            </div>
          </div>
          
          <div class="voice-content">
            <div class="voice-status">
              <Mic :size="16" />
              <span>{{ voiceStatus }}</span>
            </div>
            <div class="voice-hint">说话完成后点击停止录音</div>
          </div>
          
          <button 
            class="voice-stop-btn"
            @click="stopVoiceInput"
          >
            <Square :size="16" />
          </button>
        </div>
      </Transition>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <div class="keyboard-shortcuts">
          <span class="shortcut">
            <kbd>Enter</kbd> 发送
          </span>
          <span class="shortcut">
            <kbd>Shift+Enter</kbd> 换行
          </span>
          <span v-if="enableVoice" class="shortcut">
            <kbd>{{ isMac ? '⌘' : 'Ctrl' }}+M</kbd> 语音
          </span>
        </div>
        
        <!-- Model Indicator -->
        <div v-if="currentModel" class="model-indicator">
          <div class="model-badge">
            <span class="model-icon">{{ getModelIcon(currentModel) }}</span>
            <span class="model-name">{{ currentModel }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Image Preview Modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div 
          v-if="showImagePreview"
          class="image-preview-modal"
          @click="closeImagePreview"
        >
          <div class="modal-backdrop" />
          <div class="modal-content" @click.stop>
            <button 
              class="modal-close"
              @click="closeImagePreview"
            >
              <X :size="20" />
            </button>
            <img 
              v-if="previewImageSrc"
              :src="previewImageSrc"
              class="preview-modal-image"
              alt="Image preview"
            />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { 
  Paperclip, Mic, Send, Upload, Eye, X, FileText, 
  Check, Square, Loader2
} from 'lucide-vue-next'
import { useVoiceInput } from '@/composables/useVoiceInput'
import { useFileHandler } from '@/composables/useFileHandler'
import { useResponsive } from '@/composables/useResponsive'

interface Attachment {
  id: string
  name: string
  type: 'image' | 'file'
  data?: string
  content?: string
  size?: number
  status?: 'uploading' | 'ready' | 'error'
  progress?: number
}

interface Props {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  loading?: boolean
  maxLength?: number
  showCharCount?: boolean
  enableVoice?: boolean
  currentModel?: string
  autoFocus?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '输入消息...',
  disabled: false,
  loading: false,
  showCharCount: false,
  enableVoice: true,
  autoFocus: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'send': [message: string, attachments: Attachment[]]
  'voice-start': []
  'voice-end': [transcript: string]
  'focus': []
  'blur': []
}>()

// Composables
const { isMobile, isMac } = useResponsive()
const { startRecording, stopRecording, isRecording, transcript, status } = useVoiceInput()
const { selectFiles: selectFilesUtil, handleFilePaste, formatFileSize } = useFileHandler()

// Refs
const textareaRef = ref<HTMLTextAreaElement>()
const isDragOver = ref(false)
const attachments = ref<Attachment[]>([])
const showSendSuccess = ref(false)
const showImagePreview = ref(false)
const previewImageSrc = ref('')
const isFocused = ref(false)
const showPlaceholderAnimation = ref(false)

// Computed
const inputText = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const voiceTranscript = computed(() => transcript.value)
const voiceStatus = computed(() => {
  switch (status.value) {
    case 'listening': return '正在聆听...'
    case 'processing': return '处理中...'
    default: return '开始录音'
  }
})

const computedPlaceholder = computed(() => {
  if (isRecording.value) return '正在录音...'
  if (props.loading) return 'AI正在回复...'
  if (props.disabled) return '输入已禁用'
  return props.placeholder
})

const canSend = computed(() => {
  return !props.disabled && 
         !props.loading && 
         (inputText.value.trim() || attachments.value.length > 0)
})

const containerClasses = computed(() => ({
  'container-focused': isFocused.value,
  'container-disabled': props.disabled,
  'container-drag-over': isDragOver.value,
  'container-mobile': isMobile.value
}))

const textInputClasses = computed(() => ({
  'input-disabled': props.disabled,
  'input-recording': isRecording.value
}))

const charCountClasses = computed(() => {
  if (!props.maxLength) return {}
  
  const ratio = inputText.value.length / props.maxLength
  return {
    'char-count-warning': ratio > 0.8,
    'char-count-error': ratio >= 1
  }
})

const sendButtonClasses = computed(() => ({
  'send-btn-ready': canSend.value,
  'send-btn-disabled': !canSend.value
}))

const sendButtonTooltip = computed(() => {
  if (props.loading) return '请等待...'
  if (!canSend.value) return '输入消息'
  return '发送消息 (Enter)'
})

// Methods
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSend()
  }
  
  // Voice input shortcut
  if (event.key === 'm' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault()
    toggleVoiceInput()
  }
}

const handleInput = () => {
  autoResize()
  
  // Show placeholder animation briefly
  if (!inputText.value && !showPlaceholderAnimation.value) {
    showPlaceholderAnimation.value = true
    setTimeout(() => {
      showPlaceholderAnimation.value = false
    }, 2000)
  }
}

const handlePaste = async (event: ClipboardEvent) => {
  const files = await handleFilePaste(event)
  if (files.length > 0) {
    attachments.value.push(...files.map(file => ({
      id: Date.now().toString() + Math.random(),
      ...file
    })))
  }
}

const handleFocus = () => {
  isFocused.value = true
  emit('focus')
}

const handleBlur = () => {
  isFocused.value = false
  emit('blur')
}

const handleSend = () => {
  if (!canSend.value) return
  
  const message = inputText.value.trim()
  const messageAttachments = [...attachments.value]
  
  // Clear input
  inputText.value = ''
  attachments.value = []
  
  // Show success animation
  showSendSuccess.value = true
  setTimeout(() => {
    showSendSuccess.value = false
  }, 1000)
  
  // Reset textarea height
  nextTick(() => {
    autoResize()
  })
  
  emit('send', message, messageAttachments)
}

const autoResize = () => {
  if (!textareaRef.value) return
  
  textareaRef.value.style.height = 'auto'
  const newHeight = Math.min(textareaRef.value.scrollHeight, 120)
  textareaRef.value.style.height = newHeight + 'px'
}

// File handling
const selectFiles = async () => {
  const files = await selectFilesUtil()
  attachments.value.push(...files.map(file => ({
    id: Date.now().toString() + Math.random(),
    ...file
  })))
}

const removeAttachment = (index: number) => {
  attachments.value.splice(index, 1)
}

const attachmentItemClasses = (attachment: Attachment) => ({
  'attachment-uploading': attachment.status === 'uploading',
  'attachment-error': attachment.status === 'error'
})

// Drag and drop
const handleDragOver = (event: DragEvent) => {
  isDragOver.value = true
  event.dataTransfer!.dropEffect = 'copy'
}

const handleDragLeave = () => {
  isDragOver.value = false
}

const handleDrop = async (event: DragEvent) => {
  isDragOver.value = false
  const files = Array.from(event.dataTransfer?.files || [])
  
  for (const file of files) {
    const attachment: Attachment = {
      id: Date.now().toString() + Math.random(),
      name: file.name,
      type: file.type.startsWith('image/') ? 'image' : 'file',
      size: file.size,
      status: 'uploading',
      progress: 0
    }
    
    attachments.value.push(attachment)
    
    // Simulate upload progress
    const reader = new FileReader()
    reader.onload = (e) => {
      attachment.data = e.target?.result as string
      attachment.status = 'ready'
    }
    
    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file)
    } else {
      reader.readAsText(file)
    }
    
    // Simulate progress
    for (let i = 0; i <= 100; i += 20) {
      setTimeout(() => {
        attachment.progress = i
      }, i * 10)
    }
  }
}

// Voice input
const toggleVoiceInput = () => {
  if (isRecording.value) {
    stopVoiceInput()
  } else {
    startVoiceInput()
  }
}

const startVoiceInput = async () => {
  await startRecording()
  emit('voice-start')
}

const stopVoiceInput = async () => {
  const finalTranscript = await stopRecording()
  if (finalTranscript) {
    inputText.value += (inputText.value ? ' ' : '') + finalTranscript
    autoResize()
  }
  emit('voice-end', finalTranscript || '')
}

// Image preview
const previewImage = (attachment: Attachment) => {
  previewImageSrc.value = attachment.data || ''
  showImagePreview.value = true
}

const closeImagePreview = () => {
  showImagePreview.value = false
  previewImageSrc.value = ''
}

// Utility functions
const getModelIcon = (model: string) => {
  if (model.includes('gpt')) return '🤖'
  if (model.includes('claude')) return '🧠'
  if (model.includes('gemini')) return '⭐'
  return '🤖'
}

// Lifecycle
onMounted(() => {
  if (props.autoFocus) {
    nextTick(() => {
      textareaRef.value?.focus()
    })
  }
})

// Watchers
watch(transcript, (newValue) => {
  if (newValue && isRecording.value) {
    // Live transcript update during recording
  }
})
</script>

<style scoped>
.enhanced-chat-input {
  position: relative;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.dark .enhanced-chat-input {
  background: rgba(17, 24, 39, 0.95);
  border-top-color: rgba(255, 255, 255, 0.1);
}

/* Input Container */
.input-container {
  max-width: 4rem;
  margin: 0 auto;
  padding: 1rem;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.container-focused {
  transform: translateY(-2px);
}

.container-drag-over {
  background: rgba(59, 130, 246, 0.05);
  border-radius: 1rem;
}

.container-mobile {
  padding: 0.75rem;
}

/* Drop Zone Overlay */
.drop-zone-overlay {
  position: absolute;
  inset: 0;
  background: rgba(59, 130, 246, 0.1);
  border: 2px dashed rgb(59, 130, 246);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.drop-zone-content {
  text-align: center;
  color: rgb(59, 130, 246);
}

.drop-zone-icon {
  width: 3rem;
  height: 3rem;
  margin: 0 auto 0.5rem;
}

.drop-zone-text h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.drop-zone-text p {
  font-size: 0.875rem;
  opacity: 0.8;
}

/* Attachments Preview */
.attachments-preview {
  margin-bottom: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 0.75rem;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.dark .attachments-preview {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.05);
}

.attachments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.75rem;
}

.attachment-item {
  position: relative;
  border-radius: 0.5rem;
  overflow: hidden;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.dark .attachment-item {
  background: rgba(31, 41, 55, 0.8);
  border-color: rgba(255, 255, 255, 0.1);
}

.attachment-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Image Preview */
.image-preview {
  position: relative;
  aspect-ratio: 1;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-actions {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.attachment-item:hover .image-actions {
  opacity: 1;
}

.image-action-btn {
  width: 1.5rem;
  height: 1.5rem;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.image-action-btn:hover {
  background: rgba(0, 0, 0, 0.8);
  transform: scale(1.1);
}

.image-action-btn.danger:hover {
  background: rgb(239, 68, 68);
}

/* File Preview */
.file-preview {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
}

.file-icon {
  flex-shrink: 0;
  color: rgb(107, 114, 128);
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(17, 24, 39);
  truncate;
}

.dark .file-name {
  color: rgb(243, 244, 246);
}

.file-size {
  font-size: 0.75rem;
  color: rgb(107, 114, 128);
}

.file-remove-btn {
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  background: none;
  border: none;
  color: rgb(107, 114, 128);
  cursor: pointer;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
}

.file-remove-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: rgb(239, 68, 68);
}

/* Upload Progress */
.upload-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(0, 0, 0, 0.1);
}

.progress-bar {
  height: 100%;
  background: rgb(59, 130, 246);
  transition: width 0.3s ease;
}

/* Input Wrapper */
.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid transparent;
  border-radius: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dark .input-wrapper {
  background: rgba(31, 41, 55, 0.8);
}

.container-focused .input-wrapper {
  border-color: rgb(59, 130, 246);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Input Actions */
.input-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border: none;
  border-radius: 0.75rem;
  background: transparent;
  color: rgb(107, 114, 128);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.action-button:hover {
  background: rgba(0, 0, 0, 0.05);
  color: rgb(59, 130, 246);
  transform: scale(1.05);
}

.dark .action-button:hover {
  background: rgba(255, 255, 255, 0.05);
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Voice Button States */
.voice-btn.active {
  background: rgb(239, 68, 68);
  color: white;
}

.voice-btn.active:hover {
  background: rgb(220, 38, 38);
}

.recording-indicator {
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  border: 2px solid currentColor;
}

.recording-pulse {
  position: absolute;
  inset: -4px;
  border-radius: inherit;
  border: 2px solid currentColor;
  opacity: 0.6;
  animation: recordingPulse 1.5s infinite;
}

@keyframes recordingPulse {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }
  100% {
    transform: scale(1.2);
    opacity: 0;
  }
}

/* Text Input */
.text-input-container {
  flex: 1;
  position: relative;
}

.text-input {
  width: 100%;
  min-height: 1.5rem;
  max-height: 8rem;
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  color: rgb(17, 24, 39);
  font-size: 1rem;
  line-height: 1.5;
  resize: none;
  overflow-y: auto;
}

.dark .text-input {
  color: rgb(243, 244, 246);
}

.text-input::placeholder {
  color: rgb(156, 163, 175);
}

.text-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Input Enhancements */
.input-enhancements {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  pointer-events: none;
}

.placeholder-animation {
  display: flex;
  align-items: center;
  height: 1.5rem;
  color: rgb(156, 163, 175);
}

.typing-cursor {
  animation: cursorBlink 1s infinite;
}

@keyframes cursorBlink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.voice-transcript {
  padding: 0.5rem 0;
  color: rgb(59, 130, 246);
  font-style: italic;
}

.transcript-cursor {
  animation: cursorBlink 1s infinite;
}

/* Character Count */
.char-count {
  font-size: 0.75rem;
  color: rgb(107, 114, 128);
  white-space: nowrap;
}

.char-count-warning {
  color: rgb(245, 158, 11);
}

.char-count-error {
  color: rgb(239, 68, 68);
}

/* Send Button */
.send-btn {
  position: relative;
}

.send-btn-ready {
  background: rgb(59, 130, 246);
  color: white;
}

.send-btn-ready:hover {
  background: rgb(37, 99, 235);
  transform: scale(1.05);
}

.send-btn-disabled {
  background: rgb(229, 231, 235);
  color: rgb(156, 163, 175);
  cursor: not-allowed;
}

.dark .send-btn-disabled {
  background: rgb(55, 65, 81);
  color: rgb(107, 114, 128);
}

.send-success {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(34, 197, 94);
  color: white;
  border-radius: inherit;
  animation: successPulse 0.5s ease-out;
}

@keyframes successPulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

/* Voice Interface */
.voice-interface {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.75rem;
  padding: 1rem;
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 0.75rem;
}

.voice-visualizer {
  flex-shrink: 0;
}

.voice-bars {
  display: flex;
  align-items: flex-end;
  gap: 0.125rem;
  height: 2rem;
}

.voice-bar {
  width: 0.25rem;
  background: rgb(239, 68, 68);
  border-radius: 0.125rem;
  animation: voiceBar 1s infinite ease-in-out;
}

@keyframes voiceBar {
  0%, 100% {
    height: 0.5rem;
  }
  50% {
    height: 2rem;
  }
}

.voice-content {
  flex: 1;
}

.voice-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: rgb(239, 68, 68);
  margin-bottom: 0.25rem;
}

.voice-hint {
  font-size: 0.875rem;
  color: rgb(107, 114, 128);
}

.voice-stop-btn {
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  background: rgb(239, 68, 68);
  color: white;
  border: none;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.voice-stop-btn:hover {
  background: rgb(220, 38, 38);
  transform: scale(1.05);
}

/* Quick Actions */
.quick-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.dark .quick-actions {
  border-top-color: rgba(255, 255, 255, 0.05);
}

.keyboard-shortcuts {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: rgb(107, 114, 128);
}

.container-mobile .keyboard-shortcuts {
  display: none;
}

.shortcut kbd {
  display: inline-block;
  padding: 0.125rem 0.25rem;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 0.25rem;
  font-family: ui-monospace, monospace;
  font-size: 0.6875rem;
  margin-right: 0.25rem;
}

.dark .shortcut kbd {
  background: rgba(255, 255, 255, 0.1);
}

.model-indicator {
  display: flex;
  align-items: center;
}

.model-badge {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  background: rgba(59, 130, 246, 0.1);
  color: rgb(59, 130, 246);
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.model-icon {
  font-size: 0.875rem;
}

/* Image Preview Modal */
.image-preview-modal {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
}

.modal-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
}

.modal-close {
  position: absolute;
  top: -2.5rem;
  right: 0;
  width: 2rem;
  height: 2rem;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  color: rgb(17, 24, 39);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: white;
  transform: scale(1.1);
}

.preview-modal-image {
  max-width: 100%;
  max-height: 100%;
  border-radius: 0.5rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

/* Transitions */
.drop-zone-fade-enter-active,
.drop-zone-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.drop-zone-fade-enter-from,
.drop-zone-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.attachments-slide-enter-active,
.attachments-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.attachments-slide-enter-from,
.attachments-slide-leave-to {
  opacity: 0;
  transform: translateY(-1rem);
}

.voice-interface-slide-enter-active,
.voice-interface-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.voice-interface-slide-enter-from,
.voice-interface-slide-leave-to {
  opacity: 0;
  transform: translateY(1rem) scale(0.9);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-content,
.modal-fade-leave-to .modal-content {
  transform: scale(0.9);
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .input-wrapper {
    border: 2px solid currentColor;
  }
  
  .action-button {
    border: 1px solid currentColor;
  }
}
</style>