<template>
  <Teleport to="body">
    <Transition name="modal" appear>
      <div
        v-if="isVisible"
        class="image-preview-modal fixed inset-0 z-[9999] flex items-center justify-center p-4"
        @click="closeModal"
      >
        <!-- Modal Backdrop -->
        <div class="modal-backdrop absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
        
        <!-- Modal Content -->
        <div
          class="modal-content relative max-w-5xl max-h-full w-full flex flex-col bg-background rounded-2xl shadow-2xl overflow-hidden"
          @click.stop
        >
          <!-- Header -->
          <div class="modal-header flex items-center justify-between p-4 border-b border-border/50 bg-background/95 backdrop-blur">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <ImageIcon :size="20" class="text-primary" />
              </div>
              <div>
                <h3 class="font-semibold text-lg">{{ image?.name }}</h3>
                <p class="text-sm text-muted-foreground">
                  {{ formatFileSize(image?.size) }} • {{ imageFormat }}
                  <span v-if="imageDimensions" class="ml-2">{{ imageDimensions.width }}×{{ imageDimensions.height }}</span>
                </p>
              </div>
            </div>
            
            <div class="flex items-center gap-2">
              <!-- Vision Capability Badge -->
              <div 
                v-if="isVisionCapable"
                class="vision-badge px-3 py-1.5 bg-green-500 text-white text-sm rounded-full font-medium flex items-center gap-2"
              >
                <Eye :size="14" />
                AI可识别
              </div>
              
              <!-- Provider Warning -->
              <div 
                v-if="!isCurrentProviderVisionCapable && isVisionCapable"
                class="provider-warning px-3 py-1.5 bg-yellow-500 text-white text-sm rounded-full font-medium flex items-center gap-2"
                title="当前LLM提供商不支持图片分析"
              >
                <AlertTriangle :size="14" />
                需切换模型
              </div>
              
              <!-- Action Buttons -->
              <button
                @click="downloadImage"
                class="action-btn p-2 hover:bg-muted rounded-xl transition-colors"
                title="下载图片"
              >
                <Download :size="18" />
              </button>
              
              <button
                @click="closeModal"
                class="action-btn p-2 hover:bg-muted rounded-xl transition-colors"
                title="关闭"
              >
                <X :size="18" />
              </button>
            </div>
          </div>
          
          <!-- Image Container -->
          <div class="modal-body flex-1 flex items-center justify-center p-4 min-h-0 bg-muted/20">
            <div class="image-container relative max-w-full max-h-full">
              <img
                ref="imageElement"
                :src="image?.data"
                :alt="image?.name"
                class="modal-image max-w-full max-h-full object-contain rounded-lg shadow-lg"
                :class="imageClasses"
                @load="onImageLoad"
                @error="onImageError"
                :style="imageStyles"
              />
              
              <!-- Loading State -->
              <div 
                v-if="isLoading"
                class="loading-overlay absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center"
              >
                <div class="text-white text-center">
                  <div class="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p class="text-sm">加载中...</p>
                </div>
              </div>
              
              <!-- Error State -->
              <div 
                v-if="hasError"
                class="error-overlay absolute inset-0 bg-red-500/20 rounded-lg flex items-center justify-center"
              >
                <div class="text-center">
                  <AlertCircle :size="48" class="text-red-500 mx-auto mb-2" />
                  <p class="text-red-700 dark:text-red-300">图片加载失败</p>
                </div>
              </div>
              
              <!-- Zoom Controls (if zoomable) -->
              <div 
                v-if="isZoomable && !isLoading && !hasError"
                class="zoom-controls absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/70 backdrop-blur text-white rounded-full px-3 py-2"
              >
                <button
                  @click="zoomOut"
                  :disabled="zoomLevel <= 0.5"
                  class="zoom-btn p-1 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
                >
                  <ZoomOut :size="16" />
                </button>
                
                <span class="text-sm font-medium min-w-[3rem] text-center">{{ Math.round(zoomLevel * 100) }}%</span>
                
                <button
                  @click="zoomIn"
                  :disabled="zoomLevel >= 3"
                  class="zoom-btn p-1 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
                >
                  <ZoomIn :size="16" />
                </button>
                
                <div class="w-px h-4 bg-white/30 mx-1"></div>
                
                <button
                  @click="resetZoom"
                  class="zoom-btn p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <RotateCcw :size="16" />
                </button>
              </div>
            </div>
          </div>
          
          <!-- Footer with Additional Info -->
          <div 
            v-if="showInfo"
            class="modal-footer p-4 border-t border-border/50 bg-muted/30"
          >
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span class="text-muted-foreground">文件格式:</span>
                <span class="ml-2 font-medium">{{ imageFormat }}</span>
              </div>
              <div v-if="imageDimensions">
                <span class="text-muted-foreground">尺寸:</span>
                <span class="ml-2 font-medium">{{ imageDimensions.width }}×{{ imageDimensions.height }}</span>
              </div>
              <div>
                <span class="text-muted-foreground">文件大小:</span>
                <span class="ml-2 font-medium">{{ formatFileSize(image?.size) }}</span>
              </div>
            </div>
            
            <div 
              v-if="!isCurrentProviderVisionCapable && isVisionCapable"
              class="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-3"
            >
              <AlertTriangle :size="16" class="text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p class="text-sm font-medium text-yellow-700 dark:text-yellow-300">当前模型不支持图片分析</p>
                <p class="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  请切换到支持视觉能力的模型，如 GPT-4o、Claude 3.5 Sonnet 或 Gemini 1.5 Pro
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import {
  X, ImageIcon, Eye, AlertTriangle, Download, AlertCircle,
  ZoomIn, ZoomOut, RotateCcw
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
}

interface Props {
  isVisible: boolean
  image: Attachment | null
  showInfo?: boolean
  isZoomable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showInfo: true,
  isZoomable: true
})

const emit = defineEmits<{
  close: []
}>()

// Store
const settingsStore = useSettingsStore()

// State
const imageElement = ref<HTMLImageElement>()
const isLoading = ref(false)
const hasError = ref(false)
const zoomLevel = ref(1)
const imageDimensions = ref<{ width: number; height: number } | null>(null)

// Vision-capable providers
const visionCapableProviders = ['openai', 'anthropic', 'google']
const visionCapableModels = {
  openai: ['gpt-4o', 'gpt-4-vision-preview', 'gpt-4-turbo'],
  anthropic: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307', 'claude-3-5-sonnet-20241022'],
  google: ['gemini-pro-vision', 'gemini-1.5-pro', 'gemini-1.5-flash']
}

// Computed properties
const imageFormat = computed(() => {
  if (!props.image?.name) return ''
  const extension = props.image.name.split('.').pop()?.toUpperCase()
  return extension || 'UNKNOWN'
})

const isVisionCapable = computed(() => {
  if (!props.image || props.image.type !== 'image') return false
  
  const supportedFormats = ['jpeg', 'jpg', 'png', 'webp', 'gif']
  const fileExtension = props.image.name.split('.').pop()?.toLowerCase()
  
  return supportedFormats.includes(fileExtension || '')
})

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

const imageClasses = computed(() => ({
  'cursor-zoom-in': props.isZoomable && zoomLevel.value < 3 && !isLoading.value,
  'cursor-zoom-out': props.isZoomable && zoomLevel.value > 1 && !isLoading.value
}))

const imageStyles = computed(() => ({
  transform: `scale(${zoomLevel.value})`,
  transformOrigin: 'center',
  transition: 'transform 0.3s ease'
}))

// Methods
const formatFileSize = (bytes: number = 0): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const closeModal = () => {
  emit('close')
  resetZoom()
}

const onImageLoad = () => {
  isLoading.value = false
  hasError.value = false
  
  if (imageElement.value) {
    imageDimensions.value = {
      width: imageElement.value.naturalWidth,
      height: imageElement.value.naturalHeight
    }
  }
}

const onImageError = () => {
  isLoading.value = false
  hasError.value = true
}

const downloadImage = () => {
  if (!props.image?.data) return
  
  const link = document.createElement('a')
  link.href = props.image.data
  link.download = props.image.name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const zoomIn = () => {
  if (zoomLevel.value < 3) {
    zoomLevel.value = Math.min(3, zoomLevel.value + 0.25)
  }
}

const zoomOut = () => {
  if (zoomLevel.value > 0.5) {
    zoomLevel.value = Math.max(0.5, zoomLevel.value - 0.25)
  }
}

const resetZoom = () => {
  zoomLevel.value = 1
}

// Handle image changes
watch(() => props.image, (newImage) => {
  if (newImage) {
    isLoading.value = true
    hasError.value = false
    imageDimensions.value = null
    resetZoom()
  }
})

// Handle keyboard shortcuts
const handleKeydown = (e: KeyboardEvent) => {
  if (!props.isVisible) return
  
  switch (e.key) {
    case 'Escape':
      closeModal()
      break
    case '+':
    case '=':
      if (props.isZoomable) {
        e.preventDefault()
        zoomIn()
      }
      break
    case '-':
      if (props.isZoomable) {
        e.preventDefault()
        zoomOut()
      }
      break
    case '0':
      if (props.isZoomable) {
        e.preventDefault()
        resetZoom()
      }
      break
  }
}

// Lifecycle
watch(() => props.isVisible, (visible) => {
  if (visible) {
    document.addEventListener('keydown', handleKeydown)
    document.body.style.overflow = 'hidden'
  } else {
    document.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
/* Modal transitions */
.modal-enter-active, .modal-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from, .modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  opacity: 0;
  transform: scale(0.95) translateY(20px);
}

.modal-backdrop {
  animation: backdropFadeIn 0.3s ease;
}

@keyframes backdropFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Image styles */
.modal-image {
  max-height: 70vh;
  transition: transform 0.3s ease;
}

.loading-overlay, .error-overlay {
  backdrop-filter: blur(8px);
}

/* Zoom controls */
.zoom-controls {
  animation: slideUpFade 0.3s ease;
}

@keyframes slideUpFade {
  from {
    opacity: 0;
    transform: translate(-50%, 10px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

.zoom-btn {
  transition: all 0.2s ease;
}

.zoom-btn:hover:not(:disabled) {
  transform: scale(1.1);
}

.zoom-btn:active:not(:disabled) {
  transform: scale(0.95);
}

/* Status badges */
.vision-badge, .provider-warning {
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Action buttons */
.action-btn {
  transition: all 0.2s ease;
}

.action-btn:hover {
  transform: scale(1.05);
}

.action-btn:active {
  transform: scale(0.95);
}

/* Responsive design */
@media (max-width: 640px) {
  .modal-content {
    margin: 1rem;
    max-height: calc(100vh - 2rem);
  }
  
  .modal-header {
    padding: 1rem;
  }
  
  .modal-header h3 {
    font-size: 1rem;
  }
  
  .modal-footer {
    padding: 1rem;
  }
  
  .modal-footer .grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .zoom-controls {
    bottom: 1rem;
    transform: translateX(-50%) scale(0.9);
  }
}

/* Dark mode optimizations */
@media (prefers-color-scheme: dark) {
  .modal-backdrop {
    background: rgba(0, 0, 0, 0.9);
  }
}

/* CSS Variables for theming */
:root {
  --background: hsl(0, 0%, 100%);
  --foreground: hsl(222, 47%, 11%);
  --muted: hsl(210, 20%, 96%);
  --muted-foreground: hsl(215, 20%, 45%);
  --border: hsl(214, 32%, 91%);
  --primary: hsl(221, 83%, 53%);
  --primary-rgb: 59, 130, 246;
}

:root[data-theme="dark"] {
  --background: hsl(222, 47%, 11%);
  --foreground: hsl(210, 20%, 98%);
  --muted: hsl(217, 33%, 17%);
  --muted-foreground: hsl(215, 20%, 65%);
  --border: hsl(215, 20%, 25%);
  --primary: hsl(221, 83%, 65%);
  --primary-rgb: 96, 165, 250;
}
</style>