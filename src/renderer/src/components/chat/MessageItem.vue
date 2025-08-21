<template>
  <div 
    class="message-item-enhanced group relative gpu-accelerated"
    :class="[messageClasses, { 'message-appear': isNewMessage }]"
    :data-message-id="message.id"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @focusin="handleFocusIn"
    @focusout="handleFocusOut"
  >
    <!-- Modern Message Layout -->
    <div class="flex gap-3 w-full" :class="layoutClasses">
      <!-- Avatar -->
      <div class="avatar-container flex-shrink-0 transition-transform duration-200 group-hover:scale-105" :class="avatarClasses">
        <div class="avatar float-breathe" :class="avatarStyle">
          <component :is="avatarIcon" :size="16" class="avatar-icon" />
        </div>
      </div>
    
      <!-- Message Content -->
      <div class="message-content-wrapper flex-1 min-w-0">
        <!-- Message Bubble -->
        <div 
          class="message-bubble-modern group/bubble"
          :class="[bubbleClasses, { 'elastic-click': !isLoading }]"
          @click="handleBubbleClick"
        >
          <!-- Loading State -->
          <div v-if="isLoading && !message.content" class="loading-content">
            <div class="typing-dots">
              <div class="typing-dot"></div>
              <div class="typing-dot"></div>
              <div class="typing-dot"></div>
            </div>
            <span class="ai-thinking">AI is thinking...</span>
          </div>
          
          <!-- Primary Content Display with Error Handling -->
          <div v-if="!isLoading && message.content" class="message-content-display">
            <!-- Basic content display with enhanced features -->
            <UnifiedMessageContent
              variant="enhanced"
              :content="message.content"
              :is-loading="isLoading"
              :attachments="message.attachments"
              :error="message.error"
              :show-retry="!!message.error"
              :is-highlighted="isHighlighted"
              @retry="$emit('retry')"
              class="enhanced-content"
            />
            
            <!-- Emergency fallback for content display -->
            <div 
              v-if="contentRenderError"
              class="fallback-content whitespace-pre-wrap"
              v-text="message.content"
            />
          </div>
          
          <!-- Simplified Message Status -->
          <div v-if="message.role === 'user' && showStatus" class="message-status text-xs text-muted-foreground mt-1">
            <span v-if="messageStatus === 'sending'" class="flex items-center gap-1">
              <Loader2 :size="10" class="animate-spin" />
              Sending...
            </span>
            <span v-else-if="messageStatus === 'delivered'" class="opacity-60">Delivered</span>
            <span v-else-if="messageStatus === 'error'" class="text-destructive">Failed</span>
          </div>
        
          <!-- Enhanced Action Menu -->
          <Transition name="action-menu" appear>
            <div 
              v-if="showActions || actionsVisible"
              class="action-menu-modern"
              :class="actionMenuClasses"
            >
              <div class="action-buttons-modern">
                <button
                  @click="handleCopy"
                  class="action-button-modern btn-interactive ripple"
                  title="Copy message"
                >
                  <Copy :size="14" />
                </button>
                
                <button
                  v-if="enableVoice && voiceSupported && message.content.trim()"
                  @click="toggleVoiceControls"
                  class="action-button-modern"
                  :class="{ 'active': showVoiceControls }"
                  :title="showVoiceControls ? 'Stop voice' : 'Play voice'"
                >
                  <Volume2 :size="14" />
                </button>
                
                <button
                  v-if="message.role === 'user'"
                  @click="$emit('edit')"
                  class="action-button-modern btn-interactive ripple"
                  title="Edit message"
                >
                  <Edit2 :size="14" />
                </button>
                
                <button
                  v-if="message.role === 'assistant' && !isLoading"
                  @click="$emit('retry')"
                  class="action-button-modern btn-interactive ripple"
                  title="Regenerate response"
                >
                  <RefreshCw :size="14" />
                </button>
                
                <button
                  @click="handleDelete"
                  class="action-button-modern action-button-destructive btn-interactive"
                  title="Delete message"
                >
                  <Trash2 :size="14" />
                </button>
              </div>
            </div>
          </Transition>
        </div>
        
        <!-- Enhanced Voice Controls -->
        <Transition name="voice-controls" appear>
          <div 
            v-if="showVoiceControls && enableVoice && voiceSupported && message.content.trim()"
            class="voice-controls-container"
          >
            <VoiceSynthesis
              :text="message.content"
              :auto-play="autoPlayVoice"
              :show-progress="true"
              :show-voice-selector="false"
              :show-volume-control="true"
              :compact="true"
              :modern-ui="true"
              @synthesis-start="onVoiceStart"
              @synthesis-end="onVoiceEnd"
              @error="onVoiceError"
              class="modern-voice-controls"
            />
          </div>
        </Transition>
      
        <!-- Enhanced Message Metadata -->
        <div v-if="showMetadata" class="message-metadata-modern">
          <div class="metadata-content-modern">
            <span class="timestamp-modern">{{ formatTime(message.timestamp) }}</span>
            
            <span
              v-if="message.role === 'assistant' && isLoading"
              class="loading-indicator flex items-center gap-1"
            >
              <Loader2 :size="12" class="animate-spin" />
              Generating...
            </span>
            
            <button
              v-if="hasAttachments"
              @click="toggleAttachments"
              class="attachment-indicator flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Paperclip :size="12" />
              {{ attachmentCount }} attachment{{ attachmentCount !== 1 ? 's' : '' }}
            </button>
          </div>
        </div>
      
        <!-- Simplified Attachments Preview -->
        <Transition name="attachments" appear>
          <div v-if="showAttachments && hasAttachments" class="attachments-preview">
            <div class="flex flex-wrap gap-2">
              <div
                v-for="attachment in message.attachments"
                :key="attachment.url || attachment.name"
                @click="handleAttachmentClick(attachment)"
                class="attachment-item flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-xs cursor-pointer hover:bg-muted transition-colors"
              >
                <FileText :size="12" />
                <span>{{ attachment.name }}</span>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Bot, User, Sparkles, Copy, Edit2, RefreshCw, Trash2, Volume2, Loader2, Paperclip, FileText } from 'lucide-vue-next'
import TypingIndicator from '../loading/TypingIndicator.vue'
import EnhancedTypingIndicator from '../loading/EnhancedTypingIndicator.vue'
import UnifiedMessageContent from '../UnifiedMessageContent.vue'
import VoiceSynthesis from '@renderer/src/components/voice/VoiceSynthesis.vue'
// Simplified imports for now - will implement full UI components later
// import ActionButton from '../ui/ActionButton.vue'
// import TimeDisplay from '../ui/TimeDisplay.vue'
// import LoadingIndicator from '../loading/LoadingIndicator.vue'
// import AttachmentIndicator from '../ui/AttachmentIndicator.vue'
// import AttachmentGrid from '../ui/AttachmentGrid.vue'
// import MessageStatusIndicator from '../ui/MessageStatusIndicator.vue'
import { formatDistanceToNow, formatTimeWithFallback } from '@renderer/src/utils/time'
import { voiceService } from '@renderer/src/services/voice/VoiceService'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  error?: string
  attachments?: Array<{
    type: 'image' | 'file'
    url: string
    name: string
  }>
}

interface Props {
  message: Message
  isLast?: boolean
  isLoading?: boolean
  isHighlighted?: boolean
  showMetadata?: boolean
  showStatus?: boolean
  enableVoice?: boolean
  autoPlayVoice?: boolean
  compact?: boolean
  modernDesign?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLast: false,
  isLoading: false,
  isHighlighted: false,
  showMetadata: true,
  showStatus: true,
  enableVoice: false,
  autoPlayVoice: false,
  compact: false,
  modernDesign: true
})

const emit = defineEmits<{
  retry: []
  edit: []
  delete: []
  copy: []
  'attachment-click': [attachment: any]
}>()

const showActions = ref(false)
const actionsVisible = ref(false)
const showAttachments = ref(false)
const showVoiceControls = ref(false)
const voiceSupported = ref(false)
const isHovered = ref(false)
const isFocused = ref(false)
const contentRenderError = ref(false)
const actionButtonAnimations = ref<Record<string, boolean>>({})
const copyFeedbackTimeout = ref<NodeJS.Timeout | null>(null)

// Enhanced computed properties for modern design
const isNewMessage = computed(() => {
  if (!props.message.timestamp) return false
  const messageTime = new Date(props.message.timestamp).getTime()
  const now = Date.now()
  return (now - messageTime) < 2000 // Consider message "new" for 2 seconds
})

const messageClasses = computed(() => ({
  'message-user': props.message.role === 'user',
  'message-assistant': props.message.role === 'assistant',
  'message-highlighted': props.isHighlighted,
  'message-compact': props.compact,
  'message-modern': props.modernDesign,
  'message-last': props.isLast,
  'message-hovered': isHovered.value,
  'message-focused': isFocused.value,
  'message-new': isNewMessage.value
}))

const layoutClasses = computed(() => ({
  'flex-row-reverse': props.message.role === 'user',
  'flex-row': props.message.role === 'assistant'
}))

const avatarClasses = computed(() => ({
  'order-last': props.message.role === 'user',
  'order-first': props.message.role === 'assistant'
}))

const avatarStyle = computed(() => ({
  'avatar-user': props.message.role === 'user',
  'avatar-assistant': props.message.role === 'assistant',
  'avatar-compact': props.compact
}))

const avatarIcon = computed(() => {
  return props.message.role === 'user' ? User : (props.message.role === 'assistant' ? Sparkles : Bot)
})

const bubbleClasses = computed(() => ({
  'message-bubble-user': props.message.role === 'user',
  'message-bubble-assistant': props.message.role === 'assistant',
  'message-bubble-highlighted': props.isHighlighted,
  'message-bubble-loading': props.isLoading,
  'message-bubble-error': props.message.error,
  'message-bubble-compact': props.compact,
  'ai-message-breathe': props.message.role === 'assistant' && !props.isLoading,
  'user-message-active': props.message.role === 'user' && isHovered.value
}))

const actionMenuClasses = computed(() => ({
  'action-menu-user': props.message.role === 'user',
  'action-menu-assistant': props.message.role === 'assistant'
}))

const messageStatus = computed(() => {
  if (props.isLoading) return 'sending'
  return props.message.status || 'delivered'
})

const hasAttachments = computed(() => {
  return props.message.attachments && props.message.attachments.length > 0
})

const attachmentCount = computed(() => {
  return props.message.attachments?.length || 0
})

// Improved markdown detection logic with error handling
const hasMarkdownContent = computed(() => {
  const content = props.message.content
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return false
  }
  
  try {
    // Check for common markdown patterns with more precise regex
    const markdownPatterns = [
      /```[\s\S]*?```/g,        // Code blocks
      /`[^`\n]+`/g,             // Inline code (not spanning lines)
      /^#{1,6}\s+.+$/m,         // Headers with content
      /\*\*[^*\n]+\*\*/g,       // Bold (not spanning lines)
      /\*[^*\n]+\*/g,           // Italic (not spanning lines)
      /\[[^\]]+\]\([^)]+\)/g,   // Links
      /^\s*[-*+]\s+.+$/m,       // Lists with content
      /^\s*\d+\.\s+.+$/m,       // Numbered lists with content
      /^>\s+.+$/m,              // Blockquotes with content
      /\|[^|\n]+\|/g            // Tables (not spanning lines)
    ]
    
    // Only consider it markdown if it has substantial markdown content
    const matchCount = markdownPatterns.reduce((count, pattern) => {
      return count + (pattern.test(content) ? 1 : 0)
    }, 0)
    
    // Require at least one strong markdown indicator or multiple weak ones
    const hasStrongMarkdown = /```[\s\S]*?```|^#{1,6}\s+|\|[^|\n]+\|/.test(content)
    const hasMultipleWeakMarkdown = matchCount >= 2
    
    return hasStrongMarkdown || hasMultipleWeakMarkdown
  } catch (error) {
    console.error('Error in markdown detection for message:', props.message.id, error)
    return false // Default to simple rendering on error
  }
})

// Event handlers
const handleMouseEnter = () => {
  showActions.value = true
  isHovered.value = true
  
  // Add subtle interaction feedback
  const messageElement = document.querySelector(`[data-message-id="${props.message.id}"]`)
  if (messageElement) {
    messageElement.classList.add('message-hovered')
  }
}

const handleMouseLeave = () => {
  // Delay hiding actions to allow interaction
  setTimeout(() => {
    if (!isFocused.value) {
      showActions.value = false
      isHovered.value = false
      
      // Remove hover class
      const messageElement = document.querySelector(`[data-message-id="${props.message.id}"]`)
      if (messageElement) {
        messageElement.classList.remove('message-hovered')
      }
    }
  }, 200)
}

const handleFocusIn = () => {
  isFocused.value = true
  showActions.value = true
}

const handleFocusOut = () => {
  isFocused.value = false
  if (!isHovered.value) {
    showActions.value = false
  }
}

const handleBubbleClick = () => {
  // Add micro-interaction feedback
  if (!props.isLoading) {
    // Trigger subtle visual feedback
    const bubbleElement = document.querySelector(`[data-message-id="${props.message.id}"] .message-bubble-modern`)
    if (bubbleElement) {
      bubbleElement.classList.add('bubble-clicked')
      setTimeout(() => {
        bubbleElement.classList.remove('bubble-clicked')
      }, 200)
    }
    
    // Could be used for selection or copy functionality
    emit('copy')
  }
}

const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(props.message.content)
    
    // Visual feedback for copy action
    const copyButtonId = 'copy-btn'
    actionButtonAnimations.value[copyButtonId] = true
    
    // Find and animate the copy button
    const copyButton = document.querySelector(`[data-message-id="${props.message.id}"] .action-button-modern[title="Copy message"]`)
    if (copyButton) {
      copyButton.classList.add('copy-success')
      setTimeout(() => {
        copyButton.classList.remove('copy-success')
        actionButtonAnimations.value[copyButtonId] = false
      }, 600)
    }
    
    emit('copy')
  } catch (error) {
    console.error('Failed to copy message:', error)
    // Could show error toast here
  }
}

const handleDelete = () => {
  emit('delete')
}

const handleAttachmentClick = (attachment: any) => {
  emit('attachment-click', attachment)
}

const toggleAttachments = () => {
  showAttachments.value = !showAttachments.value
}

const formatTime = (date: Date | string | number | undefined) => {
  if (!date) {
    console.warn('No date provided to formatTime for message:', props.message.id)
    return 'just now' // More user-friendly than 'unknown'
  }
  
  try {
    // Handle different date formats
    let dateObj: Date;
    
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      // Handle empty strings
      if (date.trim() === '') {
        return 'just now';
      }
      // Try parsing ISO string or other formats
      dateObj = new Date(date);
    } else if (typeof date === 'number') {
      // Handle timestamp
      dateObj = new Date(date);
    } else {
      console.warn('Invalid date type:', typeof date, date);
      return 'just now';
    }
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date value:', date);
      return 'just now';
    }
    
    // Use the improved formatTimeWithFallback function
    return formatTimeWithFallback(dateObj)
  } catch (error) {
    console.error('Error formatting time for message:', props.message.id, error)
    return 'just now'
  }
}

// Keep actions visible when interacting with them
const keepActionsVisible = () => {
  actionsVisible.value = true
  setTimeout(() => {
    if (!isHovered.value && !isFocused.value) {
      actionsVisible.value = false
    }
  }, 3000)
}

// Voice functionality
const checkVoiceSupport = () => {
  const capabilities = voiceService.getCapabilities()
  voiceSupported.value = !!capabilities?.speechSynthesis
}

const toggleVoiceControls = () => {
  showVoiceControls.value = !showVoiceControls.value
  
  // Keep actions visible while voice controls are shown
  if (showVoiceControls.value) {
    keepActionsVisible()
  }
}

const onVoiceStart = (text: string) => {
  // Voice synthesis started
  console.log('Voice synthesis started for message:', props.message.id)
}

const onVoiceEnd = (text: string) => {
  // Voice synthesis ended
  console.log('Voice synthesis ended for message:', props.message.id)
}

const onVoiceError = (error: string) => {
  console.error('Voice synthesis error for message:', props.message.id, error)
  // Could emit an error event to parent if needed
}

const handleContentRenderError = () => {
  console.warn('Content render error, falling back to plain text for message:', props.message.id)
  contentRenderError.value = true
}

// Lifecycle
onMounted(() => {
  checkVoiceSupport()
  
  // Auto-play voice if enabled and this is an assistant message
  if (props.enableVoice && props.autoPlayVoice && 
      props.message.role === 'assistant' && 
      props.message.content.trim() && 
      voiceSupported.value && 
      !props.isLoading) {
    
    // Delay slightly to ensure message is fully rendered
    setTimeout(() => {
      showVoiceControls.value = true
    }, 500)
  }
})

onUnmounted(() => {
  // Stop any ongoing voice synthesis for this message
  if (showVoiceControls.value) {
    voiceService.stopSynthesis()
  }
})
</script>

<style scoped>
/* Enhanced Message Item Styles */
.message-item-enhanced {
  @apply transition-all duration-300 ease-out;
  /* Proper spacing and layout */
  width: 100%;
  max-width: 100%;
  margin-bottom: 1.5rem;
  padding: 0 1rem;
  position: relative;
}

.message-item-enhanced.message-appear {
  animation: messageSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.message-item-enhanced.message-user {
  /* User messages - right aligned */
  padding-left: 2rem;
  padding-right: 0.5rem;
}

.message-item-enhanced.message-assistant {
  /* Assistant messages - left aligned */
  padding-right: 2rem;
  padding-left: 0.5rem;
}

.message-item-enhanced.message-compact {
  margin-bottom: 0.75rem;
  padding: 0 0.75rem;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .message-item-enhanced {
    margin-bottom: 1rem;
    padding: 0 0.5rem;
  }
  
  .message-item-enhanced.message-user {
    padding-left: 1rem;
    padding-right: 0.25rem;
  }
  
  .message-item-enhanced.message-assistant {
    padding-right: 1rem;
    padding-left: 0.25rem;
  }
}

@media (max-width: 480px) {
  .message-item-enhanced {
    margin-bottom: 0.75rem;
    padding: 0 0.25rem;
  }
  
  .message-item-enhanced.message-user,
  .message-item-enhanced.message-assistant {
    padding-left: 0.25rem;
    padding-right: 0.25rem;
  }
}

.message-item.message-modern {
  border-radius: 0.75rem;
  margin-bottom: 1rem;
}

.message-item.message-highlighted {
  background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.08), rgba(var(--primary-rgb), 0.04));
  border: 1px solid rgba(var(--primary-rgb), 0.2);
  animation: highlightPulse 1s ease-in-out;
}

.message-item.message-hovered {
  background: rgba(var(--muted-rgb), 0.3);
  transform: translateY(-1px);
}

.message-item.message-compact {
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.5rem;
}

/* Avatar Styles */
.avatar-container {
  position: relative;
  z-index: 1;
}

.avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.avatar.avatar-user {
  background: linear-gradient(135deg, var(--primary), var(--primary-dark, #2563eb));
  color: var(--primary-foreground);
}

.avatar.avatar-assistant {
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  color: white;
}

.avatar.avatar-compact {
  width: 1.75rem;
  height: 1.75rem;
}

.avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.avatar-icon {
  transition: transform 0.2s ease;
}

.message-item.message-hovered .avatar-icon {
  transform: scale(1.1);
}

/* Message Bubble Modern Design */
.message-bubble-modern {
  position: relative;
  padding: 0.875rem 1.125rem;
  border-radius: 1.25rem;
  max-width: min(85%, 42rem);
  min-width: 3rem;
  width: fit-content;
  word-wrap: break-word;
  overflow-wrap: break-word;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(8px);
  border: 1px solid transparent;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  /* CRITICAL: Ensure content is always visible */
  min-height: 2.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.message-bubble-user {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border-bottom-right-radius: 0.375rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  margin-left: auto;
}

.message-bubble-assistant {
  background: rgba(248, 249, 250, 0.95);
  color: #111827;
  border-bottom-left-radius: 0.375rem;
  border: 1px solid rgba(209, 213, 219, 0.8);
}

.message-bubble-highlighted {
  animation: bubbleHighlight 0.6s ease-out;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

/* Micro-interaction for bubble clicks */
.message-bubble-modern.bubble-clicked {
  transform: scale(0.98);
  transition: transform 0.1s ease-out;
}

.message-bubble-loading {
  opacity: 0.8;
  animation: loadingPulse 1.5s ease-in-out infinite;
}

.message-bubble-error {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
}

.message-bubble-compact {
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
  min-height: 2rem;
}

/* CRITICAL: Fix for content display */
.message-content-display {
  width: 100%;
  min-height: 1.5rem;
  line-height: 1.6;
  color: inherit !important;
  display: block !important;
  visibility: visible !important;
}

.message-content-display * {
  color: inherit !important;
  visibility: visible !important;
  display: block !important;
  max-width: none !important;
  overflow: visible !important;
}

.enhanced-markdown-content,
.enhanced-content {
  width: 100% !important;
  max-width: none !important;
  color: inherit !important;
  display: block !important;
}

.fallback-content {
  font-family: inherit;
  line-height: 1.6;
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
  color: inherit !important;
  background: rgba(255, 255, 255, 0.1) !important;
  padding: 0.5rem !important;
  border-radius: 0.5rem !important;
  border-left: 3px solid rgba(59, 130, 246, 0.5) !important;
  margin: 0.25rem 0 !important;
}
.message-bubble {
  position: relative;
  padding: 0.875rem 1.125rem;
  border-radius: 1.25rem;
  max-width: min(85%, 42rem);
  word-wrap: break-word;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(8px);
  border: 1px solid transparent;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.message-bubble.bubble-user {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border-bottom-right-radius: 0.375rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message-bubble.bubble-assistant {
  background: rgba(248, 249, 250, 0.95);
  color: #111827;
  border-bottom-left-radius: 0.375rem;
  border: 1px solid rgba(209, 213, 219, 0.8);
}

.message-bubble.bubble-highlighted {
  animation: bubbleHighlight 0.6s ease-out;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

/* Micro-interaction for bubble clicks */
.message-bubble.bubble-clicked {
  transform: scale(0.98);
  transition: transform 0.1s ease-out;
}

.message-bubble.bubble-loading {
  opacity: 0.8;
  animation: loadingPulse 1.5s ease-in-out infinite;
}

.message-bubble.bubble-error {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
}

.message-bubble.bubble-compact {
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
}

/* Modern Action Menu */
.action-menu {
  position: absolute;
  top: 0;
  z-index: 10;
  animation: actionMenuSlide 0.2s ease-out;
}

.action-menu.action-menu-user {
  right: calc(100% + 0.5rem);
}

.action-menu.action-menu-assistant {
  left: calc(100% + 0.5rem);
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
  padding: 0.375rem;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 0.75rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.action-button {
  padding: 0.5rem;
  border: none;
  background: transparent;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #4b5563;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-button:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #374151;
  transform: scale(1.1);
}

.action-button.active {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.action-button.destructive:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

/* Message Metadata */
.message-metadata {
  margin-top: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.message-item:hover .message-metadata,
.message-item.message-focused .message-metadata {
  opacity: 1;
}

.metadata-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.message-user .metadata-content {
  justify-content: flex-end;
}

.message-assistant .metadata-content {
  justify-content: flex-start;
}

.timestamp {
  color: #9ca3af;
}

.loading-indicator {
  color: #6b7280;
}

.attachment-indicator {
  color: #6b7280;
  cursor: pointer;
  border: none;
  background: none;
  padding: 0;
  font-size: inherit;
}

/* Voice Controls */
.voice-controls-container {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(16, 185, 129, 0.05));
  border: 1px solid rgba(229, 231, 235, 0.3);
  border-radius: 0.75rem;
  backdrop-filter: blur(8px);
}

.modern-voice-controls {
  border-radius: 0.5rem;
}

/* Attachments */
.attachments-preview {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 0.75rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.attachment-item {
  transition: all 0.2s ease;
  cursor: pointer;
}

.attachment-item:hover {
  background: rgba(0, 0, 0, 0.05) !important;
  transform: translateY(-1px);
}

/* Enhanced Content Styles */
.enhanced-content {
  transition: all 0.2s ease;
}

.message-content-display {
  min-height: 1.5rem;
  line-height: 1.6;
}

.fallback-content {
  font-family: inherit;
  line-height: 1.6;
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
}

.loading-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modern-typing {
  font-weight: 500;
}

/* Animations */
@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes highlightPulse {
  0%, 100% {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(59, 130, 246, 0.04));
  }
  50% {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.08));
  }
}

@keyframes bubbleHighlight {
  0% {
    transform: scale(1);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3), 0 4px 16px rgba(0, 0, 0, 0.12);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3), 0 2px 12px rgba(0, 0, 0, 0.08);
  }
}

@keyframes loadingPulse {
  0%, 100% {
    opacity: 0.8;
  }
  50% {
    opacity: 0.6;
  }
}

@keyframes actionMenuSlide {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Dark Mode Optimizations */
@media (prefers-color-scheme: dark) {
  .message-bubble.bubble-assistant {
    background: rgba(31, 41, 55, 0.95);
    color: #f3f4f6;
    border-color: rgba(75, 85, 99, 0.8);
  }
  
  .action-buttons {
    background: rgba(31, 41, 55, 0.98);
    border-color: rgba(75, 85, 99, 0.5);
  }
  
  .action-button {
    color: #9ca3af;
  }
  
  .action-button:hover {
    background: rgba(55, 65, 81, 0.5);
    color: #f3f4f6;
  }
  
  .action-button.active {
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
  }
  
  .action-button.destructive:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
  }
  
  .metadata-content {
    color: #9ca3af;
  }
  
  .voice-controls-container {
    background: rgba(31, 41, 55, 0.98);
    border-color: rgba(75, 85, 99, 0.5);
  }
  
  .attachment-preview-modal {
    background: rgba(17, 24, 39, 0.98);
  }
}

/* Modern Transition Effects */
.action-menu-enter-active {
  transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.action-menu-leave-active {
  transition: all 0.2s ease-in;
}

.action-menu-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.9);
}

.action-menu-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.95);
}

.voice-controls-enter-active {
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.voice-controls-leave-active {
  transition: all 0.25s ease-in;
}

.voice-controls-enter-from {
  opacity: 0;
  transform: translateY(-12px);
  max-height: 0;
}

.voice-controls-leave-to {
  opacity: 0;
  transform: translateY(-8px);
  max-height: 0;
}

.attachments-enter-active {
  transition: all 0.3s ease-out;
}

.attachments-leave-active {
  transition: all 0.2s ease-in;
}

.attachments-enter-from {
  opacity: 0;
  transform: translateY(-10px);
  max-height: 0;
}

.attachments-leave-to {
  opacity: 0;
  transform: translateY(-5px);
  max-height: 0;
}

/* Enhanced Responsive Design */
@media (max-width: 768px) {
  .message-item {
    padding: 0.5rem 0.75rem;
  }
  
  .message-bubble {
    max-width: 92%;
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
  }
  
  .message-bubble.bubble-compact {
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
  }
  
  .action-menu {
    position: static;
    margin-top: 0.5rem;
    display: flex;
    justify-content: center;
  }
  
  .action-buttons {
    border-radius: 0.625rem;
    gap: 0.125rem;
    padding: 0.25rem;
  }
  
  .action-button {
    padding: 0.375rem;
  }
  
  .avatar {
    width: 1.75rem;
    height: 1.75rem;
  }
  
  .metadata-content {
    font-size: 0.6875rem;
    gap: 0.5rem;
  }
  
  /* Improve touch targets */
  .message-bubble {
    min-height: 44px; /* Minimum touch target size */
  }
  
  /* Better text readability on mobile */
  .message-content-display {
    line-height: 1.5;
  }
}

@media (max-width: 480px) {
  .message-item {
    padding: 0.375rem 0.5rem;
  }
  
  .message-bubble {
    max-width: 95%;
    padding: 0.625rem 0.875rem;
  }
  
  .avatar {
    width: 1.5rem;
    height: 1.5rem;
  }
  
  .voice-controls-container {
    padding: 0.5rem;
  }
  
  .attachments-preview {
    padding: 0.5rem;
  }
  
  /* Stack action buttons vertically on very small screens */
  .action-buttons {
    flex-wrap: wrap;
    max-width: 200px;
  }
  
  /* Improve text wrapping */
  .message-content-display {
    word-break: break-word;
    hyphens: auto;
  }
}

/* Large screen optimizations */
@media (min-width: 1024px) {
  .message-bubble {
    max-width: min(75%, 48rem);
  }
  
  .action-menu {
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  
  .message-item:hover .action-menu {
    opacity: 1;
  }
}

/* Ultra-wide screen support */
@media (min-width: 1440px) {
  .message-bubble {
    max-width: min(65%, 56rem);
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .message-bubble.bubble-assistant {
    background: rgba(55, 65, 81, 0.4);
    border-color: rgba(75, 85, 99, 0.4);
    color: #f9fafb;
  }
  
  .action-buttons {
    background: rgba(17, 24, 39, 0.9);
    border-color: rgba(75, 85, 99, 0.4);
  }
  
  .voice-controls-container {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(16, 185, 129, 0.08));
  }
  
  .attachments-preview {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(75, 85, 99, 0.3);
  }
}

/* GPU Acceleration for smooth animations */
.message-item,
.message-bubble,
.avatar,
.action-menu {
  will-change: transform;
  transform: translateZ(0);
}

/* Enhanced Micro-interactions and Animations */
@keyframes typingDotsAnimation {
  0%, 80%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  40% {
    opacity: 1;
    transform: scale(1.2);
  }
}

@keyframes rippleEffect {
  0% {
    transform: scale(0);
    opacity: 0.8;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3) translateY(10px);
  }
  50% {
    opacity: 1;
    transform: scale(1.05) translateY(-2px);
  }
  70% {
    transform: scale(0.95) translateY(1px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes shimmerLoad {
  0% {
    background-position: -468px 0;
  }
  100% {
    background-position: 468px 0;
  }
}

@keyframes messageEntrance {
  0% {
    opacity: 0;
    transform: translateY(15px) scale(0.98);
  }
  50% {
    opacity: 0.8;
    transform: translateY(-2px) scale(1.01);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes pulseGlow {
  0%, 100% {
    box-shadow: 0 0 5px rgba(var(--primary-rgb), 0.2);
  }
  50% {
    box-shadow: 0 0 20px rgba(var(--primary-rgb), 0.4);
  }
}

@keyframes breathe {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.03);
  }
}

@keyframes textShine {
  0% {
    background-position: -200% center;
  }
  100% {
    background-position: 200% center;
  }
}

@keyframes copySuccess {
  0% {
    transform: scale(1) rotate(0deg);
    background: rgba(34, 197, 94, 0.1);
  }
  50% {
    transform: scale(1.2) rotate(5deg);
    background: rgba(34, 197, 94, 0.3);
  }
  100% {
    transform: scale(1) rotate(0deg);
    background: rgba(34, 197, 94, 0.1);
  }
}

@keyframes errorPulse {
  0%, 100% {
    border-color: rgba(239, 68, 68, 0.3);
    background: rgba(239, 68, 68, 0.05);
  }
  50% {
    border-color: rgba(239, 68, 68, 0.6);
    background: rgba(239, 68, 68, 0.1);
  }
}

/* Enhanced typing indicator */
.typing-dots {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.typing-dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.3;
  animation: typingDotsAnimation 1.5s ease-in-out infinite;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

/* Enhanced hover effects with micro-interactions */
.message-bubble-modern {
  position: relative;
  overflow: hidden;
}

.message-bubble-modern::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
  pointer-events: none;
}

.message-bubble-modern:hover {
  transform: translateY(-2px) scale(1.002);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.message-bubble-modern:hover::before {
  left: 100%;
  transition: left 0.5s ease;
}

.message-bubble-user:hover {
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.25);
}

.message-bubble-assistant:hover {
  box-shadow: 0 8px 25px rgba(139, 92, 246, 0.15);
}

.action-button-modern {
  position: relative;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-button-modern:hover {
  transform: translateY(-2px) scale(1.1);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.action-button-modern:active {
  transform: translateY(0) scale(0.95);
  transition-duration: 0.1s;
}

.action-button-modern::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 60%);
  opacity: 0;
  transform: scale(0);
  transition: all 0.3s ease;
  pointer-events: none;
}

.action-button-modern:active::after {
  opacity: 1;
  transform: scale(1.2);
  transition-duration: 0.1s;
}

/* Click feedback with elastic animation */
.elastic-click:active {
  transform: scale(0.98);
  transition: transform 0.1s ease;
}

/* Ripple effect for interactive elements */
.btn-interactive {
  position: relative;
  overflow: hidden;
}

.btn-interactive::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: rgba(255, 255, 255, 0.5);
  opacity: 0;
  border-radius: 100%;
  transform: scale(1, 1) translate(-50%);
  transform-origin: 50% 50%;
}

.btn-interactive:active::after {
  animation: rippleEffect 0.6s ease-out;
}

/* Message appearance animation */
.message-new {
  animation: messageEntrance 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.message-appear {
  animation: messageEntrance 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* AI message breathing effect */
.ai-message-breathe {
  animation: breathe 3s ease-in-out infinite;
}

.ai-message-breathe:hover {
  animation-play-state: paused;
}

/* User message active state */
.user-message-active {
  animation: pulseGlow 2s ease-in-out infinite;
}

/* Loading states with enhanced shimmer */
.loading-shimmer {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.1) 25%,
    rgba(255, 255, 255, 0.3) 50%,
    rgba(255, 255, 255, 0.1) 75%
  );
  background-size: 200% 100%;
  animation: shimmerLoad 1.5s infinite;
}

@media (prefers-color-scheme: dark) {
  .loading-shimmer {
    background: linear-gradient(
      90deg,
      rgba(55, 65, 81, 0.3) 25%,
      rgba(75, 85, 99, 0.6) 50%,
      rgba(55, 65, 81, 0.3) 75%
    );
  }
}

/* Enhanced action menu with staggered animation */
.action-menu-modern {
  animation: actionMenuSlide 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.action-buttons-modern {
  display: flex;
  gap: 0.25rem;
}

.action-button-modern:nth-child(1) { animation-delay: 0ms; }
.action-button-modern:nth-child(2) { animation-delay: 50ms; }
.action-button-modern:nth-child(3) { animation-delay: 100ms; }
.action-button-modern:nth-child(4) { animation-delay: 150ms; }
.action-button-modern:nth-child(5) { animation-delay: 200ms; }

/* Copy success feedback */
.action-button-modern.copy-success {
  animation: copySuccess 0.6s ease-out;
}

/* Text selection shine effect */
.message-content-display:hover .enhanced-markdown-content,
.message-content-display:hover .enhanced-content {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
  background-size: 200% 100%;
  animation: textShine 1.5s ease-in-out;
}

/* Error state animation */
.message-bubble-error {
  animation: errorPulse 1s ease-in-out infinite;
}

.message-bubble-error:hover {
  animation-play-state: paused;
}

/* Accessibility - Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .message-item-enhanced,
  .message-bubble-modern,
  .action-button-modern,
  .typing-dot {
    animation: none;
    transition: none;
  }
  
  .message-item-enhanced.message-appear,
  .message-new {
    opacity: 1;
    transform: none;
  }
}
</style>