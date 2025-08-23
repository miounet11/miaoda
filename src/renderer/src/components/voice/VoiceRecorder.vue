<template>
  <div class="voice-recorder" :class="recorderClasses">
    <!-- Recording Controls -->
    <div class="recorder-controls">
      <button
        @click="toggleRecording"
        class="record-btn"
        :class="recordButtonClasses"
        :disabled="!isSupported || (!hasPermission && !isRecording)"
        :title="recordButtonTitle"
      >
        <component :is="recordIcon" :size="20" />
        <span class="record-pulse" v-if="isRecording" />
      </button>

      <div class="recording-info">
        <div v-if="isRecording" class="recording-status">
          <div class="status-indicator">
            <div class="pulse-dot" />
            <span class="status-text">{{ $t('voice.recording') }}</span>
          </div>

          <div class="recording-timer">
            {{ formatDuration(recordingDuration) }}
          </div>
        </div>

        <div v-else-if="lastTranscript" class="last-result">
          <span class="transcript-text">{{ lastTranscript }}</span>
          <span class="confidence-badge" :class="confidenceClass">
            {{ Math.round(lastConfidence * 100) }}%
          </span>
        </div>

        <div v-else class="recorder-hint">
          {{ recordingHint }}
        </div>
      </div>

      <!-- Additional Controls -->
      <div class="additional-controls">
        <button
          v-if="isRecording"
          @click="pauseRecording"
          class="control-btn pause-btn"
          :title="$t('voice.pause')"
        >
          <Pause :size="16" />
        </button>

        <button
          @click="toggleContinuous"
          class="control-btn continuous-btn"
          :class="{ active: isContinuous }"
          :title="$t('voice.continuousMode')"
        >
          <RotateCcw :size="16" />
        </button>

        <button
          @click="showSettings"
          class="control-btn settings-btn"
          :title="$t('voice.settings')"
        >
          <Settings :size="16" />
        </button>
      </div>
    </div>

    <!-- Waveform Visualization -->
    <div v-if="showWaveform && (isRecording || audioData.length > 0)" class="waveform-container">
      <canvas
        ref="waveformCanvas"
        class="waveform-canvas"
        :width="canvasWidth"
        :height="canvasHeight"
      />

      <div class="waveform-overlay">
        <div class="volume-level">
          <span class="volume-label">{{ $t('voice.volume') }}</span>
          <div class="volume-bar">
            <div class="volume-fill" :style="{ width: `${currentVolume * 100}%` }" />
          </div>
        </div>
      </div>
    </div>

    <!-- Recognition Results -->
    <div v-if="showResults && recognitionResults.length > 0" class="recognition-results">
      <div class="results-header">
        <h4>{{ $t('voice.recognitionResults') }}</h4>
        <button @click="clearResults" class="clear-btn">
          <X :size="14" />
        </button>
      </div>

      <div class="results-list">
        <div
          v-for="(result, index) in recognitionResults"
          :key="index"
          class="result-item"
          :class="{ final: result.isFinal }"
        >
          <div class="result-content">
            <span class="result-text">{{ result.transcript }}</span>
            <span class="result-confidence">{{ Math.round(result.confidence * 100) }}%</span>
          </div>

          <div v-if="result.alternatives && result.alternatives.length > 0" class="alternatives">
            <button @click="toggleAlternatives(index)" class="alternatives-toggle">
              {{ $t('voice.alternatives') }} ({{ result.alternatives.length }})
              <ChevronDown :size="12" :class="{ rotated: showAlternativesFor === index }" />
            </button>

            <div v-if="showAlternativesFor === index" class="alternatives-list">
              <div
                v-for="(alt, altIndex) in result.alternatives"
                :key="altIndex"
                class="alternative-item"
                @click="selectAlternative(result, alt)"
              >
                <span class="alt-text">{{ alt.transcript }}</span>
                <span class="alt-confidence">{{ Math.round(alt.confidence * 100) }}%</span>
              </div>
            </div>
          </div>

          <div class="result-actions">
            <button
              @click="copyResult(result.transcript)"
              class="action-btn"
              :title="$t('common.copy')"
            >
              <Copy :size="12" />
            </button>

            <button
              @click="useResult(result.transcript)"
              class="action-btn use-btn"
              :title="$t('voice.useResult')"
            >
              <Check :size="12" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="error-display">
      <AlertCircle :size="16" />
      <span class="error-message">{{ errorMessage }}</span>
      <button @click="dismissError" class="dismiss-btn">
        <X :size="14" />
      </button>
    </div>

    <!-- Permission Request -->
    <div v-if="!hasPermission && !isRecording" class="permission-request">
      <Mic :size="24" />
      <p>{{ $t('voice.permissionRequired') }}</p>
      <button @click="requestPermission" class="permission-btn">
        {{ $t('voice.grantPermission') }}
      </button>
    </div>

    <!-- Settings Modal -->
    <VoiceSettings
      v-if="showSettingsModal"
      @close="showSettingsModal = false"
      @settings-changed="onSettingsChanged"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import {
  Mic,
  MicOff,
  Pause,
  Play,
  RotateCcw,
  Settings,
  X,
  Copy,
  Check,
  AlertCircle,
  ChevronDown
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import {
  voiceService,
  type VoiceRecognitionResult
} from '@renderer/src/services/voice/VoiceService'
import VoiceSettings from './VoiceSettings.vue'

// Props
interface Props {
  showWaveform?: boolean
  showResults?: boolean
  continuous?: boolean
  language?: string
  autoStart?: boolean
  maxResults?: number
}

const props = withDefaults(defineProps<Props>(), {
  showWaveform: true,
  showResults: true,
  continuous: false,
  language: 'zh-CN',
  autoStart: false,
  maxResults: 10
})

// Emits
const emit = defineEmits<{
  'recording-start': []
  'recording-end': []
  result: [result: VoiceRecognitionResult]
  transcript: [text: string]
  error: [error: Error]
}>()

// Composables
const { t } = useI18n()

// Refs
const waveformCanvas = ref<HTMLCanvasElement>()
const isRecording = ref(false)
const isPaused = ref(false)
const isContinuous = ref(props.continuous)
const hasPermission = ref(false)
const isSupported = ref(false)
const showSettingsModal = ref(false)
const error = ref<Error | null>(null)

// Recording state
const recordingDuration = ref(0)
const currentVolume = ref(0)
const audioData = ref<number[]>([])
const recognitionResults = ref<VoiceRecognitionResult[]>([])
const lastTranscript = ref('')
const lastConfidence = ref(0)
const showAlternativesFor = ref<number | null>(null)

// Audio analysis
let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let microphone: MediaStreamAudioSourceNode | null = null
let dataArray: Uint8Array | null = null
let animationFrame: number | null = null
let recordingTimer: NodeJS.Timeout | null = null

// Canvas dimensions
const canvasWidth = ref(400)
const canvasHeight = ref(100)

// Computed properties
const recorderClasses = computed(() => ({
  recording: isRecording.value,
  paused: isPaused.value,
  'has-error': error.value !== null,
  'no-permission': !hasPermission.value
}))

const recordButtonClasses = computed(() => ({
  recording: isRecording.value,
  disabled: !isSupported.value || (!hasPermission.value && !isRecording.value)
}))

const recordIcon = computed(() => {
  if (isRecording.value) {
    return isPaused.value ? Play : MicOff
  }
  return Mic
})

const recordButtonTitle = computed(() => {
  if (!isSupported.value) return t('voice.notSupported')
  if (!hasPermission.value) return t('voice.permissionRequired')
  if (isRecording.value) return t('voice.stopRecording')
  return t('voice.startRecording')
})

const recordingHint = computed(() => {
  if (!isSupported.value) return t('voice.notSupported')
  if (!hasPermission.value) return t('voice.clickToGrant')
  return t('voice.clickToRecord')
})

const confidenceClass = computed(() => {
  const confidence = lastConfidence.value
  if (confidence >= 0.8) return 'high'
  if (confidence >= 0.6) return 'medium'
  return 'low'
})

const errorMessage = computed(() => {
  if (!error.value) return ''
  return error.value.message || t('voice.unknownError')
})

// Methods
const toggleRecording = async () => {
  if (isRecording.value) {
    await stopRecording()
  } else {
    await startRecording()
  }
}

const startRecording = async () => {
  try {
    error.value = null

    const success = await voiceService.startRecording({
      language: props.language,
      continuous: isContinuous.value,
      interimResults: true,
      maxAlternatives: 3
    })

    if (success) {
      isRecording.value = true
      isPaused.value = false
      recordingDuration.value = 0

      startAudioAnalysis()
      startTimer()

      emit('recording-start')
    }
  } catch (err) {
    error.value = err as Error
    emit('error', err as Error)
  }
}

const stopRecording = async () => {
  const success = voiceService.stopRecognition()

  if (success) {
    isRecording.value = false
    isPaused.value = false

    stopAudioAnalysis()
    stopTimer()

    emit('recording-end')
  }
}

const pauseRecording = () => {
  if (isRecording.value) {
    isPaused.value = !isPaused.value

    if (isPaused.value) {
      stopAudioAnalysis()
    } else {
      startAudioAnalysis()
    }
  }
}

const toggleContinuous = () => {
  isContinuous.value = !isContinuous.value
}

const requestPermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach(track => track.stop())
    hasPermission.value = true
  } catch (err) {
    error.value = new Error(t('voice.permissionDenied'))
  }
}

// Audio analysis
const startAudioAnalysis = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    })

    audioContext = new (window.AudioContext || window.webkitAudioContext)()
    analyser = audioContext.createAnalyser()
    microphone = audioContext.createMediaStreamSource(stream)

    analyser.fftSize = 256
    const bufferLength = analyser.frequencyBinCount
    dataArray = new Uint8Array(bufferLength)

    microphone.connect(analyser)

    animateWaveform()
  } catch (err) {
    console.error('Failed to start audio analysis:', err)
  }
}

const stopAudioAnalysis = () => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
  }

  if (microphone) {
    microphone.disconnect()
    microphone = null
  }

  if (audioContext) {
    audioContext.close()
    audioContext = null
  }

  analyser = null
  dataArray = null
}

const animateWaveform = () => {
  if (!analyser || !dataArray || !waveformCanvas.value) return

  analyser.getByteFrequencyData(dataArray)

  // Calculate volume level
  const sum = dataArray.reduce((a, b) => a + b, 0)
  currentVolume.value = sum / (dataArray.length * 255)

  // Draw waveform
  drawWaveform()

  // Store audio data for visualization
  audioData.value.push(...Array.from(dataArray))
  if (audioData.value.length > 1000) {
    audioData.value = audioData.value.slice(-1000)
  }

  animationFrame = requestAnimationFrame(animateWaveform)
}

const drawWaveform = () => {
  if (!waveformCanvas.value || !dataArray) return

  const canvas = waveformCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const width = canvas.width
  const height = canvas.height

  // Clear canvas
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
  ctx.fillRect(0, 0, width, height)

  // Draw waveform
  ctx.lineWidth = 2
  ctx.strokeStyle = '#3b82f6'
  ctx.beginPath()

  const sliceWidth = width / dataArray.length
  let x = 0

  for (let i = 0; i < dataArray.length; i++) {
    const v = dataArray[i] / 128.0
    const y = (v * height) / 2

    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }

    x += sliceWidth
  }

  ctx.stroke()

  // Draw frequency bars
  ctx.fillStyle = '#3b82f620'
  const barWidth = width / dataArray.length

  for (let i = 0; i < dataArray.length; i++) {
    const barHeight = (dataArray[i] / 255) * height
    ctx.fillRect(i * barWidth, height - barHeight, barWidth, barHeight)
  }
}

// Timer
const startTimer = () => {
  recordingTimer = setInterval(() => {
    recordingDuration.value += 1000
  }, 1000)
}

const stopTimer = () => {
  if (recordingTimer) {
    clearInterval(recordingTimer)
    recordingTimer = null
  }
}

const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Results management
const addResult = (result: VoiceRecognitionResult) => {
  recognitionResults.value.unshift(result)

  if (recognitionResults.value.length > props.maxResults) {
    recognitionResults.value = recognitionResults.value.slice(0, props.maxResults)
  }

  if (result.isFinal) {
    lastTranscript.value = result.transcript
    lastConfidence.value = result.confidence
  }
}

const clearResults = () => {
  recognitionResults.value = []
  lastTranscript.value = ''
  lastConfidence.value = 0
}

const toggleAlternatives = (index: number) => {
  showAlternativesFor.value = showAlternativesFor.value === index ? null : index
}

const selectAlternative = (
  result: VoiceRecognitionResult,
  alternative: { transcript: string; confidence: number }
) => {
  emit('transcript', alternative.transcript)
  showAlternativesFor.value = null
}

const copyResult = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
  } catch (err) {
    console.error('Failed to copy text:', err)
  }
}

const useResult = (text: string) => {
  emit('transcript', text)
}

const dismissError = () => {
  error.value = null
}

// Settings
const showSettings = () => {
  showSettingsModal.value = true
}

const onSettingsChanged = () => {
  // Reload voice service configuration
  const config = voiceService.getConfig()
  hasPermission.value = config.permissions.microphone
}

// Voice service event handlers
const onRecognitionStart = () => {
  isRecording.value = true
}

const onRecognitionEnd = () => {
  isRecording.value = false
  stopAudioAnalysis()
  stopTimer()
}

const onRecognitionResult = (result: VoiceRecognitionResult) => {
  addResult(result)
  emit('result', result)

  if (result.isFinal) {
    emit('transcript', result.transcript)
  }
}

const onRecognitionError = (err: Error) => {
  error.value = err
  emit('error', err)

  isRecording.value = false
  stopAudioAnalysis()
  stopTimer()
}

// Lifecycle
onMounted(async () => {
  // Check support and permissions
  isSupported.value = voiceService.isRecognitionSupported()
  hasPermission.value = voiceService.hasMicrophonePermission()

  // Setup event listeners
  voiceService.on('recognition-start', onRecognitionStart)
  voiceService.on('recognition-end', onRecognitionEnd)
  voiceService.on('recognition-result', onRecognitionResult)
  voiceService.on('recognition-error', onRecognitionError)

  // Auto-start if requested
  if (props.autoStart && hasPermission.value && isSupported.value) {
    await nextTick()
    startRecording()
  }

  // Setup canvas resize observer
  if (waveformCanvas.value) {
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        canvasWidth.value = width
        canvasHeight.value = height
      }
    })

    resizeObserver.observe(waveformCanvas.value.parentElement!)
  }
})

onUnmounted(() => {
  // Clean up
  stopRecording()
  stopAudioAnalysis()
  stopTimer()

  // Remove event listeners
  voiceService.off('recognition-start', onRecognitionStart)
  voiceService.off('recognition-end', onRecognitionEnd)
  voiceService.off('recognition-result', onRecognitionResult)
  voiceService.off('recognition-error', onRecognitionError)
})

// Watch for prop changes
watch(
  () => props.continuous,
  newValue => {
    isContinuous.value = newValue
  }
)
</script>

<style scoped>
.voice-recorder {
  @apply bg-background border border-border rounded-lg p-4 space-y-4;
  contain: layout style paint;
}

.recording {
  @apply bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800;
}

.has-error {
  @apply bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800;
}

.recorder-controls {
  @apply flex items-center gap-4;
}

.record-btn {
  @apply relative flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed;
}

.record-btn.recording {
  @apply bg-red-500 hover:bg-red-600 animate-pulse;
}

.record-pulse {
  @apply absolute inset-0 bg-red-500/30 rounded-full animate-ping;
}

.recording-info {
  @apply flex-1 min-w-0;
}

.recording-status {
  @apply flex items-center justify-between;
}

.status-indicator {
  @apply flex items-center gap-2;
}

.pulse-dot {
  @apply w-2 h-2 bg-red-500 rounded-full animate-pulse;
}

.status-text {
  @apply text-sm font-medium text-red-600 dark:text-red-400;
}

.recording-timer {
  @apply text-sm font-mono text-muted-foreground;
}

.last-result {
  @apply flex items-center gap-2;
}

.transcript-text {
  @apply flex-1 text-sm truncate;
}

.confidence-badge {
  @apply px-2 py-1 text-xs font-medium rounded-full;
}

.confidence-badge.high {
  @apply bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300;
}

.confidence-badge.medium {
  @apply bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300;
}

.confidence-badge.low {
  @apply bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300;
}

.recorder-hint {
  @apply text-sm text-muted-foreground;
}

.additional-controls {
  @apply flex items-center gap-1;
}

.control-btn {
  @apply p-2 rounded-md hover:bg-accent transition-colors;
}

.control-btn.active {
  @apply bg-primary text-primary-foreground;
}

.waveform-container {
  @apply relative bg-muted/50 rounded-lg overflow-hidden;
  height: 120px;
}

.waveform-canvas {
  @apply w-full h-full;
}

.waveform-overlay {
  @apply absolute top-2 left-2 right-2 flex items-start justify-between;
}

.volume-level {
  @apply flex items-center gap-2;
}

.volume-label {
  @apply text-xs font-medium text-muted-foreground;
}

.volume-bar {
  @apply w-16 h-2 bg-background/50 rounded-full overflow-hidden;
}

.volume-fill {
  @apply h-full bg-primary transition-all duration-100;
}

.recognition-results {
  @apply bg-muted/30 rounded-lg p-3 space-y-3;
}

.results-header {
  @apply flex items-center justify-between;
}

.results-header h4 {
  @apply text-sm font-medium;
}

.clear-btn {
  @apply p-1 rounded hover:bg-muted transition-colors;
}

.results-list {
  @apply space-y-2 max-h-60 overflow-y-auto;
}

.result-item {
  @apply bg-background border border-border rounded-lg p-3 transition-all duration-200;
}

.result-item.final {
  @apply border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20;
}

.result-content {
  @apply flex items-start justify-between gap-2 mb-2;
}

.result-text {
  @apply flex-1 text-sm;
}

.result-confidence {
  @apply text-xs font-mono text-muted-foreground;
}

.alternatives-toggle {
  @apply flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors;
}

.alternatives-toggle .lucide-chevron-down {
  @apply transition-transform duration-200;
}

.alternatives-toggle .lucide-chevron-down.rotated {
  @apply rotate-180;
}

.alternatives-list {
  @apply mt-2 space-y-1;
}

.alternative-item {
  @apply flex items-center justify-between p-2 bg-muted/50 rounded cursor-pointer hover:bg-muted transition-colors;
}

.alt-text {
  @apply flex-1 text-xs;
}

.alt-confidence {
  @apply text-xs font-mono text-muted-foreground;
}

.result-actions {
  @apply flex items-center gap-1 justify-end;
}

.action-btn {
  @apply p-1.5 rounded hover:bg-muted transition-colors;
}

.use-btn {
  @apply text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900;
}

.error-display {
  @apply flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg;
}

.error-message {
  @apply flex-1 text-sm;
}

.dismiss-btn {
  @apply p-1 rounded hover:bg-destructive/20 transition-colors;
}

.permission-request {
  @apply flex flex-col items-center gap-3 p-6 text-center;
}

.permission-request p {
  @apply text-sm text-muted-foreground;
}

.permission-btn {
  @apply px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors;
}

/* Animations */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes ping {
  75%,
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .record-btn.recording {
    animation: none;
  }

  .record-pulse {
    animation: none;
  }

  .pulse-dot {
    animation: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .voice-recorder {
    @apply border-2;
  }

  .record-btn:focus {
    @apply ring-2 ring-primary;
  }
}
</style>
