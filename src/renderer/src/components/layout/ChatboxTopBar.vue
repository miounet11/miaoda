<template>
  <div class="chatbox-topbar">
    <div class="topbar-left">
      <!-- Menu Toggle Button -->
      <button 
        class="menu-toggle"
        @click="$emit('toggle-sidebar')"
        :aria-label="isSidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'"
      >
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 20 20" 
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M3 5h14M3 10h14M3 15h14" 
            stroke="currentColor" 
            stroke-width="2" 
            stroke-linecap="round"
          />
        </svg>
      </button>
      
      <!-- Logo and Brand -->
      <div class="brand">
        <div class="logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" stroke-width="2"/>
            <circle cx="9" cy="10" r="2" fill="currentColor"/>
            <circle cx="15" cy="10" r="2" fill="currentColor"/>
            <path d="M8 15c0-2.209 1.791-4 4-4s4 1.791 4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <span class="brand-text">MiaoDa Chat</span>
      </div>
    </div>
    
    <div class="topbar-center">
      <!-- Model Selector -->
      <div class="model-selector" v-if="!currentChatTitle">
        <button 
          class="model-selector-trigger"
          @click="showModelSelector = !showModelSelector"
          :class="{ active: showModelSelector }"
        >
          <div class="selected-model">
            <span class="model-icon">🤖</span>
            <span class="model-name">{{ selectedModelDisplay }}</span>
            <span class="provider-badge">{{ selectedProviderDisplay }}</span>
          </div>
          <svg class="chevron" width="16" height="16" viewBox="0 0 16 16" :class="{ rotated: showModelSelector }">
            <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        
        <!-- Model Selector Dropdown -->
        <div v-if="showModelSelector" class="model-dropdown">
          <div class="dropdown-header">
            <h3>选择模型</h3>
            <p class="dropdown-subtitle">选择AI模型开始对话</p>
          </div>
          
          <div class="model-categories">
            <!-- Free Models -->
            <div class="model-category">
              <div class="category-header">
                <h4>免费模型</h4>
                <span class="category-badge free">免费</span>
              </div>
              <div class="model-list">
                <button 
                  v-for="model in freeModels" 
                  :key="model.id"
                  class="model-option"
                  :class="{ selected: selectedModel === model.id }"
                  @click="selectModel(model.providerId, model.id)"
                >
                  <div class="model-info">
                    <span class="model-name">{{ model.name }}</span>
                    <span class="model-provider">{{ model.providerName }}</span>
                  </div>
                  <span class="free-badge">免费</span>
                </button>
              </div>
            </div>
            
            <!-- Premium Models -->
            <div class="model-category">
              <div class="category-header">
                <h4>付费模型</h4>
                <span class="category-badge premium">需配置</span>
              </div>
              <div class="model-list">
                <button 
                  v-for="model in premiumModels.slice(0, 3)" 
                  :key="model.id"
                  class="model-option premium"
                  :class="{ selected: selectedModel === model.id }"
                  @click="selectModel(model.providerId, model.id)"
                >
                  <div class="model-info">
                    <span class="model-name">{{ model.name }}</span>
                    <span class="model-provider">{{ model.providerName }}</span>
                  </div>
                  <span class="config-needed" v-if="!model.configured">需配置</span>
                  <span class="configured" v-else>已配置</span>
                </button>
              </div>
              <button class="configure-more" @click="goToProviderSettings">
                配置更多模型 →
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Chat Title (when in conversation) -->
      <span class="current-chat-title" v-else>
        {{ currentChatTitle }}
      </span>
    </div>
    
    <div class="topbar-right">
      <!-- Window Controls (for frameless window) -->
      <div class="window-controls" v-if="!isMac">
        <button class="control-btn minimize" @click="minimizeWindow">
          <svg width="12" height="2" viewBox="0 0 12 2" fill="none">
            <path d="M0 1h12" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
        <button class="control-btn maximize" @click="maximizeWindow">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="1" y="1" width="10" height="10" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
        <button class="control-btn close" @click="closeWindow">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '../../stores/chat'
import { providers } from '../../config/providers'
import { useToast } from '@/composables/useToast'
import { useConfigPrompts } from '@/composables/useConfigPrompts'

defineProps<{
  isSidebarCollapsed: boolean
}>()

defineEmits<{
  'toggle-sidebar': []
}>()

const router = useRouter()
const chatStore = useChatStore()
const { showToast } = useToast()
const { showApiKeyPrompt, showModelUnavailablePrompt } = useConfigPrompts()
const isMac = ref(navigator.platform.toLowerCase().includes('mac'))
const showModelSelector = ref(false)

const currentChatTitle = computed(() => {
  return chatStore.currentChat?.title || ''
})

// Handle logo loading error
const handleLogoError = (e: Event) => {
  const img = e.target as HTMLImageElement
  // Fallback to a simple SVG icon
  img.style.display = 'none'
}

// Window control functions
const minimizeWindow = () => {
  window.api?.window?.minimize()
}

const maximizeWindow = () => {
  window.api?.window?.maximize()
}

const closeWindow = () => {
  window.api?.window?.close()
}

// Model selector functionality
const selectedModel = computed(() => chatStore.currentModel)
const selectedProvider = computed(() => chatStore.currentProvider)

const selectedModelDisplay = computed(() => {
  if (!selectedModel.value) return 'Select Model'
  
  for (const provider of providers) {
    const model = provider.models.find(m => m.id === selectedModel.value)
    if (model) return model.name
  }
  return selectedModel.value
})

const selectedProviderDisplay = computed(() => {
  if (!selectedProvider.value) return ''
  const provider = providers.find(p => p.id === selectedProvider.value)
  return provider?.name || selectedProvider.value
})

// Group models by free/premium
const freeModels = computed(() => {
  const free = []
  for (const provider of providers) {
    if (!provider.apiKeyRequired) {
      for (const model of provider.models) {
        free.push({
          id: model.id,
          name: model.name,
          providerId: provider.id,
          providerName: provider.name,
          configured: true
        })
      }
    }
  }
  return free
})

const premiumModels = computed(() => {
  const premium = []
  for (const provider of providers) {
    if (provider.apiKeyRequired) {
      for (const model of provider.models.slice(0, 2)) { // Limit for dropdown
        premium.push({
          id: model.id,
          name: model.name,
          providerId: provider.id,
          providerName: provider.name,
          configured: false // TODO: Check if API key is configured
        })
      }
    }
  }
  return premium
})

const selectModel = (providerId: string, modelId: string) => {
  chatStore.currentProvider = providerId
  chatStore.currentModel = modelId
  showModelSelector.value = false
  
  const provider = providers.find(p => p.id === providerId)
  const model = provider?.models.find(m => m.id === modelId)
  
  if (provider?.apiKeyRequired) {
    showToast(`已选择 ${model?.name}，需要配置API密钥`, 'info')
    // Show configuration prompt after a brief delay
    setTimeout(() => {
      showApiKeyPrompt(providerId, 30)
    }, 2000)
  } else {
    showToast(`已切换到 ${model?.name}`, 'success')
  }
}

const goToProviderSettings = () => {
  showModelSelector.value = false
  router.push('/settings/providers')
}

// Click outside to close dropdown
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Element
  if (!target.closest('.model-selector')) {
    showModelSelector.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  
  // 强制设置MiaoChat为默认模型
  if (chatStore.currentProvider !== 'miaochat') {
    chatStore.currentProvider = 'miaochat'
    chatStore.currentModel = 'miaochat'
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.chatbox-topbar {
  height: 48px;
  background-color: var(--chatbox-bg-primary, #ffffff);
  border-bottom: 1px solid var(--chatbox-border, #e5e7eb);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  -webkit-app-region: drag; /* Make topbar draggable */
  user-select: none;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  -webkit-app-region: no-drag;
}

.menu-toggle {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--chatbox-text-secondary, #6b7280);
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.menu-toggle:hover {
  background-color: var(--chatbox-bg-secondary, #f8f9fa);
  color: var(--chatbox-text-primary, #1a1a1a);
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--chatbox-accent, #3b82f6);
}

.brand-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--chatbox-text-primary, #1a1a1a);
  letter-spacing: -0.01em;
}

.topbar-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
}

.current-chat-title {
  color: var(--chatbox-text-secondary, #6b7280);
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  -webkit-app-region: no-drag;
}

.window-controls {
  display: flex;
  gap: 8px;
}

.control-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--chatbox-text-secondary, #6b7280);
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.control-btn:hover {
  background-color: var(--chatbox-bg-secondary, #f8f9fa);
}

.control-btn.close:hover {
  background-color: #ef4444;
  color: white;
}

/* Model Selector Styles */
.model-selector {
  position: relative;
  max-width: 400px;
}

.model-selector-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--chatbox-bg-secondary, #f8f9fa);
  border: 1px solid var(--chatbox-border, #e5e7eb);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 200px;
}

.model-selector-trigger:hover,
.model-selector-trigger.active {
  background: var(--chatbox-bg-tertiary, #f1f3f4);
  border-color: var(--chatbox-accent, #3b82f6);
}

.selected-model {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.model-icon {
  font-size: 16px;
}

.model-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--chatbox-text-primary, #1a1a1a);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.provider-badge {
  font-size: 11px;
  padding: 2px 6px;
  background: var(--chatbox-accent-light, #dbeafe);
  color: var(--chatbox-accent-dark, #1d4ed8);
  border-radius: 12px;
  white-space: nowrap;
}

.chevron {
  color: var(--chatbox-text-secondary, #6b7280);
  transition: transform 0.2s;
}

.chevron.rotated {
  transform: rotate(180deg);
}

/* Model Dropdown */
.model-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: var(--chatbox-bg-primary, #ffffff);
  border: 1px solid var(--chatbox-border, #e5e7eb);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  z-index: 100;
  max-height: 400px;
  overflow-y: auto;
  animation: dropdown-appear 0.2s ease-out;
}

@keyframes dropdown-appear {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-header {
  padding: 16px;
  border-bottom: 1px solid var(--chatbox-border, #e5e7eb);
}

.dropdown-header h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--chatbox-text-primary, #1a1a1a);
}

.dropdown-subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--chatbox-text-secondary, #6b7280);
}

.model-categories {
  padding: 8px;
}

.model-category {
  margin-bottom: 16px;
}

.model-category:last-child {
  margin-bottom: 8px;
}

.category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  margin-bottom: 8px;
}

.category-header h4 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--chatbox-text-primary, #1a1a1a);
}

.category-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.category-badge.free {
  background: #dcfce7;
  color: #166534;
}

.category-badge.premium {
  background: #fef3c7;
  color: #92400e;
}

.model-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.model-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.model-option:hover {
  background: var(--chatbox-bg-secondary, #f8f9fa);
}

.model-option.selected {
  background: var(--chatbox-accent-light, #dbeafe);
  border: 1px solid var(--chatbox-accent, #3b82f6);
}

.model-option.premium {
  opacity: 0.8;
}

.model-info {
  flex: 1;
  min-width: 0;
}

.model-option .model-name {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--chatbox-text-primary, #1a1a1a);
  margin-bottom: 2px;
}

.model-provider {
  font-size: 12px;
  color: var(--chatbox-text-secondary, #6b7280);
}

.free-badge {
  font-size: 10px;
  padding: 2px 6px;
  background: #dcfce7;
  color: #166534;
  border-radius: 10px;
  font-weight: 500;
}

.config-needed {
  font-size: 10px;
  padding: 2px 6px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 10px;
  font-weight: 500;
}

.configured {
  font-size: 10px;
  padding: 2px 6px;
  background: #dcfce7;
  color: #166534;
  border-radius: 10px;
  font-weight: 500;
}

.configure-more {
  width: 100%;
  padding: 12px;
  margin-top: 8px;
  border: none;
  background: var(--chatbox-bg-secondary, #f8f9fa);
  color: var(--chatbox-accent, #3b82f6);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.configure-more:hover {
  background: var(--chatbox-accent-light, #dbeafe);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .model-selector-trigger {
    min-width: 140px;
  }
  
  .model-name {
    max-width: 80px;
  }
  
  .provider-badge {
    display: none;
  }
}
</style>