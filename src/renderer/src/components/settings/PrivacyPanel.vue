<template>
  <div class="chatbox-privacy-panel">
    <h1
      style="
        color: var(--mantine-color-chatbox-primary-text);
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 1.5rem;
      "
    >
      隐私设置
    </h1>

    <div class="settings-group">
      <!-- Data Collection -->
      <div class="settings-section">
        <h2>数据收集</h2>

        <div class="chatbox-settings-grid">
          <!-- Analytics -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="privacySettings.analytics"
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
                <div class="chatbox-checkbox-label">启用使用统计</div>
                <div class="chatbox-checkbox-description">
                  帮助我们改进产品，发送匿名使用统计信息
                </div>
              </div>
            </label>
          </div>

          <!-- Crash Reports -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="privacySettings.crashReports"
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
                <div class="chatbox-checkbox-label">自动发送崩溃报告</div>
                <div class="chatbox-checkbox-description">
                  自动发送崩溃日志帮助我们修复问题
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Data Storage -->
      <div class="settings-section">
        <h2>数据存储</h2>

        <div class="chatbox-settings-grid">
          <!-- Local Storage -->
          <div class="chatbox-settings-item">
            <label for="storage-location" class="chatbox-label">本地存储位置</label>
            <div class="chatbox-input-wrapper">
              <input
                id="storage-location"
                v-model="privacySettings.storageLocation"
                type="text"
                readonly
                class="chatbox-input"
                placeholder="选择存储路径..."
              />
              <button @click="selectStorageLocation" class="chatbox-button-secondary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
                  <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
                  <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
                  <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
                </svg>
                选择
              </button>
            </div>
            <p class="chatbox-description">聊天记录和设置的存储位置</p>
          </div>

          <!-- Auto Delete -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="privacySettings.autoDelete"
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
                <div class="chatbox-checkbox-label">自动删除旧对话</div>
                <div class="chatbox-checkbox-description">
                  自动删除30天前的对话记录
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Data Control -->
      <div class="settings-section">
        <h2>数据管理</h2>

        <div class="chatbox-settings-grid">
          <!-- Export Data -->
          <div class="chatbox-settings-item">
            <label class="chatbox-label">导出数据</label>
            <button @click="exportData" class="chatbox-button-secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7,10 12,15 17,10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              导出所有数据
            </button>
            <p class="chatbox-description">导出所有聊天记录和设置到JSON文件</p>
          </div>

          <!-- Clear Data -->
          <div class="chatbox-settings-item">
            <label class="chatbox-label">清除数据</label>
            <div class="flex gap-2">
              <button @click="clearChatHistory" class="chatbox-button-secondary">
                清除聊天记录
              </button>
              <button @click="clearAllData" class="chatbox-button-danger">
                清除所有数据
              </button>
            </div>
            <p class="chatbox-description">永久删除聊天记录或所有应用数据</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'

const { showToast } = useToast()

interface PrivacySettings {
  analytics: boolean
  crashReports: boolean
  storageLocation: string
  autoDelete: boolean
}

const privacySettings = ref<PrivacySettings>({
  analytics: true,
  crashReports: true,
  storageLocation: '',
  autoDelete: false
})

const selectStorageLocation = async () => {
  try {
    if (window.api?.dialog?.showOpenDialog) {
      const result = await window.api.dialog.showOpenDialog({
        properties: ['openDirectory'],
        title: '选择存储位置'
      })
      
      if (!result.canceled && result.filePaths.length > 0) {
        privacySettings.value.storageLocation = result.filePaths[0]
        showToast('存储位置已更新', 'success')
      }
    } else {
      showToast('文件选择功能暂不可用', 'warning')
    }
  } catch (error) {
    console.error('Failed to select storage location:', error)
    showToast('选择存储位置失败', 'error')
  }
}

const exportData = async () => {
  try {
    if (window.api?.data?.exportData) {
      const result = await window.api.data.exportData()
      if (result.success) {
        showToast(`数据已导出到: ${result.path}`, 'success')
      } else {
        showToast('数据导出失败', 'error')
      }
    } else {
      showToast('数据导出功能暂不可用', 'warning')
    }
  } catch (error) {
    console.error('Failed to export data:', error)
    showToast('导出数据失败', 'error')
  }
}

const clearChatHistory = async () => {
  if (confirm('确定要清除所有聊天记录吗？此操作不可撤销。')) {
    try {
      if (window.api?.data?.clearChatHistory) {
        await window.api.data.clearChatHistory()
        showToast('聊天记录已清除', 'success')
      } else {
        showToast('清除功能暂不可用', 'warning')
      }
    } catch (error) {
      console.error('Failed to clear chat history:', error)
      showToast('清除聊天记录失败', 'error')
    }
  }
}

const clearAllData = async () => {
  if (confirm('确定要清除所有应用数据吗？包括聊天记录、设置等。此操作不可撤销。')) {
    try {
      if (window.api?.data?.clearAllData) {
        await window.api.data.clearAllData()
        showToast('所有数据已清除，应用将重启', 'info')
        // Restart the app
        if (window.api?.app?.restart) {
          window.api.app.restart()
        }
      } else {
        showToast('清除功能暂不可用', 'warning')
      }
    } catch (error) {
      console.error('Failed to clear all data:', error)
      showToast('清除数据失败', 'error')
    }
  }
}

const saveSettings = () => {
  localStorage.setItem('privacySettings', JSON.stringify(privacySettings.value))
  showToast('隐私设置已保存', 'success')
}

// Load settings on mount
onMounted(() => {
  const saved = localStorage.getItem('privacySettings')
  if (saved) {
    try {
      privacySettings.value = JSON.parse(saved)
    } catch (error) {
      console.error('Failed to load privacy settings:', error)
    }
  }
  
  // Get default storage location
  if (!privacySettings.value.storageLocation && window.api?.app?.getPath) {
    window.api.app.getPath('userData').then((path) => {
      privacySettings.value.storageLocation = path
    })
  }
})

// Auto-save when settings change
import { watch } from 'vue'
watch(privacySettings, saveSettings, { deep: true })
</script>

<style scoped>
.chatbox-privacy-panel {
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

/* Input Styles */
.chatbox-input-wrapper {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.chatbox-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  background: var(--mantine-color-chatbox-bg-secondary);
  border: 1px solid var(--mantine-color-chatbox-border-primary-outline);
  border-radius: 0.375rem;
  color: var(--mantine-color-chatbox-primary-text);
  font-size: 0.875rem;
  transition: border-color 0.15s ease;
}

.chatbox-input:focus {
  outline: none;
  border-color: var(--mantine-color-chatbox-brand-filled);
}

/* Button Styles */
.chatbox-button-secondary,
.chatbox-button-danger {
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
}

.chatbox-button-secondary {
  background: var(--mantine-color-chatbox-bg-secondary);
  color: var(--mantine-color-chatbox-primary-text);
  border: 1px solid var(--mantine-color-chatbox-border-primary-outline);
}

.chatbox-button-secondary:hover {
  background: var(--mantine-color-chatbox-brand-outline-hover);
}

.chatbox-button-danger {
  background: #ef4444;
  color: white;
}

.chatbox-button-danger:hover {
  background: #dc2626;
}

.flex {
  display: flex;
}

.gap-2 {
  gap: 0.5rem;
}
</style>