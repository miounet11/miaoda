<template>
  <div class="voice-recorder group" :class="recorderClasses">
    <!-- Enhanced Compact Mode with Breathing Animation -->
    <div v-if="!isExpanded" class="compact-recorder">
      <button
        @click="toggleRecording"
        :disabled="!isSupported"
        class="record-button"
        :class="recordButtonClasses"
        :title="buttonTitle"
       aria-label="按钮">
        <div class="button-content relative">
          <Mic v-if="!isRecording" :size="16" class="transition-all duration-200" />
          <Square v-else :size="16" class="animate-recording-pulse" />

          <!-- Breathing rings when recording -->
          <div v-if="isRecording" class="absolute inset-0 pointer-events-none">
            <div class="breathing-ring ring-1" />
            <div class="breathing-ring ring-2" />
            <div class="breathing-ring ring-3" />
          </div>
        </div>
      </button>

      <!-- Enhanced Recording indicator -->
      <div v-if="isRecording" class="recording-indicator animate-slide-in-right">
        <div class="recording-dot-container">
          <div class="recording-dot animate-recording-dot" />
          <div class="recording-dot-shadow" />
        </div>
        <span class="recording-time text-xs font-mono animate-time-tick">{{
          formatTime(recordingTime)
        }}</span>
      </div>

      <!-- Enhanced Expand button with subtle animation -->
      <button
        v-if="isRecording"
        @click="isExpanded = true"
        class="expand-button hover-lift"
        title="显示波形"
       aria-label="按钮">
        <Maximize2 :size="12" class="transition-transform duration-200 group-hover:scale-110" />
      </button>
    </div>

    <!-- Enhanced Expanded Mode with Glass Morphism -->
    <div v-else class="expanded-recorder animate-expand">
      <div class="recorder-header animate-slide-in-down">
        <div class="recorder-title">
          <div class="title-icon-container">
            <Mic :size="16" class="text-primary animate-mic-glow" />
            <div class="icon-glow" />
          </div>
          <span class="text-sm font-medium animate-text-appear">语音录制</span>
        </div>
        <button @click="isExpanded = false" class="collapse-button hover-lift" title="收起" aria-label="按钮">
          <Minimize2 :size="14" class="transition-transform duration-200 hover:scale-110" />
        </button>
      </div>

      <!-- Enhanced Waveform Visualization with 3D Effect -->
      <div class="waveform-container animate-slide-in-up">
        <canvas
          ref="waveformCanvas"
          class="waveform-canvas"
          :width="canvasWidth"
          :height="canvasHeight"
        />
        <div
          v-if="!isRecording && audioData.length === 0"
          class="waveform-placeholder animate-fade-in"
        >
          <div class="placeholder-content">
            <div class="placeholder-waves">
              <div
                class="wave-line"
                v-for="i in 12"
                :key="i"
                :style="{ animationDelay: `${i * 100}ms` }"
              />
            </div>
            <span class="text-xs text-muted-foreground mt-2">开始录制以查看波形</span>
          </div>
        </div>

        <!-- Recording overlay effect -->
        <div v-if="isRecording" class="waveform-overlay">
          <div class="recording-shimmer" />
        </div>
      </div>

      <!-- Enhanced Recording Controls with Smooth Transitions -->
      <div class="recording-controls animate-slide-in-up">
        <div class="time-display">
          <span class="text-sm font-mono animate-time-glow">{{ formatTime(recordingTime) }}</span>
          <span v-if="maxDuration" class="text-xs text-muted-foreground animate-fade-in-delayed">
            / {{ formatTime(maxDuration) }}
          </span>
        </div>

        <div class="control-buttons">
          <!-- Enhanced Record/Stop Button -->
          <button
            @click="toggleRecording"
            :disabled="!isSupported"
            class="primary-control-button"
            :class="{ recording: isRecording }"
           aria-label="按钮">
            <div class="button-inner">
              <Mic v-if="!isRecording" :size="18" class="transition-all duration-300" />
              <Square v-else :size="18" class="animate-stop-pulse" />

              <!-- Enhanced breathing effect -->
              <div v-if="isRecording" class="absolute inset-0 pointer-events-none">
                <div class="breathing-ring primary-ring-1" />
                <div class="breathing-ring primary-ring-2" />
              </div>
            </div>
          </button>

          <!-- Enhanced Pause/Resume Button -->
          <button
            v-if="isRecording"
            @click="togglePause"
            class="control-button hover-scale"
            :disabled="!canPause"
           aria-label="按钮">
            <Pause v-if="!isPaused" :size="16" class="transition-all duration-200" />
            <Play v-else :size="16" class="animate-play-pulse" />
          </button>

          <!-- Enhanced Clear Button -->
          <button
            v-if="audioData.length  aria-label="按钮"> 0 && !isRecording"
            @click="clearRecording"
            class="control-button danger hover-scale"
          >
            <Trash2
              :size="16"
              class="transition-all duration-200 group-hover:animate-trash-wiggle"
            />
          </button>
        </div>

        <!-- Enhanced Send/Cancel Buttons -->
        <div v-if="audioData.length > 0 && !isRecording" class="action-buttons animate-slide-in-up">
          <button @click="cancelRecording" class="cancel-button hover-lift" aria-label="按钮">
            <span class="transition-all duration-200">取消</span>
          </button>
          <button @click="sendRecording" class="send-button hover-lift" aria-label="按钮">
            <Send :size="14" class="transition-all duration-200 group-hover:animate-send-fly" />
            <span class="transition-all duration-200">发送</span>
          </button>
        </div>
      </div>

      <!-- Audio Playback (when stopped) -->
      <div v-if="audioBlob && !isRecording" class="audio-playback">
        <audio
          ref="audioPlayer"
          :src="audioUrl"
          @timeupdate="onTimeUpdate"
          @ended="onPlaybackEnd"
          @loadedmetadata="onAudioLoaded"
        />

        <div class="playback-controls">
          <button @click="togglePlayback" class="play-button" aria-label="按钮">
            <Play v-if="!isPlaying" :size="16" />
            <Pause v-else :size="16" />
          </button>

          <div class="playback-progress">
            <div class="progress-track" @click="seekTo">
              <div class="progress-fill" :style="{ width: `${playbackProgress}%` }" />
            </div>
            <span class="playback-time text-xs">
              {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Enhanced Volume Level Indicator with 3D Bars -->
      <div v-if="isRecording" class="volume-indicator animate-slide-in-left">
        <div class="volume-label text-xs text-muted-foreground">音量</div>
        <div class="volume-bars">
          <div
            v-for="i in 10"
            :key="i"
            class="volume-bar"
            :class="{
              active: currentVolume > i * 10,
              peak: currentVolume > 80 && i > 8
            }"
            :style="{ animationDelay: `${i * 50}ms` }"
          />
        </div>
        <div class="volume-indicator-glow" :style="{ opacity: currentVolume / 100 }" />
      </div>
    </div>

    <!-- Enhanced Error State with Gentle Animation -->
    <div v-if="error" class="error-message animate-error-bounce">
      <AlertCircle :size="14" class="animate-error-icon" />
      <span class="text-xs animate-text-appear">{{ error }}</span>
    </div>

    <!-- Enhanced Permission Request with Call-to-Action -->
    <div v-if="needsPermission" class="permission-request animate-permission-slide">
      <div class="permission-icon-container">
        <Mic :size="16" class="text-muted-foreground animate-mic-request" />
        <div class="permission-pulse" />
      </div>
      <span class="text-xs text-muted-foreground">需要麦克风权限</span>
      <button @click="requestPermission" class="permission-button hover-lift" aria-label="按钮">
        <span class="button-text">允许</span>
        <div class="button-shimmer" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import {
  Mic,
  Square,
  Play,
  Pause,
  Send,
  Trash2,
  Maximize2,
  Minimize2,
  AlertCircle
} from 'lucide-vue-next'

interface Props {
  maxDuration?: number // Maximum recording duration in seconds
  sampleRate?: number // Audio sample rate
  compact?: boolean // Start in compact mode
  autoSend?: boolean // Auto send on stop
}

const props = withDefaults(defineProps<Props>(), {
  maxDuration: 300, // 5 minutes
  sampleRate: 44100,
  compact: true,
  autoSend: false
})

const emit = defineEmits<{
  'audio-recorded': [blob: Blob, duration: number]
  'recording-start': []
  'recording-stop': []
  'recording-cancel': []
  'permission-denied': []
}>()

// Component state
const isRecording = ref(false)
const isPaused = ref(false)
const isPlaying = ref(false)
const isExpanded = ref(!props.compact)
const isSupported = ref(false)
const needsPermission = ref(false)
const error = ref<string | null>(null)

// Recording data
const audioData = ref<number[]>([])
const audioBlob = ref<Blob | null>(null)
const audioUrl = ref<string | null>(null)
const recordingTime = ref(0)
const currentVolume = ref(0)
const duration = ref(0)
const currentTime = ref(0)

// Canvas and visualization
const waveformCanvas = ref<HTMLCanvasElement>()
const audioPlayer = ref<HTMLAudioElement>()
const canvasWidth = 300
const canvasHeight = 80

// WebRTC and media
let mediaRecorder: MediaRecorder | null = null
let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let stream: MediaStream | null = null
let recordingInterval: number | null = null
let animationFrame: number | null = null

// Computed properties
const recorderClasses = computed(() => ({
  compact: !isExpanded.value,
  expanded: isExpanded.value,
  recording: isRecording.value,
  error: !!error.value
}))

const recordButtonClasses = computed(() => ({
  recording: isRecording.value,
  disabled: !isSupported.value
}))

const buttonTitle = computed(() => {
  if (!isSupported.value) return '浏览器不支持录音'
  if (needsPermission.value) return '需要麦克风权限'
  return isRecording.value ? '停止录音' : '开始录音'
})

const canPause = computed(() => {
  return mediaRecorder?.state === 'recording'
})

const playbackProgress = computed(() => {
  if (duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
})

// Initialize component
onMounted(() => {
  checkBrowserSupport()
  setupCanvas()
})

onUnmounted(() => {
  cleanup()
})

// Watch for recording time limit
watch(recordingTime, time => {
  if (props.maxDuration && time >= props.maxDuration) {
    stopRecording()
  }
})

// Browser support check
const checkBrowserSupport = () => {
  isSupported.value = !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia &&
    window.MediaRecorder
  )

  if (!isSupported.value) {
    error.value = '浏览器不支持录音功能'
  }
}

// Permission handling
const requestPermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach(track => track.stop())
    needsPermission.value = false
    error.value = null
  } catch (err) {
    needsPermission.value = true
    error.value = '麦克风权限被拒绝'
    emit('permission-denied')
  }
}

// Recording controls
const toggleRecording = async () => {
  if (isRecording.value) {
    stopRecording()
  } else {
    await startRecording()
  }
}

const startRecording = async () => {
  try {
    error.value = null

    // Request microphone access
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: props.sampleRate,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true
      }
    })

    // Setup audio context for visualization
    audioContext = new AudioContext()
    analyser = audioContext.createAnalyser()
    const source = audioContext.createMediaStreamSource(stream)
    source.connect(analyser)

    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.8

    // Setup media recorder
    mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    })

    const chunks: Blob[] = []

    mediaRecorder.ondataavailable = event => {
      if (event.data.size > 0) {
        chunks.push(event.data)
      }
    }

    mediaRecorder.onstop = () => {
      audioBlob.value = new Blob(chunks, { type: 'audio/webm;codecs=opus' })
      audioUrl.value = URL.createObjectURL(audioBlob.value)

      if (props.autoSend) {
        sendRecording()
      }
    }

    // Start recording
    mediaRecorder.start(100) // Collect data every 100ms
    isRecording.value = true
    recordingTime.value = 0
    audioData.value = []

    // Start timer
    recordingInterval = window.setInterval(() => {
      recordingTime.value += 0.1
    }, 100)

    // Start visualization
    startVisualization()

    emit('recording-start')
  } catch (err) {
    console.error('Recording failed:', err)
    error.value = '录音启动失败'
    needsPermission.value = true
  }
}

const stopRecording = () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }

  cleanup()
  isRecording.value = false
  isPaused.value = false

  emit('recording-stop')
}

const togglePause = () => {
  if (!mediaRecorder) return

  if (mediaRecorder.state === 'recording') {
    mediaRecorder.pause()
    isPaused.value = true
  } else if (mediaRecorder.state === 'paused') {
    mediaRecorder.resume()
    isPaused.value = false
  }
}

const clearRecording = () => {
  audioData.value = []
  audioBlob.value = null
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value)
    audioUrl.value = null
  }
  recordingTime.value = 0
  clearCanvas()
}

const cancelRecording = () => {
  clearRecording()
  emit('recording-cancel')
}

const sendRecording = () => {
  if (audioBlob.value) {
    emit('audio-recorded', audioBlob.value, recordingTime.value)
    clearRecording()
  }
}

// Visualization
const setupCanvas = () => {
  nextTick(() => {
    if (waveformCanvas.value) {
      const ctx = waveformCanvas.value.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#e5e7eb'
        ctx.fillRect(0, 0, canvasWidth, canvasHeight)
      }
    }
  })
}

const startVisualization = () => {
  if (!analyser || !waveformCanvas.value) return

  const canvas = waveformCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)

  const draw = () => {
    if (!isRecording.value) return

    animationFrame = requestAnimationFrame(draw)

    analyser!.getByteFrequencyData(dataArray)

    // Calculate current volume
    const sum = dataArray.reduce((a, b) => a + b, 0)
    currentVolume.value = (sum / bufferLength / 255) * 100

    // Draw waveform
    ctx.fillStyle = '#f3f4f6'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    const barWidth = (canvasWidth / bufferLength) * 2.5
    let barHeight
    let x = 0

    for (let i = 0; i < bufferLength; i++) {
      barHeight = (dataArray[i] / 255) * canvasHeight * 0.8

      const hue = (i / bufferLength) * 360
      ctx.fillStyle = `hsl(${hue}, 50%, 60%)`

      ctx.fillRect(x, canvasHeight - barHeight, barWidth, barHeight)
      x += barWidth + 1
    }

    // Store data for replay
    audioData.value.push(...Array.from(dataArray))
  }

  draw()
}

const clearCanvas = () => {
  if (waveformCanvas.value) {
    const ctx = waveformCanvas.value.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#f3f4f6'
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    }
  }
}

// Audio playback
const togglePlayback = () => {
  if (!audioPlayer.value) return

  if (isPlaying.value) {
    audioPlayer.value.pause()
    isPlaying.value = false
  } else {
    audioPlayer.value.play()
    isPlaying.value = true
  }
}

const seekTo = (event: MouseEvent) => {
  if (!audioPlayer.value) return

  const rect = (event.target as HTMLElement).getBoundingClientRect()
  const percent = (event.clientX - rect.left) / rect.width
  audioPlayer.value.currentTime = percent * duration.value
}

const onTimeUpdate = () => {
  if (audioPlayer.value) {
    currentTime.value = audioPlayer.value.currentTime
  }
}

const onPlaybackEnd = () => {
  isPlaying.value = false
  currentTime.value = 0
}

const onAudioLoaded = () => {
  if (audioPlayer.value) {
    duration.value = audioPlayer.value.duration
  }
}

// Utility functions
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const cleanup = () => {
  if (recordingInterval) {
    clearInterval(recordingInterval)
    recordingInterval = null
  }

  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
  }

  if (stream) {
    stream.getTracks().forEach(track => track.stop())
    stream = null
  }

  if (audioContext) {
    audioContext.close()
    audioContext = null
  }

  analyser = null
  mediaRecorder = null
}
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
/* Enhanced Voice Recorder with Advanced Micro-Interactions */
.voice-recorder {
  @apply bg-background border border-border rounded-lg transition-all duration-300;
  position: relative;
  overflow: hidden;
}

.voice-recorder::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.1), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.voice-recorder.recording::before {
  opacity: 1;
  animation: recordingGlow 2s ease-in-out infinite;
}

@keyframes recordingGlow {
  0%,
  100% {
    background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.1), transparent);
  }
  50% {
    background: linear-gradient(
      135deg,
      rgba(var(--primary-rgb), 0.2),
      rgba(var(--primary-rgb), 0.05)
    );
  }
}

.voice-recorder.compact {
  @apply p-2;
}

.voice-recorder.expanded {
  @apply p-4 min-w-[320px];
  backdrop-filter: blur(10px);
}

.voice-recorder.error {
  @apply border-destructive/50 bg-destructive/5;
  animation: errorPulse 1s ease-in-out;
}

@keyframes errorPulse {
  0%,
  100% {
    border-color: rgba(239, 68, 68, 0.5);
  }
  50% {
    border-color: rgba(239, 68, 68, 0.8);
  }
}

/* Enhanced Compact Mode with Breathing Animation */
.compact-recorder {
  @apply flex items-center gap-2;
}

.record-button {
  @apply p-2 rounded-full transition-all duration-300 flex items-center justify-center relative overflow-hidden;
  @apply bg-primary hover:bg-primary/90 text-primary-foreground;
  position: relative;
}

.record-button::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.record-button:hover::before {
  opacity: 1;
}

.record-button.recording {
  @apply bg-red-500 hover:bg-red-600;
  animation: recordingBreath 2s ease-in-out infinite;
}

@keyframes recordingBreath {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(239, 68, 68, 0.1);
  }
}

.breathing-ring {
  position: absolute;
  inset: -4px;
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 50%;
  pointer-events: none;
}

.ring-1 {
  animation: breathingRing 2s ease-in-out infinite;
}

.ring-2 {
  animation: breathingRing 2s ease-in-out infinite 0.5s;
}

.ring-3 {
  animation: breathingRing 2s ease-in-out infinite 1s;
}

@keyframes breathingRing {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.2;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.record-button.disabled {
  @apply bg-muted text-muted-foreground cursor-not-allowed;
}

.button-content {
  position: relative;
  z-index: 2;
}

.animate-recording-pulse {
  animation: recordingPulse 1s ease-in-out infinite;
}

@keyframes recordingPulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

/* Enhanced Recording Indicator with Sophisticated Animation */
.recording-indicator {
  @apply flex items-center gap-2;
}

.recording-dot-container {
  position: relative;
  width: 8px;
  height: 8px;
}

.recording-dot {
  @apply w-2 h-2 bg-red-500 rounded-full absolute top-0 left-0;
}

.recording-dot-shadow {
  @apply w-2 h-2 bg-red-500/30 rounded-full absolute top-0 left-0;
  animation: recordingDotGlow 1.5s ease-in-out infinite;
}

@keyframes recordingDotGlow {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.3;
  }
  50% {
    transform: scale(2);
    opacity: 0;
  }
}

.animate-recording-dot {
  animation: recordingDot 1s ease-in-out infinite;
}

@keyframes recordingDot {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.3;
    transform: scale(1.2);
  }
}

.recording-time {
  @apply font-mono text-muted-foreground;
}

.animate-time-tick {
  animation: timeTick 1s ease-in-out infinite;
}

@keyframes timeTick {
  0%,
  98%,
  100% {
    opacity: 1;
  }
  99% {
    opacity: 0.7;
  }
}

.expand-button {
  @apply p-1 rounded hover:bg-muted transition-all duration-200 text-muted-foreground;
}

.hover-lift {
  transition: all 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-1px) scale(1.05);
}

/* Enhanced Expanded Mode with Glass Morphism */
.expanded-recorder {
  @apply space-y-4;
  backdrop-filter: blur(10px);
  background: rgba(var(--background), 0.95);
}

.animate-expand {
  animation: expandMode 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes expandMode {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.recorder-header {
  @apply flex items-center justify-between;
}

.recorder-title {
  @apply flex items-center gap-2;
}

.title-icon-container {
  position: relative;
}

.icon-glow {
  position: absolute;
  inset: -2px;
  background: radial-gradient(circle, rgba(var(--primary-rgb), 0.3) 0%, transparent 70%);
  border-radius: 50%;
  animation: iconGlow 2s ease-in-out infinite;
}

@keyframes iconGlow {
  0%,
  100% {
    opacity: 0;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

.animate-mic-glow {
  animation: micGlow 2s ease-in-out infinite;
}

@keyframes micGlow {
  0%,
  100% {
    color: rgb(var(--primary-rgb));
  }
  50% {
    color: rgba(var(--primary-rgb), 0.7);
    text-shadow: 0 0 8px rgba(var(--primary-rgb), 0.4);
  }
}

.collapse-button {
  @apply p-1 rounded hover:bg-muted transition-all duration-200 text-muted-foreground;
}

/* Enhanced Waveform with 3D Effect */
.waveform-container {
  @apply relative bg-muted/20 rounded-lg p-2 h-20 flex items-center justify-center;
  background: linear-gradient(135deg, rgba(var(--muted), 0.2), rgba(var(--muted), 0.1));
  border: 1px solid rgba(var(--border), 0.5);
  backdrop-filter: blur(8px);
}

.waveform-canvas {
  @apply rounded;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.waveform-placeholder {
  @apply absolute inset-0 flex items-center justify-center;
}

.placeholder-content {
  @apply flex flex-col items-center gap-2;
}

.placeholder-waves {
  @apply flex items-end gap-1;
}

.wave-line {
  width: 3px;
  background: linear-gradient(
    to top,
    rgba(var(--muted-foreground), 0.3),
    rgba(var(--muted-foreground), 0.1)
  );
  border-radius: 2px;
  animation: placeholderWave 2s ease-in-out infinite;
}

.wave-line:nth-child(1) {
  height: 8px;
}
.wave-line:nth-child(2) {
  height: 16px;
}
.wave-line:nth-child(3) {
  height: 12px;
}
.wave-line:nth-child(4) {
  height: 20px;
}
.wave-line:nth-child(5) {
  height: 24px;
}
.wave-line:nth-child(6) {
  height: 18px;
}
.wave-line:nth-child(7) {
  height: 14px;
}
.wave-line:nth-child(8) {
  height: 22px;
}
.wave-line:nth-child(9) {
  height: 16px;
}
.wave-line:nth-child(10) {
  height: 10px;
}
.wave-line:nth-child(11) {
  height: 18px;
}
.wave-line:nth-child(12) {
  height: 12px;
}

@keyframes placeholderWave {
  0%,
  100% {
    opacity: 0.3;
    transform: scaleY(0.5);
  }
  50% {
    opacity: 0.8;
    transform: scaleY(1);
  }
}

.waveform-overlay {
  @apply absolute inset-0 pointer-events-none;
}

.recording-shimmer {
  @apply absolute inset-0 opacity-20;
  background: linear-gradient(90deg, transparent, rgba(var(--primary-rgb), 0.3), transparent);
  animation: recordingShimmer 2s linear infinite;
}

@keyframes recordingShimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* Enhanced Controls with Advanced Interactions */
.recording-controls {
  @apply space-y-3;
}

.time-display {
  @apply text-center;
}

.animate-time-glow {
  animation: timeGlow 2s ease-in-out infinite;
}

@keyframes timeGlow {
  0%,
  100% {
    color: inherit;
    text-shadow: none;
  }
  50% {
    color: rgb(var(--primary-rgb));
    text-shadow: 0 0 8px rgba(var(--primary-rgb), 0.3);
  }
}

.control-buttons {
  @apply flex items-center justify-center gap-2;
}

.primary-control-button {
  @apply p-3 rounded-full transition-all duration-300 flex items-center justify-center relative overflow-hidden;
  @apply bg-primary hover:bg-primary/90 text-primary-foreground;
  position: relative;
}

.primary-control-button.recording {
  @apply bg-red-500 hover:bg-red-600;
  animation: primaryRecordingBreath 2s ease-in-out infinite;
}

@keyframes primaryRecordingBreath {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
  }
  50% {
    transform: scale(1.08);
    box-shadow: 0 0 0 12px rgba(239, 68, 68, 0.1);
  }
}

.button-inner {
  position: relative;
  z-index: 2;
}

.primary-ring-1 {
  animation: primaryBreathingRing 2s ease-in-out infinite;
}

.primary-ring-2 {
  animation: primaryBreathingRing 2s ease-in-out infinite 0.7s;
}

@keyframes primaryBreathingRing {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.3;
  }
  100% {
    transform: scale(1.8);
    opacity: 0;
  }
}

.animate-stop-pulse {
  animation: stopPulse 1s ease-in-out infinite;
}

@keyframes stopPulse {
  0%,
  100% {
    transform: scale(1) rotate(0deg);
  }
  50% {
    transform: scale(1.1) rotate(45deg);
  }
}

.control-button {
  @apply p-2 rounded-full border border-border hover:bg-muted transition-all duration-200;
  position: relative;
  overflow: hidden;
}

.control-button::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(var(--primary-rgb), 0.1) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.control-button:hover::before {
  opacity: 1;
}

.control-button.danger {
  @apply border-destructive/50 text-destructive hover:bg-destructive/10;
}

.hover-scale {
  transition: all 0.2s ease;
}

.hover-scale:hover {
  transform: scale(1.1);
}

.hover-scale:active {
  transform: scale(0.95);
}

.animate-play-pulse {
  animation: playPulse 1s ease-in-out infinite;
}

@keyframes playPulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

.animate-trash-wiggle {
  animation: trashWiggle 0.5s ease-in-out;
}

@keyframes trashWiggle {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-5deg);
  }
  75% {
    transform: rotate(5deg);
  }
}

/* Enhanced Action Buttons with Smooth Animations */
.action-buttons {
  @apply flex gap-2 justify-center;
}

.cancel-button {
  @apply px-4 py-2 rounded-md border border-border hover:bg-muted transition-all duration-200;
  position: relative;
  overflow: hidden;
}

.send-button {
  @apply px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200;
  @apply flex items-center gap-2;
  position: relative;
  overflow: hidden;
}

.send-button::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transform: translateX(-100%);
  transition: transform 0.5s ease;
}

.send-button:hover::before {
  transform: translateX(100%);
}

.animate-send-fly {
  animation: sendFly 0.3s ease-out;
}

@keyframes sendFly {
  0% {
    transform: translate(0, 0) rotate(0deg);
  }
  50% {
    transform: translate(5px, -5px) rotate(15deg);
  }
  100% {
    transform: translate(0, 0) rotate(0deg);
  }
}

/* Audio Playback */
.audio-playback {
  @apply space-y-2;
}

.playback-controls {
  @apply flex items-center gap-3;
}

.play-button {
  @apply p-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors;
}

.playback-progress {
  @apply flex-1 space-y-1;
}

.progress-track {
  @apply h-2 bg-muted rounded-full cursor-pointer relative overflow-hidden;
}

.progress-fill {
  @apply h-full bg-primary transition-all duration-150;
}

.playback-time {
  @apply font-mono text-muted-foreground;
}

/* Enhanced Volume Indicator with 3D Bars */
.volume-indicator {
  @apply flex items-center gap-2 relative;
}

.volume-bars {
  @apply flex gap-1 relative;
}

.volume-bar {
  @apply w-1 h-4 bg-muted rounded-full transition-all duration-200;
  position: relative;
  transform-origin: bottom;
}

.volume-bar::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, transparent, rgba(255, 255, 255, 0.3));
  border-radius: inherit;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.volume-bar.active {
  @apply bg-green-500;
  animation: volumeActive 0.3s ease-out;
}

.volume-bar.active::before {
  opacity: 1;
}

.volume-bar.peak {
  @apply bg-red-500;
  animation: volumePeak 0.5s ease-in-out infinite;
}

@keyframes volumeActive {
  0% {
    transform: scaleY(0.5);
  }
  50% {
    transform: scaleY(1.2);
  }
  100% {
    transform: scaleY(1);
  }
}

@keyframes volumePeak {
  0%,
  100% {
    transform: scaleY(1);
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
  }
  50% {
    transform: scaleY(1.1);
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
  }
}

.volume-indicator-glow {
  position: absolute;
  right: -10px;
  top: 0;
  bottom: 0;
  width: 20px;
  background: radial-gradient(ellipse, rgba(var(--primary-rgb), 0.3) 0%, transparent 70%);
  border-radius: 50%;
  transition: opacity 0.3s ease;
}

/* Enhanced States with Gentle Animations */
.error-message {
  @apply flex items-center gap-2 text-destructive text-sm p-2 bg-destructive/10 rounded;
}

.animate-error-bounce {
  animation: errorBounce 0.5s ease-out;
}

@keyframes errorBounce {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-3px);
  }
  75% {
    transform: translateX(3px);
  }
}

.animate-error-icon {
  animation: errorIcon 1s ease-in-out infinite;
}

@keyframes errorIcon {
  0%,
  100% {
    transform: rotate(0deg) scale(1);
  }
  50% {
    transform: rotate(10deg) scale(1.1);
  }
}

.permission-request {
  @apply flex items-center gap-2 text-sm p-2;
}

.animate-permission-slide {
  animation: permissionSlide 0.5s ease-out;
}

@keyframes permissionSlide {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.permission-icon-container {
  position: relative;
}

.permission-pulse {
  position: absolute;
  inset: -4px;
  border: 2px solid rgba(var(--muted-foreground), 0.3);
  border-radius: 50%;
  animation: permissionPulse 2s ease-in-out infinite;
}

@keyframes permissionPulse {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.2;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.animate-mic-request {
  animation: micRequest 2s ease-in-out infinite;
}

@keyframes micRequest {
  0%,
  100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

.permission-button {
  @apply px-3 py-1 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90 transition-all duration-200;
  position: relative;
  overflow: hidden;
}

.button-text {
  position: relative;
  z-index: 2;
}

.button-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transform: translateX(-100%);
  transition: transform 0.5s ease;
}

.permission-button:hover .button-shimmer {
  transform: translateX(100%);
}

/* Enhanced Animation Utilities */
.animate-slide-in-right {
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-slide-in-down {
  animation: slideInDown 0.4s ease-out;
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-in-up {
  animation: slideInUp 0.4s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-in-left {
  animation: slideInLeft 0.4s ease-out;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-text-appear {
  animation: textAppear 0.5s ease-out;
}

@keyframes textAppear {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-delayed {
  animation: fadeInDelayed 0.5s ease-out 0.2s both;
}

@keyframes fadeInDelayed {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 640px) {
  .voice-recorder.expanded {
    @apply min-w-full;
  }

  .waveform-container {
    @apply h-16;
  }
}


/* 无障碍支持 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
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
