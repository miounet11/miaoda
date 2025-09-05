<template>
  <div class="chatbox-general-settings-panel">
    <h1
      style="
        color: var(--mantine-color-chatbox-primary-text);
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 1.5rem;
      "
    >
      通用设置
    </h1>

    <div class="settings-group">
      <!-- Display Settings -->
      <div class="settings-section">
        <h2>显示设置</h2>

        <div class="chatbox-settings-grid">
          <!-- Language -->
          <div class="chatbox-settings-item">
            <label for="language" class="chatbox-label">语言</label>
            <div class="chatbox-select-wrapper">
              <select id="language" v-model="settings.language" class="chatbox-select">
                <option value="zh-CN">中文（简体）</option>
                <option value="zh-TW">中文（繁体）</option>
                <option value="en-US">English</option>
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
            <p class="chatbox-description">选择应用界面语言</p>
          </div>

          <!-- Theme -->
          <div class="chatbox-settings-item">
            <label for="theme" class="chatbox-label">主题</label>
            <div class="chatbox-select-wrapper">
              <select id="theme" v-model="uiStore.theme" class="chatbox-select">
                <option value="light">浅色</option>
                <option value="dark">深色</option>
                <option value="system">跟随系统</option>
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
            <p class="chatbox-description">选择应用主题外观</p>
          </div>

          <!-- Font Size -->
          <div class="chatbox-settings-item">
            <label for="font-size" class="chatbox-label">字体大小</label>
            <div class="chatbox-range-wrapper">
              <span class="chatbox-range-label">小</span>
              <input
                id="font-size"
                v-model="settingsStore.fontSize"
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
        </div>
      </div>

      <!-- Startup Page -->
      <div class="settings-section">
        <h2>启动页面</h2>

        <div class="chatbox-settings-item">
          <label class="chatbox-label">应用启动时显示</label>
          <div class="chatbox-radio-group">
            <label class="chatbox-radio-item">
              <div class="chatbox-radio-wrapper">
                <input
                  v-model="settings.startupPage"
                  type="radio"
                  value="last-chat"
                  class="chatbox-radio"
                />
                <div class="chatbox-radio-indicator"></div>
              </div>
              <span class="chatbox-radio-label">上次聊天</span>
            </label>
            <label class="chatbox-radio-item">
              <div class="chatbox-radio-wrapper">
                <input
                  v-model="settings.startupPage"
                  type="radio"
                  value="new-chat"
                  class="chatbox-radio"
                />
                <div class="chatbox-radio-indicator"></div>
              </div>
              <span class="chatbox-radio-label">新建聊天</span>
            </label>
            <label class="chatbox-radio-item">
              <div class="chatbox-radio-wrapper">
                <input
                  v-model="settings.startupPage"
                  type="radio"
                  value="chat-list"
                  class="chatbox-radio"
                />
                <div class="chatbox-radio-indicator"></div>
              </div>
              <span class="chatbox-radio-label">聊天列表</span>
            </label>
          </div>
          <p class="chatbox-description">选择应用启动时默认显示的页面</p>
        </div>
      </div>

      <!-- Network Proxy -->
      <div class="settings-section">
        <h2>网络代理</h2>

        <div class="chatbox-settings-item">
          <label for="proxy" class="chatbox-label">代理服务器</label>
          <div class="proxy-input-wrapper">
            <input
              id="proxy"
              v-model="settings.proxyServer"
              type="text"
              placeholder="http://127.0.0.1:7890"
              class="chatbox-input"
            />
            <button @click="testProxy" :disabled="isTestingProxy" class="chatbox-button-outline">
              <Wifi :size="16" />
              {{ isTestingProxy ? '测试中...' : '测试连接' }}
            </button>
          </div>
          <p class="chatbox-description">配置代理服务器地址，留空则不使用代理</p>

          <div v-if="proxyTestResult" class="mt-2">
            <div
              :class="[
                'inline-flex items-center px-3 py-1 rounded-full text-sm',
                proxyTestResult.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              ]"
            >
              <component
                :is="proxyTestResult.success ? CheckCircle : XCircle"
                :size="14"
                class="mr-2"
              />
              {{ proxyTestResult.message }}
            </div>
          </div>
        </div>
      </div>

      <!-- Data Backup -->
      <div class="settings-section">
        <h2>数据备份</h2>

        <div class="chatbox-settings-item">
          <label class="chatbox-label">备份选项</label>
          <div class="backup-options">
            <label class="chatbox-checkbox-item">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="settings.backupOptions.chats"
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
              <span class="chatbox-checkbox-label">聊天记录</span>
            </label>
            <label class="chatbox-checkbox-item">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="settings.backupOptions.settings"
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
              <span class="chatbox-checkbox-label">应用设置</span>
            </label>
            <label class="chatbox-checkbox-item">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="settings.backupOptions.customPrompts"
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
              <span class="chatbox-checkbox-label">自定义提示词</span>
            </label>
            <label class="chatbox-checkbox-item">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="settings.backupOptions.apiKeys"
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
              <span class="chatbox-checkbox-label">API 密钥（不推荐）</span>
            </label>
          </div>
          <p class="chatbox-description">选择要包含在备份中的数据类型</p>

          <div class="export-actions">
            <button @click="exportData" :disabled="isExporting" class="chatbox-button-primary">
              <Download :size="16" />
              {{ isExporting ? '导出中...' : '导出数据' }}
            </button>
            <span class="export-description"> 将数据导出为 JSON 文件 </span>
          </div>
        </div>
      </div>

      <!-- Data Restore -->
      <div class="settings-section">
        <h2>数据恢复</h2>

        <div class="chatbox-settings-item">
          <label class="chatbox-label">导入备份</label>
          <p class="chatbox-description">从之前导出的备份文件中恢复数据</p>

          <div class="import-wrapper">
            <input
              ref="fileInput"
              type="file"
              accept=".json"
              @change="handleFileSelect"
              style="display: none"
            />
            <div class="import-actions">
              <button @click="selectFile" :disabled="isImporting" class="chatbox-button-outline">
                <Upload :size="16" />
                {{ isImporting ? '导入中...' : '选择备份文件' }}
              </button>
              <span v-if="selectedFile" class="selected-file">
                {{ selectedFile.name }}
              </span>
            </div>

            <div v-if="selectedFile" class="import-confirm">
              <button @click="importData" :disabled="isImporting" class="chatbox-button-primary">
                <Upload :size="16" />
                确认导入
              </button>
              <p class="import-warning">⚠️ 导入将会覆盖当前数据，建议先备份当前数据</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Reporting -->
      <div class="settings-section">
        <h2>错误报告</h2>

        <div class="chatbox-settings-item">
          <label class="chatbox-checkbox-item-vertical">
            <div class="chatbox-checkbox-wrapper">
              <input
                id="crash-reporting"
                v-model="settingsStore.crashReporting"
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
              <span class="chatbox-checkbox-label cursor-pointer"> 自动发送崩溃报告 </span>
              <p class="chatbox-description mt-1">
                自动发送应用崩溃信息以帮助改进产品。不会包含您的聊天内容和个人信息。
              </p>
            </div>
          </label>
        </div>

        <div class="chatbox-settings-item">
          <label class="chatbox-checkbox-item-vertical">
            <div class="chatbox-checkbox-wrapper">
              <input
                id="usage-analytics"
                v-model="settingsStore.analytics"
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
              <span class="chatbox-checkbox-label cursor-pointer"> 发送匿名使用统计 </span>
              <p class="chatbox-description mt-1">
                发送匿名使用数据以帮助了解功能使用情况。所有数据都是匿名的，不包含任何个人信息。
              </p>
            </div>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useUIStore } from '@/stores/ui'
import { useToastStore } from '@/stores/toast'
import { Wifi, Download, Upload, CheckCircle, XCircle } from 'lucide-vue-next'

const settingsStore = useSettingsStore()
const uiStore = useUIStore()
const toastStore = useToastStore()

// File input ref
const fileInput = ref<HTMLInputElement>()

// Local settings state
const settings = reactive({
  language: 'zh-CN',
  startupPage: 'last-chat',
  proxyServer: '',
  backupOptions: {
    chats: true,
    settings: true,
    customPrompts: true,
    apiKeys: false
  }
})

// Loading states
const isTestingProxy = ref(false)
const isExporting = ref(false)
const isImporting = ref(false)
const selectedFile = ref<File | null>(null)

// Proxy test result
const proxyTestResult = ref<{
  success: boolean
  message: string
} | null>(null)

// Test proxy connection
const testProxy = async () => {
  if (!settings.proxyServer.trim()) {
    proxyTestResult.value = {
      success: false,
      message: '请先输入代理服务器地址'
    }
    return
  }

  isTestingProxy.value = true
  proxyTestResult.value = null

  try {
    // Simulate proxy test (replace with actual implementation)
    await new Promise(resolve => setTimeout(resolve, 2000))

    const success = Math.random() > 0.3 // 70% success rate for demo
    proxyTestResult.value = {
      success,
      message: success ? '代理连接成功' : '代理连接失败，请检查地址和端口'
    }
  } catch (error) {
    proxyTestResult.value = {
      success: false,
      message: '测试过程中发生错误'
    }
  } finally {
    isTestingProxy.value = false
  }
}

// Export data
const exportData = async () => {
  isExporting.value = true

  try {
    // Prepare data to export based on selected options
    const exportData: any = {}

    if (settings.backupOptions.chats) {
      // Add chat data (mock)
      exportData.chats = []
    }

    if (settings.backupOptions.settings) {
      exportData.settings = settingsStore.exportSettings()
    }

    if (settings.backupOptions.customPrompts) {
      exportData.customPrompts = []
    }

    if (settings.backupOptions.apiKeys) {
      // Only export if explicitly selected (not recommended)
      exportData.apiKeys = {
        // ... encrypted API keys
      }
    }

    // Create and download file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `miaoda-chat-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toastStore.showSuccess('数据已成功导出')
  } catch (error) {
    toastStore.showError('导出过程中发生错误')
  } finally {
    isExporting.value = false
  }
}

// Select file for import
const selectFile = () => {
  fileInput.value?.click()
}

// Handle file selection
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file && file.type === 'application/json') {
    selectedFile.value = file
  } else {
    toastStore.showError('请选择有效的 JSON 备份文件')
  }
}

// Import data
const importData = async () => {
  if (!selectedFile.value) return

  isImporting.value = true

  try {
    const text = await selectedFile.value.text()
    const data = JSON.parse(text)

    // Validate and import data
    if (data.settings) {
      // Import comprehensive settings
      const success = settingsStore.importSettings(JSON.stringify(data.settings))
      if (!success) {
        toastStore.showError('部分设置导入失败')
      }
    }

    if (data.chats) {
      // Import chats (implement based on your chat store structure)
    }

    if (data.customPrompts) {
      // Import custom prompts
    }

    toastStore.showSuccess('数据已成功导入')

    selectedFile.value = null
  } catch (error) {
    toastStore.showError('文件格式错误或数据损坏')
  } finally {
    isImporting.value = false
  }
}
</script>

<style scoped>
@import './chatbox-base.css';

/* ChatBox General Settings Panel - Exact Styling */
.chatbox-general-settings-panel {
  padding: var(--mantine-spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--mantine-spacing-xl);
}

.chatbox-settings-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.chatbox-settings-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.chatbox-label {
  font-size: var(--mantine-font-size-sm);
  font-weight: 500;
  color: var(--mantine-color-chatbox-primary-text);
  margin-bottom: 0.5rem;
}

.chatbox-description {
  font-size: var(--mantine-font-size-sm);
  color: var(--mantine-color-chatbox-tertiary-text);
  margin-top: 0.25rem;
}

/* Select dropdown styling */
.chatbox-select-wrapper {
  position: relative;
  display: inline-block;
  max-width: calc(20rem * var(--mantine-scale));
}

.chatbox-select {
  appearance: none;
  width: 100%;
  height: calc(2rem * var(--mantine-scale));
  padding: 0.5rem 2rem 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--mantine-color-chatbox-border-primary-outline);
  border-radius: 0.375rem;
  font-size: var(--mantine-font-size-sm);
  color: var(--mantine-color-chatbox-primary-text);
  cursor: pointer;
  transition: all 0.15s ease;
}

.chatbox-select:focus {
  outline: none;
  border-color: var(--mantine-color-chatbox-brand-filled);
  box-shadow: 0 0 0 2px var(--mantine-color-chatbox-brand-outline-hover);
}

.chatbox-select option {
  background: rgb(16, 16, 20);
  color: var(--mantine-color-chatbox-primary-text);
}

.chatbox-select-chevron {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--mantine-color-chatbox-secondary-text);
  pointer-events: none;
}

/* Range slider styling */
.chatbox-range-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
  max-width: calc(20rem * var(--mantine-scale));
}

.chatbox-range-label {
  font-size: var(--mantine-font-size-sm);
  color: var(--mantine-color-chatbox-secondary-text);
  min-width: 1rem;
}

.chatbox-range-slider {
  flex: 1;
  appearance: none;
  height: 0.375rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.1875rem;
  outline: none;
  cursor: pointer;
}

.chatbox-range-slider::-webkit-slider-thumb {
  appearance: none;
  width: 1.25rem;
  height: 1.25rem;
  background: var(--mantine-color-chatbox-brand-filled);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.15s ease;
}

.chatbox-range-slider::-webkit-slider-thumb:hover {
  background: var(--mantine-color-chatbox-brand-filled-hover);
  transform: scale(1.1);
}

.chatbox-range-slider::-moz-range-thumb {
  width: 1.25rem;
  height: 1.25rem;
  background: var(--mantine-color-chatbox-brand-filled);
  border-radius: 50%;
  border: none;
  cursor: pointer;
}

.chatbox-range-value {
  font-size: var(--mantine-font-size-sm);
  font-weight: 500;
  color: var(--mantine-color-chatbox-primary-text);
  min-width: 2.5rem;
  text-align: center;
}

/* Radio button styling */
.chatbox-radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.chatbox-radio-item {
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.chatbox-radio-item:hover .chatbox-radio-label {
  color: var(--mantine-color-chatbox-primary-text);
}

.chatbox-radio-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  margin-right: 0.75rem;
}

.chatbox-radio {
  appearance: none;
  width: 1rem;
  height: 1rem;
  border: 1px solid var(--mantine-color-chatbox-border-primary-outline);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.15s ease;
  margin: 0;
}

.chatbox-radio:checked {
  border-color: var(--mantine-color-chatbox-brand-filled);
  background: var(--mantine-color-chatbox-brand-filled);
}

.chatbox-radio-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;
  background: white;
  transform: translate(-50%, -50%) scale(0);
  transition: transform 0.15s ease;
  pointer-events: none;
}

.chatbox-radio:checked + .chatbox-radio-indicator {
  transform: translate(-50%, -50%) scale(1);
}

.chatbox-radio-label {
  font-size: var(--mantine-font-size-sm);
  color: var(--mantine-color-chatbox-secondary-text);
  transition: color 0.15s ease;
}

.chatbox-radio:checked ~ .chatbox-radio-label {
  color: var(--mantine-color-chatbox-primary-text);
}

/* Focus states for accessibility */
.chatbox-select:focus-visible,
.chatbox-range-slider:focus-visible,
.chatbox-radio:focus-visible {
  outline: 2px solid var(--mantine-color-chatbox-brand-filled);
  outline-offset: 2px;
}

/* Checkbox styling */
.chatbox-checkbox-item {
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.chatbox-checkbox-item-vertical {
  display: flex;
  align-items: flex-start;
  cursor: pointer;
  transition: all 0.15s ease;
  gap: 0.75rem;
}

.chatbox-checkbox-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  margin-right: 0.75rem;
}

.chatbox-checkbox {
  appearance: none;
  width: 1rem;
  height: 1rem;
  border: 1px solid var(--mantine-color-chatbox-border-primary-outline);
  border-radius: 0.25rem;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.15s ease;
  margin: 0;
}

.chatbox-checkbox:checked {
  border-color: var(--mantine-color-chatbox-brand-filled);
  background: var(--mantine-color-chatbox-brand-filled);
}

.chatbox-checkbox-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.chatbox-checkbox-check {
  color: white;
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.15s ease;
}

.chatbox-checkbox:checked ~ .chatbox-checkbox-indicator .chatbox-checkbox-check {
  opacity: 1;
  transform: scale(1);
}

.chatbox-checkbox-label {
  font-size: var(--mantine-font-size-sm);
  color: var(--mantine-color-chatbox-secondary-text);
  transition: color 0.15s ease;
}

.chatbox-checkbox:checked ~ .chatbox-checkbox-label,
.chatbox-checkbox-item:hover .chatbox-checkbox-label {
  color: var(--mantine-color-chatbox-primary-text);
}

/* ============== Additional Component Styling ============== */

/* Proxy input wrapper */
.proxy-input-wrapper {
  display: flex;
  align-items: center;
  gap: var(--mantine-spacing-xs);
  max-width: 100%;
}

.proxy-input-wrapper .chatbox-input {
  flex: 1;
  max-width: calc(20rem * var(--mantine-scale));
}

/* Backup options */
.backup-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

/* Export actions */
.export-actions {
  display: flex;
  align-items: center;
  gap: var(--mantine-spacing-xs);
  margin-top: var(--mantine-spacing-md);
}

.export-description {
  font-size: var(--mantine-font-size-sm);
  color: var(--mantine-color-chatbox-secondary-text);
}

/* Import wrapper */
.import-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--mantine-spacing-md);
  margin-top: 0.75rem;
}

.import-actions {
  display: flex;
  align-items: center;
  gap: var(--mantine-spacing-xs);
}

.selected-file {
  font-size: var(--mantine-font-size-sm);
  color: var(--mantine-color-chatbox-secondary-text);
}

.import-confirm {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.import-warning {
  font-size: var(--mantine-font-size-sm);
  color: #f59e0b;
  margin-top: 0.5rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .proxy-input-wrapper {
    flex-direction: column;
    align-items: stretch;
    gap: var(--mantine-spacing-md);
  }

  .export-actions,
  .import-actions {
    flex-direction: column;
    align-items: stretch;
    gap: var(--mantine-spacing-md);
  }
}
</style>
