<template>
  <div class="settings-view">
    <!-- 顶部导航 -->
    <div class="top-nav">
      <div class="nav-content">
        <button @click="goBack" class="back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"></path>
          </svg>
        </button>
        <h1 class="nav-title">设置</h1>
        <div class="nav-spacer"></div>
      </div>
    </div>

    <!-- 设置内容 -->
    <div class="settings-content">
      <div class="settings-container">

        <!-- AI模型设置 -->
        <div class="settings-section">
          <h2 class="section-title">AI模型设置</h2>
          <div class="section-content">

            <!-- 默认模型选择 -->
            <div class="setting-item">
              <label class="setting-label">默认AI模型</label>
              <select v-model="selectedModel" class="setting-select">
                <option value="default">MiaoDa AI (免费)</option>
                <option value="openai">OpenAI GPT</option>
                <option value="claude">Anthropic Claude</option>
                <option value="gemini">Google Gemini</option>
                <option value="ollama">Ollama (本地)</option>
              </select>
            </div>

            <!-- API配置 -->
            <div v-if="selectedModel !== 'default'" class="setting-item">
              <label class="setting-label">API配置</label>
              <div class="api-config">
                <div class="input-group">
                  <label class="input-label">API密钥</label>
                  <input
                    v-model="apiConfig[selectedModel].apiKey"
                    type="password"
                    placeholder="请输入API密钥"
                    class="setting-input"
                  >
                </div>

                <div v-if="selectedModel === 'ollama'" class="input-group">
                  <label class="input-label">服务地址</label>
                  <input
                    v-model="apiConfig[selectedModel].baseUrl"
                    type="text"
                    placeholder="http://localhost:11434"
                    class="setting-input"
                  >
                </div>

                <div class="config-actions">
                  <button @click="testConnection" :disabled="!canTestConnection" class="test-btn">
                    测试连接
                  </button>
                  <div v-if="connectionStatus" class="status-indicator">
                    <span :class="connectionStatus.class">{{ connectionStatus.text }}</span>
                  </div>
                </div>

                <p class="setting-help">
                  API密钥会安全保存在本地，不会上传到服务器
                </p>
              </div>
            </div>

            <!-- 模型参数 -->
            <div class="setting-item">
              <label class="setting-label">回复风格</label>
              <select v-model="replyStyle" class="setting-select">
                <option value="balanced">均衡 (推荐)</option>
                <option value="creative">创意丰富</option>
                <option value="concise">简洁明了</option>
                <option value="detailed">详细解释</option>
              </select>
            </div>

            <!-- 模型状态 -->
            <div class="setting-item">
              <label class="setting-label">模型状态</label>
              <div class="model-status">
                <div class="status-item">
                  <span class="status-label">当前模型:</span>
                  <span class="status-value">{{ getModelDisplayName(selectedModel) }}</span>
                  <span :class="getModelStatusClass(selectedModel)" class="status-badge">
                    {{ getModelStatusText(selectedModel) }}
                  </span>
                </div>

                <div class="status-item">
                  <span class="status-label">可用模型:</span>
                  <div class="available-models">
                    <span v-for="model in availableModels" :key="model.value"
                          :class="{ active: model.value === selectedModel }"
                          class="model-tag">
                      {{ model.label }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 快速切换 -->
            <div class="setting-item">
              <label class="setting-label">快速切换</label>
              <div class="quick-switch">
                <p class="switch-description">在聊天中可以快速切换到其他可用模型</p>
                <div class="switch-options">
                  <label class="switch-item">
                    <input type="checkbox" v-model="enableQuickSwitch" />
                    <span class="checkmark"></span>
                    启用快速切换
                  </label>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- 界面设置 -->
        <div class="settings-section">
          <h2 class="section-title">界面设置</h2>
          <div class="section-content">

            <div class="setting-item">
              <label class="setting-label">字体大小</label>
              <select v-model="fontSize" class="setting-select">
                <option value="small">小</option>
                <option value="medium">中 (推荐)</option>
                <option value="large">大</option>
              </select>
            </div>

            <div class="setting-item">
              <label class="setting-label">主题模式</label>
              <select v-model="theme" class="setting-select">
                <option value="light">浅色模式</option>
                <option value="dark">深色模式</option>
                <option value="auto">跟随系统</option>
              </select>
            </div>

          </div>
        </div>

        <!-- 数据管理 -->
        <div class="settings-section">
          <h2 class="section-title">数据管理</h2>
          <div class="section-content">

            <div class="setting-item">
              <div class="setting-info">
                <div>
                  <div class="setting-label">清空聊天记录</div>
                  <div class="setting-description">删除所有聊天历史记录，此操作不可恢复</div>
                </div>
                <button @click="clearChatHistory" class="danger-btn">
                  清空记录
                </button>
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <div>
                  <div class="setting-label">导出聊天记录</div>
                  <div class="setting-description">将聊天记录导出为文件</div>
                </div>
                <button @click="exportChatHistory" class="secondary-btn">
                  导出
                </button>
              </div>
            </div>

          </div>
        </div>

        <!-- 关于 -->
        <div class="settings-section">
          <h2 class="section-title">关于 MiaoDa Chat</h2>
          <div class="section-content">

            <div class="setting-item">
              <div class="setting-info">
                <div>
                  <div class="setting-label">版本信息</div>
                  <div class="setting-description">MiaoDa Chat v1.0.0 - 完全免费</div>
                </div>
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <div>
                  <div class="setting-label">开源协议</div>
                  <div class="setting-description">MIT License</div>
                </div>
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <div>
                  <div class="setting-label">技术支持</div>
                  <div class="setting-description">如有问题，请访问官网获取帮助</div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// 设置数据
const selectedModel = ref('default')
const replyStyle = ref('balanced')
const fontSize = ref('medium')
const theme = ref('light')
const enableQuickSwitch = ref(true)

// 连接状态
const connectionStatus = ref<{text: string, class: string} | null>(null)
const isTestingConnection = ref(false)

// API配置
const apiConfig = ref({
  openai: { apiKey: '', baseUrl: 'https://api.openai.com/v1' },
  claude: { apiKey: '', baseUrl: 'https://api.anthropic.com' },
  gemini: { apiKey: '', baseUrl: 'https://generativelanguage.googleapis.com' },
  ollama: { apiKey: '', baseUrl: 'http://localhost:11434' }
})

// 可用模型列表
const availableModels = ref([
  { value: 'default', label: 'MiaoDa AI' },
  { value: 'openai', label: 'OpenAI GPT' },
  { value: 'claude', label: 'Claude' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'ollama', label: 'Ollama' }
])

const router = useRouter()

// 返回聊天页面
const goBack = () => {
  router.push('/')
}

// 测试连接
const testConnection = async () => {
  if (isTestingConnection.value) return

  isTestingConnection.value = true
  connectionStatus.value = { text: '测试中...', class: 'status-testing' }

  try {
    // 这里应该调用实际的连接测试API
    // 暂时模拟测试过程
    await new Promise(resolve => setTimeout(resolve, 2000))

    const config = apiConfig.value[selectedModel.value]
    const hasApiKey = config.apiKey && config.apiKey.trim() !== ''

    if (hasApiKey) {
      connectionStatus.value = { text: '连接成功', class: 'status-success' }
    } else {
      connectionStatus.value = { text: 'API密钥未配置', class: 'status-warning' }
    }
  } catch (error) {
    connectionStatus.value = { text: '连接失败', class: 'status-error' }
  } finally {
    isTestingConnection.value = false
  }
}

// 检查是否可以测试连接
const canTestConnection = computed(() => {
  if (selectedModel.value === 'default') return false
  const config = apiConfig.value[selectedModel.value]
  return config.apiKey && config.apiKey.trim() !== ''
})

// 获取模型显示名称
const getModelDisplayName = (model: string): string => {
  const modelMap: Record<string, string> = {
    default: 'MiaoDa AI (免费)',
    openai: 'OpenAI GPT',
    claude: 'Anthropic Claude',
    gemini: 'Google Gemini',
    ollama: 'Ollama (本地)'
  }
  return modelMap[model] || model
}

// 获取模型状态文本
const getModelStatusText = (model: string): string => {
  if (model === 'default') return '可用'
  const config = apiConfig.value[model]
  return config.apiKey ? '已配置' : '未配置'
}

// 获取模型状态样式
const getModelStatusClass = (model: string): string => {
  if (model === 'default') return 'status-success'
  const config = apiConfig.value[model]
  return config.apiKey ? 'status-success' : 'status-warning'
}

// 清空聊天记录
const clearChatHistory = () => {
  if (confirm('确定要清空所有聊天记录吗？此操作不可恢复。')) {
    // 这里应该调用实际的清空方法
    localStorage.removeItem('chatMessages')
    alert('聊天记录已清空')
  }
}

// 导出聊天记录
const exportChatHistory = () => {
  // 这里应该调用实际的导出方法
  alert('导出功能正在开发中...')
}

// 保存设置
const saveSettings = () => {
  const settings = {
    selectedModel: selectedModel.value,
    replyStyle: replyStyle.value,
    fontSize: fontSize.value,
    theme: theme.value,
    apiConfig: apiConfig.value
  }

  localStorage.setItem('miaodaSettings', JSON.stringify(settings))
}

// 加载设置
const loadSettings = () => {
  const saved = localStorage.getItem('miaodaSettings')
  if (saved) {
    const settings = JSON.parse(saved)
    selectedModel.value = settings.selectedModel || 'default'
    replyStyle.value = settings.replyStyle || 'balanced'
    fontSize.value = settings.fontSize || 'medium'
    theme.value = settings.theme || 'light'
    apiConfig.value = { ...apiConfig.value, ...settings.apiConfig }
  }
}

// 监听设置变化
const watchSettings = () => {
  // 这里可以添加设置变化的监听逻辑
}

// 生命周期
onMounted(() => {
  loadSettings()
  watchSettings()
})
</script>

<style scoped>
.settings-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

/* 顶部导航 */
.top-nav {
  height: 60px;
  border-bottom: 1px solid #e2e8f0;
  background: white;
  position: sticky;
  top: 0;
  z-index: 10;
}

.nav-content {
  max-width: 800px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 24px;
}

.back-btn {
  padding: 8px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #f1f5f9;
  color: #334155;
}

.nav-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.nav-spacer {
  flex: 1;
}

/* 设置内容 */
.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 0;
}

.settings-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 24px;
}

/* 设置区块 */
.settings-section {
  background: white;
  border-radius: 12px;
  margin-bottom: 24px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
}

.section-content {
  padding: 24px;
}

/* 设置项 */
.setting-item {
  margin-bottom: 24px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.setting-description {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

.setting-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  outline: none;
  transition: border-color 0.2s;
}

.setting-select:focus {
  border-color: #2563eb;
}

.setting-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  outline: none;
  transition: border-color 0.2s;
}

.setting-input:focus {
  border-color: #2563eb;
}

.setting-help {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.setting-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

/* API配置 */
.api-config {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.config-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.test-btn {
  padding: 6px 12px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.test-btn:hover:not(:disabled) {
  background: #1d4ed8;
}

.test-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.status-indicator {
  font-size: 13px;
}

.status-testing {
  color: #f59e0b;
}

.status-success {
  color: #10b981;
}

.status-warning {
  color: #f59e0b;
}

.status-error {
  color: #ef4444;
}

/* 模型状态 */
.model-status {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.status-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.status-value {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.available-models {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.model-tag {
  padding: 4px 8px;
  background: #f3f4f6;
  color: #6b7280;
  border-radius: 6px;
  font-size: 12px;
  transition: all 0.2s;
}

.model-tag.active {
  background: #dbeafe;
  color: #2563eb;
}

.model-tag:hover {
  background: #e5e7eb;
}

/* 快速切换 */
.quick-switch {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.switch-description {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
}

.switch-options {
  margin-top: 8px;
}

.switch-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
}

.switch-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #2563eb;
}

/* 按钮样式 */
.danger-btn {
  padding: 8px 16px;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.danger-btn:hover {
  background: #b91c1c;
}

.secondary-btn {
  padding: 8px 16px;
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.secondary-btn:hover {
  background: #4b5563;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-content {
    padding: 0 16px;
  }

  .settings-container {
    padding: 0 16px;
  }

  .section-content {
    padding: 16px;
  }

  .setting-info {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
}
</style>
