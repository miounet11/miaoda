<template>
  <div class="message-content">
    <!-- Tool Status -->
    <ToolStatus 
      v-if="toolStatus"
      :status="toolStatus"
      :visible="!!toolStatus"
    />
    
    <!-- Attachments -->
    <div v-if="attachments.length > 0" class="attachments mb-2">
      <div v-for="attachment in attachments" :key="attachment.url" class="attachment">
        <img
          v-if="attachment.type === 'image'"
          :src="attachment.url"
          :alt="attachment.name"
          class="max-w-full rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity"
          @click="openImage(attachment.url)"
        />
      </div>
    </div>
    
    <!-- Message content -->
    <MessageSkeleton v-if="isLoading && !content" />
    
    <TypingIndicator 
      v-else-if="isLoading && content === ''"
      :message="typingMessage"
    />
    
    <div v-else-if="!error" v-html="renderedContent" class="prose prose-sm dark:prose-invert max-w-none"></div>
    
    <!-- Error state -->
    <MessageError
      v-if="error"
      :error="error"
      :error-details="errorDetails"
      :show-retry="showRetry"
      :retrying="retrying"
      @retry="$emit('retry')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'
import MessageSkeleton from './loading/MessageSkeleton.vue'
import TypingIndicator from './loading/TypingIndicator.vue'
import ToolStatus from './loading/ToolStatus.vue'
import MessageError from './error/MessageError.vue'

interface Props {
  content: string
  isLoading?: boolean
  attachments?: Array<{
    type: 'image'
    url: string
    name: string
  }>
  error?: string
  errorDetails?: string
  showRetry?: boolean
  retrying?: boolean
  typingMessage?: string
  toolStatus?: {
    tool: string
    action: string
    progress?: number
    details?: string
  }
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  attachments: () => [],
  showRetry: true,
  retrying: false,
  typingMessage: 'AI is thinking...'
})

defineEmits<{
  retry: []
}>()

// Configure marked with syntax highlighting and image rendering
const renderer = new marked.Renderer()

// Custom image renderer to add loading lazy and styling
renderer.image = (href, title, text) => {
  return `<img src="${href}" alt="${text}" title="${title || ''}" loading="lazy" class="max-w-full rounded-lg my-2" />`
}

// Custom code block renderer with copy button
renderer.code = (code, language) => {
  const validLanguage = language && hljs.getLanguage(language) ? language : 'plaintext'
  const highlighted = hljs.highlight(code, { language: validLanguage }).value
  
  return `
    <div class="code-block-wrapper">
      <div class="code-block-header">
        <span class="code-language">${validLanguage}</span>
        <button class="copy-button" onclick="copyCode(this)" data-code="${encodeURIComponent(code)}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Copy
        </button>
      </div>
      <pre><code class="hljs language-${validLanguage}">${highlighted}</code></pre>
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
  gfm: true
})

const renderedContent = computed(() => {
  return marked(props.content)
})

const openImage = (url: string) => {
  // TODO: Implement image preview modal
  window.open(url, '_blank')
}

// Global function for copy button
if (typeof window !== 'undefined') {
  (window as any).copyCode = function(button: HTMLButtonElement) {
    const code = decodeURIComponent(button.dataset.code || '')
    navigator.clipboard.writeText(code).then(() => {
      const originalText = button.textContent
      button.textContent = 'Copied!'
      button.classList.add('copied')
      setTimeout(() => {
        button.textContent = originalText
        button.classList.remove('copied')
      }, 2000)
    })
  }
}
</script>

<style>
/* Code block styling */
.code-block-wrapper {
  position: relative;
  margin: 1rem 0;
  border-radius: 8px;
  overflow: hidden;
  background: var(--code-bg);
  border: 1px solid var(--border);
}

.code-block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: var(--code-header-bg);
  border-bottom: 1px solid var(--border);
}

.code-language {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.copy-button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 12px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.copy-button:hover {
  background: var(--muted);
  color: var(--text);
}

.copy-button.copied {
  background: var(--success);
  color: white;
  border-color: var(--success);
}

.code-block-wrapper pre {
  margin: 0;
  padding: 16px;
  overflow-x: auto;
}

.code-block-wrapper code {
  font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
}

/* Syntax highlighting theme */
.hljs {
  background: transparent !important;
}

/* Prose styling improvements */
.prose {
  --tw-prose-headings: var(--text);
  --tw-prose-body: var(--text);
  --tw-prose-links: var(--primary);
  --tw-prose-code: var(--text);
  --tw-prose-pre-bg: var(--code-bg);
  --tw-prose-pre-code: var(--text);
}

.prose pre {
  background: transparent;
  padding: 0;
  margin: 0;
}

.prose :not(pre) > code {
  background: var(--inline-code-bg);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.875em;
  font-weight: 400;
}

/* Theme variables */
:root {
  --code-bg: hsl(210, 20%, 98%);
  --code-header-bg: hsl(210, 20%, 95%);
  --inline-code-bg: hsl(210, 20%, 95%);
  --border: hsl(214, 32%, 91%);
  --muted: hsl(210, 20%, 96%);
  --text: hsl(222, 47%, 11%);
  --text-secondary: hsl(215, 20%, 45%);
  --primary: hsl(221, 83%, 53%);
  --success: hsl(142, 71%, 45%);
}

:root[data-theme="dark"] {
  --code-bg: hsl(222, 47%, 15%);
  --code-header-bg: hsl(222, 47%, 18%);
  --inline-code-bg: hsl(222, 47%, 20%);
  --border: hsl(215, 20%, 25%);
  --muted: hsl(217, 33%, 17%);
  --text: hsl(210, 20%, 98%);
  --text-secondary: hsl(215, 20%, 65%);
  --primary: hsl(221, 83%, 65%);
}
</style>