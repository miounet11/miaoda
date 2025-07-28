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
          <div class="relative">
            <textarea
              v-model="inputMessage"
              @keydown.enter.prevent="handleSend"
              placeholder="Type your message..."
              class="w-full min-h-[56px] max-h-[200px] px-4 py-3 pr-12 bg-muted rounded-2xl resize-none outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              :rows="1"
            />
            <button
              @click="sendMessage"
              :disabled="!inputMessage.trim() || isLoading"
              class="absolute bottom-3 right-3 p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              :class="[
                inputMessage.trim() && !isLoading 
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
import { ref, computed, nextTick, onMounted } from 'vue'
import { Plus, Send, Settings } from 'lucide-vue-next'
import { useChatStore } from '@/stores/chat'
import { formatDistanceToNow } from '@/utils/time'
import MessageContent from '@/components/MessageContent.vue'

const chatStore = useChatStore()
const messagesContainer = ref<HTMLElement>()
const inputMessage = ref('')
const isLoading = ref(false)

// Initialize store on mount
onMounted(async () => {
  await chatStore.initialize()
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

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return
  
  const message = inputMessage.value
  inputMessage.value = ''
  
  // Add user message
  await chatStore.addMessage({
    role: 'user',
    content: message
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
      message,
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