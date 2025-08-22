<template>
  <div class="attachments-preview mb-4">
    <!-- Enhanced Drag and Drop Zone with Morphing Animation -->
    <div 
      v-if="attachments.length === 0 && showDropZone"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      class="drag-drop-zone relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300"
      :class="dragDropClasses"
    >
      <div class="drag-drop-content transition-all duration-300" :class="{ 'scale-110': isDragging }">
        <div class="w-12 h-12 mx-auto mb-3 opacity-50 transition-all duration-300" :class="{ 'animate-bounce-gentle': isDragging }">
          <ImageIcon :size="48" class="text-muted-foreground transition-colors duration-300" :class="{ 'text-primary': isDragging }" />
        </div>
        <p class="text-sm text-muted-foreground mb-2 transition-all duration-300" :class="{ 'text-primary font-medium': isDragging }">
          拖拽图片到此处，或者 <span class="text-primary hover:underline cursor-pointer transition-all duration-200 hover:scale-105" @click="$emit('select-files')">点击选择</span>
        </p>
        <p class="text-xs text-muted-foreground opacity-75 transition-all duration-300" :class="{ 'opacity-100': isDragging }">
          支持图片、文档、音频、视频等多种格式，最大 50MB
        </p>
      </div>
      
      <!-- Floating particles during drag -->
      <div v-if="isDragging" class="absolute inset-0 pointer-events-none">
        <div class="particle particle-1"></div>
        <div class="particle particle-2"></div>
        <div class="particle particle-3"></div>
      </div>
    </div>

    <!-- Enhanced Attachments Grid with Staggered Animation -->
    <div v-if="attachments.length > 0" class="attachments-grid animate-grid-appear">
      <div class="flex flex-wrap gap-3">
        <div
          v-for="(attachment, index) in attachments"
          :key="attachment.id"
          class="attachment-item relative group"
          :class="{
            'animate-attachment-enter': true,
            'animate-attachment-uploading': attachment.status === 'uploading',
            'animate-attachment-processing': attachment.status === 'processing',
            'animate-attachment-error': attachment.status === 'error'
          }"
          :style="{ 
            animationDelay: `${index * 80}ms`,
            '--stagger-index': index
          }"
        >
          <!-- Enhanced Image Attachment -->
          <div v-if="attachment.type === 'image'" class="image-attachment relative">
            <!-- Enhanced Loading State with Ripple Effect -->
            <div 
              v-if="attachment.status === 'uploading'"
              class="upload-progress absolute inset-0 bg-black/60 rounded-lg flex flex-col items-center justify-center z-10"
            >
              <div class="relative">
                <div class="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <div class="absolute inset-0 w-8 h-8 border-2 border-white/30 rounded-full animate-ping" />
              </div>
              <span class="text-xs text-white font-medium mt-2 animate-pulse-text">上传中...</span>
              <div class="w-full max-w-[60px] h-1 bg-white/30 rounded-full mt-2 overflow-hidden">
                <div 
                  class="h-full bg-gradient-to-r from-white via-blue-200 to-white transition-all duration-300 animate-progress-shine" 
                  :style="{ width: `${attachment.uploadProgress || 0}%` }"
                />
              </div>
            </div>

            <!-- Enhanced AI Processing State with Morphing Animation -->
            <div 
              v-if="attachment.status === 'processing'"
              class="processing-overlay absolute inset-0 bg-gradient-to-br from-primary/90 to-primary/70 rounded-lg flex flex-col items-center justify-center z-10"
            >
              <div class="processing-icon mb-2 relative">
                <Sparkles :size="20" class="text-white animate-processing-pulse" />
                <div class="absolute inset-0 animate-processing-glow">
                  <Sparkles :size="20" class="text-white/50" />
                </div>
              </div>
              <span class="text-xs text-white font-medium animate-text-shimmer">AI分析中...</span>
              <div class="mt-1 flex space-x-1">
                <div class="w-1 h-1 bg-white rounded-full animate-processing-dots" style="animation-delay: 0s" />
                <div class="w-1 h-1 bg-white rounded-full animate-processing-dots" style="animation-delay: 0.2s" />
                <div class="w-1 h-1 bg-white rounded-full animate-processing-dots" style="animation-delay: 0.4s" />
              </div>
            </div>

            <!-- Enhanced Error State with Shake Animation -->
            <div 
              v-if="attachment.status === 'error'"
              class="error-overlay absolute inset-0 bg-gradient-to-br from-red-500/90 to-red-600/80 rounded-lg flex flex-col items-center justify-center z-10 animate-error-shake"
            >
              <AlertCircle :size="20" class="text-white mb-1 animate-error-icon" />
              <span class="text-xs text-white font-medium text-center px-1 animate-fade-in-up">{{ attachment.error || '上传失败' }}</span>
              <button 
                @click="$emit('retry', attachment.id)"
                class="mt-2 px-2 py-1 bg-white/20 text-white text-xs rounded hover:bg-white/30 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                重试
              </button>
            </div>

            <!-- Enhanced Image Display with Smooth Transitions -->
            <img
              :src="attachment.data"
              :alt="attachment.name"
              class="attachment-image h-24 w-24 object-cover rounded-lg border border-border transition-all duration-300 cursor-pointer"
              :class="{
                'opacity-50 scale-95': attachment.status === 'uploading' || attachment.status === 'processing',
                'opacity-70 grayscale': attachment.status === 'error',
                'hover:scale-110 hover:shadow-xl hover:z-10 hover:border-primary/50': attachment.status === 'ready' || !attachment.status,
                'transform-gpu': true
              }"
              @load="onImageLoad(attachment)"
              @error="onImageError(attachment)"
              @click="openImagePreview(attachment)"
            >

            <!-- Enhanced Hover Overlay with Glass Morphism -->
            <div class="attachment-overlay absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm">
              <div class="absolute bottom-2 left-2 right-2 animate-slide-up">
                <div class="text-xs text-white font-medium truncate mb-1 animate-text-glow">
                  {{ attachment.name }}
                </div>
                <div class="flex items-center justify-between text-xs text-white/80">
                  <span class="animate-fade-in-delayed">{{ formatFileSize(attachment.size) }}</span>
                  <span v-if="isVisionCapable(attachment)" class="flex items-center gap-1 text-green-300 animate-bounce-subtle">
                    <Eye :size="10" />
                    AI可识别
                  </span>
                </div>
              </div>
              
              <!-- Enhanced Action Buttons with Ripple Effect -->
              <div class="absolute top-1 right-1 flex gap-1 animate-slide-down">
                <button
                  @click.stop="openImagePreview(attachment)"
                  class="action-btn p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ripple-effect"
                  title="预览图片"
                >
                  <Maximize2 :size="12" />
                </button>
                <button
                  @click.stop="$emit('remove', attachment.id)"
                  class="action-btn p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ripple-effect"
                  title="删除图片"
                >
                  <X :size="12" />
                </button>
              </div>
            </div>

            <!-- Enhanced Vision Capability Badge with Glow Effect -->
            <div 
              v-if="isVisionCapable(attachment) && (attachment.status === 'ready' || !attachment.status)"
              class="vision-badge absolute top-2 left-2 px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs rounded-full font-medium shadow-lg flex items-center gap-1 animate-badge-appear"
            >
              <Eye :size="10" class="animate-eye-blink" />
              <span class="animate-text-shimmer">AI可识别</span>
            </div>

            <!-- Enhanced Provider Support Indicator -->
            <div 
              v-if="!isCurrentProviderVisionCapable && (attachment.status === 'ready' || !attachment.status)"
              class="provider-warning absolute top-2 left-2 px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs rounded-full font-medium shadow-lg flex items-center gap-1 animate-warning-pulse"
              title="当前LLM提供商不支持图片分析"
            >
              <AlertTriangle :size="10" class="animate-triangle-wiggle" />
              <span class="animate-text-shimmer">需切换模型</span>
            </div>
          </div>
        
          <!-- Enhanced Video Attachment -->
          <div v-else-if="attachment.type === 'video'" class="video-attachment relative">
            <!-- Video thumbnail/preview -->
            <div class="video-preview h-24 w-32 bg-black rounded-lg overflow-hidden relative cursor-pointer"
                 @click="openFilePreview(attachment)">
              <video 
                v-if="attachment.data"
                :src="attachment.data" 
                class="w-full h-full object-cover"
                preload="metadata"
                muted
              />
              <div class="video-overlay absolute inset-0 bg-black/40 flex items-center justify-center">
                <Play :size="24" class="text-white" />
              </div>
              <div class="duration-badge absolute bottom-1 right-1 px-1 py-0.5 bg-black/70 text-white text-xs rounded">
                {{ formatDuration(attachment.duration) }}
              </div>
            </div>
            
            <!-- Video info -->
            <div class="video-info mt-1">
              <div class="text-xs font-medium truncate">{{ attachment.name }}</div>
              <div class="text-xs text-muted-foreground">{{ formatFileSize(attachment.size) }}</div>
            </div>
            
            <!-- Actions -->
            <div class="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button @click.stop="openFilePreview(attachment)" class="action-btn" title="预览">
                <Play :size="12" />
              </button>
              <button @click.stop="downloadFile(attachment)" class="action-btn" title="下载">
                <Download :size="12" />
              </button>
              <button @click.stop="$emit('remove', attachment.id)" class="action-btn-danger" title="删除">
                <X :size="12" />
              </button>
            </div>
          </div>
          
          <!-- Enhanced Audio Attachment -->
          <div v-else-if="attachment.type === 'audio'" class="audio-attachment relative">
            <div class="audio-preview flex items-center gap-3 p-3 bg-muted/20 rounded-lg border border-border w-64">
              <div class="audio-icon p-2 bg-green-100 dark:bg-green-900 rounded-full">
                <Music :size="20" class="text-green-600 dark:text-green-400" />
              </div>
              <div class="audio-info flex-1 min-w-0">
                <div class="text-sm font-medium truncate">{{ attachment.name }}</div>
                <div class="text-xs text-muted-foreground flex items-center gap-2">
                  <span>{{ formatFileSize(attachment.size) }}</span>
                  <span v-if="attachment.duration">• {{ formatDuration(attachment.duration) }}</span>
                </div>
              </div>
              <button @click="openFilePreview(attachment)" class="play-btn p-2 bg-primary/10 hover:bg-primary/20 rounded-full transition-colors">
                <Play :size="16" class="text-primary" />
              </button>
            </div>
            
            <!-- Actions -->
            <div class="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button @click.stop="downloadFile(attachment)" class="action-btn" title="下载">
                <Download :size="12" />
              </button>
              <button @click.stop="$emit('remove', attachment.id)" class="action-btn-danger" title="删除">
                <X :size="12" />
              </button>
            </div>
          </div>
          
          <!-- Enhanced Document Attachment -->
          <div v-else-if="attachment.type === 'document'" class="document-attachment relative">
            <div class="document-preview flex items-center gap-3 p-3 bg-muted/20 rounded-lg border border-border w-64">
              <div class="document-icon p-2 rounded-full" :class="getDocumentIconClass(attachment)">
                <component :is="getDocumentIcon(attachment)" :size="20" />
              </div>
              <div class="document-info flex-1 min-w-0">
                <div class="text-sm font-medium truncate">{{ attachment.name }}</div>
                <div class="text-xs text-muted-foreground flex items-center gap-2">
                  <span>{{ getFileTypeLabel(attachment) }}</span>
                  <span>• {{ formatFileSize(attachment.size) }}</span>
                </div>
              </div>
              <button @click="openFilePreview(attachment)" class="preview-btn p-2 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full transition-colors">
                <Eye :size="16" class="text-blue-600 dark:text-blue-400" />
              </button>
            </div>
            
            <!-- Actions -->
            <div class="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button @click.stop="downloadFile(attachment)" class="action-btn" title="下载">
                <Download :size="12" />
              </button>
              <button @click.stop="$emit('remove', attachment.id)" class="action-btn-danger" title="删除">
                <X :size="12" />
              </button>
            </div>
          </div>
        
          <!-- Generic File Attachment (Enhanced) -->
          <div v-else class="file-attachment relative">
            <div class="file-preview flex items-center gap-3 p-3 bg-muted/20 rounded-lg border border-border min-w-[200px]">
              <div class="file-icon p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                <component :is="getGenericFileIcon(attachment)" :size="20" class="text-gray-600 dark:text-gray-400" />
              </div>
              <div class="file-info flex-1 min-w-0">
                <div class="text-sm font-medium truncate">{{ attachment.name }}</div>
                <div class="text-xs text-muted-foreground flex items-center gap-2">
                  <span>{{ getFileTypeLabel(attachment) }}</span>
                  <span v-if="attachment.size">• {{ formatFileSize(attachment.size) }}</span>
                </div>
              </div>
            </div>
            
            <!-- Actions -->
            <div class="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button @click.stop="downloadFile(attachment)" class="action-btn" title="下载">
                <Download :size="12" />
              </button>
              <button @click.stop="$emit('remove', attachment.id)" class="action-btn-danger" title="删除">
                <X :size="12" />
              </button>
            </div>
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
  AlertCircle, Sparkles, AlertTriangle, Play, Music,
  Video, FileAudio, FileImage, Archive, Download
} from 'lucide-vue-next'
import { useSettingsStore } from '@renderer/src/stores/settings'

interface Attachment {
  id: string
  name: string
  type: 'image' | 'text' | 'file' | 'video' | 'audio' | 'document' | 'archive'
  data?: string
  content?: string
  size?: number
  status?: 'uploading' | 'processing' | 'ready' | 'error'
  uploadProgress?: number
  error?: string
  mimeType?: string
  duration?: number // for video/audio
  dimensions?: { width: number; height: number } // for images/video
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
  'file-preview': [attachment: Attachment]
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

// Format duration for display (seconds to mm:ss format)
const formatDuration = (seconds: number = 0): string => {
  if (seconds === 0) return '0:00'
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Get file type label
const getFileTypeLabel = (attachment: Attachment): string => {
  const extension = attachment.name.split('.').pop()?.toLowerCase() || ''
  
  const typeMap: Record<string, string> = {
    pdf: 'PDF',
    doc: 'Word',
    docx: 'Word',
    xls: 'Excel',
    xlsx: 'Excel',
    ppt: 'PowerPoint',
    pptx: 'PowerPoint',
    txt: '文本',
    md: 'Markdown',
    json: 'JSON',
    xml: 'XML',
    csv: 'CSV',
    zip: '压缩包',
    rar: '压缩包',
    '7z': '压缩包',
    tar: '压缩包',
    gz: '压缩包'
  }
  
  return typeMap[extension] || extension.toUpperCase()
}

// Get document icon based on file type
const getDocumentIcon = (attachment: Attachment) => {
  const extension = attachment.name.split('.').pop()?.toLowerCase() || ''
  
  if (['pdf'].includes(extension)) return FileText
  if (['doc', 'docx'].includes(extension)) return FileText
  if (['xls', 'xlsx'].includes(extension)) return FileText
  if (['ppt', 'pptx'].includes(extension)) return FileText
  if (['txt', 'md'].includes(extension)) return FileText
  
  return File
}

// Get document icon class
const getDocumentIconClass = (attachment: Attachment): string => {
  const extension = attachment.name.split('.').pop()?.toLowerCase() || ''
  
  if (extension === 'pdf') return 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
  if (['doc', 'docx'].includes(extension)) return 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
  if (['xls', 'xlsx'].includes(extension)) return 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
  if (['ppt', 'pptx'].includes(extension)) return 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400'
  if (['txt', 'md'].includes(extension)) return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
  
  return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
}

// Get generic file icon
const getGenericFileIcon = (attachment: Attachment) => {
  const extension = attachment.name.split('.').pop()?.toLowerCase() || ''
  
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) return Archive
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension)) return FileAudio
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return FileImage
  if (['mp4', 'avi', 'mov', 'wmv'].includes(extension)) return Video
  
  return File
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

const openFilePreview = (attachment: Attachment) => {
  if (attachment.status === 'ready' || !attachment.status) {
    emit('file-preview', attachment)
  }
}

const downloadFile = async (attachment: Attachment) => {
  try {
    if (attachment.data) {
      const link = document.createElement('a')
      link.href = attachment.data
      link.download = attachment.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  } catch (error) {
    console.error('Failed to download file:', error)
  }
}
</script>

<style scoped>
/* Enhanced drag and drop zone with morphing animation */
.drag-drop-zone {
  background: linear-gradient(135deg, rgba(var(--background), 0.8), rgba(var(--muted), 0.2));
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.drag-drop-zone::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(45deg, 
    transparent 25%, 
    rgba(var(--primary-rgb), 0.1) 25%, 
    rgba(var(--primary-rgb), 0.1) 50%, 
    transparent 50%, 
    transparent 75%, 
    rgba(var(--primary-rgb), 0.1) 75%
  );
  background-size: 20px 20px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.drag-drop-zone.border-primary {
  animation: dragPulse 2s ease-in-out infinite;
  border-color: rgb(var(--primary-rgb));
  background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.1), rgba(var(--primary-rgb), 0.05));
}

.drag-drop-zone.border-primary::before {
  opacity: 1;
  animation: backgroundMove 3s linear infinite;
}

@keyframes dragPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(var(--primary-rgb), 0.4), inset 0 0 0 0 rgba(var(--primary-rgb), 0.1);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(var(--primary-rgb), 0.1), inset 0 0 20px rgba(var(--primary-rgb), 0.2);
    transform: scale(1.02);
  }
}

@keyframes backgroundMove {
  0% { background-position: 0 0; }
  100% { background-position: 20px 20px; }
}

/* Floating particles for drag state */
.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(var(--primary-rgb), 0.6);
  border-radius: 50%;
  pointer-events: none;
}

.particle-1 {
  top: 20%;
  left: 20%;
  animation: float1 3s ease-in-out infinite;
}

.particle-2 {
  top: 60%;
  right: 30%;
  animation: float2 4s ease-in-out infinite;
}

.particle-3 {
  bottom: 30%;
  left: 70%;
  animation: float3 3.5s ease-in-out infinite;
}

@keyframes float1 {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.6; }
  50% { transform: translateY(-20px) scale(1.5); opacity: 1; }
}

@keyframes float2 {
  0%, 100% { transform: translateX(0) scale(0.8); opacity: 0.4; }
  50% { transform: translateX(15px) scale(1.2); opacity: 0.8; }
}

@keyframes float3 {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
  50% { transform: translate(-10px, -15px) scale(1.3); opacity: 0.9; }
}

@keyframes bounceGentle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

/* Enhanced attachment animations with staggered entrance */
.attachments-preview {
  animation: slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.attachments-grid {
  animation: gridAppear 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
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

@keyframes gridAppear {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.attachment-item {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  will-change: transform;
}

@keyframes attachmentEnter {
  0% {
    opacity: 0;
    transform: translateY(30px) scale(0.8) rotateX(20deg);
    filter: blur(2px);
  }
  60% {
    opacity: 0.8;
    transform: translateY(-5px) scale(1.05) rotateX(0deg);
    filter: blur(0.5px);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1) rotateX(0deg);
    filter: blur(0);
  }
}

.animate-attachment-enter {
  animation: attachmentEnter 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.animate-attachment-uploading {
  animation: uploadingPulse 2s ease-in-out infinite;
}

.animate-attachment-processing {
  animation: processingGlow 2s ease-in-out infinite;
}

.animate-attachment-error {
  animation: errorShake 0.6s ease-in-out;
}

@keyframes uploadingPulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.3);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.1);
  }
}

@keyframes processingGlow {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(var(--primary-rgb), 0.4);
  }
  50% {
    transform: scale(1.03);
    box-shadow: 0 0 0 12px rgba(var(--primary-rgb), 0.1);
  }
}

@keyframes errorShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px) rotate(-1deg); }
  75% { transform: translateX(4px) rotate(1deg); }
}

/* Enhanced image interactions with hover lift */
.attachment-image {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: center;
  will-change: transform;
}

.attachment-image:hover {
  z-index: 10;
  position: relative;
}

.transform-gpu {
  transform: translateZ(0);
  backface-visibility: hidden;
}

/* Enhanced overlay animations */
.attachment-overlay {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-down {
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

.animate-text-glow {
  animation: textGlow 1.5s ease-in-out infinite alternate;
}

@keyframes textGlow {
  from {
    text-shadow: 0 0 2px rgba(255, 255, 255, 0.3);
  }
  to {
    text-shadow: 0 0 6px rgba(255, 255, 255, 0.6), 0 0 12px rgba(255, 255, 255, 0.3);
  }
}

.animate-fade-in-delayed {
  animation: fadeInDelayed 0.4s ease-out 0.1s both;
}

@keyframes fadeInDelayed {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-bounce-subtle {
  animation: bounceSubtle 2s ease-in-out infinite;
}

@keyframes bounceSubtle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

/* Video preview styles */
.video-preview {
  transition: all 0.3s ease;
}

.video-preview:hover {
  transform: scale(1.02);
}

.video-overlay {
  transition: all 0.3s ease;
}

.video-preview:hover .video-overlay {
  background: rgba(0, 0, 0, 0.6);
}

.duration-badge {
  font-feature-settings: 'tnum';
  backdrop-filter: blur(4px);
}

/* Audio preview styles */
.audio-preview {
  transition: all 0.3s ease;
}

.audio-preview:hover {
  border-color: rgba(var(--primary), 0.3);
}

.play-btn {
  transition: all 0.2s ease;
}

.play-btn:hover {
  transform: scale(1.1);
}

/* Document preview styles */
.document-preview {
  transition: all 0.3s ease;
}

.document-preview:hover {
  border-color: rgba(var(--primary), 0.3);
  background: rgba(var(--accent), 0.8);
}

.preview-btn {
  transition: all 0.2s ease;
}

.preview-btn:hover {
  transform: scale(1.1);
}

/* Enhanced action buttons with ripple effect */
.action-btn {
  transition: all 0.2s ease;
  backdrop-filter: blur(8px);
  position: relative;
  overflow: hidden;
}

.action-btn:hover {
  transform: scale(1.1);
}

.action-btn:active {
  transform: scale(0.95);
}

.ripple-effect {
  position: relative;
  overflow: hidden;
}

.ripple-effect::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.3s ease, height 0.3s ease;
}

.ripple-effect:active::before {
  width: 40px;
  height: 40px;
}

/* Enhanced video, audio, and document styles */
.video-attachment, .audio-attachment, .document-attachment {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(var(--muted), 0.1);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.video-attachment:hover, .audio-attachment:hover, .document-attachment:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
}

/* Enhanced upload and processing states */
.upload-progress, .processing-overlay, .error-overlay {
  backdrop-filter: blur(8px);
  border-radius: inherit;
}

.animate-progress-shine {
  background-size: 200% 100%;
  animation: progressShine 2s linear infinite;
}

@keyframes progressShine {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.animate-pulse-text {
  animation: pulseText 1.5s ease-in-out infinite;
}

@keyframes pulseText {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.animate-processing-pulse {
  animation: processingPulse 1.5s ease-in-out infinite;
}

@keyframes processingPulse {
  0%, 100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
  50% {
    transform: scale(1.1) rotate(180deg);
    opacity: 0.8;
  }
}

.animate-processing-glow {
  animation: processingGlow 2s ease-in-out infinite;
}

@keyframes processingGlow {
  0%, 100% {
    opacity: 0;
    transform: scale(0.8);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.2);
  }
}

.animate-processing-dots {
  animation: processingDots 1.5s ease-in-out infinite;
}

@keyframes processingDots {
  0%, 80%, 100% {
    opacity: 0.3;
    transform: scale(0.8) translateY(0);
  }
  40% {
    opacity: 1;
    transform: scale(1.2) translateY(-3px);
  }
}

.animate-text-shimmer {
  background: linear-gradient(
    90deg,
    currentColor 0%,
    rgba(255, 255, 255, 0.8) 50%,
    currentColor 100%
  );
  background-size: 200% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  animation: textShimmer 2s ease-in-out infinite;
}

@keyframes textShimmer {
  0%, 100% { background-position: -200% 0; }
  50% { background-position: 200% 0; }
}

.animate-error-icon {
  animation: errorIcon 0.5s ease-in-out;
}

@keyframes errorIcon {
  0%, 100% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(1.2) rotate(-10deg); }
  75% { transform: scale(1.2) rotate(10deg); }
}

.animate-fade-in-up {
  animation: fadeInUp 0.4s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Enhanced badge animations */
.animate-badge-appear {
  animation: badgeAppear 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes badgeAppear {
  0% {
    opacity: 0;
    transform: translateX(-20px) scale(0.8);
  }
  60% {
    opacity: 0.8;
    transform: translateX(2px) scale(1.1);
  }
  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

.animate-eye-blink {
  animation: eyeBlink 3s ease-in-out infinite;
}

@keyframes eyeBlink {
  0%, 90%, 100% { transform: scaleY(1); }
  95% { transform: scaleY(0.1); }
}

.animate-warning-pulse {
  animation: warningPulse 2s ease-in-out infinite;
}

@keyframes warningPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(255, 193, 7, 0.1);
  }
}

.animate-triangle-wiggle {
  animation: triangleWiggle 2s ease-in-out infinite;
}

@keyframes triangleWiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-5deg); }
  75% { transform: rotate(5deg); }
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