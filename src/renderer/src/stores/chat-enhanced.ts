import { defineStore } from 'pinia'
import { ref, computed, nextTick } from 'vue'
import { nanoid } from 'nanoid'
import type { Chat, Message, Attachment } from '@renderer/src/types'
import { useErrorHandler } from '@renderer/src/composables/useErrorHandler'
import { performanceMonitor } from '@renderer/src/utils/performance'
import { searchService } from '@renderer/src/services/search/SearchService'

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

  // Computed
  const currentChat = computed(() => {
    if (!currentChatId.value) return null
    return chats.value.find(chat => chat.id === currentChatId.value) || null
  })

  const currentMessages = computed(() => {
    if (!currentChatId.value) return []
    return messages.value.get(currentChatId.value) || []
  })

  const canSendMessage = computed(() => {
    return !isLoading.value && !isGenerating.value && currentChatId.value !== null
  })

  const chatList = computed(() => {
    return [...chats.value].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  })

  // Actions
  const loadChats = async () => {
    const mark = performanceMonitor.mark('load-chats')
    
    try {
      isLoading.value = true
      
      // Check if using new API or legacy database API
      if (window.api.chat?.getChats) {
        const loadedChats = await window.api.chat.getChats()
        chats.value = loadedChats
        
        // Load messages for each chat and index them
        const allMessages: Message[] = []
        for (const chat of loadedChats) {
          if (!messages.value.has(chat.id)) {
            const chatMessages = await window.api.chat.getMessages(chat.id)
            messages.value.set(chat.id, chatMessages)
            allMessages.push(...chatMessages)
          }
        }
        
        // Index all loaded messages for search
        if (allMessages.length > 0) {
          await searchService.indexMessages(allMessages)
        }
      } else {
        // Legacy database API
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
      }
      
      isInitialized.value = true
    } catch (error) {
      handleError(error, 'Load Chats')
    } finally {
      isLoading.value = false
      mark()
    }
  }

  // Load messages for a specific chat (legacy compatibility)
  const loadMessages = async (chatId: string) => {
    try {
      if (window.api.chat?.getMessages) {
        const chatMessages = await window.api.chat.getMessages(chatId)
        messages.value.set(chatId, chatMessages)
        
        // Index loaded messages for search
        if (chatMessages.length > 0) {
          await searchService.indexMessages(chatMessages)
        }
      } else {
        // Legacy database API
        const dbMessages = await window.api.db.getMessages(chatId)
        const formattedMessages = dbMessages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.created_at),
          createdAt: new Date(msg.created_at)
        }))
        messages.value.set(chatId, formattedMessages)
        
        // Index loaded messages for search
        if (formattedMessages.length > 0) {
          await searchService.indexMessages(formattedMessages)
        }
        
        // Update chat object
        const chat = chats.value.find(c => c.id === chatId)
        if (chat) {
          chat.messages = formattedMessages
        }
      }
    } catch (error) {
      handleError(error, 'Load Messages')
    }
  }

  const createChat = async (title?: string): Promise<string | null> => {
    try {
      isLoading.value = true
      
      let chatId: string
      let newChat: Chat
      
      if (window.api.chat?.createChat) {
        chatId = await window.api.chat.createChat({
          title: title || 'New Chat'
        })
        
        newChat = {
          id: chatId,
          title: title || 'New Chat',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      } else {
        // Legacy database API
        const now = new Date()
        chatId = nanoid()
        
        newChat = {
          id: chatId,
          title: title || 'New Chat',
          messages: [],
          createdAt: now,
          updatedAt: now
        }
        
        await window.api.db.createChat({
          id: newChat.id,
          title: newChat.title,
          created_at: now.toISOString(),
          updated_at: now.toISOString()
        })
      }
      
      chats.value.unshift(newChat)
      messages.value.set(chatId, [])
      
      return chatId
    } catch (error) {
      handleError(error, 'Create Chat')
      return null
    } finally {
      isLoading.value = false
    }
  }

  const selectChat = async (chatId: string) => {
    try {
      currentChatId.value = chatId
      
      // Load messages if not already loaded
      if (!messages.value.has(chatId)) {
        await loadMessages(chatId)
      }
      
      // Persist selection
      localStorage.setItem('lastSelectedChatId', chatId)
    } catch (error) {
      handleError(error, 'Select Chat')
    }
  }

  const deleteChat = async (chatId: string) => {
    try {
      if (window.api.chat?.deleteChat) {
        await window.api.chat.deleteChat(chatId)
      } else {
        // Legacy database API
        await window.api.db.deleteChat(chatId)
      }
      
      // Remove from local state
      chats.value = chats.value.filter(chat => chat.id !== chatId)
      messages.value.delete(chatId)
      
      // Clear current chat if it was deleted
      if (currentChatId.value === chatId) {
        currentChatId.value = chats.value[0]?.id || null
        if (currentChatId.value) {
          localStorage.setItem('lastSelectedChatId', currentChatId.value)
        } else {
          localStorage.removeItem('lastSelectedChatId')
        }
      }
    } catch (error) {
      handleError(error, 'Delete Chat')
    }
  }

  const updateChatTitle = async (chatId: string, title: string) => {
    try {
      if (window.api.chat?.updateChat) {
        await window.api.chat.updateChat(chatId, { title })
      } else {
        // Legacy database API
        const now = new Date()
        await window.api.db.updateChat(chatId, title, now.toISOString())
      }
      
      const chat = chats.value.find(c => c.id === chatId)
      if (chat) {
        chat.title = title
        chat.updatedAt = new Date()
      }
    } catch (error) {
      handleError(error, 'Update Chat Title')
    }
  }

  const sendMessage = async (content: string, attachments: Attachment[] = []): Promise<void> => {
    let targetChatId = currentChatId.value
    
    // Create new chat if none selected
    if (!targetChatId) {
      targetChatId = await createChat()
      if (!targetChatId) return
      currentChatId.value = targetChatId
    }

    try {
      isGenerating.value = true
      
      // Add user message immediately
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        content,
        role: 'user',
        timestamp: new Date(),
        chatId: targetChatId,
        attachments
      }
      
      await addMessageToChat(targetChatId, userMessage)
      
      // Create placeholder for assistant response
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: '',
        role: 'assistant',
        timestamp: new Date(),
        chatId: targetChatId,
        pending: true
      }
      
      const chatMessages = messages.value.get(targetChatId) || []
      chatMessages.push(assistantMessage)
      streamingMessageId.value = assistantMessage.id
      
      // Send message to backend
      if (window.api.chat?.sendMessage) {
        const response = await window.api.chat.sendMessage({
          chatId: targetChatId,
          content,
          attachments,
          stream: true
        })
        
        if (response.stream) {
          await handleStreamingResponse(response.stream, assistantMessage)
        } else {
          assistantMessage.content = response.content || ''
          assistantMessage.pending = false
        }
      } else {
        // Legacy: simulate response (or implement legacy API call)
        assistantMessage.content = 'This is a simulated response'
        assistantMessage.pending = false
      }
      
      // Update chat timestamp
      const chat = chats.value.find(c => c.id === targetChatId)
      if (chat) {
        chat.updatedAt = new Date()
        
        // Update title based on first user message
        if (chat.messages.length <= 2 && userMessage.role === 'user') { // User + assistant message
          const newTitle = content.slice(0, 30) + (content.length > 30 ? '...' : '')
          await updateChatTitle(targetChatId, newTitle)
        }
      }
      
    } catch (error) {
      handleError(error, 'Send Message')
      
      // Mark message as error
      if (targetChatId && streamingMessageId.value) {
        const chatMessages = messages.value.get(targetChatId) || []
        const index = chatMessages.findIndex(m => m.id === streamingMessageId.value)
        if (index >= 0) {
          chatMessages[index].error = true
          chatMessages[index].pending = false
        }
      }
    } finally {
      isGenerating.value = false
      streamingContent.value = ''
      streamingMessageId.value = null
    }
  }

  const addMessageToChat = async (chatId: string, message: Message) => {
    // Add to local state
    const chatMessages = messages.value.get(chatId) || []
    chatMessages.push(message)
    messages.value.set(chatId, chatMessages)
    
    // Update chat object
    const chat = chats.value.find(c => c.id === chatId)
    if (chat) {
      chat.messages = chatMessages
    }
    
    // Index message for search
    try {
      await searchService.indexMessage(message)
    } catch (error) {
      console.warn('Failed to index message for search:', error)
    }
    
    // Persist to database if using legacy API
    if (window.api.db?.createMessage) {
      try {
        await window.api.db.createMessage({
          id: message.id,
          chat_id: chatId,
          role: message.role,
          content: message.content || '',
          created_at: (message.timestamp || new Date()).toISOString()
        })
      } catch (error) {
        console.warn('Failed to persist message:', error)
      }
    }
  }

  const handleStreamingResponse = async (stream: ReadableStream, message: Message) => {
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    
    try {
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break
        
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.content) {
                message.content += data.content
                streamingContent.value = message.content
              }
              
              if (data.done) {
                message.pending = false
                
                // Re-index the completed message for search
                try {
                  await searchService.indexMessage(message)
                } catch (error) {
                  console.warn('Failed to re-index completed message:', error)
                }
                
                return
              }
            } catch (e) {
              // Ignore JSON parse errors for partial chunks
            }
          }
        }
        
        // Trigger reactivity update
        await nextTick()
      }
    } finally {
      reader.releaseLock()
      message.pending = false
      
      // Re-index the completed message for search (fallback)
      if (message.content) {
        try {
          await searchService.indexMessage(message)
        } catch (error) {
          console.warn('Failed to re-index completed message:', error)
        }
      }
    }
  }

  const retryMessage = async (messageId: string) => {
    const chatMessages = messages.value.get(currentChatId.value!) || []
    const messageIndex = chatMessages.findIndex(m => m.id === messageId)
    
    if (messageIndex >= 0) {
      const message = chatMessages[messageIndex]
      
      // Find the user message before this one
      const userMessage = chatMessages
        .slice(0, messageIndex)
        .reverse()
        .find(m => m.role === 'user')
      
      if (userMessage) {
        // Remove failed message and retry
        chatMessages.splice(messageIndex, 1)
        await sendMessage(userMessage.content || '', userMessage.attachments || [])
      }
    }
  }

  const deleteMessage = async (messageId: string) => {
    try {
      if (window.api.chat?.deleteMessage) {
        await window.api.chat.deleteMessage(messageId)
      }
      
      // Remove from local state
      for (const chatMessages of messages.value.values()) {
        const index = chatMessages.findIndex(m => m.id === messageId)
        if (index >= 0) {
          chatMessages.splice(index, 1)
          break
        }
      }
    } catch (error) {
      handleError(error, 'Delete Message')
    }
  }

  const searchMessages = (query: string, chatId?: string) => {
    const results: { message: Message; chat: Chat }[] = []
    const searchTerm = query.toLowerCase()
    
    const chatsToSearch = chatId 
      ? chats.value.filter(c => c.id === chatId)
      : chats.value
    
    for (const chat of chatsToSearch) {
      const chatMessages = messages.value.get(chat.id) || []
      
      for (const message of chatMessages) {
        if (message.content?.toLowerCase().includes(searchTerm)) {
          results.push({ message, chat })
        }
      }
    }
    
    return results
  }

  // Shortcut methods
  const createNewChat = async () => {
    const newChatId = await createChat()
    if (newChatId) {
      await selectChat(newChatId)
    }
  }

  const switchToChat = async (index: number) => {
    if (index >= 0 && index < chats.value.length) {
      const chat = chatList.value[index] // Use sorted chat list
      if (chat) {
        await selectChat(chat.id)
      }
    }
  }

  // Current message handling for shortcuts
  const currentDraftMessage = ref('')
  
  const setCurrentDraftMessage = (message: string) => {
    currentDraftMessage.value = message
  }

  const sendCurrentMessage = async () => {
    if (currentDraftMessage.value.trim() && canSendMessage.value) {
      const message = currentDraftMessage.value
      currentDraftMessage.value = ''
      await sendMessage(message)
    }
  }

  // Initialize store
  const initialize = async () => {
    try {
      await loadChats()
      
      // Restore last selected chat
      const lastChatId = localStorage.getItem('lastSelectedChatId')
      if (lastChatId && chats.value.some(c => c.id === lastChatId)) {
        await selectChat(lastChatId)
      } else if (chats.value.length === 0) {
        // Create default chat if no chats exist
        const newChatId = await createChat()
        if (newChatId) {
          await selectChat(newChatId)
        }
      } else if (chats.value.length > 0 && !currentChatId.value) {
        // Select first chat if none selected
        await selectChat(chats.value[0].id)
      }
    } catch (error) {
      handleError(error, 'Initialize Chat Store')
    }
  }

  return {
    // State
    chats,
    currentChatId,
    messages,
    isLoading,
    isGenerating,
    streamingContent,
    streamingMessageId,
    isInitialized,
    
    // Computed
    currentChat,
    currentMessages,
    canSendMessage,
    chatList,
    
    // Actions
    loadChats,
    createChat,
    selectChat,
    deleteChat,
    updateChatTitle,
    sendMessage,
    retryMessage,
    deleteMessage,
    searchMessages,
    initialize,
    
    // Shortcut methods
    createNewChat,
    switchToChat,
    currentDraftMessage,
    setCurrentDraftMessage,
    sendCurrentMessage,
    
    // Legacy compatibility
    addMessage: (messageData: Omit<Message, 'id' | 'timestamp'>) => {
      const message: Message = {
        ...messageData,
        id: nanoid(),
        timestamp: new Date()
      }
      return addMessageToChat(currentChatId.value!, message)
    }
  }
}, {
  persist: {
    key: 'miaoda-chat-store',
    paths: ['currentChatId'],
    storage: localStorage
  }
})