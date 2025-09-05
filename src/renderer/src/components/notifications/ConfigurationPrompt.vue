<template>
  <div class="config-prompt" v-if="showPrompt">
    <div class="prompt-content">
      <div class="prompt-icon">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2"/>
          <path d="M8 10l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="prompt-text">
        <div class="prompt-title">{{ promptTitle }}</div>
        <div class="prompt-message">{{ promptMessage }}</div>
      </div>
      <div class="prompt-actions">
        <button class="action-btn configure" @click="handleConfigure">
          {{ configureText }}
        </button>
        <button class="action-btn dismiss" @click="handleDismiss">
          {{ dismissText }}
        </button>
      </div>
      <button class="close-btn" @click="handleClose" title="关闭">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'

export interface ConfigPromptProps {
  type: 'api-key' | 'provider-setup' | 'first-configuration' | 'model-unavailable'
  provider?: string
  model?: string
  autoDismiss?: number // Auto dismiss after X seconds
  showImmediately?: boolean
}

const props = withDefaults(defineProps<ConfigPromptProps>(), {
  autoDismiss: 0,
  showImmediately: false
})

const emit = defineEmits<{
  configure: []
  dismiss: []
  close: []
}>()

const router = useRouter()
const settingsStore = useSettingsStore()
const showPrompt = ref(false)

// Computed properties for different prompt types
const promptTitle = computed(() => {
  switch (props.type) {
    case 'api-key':
      return '需要配置API密钥'
    case 'provider-setup':
      return '配置AI提供商'
    case 'first-configuration':
      return '首次配置'
    case 'model-unavailable':
      return '模型不可用'
    default:
      return '配置提示'
  }
})

const promptMessage = computed(() => {
  switch (props.type) {
    case 'api-key':
      return `使用 ${props.provider || 'this provider'} 需要配置API密钥才能正常工作`
    case 'provider-setup':
      return `设置 ${props.provider || 'AI provider'} 的配置信息以开始使用`
    case 'first-configuration':
      return '完成基本设置以获得最佳使用体验'
    case 'model-unavailable':
      return `模型 ${props.model || 'selected model'} 需要配置才能使用`
    default:
      return '请完成必要的配置设置'
  }
})

const configureText = computed(() => {
  switch (props.type) {
    case 'api-key':
      return '配置密钥'
    case 'provider-setup':
      return '设置提供商'
    case 'first-configuration':
      return '开始配置'
    case 'model-unavailable':
      return '配置模型'
    default:
      return '立即配置'
  }
})

const dismissText = computed(() => {
  switch (props.type) {
    case 'api-key':
      return '稍后配置'
    case 'provider-setup':
      return '跳过'
    case 'first-configuration':
      return '使用默认'
    case 'model-unavailable':
      return '切换模型'
    default:
      return '稍后'
  }
})

// Auto-dismiss functionality
let dismissTimer: number | null = null

const startAutoDismiss = () => {
  if (props.autoDismiss > 0) {
    dismissTimer = window.setTimeout(() => {
      handleDismiss()
    }, props.autoDismiss * 1000)
  }
}

const clearAutoDismiss = () => {
  if (dismissTimer) {
    clearTimeout(dismissTimer)
    dismissTimer = null
  }
}

// Action handlers
const handleConfigure = () => {
  clearAutoDismiss()
  emit('configure')
  
  // Navigate to appropriate settings page
  switch (props.type) {
    case 'api-key':
    case 'provider-setup':
      router.push('/settings')  // 改为跳转到设置页面主页
      break
    case 'first-configuration':
      router.push('/settings')  // 改为跳转到设置页面主页
      break
    case 'model-unavailable':
      router.push('/settings')  // 改为跳转到设置页面主页
      break
    default:
      router.push('/settings')
  }
  
  showPrompt.value = false
}

const handleDismiss = () => {
  clearAutoDismiss()
  emit('dismiss')
  showPrompt.value = false
}

const handleClose = () => {
  clearAutoDismiss()
  emit('close')
  showPrompt.value = false
}

// Show/hide methods for external control
const show = () => {
  showPrompt.value = true
  startAutoDismiss()
}

const hide = () => {
  showPrompt.value = false
  clearAutoDismiss()
}

// Initialize
onMounted(() => {
  if (props.showImmediately) {
    show()
  }
})

// Expose methods for parent component
defineExpose({
  show,
  hide
})
</script>

<style scoped>
.config-prompt {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  max-width: 380px;
  animation: prompt-slide-in 0.3s ease-out;
}

@keyframes prompt-slide-in {
  from {
    opacity: 0;
    transform: translateX(100%) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0) translateY(0);
  }
}

.prompt-content {
  position: relative;
  background: var(--chatbox-bg-primary, #ffffff);
  border: 1px solid var(--chatbox-border, #e5e7eb);
  border-radius: 12px;
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.1),
    0 1px 4px rgba(0, 0, 0, 0.05);
  padding: 16px 20px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.prompt-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-top: 2px;
}

.prompt-text {
  flex: 1;
  min-width: 0;
}

.prompt-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--chatbox-text-primary, #1a1a1a);
  margin-bottom: 4px;
  line-height: 1.3;
}

.prompt-message {
  font-size: 13px;
  color: var(--chatbox-text-secondary, #6b7280);
  line-height: 1.4;
  margin-bottom: 12px;
}

.prompt-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  white-space: nowrap;
}

.action-btn.configure {
  background: var(--chatbox-accent, #3b82f6);
  color: white;
}

.action-btn.configure:hover {
  background: var(--chatbox-accent-dark, #2563eb);
  transform: translateY(-1px);
}

.action-btn.dismiss {
  background: var(--chatbox-bg-secondary, #f8f9fa);
  color: var(--chatbox-text-secondary, #6b7280);
  border: 1px solid var(--chatbox-border, #e5e7eb);
}

.action-btn.dismiss:hover {
  background: var(--chatbox-bg-tertiary, #f1f3f4);
  color: var(--chatbox-text-primary, #1a1a1a);
}

.close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--chatbox-text-tertiary, #9ca3af);
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.close-btn:hover {
  background: var(--chatbox-bg-secondary, #f8f9fa);
  color: var(--chatbox-text-secondary, #6b7280);
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .config-prompt {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
  
  .prompt-content {
    padding: 14px 16px;
  }
  
  .prompt-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .action-btn {
    flex: 1;
    min-width: 0;
    text-align: center;
  }
}

/* Animation variants for different states */
.config-prompt.warning .prompt-icon {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.config-prompt.error .prompt-icon {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.config-prompt.success .prompt-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

/* Pulse animation for urgent prompts */
@keyframes pulse {
  0%, 100% {
    box-shadow: 
      0 4px 16px rgba(0, 0, 0, 0.1),
      0 1px 4px rgba(0, 0, 0, 0.05);
  }
  50% {
    box-shadow: 
      0 8px 24px rgba(59, 130, 246, 0.15),
      0 2px 8px rgba(59, 130, 246, 0.1);
  }
}

.config-prompt.urgent .prompt-content {
  animation: pulse 2s ease-in-out infinite;
}
</style>