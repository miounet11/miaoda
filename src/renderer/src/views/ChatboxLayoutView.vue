<template>
  <div class="chatbox-layout">
    <!-- Top Bar -->
    <ChatboxTopBar 
      @toggle-sidebar="toggleSidebar"
      :is-sidebar-collapsed="isSidebarCollapsed"
    />
    
    <!-- Main Content Area -->
    <div class="chatbox-content">
      <!-- Left Sidebar -->
      <transition name="sidebar-slide">
        <div 
          v-show="!isSidebarCollapsed"
          class="chatbox-sidebar"
        >
          <ChatboxSidebar />
        </div>
      </transition>
      
      <!-- Right Main Area -->
      <div class="chatbox-main" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
        <ChatboxMainArea />
      </div>
    </div>
    
    <!-- Configuration Prompt -->
    <ConfigurationPrompt
      v-if="currentPrompt"
      :type="currentPrompt.type"
      :provider="currentPrompt.provider"
      :model="currentPrompt.model"
      :auto-dismiss="currentPrompt.autoDismiss"
      :show-immediately="currentPrompt.showImmediately"
      @configure="handlePromptConfigure"
      @dismiss="handlePromptDismiss"
      @close="handlePromptClose"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import ChatboxTopBar from '../components/layout/ChatboxTopBar.vue'
import ChatboxSidebar from '../components/chatbox/ChatboxSidebar.vue'
import ChatboxMainArea from '../components/chatbox/ChatboxMainArea.vue'
import ConfigurationPrompt from '../components/notifications/ConfigurationPrompt.vue'
import { useChatboxUIStore } from '../stores/chatboxUI'
import { useConfigPrompts } from '../composables/useConfigPrompts'

const chatboxUIStore = useChatboxUIStore()
const isSidebarCollapsed = ref(false)

// Configuration prompts
const { currentPrompt, dismissPrompt, initialize: initializePrompts, checkAndShowPrompts } = useConfigPrompts()

// Handle sidebar toggle
const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
  chatboxUIStore.setSidebarCollapsed(isSidebarCollapsed.value)
}

// Handle window resize for responsive behavior
const handleResize = () => {
  if (window.innerWidth < 768) {
    isSidebarCollapsed.value = true
  }
}

// Configuration prompt handlers
const handlePromptConfigure = () => {
  // Navigation is handled by the ConfigurationPrompt component
}

const handlePromptDismiss = () => {
  if (currentPrompt.value) {
    dismissPrompt(currentPrompt.value.id, true)
  }
}

const handlePromptClose = () => {
  if (currentPrompt.value) {
    dismissPrompt(currentPrompt.value.id, false)
  }
}

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
  
  // Restore sidebar state from store
  isSidebarCollapsed.value = chatboxUIStore.sidebarCollapsed
  
  // Initialize configuration prompts
  initializePrompts()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.chatbox-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--chatbox-bg-primary, #ffffff);
  overflow: hidden;
}

.chatbox-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.chatbox-sidebar {
  width: 260px;
  min-width: 260px;
  background-color: var(--chatbox-bg-secondary, #f8f9fa);
  border-right: 1px solid var(--chatbox-border, #e5e7eb);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.chatbox-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--chatbox-bg-primary, #ffffff);
  overflow: hidden;
  transition: margin-left 0.3s ease;
}

.chatbox-main.sidebar-collapsed {
  margin-left: 0;
}

/* Sidebar slide animation */
.sidebar-slide-enter-active,
.sidebar-slide-leave-active {
  transition: all 0.3s ease;
}

.sidebar-slide-enter-from,
.sidebar-slide-leave-to {
  margin-left: -260px;
  opacity: 0;
}

/* Responsive breakpoints */
@media (max-width: 768px) {
  .chatbox-sidebar {
    position: absolute;
    left: 0;
    top: 48px;
    bottom: 0;
    z-index: 100;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  }
}
</style>