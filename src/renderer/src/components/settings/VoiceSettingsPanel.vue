<template>
  <div class="chatbox-voice-settings-panel">
    <h1
      style="
        color: var(--mantine-color-chatbox-primary-text);
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 1.5rem;
      "
    >
      语音设置
    </h1>

    <div class="settings-group">
      <!-- Voice Features -->
      <div class="settings-section">
        <h2>语音功能</h2>

        <div class="chatbox-settings-grid">
          <!-- Enable Voice -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="settingsStore.voiceEnabled"
                  type="checkbox"
                  class="chatbox-checkbox"
                />
                <div class="chatbox-checkbox-indicator">
                  <svg
                    class="chatbox-checkbox-check"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <span class="chatbox-checkbox-label cursor-pointer"> 启用语音功能 </span>
                <p class="chatbox-description mt-1">启用语音输入和语音输出功能</p>
              </div>
            </label>
          </div>

          <!-- Auto Play -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="settingsStore.voiceAutoPlay"
                  type="checkbox"
                  class="chatbox-checkbox"
                />
                <div class="chatbox-checkbox-indicator">
                  <svg
                    class="chatbox-checkbox-check"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <span class="chatbox-checkbox-label cursor-pointer"> 自动播放回答 </span>
                <p class="chatbox-description mt-1">AI回答后自动播放语音</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Voice Settings -->
      <div class="settings-section">
        <h2>语音参数</h2>

        <div class="chatbox-settings-grid">
          <!-- Voice Language -->
          <div class="chatbox-settings-item">
            <label for="voice-language" class="chatbox-label">语言</label>
            <div class="chatbox-select-wrapper">
              <select
                id="voice-language"
                v-model="settingsStore.voiceLanguage"
                class="chatbox-select"
              >
                <option value="zh-CN">中文（普通话）</option>
                <option value="zh-TW">中文（台湾）</option>
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="ja-JP">日本語</option>
                <option value="ko-KR">한국어</option>
              </select>
              <svg
                class="chatbox-select-chevron"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="6,9 12,15 18,9"></polyline>
              </svg>
            </div>
            <p class="chatbox-description">语音合成使用的语言</p>
          </div>

          <!-- Voice Rate -->
          <div class="chatbox-settings-item">
            <label for="voice-rate" class="chatbox-label">语音速度</label>
            <div class="chatbox-range-wrapper">
              <span class="chatbox-range-label">慢</span>
              <input
                id="voice-rate"
                v-model.number="settingsStore.voiceRate"
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                class="chatbox-range-slider"
              />
              <span class="chatbox-range-label">快</span>
              <span class="chatbox-range-value">{{ settingsStore.voiceRate }}x</span>
            </div>
            <p class="chatbox-description">调整语音播放速度</p>
          </div>

          <!-- Voice Pitch -->
          <div class="chatbox-settings-item">
            <label for="voice-pitch" class="chatbox-label">音调</label>
            <div class="chatbox-range-wrapper">
              <span class="chatbox-range-label">低</span>
              <input
                id="voice-pitch"
                v-model.number="settingsStore.voicePitch"
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                class="chatbox-range-slider"
              />
              <span class="chatbox-range-label">高</span>
              <span class="chatbox-range-value">{{ settingsStore.voicePitch }}</span>
            </div>
            <p class="chatbox-description">调整语音音调高低</p>
          </div>

          <!-- Voice Volume -->
          <div class="chatbox-settings-item">
            <label for="voice-volume" class="chatbox-label">音量</label>
            <div class="chatbox-range-wrapper">
              <span class="chatbox-range-label">小</span>
              <input
                id="voice-volume"
                v-model.number="settingsStore.voiceVolume"
                type="range"
                min="0"
                max="1"
                step="0.1"
                class="chatbox-range-slider"
              />
              <span class="chatbox-range-label">大</span>
              <span class="chatbox-range-value"
                >{{ Math.round(settingsStore.voiceVolume * 100) }}%</span
              >
            </div>
            <p class="chatbox-description">调整语音播放音量</p>
          </div>
        </div>
      </div>

      <!-- Voice Preview -->
      <div class="settings-section">
        <h2>语音测试</h2>

        <div class="voice-preview">
          <div class="preview-text">
            <label for="preview-text" class="chatbox-label">测试文本</label>
            <textarea
              id="preview-text"
              v-model="previewText"
              rows="3"
              class="chatbox-input"
              placeholder="输入要测试的文本..."
            ></textarea>
          </div>

          <div class="preview-controls">
            <button @click="playPreview" :disabled="isPlaying" class="chatbox-button-primary">
              <component :is="isPlaying ? Pause : Play" :size="16" />
              {{ isPlaying ? '停止' : '播放' }}
            </button>

            <button @click="stopPreview" :disabled="!isPlaying" class="chatbox-button-outline">
              <Square :size="16" />
              停止
            </button>
          </div>
        </div>
      </div>

      <!-- Voice Status -->
      <div class="settings-section">
        <h2>语音状态</h2>

        <div class="voice-status">
          <div class="status-item">
            <div class="status-label">语音支持:</div>
            <div class="status-value">
              <span :class="voiceSupported ? 'status-success' : 'status-error'">
                {{ voiceSupported ? '支持' : '不支持' }}
              </span>
            </div>
          </div>

          <div class="status-item">
            <div class="status-label">可用语音:</div>
            <div class="status-value">{{ availableVoices.length }} 个</div>
          </div>

          <div v-if="availableVoices.length > 0" class="available-voices">
            <details>
              <summary class="voices-summary">查看可用语音</summary>
              <div class="voices-list">
                <div
                  v-for="voice in availableVoices.slice(0, 10)"
                  :key="voice.name"
                  class="voice-item"
                >
                  <span class="voice-name">{{ voice.name }}</span>
                  <span class="voice-lang">{{ voice.lang }}</span>
                </div>
                <div v-if="availableVoices.length > 10" class="voice-more">
                  还有 {{ availableVoices.length - 10 }} 个语音...
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useToastStore } from '@/stores/toast'
import { Play, Pause, Square } from 'lucide-vue-next'

const settingsStore = useSettingsStore()
const toastStore = useToastStore()

// Local state
const previewText = ref('这是一个语音测试，您好，欢迎使用 MiaoDa Chat！')
const isPlaying = ref(false)
const voiceSupported = ref(false)
const availableVoices = ref<SpeechSynthesisVoice[]>([])

// Methods
const playPreview = () => {
  if (!voiceSupported.value) {
    toastStore.showError('您的浏览器不支持语音合成功能')
    return
  }

  if (!previewText.value.trim()) {
    toastStore.showWarning('请输入测试文本')
    return
  }

  try {
    const utterance = new SpeechSynthesisUtterance(previewText.value)
    utterance.lang = settingsStore.voiceLanguage
    utterance.rate = settingsStore.voiceRate
    utterance.pitch = settingsStore.voicePitch
    utterance.volume = settingsStore.voiceVolume

    utterance.onstart = () => {
      isPlaying.value = true
    }

    utterance.onend = () => {
      isPlaying.value = false
    }

    utterance.onerror = () => {
      isPlaying.value = false
      toastStore.showError('语音播放失败')
    }

    speechSynthesis.speak(utterance)
  } catch (error) {
    toastStore.showError('语音播放出错')
  }
}

const stopPreview = () => {
  speechSynthesis.cancel()
  isPlaying.value = false
}

const checkVoiceSupport = () => {
  voiceSupported.value = 'speechSynthesis' in window

  if (voiceSupported.value) {
    // Load available voices
    const loadVoices = () => {
      availableVoices.value = speechSynthesis.getVoices()
    }

    // Voices might not be loaded immediately
    if (speechSynthesis.getVoices().length > 0) {
      loadVoices()
    } else {
      speechSynthesis.onvoiceschanged = loadVoices
    }
  }
}

// Lifecycle
onMounted(() => {
  checkVoiceSupport()
})
</script>

<style scoped>
@import './chatbox-base.css';

.chatbox-voice-settings-panel {
  padding: var(--mantine-spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--mantine-spacing-xl);
}

.chatbox-settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

/* Voice preview */
.voice-preview {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.preview-text {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.preview-text textarea {
  resize: vertical;
  min-height: 80px;
}

.preview-controls {
  display: flex;
  gap: 1rem;
}

/* Button styles are now defined in chatbox-base.css */

/* Voice status */
.voice-status {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 0.375rem;
}

.status-label {
  font-weight: 500;
  color: var(--mantine-color-chatbox-primary-text);
}

.status-value {
  color: var(--mantine-color-chatbox-secondary-text);
}

.status-success {
  color: #22c55e;
}

.status-error {
  color: #ef4444;
}

.available-voices {
  margin-top: 1rem;
}

.voices-summary {
  cursor: pointer;
  font-size: var(--mantine-font-size-sm);
  color: var(--mantine-color-chatbox-brand-filled);
  padding: 0.5rem;
  border-radius: 0.25rem;
}

.voices-summary:hover {
  background: rgba(255, 255, 255, 0.05);
}

.voices-list {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 0.375rem;
  max-height: 200px;
  overflow-y: auto;
}

.voice-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  border-radius: 0.25rem;
}

.voice-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.voice-name {
  font-weight: 500;
  color: var(--mantine-color-chatbox-primary-text);
}

.voice-lang {
  font-size: var(--mantine-font-size-sm);
  color: var(--mantine-color-chatbox-secondary-text);
}

.voice-more {
  padding: 0.5rem;
  text-align: center;
  font-size: var(--mantine-font-size-sm);
  color: var(--mantine-color-chatbox-secondary-text);
}

/* Responsive */
@media (max-width: 768px) {
  .chatbox-settings-grid {
    grid-template-columns: 1fr;
  }

  .preview-controls {
    flex-direction: column;
  }

  .status-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
