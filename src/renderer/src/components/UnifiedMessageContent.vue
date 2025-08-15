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

    <!-- Attachments -->
    <div v-if="showAttachments && attachments?.length > 0" class="attachments mb-3">
      <div 
        class="attachments-grid"
        :class="getAttachmentsGridClass()"
      >
        <div
          v-for="(attachment, index) in attachments"
          :key="attachment.url || index"
          class="attachment-item relative group"
        >
          <!-- Image Attachment -->
          <div v-if="attachment.type === 'image'" class="image-attachment relative">
            <img
              :src="attachment.url"
              :alt="attachment.name"
              :class="imageClasses"
              @click="openImage(attachment.url)"
              @load="onImageLoad"
              @error="onImageError"
              loading="lazy"
            >
            
            <!-- Image Overlay Actions -->
            <div
              v-if="variant === 'enhanced' || variant === 'improved'" 
              class="image-overlay absolute inset-0 bg-black/0 hover:bg-black/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
            >
              <div class="absolute top-2 right-2 flex gap-1">
                <button
                  @click.stop="openImage(attachment.url)"
                  class="overlay-btn"
                  title="全屏查看"
                >
                  <Maximize2 :size="14" />
                </button>
                <button
                  @click.stop="downloadAttachment(attachment)"
                  class="overlay-btn"
                  title="下载"
                >
                  <Download :size="14" />
                </button>
              </div>
            </div>
            
            <!-- Image Name (with thumbnail variant) -->
            <div v-if="variant === 'thumbnail'" class="image-name mt-1">
              <p class="text-xs text-muted-foreground truncate">
                {{ getDisplayName(attachment.name) }}
              </p>
            </div>
          </div>
          
          <!-- File Attachment -->
          <div v-else class="file-attachment flex items-center gap-2 p-2 bg-secondary/20 rounded hover:bg-secondary/30 transition-colors">
            <FileText :size="16" class="text-muted-foreground" />
            <span class="text-sm flex-1 truncate">{{ attachment.name }}</span>
            <button
              @click="downloadAttachment(attachment)"
              class="p-1 hover:bg-secondary rounded transition-colors"
              title="下载"
            >
              <Download :size="14" class="text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
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
    
    <!-- Loading States -->
    <div v-if="isLoading" class="loading-container">
      <!-- Enhanced loading with skeleton -->
      <div v-if="variant === 'enhanced' || variant === 'improved'" class="message-skeleton">
        <div class="skeleton-line w-3/4 h-4 mb-2" />
        <div class="skeleton-line w-1/2 h-4 mb-2" />
        <div class="skeleton-line w-2/3 h-4" />
      </div>
      
      <!-- Simple loading indicator -->
      <div v-else class="flex items-center gap-2">
        <div class="typing-indicator">
          <span />
          <span />
          <span />
        </div>
        <span v-if="loadingText" class="text-sm text-muted-foreground">{{ loadingText }}</span>
      </div>
    </div>
    
    <!-- Error State (Enhanced variants) -->
    <div v-else-if="error && (variant === 'enhanced' || variant === 'improved')" class="error-container">
      <div class="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
        <AlertCircle :size="16" class="text-destructive" />
        <div class="flex-1">
          <p class="text-sm font-medium text-destructive">{{ error }}</p>
          <p v-if="errorDetails" class="text-xs text-destructive/70 mt-1">{{ errorDetails }}</p>
        </div>
        <button
          v-if="showRetry"
          @click="$emit('retry')"
          :disabled="retrying"
          class="px-2 py-1 text-xs bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 disabled:opacity-50"
        >
          {{ retrying ? '重试中...' : '重试' }}
        </button>
      </div>
    </div>
    
    <!-- Main Content -->
    <div v-else-if="content" ref="contentElement" :class="proseClasses" v-html="renderedContent">
    </div>

    <!-- Actions (enhanced variants) -->
    <div v-if="showActions && (variant === 'enhanced' || variant === 'improved')" class="message-actions mt-3 flex gap-2">
      <slot name="actions">
        <button @click="$emit('copy')" class="action-btn" title="复制">
          <Copy :size="14" />
        </button>
        <button @click="$emit('edit')" class="action-btn" title="编辑">
          <Edit :size="14" />
        </button>
        <button @click="$emit('delete')" class="action-btn" title="删除">
          <Trash2 :size="14" />
        </button>
      </slot>
    </div>

    <!-- Image Preview Modal -->
    <Teleport to="body">
      <div
        v-if="previewImage"
        class="image-preview-modal fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
        @click="closeImagePreview"
      >
        <div class="relative max-w-full max-h-full">
          <img
            :src="previewImage"
            class="max-w-full max-h-[90vh] object-contain rounded-lg"
            @click.stop
          >
          <button
            @click="closeImagePreview"
            class="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          >
            <X :size="20" />
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUpdated, nextTick, PropType } from 'vue'
import { marked } from 'marked'
import { FileText, Copy, Edit, Trash2, Maximize2, Download, X, AlertCircle } from 'lucide-vue-next'
import hljs from 'highlight.js'
import { logger } from '../utils/Logger'

// Configure marked with simplified options
marked.setOptions({
  breaks: true,
  gfm: true
})

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
}>()

// Refs
const contentElement = ref<HTMLElement>()
const previewImage = ref<string | null>(null)

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

// Render content based on mode and variant
const renderedContent = computed(() => {
  if (!props.content) return ''
  
  try {
    if (props.variant === 'simple') {
      return props.content // No markdown processing for simple variant
    }
    
    if (props.renderMode === 'markdown') {
      // Use marked.parse for markdown rendering
      return marked.parse(props.content) as string
    } else if (props.renderMode === 'html') {
      return props.content
    }
    // Default to markdown rendering for better formatting
    return marked.parse(props.content) as string
  } catch (error) {
    logger.error('Failed to render content', 'UnifiedMessageContent', { error })
    return props.content
  }
})

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

const openImage = (url: string) => {
  previewImage.value = url
  emit('imageClick', url)
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
/* Base component styles */
.message-content {
  @apply w-full;
}

/* Tool Status */
.tool-status {
  @apply rounded-lg bg-muted/20 p-3 border border-border/50;
}

.loading-dot {
  @apply w-2 h-2 bg-primary rounded-full animate-pulse;
}

.progress-bar {
  @apply w-full h-1 bg-muted rounded-full overflow-hidden mt-2;
}

.progress-fill {
  @apply h-full bg-primary transition-all duration-300 ease-out;
}

/* Attachments */
.attachments-grid {
  @apply grid gap-3;
}

.attachment-item {
  @apply relative overflow-hidden rounded-lg border border-border/20 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5;
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

/* Loading states */
.loading-container {
  @apply py-2;
}

.message-skeleton {
  @apply animate-pulse space-y-2;
}

.skeleton-line {
  @apply bg-muted/30 rounded;
}

.typing-indicator {
  @apply flex items-center gap-1;
}

.typing-indicator span {
  @apply w-2 h-2 bg-current rounded-full opacity-30 animate-pulse;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  30% {
    opacity: 1;
    transform: scale(1);
  }
}

/* Error states */
.error-container {
  @apply py-2;
}

/* Actions */
.message-actions {
  @apply opacity-0 group-hover:opacity-100 transition-opacity;
}

.action-btn {
  @apply p-1.5 rounded hover:bg-secondary transition-colors;
}

/* Image preview modal */
.image-preview-modal {
  @apply backdrop-blur-sm;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Variant-specific styles */
.message-content-simple {
  @apply text-sm;
}

.message-content-simple .prose {
  @apply prose-sm;
}

.message-content-enhanced {
  @apply relative;
}

.message-content-improved {
  @apply relative;
}

.message-content-thumbnail .image-attachment {
  @apply aspect-square;
}

.message-content-compact {
  @apply text-sm space-y-1;
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