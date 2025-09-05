<template>
  <div class="provider-settings">
    <!-- Provider Sidebar -->
    <div class="provider-sidebar">
      <div class="sidebar-content">
        <a 
          v-for="provider in providers" 
          :key="provider.id"
          :href="`#${provider.id}`"
          :class="['provider-item', { active: selectedProviderId === provider.id }]"
          @click.prevent="selectProvider(provider.id)"
        >
          <span class="provider-emoji" v-if="provider.emoji">{{ provider.emoji }}</span>
          <img 
            v-else-if="provider.icon"
            :src="provider.icon" 
            :alt="provider.name"
            class="provider-icon"
            @error="handleIconError"
          >
          <span v-else class="provider-emoji">🤖</span>
          <span class="provider-name">{{ provider.name }}</span>
        </a>
      </div>
      
      <div class="sidebar-actions">
        <button class="btn-add-provider">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          <span>添加</span>
        </button>
        
        <button class="btn-import">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 3v4a1 1 0 0 0 1 1h4"/>
            <path d="M5 13v-8a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2h-5.5m-9.5 -2h7m-3 -3l3 3l-3 3"/>
          </svg>
          <span>从剪贴板导入</span>
        </button>
      </div>
    </div>
    
    <!-- Main Content -->
    <div class="provider-content" v-if="selectedProvider">
      <div class="content-section">
        <div class="section-header">
          <h3>{{ selectedProvider.name }}</h3>
          <button class="btn-external" @click="openProviderDocs">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6"/>
              <path d="M11 13l9 -9"/>
              <path d="M15 4h5v5"/>
            </svg>
          </button>
        </div>
        
        <!-- API Configuration -->
        <div class="config-group" v-if="selectedProvider.apiKeyRequired">
          <label class="config-label">API Key</label>
          <div class="input-group">
            <div class="password-input">
              <input 
                :type="showApiKey ? 'text' : 'password'"
                v-model="apiKeys[selectedProvider.id]"
                placeholder="输入你的 API Key"
                class="input-field"
              >
              <button @click="showApiKey = !showApiKey" class="btn-toggle-visibility">
                <svg v-if="!showApiKey" width="20" height="20" viewBox="0 0 15 15" fill="none">
                  <path d="M7.5 11C4.80285 11 2.52952 9.62184 1.09622 7.50001C2.52952 5.37816 4.80285 4 7.5 4C10.1971 4 12.4705 5.37816 13.9038 7.50001C12.4705 9.62183 10.1971 11 7.5 11ZM7.5 3C4.30786 3 1.65639 4.70638 0.0760002 7.23501C-0.0253338 7.39715 -0.0253334 7.60288 0.0760014 7.76501C1.65639 10.2936 4.30786 12 7.5 12C10.6921 12 13.3436 10.2936 14.924 7.76501C15.0253 7.60288 15.0253 7.39715 14.924 7.23501C13.3436 4.70638 10.6921 3 7.5 3ZM7.5 9.5C8.60457 9.5 9.5 8.60457 9.5 7.5C9.5 6.39543 8.60457 5.5 7.5 5.5C6.39543 5.5 5.5 6.39543 5.5 7.5C5.5 8.60457 6.39543 9.5 7.5 9.5Z" fill="currentColor" fill-rule="evenodd"/>
                </svg>
                <svg v-else width="20" height="20" viewBox="0 0 15 15" fill="none">
                  <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3.582-5.5-8.5-5.5a7.028 7.028 0 0 0-2.79.588l.953.953A5.466 5.466 0 0 1 7.5 3.5c2.88 0 5.25 2.016 5.854 4.479l-.896.896c-.166-.39-.437-.73-.785-1.002l1.686-1.686zM12.828 12.172L11 10.343a5.418 5.418 0 0 1-3.5 1.157c-2.88 0-5.25-2.016-5.854-4.479l.896-.896c.166.39.437.731.785 1.002L1.641 8.813l.707.707 10.98-10.98.707.707-1.207 1.207zM7.5 6.5c-.378 0-.735.088-1.055.238l2.317 2.317A2 2 0 0 0 7.5 6.5z" fill="currentColor" fill-rule="evenodd"/>
                </svg>
              </button>
            </div>
            <button 
              class="btn-check"
              :disabled="!apiKeys[selectedProvider.id]"
              @click="checkApiKey"
            >
              检查
            </button>
          </div>
        </div>
        
        <div class="config-group" v-if="selectedProvider.customizable">
          <label class="config-label">API Host</label>
          <div class="input-group">
            <input 
              v-model="apiHosts[selectedProvider.id]"
              :placeholder="selectedProvider.baseURL"
              class="input-field"
            >
          </div>
          <span class="config-hint">{{ getFullEndpoint() }}</span>
        </div>
        
        <!-- Model Management -->
        <div class="config-group">
          <div class="model-header">
            <label class="config-label">模型</label>
            <div class="model-actions">
              <button class="btn-small btn-primary" @click="addModel">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                <span>新建</span>
              </button>
              <button class="btn-small btn-secondary" @click="resetModels">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3.06 13a9 9 0 1 0 .49 -4.087"/>
                  <path d="M3 4.001v5h5"/>
                  <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/>
                </svg>
                <span>重置</span>
              </button>
              <button class="btn-small btn-secondary" @click="fetchModels">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4"/>
                  <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4"/>
                </svg>
                <span>获取</span>
              </button>
            </div>
          </div>
          
          <div class="model-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0"/>
              <path d="M21 21l-6 -6"/>
            </svg>
            <input 
              v-model="modelSearch"
              placeholder="搜索模型..."
              class="input-field"
            >
          </div>
          
          <div class="model-list">
            <div 
              v-for="model in filteredModels" 
              :key="model.id"
              class="model-item"
            >
              <span class="model-name">{{ model.name }}</span>
              
              <div class="model-badges">
                <!-- Reasoning Badge -->
                <span v-if="model.capabilities?.includes('reasoning')" class="badge badge-reasoning" title="推理模型">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 12h1m8 -9v1m8 8h1m-15.4 -6.4l.7 .7m12.1 -.7l-.7 .7"/>
                    <path d="M9 16a5 5 0 1 1 6 0a3.5 3.5 0 0 0 -1 3a2 2 0 0 1 -4 0a3.5 3.5 0 0 0 -1 -3"/>
                    <path d="M9.7 17l4.6 0"/>
                  </svg>
                </span>
                
                <!-- Vision Badge -->
                <span v-if="model.capabilities?.includes('vision')" class="badge badge-vision" title="支持图像">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"/>
                    <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6"/>
                  </svg>
                </span>
                
                <!-- Tools Badge -->
                <span v-if="model.capabilities?.includes('tools')" class="badge badge-tools" title="支持工具调用">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M7 10h3v-3l-3.5 -3.5a6 6 0 0 1 8 8l6 6a2 2 0 0 1 -3 3l-6 -6a6 6 0 0 1 -8 -8l3.5 3.5"/>
                  </svg>
                </span>
                
                <!-- Realtime Badge -->
                <span v-if="model.capabilities?.includes('realtime')" class="badge badge-realtime" title="实时模型">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M13 2l0 6l6 0"/>
                  </svg>
                </span>
                
                <!-- Embedding Badge -->
                <div v-if="model.type === 'embedding'" class="model-type-badge">
                  Embedding
                </div>
              </div>
              
              <div class="model-actions">
                <button class="btn-icon" @click="editModel(model)">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z"/>
                    <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"/>
                  </svg>
                </button>
                <button class="btn-icon btn-danger" @click="removeModel(model)">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/>
                    <path d="M9 12h6"/>
                  </svg>
                </button>
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
import { providers, type Provider, type Model } from '../config/providers'
import { useToast } from '@/composables/useToast'

const { showToast } = useToast()

// State
const selectedProviderId = ref('openai')
const showApiKey = ref(false)
const modelSearch = ref('')
const apiKeys = ref<Record<string, string>>({})
const apiHosts = ref<Record<string, string>>({})
const customModels = ref<Record<string, Model[]>>({})

// Computed
const selectedProvider = computed(() => {
  return providers.find(p => p.id === selectedProviderId.value)
})

const filteredModels = computed(() => {
  const provider = selectedProvider.value
  if (!provider) return []
  
  const models = customModels.value[provider.id] || provider.models
  
  if (!modelSearch.value) return models
  
  const search = modelSearch.value.toLowerCase()
  return models.filter(m => 
    m.id.toLowerCase().includes(search) || 
    m.name.toLowerCase().includes(search)
  )
})

// Methods
const selectProvider = (providerId: string) => {
  selectedProviderId.value = providerId
  modelSearch.value = ''
}

const handleIconError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.src = '/assets/images/default-provider.png'
}

const getFullEndpoint = () => {
  const provider = selectedProvider.value
  if (!provider) return ''
  
  const host = apiHosts.value[provider.id] || provider.baseURL
  if (!host) return ''
  
  if (provider.id === 'openai') {
    return `${host}/v1/chat/completions`
  }
  
  return host
}

const checkApiKey = async () => {
  const provider = selectedProvider.value
  if (!provider) return
  
  const apiKey = apiKeys.value[provider.id]
  if (!apiKey) {
    showToast('请先输入 API Key', 'warning')
    return
  }
  
  try {
    // Call backend API verification
    if (window.api?.providers?.verifyApiKey) {
      const isValid = await window.api.providers.verifyApiKey(provider.id, apiKey)
      if (isValid) {
        showToast('API Key 验证成功！', 'success')
        // Save valid API key
        saveSettings()
      } else {
        showToast('API Key 验证失败，请检查密钥是否正确', 'error')
      }
    } else {
      // Simple validation fallback
      if (apiKey.length > 20) {
        showToast('API Key 格式正确（未连接验证服务）', 'info')
        saveSettings()
      } else {
        showToast('API Key 格式不正确，请检查长度', 'error')
      }
    }
  } catch (error) {
    console.error('API key verification failed:', error)
    showToast('验证失败：' + error.message, 'error')
  }
}

const addModel = () => {
  const provider = selectedProvider.value
  if (!provider) return
  
  // Create a basic custom model template
  const modelId = `custom-${Date.now()}`
  const newModel: Model = {
    id: modelId,
    name: '自定义模型',
    description: '用户自定义的模型配置',
    type: 'chat',
    capabilities: [],
    contextWindow: 4096
  }
  
  // Add to custom models
  if (!customModels.value[provider.id]) {
    customModels.value[provider.id] = [...provider.models]
  }
  customModels.value[provider.id].push(newModel)
  
  showToast(`已添加自定义模型到 ${provider.name}`, 'success')
}

const resetModels = () => {
  const provider = selectedProvider.value
  if (!provider) return
  
  if (confirm(`确定要重置 ${provider.name} 的模型列表吗？`)) {
    delete customModels.value[provider.id]
  }
}

const fetchModels = async () => {
  const provider = selectedProvider.value
  if (!provider || !provider.apiKeyRequired) return
  
  const apiKey = apiKeys.value[provider.id]
  if (!apiKey) {
    showToast('请先设置 API Key', 'warning')
    return
  }
  
  try {
    if (window.api?.providers?.fetchModels) {
      showToast('正在获取模型列表...', 'info')
      const models = await window.api.providers.fetchModels(provider.id, apiKey)
      if (models && models.length > 0) {
        // Merge with existing models
        const mergedModels = [...provider.models]
        models.forEach((apiModel: Model) => {
          if (!mergedModels.find(m => m.id === apiModel.id)) {
            mergedModels.push(apiModel)
          }
        })
        customModels.value[provider.id] = mergedModels
        showToast(`成功获取 ${models.length} 个模型`, 'success')
      } else {
        showToast('未获取到新模型', 'info')
      }
    } else {
      showToast('模型获取服务暂不可用，请手动添加模型', 'warning')
    }
  } catch (error) {
    console.error('Failed to fetch models:', error)
    showToast('获取模型失败：' + error.message, 'error')
  }
}

const editModel = (model: Model) => {
  const provider = selectedProvider.value
  if (!provider) return
  
  // For now, toggle basic capabilities as a simple edit
  const models = customModels.value[provider.id] || [...provider.models]
  const modelIndex = models.findIndex(m => m.id === model.id)
  
  if (modelIndex > -1) {
    const currentModel = models[modelIndex]
    const hasTools = currentModel.capabilities?.includes('tools')
    
    // Toggle tools capability as an example edit
    const updatedCapabilities = hasTools 
      ? currentModel.capabilities?.filter(cap => cap !== 'tools') || []
      : [...(currentModel.capabilities || []), 'tools']
    
    models[modelIndex] = {
      ...currentModel,
      capabilities: updatedCapabilities
    }
    
    customModels.value[provider.id] = models
    showToast(`已${hasTools ? '移除' : '添加'}模型工具调用能力`, 'success')
  }
}

const removeModel = (model: Model) => {
  const provider = selectedProvider.value
  if (!provider) return
  
  if (confirm(`确定要删除模型 ${model.name} 吗？`)) {
    const models = customModels.value[provider.id] || [...provider.models]
    const index = models.findIndex(m => m.id === model.id)
    if (index > -1) {
      models.splice(index, 1)
      customModels.value[provider.id] = models
    }
  }
}

const openProviderDocs = () => {
  const provider = selectedProvider.value
  if (!provider) return
  
  const docsUrls: Record<string, string> = {
    'openai': 'https://platform.openai.com/docs',
    'claude': 'https://docs.anthropic.com',
    'gemini': 'https://ai.google.dev/docs',
    'deepseek': 'https://platform.deepseek.com/docs',
    // Add more provider documentation URLs
  }
  
  const url = docsUrls[provider.id]
  if (url) {
    window.open(url, '_blank')
  }
}

// Load saved settings
onMounted(() => {
  const savedKeys = localStorage.getItem('providerApiKeys')
  if (savedKeys) {
    apiKeys.value = JSON.parse(savedKeys)
  }
  
  const savedHosts = localStorage.getItem('providerApiHosts')
  if (savedHosts) {
    apiHosts.value = JSON.parse(savedHosts)
  }
  
  const savedModels = localStorage.getItem('providerCustomModels')
  if (savedModels) {
    customModels.value = JSON.parse(savedModels)
  }
})

// Save settings
const saveSettings = () => {
  localStorage.setItem('providerApiKeys', JSON.stringify(apiKeys.value))
  localStorage.setItem('providerApiHosts', JSON.stringify(apiHosts.value))
  localStorage.setItem('providerCustomModels', JSON.stringify(customModels.value))
}

// Auto-save on changes
</script>

<style scoped>
.provider-settings {
  display: flex;
  height: 100%;
  background: var(--color-bg);
}

/* Sidebar */
.provider-sidebar {
  width: 16rem;
  max-width: 16rem;
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.provider-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  text-decoration: none;
  color: var(--color-text-secondary);
  transition: all 0.2s;
  cursor: pointer;
}

.provider-item:hover {
  background: var(--color-hover);
  color: var(--color-text-primary);
}

.provider-item.active {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.provider-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
}

.provider-emoji {
  width: 36px;
  height: 36px;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.provider-name {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-ellipsis: ellipsis;
}

.sidebar-actions {
  padding: 12px;
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-add-provider,
.btn-import {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add-provider:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.btn-import {
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-color: transparent;
}

.btn-import:hover {
  background: var(--color-primary);
  color: white;
}

/* Main Content */
.provider-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.content-section {
  max-width: 800px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
}

.section-header h3 {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin: 0;
}

.btn-external {
  background: none;
  border: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 4px;
  display: flex;
  transition: all 0.2s;
}

.btn-external:hover {
  color: var(--color-primary);
}

/* Config Groups */
.config-group {
  margin-bottom: 32px;
}

.config-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.input-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.password-input {
  flex: 1;
  position: relative;
}

.input-field {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg);
  color: var(--color-text-primary);
  font-size: 14px;
  transition: all 0.2s;
}

.input-field:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-alpha);
}

.btn-toggle-visibility {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-toggle-visibility:hover {
  color: var(--color-text-primary);
}

.btn-check {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: var(--color-primary);
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-check:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.btn-check:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.config-hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

/* Model Management */
.model-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.model-actions {
  display: flex;
  gap: 8px;
}

.btn-small {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.btn-primary:hover {
  background: var(--color-primary);
  color: white;
}

.btn-secondary {
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
}

.btn-secondary:hover {
  background: var(--color-hover);
  color: var(--color-text-primary);
}

.model-search {
  position: relative;
  margin-bottom: 12px;
}

.model-search svg {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-tertiary);
}

.model-search .input-field {
  padding-left: 36px;
}

.model-list {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  min-height: 100px;
  max-height: 400px;
  overflow-y: auto;
}

.model-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  transition: all 0.2s;
}

.model-item:last-child {
  border-bottom: none;
}

.model-item:hover {
  background: var(--color-hover);
}

.model-name {
  flex: 0 1 auto;
  font-size: 14px;
  color: var(--color-text-primary);
}

.model-badges {
  display: flex;
  gap: 8px;
  align-items: center;
  flex: 0 0 auto;
}

.badge {
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge-reasoning {
  color: var(--color-warning);
}

.badge-vision {
  color: var(--color-primary);
}

.badge-tools {
  color: var(--color-success);
}

.badge-realtime {
  color: var(--color-info);
}

.model-type-badge {
  padding: 2px 8px;
  background: var(--color-info);
  color: white;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.model-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
  flex: 0 0 auto;
}

.btn-icon {
  background: none;
  border: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-icon:hover {
  color: var(--color-text-primary);
}

.btn-icon.btn-danger:hover {
  color: var(--color-error);
}

/* Color Variables */
:root {
  --color-bg: #ffffff;
  --color-bg-secondary: #f7f7f7;
  --color-border: #e5e5e5;
  --color-hover: #f0f0f0;
  --color-text-primary: #1a1a1a;
  --color-text-secondary: #666666;
  --color-text-tertiary: #999999;
  --color-primary: #0066ff;
  --color-primary-dark: #0052cc;
  --color-primary-light: #e6f0ff;
  --color-primary-alpha: rgba(0, 102, 255, 0.1);
  --color-success: #00b341;
  --color-warning: #ff9500;
  --color-error: #ff3b30;
  --color-info: #007aff;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #1a1a1a;
    --color-bg-secondary: #2a2a2a;
    --color-border: #3a3a3a;
    --color-hover: #333333;
    --color-text-primary: #ffffff;
    --color-text-secondary: #cccccc;
    --color-text-tertiary: #888888;
    --color-primary: #0a84ff;
    --color-primary-dark: #0070dd;
    --color-primary-light: rgba(10, 132, 255, 0.15);
    --color-primary-alpha: rgba(10, 132, 255, 0.2);
    --color-success: #32d74b;
    --color-warning: #ff9f0a;
    --color-error: #ff453a;
    --color-info: #0a84ff;
  }
}
</style>