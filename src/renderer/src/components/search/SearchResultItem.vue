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
        <div v-if="isSemanticResult" class="similarity-score" :title="`Similarity: ${(result.score * 100).toFixed(1)}%`">
          <Brain :size="14" />
          <span class="score-value">{{ (result.score * 100).toFixed(0) }}%</span>
        </div>

        <button
          @click="findSimilar"
          class="action-btn similar-btn"
          title="Find Similar Messages"
        >
          <Search :size="14" />
        </button>

        <button
          @click="copyContent"
          class="action-btn copy-btn"
          title="Copy Content"
        >
          <Copy :size="14" />
        </button>

        <button
          @click="goToMessage"
          class="action-btn goto-btn"
          title="Go to Message"
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
        <button @click.stop="toggleExpanded" class="expand-toggle">
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
        <button @click="showContext = false" class="context-close">
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
        <span
          v-for="tag in result.message.tags.slice(0, 3)"
          :key="tag"
          class="tag-item"
        >
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
          <span
            v-for="topic in semanticInsights.topics.slice(0, 3)"
            :key="topic"
            class="topic-tag"
          >
            {{ topic }}
          </span>
        </div>
        
        <div v-if="semanticInsights.sentiment" class="insight-sentiment">
          <span class="insight-label">Tone:</span>
          <span class="sentiment-value" :class="`sentiment-${semanticInsights.sentiment.toLowerCase()}`">
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
  Brain, Search, Copy, ExternalLink, ChevronUp, ChevronDown,
  Paperclip, File, Image, MessageSquare, X, Tag, AlertTriangle,
  Lightbulb, User, Bot, Settings
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
const isSemanticResult = computed(() => 
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
    case 'user': return User
    case 'assistant': return Bot
    case 'system': return Settings
    default: return MessageSquare
  }
}

const formatRole = (role: string) => {
  return role.charAt(0).toUpperCase() + role.slice(1)
}

const formatTime = (timestamp: Date) => {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  
  if (diff < 60000) { // < 1 minute
    return 'Just now'
  } else if (diff < 3600000) { // < 1 hour
    return `${Math.floor(diff / 60000)}m ago`
  } else if (diff < 86400000) { // < 1 day
    return `${Math.floor(diff / 3600000)}h ago`
  } else if (diff < 604800000) { // < 1 week
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
  0%, 100% {
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
</style>