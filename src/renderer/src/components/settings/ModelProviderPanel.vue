<template>
  <div class="model-provider-panel">
    <!-- Split Layout -->
    <div class="provider-layout">
      <!-- Left Sidebar - Provider List -->
      <div class="provider-sidebar">
        <div 
          v-for="provider in providers" 
          :key="provider.id"
          class="provider-item"
          :class="{ active: selectedProvider === provider.id }"
          @click="selectProvider(provider.id)"
        >
          <div class="provider-icon">
            <span class="provider-emoji">{{ provider.emoji }}</span>
          </div>
          <div class="provider-info">
            <div class="provider-name">{{ provider.name }}</div>
            <div class="provider-subtitle">{{ provider.subtitle }}</div>
          </div>
          <div v-if="provider.configured" class="provider-status">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" fill="#10b981"/>
              <path d="M5 8l2 2 4-4" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Right Content - Provider Configuration -->
      <div class="provider-content">
        <div class="provider-header">
          <h2>{{ currentProvider?.name || '选择提供商' }}</h2>
          <p class="provider-description">{{ currentProvider?.description || '从左侧选择一个模型提供商' }}</p>
        </div>

        <div class="provider-config">
          <!-- MiaoChat Built-in Provider -->
          <div v-if="selectedProvider === 'miaochat'" class="config-section">
            <div class="config-notice">
              <div class="notice-icon">🎉</div>
              <div class="notice-content">
                <h3>内置智能助手</h3>
                <p>MiaoChat 已预配置完毕，无需额外设置即可使用。提供强大的对话能力、视觉识别和工具调用功能。</p>
              </div>
            </div>
            
            <div class="model-list">
              <h3 class="section-title">可用模型</h3>
              <div class="model-item selected">
                <div class="model-info">
                  <span class="model-name">MiaoChat</span>
                  <span class="model-version">Latest</span>
                </div>
                <div class="model-capabilities">
                  <span class="capability" title="支持视觉识别">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.5"/>
                      <circle cx="7" cy="7" r="2" fill="currentColor"/>
                    </svg>
                  </span>
                  <span class="capability" title="支持工具调用">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M9 2L12 5L5 12L2 13L3 10L10 3L9 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
                    </svg>
                  </span>
                  <span class="capability" title="支持推理">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 2v10M2 7h10M4 4l6 6M10 4L4 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                  </span>
                  <span class="context-info">200K</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Other Providers Configuration -->
          <div v-else-if="selectedProvider && selectedProvider !== 'local' && providerConfigs[selectedProvider]" class="config-section">
            <!-- API Key Section -->
            <div class="config-group">
              <h3 class="section-title">API 密钥</h3>
              <div class="input-group">
                <div class="input-wrapper">
                  <input
                    v-model="providerConfigs[selectedProvider].apiKey"
                    :type="showApiKey ? 'text' : 'password'"
                    :placeholder="getApiKeyPlaceholder()"
                    class="config-input"
                  />
                  <button @click="showApiKey = !showApiKey" class="input-action">
                    <component :is="showApiKey ? EyeOff : Eye" :size="16" />
                  </button>
                </div>
                <p class="input-hint">{{ getApiKeyDescription() }}</p>
              </div>
            </div>

            <!-- API Host Section -->
            <div class="config-group">
              <h3 class="section-title">API 主机</h3>
              <div class="input-group">
                <input
                  v-model="providerConfigs[selectedProvider].host"
                  type="text"
                  :placeholder="getEndpointPlaceholder()"
                  class="config-input"
                />
                <p class="input-hint">API服务器地址，通常使用默认值</p>
              </div>
            </div>

            <!-- Model List Section -->
            <div class="config-group">
              <h3 class="section-title">模型列表</h3>
              <div class="model-list">
                <div 
                  v-for="model in getProviderModels()"
                  :key="model.id"
                  class="model-item"
                  :class="{ selected: providerConfigs[selectedProvider].model === model.id }"
                  @click="selectModel(model.id)"
                >
                  <div class="model-info">
                    <span class="model-name">{{ model.name }}</span>
                    <span class="model-version">{{ model.version }}</span>
                  </div>
                  <div class="model-capabilities">
                    <span v-if="model.vision" class="capability" title="支持视觉识别">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.5"/>
                        <circle cx="7" cy="7" r="2" fill="currentColor"/>
                      </svg>
                    </span>
                    <span v-if="model.tools" class="capability" title="支持工具调用">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M9 2L12 5L5 12L2 13L3 10L10 3L9 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
                      </svg>
                    </span>
                    <span v-if="model.reasoning" class="capability" title="支持推理">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M7 2v10M2 7h10M4 4l6 6M10 4L4 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                      </svg>
                    </span>
                    <span v-if="model.context" class="context-info">{{ model.context }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Ollama Local Configuration -->
          <div v-else-if="selectedProvider === 'ollama' || selectedProvider === 'local'" class="config-section">
            <div class="config-group">
              <h3 class="section-title">Ollama 服务器</h3>
              <div class="input-group">
                <input
                  v-model="providerConfigs[selectedProvider] ? providerConfigs[selectedProvider].host : ''"
                  type="text"
                  placeholder="http://localhost:11434"
                  class="config-input"
                />
                <p class="input-hint">Ollama服务器地址，默认为本地11434端口</p>
              </div>
            </div>

            <div class="config-group">
              <h3 class="section-title">本地模型</h3>
              <div v-if="localModels.length === 0" class="empty-state">
                <p>未检测到本地模型</p>
                <button @click="refreshLocalModels" :disabled="isRefreshing" class="refresh-btn">
                  <RefreshCw :size="16" :class="{ 'animate-spin': isRefreshing }" />
                  {{ isRefreshing ? '检测中...' : '刷新模型列表' }}
                </button>
              </div>
              <div v-else class="model-list">
                <div
                  v-for="model in localModels"
                  :key="model.name"
                  class="model-item"
                  :class="{ selected: providerConfigs[selectedProvider] && providerConfigs[selectedProvider].model === model.name }"
                  @click="selectModel(model.name)"
                >
                  <div class="model-info">
                    <span class="model-name">{{ model.name }}</span>
                    <span class="model-size">{{ model.size }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Model Parameters (for all providers) -->
          <div v-if="selectedProvider" class="config-section parameters-section">
            <h3 class="section-title">模型参数</h3>
            
            <div class="parameter-group">
              <label class="parameter-label">
                <span>Temperature</span>
                <span class="parameter-value">{{ settingsStore.temperature }}</span>
              </label>
              <div class="slider-wrapper">
                <span class="slider-label">保守</span>
                <input
                  v-model.number="settingsStore.temperature"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  class="parameter-slider"
                />
                <span class="slider-label">创意</span>
              </div>
            </div>

            <div class="parameter-group">
              <label class="parameter-label">
                <span>最大令牌数</span>
                <span class="parameter-value">{{ settingsStore.maxTokens }}</span>
              </label>
              <div class="slider-wrapper">
                <span class="slider-label">短</span>
                <input
                  v-model.number="settingsStore.maxTokens"
                  type="range"
                  min="256"
                  max="8192"
                  step="256"
                  class="parameter-slider"
                />
                <span class="slider-label">长</span>
              </div>
            </div>

            <div class="parameter-group">
              <label class="checkbox-label">
                <input
                  v-model="settingsStore.streamingEnabled"
                  type="checkbox"
                  class="parameter-checkbox"
                />
                <span>启用流式回答</span>
              </label>
              <p class="parameter-hint">实时显示AI的回答内容</p>
            </div>
          </div>

          <!-- Save Button -->
          <div v-if="selectedProvider" class="config-actions">
            <button @click="saveConfiguration" class="save-btn">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M5 8l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              保存配置
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useToastStore } from '@/stores/toast'
import { Eye, EyeOff, RefreshCw } from 'lucide-vue-next'
import { providers as providerList } from '@/config/providers'

const settingsStore = useSettingsStore()
const toastStore = useToastStore()

// Transform providers from config to UI format
const providers = ref(providerList.map(provider => ({
  id: provider.id,
  name: provider.name,
  emoji: provider.emoji || '🤖',
  subtitle: provider.models.length > 0 
    ? provider.models.slice(0, 2).map(m => m.name).join(', ') 
    : provider.description,
  description: provider.description || `${provider.name}模型服务`,
  configured: provider.configured || false,
  apiKeyRequired: provider.apiKeyRequired,
  baseURL: provider.baseURL,
  customizable: provider.customizable,
  models: provider.models
})))

// Local state
const selectedProvider = ref('miaochat')
const showApiKey = ref(false)
const isRefreshing = ref(false)
const localModels = ref<Array<{ name: string; size: string }>>([])

// Provider configurations - 初始化所有provider的配置
const providerConfigs = ref({})

// 初始化所有provider的默认配置
const initProviderConfigs = () => {
  providerList.forEach(provider => {
    if (!providerConfigs.value[provider.id]) {
      providerConfigs.value[provider.id] = {
        apiKey: '',
        host: provider.baseURL || '',
        model: provider.models?.[0]?.id || ''
      }
    }
  })
}

// Computed
const currentProvider = computed(() => {
  return providers.value.find(p => p.id === selectedProvider.value)
})

// Methods
const selectProvider = (providerId: string) => {
  selectedProvider.value = providerId
  
  // 确保该provider有配置对象
  if (!providerConfigs.value[providerId]) {
    const provider = providerList.find(p => p.id === providerId)
    providerConfigs.value[providerId] = {
      apiKey: '',
      host: provider?.baseURL || '',
      model: provider?.models?.[0]?.id || ''
    }
  }
  
  settingsStore.setLLMProvider(providerId)
}

const selectModel = (modelId: string) => {
  if (selectedProvider.value && providerConfigs.value[selectedProvider.value]) {
    providerConfigs.value[selectedProvider.value].model = modelId
    settingsStore.setModelName(modelId)
  }
}

const getApiKeyPlaceholder = () => {
  const placeholders = {
    openai: 'sk-...',
    anthropic: 'sk-ant-...',
    google: 'AIza...'
  }
  return placeholders[selectedProvider.value as keyof typeof placeholders] || ''
}

const getApiKeyDescription = () => {
  const descriptions = {
    openai: '从 OpenAI 官网获取的 API 密钥',
    anthropic: '从 Anthropic 官网获取的 API 密钥',
    google: '从 Google Cloud 获取的 API 密钥'
  }
  return descriptions[selectedProvider.value as keyof typeof descriptions] || ''
}

const getEndpointPlaceholder = () => {
  const placeholders = {
    openai: 'https://api.openai.com/v1',
    anthropic: 'https://api.anthropic.com',
    google: 'https://generativelanguage.googleapis.com'
  }
  return placeholders[selectedProvider.value as keyof typeof placeholders] || ''
}

const getProviderModels = () => {
  const provider = providers.value.find(p => p.id === selectedProvider.value)
  if (!provider || !provider.models) return []
  
  return provider.models.map(model => ({
    id: model.id,
    name: model.name,
    version: model.version || 'Latest',
    vision: model.vision || false,
    tools: model.tools || false,
    reasoning: model.reasoning || false,
    context: model.contextWindow ? `${Math.floor(model.contextWindow / 1000)}K` : undefined
  }))
}

const refreshLocalModels = async () => {
  if (isRefreshing.value) return
  
  isRefreshing.value = true
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    localModels.value = [
      { name: 'llama2', size: '3.8GB' },
      { name: 'codellama', size: '3.8GB' },
      { name: 'mistral', size: '4.1GB' }
    ]
  } finally {
    isRefreshing.value = false
  }
}

const saveConfiguration = () => {
  // Save settings based on selected provider
  if (selectedProvider.value === 'miaochat') {
    settingsStore.setLLMProvider('miaochat')
    settingsStore.setModelName('miaochat')
  } else if (selectedProvider.value && providerConfigs.value[selectedProvider.value]) {
    const config = providerConfigs.value[selectedProvider.value]
    settingsStore.setLLMProvider(selectedProvider.value)
    settingsStore.setApiKey(config.apiKey)
    settingsStore.setApiEndpoint(config.host)
    settingsStore.setModelName(config.model)
  }
  
  toastStore.showSuccess('配置已保存')
}

// Initialize
onMounted(() => {
  // 初始化所有provider配置
  initProviderConfigs()
  
  // Set MiaoChat as default selected
  selectedProvider.value = settingsStore.llmProvider || 'miaochat'
  
  // Load existing configurations
  if (settingsStore.apiKey) {
    const provider = settingsStore.llmProvider
    if (provider && providerConfigs.value[provider]) {
      providerConfigs.value[provider].apiKey = settingsStore.apiKey
      providerConfigs.value[provider].host = settingsStore.apiEndpoint
      providerConfigs.value[provider].model = settingsStore.modelName
    }
  }
})
</script>

<style scoped>
.model-provider-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.provider-layout {
  display: flex;
  height: 100%;
  background: var(--chatbox-bg-primary, #101014);
}

/* Left Sidebar */
.provider-sidebar {
  width: 240px;
  background: var(--chatbox-bg-secondary, #1a1a1e);
  border-right: 1px solid var(--chatbox-border, rgba(255, 255, 255, 0.1));
  padding: 12px 8px;
  overflow-y: auto;
}

.provider-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  margin-bottom: 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
}

.provider-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.provider-item.active {
  background: var(--chatbox-accent-light, rgba(59, 130, 246, 0.1));
  border: 1px solid var(--chatbox-accent, #3b82f6);
}

.provider-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

.provider-emoji {
  font-size: 18px;
}

.provider-info {
  flex: 1;
}

.provider-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--chatbox-text-primary, #ffffff);
  margin-bottom: 2px;
}

.provider-subtitle {
  font-size: 11px;
  color: var(--chatbox-text-secondary, rgba(255, 255, 255, 0.6));
}

.provider-status {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
}

/* Right Content */
.provider-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.provider-header {
  margin-bottom: 24px;
}

.provider-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--chatbox-text-primary, #ffffff);
  margin: 0 0 8px 0;
}

.provider-description {
  font-size: 13px;
  color: var(--chatbox-text-secondary, rgba(255, 255, 255, 0.6));
  margin: 0;
}

/* Configuration Sections */
.config-section {
  margin-bottom: 32px;
}

.config-notice {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1));
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 12px;
  margin-bottom: 24px;
}

.notice-icon {
  font-size: 32px;
}

.notice-content h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--chatbox-text-primary, #ffffff);
  margin: 0 0 8px 0;
}

.notice-content p {
  font-size: 13px;
  color: var(--chatbox-text-secondary, rgba(255, 255, 255, 0.8));
  margin: 0;
  line-height: 1.5;
}

/* Configuration Groups */
.config-group {
  margin-bottom: 24px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--chatbox-text-secondary, rgba(255, 255, 255, 0.6));
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 12px 0;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-wrapper {
  position: relative;
}

.config-input {
  width: 100%;
  max-width: 400px;
  height: 36px;
  padding: 0 40px 0 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--chatbox-border, rgba(255, 255, 255, 0.1));
  border-radius: 8px;
  color: var(--chatbox-text-primary, #ffffff);
  font-size: 13px;
  transition: all 0.15s ease;
}

.config-input:focus {
  outline: none;
  border-color: var(--chatbox-accent, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input-action {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  padding: 4px;
  background: transparent;
  border: none;
  color: var(--chatbox-text-secondary, rgba(255, 255, 255, 0.6));
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.input-action:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--chatbox-text-primary, #ffffff);
}

.input-hint {
  font-size: 11px;
  color: var(--chatbox-text-tertiary, rgba(255, 255, 255, 0.4));
  margin: 0;
}

/* Model List */
.model-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.model-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--chatbox-border, rgba(255, 255, 255, 0.1));
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.model-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
}

.model-item.selected {
  background: var(--chatbox-accent-light, rgba(59, 130, 246, 0.1));
  border-color: var(--chatbox-accent, #3b82f6);
}

.model-info {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.model-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--chatbox-text-primary, #ffffff);
}

.model-version {
  font-size: 11px;
  color: var(--chatbox-text-secondary, rgba(255, 255, 255, 0.6));
}

.model-size {
  font-size: 11px;
  color: var(--chatbox-text-tertiary, rgba(255, 255, 255, 0.4));
}

.model-capabilities {
  display: flex;
  align-items: center;
  gap: 8px;
}

.capability {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--chatbox-text-secondary, rgba(255, 255, 255, 0.6));
}

.capability:hover {
  color: var(--chatbox-accent, #3b82f6);
}

.context-info {
  font-size: 11px;
  font-weight: 600;
  color: var(--chatbox-accent, #3b82f6);
  padding: 2px 6px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 4px;
}

/* Parameters Section */
.parameters-section {
  border-top: 1px solid var(--chatbox-border, rgba(255, 255, 255, 0.1));
  padding-top: 24px;
}

.parameter-group {
  margin-bottom: 20px;
}

.parameter-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--chatbox-text-primary, #ffffff);
}

.parameter-value {
  font-weight: 600;
  color: var(--chatbox-accent, #3b82f6);
  background: rgba(59, 130, 246, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
}

.slider-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider-label {
  font-size: 11px;
  color: var(--chatbox-text-tertiary, rgba(255, 255, 255, 0.4));
}

.parameter-slider {
  flex: 1;
  height: 4px;
  background: var(--chatbox-border, rgba(255, 255, 255, 0.1));
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;
}

.parameter-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: var(--chatbox-accent, #3b82f6);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.15s ease;
}

.parameter-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.1);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--chatbox-text-primary, #ffffff);
  cursor: pointer;
}

.parameter-checkbox {
  width: 16px;
  height: 16px;
  accent-color: var(--chatbox-accent, #3b82f6);
}

.parameter-hint {
  font-size: 11px;
  color: var(--chatbox-text-tertiary, rgba(255, 255, 255, 0.4));
  margin: 4px 0 0 24px;
}

/* Actions */
.config-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 24px;
  border-top: 1px solid var(--chatbox-border, rgba(255, 255, 255, 0.1));
}

.save-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--chatbox-accent, #3b82f6);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.save-btn:hover {
  background: var(--chatbox-accent-hover, #2563eb);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 32px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
}

.empty-state p {
  font-size: 13px;
  color: var(--chatbox-text-secondary, rgba(255, 255, 255, 0.6));
  margin: 0 0 16px 0;
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: transparent;
  color: var(--chatbox-text-primary, #ffffff);
  border: 1px solid var(--chatbox-border, rgba(255, 255, 255, 0.1));
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.refresh-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Animation */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Scrollbar */
.provider-sidebar::-webkit-scrollbar,
.provider-content::-webkit-scrollbar {
  width: 6px;
}

.provider-sidebar::-webkit-scrollbar-track,
.provider-content::-webkit-scrollbar-track {
  background: transparent;
}

.provider-sidebar::-webkit-scrollbar-thumb,
.provider-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.provider-sidebar::-webkit-scrollbar-thumb:hover,
.provider-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>