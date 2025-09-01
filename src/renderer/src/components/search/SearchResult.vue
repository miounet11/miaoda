<template>
  <div class="search-result" :class="resultClasses" @click="$emit('message-click')">
    <!-- Result Header -->
    <div class="result-header">
      <div class="result-meta">
        <div class="message-role">
          <component :is="roleIcon" :size="16" :class="roleIconClass" />
          <span class="role-text">{{ roleDisplayName }}</span>
        </div>

        <div class="message-info">
          <span class="message-time" :title="fullTimestamp">
            {{ formatTime(result.message.timestamp) }}
          </span>

          <span v-if="result.message.chatId" class="chat-info">
            <MessageSquare :size="12" />
            <button
              @click.stop="$emit('chat-click')"
              class="chat-link"
              :title="$t('search.goToChat')"
             aria-label="按钮">
              {{ getChatTitle(result.message.chatId) }}
            </button>
          </span>
        </div>
      </div>

      <div class="result-actions">
        <div class="relevance-score" :title="$t('search.relevanceScore')">
          <Star :size="14" :class="scoreClasses" />
          <span class="score-text">{{ Math.round(result.score * 100) }}%</span>
        </div>

        <button @click.stop="copyMessage" class="action-btn" :title="$t('common.copy')" aria-label="按钮">
          <Copy :size="14" />
        </button>

        <button
          @click.stop="toggleExpanded"
          class="action-btn expand-btn"
          :class="{ expanded: isExpanded }"
          :title="isExpanded ? $t('common.collapse') : $t('common.expand')"
         aria-label="按钮">
          <ChevronDown :size="14" />
        </button>
      </div>
    </div>

    <!-- Message Preview -->
    <div class="message-preview">
      <div class="preview-content" :class="{ expanded: isExpanded }">
        <div v-if="highlightedContent" class="highlighted-content" v-html="highlightedContent" />
        <div v-else class="raw-content">{{ result.message.content }}</div>

        <!-- Message Metadata -->
        <div
          v-if="result.message.metadata && Object.keys(result.message.metadata).length > 0"
          class="message-metadata"
        >
          <div class="metadata-header">
            <Info :size="14" />
            <span>{{ $t('search.metadata') }}</span>
          </div>
          <div class="metadata-content">
            <div
              v-for="[key, value] in Object.entries(result.message.metadata)"
              :key="key"
              class="metadata-item"
            >
              <span class="metadata-key">{{ key }}:</span>
              <span class="metadata-value">{{ formatMetadataValue(value) }}</span>
            </div>
          </div>
        </div>

        <!-- Message Tags -->
        <div v-if="result.message.tags && result.message.tags.length > 0" class="message-tags">
          <Tag :size="14" />
          <div class="tags-list">
            <span
              v-for="tag in result.message.tags"
              :key="tag"
              class="tag-item"
              @click.stop="$emit('tag-click', tag)"
            >
              {{ tag }}
            </span>
          </div>
        </div>
      </div>

      <!-- Truncation Indicator -->
      <div v-if="!isExpanded && isTruncated" class="truncation-indicator">
        <span class="truncation-text">{{ $t('search.messageTruncated') }}</span>
        <button @click.stop="toggleExpanded" class="expand-link" aria-label="按钮">
          {{ $t('search.showMore') }}
        </button>
      </div>
    </div>

    <!-- Search Matches -->
    <div v-if="result.matches.length > 0" class="search-matches">
      <div class="matches-header">
        <Search :size="14" />
        <span>{{ $t('search.matches', { count: result.matches.length }) }}</span>
      </div>

      <div class="matches-list">
        <div v-for="(match, index) in displayedMatches" :key="index" class="match-item">
          <div class="match-field">{{ match.field }}</div>
          <div class="match-text" v-html="match.highlighted" />
        </div>

        <button
          v-if="result.matches.length > maxDisplayedMatches && !showAllMatches"
          @click="showAllMatches = true"
          class="show-more-matches"
          aria-label="显示更多匹配结果"
        >
          {{ $t('search.showMoreMatches', { count: result.matches.length - maxDisplayedMatches }) }}
        </button>
      </div>
    </div>

    <!-- Context Messages -->
    <div
      v-if="result.context && (result.context.before.length > 0 || result.context.after.length > 0)"
      class="context-messages"
    >
      <div class="context-header">
        <MessageCircle :size="14" />
        <span>{{ $t('search.context') }}</span>
        <button @click="toggleContext" class="context-toggle" aria-label="按钮">
          {{ showContext ? $t('common.hide') : $t('common.show') }}
        </button>
      </div>

      <div v-if="showContext" class="context-content">
        <!-- Before Context -->
        <div v-if="result.context.before.length > 0" class="context-section">
          <div class="context-label">{{ $t('search.before') }}</div>
          <div class="context-messages-list">
            <div v-for="msg in result.context.before" :key="msg.id" class="context-message">
              <div class="context-message-role">
                <component :is="getMessageRoleIcon(msg.role)" :size="12" />
              </div>
              <div class="context-message-content">{{ truncateText(msg.content, 100) }}</div>
            </div>
          </div>
        </div>

        <!-- After Context -->
        <div v-if="result.context.after.length > 0" class="context-section">
          <div class="context-label">{{ $t('search.after') }}</div>
          <div class="context-messages-list">
            <div v-for="msg in result.context.after" :key="msg.id" class="context-message">
              <div class="context-message-role">
                <component :is="getMessageRoleIcon(msg.role)" :size="12" />
              </div>
              <div class="context-message-content">{{ truncateText(msg.content, 100) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Attachment Indicators -->
    <div v-if="hasAttachments" class="attachments-indicator">
      <Paperclip :size="14" />
      <span>{{ $t('search.hasAttachments') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  User,
  Bot,
  Settings,
  MessageSquare,
  Star,
  Copy,
  ChevronDown,
  Info,
  Tag,
  Search,
  MessageCircle,
  Paperclip
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import type { SearchResult, SearchQuery } from '@renderer/src/services/search/SearchService'

// Props
interface Props {
  result: SearchResult
  query?: SearchQuery | null
  compact?: boolean
  showContext?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  query: null,
  compact: false,
  showContext: false
})

// Emits
const emit = defineEmits<{
  'message-click': []
  'chat-click': []
  'tag-click': [tag: string]
}>()

// Composables
const { t } = useI18n()

// State
const isExpanded = ref(false)
const showAllMatches = ref(false)
const showContext = ref(props.showContext)
const maxDisplayedMatches = 3
const maxPreviewLength = 300

// Computed properties
const resultClasses = computed(() => ({
  'result-compact': props.compact,
  'result-expanded': isExpanded.value,
  'result-high-score': props.result.score > 0.8
}))

const roleIcon = computed(() => {
  switch (props.result.message.role) {
    case 'user':
      return User
    case 'assistant':
      return Bot
    case 'system':
      return Settings
    default:
      return MessageSquare
  }
})

const roleIconClass = computed(() => ({
  'role-user': props.result.message.role === 'user',
  'role-assistant': props.result.message.role === 'assistant',
  'role-system': props.result.message.role === 'system'
}))

const roleDisplayName = computed(() => {
  switch (props.result.message.role) {
    case 'user':
      return t('message.user')
    case 'assistant':
      return t('message.assistant')
    case 'system':
      return t('message.system')
    default:
      return props.result.message.role
  }
})

const scoreClasses = computed(() => ({
  'score-high': props.result.score > 0.8,
  'score-medium': props.result.score > 0.5 && props.result.score <= 0.8,
  'score-low': props.result.score <= 0.5
}))

const fullTimestamp = computed(() => {
  return props.result.message.timestamp?.toLocaleString() || ''
})

const highlightedContent = computed(() => {
  if (!props.result.matches.length || !props.query?.options?.highlightMatches) {
    return null
  }

  let content = props.result.message.content || ''

  // Apply highlights from matches
  const matches = [...props.result.matches]
    .filter(match => match.field === 'content')
    .sort((a, b) => b.startIndex - a.startIndex) // Sort in reverse order to maintain indices

  for (const match of matches) {
    content =
      content.slice(0, match.startIndex) +
      `<mark class="search-highlight">${match.text}</mark>` +
      content.slice(match.endIndex)
  }

  return content
})

const isTruncated = computed(() => {
  if (!props.result.message.content) return false
  return !isExpanded.value && props.result.message.content.length > maxPreviewLength
})

const displayedMatches = computed(() => {
  if (showAllMatches.value) {
    return props.result.matches
  }
  return props.result.matches.slice(0, maxDisplayedMatches)
})

const hasAttachments = computed(() => {
  return props.result.message.metadata?.attachments?.length > 0
})

// Methods
const formatTime = (timestamp?: Date): string => {
  if (!timestamp) return ''

  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()

  if (diff < 60000) {
    return t('time.justNow')
  } else if (diff < 3600000) {
    return t('time.minutesAgo', { minutes: Math.floor(diff / 60000) })
  } else if (diff < 86400000) {
    return t('time.hoursAgo', { hours: Math.floor(diff / 3600000) })
  } else if (diff < 2592000000) {
    return t('time.daysAgo', { days: Math.floor(diff / 86400000) })
  } else {
    return timestamp.toLocaleDateString()
  }
}

const getChatTitle = (chatId: string): string => {
  // This would typically fetch from a chat store
  return chatId.slice(0, 8) + '...'
}

const formatMetadataValue = (value: any): string => {
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

const truncateText = (text: string | undefined, maxLength: number): string => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

const getMessageRoleIcon = (role: string) => {
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

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const toggleContext = () => {
  showContext.value = !showContext.value
}

const copyMessage = async () => {
  if (!props.result.message.content) return

  try {
    await navigator.clipboard.writeText(props.result.message.content)
    // Show success toast
  } catch (error) {
    console.error('Failed to copy message:', error)
  }
}
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
.search-result {
  @apply bg-background border border-border rounded-lg p-4 hover:bg-accent/30 transition-all duration-200 cursor-pointer;
  contain: layout style paint;
}

.result-compact {
  @apply p-3;
}

.result-expanded {
  @apply border-primary/50 shadow-md;
}

.result-high-score {
  @apply border-l-4 border-l-green-500;
}

.result-header {
  @apply flex items-start justify-between mb-3;
}

.result-meta {
  @apply flex flex-col gap-2 flex-1 min-w-0;
}

.message-role {
  @apply flex items-center gap-2;
}

.role-user {
  @apply text-blue-600 dark:text-blue-400;
}

.role-assistant {
  @apply text-green-600 dark:text-green-400;
}

.role-system {
  @apply text-orange-600 dark:text-orange-400;
}

.role-text {
  @apply text-sm font-medium;
}

.message-info {
  @apply flex items-center gap-3 text-xs text-muted-foreground;
}

.chat-link {
  @apply hover:text-primary hover:underline transition-colors;
}

.result-actions {
  @apply flex items-center gap-2;
}

.relevance-score {
  @apply flex items-center gap-1 text-xs;
}

.score-high {
  @apply text-green-600 dark:text-green-400;
}

.score-medium {
  @apply text-yellow-600 dark:text-yellow-400;
}

.score-low {
  @apply text-red-600 dark:text-red-400;
}

.score-text {
  @apply font-mono;
}

.action-btn {
  @apply p-2 rounded-md hover:bg-accent transition-colors;
}

.expand-btn.expanded {
  @apply rotate-180;
}

.message-preview {
  @apply space-y-3;
}

.preview-content {
  @apply text-sm line-clamp-4;
}

.preview-content.expanded {
  @apply line-clamp-none;
}

.highlighted-content {
  @apply leading-relaxed;
}

.raw-content {
  @apply text-muted-foreground leading-relaxed;
}

:deep(.search-highlight) {
  @apply bg-yellow-200 dark:bg-yellow-800 px-1 rounded;
}

.message-metadata {
  @apply mt-3 p-3 bg-muted/50 rounded-lg;
}

.metadata-header {
  @apply flex items-center gap-2 text-xs font-medium mb-2;
}

.metadata-content {
  @apply space-y-1;
}

.metadata-item {
  @apply flex items-start gap-2 text-xs;
}

.metadata-key {
  @apply font-mono text-muted-foreground min-w-0 flex-shrink-0;
}

.metadata-value {
  @apply font-mono break-all;
}

.message-tags {
  @apply flex items-center gap-2 mt-3;
}

.tags-list {
  @apply flex flex-wrap gap-1;
}

.tag-item {
  @apply px-2 py-1 bg-primary/10 text-primary text-xs rounded-full cursor-pointer hover:bg-primary/20 transition-colors;
}

.truncation-indicator {
  @apply flex items-center gap-2 mt-2 text-xs text-muted-foreground;
}

.expand-link {
  @apply text-primary hover:underline;
}

.search-matches {
  @apply mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg;
}

.matches-header {
  @apply flex items-center gap-2 text-xs font-medium mb-2;
}

.matches-list {
  @apply space-y-2;
}

.match-item {
  @apply flex flex-col gap-1;
}

.match-field {
  @apply text-xs font-mono text-muted-foreground;
}

.match-text {
  @apply text-xs bg-background p-2 rounded border;
}

.show-more-matches {
  @apply text-xs text-primary hover:underline mt-2;
}

.context-messages {
  @apply mt-4 border-t border-border pt-3;
}

.context-header {
  @apply flex items-center gap-2 text-xs font-medium mb-3;
}

.context-toggle {
  @apply ml-auto text-primary hover:underline;
}

.context-content {
  @apply space-y-3;
}

.context-section {
  @apply space-y-2;
}

.context-label {
  @apply text-xs font-medium text-muted-foreground;
}

.context-messages-list {
  @apply space-y-1;
}

.context-message {
  @apply flex items-start gap-2 p-2 bg-muted/30 rounded text-xs;
}

.context-message-role {
  @apply flex-shrink-0 text-muted-foreground;
}

.context-message-content {
  @apply flex-1 min-w-0 text-muted-foreground;
}

.attachments-indicator {
  @apply flex items-center gap-2 mt-3 text-xs text-muted-foreground;
}

/* Responsive */
@media (max-width: 768px) {
  .result-header {
    @apply flex-col gap-3;
  }

  .result-actions {
    @apply self-end;
  }

  .message-info {
    @apply flex-col items-start gap-1;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .search-result {
    @apply border-2;
  }

  :deep(.search-highlight) {
    @apply border border-yellow-600;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .search-result {
    transition: none;
  }

  .expand-btn.expanded {
    transform: none;
  }
}


/* 焦点样式 */
:focus-visible {
  outline: 2px solid hsl(var(--ring, 59 130 230));
  outline-offset: 2px;
}

/* 🎨 微交互和动画 */
.btn-primary {
  position: relative;
  overflow: hidden;
  transition: all 0.2s ease;
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.3s ease, height 0.3s ease;
}

.btn-primary:active::before {
  width: 300px;
  height: 300px;
}

/* 悬停效果 */
.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 加载动画 */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid hsl(var(--border));
  border-top: 2px solid hsl(var(--primary));
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 淡入动画 */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-in {
  animation: fade-in 0.3s ease-out;
}

/* 成功状态动画 */
@keyframes success-bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

.success-animation {
  animation: success-bounce 1s ease;
}</style>
