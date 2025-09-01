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
       aria-label="按钮">
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
         aria-label="按钮">
          <Pause :size="16" />
        </button>

        <button
          @click="toggleContinuous"
          class="control-btn continuous-btn"
          :class="{ active: isContinuous }"
          :title="$t('voice.continuousMode')"
         aria-label="按钮">
          <RotateCcw :size="16" />
        </button>

        <button
          @click="showSettings"
          class="control-btn settings-btn"
          :title="$t('voice.settings')"
         aria-label="按钮">
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
        <button @click="clearResults" class="clear-btn" aria-label="按钮">
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
            <button @click="toggleAlternatives(index)" class="alternatives-toggle" aria-label="按钮">
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
             aria-label="按钮">
              <Copy :size="12" />
            </button>

            <button
              @click="useResult(result.transcript)"
              class="action-btn use-btn"
              :title="$t('voice.useResult')"
             aria-label="按钮">
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
      <button @click="dismissError" class="dismiss-btn" aria-label="按钮">
        <X :size="14" />
      </button>
    </div>

    <!-- Permission Request -->
    <div v-if="!hasPermission && !isRecording" class="permission-request">
      <Mic :size="24" />
      <p>{{ $t('voice.permissionRequired') }}</p>
      <button @click="requestPermission" class="permission-btn" aria-label="按钮">
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


/* 焦点样式 */
:focus-visible {
  outline: 2px solid hsl(var(--ring, 59 130 230));
  outline-offset: 2px;
}

/* 🎨 错误状态设计 */
.error-state {
  padding: 1rem;
  border: 1px solid hsl(0 84% 60% / 0.2);
  border-radius: 8px;
  background-color: hsl(0 84% 60% / 0.05);
  color: hsl(0 84% 60%);
}

.error-icon {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  margin-right: 0.5rem;
  color: hsl(0 84% 60%);
}

.error-title {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.error-message {
  font-size: 0.875rem;
  line-height: 1.4;
  margin-bottom: 1rem;
}

.error-actions {
  display: flex;
  gap: 0.5rem;
}

.error-retry-btn {
  padding: 0.5rem 1rem;
  background-color: hsl(0 84% 60%);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.error-retry-btn:hover {
  background-color: hsl(0 84% 60% / 0.9);
}</style>
