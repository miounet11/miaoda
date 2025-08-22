<template>
  <div class="message-content" :class="contentClasses">
    <!-- Tool Status (Enhanced only) -->
    <div v-if="toolStatus && (variant === 'enhanced' || variant === 'improved')" class="tool-status mb-2">
      <div class="flex items-center gap-2 text-sm text-muted-foreground">
        <div class="loading-dot" />
        <span>{{ toolStatus.tool }}: {{ toolStatus.action }}</span>
        <div v-if="toolStatus.progress !== undefined" class="ml-auto">
          {{ toolStatus.progress }}%
        </div>
      </div>
      <div v-if="toolStatus.progress !== undefined" class="progress-bar">
        <div class="progress-fill" :style="{ width: toolStatus.progress + '%' }" />
      </div>
    </div>

    <!-- Enhanced Attachments Display with Staggered Animation -->
    <div v-if="showAttachments && attachments?.length > 0" class="attachments mb-4 animate-slide-in-up">
      <AttachmentsPreview
        :attachments="attachments"
        :show-drop-zone="false"
        @image-preview="handleImagePreview"
        @remove="() => {}"
      />
    </div>

    <!-- Thumbnail (thumbnail variant) -->
    <div v-if="variant === 'thumbnail' && thumbnail" class="message-thumbnail mb-3">
      <img 
        :src="thumbnail" 
        :alt="thumbnailAlt"
        class="w-full h-32 object-cover rounded-lg cursor-pointer"
        @click="openImage(thumbnail)"
      >
    </div>
    
    <!-- Enhanced Loading States with Smooth Transitions -->
    <div v-if="isLoading" class="loading-container animate-fade-in">
      <!-- Enhanced loading with skeleton -->
      <div v-if="variant === 'enhanced' || variant === 'improved'" class="message-skeleton animate-pulse-wave">
        <div class="skeleton-line w-3/4 h-4 mb-2 animate-skeleton-shimmer" style="animation-delay: 0ms" />
        <div class="skeleton-line w-1/2 h-4 mb-2 animate-skeleton-shimmer" style="animation-delay: 150ms" />
        <div class="skeleton-line w-2/3 h-4 animate-skeleton-shimmer" style="animation-delay: 300ms" />
      </div>
      
      <!-- Enhanced simple loading indicator -->
      <div v-else class="flex items-center gap-2 animate-bounce-subtle">
        <div class="typing-indicator enhanced-typing">
          <span class="typing-dot" />
          <span class="typing-dot" />
          <span class="typing-dot" />
        </div>
        <span v-if="loadingText" class="text-sm text-muted-foreground animate-text-appear">{{ loadingText }}</span>
      </div>
    </div>
    
    <!-- Enhanced Error State with Gentle Animation -->
    <div v-else-if="error && (variant === 'enhanced' || variant === 'improved')" class="error-container animate-error-shake">
      <div class="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg hover:bg-destructive/15 transition-all duration-300 group">
        <AlertCircle :size="16" class="text-destructive animate-error-pulse" />
        <div class="flex-1">
          <p class="text-sm font-medium text-destructive animate-slide-in-left">{{ error }}</p>
          <p v-if="errorDetails" class="text-xs text-destructive/70 mt-1 animate-slide-in-left" style="animation-delay: 100ms">{{ errorDetails }}</p>
        </div>
        <button
          v-if="showRetry"
          @click="$emit('retry')"
          :disabled="retrying"
          class="px-2 py-1 text-xs bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 disabled:opacity-50 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <span v-if="retrying" class="flex items-center gap-1">
            <div class="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            重试中...
          </span>
          <span v-else>重试</span>
        </button>
      </div>
    </div>
    
    <!-- Enhanced Main Content with Reveal Animation -->
    <div v-else-if="content" ref="contentElement" class="content-wrapper animate-content-reveal">
      <!-- Enhanced Markdown for improved variants -->
      <EnhancedMarkdown
        v-if="variant === 'enhanced' || variant === 'improved'"
        :content="content"
        :render-mode="renderMode"
        :prose="prose"
        :compact="compact"
        @image-click="handleImagePreview"
        class="animate-text-appear"
      />
      
      <!-- Enhanced standard content rendering -->
      <div v-else :class="proseClasses" v-html="renderedContent" class="animate-text-appear" />
    </div>

    <!-- Enhanced Actions with Hover Effects -->
    <div v-if="showActions && (variant === 'enhanced' || variant === 'improved')" class="message-actions mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 animate-slide-in-up">
      <slot name="actions">
        <button @click="$emit('copy')" class="action-btn hover-lift" title="复制">
          <Copy :size="14" />
        </button>
        <button @click="$emit('edit')" class="action-btn hover-lift" title="编辑">
          <Edit :size="14" />
        </button>
        <button @click="$emit('delete')" class="action-btn hover-lift hover-danger" title="删除">
          <Trash2 :size="14" />
        </button>
      </slot>
    </div>

    <!-- Image Preview Modal -->
    <ImagePreviewModal
      v-if="previewImage"
      :images="allImages"
      :current-index="currentImageIndex"
      @close="closeImagePreview"
      @download="downloadCurrentImage"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUpdated, nextTick, PropType } from 'vue'
import { FileText, Copy, Edit, Trash2, Maximize2, Download, X, AlertCircle } from 'lucide-vue-next'
import hljs from 'highlight.js'
import { logger } from '../utils/Logger'
import { renderMarkdownSafely } from '@renderer/src/utils/SafeMarkdownParser'
import AttachmentsPreview from './chat/AttachmentsPreview.vue'
import ImagePreviewModal from './ui/ImagePreviewModal.vue'
import EnhancedMarkdown from './ui/EnhancedMarkdown.vue'

interface Attachment {
  url: string
  name: string
  type: 'image' | 'file' | 'video' | 'audio'
  size?: number
  id?: string
}

interface ToolStatus {
  tool: string
  action: string
  progress?: number
  details?: string
}

const props = defineProps({
  // Core props
  content: {
    type: String,
    default: ''
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  
  // Display modes - supports all variants
  variant: {
    type: String as PropType<'simple' | 'standard' | 'enhanced' | 'improved' | 'thumbnail'>,
    default: 'standard'
  },
  renderMode: {
    type: String as PropType<'markdown' | 'html' | 'text'>,
    default: 'markdown'
  },
  
  // Enhanced features (backwards compatibility)
  enhanced: {
    type: Boolean,
    default: false
  },
  
  // Thumbnail variant props
  withThumbnail: {
    type: Boolean,
    default: false
  },
  thumbnail: String,
  thumbnailAlt: String,
  
  // Attachments
  attachments: {
    type: Array as PropType<Attachment[]>,
    default: () => []
  },
  showAttachments: {
    type: Boolean,
    default: true
  },
  
  // Error handling (improved variant)
  error: String,
  errorDetails: String,
  showRetry: {
    type: Boolean,
    default: true
  },
  retrying: {
    type: Boolean,
    default: false
  },
  
  // Tool status (improved variant)
  toolStatus: {
    type: Object as PropType<ToolStatus>,
    default: null
  },
  
  // UI options
  showActions: {
    type: Boolean,
    default: false
  },
  loadingText: {
    type: String,
    default: 'Loading...'
  },
  typingMessage: {
    type: String,
    default: 'AI is thinking...'
  },
  
  // Styling
  prose: {
    type: Boolean,
    default: true
  },
  compact: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits<{
  copy: []
  edit: []
  delete: []
  retry: []
  imageClick: [url: string]
  imagePreview: [url: string]
}>()

// Refs
const contentElement = ref<HTMLElement>()
const previewImage = ref<string | null>(null)
const currentImageIndex = ref(0)

// Computed properties
const contentClasses = computed(() => ({
  'message-content-simple': props.variant === 'simple',
  'message-content-enhanced': props.variant === 'enhanced' || props.enhanced,
  'message-content-improved': props.variant === 'improved', 
  'message-content-thumbnail': props.variant === 'thumbnail' || props.withThumbnail,
  'message-content-compact': props.compact
}))

const proseClasses = computed(() => {
  const classes = []
  if (props.prose) {
    classes.push('prose', 'prose-sm', 'dark:prose-invert', 'max-w-none')
  }
  if (props.compact) {
    classes.push('prose-compact')
  }
  return classes.join(' ')
})

const imageClasses = computed(() => {
  const classes = ['rounded-lg', 'cursor-pointer', 'transition-all', 'duration-200']
  
  // Different styling per variant
  if (props.variant === 'simple') {
    classes.push('max-w-full', 'hover:opacity-90')
  } else if (props.variant === 'thumbnail') {
    classes.push('w-full', 'h-full', 'object-cover')
  } else {
    classes.push('max-w-full', 'hover:scale-[1.02]', 'hover:shadow-lg')
  }
  
  return classes.join(' ')
})

// Robust content sanitization and validation
const sanitizeContent = (rawContent: any): string => {
  try {
    // Handle null, undefined, or empty values
    if (rawContent === null || rawContent === undefined) {
      return ''
    }
    
    // Handle string content
    if (typeof rawContent === 'string') {
      return rawContent.trim()
    }
    
    // Handle numbers and booleans
    if (typeof rawContent === 'number' || typeof rawContent === 'boolean') {
      return String(rawContent)
    }
    
    // Handle arrays
    if (Array.isArray(rawContent)) {
      return rawContent
        .filter(item => item !== null && item !== undefined)
        .map(item => typeof item === 'string' ? item : String(item))
        .join('\n')
        .trim()
    }
    
    // Handle objects with toString method
    if (typeof rawContent === 'object' && rawContent !== null) {
      if (typeof rawContent.toString === 'function' && rawContent.toString !== Object.prototype.toString) {
        return String(rawContent.toString()).trim()
      }
      // Safely stringify complex objects
      try {
        return JSON.stringify(rawContent, null, 2).trim()
      } catch {
        return '[Complex Object]'
      }
    }
    
    // Final fallback
    return String(rawContent || '').trim()
  } catch (error) {
    logger.error('Content sanitization failed', 'UnifiedMessageContent', { error, rawContent })
    return String(rawContent || '').trim()
  }
}

// Enhanced markdown parsing with bulletproof error handling - using the safe parser
const parseMarkdownSafely = (content: string): string => {
  try {
    // Use the bulletproof safe markdown parser instead of direct marked usage
    return renderMarkdownSafely(content)
  } catch (error) {
    logger.error('Safe markdown parsing failed', 'UnifiedMessageContent', { 
      error: error instanceof Error ? error.message : String(error),
      contentLength: content?.length || 0,
      contentStart: content?.substring(0, 50) || ''
    })
    // Return safely escaped HTML as ultimate fallback
    return escapeHtml(content)
  }
}

// Render content based on mode and variant
const renderedContent = computed(() => {
  try {
    // Sanitize and validate content first
    const sanitizedContent = sanitizeContent(props.content)
    
    // Early return for empty content
    if (!sanitizedContent) {
      return ''
    }
    
    // Handle simple variant
    if (props.variant === 'simple') {
      return escapeHtml(sanitizedContent)
    }
    
    // Handle HTML mode
    if (props.renderMode === 'html') {
      return sanitizedContent
    }
    
    // Handle text mode
    if (props.renderMode === 'text') {
      return escapeHtml(sanitizedContent)
    }
    
    // Default to markdown parsing using the bulletproof safe parser
    return renderMarkdownSafely(props.content)
    
  } catch (error) {
    logger.error('Critical content rendering error', 'UnifiedMessageContent', { 
      error: error instanceof Error ? error.message : String(error),
      contentType: typeof props.content,
      contentPreview: String(props.content || '').substring(0, 100)
    })
    
    // Ultra-safe fallback
    const emergencyContent = String(props.content || 'Content rendering failed')
    return `<div class="error-content p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
      <p class="text-red-800 dark:text-red-200 font-medium">⚠️ Content rendering error</p>
      <details class="mt-2 cursor-pointer">
        <summary class="text-sm text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100 transition-colors">
          显示原始内容 (Click to expand)
        </summary>
        <pre class="text-xs text-red-600 dark:text-red-400 mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded border overflow-auto max-h-40 whitespace-pre-wrap">${escapeHtml(emergencyContent)}</pre>
      </details>
    </div>`
  }
})

// Enhanced HTML escape function with validation
const escapeHtml = (unsafe: any): string => {
  try {
    // Handle non-string inputs safely
    if (unsafe === null || unsafe === undefined) {
      return ''
    }
    
    const safeString = String(unsafe)
    
    return safeString
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
      .replace(/\n/g, "<br>")
  } catch (error) {
    logger.error('HTML escaping failed', 'UnifiedMessageContent', { error, unsafe })
    return '[Content could not be displayed safely]'
  }
}

// Methods
const getAttachmentsGridClass = () => {
  const imageAttachments = props.attachments.filter(a => a.type === 'image')
  const count = imageAttachments.length
  
  if (count === 0) return ''
  if (count === 1) return 'grid-cols-1'
  if (count === 2) return 'grid-cols-2 gap-2'
  if (count >= 3) return 'grid-cols-2 sm:grid-cols-3 gap-2'
  
  return 'grid gap-2'
}

const getDisplayName = (name: string) => {
  if (name.startsWith('pasted-')) {
    return '粘贴的图片'
  }
  
  if (name.length > 30) {
    const ext = name.split('.').pop()
    return name.substring(0, 25) + '...' + (ext ? `.${ext}` : '')
  }
  
  return name
}

const onImageLoad = () => {
  // Handle image load if needed
}

const onImageError = () => {
  // Handle image error if needed
}

// Computed for all images
const allImages = computed(() => {
  const attachmentImages = props.attachments
    .filter(a => a.type === 'image')
    .map(a => ({ url: a.url, name: a.name }))
  
  // Add any images found in content
  // This is a simplified approach - could be enhanced with content parsing
  return attachmentImages
})

const openImage = (url: string) => {
  previewImage.value = url
  const index = allImages.value.findIndex(img => img.url === url)
  currentImageIndex.value = Math.max(0, index)
  emit('imageClick', url)
}

const handleImagePreview = (url: string) => {
  openImage(url)
  emit('imagePreview', url)
}

const closeImagePreview = () => {
  previewImage.value = null
}

const downloadAttachment = async (attachment: Attachment) => {
  try {
    const link = document.createElement('a')
    link.href = attachment.url
    link.download = attachment.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    logger.error('Failed to download attachment', 'UnifiedMessageContent', { 
      error, 
      attachment: attachment.name 
    })
  }
}

const downloadCurrentImage = () => {
  const currentImage = allImages.value[currentImageIndex.value]
  if (currentImage) {
    downloadAttachment({
      url: currentImage.url,
      name: currentImage.name,
      type: 'image'
    })
  }
}

// Setup code copy functionality
const setupCodeCopyButtons = () => {
  if (!contentElement.value) return
  
  const copyButtons = contentElement.value.querySelectorAll('.copy-button')
  
  copyButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      e.preventDefault()
      const btn = e.currentTarget as HTMLElement
      const codeId = btn.getAttribute('data-code-id')
      if (!codeId) return
      
      const codeElement = document.getElementById(codeId)
      if (!codeElement) return
      
      try {
        await navigator.clipboard.writeText(codeElement.textContent || '')
        
        const copyText = btn.querySelector('.copy-text') as HTMLElement
        if (copyText) {
          const originalText = copyText.textContent
          copyText.textContent = '已复制'
          setTimeout(() => {
            copyText.textContent = originalText
          }, 2000)
        }
      } catch (error) {
        logger.error('Failed to copy code', 'UnifiedMessageContent', { error })
      }
    })
  })
}

// Lifecycle - setup code copy buttons when content changes
onMounted(() => {
  nextTick(() => setupCodeCopyButtons())
})

onUpdated(() => {
  nextTick(() => setupCodeCopyButtons())
})
</script>

<style scoped>
/* Enhanced Base component styles with micro-interactions */
.message-content {
  @apply w-full transition-all duration-300 ease-out;
  position: relative;
  /* Fix layout artifacts and prevent UI boxes */
  contain: layout style;
  overflow: visible;
  transform: translateZ(0); /* Force GPU acceleration */
  z-index: 1;
}

.message-content:hover {
  transform: translateY(-1px);
}

/* Fix for content rendering issues */
.message-content,
.message-content * {
  box-sizing: border-box;
  max-width: 100%;
}

/* Remove unexpected outlines and borders */
.message-content,
.message-content * {
  outline: none;
}

/* Enhanced Error Content Styles with Improved Expansion */
.message-content .error-content {
  @apply relative z-10;
  /* Fix layout artifacts */
  contain: layout style;
  overflow: visible;
  box-sizing: border-box;
}

.message-content .error-content details {
  @apply mt-2;
  /* Enhanced details/summary styling */
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 0.375rem;
  overflow: hidden;
  background: rgba(239, 68, 68, 0.02);
  transition: all 0.3s ease;
}

.message-content .error-content details:hover {
  border-color: rgba(239, 68, 68, 0.4);
  background: rgba(239, 68, 68, 0.05);
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.1);
}

.message-content .error-content details[open] {
  border-color: rgba(239, 68, 68, 0.5);
  background: rgba(239, 68, 68, 0.08);
}

.message-content .error-content summary {
  @apply px-3 py-2 font-medium;
  cursor: pointer;
  user-select: none;
  background: rgba(239, 68, 68, 0.05);
  border-bottom: 1px solid rgba(239, 68, 68, 0.1);
  transition: all 0.2s ease;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.message-content .error-content summary:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.message-content .error-content summary::marker {
  display: none;
}

.message-content .error-content summary::after {
  content: '▶';
  font-size: 0.75rem;
  transition: transform 0.2s ease;
  color: currentColor;
  opacity: 0.7;
}

.message-content .error-content details[open] summary::after {
  transform: rotate(90deg);
}

.message-content .error-content pre {
  @apply m-0;
  /* Fix overflow and layout issues */
  overflow-x: auto;
  overflow-y: auto;
  max-height: 12rem;
  line-height: 1.4;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 0.75rem;
  white-space: pre-wrap;
  word-break: break-word;
  /* Ensure proper spacing */
  padding: 0.75rem;
  margin: 0;
  border: none;
  border-radius: 0;
  /* Fix background conflicts */
  background: rgba(239, 68, 68, 0.05) !important;
}

/* Tool Status */
/* Enhanced Tool Status with pulse animation */
.tool-status {
  @apply rounded-lg bg-muted/20 p-3 border border-border/50 animate-slide-in-down;
  animation-duration: 0.4s;
}

.loading-dot {
  @apply w-2 h-2 bg-primary rounded-full;
  animation: loadingPulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes loadingPulse {
  0%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
    box-shadow: 0 0 8px rgba(var(--primary-rgb), 0.4);
  }
}

/* Enhanced progress bar with gradient fill */
.progress-bar {
  @apply w-full h-1 bg-muted rounded-full overflow-hidden mt-2;
  position: relative;
}

.progress-fill {
  @apply h-full transition-all duration-500 ease-out;
  background: linear-gradient(90deg, var(--primary), hsl(var(--primary) / 0.8), var(--primary));
  background-size: 200% 100%;
  animation: progressShimmer 2s linear infinite;
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  right: -10px;
  width: 10px;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
  animation: progressGlow 2s ease-in-out infinite;
}

@keyframes progressShimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes progressGlow {
  0%, 100% { opacity: 0; transform: translateX(-10px); }
  50% { opacity: 1; transform: translateX(10px); }
}

/* Enhanced Attachments with staggered animations */
.attachments-grid {
  @apply grid gap-3;
}

.attachment-item {
  @apply relative overflow-hidden rounded-lg border border-border/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-1;
  animation: attachmentAppear 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.attachment-item:nth-child(1) { animation-delay: 0ms; }
.attachment-item:nth-child(2) { animation-delay: 100ms; }
.attachment-item:nth-child(3) { animation-delay: 200ms; }
.attachment-item:nth-child(4) { animation-delay: 300ms; }
.attachment-item:nth-child(n+5) { animation-delay: 400ms; }

@keyframes attachmentAppear {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.9) rotateX(10deg);
  }
  60% {
    opacity: 0.8;
    transform: translateY(-5px) scale(1.05) rotateX(0deg);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1) rotateX(0deg);
  }
}

.image-attachment {
  @apply relative;
}

.image-overlay {
  @apply absolute inset-0 flex flex-col justify-between pointer-events-none;
}

.image-overlay > * {
  @apply pointer-events-auto;
}

.overlay-btn {
  @apply p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-all;
}

.overlay-btn:hover {
  @apply scale-110;
}

.overlay-btn:active {
  @apply scale-95;
}

.image-name {
  @apply px-1;
}

.file-attachment {
  @apply flex items-center gap-2 p-2 bg-secondary/20 rounded hover:bg-secondary/30 transition-colors;
}

/* Enhanced Loading states with sophisticated animations */
.loading-container {
  @apply py-2;
}

.message-skeleton {
  @apply space-y-2;
}

.skeleton-line {
  @apply bg-muted/30 rounded;
  position: relative;
  overflow: hidden;
}

.skeleton-line::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  animation: skeletonShimmer 1.5s ease-in-out infinite;
}

@keyframes skeletonShimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

.enhanced-typing {
  @apply flex items-center gap-1;
}

.typing-dot {
  @apply w-2 h-2 bg-current rounded-full;
  animation: typingBounce 1.4s ease-in-out infinite;
}

.typing-dot:nth-child(1) { animation-delay: 0ms; }
.typing-dot:nth-child(2) { animation-delay: 160ms; }
.typing-dot:nth-child(3) { animation-delay: 320ms; }

@keyframes typingBounce {
  0%, 60%, 100% {
    opacity: 0.3;
    transform: scale(0.8) translateY(0);
  }
  30% {
    opacity: 1;
    transform: scale(1.2) translateY(-4px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
}

/* Enhanced Error states with gentle animations */
.error-container {
  @apply py-2;
}

/* Enhanced Actions with hover lift effects */
.message-actions {
  @apply transition-all duration-300;
}

.action-btn {
  @apply p-1.5 rounded transition-all duration-200 bg-transparent hover:bg-secondary;
  position: relative;
  overflow: hidden;
}

.action-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(var(--primary-rgb), 0.1);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.3s ease;
}

.action-btn:hover::before {
  width: 40px;
  height: 40px;
}

.hover-lift {
  @apply transition-all duration-200;
}

.hover-lift:hover {
  @apply -translate-y-0.5 shadow-md;
  transform: translateY(-2px) scale(1.05);
}

.hover-lift:active {
  @apply translate-y-0;
  transform: translateY(0) scale(0.95);
  transition-duration: 0.1s;
}

.hover-danger:hover {
  @apply text-destructive;
}

/* Enhanced Animation Keyframes */
@keyframes fadeIn {
  from { 
    opacity: 0;
    transform: translateY(5px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes contentReveal {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
    filter: blur(1px);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

@keyframes textAppear {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes errorShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

@keyframes errorPulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

@keyframes bounceSubtle {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-2px);
  }
}

@keyframes pulseWave {
  0% {
    opacity: 0.6;
    transform: scale(0.95);
  }
  50% {
    opacity: 1;
    transform: scale(1.02);
  }
  100% {
    opacity: 0.6;
    transform: scale(0.95);
  }
}

/* Utility Animation Classes */
.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}

.animate-slide-in-up {
  animation: slideInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-slide-in-down {
  animation: slideInDown 0.3s ease-out;
}

.animate-slide-in-left {
  animation: slideInLeft 0.3s ease-out;
}

.animate-content-reveal {
  animation: contentReveal 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-text-appear {
  animation: textAppear 0.5s ease-out;
}

.animate-error-shake {
  animation: errorShake 0.5s ease-in-out;
}

.animate-error-pulse {
  animation: errorPulse 1s ease-in-out infinite;
}

.animate-bounce-subtle {
  animation: bounceSubtle 2s ease-in-out infinite;
}

.animate-pulse-wave {
  animation: pulseWave 2s ease-in-out infinite;
}

.animate-skeleton-shimmer {
  animation: skeletonShimmer 1.5s ease-in-out infinite;
}

/* Enhanced Variant-specific styles with micro-interactions */
.message-content-simple {
  @apply text-sm;
  transition: all 0.2s ease;
}

.message-content-simple:hover {
  transform: translateY(-0.5px);
}

.message-content-simple .prose {
  @apply prose-sm;
}

.message-content-enhanced {
  @apply relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.message-content-enhanced:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.message-content-improved {
  @apply relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.message-content-improved:hover {
  transform: translateY(-1px) scale(1.005);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}

.message-content-thumbnail .image-attachment {
  @apply aspect-square transition-all duration-300;
}

.message-content-thumbnail .image-attachment:hover {
  transform: scale(1.02) rotate(0.5deg);
}

.message-content-compact {
  @apply text-sm space-y-1 transition-all duration-200;
}

.message-content-compact:hover {
  transform: translateY(-1px);
}

.prose-compact {
  @apply prose-sm leading-snug;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .attachments-grid {
    @apply grid-cols-1 gap-2;
  }
  
  .overlay-btn {
    @apply scale-90;
  }
}
</style>

<style>
/* Global styles for rendered content */
.message-content .prose {
  @apply text-inherit;
  color: inherit !important;
}

.message-content .prose * {
  color: inherit !important;
}

.message-content .prose a {
  @apply text-primary hover:underline;
}

.message-content .prose strong {
  @apply font-semibold;
}

.message-content .prose pre {
  @apply bg-muted/30 border border-border rounded-lg p-0 my-4 overflow-hidden;
}

.message-content .prose pre code {
  @apply bg-transparent p-4 block overflow-x-auto text-sm;
}

.message-content .prose :not(pre) > code {
  @apply bg-muted/50 px-1.5 py-0.5 rounded text-sm font-mono before:content-[''] after:content-[''];
}

.message-content .prose blockquote {
  @apply border-l-4 border-primary/30 pl-4 italic opacity-80;
}

.message-content .prose h1,
.message-content .prose h2,
.message-content .prose h3,
.message-content .prose h4,
.message-content .prose h5,
.message-content .prose h6 {
  @apply font-semibold mt-6 mb-3 first:mt-0;
}

.message-content .prose ul,
.message-content .prose ol {
  @apply pl-6 my-4;
}

.message-content .prose li {
  @apply mb-1;
}

.message-content .prose img {
  @apply max-w-full h-auto rounded-lg my-4;
}

.message-content .prose hr {
  @apply border-border my-6;
}

.message-content .prose table {
  @apply border-collapse w-full my-4;
}

.message-content .prose th,
.message-content .prose td {
  @apply border border-border px-3 py-2;
}

.message-content .prose th {
  @apply bg-muted/50 font-semibold;
}

/* Code block styling */
.message-content .code-block-wrapper {
  @apply rounded-lg overflow-hidden border border-border my-4;
}

.message-content .code-header {
  @apply text-xs bg-muted/30;
}

.message-content .copy-button {
  @apply opacity-0 group-hover:opacity-100 transition-opacity;
}

/* Syntax highlighting */
.message-content .hljs {
  @apply bg-transparent;
  color: inherit !important;
}

.message-content .hljs-comment,
.message-content .hljs-quote {
  @apply text-muted-foreground italic;
}

.message-content .hljs-keyword,
.message-content .hljs-selector-tag {
  @apply text-primary font-medium;
}

.message-content .hljs-string,
.message-content .hljs-number {
  @apply text-green-600 dark:text-green-400;
}

.message-content .hljs-title,
.message-content .hljs-section {
  @apply text-blue-600 dark:text-blue-400 font-medium;
}

.message-content .hljs-attribute,
.message-content .hljs-variable {
  @apply text-orange-600 dark:text-orange-400;
}
</style>