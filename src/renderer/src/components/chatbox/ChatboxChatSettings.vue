<template>
  <div class="chat-settings-panel">
    <div class="settings-header">
      <h3>聊天设置</h3>
      <button class="close-btn" @click="$emit('close')">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <div class="settings-content">
      <!-- Quick Info -->
      <div class="setting-section">
        <div class="info-card">
          <div class="info-item">
            <span class="info-label">当前模型</span>
            <span class="info-value">{{ currentModelDisplay }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">提供商</span>
            <span class="info-value">{{ currentProviderDisplay }}</span>
          </div>
        </div>
      </div>

      <!-- Parameters -->
      <div class="setting-section">
        <h4>参数设置</h4>
        
        <div class="parameter-item">
          <label>
            <span>温度 (Temperature)</span>
            <span class="parameter-value">{{ settings.temperature }}</span>
          </label>
          <input 
            type="range" 
            v-model.number="settings.temperature"
            min="0" 
            max="2" 
            step="0.1"
            class="slider"
          />
          <div class="parameter-hint">控制回复的创造性，值越高越有创意</div>
        </div>

        <div class="parameter-item">
          <label>
            <span>最大令牌数 (Max Tokens)</span>
            <span class="parameter-value">{{ settings.maxTokens }}</span>
          </label>
          <input 
            type="range" 
            v-model.number="settings.maxTokens"
            min="100" 
            max="4096" 
            step="100"
            class="slider"
          />
          <div class="parameter-hint">控制回复的最大长度</div>
        </div>
      </div>

      <!-- System Prompt -->
      <div class="setting-section">
        <h4>系统提示词</h4>
        <textarea 
          v-model="settings.systemPrompt"
          placeholder="设置AI助手的角色和行为规则..."
          rows="3"
        ></textarea>
      </div>

      <!-- Advanced Settings -->
      <div class="setting-section">
        <h4>高级设置</h4>
        
        <div class="toggle-setting">
          <label>
            <input type="checkbox" v-model="settings.streamResponse" />
            <span>流式响应</span>
          </label>
          <div class="parameter-hint">实时显示AI的回复内容</div>
        </div>

        <div class="toggle-setting">
          <label>
            <input type="checkbox" v-model="settings.saveHistory" />
            <span>保存对话历史</span>
          </label>
          <div class="parameter-hint">将对话保存到本地数据库</div>
        </div>
      </div>

      <!-- Actions -->
      <div class="settings-actions">
        <button class="action-btn secondary" @click="resetSettings">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 8a6 6 0 0112 0M14 8a6 6 0 01-12 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M14 5v3h-3M2 11v-3h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>重置默认</span>
        </button>
        <button class="action-btn primary" @click="saveSettings">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M5 8l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>保存设置</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useSettingsStore } from '@/stores/settings'
import { useToast } from '@/composables/useToast'
import { providers } from '@/config/providers'

const emit = defineEmits<{
  close: []
}>()

const chatStore = useChatStore()
const settingsStore = useSettingsStore()
const { showToast } = useToast()

interface ChatSettings {
  temperature: number
  maxTokens: number
  systemPrompt: string
  streamResponse: boolean
  saveHistory: boolean
}

// 使用与主程序一致的设置
const settings = ref<ChatSettings>({
  temperature: settingsStore.temperature,
  maxTokens: settingsStore.maxTokens,
  systemPrompt: '',
  streamResponse: settingsStore.streamingEnabled,
  saveHistory: settingsStore.saveConversations
})

// 当前模型和提供商显示
const currentModelDisplay = computed(() => {
  const model = chatStore.currentModel || settingsStore.modelName || 'miaochat'
  return model === 'miaochat' ? 'MiaoChat' : model
})

const currentProviderDisplay = computed(() => {
  const providerId = chatStore.currentProvider || settingsStore.llmProvider || 'miaochat'
  const provider = providers.find(p => p.id === providerId)
  return provider?.name || 'MiaoChat'
})

const resetSettings = () => {
  settings.value = {
    temperature: 0.7,
    maxTokens: 2048,
    systemPrompt: '',
    streamResponse: true,
    saveHistory: true
  }
  
  // 同步到设置存储
  settingsStore.setTemperature(0.7)
  settingsStore.setMaxTokens(2048)
  settingsStore.setStreamingEnabled(true)
  
  showToast('设置已重置为默认值', 'info')
}

const saveSettings = () => {
  // 更新设置存储
  settingsStore.setTemperature(settings.value.temperature)
  settingsStore.setMaxTokens(settings.value.maxTokens)
  settingsStore.setStreamingEnabled(settings.value.streamResponse)
  
  // 如果当前有对话，更新对话的系统提示词
  if (chatStore.currentChat && settings.value.systemPrompt) {
    // 可以将系统提示词保存到当前对话的元数据中
    chatStore.updateChat(chatStore.currentChat.id, {
      systemPrompt: settings.value.systemPrompt
    })
  }
  
  showToast('设置已保存', 'success')
  emit('close')
}

onMounted(() => {
  // 从设置存储加载当前设置
  settings.value = {
    temperature: settingsStore.temperature,
    maxTokens: settingsStore.maxTokens,
    systemPrompt: '',
    streamResponse: settingsStore.streamingEnabled,
    saveHistory: settingsStore.saveConversations
  }
  
  // 如果有当前对话，加载其系统提示词
  if (chatStore.currentChat?.systemPrompt) {
    settings.value.systemPrompt = chatStore.currentChat.systemPrompt
  }
})
</script>

<style scoped>
.chat-settings-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--chatbox-bg-primary, #ffffff);
  color: var(--chatbox-text-primary, #1a1a1a);
  border-radius: var(--chatbox-radius-xl, 16px);
  overflow: hidden;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--chatbox-border, #e5e7eb);
  background: var(--chatbox-bg-primary, #ffffff);
}

.settings-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--chatbox-text-primary, #1a1a1a);
  margin: 0;
}

.close-btn {
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  color: var(--chatbox-text-secondary, #6b7280);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--chatbox-radius-md, 8px);
  transition: all var(--chatbox-transition-fast, 0.15s);
}

.close-btn:hover {
  background: var(--chatbox-bg-hover, #f3f4f6);
  color: var(--chatbox-text-primary, #1a1a1a);
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: var(--chatbox-bg-secondary, #f8f9fa);
}

.setting-section {
  margin-bottom: 16px;
}

.setting-section:last-child {
  margin-bottom: 0;
}

.setting-section h4 {
  font-size: 11px;
  font-weight: 600;
  color: var(--chatbox-text-secondary, #6b7280);
  margin: 0 0 8px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Info Card */
.info-card {
  background: var(--chatbox-bg-primary, #ffffff);
  border: 1px solid var(--chatbox-border, #e5e7eb);
  border-radius: var(--chatbox-radius-md, 8px);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 12px;
  color: var(--chatbox-text-secondary, #6b7280);
}

.info-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--chatbox-text-primary, #1a1a1a);
  background: var(--chatbox-accent-light, #eff6ff);
  color: var(--chatbox-accent, #3b82f6);
  padding: 2px 8px;
  border-radius: var(--chatbox-radius-sm, 6px);
}

/* Parameters */
.parameter-item {
  margin-bottom: 12px;
  background: var(--chatbox-bg-primary, #ffffff);
  border: 1px solid var(--chatbox-border, #e5e7eb);
  border-radius: var(--chatbox-radius-md, 8px);
  padding: 12px;
}

.parameter-item label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 500;
  color: var(--chatbox-text-primary, #1a1a1a);
}

.parameter-value {
  font-weight: 600;
  color: var(--chatbox-accent, #3b82f6);
  background: var(--chatbox-accent-light, #eff6ff);
  padding: 1px 6px;
  border-radius: var(--chatbox-radius-sm, 4px);
  font-size: 11px;
}

.slider {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: var(--chatbox-bg-tertiary, #e5e7eb);
  outline: none;
  -webkit-appearance: none;
  margin-bottom: 4px;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--chatbox-accent, #3b82f6);
  cursor: pointer;
  transition: all var(--chatbox-transition-fast, 0.15s);
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.1);
}

.parameter-hint {
  font-size: 11px;
  color: var(--chatbox-text-tertiary, #9ca3af);
  margin-top: 2px;
}

/* System Prompt */
.setting-section textarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--chatbox-border, #e5e7eb);
  border-radius: var(--chatbox-radius-md, 8px);
  background: var(--chatbox-bg-primary, #ffffff);
  color: var(--chatbox-text-primary, #1a1a1a);
  font-size: 12px;
  resize: vertical;
  transition: all var(--chatbox-transition-fast, 0.15s);
  font-family: inherit;
  line-height: 1.4;
}

.setting-section textarea:focus {
  outline: none;
  border-color: var(--chatbox-accent, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Toggle Settings */
.toggle-setting {
  background: var(--chatbox-bg-primary, #ffffff);
  border: 1px solid var(--chatbox-border, #e5e7eb);
  border-radius: var(--chatbox-radius-md, 8px);
  padding: 10px 12px;
  margin-bottom: 8px;
}

.toggle-setting label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 500;
  color: var(--chatbox-text-primary, #1a1a1a);
  cursor: pointer;
}

.toggle-setting input[type="checkbox"] {
  width: 14px;
  height: 14px;
  cursor: pointer;
}

/* Actions */
.settings-actions {
  padding: 12px 16px;
  background: var(--chatbox-bg-primary, #ffffff);
  border-top: 1px solid var(--chatbox-border, #e5e7eb);
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--chatbox-radius-md, 8px);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--chatbox-transition-fast, 0.15s);
  border: 1px solid var(--chatbox-border, #e5e7eb);
}

.action-btn.secondary {
  background: var(--chatbox-bg-primary, #ffffff);
  color: var(--chatbox-text-secondary, #6b7280);
}

.action-btn.secondary:hover {
  background: var(--chatbox-bg-hover, #f3f4f6);
  color: var(--chatbox-text-primary, #1a1a1a);
}

.action-btn.primary {
  background: var(--chatbox-accent, #3b82f6);
  color: white;
  border-color: var(--chatbox-accent, #3b82f6);
}

.action-btn.primary:hover {
  background: var(--chatbox-accent-hover, #2563eb);
  border-color: var(--chatbox-accent-hover, #2563eb);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

/* Scrollbar */
.settings-content::-webkit-scrollbar {
  width: 6px;
}

.settings-content::-webkit-scrollbar-track {
  background: var(--chatbox-bg-secondary, #f8f9fa);
}

.settings-content::-webkit-scrollbar-thumb {
  background: var(--chatbox-border, #e5e7eb);
  border-radius: 3px;
}

.settings-content::-webkit-scrollbar-thumb:hover {
  background: var(--chatbox-text-tertiary, #9ca3af);
}
</style>