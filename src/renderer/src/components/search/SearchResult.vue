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
            >
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
        
        <button
          @click.stop="copyMessage"
          class="action-btn"
          :title="$t('common.copy')"
        >
          <Copy :size="14" />
        </button>
        
        <button
          @click.stop="toggleExpanded"
          class="action-btn expand-btn"
          :class="{ 'expanded': isExpanded }"
          :title="isExpanded ? $t('common.collapse') : $t('common.expand')"
        >
          <ChevronDown :size="14" />
        </button>
      </div>
    </div>
    
    <!-- Message Preview -->
    <div class="message-preview">
      <div class="preview-content" :class="{ 'expanded': isExpanded }">
        <div v-if="highlightedContent" class="highlighted-content" v-html="highlightedContent" />
        <div v-else class="raw-content">{{ result.message.content }}</div>
        
        <!-- Message Metadata -->
        <div v-if="result.message.metadata && Object.keys(result.message.metadata).length > 0" class="message-metadata">
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
        <button @click.stop="toggleExpanded" class="expand-link">
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
        <div
          v-for="(match, index) in displayedMatches"
          :key="index"
          class="match-item"
        >
          <div class="match-field">{{ match.field }}</div>
          <div class="match-text" v-html="match.highlighted" />
        </div>
        
        <button
          v-if="result.matches.length > maxDisplayedMatches && !showAllMatches"
          @click="showAllMatches = true"
          class="show-more-matches"
        >
          {{ $t('search.showMoreMatches', { count: result.matches.length - maxDisplayedMatches }) }}
        </button>
      </div>
    </div>
    
    <!-- Context Messages -->
    <div v-if="result.context && (result.context.before.length > 0 || result.context.after.length > 0)" class="context-messages">
      <div class="context-header">
        <MessageCircle :size="14" />
        <span>{{ $t('search.context') }}</span>
        <button @click="toggleContext" class="context-toggle">
          {{ showContext ? $t('common.hide') : $t('common.show') }}
        </button>
      </div>
      
      <div v-if="showContext" class="context-content">
        <!-- Before Context -->
        <div v-if="result.context.before.length > 0" class="context-section">
          <div class="context-label">{{ $t('search.before') }}</div>
          <div class="context-messages-list">
            <div
              v-for="msg in result.context.before"
              :key="msg.id"
              class="context-message"
            >
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
            <div
              v-for="msg in result.context.after"
              :key="msg.id"
              class="context-message"
            >
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
  User, Bot, Settings, MessageSquare, Star, Copy, ChevronDown, Info, Tag,
  Search, MessageCircle, Paperclip
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
    content = content.slice(0, match.startIndex) +
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
</style>