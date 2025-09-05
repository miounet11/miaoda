<template>
  <div class="chatbox-advanced-panel">
    <h1
      style="
        color: var(--mantine-color-chatbox-primary-text);
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 1.5rem;
      "
    >
      高级设置
    </h1>

    <div class="settings-group">
      <!-- Performance Settings -->
      <div class="settings-section">
        <h2>性能设置</h2>

        <div class="chatbox-settings-grid">
          <!-- Hardware Acceleration -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="advancedSettings.hardwareAcceleration"
                  type="checkbox"
                  class="chatbox-checkbox"
                />
                <div class="chatbox-checkbox-indicator">
                  <svg
                    class="chatbox-checkbox-icon"
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path
                      d="M10 3L4.5 8.5L2 6"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </div>
              </div>
              <div class="chatbox-checkbox-content">
                <div class="chatbox-checkbox-label">启用硬件加速</div>
                <div class="chatbox-checkbox-description">
                  使用GPU加速图形渲染，提升界面流畅度
                </div>
              </div>
            </label>
          </div>

          <!-- Memory Optimization -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="advancedSettings.memoryOptimization"
                  type="checkbox"
                  class="chatbox-checkbox"
                />
                <div class="chatbox-checkbox-indicator">
                  <svg
                    class="chatbox-checkbox-icon"
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path
                      d="M10 3L4.5 8.5L2 6"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </div>
              </div>
              <div class="chatbox-checkbox-content">
                <div class="chatbox-checkbox-label">内存优化</div>
                <div class="chatbox-checkbox-description">
                  自动清理无用内存，降低内存占用
                </div>
              </div>
            </label>
          </div>

          <!-- Concurrent Requests -->
          <div class="chatbox-settings-item">
            <label for="concurrent-requests" class="chatbox-label">最大并发请求数</label>
            <div class="range-input-wrapper">
              <input
                id="concurrent-requests"
                v-model="advancedSettings.maxConcurrentRequests"
                type="range"
                min="1"
                max="10"
                step="1"
                class="chatbox-range"
              />
              <span class="range-value">{{ advancedSettings.maxConcurrentRequests }}</span>
            </div>
            <p class="chatbox-description">同时发送API请求的最大数量</p>
          </div>
        </div>
      </div>

      <!-- Developer Settings -->
      <div class="settings-section">
        <h2>开发者选项</h2>

        <div class="chatbox-settings-grid">
          <!-- Debug Mode -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="advancedSettings.debugMode"
                  type="checkbox"
                  class="chatbox-checkbox"
                />
                <div class="chatbox-checkbox-indicator">
                  <svg
                    class="chatbox-checkbox-icon"
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path
                      d="M10 3L4.5 8.5L2 6"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </div>
              </div>
              <div class="chatbox-checkbox-content">
                <div class="chatbox-checkbox-label">调试模式</div>
                <div class="chatbox-checkbox-description">
                  启用详细的日志记录和调试信息
                </div>
              </div>
            </label>
          </div>

          <!-- Dev Tools -->
          <div class="chatbox-settings-item">
            <label class="chatbox-label">开发者工具</label>
            <div class="flex gap-2">
              <button @click="openDevTools" class="chatbox-button-secondary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
                打开开发者工具
              </button>
              <button @click="reloadApp" class="chatbox-button-secondary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 4v6h-6"></path>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
                重新加载
              </button>
            </div>
            <p class="chatbox-description">调试应用问题的工具</p>
          </div>

          <!-- Log Level -->
          <div class="chatbox-settings-item">
            <label for="log-level" class="chatbox-label">日志级别</label>
            <div class="chatbox-select-wrapper">
              <select
                id="log-level"
                v-model="advancedSettings.logLevel"
                class="chatbox-select"
              >
                <option value="error">错误</option>
                <option value="warn">警告</option>
                <option value="info">信息</option>
                <option value="debug">调试</option>
                <option value="verbose">详细</option>
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
            <p class="chatbox-description">控制记录日志的详细程度</p>
          </div>
        </div>
      </div>

      <!-- Experimental Features -->
      <div class="settings-section">
        <h2>实验性功能</h2>
        <div class="warning-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <div>
            <div class="warning-title">实验性功能警告</div>
            <div class="warning-description">这些功能可能不稳定，仅供测试使用</div>
          </div>
        </div>

        <div class="chatbox-settings-grid">
          <!-- Beta Features -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="advancedSettings.betaFeatures"
                  type="checkbox"
                  class="chatbox-checkbox"
                />
                <div class="chatbox-checkbox-indicator">
                  <svg
                    class="chatbox-checkbox-icon"
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path
                      d="M10 3L4.5 8.5L2 6"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </div>
              </div>
              <div class="chatbox-checkbox-content">
                <div class="chatbox-checkbox-label">启用Beta功能</div>
                <div class="chatbox-checkbox-description">
                  体验最新的实验性功能和改进
                </div>
              </div>
            </label>
          </div>

          <!-- WebGL Acceleration -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="advancedSettings.webglAcceleration"
                  type="checkbox"
                  class="chatbox-checkbox"
                />
                <div class="chatbox-checkbox-indicator">
                  <svg
                    class="chatbox-checkbox-icon"
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path
                      d="M10 3L4.5 8.5L2 6"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </div>
              </div>
              <div class="chatbox-checkbox-content">
                <div class="chatbox-checkbox-label">WebGL加速渲染</div>
                <div class="chatbox-checkbox-description">
                  使用WebGL加速复杂界面渲染（实验性）
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- System Information -->
      <div class="settings-section">
        <h2>系统信息</h2>

        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">应用版本</div>
            <div class="info-value">{{ systemInfo.appVersion }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Electron版本</div>
            <div class="info-value">{{ systemInfo.electronVersion }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Node.js版本</div>
            <div class="info-value">{{ systemInfo.nodeVersion }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">操作系统</div>
            <div class="info-value">{{ systemInfo.platform }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">架构</div>
            <div class="info-value">{{ systemInfo.arch }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">内存使用</div>
            <div class="info-value">{{ systemInfo.memoryUsage }}</div>
          </div>
        </div>

        <div class="system-actions">
          <button @click="copySystemInfo" class="chatbox-button-secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            复制系统信息
          </button>
          <button @click="openLogsFolder" class="chatbox-button-secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2l5 0l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            打开日志文件夹
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'

const { showToast } = useToast()

interface AdvancedSettings {
  hardwareAcceleration: boolean
  memoryOptimization: boolean
  maxConcurrentRequests: number
  debugMode: boolean
  logLevel: string
  betaFeatures: boolean
  webglAcceleration: boolean
}

interface SystemInfo {
  appVersion: string
  electronVersion: string
  nodeVersion: string
  platform: string
  arch: string
  memoryUsage: string
}

const advancedSettings = ref<AdvancedSettings>({
  hardwareAcceleration: true,
  memoryOptimization: false,
  maxConcurrentRequests: 3,
  debugMode: false,
  logLevel: 'info',
  betaFeatures: false,
  webglAcceleration: false
})

const systemInfo = ref<SystemInfo>({
  appVersion: 'v6.0.1',
  electronVersion: 'v35.0.1',
  nodeVersion: 'v20.9.0',
  platform: 'Windows 11',
  arch: 'x64',
  memoryUsage: '128 MB'
})

const openDevTools = () => {
  if (window.api?.window?.openDevTools) {
    window.api.window.openDevTools()
    showToast('开发者工具已打开', 'success')
  } else {
    showToast('开发者工具功能暂不可用', 'warning')
  }
}

const reloadApp = () => {
  if (window.api?.window?.reload) {
    window.api.window.reload()
  } else {
    window.location.reload()
  }
}

const copySystemInfo = async () => {
  const info = Object.entries(systemInfo.value)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n')
  
  try {
    await navigator.clipboard.writeText(info)
    showToast('系统信息已复制到剪贴板', 'success')
  } catch (error) {
    console.error('Failed to copy system info:', error)
    showToast('复制失败', 'error')
  }
}

const openLogsFolder = async () => {
  try {
    if (window.api?.shell?.openPath) {
      const logsPath = await window.api.app?.getPath('logs') || './logs'
      await window.api.shell.openPath(logsPath)
      showToast('日志文件夹已打开', 'success')
    } else {
      showToast('打开文件夹功能暂不可用', 'warning')
    }
  } catch (error) {
    console.error('Failed to open logs folder:', error)
    showToast('打开日志文件夹失败', 'error')
  }
}

const updateSystemInfo = async () => {
  try {
    if (window.api?.system?.getSystemInfo) {
      const info = await window.api.system.getSystemInfo()
      systemInfo.value = { ...systemInfo.value, ...info }
    }
  } catch (error) {
    console.error('Failed to get system info:', error)
  }
}

const saveSettings = () => {
  localStorage.setItem('advancedSettings', JSON.stringify(advancedSettings.value))
  showToast('高级设置已保存', 'success')
}

// Load settings on mount
onMounted(() => {
  const saved = localStorage.getItem('advancedSettings')
  if (saved) {
    try {
      advancedSettings.value = JSON.parse(saved)
    } catch (error) {
      console.error('Failed to load advanced settings:', error)
    }
  }

  updateSystemInfo()
})

// Auto-save when settings change
import { watch } from 'vue'
watch(advancedSettings, saveSettings, { deep: true })
</script>

<style scoped>
.chatbox-advanced-panel {
  padding: var(--mantine-spacing-md);
  max-width: 50rem;
  margin: 0 auto;
}

.settings-group {
  margin-bottom: 2rem;
}

.settings-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--mantine-color-chatbox-border-primary-outline);
  border-radius: 0.75rem;
}

.settings-section h2 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--mantine-color-chatbox-primary-text);
  margin: 0 0 1rem 0;
}

.chatbox-settings-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.chatbox-settings-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.chatbox-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--mantine-color-chatbox-primary-text);
}

.chatbox-description {
  font-size: 0.75rem;
  color: var(--mantine-color-chatbox-secondary-text);
  margin: 0;
}

/* Warning Banner */
.warning-banner {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  color: #fbbf24;
}

.warning-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.warning-description {
  font-size: 0.875rem;
  opacity: 0.9;
}

/* Checkbox Styles */
.chatbox-checkbox-item-vertical {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
}

.chatbox-checkbox-wrapper {
  position: relative;
  flex-shrink: 0;
}

.chatbox-checkbox {
  width: 1.125rem;
  height: 1.125rem;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}

.chatbox-checkbox-indicator {
  position: absolute;
  top: 0;
  left: 0;
  width: 1.125rem;
  height: 1.125rem;
  background: transparent;
  border: 1px solid var(--mantine-color-chatbox-border-primary-outline);
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  transition: all 0.15s ease;
}

.chatbox-checkbox-icon {
  opacity: 0;
  color: var(--mantine-color-chatbox-primary-text);
  transition: opacity 0.15s ease;
}

.chatbox-checkbox:checked + .chatbox-checkbox-indicator {
  background: var(--mantine-color-chatbox-brand-filled);
  border-color: var(--mantine-color-chatbox-brand-filled);
}

.chatbox-checkbox:checked + .chatbox-checkbox-indicator .chatbox-checkbox-icon {
  opacity: 1;
}

.chatbox-checkbox-content {
  flex: 1;
}

.chatbox-checkbox-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--mantine-color-chatbox-primary-text);
  margin-bottom: 0.25rem;
}

.chatbox-checkbox-description {
  font-size: 0.75rem;
  color: var(--mantine-color-chatbox-secondary-text);
}

/* Range Input */
.range-input-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.chatbox-range {
  flex: 1;
  height: 4px;
  background: var(--mantine-color-chatbox-border-primary-outline);
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;
}

.chatbox-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--mantine-color-chatbox-brand-filled);
  cursor: pointer;
  transition: all 0.15s ease;
}

.chatbox-range::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
}

.range-value {
  min-width: 2rem;
  text-align: center;
  font-weight: 600;
  color: var(--mantine-color-chatbox-brand-filled);
}

/* Select Input */
.chatbox-select-wrapper {
  position: relative;
  display: inline-block;
  width: 100%;
}

.chatbox-select {
  width: 100%;
  padding: 0.5rem 2rem 0.5rem 0.75rem;
  background: var(--mantine-color-chatbox-bg-secondary);
  border: 1px solid var(--mantine-color-chatbox-border-primary-outline);
  border-radius: 0.375rem;
  color: var(--mantine-color-chatbox-primary-text);
  font-size: 0.875rem;
  appearance: none;
  cursor: pointer;
}

.chatbox-select:focus {
  outline: none;
  border-color: var(--mantine-color-chatbox-brand-filled);
}

.chatbox-select-chevron {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--mantine-color-chatbox-secondary-text);
}

/* System Info */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.info-item {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--mantine-color-chatbox-border-primary-outline);
  border-radius: 0.5rem;
}

.info-label {
  font-size: 0.75rem;
  color: var(--mantine-color-chatbox-secondary-text);
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--mantine-color-chatbox-primary-text);
  font-family: monospace;
}

.system-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* Button Styles */
.chatbox-button-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  background: var(--mantine-color-chatbox-bg-secondary);
  color: var(--mantine-color-chatbox-primary-text);
  border: 1px solid var(--mantine-color-chatbox-border-primary-outline);
  white-space: nowrap;
}

.chatbox-button-secondary:hover {
  background: var(--mantine-color-chatbox-brand-outline-hover);
}

/* Utility Classes */
.flex {
  display: flex;
}

.gap-2 {
  gap: 0.5rem;
}
</style>