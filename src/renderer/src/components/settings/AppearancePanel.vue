<template>
  <div class="chatbox-appearance-panel">
    <h1
      style="
        color: var(--mantine-color-chatbox-primary-text);
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 1.5rem;
      "
    >
      外观设置
    </h1>

    <div class="settings-group">
      <!-- Theme -->
      <div class="settings-section">
        <h2>主题</h2>

        <div class="theme-options">
          <label
            v-for="theme in themes"
            :key="theme.id"
            class="theme-option"
            :class="{ active: uiStore.theme === theme.id }"
          >
            <input
              v-model="uiStore.theme"
              :value="theme.id"
              type="radio"
              class="theme-radio"
              @change="applyTheme(theme.id)"
            />
            <div class="theme-preview">
              <div class="theme-preview-header" :style="{ backgroundColor: theme.colors.header }">
                <div class="theme-preview-controls">
                  <div class="preview-dot" style="background: #ff5f57"></div>
                  <div class="preview-dot" style="background: #febc2e"></div>
                  <div class="preview-dot" style="background: #28ca42"></div>
                </div>
              </div>
              <div
                class="theme-preview-content"
                :style="{ backgroundColor: theme.colors.background }"
              >
                <div
                  class="preview-sidebar"
                  :style="{ backgroundColor: theme.colors.sidebar }"
                ></div>
                <div class="preview-main">
                  <div
                    class="preview-message user"
                    :style="{ backgroundColor: theme.colors.userMessage }"
                  ></div>
                  <div
                    class="preview-message ai"
                    :style="{ backgroundColor: theme.colors.aiMessage }"
                  ></div>
                </div>
              </div>
            </div>
            <div class="theme-info">
              <div class="theme-name">{{ theme.name }}</div>
              <div class="theme-description">{{ theme.description }}</div>
            </div>
          </label>
        </div>
      </div>

      <!-- Font Settings -->
      <div class="settings-section">
        <h2>字体设置</h2>

        <div class="chatbox-settings-grid">
          <!-- Font Family -->
          <div class="chatbox-settings-item">
            <label for="font-family" class="chatbox-label">字体</label>
            <div class="chatbox-select-wrapper">
              <select id="font-family" v-model="settingsStore.fontFamily" class="chatbox-select">
                <option value="Inter">Inter</option>
                <option value="system-ui">系统默认</option>
                <option value="SF Pro Display">SF Pro Display</option>
                <option value="Segoe UI">Segoe UI</option>
                <option value="PingFang SC">苹方</option>
                <option value="Microsoft YaHei">微软雅黑</option>
                <option value="Source Han Sans SC">思源黑体</option>
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
            <p class="chatbox-description">选择界面使用的字体</p>
          </div>

          <!-- Font Size -->
          <div class="chatbox-settings-item">
            <label for="font-size" class="chatbox-label">字体大小</label>
            <div class="chatbox-range-wrapper">
              <span class="chatbox-range-label">小</span>
              <input
                id="font-size"
                v-model.number="settingsStore.fontSize"
                type="range"
                min="12"
                max="20"
                step="1"
                class="chatbox-range-slider"
              />
              <span class="chatbox-range-label">大</span>
              <span class="chatbox-range-value">{{ settingsStore.fontSize }}px</span>
            </div>
            <p class="chatbox-description">调整界面文字大小</p>
          </div>

          <!-- Line Height -->
          <div class="chatbox-settings-item">
            <label for="line-height" class="chatbox-label">行高</label>
            <div class="chatbox-range-wrapper">
              <span class="chatbox-range-label">紧凑</span>
              <input
                id="line-height"
                v-model.number="settingsStore.lineHeight"
                type="range"
                min="1.0"
                max="2.0"
                step="0.1"
                class="chatbox-range-slider"
              />
              <span class="chatbox-range-label">宽松</span>
              <span class="chatbox-range-value">{{ settingsStore.lineHeight }}</span>
            </div>
            <p class="chatbox-description">调整文字行间距</p>
          </div>
        </div>
      </div>

      <!-- Layout Settings -->
      <div class="settings-section">
        <h2>布局设置</h2>

        <div class="chatbox-settings-grid">
          <!-- Compact Mode -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="settingsStore.compactMode"
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
                <span class="chatbox-checkbox-label cursor-pointer"> 紧凑布局 </span>
                <p class="chatbox-description mt-1">减少界面元素间距，显示更多内容</p>
              </div>
            </label>
          </div>

          <!-- Animations -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="settingsStore.animationsEnabled"
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
                <span class="chatbox-checkbox-label cursor-pointer"> 启用动画效果 </span>
                <p class="chatbox-description mt-1">界面切换和交互的动画效果</p>
              </div>
            </label>
          </div>

          <!-- Blur Effects -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="appearanceSettings.blurEffects"
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
                <span class="chatbox-checkbox-label cursor-pointer"> 启用毛玻璃效果 </span>
                <p class="chatbox-description mt-1">为某些界面元素添加模糊背景效果</p>
              </div>
            </label>
          </div>

          <!-- Rounded Corners -->
          <div class="chatbox-settings-item">
            <label for="border-radius" class="chatbox-label">圆角大小</label>
            <div class="chatbox-range-wrapper">
              <span class="chatbox-range-label">直角</span>
              <input
                id="border-radius"
                v-model.number="appearanceSettings.borderRadius"
                type="range"
                min="0"
                max="16"
                step="1"
                class="chatbox-range-slider"
              />
              <span class="chatbox-range-label">圆角</span>
              <span class="chatbox-range-value">{{ appearanceSettings.borderRadius }}px</span>
            </div>
            <p class="chatbox-description">调整界面元素的圆角大小</p>
          </div>
        </div>
      </div>

      <!-- Color Customization -->
      <div class="settings-section">
        <h2>颜色自定义</h2>

        <div class="color-customization">
          <div class="color-warning">
            <div class="warning-icon">
              <AlertTriangle :size="20" />
            </div>
            <div class="warning-content">
              <div class="warning-title">高级功能</div>
              <div class="warning-description">
                颜色自定义功能正在开发中。目前可以使用预设的主题。
              </div>
            </div>
          </div>

          <div class="color-preview-grid">
            <div
              v-for="color in colorPresets"
              :key="color.name"
              class="color-preset"
              @click="applyColorPreset(color)"
            >
              <div class="color-preview">
                <div
                  v-for="(colorValue, index) in color.colors"
                  :key="index"
                  class="color-swatch"
                  :style="{ backgroundColor: colorValue }"
                ></div>
              </div>
              <div class="color-preset-name">{{ color.name }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Accessibility -->
      <div class="settings-section">
        <h2>无障碍访问</h2>

        <div class="chatbox-settings-grid">
          <!-- High Contrast -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="accessibilitySettings.highContrast"
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
                <span class="chatbox-checkbox-label cursor-pointer"> 高对比度模式 </span>
                <p class="chatbox-description mt-1">提高文字和背景的对比度，便于阅读</p>
              </div>
            </label>
          </div>

          <!-- Reduce Motion -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="accessibilitySettings.reduceMotion"
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
                <span class="chatbox-checkbox-label cursor-pointer"> 减少动画 </span>
                <p class="chatbox-description mt-1">减少或禁用动画效果，适合对动画敏感的用户</p>
              </div>
            </label>
          </div>

          <!-- Focus Indicators -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="accessibilitySettings.enhancedFocus"
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
                <span class="chatbox-checkbox-label cursor-pointer"> 增强焦点指示器 </span>
                <p class="chatbox-description mt-1">更明显的焦点边框，便于键盘导航</p>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useUIStore } from '@/stores/ui'
import { useToastStore } from '@/stores/toast'
import { AlertTriangle } from 'lucide-vue-next'

const settingsStore = useSettingsStore()
const uiStore = useUIStore()
const toastStore = useToastStore()

// Local settings
const appearanceSettings = ref({
  blurEffects: true,
  borderRadius: 8
})

const accessibilitySettings = ref({
  highContrast: false,
  reduceMotion: false,
  enhancedFocus: false
})

// Theme definitions
const themes = ref([
  {
    id: 'light',
    name: '浅色模式',
    description: '经典的浅色界面',
    colors: {
      header: '#ffffff',
      background: '#f8fafc',
      sidebar: '#ffffff',
      userMessage: '#3b82f6',
      aiMessage: '#e5e7eb'
    }
  },
  {
    id: 'dark',
    name: '深色模式',
    description: '护眼的深色界面',
    colors: {
      header: '#1f2937',
      background: '#111827',
      sidebar: '#1f2937',
      userMessage: '#3b82f6',
      aiMessage: '#374151'
    }
  },
  {
    id: 'system',
    name: '跟随系统',
    description: '自动切换浅色/深色',
    colors: {
      header: 'linear-gradient(45deg, #ffffff, #1f2937)',
      background: 'linear-gradient(45deg, #f8fafc, #111827)',
      sidebar: 'linear-gradient(45deg, #ffffff, #1f2937)',
      userMessage: '#3b82f6',
      aiMessage: 'linear-gradient(45deg, #e5e7eb, #374151)'
    }
  }
])

// Color presets
const colorPresets = ref([
  {
    name: '蓝色',
    colors: ['#3b82f6', '#1e40af', '#dbeafe', '#60a5fa']
  },
  {
    name: '绿色',
    colors: ['#10b981', '#047857', '#d1fae5', '#34d399']
  },
  {
    name: '紫色',
    colors: ['#8b5cf6', '#5b21b6', '#ede9fe', '#a78bfa']
  },
  {
    name: '橙色',
    colors: ['#f59e0b', '#d97706', '#fef3c7', '#fbbf24']
  },
  {
    name: '红色',
    colors: ['#ef4444', '#dc2626', '#fee2e2', '#f87171']
  },
  {
    name: '青色',
    colors: ['#06b6d4', '#0891b2', '#cffafe', '#22d3ee']
  }
])

// Methods
const applyColorPreset = (preset: any) => {
  toastStore.showInfo(`${preset.name}配色预设功能即将推出`)
}

// Apply font changes immediately
const applyFontChanges = () => {
  settingsStore.setFontSize(settingsStore.fontSize)
  settingsStore.setFontFamily(settingsStore.fontFamily)
  settingsStore.setLineHeight(settingsStore.lineHeight)
}

// Apply theme changes
const applyTheme = (theme: string) => {
  uiStore.setTheme(theme as any)
  toastStore.showSuccess(`主题已切换至${themes.value.find(t => t.id === theme)?.name}`)
}

// Watch for settings changes
watch(
  [appearanceSettings, accessibilitySettings],
  () => {
    localStorage.setItem(
      'appearanceSettings',
      JSON.stringify({
        appearance: appearanceSettings.value,
        accessibility: accessibilitySettings.value
      })
    )
  },
  { deep: true }
)

// Watch for font settings changes and apply immediately
watch(
  () => settingsStore.fontSize,
  newSize => {
    settingsStore.setFontSize(newSize)
  }
)

watch(
  () => settingsStore.fontFamily,
  newFamily => {
    settingsStore.setFontFamily(newFamily)
  }
)

watch(
  () => settingsStore.lineHeight,
  newHeight => {
    settingsStore.setLineHeight(newHeight)
  }
)

// Watch for animations enabled changes
watch(
  () => settingsStore.animationsEnabled,
  enabled => {
    settingsStore.setAnimationsEnabled(enabled)
  }
)

// Load saved settings
const loadAppearanceSettings = () => {
  const saved = localStorage.getItem('appearanceSettings')
  if (saved) {
    try {
      const settings = JSON.parse(saved)
      if (settings.appearance) {
        appearanceSettings.value = { ...appearanceSettings.value, ...settings.appearance }
      }
      if (settings.accessibility) {
        accessibilitySettings.value = { ...accessibilitySettings.value, ...settings.accessibility }
      }
    } catch (error) {
      console.error('Error loading appearance settings:', error)
    }
  }
}

// Initialize
loadAppearanceSettings()
</script>

<style scoped>
@import './chatbox-base.css';

.chatbox-appearance-panel {
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

/* Theme options */
.theme-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.theme-option {
  display: flex;
  flex-direction: column;
  cursor: pointer;
  border: 2px solid var(--mantine-color-chatbox-border-primary-outline);
  border-radius: 0.5rem;
  overflow: hidden;
  transition: all 0.15s ease;
}

.theme-option:hover {
  border-color: var(--mantine-color-chatbox-brand-outline-hover);
}

.theme-option.active {
  border-color: var(--mantine-color-chatbox-brand-filled);
}

.theme-radio {
  display: none;
}

.theme-preview {
  height: 120px;
  display: flex;
  flex-direction: column;
  border-radius: 0.375rem;
  overflow: hidden;
}

.theme-preview-header {
  height: 24px;
  display: flex;
  align-items: center;
  padding: 0 0.5rem;
}

.theme-preview-controls {
  display: flex;
  gap: 0.25rem;
}

.preview-dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;
}

.theme-preview-content {
  flex: 1;
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem;
}

.preview-sidebar {
  width: 2rem;
  border-radius: 0.125rem;
}

.preview-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.25rem;
}

.preview-message {
  height: 0.75rem;
  border-radius: 0.125rem;
}

.preview-message.user {
  width: 60%;
  margin-left: auto;
}

.preview-message.ai {
  width: 80%;
}

.theme-info {
  padding: 1rem;
}

.theme-name {
  font-weight: 600;
  color: var(--mantine-color-chatbox-primary-text);
  margin-bottom: 0.25rem;
}

.theme-description {
  font-size: var(--mantine-font-size-sm);
  color: var(--mantine-color-chatbox-secondary-text);
}

/* Color customization */
.color-customization {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.color-warning {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 0.5rem;
}

.warning-icon {
  color: #3b82f6;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.warning-content {
  flex: 1;
}

.warning-title {
  font-weight: 600;
  color: var(--mantine-color-chatbox-primary-text);
  margin-bottom: 0.25rem;
}

.warning-description {
  font-size: var(--mantine-font-size-sm);
  color: var(--mantine-color-chatbox-secondary-text);
  line-height: 1.4;
}

.color-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 1rem;
}

.color-preset {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--mantine-color-chatbox-border-primary-outline);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.color-preset:hover {
  background: rgba(255, 255, 255, 0.05);
  transform: translateY(-2px);
}

.color-preview {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2px;
  width: 3rem;
  height: 3rem;
  border-radius: 0.375rem;
  overflow: hidden;
}

.color-swatch {
  width: 100%;
  height: 100%;
}

.color-preset-name {
  font-size: var(--mantine-font-size-sm);
  color: var(--mantine-color-chatbox-secondary-text);
  text-align: center;
}

/* Responsive */
@media (max-width: 768px) {
  .theme-options {
    grid-template-columns: 1fr;
  }

  .chatbox-settings-grid {
    grid-template-columns: 1fr;
  }

  .color-preview-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
