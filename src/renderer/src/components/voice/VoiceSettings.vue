<template>
  <div class="voice-settings-overlay" @click.self="$emit('close')">
    <div class="voice-settings-modal">
      <!-- Header -->
      <div class="modal-header">
        <h2 class="modal-title">{{ $t('voice.settings') }}</h2>
        <button @click="$emit('close')" class="close-btn" aria-label="按钮">
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
                  id="input-eoq7c2gp6"
                  type="checkbox"
                  v-model="config.recognition.continuous"
                  @change="onConfigChange"
                  class="toggle-input"
                  aria-label="连续识别开关"
                />
                <span class="toggle-slider" />
              </div>
            </div>

            <!-- Interim Results -->
            <div class="setting-item">
              <label class="setting-label">{{ $t('voice.interimResults') }}</label>
              <div class="setting-toggle">
                <input
                  id="input-uftc9o82q"
                  type="checkbox"
                  v-model="config.recognition.interimResults"
                  @change="onConfigChange"
                  class="toggle-input"
                  aria-label="临时结果开关"
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
                id="input-kituslfsd"
                type="range"
                v-model.number="config.recognition.maxAlternatives"
                min="1"
                max="10"
                step="1"
                class="setting-slider"
                @input="onConfigChange"
                aria-label="输入框"
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
                id="input-2kafrvrt4"
                type="range"
                v-model.number="config.recognition.noiseSuppressionLevel"
                min="0"
                max="1"
                step="0.1"
                class="setting-slider"
                @input="onConfigChange"
                aria-label="输入框"
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
                  aria-label="按钮"
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
                id="input-fce98mfsm"
                type="range"
                v-model.number="config.synthesis.rate"
                min="0.1"
                max="3.0"
                step="0.1"
                class="setting-slider"
                @input="onConfigChange"
                aria-label="输入框"
              />
            </div>

            <!-- Pitch -->
            <div class="setting-item">
              <label class="setting-label">
                {{ $t('voice.pitch') }}
                <span class="setting-value">{{ config.synthesis.pitch.toFixed(1) }}</span>
              </label>
              <input
                id="input-c0enht393"
                type="range"
                v-model.number="config.synthesis.pitch"
                min="0.1"
                max="2.0"
                step="0.1"
                class="setting-slider"
                @input="onConfigChange"
                aria-label="输入框"
              />
            </div>

            <!-- Volume -->
            <div class="setting-item">
              <label class="setting-label">
                {{ $t('voice.volume') }}
                <span class="setting-value">{{ Math.round(config.synthesis.volume * 100) }}%</span>
              </label>
              <input
                id="input-qcogm3x7q"
                type="range"
                v-model.number="config.synthesis.volume"
                min="0"
                max="1"
                step="0.1"
                class="setting-slider"
                @input="onConfigChange"
                aria-label="输入框"
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
                  aria-label="按钮"
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
                  id="input-7olg9zgen"
                  type="checkbox"
                  v-model="config.permissions.autoStart"
                  @change="onConfigChange"
                  class="toggle-input"
                  aria-label="输入框"
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
                  id="input-u94121nt3"
                  type="checkbox"
                  v-model="config.ui.showWaveform"
                  @change="onConfigChange"
                  class="toggle-input"
                  aria-label="输入框"
                />
                <span class="toggle-slider" />
              </div>
            </div>

            <!-- Show Confidence -->
            <div class="setting-item">
              <label class="setting-label">{{ $t('voice.showConfidence') }}</label>
              <div class="setting-toggle">
                <input
                  id="input-061vmecog"
                  type="checkbox"
                  v-model="config.ui.showConfidence"
                  @change="onConfigChange"
                  class="toggle-input"
                  aria-label="输入框"
                />
                <span class="toggle-slider" />
              </div>
            </div>

            <!-- Highlight Keywords -->
            <div class="setting-item">
              <label class="setting-label">{{ $t('voice.highlightKeywords') }}</label>
              <div class="setting-toggle">
                <input
                  id="input-mr1z4npx3"
                  type="checkbox"
                  v-model="config.ui.highlightKeywords"
                  @change="onConfigChange"
                  class="toggle-input"
                  aria-label="输入框"
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
                    id="input-1unhypd0u"
                    type="text"
                    v-model="voiceSearch"
                    :placeholder="$t('voice.searchVoices')"
                    class="voice-search"
                    aria-label="输入框"
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
                        aria-label="按钮"
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
                <button @click="exportSettings" class="action-btn export-btn" aria-label="按钮">
                  <Download :size="14" />
                  {{ $t('voice.exportSettings') }}
                </button>

                <button @click="importSettings" class="action-btn import-btn" aria-label="按钮">
                  <Upload :size="14" />
                  {{ $t('voice.importSettings') }}
                </button>

                <button @click="resetToDefaults" class="action-btn reset-btn" aria-label="按钮">
                  <RotateCcw :size="14" />
                  {{ $t('voice.resetToDefaults') }}
                </button>
              </div>

              <input
                id="input-2tc59ssez"
                ref="importFileRef"
                type="file"
                accept=".json"
                @change="handleImportFile"
                style="display: none"
                aria-label="输入框"
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
          <button @click="saveAndClose" class="save-btn" aria-label="按钮">
            {{ $t('common.save') }}
          </button>

          <button @click="$emit('close')" class="cancel-btn" aria-label="按钮">
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
/* 🎨 响应式设计系统 */
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}

/* 🎨 响应式实用类 */
.container-sm {
  max-width: var(--breakpoint-sm);
}
.container-md {
  max-width: var(--breakpoint-md);
}
.container-lg {
  max-width: var(--breakpoint-lg);
}
.container-xl {
  max-width: var(--breakpoint-xl);
}

/* 响应式显示 */
.hidden-sm {
  display: none;
}
.hidden-md {
  display: none;
}
.hidden-lg {
  display: none;
}

@media (min-width: 640px) {
  .hidden-sm {
    display: block;
  }
}

@media (min-width: 768px) {
  .hidden-md {
    display: block;
  }
}

@media (min-width: 1024px) {
  .hidden-lg {
    display: block;
  }
}

/* 响应式文本 */
.text-responsive-sm {
  font-size: clamp(0.875rem, 2vw, 1rem);
}
.text-responsive-base {
  font-size: clamp(1rem, 2.5vw, 1.125rem);
}
.text-responsive-lg {
  font-size: clamp(1.125rem, 3vw, 1.25rem);
}
.text-responsive-xl {
  font-size: clamp(1.25rem, 3.5vw, 1.5rem);
}

/* 响应式间距 */
.space-responsive-sm {
  gap: clamp(0.5rem, 2vw, 1rem);
}
.space-responsive-md {
  gap: clamp(1rem, 3vw, 1.5rem);
}
.space-responsive-lg {
  gap: clamp(1.5rem, 4vw, 2rem);
}

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
  .flex-col-mobile {
    flex-direction: column;
  }
  .grid-1-mobile {
    grid-template-columns: 1fr;
  }
  .gap-2-mobile {
    gap: var(--space-2);
  }
  .p-4-mobile {
    padding: var(--space-4);
  }
}

@media (max-width: 768px) {
  .flex-col-tablet {
    flex-direction: column;
  }
  .grid-2-tablet {
    grid-template-columns: repeat(2, 1fr);
  }
  .gap-4-tablet {
    gap: var(--space-4);
  }
  .p-6-tablet {
    padding: var(--space-6);
  }
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

.grid-cols-2 {
  grid-template-columns: repeat(2, 1fr);
}
.grid-cols-3 {
  grid-template-columns: repeat(3, 1fr);
}
.grid-cols-4 {
  grid-template-columns: repeat(4, 1fr);
}

.grid-gap-2 {
  gap: var(--space-2);
}
.grid-gap-4 {
  gap: var(--space-4);
}
.grid-gap-6 {
  gap: var(--space-6);
}

/* 🎨 卡片布局 */
.card {
  background: white;
  border-radius: 12px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.06);
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.card:hover {
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.1),
    0 2px 4px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.card-interactive:hover {
  cursor: pointer;
  transform: translateY(-2px);
  box-shadow:
    0 10px 25px rgba(0, 0, 0, 0.15),
    0 4px 10px rgba(0, 0, 0, 0.1);
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

  .hidden-mobile {
    display: none;
  }
  .flex-mobile-col {
    flex-direction: column;
  }
  .grid-mobile-1 {
    grid-template-columns: 1fr;
  }
}

/* 🎨 完整间距系统 - 基于4px网格 */
:root {
  --space-0: 0;
  --space-1: 0.25rem; /* 4px */
  --space-2: 0.5rem; /* 8px */
  --space-3: 0.75rem; /* 12px */
  --space-4: 1rem; /* 16px */
  --space-5: 1.25rem; /* 20px */
  --space-6: 1.5rem; /* 24px */
  --space-8: 2rem; /* 32px */
  --space-10: 2.5rem; /* 40px */
  --space-12: 3rem; /* 48px */
  --space-16: 4rem; /* 64px */
  --space-20: 5rem; /* 80px */
  --space-24: 6rem; /* 96px */
  --space-32: 8rem; /* 128px */

  /* 负间距 */
  --space-neg-1: -0.25rem;
  --space-neg-2: -0.5rem;
  --space-neg-4: -1rem;
}

/* 🎨 间距实用类 */
.m-1 {
  margin: var(--space-1);
}
.m-2 {
  margin: var(--space-2);
}
.m-3 {
  margin: var(--space-3);
}
.m-4 {
  margin: var(--space-4);
}
.m-6 {
  margin: var(--space-6);
}
.m-8 {
  margin: var(--space-8);
}

.p-1 {
  padding: var(--space-1);
}
.p-2 {
  padding: var(--space-2);
}
.p-3 {
  padding: var(--space-3);
}
.p-4 {
  padding: var(--space-4);
}
.p-6 {
  padding: var(--space-6);
}
.p-8 {
  padding: var(--space-8);
}

.mx-auto {
  margin-left: auto;
  margin-right: auto;
}
.my-auto {
  margin-top: auto;
  margin-bottom: auto;
}

.px-1 {
  padding-left: var(--space-1);
  padding-right: var(--space-1);
}
.px-2 {
  padding-left: var(--space-2);
  padding-right: var(--space-2);
}
.px-3 {
  padding-left: var(--space-3);
  padding-right: var(--space-3);
}
.px-4 {
  padding-left: var(--space-4);
  padding-right: var(--space-4);
}
.px-6 {
  padding-left: var(--space-6);
  padding-right: var(--space-6);
}

.py-1 {
  padding-top: var(--space-1);
  padding-bottom: var(--space-1);
}
.py-2 {
  padding-top: var(--space-2);
  padding-bottom: var(--space-2);
}
.py-3 {
  padding-top: var(--space-3);
  padding-bottom: var(--space-3);
}
.py-4 {
  padding-top: var(--space-4);
  padding-bottom: var(--space-4);
}
.py-6 {
  padding-top: var(--space-6);
  padding-bottom: var(--space-6);
}

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

.stack-sm > * + * {
  margin-top: var(--space-2);
}
.stack-md > * + * {
  margin-top: var(--space-4);
}
.stack-lg > * + * {
  margin-top: var(--space-6);
}
.stack-xl > * + * {
  margin-top: var(--space-8);
}

.inline-sm > * + * {
  margin-left: var(--space-2);
}
.inline-md > * + * {
  margin-left: var(--space-4);
}
.inline-lg > * + * {
  margin-left: var(--space-6);
}

/* 🎨 完整字体系统 */
:root {
  /* 字体族 */
  --font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', 'Source Code Pro', monospace;

  /* 字体大小 - 基于1.25的倍数比例 */
  --font-size-xs: 0.75rem; /* 12px */
  --font-size-sm: 0.875rem; /* 14px */
  --font-size-base: 1rem; /* 16px */
  --font-size-lg: 1.125rem; /* 18px */
  --font-size-xl: 1.25rem; /* 20px */
  --font-size-2xl: 1.5rem; /* 24px */
  --font-size-3xl: 1.875rem; /* 30px */
  --font-size-4xl: 2.25rem; /* 36px */
  --font-size-5xl: 3rem; /* 48px */

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
.font-sans {
  font-family: var(--font-family-sans);
}
.font-mono {
  font-family: var(--font-family-mono);
}

.text-xs {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-tight);
}
.text-sm {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-snug);
}
.text-base {
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
}
.text-lg {
  font-size: var(--font-size-lg);
  line-height: var(--line-height-relaxed);
}
.text-xl {
  font-size: var(--font-size-xl);
  line-height: var(--line-height-relaxed);
}
.text-2xl {
  font-size: var(--font-size-2xl);
  line-height: var(--line-height-loose);
}
.text-3xl {
  font-size: var(--font-size-3xl);
  line-height: var(--line-height-loose);
}

.font-thin {
  font-weight: var(--font-weight-thin);
}
.font-light {
  font-weight: var(--font-weight-light);
}
.font-normal {
  font-weight: var(--font-weight-normal);
}
.font-medium {
  font-weight: var(--font-weight-medium);
}
.font-semibold {
  font-weight: var(--font-weight-semibold);
}
.font-bold {
  font-weight: var(--font-weight-bold);
}

.leading-tight {
  line-height: var(--line-height-tight);
}
.leading-snug {
  line-height: var(--line-height-snug);
}
.leading-normal {
  line-height: var(--line-height-normal);
}
.leading-relaxed {
  line-height: var(--line-height-relaxed);
}

.tracking-tight {
  letter-spacing: var(--letter-spacing-tight);
}
.tracking-normal {
  letter-spacing: var(--letter-spacing-normal);
}
.tracking-wide {
  letter-spacing: var(--letter-spacing-wide);
}

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
.text-primary {
  color: var(--color-primary);
}
.text-success {
  color: var(--color-success);
}
.text-warning {
  color: var(--color-warning);
}
.text-error {
  color: var(--color-error);
}
.text-gray-500 {
  color: var(--color-gray-500);
}
.text-gray-600 {
  color: var(--color-gray-600);
}
.text-gray-700 {
  color: var(--color-gray-700);
}

.bg-primary {
  background-color: var(--color-primary);
}
.bg-primary-hover:hover {
  background-color: var(--color-primary-hover);
}
.bg-success {
  background-color: var(--color-success);
}
.bg-warning {
  background-color: var(--color-warning);
}
.bg-error {
  background-color: var(--color-error);
}

.border-primary {
  border-color: var(--color-primary);
}
.border-success {
  border-color: var(--color-success);
}
.border-error {
  border-color: var(--color-error);
}

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
.voice-settings-overlay {
  @apply fixed inset-0 z-modal-backdrop flex items-center justify-center p-4;
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

/* 🎨 表单用户体验优化 */
.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: hsl(var(--foreground));
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  font-size: 1rem;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: hsl(var(--ring));
  box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2);
}

.form-input.error {
  border-color: hsl(0 84% 60%);
}

.form-error {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: hsl(0 84% 60%);
}

.form-success {
  border-color: hsl(142 71% 45%);
}

/* 加载状态 */
.form-input.loading {
  background-image: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  background-size: 200% 100%;
  animation: loading-shimmer 1.5s infinite;
}

@keyframes loading-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>
