<template>
  <div class="chatbox-plugins-panel">
    <h1
      style="
        color: var(--mantine-color-chatbox-primary-text);
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 1.5rem;
      "
    >
      插件管理
    </h1>

    <div class="settings-group">
      <!-- Plugin Controls -->
      <div class="settings-section">
        <h2>插件控制</h2>

        <div class="chatbox-settings-grid">
          <!-- Enable Plugins -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="pluginSettings.enabled"
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
                <div class="chatbox-checkbox-label">启用插件系统</div>
                <div class="chatbox-checkbox-description">
                  允许安装和运行第三方插件扩展功能
                </div>
              </div>
            </label>
          </div>

          <!-- Auto Update -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="pluginSettings.autoUpdate"
                  type="checkbox"
                  class="chatbox-checkbox"
                  :disabled="!pluginSettings.enabled"
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
                <div class="chatbox-checkbox-label">自动更新插件</div>
                <div class="chatbox-checkbox-description">
                  自动检查并安装插件更新
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Installed Plugins -->
      <div class="settings-section">
        <div class="flex justify-between items-center mb-4">
          <h2 class="mb-0">已安装插件</h2>
          <button @click="installPlugin" class="chatbox-button-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14m-7-7h14"></path>
            </svg>
            安装插件
          </button>
        </div>

        <div v-if="installedPlugins.length === 0" class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <rect x="9" y="9" width="6" height="6"></rect>
          </svg>
          <h3>暂无已安装插件</h3>
          <p>点击上方"安装插件"按钮来添加新插件</p>
        </div>

        <div v-else class="plugins-grid">
          <div
            v-for="plugin in installedPlugins"
            :key="plugin.id"
            class="plugin-card"
          >
            <div class="plugin-header">
              <div class="plugin-icon">
                <img v-if="plugin.icon" :src="plugin.icon" :alt="plugin.name" />
                <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <rect x="9" y="9" width="6" height="6"></rect>
                </svg>
              </div>
              <div class="plugin-info">
                <h4>{{ plugin.name }}</h4>
                <p>v{{ plugin.version }} · {{ plugin.author }}</p>
              </div>
              <div class="plugin-toggle">
                <label class="switch">
                  <input
                    v-model="plugin.enabled"
                    type="checkbox"
                    @change="togglePlugin(plugin)"
                  />
                  <span class="slider"></span>
                </label>
              </div>
            </div>
            <div class="plugin-description">
              {{ plugin.description }}
            </div>
            <div class="plugin-actions">
              <button @click="configurePlugin(plugin)" class="chatbox-button-secondary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 15a3 3 0 100-6 3 3 0 000 6z"></path>
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"></path>
                </svg>
                设置
              </button>
              <button @click="uninstallPlugin(plugin)" class="chatbox-button-danger">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                </svg>
                卸载
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Plugin Sources -->
      <div class="settings-section">
        <h2>插件源</h2>

        <div class="chatbox-settings-grid">
          <div class="chatbox-settings-item">
            <label class="chatbox-label">官方插件源</label>
            <div class="source-list">
              <div v-for="source in pluginSources" :key="source.url" class="source-item">
                <div class="source-info">
                  <div class="source-name">{{ source.name }}</div>
                  <div class="source-url">{{ source.url }}</div>
                </div>
                <label class="switch">
                  <input
                    v-model="source.enabled"
                    type="checkbox"
                    @change="toggleSource(source)"
                  />
                  <span class="slider"></span>
                </label>
              </div>
            </div>
          </div>

          <div class="chatbox-settings-item">
            <label class="chatbox-label">添加自定义源</label>
            <div class="chatbox-input-wrapper">
              <input
                v-model="newSourceUrl"
                type="url"
                class="chatbox-input"
                placeholder="https://example.com/plugins.json"
              />
              <button @click="addCustomSource" class="chatbox-button-secondary">
                添加
              </button>
            </div>
            <p class="chatbox-description">添加第三方插件源URL</p>
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

interface Plugin {
  id: string
  name: string
  version: string
  author: string
  description: string
  icon?: string
  enabled: boolean
}

interface PluginSource {
  name: string
  url: string
  enabled: boolean
}

interface PluginSettings {
  enabled: boolean
  autoUpdate: boolean
}

const pluginSettings = ref<PluginSettings>({
  enabled: false,
  autoUpdate: true
})

const installedPlugins = ref<Plugin[]>([
  {
    id: 'weather-plugin',
    name: '天气查询',
    version: '1.2.0',
    author: 'MiaoDa Team',
    description: '为AI助手添加实时天气查询功能',
    enabled: true
  },
  {
    id: 'translator-plugin',
    name: '多语言翻译',
    version: '2.1.0',
    author: 'MiaoDa Team',
    description: '支持50+语言的智能翻译插件',
    enabled: false
  }
])

const pluginSources = ref<PluginSource[]>([
  {
    name: 'MiaoDa 官方插件源',
    url: 'https://plugins.miaoda.com/registry.json',
    enabled: true
  },
  {
    name: '社区插件源',
    url: 'https://community.miaoda.com/plugins.json',
    enabled: false
  }
])

const newSourceUrl = ref('')

const installPlugin = async () => {
  try {
    if (window.api?.plugins?.showInstallDialog) {
      const result = await window.api.plugins.showInstallDialog()
      if (result.success) {
        showToast(`插件 ${result.name} 安装成功`, 'success')
        // Refresh plugin list
        loadPlugins()
      }
    } else {
      showToast('插件安装功能暂不可用', 'warning')
    }
  } catch (error) {
    console.error('Failed to install plugin:', error)
    showToast('插件安装失败', 'error')
  }
}

const togglePlugin = async (plugin: Plugin) => {
  try {
    if (window.api?.plugins?.togglePlugin) {
      const result = await window.api.plugins.togglePlugin(plugin.id, plugin.enabled)
      if (result.success) {
        showToast(`插件 ${plugin.name} 已${plugin.enabled ? '启用' : '禁用'}`, 'success')
      } else {
        plugin.enabled = !plugin.enabled // Revert on failure
        showToast('插件状态切换失败', 'error')
      }
    } else {
      showToast(`插件 ${plugin.name} 已${plugin.enabled ? '启用' : '禁用'}`, 'info')
    }
  } catch (error) {
    console.error('Failed to toggle plugin:', error)
    plugin.enabled = !plugin.enabled // Revert on failure
    showToast('插件状态切换失败', 'error')
  }
}

const configurePlugin = (plugin: Plugin) => {
  showToast(`打开 ${plugin.name} 配置页面`, 'info')
}

const uninstallPlugin = async (plugin: Plugin) => {
  if (confirm(`确定要卸载插件"${plugin.name}"吗？`)) {
    try {
      if (window.api?.plugins?.uninstallPlugin) {
        const result = await window.api.plugins.uninstallPlugin(plugin.id)
        if (result.success) {
          const index = installedPlugins.value.findIndex(p => p.id === plugin.id)
          if (index > -1) {
            installedPlugins.value.splice(index, 1)
          }
          showToast(`插件 ${plugin.name} 已卸载`, 'success')
        } else {
          showToast('插件卸载失败', 'error')
        }
      } else {
        // Mock removal for demo
        const index = installedPlugins.value.findIndex(p => p.id === plugin.id)
        if (index > -1) {
          installedPlugins.value.splice(index, 1)
        }
        showToast(`插件 ${plugin.name} 已卸载`, 'success')
      }
    } catch (error) {
      console.error('Failed to uninstall plugin:', error)
      showToast('插件卸载失败', 'error')
    }
  }
}

const toggleSource = (source: PluginSource) => {
  showToast(`插件源 ${source.name} 已${source.enabled ? '启用' : '禁用'}`, 'success')
}

const addCustomSource = () => {
  if (!newSourceUrl.value) {
    showToast('请输入有效的插件源URL', 'warning')
    return
  }

  try {
    new URL(newSourceUrl.value) // Validate URL
    pluginSources.value.push({
      name: `自定义源 ${pluginSources.value.length + 1}`,
      url: newSourceUrl.value,
      enabled: true
    })
    newSourceUrl.value = ''
    showToast('自定义插件源已添加', 'success')
  } catch (error) {
    showToast('请输入有效的URL格式', 'error')
  }
}

const loadPlugins = async () => {
  try {
    if (window.api?.plugins?.getInstalledPlugins) {
      const plugins = await window.api.plugins.getInstalledPlugins()
      installedPlugins.value = plugins
    }
  } catch (error) {
    console.error('Failed to load plugins:', error)
  }
}

const saveSettings = () => {
  localStorage.setItem('pluginSettings', JSON.stringify(pluginSettings.value))
  localStorage.setItem('pluginSources', JSON.stringify(pluginSources.value))
}

// Load settings on mount
onMounted(() => {
  const savedSettings = localStorage.getItem('pluginSettings')
  if (savedSettings) {
    try {
      pluginSettings.value = JSON.parse(savedSettings)
    } catch (error) {
      console.error('Failed to load plugin settings:', error)
    }
  }

  const savedSources = localStorage.getItem('pluginSources')
  if (savedSources) {
    try {
      pluginSources.value = JSON.parse(savedSources)
    } catch (error) {
      console.error('Failed to load plugin sources:', error)
    }
  }

  loadPlugins()
})

// Auto-save when settings change
import { watch } from 'vue'
watch([pluginSettings, pluginSources], saveSettings, { deep: true })
</script>

<style scoped>
.chatbox-plugins-panel {
  padding: var(--mantine-spacing-md);
  max-width: 60rem;
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

.chatbox-checkbox:disabled + .chatbox-checkbox-indicator {
  opacity: 0.5;
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

/* Plugin Card */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--mantine-color-chatbox-secondary-text);
}

.empty-state svg {
  margin: 0 auto 1rem;
  opacity: 0.5;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  color: var(--mantine-color-chatbox-primary-text);
}

.plugins-grid {
  display: grid;
  gap: 1rem;
}

.plugin-card {
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--mantine-color-chatbox-border-primary-outline);
  border-radius: 0.5rem;
  transition: all 0.15s ease;
}

.plugin-card:hover {
  background: rgba(255, 255, 255, 0.04);
}

.plugin-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.plugin-icon {
  width: 3rem;
  height: 3rem;
  background: var(--mantine-color-chatbox-bg-secondary);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.plugin-icon img {
  width: 2rem;
  height: 2rem;
  object-fit: contain;
}

.plugin-info {
  flex: 1;
}

.plugin-info h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--mantine-color-chatbox-primary-text);
}

.plugin-info p {
  margin: 0;
  font-size: 0.75rem;
  color: var(--mantine-color-chatbox-secondary-text);
}

.plugin-description {
  color: var(--mantine-color-chatbox-secondary-text);
  font-size: 0.875rem;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.plugin-actions {
  display: flex;
  gap: 0.5rem;
}

/* Switch Styles */
.switch {
  position: relative;
  display: inline-block;
  width: 3rem;
  height: 1.5rem;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--mantine-color-chatbox-bg-secondary);
  transition: 0.3s;
  border-radius: 1.5rem;
  border: 1px solid var(--mantine-color-chatbox-border-primary-outline);
}

.slider:before {
  position: absolute;
  content: "";
  height: 1rem;
  width: 1rem;
  left: 0.125rem;
  bottom: 0.125rem;
  background-color: var(--mantine-color-chatbox-secondary-text);
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--mantine-color-chatbox-brand-filled);
  border-color: var(--mantine-color-chatbox-brand-filled);
}

input:checked + .slider:before {
  transform: translateX(1.5rem);
  background-color: white;
}

/* Source List */
.source-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.source-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--mantine-color-chatbox-border-primary-outline);
  border-radius: 0.5rem;
}

.source-info {
  flex: 1;
}

.source-name {
  font-weight: 500;
  color: var(--mantine-color-chatbox-primary-text);
  margin-bottom: 0.25rem;
}

.source-url {
  font-size: 0.75rem;
  color: var(--mantine-color-chatbox-secondary-text);
  font-family: monospace;
}

/* Input and Button Styles */
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

.chatbox-button-primary,
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
  white-space: nowrap;
}

.chatbox-button-primary {
  background: var(--mantine-color-chatbox-brand-filled);
  color: white;
}

.chatbox-button-primary:hover {
  background: var(--mantine-color-chatbox-brand-filled-hover);
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

/* Utility Classes */
.flex {
  display: flex;
}

.justify-between {
  justify-content: space-between;
}

.items-center {
  align-items: center;
}

.mb-0 {
  margin-bottom: 0;
}

.mb-4 {
  margin-bottom: 1rem;
}
</style>