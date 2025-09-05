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
        <div
          class="relative w-full h-full max-w-7xl max-h-screen p-4 flex flex-col animate-modal-content"
        >
          <!-- Enhanced Header with Glass Morphism -->
          <div class="flex items-center justify-between mb-4 z-10 animate-header-slide">
            <!-- Enhanced Image Info -->
            <div class="flex items-center gap-3 text-white">
              <div
                class="p-2 bg-white/10 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-all duration-300 hover:scale-105"
              >
                <ImageIcon :size="20" class="animate-icon-float" />
              </div>
              <div class="animate-info-appear">
                <h3 class="font-semibold text-lg animate-title-glow">{{ attachment.name }}</h3>
                <div class="text-sm text-white/70 flex items-center gap-2 animate-details-fade">
                  <span>{{ formatFileSize(attachment.size) }}</span>
                  <span v-if="imageInfo.width && imageInfo.height" class="animate-dimensions-slide">
                    • {{ imageInfo.width }} × {{ imageInfo.height }}
                  </span>
                  <span
                    v-if="isAICapable"
                    class="flex items-center gap-1 text-green-400 animate-ai-badge"
                  >
                    <Eye :size="12" class="animate-eye-sparkle" />
                    AI 可识别
                  </span>
                </div>
              </div>
            </div>

            <!-- Enhanced Actions with Morphing Buttons -->
            <div class="flex items-center gap-2 animate-actions-slide">
              <!-- Enhanced Zoom Controls -->
              <div
                class="flex items-center gap-1 bg-white/10 rounded-lg p-1 backdrop-blur-sm hover:bg-white/20 transition-all duration-300"
              >
                <button
                  @click="zoomOut"
                  :disabled="scale <= minScale"
                  class="zoom-btn p-2 hover:bg-white/10 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-110 active:scale-95"
                  title="缩小 (-)"
                  aria-label="按钮"
                >
                  <ZoomOut :size="16" class="transition-transform duration-200" />
                </button>

                <div
                  class="px-3 py-2 text-sm text-white/90 font-mono min-w-[60px] text-center animate-zoom-value"
                >
                  {{ Math.round(scale * 100) }}%
                </div>

                <button @click="zoomIn" :disabled="scale">
                  = maxScale" class="zoom-btn p-2 hover:bg-white/10 rounded text-white
                  disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                  hover:scale-110 active:scale-95" title="放大 (+)" >
                  <ZoomIn :size="16" class="transition-transform duration-200" />
                </button>
              </div>

              <!-- Enhanced Action Buttons with Hover Effects -->
              <button
                @click="resetZoom"
                class="action-btn p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95"
                title="重置缩放 (0)"
                aria-label="按钮"
              >
                <RotateCcw :size="16" class="animate-reset-spin" />
              </button>

              <button
                @click="fitToScreen"
                class="action-btn p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95"
                title="适应屏幕 (F)"
                aria-label="按钮"
              >
                <Maximize :size="16" class="animate-fit-pulse" />
              </button>

              <button
                @click="downloadImage"
                class="action-btn p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95"
                title="下载图片 (D)"
                aria-label="按钮"
              >
                <Download :size="16" class="animate-download-bounce" />
              </button>

              <button
                @click="close"
                class="action-btn p-2 bg-white/10 hover:bg-red-500/20 rounded-lg text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95"
                title="关闭 (Esc)"
                aria-label="按钮"
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
                  <div
                    class="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"
                  />
                  <div
                    class="absolute inset-0 w-8 h-8 border-2 border-white/30 rounded-full animate-ping"
                  />
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
                  aria-label="按钮"
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
                <span class="font-mono"
                  >{{ Math.round(translateX) }}, {{ Math.round(translateY) }}</span
                >
                <span class="opacity-50">|</span>
                <span class="opacity-70">缩放:</span>
                <span class="font-mono text-primary">{{ Math.round(scale * 100) }}%</span>
              </div>
            </div>
          </div>

          <!-- Enhanced Footer Info with Animations -->
          <div
            class="flex items-center justify-between mt-4 text-sm text-white/70 animate-footer-slide"
          >
            <div class="flex items-center gap-4">
              <span class="flex items-center gap-1 animate-hint-float">
                <span class="w-2 h-2 bg-white/50 rounded-full animate-hint-dot" />
                按住拖拽移动
              </span>
              <span
                class="flex items-center gap-1 animate-hint-float"
                style="animation-delay: 0.1s"
              >
                <span
                  class="w-2 h-2 bg-white/50 rounded-full animate-hint-dot"
                  style="animation-delay: 0.1s"
                />
                滚轮缩放
              </span>
              <span
                class="flex items-center gap-1 animate-hint-float"
                style="animation-delay: 0.2s"
              >
                <span
                  class="w-2 h-2 bg-white/50 rounded-full animate-hint-dot"
                  style="animation-delay: 0.2s"
                />
                双击适应屏幕
              </span>
            </div>
            <div class="flex items-center gap-2 animate-kbd-bounce">
              <kbd
                class="px-2 py-1 bg-white/10 rounded text-xs border border-white/20 hover:bg-white/20 transition-colors"
              >
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
            aria-label="按钮"
          >
            <ChevronLeft :size="24" class="animate-nav-arrow-left" />
          </button>
        </div>

        <div
          v-if="showNavigation && totalImages > 1"
          class="absolute right-4 top-1/2 -translate-y-1/2 z-10 animate-nav-slide-right"
        >
          <button @click="nextImage" :disabled="currentIndex">
            = totalImages - 1" class="nav-btn p-3 bg-black/30 hover:bg-black/50 backdrop-blur-sm
            rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all
            duration-300 hover:scale-110 active:scale-95" title="下一张 (→)" >
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
            <div class="w-px h-4 bg-white/30 mx-2" />
            <div class="flex gap-1">
              <div
                v-for="i in Math.min(totalImages, 5)"
                :key="i"
                class="w-1.5 h-1.5 rounded-full transition-all duration-300"
                :class="i - 1 === currentIndex ? 'bg-primary scale-125' : 'bg-white/40 scale-100'"
              />
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
  X,
  ImageIcon,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize,
  Download,
  AlertCircle,
  ChevronLeft,
  ChevronRight
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
watch(
  () => props.attachment,
  newAttachment => {
    if (newAttachment) {
      isLoading.value = true
      hasError.value = false
      resetZoom()
    }
  },
  { immediate: true }
)

// Focus management
watch(
  () => props.isVisible,
  visible => {
    if (visible) {
      nextTick(() => {
        modalRef.value?.focus()
      })
    }
  }
)

// Cleanup
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
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
.container-sm {
  max-width: var(--breakpoint-sm);
}
.container-md {
  max-width: var(--breakpoint-md);
}
.container-lg {
  max-width: var(--breakpoint-lg);
}
.container-xl {
  max-width: var(--breakpoint-xl);
}

/* 响应式显示 */
.hidden-sm {
  display: none;
}
.hidden-md {
  display: none;
}
.hidden-lg {
  display: none;
}

@media (min-width: 640px) {
  .hidden-sm {
    display: block;
  }
}

@media (min-width: 768px) {
  .hidden-md {
    display: block;
  }
}

@media (min-width: 1024px) {
  .hidden-lg {
    display: block;
  }
}

/* 响应式文本 */
.text-responsive-sm {
  font-size: clamp(0.875rem, 2vw, 1rem);
}
.text-responsive-base {
  font-size: clamp(1rem, 2.5vw, 1.125rem);
}
.text-responsive-lg {
  font-size: clamp(1.125rem, 3vw, 1.25rem);
}
.text-responsive-xl {
  font-size: clamp(1.25rem, 3.5vw, 1.5rem);
}

/* 响应式间距 */
.space-responsive-sm {
  gap: clamp(0.5rem, 2vw, 1rem);
}
.space-responsive-md {
  gap: clamp(1rem, 3vw, 1.5rem);
}
.space-responsive-lg {
  gap: clamp(1.5rem, 4vw, 2rem);
}

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
  .flex-col-mobile {
    flex-direction: column;
  }
  .grid-1-mobile {
    grid-template-columns: 1fr;
  }
  .gap-2-mobile {
    gap: var(--space-2);
  }
  .p-4-mobile {
    padding: var(--space-4);
  }
}

@media (max-width: 768px) {
  .flex-col-tablet {
    flex-direction: column;
  }
  .grid-2-tablet {
    grid-template-columns: repeat(2, 1fr);
  }
  .gap-4-tablet {
    gap: var(--space-4);
  }
  .p-6-tablet {
    padding: var(--space-6);
  }
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

.grid-cols-2 {
  grid-template-columns: repeat(2, 1fr);
}
.grid-cols-3 {
  grid-template-columns: repeat(3, 1fr);
}
.grid-cols-4 {
  grid-template-columns: repeat(4, 1fr);
}

.grid-gap-2 {
  gap: var(--space-2);
}
.grid-gap-4 {
  gap: var(--space-4);
}
.grid-gap-6 {
  gap: var(--space-6);
}

/* 🎨 卡片布局 */
.card {
  background: white;
  border-radius: 12px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.06);
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.card:hover {
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.1),
    0 2px 4px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.card-interactive:hover {
  cursor: pointer;
  transform: translateY(-2px);
  box-shadow:
    0 10px 25px rgba(0, 0, 0, 0.15),
    0 4px 10px rgba(0, 0, 0, 0.1);
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

  .hidden-mobile {
    display: none;
  }
  .flex-mobile-col {
    flex-direction: column;
  }
  .grid-mobile-1 {
    grid-template-columns: 1fr;
  }
}

/* 🎨 完整间距系统 - 基于4px网格 */
:root {
  --space-0: 0;
  --space-1: 0.25rem; /* 4px */
  --space-2: 0.5rem; /* 8px */
  --space-3: 0.75rem; /* 12px */
  --space-4: 1rem; /* 16px */
  --space-5: 1.25rem; /* 20px */
  --space-6: 1.5rem; /* 24px */
  --space-8: 2rem; /* 32px */
  --space-10: 2.5rem; /* 40px */
  --space-12: 3rem; /* 48px */
  --space-16: 4rem; /* 64px */
  --space-20: 5rem; /* 80px */
  --space-24: 6rem; /* 96px */
  --space-32: 8rem; /* 128px */

  /* 负间距 */
  --space-neg-1: -0.25rem;
  --space-neg-2: -0.5rem;
  --space-neg-4: -1rem;
}

/* 🎨 间距实用类 */
.m-1 {
  margin: var(--space-1);
}
.m-2 {
  margin: var(--space-2);
}
.m-3 {
  margin: var(--space-3);
}
.m-4 {
  margin: var(--space-4);
}
.m-6 {
  margin: var(--space-6);
}
.m-8 {
  margin: var(--space-8);
}

.p-1 {
  padding: var(--space-1);
}
.p-2 {
  padding: var(--space-2);
}
.p-3 {
  padding: var(--space-3);
}
.p-4 {
  padding: var(--space-4);
}
.p-6 {
  padding: var(--space-6);
}
.p-8 {
  padding: var(--space-8);
}

.mx-auto {
  margin-left: auto;
  margin-right: auto;
}
.my-auto {
  margin-top: auto;
  margin-bottom: auto;
}

.px-1 {
  padding-left: var(--space-1);
  padding-right: var(--space-1);
}
.px-2 {
  padding-left: var(--space-2);
  padding-right: var(--space-2);
}
.px-3 {
  padding-left: var(--space-3);
  padding-right: var(--space-3);
}
.px-4 {
  padding-left: var(--space-4);
  padding-right: var(--space-4);
}
.px-6 {
  padding-left: var(--space-6);
  padding-right: var(--space-6);
}

.py-1 {
  padding-top: var(--space-1);
  padding-bottom: var(--space-1);
}
.py-2 {
  padding-top: var(--space-2);
  padding-bottom: var(--space-2);
}
.py-3 {
  padding-top: var(--space-3);
  padding-bottom: var(--space-3);
}
.py-4 {
  padding-top: var(--space-4);
  padding-bottom: var(--space-4);
}
.py-6 {
  padding-top: var(--space-6);
  padding-bottom: var(--space-6);
}

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

.stack-sm > * + * {
  margin-top: var(--space-2);
}
.stack-md > * + * {
  margin-top: var(--space-4);
}
.stack-lg > * + * {
  margin-top: var(--space-6);
}
.stack-xl > * + * {
  margin-top: var(--space-8);
}

.inline-sm > * + * {
  margin-left: var(--space-2);
}
.inline-md > * + * {
  margin-left: var(--space-4);
}
.inline-lg > * + * {
  margin-left: var(--space-6);
}

/* 🎨 完整字体系统 */
:root {
  /* 字体族 */
  --font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', 'Source Code Pro', monospace;

  /* 字体大小 - 基于1.25的倍数比例 */
  --font-size-xs: 0.75rem; /* 12px */
  --font-size-sm: 0.875rem; /* 14px */
  --font-size-base: 1rem; /* 16px */
  --font-size-lg: 1.125rem; /* 18px */
  --font-size-xl: 1.25rem; /* 20px */
  --font-size-2xl: 1.5rem; /* 24px */
  --font-size-3xl: 1.875rem; /* 30px */
  --font-size-4xl: 2.25rem; /* 36px */
  --font-size-5xl: 3rem; /* 48px */

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
.font-sans {
  font-family: var(--font-family-sans);
}
.font-mono {
  font-family: var(--font-family-mono);
}

.text-xs {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-tight);
}
.text-sm {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-snug);
}
.text-base {
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
}
.text-lg {
  font-size: var(--font-size-lg);
  line-height: var(--line-height-relaxed);
}
.text-xl {
  font-size: var(--font-size-xl);
  line-height: var(--line-height-relaxed);
}
.text-2xl {
  font-size: var(--font-size-2xl);
  line-height: var(--line-height-loose);
}
.text-3xl {
  font-size: var(--font-size-3xl);
  line-height: var(--line-height-loose);
}

.font-thin {
  font-weight: var(--font-weight-thin);
}
.font-light {
  font-weight: var(--font-weight-light);
}
.font-normal {
  font-weight: var(--font-weight-normal);
}
.font-medium {
  font-weight: var(--font-weight-medium);
}
.font-semibold {
  font-weight: var(--font-weight-semibold);
}
.font-bold {
  font-weight: var(--font-weight-bold);
}

.leading-tight {
  line-height: var(--line-height-tight);
}
.leading-snug {
  line-height: var(--line-height-snug);
}
.leading-normal {
  line-height: var(--line-height-normal);
}
.leading-relaxed {
  line-height: var(--line-height-relaxed);
}

.tracking-tight {
  letter-spacing: var(--letter-spacing-tight);
}
.tracking-normal {
  letter-spacing: var(--letter-spacing-normal);
}
.tracking-wide {
  letter-spacing: var(--letter-spacing-wide);
}

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
.text-primary {
  color: var(--color-primary);
}
.text-success {
  color: var(--color-success);
}
.text-warning {
  color: var(--color-warning);
}
.text-error {
  color: var(--color-error);
}
.text-gray-500 {
  color: var(--color-gray-500);
}
.text-gray-600 {
  color: var(--color-gray-600);
}
.text-gray-700 {
  color: var(--color-gray-700);
}

.bg-primary {
  background-color: var(--color-primary);
}
.bg-primary-hover:hover {
  background-color: var(--color-primary-hover);
}
.bg-success {
  background-color: var(--color-success);
}
.bg-warning {
  background-color: var(--color-warning);
}
.bg-error {
  background-color: var(--color-error);
}

.border-primary {
  border-color: var(--color-primary);
}
.border-success {
  border-color: var(--color-success);
}
.border-error {
  border-color: var(--color-error);
}

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
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-2px) rotate(5deg);
  }
}

@keyframes titleGlow {
  0%,
  100% {
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
  0%,
  100% {
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
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(-360deg);
  }
}

@keyframes fitPulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

@keyframes downloadBounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-2px);
  }
}

@keyframes closeRotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(90deg);
  }
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
  0%,
  100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}

@keyframes errorShake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

@keyframes errorPulse {
  0%,
  100% {
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
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-2px);
  }
}

@keyframes hintDot {
  0%,
  100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

@keyframes kbdBounce {
  0%,
  100% {
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
  0%,
  100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(-3px);
  }
}

@keyframes navArrowRight {
  0%,
  100% {
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
  0%,
  100% {
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
.image-preview-modal /* 通用选择器 - 已优化 */
/* 通用选择器 - 已优化 */
* {
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
}
</style>
