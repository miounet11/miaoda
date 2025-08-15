<template>
  <div class="attachments-preview mb-4">
    <!-- Enhanced Drag and Drop Zone -->
    <div 
      v-if="attachments.length === 0 && showDropZone"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      class="drag-drop-zone relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200"
      :class="dragDropClasses"
    >
      <div class="drag-drop-content">
        <div class="w-12 h-12 mx-auto mb-3 opacity-50">
          <ImageIcon :size="48" class="text-muted-foreground" />
        </div>
        <p class="text-sm text-muted-foreground mb-2">
          拖拽图片到此处，或者 <span class="text-primary hover:underline cursor-pointer" @click="$emit('select-files')">点击选择</span>
        </p>
        <p class="text-xs text-muted-foreground opacity-75">
          支持 JPG、PNG、WebP 格式，最大 10MB
        </p>
      </div>
    </div>

    <!-- Enhanced Attachments Grid -->
    <div v-if="attachments.length > 0" class="attachments-grid">
      <div class="flex flex-wrap gap-3">
        <div
          v-for="(attachment, index) in attachments"
          :key="attachment.id"
          class="attachment-item relative group animate-in"
          :style="{ animationDelay: `${index * 50}ms` }"
        >
          <!-- Enhanced Image Attachment -->
          <div v-if="attachment.type === 'image'" class="image-attachment relative">
            <!-- Loading State -->
            <div 
              v-if="attachment.status === 'uploading'"
              class="upload-progress absolute inset-0 bg-black/60 rounded-lg flex flex-col items-center justify-center z-10"
            >
              <div class="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mb-2" />
              <span class="text-xs text-white font-medium">上传中...</span>
              <div class="w-full max-w-[60px] h-1 bg-white/30 rounded-full mt-2 overflow-hidden">
                <div 
                  class="h-full bg-white transition-all duration-300" 
                  :style="{ width: `${attachment.uploadProgress || 0}%` }"
                />
              </div>
            </div>

            <!-- AI Processing State -->
            <div 
              v-if="attachment.status === 'processing'"
              class="processing-overlay absolute inset-0 bg-primary/80 rounded-lg flex flex-col items-center justify-center z-10"
            >
              <div class="processing-icon mb-2">
                <Sparkles :size="20" class="text-white animate-pulse" />
              </div>
              <span class="text-xs text-white font-medium">AI分析中...</span>
              <div class="mt-1 flex space-x-1">
                <div class="w-1 h-1 bg-white rounded-full animate-bounce" style="animation-delay: 0s" />
                <div class="w-1 h-1 bg-white rounded-full animate-bounce" style="animation-delay: 0.1s" />
                <div class="w-1 h-1 bg-white rounded-full animate-bounce" style="animation-delay: 0.2s" />
              </div>
            </div>

            <!-- Error State -->
            <div 
              v-if="attachment.status === 'error'"
              class="error-overlay absolute inset-0 bg-red-500/80 rounded-lg flex flex-col items-center justify-center z-10"
            >
              <AlertCircle :size="20" class="text-white mb-1" />
              <span class="text-xs text-white font-medium text-center px-1">{{ attachment.error || '上传失败' }}</span>
              <button 
                @click="$emit('retry', attachment.id)"
                class="mt-2 px-2 py-1 bg-white/20 text-white text-xs rounded hover:bg-white/30 transition-colors"
              >
                重试
              </button>
            </div>

            <!-- Enhanced Image Display -->
            <img
              :src="attachment.data"
              :alt="attachment.name"
              class="attachment-image h-24 w-24 object-cover rounded-lg border border-border transition-all duration-200 cursor-pointer"
              :class="{
                'opacity-50': attachment.status === 'uploading' || attachment.status === 'processing',
                'opacity-70 grayscale': attachment.status === 'error',
                'hover:scale-105 hover:shadow-lg': attachment.status === 'ready' || !attachment.status
              }"
              @load="onImageLoad(attachment)"
              @error="onImageError(attachment)"
              @click="openImagePreview(attachment)"
            >

            <!-- Enhanced Hover Overlay -->
            <div class="attachment-overlay absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200">
              <div class="absolute bottom-2 left-2 right-2">
                <div class="text-xs text-white font-medium truncate mb-1">
                  {{ attachment.name }}
                </div>
                <div class="flex items-center justify-between text-xs text-white/80">
                  <span>{{ formatFileSize(attachment.size) }}</span>
                  <span v-if="isVisionCapable(attachment)" class="flex items-center gap-1">
                    <Eye :size="10" />
                    AI可识别
                  </span>
                </div>
              </div>
              
              <!-- Action Buttons -->
              <div class="absolute top-1 right-1 flex gap-1">
                <button
                  @click.stop="openImagePreview(attachment)"
                  class="action-btn p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                  title="预览图片"
                >
                  <Maximize2 :size="12" />
                </button>
                <button
                  @click.stop="$emit('remove', attachment.id)"
                  class="action-btn p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-colors"
                  title="删除图片"
                >
                  <X :size="12" />
                </button>
              </div>
            </div>

            <!-- Vision Capability Badge -->
            <div 
              v-if="isVisionCapable(attachment) && (attachment.status === 'ready' || !attachment.status)"
              class="vision-badge absolute top-2 left-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full font-medium shadow-sm flex items-center gap-1"
            >
              <Eye :size="10" />
              AI可识别
            </div>

            <!-- Provider Support Indicator -->
            <div 
              v-if="!isCurrentProviderVisionCapable && (attachment.status === 'ready' || !attachment.status)"
              class="provider-warning absolute top-2 left-2 px-2 py-1 bg-yellow-500 text-white text-xs rounded-full font-medium shadow-sm flex items-center gap-1"
              title="当前LLM提供商不支持图片分析"
            >
              <AlertTriangle :size="10" />
              需切换模型
            </div>
          </div>
        
          <!-- File Attachment -->
          <div v-else class="file-attachment flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border border-border">
            <div class="file-icon">
              <FileText v-if="attachment.type === 'text'" :size="16" class="text-blue-500" />
              <File v-else :size="16" class="text-gray-500" />
            </div>
          
            <div class="file-info flex-1 min-w-0">
              <div class="file-name text-sm font-medium truncate">{{ attachment.name }}</div>
              <div v-if="attachment.size" class="file-size text-xs text-muted-foreground">
                {{ formatFileSize(attachment.size) }}
              </div>
            </div>
          
            <button
              @click="$emit('remove', attachment.id)"
              class="remove-btn p-1 hover:bg-background rounded transition-colors text-muted-foreground hover:text-foreground"
              title="Remove attachment"
            >
              <X :size="12" />
            </button>
          </div>
        </div>
      </div>
    
      <!-- Upload Progress (if needed) -->
      <div v-if="uploadProgress.length > 0" class="upload-progress mt-2 space-y-1">
        <div
          v-for="progress in uploadProgress"
          :key="progress.id"
          class="progress-item flex items-center gap-2 text-sm"
        >
          <div class="progress-bar flex-1 h-1 bg-muted rounded-full overflow-hidden">
            <div
              class="progress-fill h-full bg-primary transition-all duration-300"
              :style="{ width: `${progress.progress}%` }"
            />
          </div>
          <span class="progress-text text-xs text-muted-foreground">{{ progress.progress }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  X, FileText, File, ImageIcon, Eye, Maximize2, 
  AlertCircle, Sparkles, AlertTriangle 
} from 'lucide-vue-next'
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

interface UploadProgress {
  id: string
  progress: number
}

interface Props {
  attachments: Attachment[]
  uploadProgress?: UploadProgress[]
  showDropZone?: boolean
  currentProvider?: string
}

const props = withDefaults(defineProps<Props>(), {
  uploadProgress: () => [],
  showDropZone: false,
  currentProvider: 'openai'
})

const emit = defineEmits<{
  remove: [id: string]
  retry: [id: string]
  'select-files': []
  'image-preview': [attachment: Attachment]
  drop: [event: DragEvent]
}>()

// Store
const settingsStore = useSettingsStore()

// Drag and drop state
const isDragging = ref(false)
const dragCounter = ref(0)

// Vision-capable providers
const visionCapableProviders = ['openai', 'anthropic', 'google']
const visionCapableModels = {
  openai: ['gpt-4o', 'gpt-4-vision-preview', 'gpt-4-turbo'],
  anthropic: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307', 'claude-3-5-sonnet-20241022'],
  google: ['gemini-pro-vision', 'gemini-1.5-pro', 'gemini-1.5-flash']
}

// Computed properties
const dragDropClasses = computed(() => ({
  'border-primary bg-primary/5': isDragging.value,
  'border-muted-foreground/30 hover:border-primary/50': !isDragging.value
}))

const isCurrentProviderVisionCapable = computed(() => {
  const currentProvider = settingsStore.llmProvider
  const currentModel = settingsStore.modelName
  
  if (!visionCapableProviders.includes(currentProvider)) {
    return false
  }
  
  if (visionCapableModels[currentProvider as keyof typeof visionCapableModels]) {
    return visionCapableModels[currentProvider as keyof typeof visionCapableModels].some(model => 
      currentModel.includes(model) || model.includes(currentModel)
    )
  }
  
  return false
})

// Format file size for display
const formatFileSize = (bytes: number = 0): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// Check if attachment is vision-capable
const isVisionCapable = (attachment: Attachment): boolean => {
  if (attachment.type !== 'image') return false
  
  const supportedFormats = ['jpeg', 'jpg', 'png', 'webp', 'gif']
  const fileExtension = attachment.name.split('.').pop()?.toLowerCase()
  
  return supportedFormats.includes(fileExtension || '')
}

// Drag and drop handlers
const handleDragEnter = (e: DragEvent) => {
  e.preventDefault()
  dragCounter.value++
  isDragging.value = true
}

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault()
  dragCounter.value--
  if (dragCounter.value === 0) {
    isDragging.value = false
  }
}

const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false
  dragCounter.value = 0
  emit('drop', e)
}

// Image event handlers
const onImageLoad = (attachment: Attachment) => {
  // Optionally update attachment status
  console.log('Image loaded:', attachment.name)
}

const onImageError = (attachment: Attachment) => {
  console.error('Failed to load image:', attachment.name)
  // Emit error event if needed
}

const openImagePreview = (attachment: Attachment) => {
  if (attachment.status === 'ready' || !attachment.status) {
    emit('image-preview', attachment)
  }
}
</script>

<style scoped>
/* Enhanced drag and drop zone */
.drag-drop-zone {
  background: linear-gradient(135deg, rgba(var(--background), 0.8), rgba(var(--muted), 0.2));
  backdrop-filter: blur(10px);
}

.drag-drop-zone.border-primary {
  animation: dragPulse 2s ease-in-out infinite;
}

@keyframes dragPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(var(--primary-rgb), 0.4);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(var(--primary-rgb), 0.1);
  }
}

/* Enhanced attachment animations */
.attachments-preview {
  animation: slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-15px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes animate-in {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.animate-in {
  animation: animate-in 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

/* Enhanced image attachment styles */
.image-attachment {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(var(--muted), 0.1);
}

.attachment-image {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
}

.attachment-image:hover {
  border-color: rgba(var(--primary), 0.3);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* Processing states */
.upload-progress, .processing-overlay, .error-overlay {
  backdrop-filter: blur(8px);
  border-radius: inherit;
}

.processing-icon {
  animation: processingPulse 1.5s ease-in-out infinite;
}

@keyframes processingPulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

/* Status badges */
.vision-badge, .provider-warning {
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  animation: badgeSlideIn 0.3s ease-out;
}

@keyframes badgeSlideIn {
  from {
    opacity: 0;
    transform: translateX(-10px) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

/* Action buttons */
.action-btn {
  transition: all 0.2s ease;
  backdrop-filter: blur(8px);
}

.action-btn:hover {
  transform: scale(1.1);
}

.action-btn:active {
  transform: scale(0.95);
}

/* File attachment styles */
.file-attachment {
  min-width: 200px;
  transition: all 0.2s ease;
}

.file-attachment:hover {
  background: var(--accent);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Remove button styles */
.remove-btn {
  transition: all 0.2s ease;
}

.remove-btn:hover {
  transform: scale(1.1);
}

/* Progress bar animation */
.progress-fill {
  background: linear-gradient(90deg, var(--primary), var(--primary-light));
}

/* Drag and drop styles (for future enhancement) */
.attachment-item.dragging {
  opacity: 0.5;
  transform: rotate(5deg);
}

/* Loading state */
.attachment-item.loading::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: inherit;
}

.attachment-item.loading::after {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%23666' d='M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z' opacity='.25'/%3E%3Cpath fill='%23666' d='M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z'%3E%3CanimateTransform attributeName='transform' dur='0.75s' repeatCount='indefinite' type='rotate' values='0 12 12;360 12 12'/%3E%3C/path%3E%3C/svg%3E");
  background-size: 24px 24px;
  background-repeat: no-repeat;
  background-position: center;
}

/* Responsive design */
@media (max-width: 640px) {
  .file-attachment {
    min-width: auto;
    flex: 1;
  }
  
  .attachments-preview .flex {
    flex-direction: column;
  }
  
  .image-attachment {
    align-self: flex-start;
  }
}

/* Theme variables */
:root {
  --border: hsl(214, 32%, 91%);
  --muted: hsl(210, 20%, 96%);
  --muted-foreground: hsl(215, 20%, 45%);
  --background: hsl(0, 0%, 100%);
  --foreground: hsl(222, 47%, 11%);
  --accent: hsl(210, 20%, 98%);
  --primary: hsl(221, 83%, 53%);
  --primary-light: hsl(221, 83%, 63%);
}

:root[data-theme="dark"] {
  --border: hsl(215, 20%, 25%);
  --muted: hsl(217, 33%, 17%);
  --muted-foreground: hsl(215, 20%, 65%);
  --background: hsl(222, 47%, 11%);
  --foreground: hsl(210, 20%, 98%);
  --accent: hsl(217, 33%, 15%);
  --primary: hsl(221, 83%, 65%);
  --primary-light: hsl(221, 83%, 75%);
}
</style>