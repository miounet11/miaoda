<template>
  <div 
    class="message-wrapper relative group"
    :class="wrapperClasses"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Message container with improved spacing -->
    <div class="message-container flex gap-4 relative" :class="containerClasses">
      <!-- Avatar with better positioning -->
      <div class="avatar-section flex-shrink-0" :class="avatarSectionClasses">
        <div 
          class="avatar-bubble transition-all duration-300 ease-out"
          :class="avatarClasses"
        >
          <div class="avatar-content">
            <component :is="avatarIcon" :size="avatarSize" class="avatar-icon" />
          </div>
        </div>
        
        <!-- Connection line for assistant messages -->
        <div 
          v-if="message.role === 'assistant' && !isLastMessage"
          class="connection-line"
        />
      </div>
      
      <!-- Message content with improved contrast -->
      <div class="content-section flex-1 min-w-0" :class="contentSectionClasses">
        <!-- Message bubble with enhanced design -->
        <div 
          class="message-bubble relative group/bubble transition-all duration-300 ease-out"
          :class="bubbleClasses"
          @click="handleBubbleClick"
        >
          <!-- Message header (optional) -->
          <div v-if="showHeader" class="message-header flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="role-label text-xs font-semibold uppercase tracking-wide" :class="roleLabelClasses">
                {{ message.role === 'user' ? 'You' : 'Assistant' }}
              </span>
              <span v-if="message.model" class="model-badge text-xs px-2 py-0.5 bg-muted/40 rounded-full">
                {{ message.model }}
              </span>
            </div>
            <div class="timestamp text-xs text-muted-foreground/60">
              {{ formatTime(message.timestamp) }}
            </div>
          </div>
          
          <!-- Loading state with skeleton -->
          <div v-if="isLoading && !message.content" class="loading-state py-4">
            <SkeletonLoader variant="message" :count="1" size="md" />
            <div class="loading-indicator flex items-center gap-2 mt-3 text-sm text-muted-foreground">
              <div class="thinking-dots flex gap-1">
                <div class="dot animate-thinking" style="animation-delay: 0s"></div>
                <div class="dot animate-thinking" style="animation-delay: 0.3s"></div>
                <div class="dot animate-thinking" style="animation-delay: 0.6s"></div>
              </div>
              <span>AI is thinking...</span>
            </div>
          </div>
          
          <!-- Message content with improved typography -->
          <div v-else class="message-content" :class="contentClasses">
            <MessageContentEnhanced
              :content="message.content"
              :is-loading="isLoading"
              :attachments="message.attachments"
              :error="message.error"
              :show-retry="!!message.error"
              :is-highlighted="isHighlighted"
              :role="message.role"
              @retry="$emit('retry')"
              class="enhanced-content"
            />
            
            <!-- Attachment previews -->
            <div v-if="hasAttachments" class="attachments-section mt-3">
              <AttachmentPreview
                v-for="attachment in message.attachments"
                :key="attachment.id"
                :attachment="attachment"
                :compact="true"
                class="attachment-item"
              />
            </div>
            
            <!-- Error state -->
            <div v-if="message.error" class="error-section mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div class="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle :size="16" />
                <span>{{ message.error.message || 'An error occurred' }}</span>
              </div>
              <button 
                @click="$emit('retry')" 
                class="mt-2 px-3 py-1.5 bg-destructive text-destructive-foreground rounded-md text-xs font-medium hover:bg-destructive/90 transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
          
          <!-- Message status indicator -->
          <div v-if="showStatus && message.role === 'user'" class="message-status mt-2 flex items-center gap-2 text-xs">
            <div class="status-indicator flex items-center gap-1.5" :class="statusClasses">
              <Loader2 v-if="messageStatus === 'sending'" :size="12" class="animate-spin" />
              <Check v-else-if="messageStatus === 'delivered'" :size="12" />
              <XCircle v-else-if="messageStatus === 'error'" :size="12" />
              <span>{{ statusText }}</span>
            </div>
            <div class="character-count text-muted-foreground/60" v-if="message.content">
              {{ message.content.length }} chars
            </div>
          </div>
          
          <!-- Quick action buttons -->
          <Transition name="actions-slide" appear>
            <div 
              v-if="showActions || actionsVisible"
              class="quick-actions absolute -top-1 right-3 flex items-center gap-1 opacity-0 group-hover/bubble:opacity-100 transition-all duration-200"
              :class="actionsClasses"
            >
              <div class="actions-container bg-background/95 backdrop-blur-sm border border-border/60 rounded-lg shadow-lg p-1 flex items-center gap-0.5">
                <button
                  @click="handleCopy"
                  class="quick-action-btn"
                  title="Copy message"
                  :class="{ 'copied': justCopied }"
                >
                  <Check v-if="justCopied" :size="14" class="text-green-600" />
                  <Copy v-else :size="14" />
                </button>
                
                <button
                  v-if="enableVoice && message.content.trim()"
                  @click="toggleSpeech"
                  class="quick-action-btn"
                  :class="{ 'active': isSpeaking }"
                  title="Read aloud"
                >
                  <Volume2 v-if="!isSpeaking" :size="14" />
                  <VolumeX v-else :size="14" />
                </button>
                
                <button
                  v-if="message.role === 'assistant' && !isLoading"
                  @click="$emit('retry')"
                  class="quick-action-btn"
                  title="Regenerate response"
                >
                  <RefreshCw :size="14" />
                </button>
                
                <!-- More actions menu -->
                <div class="relative">
                  <button
                    @click="showMoreActions = !showMoreActions"
                    class="quick-action-btn"
                    :class="{ 'active': showMoreActions }"
                    title="More actions"
                  >
                    <MoreVertical :size="14" />
                  </button>
                  
                  <Transition name="menu-slide">
                    <div v-if="showMoreActions" 
                         class="more-actions-menu absolute top-full right-0 mt-1 w-36 bg-background/95 backdrop-blur-md border border-border/60 rounded-lg shadow-xl z-50">
                      <div class="p-1">
                        <button
                          v-if="message.role === 'user'"
                          @click="$emit('edit'); closeMoreActions()"
                          class="menu-action-btn"
                        >
                          <Edit2 :size="14" />
                          Edit
                        </button>
                        <button
                          @click="$emit('quote'); closeMoreActions()"
                          class="menu-action-btn"
                        >
                          <Quote :size="14" />
                          Quote
                        </button>
                        <button
                          @click="handleShare; closeMoreActions()"
                          class="menu-action-btn"
                        >
                          <Share :size="14" />
                          Share
                        </button>
                        <div class="h-px bg-border/40 my-1" />
                        <button
                          @click="handleDelete; closeMoreActions()"
                          class="menu-action-btn text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 :size="14" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </Transition>
                </div>
              </div>
            </div>
          </Transition>
        </div>
        
        <!-- Reply thread indicator -->
        <div v-if="message.replyTo" class="reply-indicator mt-2 pl-4 border-l-2 border-primary/30">
          <div class="text-xs text-muted-foreground/70">
            Replying to: {{ truncateText(message.replyTo.content, 60) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { 
  Copy, Check, Volume2, VolumeX, RefreshCw, MoreVertical, Edit2, 
  Trash2, Share, Quote, User, Bot, Loader2, XCircle, AlertCircle 
} from 'lucide-vue-next'
import MessageContentEnhanced from '../MessageContentEnhanced.vue'
import SkeletonLoader from '../ui/SkeletonLoader.vue'
import AttachmentPreview from './AttachmentPreview.vue'
import { formatDistanceToNow } from '@renderer/src/utils/time'

interface Props {
  message: any
  isHighlighted?: boolean
  isLoading?: boolean
  isLastMessage?: boolean
  showHeader?: boolean
  showStatus?: boolean
  enableVoice?: boolean
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isHighlighted: false,
  isLoading: false,
  isLastMessage: false,
  showHeader: false,
  showStatus: true,
  enableVoice: true,
  compact: false
})

const emit = defineEmits<{
  'retry': []
  'edit': []
  'delete': []
  'copy': [content: string]
  'quote': []
  'share': []
}>()

// Reactive state
const actionsVisible = ref(false)
const showMoreActions = ref(false)
const justCopied = ref(false)
const isSpeaking = ref(false)

// Computed properties
const wrapperClasses = computed(() => [
  'mb-6',
  props.compact && 'mb-4',
  props.isHighlighted && 'highlighted ring-2 ring-primary/30 ring-offset-2',
  props.message.role === 'user' ? 'user-message' : 'assistant-message'
])

const containerClasses = computed(() => [
  props.message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
])

const avatarSectionClasses = computed(() => [
  'flex flex-col items-center',
  props.message.role === 'user' ? 'ml-2' : 'mr-2'
])

const avatarClasses = computed(() => [
  'w-9 h-9 rounded-full flex items-center justify-center shadow-sm border-2 transition-all duration-300',
  props.message.role === 'user' 
    ? 'bg-gradient-to-br from-primary/90 to-primary border-primary/30' 
    : 'bg-gradient-to-br from-secondary to-secondary/80 border-border',
  'hover:scale-105 hover:shadow-md'
])

const avatarIcon = computed(() => props.message.role === 'user' ? User : Bot)
const avatarSize = computed(() => props.compact ? 14 : 16)

const contentSectionClasses = computed(() => [
  props.message.role === 'user' ? 'items-end' : 'items-start'
])

const bubbleClasses = computed(() => [
  'max-w-[85%] p-4 rounded-2xl shadow-sm border transition-all duration-300 hover:shadow-md',
  props.compact && 'p-3',
  props.message.role === 'user' 
    ? 'bg-primary/95 text-primary-foreground border-primary/20 ml-auto' 
    : 'bg-background border-border/60',
  props.isLoading && 'animate-pulse',
  'hover:scale-[1.02] hover:-translate-y-0.5',
  'relative overflow-visible'
])

const roleLabelClasses = computed(() => [
  props.message.role === 'user' 
    ? 'text-primary-foreground/80' 
    : 'text-muted-foreground'
])

const contentClasses = computed(() => [
  'prose prose-sm max-w-none',
  props.message.role === 'user' 
    ? 'prose-invert text-primary-foreground' 
    : 'text-foreground',
  'leading-relaxed'
])

const hasAttachments = computed(() => props.message.attachments?.length > 0)
const showActions = computed(() => actionsVisible.value)

const messageStatus = computed(() => {
  if (props.isLoading) return 'sending'
  if (props.message.error) return 'error'
  return 'delivered'
})

const statusText = computed(() => {
  switch (messageStatus.value) {
    case 'sending': return 'Sending...'
    case 'error': return 'Failed to send'
    case 'delivered': return 'Delivered'
    default: return ''
  }
})

const statusClasses = computed(() => [
  messageStatus.value === 'sending' && 'text-muted-foreground animate-pulse',
  messageStatus.value === 'error' && 'text-destructive',
  messageStatus.value === 'delivered' && 'text-muted-foreground/60'
])

const actionsClasses = computed(() => [
  props.message.role === 'user' ? 'left-3' : 'right-3'
])

// Methods
const formatTime = (timestamp: Date | string | number | undefined) => {
  if (!timestamp) return 'unknown'
  try {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
    return formatDistanceToNow(date)
  } catch (error) {
    console.error('Error formatting time in ImprovedMessageBubble:', error, timestamp)
    return 'unknown'
  }
}

const handleMouseEnter = () => {
  actionsVisible.value = true
}

const handleMouseLeave = () => {
  setTimeout(() => {
    if (!showMoreActions.value) {
      actionsVisible.value = false
    }
  }, 150)
}

const handleBubbleClick = () => {
  // Could implement message selection or other interactions
}

const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(props.message.content)
    justCopied.value = true
    emit('copy', props.message.content)
    
    setTimeout(() => {
      justCopied.value = false
    }, 2000)
  } catch (error) {
    console.error('Failed to copy message:', error)
  }
}

const toggleSpeech = () => {
  if (isSpeaking.value) {
    // Stop speech
    window.speechSynthesis.cancel()
    isSpeaking.value = false
  } else {
    // Start speech
    const utterance = new SpeechSynthesisUtterance(props.message.content)
    utterance.onstart = () => { isSpeaking.value = true }
    utterance.onend = () => { isSpeaking.value = false }
    utterance.onerror = () => { isSpeaking.value = false }
    
    window.speechSynthesis.speak(utterance)
  }
}

const handleShare = () => {
  if (navigator.share) {
    navigator.share({
      title: 'Shared Message',
      text: props.message.content
    }).catch(console.error)
  } else {
    handleCopy()
  }
}

const handleDelete = () => {
  if (confirm('Are you sure you want to delete this message?')) {
    emit('delete')
  }
}

const closeMoreActions = () => {
  showMoreActions.value = false
  actionsVisible.value = false
}

const truncateText = (text: string, length: number) => {
  return text.length > length ? text.substring(0, length) + '...' : text
}
</script>

<style scoped>
/* === BASE STYLES === */
.message-wrapper {
  scroll-margin-top: 2rem;
}

/* === AVATAR STYLES === */
.avatar-bubble {
  position: relative;
  backdrop-filter: blur(8px);
}

.connection-line {
  width: 2px;
  height: 24px;
  background: linear-gradient(to bottom, hsl(var(--border)), transparent);
  margin: 4px auto 0;
}

/* === BUBBLE IMPROVEMENTS === */
.message-bubble {
  word-wrap: break-word;
  backdrop-filter: blur(8px);
  position: relative;
}

.message-bubble.bg-primary\\/95 {
  background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.9) 100%);
  box-shadow: 0 4px 20px hsl(var(--primary) / 0.15);
}

.message-bubble.bg-background {
  background: hsl(var(--background) / 0.95);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

/* === LOADING ANIMATIONS === */
.dot {
  width: 4px;
  height: 4px;
  background: currentColor;
  border-radius: 50%;
  opacity: 0.4;
}

@keyframes thinking {
  0%, 80%, 100% { 
    opacity: 0.4;
    transform: scale(1);
  }
  40% { 
    opacity: 1;
    transform: scale(1.2);
  }
}

.animate-thinking {
  animation: thinking 1.4s ease-in-out infinite;
}

/* === ACTION BUTTONS === */
.quick-actions {
  z-index: 10;
}

.actions-container {
  backdrop-filter: blur(12px);
}

.quick-action-btn {
  @apply p-2 rounded-md transition-all duration-200 text-muted-foreground;
  @apply hover:bg-secondary/60 hover:text-foreground hover:scale-110;
  @apply active:scale-95;
  min-width: 32px;
  min-height: 32px;
}

.quick-action-btn.active {
  @apply bg-primary/10 text-primary;
}

.quick-action-btn.copied {
  @apply bg-green-50 text-green-600;
}

.menu-action-btn {
  @apply w-full px-3 py-2 text-left rounded-md text-sm transition-colors duration-150;
  @apply flex items-center gap-3 hover:bg-secondary/40;
}

/* === TRANSITIONS === */
.actions-slide-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.actions-slide-leave-active {
  transition: all 0.2s ease-in;
}

.actions-slide-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.9);
}

.actions-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.95);
}

.menu-slide-enter-active {
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.menu-slide-leave-active {
  transition: all 0.15s ease-in;
}

.menu-slide-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.9);
}

.menu-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.95);
}

/* === ENHANCED CONTRAST === */
.user-message .message-bubble {
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.assistant-message .message-bubble {
  border: 1px solid hsl(var(--border) / 0.6);
}

/* === HIGHLIGHTED STATE === */
.highlighted {
  animation: highlight-pulse 2s ease-in-out;
}

@keyframes highlight-pulse {
  0%, 100% { 
    background-color: transparent;
  }
  50% { 
    background-color: hsl(var(--primary) / 0.05);
  }
}

/* === RESPONSIVE DESIGN === */
@media (max-width: 768px) {
  .message-bubble {
    max-width: 92%;
    padding: 0.75rem;
  }
  
  .quick-actions {
    position: static;
    opacity: 1;
    margin-top: 0.5rem;
  }
  
  .actions-container {
    background: hsl(var(--background) / 0.9);
  }
}

/* === ACCESSIBILITY === */
@media (prefers-reduced-motion: reduce) {
  .message-bubble,
  .avatar-bubble,
  .quick-action-btn {
    transition: none;
  }
  
  .message-bubble:hover {
    transform: none;
  }
  
  .animate-thinking {
    animation: none;
    opacity: 0.6;
  }
}

/* === HIGH CONTRAST MODE === */
@media (prefers-contrast: high) {
  .message-bubble {
    border-width: 2px;
  }
  
  .assistant-message .message-bubble {
    border-color: hsl(var(--foreground) / 0.3);
  }
  
  .user-message .message-bubble {
    border-color: hsl(var(--primary-foreground) / 0.3);
  }
}

/* === DARK MODE OPTIMIZATIONS === */
@media (prefers-color-scheme: dark) {
  .message-bubble.bg-background {
    background: hsl(var(--background) / 0.98);
    border-color: hsl(var(--border) / 0.8);
  }
  
  .actions-container {
    background: hsl(var(--background) / 0.98);
    border-color: hsl(var(--border) / 0.8);
  }
}
</style>