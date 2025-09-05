<template>
  <div class="search-result-item" :class="{ 'semantic-result': isSemanticResult }">
    <!-- Result Header -->
    <div class="result-header">
      <div class="message-info">
        <div class="role-indicator" :class="`role-${result.message.role}`">
          <component :is="getRoleIcon(result.message.role)" :size="16" />
        </div>

        <div class="message-meta">
          <span class="message-role">{{ formatRole(result.message.role) }}</span>
          <span class="message-time">{{ formatTime(result.message.timestamp) }}</span>
          <span v-if="result.message.chatTitle" class="chat-title">
            in {{ result.message.chatTitle }}
          </span>
        </div>
      </div>

      <div class="result-actions">
        <div
          v-if="isSemanticResult"
          class="similarity-score"
          :title="`Similarity: ${(result.score * 100).toFixed(1)}%`"
        >
          <Brain :size="14" />
          <span class="score-value">{{ (result.score * 100).toFixed(0) }}%</span>
        </div>

        <button
          @click="findSimilar"
          class="action-btn similar-btn"
          title="Find Similar Messages"
          aria-label="按钮"
        >
          <Search :size="14" />
        </button>

        <button
          @click="copyContent"
          class="action-btn copy-btn"
          title="Copy Content"
          aria-label="按钮"
        >
          <Copy :size="14" />
        </button>

        <button
          @click="goToMessage"
          class="action-btn goto-btn"
          title="Go to Message"
          aria-label="按钮"
        >
          <ExternalLink :size="14" />
        </button>
      </div>
    </div>

    <!-- Message Content -->
    <div class="message-content" @click="goToMessage">
      <div v-if="result.matches && result.matches.length > 0" class="highlighted-content">
        <div
          v-for="(match, index) in result.matches"
          :key="index"
          class="content-match"
          v-html="match.highlighted"
        />
      </div>

      <div v-else class="full-content" v-html="highlightedContent" />

      <!-- Content preview for long messages -->
      <div v-if="isTruncated" class="content-preview">
        <button @click.stop="toggleExpanded" class="expand-toggle" aria-label="按钮">
          {{ isExpanded ? 'Show less' : 'Show more' }}
          <component :is="isExpanded ? ChevronUp : ChevronDown" :size="14" />
        </button>
      </div>
    </div>

    <!-- Attachments -->
    <div v-if="result.message.attachments?.length" class="message-attachments">
      <div class="attachments-header">
        <Paperclip :size="14" />
        <span>{{ result.message.attachments.length }} attachment(s)</span>
      </div>

      <div class="attachment-list">
        <div
          v-for="(attachment, index) in result.message.attachments.slice(0, 3)"
          :key="index"
          class="attachment-item"
        >
          <component :is="getAttachmentIcon(attachment)" :size="14" />
          <span class="attachment-name">{{ getAttachmentName(attachment) }}</span>
        </div>

        <div v-if="result.message.attachments.length > 3" class="more-attachments">
          +{{ result.message.attachments.length - 3 }} more
        </div>
      </div>
    </div>

    <!-- Context Messages (for semantic search) -->
    <div v-if="showContext && contextMessages.length > 0" class="context-messages">
      <div class="context-header">
        <MessageSquare :size="14" />
        <span>Related Context</span>
        <button @click="showContext = false" class="context-close" aria-label="按钮">
          <X :size="12" />
        </button>
      </div>

      <div class="context-list">
        <div
          v-for="contextMsg in contextMessages.slice(0, 2)"
          :key="contextMsg.id"
          class="context-item"
          @click="goToMessage(contextMsg)"
        >
          <div class="context-role" :class="`role-${contextMsg.role}`">
            <component :is="getRoleIcon(contextMsg.role)" :size="12" />
          </div>
          <div class="context-content">
            {{ truncateText(contextMsg.content, 100) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Tags and Metadata -->
    <div v-if="result.message.metadata || result.message.tags?.length" class="message-metadata">
      <div v-if="result.message.tags?.length" class="message-tags">
        <Tag :size="12" />
        <span v-for="tag in result.message.tags.slice(0, 3)" :key="tag" class="tag-item">
          {{ tag }}
        </span>
      </div>

      <div v-if="result.message.error" class="error-indicator">
        <AlertTriangle :size="12" />
        <span class="error-text">{{ result.message.error }}</span>
      </div>
    </div>

    <!-- Semantic Insights (for AI-powered results) -->
    <div v-if="isSemanticResult && semanticInsights" class="semantic-insights">
      <div class="insights-header">
        <Lightbulb :size="14" />
        <span>AI Insights</span>
      </div>

      <div class="insights-content">
        <div v-if="semanticInsights.topics?.length" class="insight-topics">
          <span class="insight-label">Topics:</span>
          <span v-for="topic in semanticInsights.topics.slice(0, 3)" :key="topic" class="topic-tag">
            {{ topic }}
          </span>
        </div>

        <div v-if="semanticInsights.sentiment" class="insight-sentiment">
          <span class="insight-label">Tone:</span>
          <span
            class="sentiment-value"
            :class="`sentiment-${semanticInsights.sentiment.toLowerCase()}`"
          >
            {{ semanticInsights.sentiment }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Brain,
  Search,
  Copy,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Paperclip,
  File,
  Image,
  MessageSquare,
  X,
  Tag,
  AlertTriangle,
  Lightbulb,
  User,
  Bot,
  Settings
} from 'lucide-vue-next'
import type { SearchResult } from '@main/db/searchTypes'

// Props
interface Props {
  result: SearchResult
  searchType: 'lexical' | 'semantic' | 'hybrid'
  highlightQuery?: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'message-click': [result: SearchResult]
  'similar-search': [messageId: string]
  'context-request': [messageId: string]
}>()

// Refs
const isExpanded = ref(false)
const showContext = ref(false)
const contextMessages = ref<any[]>([])
const semanticInsights = ref<any>(null)

// Computed
const isSemanticResult = computed(
  () =>
    props.searchType === 'semantic' || (props.searchType === 'hybrid' && props.result.score > 0.5)
)

const highlightedContent = computed(() => {
  if (!props.highlightQuery) return props.result.message.content

  const query = props.highlightQuery.toLowerCase()
  const content = props.result.message.content
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')

  return content.replace(regex, '<mark class="search-highlight">$1</mark>')
})

const isTruncated = computed(() => {
  const maxLength = 300
  return props.result.message.content.length > maxLength
})

const truncatedContent = computed(() => {
  if (!isTruncated.value || isExpanded.value) {
    return props.result.message.content
  }
  return props.result.message.content.substring(0, 300) + '...'
})

// Methods
const getRoleIcon = (role: string) => {
  switch (role) {
    case 'user':
      return User
    case 'assistant':
      return Bot
    case 'system':
      return Settings
    default:
      return MessageSquare
  }
}

const formatRole = (role: string) => {
  return role.charAt(0).toUpperCase() + role.slice(1)
}

const formatTime = (timestamp: Date) => {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()

  if (diff < 60000) {
    // < 1 minute
    return 'Just now'
  } else if (diff < 3600000) {
    // < 1 hour
    return `${Math.floor(diff / 60000)}m ago`
  } else if (diff < 86400000) {
    // < 1 day
    return `${Math.floor(diff / 3600000)}h ago`
  } else if (diff < 604800000) {
    // < 1 week
    return `${Math.floor(diff / 86400000)}d ago`
  } else {
    return timestamp.toLocaleDateString()
  }
}

const getAttachmentIcon = (attachment: any) => {
  if (!attachment.type) return File

  if (attachment.type.startsWith('image/')) return Image
  return File
}

const getAttachmentName = (attachment: any) => {
  return attachment.name || attachment.filename || 'Attachment'
}

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const goToMessage = (message = props.result.message) => {
  emit('message-click', props.result)
}

const findSimilar = () => {
  emit('similar-search', props.result.message.id)
}

const copyContent = async () => {
  try {
    await navigator.clipboard.writeText(props.result.message.content)
    // Could show a toast notification here
  } catch (error) {
    console.error('Failed to copy content:', error)
  }
}

const loadContext = async () => {
  // This would fetch related messages for context
  // Implementation would depend on backend API
}

const generateSemanticInsights = async () => {
  if (!isSemanticResult.value) return

  // This would generate AI insights about the message
  // For now, we'll create mock insights
  semanticInsights.value = {
    topics: ['AI', 'Search', 'Technology'],
    sentiment: 'Positive',
    keyPhrases: ['machine learning', 'natural language'],
    confidence: 0.85
  }
}

// Lifecycle
onMounted(() => {
  if (isSemanticResult.value) {
    generateSemanticInsights()
  }
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
.search-result-item {
  @apply bg-card border border-border rounded-lg p-4 mb-3 hover:bg-accent/50 
         transition-colors cursor-pointer;
}

.semantic-result {
  @apply border-l-4 border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/30;
}

.result-header {
  @apply flex items-center justify-between mb-3;
}

.message-info {
  @apply flex items-center gap-3;
}

.role-indicator {
  @apply p-2 rounded-full flex items-center justify-center;
}

.role-user {
  @apply bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300;
}

.role-assistant {
  @apply bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300;
}

.role-system {
  @apply bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300;
}

.message-meta {
  @apply flex items-center gap-2 text-sm text-muted-foreground;
}

.message-role {
  @apply font-medium;
}

.chat-title {
  @apply italic;
}

.result-actions {
  @apply flex items-center gap-1;
}

.similarity-score {
  @apply flex items-center gap-1 px-2 py-1 rounded bg-blue-100 text-blue-700 
         dark:bg-blue-900 dark:text-blue-300 text-xs font-medium;
}

.action-btn {
  @apply p-2 rounded hover:bg-accent transition-colors;
}

.message-content {
  @apply text-sm leading-relaxed;
}

.highlighted-content {
  @apply space-y-2;
}

.content-match {
  @apply p-2 rounded bg-muted/50;
}

:deep(.search-highlight) {
  @apply bg-yellow-200 dark:bg-yellow-800 px-1 rounded font-medium;
}

.content-preview {
  @apply mt-2 pt-2 border-t border-border;
}

.expand-toggle {
  @apply flex items-center gap-1 text-xs text-primary hover:underline;
}

.message-attachments {
  @apply mt-3 p-3 bg-muted/30 rounded border;
}

.attachments-header {
  @apply flex items-center gap-2 text-sm font-medium mb-2;
}

.attachment-list {
  @apply space-y-1;
}

.attachment-item {
  @apply flex items-center gap-2 text-sm text-muted-foreground;
}

.more-attachments {
  @apply text-xs text-muted-foreground italic;
}

.context-messages {
  @apply mt-3 border-t border-border pt-3;
}

.context-header {
  @apply flex items-center justify-between text-sm font-medium mb-2;
}

.context-close {
  @apply p-1 hover:bg-accent rounded;
}

.context-list {
  @apply space-y-2;
}

.context-item {
  @apply flex gap-2 p-2 rounded bg-muted/30 hover:bg-muted/50 cursor-pointer;
}

.context-role {
  @apply p-1 rounded-full flex-shrink-0;
}

.context-content {
  @apply text-xs text-muted-foreground flex-1;
}

.message-metadata {
  @apply mt-3 flex items-center gap-4 text-xs;
}

.message-tags {
  @apply flex items-center gap-2;
}

.tag-item {
  @apply px-2 py-1 bg-muted rounded text-muted-foreground;
}

.error-indicator {
  @apply flex items-center gap-1 text-red-600 dark:text-red-400;
}

.semantic-insights {
  @apply mt-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 
         dark:from-blue-950/50 dark:to-purple-950/50 rounded border;
}

.insights-header {
  @apply flex items-center gap-2 text-sm font-medium mb-2;
}

.insights-content {
  @apply space-y-2;
}

.insight-topics,
.insight-sentiment {
  @apply flex items-center gap-2 text-sm;
}

.insight-label {
  @apply font-medium text-muted-foreground;
}

.topic-tag {
  @apply px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 
         rounded text-xs;
}

.sentiment-value {
  @apply px-2 py-0.5 rounded text-xs font-medium;
}

.sentiment-positive {
  @apply bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300;
}

.sentiment-negative {
  @apply bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300;
}

.sentiment-neutral {
  @apply bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .result-header {
    @apply flex-col items-start gap-2;
  }

  .message-info {
    @apply flex-col items-start gap-2;
  }

  .result-actions {
    @apply self-end;
  }

  .message-metadata {
    @apply flex-col items-start gap-2;
  }
}

/* Animation for semantic results */
.semantic-result {
  animation: semanticGlow 2s ease-in-out;
}

@keyframes semanticGlow {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
  }
  50% {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
}

/* Enhanced focus states for accessibility */
.search-result-item:focus-within {
  @apply ring-2 ring-primary ring-offset-2;
}

.action-btn:focus {
  @apply ring-2 ring-primary ring-offset-1;
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
}
</style>
