<template>
  <div
    class="simple-markdown prose prose-sm max-w-none"
    v-html="renderedContent"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'

interface Props {
  content: string
}

const props = defineProps<Props>()

// Configure marked for ChatGPT-style rendering
marked.setOptions({
  breaks: true,
  gfm: true
})

// Simple markdown renderer
const renderedContent = computed(() => {
  if (!props.content?.trim()) return ''

  try {
    return marked.parse(props.content.trim())
  } catch (error) {
    console.warn('Markdown parsing failed:', error)
    return `<div class="text-sm text-muted-foreground">${props.content}</div>`
  }
})
</script>

<style scoped>
/* ChatGPT-style markdown styling - Simple and clean */

.simple-markdown {
  @apply text-sm leading-relaxed;
}

/* Headers - Simple typography */
.simple-markdown h1,
.simple-markdown h2,
.simple-markdown h3,
.simple-markdown h4,
.simple-markdown h5,
.simple-markdown h6 {
  @apply font-semibold text-foreground mt-4 mb-2;
}

.simple-markdown h1 { @apply text-lg; }
.simple-markdown h2 { @apply text-base; }
.simple-markdown h3 { @apply text-sm; }

/* Paragraphs */
.simple-markdown p {
  @apply mb-3 last:mb-0;
}

/* Lists */
.simple-markdown ul,
.simple-markdown ol {
  @apply ml-4 mb-3 space-y-1;
}

.simple-markdown li {
  @apply leading-relaxed;
}

/* Code blocks - ChatGPT style */
.simple-markdown pre {
  @apply bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 overflow-x-auto text-sm;
}

.simple-markdown pre code {
  @apply bg-transparent text-gray-800 font-mono text-sm leading-relaxed;
}

/* Inline code */
.simple-markdown code:not(pre code) {
  @apply bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono;
}

/* Blockquotes */
.simple-markdown blockquote {
  @apply border-l-4 border-gray-300 pl-4 py-2 mb-4 italic text-gray-700 bg-gray-50;
}

/* Links */
.simple-markdown a {
  @apply text-blue-600 hover:text-blue-800 underline;
}

/* Tables */
.simple-markdown table {
  @apply border-collapse border border-gray-300 mb-4 w-full;
}

.simple-markdown th,
.simple-markdown td {
  @apply border border-gray-300 px-3 py-2 text-left;
}

.simple-markdown th {
  @apply bg-gray-50 font-semibold;
}

/* Horizontal rules */
.simple-markdown hr {
  @apply border-gray-300 my-6;
}

/* Strong and emphasis */
.simple-markdown strong {
  @apply font-semibold;
}

.simple-markdown em {
  @apply italic;
}

/* Task lists */
.simple-markdown input[type="checkbox"] {
  @apply mr-2 accent-blue-600;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .simple-markdown pre {
    @apply text-xs;
  }

  .simple-markdown code:not(pre code) {
    @apply text-xs;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .simple-markdown pre {
    @apply bg-gray-800 border-gray-600;
  }

  .simple-markdown pre code {
    @apply text-gray-100;
  }

  .simple-markdown code:not(pre code) {
    @apply bg-gray-700 text-gray-200;
  }

  .simple-markdown blockquote {
    @apply border-gray-600 bg-gray-800 text-gray-300;
  }

  .simple-markdown table {
    @apply border-gray-600;
  }

  .simple-markdown th,
  .simple-markdown td {
    @apply border-gray-600;
  }

  .simple-markdown th {
    @apply bg-gray-700 text-gray-200;
  }

  .simple-markdown hr {
    @apply border-gray-600;
  }
}
</style>
