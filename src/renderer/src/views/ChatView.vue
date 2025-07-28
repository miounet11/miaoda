<template>
  <div class="chat-view flex h-full">
    <!-- Sidebar -->
    <aside class="sidebar w-64 bg-secondary/30 backdrop-blur-sm border-r flex flex-col">
      <div class="p-3 border-b">
        <div class="flex gap-2">
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
    <main class="flex-1 flex flex-col">
      <!-- Chat messages -->
      <div class="flex-1 overflow-y-auto px-4 py-6" ref="messagesContainer">
        <div class="max-w-3xl mx-auto">
          <div v-if="!currentChat?.messages.length" class="text-center py-20">
            <div class="inline-flex items-center justify-center w-20 h-20 mb-6 bg-primary/10 rounded-full">
              <MessageSquare :size="40" class="text-primary" />
            </div>
            <h2 class="text-2xl font-semibold mb-4">Welcome to MiaoDa Chat</h2>
            <p class="text-muted-foreground mb-8">Start a conversation with your AI assistant</p>
            
            <!-- Quick start suggestions -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg mx-auto">
              <button
                v-for="suggestion in quickSuggestions"
                :key="suggestion"
                @click="sendQuickMessage(suggestion)"
                class="text-left p-4 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
              >
                <p class="text-sm">{{ suggestion }}</p>
              </button>
            </div>
          </div>
          
          <div v-else class="space-y-6">
            <div 
              v-for="(message, index) in currentChat.messages" 
              :key="message.id"
              :class="[
                'message-wrapper flex gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              ]"
            >
              <!-- Avatar for assistant -->
              <div v-if="message.role === 'assistant'" class="flex-shrink-0">
                <div class="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Bot :size="18" class="text-primary" />
                </div>
              </div>
              
              <div class="flex flex-col gap-1 max-w-[85%]">
                <div 
                  :class="[
                    'message-content rounded-2xl px-4 py-3',
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  ]"
                >
                  <MessageContent 
                    :content="message.content" 
                    :isLoading="isLoading && message === currentChat.messages[currentChat.messages.length - 1] && message.role === 'assistant'"
                  />
                </div>
                
                <!-- Message status for user messages -->
                <div v-if="message.role === 'user' && index === currentChat.messages.length - 2 && isLoading" 
                     class="text-xs text-muted-foreground text-right flex items-center justify-end gap-1">
                  <Loader2 :size="12" class="animate-spin" />
                  <span>AI is thinking...</span>
                </div>
              </div>
              
              <!-- Avatar for user -->
              <div v-if="message.role === 'user'" class="flex-shrink-0">
                <div class="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                  <User :size="18" class="text-secondary-foreground" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Input area -->
      <div class="border-t bg-background/95 backdrop-blur px-4 py-4">
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
            <div class="flex items-end gap-2 p-2 bg-muted/50 rounded-2xl border border-transparent focus-within:border-primary/20 transition-all">
              <!-- Action buttons -->
              <div class="flex gap-1 pb-1">
                <button
                  @click="selectFiles"
                  class="p-2 hover:bg-background rounded-lg transition-colors group"
                  title="Attach files (images, documents)"
                >
                  <Paperclip :size="18" class="group-hover:text-primary transition-colors" />
                </button>
              </div>
              
              <!-- Input field -->
              <textarea
                v-model="inputMessage"
                @keydown.enter.prevent="handleSend"
                @paste="handlePaste"
                :placeholder="getPlaceholder()"
                class="flex-1 min-h-[40px] max-h-[200px] px-2 py-2 bg-transparent resize-none outline-none placeholder:text-muted-foreground/60"
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
                  <Send :size="18" />
                </button>
              </div>
            </div>
            
            <!-- Keyboard shortcut hint -->
            <div class="absolute -bottom-6 left-0 text-xs text-muted-foreground">
              Press <kbd class="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> to send, 
              <kbd class="px-1 py-0.5 bg-muted rounded text-xs">Shift+Enter</kbd> for new line
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { Plus, Send, Settings, Paperclip, X, FileText, Bot, User, MessageSquare, Loader2, AlertCircle } from 'lucide-vue-next'
import { useChatStore } from '@/stores/chat'
import { formatDistanceToNow } from '@/utils/time'
import MessageContent from '@/components/MessageContent.vue'

interface Attachment {
  name: string
  type: 'image' | 'text' | 'file'
  data?: string
  content?: string
}

const chatStore = useChatStore()
const messagesContainer = ref<HTMLElement>()
const messageInput = ref<HTMLTextAreaElement>()
const inputMessage = ref('')
const isLoading = ref(false)
const attachments = ref<Attachment[]>([])
const isConfigured = ref(false)

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
  
  // Setup shortcut listeners
  window.addEventListener('app:new-chat', createNewChat)
  window.addEventListener('app:focus-input', focusInput)
  window.addEventListener('app:clear-chat', clearCurrentChat)
  window.addEventListener('app:prev-chat', selectPrevChat)
  window.addEventListener('app:next-chat', selectNextChat)
})

// Cleanup
onUnmounted(() => {
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
}

const selectChat = (chatId: string) => {
  chatStore.selectChat(chatId)
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
  await chatStore.addMessage({
    role: 'user',
    content: fullContent
  })
  
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
</style>