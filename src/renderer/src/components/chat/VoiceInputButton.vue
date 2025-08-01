<template>
  <button
    @click="toggleVoiceInput"
    class="voice-input-btn"
    :class="buttonClasses"
    :title="buttonTitle"
    :disabled="disabled || !isSupported"
  >
    <component :is="buttonIcon" :size="iconSize" />
    
    <!-- Recording pulse animation -->
    <span v-if="isRecording" class="record-pulse" />
    
    <!-- Permission indicator -->
    <span v-if="!hasPermission && !isRecording" class="permission-indicator" />
  </button>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { Mic, MicOff, AlertCircle } from 'lucide-vue-next'
import { voiceService } from '@renderer/src/services/voice/VoiceService'

interface Props {
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'ghost' | 'outline'
  autoStart?: boolean
  showPermissionIndicator?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  size: 'md',
  variant: 'default',
  autoStart: false,
  showPermissionIndicator: true
})

const emit = defineEmits<{
  'recording-start': []
  'recording-stop': []
  'permission-required': []
  'error': [error: string]
}>()

// State
const isRecording = ref(false)
const isSupported = ref(false)
const hasPermission = ref(false)
const isInitializing = ref(false)

// Computed properties
const iconSize = computed(() => {
  switch (props.size) {
    case 'sm': return 14
    case 'lg': return 20
    default: return 16
  }
})

const buttonIcon = computed(() => {
  if (!isSupported.value) return AlertCircle
  if (isRecording.value) return MicOff
  return Mic
})

const buttonClasses = computed(() => ({
  [`voice-input-btn--${props.size}`]: true,
  [`voice-input-btn--${props.variant}`]: true,
  'voice-input-btn--recording': isRecording.value,
  'voice-input-btn--disabled': !isSupported.value || props.disabled,
  'voice-input-btn--no-permission': !hasPermission.value && isSupported.value,
  'voice-input-btn--initializing': isInitializing.value
}))

const buttonTitle = computed(() => {
  if (!isSupported.value) return 'Voice input not supported in this browser'
  if (props.disabled) return 'Voice input disabled'
  if (!hasPermission.value) return 'Click to grant microphone permission'
  if (isRecording.value) return 'Click to stop recording'
  return 'Click to start voice input'
})

// Methods
const toggleVoiceInput = async () => {
  if (!isSupported.value || props.disabled) return

  if (!hasPermission.value) {
    emit('permission-required')
    await requestPermission()
    return
  }

  if (isRecording.value) {
    await stopRecording()
  } else {
    await startRecording()
  }
}

const startRecording = async () => {
  if (isRecording.value) return

  try {
    isInitializing.value = true
    
    const success = await voiceService.startRecognition({
      language: 'zh-CN',
      continuous: true,
      interimResults: true,
      maxAlternatives: 3
    })

    if (success) {
      isRecording.value = true
      emit('recording-start')
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Voice recording failed'
    emit('error', errorMessage)
  } finally {
    isInitializing.value = false
  }
}

const stopRecording = async () => {
  if (!isRecording.value) return

  try {
    const success = voiceService.stopRecognition()
    
    if (success) {
      isRecording.value = false
      emit('recording-stop')
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to stop recording'
    emit('error', errorMessage)
  }
}

const requestPermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach(track => track.stop())
    hasPermission.value = true
  } catch (error) {
    hasPermission.value = false
    emit('error', 'Microphone permission denied')
  }
}

const checkSupport = () => {
  const capabilities = voiceService.getCapabilities()
  isSupported.value = capabilities.speechRecognition && capabilities.mediaDevices
}

const checkPermission = async () => {
  hasPermission.value = voiceService.hasMicrophonePermission()
}

// Voice service event handlers
const onRecognitionStart = () => {
  isRecording.value = true
}

const onRecognitionEnd = () => {
  isRecording.value = false
}

const onRecognitionError = (error: Error) => {
  isRecording.value = false
  emit('error', error.message)
}

// Lifecycle
onMounted(async () => {
  checkSupport()
  await checkPermission()
  
  // Setup event listeners
  voiceService.on('recognition-start', onRecognitionStart)
  voiceService.on('recognition-end', onRecognitionEnd)
  voiceService.on('recognition-error', onRecognitionError)
  
  // Auto-start if requested
  if (props.autoStart && hasPermission.value && isSupported.value) {
    await nextTick()
    startRecording()
  }
})

onUnmounted(() => {
  // Clean up
  if (isRecording.value) {
    stopRecording()
  }
  
  // Remove event listeners
  voiceService.off('recognition-start', onRecognitionStart)
  voiceService.off('recognition-end', onRecognitionEnd)
  voiceService.off('recognition-error', onRecognitionError)
})

// Expose methods for parent components
defineExpose({
  startRecording,
  stopRecording,
  isRecording: () => isRecording.value,
  isSupported: () => isSupported.value,
  hasPermission: () => hasPermission.value
})
</script>

<style scoped>
.voice-input-btn {
  @apply relative flex items-center justify-center rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50;
  position: relative;
  overflow: hidden;
}

/* Size variants */
.voice-input-btn--sm {
  @apply p-1.5 w-8 h-8;
}

.voice-input-btn--md {
  @apply p-2 w-10 h-10;
}

.voice-input-btn--lg {
  @apply p-3 w-12 h-12;
}

/* Style variants */
.voice-input-btn--default {
  @apply bg-muted/50 hover:bg-muted text-foreground border border-transparent;
}

.voice-input-btn--ghost {
  @apply bg-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground;
}

.voice-input-btn--outline {
  @apply bg-transparent border border-border hover:bg-muted/50 text-foreground;
}

/* State variants */
.voice-input-btn--recording {
  @apply bg-red-500 hover:bg-red-600 text-white border-red-500;
  animation: pulse 2s infinite, breathe 2s infinite;
}

.voice-input-btn--disabled {
  @apply opacity-50 cursor-not-allowed pointer-events-none;
}

.voice-input-btn--no-permission {
  @apply border-warning/50 bg-warning/10 hover:bg-warning/20 text-warning-foreground;
}

.voice-input-btn--initializing {
  @apply opacity-75;
  animation: fadeInScale 0.3s ease-out;
}

/* Recording pulse animation */
.record-pulse {
  @apply absolute inset-0 bg-red-500/30 rounded-lg animate-ping;
  pointer-events: none;
}

/* Permission indicator */
.permission-indicator {
  @apply absolute -top-1 -right-1 w-3 h-3 bg-warning rounded-full border-2 border-background;
  animation: bounce 1s infinite;
}

/* Animations */
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.9;
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-2px);
  }
}

@keyframes breathe {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Accessibility */
.voice-input-btn:focus-visible {
  @apply ring-2 ring-primary ring-offset-2;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .voice-input-btn--recording {
    animation: none;
  }
  
  .record-pulse {
    animation: none;
    opacity: 0.3;
  }
  
  .permission-indicator {
    animation: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .voice-input-btn {
    @apply border-2;
  }
  
  .voice-input-btn--recording {
    @apply border-red-700;
  }
  
  .voice-input-btn--no-permission {
    @apply border-warning;
  }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .voice-input-btn--default {
    @apply bg-muted/30 hover:bg-muted/50;
  }
  
  .voice-input-btn--no-permission {
    @apply bg-warning/20 hover:bg-warning/30;
  }
}
</style>