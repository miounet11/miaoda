<template>
  <Teleport to="body">
    <Transition name="modal" appear>
      <div
        v-if="isVisible"
        class="image-preview-modal fixed inset-0 z-[9999] flex items-center justify-center p-4"
        @click="closeModal"
      >
        <!-- Modal Backdrop -->
        <div class="modal-backdrop absolute inset-0 bg-black/80 backdrop-blur-sm" />

        <!-- Modal Content -->
        <div
          class="modal-content relative max-w-5xl max-h-full w-full flex flex-col bg-background rounded-2xl shadow-2xl overflow-hidden"
          @click.stop
        >
          <!-- Header -->
          <div
            class="modal-header flex items-center justify-between p-4 border-b border-border/50 bg-background/95 backdrop-blur"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <ImageIcon :size="20" class="text-primary" />
              </div>
              <div>
                <h3 class="font-semibold text-lg">{{ image?.name }}</h3>
                <p class="text-sm text-muted-foreground">
                  {{ formatFileSize(image?.size) }} • {{ imageFormat }}
                  <span v-if="imageDimensions" class="ml-2"
                    >{{ imageDimensions.width }}×{{ imageDimensions.height }}</span
                  >
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
               aria-label="按钮">
                <Download :size="18" />
              </button>

              <button
                @click="closeModal"
                class="action-btn p-2 hover:bg-muted rounded-xl transition-colors"
                title="关闭"
               aria-label="按钮">
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
                  <div
                    class="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"
                  />
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
                 aria-label="按钮">
                  <ZoomOut :size="16" />
                </button>

                <span class="text-sm font-medium min-w-[3rem] text-center"
                  >{{ Math.round(zoomLevel * 100) }}%</span
                >

                <button
                  @click="zoomIn"
                  :disabled="zoomLevel >= 3"
                  aria-label="Zoom in"
                  class="zoom-btn p-1 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
                >
                  <ZoomIn :size="16" />
                </button>

                <div class="w-px h-4 bg-white/30 mx-1" />

                <button
                  @click="resetZoom"
                  class="zoom-btn p-1 hover:bg-white/20 rounded-full transition-colors"
                  aria-label="Reset zoom">
                  <RotateCcw :size="16" />
                </button>
              </div>
            </div>
          </div>

          <!-- Footer with Additional Info -->
          <div v-if="showInfo" class="modal-footer p-4 border-t border-border/50 bg-muted/30">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span class="text-muted-foreground">文件格式:</span>
                <span class="ml-2 font-medium">{{ imageFormat }}</span>
              </div>
              <div v-if="imageDimensions">
                <span class="text-muted-foreground">尺寸:</span>
                <span class="ml-2 font-medium"
                  >{{ imageDimensions.width }}×{{ imageDimensions.height }}</span
                >
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
                <p class="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                  当前模型不支持图片分析
                </p>
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
  X,
  ImageIcon,
  Eye,
  AlertTriangle,
  Download,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  RotateCcw
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
  anthropic: [
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
    'claude-3-5-sonnet-20241022'
  ],
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
    return visionCapableModels[currentProvider as keyof typeof visionCapableModels].some(
      model => currentModel.includes(model) || model.includes(currentModel)
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
watch(
  () => props.image,
  newImage => {
    if (newImage) {
      isLoading.value = true
      hasError.value = false
      imageDimensions.value = null
      resetZoom()
    }
  }
)

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
watch(
  () => props.isVisible,
  visible => {
    if (visible) {
      document.addEventListener('keydown', handleKeydown)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', handleKeydown)
      document.body.style.overflow = ''
    }
  }
)
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
/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from,
.modal-leave-to {
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
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Image styles */
.modal-image {
  max-height: 70vh;
  transition: transform 0.3s ease;
}

.loading-overlay,
.error-overlay {
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
.vision-badge,
.provider-warning {
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

:root[data-theme='dark'] {
  --background: hsl(222, 47%, 11%);
  --foreground: hsl(210, 20%, 98%);
  --muted: hsl(217, 33%, 17%);
  --muted-foreground: hsl(215, 20%, 65%);
  --border: hsl(215, 20%, 25%);
  --primary: hsl(221, 83%, 65%);
  --primary-rgb: 96, 165, 250;
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
