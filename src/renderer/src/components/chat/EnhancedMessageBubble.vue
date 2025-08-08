<template>
  <div 
    class="enhanced-message group transition-all duration-300"
    :class="messageLayoutClasses"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <!-- Avatar -->
    <div v-if="showAvatar" class="avatar-container">
      <div 
        class="avatar transition-transform duration-300 group-hover:scale-105"
        :class="avatarClasses"
      >
        <component 
          :is="avatarIcon" 
          :size="isMobile ? 16 : 18" 
          class="transition-colors duration-300"
        />
      </div>
      <!-- AI thinking indicator -->
      <div 
        v-if="message.role === 'assistant' && isLoading"
        class="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse"
      >
        <div class="w-full h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-ping opacity-75"></div>
      </div>
    </div>

    <!-- Message Content -->
    <div class="message-content-wrapper flex-1">
      <!-- Message Bubble -->
      <div 
        class="message-bubble relative group/bubble"
        :class="bubbleClasses"
        @click="onBubbleClick"
      >
        <!-- Gradient background overlay for assistant messages -->
        <div 
          v-if="message.role === 'assistant'"
          class="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 rounded-inherit opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        ></div>

        <!-- Message Status Indicator -->
        <div 
          v-if="message.role === 'user'"
          class="absolute -right-1 -bottom-1 flex items-center justify-center"
        >
          <div 
            class="status-indicator transition-all duration-300"
            :class="statusIndicatorClasses"
            :title="statusTooltip"
          >
            <component 
              :is="statusIcon" 
              :size="12" 
              class="transition-all duration-300"
            />
          </div>
        </div>

        <!-- Loading Animation -->
        <div v-if="isLoading && !message.content" class="loading-content">
          <div class="thinking-animation">
            <div class="thinking-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div class="thinking-waves">
              <div class="wave"></div>
              <div class="wave"></div>
              <div class="wave"></div>
            </div>
          </div>
        </div>

        <!-- Actual Message Content -->
        <div v-else class="message-text">
          <component
            :is="MessageContentComponent"
            :content="message.content"
            :is-loading="isLoading"
            :attachments="message.attachments"
            :class="textClasses"
          />
        </div>

        <!-- Message Actions -->
        <Transition 
          name="actions-fade" 
          appear
        >
          <div 
            v-if="showActions && !isLoading"
            class="message-actions absolute z-10"
            :class="actionsPositionClasses"
            @click.stop
          >
            <div class="actions-container">
              <!-- Copy Button -->
              <ActionButton
                icon="Copy"
                tooltip="复制消息"
                @click="$emit('copy', message.content)"
              />
              
              <!-- Voice Playback -->
              <ActionButton
                v-if="canPlayVoice"
                icon="Volume2"
                tooltip="语音播放"
                :active="isPlayingVoice"
                @click="toggleVoicePlayback"
              />
              
              <!-- Edit Button (User messages) -->
              <ActionButton
                v-if="message.role === 'user'"
                icon="Edit3"
                tooltip="编辑消息"
                @click="$emit('edit', message)"
              />
              
              <!-- Regenerate Button (Assistant messages) -->
              <ActionButton
                v-if="message.role === 'assistant'"
                icon="RefreshCw"
                tooltip="重新生成"
                @click="$emit('regenerate', message)"
              />
              
              <!-- More Options -->
              <ActionButton
                icon="MoreHorizontal"
                tooltip="更多选项"
                @click="showMoreOptions = !showMoreOptions"
              />
            </div>
            
            <!-- More Options Dropdown -->
            <Transition name="dropdown-fade">
              <div 
                v-if="showMoreOptions"
                class="more-options-dropdown"
              >
                <div class="dropdown-item" @click="$emit('reply', message)">
                  <Reply :size="14" />
                  <span>回复</span>
                </div>
                <div class="dropdown-item" @click="$emit('bookmark', message)">
                  <Bookmark :size="14" />
                  <span>收藏</span>
                </div>
                <div class="dropdown-item text-red-600" @click="$emit('delete', message)">
                  <Trash2 :size="14" />
                  <span>删除</span>
                </div>
              </div>
            </Transition>
          </div>
        </Transition>

        <!-- Typing Indicator -->
        <div 
          v-if="isStreaming" 
          class="absolute -bottom-6 left-0 typing-indicator"
        >
          <div class="typing-text">AI正在输入</div>
          <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>

      <!-- Message Metadata -->
      <div 
        v-if="showMetadata"
        class="message-metadata"
        :class="metadataClasses"
      >
        <span class="timestamp">{{ formatTime(message.timestamp) }}</span>
        <span v-if="message.editedAt" class="edited-indicator">已编辑</span>
        <span v-if="message.attachments?.length" class="attachment-indicator">
          <Paperclip :size="12" />
          {{ message.attachments.length }}
        </span>
      </div>
    </div>

    <!-- Message Reactions -->
    <Transition name="reactions-fade">
      <div 
        v-if="showReactions && message.reactions?.length"
        class="message-reactions"
      >
        <div
          v-for="reaction in message.reactions"
          :key="reaction.emoji"
          class="reaction-item"
          :class="{ 'reaction-active': reaction.userReacted }"
          @click="$emit('toggle-reaction', message.id, reaction.emoji)"
        >
          <span class="reaction-emoji">{{ reaction.emoji }}</span>
          <span class="reaction-count">{{ reaction.count }}</span>
        </div>
        <button 
          class="add-reaction-btn"
          @click="$emit('show-emoji-picker', message.id)"
        >
          <Plus :size="12" />
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  User, Bot, Sparkles, Copy, Edit3, RefreshCw, MoreHorizontal, 
  Volume2, Reply, Bookmark, Trash2, Paperclip, Plus,
  Check, CheckCheck, Clock, AlertCircle, Loader2
} from 'lucide-vue-next'
import ActionButton from './ActionButton.vue'
import MessageContentEnhanced from '../MessageContentEnhanced.vue'
import { formatDistanceToNow } from '@/utils/time'
import { useResponsive } from '@/composables/useResponsive'
import { voiceService } from '@/services/voice/VoiceService'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  editedAt?: Date
  status?: 'sending' | 'sent' | 'delivered' | 'error'
  attachments?: Array<any>
  reactions?: Array<{
    emoji: string
    count: number
    userReacted: boolean
  }>
}

interface Props {
  message: Message
  isLoading?: boolean
  isStreaming?: boolean
  showAvatar?: boolean
  showMetadata?: boolean
  showReactions?: boolean
  enableVoice?: boolean
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  isStreaming: false,
  showAvatar: true,
  showMetadata: true,
  showReactions: false,
  enableVoice: false,
  compact: false
})

const emit = defineEmits<{
  copy: [content: string]
  edit: [message: Message]
  regenerate: [message: Message]
  reply: [message: Message]
  bookmark: [message: Message]
  delete: [message: Message]
  'toggle-reaction': [messageId: string, emoji: string]
  'show-emoji-picker': [messageId: string]
}>()

// Composables
const { isMobile } = useResponsive()

// State
const showActions = ref(false)
const showMoreOptions = ref(false)
const isPlayingVoice = ref(false)
const hoverTimeout = ref<NodeJS.Timeout>()

// Message Content Component
const MessageContentComponent = MessageContentEnhanced

// Computed Properties
const messageLayoutClasses = computed(() => ({
  'flex gap-3 mb-4': true,
  'justify-end': props.message.role === 'user',
  'justify-start': props.message.role === 'assistant',
  'compact-mode': props.compact,
  'mobile-layout': isMobile.value
}))

const avatarClasses = computed(() => ({
  'w-8 h-8 rounded-full flex items-center justify-center relative': true,
  'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg': props.message.role === 'user',
  'bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-lg': props.message.role === 'assistant',
  'ring-2 ring-white dark:ring-gray-800': true
}))

const bubbleClasses = computed(() => {
  const base = [
    'message-bubble-enhanced px-4 py-3 rounded-2xl shadow-sm',
    'transition-all duration-300 ease-out',
    'relative overflow-hidden',
    'hover:shadow-md hover:-translate-y-0.5',
    'max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl'
  ]

  if (props.message.role === 'user') {
    base.push(
      'bg-gradient-to-br from-blue-500 to-blue-600',
      'text-white rounded-br-md',
      'shadow-blue-500/25'
    )
  } else {
    base.push(
      'bg-white dark:bg-gray-800',
      'border border-gray-200 dark:border-gray-700',
      'text-gray-900 dark:text-gray-100 rounded-bl-md',
      'shadow-gray-900/10'
    )
  }

  if (props.compact) {
    base.push('px-3 py-2 text-sm')
  }

  return base
})

const textClasses = computed(() => ({
  'text-white': props.message.role === 'user',
  'text-gray-900 dark:text-gray-100': props.message.role === 'assistant',
  'text-sm': props.compact
}))

const actionsPositionClasses = computed(() => ({
  '-top-12 right-0': props.message.role === 'user',
  '-top-12 left-0': props.message.role === 'assistant'
}))

const metadataClasses = computed(() => ({
  'flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400': true,
  'justify-end': props.message.role === 'user',
  'justify-start': props.message.role === 'assistant'
}))

const statusIndicatorClasses = computed(() => {
  const base = 'w-5 h-5 rounded-full flex items-center justify-center text-white text-xs'
  
  switch (props.message.status) {
    case 'sending':
      return `${base} bg-gray-400 animate-pulse`
    case 'sent':
      return `${base} bg-green-500`
    case 'delivered':
      return `${base} bg-blue-500`
    case 'error':
      return `${base} bg-red-500 animate-pulse`
    default:
      return `${base} bg-green-500`
  }
})

const avatarIcon = computed(() => {
  return props.message.role === 'user' ? User : (props.isLoading ? Loader2 : Sparkles)
})

const statusIcon = computed(() => {
  switch (props.message.status) {
    case 'sending':
      return Clock
    case 'sent':
      return Check
    case 'delivered':
      return CheckCheck
    case 'error':
      return AlertCircle
    default:
      return Check
  }
})

const statusTooltip = computed(() => {
  switch (props.message.status) {
    case 'sending':
      return '发送中...'
    case 'sent':
      return '已发送'
    case 'delivered':
      return '已送达'
    case 'error':
      return '发送失败'
    default:
      return '已发送'
  }
})

const canPlayVoice = computed(() => {
  return props.enableVoice && 
         props.message.content.trim().length > 0 && 
         voiceService.getCapabilities()?.speechSynthesis
})

// Methods
const onMouseEnter = () => {
  clearTimeout(hoverTimeout.value)
  showActions.value = true
}

const onMouseLeave = () => {
  hoverTimeout.value = setTimeout(() => {
    showActions.value = false
    showMoreOptions.value = false
  }, 300)
}

const onBubbleClick = () => {
  if (isMobile.value) {
    showActions.value = !showActions.value
  }
}

const toggleVoicePlayback = async () => {
  if (isPlayingVoice.value) {
    await voiceService.stopSynthesis()
    isPlayingVoice.value = false
  } else {
    isPlayingVoice.value = true
    try {
      await voiceService.speak(props.message.content)
    } catch (error) {
      console.error('Voice playback error:', error)
    } finally {
      isPlayingVoice.value = false
    }
  }
}

const formatTime = (date: Date | string | number | undefined) => {
  if (!date) return 'unknown'
  try {
    const dateObj = date instanceof Date ? date : new Date(date)
    return formatDistanceToNow(dateObj)
  } catch (error) {
    console.error('Error formatting time in EnhancedMessageBubble:', error, date)
    return 'unknown'
  }
}

// Lifecycle
onMounted(() => {
  // Setup voice synthesis event listeners
  if (props.enableVoice) {
    voiceService.on?.('synthesis-end', () => {
      isPlayingVoice.value = false
    })
  }
})

onUnmounted(() => {
  clearTimeout(hoverTimeout.value)
  if (isPlayingVoice.value) {
    voiceService.stopSynthesis()
  }
})
</script>

<style scoped>
/* Enhanced Message Bubble Styles */
.enhanced-message {
  animation: messageEnter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes messageEnter {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.9);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.message-bubble-enhanced {
  position: relative;
  backdrop-filter: blur(10px);
  transform-origin: center;
}

.message-bubble-enhanced::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: xor;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.group:hover .message-bubble-enhanced::before {
  opacity: 1;
}

/* Avatar Enhancements */
.avatar-container {
  position: relative;
  flex-shrink: 0;
}

.avatar {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.avatar::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  background: linear-gradient(45deg, rgba(255,255,255,0.2), transparent, rgba(255,255,255,0.2));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.group:hover .avatar::before {
  opacity: 1;
}

/* Status Indicator */
.status-indicator {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(4px);
}

/* Loading Animation */
.loading-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
}

.thinking-animation {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.thinking-dots {
  display: flex;
  gap: 0.25rem;
}

.thinking-dots span {
  width: 6px;
  height: 6px;
  background: currentColor;
  border-radius: 50%;
  opacity: 0.4;
  animation: thinkingPulse 1.4s infinite ease-in-out;
}

.thinking-dots span:nth-child(2) { animation-delay: 0.2s; }
.thinking-dots span:nth-child(3) { animation-delay: 0.4s; }

.thinking-waves {
  display: flex;
  gap: 0.125rem;
  align-items: flex-end;
  height: 16px;
}

.wave {
  width: 2px;
  background: currentColor;
  border-radius: 1px;
  opacity: 0.6;
  animation: waveHeight 1s infinite ease-in-out;
}

.wave:nth-child(2) { animation-delay: 0.1s; }
.wave:nth-child(3) { animation-delay: 0.2s; }

@keyframes thinkingPulse {
  0%, 80%, 100% { 
    opacity: 0.4;
    transform: scale(0.8); 
  }
  40% { 
    opacity: 1;
    transform: scale(1.1); 
  }
}

@keyframes waveHeight {
  0%, 100% { height: 4px; }
  50% { height: 16px; }
}

/* Message Actions */
.message-actions {
  pointer-events: auto;
}

.actions-container {
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.75rem;
  shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.dark .actions-container {
  background: rgba(17, 24, 39, 0.95);
  border-color: rgba(255, 255, 255, 0.1);
}

/* More Options Dropdown */
.more-options-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  min-width: 8rem;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
  shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(12px);
  overflow: hidden;
  z-index: 50;
}

.dark .more-options-dropdown {
  background: rgba(17, 24, 39, 0.95);
  border-color: rgba(255, 255, 255, 0.1);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s ease;
}

.dark .dropdown-item {
  color: #d1d5db;
}

.dropdown-item:hover {
  background: #f3f4f6;
}

.dark .dropdown-item:hover {
  background: rgba(55, 65, 81, 0.5);
}

/* Message Metadata */
.message-metadata {
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

.group:hover .message-metadata {
  opacity: 0.8;
}

.timestamp {
  font-variant-numeric: tabular-nums;
}

.edited-indicator {
  font-style: italic;
  color: #6b7280;
}

/* Message Reactions */
.message-reactions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.5rem;
  align-items: center;
}

.reaction-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 9999px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dark .reaction-item {
  background: #374151;
  border-color: #4b5563;
}

.reaction-item:hover {
  background: #e5e7eb;
  transform: scale(1.05);
}

.dark .reaction-item:hover {
  background: #4b5563;
}

.reaction-active {
  background: #dbeafe !important;
  border-color: #3b82f6 !important;
  color: #1d4ed8;
}

.dark .reaction-active {
  background: rgba(59, 130, 246, 0.2) !important;
  border-color: #3b82f6 !important;
  color: #60a5fa;
}

.add-reaction-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  background: #f9fafb;
  border: 1px dashed #d1d5db;
  border-radius: 50%;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dark .add-reaction-btn {
  background: #1f2937;
  border-color: #4b5563;
  color: #9ca3af;
}

.add-reaction-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
  color: #374151;
  transform: scale(1.1);
}

.dark .add-reaction-btn:hover {
  background: #374151;
  color: #d1d5db;
}

/* Typing Indicator */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.75rem;
}

.typing-text {
  font-weight: 500;
}

/* Responsive Adjustments */
.compact-mode .message-bubble-enhanced {
  max-width: 20rem;
}

.mobile-layout .message-actions {
  position: static;
  margin-top: 0.5rem;
  justify-content: center;
}

.mobile-layout .actions-container {
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
}

.mobile-layout .more-options-dropdown {
  position: fixed;
  bottom: 1rem;
  left: 1rem;
  right: 1rem;
  top: auto;
  margin: 0;
  border-radius: 1rem;
}

/* Transitions */
.actions-fade-enter-active,
.actions-fade-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.actions-fade-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.9);
}

.actions-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.9);
}

.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: all 0.2s ease;
}

.dropdown-fade-enter-from {
  opacity: 0;
  transform: translateY(-4px) scale(0.95);
}

.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.95);
}

.reactions-fade-enter-active,
.reactions-fade-leave-active {
  transition: all 0.3s ease;
}

.reactions-fade-enter-from,
.reactions-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .message-bubble-enhanced {
    border: 2px solid currentColor;
  }
  
  .actions-container {
    border: 2px solid currentColor;
    background: white;
  }
  
  .dark .actions-container {
    background: black;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .enhanced-message,
  .message-bubble-enhanced,
  .avatar,
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
</style>