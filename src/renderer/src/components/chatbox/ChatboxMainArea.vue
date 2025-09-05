<template>
  <div class="chatbox-main-area">
    <!-- Header Bar -->
    <div class="main-header">
      <div class="header-left">
        <h2 class="chat-title">{{ currentChatTitle }}</h2>
        <span class="chat-subtitle" v-if="currentChatSubtitle">{{ currentChatSubtitle }}</span>
      </div>
      <div class="header-right">
        <button class="header-btn" @click="toggleSidebar" title="Toggle Sidebar">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
        <button class="header-btn" @click="openChatSettings" title="Chat Settings">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="2"/>
            <path d="M10 3v2m0 10v2m7-7h-2M5 10H3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Chat Content Area -->
    <div class="chat-content">
      <!-- Welcome Screen or Messages -->
      <ChatboxWelcome 
        v-if="!hasMessages && !isLoading && !showImageGeneration && !showChatSettings"
        @use-prompt="handleUsePrompt"
      />
      <ChatboxMessages 
        v-else-if="!showImageGeneration && !showChatSettings"
        :messages="messages"
        @regenerate="handleRegenerate"
      />
      
      <!-- Image Generation Panel -->
      <ChatboxImageGeneration
        v-if="showImageGeneration"
        @close="showImageGeneration = false"
        @sendToChat="handleSendImageToChat"
      />
      
      <!-- Chat Settings Panel -->
      <ChatboxChatSettings
        v-if="showChatSettings"
        @close="showChatSettings = false"
      />
    </div>
    
    <!-- Input Area -->
    <ChatboxInputArea 
      @send="handleSendMessage"
      @clear="handleClearMessages"
      @openImageGeneration="showImageGeneration = true"
      @openChatSettings="showChatSettings = true"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useChatStore } from '../../stores/chat'
import { useChatboxUIStore } from '../../stores/chatboxUI'
import ChatboxWelcome from './ChatboxWelcome.vue'
import ChatboxMessages from './ChatboxMessages.vue'
import ChatboxInputArea from './ChatboxInputArea.vue'
import ChatboxImageGeneration from './ChatboxImageGeneration.vue'
import ChatboxChatSettings from './ChatboxChatSettings.vue'

const chatStore = useChatStore()
const chatboxUIStore = useChatboxUIStore()

// Panel visibility states
const showImageGeneration = ref(false)
const showChatSettings = ref(false)

// Initialize store on mount
onMounted(async () => {
  if (!chatStore.isInitialized) {
    await chatStore.initialize()
  }
})

// Computed properties
const currentChat = computed(() => chatStore.currentChat)
const currentChatTitle = computed(() => currentChat.value?.title || 'New Chat')
const currentChatSubtitle = computed(() => {
  const model = chatStore.currentModel === 'miaochat' ? 'MiaoChat' : chatStore.currentModel
  const template = chatboxUIStore.selectedTemplate
  if (template) {
    return `${template.name} • ${model}`
  }
  return model
})

const messages = computed(() => {
  if (!currentChat.value) return []
  return chatStore.getMessagesForChat(currentChat.value.id)
})

const hasMessages = computed(() => messages.value.length > 0)
const isLoading = computed(() => chatStore.isLoading)

// Methods
const toggleSidebar = () => {
  chatboxUIStore.toggleSidebar()
}

const openChatSettings = () => {
  showChatSettings.value = true
}

const handleUsePrompt = async (prompt: string) => {
  // Create new chat if needed
  if (!currentChat.value) {
    const newChat = await chatStore.createChat({
      title: prompt.substring(0, 30) + '...',
      model: chatboxUIStore.selectedModel || 'miaochat',
      provider: chatStore.currentProvider || 'miaochat'
    })
    chatStore.setCurrentChat(newChat.id)
  }
  
  // Send the prompt
  await handleSendMessage(prompt)
}

const handleSendMessage = async (message: string, attachments?: File[]) => {
  if (!currentChat.value) {
    // Create new chat if needed
    const newChat = await chatStore.createChat({
      title: message.substring(0, 30) + '...',
      model: chatboxUIStore.selectedModel || 'miaochat',
      provider: chatStore.currentProvider || 'miaochat'
    })
    chatStore.setCurrentChat(newChat.id)
  }
  
  // Process attachments if any
  if (attachments && attachments.length > 0) {
    // TODO: Handle file attachments
    console.log('Attachments:', attachments)
  }
  
  // Send message (this will add user message and get AI response)
  try {
    await chatStore.sendMessage(currentChat.value!.id, message)
  } catch (error) {
    console.error('Failed to send message:', error)
    // Add error message
    await chatStore.addMessage({
      chatId: currentChat.value!.id,
      role: 'assistant',
      content: '',
      error: 'Failed to get response. Please try again.',
      timestamp: new Date()
    })
  }
}

const handleRegenerate = async (message: any) => {
  // Find the user message before this assistant message
  const messageIndex = messages.value.findIndex(m => m.id === message.id)
  if (messageIndex > 0) {
    const userMessage = messages.value[messageIndex - 1]
    if (userMessage.role === 'user') {
      // Delete the assistant message
      await chatStore.deleteMessage(message.id)
      // Resend the user message
      await chatStore.sendMessage(currentChat.value!.id, userMessage.content)
    }
  }
}

const handleClearMessages = async () => {
  if (currentChat.value) {
    await chatStore.clearMessages(currentChat.value.id)
  }
}

const handleSendImageToChat = async (image: { url: string; prompt: string }) => {
  // Send the image URL and prompt as a message
  const message = `![Generated Image](${image.url})\n\nPrompt: ${image.prompt}`
  await handleSendMessage(message)
  showImageGeneration.value = false
}
</script>

<style scoped>
.chatbox-main-area {
  height: 100%;
  background-color: var(--chatbox-bg-primary);
  display: flex;
  flex-direction: column;
}

/* Header Bar */
.main-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid var(--chatbox-border);
  background: var(--chatbox-bg-primary);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chat-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--chatbox-text-primary);
  margin: 0;
}

.chat-subtitle {
  font-size: 12px;
  color: var(--chatbox-text-secondary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--chatbox-text-secondary);
  cursor: pointer;
  border-radius: var(--chatbox-radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--chatbox-transition-fast);
}

.header-btn:hover {
  background: var(--chatbox-bg-secondary);
  color: var(--chatbox-text-primary);
}

/* Chat Content */
.chat-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>