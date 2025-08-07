<template>
  <div class="message-content">
    <!-- Enhanced Attachments Display -->
    <div v-if="attachments.length > 0" class="attachments mb-4">
      <div class="attachments-grid grid gap-3">
        <div 
          v-for="attachment in attachments" 
          :key="attachment.url" 
          class="attachment-item relative group"
          :class="getAttachmentGridClasses(attachment)"
        >
          <!-- Image Attachment with Enhanced Display -->
          <div v-if="attachment.type === 'image'" class="image-attachment-message relative">
            <img
              :src="attachment.url"
              :alt="attachment.name"
              class="message-image w-full h-auto rounded-lg cursor-pointer shadow-sm border border-border/20 transition-all duration-200"
              :class="imageClasses"
              @click="openImage(attachment.url)"
              @load="onImageLoad"
              @error="onImageError"
              loading="lazy"
            />
            
            <!-- Image Loading Overlay -->
            <div 
              v-if="imageLoading"
              class="loading-overlay absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center"
            >
              <div class="loading-spinner w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            
            <!-- Image Hover Actions -->
            <div class="image-actions absolute inset-0 bg-black/0 hover:bg-black/20 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100">
              <div class="absolute top-2 right-2 flex gap-1">
                <button
                  @click.stop="openImage(attachment.url)"
                  class="action-btn p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-all"
                  title="全屏查看"
                >
                  <Maximize2 :size="14" />
                </button>
                <button
                  @click.stop="downloadImage(attachment.url, attachment.name)"
                  class="action-btn p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-all"
                  title="下载图片"
                >
                  <Download :size="14" />
                </button>
              </div>
              
              <!-- Image Info -->
              <div class="absolute bottom-2 left-2 right-2">
                <div class="image-info bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
                  {{ attachment.name }}
                </div>
              </div>
            </div>
            
            <!-- Vision Analysis Badge -->
            <div 
              v-if="showVisionBadge(attachment)"
              class="vision-badge absolute top-2 left-2 px-2 py-1 bg-green-500/90 text-white text-xs rounded-full font-medium backdrop-blur-sm flex items-center gap-1"
            >
              <Eye :size="10" />
              AI已分析
            </div>
          </div>
          
          <!-- File Attachment -->
          <div v-else-if="attachment.type === 'file'" class="file-attachment">
            <!-- File display implementation -->
          </div>
        </div>
      </div>
    </div>
    
    <!-- 消息内容 -->
    <div v-if="isLoading" class="flex items-center gap-3">
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span class="text-sm text-muted-foreground">AI 正在思考...</span>
    </div>
    
    <div 
      v-else 
      class="message-content-wrapper prose prose-sm dark:prose-invert max-w-none"
      ref="contentElement"
    >
      <!-- 渲染的 Markdown 内容将通过 v-html 插入 -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUpdated, nextTick, watch } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'
import { Copy, Check, Maximize2, Download, Eye } from 'lucide-vue-next'

interface Props {
  content: string
  isLoading?: boolean
  attachments?: Array<{
    type: 'image' | 'file'
    url: string
    name: string
  }>
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  attachments: () => []
})

const contentElement = ref<HTMLElement>()
const copiedStates = ref<Record<string, boolean>>({})
const imageLoading = ref<Record<string, boolean>>({})
const imageErrors = ref<Record<string, boolean>>({})

// 配置 marked
const renderer = new marked.Renderer()

// 自定义图片渲染
renderer.image = (href, title, text) => {
  return `
    <figure class="my-4">
      <img 
        src="${href}" 
        alt="${text}" 
        title="${title || ''}" 
        loading="lazy" 
        class="max-w-full rounded-lg shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
        onclick="window.open('${href}', '_blank')"
      />
      ${title ? `<figcaption class="text-center text-sm text-muted-foreground mt-2">${title}</figcaption>` : ''}
    </figure>
  `
}

// 自定义代码块渲染
renderer.code = (code, language) => {
  const codeId = 'code-' + Math.random().toString(36).substr(2, 9)
  const highlighted = language && hljs.getLanguage(language)
    ? hljs.highlight(code, { language }).value
    : hljs.highlightAuto(code).value
  
  return `
    <div class="code-block-wrapper relative group my-4">
      <div class="code-header flex items-center justify-between px-4 py-2 bg-muted/50 rounded-t-lg border border-b-0">
        <span class="text-xs font-mono text-muted-foreground">${language || 'plaintext'}</span>
        <button 
          class="copy-button inline-flex items-center gap-1 px-2 py-1 text-xs bg-background hover:bg-secondary rounded transition-colors"
          data-code-id="${codeId}"
          title="复制代码"
        >
          <svg class="copy-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <svg class="check-icon hidden" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span class="copy-text">复制</span>
        </button>
      </div>
      <pre class="!mt-0 !rounded-t-none"><code id="${codeId}" class="hljs language-${language || 'plaintext'}">${highlighted}</code></pre>
    </div>
  `
}

// 自定义链接渲染
renderer.link = (href, title, text) => {
  const isExternal = href.startsWith('http://') || href.startsWith('https://')
  return `
    <a 
      href="${href}" 
      ${title ? `title="${title}"` : ''}
      ${isExternal ? 'target="_blank" rel="noopener noreferrer"' : ''}
      class="text-primary hover:underline inline-flex items-center gap-1"
    >
      ${text}
      ${isExternal ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="inline"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>' : ''}
    </a>
  `
}

// 自定义表格渲染
renderer.table = (header, body) => {
  return `
    <div class="table-wrapper my-4 overflow-x-auto">
      <table class="min-w-full">
        <thead>${header}</thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  `
}

marked.setOptions({
  renderer,
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value
      } catch (__) {}
    }
    return hljs.highlightAuto(code).value
  },
  breaks: true,
  gfm: true,
  headerIds: true,
  mangle: false
})

// 渲染内容
const renderedContent = computed(() => {
  try {
    return marked(props.content)
  } catch (error) {
    console.error('Markdown parsing error:', error)
    return props.content
  }
})

// 添加代码复制功能
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
        
        // 更新按钮状态
        const copyIcon = btn.querySelector('.copy-icon') as HTMLElement
        const checkIcon = btn.querySelector('.check-icon') as HTMLElement
        const copyText = btn.querySelector('.copy-text') as HTMLElement
        
        copyIcon.classList.add('hidden')
        checkIcon.classList.remove('hidden')
        copyText.textContent = '已复制'
        
        // 3秒后恢复
        setTimeout(() => {
          copyIcon.classList.remove('hidden')
          checkIcon.classList.add('hidden')
          copyText.textContent = '复制'
        }, 3000)
      } catch (error) {
        console.error('Failed to copy:', error)
      }
    })
  })
}

// Computed properties
const imageClasses = computed(() => ({
  'hover:scale-[1.02] hover:shadow-lg': true,
  'max-w-sm': props.attachments.length === 1,
  'max-w-xs': props.attachments.length > 1
}))

// Methods
const getAttachmentGridClasses = (attachment: any) => {
  const baseClasses = 'rounded-lg overflow-hidden'
  
  if (attachment.type === 'image') {
    const count = props.attachments.filter(a => a.type === 'image').length
    return {
      [baseClasses]: true,
      'col-span-2': count === 1, // Single image takes more space
      'col-span-1': count > 1    // Multiple images in grid
    }
  }
  
  return baseClasses
}

const showVisionBadge = (attachment: any): boolean => {
  // Show badge if this is an image that would be processed by vision-capable AI
  return attachment.type === 'image' && attachment.analyzed
}

const onImageLoad = (event: Event) => {
  const img = event.target as HTMLImageElement
  const url = img.src
  imageLoading.value[url] = false
  imageErrors.value[url] = false
}

const onImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  const url = img.src
  imageLoading.value[url] = false
  imageErrors.value[url] = true
}

const downloadImage = async (url: string, name: string) => {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = name || 'image'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    window.URL.revokeObjectURL(downloadUrl)
  } catch (error) {
    console.error('Failed to download image:', error)
  }
}

// 打开图片 - Enhanced with modal support
const openImage = (url: string) => {
  // Create a full-screen image modal
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm'
  modal.style.animation = 'fadeIn 0.3s ease'
  
  const img = document.createElement('img')
  img.src = url
  img.className = 'max-w-full max-h-full object-contain rounded-lg shadow-2xl'
  img.style.animation = 'slideIn 0.3s ease'
  
  const closeBtn = document.createElement('button')
  closeBtn.innerHTML = '×'
  closeBtn.className = 'absolute top-4 right-4 text-white text-4xl hover:text-gray-300 transition-colors'
  closeBtn.onclick = () => document.body.removeChild(modal)
  
  modal.appendChild(img)
  modal.appendChild(closeBtn)
  modal.onclick = (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal)
    }
  }
  
  // Add CSS animations
  if (!document.getElementById('image-modal-styles')) {
    const style = document.createElement('style')
    style.id = 'image-modal-styles'
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideIn {
        from { opacity: 0; transform: scale(0.9) translateY(20px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
    `
    document.head.appendChild(style)
  }
  
  document.body.appendChild(modal)
}

// 更新内容
const updateContent = async () => {
  if (!contentElement.value) return
  
  contentElement.value.innerHTML = renderedContent.value
  await nextTick()
  setupCodeCopyButtons()
}

onMounted(() => {
  updateContent()
})

onUpdated(() => {
  updateContent()
})

// Watch for content changes
watch(() => props.content, () => {
  updateContent()
})
</script>

<style scoped>
/* Enhanced Attachments Grid */
.attachments-grid {
  grid-template-columns: repeat(2, 1fr);
  max-width: 100%;
}

.attachments-grid.single-image {
  grid-template-columns: 1fr;
}

.attachment-item {
  position: relative;
  overflow: hidden;
  border-radius: 0.75rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.attachment-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.image-attachment-message {
  position: relative;
  border-radius: inherit;
  overflow: hidden;
}

.message-image {
  display: block;
  width: 100%;
  height: auto;
  border-radius: inherit;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.message-image:hover {
  transform: scale(1.02);
}

/* Image Actions */
.image-actions {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  pointer-events: none;
}

.image-actions > * {
  pointer-events: auto;
}

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

/* Vision Badge */
.vision-badge {
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

/* Loading States */
.loading-overlay {
  backdrop-filter: blur(8px);
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Image Info */
.image-info {
  backdrop-filter: blur(8px);
  animation: slideUpFade 0.3s ease;
}

@keyframes slideUpFade {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive Design */
@media (max-width: 640px) {
  .attachments-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .message-image {
    max-height: 300px;
    object-fit: cover;
  }
  
  .image-actions {
    background: rgba(0, 0, 0, 0.1);
  }
  
  .action-btn {
    transform: scale(0.9);
  }
}

/* 打字动画 */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: currentColor;
  opacity: 0.3;
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
</style>

<style>
/* Prose 样式覆盖 */
.message-content-wrapper {
  color: inherit !important;
}

.prose {
  color: inherit !important;
}

.prose strong {
  @apply font-semibold;
  color: inherit !important;
}

.prose a {
  @apply no-underline hover:underline;
  color: hsl(var(--primary)) !important;
}

/* 用户消息中的链接使用更浅的颜色以确保对比度 */
.message-bubble.bg-primary .prose a {
  color: rgba(255, 255, 255, 0.9) !important;
  text-decoration: underline;
}

.dark .message-bubble.bg-primary .prose a {
  color: hsl(var(--background) / 0.9) !important;
  text-decoration: underline;
}

.prose pre {
  @apply bg-muted/30 border border-border rounded-b-lg p-0 my-0;
}

.prose pre code {
  @apply bg-transparent p-4 block overflow-x-auto text-sm;
  color: inherit !important;
}

.prose code {
  @apply bg-muted/50 px-1.5 py-0.5 rounded text-sm font-mono before:content-[''] after:content-[''];
  color: inherit !important;
}

.prose blockquote {
  @apply border-l-4 border-primary/30 pl-4 italic;
  color: inherit !important;
  opacity: 0.8;
}

.prose h1,
.prose h2,
.prose h3,
.prose h4,
.prose h5,
.prose h6 {
  @apply font-semibold;
  color: inherit !important;
}

.prose p,
.prose li,
.prose span,
.prose div {
  color: inherit !important;
}

.prose h1 {
  @apply text-2xl mt-6 mb-4;
}

.prose h2 {
  @apply text-xl mt-6 mb-3;
}

.prose h3 {
  @apply text-lg mt-4 mb-2;
}

.prose ul,
.prose ol {
  @apply pl-6 my-4;
}

.prose li {
  @apply mb-2;
}

.prose table {
  @apply border-collapse w-full;
}

.prose th,
.prose td {
  @apply border border-border px-4 py-2;
}

.prose th {
  @apply bg-muted/50 font-semibold;
}

.prose img {
  @apply max-w-full h-auto rounded-lg my-4;
}

.prose hr {
  @apply border-border my-6;
}

/* 代码块样式 */
.code-block-wrapper {
  @apply rounded-lg overflow-hidden border border-border;
}

.code-header {
  @apply text-xs;
}

.copy-button {
  @apply opacity-0 group-hover:opacity-100 transition-opacity;
}

/* Highlight.js 主题适配 */
.hljs {
  @apply text-foreground bg-transparent;
}

.hljs-comment,
.hljs-quote {
  @apply text-muted-foreground italic;
}

.hljs-keyword,
.hljs-selector-tag,
.hljs-addition {
  @apply text-primary font-medium;
}

.hljs-number,
.hljs-string,
.hljs-meta .hljs-string,
.hljs-literal,
.hljs-doctag,
.hljs-regexp {
  @apply text-green-600 dark:text-green-400;
}

.hljs-title,
.hljs-section,
.hljs-name,
.hljs-selector-id,
.hljs-selector-class {
  @apply text-blue-600 dark:text-blue-400 font-medium;
}

.hljs-attribute,
.hljs-attr,
.hljs-variable,
.hljs-template-variable,
.hljs-class .hljs-title,
.hljs-type {
  @apply text-orange-600 dark:text-orange-400;
}

.hljs-symbol,
.hljs-bullet,
.hljs-subst,
.hljs-meta,
.hljs-link {
  @apply text-purple-600 dark:text-purple-400;
}

.hljs-built_in,
.hljs-deletion {
  @apply text-red-600 dark:text-red-400;
}

.hljs-emphasis {
  @apply italic;
}

.hljs-strong {
  @apply font-bold;
}
</style>