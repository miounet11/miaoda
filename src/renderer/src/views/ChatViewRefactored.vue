<template>
  <div class="chat-view-refactored flex h-full relative">
    <!-- Mobile Overlay -->
    <div 
      v-if="sidebarOpen && isMobile"
      class="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
      @click="closeSidebar"
    />
    
    <!-- Chat Sidebar -->
    <ChatSidebar
      :chats="chats"
      :current-chat-id="currentChatId"
      :is-mobile="isMobile"
      :sidebar-open="sidebarOpen"
      @new-chat="handleNewChat"
      @select-chat="handleSelectChat"
      @open-settings="handleOpenSettings"
      @show-context-menu="handleShowContextMenu"
      @clear-all="handleClearAll"
    />
    
    <!-- Main Chat Area -->
    <main class="flex-1 flex flex-col min-w-0">
      <!-- Mobile Header -->
      <header v-if="isMobile" class="mobile-header flex items-center justify-between p-4 border-b md:hidden">
        <button
          @click="toggleSidebar"
          class="p-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu :size="20" />
        </button>
        
        <h1 class="font-semibold truncate">
          {{ currentChat?.title || 'New Chat' }}
        </h1>
        
        <button
          @click="handleOpenSettings"
          class="p-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Open settings"
        >
          <Settings :size="20" />
        </button>
      </header>
      
      <!-- Chat Messages -->
      <ChatMessages
        ref="messagesRef"
        :messages="messages"
        :is-loading="isMessageLoading"
        :is-generating="isGenerating"
        :empty-state-title="emptyStateTitle"
        :empty-state-description="emptyStateDescription"
        :quick-suggestions="quickSuggestions"
        @send-suggestion="handleSendSuggestion"
        @retry-message="handleRetryMessage"
        @edit-message="handleEditMessage"
        @delete-message="handleDeleteMessage"
        @scroll-to-bottom="handleScrollToBottom"
      />
      
      <!-- Chat Input -->
      <ChatInput
        ref="inputRef"
        :disabled="!canSendMessage"
        :is-configured="isConfigured"
        :is-loading="isLoading"
        :auto-focus="shouldAutoFocus"
        @send="handleSendMessage"
        @open-settings="handleOpenSettings"
        @voice-toggle="handleVoiceToggle"
      />
    </main>
    
    <!-- Context Menu -->
    <ContextMenu
      v-if="contextMenu.visible"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :items="contextMenu.items"
      @close="hideContextMenu"
      @action="handleContextAction"
    />
    
    <!-- Error Toast -->
    <ErrorToast ref="errorToastRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Menu, Settings } from 'lucide-vue-next'

// Components
import ChatSidebar from '@renderer/src/components/chat/ChatSidebar.vue'
import ChatMessages from '@renderer/src/components/chat/ChatMessages.vue'
import ChatInput from '@renderer/src/components/chat/ChatInput.vue'
import ContextMenu from '@renderer/src/components/ui/ContextMenu.vue'
import ErrorToast from '@renderer/src/components/error/ErrorToast.vue'

// Composables
import { useChat } from '@renderer/src/composables/useChat'
import { useResponsive } from '@renderer/src/composables/useResponsive'
import { useKeyboardShortcuts } from '@renderer/src/composables/useKeyboardShortcuts'
import { useErrorHandler, setErrorToastInstance } from '@renderer/src/composables/useErrorHandler'

// Types
import type { Message, Attachment, ContextMenuState, ContextMenuItem } from '@renderer/src/types'

// Router
const router = useRouter()

// Composables
const {
  chats,
  currentChat,
  currentChatId,
  messages,
  isLoading,
  isGenerating,
  canSendMessage,
  createChat,
  selectChat,
  deleteChat,
  sendMessage,
  retryMessage,
  editMessage,
  deleteMessage,
  copyMessage,
  exportChat
} = useChat()

const { isMobile } = useResponsive()
const { registerDefaults } = useKeyboardShortcuts()
const { handleError } = useErrorHandler()

// Refs
const messagesRef = ref()
const inputRef = ref()
const errorToastRef = ref()

// Local state
const sidebarOpen = ref(false)
const isConfigured = ref(true)
const isMessageLoading = ref(false)
const shouldAutoFocus = ref(false)
const contextMenu = ref<ContextMenuState>({
  visible: false,
  x: 0,
  y: 0,
  items: [],
  target: undefined
})

// Configuration
const emptyStateTitle = 'Welcome to MiaoDa Chat'
const emptyStateDescription = 'Start a conversation with your AI assistant'
const quickSuggestions = [
  "Explain quantum computing in simple terms",
  "Write a Python function to sort a list",
  "What are the benefits of meditation?",
  "Help me plan a healthy meal"
]

// Event handlers
const handleNewChat = async () => {
  const chatId = await createChat()
  if (chatId && isMobile.value) {
    closeSidebar()
  }
  shouldAutoFocus.value = true
}

const handleSelectChat = async (chatId: string) => {
  await selectChat(chatId)
  if (isMobile.value) {
    closeSidebar()
  }
}

const handleOpenSettings = () => {
  router.push('/settings')
}

const handleSendMessage = async (content: string, attachments: Attachment[]) => {
  if (!canSendMessage.value) return
  
  isMessageLoading.value = true
  
  try {
    await sendMessage(content, attachments)
    
    // Scroll to bottom after sending
    await nextTick()
    messagesRef.value?.scrollToBottom()
  } catch (error) {
    handleError(error, 'Send Message')
  } finally {
    isMessageLoading.value = false
  }
}

const handleSendSuggestion = async (suggestion: string) => {
  await handleSendMessage(suggestion, [])
}

const handleRetryMessage = async (message: Message) => {
  try {
    await retryMessage(message.id)
  } catch (error) {
    handleError(error, 'Retry Message')
  }
}

const handleEditMessage = async (message: Message) => {
  // TODO: Implement edit functionality
  console.log('Edit message:', message.id)
}

const handleDeleteMessage = async (message: Message) => {
  if (confirm('Are you sure you want to delete this message?')) {
    try {
      await deleteMessage(message.id)
    } catch (error) {
      handleError(error, 'Delete Message')
    }
  }
}

const handleScrollToBottom = () => {
  messagesRef.value?.scrollToBottom()
}

const handleVoiceToggle = (enabled: boolean) => {
  // TODO: Implement voice input
  console.log('Voice input:', enabled)
}

// Sidebar management
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const closeSidebar = () => {
  sidebarOpen.value = false
}

const openSidebar = () => {
  sidebarOpen.value = true
}

// Context menu
const handleShowContextMenu = (chatId: string, event: MouseEvent) => {
  event.preventDefault()
  
  const items: ContextMenuItem[] = [
    {
      id: 'rename',
      label: 'Rename',
      icon: 'edit',
      action: () => handleRenameChat(chatId)
    },
    {
      id: 'export',
      label: 'Export',
      icon: 'download',
      action: () => handleExportChat(chatId)
    },
    {
      id: 'separator1',
      label: '',
      separator: true
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'trash',
      action: () => handleDeleteChat(chatId)
    }
  ]
  
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    items,
    target: event.target as HTMLElement
  }
}

const hideContextMenu = () => {
  contextMenu.value.visible = false
}

const handleContextAction = (action: () => void) => {
  action()
  hideContextMenu()
}

const handleRenameChat = (chatId: string) => {
  // TODO: Implement rename functionality
  console.log('Rename chat:', chatId)
}

const handleExportChat = async (chatId: string) => {
  try {
    await exportChat(chatId, 'markdown')
  } catch (error) {
    handleError(error, 'Export Chat')
  }
}

const handleDeleteChat = async (chatId: string) => {
  if (confirm('Are you sure you want to delete this chat?')) {
    try {
      await deleteChat(chatId)
    } catch (error) {
      handleError(error, 'Delete Chat')
    }
  }
}

const handleClearAll = async () => {
  if (confirm('Are you sure you want to clear all conversations?')) {
    try {
      // TODO: Implement clear all functionality
      console.log('Clear all chats')
    } catch (error) {
      handleError(error, 'Clear All Chats')
    }
  }
}

// Keyboard shortcuts
const setupKeyboardShortcuts = () => {
  registerDefaults({
    newChat: () => handleNewChat(),
    openSettings: () => handleOpenSettings(),
    toggleSidebar: () => toggleSidebar(),
    focusInput: () => inputRef.value?.focus(),
    sendMessage: () => {
      // This will be handled by the input component
    },
    searchChats: () => {
      // TODO: Implement search
    },
    nextChat: () => {
      // TODO: Implement navigation
    },
    prevChat: () => {
      // TODO: Implement navigation
    },
    clearChat: () => {
      if (currentChatId.value) {
        handleDeleteChat(currentChatId.value)
      }
    },
    exportChat: () => {
      if (currentChatId.value) {
        handleExportChat(currentChatId.value)
      }
    }
  })
}

// Lifecycle
onMounted(async () => {
  // Initialize error toast
  if (errorToastRef.value) {
    setErrorToastInstance(errorToastRef.value)
  }
  
  // Check LLM configuration
  try {
    isConfigured.value = await window.api.llm.isConfigured()
  } catch (error) {
    console.warn('Failed to check LLM configuration:', error)
    isConfigured.value = false
  }
  
  // Setup keyboard shortcuts
  setupKeyboardShortcuts()
  
  // Auto-focus input on desktop
  if (!isMobile.value) {
    shouldAutoFocus.value = true
  }
})

// Watch for mobile changes
watch(isMobile, (newIsMobile) => {
  if (!newIsMobile) {
    // Close sidebar when switching to desktop
    sidebarOpen.value = false
  }
})

// Auto-focus input when chat changes
watch(currentChatId, () => {
  if (currentChatId.value && !isMobile.value) {
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
})
</script>

<style scoped>
.chat-view-refactored {
  height: 100vh;
  overflow: hidden;
}

.mobile-header {
  -webkit-app-region: no-drag;
  background: var(--background);
  backdrop-filter: blur(12px);
}

/* Smooth transitions */
.chat-view-refactored * {
  transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform;
  transition-duration: 0.2s;
  transition-timing-function: ease-out;
}

/* Focus management */
.chat-view-refactored:focus-within {
  outline: none;
}

/* Custom scrollbar for webkit browsers */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(var(--muted-foreground-rgb), 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--muted-foreground-rgb), 0.5);
}

/* Theme variables */
:root {
  --background: hsl(0, 0%, 100%);
  --muted: hsl(210, 20%, 96%);
  --muted-foreground-rgb: 100, 116, 139;
}

:root[data-theme="dark"] {
  --background: hsl(222, 47%, 11%);
  --muted: hsl(217, 33%, 17%);
  --muted-foreground-rgb: 148, 163, 184;
}

/* Performance optimizations */
.chat-view-refactored {
  contain: layout style paint;
}

/* Responsive optimizations */
@media (max-width: 768px) {
  .chat-view-refactored {
    overscroll-behavior: none;
    -webkit-overflow-scrolling: touch;
  }
}
</style>