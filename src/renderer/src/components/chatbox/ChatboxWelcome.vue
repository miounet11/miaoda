<template>
  <div class="chatbox-welcome-container">
    <!-- First Time Welcome Modal -->
    <FirstTimeWelcome 
      @start-with-prompt="handleStartWithPrompt"
      @close="handleWelcomeClose"
    />
    <div class="welcome-content">
      <!-- Welcome Icon -->
      <div class="welcome-icon">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" stroke="currentColor" stroke-width="2" opacity="0.2"/>
          <circle cx="32" cy="32" r="24" stroke="currentColor" stroke-width="2" opacity="0.3"/>
          <circle cx="32" cy="32" r="18" stroke="currentColor" stroke-width="2" opacity="0.4"/>
          <circle cx="22" cy="26" r="3" fill="currentColor"/>
          <circle cx="42" cy="26" r="3" fill="currentColor"/>
          <path d="M22 40c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      
      <!-- Welcome Title -->
      <h1 class="welcome-title">What can I help you with today?</h1>
      
      <!-- Welcome Description -->
      <p class="welcome-description">
        Start a new conversation or select a template to begin
      </p>
      
      <!-- Quick Actions -->
      <div class="quick-actions">
        <button class="quick-action-card" @click="startQuickChat('general')">
          <div class="action-icon">💬</div>
          <div class="action-text">
            <div class="action-title">General Chat</div>
            <div class="action-desc">Ask me anything</div>
          </div>
        </button>
        
        <button class="quick-action-card" @click="startQuickChat('code')">
          <div class="action-icon">👨‍💻</div>
          <div class="action-text">
            <div class="action-title">Code Assistant</div>
            <div class="action-desc">Help with programming</div>
          </div>
        </button>
        
        <button class="quick-action-card" @click="startQuickChat('creative')">
          <div class="action-icon">🎨</div>
          <div class="action-text">
            <div class="action-title">Creative Writing</div>
            <div class="action-desc">Stories and content</div>
          </div>
        </button>
        
        <button class="quick-action-card" @click="startQuickChat('learn')">
          <div class="action-icon">📚</div>
          <div class="action-text">
            <div class="action-title">Learning</div>
            <div class="action-desc">Explain any topic</div>
          </div>
        </button>
      </div>
      
      <!-- Example Prompts -->
      <div class="example-prompts">
        <div class="prompts-header">Try asking:</div>
        <div class="prompts-grid">
          <button 
            v-for="prompt in examplePrompts" 
            :key="prompt"
            class="prompt-chip"
            @click="usePrompt(prompt)"
          >
            {{ prompt }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useChatStore } from '../../stores/chat'
import { useChatboxUIStore } from '../../stores/chatboxUI'
import FirstTimeWelcome from '../welcome/FirstTimeWelcome.vue'

const emit = defineEmits<{
  'use-prompt': [prompt: string]
}>()

const chatStore = useChatStore()
const chatboxUIStore = useChatboxUIStore()

// 强制设置MiaoChat为默认模型
onMounted(() => {
  // 确保使用MiaoChat作为默认模型
  if (chatStore.currentProvider !== 'miaochat') {
    chatStore.currentProvider = 'miaochat'
    chatStore.currentModel = 'miaochat'
  }
})

const examplePrompts = ref([
  "Explain quantum computing in simple terms",
  "Write a Python function to sort a list",
  "What are the benefits of meditation?",
  "How do I make the perfect cup of coffee?",
  "Translate 'Hello world' to 10 languages",
  "Create a workout plan for beginners"
])

const startQuickChat = async (type: string) => {
  const templates: Record<string, any> = {
    'general': {
      title: 'General Chat',
      systemPrompt: 'You are a helpful AI assistant. Be friendly, informative, and concise.'
    },
    'code': {
      title: 'Code Assistant',
      systemPrompt: 'You are an expert programming assistant. Help with code, debugging, and best practices.'
    },
    'creative': {
      title: 'Creative Writing',
      systemPrompt: 'You are a creative writing assistant. Help with stories, content, and creative ideas.'
    },
    'learn': {
      title: 'Learning Assistant',
      systemPrompt: 'You are an educational assistant. Explain concepts clearly and provide examples.'
    }
  }
  
  const template = templates[type]
  const newChat = await chatStore.createChat({
    title: template.title,
    systemPrompt: template.systemPrompt,
    model: chatStore.currentModel || 'miaochat',
    provider: chatStore.currentProvider || 'miaochat'
  })
  
  chatStore.setCurrentChat(newChat.id)
  chatboxUIStore.setCurrentSession(newChat.id)
}

const usePrompt = (prompt: string) => {
  emit('use-prompt', prompt)
}

const handleStartWithPrompt = (prompt: string) => {
  emit('use-prompt', prompt)
}

const handleWelcomeClose = () => {
  // 首次欢迎引导关闭后，用户可以继续使用普通欢迎页面
}
</script>

<style scoped>
.chatbox-welcome-container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  overflow-y: auto;
}

.welcome-content {
  max-width: 680px;
  width: 100%;
  text-align: center;
}

.welcome-icon {
  display: inline-flex;
  margin-bottom: 32px;
  color: var(--chatbox-accent, #3b82f6);
  opacity: 0.8;
  animation: pulse 3s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
}

.welcome-title {
  font-size: 32px;
  font-weight: 600;
  color: var(--chatbox-text-primary);
  margin: 0 0 12px 0;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.welcome-description {
  font-size: 16px;
  color: var(--chatbox-text-secondary);
  margin: 0 0 40px 0;
  line-height: 1.5;
}

/* Quick Actions */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 48px;
}

.quick-action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px 16px;
  background: var(--chatbox-bg-primary);
  border: 1px solid var(--chatbox-border);
  border-radius: var(--chatbox-radius-lg);
  cursor: pointer;
  transition: all var(--chatbox-transition-base);
}

.quick-action-card:hover {
  background: var(--chatbox-bg-secondary);
  border-color: var(--chatbox-accent);
  transform: translateY(-2px);
  box-shadow: var(--chatbox-shadow-md);
}

.action-icon {
  font-size: 32px;
}

.action-text {
  text-align: center;
}

.action-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--chatbox-text-primary);
  margin-bottom: 4px;
}

.action-desc {
  font-size: 12px;
  color: var(--chatbox-text-secondary);
}

/* Example Prompts */
.example-prompts {
  padding: 24px;
  background: var(--chatbox-bg-secondary);
  border-radius: var(--chatbox-radius-xl);
}

.prompts-header {
  font-size: 13px;
  font-weight: 600;
  color: var(--chatbox-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 16px;
}

.prompts-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.prompt-chip {
  padding: 8px 16px;
  background: var(--chatbox-bg-primary);
  border: 1px solid var(--chatbox-border);
  border-radius: var(--chatbox-radius-full);
  font-size: 13px;
  color: var(--chatbox-text-primary);
  cursor: pointer;
  transition: all var(--chatbox-transition-fast);
  white-space: nowrap;
}

.prompt-chip:hover {
  background: var(--chatbox-accent-light);
  border-color: var(--chatbox-accent);
  color: var(--chatbox-accent-dark);
  transform: translateY(-1px);
}

/* Responsive */
@media (max-width: 640px) {
  .chatbox-welcome-container {
    padding: 20px;
  }
  
  .welcome-title {
    font-size: 24px;
  }
  
  .quick-actions {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>