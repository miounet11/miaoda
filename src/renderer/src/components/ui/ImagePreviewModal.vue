<template>
  <Teleport to="body">
    <Transition name="modal-enhanced" appear>
      <div
        v-if="isVisible && attachment"
        class="image-preview-modal fixed inset-0 z-[10000] flex items-center justify-center"
        @click="handleBackdropClick"
        @keydown="handleKeydown"
        tabindex="-1"
        ref="modalRef"
      >
        <!-- Enhanced Backdrop with Blur Animation -->
        <div class="absolute inset-0 bg-black/90 backdrop-blur-md transition-all duration-500" />
        
        <!-- Enhanced Modal Content with Smooth Animations -->
        <div class="relative w-full h-full max-w-7xl max-h-screen p-4 flex flex-col animate-modal-content">
          <!-- Enhanced Header with Glass Morphism -->
          <div class="flex items-center justify-between mb-4 z-10 animate-header-slide">
            <!-- Enhanced Image Info -->
            <div class="flex items-center gap-3 text-white">
              <div class="p-2 bg-white/10 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-all duration-300 hover:scale-105">
                <ImageIcon :size="20" class="animate-icon-float" />
              </div>
              <div class="animate-info-appear">
                <h3 class="font-semibold text-lg animate-title-glow">{{ attachment.name }}</h3>
                <div class="text-sm text-white/70 flex items-center gap-2 animate-details-fade">
                  <span>{{ formatFileSize(attachment.size) }}</span>
                  <span v-if="imageInfo.width && imageInfo.height" class="animate-dimensions-slide">
                    • {{ imageInfo.width }} × {{ imageInfo.height }}
                  </span>
                  <span v-if="isAICapable" class="flex items-center gap-1 text-green-400 animate-ai-badge">
                    <Eye :size="12" class="animate-eye-sparkle" />
                    AI 可识别
                  </span>
                </div>
              </div>
            </div>
            
            <!-- Enhanced Actions with Morphing Buttons -->
            <div class="flex items-center gap-2 animate-actions-slide">
              <!-- Enhanced Zoom Controls -->
              <div class="flex items-center gap-1 bg-white/10 rounded-lg p-1 backdrop-blur-sm hover:bg-white/20 transition-all duration-300">
                <button
                  @click="zoomOut"
                  :disabled="scale <= minScale"
                  class="zoom-btn p-2 hover:bg-white/10 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-110 active:scale-95"
                  title="缩小 (-)"
                >
                  <ZoomOut :size="16" class="transition-transform duration-200" />
                </button>
                
                <div class="px-3 py-2 text-sm text-white/90 font-mono min-w-[60px] text-center animate-zoom-value">
                  {{ Math.round(scale * 100) }}%
                </div>
                
                <button
                  @click="zoomIn"
                  :disabled="scale >= maxScale"
                  class="zoom-btn p-2 hover:bg-white/10 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-110 active:scale-95"
                  title="放大 (+)"
                >
                  <ZoomIn :size="16" class="transition-transform duration-200" />
                </button>
              </div>
              
              <!-- Enhanced Action Buttons with Hover Effects -->
              <button
                @click="resetZoom"
                class="action-btn p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95"
                title="重置缩放 (0)"
              >
                <RotateCcw :size="16" class="animate-reset-spin" />
              </button>
              
              <button
                @click="fitToScreen"
                class="action-btn p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95"
                title="适应屏幕 (F)"
              >
                <Maximize :size="16" class="animate-fit-pulse" />
              </button>
              
              <button
                @click="downloadImage"
                class="action-btn p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95"
                title="下载图片 (D)"
              >
                <Download :size="16" class="animate-download-bounce" />
              </button>
              
              <button
                @click="close"
                class="action-btn p-2 bg-white/10 hover:bg-red-500/20 rounded-lg text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95"
                title="关闭 (Esc)"
              >
                <X :size="16" class="animate-close-rotate" />
              </button>
            </div>
          </div>
          
          <!-- Enhanced Image Container with Advanced Interactions -->
          <div
            ref="imageContainerRef"
            class="flex-1 flex items-center justify-center relative overflow-hidden rounded-xl bg-black/20 backdrop-blur-sm border border-white/10 animate-container-appear"
            @wheel.prevent="handleWheel"
            @mousedown="handleMouseDown"
            @mousemove="handleMouseMove"
            @mouseup="handleMouseUp"
            @mouseleave="handleMouseLeave"
            @dblclick="handleDoubleClick"
            :style="{ cursor: getCursor() }"
          >
            <!-- Enhanced Loading State -->
            <div 
              v-if="isLoading"
              class="absolute inset-0 flex items-center justify-center animate-loading-fade"
            >
              <div class="flex flex-col items-center gap-3 text-white">
                <div class="relative">
                  <div class="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <div class="absolute inset-0 w-8 h-8 border-2 border-white/30 rounded-full animate-ping" />
                </div>
                <span class="text-sm animate-loading-text">加载中...</span>
              </div>
            </div>
            
            <!-- Enhanced Error State -->
            <div
              v-else-if="hasError"
              class="absolute inset-0 flex items-center justify-center animate-error-shake"
            >
              <div class="flex flex-col items-center gap-3 text-white">
                <AlertCircle :size="48" class="opacity-50 animate-error-pulse" />
                <span class="text-sm animate-error-text">图片加载失败</span>
                <button
                  @click="retryLoad"
                  class="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  重试
                </button>
              </div>
            </div>
            
            <!-- Enhanced Main Image with Smooth Transform -->
            <img
              v-else
              ref="imageRef"
              :src="attachment.data"
              :alt="attachment.name"
              class="max-w-none transition-all duration-300 ease-out select-none image-main"
              :class="{
                'animate-image-appear': true,
                'image-zoomed': scale > 1,
                'image-fitted': scale < 1
              }"
              :style="{
                transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
                transformOrigin: 'center center',
                filter: `brightness(${isPanning ? 1.1 : 1}) contrast(${scale > 2 ? 1.1 : 1})`
              }"
              @load="onImageLoad"
              @error="onImageError"
              @dragstart.prevent
            />
            
            <!-- Enhanced Image Info Overlay -->
            <div
              v-if="scale > 1"
              class="absolute bottom-4 left-4 px-3 py-2 bg-black/50 backdrop-blur-sm rounded-lg text-white text-sm animate-info-overlay"
            >
              <div class="flex items-center gap-2">
                <span class="opacity-70">位置:</span>
                <span class="font-mono">{{ Math.round(translateX) }}, {{ Math.round(translateY) }}</span>
                <span class="opacity-50">|</span>
                <span class="opacity-70">缩放:</span>
                <span class="font-mono text-primary">{{ Math.round(scale * 100) }}%</span>
              </div>
            </div>
          </div>
          
          <!-- Enhanced Footer Info with Animations -->
          <div class="flex items-center justify-between mt-4 text-sm text-white/70 animate-footer-slide">
            <div class="flex items-center gap-4">
              <span class="flex items-center gap-1 animate-hint-float">
                <span class="w-2 h-2 bg-white/50 rounded-full animate-hint-dot"></span>
                按住拖拽移动
              </span>
              <span class="flex items-center gap-1 animate-hint-float" style="animation-delay: 0.1s">
                <span class="w-2 h-2 bg-white/50 rounded-full animate-hint-dot" style="animation-delay: 0.1s"></span>
                滚轮缩放
              </span>
              <span class="flex items-center gap-1 animate-hint-float" style="animation-delay: 0.2s">
                <span class="w-2 h-2 bg-white/50 rounded-full animate-hint-dot" style="animation-delay: 0.2s"></span>
                双击适应屏幕
              </span>
            </div>
            <div class="flex items-center gap-2 animate-kbd-bounce">
              <kbd class="px-2 py-1 bg-white/10 rounded text-xs border border-white/20 hover:bg-white/20 transition-colors">
                Esc
              </kbd>
              <span>关闭</span>
            </div>
          </div>
        </div>
        
        <!-- Enhanced Navigation Hint with Smooth Slides -->
        <div
          v-if="showNavigation && totalImages > 1"
          class="absolute left-4 top-1/2 -translate-y-1/2 z-10 animate-nav-slide-left"
        >
          <button
            @click="previousImage"
            :disabled="currentIndex <= 0"
            class="nav-btn p-3 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-110 active:scale-95"
            title="上一张 (←)"
          >
            <ChevronLeft :size="24" class="animate-nav-arrow-left" />
          </button>
        </div>
        
        <div
          v-if="showNavigation && totalImages > 1"
          class="absolute right-4 top-1/2 -translate-y-1/2 z-10 animate-nav-slide-right"
        >
          <button
            @click="nextImage"
            :disabled="currentIndex >= totalImages - 1"
            class="nav-btn p-3 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-110 active:scale-95"
            title="下一张 (→)"
          >
            <ChevronRight :size="24" class="animate-nav-arrow-right" />
          </button>
        </div>
        
        <!-- Enhanced Image Counter with Morphing Animation -->
        <div
          v-if="totalImages > 1"
          class="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-lg text-white text-sm border border-white/20 animate-counter-bounce"
        >
          <div class="flex items-center gap-2">
            <span class="font-mono text-primary animate-current-glow">{{ currentIndex + 1 }}</span>
            <span class="opacity-60">/</span>
            <span class="font-mono opacity-80">{{ totalImages }}</span>
            <div class="w-px h-4 bg-white/30 mx-2"></div>
            <div class="flex gap-1">
              <div 
                v-for="i in Math.min(totalImages, 5)"
                :key="i"
                class="w-1.5 h-1.5 rounded-full transition-all duration-300"
                :class="i - 1 === currentIndex ? 'bg-primary scale-125' : 'bg-white/40 scale-100'"
              ></div>
              <span v-if="totalImages > 5" class="text-xs opacity-60 ml-1">...</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import {
  X, ImageIcon, Eye, ZoomIn, ZoomOut, RotateCcw, Maximize,
  Download, AlertCircle, ChevronLeft, ChevronRight
} from 'lucide-vue-next'

interface Attachment {
  id: string
  name: string
  type: string
  data?: string
  size?: number
}

interface ImageInfo {
  width: number
  height: number
}

interface Props {
  isVisible: boolean
  attachment?: Attachment
  currentIndex?: number
  totalImages?: number
  showNavigation?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  currentIndex: 0,
  totalImages: 1,
  showNavigation: false
})

const emit = defineEmits<{
  close: []
  previous: []
  next: []
  download: [attachment: Attachment]
}>()

// Refs
const modalRef = ref<HTMLElement>()
const imageRef = ref<HTMLImageElement>()
const imageContainerRef = ref<HTMLElement>()

// State
const isLoading = ref(true)
const hasError = ref(false)
const imageInfo = ref<ImageInfo>({ width: 0, height: 0 })

// Zoom and pan state
const scale = ref(1)
const translateX = ref(0)
const translateY = ref(0)
const minScale = 0.1
const maxScale = 5

// Mouse interaction state
const isPanning = ref(false)
const lastMouseX = ref(0)
const lastMouseY = ref(0)

// Computed
const isAICapable = computed(() => {
  if (!props.attachment) return false
  const supportedFormats = ['jpeg', 'jpg', 'png', 'webp', 'gif']
  const fileExtension = props.attachment.name.split('.').pop()?.toLowerCase()
  return supportedFormats.includes(fileExtension || '')
})

const getCursor = () => {
  if (isPanning.value) return 'grabbing'
  if (scale.value > 1) return 'grab'
  return 'default'
}

// Methods
const formatFileSize = (bytes: number = 0): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const close = () => {
  emit('close')
}

const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === modalRef.value || event.target === imageContainerRef.value) {
    close()
  }
}

const zoomIn = () => {
  const newScale = Math.min(scale.value * 1.5, maxScale)
  scale.value = newScale
}

const zoomOut = () => {
  const newScale = Math.max(scale.value / 1.5, minScale)
  scale.value = newScale
  
  // Reset pan if zoomed out completely
  if (newScale === minScale) {
    translateX.value = 0
    translateY.value = 0
  }
}

const resetZoom = () => {
  scale.value = 1
  translateX.value = 0
  translateY.value = 0
}

const fitToScreen = () => {
  if (!imageRef.value || !imageContainerRef.value) return
  
  const container = imageContainerRef.value.getBoundingClientRect()
  const image = imageRef.value
  
  const containerAspect = container.width / container.height
  const imageAspect = image.naturalWidth / image.naturalHeight
  
  let newScale = 1
  if (imageAspect > containerAspect) {
    // Image is wider than container
    newScale = container.width / image.naturalWidth
  } else {
    // Image is taller than container
    newScale = container.height / image.naturalHeight
  }
  
  scale.value = Math.min(newScale * 0.9, 1) // 90% of fit to leave some margin
  translateX.value = 0
  translateY.value = 0
}

const downloadImage = () => {
  if (props.attachment) {
    emit('download', props.attachment)
  }
}

const handleWheel = (event: WheelEvent) => {
  const delta = -event.deltaY
  const zoomFactor = delta > 0 ? 1.1 : 0.9
  
  const newScale = Math.min(Math.max(scale.value * zoomFactor, minScale), maxScale)
  
  if (newScale !== scale.value) {
    // Zoom towards mouse position
    const rect = imageContainerRef.value?.getBoundingClientRect()
    if (rect) {
      const mouseX = event.clientX - rect.left - rect.width / 2
      const mouseY = event.clientY - rect.top - rect.height / 2
      
      const scaleDelta = newScale / scale.value
      translateX.value = mouseX - (mouseX - translateX.value) * scaleDelta
      translateY.value = mouseY - (mouseY - translateY.value) * scaleDelta
    }
    
    scale.value = newScale
  }
}

const handleMouseDown = (event: MouseEvent) => {
  if (scale.value > 1) {
    isPanning.value = true
    lastMouseX.value = event.clientX
    lastMouseY.value = event.clientY
  }
}

const handleMouseMove = (event: MouseEvent) => {
  if (isPanning.value) {
    const deltaX = event.clientX - lastMouseX.value
    const deltaY = event.clientY - lastMouseY.value
    
    translateX.value += deltaX
    translateY.value += deltaY
    
    lastMouseX.value = event.clientX
    lastMouseY.value = event.clientY
  }
}

const handleMouseUp = () => {
  isPanning.value = false
}

const handleMouseLeave = () => {
  isPanning.value = false
}

const handleDoubleClick = () => {
  if (scale.value === 1) {
    fitToScreen()
  } else {
    resetZoom()
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'Escape':
      close()
      break
    case '+':
    case '=':
      event.preventDefault()
      zoomIn()
      break
    case '-':
      event.preventDefault()
      zoomOut()
      break
    case '0':
      event.preventDefault()
      resetZoom()
      break
    case 'f':
    case 'F':
      event.preventDefault()
      fitToScreen()
      break
    case 'd':
    case 'D':
      event.preventDefault()
      downloadImage()
      break
    case 'ArrowLeft':
      event.preventDefault()
      previousImage()
      break
    case 'ArrowRight':
      event.preventDefault()
      nextImage()
      break
  }
}

const previousImage = () => {
  if (props.currentIndex > 0) {
    emit('previous')
  }
}

const nextImage = () => {
  if (props.currentIndex < props.totalImages - 1) {
    emit('next')
  }
}

const onImageLoad = () => {
  isLoading.value = false
  hasError.value = false
  
  if (imageRef.value) {
    imageInfo.value = {
      width: imageRef.value.naturalWidth,
      height: imageRef.value.naturalHeight
    }
    
    // Auto fit large images
    nextTick(() => {
      fitToScreen()
    })
  }
}

const onImageError = () => {
  isLoading.value = false
  hasError.value = true
}

const retryLoad = () => {
  isLoading.value = true
  hasError.value = false
  
  if (imageRef.value) {
    imageRef.value.src = imageRef.value.src
  }
}

// Reset state when attachment changes
watch(() => props.attachment, (newAttachment) => {
  if (newAttachment) {
    isLoading.value = true
    hasError.value = false
    resetZoom()
  }
}, { immediate: true })

// Focus management
watch(() => props.isVisible, (visible) => {
  if (visible) {
    nextTick(() => {
      modalRef.value?.focus()
    })
  }
})

// Cleanup
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
/* Enhanced Modal Transitions with Smooth Animations */
.modal-enhanced-enter-active,
.modal-enhanced-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enhanced-enter-from,
.modal-enhanced-leave-to {
  opacity: 0;
  backdrop-filter: blur(0px);
}

.modal-enhanced-enter-from .animate-modal-content,
.modal-enhanced-leave-to .animate-modal-content {
  transform: scale(0.9) translateY(30px);
  opacity: 0;
}

.modal-enhanced-enter-to .animate-modal-content,
.modal-enhanced-leave-from .animate-modal-content {
  transform: scale(1) translateY(0);
  opacity: 1;
}

/* Enhanced Animation Keyframes */
@keyframes modalContentAppear {
  0% {
    opacity: 0;
    transform: scale(0.9) translateY(30px) rotateX(10deg);
    filter: blur(2px);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.02) translateY(-5px) rotateX(0deg);
    filter: blur(0.5px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0) rotateX(0deg);
    filter: blur(0);
  }
}

@keyframes headerSlide {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes iconFloat {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-2px) rotate(5deg);
  }
}

@keyframes titleGlow {
  0%, 100% {
    text-shadow: 0 0 0 rgba(255, 255, 255, 0);
  }
  50% {
    text-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
  }
}

@keyframes infoAppear {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes detailsFade {
  from {
    opacity: 0;
  }
  to {
    opacity: 0.7;
  }
}

@keyframes dimensionsSlide {
  from {
    opacity: 0;
    transform: translateX(10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes aiBadge {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes eyeSparkle {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}

/* Animation Classes */
.animate-modal-content {
  animation: modalContentAppear 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.animate-header-slide {
  animation: headerSlide 0.5s ease-out;
}

.animate-icon-float {
  animation: iconFloat 3s ease-in-out infinite;
}

.animate-title-glow {
  animation: titleGlow 2s ease-in-out infinite;
}

.animate-info-appear {
  animation: infoAppear 0.5s ease-out 0.2s both;
}

.animate-details-fade {
  animation: detailsFade 0.5s ease-out 0.4s both;
}

.animate-dimensions-slide {
  animation: dimensionsSlide 0.5s ease-out 0.6s both;
}

.animate-ai-badge {
  animation: aiBadge 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.8s both;
}

.animate-eye-sparkle {
  animation: eyeSparkle 2s ease-in-out infinite;
}

/* Enhanced Action Buttons with Micro-Interactions */
@keyframes actionsSlide {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes zoomValue {
  0% {
    transform: scale(1);
    color: rgba(255, 255, 255, 0.9);
  }
  50% {
    transform: scale(1.05);
    color: rgb(var(--primary-rgb));
  }
  100% {
    transform: scale(1);
    color: rgba(255, 255, 255, 0.9);
  }
}

@keyframes resetSpin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(-360deg); }
}

@keyframes fitPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

@keyframes downloadBounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-2px);
  }
}

@keyframes closeRotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(90deg); }
}

.animate-actions-slide {
  animation: actionsSlide 0.5s ease-out 0.3s both;
}

.animate-zoom-value {
  animation: zoomValue 0.3s ease-out;
}

.zoom-btn:hover .transition-transform {
  transform: scale(1.1);
}

.action-btn {
  position: relative;
  overflow: hidden;
}

.action-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.action-btn:hover::before {
  opacity: 1;
}

.animate-reset-spin:hover {
  animation: resetSpin 0.6s ease-in-out;
}

.animate-fit-pulse:hover {
  animation: fitPulse 0.4s ease-in-out;
}

.animate-download-bounce:hover {
  animation: downloadBounce 0.5s ease-in-out;
}

.animate-close-rotate:hover {
  animation: closeRotate 0.3s ease-in-out;
}

/* Enhanced Image Container and Image Animations */
@keyframes containerAppear {
  from {
    opacity: 0;
    transform: scale(0.95);
    border-color: transparent;
  }
  to {
    opacity: 1;
    transform: scale(1);
    border-color: rgba(255, 255, 255, 0.1);
  }
}

@keyframes loadingFade {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes loadingText {
  0%, 100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}

@keyframes errorShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

@keyframes errorPulse {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

@keyframes errorText {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes imageAppear {
  from {
    opacity: 0;
    transform: scale(0.95);
    filter: blur(2px);
  }
  to {
    opacity: 1;
    transform: scale(1);
    filter: blur(0);
  }
}

.animate-container-appear {
  animation: containerAppear 0.5s ease-out 0.4s both;
}

.animate-loading-fade {
  animation: loadingFade 0.4s ease-out;
}

.animate-loading-text {
  animation: loadingText 1.5s ease-in-out infinite;
}

.animate-error-shake {
  animation: errorShake 0.5s ease-in-out;
}

.animate-error-pulse {
  animation: errorPulse 1s ease-in-out infinite;
}

.animate-error-text {
  animation: errorText 0.5s ease-out;
}

.image-main {
  will-change: transform, filter;
  backface-visibility: hidden;
}

.animate-image-appear {
  animation: imageAppear 0.6s ease-out;
}

.image-zoomed {
  cursor: grab;
}

.image-zoomed:active {
  cursor: grabbing;
}

.image-fitted {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Enhanced Info Overlay and Footer Animations */
@keyframes infoOverlay {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes footerSlide {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes hintFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-2px);
  }
}

@keyframes hintDot {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

@keyframes kbdBounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-1px);
  }
}

.animate-info-overlay {
  animation: infoOverlay 0.4s ease-out;
}

.animate-footer-slide {
  animation: footerSlide 0.6s ease-out 0.5s both;
}

.animate-hint-float {
  animation: hintFloat 3s ease-in-out infinite;
}

.animate-hint-dot {
  animation: hintDot 2s ease-in-out infinite;
}

.animate-kbd-bounce {
  animation: kbdBounce 2s ease-in-out infinite;
}

/* Enhanced Navigation and Counter Animations */
@keyframes navSlideLeft {
  from {
    opacity: 0;
    transform: translateX(-20px) translateY(-50%);
  }
  to {
    opacity: 1;
    transform: translateX(0) translateY(-50%);
  }
}

@keyframes navSlideRight {
  from {
    opacity: 0;
    transform: translateX(20px) translateY(-50%);
  }
  to {
    opacity: 1;
    transform: translateX(0) translateY(-50%);
  }
}

@keyframes navArrowLeft {
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(-3px);
  }
}

@keyframes navArrowRight {
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(3px);
  }
}

@keyframes counterBounce {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(10px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
}

@keyframes currentGlow {
  0%, 100% {
    color: rgb(var(--primary-rgb));
    text-shadow: 0 0 0 rgba(var(--primary-rgb), 0);
  }
  50% {
    color: rgb(var(--primary-rgb));
    text-shadow: 0 0 8px rgba(var(--primary-rgb), 0.4);
  }
}

.animate-nav-slide-left {
  animation: navSlideLeft 0.5s ease-out 0.6s both;
}

.animate-nav-slide-right {
  animation: navSlideRight 0.5s ease-out 0.6s both;
}

.nav-btn {
  position: relative;
  overflow: hidden;
}

.nav-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.nav-btn:hover::before {
  opacity: 1;
}

.animate-nav-arrow-left:hover {
  animation: navArrowLeft 0.6s ease-in-out infinite;
}

.animate-nav-arrow-right:hover {
  animation: navArrowRight 0.6s ease-in-out infinite;
}

.animate-counter-bounce {
  animation: counterBounce 0.5s ease-out 0.7s both;
}

.animate-current-glow {
  animation: currentGlow 2s ease-in-out infinite;
}

/* Enhanced Focus and Accessibility */
.image-preview-modal * {
  user-select: none;
  -webkit-user-select: none;
}

button:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.5);
  outline-offset: 2px;
  animation: focusGlow 0.3s ease-out;
}

@keyframes focusGlow {
  from {
    outline-color: rgba(255, 255, 255, 0.2);
  }
  to {
    outline-color: rgba(255, 255, 255, 0.5);
  }
}

/* High DPI support */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .image-preview-modal img {
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
  }
}

/* Keyboard shortcuts display */
kbd {
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Monaco, Consolas, monospace;
  transition: all 0.2s ease;
}

kbd:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .animate-modal-content,
  .animate-header-slide,
  .animate-icon-float,
  .animate-title-glow,
  .animate-info-appear,
  .animate-details-fade,
  .animate-dimensions-slide,
  .animate-ai-badge,
  .animate-eye-sparkle,
  .animate-actions-slide,
  .animate-zoom-value,
  .animate-reset-spin,
  .animate-fit-pulse,
  .animate-download-bounce,
  .animate-close-rotate,
  .animate-container-appear,
  .animate-loading-fade,
  .animate-loading-text,
  .animate-error-shake,
  .animate-error-pulse,
  .animate-error-text,
  .animate-image-appear,
  .animate-info-overlay,
  .animate-footer-slide,
  .animate-hint-float,
  .animate-hint-dot,
  .animate-kbd-bounce,
  .animate-nav-slide-left,
  .animate-nav-slide-right,
  .animate-nav-arrow-left,
  .animate-nav-arrow-right,
  .animate-counter-bounce,
  .animate-current-glow {
    animation: none !important;
  }
  
  .modal-enhanced-enter-active,
  .modal-enhanced-leave-active {
    transition: opacity 0.2s ease !important;
  }
  
  .image-main {
    transition: transform 0.2s ease !important;
  }
}
</style>