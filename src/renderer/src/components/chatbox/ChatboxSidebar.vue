<template>
  <div class="chatbox-sidebar-container">
    <!-- Tab Switcher -->
    <div class="sidebar-tabs">
      <button 
        class="tab-button"
        :class="{ active: activeTab === 'chats' }"
        @click="activeTab = 'chats'"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M3 6h12M3 9h12M3 12h9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <span>Chats</span>
      </button>
      <button 
        class="tab-button"
        :class="{ active: activeTab === 'templates' }"
        @click="activeTab = 'templates'"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="4" y="4" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/>
          <circle cx="9" cy="9" r="2" fill="currentColor"/>
        </svg>
        <span>Templates</span>
      </button>
    </div>
    
    <!-- Sessions Section -->
    <div v-show="activeTab === 'chats'" class="sidebar-section sessions-section">
      <ChatboxSessionList />
    </div>
    
    <!-- Templates Section -->
    <div v-show="activeTab === 'templates'" class="sidebar-section templates-section">
      <ChatboxBotTemplates />
    </div>
    
    <!-- Divider -->
    <div class="sidebar-divider"></div>
    
    <!-- Actions Section -->
    <div class="sidebar-section actions-section">
      <button class="sidebar-action-btn new-chat" @click="createNewChat">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span>New Chat</span>
      </button>
      
      <button class="sidebar-action-btn new-image" @click="createNewImage">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" stroke-width="2"/>
          <circle cx="7" cy="7" r="1.5" fill="currentColor"/>
          <path d="M3 14l4-4 3 3 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>New Images</span>
      </button>
      
      <button class="sidebar-action-btn my-copilots" @click="openCopilots">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="8" r="3" stroke="currentColor" stroke-width="2"/>
          <path d="M4 16c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span>My Copilots</span>
      </button>
      
      <button class="sidebar-action-btn settings" @click="openSettings">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="2"/>
          <path d="M10 3v2m0 10v2m7-7h-2M5 10H3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span>Settings</span>
      </button>
      
      <button class="sidebar-action-btn about" @click="openAbout">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2"/>
          <path d="M10 14v-4m0-2v-.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span>About</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '../../stores/chat'
import { useToast } from '@/composables/useToast'
import ChatboxSessionList from './ChatboxSessionList.vue'
import ChatboxBotTemplates from './ChatboxBotTemplates.vue'

const emit = defineEmits<{
  showImageGeneration: []
}>()

const router = useRouter()
const chatStore = useChatStore()
const { showToast } = useToast()

const activeTab = ref<'chats' | 'templates'>('chats')

const createNewChat = async () => {
  // 使用默认的 MiaoChat 配置
  const newChat = await chatStore.createChat({
    title: 'New Chat',
    model: chatStore.currentModel || 'miaochat',
    provider: chatStore.currentProvider || 'miaochat'
  })
  chatStore.setCurrentChat(newChat.id)
}

const createNewImage = () => {
  // Emit event to parent to show image generation
  emit('showImageGeneration')
}

const openCopilots = () => {
  // Switch to templates tab as copilots
  activeTab.value = 'templates'
}

const openSettings = () => {
  router.push('/settings')
}

const openAbout = () => {
  // Create a simple about info using toast
  showToast('MiaoDa Chat v6.0.1 - Powered by Chatbox Design', 'info')
}
</script>

<style scoped>
.chatbox-sidebar-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--chatbox-bg-secondary, #f8f9fa);
}

/* Tab Switcher */
.sidebar-tabs {
  display: flex;
  padding: 8px;
  gap: 4px;
  border-bottom: 1px solid var(--chatbox-border);
}

.tab-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  border: none;
  background: transparent;
  color: var(--chatbox-text-secondary);
  font-size: 13px;
  font-weight: 500;
  border-radius: var(--chatbox-radius-md);
  cursor: pointer;
  transition: all var(--chatbox-transition-fast);
}

.tab-button:hover {
  background-color: var(--chatbox-bg-hover);
}

.tab-button.active {
  background-color: var(--chatbox-bg-primary);
  color: var(--chatbox-text-primary);
  box-shadow: var(--chatbox-shadow-sm);
}

.tab-button svg {
  flex-shrink: 0;
}

/* Sections */
.sidebar-section {
  padding: 8px;
}

.sessions-section,
.templates-section {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.sidebar-divider {
  height: 1px;
  background-color: var(--chatbox-border, #e5e7eb);
  margin: 0 12px;
}

.actions-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-bottom: 8px;
}

.sidebar-action-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: none;
  background: transparent;
  color: var(--chatbox-text-primary, #1a1a1a);
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  width: 100%;
}

.sidebar-action-btn:hover {
  background-color: var(--chatbox-bg-hover, rgba(0, 0, 0, 0.05));
}

.sidebar-action-btn svg {
  flex-shrink: 0;
}
</style>