import { defineStore } from 'pinia'
import { ref, computed, nextTick } from 'vue'
import { nanoid } from 'nanoid'
import type { Chat, Message, Attachment } from '@renderer/src/types'
import { useErrorHandler } from '@renderer/src/composables/useErrorHandler'
import { performanceMonitor } from '@renderer/src/utils/performance'
import { logger } from '../utils/Logger'

export const useChatStore = defineStore('chat', () => {
  // State
  const chats = ref<Chat[]>([])
  const currentChatId = ref<string | null>(null)
  // Ensure messages is always a Map
  const messages = ref<Map<string, Message[]>>(new Map())
  const isLoading = ref(false)
  const isGenerating = ref(false)
  const streamingContent = ref('')
  const streamingMessageId = ref<string | null>(null)
  const isInitialized = ref(false)
  
  // Helper to ensure messages.value is always a Map
  const ensureMessagesMap = () => {
    if (!(messages.value instanceof Map)) {
      console.warn('[ChatStore] messages.value was not a Map, reinitializing...')
      messages.value = new Map()
    }
  }

  // Error handling
  const { handleError } = useErrorHandler()
  
  const currentChat = computed(() => {
    const chat = chats.value.find(chat => chat.id === currentChatId.value)
    // 确保消息数组被初始化
    if (chat) {
      if (!chat.messages) {
        chat.messages = []
      }
      // Check if messages is actually a Map and get cached messages
      ensureMessagesMap()
      const mapMessages = messages.value.get(chat.id)
      if (mapMessages && mapMessages.length > 0 && chat.messages.length === 0) {
        chat.messages = mapMessages
      }
    }
    return chat
  })
  
  // Safe accessor for current messages
  const currentMessages = computed(() => {
    if (!currentChatId.value) return []
    
    // First try to get from current chat
    if (currentChat.value?.messages) {
      return currentChat.value.messages
    }
    
    // Fallback to messages Map
    ensureMessagesMap()
    return messages.value.get(currentChatId.value) || []
  })
  
  // Load chats from database
  const loadChats = async () => {
    try {
      console.log('[ChatStore] Starting to load chats...')
      const dbChats = await window.api.db.getAllChats()
      console.log(`[ChatStore] Loaded ${dbChats.length} chats from database`)
      
      chats.value = dbChats.map(chat => ({
        ...chat,
        messages: [],
        createdAt: new Date(chat.created_at),
        updatedAt: new Date(chat.updated_at)
      }))
      
      // Load messages for all chats to ensure they persist after refresh
      // This is important for data persistence
      console.log('[ChatStore] Loading messages for all chats...')
      for (const chat of chats.value) {
        try {
          const dbMessages = await window.api.db.getMessages(chat.id)
          console.log(`[ChatStore] Loading ${dbMessages.length} messages for chat ${chat.id} (${chat.title})`)
          chat.messages = dbMessages.map(msg => ({
            id: msg.id,
            role: msg.role,
            content: msg.content || '',  // Ensure content is never undefined or null
            timestamp: new Date(msg.created_at),
            createdAt: new Date(msg.created_at),
            chatId: chat.id,
            attachments: (() => {
              try {
                if (!msg.attachments) return []
                if (typeof msg.attachments === 'string') {
                  return JSON.parse(msg.attachments)
                }
                return msg.attachments
              } catch (error) {
                logger.error(`Failed to parse attachments for message ${msg.id}`, 'ChatStore', error)
                return []
              }
            })(),
            metadata: (() => {
              try {
                if (!msg.metadata) return undefined
                if (typeof msg.metadata === 'string') {
                  return JSON.parse(msg.metadata)
                }
                return msg.metadata
              } catch (error) {
                logger.error(`Failed to parse metadata for message ${msg.id}`, 'ChatStore', error)
                return undefined
              }
            })(),
            error: msg.error,
            errorDetails: msg.error_details,
            parentId: msg.parent_id
          }))
          // Also store in the messages Map for quick access
          ensureMessagesMap()
          messages.value.set(chat.id, chat.messages)
        } catch (error) {
          logger.error(`Failed to load messages for chat ${chat.id}`, 'ChatStore', error)
        }
      }
      
      // Restore last selected chat if it exists
      try {
        const lastChatId = localStorage.getItem('lastSelectedChatId')
        if (lastChatId && chats.value.some(c => c.id === lastChatId)) {
          currentChatId.value = lastChatId
        } else if (!currentChatId.value && chats.value.length > 0) {
          currentChatId.value = chats.value[0].id
        }
      } catch (error) {
        logger.error('Failed to restore last selected chat', 'ChatStore', error)
        // Fallback to first chat
        if (chats.value.length > 0) {
          currentChatId.value = chats.value[0].id
        }
      }
      
      isInitialized.value = true
    } catch (error) {
      logger.error('Failed to load chats', 'ChatStore', error)
    }
  }
  
  // Load messages for a specific chat
  const loadMessages = async (chatId: string) => {
    try {
      const dbMessages = await window.api.db.getMessages(chatId)
      const chat = chats.value.find(c => c.id === chatId)
      
      // Map database messages to frontend format
      const mappedMessages = dbMessages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content || '',  // Ensure content is never undefined
        timestamp: new Date(msg.created_at),
        createdAt: new Date(msg.created_at),
        chatId: chatId,
        attachments: (() => {
          try {
            if (!msg.attachments) return []
            if (typeof msg.attachments === 'string') {
              return JSON.parse(msg.attachments)
            }
            return msg.attachments
          } catch (error) {
            logger.error(`Failed to parse attachments for message ${msg.id}`, 'ChatStore', error)
            return []
          }
        })(),
        metadata: (() => {
          try {
            if (!msg.metadata) return undefined
            if (typeof msg.metadata === 'string') {
              return JSON.parse(msg.metadata)
            }
            return msg.metadata
          } catch (error) {
            logger.error(`Failed to parse metadata for message ${msg.id}`, 'ChatStore', error)
            return undefined
          }
        })(),
        error: msg.error,
        errorDetails: msg.error_details,
        parentId: msg.parent_id
      }))
      
      // Update both the chat object and the messages Map
      if (chat) {
        chat.messages = mappedMessages
      }
      ensureMessagesMap()
      messages.value.set(chatId, mappedMessages)
      
      console.log(`Loaded ${mappedMessages.length} messages for chat ${chatId}`)
    } catch (error) {
      logger.error('Failed to load messages', 'ChatStore', error)
      handleError(error)
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
    // Save to localStorage for persistence
    try {
      localStorage.setItem('lastSelectedChatId', chatId)
    } catch (error) {
      logger.error('Failed to save last selected chat', 'ChatStore', error)
    }
    
    // Always reload messages when selecting a chat to ensure fresh data
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
    
    // Ensure we have a current chat
    const chat = currentChat.value
    if (!chat) {
      logger.error('No current chat available', 'ChatStore')
      return message
    }
    
    // Save to database
    try {
      await window.api.db.createMessage({
        id: message.id,
        chat_id: chat.id,
        role: message.role,
        content: message.content,
        created_at: now.toISOString()
      })
    } catch (error) {
      logger.error('Failed to save message to database', 'ChatStore', error)
      handleError(error)
      return message
    }
    
    // Add message to chat
    if (!chat.messages) {
      chat.messages = []
    }
    chat.messages.push(message)
    chat.updatedAt = now
    
    // Update title based on first user message
    if (chat.messages.length === 1 && message.role === 'user') {
      const newTitle = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '')
      chat.title = newTitle
      
      // Update in database
      try {
        await window.api.db.updateChat(
          chat.id,
          newTitle,
          now.toISOString()
        )
      } catch (error) {
        logger.error('Failed to update chat title', 'ChatStore', error)
      }
    }
    
    return message
  }

  const updateMessageContent = async (messageId: string, content: string) => {
    console.log('[ChatStore] updateMessageContent called:', { messageId, contentLength: content.length, contentPreview: content.substring(0, 100) })
    
    if (!currentChat.value) {
      console.log('[ChatStore] No current chat available')
      return
    }

    // Find and update the message in memory
    const message = currentChat.value.messages.find(m => m.id === messageId)
    if (!message) {
      console.log('[ChatStore] Message not found for update:', messageId)
      logger.error('Message not found for update', 'ChatStore', { messageId })
      return
    }

    console.log('[ChatStore] Updating message content in memory:', { before: message.content.length, after: content.length })
    message.content = content

    // Update in database
    try {
      console.log('[ChatStore] Calling database update...')
      await window.api.db.updateMessage(messageId, content)
      console.log('[ChatStore] Database update successful')
      logger.info('Message content updated in database', 'ChatStore', { messageId, contentLength: content.length })
    } catch (error) {
      console.error('[ChatStore] Database update failed:', error)
      logger.error('Failed to update message in database', 'ChatStore', error)
    }
  }
  
  const sendMessage = async (content: string, attachments: Attachment[] = []): Promise<void> => {
    let targetChatId = currentChatId.value
    
    // Create new chat if none selected
    if (!targetChatId) {
      const newChat = await createChat()
      if (!newChat) return
      targetChatId = newChat.id
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
      
      await addMessage(userMessage)
      
      // Create placeholder for assistant response
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: '',
        role: 'assistant',
        timestamp: new Date(),
        chatId: targetChatId,
        pending: true
      }
      
      const chat = chats.value.find(c => c.id === targetChatId)
      if (chat && chat.messages) {
        chat.messages.push(assistantMessage)
      }
      streamingMessageId.value = assistantMessage.id
      
      // Send message to backend using LLM API
      if (window.api.llm?.sendMessage) {
        try {
          // Initialize streaming content
          streamingContent.value = ''
          
          // Save empty assistant message to database first 
          const now = new Date()
          try {
            await window.api.db.createMessage({
              id: assistantMessage.id,
              chat_id: targetChatId,
              role: 'assistant',
              content: '',
              created_at: now.toISOString()
            })
          } catch (dbError) {
            logger.error('Failed to create initial assistant message in database', 'ChatStore', dbError)
          }
          
          // Send message through LLM API - this will trigger streaming via IPC events
          await window.api.llm.sendMessage(
            content,
            targetChatId,
            assistantMessage.id
          )
          
          // Note: The actual response will be handled by the streaming listeners
          // The message content will be updated incrementally through 'llm:chunk' events
          // and finalized through 'llm:stream-complete' event
          
        } catch (error: any) {
          // Handle LLM error
          assistantMessage.content = `Error: ${error.message || 'Failed to get response'}`
          assistantMessage.error = true
          assistantMessage.pending = false
          isGenerating.value = false
          streamingContent.value = ''
          streamingMessageId.value = null
        }
      } else {
        // Fallback if LLM API is not available
        assistantMessage.content = 'Error: LLM service not available'
        assistantMessage.error = true
        assistantMessage.pending = false
        isGenerating.value = false
        streamingContent.value = ''
        streamingMessageId.value = null
      }
      
      // Update chat timestamp
      if (chat) {
        chat.updatedAt = new Date()
        
        // Update title based on first user message
        if (chat.messages.length <= 2 && userMessage.role === 'user') { // User + assistant message
          const newTitle = content.slice(0, 30) + (content.length > 30 ? '...' : '')
          chat.title = newTitle
          // Update title in database if needed
        }
      }
      
    } catch (error) {
      handleError(error, 'Send Message')
      
      // Mark message as error
      if (targetChatId && streamingMessageId.value) {
        const chat = chats.value.find(c => c.id === targetChatId)
        if (chat?.messages) {
          const index = chat.messages.findIndex(m => m.id === streamingMessageId.value)
          if (index >= 0) {
            chat.messages[index].error = true
            chat.messages[index].pending = false
          }
        }
      }
    } finally {
      // Note: Cleanup is now handled by the streaming completion listener
      // to support proper streaming behavior
    }
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
  
  // Set up IPC listeners for streaming responses
  const setupStreamingListeners = () => {
    // Listen for streaming chunks
    window.api.on?.('llm:chunk', (data: { chatId: string; messageId: string; chunk: string }) => {
      console.log('[ChatStore] Received chunk:', data)
      
      // Find the streaming message and update it
      const chat = chats.value.find(c => c.id === data.chatId)
      if (chat && streamingMessageId.value) {
        const message = chat.messages.find(m => m.id === streamingMessageId.value)
        if (message) {
          streamingContent.value += data.chunk
          message.content = streamingContent.value
        }
      }
    })

    // Listen for streaming completion
    window.api.on?.('llm:stream-complete', async (data: { chatId: string; messageId: string; finalContent: string }) => {
      console.log('[ChatStore] Stream complete:', data)
      
      const chat = chats.value.find(c => c.id === data.chatId)
      if (chat && streamingMessageId.value) {
        const message = chat.messages.find(m => m.id === streamingMessageId.value)
        if (message) {
          message.content = data.finalContent
          message.pending = false
          
          // Save to database
          try {
            await updateMessageContent(streamingMessageId.value, data.finalContent)
          } catch (error) {
            logger.error('Failed to save streaming message to database', 'ChatStore', error)
          }
        }
      }
      
      isGenerating.value = false
      streamingContent.value = ''
      streamingMessageId.value = null
    })
  }

  // Initialize on mount
  const initialize = async () => {
    console.log('[ChatStore] Initializing chat store...')
    
    // Set up streaming listeners
    setupStreamingListeners()
    
    // Load all chats and their messages
    await loadChats()
    
    // Create default chat if no chats exist
    if (chats.value.length === 0) {
      console.log('[ChatStore] No chats found, creating default chat...')
      await createChat()
    } else {
      // If we have a persisted currentChatId, ensure it's valid
      if (currentChatId.value) {
        const currentChatData = chats.value.find(c => c.id === currentChatId.value)
        if (!currentChatData) {
          console.log('[ChatStore] Current chat ID is invalid, selecting first chat...')
          currentChatId.value = chats.value[0].id
        } else {
          // Ensure messages are loaded for current chat
          if (!currentChatData.messages || currentChatData.messages.length === 0) {
            console.log('[ChatStore] Loading messages for current chat...')
            await loadMessages(currentChatId.value)
          }
        }
      } else {
        // No current chat selected, select the first one
        console.log('[ChatStore] No current chat, selecting first chat...')
        currentChatId.value = chats.value[0].id
      }
    }
    
    console.log('[ChatStore] Initialization complete. Current chat:', currentChatId.value)
    console.log('[ChatStore] Messages loaded:', currentChat.value?.messages?.length || 0)
  }
  
  return {
    // State
    chats,
    currentChatId,
    currentChat,
    currentMessages,
    isInitialized,
    isLoading,
    isGenerating,
    messages,
    streamingContent,
    streamingMessageId,
    
    // Actions
    initialize,
    createChat,
    selectChat,
    addMessage,
    updateMessageContent,
    sendMessage,
    deleteChat,
    loadChats,
    loadMessages,
    
    // Helpers
    ensureMessagesMap
  }
}, {
  // Add persistence configuration
  persist: {
    key: 'miaoda-chat-store',
    paths: ['currentChatId'], // Only persist the current chat ID
    storage: localStorage
  }
})