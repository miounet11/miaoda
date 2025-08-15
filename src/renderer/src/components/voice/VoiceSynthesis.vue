<template>
  <div class="voice-synthesis" :class="synthesisClasses">
    <!-- Synthesis Controls -->
    <div class="synthesis-controls">
      <button
        @click="toggleSynthesis"
        class="synthesis-btn"
        :class="synthesisButtonClasses"
        :disabled="!isSupported || !text.trim()"
        :title="synthesisButtonTitle"
      >
        <component :is="synthesisIcon" :size="20" />
        <span class="synthesis-pulse" v-if="isSynthesizing" />
      </button>
      
      <div class="synthesis-info">
        <div v-if="isSynthesizing" class="synthesis-status">
          <div class="status-indicator">
            <div class="pulse-dot" />
            <span class="status-text">{{ $t('voice.synthesizing') }}</span>
          </div>
          
          <div class="synthesis-progress">
            <div class="progress-text">{{ synthesisProgress }}%</div>
          </div>
        </div>
        
        <div v-else-if="text.trim()" class="text-preview">
          <span class="preview-text" :title="text">{{ textPreview }}</span>
          <span class="text-length">{{ text.length }} {{ $t('voice.characters') }}</span>
        </div>
        
        <div v-else class="synthesis-hint">
          {{ $t('voice.enterTextToSynthesize') }}
        </div>
      </div>
      
      <!-- Additional Controls -->
      <div class="additional-controls">
        <button
          v-if="isSynthesizing"
          @click="pauseSynthesis"
          class="control-btn pause-btn"
          :title="isPaused ? $t('voice.resume') : $t('voice.pause')"
        >
          <component :is="isPaused ? Play : Pause" :size="16" />
        </button>
        
        <button
          @click="stopSynthesis"
          class="control-btn stop-btn"
          :disabled="!isSynthesizing"
          :title="$t('voice.stop')"
        >
          <Square :size="16" />
        </button>
        
        <button
          @click="showVoiceSelector"
          class="control-btn voice-btn"
          :title="$t('voice.selectVoice')"
        >
          <User :size="16" />
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
    
    <!-- Text Input -->
    <div class="text-input-section">
      <div class="input-header">
        <label for="synthesis-text" class="input-label">
          {{ $t('voice.textToSynthesize') }}
        </label>
        
        <div class="input-actions">
          <button
            @click="clearText"
            class="action-btn"
            :disabled="!text.trim()"
            :title="$t('common.clear')"
          >
            <X :size="14" />
          </button>
          
          <button
            @click="pasteFromClipboard"
            class="action-btn"
            :title="$t('common.paste')"
          >
            <Clipboard :size="14" />
          </button>
        </div>
      </div>
      
      <textarea
        id="synthesis-text"
        v-model="text"
        class="text-input"
        :placeholder="$t('voice.textPlaceholder')"
        :maxlength="maxTextLength"
        rows="4"
        @input="onTextInput"
      />
      
      <div class="input-footer">
        <div class="character-count">
          {{ text.length }} / {{ maxTextLength }}
        </div>
        
        <div class="estimated-duration" v-if="text.trim()">
          {{ $t('voice.estimatedDuration') }}: {{ estimatedDuration }}
        </div>
      </div>
    </div>
    
    <!-- Voice Parameters -->
    <div class="voice-parameters" v-if="showParameters">
      <div class="parameters-header">
        <h4>{{ $t('voice.parameters') }}</h4>
        <button @click="resetParameters" class="reset-btn">
          <RotateCcw :size="14" />
          {{ $t('common.reset') }}
        </button>
      </div>
      
      <div class="parameters-grid">
        <!-- Rate -->
        <div class="parameter-item">
          <label class="parameter-label">
            {{ $t('voice.rate') }}
            <span class="parameter-value">{{ rate.toFixed(1) }}x</span>
          </label>
          <input
            type="range"
            v-model.number="rate"
            min="0.1"
            max="3.0"
            step="0.1"
            class="parameter-slider"
          >
        </div>
        
        <!-- Pitch -->
        <div class="parameter-item">
          <label class="parameter-label">
            {{ $t('voice.pitch') }}
            <span class="parameter-value">{{ pitch.toFixed(1) }}</span>
          </label>
          <input
            type="range"
            v-model.number="pitch"
            min="0.1"
            max="2.0"
            step="0.1"
            class="parameter-slider"
          >
        </div>
        
        <!-- Volume -->
        <div class="parameter-item">
          <label class="parameter-label">
            {{ $t('voice.volume') }}
            <span class="parameter-value">{{ Math.round(volume * 100) }}%</span>
          </label>
          <input
            type="range"
            v-model.number="volume"
            min="0"
            max="1"
            step="0.1"
            class="parameter-slider"
          >
        </div>
      </div>
    </div>
    
    <!-- Voice Selector -->
    <div class="voice-selector" v-if="showVoices && availableVoices.length > 0">
      <div class="selector-header">
        <h4>{{ $t('voice.selectVoice') }}</h4>
        <div class="voice-filters">
          <select v-model="languageFilter" class="language-filter">
            <option value="">{{ $t('voice.allLanguages') }}</option>
            <option v-for="lang in availableLanguages" :key="lang" :value="lang">
              {{ getLanguageName(lang) }}
            </option>
          </select>
        </div>
      </div>
      
      <div class="voices-grid">
        <div
          v-for="voice in filteredVoices"
          :key="voice.name"
          class="voice-item"
          :class="{ 'selected': selectedVoice?.name === voice.name }"
          @click="selectVoice(voice)"
        >
          <div class="voice-info">
            <div class="voice-name">{{ voice.name }}</div>
            <div class="voice-lang">{{ voice.lang }}</div>
            <div class="voice-details">
              <span v-if="voice.default" class="voice-badge default">Default</span>
              <span v-if="voice.localService" class="voice-badge local">Local</span>
              <span class="voice-badge gender">{{ getVoiceGender(voice) }}</span>
            </div>
          </div>
          
          <div class="voice-actions">
            <button
              @click.stop="testVoice(voice)"
              class="test-btn"
              :disabled="isSynthesizing"
              :title="$t('voice.testVoice')"
            >
              <Play :size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Synthesis History -->
    <div class="synthesis-history" v-if="showHistory && synthesisHistory.length > 0">
      <div class="history-header">
        <h4>{{ $t('voice.recentSynthesis') }}</h4>
        <button @click="clearHistory" class="clear-btn">
          <Trash2 :size="14" />
        </button>
      </div>
      
      <div class="history-list">
        <div
          v-for="(item, index) in synthesisHistory"
          :key="index"
          class="history-item"
        >
          <div class="history-content">
            <div class="history-text">{{ truncateText(item.text, 100) }}</div>
            <div class="history-meta">
              <span class="history-voice">{{ item.voice?.name || 'Default' }}</span>
              <span class="history-time">{{ formatTime(item.timestamp) }}</span>
            </div>
          </div>
          
          <div class="history-actions">
            <button
              @click="replaySynthesis(item)"
              class="action-btn replay-btn"
              :title="$t('voice.replay')"
            >
              <Play :size="12" />
            </button>
            
            <button
              @click="loadHistoryItem(item)"
              class="action-btn load-btn"
              :title="$t('voice.loadText')"
            >
              <Download :size="12" />
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
    
    <!-- Settings Modal -->
    <VoiceSettings
      v-if="showSettingsModal"
      @close="showSettingsModal = false"
      @settings-changed="onSettingsChanged"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  Play, Pause, Square, User, Settings, X, Clipboard, RotateCcw,
  AlertCircle, Trash2, Download
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { voiceService, type VoiceSynthesisOptions } from '@renderer/src/services/voice/VoiceService'
import VoiceSettings from './VoiceSettings.vue'

// Props
interface Props {
  initialText?: string
  showParameters?: boolean
  showVoices?: boolean
  showHistory?: boolean
  maxTextLength?: number
  autoStart?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  initialText: '',
  showParameters: true,
  showVoices: true,
  showHistory: true,
  maxTextLength: 5000,
  autoStart: false
})

// Emits
const emit = defineEmits<{
  'synthesis-start': [text: string]
  'synthesis-end': [text: string]
  'synthesis-error': [error: Error]
  'text-change': [text: string]
}>()

// Composables
const { t } = useI18n()

// Refs
const text = ref(props.initialText)
const isSynthesizing = ref(false)
const isPaused = ref(false)
const isSupported = ref(false)
const showSettingsModal = ref(false)
const error = ref<Error | null>(null)

// Voice parameters
const rate = ref(1.0)
const pitch = ref(1.0)
const volume = ref(1.0)
const selectedVoice = ref<SpeechSynthesisVoice | null>(null)

// Voice selection
const availableVoices = ref<SpeechSynthesisVoice[]>([])
const languageFilter = ref('')

// Synthesis state
const synthesisProgress = ref(0)
const synthesisHistory = ref<Array<{
  text: string
  voice: SpeechSynthesisVoice | null
  timestamp: Date
  parameters: VoiceSynthesisOptions
}>>([])

// Computed properties
const synthesisClasses = computed(() => ({
  'synthesizing': isSynthesizing.value,
  'paused': isPaused.value,
  'has-error': error.value !== null
}))

const synthesisButtonClasses = computed(() => ({
  'synthesizing': isSynthesizing.value,
  'disabled': !isSupported.value || !text.value.trim()
}))

const synthesisIcon = computed(() => {
  if (isSynthesizing.value) {
    return isPaused.value ? Play : Pause
  }
  return Play
})

const synthesisButtonTitle = computed(() => {
  if (!isSupported.value) return t('voice.notSupported')
  if (!text.value.trim()) return t('voice.noTextToSynthesize')
  if (isSynthesizing.value) {
    return isPaused.value ? t('voice.resume') : t('voice.pause')
  }
  return t('voice.startSynthesis')
})

const textPreview = computed(() => {
  const maxLength = 50
  if (text.value.length <= maxLength) return text.value
  return text.value.slice(0, maxLength) + '...'
})

const estimatedDuration = computed(() => {
  if (!text.value.trim()) return '0s'
  
  // Rough estimation: ~3-5 characters per second at normal rate
  const charsPerSecond = 4 / rate.value
  const duration = text.value.length / charsPerSecond
  
  if (duration < 60) {
    return `${Math.round(duration)}s`
  } else {
    const minutes = Math.floor(duration / 60)
    const seconds = Math.round(duration % 60)
    return `${minutes}m ${seconds}s`
  }
})

const availableLanguages = computed(() => {
  const languages = new Set(availableVoices.value.map(voice => voice.lang))
  return Array.from(languages).sort()
})

const filteredVoices = computed(() => {
  if (!languageFilter.value) return availableVoices.value
  
  return availableVoices.value.filter(voice => 
    voice.lang.startsWith(languageFilter.value)
  )
})

const errorMessage = computed(() => {
  if (!error.value) return ''
  return error.value.message || t('voice.unknownError')
})

// Methods
const toggleSynthesis = async () => {
  if (isSynthesizing.value) {
    if (isPaused.value) {
      resumeSynthesis()
    } else {
      pauseSynthesis()
    }
  } else {
    await startSynthesis()
  }
}

const startSynthesis = async () => {
  if (!text.value.trim()) return
  
  try {
    error.value = null
    
    const options: Partial<VoiceSynthesisOptions> = {
      voice: selectedVoice.value || undefined,
      rate: rate.value,
      pitch: pitch.value,
      volume: volume.value,
      language: selectedVoice.value?.lang || 'zh-CN'
    }
    
    const success = await voiceService.synthesizeSpeech(text.value, options)
    
    if (success) {
      // Add to history
      synthesisHistory.value.unshift({
        text: text.value,
        voice: selectedVoice.value,
        timestamp: new Date(),
        parameters: options as VoiceSynthesisOptions
      })
      
      // Limit history size
      if (synthesisHistory.value.length > 20) {
        synthesisHistory.value = synthesisHistory.value.slice(0, 20)
      }
      
      saveHistory()
    }
  } catch (err) {
    error.value = err as Error
    emit('synthesis-error', err as Error)
  }
}

const pauseSynthesis = () => {
  const success = voiceService.pauseSynthesis()
  if (success) {
    isPaused.value = true
  }
}

const resumeSynthesis = () => {
  const success = voiceService.resumeSynthesis()
  if (success) {
    isPaused.value = false
  }
}

const stopSynthesis = () => {
  const success = voiceService.stopSynthesis()
  if (success) {
    isSynthesizing.value = false
    isPaused.value = false
    synthesisProgress.value = 0
  }
}

const clearText = () => {
  text.value = ''
  emit('text-change', '')
}

const pasteFromClipboard = async () => {
  try {
    const clipboardText = await navigator.clipboard.readText()
    if (clipboardText) {
      text.value = clipboardText.slice(0, props.maxTextLength)
      emit('text-change', text.value)
    }
  } catch (err) {
    console.error('Failed to paste from clipboard:', err)
  }
}

const onTextInput = () => {
  emit('text-change', text.value)
}

// Voice management
const loadVoices = () => {
  availableVoices.value = voiceService.getAvailableVoices()
  
  // Select default voice if none selected
  if (!selectedVoice.value && availableVoices.value.length > 0) {
    const config = voiceService.getConfig()
    const savedVoice = availableVoices.value.find(v => v.name === config.synthesis.voice)
    selectedVoice.value = savedVoice || availableVoices.value[0]
  }
}

const selectVoice = (voice: SpeechSynthesisVoice) => {
  selectedVoice.value = voice
  
  // Update voice service config
  voiceService.updateConfig({
    synthesis: {
      ...voiceService.getConfig().synthesis,
      voice: voice.name,
      language: voice.lang
    }
  })
}

const testVoice = async (voice: SpeechSynthesisVoice) => {
  const testText = t('voice.testPhrase')
  
  try {
    await voiceService.synthesizeSpeech(testText, {
      voice,
      rate: rate.value,
      pitch: pitch.value,
      volume: volume.value,
      language: voice.lang
    })
  } catch (err) {
    console.error('Failed to test voice:', err)
  }
}

const getVoiceGender = (voice: SpeechSynthesisVoice): string => {
  const name = voice.name.toLowerCase()
  if (name.includes('female') || name.includes('woman')) return 'Female'
  if (name.includes('male') || name.includes('man')) return 'Male'
  return 'Unknown'
}

const getLanguageName = (langCode: string): string => {
  try {
    return new Intl.DisplayNames([langCode], { type: 'language' }).of(langCode) || langCode
  } catch {
    return langCode
  }
}

// Parameter management
const resetParameters = () => {
  rate.value = 1.0
  pitch.value = 1.0
  volume.value = 1.0
}

// History management
const loadHistory = () => {
  try {
    const saved = localStorage.getItem('miaoda-voice-synthesis-history')
    if (saved) {
      const history = JSON.parse(saved)
      synthesisHistory.value = history.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }))
    }
  } catch (err) {
    console.warn('Failed to load synthesis history:', err)
  }
}

const saveHistory = () => {
  try {
    localStorage.setItem('miaoda-voice-synthesis-history', JSON.stringify(synthesisHistory.value))
  } catch (err) {
    console.warn('Failed to save synthesis history:', err)
  }
}

const clearHistory = () => {
  synthesisHistory.value = []
  saveHistory()
}

const replaySynthesis = async (item: typeof synthesisHistory.value[0]) => {
  try {
    await voiceService.synthesizeSpeech(item.text, item.parameters)
  } catch (err) {
    error.value = err as Error
  }
}

const loadHistoryItem = (item: typeof synthesisHistory.value[0]) => {
  text.value = item.text
  
  if (item.voice) {
    selectedVoice.value = item.voice
  }
  
  if (item.parameters) {
    rate.value = item.parameters.rate
    pitch.value = item.parameters.pitch
    volume.value = item.parameters.volume
  }
  
  emit('text-change', text.value)
}

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

const formatTime = (date: Date): string => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) {
    return t('time.justNow')
  } else if (diff < 3600000) {
    return t('time.minutesAgo', { minutes: Math.floor(diff / 60000) })
  } else if (diff < 86400000) {
    return t('time.hoursAgo', { hours: Math.floor(diff / 3600000) })
  } else {
    return date.toLocaleDateString()
  }
}

// Settings
const showVoiceSelector = () => {
  // Toggle voice selector visibility or scroll to it
}

const showSettings = () => {
  showSettingsModal.value = true
}

const onSettingsChanged = () => {
  // Reload configuration
  const config = voiceService.getConfig()
  rate.value = config.synthesis.rate
  pitch.value = config.synthesis.pitch
  volume.value = config.synthesis.volume
  
  loadVoices()
}

const dismissError = () => {
  error.value = null
}

// Voice service event handlers
const onSynthesisStart = (text: string) => {
  isSynthesizing.value = true
  isPaused.value = false
  synthesisProgress.value = 0
  emit('synthesis-start', text)
}

const onSynthesisEnd = (text: string) => {
  isSynthesizing.value = false
  isPaused.value = false
  synthesisProgress.value = 100
  emit('synthesis-end', text)
  
  setTimeout(() => {
    synthesisProgress.value = 0
  }, 2000)
}

const onSynthesisError = (err: Error) => {
  error.value = err
  emit('synthesis-error', err)
  
  isSynthesizing.value = false
  isPaused.value = false
  synthesisProgress.value = 0
}

// Lifecycle
onMounted(() => {
  // Check support
  isSupported.value = voiceService.isSynthesisSupported()
  
  // Load voices
  loadVoices()
  
  // Load configuration
  const config = voiceService.getConfig()
  rate.value = config.synthesis.rate
  pitch.value = config.synthesis.pitch
  volume.value = config.synthesis.volume
  
  // Load history
  loadHistory()
  
  // Setup event listeners
  voiceService.on('synthesis-start', onSynthesisStart)
  voiceService.on('synthesis-end', onSynthesisEnd)
  voiceService.on('synthesis-error', onSynthesisError)
  
  // Auto-start if requested
  if (props.autoStart && text.value.trim() && isSupported.value) {
    startSynthesis()
  }
})

onUnmounted(() => {
  // Clean up
  stopSynthesis()
  
  // Remove event listeners
  voiceService.off('synthesis-start', onSynthesisStart)
  voiceService.off('synthesis-end', onSynthesisEnd)
  voiceService.off('synthesis-error', onSynthesisError)
})

// Watch for parameter changes
watch([rate, pitch, volume], () => {
  voiceService.updateConfig({
    synthesis: {
      ...voiceService.getConfig().synthesis,
      rate: rate.value,
      pitch: pitch.value,
      volume: volume.value
    }
  })
})

// Watch for text changes
watch(() => props.initialText, (newText) => {
  if (newText !== text.value) {
    text.value = newText
  }
})
</script>

<style scoped>
.voice-synthesis {
  @apply bg-background border border-border rounded-lg p-4 space-y-4;
  contain: layout style paint;
}

.synthesizing {
  @apply bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800;
}

.has-error {
  @apply bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800;
}

.synthesis-controls {
  @apply flex items-center gap-4;
}

.synthesis-btn {
  @apply relative flex items-center justify-center w-12 h-12 bg-green-500 text-white rounded-full hover:bg-green-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed;
}

.synthesis-btn.synthesizing {
  @apply bg-blue-500 hover:bg-blue-600 animate-pulse;
}

.synthesis-pulse {
  @apply absolute inset-0 bg-blue-500/30 rounded-full animate-ping;
}

.synthesis-info {
  @apply flex-1 min-w-0;
}

.synthesis-status {
  @apply flex items-center justify-between;
}

.status-indicator {
  @apply flex items-center gap-2;
}

.pulse-dot {
  @apply w-2 h-2 bg-blue-500 rounded-full animate-pulse;
}

.status-text {
  @apply text-sm font-medium text-blue-600 dark:text-blue-400;
}

.synthesis-progress {
  @apply text-sm font-mono text-muted-foreground;
}

.progress-text {
  @apply text-xs font-mono;
}

.text-preview {
  @apply flex items-center gap-2;
}

.preview-text {
  @apply flex-1 text-sm truncate;
}

.text-length {
  @apply text-xs text-muted-foreground;
}

.synthesis-hint {
  @apply text-sm text-muted-foreground;
}

.additional-controls {
  @apply flex items-center gap-1;
}

.control-btn {
  @apply p-2 rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

.text-input-section {
  @apply space-y-2;
}

.input-header {
  @apply flex items-center justify-between;
}

.input-label {
  @apply text-sm font-medium;
}

.input-actions {
  @apply flex items-center gap-1;
}

.action-btn {
  @apply p-1.5 rounded hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

.text-input {
  @apply w-full p-3 border border-border rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent;
}

.input-footer {
  @apply flex items-center justify-between text-xs text-muted-foreground;
}

.character-count {
  @apply font-mono;
}

.estimated-duration {
  @apply font-medium;
}

.voice-parameters {
  @apply bg-muted/30 rounded-lg p-4 space-y-4;
}

.parameters-header {
  @apply flex items-center justify-between;
}

.parameters-header h4 {
  @apply text-sm font-medium;
}

.reset-btn {
  @apply flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors;
}

.parameters-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-4;
}

.parameter-item {
  @apply space-y-2;
}

.parameter-label {
  @apply flex items-center justify-between text-xs font-medium;
}

.parameter-value {
  @apply font-mono text-muted-foreground;
}

.parameter-slider {
  @apply w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer;
}

.parameter-slider::-webkit-slider-thumb {
  @apply appearance-none w-4 h-4 bg-primary rounded-full cursor-pointer;
}

.parameter-slider::-moz-range-thumb {
  @apply w-4 h-4 bg-primary rounded-full cursor-pointer border-0;
}

.voice-selector {
  @apply bg-muted/30 rounded-lg p-4 space-y-4;
}

.selector-header {
  @apply flex items-center justify-between;
}

.selector-header h4 {
  @apply text-sm font-medium;
}

.voice-filters {
  @apply flex items-center gap-2;
}

.language-filter {
  @apply px-2 py-1 text-xs border border-border rounded;
}

.voices-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto;
}

.voice-item {
  @apply flex items-center justify-between p-3 border border-border rounded-lg cursor-pointer hover:bg-accent transition-colors;
}

.voice-item.selected {
  @apply border-primary bg-primary/10;
}

.voice-info {
  @apply flex-1 min-w-0;
}

.voice-name {
  @apply text-sm font-medium truncate;
}

.voice-lang {
  @apply text-xs text-muted-foreground;
}

.voice-details {
  @apply flex items-center gap-1 mt-1;
}

.voice-badge {
  @apply px-1.5 py-0.5 text-xs rounded-full;
}

.voice-badge.default {
  @apply bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300;
}

.voice-badge.local {
  @apply bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300;
}

.voice-badge.gender {
  @apply bg-muted text-muted-foreground;
}

.voice-actions {
  @apply flex items-center gap-1;
}

.test-btn {
  @apply p-1.5 rounded hover:bg-accent transition-colors disabled:opacity-50;
}

.synthesis-history {
  @apply bg-muted/30 rounded-lg p-4 space-y-4;
}

.history-header {
  @apply flex items-center justify-between;
}

.history-header h4 {
  @apply text-sm font-medium;
}

.clear-btn {
  @apply p-1 rounded hover:bg-muted transition-colors;
}

.history-list {
  @apply space-y-2 max-h-40 overflow-y-auto;
}

.history-item {
  @apply flex items-start justify-between p-2 bg-background border border-border rounded;
}

.history-content {
  @apply flex-1 min-w-0;
}

.history-text {
  @apply text-xs truncate;
}

.history-meta {
  @apply flex items-center gap-2 mt-1 text-xs text-muted-foreground;
}

.history-actions {
  @apply flex items-center gap-1;
}

.replay-btn {
  @apply text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900;
}

.load-btn {
  @apply text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900;
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

/* Animations */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes ping {
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .synthesis-btn.synthesizing {
    animation: none;
  }
  
  .synthesis-pulse {
    animation: none;
  }
  
  .pulse-dot {
    animation: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .voice-synthesis {
    @apply border-2;
  }
  
  .synthesis-btn:focus {
    @apply ring-2 ring-primary;
  }
}
</style>