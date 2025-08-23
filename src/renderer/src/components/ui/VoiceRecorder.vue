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
      >
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
      >
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
        <button @click="isExpanded = false" class="collapse-button hover-lift" title="收起">
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
          >
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
          >
            <Pause v-if="!isPaused" :size="16" class="transition-all duration-200" />
            <Play v-else :size="16" class="animate-play-pulse" />
          </button>

          <!-- Enhanced Clear Button -->
          <button
            v-if="audioData.length > 0 && !isRecording"
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
          <button @click="cancelRecording" class="cancel-button hover-lift">
            <span class="transition-all duration-200">取消</span>
          </button>
          <button @click="sendRecording" class="send-button hover-lift">
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
          <button @click="togglePlayback" class="play-button">
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
      <button @click="requestPermission" class="permission-button hover-lift">
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
</style>
