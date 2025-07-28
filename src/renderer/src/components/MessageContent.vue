<template>
  <div class="message-content">
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
    <div v-if="isLoading" class="flex items-center gap-2">
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
    <div v-else v-html="renderedContent" class="prose prose-sm dark:prose-invert max-w-none"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'

interface Props {
  content: string
  isLoading?: boolean
  attachments?: Array<{
    type: 'image'
    url: string
    name: string
  }>
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  attachments: () => []
})

// Configure marked with syntax highlighting and image rendering
const renderer = new marked.Renderer()

// Custom image renderer to add loading lazy and styling
renderer.image = (href, title, text) => {
  return `<img src="${href}" alt="${text}" title="${title || ''}" loading="lazy" class="max-w-full rounded-lg my-2" />`
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
</script>

<style scoped>
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
  opacity: 0.4;
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
    opacity: 0.4;
  }
  30% {
    opacity: 1;
  }
}
</style>

<style>
/* Syntax highlighting theme */
.hljs {
  @apply bg-muted/50 rounded-md p-4 my-2 overflow-x-auto;
}

.prose pre {
  @apply bg-transparent p-0 m-0;
}

.prose code {
  @apply bg-muted/50 px-1.5 py-0.5 rounded text-sm;
}

.prose pre code {
  @apply bg-transparent p-0;
}
</style>