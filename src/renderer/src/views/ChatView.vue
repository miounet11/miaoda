<template>
  <div class="chat-view flex h-full relative">
    <!-- Mobile overlay -->
    <div 
      v-if="sidebarOpen && isMobile"
      class="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
      @click="sidebarOpen = false"
    ></div>
    
    <!-- Sidebar -->
    <aside 
      class="sidebar w-64 bg-secondary/30 backdrop-blur-sm border-r flex flex-col transition-transform duration-300 ease-in-out z-50"
      :class="{
        'fixed top-0 left-0 h-full md:relative md:translate-x-0': isMobile,
        '-translate-x-full': isMobile && !sidebarOpen,
        'translate-x-0': !isMobile || sidebarOpen
      }"
    >
      <div class="p-3 border-b">
        <div class="flex gap-2 mb-2">
          <button 
            @click="createNewChat"
            class="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 font-medium shadow-sm"
          >
            <Plus :size="16" />
            <span>New Chat</span>
          </button>
          <button
            @click="$router.push('/settings')"
            class="p-2 bg-secondary/50 hover:bg-secondary/70 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings :size="18" />
          </button>
        </div>
        <!-- Action buttons -->
        <div class="flex gap-2">
          <!-- Search button -->
          <button
            @click="openSearchOverlay"
            class="flex-1 px-3 py-2 bg-secondary/50 hover:bg-secondary/70 rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-medium"
            title="Search messages (Ctrl/Cmd + K)"
          >
            <Search :size="14" />
            <span>Search</span>
          </button>
          <!-- Export button -->
          <button
            @click="openExportDialog"
            :disabled="chats.length === 0"
            class="flex-1 px-3 py-2 bg-secondary/50 hover:bg-secondary/70 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-medium"
            title="Export chat history"
          >
            <Download :size="14" />
            <span>Export</span>
          </button>
        </div>
      </div>
      
      <div class="flex-1 overflow-y-auto p-2">
        <div v-if="chats.length === 0" class="text-center py-8 text-muted-foreground text-sm">
          No conversations yet
        </div>
        <div 
          v-for="chat in chats" 
          :key="chat.id"
          @click="selectChat(chat.id)"
          :class="[
            'chat-item px-3 py-2.5 rounded-lg cursor-pointer transition-all mb-1 relative group',
            currentChatId === chat.id 
              ? 'bg-primary/10 border border-primary/20' 
              : 'hover:bg-accent/50 border border-transparent'
          ]"
        >
          <div class="flex items-start gap-2">
            <MessageSquare :size="14" class="mt-0.5 flex-shrink-0 text-muted-foreground" />
            <div class="flex-1 min-w-0">
              <div class="font-medium text-sm truncate">{{ chat.title }}</div>
              <div class="text-xs text-muted-foreground mt-0.5">{{ formatTime(chat.updatedAt) }}</div>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main chat area -->
    <main class="flex-1 flex flex-col min-w-0">
      <!-- Chat Header with Model Switcher -->
      <header class="flex items-center justify-between p-3 border-b bg-background/95 backdrop-blur">
        <!-- Left section - Mobile menu + Model switcher -->
        <div class="flex items-center gap-3">
          <button
            v-if="isMobile"
            @click="sidebarOpen = !sidebarOpen"
            class="p-2 hover:bg-muted rounded-lg transition-colors md:hidden"
          >
            <Menu :size="20" />
          </button>
          
          <!-- Model Switcher -->
          <ModelSwitcher
            :disabled="isLoading"
            @model-changed="handleModelChanged"
            @settings-opened="handleSettingsOpened"
          />
        </div>
        
        <!-- Center section - Chat title (visible on mobile) -->
        <h1 v-if="isMobile" class="font-semibold truncate flex-1 text-center mx-4">
          {{ currentChat?.title || 'New Chat' }}
        </h1>
        
        <!-- Right section - Actions -->
        <div class="flex items-center gap-2">
          <button
            @click="openSearchOverlay"
            class="p-2 hover:bg-muted rounded-lg transition-colors"
            title="Search messages (Ctrl/Cmd + K)"
          >
            <Search :size="18" />
          </button>
          <button
            @click="$router.push('/settings')"
            class="p-2 hover:bg-muted rounded-lg transition-colors"
            title="Settings"
          >
            <Settings :size="18" />
          </button>
        </div>
      </header>
      <!-- Chat messages -->
      <div class="flex-1 relative" ref="messagesContainer">
        <ChatMessagesOptimized
          :messages="currentChat?.messages || []"
          :is-loading="isLoading"
          :is-generating="isLoading"
          empty-state-title="Welcome to MiaoDa Chat"
          empty-state-description="Start a conversation with your AI assistant"
          :quick-suggestions="quickSuggestions"
          :auto-scroll="true"
          @send-suggestion="sendQuickMessage"
          @retry-message="retryMessage"
          @edit-message="editMessage"
          @delete-message="deleteMessage"
        />
      </div>

      <!-- Input area -->
      <div class="border-t bg-background/95 backdrop-blur px-2 sm:px-4 py-3 sm:py-4">
        <div class="max-w-3xl mx-auto">
          <!-- Helpful hint when no LLM configured -->
          <div v-if="!isConfigured" class="mb-3 p-3 bg-warning/10 border border-warning/20 rounded-lg flex items-center gap-2">
            <AlertCircle :size="16" class="text-warning flex-shrink-0" />
            <span class="text-sm">Please configure an LLM provider in settings to start chatting.</span>
            <button @click="$router.push('/settings')" class="ml-auto text-sm font-medium text-primary hover:underline">
              Configure now →
            </button>
          </div>
          
          <!-- Attachments preview -->
          <div v-if="attachments.length > 0" class="mb-3 flex flex-wrap gap-2">
            <div 
              v-for="(attachment, index) in attachments" 
              :key="index"
              class="relative group"
            >
              <div v-if="attachment.type === 'image'" class="relative">
                <img 
                  :src="attachment.data" 
                  :alt="attachment.name"
                  class="h-20 w-20 object-cover rounded-lg border"
                />
                <button
                  @click="removeAttachment(index)"
                  class="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X :size="12" />
                </button>
              </div>
              <div v-else class="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                <FileText :size="16" />
                <span class="text-sm">{{ attachment.name }}</span>
                <button
                  @click="removeAttachment(index)"
                  class="p-1 hover:bg-background rounded transition-colors"
                >
                  <X :size="12" />
                </button>
              </div>
            </div>
          </div>
          
          <div class="relative">
            <div class="flex items-end gap-1 sm:gap-2 p-2 bg-muted/50 rounded-2xl border border-transparent focus-within:border-primary/20 transition-all">
              <!-- Action buttons -->
              <div class="flex gap-1 pb-1">
                <button
                  @click="selectFiles"
                  class="p-2 hover:bg-background rounded-lg transition-colors group"
                  title="Attach files (images, documents)"
                >
                  <Paperclip :size="16" class="group-hover:text-primary transition-colors sm:w-[18px] sm:h-[18px]" />
                </button>
                
                <!-- Voice Input Button -->
                <button
                  v-if="voiceSupported"
                  @click="toggleVoiceInput"
                  class="p-2 hover:bg-background rounded-lg transition-colors group"
                  :class="{ 'bg-red-500 text-white hover:bg-red-600': isVoiceInputActive }"
                  :title="isVoiceInputActive ? 'Stop voice input' : 'Start voice input'"
                >
                  <Mic :size="16" class="group-hover:text-primary transition-colors sm:w-[18px] sm:h-[18px]" 
                       :class="{ 'text-white': isVoiceInputActive }" />
                </button>
              </div>
              
              <!-- Input field -->
              <textarea
                v-model="inputMessage"
                @keydown.enter.prevent="handleSend"
                @paste="handlePaste"
                :placeholder="getPlaceholder()"
                class="flex-1 min-h-[36px] sm:min-h-[40px] max-h-[150px] sm:max-h-[200px] px-2 py-2 bg-transparent resize-none outline-none placeholder:text-muted-foreground/60 text-sm sm:text-base"
                :rows="1"
                ref="messageInput"
              />
              
              <!-- Send button -->
              <div class="pb-1">
                <button
                  @click="sendMessage"
                  :disabled="(!inputMessage.trim() && attachments.length === 0) || isLoading || !isConfigured"
                  class="p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  :class="[
                    (inputMessage.trim() || attachments.length > 0) && !isLoading && isConfigured
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                      : 'bg-muted-foreground/20 text-muted-foreground'
                  ]"
                  :title="getSendButtonTooltip()"
                >
                  <Send :size="16" class="sm:w-[18px] sm:h-[18px]" />
                </button>
              </div>
            </div>
            
            <!-- Keyboard shortcut hint - hidden on mobile -->
            <div class="absolute -bottom-6 left-0 text-xs text-muted-foreground hidden sm:block">
              Press <kbd class="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> to send, 
              <kbd class="px-1 py-0.5 bg-muted rounded text-xs">Shift+Enter</kbd> for new line
            </div>
          </div>
          
          <!-- Voice Recording Interface -->
          <div
            v-if="isVoiceInputActive"
            class="mt-3 p-4 bg-muted/30 rounded-lg border-2 border-primary/20"
          >
            <VoiceRecorder
              :show-waveform="true"
              :continuous="false"
              :auto-start="true"
              @transcript="handleVoiceTranscript"
              @recording-stop="handleRecordingStop"
              @error="handleVoiceError"
            />
          </div>
        </div>
      </div>
    </main>
    
    <!-- Export Dialog -->
    <ExportDialog 
      v-model:open="showExportDialog" 
      :current-chat-id="currentChatId" 
    />
    
    <!-- Global Search Overlay -->
    <GlobalSearchOverlay
      v-model:open="showSearchOverlay"
      @select="handleSearchSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { Plus, Send, Settings, Paperclip, X, FileText, Bot, User, MessageSquare, Loader2, AlertCircle, Menu, Download, Search, Mic } from 'lucide-vue-next'
import { useChatStore } from '@renderer/src/stores/chat'
import { formatDistanceToNow } from '@renderer/src/utils/time'
import MessageContent from '@renderer/src/components/MessageContent.vue'
import ExportDialog from '@renderer/src/components/export/ExportDialog.vue'
import GlobalSearchOverlay from '@renderer/src/components/search/GlobalSearchOverlay.vue'
import SearchHighlight from '@renderer/src/components/search/SearchHighlight.vue'
import VoiceRecorder from '@renderer/src/components/voice/VoiceRecorder.vue'
import ChatMessagesOptimized from '@renderer/src/components/chat/ChatMessagesOptimized.vue'
import ModelSwitcher from '@renderer/src/components/chat/ModelSwitcher.vue'
import { searchService } from '@renderer/src/services/search/SearchService'
import { voiceService } from '@renderer/src/services/voice/VoiceService'
import { useToast } from '@renderer/src/services/ui/ToastService'

interface Attachment {
  name: string
  type: 'image' | 'text' | 'file'
  data?: string
  content?: string
}

const chatStore = useChatStore()
const toast = useToast()
const messagesContainer = ref<HTMLElement>()
const messageInput = ref<HTMLTextAreaElement>()
const inputMessage = ref('')
const isLoading = ref(false)
const attachments = ref<Attachment[]>([])
const isConfigured = ref(false)
const sidebarOpen = ref(false)
const isMobile = ref(false)
const showExportDialog = ref(false)
const showSearchOverlay = ref(false)
const isVoiceInputActive = ref(false)
const voiceSupported = ref(false)

// Check if device is mobile
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
  if (!isMobile.value) {
    sidebarOpen.value = false
  }
}

// Handle window resize
const handleResize = () => {
  checkMobile()
}

// Quick suggestions for new chats
const quickSuggestions = [
  "Explain quantum computing in simple terms",
  "Write a Python function to sort a list",
  "What are the benefits of meditation?",
  "Help me plan a healthy meal"
]

// Initialize store on mount
onMounted(async () => {
  await chatStore.initialize()
  
  // Check if LLM is configured
  isConfigured.value = await window.api.llm.isConfigured()
  
  // Check voice support
  const capabilities = voiceService.getCapabilities()
  voiceSupported.value = !!(capabilities?.speechRecognition && capabilities?.getUserMedia)
  
  // Setup responsive behavior
  checkMobile()
  window.addEventListener('resize', handleResize)
  
  // Setup shortcut listeners
  window.addEventListener('app:new-chat', createNewChat)
  window.addEventListener('app:focus-input', focusInput)
  window.addEventListener('app:clear-chat', clearCurrentChat)
  window.addEventListener('app:prev-chat', selectPrevChat)
  window.addEventListener('app:next-chat', selectNextChat)
  
  // Setup keyboard shortcuts
  document.addEventListener('keydown', handleKeyDown)
  
  // Index existing messages for search
  indexAllMessages()
})

// Cleanup
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('app:new-chat', createNewChat)
  window.removeEventListener('app:focus-input', focusInput)
  window.removeEventListener('app:clear-chat', clearCurrentChat)
  window.removeEventListener('app:prev-chat', selectPrevChat)
  window.removeEventListener('app:next-chat', selectNextChat)
})

const chats = computed(() => chatStore.chats)
const currentChatId = computed(() => chatStore.currentChatId)
const currentChat = computed(() => chatStore.currentChat)

const createNewChat = () => {
  chatStore.createChat()
  if (isMobile.value) {
    sidebarOpen.value = false
  }
}

const selectChat = (chatId: string) => {
  chatStore.selectChat(chatId)
  if (isMobile.value) {
    sidebarOpen.value = false
  }
}

const formatTime = (date: Date) => {
  return formatDistanceToNow(date)
}

const handleSend = (e: KeyboardEvent) => {
  if (!e.shiftKey) {
    sendMessage()
  }
}

const selectFiles = async () => {
  const files = await window.api.file.select()
  
  for (const file of files) {
    const attachment: Attachment = {
      name: file.name,
      type: file.type as any,
      data: file.data,
      content: file.content
    }
    attachments.value.push(attachment)
  }
}

const handlePaste = async (event: ClipboardEvent) => {
  const items = event.clipboardData?.items
  if (!items) return
  
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      event.preventDefault()
      
      const file = item.getAsFile()
      if (!file) continue
      
      const reader = new FileReader()
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string
        const fileInfo = await window.api.file.paste(dataUrl)
        
        attachments.value.push({
          name: fileInfo.name,
          type: 'image',
          data: fileInfo.data
        })
      }
      reader.readAsDataURL(file)
    }
  }
}

const removeAttachment = (index: number) => {
  attachments.value.splice(index, 1)
}

// Helper methods for UI
const getPlaceholder = () => {
  if (!isConfigured.value) return "Configure LLM provider first..."
  if (isLoading.value) return "AI is responding..."
  return "Ask anything..."
}

const getSendButtonTooltip = () => {
  if (!isConfigured.value) return "Configure LLM provider first"
  if (isLoading.value) return "Please wait..."
  if (!inputMessage.value.trim() && attachments.value.length === 0) return "Type a message"
  return "Send message"
}

const sendQuickMessage = (message: string) => {
  inputMessage.value = message
  sendMessage()
}

// Export functionality
const openExportDialog = () => {
  showExportDialog.value = true
}

// Search functionality
const openSearchOverlay = () => {
  showSearchOverlay.value = true
}

const handleSearchSelect = (result: any) => {
  // Navigate to the selected message's chat
  if (result.chatId && result.chatId !== currentChatId.value) {
    selectChat(result.chatId)
  }
  
  // TODO: Scroll to specific message in chat
  nextTick(() => {
    // Find and highlight the message
    const messageElement = document.querySelector(`[data-message-id="${result.id}"]`)
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      messageElement.classList.add('highlight-message')
      setTimeout(() => {
        messageElement.classList.remove('highlight-message')
      }, 3000)
    }
  })
}

// Index all existing messages for search
const indexAllMessages = async () => {
  try {
    // Get all messages from all chats
    const allMessages: any[] = []
    
    for (const chat of chats.value) {
      if (chat.messages && chat.messages.length > 0) {
        chat.messages.forEach(message => {
          allMessages.push({
            ...message,
            chatId: chat.id,
            chatTitle: chat.title
          })
        })
      }
    }
    
    // Index messages in batches to avoid blocking UI
    if (allMessages.length > 0) {
      console.log(`Indexing ${allMessages.length} messages for search...`)
      await searchService.indexMessages(allMessages)
    }
  } catch (error) {
    console.error('Failed to index messages:', error)
  }
}

// Keyboard shortcuts
const handleKeyDown = (e: KeyboardEvent) => {
  // Ctrl/Cmd + K for search
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    openSearchOverlay()
  }
}

// Shortcut handlers
const focusInput = () => {
  messageInput.value?.focus()
}

const clearCurrentChat = async () => {
  if (currentChat.value && confirm('Clear all messages in current chat?')) {
    // TODO: Implement clear chat in store
    await createNewChat()
  }
}

const selectPrevChat = () => {
  const currentIndex = chats.value.findIndex(c => c.id === currentChatId.value)
  if (currentIndex > 0) {
    selectChat(chats.value[currentIndex - 1].id)
  }
}

const selectNextChat = () => {
  const currentIndex = chats.value.findIndex(c => c.id === currentChatId.value)
  if (currentIndex < chats.value.length - 1) {
    selectChat(chats.value[currentIndex + 1].id)
  }
}

// Voice input handlers
const toggleVoiceInput = () => {
  isVoiceInputActive.value = !isVoiceInputActive.value
  
  if (!isVoiceInputActive.value) {
    // Focus back to text input when stopping voice
    nextTick(() => {
      messageInput.value?.focus()
    })
  }
}

const handleVoiceTranscript = (transcript: string, confidence: number) => {
  // If confidence is high, add to input
  if (confidence > 0.7) {
    if (inputMessage.value.trim()) {
      inputMessage.value += ' ' + transcript
    } else {
      inputMessage.value = transcript
    }
  }
}

const handleRecordingStop = () => {
  // Auto-stop voice input when recording stops
  isVoiceInputActive.value = false
  
  // Focus back to textarea
  nextTick(() => {
    messageInput.value?.focus()
  })
}

const handleVoiceError = (error: string) => {
  console.error('Voice input error:', error)
  isVoiceInputActive.value = false
}

// Message handlers for optimized component
const retryMessage = async (message: any) => {
  // TODO: Implement retry logic
  console.log('Retry message:', message)
}

const editMessage = async (message: any) => {
  // TODO: Implement edit logic
  console.log('Edit message:', message)
}

const deleteMessage = async (message: any) => {
  // TODO: Implement delete logic
  console.log('Delete message:', message)
}

// Model switcher handlers
const handleModelChanged = (modelId: string) => {
  console.log('Model changed to:', modelId)
  toast.success('Model switched successfully', 'AI Model Changed')
}

const handleSettingsOpened = () => {
  // Additional logic when settings are opened from model switcher
  console.log('Settings opened from model switcher')
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() && attachments.value.length === 0) return
  if (isLoading.value) return
  
  const message = inputMessage.value
  const messageAttachments = [...attachments.value]
  
  inputMessage.value = ''
  attachments.value = []
  
  // Build message content with attachments
  let fullContent = message
  
  // Add image attachments as markdown
  for (const attachment of messageAttachments) {
    if (attachment.type === 'image' && attachment.data) {
      fullContent = `![${attachment.name}](${attachment.data})\n\n${fullContent}`
    } else if (attachment.type === 'text' && attachment.content) {
      fullContent = `${fullContent}\n\n\`\`\`\n${attachment.content}\n\`\`\``
    }
  }
  
  // Add user message
  const userMessage = await chatStore.addMessage({
    role: 'user',
    content: fullContent
  })
  
  // Index the new user message for search
  if (userMessage && currentChat.value) {
    searchService.indexMessage({
      ...userMessage,
      chatId: currentChat.value.id,
      chatTitle: currentChat.value.title
    })
  }
  
  // Scroll to bottom
  await nextTick()
  messagesContainer.value?.scrollTo({
    top: messagesContainer.value.scrollHeight,
    behavior: 'smooth'
  })
  
  // Check if LLM is configured
  const isConfigured = await window.api.llm.isConfigured()
  if (!isConfigured) {
    await chatStore.addMessage({
      role: 'assistant',
      content: 'Please configure an LLM provider in settings to start chatting.'
    })
    return
  }
  
  isLoading.value = true
  
  // Create assistant message placeholder
  const assistantMessage = await chatStore.addMessage({
    role: 'assistant',
    content: ''
  })
  
  try {
    // Set up streaming listener
    let streamedContent = ''
    const cleanupChunk = window.api.llm.onChunk((data: any) => {
      if (data.chatId === currentChat.value?.id && data.messageId === assistantMessage.id) {
        streamedContent += data.chunk
        // Update message content in real-time
        const msg = currentChat.value?.messages.find(m => m.id === assistantMessage.id)
        if (msg) {
          msg.content = streamedContent
        }
        
        // Auto-scroll during streaming
        nextTick(() => {
          messagesContainer.value?.scrollTo({
            top: messagesContainer.value.scrollHeight,
            behavior: 'smooth'
          })
        })
      }
    })
    
    // Set up tool status listener
    const cleanupStatus = window.api.llm.onStatus((data: any) => {
      if (data.chatId === currentChat.value?.id && data.messageId === assistantMessage.id) {
        console.log('Tool status:', data.status, data.tools)
      }
    })
    
    // Set up tool call listener
    const cleanupToolCall = window.api.llm.onToolCall((data: any) => {
      if (data.chatId === currentChat.value?.id && data.messageId === assistantMessage.id) {
        console.log('Tool called:', data.tool, data.args)
        // Add tool call info to message
        const msg = currentChat.value?.messages.find(m => m.id === assistantMessage.id)
        if (msg) {
          msg.content = streamedContent + `\n\n🔧 Using tool: ${data.tool}`
        }
      }
    })
    
    // Send message to LLM
    const response = await window.api.llm.sendMessage(
      fullContent,
      currentChat.value!.id,
      assistantMessage.id
    )
    
    // Final update with complete response
    const msg = currentChat.value?.messages.find(m => m.id === assistantMessage.id)
    if (msg) {
      msg.content = response
      
      // Index the assistant's response for search
      if (currentChat.value) {
        searchService.indexMessage({
          ...msg,
          chatId: currentChat.value.id,
          chatTitle: currentChat.value.title
        })
      }
    }
    
    // Clean up listeners
    cleanupChunk()
    cleanupStatus()
    cleanupToolCall()
  } catch (error: any) {
    // Update message with error
    const msg = currentChat.value?.messages.find(m => m.id === assistantMessage.id)
    if (msg) {
      msg.content = `Error: ${error.message}`
    }
  } finally {
    isLoading.value = false
    
    // Final scroll
    await nextTick()
    messagesContainer.value?.scrollTo({
      top: messagesContainer.value.scrollHeight,
      behavior: 'smooth'
    })
  }
}
</script>

<style scoped>
.sidebar {
  -webkit-app-region: no-drag;
}

textarea {
  field-sizing: content;
}

/* Custom scrollbar for sidebar */
.sidebar ::-webkit-scrollbar {
  width: 6px;
}

.sidebar ::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar ::-webkit-scrollbar-thumb {
  background: rgb(var(--muted-foreground) / 0.3);
  border-radius: 3px;
}

.sidebar ::-webkit-scrollbar-thumb:hover {
  background: rgb(var(--muted-foreground) / 0.5);
}

/* Message animations */
.message-wrapper {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Smooth transitions for interactive elements */
.chat-item {
  transition: all 0.2s ease;
}

/* Focus states */
textarea:focus {
  outline: none;
}

/* Loading animation for messages */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
}

/* Search highlight animation */
.highlight-message {
  animation: highlightPulse 2s ease-out;
}

@keyframes highlightPulse {
  0% {
    background-color: rgb(var(--warning) / 0.3);
    transform: scale(1.02);
  }
  50% {
    background-color: rgb(var(--warning) / 0.15);
    transform: scale(1.01);
  }
  100% {
    background-color: transparent;
    transform: scale(1);
  }
}
</style>