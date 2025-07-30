<template>
  <div class="message-content">
    <!-- 附件预览 -->
    <div v-if="attachments.length > 0" class="attachments mb-3">
      <div 
        v-for="attachment in attachments" 
        :key="attachment.url" 
        class="attachment-item"
      >
        <img
          v-if="attachment.type === 'image'"
          :src="attachment.url"
          :alt="attachment.name"
          class="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
          @click="openImage(attachment.url)"
          loading="lazy"
        />
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
      class="prose prose-sm dark:prose-invert max-w-none"
      ref="contentElement"
    >
      <!-- 渲染的 Markdown 内容将通过 v-html 插入 -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUpdated, nextTick } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'
import { Copy, Check, Maximize2 } from 'lucide-vue-next'

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

// 打开图片
const openImage = (url: string) => {
  // TODO: 实现图片预览模态框
  window.open(url, '_blank')
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
</script>

<style scoped>
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
.prose {
  @apply text-foreground;
}

.prose strong {
  @apply font-semibold text-foreground;
}

.prose a {
  @apply text-primary no-underline hover:underline;
}

.prose pre {
  @apply bg-muted/30 border border-border rounded-b-lg p-0 my-0;
}

.prose pre code {
  @apply bg-transparent p-4 block overflow-x-auto text-sm;
}

.prose code {
  @apply bg-muted/50 px-1.5 py-0.5 rounded text-sm font-mono before:content-[''] after:content-[''];
}

.prose blockquote {
  @apply border-l-4 border-primary/30 pl-4 italic text-muted-foreground;
}

.prose h1,
.prose h2,
.prose h3,
.prose h4,
.prose h5,
.prose h6 {
  @apply font-semibold text-foreground;
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