<template>
  <div 
    class="message-item group relative"
    :class="messageClasses"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @focusin="handleFocusIn"
    @focusout="handleFocusOut"
  >
    <!-- Modern Message Layout -->
    <div class="flex gap-3 w-full" :class="layoutClasses">
      <!-- Avatar -->
      <div class="avatar-container flex-shrink-0" :class="avatarClasses">
        <div class="avatar" :class="avatarStyle">
          <component :is="avatarIcon" :size="16" class="avatar-icon" />
        </div>
      </div>
    
      <!-- Message Content -->
      <div class="message-content-wrapper flex-1 min-w-0">
        <!-- Message Bubble -->
        <div 
          class="message-bubble group/bubble"
          :class="bubbleClasses"
          @click="handleBubbleClick"
        >
          <!-- Loading State -->
          <div v-if="isLoading && !message.content" class="loading-content">
            <TypingIndicator message="AI is thinking..." class="modern-typing" />
          </div>
          
          <!-- Message Content -->
          <MessageContentEnhanced
            v-else
            :content="message.content"
            :is-loading="isLoading"
            :attachments="message.attachments"
            :error="message.error"
            :show-retry="!!message.error"
            :is-highlighted="isHighlighted"
            @retry="$emit('retry')"
            class="enhanced-content"
          />
          
          <!-- Simplified Message Status -->
          <div v-if="message.role === 'user' && showStatus" class="message-status text-xs text-muted-foreground mt-1">
            <span v-if="messageStatus === 'sending'" class="flex items-center gap-1">
              <Loader2 :size="10" class="animate-spin" />
              Sending...
            </span>
            <span v-else-if="messageStatus === 'delivered'" class="opacity-60">Delivered</span>
            <span v-else-if="messageStatus === 'error'" class="text-destructive">Failed</span>
          </div>
        
          <!-- Simplified Action Menu -->
          <Transition name="action-menu" appear>
            <div 
              v-if="showActions || actionsVisible"
              class="action-menu"
              :class="actionMenuClasses"
            >
              <div class="action-buttons">
                <button
                  @click="handleCopy"
                  class="action-button"
                  title="Copy message"
                >
                  <Copy :size="14" />
                </button>
                
                <button
                  v-if="enableVoice && voiceSupported && message.content.trim()"
                  @click="toggleVoiceControls"
                  class="action-button"
                  :class="{ 'active': showVoiceControls }"
                  :title="showVoiceControls ? 'Stop voice' : 'Play voice'"
                >
                  <Volume2 :size="14" />
                </button>
                
                <button
                  v-if="message.role === 'user'"
                  @click="$emit('edit')"
                  class="action-button"
                  title="Edit message"
                >
                  <Edit2 :size="14" />
                </button>
                
                <button
                  v-if="message.role === 'assistant' && !isLoading"
                  @click="$emit('retry')"
                  class="action-button"
                  title="Regenerate response"
                >
                  <RefreshCw :size="14" />
                </button>
                
                <button
                  @click="handleDelete"
                  class="action-button destructive"
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
      
        <!-- Simplified Message Metadata -->
        <div v-if="showMetadata" class="message-metadata">
          <div class="metadata-content">
            <span class="timestamp">{{ formatTime(message.timestamp) }}</span>
            
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
import MessageContentEnhanced from '../MessageContentEnhanced.vue'
import VoiceSynthesis from '@renderer/src/components/voice/VoiceSynthesis.vue'
// Simplified imports for now - will implement full UI components later
// import ActionButton from '../ui/ActionButton.vue'
// import TimeDisplay from '../ui/TimeDisplay.vue'
// import LoadingIndicator from '../loading/LoadingIndicator.vue'
// import AttachmentIndicator from '../ui/AttachmentIndicator.vue'
// import AttachmentGrid from '../ui/AttachmentGrid.vue'
// import MessageStatusIndicator from '../ui/MessageStatusIndicator.vue'
import { formatDistanceToNow } from '@renderer/src/utils/time'
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

// Enhanced computed properties for modern design
const messageClasses = computed(() => ({
  'message-user': props.message.role === 'user',
  'message-assistant': props.message.role === 'assistant',
  'message-highlighted': props.isHighlighted,
  'message-compact': props.compact,
  'message-modern': props.modernDesign,
  'message-last': props.isLast,
  'message-hovered': isHovered.value,
  'message-focused': isFocused.value
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
  'bubble-user': props.message.role === 'user',
  'bubble-assistant': props.message.role === 'assistant',
  'bubble-highlighted': props.isHighlighted,
  'bubble-compact': props.compact,
  'bubble-modern': props.modernDesign,
  'bubble-loading': props.isLoading,
  'bubble-error': props.message.error
}))

const actionMenuClasses = computed(() => ({
  'action-menu-user': props.message.role === 'user',
  'action-menu-assistant': props.message.role === 'assistant',
  'action-menu-compact': props.compact
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

// Event handlers
const handleMouseEnter = () => {
  showActions.value = true
  isHovered.value = true
}

const handleMouseLeave = () => {
  // Delay hiding actions to allow interaction
  setTimeout(() => {
    if (!isFocused.value) {
      showActions.value = false
      isHovered.value = false
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
  // Handle bubble click - could be used for selection or other interactions
}

const handleCopy = () => {
  emit('copy')
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
  if (!date) return 'unknown'
  return formatDistanceToNow(date)
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
/* Modern Message Item Design */
.message-item {
  position: relative;
  padding: 0.75rem 1rem;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  animation: messageSlideIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  contain: layout paint;
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

/* Responsive Design */
@media (max-width: 768px) {
  .message-item {
    padding: 0.5rem 0.75rem;
  }
  
  .message-bubble {
    max-width: 90%;
    padding: 0.75rem 1rem;
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
  }
  
  .avatar {
    width: 1.75rem;
    height: 1.75rem;
  }
  
  .metadata-content {
    font-size: 0.6875rem;
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
</style>