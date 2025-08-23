import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { nanoid } from 'nanoid'
import type { Chat, Message, Attachment } from '@renderer/src/types'
import { useErrorHandler } from '@renderer/src/composables/useErrorHandler'
// import { performanceMonitor } from '@renderer/src/utils/performance'
import { logger } from '../utils/Logger'

export const useChatStore = defineStore(
  'chat',
  () => {
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
        logger.warn('Messages was not a Map, reinitializing', 'ChatStore')
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

    const isCurrentChatGenerating = computed(() => isGenerating.value)

    // Load chats from database
    const loadChats = async () => {
      try {
        // Starting to load chats
        const dbChats = await window.api.db.getAllChats()
        // Chats loaded from database

        chats.value = dbChats.map(chat => ({
          ...chat,
          messages: [],
          createdAt: new Date(chat.created_at),
          updatedAt: new Date(chat.updated_at)
        }))

        // Load messages for all chats to ensure they persist after refresh
        // This is important for data persistence
        // Loading messages for all chats
        for (const chat of chats.value) {
          try {
            const dbMessages = await window.api.db.getMessages(chat.id)
            // Loading messages for chat
            chat.messages = dbMessages.map(msg => ({
              id: msg.id,
              role: msg.role,
              content: msg.content || '', // Ensure content is never undefined or null
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
                  logger.error(
                    `Failed to parse attachments for message ${msg.id}`,
                    'ChatStore',
                    error
                  )
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
          content: msg.content || '', // Ensure content is never undefined
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

        // Messages loaded for chat
      } catch (error) {
        logger.error('Failed to load messages', 'ChatStore', error)
        handleError(error)
      }
    }

    const createChat = async (title?: string): Promise<string> => {
      const now = new Date()
      const newChat: Chat = {
        id: nanoid(),
        title: title || 'New Chat',
        messages: [],
        createdAt: now,
        updatedAt: now
      }

      // Save to database
      await window.api.db.createChat({
        id: newChat.id,
        title: newChat.title,
        created_at: now.getTime(),
        updated_at: now.getTime()
      })

      chats.value.unshift(newChat)
      currentChatId.value = newChat.id

      return newChat.id
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
          created_at: now.getTime()
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
          await window.api.db.updateChat(chat.id, newTitle, String(Date.now()))
        } catch (error) {
          logger.error('Failed to update chat title', 'ChatStore', error)
        }
      }

      return message
    }

    const updateMessageContent = async (messageId: string, content: string) => {
      console.log('[ChatStore] Updating message content', {
        messageId,
        contentLength: content?.length,
        contentPreview: content?.substring(0, 50)
      })

      if (!currentChat.value) {
        console.error('[ChatStore] No current chat available')
        return
      }

      // Find and update the message in memory
      const message = currentChat.value.messages.find(m => m.id === messageId)
      if (!message) {
        console.error('[ChatStore] Message not found for update', { messageId })
        logger.error('Message not found for update', 'ChatStore', { messageId })
        return
      }

      console.log('[ChatStore] Found message, updating content', {
        oldContent: message.content?.substring(0, 50),
        newContent: content?.substring(0, 50)
      })
      message.content = content

      // Update in database
      try {
        // Calling database update
        await window.api.db?.updateMessage?.(messageId, content)
        // Database update successful
        logger.info('Message content updated in database', 'ChatStore', {
          messageId,
          contentLength: content.length
        })
      } catch (error) {
        logger.error('Database update failed', 'ChatStore', error)
        logger.error('Failed to update message in database', 'ChatStore', error)
      }
    }

    const sendMessageInternal = async (content: string, attachments: Attachment[] = []): Promise<string> => {
      let targetChatId = currentChatId.value

      // Create new chat if none selected
      if (!targetChatId) {
        const newChatId = await createChat()
        if (!newChatId) return ''
        targetChatId = newChatId
        currentChatId.value = targetChatId
      }

      const ensuredChatId = targetChatId as string

      try {
        isGenerating.value = true

        // Add user message immediately
        const userMessage: Message = {
          id: `user-${Date.now()}`,
          content,
          role: 'user',
          timestamp: new Date(),
          chatId: ensuredChatId,
          attachments
        }

        await addMessage(userMessage)

        // Create placeholder for assistant response
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          content: '',
          role: 'assistant',
          timestamp: new Date(),
          chatId: ensuredChatId,
          pending: true
        }

        const chat = chats.value.find(c => c.id === ensuredChatId)
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
              await window.api.db?.createMessage?.({
                id: assistantMessage.id,
                chat_id: ensuredChatId,
                role: 'assistant',
                content: '',
                created_at: now.getTime()
              })
            } catch (dbError) {
              logger.error(
                'Failed to create initial assistant message in database',
                'ChatStore',
                dbError
              )
            }

            // Send message through LLM API - this will trigger streaming via IPC events
            await window.api.llm.sendMessage(content, ensuredChatId, assistantMessage.id)

            // Note: The actual response will be handled by the streaming listeners
            // The message content will be updated incrementally through 'llm:chunk' events
            // and finalized through 'llm:stream-complete' event
          } catch (error: any) {
            // Handle LLM error
            const chat = chats.value.find(c => c.id === ensuredChatId)
            if (chat && chat.messages) {
              const index = chat.messages.findIndex(m => m.id === streamingMessageId.value)
              if (index >= 0) {
                chat.messages[index].content = `Error: ${error.message || 'Failed to get response'}`
                chat.messages[index].error = error.message || 'Failed to get response'
                chat.messages[index].pending = false
              }
            }
            isGenerating.value = false
            streamingContent.value = ''
            streamingMessageId.value = null
          }
        } else {
          // Fallback if LLM API is not available
          const chat = chats.value.find(c => c.id === ensuredChatId)
          if (chat && chat.messages) {
            const index = chat.messages.findIndex(m => m.id === streamingMessageId.value)
            if (index >= 0) {
              chat.messages[index].content = 'Error: LLM service not available'
              chat.messages[index].error = 'LLM service not available'
              chat.messages[index].pending = false
            }
          }
          isGenerating.value = false
          streamingContent.value = ''
          streamingMessageId.value = null
        }

        // Update chat timestamp
        const chat2 = chats.value.find(c => c.id === ensuredChatId)
        if (chat2) {
          chat2.updatedAt = new Date()

          // Update title based on first user message
          if (chat2.messages.length <= 2 && userMessage.role === 'user') {
            // User + assistant message
            const newTitle = content.slice(0, 30) + (content.length > 30 ? '...' : '')
            chat2.title = newTitle
            // Update title in database if needed
          }
        }
      } catch (error) {
        handleError(error, 'Send Message')

        // Mark message as error
        if (ensuredChatId && streamingMessageId.value) {
          const chat = chats.value.find(c => c.id === ensuredChatId)
          if (chat?.messages) {
            const index = chat.messages.findIndex(m => m.id === streamingMessageId.value)
            if (index >= 0) {
              chat.messages[index].error = 'Failed to send message'
              chat.messages[index].pending = false
            }
          }
        }
      } finally {
        // Note: Cleanup is now handled by the streaming completion listener
        // to support proper streaming behavior
      }
      return streamingMessageId.value || ''
    }

    async function sendMessage(chatId: string, content: string, attachments?: Attachment[]): Promise<string>
    async function sendMessage(content: string, attachments?: Attachment[]): Promise<string>
    async function sendMessage(a: any, b?: any, c?: any): Promise<string> {
      if (typeof a === 'string' && typeof b === 'string') {
        // (chatId, content, attachments)
        await selectChat(a)
        return sendMessageInternal(b, c || [])
      }
      // (content, attachments)
      return sendMessageInternal(a, b || [])
    }

    // Additional methods expected by useChat
    async function updateChatTitle(chatId: string, title: string): Promise<void> {
      const chat = chats.value.find(c => c.id === chatId)
      if (!chat) return
      chat.title = title
      try {
        await window.api.db.updateChat(chatId, title, String(Date.now()))
      } catch {}
    }

    async function clearChat(chatId: string): Promise<void> {
      const chat = chats.value.find(c => c.id === chatId)
      if (!chat) return
      chat.messages = []
      ensureMessagesMap()
      messages.value.set(chatId, [])
    }

    async function archiveChat(_chatId: string, _archived: boolean = true): Promise<void> {
      // No-op placeholder for now
      return
    }

    async function editMessage(_chatId: string, messageId: string, newContent: string): Promise<void> {
      await updateMessageContent(messageId, newContent)
    }

    async function deleteMessage(_chatId: string, messageId: string): Promise<void> {
      const chat = chats.value.find(c => c.messages?.some(m => m.id === messageId))
      if (!chat?.messages) return
      const idx = chat.messages.findIndex(m => m.id === messageId)
      if (idx >= 0) chat.messages.splice(idx, 1)
    }

    async function retryMessage(_messageId: string): Promise<void> {
      return
    }

    function getChatMessages(chatId: string) {
      ensureMessagesMap()
      return messages.value.get(chatId) || []
    }

    function getChat(chatId: string) {
      return chats.value.find(c => c.id === chatId)
    }

    async function exportChat(chatId: string, format: 'json' | 'markdown' | 'text' = 'markdown') {
      const chat = getChat(chatId)
      if (!chat) return ''
      const data = format === 'json' ? JSON.stringify(chat, null, 2) : chat.messages.map(m => `${m.role}: ${m.content}`).join('\n')
      return data
    }

    async function saveDraft(chatId: string, content: string, attachments: Attachment[] = []) {
      const key = `draft:${chatId}`
      localStorage.setItem(key, JSON.stringify({ content, attachments }))
    }

    function getDraft(chatId: string): { content: string; attachments: Attachment[] } | null {
      const key = `draft:${chatId}`
      const raw = localStorage.getItem(key)
      if (!raw) return null
      try { return JSON.parse(raw) } catch { return null }
    }

    async function clearDraft(chatId: string) {
      const key = `draft:${chatId}`
      localStorage.removeItem(key)
    }

    const deleteChat = async (chatId: string) => {
      try {
        // Delete from database first
        await window.api.db.deleteChat(chatId)

        // Find the index of the chat to be deleted
        const index = chats.value.findIndex(chat => chat.id === chatId)
        if (index === -1) {
          logger.warn('Chat not found in local state', 'ChatStore', { chatId })
          return
        }

        // Remove from local state
        chats.value.splice(index, 1)

        // Clean up the messages Map
        ensureMessagesMap()
        messages.value.delete(chatId)

        // Handle current chat selection
        if (currentChatId.value === chatId) {
          // If this was the current chat, select another one
          if (chats.value.length > 0) {
            currentChatId.value = chats.value[0].id
            // Load messages for the new current chat
            await loadMessages(chats.value[0].id)
          } else {
            currentChatId.value = null
            // Create a new chat if no chats remain
            await createChat()
          }

          // Update localStorage
          try {
            if (currentChatId.value) {
              localStorage.setItem('lastSelectedChatId', currentChatId.value)
            } else {
              localStorage.removeItem('lastSelectedChatId')
            }
          } catch (error) {
            logger.error('Failed to update last selected chat in localStorage', 'ChatStore', error)
          }
        }

        logger.info('Chat deleted successfully', 'ChatStore', { chatId })
      } catch (error) {
        logger.error('Failed to delete chat', 'ChatStore', error)
        handleError(error, 'Delete Chat')
        throw error // Re-throw to let the UI handle it
      }
    }

    // Set up IPC listeners for streaming responses
    const setupStreamingListeners = () => {
      // Listen for streaming chunks
      window.api.llm.onChunk?.((data: { chatId: string; messageId: string; chunk: string }) => {
        // Received chunk data

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
      window.api.llm.onStatus?.(
        async (data: { chatId: string; messageId: string; finalContent: string }) => {
          // Stream complete

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
        }
      )
    }

    // Initialize on mount
    const initialize = async () => {
      // Initializing chat store

      // Set up streaming listeners
      setupStreamingListeners()

      // Load all chats and their messages
      await loadChats()

      // Create default chat if no chats exist
      if (chats.value.length === 0) {
        // No chats found, creating default chat
        await createChat()
      } else {
        // If we have a persisted currentChatId, ensure it's valid
        if (currentChatId.value) {
          const currentChatData = chats.value.find(c => c.id === currentChatId.value)
          if (!currentChatData) {
            // Current chat ID is invalid, selecting first chat
            currentChatId.value = chats.value[0].id
          } else {
            // Ensure messages are loaded for current chat
            if (!currentChatData.messages || currentChatData.messages.length === 0) {
              // Loading messages for current chat
              await loadMessages(currentChatId.value)
            }
          }
        } else {
          // No current chat selected, select the first one
          // No current chat, selecting first chat
          currentChatId.value = chats.value[0].id
        }
      }

      // Initialization complete
      // Messages loaded
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
      isCurrentChatGenerating,
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
      updateChatTitle,
      clearChat,
      archiveChat,
      editMessage,
      deleteMessage,
      retryMessage,
      getChatMessages,
      getChat,
      exportChat,
      saveDraft,
      getDraft,
      clearDraft,

      // Helpers
      ensureMessagesMap
    }
  },
  {
    // Add persistence configuration
    persist: {
      key: 'miaoda-chat-store',
      paths: ['currentChatId'], // Only persist the current chat ID
      storage: localStorage
    }
  } as any
)
