<template>
  <div class="chat-view flex h-full">
    <!-- Sidebar -->
    <aside class="sidebar w-64 bg-secondary/50 border-r flex flex-col">
      <div class="p-4 border-b space-y-2">
        <button 
          @click="createNewChat"
          class="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <Plus :size="18" />
          New Chat
        </button>
        <button
          @click="$router.push('/settings')"
          class="w-full px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
        >
          <Settings :size="18" />
          Settings
        </button>
      </div>
      
      <div class="flex-1 overflow-y-auto p-2">
        <div 
          v-for="chat in chats" 
          :key="chat.id"
          @click="selectChat(chat.id)"
          :class="[
            'chat-item px-3 py-2.5 rounded-lg cursor-pointer transition-all mb-1',
            currentChatId === chat.id ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
          ]"
        >
          <div class="font-medium text-sm truncate">{{ chat.title }}</div>
          <div class="text-xs text-muted-foreground mt-0.5">{{ formatTime(chat.updatedAt) }}</div>
        </div>
      </div>
    </aside>

    <!-- Main chat area -->
    <main class="flex-1 flex flex-col">
      <!-- Chat messages -->
      <div class="flex-1 overflow-y-auto px-4 py-6" ref="messagesContainer">
        <div class="max-w-3xl mx-auto">
          <div v-if="!currentChat?.messages.length" class="text-center py-20">
            <h2 class="text-2xl font-semibold mb-4">Welcome to MiaoDa Chat</h2>
            <p class="text-muted-foreground">Start a conversation with AI assistant</p>
          </div>
          
          <div v-else class="space-y-6">
            <div 
              v-for="message in currentChat.messages" 
              :key="message.id"
              :class="[
                'message-wrapper flex gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              ]"
            >
              <div 
                :class="[
                  'message-content max-w-[85%] rounded-2xl px-4 py-3',
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground ml-12' 
                    : 'bg-muted'
                ]"
              >
                <MessageContent 
                  :content="message.content" 
                  :isLoading="isLoading && message === currentChat.messages[currentChat.messages.length - 1] && message.role === 'assistant'"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Input area -->
      <div class="border-t bg-background px-4 py-4">
        <div class="max-w-3xl mx-auto">
          <!-- Attachments preview -->
          <div v-if="attachments.length > 0" class="mb-2 flex flex-wrap gap-2">
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
          
          <div class="relative flex items-end gap-2">
            <div class="flex gap-1">
              <button
                @click="selectFiles"
                class="p-2 hover:bg-muted rounded-lg transition-colors"
                title="Attach files"
              >
                <Paperclip :size="18" />
              </button>
            </div>
            
            <textarea
              v-model="inputMessage"
              @keydown.enter.prevent="handleSend"
              @paste="handlePaste"
              placeholder="Type your message..."
              class="flex-1 min-h-[56px] max-h-[200px] px-4 py-3 pr-12 bg-muted rounded-2xl resize-none outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              :rows="1"
            />
            
            <button
              @click="sendMessage"
              :disabled="(!inputMessage.trim() && attachments.length === 0) || isLoading"
              class="absolute bottom-2 right-2 p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              :class="[
                (inputMessage.trim() || attachments.length > 0) && !isLoading 
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                  : 'bg-muted-foreground/20 text-muted-foreground'
              ]"
            >
              <Send :size="18" />
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { Plus, Send, Settings, Paperclip, X, FileText } from 'lucide-vue-next'
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
const inputMessage = ref('')
const isLoading = ref(false)
const attachments = ref<Attachment[]>([])

// Initialize store on mount
onMounted(async () => {
  await chatStore.initialize()
  
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

// Shortcut handlers
const focusInput = () => {
  const textarea = document.querySelector('textarea')
  textarea?.focus()
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
    const cleanup = window.api.llm.onChunk((data: any) => {
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
    
    // Clean up listener
    cleanup()
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
  min-height: 56px;
}
</style>