<template>
  <div class="chatbox-app-container">
    <!-- Main Application Container -->
    <div class="chatbox-app-wrapper">
      <!-- Collapsible Sidebar -->
      <AppSidebar
        v-model="sidebarCollapsed"
        @session-select="handleSessionSelect"
        @new-chat="handleNewChat"
        @new-images="handleNewImages"
      />

      <!-- Main Content Area -->
      <div class="chatbox-main-content">
        <!-- Top Navigation Bar -->
        <div class="chatbox-topbar">
          <!-- Left Actions -->
          <div class="chatbox-topbar-left">
            <!-- Menu Toggle -->
            <button
              @click="toggleSidebar"
              class="chatbox-menu-toggle"
              :aria-label="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
            >
              <Menu :size="20" />
            </button>

            <!-- Session Info -->
            <div class="chatbox-session-info">
              <div class="chatbox-session-title">
                <span v-if="currentSession">{{ currentSession.title }}</span>
                <span v-else class="text-muted">New Chat</span>
              </div>
              <div v-if="currentSession" class="chatbox-session-subtitle">
                {{ currentSession.messageCount }} messages • {{ selectedModel }}
              </div>
            </div>
          </div>

          <!-- Right Actions -->
          <div class="chatbox-topbar-actions">
            <!-- Model Selector -->
            <div class="chatbox-model-selector">
              <button class="chatbox-model-button" @click="showModelSelector = !showModelSelector">
                <Bot :size="16" />
                <span>{{ getModelDisplayName(selectedModel) }}</span>
                <ChevronDown :size="14" :class="{ 'rotate-180': showModelSelector }" />
              </button>

              <!-- Model Dropdown -->
              <div v-if="showModelSelector" class="chatbox-model-dropdown">
                <div
                  v-for="model in availableModels"
                  :key="model.value"
                  @click="selectModel(model.value)"
                  class="chatbox-model-option"
                  :class="{ active: selectedModel === model.value }"
                >
                  <component :is="model.icon" :size="16" />
                  <div class="chatbox-model-info">
                    <span class="chatbox-model-name">{{ model.name }}</span>
                    <span class="chatbox-model-description">{{ model.description }}</span>
                  </div>
                  <Check v-if="selectedModel === model.value" :size="14" class="text-blue-400" />
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <button
              @click="shareChat"
              class="chatbox-icon-button"
              aria-label="Share Chat"
              :disabled="!currentSession"
            >
              <Share2 :size="18" />
            </button>

            <button @click="openSettings" class="chatbox-icon-button" aria-label="Settings">
              <Settings :size="18" />
            </button>
          </div>
        </div>

        <!-- Chat Content -->
        <div class="chatbox-chat-container">
          <ChatView :session-id="currentChatId" @toggle-sidebar="toggleSidebar" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Menu, Bot, ChevronDown, Check, Share2, Settings, Sparkles, Zap } from 'lucide-vue-next'
import AppSidebar from '@/components/chatbox/AppSidebar.vue'
import ChatView from '@/components/chatbox/ChatView.vue'
import { useChatStore } from '@/stores/chat'
import { useUIStore } from '@/stores/ui'

const router = useRouter()
const chatStore = useChatStore()
const uiStore = useUIStore()

// State
const sidebarCollapsed = ref(false)
const selectedModel = ref('gpt-4')
const showModelSelector = ref(false)

// Available models
const availableModels = ref([
  {
    value: 'gpt-4',
    name: 'GPT-4',
    description: 'Most capable model, best for complex tasks',
    icon: Bot
  },
  {
    value: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Fast and efficient for most tasks',
    icon: Zap
  },
  {
    value: 'claude-3.5',
    name: 'Claude 3.5 Sonnet',
    description: 'Excellent reasoning and creative tasks',
    icon: Sparkles
  },
  {
    value: 'claude-3',
    name: 'Claude 3',
    description: 'Great for analysis and writing',
    icon: Bot
  }
])

// Computed
const currentSession = computed(() => {
  return chatStore.currentChat
})

const currentChatId = computed(() => {
  return chatStore.currentChatId
})

// Methods
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const handleSessionSelect = async (sessionId: string) => {
  try {
    await chatStore.selectChat(sessionId)
  } catch (error) {
    console.error('Failed to select chat:', error)
  }
}

const handleNewChat = async () => {
  try {
    await chatStore.createChat()
  } catch (error) {
    console.error('Failed to create new chat:', error)
  }
}

const handleNewImages = () => {
  // TODO: Implement image generation
  console.log('New Images clicked')
}

const selectModel = (model: string) => {
  selectedModel.value = model
  showModelSelector.value = false
  // TODO: Update current chat model
}

const getModelDisplayName = (modelValue: string) => {
  const model = availableModels.value.find(m => m.value === modelValue)
  return model?.name || modelValue
}

const shareChat = () => {
  if (!currentSession.value) return
  // TODO: Implement chat sharing
  console.log('Share chat clicked')
}

// Click outside to close model selector
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Element
  if (!target.closest('.chatbox-model-selector')) {
    showModelSelector.value = false
  }
}

const openSettings = () => {
  router.push('/settings')
}

// Lifecycle
onMounted(async () => {
  // Initialize chat store
  if (!chatStore.isInitialized) {
    await chatStore.initialize()
  }

  // Restore sidebar state from localStorage
  const savedState = localStorage.getItem('chatbox-sidebar-collapsed')
  if (savedState !== null) {
    sidebarCollapsed.value = savedState === 'true'
  }

  // Add click outside listener
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style>
@import './chatbox-layout.css';
</style>
