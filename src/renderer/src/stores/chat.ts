import { defineStore } from 'pinia'
import { ref, computed, nextTick } from 'vue'
import { nanoid } from 'nanoid'
import type { Chat, Message, Attachment } from '@renderer/src/types'
import { useErrorHandler } from '@renderer/src/composables/useErrorHandler'
import { performanceMonitor } from '@renderer/src/utils/performance'

export const useChatStore = defineStore('chat', () => {
  // State
  const chats = ref<Chat[]>([])
  const currentChatId = ref<string | null>(null)
  const messages = ref<Map<string, Message[]>>(new Map())
  const isLoading = ref(false)
  const isGenerating = ref(false)
  const streamingContent = ref('')
  const streamingMessageId = ref<string | null>(null)
  const isInitialized = ref(false)

  // Error handling
  const { handleError } = useErrorHandler()
  
  const currentChat = computed(() => 
    chats.value.find(chat => chat.id === currentChatId.value)
  )
  
  // Load chats from database
  const loadChats = async () => {
    try {
      const dbChats = await window.api.db.getAllChats()
      chats.value = dbChats.map(chat => ({
        ...chat,
        messages: [],
        createdAt: new Date(chat.created_at),
        updatedAt: new Date(chat.updated_at)
      }))
      
      // Load messages for current chat if exists
      if (currentChatId.value) {
        await loadMessages(currentChatId.value)
      }
      
      isInitialized.value = true
    } catch (error) {
      console.error('Failed to load chats:', error)
    }
  }
  
  // Load messages for a specific chat
  const loadMessages = async (chatId: string) => {
    try {
      const dbMessages = await window.api.db.getMessages(chatId)
      const chat = chats.value.find(c => c.id === chatId)
      if (chat) {
        chat.messages = dbMessages.map(msg => ({
          ...msg,
          createdAt: new Date(msg.created_at)
        }))
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }
  
  const createChat = async () => {
    const now = new Date()
    const newChat: Chat = {
      id: nanoid(),
      title: 'New Chat',
      messages: [],
      createdAt: now,
      updatedAt: now
    }
    
    // Save to database
    await window.api.db.createChat({
      id: newChat.id,
      title: newChat.title,
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    })
    
    chats.value.unshift(newChat)
    currentChatId.value = newChat.id
    
    return newChat
  }
  
  const selectChat = async (chatId: string) => {
    currentChatId.value = chatId
    await loadMessages(chatId)
  }
  
  const addMessage = async (messageData: Omit<Message, 'id' | 'createdAt'>) => {
    if (!currentChat.value) {
      await createChat()
    }
    
    const now = new Date()
    const message: Message = {
      ...messageData,
      id: nanoid(),
      createdAt: now
    }
    
    // Save to database
    await window.api.db.createMessage({
      id: message.id,
      chat_id: currentChat.value!.id,
      role: message.role,
      content: message.content,
      created_at: now.toISOString()
    })
    
    currentChat.value!.messages.push(message)
    currentChat.value!.updatedAt = now
    
    // Update title based on first user message
    if (currentChat.value!.messages.length === 1 && message.role === 'user') {
      const newTitle = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '')
      currentChat.value!.title = newTitle
      
      // Update in database
      await window.api.db.updateChat(
        currentChat.value!.id,
        newTitle,
        now.toISOString()
      )
    }
    
    return message
  }
  
  const deleteChat = async (chatId: string) => {
    // Delete from database
    await window.api.db.deleteChat(chatId)
    
    const index = chats.value.findIndex(chat => chat.id === chatId)
    if (index > -1) {
      chats.value.splice(index, 1)
      
      if (currentChatId.value === chatId) {
        currentChatId.value = chats.value[0]?.id || null
      }
    }
  }
  
  // Initialize on mount
  const initialize = async () => {
    await loadChats()
    
    // Create default chat if no chats exist
    if (chats.value.length === 0) {
      await createChat()
    }
  }
  
  return {
    chats,
    currentChatId,
    currentChat,
    isInitialized,
    initialize,
    createChat,
    selectChat,
    addMessage,
    deleteChat,
    loadChats
  }
})