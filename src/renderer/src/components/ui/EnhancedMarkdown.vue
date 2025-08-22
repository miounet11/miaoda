<template>
  <div 
    ref="contentRef"
    class="enhanced-markdown-content prose prose-slate dark:prose-invert max-w-none animate-content-reveal"
    :class="contentClasses"
    v-html="renderedContent"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { markdownService, type MarkdownOptions } from '../../services/MarkdownService'
import { renderMarkdownSafely } from '@renderer/src/utils/SafeMarkdownParser'
import 'highlight.js/styles/github.css'
import 'highlight.js/styles/github-dark.css'

interface Props {
  content: string
  enableMath?: boolean
  enableMermaid?: boolean
  copyCodeBlocks?: boolean
  theme?: 'light' | 'dark' | 'auto'
  maxWidth?: string
  fontSize?: 'sm' | 'base' | 'lg'
  lineHeight?: 'normal' | 'relaxed' | 'loose'
}

const props = withDefaults(defineProps<Props>(), {
  enableMath: true,
  enableMermaid: true,
  copyCodeBlocks: true,
  theme: 'auto',
  maxWidth: 'none',
  fontSize: 'base',
  lineHeight: 'relaxed'
})

const emit = defineEmits<{
  'code-copied': [code: string, language: string]
  'link-clicked': [url: string, event: Event]
}>()

const contentRef = ref<HTMLElement>()

// Enhanced content processing with bulletproof error handling

// Bulletproof markdown rendering using the safe parser
const renderedContent = computed(() => {
  try {
    // Use the bulletproof safe markdown parser
    return renderMarkdownSafely(props.content)
  } catch (criticalError) {
    // Absolute emergency fallback
    console.error('Critical error in safe markdown parser:', criticalError)
    const emergencyContent = String(props.content || 'Content rendering failed')
    return `<div class="error-content p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
      <p class="text-red-800 dark:text-red-200 font-medium">⚠️ 紧急错误 - 内容无法渲染</p>
      <p class="text-sm text-red-600 dark:text-red-400 mt-1">Critical rendering failure</p>
      <details class="mt-2 cursor-pointer group">
        <summary class="text-sm text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100 transition-colors cursor-pointer select-none group-hover:underline">
          显示原始内容 (Emergency Fallback)
        </summary>
        <pre class="text-xs text-red-600 dark:text-red-400 mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded border overflow-auto max-h-40 whitespace-pre-wrap select-text break-all">${emergencyContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
      </details>
    </div>`
  }
})

// Content classes based on props
const contentClasses = computed(() => {
  return [
    // Font size
    {
      'text-sm': props.fontSize === 'sm',
      'text-base': props.fontSize === 'base', 
      'text-lg': props.fontSize === 'lg'
    },
    // Line height
    {
      'leading-normal': props.lineHeight === 'normal',
      'leading-relaxed': props.lineHeight === 'relaxed',
      'leading-loose': props.lineHeight === 'loose'
    },
    // Max width
    props.maxWidth !== 'none' && `max-w-${props.maxWidth}`
  ]
})

// Copy to clipboard functionality
const setupCopyFunctionality = () => {
  if (!props.copyCodeBlocks || typeof window === 'undefined') return
  
  // Global copy function for code blocks with enhanced error handling
  ;(window as any).copyToClipboard = async (button: HTMLElement, encodedCode: string, language: string) => {
    try {
      // Validate inputs
      if (!button || !encodedCode) {
        throw new Error('Invalid copy parameters')
      }
      
      const code = decodeURIComponent(encodedCode)
      
      // Validate decoded content
      if (!code || typeof code !== 'string') {
        throw new Error('Invalid code content')
      }
      
      await navigator.clipboard.writeText(code)
      
      // Visual feedback
      const originalHTML = button.innerHTML
      button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20,6 9,17 4,12"></polyline>
        </svg>
      `
      button.classList.add('text-green-600', 'dark:text-green-400')
      button.setAttribute('title', '已复制!')
      
      setTimeout(() => {
        try {
          button.innerHTML = originalHTML
          button.classList.remove('text-green-600', 'dark:text-green-400')
          button.setAttribute('title', '复制代码')
        } catch (resetError) {
          console.warn('Failed to reset copy button:', resetError)
        }
      }, 2000)
      
      emit('code-copied', code, language)
    } catch (error) {
      console.error('Failed to copy code:', error)
      
      // Enhanced error feedback
      try {
        button.classList.add('text-red-600', 'dark:text-red-400')
        button.setAttribute('title', '复制失败')
        
        // Try fallback copy method for older browsers
        if (navigator.clipboard) {
          // Already tried above, show error
        } else {
          // Fallback for older browsers
          const textArea = document.createElement('textarea')
          textArea.value = decodeURIComponent(encodedCode)
          textArea.style.position = 'fixed'
          textArea.style.opacity = '0'
          document.body.appendChild(textArea)
          textArea.select()
          
          try {
            document.execCommand('copy')
            button.setAttribute('title', '已复制 (兼容模式)')
          } catch (fallbackError) {
            button.setAttribute('title', '复制失败 - 请手动选择文本')
          } finally {
            document.body.removeChild(textArea)
          }
        }
        
        setTimeout(() => {
          try {
            button.classList.remove('text-red-600', 'dark:text-red-400')
            button.setAttribute('title', '复制代码')
          } catch (resetError) {
            console.warn('Failed to reset error state:', resetError)
          }
        }, 3000)
      } catch (feedbackError) {
        console.error('Failed to show copy error feedback:', feedbackError)
      }
    }
  }
}

// Setup interactivity after content renders
const setupInteractivity = async () => {
  if (!contentRef.value) return
  
  await nextTick()
  
  // Setup copy functionality
  setupCopyFunctionality()
  
  // Setup link click handling
  const links = contentRef.value.querySelectorAll('a.enhanced-link')
  links.forEach(link => {
    link.addEventListener('click', (event) => {
      const href = (link as HTMLAnchorElement).href
      emit('link-clicked', href, event)
    })
  })
  
  // Setup heading anchor scrolling
  const headingLinks = contentRef.value.querySelectorAll('a.heading-link')
  headingLinks.forEach(link => {
    link.addEventListener('click', (event) => {
      event.preventDefault()
      const href = (link as HTMLAnchorElement).getAttribute('href')
      if (href && href.startsWith('#')) {
        const target = document.getElementById(href.slice(1))
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' })
          history.pushState(null, '', href)
        }
      }
    })
  })
}

// Watch for content changes and setup interactivity
watch(renderedContent, () => {
  setupInteractivity()
}, { flush: 'post' })

// Setup interactivity on mount
watch(contentRef, (el) => {
  if (el) {
    setupInteractivity()
  }
}, { immediate: true })
</script>

<style>
/* Enhanced Markdown Styles with Micro-Interactions */
.enhanced-markdown-content {
  @apply text-slate-800 dark:text-slate-200;
  line-height: 1.7;
  animation: contentReveal 0.6s ease-out;
}

@keyframes contentReveal {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-content-reveal {
  animation: contentReveal 0.6s ease-out;
}

/* Enhanced Headers with Hover Effects */
.enhanced-markdown-content h1,
.enhanced-markdown-content h2,
.enhanced-markdown-content h3,
.enhanced-markdown-content h4,
.enhanced-markdown-content h5,
.enhanced-markdown-content h6 {
  @apply font-semibold text-slate-900 dark:text-slate-100;
  scroll-margin-top: 2rem;
  transition: all 0.3s ease;
}

.enhanced-markdown-content h1:hover,
.enhanced-markdown-content h2:hover,
.enhanced-markdown-content h3:hover,
.enhanced-markdown-content h4:hover,
.enhanced-markdown-content h5:hover,
.enhanced-markdown-content h6:hover {
  transform: translateX(4px);
  color: rgb(var(--primary-rgb));
}

.enhanced-markdown-content h1 {
  @apply text-3xl border-b border-slate-200 dark:border-slate-700 pb-2;
  position: relative;
}

.enhanced-markdown-content h1::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, rgb(var(--primary-rgb)), transparent);
  transition: width 0.5s ease;
}

.enhanced-markdown-content h1:hover::after {
  width: 100%;
}

.enhanced-markdown-content h2 {
  @apply text-2xl border-b border-slate-200 dark:border-slate-700 pb-2;
  position: relative;
}

.enhanced-markdown-content h2::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 1px;
  background: linear-gradient(90deg, rgb(var(--primary-rgb)), transparent);
  transition: width 0.4s ease;
}

.enhanced-markdown-content h2:hover::after {
  width: 80%;
}

.enhanced-markdown-content h3 {
  @apply text-xl;
}

.enhanced-markdown-content h4 {
  @apply text-lg;
}

/* Heading Animation Classes */
.animate-heading-appear {
  animation: headingAppear 0.6s ease-out;
}

@keyframes headingAppear {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-link-float {
  animation: linkFloat 2s ease-in-out infinite;
}

@keyframes linkFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

/* Enhanced Paragraphs with Reveal Animation */
.enhanced-markdown-content p {
  @apply my-4 leading-relaxed;
  animation: paragraphReveal 0.5s ease-out;
}

@keyframes paragraphReveal {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.enhanced-markdown-content p:first-child {
  @apply mt-0;
}

.enhanced-markdown-content p:last-child {
  @apply mb-0;
}

.enhanced-markdown-content p:hover {
  transition: all 0.3s ease;
  color: rgb(var(--foreground));
}

/* Enhanced Lists with Staggered Animation */
.enhanced-ol {
  @apply list-decimal;
}

.enhanced-ul {
  @apply list-disc;
}

.enhanced-ol ol,
.enhanced-ul ul {
  @apply mt-2 mb-0;
}

/* List Animation Classes */
.animate-list-appear {
  animation: listAppear 0.5s ease-out;
}

@keyframes listAppear {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-item-appear {
  animation: itemAppear 0.4s ease-out;
}

@keyframes itemAppear {
  from {
    opacity: 0;
    transform: translateX(-5px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-task-appear {
  animation: taskAppear 0.5s ease-out;
}

@keyframes taskAppear {
  from {
    opacity: 0;
    transform: scale(0.95) translateX(-5px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateX(0);
  }
}

.animate-check-appear {
  animation: checkAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes checkAppear {
  from {
    opacity: 0;
    transform: scale(0) rotate(-45deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

.animate-checkbox-appear {
  animation: checkboxAppear 0.3s ease-out;
}

@keyframes checkboxAppear {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Enhanced Code blocks with Smooth Animations */
.code-block-wrapper {
  @apply shadow-sm border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden;
  transition: all 0.3s ease;
}

.code-block-wrapper:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.code-block-wrapper .hljs {
  @apply !bg-slate-50 dark:!bg-slate-900;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
}

/* Code Animation Classes */
.animate-code-appear {
  animation: codeAppear 0.6s ease-out;
}

@keyframes codeAppear {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.animate-tag-appear {
  animation: tagAppear 0.4s ease-out 0.2s both;
}

@keyframes tagAppear {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-label-fade {
  animation: labelFade 0.5s ease-out 0.3s both;
}

@keyframes labelFade {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-code-highlight {
  animation: codeHighlight 0.8s ease-out;
}

@keyframes codeHighlight {
  from {
    opacity: 0;
    filter: blur(1px);
  }
  to {
    opacity: 1;
    filter: blur(0);
  }
}

.code-overlay {
  animation: codeShimmer 3s ease-in-out infinite;
}

@keyframes codeShimmer {
  0%, 100% { transform: translateX(-100%); }
  50% { transform: translateX(100%); }
}

/* Enhanced Inline code with Hover Effects */
.inline-code {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  position: relative;
}

.inline-code::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(45deg, rgba(var(--primary-rgb), 0.1), rgba(var(--primary-rgb), 0.05));
  opacity: 0;
  border-radius: inherit;
  transition: opacity 0.2s ease;
}

.inline-code:hover::before {
  opacity: 1;
}

/* Enhanced Tables with Hover Effects */
.enhanced-table {
  @apply border-collapse;
}

/* Table Animation Classes */
.animate-table-appear {
  animation: tableAppear 0.6s ease-out;
}

@keyframes tableAppear {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.animate-row-highlight {
  transition: all 0.2s ease;
}

.animate-row-highlight:hover {
  transform: scale(1.01);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* Enhanced Math expressions with Glow Effect */
.math-inline {
  @apply px-1 py-0.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded text-blue-900 dark:text-blue-100;
  font-family: 'Computer Modern', 'Latin Modern Math', 'STIX Two Math', serif;
  position: relative;
  transition: all 0.3s ease;
}

.math-inline:hover {
  transform: scale(1.05);
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
}

.math-block {
  font-family: 'Computer Modern', 'Latin Modern Math', 'STIX Two Math', serif;
  @apply text-center overflow-x-auto;
  transition: all 0.3s ease;
}

.math-block:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

/* Task lists */
.task-list-item input[type="checkbox"] {
  @apply hidden;
}

/* Enhanced Blockquotes with Slide Animation */
.enhanced-blockquote .blockquote-content p:first-child {
  @apply mt-0;
}

.enhanced-blockquote .blockquote-content p:last-child {
  @apply mb-0;
}

.animate-blockquote-slide {
  animation: blockquoteSlide 0.5s ease-out;
}

@keyframes blockquoteSlide {
  from {
    opacity: 0;
    transform: translateX(-20px);
    border-left-width: 0;
  }
  to {
    opacity: 1;
    transform: translateX(0);
    border-left-width: 4px;
  }
}

/* Enhanced Horizontal rules with Gradient */
.enhanced-markdown-content hr {
  @apply my-8 border-0 h-px;
  background: linear-gradient(90deg, transparent, rgb(var(--border)), transparent);
  animation: hrAppear 0.6s ease-out;
}

/* Fix for UI layout artifacts and container issues */
.enhanced-markdown-content {
  /* Prevent layout shifts and artifacts */
  contain: layout style;
  transform: translateZ(0); /* Force GPU acceleration */
  position: relative;
  z-index: 1;
}

/* Fix content overflow and boundary issues */
.enhanced-markdown-content * {
  box-sizing: border-box;
  max-width: 100%;
}

/* Fix strange UI boxes/frames */
.enhanced-markdown-content,
.enhanced-markdown-content * {
  /* Remove any unexpected borders or backgrounds */
  outline: none;
}

.enhanced-markdown-content img,
.enhanced-markdown-content video,
.enhanced-markdown-content iframe {
  /* Prevent media from causing layout issues */
  max-width: 100%;
  height: auto;
  display: block;
  margin: 0.5rem 0;
}

/* Fix z-index and positioning conflicts */
.enhanced-markdown-content .code-block-wrapper,
.enhanced-markdown-content .enhanced-blockquote,
.enhanced-markdown-content .table-wrapper {
  position: relative;
  z-index: auto;
  isolation: isolate;
}

@keyframes hrAppear {
  from {
    opacity: 0;
    transform: scaleX(0);
  }
  to {
    opacity: 1;
    transform: scaleX(1);
  }
}

/* Enhanced Error Content Styles with Improved Expansion */
.error-content {
  @apply relative z-10;
  /* Fix layout artifacts */
  contain: layout style;
  overflow: visible;
  box-sizing: border-box;
}

.error-content details {
  @apply mt-2;
  /* Enhanced details/summary styling */
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 0.375rem;
  overflow: hidden;
  background: rgba(239, 68, 68, 0.02);
  transition: all 0.3s ease;
}

.error-content details:hover {
  border-color: rgba(239, 68, 68, 0.4);
  background: rgba(239, 68, 68, 0.05);
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.1);
}

.error-content details[open] {
  border-color: rgba(239, 68, 68, 0.5);
  background: rgba(239, 68, 68, 0.08);
}

.error-content summary {
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

.error-content summary:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.error-content summary::marker {
  display: none;
}

.error-content summary::after {
  content: '▶';
  font-size: 0.75rem;
  transition: transform 0.2s ease;
  color: currentColor;
  opacity: 0.7;
}

.error-content details[open] summary::after {
  transform: rotate(90deg);
}

.error-content pre {
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

/* Dark mode error content */
@media (prefers-color-scheme: dark) {
  .error-content details {
    border-color: rgba(248, 113, 113, 0.3);
    background: rgba(248, 113, 113, 0.03);
  }
  
  .error-content details:hover {
    border-color: rgba(248, 113, 113, 0.5);
    background: rgba(248, 113, 113, 0.08);
  }
  
  .error-content summary {
    background: rgba(248, 113, 113, 0.08);
    border-bottom-color: rgba(248, 113, 113, 0.2);
  }
  
  .error-content summary:hover {
    background: rgba(248, 113, 113, 0.15);
    color: #f87171;
  }
  
  .error-content pre {
    background: rgba(248, 113, 113, 0.08) !important;
  }
}

/* Enhanced Images with Hover Effects */
.enhanced-markdown-content img {
  @apply rounded-lg shadow-sm max-w-full h-auto my-4;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: imageAppear 0.6s ease-out;
}

.enhanced-markdown-content img:hover {
  transform: scale(1.02) translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

@keyframes imageAppear {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Enhanced Links with Animation */
.animate-link-appear {
  animation: linkAppear 0.4s ease-out;
}

@keyframes linkAppear {
  from {
    opacity: 0;
    transform: translateY(2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-external-float {
  animation: externalFloat 2s ease-in-out infinite;
}

@keyframes externalFloat {
  0%, 100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(1px, -1px);
  }
}

/* Enhanced Selection styles */
.enhanced-markdown-content ::selection {
  @apply bg-blue-200 dark:bg-blue-800;
}

/* Enhanced Focus styles for accessibility */
.enhanced-markdown-content a:focus-visible,
.enhanced-markdown-content button:focus-visible {
  @apply outline-2 outline-offset-2 outline-blue-500;
  animation: focusGlow 0.3s ease-out;
}

@keyframes focusGlow {
  from {
    outline-color: rgba(59, 130, 246, 0.3);
  }
  to {
    outline-color: rgba(59, 130, 246, 1);
  }
}

/* Copy button enhancement */
.copy-code-btn {
  position: relative;
  overflow: hidden;
}

.copy-code-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.copy-code-btn:hover::before {
  opacity: 1;
}

.copy-code-btn:active {
  animation: copyClick 0.2s ease-out;
}

@keyframes copyClick {
  0% { transform: scale(1); }
  50% { transform: scale(0.95); }
  100% { transform: scale(1); }
}

/* Enhanced Responsive design with animations */
@media (max-width: 640px) {
  .enhanced-markdown-content {
    font-size: 0.9rem;
    line-height: 1.6;
  }
  
  .enhanced-markdown-content h1 {
    @apply text-2xl;
  }
  
  .enhanced-markdown-content h2 {
    @apply text-xl;
  }
  
  .code-block-wrapper {
    transform: none;
  }
  
  .code-block-wrapper:hover {
    transform: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .enhanced-markdown-content,
  .animate-content-reveal,
  .animate-heading-appear,
  .animate-link-float,
  .animate-list-appear,
  .animate-item-appear,
  .animate-task-appear,
  .animate-check-appear,
  .animate-checkbox-appear,
  .animate-code-appear,
  .animate-tag-appear,
  .animate-label-fade,
  .animate-code-highlight,
  .animate-table-appear,
  .animate-row-highlight,
  .animate-blockquote-slide,
  .animate-link-appear,
  .animate-external-float {
    animation: none !important;
  }
  
  .enhanced-markdown-content h1:hover,
  .enhanced-markdown-content h2:hover,
  .enhanced-markdown-content h3:hover,
  .enhanced-markdown-content h4:hover,
  .enhanced-markdown-content h5:hover,
  .enhanced-markdown-content h6:hover {
    transform: none;
  }
  
  .enhanced-markdown-content img:hover {
    transform: none;
  }
  
  .math-inline:hover,
  .math-block:hover {
    transform: none;
  }
  
  .code-block-wrapper:hover {
    transform: none;
  }
}

/* Dark theme specific adjustments */
@media (prefers-color-scheme: dark) {
  .hljs {
    background: rgb(15 23 42) !important;
    color: rgb(226 232 240) !important;
  }
}
</style>