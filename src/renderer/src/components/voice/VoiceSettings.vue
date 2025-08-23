<template>
  <div class="voice-settings-overlay" @click.self="$emit('close')">
    <div class="voice-settings-modal">
      <!-- Header -->
      <div class="modal-header">
        <h2 class="modal-title">{{ $t('voice.settings') }}</h2>
        <button @click="$emit('close')" class="close-btn">
          <X :size="20" />
        </button>
      </div>

      <!-- Content -->
      <div class="modal-content">
        <!-- Recognition Settings -->
        <div class="settings-section">
          <div class="section-header">
            <Mic :size="18" />
            <h3>{{ $t('voice.recognitionSettings') }}</h3>
          </div>

          <div class="settings-grid">
            <!-- Language -->
            <div class="setting-item">
              <label class="setting-label">{{ $t('voice.language') }}</label>
              <select
                v-model="config.recognition.language"
                class="setting-select"
                @change="onConfigChange"
              >
                <option v-for="lang in supportedLanguages" :key="lang" :value="lang">
                  {{ getLanguageName(lang) }}
                </option>
              </select>
            </div>

            <!-- Continuous Mode -->
            <div class="setting-item">
              <label class="setting-label">{{ $t('voice.continuousMode') }}</label>
              <div class="setting-toggle">
                <input
                  type="checkbox"
                  v-model="config.recognition.continuous"
                  @change="onConfigChange"
                  class="toggle-input"
                />
                <span class="toggle-slider" />
              </div>
            </div>

            <!-- Interim Results -->
            <div class="setting-item">
              <label class="setting-label">{{ $t('voice.interimResults') }}</label>
              <div class="setting-toggle">
                <input
                  type="checkbox"
                  v-model="config.recognition.interimResults"
                  @change="onConfigChange"
                  class="toggle-input"
                />
                <span class="toggle-slider" />
              </div>
            </div>

            <!-- Max Alternatives -->
            <div class="setting-item">
              <label class="setting-label">
                {{ $t('voice.maxAlternatives') }}
                <span class="setting-value">{{ config.recognition.maxAlternatives }}</span>
              </label>
              <input
                type="range"
                v-model.number="config.recognition.maxAlternatives"
                min="1"
                max="10"
                step="1"
                class="setting-slider"
                @input="onConfigChange"
              />
            </div>

            <!-- Noise Suppression -->
            <div class="setting-item">
              <label class="setting-label">
                {{ $t('voice.noiseSuppression') }}
                <span class="setting-value"
                  >{{ Math.round(config.recognition.noiseSuppressionLevel * 100) }}%</span
                >
              </label>
              <input
                type="range"
                v-model.number="config.recognition.noiseSuppressionLevel"
                min="0"
                max="1"
                step="0.1"
                class="setting-slider"
                @input="onConfigChange"
              />
            </div>
          </div>
        </div>

        <!-- Synthesis Settings -->
        <div class="settings-section">
          <div class="section-header">
            <Volume2 :size="18" />
            <h3>{{ $t('voice.synthesisSettings') }}</h3>
          </div>

          <div class="settings-grid">
            <!-- Voice Selection -->
            <div class="setting-item full-width">
              <label class="setting-label">{{ $t('voice.selectedVoice') }}</label>
              <div class="voice-selector">
                <select v-model="selectedVoiceName" class="setting-select" @change="onVoiceChange">
                  <option value="">{{ $t('voice.defaultVoice') }}</option>
                  <option v-for="voice in availableVoices" :key="voice.name" :value="voice.name">
                    {{ voice.name }} ({{ voice.lang }})
                  </option>
                </select>

                <button
                  v-if="selectedVoiceName"
                  @click="testCurrentVoice"
                  class="test-voice-btn"
                  :disabled="isTestingVoice"
                >
                  <Play :size="14" />
                  {{ $t('voice.test') }}
                </button>
              </div>
            </div>

            <!-- Rate -->
            <div class="setting-item">
              <label class="setting-label">
                {{ $t('voice.rate') }}
                <span class="setting-value">{{ config.synthesis.rate.toFixed(1) }}x</span>
              </label>
              <input
                type="range"
                v-model.number="config.synthesis.rate"
                min="0.1"
                max="3.0"
                step="0.1"
                class="setting-slider"
                @input="onConfigChange"
              />
            </div>

            <!-- Pitch -->
            <div class="setting-item">
              <label class="setting-label">
                {{ $t('voice.pitch') }}
                <span class="setting-value">{{ config.synthesis.pitch.toFixed(1) }}</span>
              </label>
              <input
                type="range"
                v-model.number="config.synthesis.pitch"
                min="0.1"
                max="2.0"
                step="0.1"
                class="setting-slider"
                @input="onConfigChange"
              />
            </div>

            <!-- Volume -->
            <div class="setting-item">
              <label class="setting-label">
                {{ $t('voice.volume') }}
                <span class="setting-value">{{ Math.round(config.synthesis.volume * 100) }}%</span>
              </label>
              <input
                type="range"
                v-model.number="config.synthesis.volume"
                min="0"
                max="1"
                step="0.1"
                class="setting-slider"
                @input="onConfigChange"
              />
            </div>

            <!-- Language -->
            <div class="setting-item">
              <label class="setting-label">{{ $t('voice.synthesisLanguage') }}</label>
              <select
                v-model="config.synthesis.language"
                class="setting-select"
                @change="onConfigChange"
              >
                <option v-for="lang in supportedLanguages" :key="lang" :value="lang">
                  {{ getLanguageName(lang) }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Permission Settings -->
        <div class="settings-section">
          <div class="section-header">
            <Shield :size="18" />
            <h3>{{ $t('voice.permissions') }}</h3>
          </div>

          <div class="settings-grid">
            <!-- Microphone Permission -->
            <div class="setting-item">
              <label class="setting-label">{{ $t('voice.microphoneAccess') }}</label>
              <div class="permission-status">
                <div class="status-indicator" :class="microphoneStatusClass">
                  <component :is="microphoneStatusIcon" :size="16" />
                  <span>{{ microphoneStatusText }}</span>
                </div>

                <button
                  v-if="!config.permissions.microphone"
                  @click="requestMicrophonePermission"
                  class="permission-btn"
                  :disabled="isRequestingPermission"
                >
                  {{ $t('voice.grantAccess') }}
                </button>
              </div>
            </div>

            <!-- Auto Start -->
            <div class="setting-item">
              <label class="setting-label">{{ $t('voice.autoStartRecording') }}</label>
              <div class="setting-toggle">
                <input
                  type="checkbox"
                  v-model="config.permissions.autoStart"
                  @change="onConfigChange"
                  class="toggle-input"
                />
                <span class="toggle-slider" />
              </div>
            </div>
          </div>
        </div>

        <!-- UI Settings -->
        <div class="settings-section">
          <div class="section-header">
            <Monitor :size="18" />
            <h3>{{ $t('voice.uiSettings') }}</h3>
          </div>

          <div class="settings-grid">
            <!-- Show Waveform -->
            <div class="setting-item">
              <label class="setting-label">{{ $t('voice.showWaveform') }}</label>
              <div class="setting-toggle">
                <input
                  type="checkbox"
                  v-model="config.ui.showWaveform"
                  @change="onConfigChange"
                  class="toggle-input"
                />
                <span class="toggle-slider" />
              </div>
            </div>

            <!-- Show Confidence -->
            <div class="setting-item">
              <label class="setting-label">{{ $t('voice.showConfidence') }}</label>
              <div class="setting-toggle">
                <input
                  type="checkbox"
                  v-model="config.ui.showConfidence"
                  @change="onConfigChange"
                  class="toggle-input"
                />
                <span class="toggle-slider" />
              </div>
            </div>

            <!-- Highlight Keywords -->
            <div class="setting-item">
              <label class="setting-label">{{ $t('voice.highlightKeywords') }}</label>
              <div class="setting-toggle">
                <input
                  type="checkbox"
                  v-model="config.ui.highlightKeywords"
                  @change="onConfigChange"
                  class="toggle-input"
                />
                <span class="toggle-slider" />
              </div>
            </div>
          </div>
        </div>

        <!-- Advanced Settings -->
        <div class="settings-section">
          <div class="section-header">
            <Settings :size="18" />
            <h3>{{ $t('voice.advancedSettings') }}</h3>
          </div>

          <div class="advanced-settings">
            <!-- Voice Browser -->
            <div class="advanced-item">
              <h4>{{ $t('voice.voiceBrowser') }}</h4>
              <p class="advanced-description">{{ $t('voice.voiceBrowserDescription') }}</p>

              <div class="voice-browser">
                <div class="voice-filters">
                  <input
                    type="text"
                    v-model="voiceSearch"
                    :placeholder="$t('voice.searchVoices')"
                    class="voice-search"
                  />

                  <select v-model="voiceLanguageFilter" class="voice-language-filter">
                    <option value="">{{ $t('voice.allLanguages') }}</option>
                    <option v-for="lang in voiceLanguages" :key="lang" :value="lang">
                      {{ getLanguageName(lang) }}
                    </option>
                  </select>
                </div>

                <div class="voice-list">
                  <div
                    v-for="voice in filteredVoices"
                    :key="voice.name"
                    class="voice-item"
                    :class="{ selected: voice.name === selectedVoiceName }"
                    @click="selectVoice(voice)"
                  >
                    <div class="voice-info">
                      <div class="voice-name">{{ voice.name }}</div>
                      <div class="voice-details">
                        <span class="voice-lang">{{ voice.lang }}</span>
                        <span v-if="voice.default" class="voice-badge">Default</span>
                        <span v-if="voice.localService" class="voice-badge">Local</span>
                      </div>
                    </div>

                    <div class="voice-actions">
                      <button
                        @click.stop="testVoice(voice)"
                        class="test-btn"
                        :disabled="isTestingVoice"
                      >
                        <Play :size="12" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Export/Import Settings -->
            <div class="advanced-item">
              <h4>{{ $t('voice.settingsManagement') }}</h4>
              <p class="advanced-description">{{ $t('voice.settingsManagementDescription') }}</p>

              <div class="settings-actions">
                <button @click="exportSettings" class="action-btn export-btn">
                  <Download :size="14" />
                  {{ $t('voice.exportSettings') }}
                </button>

                <button @click="importSettings" class="action-btn import-btn">
                  <Upload :size="14" />
                  {{ $t('voice.importSettings') }}
                </button>

                <button @click="resetToDefaults" class="action-btn reset-btn">
                  <RotateCcw :size="14" />
                  {{ $t('voice.resetToDefaults') }}
                </button>
              </div>

              <input
                ref="importFileRef"
                type="file"
                accept=".json"
                @change="handleImportFile"
                style="display: none"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <div class="footer-info">
          <span class="support-status">
            {{ $t('voice.recognitionSupport') }}:
            <span :class="recognitionSupportClass">{{ recognitionSupportText }}</span>
          </span>

          <span class="support-status">
            {{ $t('voice.synthesisSupport') }}:
            <span :class="synthesisSupportClass">{{ synthesisSupportText }}</span>
          </span>
        </div>

        <div class="footer-actions">
          <button @click="saveAndClose" class="save-btn">
            {{ $t('common.save') }}
          </button>

          <button @click="$emit('close')" class="cancel-btn">
            {{ $t('common.cancel') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  X,
  Mic,
  Volume2,
  Shield,
  Monitor,
  Settings,
  Play,
  Download,
  Upload,
  RotateCcw,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { voiceService, type VoiceConfig } from '@renderer/src/services/voice/VoiceService'

// Emits
const emit = defineEmits<{
  close: []
  'settings-changed': [config: VoiceConfig]
}>()

// Composables
const { t } = useI18n()

// Refs
const importFileRef = ref<HTMLInputElement>()
const config = ref<VoiceConfig>({ ...voiceService.getConfig() })
const availableVoices = ref<SpeechSynthesisVoice[]>([])
const selectedVoiceName = ref(config.value.synthesis.voice)
const isTestingVoice = ref(false)
const isRequestingPermission = ref(false)

// Voice browser
const voiceSearch = ref('')
const voiceLanguageFilter = ref('')

// Computed properties
const supportedLanguages = computed(() => {
  return voiceService.getSupportedLanguages()
})

const voiceLanguages = computed(() => {
  const languages = new Set(availableVoices.value.map(voice => voice.lang))
  return Array.from(languages).sort()
})

const filteredVoices = computed(() => {
  let voices = availableVoices.value

  // Filter by search term
  if (voiceSearch.value) {
    const search = voiceSearch.value.toLowerCase()
    voices = voices.filter(
      voice =>
        voice.name.toLowerCase().includes(search) || voice.lang.toLowerCase().includes(search)
    )
  }

  // Filter by language
  if (voiceLanguageFilter.value) {
    voices = voices.filter(voice => voice.lang.startsWith(voiceLanguageFilter.value))
  }

  return voices
})

const microphoneStatusClass = computed(() => ({
  'status-granted': config.value.permissions.microphone,
  'status-denied': !config.value.permissions.microphone
}))

const microphoneStatusIcon = computed(() => {
  return config.value.permissions.microphone ? CheckCircle : XCircle
})

const microphoneStatusText = computed(() => {
  return config.value.permissions.microphone ? t('voice.granted') : t('voice.denied')
})

const recognitionSupportClass = computed(() => ({
  'support-yes': voiceService.isRecognitionSupported(),
  'support-no': !voiceService.isRecognitionSupported()
}))

const recognitionSupportText = computed(() => {
  return voiceService.isRecognitionSupported() ? t('voice.supported') : t('voice.notSupported')
})

const synthesisSupportClass = computed(() => ({
  'support-yes': voiceService.isSynthesisSupported(),
  'support-no': !voiceService.isSynthesisSupported()
}))

const synthesisSupportText = computed(() => {
  return voiceService.isSynthesisSupported() ? t('voice.supported') : t('voice.notSupported')
})

// Methods
const getLanguageName = (langCode: string): string => {
  try {
    return new Intl.DisplayNames([langCode], { type: 'language' }).of(langCode) || langCode
  } catch {
    return langCode
  }
}

const onConfigChange = () => {
  // Update voice service immediately
  voiceService.updateConfig(config.value)
}

const onVoiceChange = () => {
  config.value.synthesis.voice = selectedVoiceName.value
  onConfigChange()
}

const selectVoice = (voice: SpeechSynthesisVoice) => {
  selectedVoiceName.value = voice.name
  config.value.synthesis.voice = voice.name
  config.value.synthesis.language = voice.lang
  onConfigChange()
}

const testCurrentVoice = async () => {
  if (!selectedVoiceName.value) return

  const voice = availableVoices.value.find(v => v.name === selectedVoiceName.value)
  if (voice) {
    await testVoice(voice)
  }
}

const testVoice = async (voice: SpeechSynthesisVoice) => {
  if (isTestingVoice.value) return

  isTestingVoice.value = true

  try {
    const testText = t('voice.testPhrase')
    await voiceService.synthesizeSpeech(testText, {
      voice,
      rate: config.value.synthesis.rate,
      pitch: config.value.synthesis.pitch,
      volume: config.value.synthesis.volume,
      language: voice.lang
    })
  } catch (error) {
    console.error('Voice test failed:', error)
  } finally {
    isTestingVoice.value = false
  }
}

const requestMicrophonePermission = async () => {
  if (isRequestingPermission.value) return

  isRequestingPermission.value = true

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach(track => track.stop())

    config.value.permissions.microphone = true
    onConfigChange()
  } catch (error) {
    console.error('Microphone permission denied:', error)
  } finally {
    isRequestingPermission.value = false
  }
}

// Settings management
const exportSettings = () => {
  const settings = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    config: config.value
  }

  const dataStr = JSON.stringify(settings, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })

  const link = document.createElement('a')
  link.href = URL.createObjectURL(dataBlob)
  link.download = `voice-settings-${new Date().toISOString().split('T')[0]}.json`
  link.click()

  URL.revokeObjectURL(link.href)
}

const importSettings = () => {
  importFileRef.value?.click()
}

const handleImportFile = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = e => {
    try {
      const result = e.target?.result as string
      const settings = JSON.parse(result)

      if (settings.config) {
        config.value = { ...config.value, ...settings.config }
        selectedVoiceName.value = config.value.synthesis.voice
        onConfigChange()
      }
    } catch (error) {
      console.error('Failed to import settings:', error)
      alert(t('voice.importError'))
    }
  }

  reader.readAsText(file)
}

const resetToDefaults = () => {
  if (confirm(t('voice.confirmReset'))) {
    config.value = {
      recognition: {
        language: 'zh-CN',
        continuous: true,
        interimResults: true,
        maxAlternatives: 3,
        noiseSuppressionLevel: 0.8
      },
      synthesis: {
        voice: null,
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        language: 'zh-CN'
      },
      permissions: {
        microphone: config.value.permissions.microphone, // Keep current permission status
        autoStart: false
      },
      ui: {
        showWaveform: true,
        showConfidence: true,
        highlightKeywords: true
      }
    }

    selectedVoiceName.value = null
    onConfigChange()
  }
}

const saveAndClose = () => {
  emit('settings-changed', config.value)
  emit('close')
}

// Lifecycle
onMounted(() => {
  // Load available voices
  availableVoices.value = voiceService.getAvailableVoices()

  // If no voices loaded yet, wait for them
  if (availableVoices.value.length === 0) {
    const checkVoices = () => {
      availableVoices.value = voiceService.getAvailableVoices()
      if (availableVoices.value.length === 0) {
        setTimeout(checkVoices, 100)
      }
    }
    checkVoices()
  }
})
</script>

<style scoped>
.voice-settings-overlay {
  @apply fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4;
}

.voice-settings-modal {
  @apply bg-background border border-border rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col;
}

.modal-header {
  @apply flex items-center justify-between p-6 border-b border-border;
}

.modal-title {
  @apply text-xl font-semibold;
}

.close-btn {
  @apply p-2 rounded-md hover:bg-accent transition-colors;
}

.modal-content {
  @apply flex-1 overflow-y-auto p-6 space-y-8;
}

.settings-section {
  @apply space-y-4;
}

.section-header {
  @apply flex items-center gap-2;
}

.section-header h3 {
  @apply text-lg font-medium;
}

.settings-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.setting-item {
  @apply space-y-2;
}

.setting-item.full-width {
  @apply md:col-span-2;
}

.setting-label {
  @apply flex items-center justify-between text-sm font-medium;
}

.setting-value {
  @apply text-xs font-mono text-muted-foreground;
}

.setting-select {
  @apply w-full px-3 py-2 border border-border rounded-md text-sm;
}

.setting-slider {
  @apply w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer;
}

.setting-slider::-webkit-slider-thumb {
  @apply appearance-none w-4 h-4 bg-primary rounded-full cursor-pointer;
}

.setting-slider::-moz-range-thumb {
  @apply w-4 h-4 bg-primary rounded-full cursor-pointer border-0;
}

.setting-toggle {
  @apply relative inline-flex h-6 w-11 items-center rounded-full bg-muted transition-colors;
}

.toggle-input {
  @apply sr-only;
}

.toggle-input:checked + .toggle-slider {
  @apply bg-primary;
}

.toggle-slider {
  @apply inline-block h-4 w-4 transform rounded-full bg-white transition-transform;
}

.toggle-input:checked + .toggle-slider {
  @apply translate-x-6;
}

.voice-selector {
  @apply flex items-center gap-2;
}

.test-voice-btn {
  @apply flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-colors disabled:opacity-50;
}

.permission-status {
  @apply flex items-center justify-between;
}

.status-indicator {
  @apply flex items-center gap-2 text-sm;
}

.status-granted {
  @apply text-green-600 dark:text-green-400;
}

.status-denied {
  @apply text-red-600 dark:text-red-400;
}

.permission-btn {
  @apply px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-colors disabled:opacity-50;
}

.advanced-settings {
  @apply space-y-6;
}

.advanced-item {
  @apply space-y-3;
}

.advanced-item h4 {
  @apply font-medium;
}

.advanced-description {
  @apply text-sm text-muted-foreground;
}

.voice-browser {
  @apply space-y-3;
}

.voice-filters {
  @apply flex gap-2;
}

.voice-search {
  @apply flex-1 px-3 py-2 border border-border rounded-md text-sm;
}

.voice-language-filter {
  @apply px-3 py-2 border border-border rounded-md text-sm;
}

.voice-list {
  @apply max-h-60 overflow-y-auto border border-border rounded-md;
}

.voice-item {
  @apply flex items-center justify-between p-3 border-b border-border last:border-b-0 hover:bg-accent cursor-pointer;
}

.voice-item.selected {
  @apply bg-primary/10 border-primary/20;
}

.voice-info {
  @apply flex-1 min-w-0;
}

.voice-name {
  @apply font-medium text-sm truncate;
}

.voice-details {
  @apply flex items-center gap-2 mt-1;
}

.voice-lang {
  @apply text-xs text-muted-foreground;
}

.voice-badge {
  @apply px-1.5 py-0.5 bg-muted text-muted-foreground text-xs rounded-full;
}

.voice-actions {
  @apply flex items-center gap-1;
}

.test-btn {
  @apply p-1.5 rounded hover:bg-accent transition-colors disabled:opacity-50;
}

.settings-actions {
  @apply flex flex-wrap gap-2;
}

.action-btn {
  @apply flex items-center gap-1 px-3 py-1.5 border border-border rounded text-sm hover:bg-accent transition-colors;
}

.export-btn {
  @apply text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950;
}

.import-btn {
  @apply text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-950;
}

.reset-btn {
  @apply text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950;
}

.modal-footer {
  @apply flex items-center justify-between p-6 border-t border-border;
}

.footer-info {
  @apply flex flex-col gap-1 text-xs text-muted-foreground;
}

.support-status {
  @apply flex items-center gap-1;
}

.support-yes {
  @apply text-green-600 dark:text-green-400 font-medium;
}

.support-no {
  @apply text-red-600 dark:text-red-400 font-medium;
}

.footer-actions {
  @apply flex items-center gap-2;
}

.save-btn {
  @apply px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors;
}

.cancel-btn {
  @apply px-4 py-2 border border-border rounded hover:bg-accent transition-colors;
}

/* Responsive */
@media (max-width: 768px) {
  .voice-settings-modal {
    @apply max-w-full mx-2;
  }

  .settings-grid {
    @apply grid-cols-1;
  }

  .voice-filters {
    @apply flex-col;
  }

  .settings-actions {
    @apply flex-col;
  }

  .footer-info {
    @apply hidden;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .voice-settings-modal {
    @apply border-2;
  }

  .setting-slider:focus {
    @apply ring-2 ring-primary;
  }
}
</style>
