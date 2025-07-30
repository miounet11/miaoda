<template>
  <div 
    class="message-item flex gap-3"
    :class="messageClasses"
    @mouseenter="showActions = true"
    @mouseleave="showActions = false"
  >
    <!-- Avatar -->
    <div v-if="message.role === 'assistant'" class="flex-shrink-0">
      <div class="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
        <Bot :size="18" class="text-primary" />
      </div>
    </div>
    
    <!-- Message Content -->
    <div class="message-content flex flex-col gap-1 max-w-[90%] sm:max-w-[85%]">
      <!-- Message Bubble -->
      <div 
        :class="[
          'message-bubble rounded-2xl px-3 sm:px-4 py-2 sm:py-3 relative',
          message.role === 'user' 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted'
        ]"
      >
        <!-- Loading State -->
        <div v-if="isLoading && !message.content">
          <TypingIndicator message="AI is thinking..." />
        </div>
        
        <!-- Message Content -->
        <MessageContentEnhanced
          v-else
          :content="message.content"
          :is-loading="isLoading"
          :attachments="message.attachments"
          :error="message.error"
          :show-retry="!!message.error"
          @retry="$emit('retry')"
        />
        
        <!-- Message Actions -->
        <Transition name="actions">
          <div 
            v-if="showActions || actionsVisible"
            class="message-actions absolute -right-2 top-2 flex gap-1 bg-background border rounded-lg shadow-sm p-1"
          >
            <button
              @click="$emit('copy')"
              class="action-button p-1.5 hover:bg-muted rounded transition-colors"
              title="Copy message"
            >
              <Copy :size="14" />
            </button>
            
            <!-- Voice Playback Button -->
            <button
              v-if="enableVoice && voiceSupported && message.content.trim()"
              @click="toggleVoiceControls"
              class="action-button p-1.5 hover:bg-muted rounded transition-colors"
              :class="{ 'bg-primary/10 text-primary': showVoiceControls }"
              title="Play message with text-to-speech"
            >
              <Volume2 :size="14" />
            </button>
            
            <button
              v-if="message.role === 'user'"
              @click="$emit('edit')"
              class="action-button p-1.5 hover:bg-muted rounded transition-colors"
              title="Edit message"
            >
              <Edit2 :size="14" />
            </button>
            
            <button
              v-if="message.role === 'assistant' && !isLoading"
              @click="$emit('retry')"
              class="action-button p-1.5 hover:bg-muted rounded transition-colors"
              title="Regenerate response"
            >
              <RefreshCw :size="14" />
            </button>
            
            <button
              @click="$emit('delete')"
              class="action-button p-1.5 hover:bg-red-100 hover:text-red-600 rounded transition-colors"
              title="Delete message"
            >
              <Trash2 :size="14" />
            </button>
          </div>
        </Transition>
      </div>
      
      <!-- Voice Controls -->
      <div 
        v-if="showVoiceControls && enableVoice && voiceSupported && message.content.trim()"
        class="voice-controls mt-2 p-3 bg-muted/30 rounded-lg border"
      >
        <VoiceSynthesis
          :text="message.content"
          :auto-play="autoPlayVoice"
          :show-progress="true"
          :show-voice-selector="false"
          :show-volume-control="true"
          :compact="true"
          @synthesis-start="onVoiceStart"
          @synthesis-end="onVoiceEnd"
          @error="onVoiceError"
        />
      </div>
      
      <!-- Message Metadata -->
      <div v-if="showMetadata" class="message-metadata flex items-center gap-2 px-2 text-xs text-muted-foreground">
        <span>{{ formatTime(message.timestamp) }}</span>
        
        <span v-if="message.role === 'assistant' && isLoading" class="flex items-center gap-1">
          <Loader2 :size="12" class="animate-spin" />
          Generating...
        </span>
        
        <button
          v-if="message.attachments && message.attachments.length > 0"
          class="flex items-center gap-1 hover:text-foreground transition-colors"
          @click="showAttachments = !showAttachments"
        >
          <Paperclip :size="12" />
          {{ message.attachments.length }} attachment{{ message.attachments.length !== 1 ? 's' : '' }}
        </button>
      </div>
      
      <!-- Attachments Preview -->
      <div v-if="showAttachments && message.attachments" class="attachments-preview mt-2">
        <div class="flex flex-wrap gap-2">
          <div
            v-for="attachment in message.attachments"
            :key="attachment.url"
            class="attachment-item flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-xs"
          >
            <FileText :size="12" />
            <span>{{ attachment.name }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- User Avatar -->
    <div v-if="message.role === 'user'" class="flex-shrink-0">
      <div class="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
        <User :size="18" class="text-secondary-foreground" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Bot, User, Copy, Edit2, RefreshCw, Trash2, Loader2, Paperclip, FileText, Volume2 } from 'lucide-vue-next'
import TypingIndicator from '../loading/TypingIndicator.vue'
import MessageContentEnhanced from '../MessageContentEnhanced.vue'
import VoiceSynthesis from '@renderer/src/components/voice/VoiceSynthesis.vue'
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
  showMetadata?: boolean
  enableVoice?: boolean
  autoPlayVoice?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLast: false,
  isLoading: false,
  showMetadata: true,
  enableVoice: false,
  autoPlayVoice: false
})

defineEmits<{
  retry: []
  edit: []
  delete: []
  copy: []
}>()

const showActions = ref(false)
const actionsVisible = ref(false)
const showAttachments = ref(false)
const showVoiceControls = ref(false)
const voiceSupported = ref(false)

const messageClasses = computed(() => ({
  'justify-end': props.message.role === 'user',
  'justify-start': props.message.role === 'assistant',
  'mb-6': props.isLast
}))

const formatTime = (date: Date) => {
  return formatDistanceToNow(date)
}

// Keep actions visible when interacting with them
const keepActionsVisible = () => {
  actionsVisible.value = true
  setTimeout(() => {
    actionsVisible.value = false
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
.message-item {
  position: relative;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
    max-height: 0;
  }
  to {
    opacity: 1;
    transform: translateY(0);
    max-height: 200px;
  }
}

/* Message actions transitions */
.actions-enter-active,
.actions-leave-active {
  transition: all 0.2s ease;
}

.actions-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(-10px);
}

.actions-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(-10px);
}

/* Action button styles */
.action-button {
  color: var(--muted-foreground);
  transition: all 0.2s ease;
}

.action-button:hover {
  color: var(--foreground);
  transform: scale(1.1);
}

/* Message bubble animations */
.message-bubble {
  transition: all 0.2s ease;
}

.message-item:hover .message-bubble {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Voice controls */
.voice-controls {
  animation: slideDown 0.3s ease-out;
  background: linear-gradient(135deg, rgba(var(--primary-rgb, 59, 130, 246), 0.05), rgba(var(--muted-rgb, 148, 163, 184), 0.1));
  border: 1px solid rgba(var(--muted-rgb, 148, 163, 184), 0.3);
  transition: all 0.2s ease;
}

.voice-controls:hover {
  border-color: rgba(var(--primary-rgb, 59, 130, 246), 0.3);
  box-shadow: 0 2px 8px rgba(var(--primary-rgb, 59, 130, 246), 0.1);
}

/* Attachment animations */
.attachment-item {
  transition: all 0.2s ease;
}

.attachment-item:hover {
  background: var(--muted);
  transform: translateY(-1px);
}

/* Loading animation */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .message-actions {
    position: static;
    margin-top: 8px;
    justify-content: center;
  }
  
  .message-metadata {
    font-size: 0.75rem;
  }
}

/* Theme variables */
:root {
  --primary: hsl(221, 83%, 53%);
  --primary-foreground: hsl(0, 0%, 100%);
  --muted: hsl(210, 20%, 96%);
  --muted-foreground: hsl(215, 20%, 45%);
  --background: hsl(0, 0%, 100%);
  --foreground: hsl(222, 47%, 11%);
  --secondary: hsl(210, 20%, 96%);
  --secondary-foreground: hsl(222, 47%, 11%);
}

:root[data-theme="dark"] {
  --primary: hsl(221, 83%, 65%);
  --muted: hsl(217, 33%, 17%);
  --muted-foreground: hsl(215, 20%, 65%);
  --background: hsl(222, 47%, 11%);
  --foreground: hsl(210, 20%, 98%);
  --secondary: hsl(217, 33%, 17%);
  --secondary-foreground: hsl(210, 20%, 98%);
}
</style>