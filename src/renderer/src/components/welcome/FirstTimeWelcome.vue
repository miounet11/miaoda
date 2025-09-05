<template>
  <div class="first-time-welcome" v-if="showWelcome">
    <div class="welcome-overlay" @click="handleSkip"></div>
    <div class="welcome-dialog">
      <div class="welcome-header">
        <div class="welcome-icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect x="8" y="8" width="32" height="32" rx="8" stroke="currentColor" stroke-width="2"/>
            <circle cx="18" cy="20" r="3" fill="currentColor"/>
            <circle cx="30" cy="20" r="3" fill="currentColor"/>
            <path d="M16 30c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <h2>欢迎使用 MiaoDa Chat</h2>
        <p class="welcome-subtitle">我们为您提供了免费模型开始使用，同时您也可以配置自己的AI模型</p>
      </div>
      
      <!-- Step indicator -->
      <div class="step-indicator">
        <div class="step" :class="{ active: currentStep >= 1, completed: currentStep > 1 }">1</div>
        <div class="step-line" :class="{ active: currentStep > 1 }"></div>
        <div class="step" :class="{ active: currentStep >= 2, completed: currentStep > 2 }">2</div>
        <div class="step-line" :class="{ active: currentStep > 2 }"></div>
        <div class="step" :class="{ active: currentStep >= 3 }">3</div>
      </div>
      
      <!-- Step 1: Default Model Introduction -->
      <div v-if="currentStep === 1" class="welcome-step">
        <div class="step-content">
          <h3>🆓 内置模型已准备就绪</h3>
          <div class="default-model-info">
            <div class="model-card">
              <div class="model-icon">🐱</div>
              <div class="model-details">
                <div class="model-name">MiaoChat</div>
                <div class="model-desc">内置智能AI助手，无需配置即可开始对话</div>
                <div class="model-features">
                  <span class="feature">✅ 完全免费</span>
                  <span class="feature">✅ 即开即用</span>
                  <span class="feature">✅ 视觉识别</span>
                  <span class="feature">✅ 工具调用</span>
                </div>
              </div>
            </div>
          </div>
          <p class="step-description">
            我们已为您内置了一个强大的AI模型，您可以立即开始对话。
            无需任何配置，点击"开始使用"即可体验。
          </p>
        </div>
        <div class="step-actions">
          <button class="btn-secondary" @click="handleSkip">跳过引导</button>
          <button class="btn-primary" @click="nextStep">开始使用</button>
        </div>
      </div>
      
      <!-- Step 2: Premium Models Introduction -->
      <div v-if="currentStep === 2" class="welcome-step">
        <div class="step-content">
          <h3>🚀 更多强大模型等您配置</h3>
          <div class="premium-models-grid">
            <div class="premium-model-card" v-for="model in premiumModelShowcase" :key="model.id">
              <div class="model-provider">{{ model.provider }}</div>
              <div class="model-name">{{ model.name }}</div>
              <div class="model-capabilities">
                <span v-for="cap in model.capabilities" :key="cap" class="capability">{{ cap }}</span>
              </div>
              <div class="config-status">需要API密钥</div>
            </div>
          </div>
          <p class="step-description">
            配置您自己的AI模型可以享受更好的性能、更大的上下文窗口和专业功能。
            您可以随时在设置中添加您的API密钥。
          </p>
        </div>
        <div class="step-actions">
          <button class="btn-secondary" @click="handleSkip">暂不配置</button>
          <button class="btn-outline" @click="goToSettings">立即配置</button>
          <button class="btn-primary" @click="nextStep">继续</button>
        </div>
      </div>
      
      <!-- Step 3: Quick Start -->
      <div v-if="currentStep === 3" class="welcome-step">
        <div class="step-content">
          <h3>🎉 一切准备就绪！</h3>
          <div class="quick-tips">
            <div class="tip-item">
              <div class="tip-icon">💬</div>
              <div class="tip-content">
                <div class="tip-title">开始对话</div>
                <div class="tip-desc">在下方输入框中输入您的问题</div>
              </div>
            </div>
            <div class="tip-item">
              <div class="tip-icon">🔄</div>
              <div class="tip-content">
                <div class="tip-title">切换模型</div>
                <div class="tip-desc">点击顶部模型选择器切换不同AI模型</div>
              </div>
            </div>
            <div class="tip-item">
              <div class="tip-icon">⚙️</div>
              <div class="tip-content">
                <div class="tip-title">个性化设置</div>
                <div class="tip-desc">在设置中配置主题、快捷键等偏好</div>
              </div>
            </div>
          </div>
          <div class="example-prompts">
            <p class="prompts-title">试试这些问题开始：</p>
            <div class="prompts-list">
              <button 
                v-for="prompt in quickStartPrompts" 
                :key="prompt"
                class="prompt-chip"
                @click="startWithPrompt(prompt)"
              >
                {{ prompt }}
              </button>
            </div>
          </div>
        </div>
        <div class="step-actions">
          <button class="btn-outline" @click="goToSettings">打开设置</button>
          <button class="btn-primary" @click="finishWelcome">开始体验</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'
import { useChatStore } from '@/stores/chat'

const router = useRouter()
const settingsStore = useSettingsStore()
const chatStore = useChatStore()

const showWelcome = ref(false)
const currentStep = ref(1)

const emit = defineEmits<{
  'start-with-prompt': [prompt: string]
  'close': []
}>()

const premiumModelShowcase = ref([
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    capabilities: ['视觉识别', '工具调用', '128K上下文']
  },
  {
    id: 'claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    capabilities: ['视觉识别', '工具调用', '200K上下文']
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    capabilities: ['视觉识别', '实时对话', '1M上下文']
  }
])

const quickStartPrompts = ref([
  '解释量子计算的基本原理',
  '帮我写一个Python排序函数',
  '推荐一些学习编程的资源',
  '创建一个健康的一周饮食计划'
])

onMounted(() => {
  // 检查是否是首次使用
  const isFirstTime = !settingsStore.settings.general?.hasCompletedWelcome
  if (isFirstTime) {
    showWelcome.value = true
  }
})

const nextStep = () => {
  if (currentStep.value < 3) {
    currentStep.value++
  }
}

const handleSkip = () => {
  finishWelcome()
}

const finishWelcome = () => {
  showWelcome.value = false
  settingsStore.updateSettings({
    general: {
      ...settingsStore.settings.general,
      hasCompletedWelcome: true
    }
  })
  emit('close')
}

const goToSettings = () => {
  showWelcome.value = false
  settingsStore.updateSettings({
    general: {
      ...settingsStore.settings.general,
      hasCompletedWelcome: true
    }
  })
  router.push('/settings/providers')
  emit('close')
}

const startWithPrompt = async (prompt: string) => {
  finishWelcome()
  emit('start-with-prompt', prompt)
}
</script>

<style scoped>
.first-time-welcome {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.welcome-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.welcome-dialog {
  position: relative;
  width: 90%;
  max-width: 520px;
  max-height: 80vh;
  background: var(--chatbox-bg-primary, #ffffff);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  overflow-y: auto;
  animation: dialog-enter 0.3s ease-out;
}

@keyframes dialog-enter {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.welcome-header {
  text-align: center;
  padding: 32px 24px 24px;
  border-bottom: 1px solid var(--chatbox-border, #e5e7eb);
}

.welcome-icon {
  display: inline-flex;
  margin-bottom: 16px;
  color: var(--chatbox-accent, #3b82f6);
}

.welcome-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--chatbox-text-primary, #1a1a1a);
}

.welcome-subtitle {
  margin: 0;
  font-size: 14px;
  color: var(--chatbox-text-secondary, #6b7280);
  line-height: 1.5;
}

.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  gap: 8px;
}

.step {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  background: var(--chatbox-bg-secondary, #f8f9fa);
  color: var(--chatbox-text-secondary, #6b7280);
  border: 2px solid var(--chatbox-border, #e5e7eb);
  transition: all 0.2s;
}

.step.active {
  background: var(--chatbox-accent, #3b82f6);
  color: white;
  border-color: var(--chatbox-accent, #3b82f6);
}

.step.completed {
  background: var(--chatbox-accent, #3b82f6);
  color: white;
  border-color: var(--chatbox-accent, #3b82f6);
}

.step-line {
  width: 40px;
  height: 2px;
  background: var(--chatbox-border, #e5e7eb);
  transition: all 0.2s;
}

.step-line.active {
  background: var(--chatbox-accent, #3b82f6);
}

.welcome-step {
  padding: 0 24px 24px;
}

.step-content h3 {
  margin: 0 0 24px 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--chatbox-text-primary, #1a1a1a);
  text-align: center;
}

.step-description {
  margin: 16px 0 0 0;
  font-size: 14px;
  color: var(--chatbox-text-secondary, #6b7280);
  line-height: 1.6;
  text-align: center;
}

/* Default Model Info */
.default-model-info {
  margin-bottom: 16px;
}

.model-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #bae6fd;
  border-radius: 12px;
}

.model-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.model-details {
  flex: 1;
}

.model-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--chatbox-text-primary, #1a1a1a);
  margin-bottom: 4px;
}

.model-desc {
  font-size: 14px;
  color: var(--chatbox-text-secondary, #6b7280);
  margin-bottom: 8px;
}

.model-features {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.feature {
  font-size: 12px;
  color: #059669;
  background: #d1fae5;
  padding: 2px 6px;
  border-radius: 6px;
  font-weight: 500;
}

/* Premium Models */
.premium-models-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.premium-model-card {
  padding: 16px;
  background: var(--chatbox-bg-secondary, #f8f9fa);
  border: 1px solid var(--chatbox-border, #e5e7eb);
  border-radius: 8px;
  text-align: center;
}

.model-provider {
  font-size: 11px;
  color: var(--chatbox-text-secondary, #6b7280);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.premium-model-card .model-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--chatbox-text-primary, #1a1a1a);
  margin-bottom: 8px;
}

.model-capabilities {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 8px;
}

.capability {
  font-size: 10px;
  color: var(--chatbox-text-secondary, #6b7280);
}

.config-status {
  font-size: 10px;
  color: #92400e;
  background: #fef3c7;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 500;
}

/* Quick Tips */
.quick-tips {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.tip-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.tip-content {
  flex: 1;
}

.tip-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--chatbox-text-primary, #1a1a1a);
  margin-bottom: 2px;
}

.tip-desc {
  font-size: 13px;
  color: var(--chatbox-text-secondary, #6b7280);
  line-height: 1.4;
}

/* Example Prompts */
.example-prompts {
  margin-top: 20px;
}

.prompts-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--chatbox-text-primary, #1a1a1a);
  margin: 0 0 12px 0;
  text-align: center;
}

.prompts-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.prompt-chip {
  padding: 8px 12px;
  background: var(--chatbox-bg-secondary, #f8f9fa);
  border: 1px solid var(--chatbox-border, #e5e7eb);
  border-radius: 20px;
  font-size: 12px;
  color: var(--chatbox-text-primary, #1a1a1a);
  cursor: pointer;
  transition: all 0.2s;
}

.prompt-chip:hover {
  background: var(--chatbox-accent-light, #dbeafe);
  border-color: var(--chatbox-accent, #3b82f6);
  color: var(--chatbox-accent-dark, #1d4ed8);
}

/* Action Buttons */
.step-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding: 24px 0 0 0;
  border-top: 1px solid var(--chatbox-border, #e5e7eb);
  margin-top: 24px;
}

.btn-primary,
.btn-secondary,
.btn-outline {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: var(--chatbox-accent, #3b82f6);
  color: white;
}

.btn-primary:hover {
  background: var(--chatbox-accent-dark, #2563eb);
}

.btn-secondary {
  background: var(--chatbox-bg-secondary, #f8f9fa);
  color: var(--chatbox-text-secondary, #6b7280);
  border: 1px solid var(--chatbox-border, #e5e7eb);
}

.btn-secondary:hover {
  background: var(--chatbox-bg-tertiary, #f1f3f4);
}

.btn-outline {
  background: transparent;
  color: var(--chatbox-accent, #3b82f6);
  border: 1px solid var(--chatbox-accent, #3b82f6);
}

.btn-outline:hover {
  background: var(--chatbox-accent-light, #dbeafe);
}

/* Responsive */
@media (max-width: 640px) {
  .welcome-dialog {
    width: 95%;
    max-height: 90vh;
  }
  
  .welcome-header {
    padding: 24px 16px 16px;
  }
  
  .welcome-step {
    padding: 0 16px 16px;
  }
  
  .step-actions {
    flex-direction: column;
  }
  
  .premium-models-grid {
    grid-template-columns: 1fr;
  }
}
</style>