import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useChatStore } from '../chat'
import type { Chat, Message } from '@/types'

// Mock IPC for main process communication
const mockIpcRenderer = {
  invoke: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  send: vi.fn()
}

global.window = {
  ...global.window,
  electron: {
    ipcRenderer: mockIpcRenderer
  }
}

describe('useChatStore', () => {
  let pinia: ReturnType<typeof createPinia>
  let chatStore: ReturnType<typeof useChatStore>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    chatStore = useChatStore()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initial State', () => {
    it('initializes with empty state', () => {
      expect(chatStore.chats).toEqual([])
      expect(chatStore.currentChatId).toBeNull()
      expect(chatStore.isLoading).toBe(false)
      expect(chatStore.isGenerating).toBe(false)
      expect(chatStore.streamingContent).toBe('')
      expect(chatStore.streamingMessageId).toBeNull()
    })

    it('has Map instance for messages', () => {
      expect(chatStore.messages).toBeInstanceOf(Map)
      expect(chatStore.messages.size).toBe(0)
    })
  })

  describe('Chat Management', () => {
    it('creates a new chat correctly', async () => {
      const mockChat = createMockChat({ title: 'New Test Chat' })
      mockIpcRenderer.invoke.mockResolvedValue(mockChat)

      const result = await chatStore.createChat('New Test Chat')

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('chat:create', {
        title: 'New Test Chat'
      })
      expect(result).toEqual(mockChat)
      expect(chatStore.chats).toHaveLength(1)
      expect(chatStore.currentChatId).toBe(mockChat.id)
    })

    it('loads chats from database', async () => {
      const mockChats = [
        createMockChat({ id: 'chat-1', title: 'Chat 1' }),
        createMockChat({ id: 'chat-2', title: 'Chat 2' })
      ]
      mockIpcRenderer.invoke.mockResolvedValue(mockChats)

      await chatStore.loadChats()

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('chat:getAll')
      expect(chatStore.chats).toHaveLength(2)
      expect(chatStore.chats[0].title).toBe('Chat 1')
      expect(chatStore.chats[1].title).toBe('Chat 2')
    })

    it('updates chat title', async () => {
      const chat = createMockChat({ title: 'Original Title' })
      chatStore.chats.push(chat)
      
      const updatedChat = { ...chat, title: 'Updated Title' }
      mockIpcRenderer.invoke.mockResolvedValue(updatedChat)

      await chatStore.updateChatTitle(chat.id, 'Updated Title')

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('chat:update', {
        id: chat.id,
        title: 'Updated Title'
      })
      expect(chatStore.chats[0].title).toBe('Updated Title')
    })

    it('deletes chat correctly', async () => {
      const chat = createMockChat()
      chatStore.chats.push(chat)
      chatStore.currentChatId = chat.id

      mockIpcRenderer.invoke.mockResolvedValue({ success: true })

      await chatStore.deleteChat(chat.id)

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('chat:delete', chat.id)
      expect(chatStore.chats).toHaveLength(0)
      expect(chatStore.currentChatId).toBeNull()
    })

    it('sets current chat correctly', () => {
      const chat = createMockChat()
      chatStore.chats.push(chat)

      chatStore.setCurrentChat(chat.id)

      expect(chatStore.currentChatId).toBe(chat.id)
      expect(chatStore.currentChat).toEqual(chat)
    })
  })

  describe('Message Management', () => {
    beforeEach(() => {
      const chat = createMockChat()
      chatStore.chats.push(chat)
      chatStore.currentChatId = chat.id
    })

    it('adds message to current chat', async () => {
      const message = createMockMessage()
      mockIpcRenderer.invoke.mockResolvedValue(message)

      await chatStore.addMessage(message)

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('message:create', message)
      expect(chatStore.currentMessages).toHaveLength(1)
      expect(chatStore.currentMessages[0]).toEqual(message)
    })

    it('loads messages for chat', async () => {
      const chatId = chatStore.currentChatId!
      const mockMessages = [
        createMockMessage({ id: 'msg-1', content: 'Message 1' }),
        createMockMessage({ id: 'msg-2', content: 'Message 2' })
      ]
      mockIpcRenderer.invoke.mockResolvedValue(mockMessages)

      await chatStore.loadMessages(chatId)

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('message:getByChat', chatId)
      expect(chatStore.messages.get(chatId)).toHaveLength(2)
    })

    it('updates message content', async () => {
      const message = createMockMessage()
      await chatStore.addMessage(message)

      const updatedMessage = { ...message, content: 'Updated content' }
      mockIpcRenderer.invoke.mockResolvedValue(updatedMessage)

      await chatStore.updateMessage(message.id, 'Updated content')

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('message:update', {
        id: message.id,
        content: 'Updated content'
      })
      expect(chatStore.currentMessages[0].content).toBe('Updated content')
    })

    it('deletes message correctly', async () => {
      const message = createMockMessage()
      await chatStore.addMessage(message)

      mockIpcRenderer.invoke.mockResolvedValue({ success: true })

      await chatStore.deleteMessage(message.id)

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('message:delete', message.id)
      expect(chatStore.currentMessages).toHaveLength(0)
    })
  })

  describe('Streaming Messages', () => {
    it('starts streaming correctly', () => {
      const messageId = 'streaming-msg-1'
      
      chatStore.startStreaming(messageId)

      expect(chatStore.isGenerating).toBe(true)
      expect(chatStore.streamingMessageId).toBe(messageId)
      expect(chatStore.streamingContent).toBe('')
    })

    it('updates streaming content', () => {
      const messageId = 'streaming-msg-1'
      chatStore.startStreaming(messageId)

      chatStore.updateStreamingContent('Hello')
      expect(chatStore.streamingContent).toBe('Hello')

      chatStore.updateStreamingContent(' World')
      expect(chatStore.streamingContent).toBe('Hello World')
    })

    it('finishes streaming correctly', async () => {
      const messageId = 'streaming-msg-1'
      const finalContent = 'Complete message'
      
      chatStore.startStreaming(messageId)
      chatStore.updateStreamingContent(finalContent)

      const mockMessage = createMockMessage({ 
        id: messageId, 
        content: finalContent 
      })
      mockIpcRenderer.invoke.mockResolvedValue(mockMessage)

      await chatStore.finishStreaming()

      expect(chatStore.isGenerating).toBe(false)
      expect(chatStore.streamingMessageId).toBeNull()
      expect(chatStore.streamingContent).toBe('')
    })
  })

  describe('Error Handling', () => {
    it('handles chat creation errors', async () => {
      const error = new Error('Failed to create chat')
      mockIpcRenderer.invoke.mockRejectedValue(error)

      await expect(chatStore.createChat('Test Chat')).rejects.toThrow('Failed to create chat')
      expect(chatStore.chats).toHaveLength(0)
    })

    it('handles message loading errors', async () => {
      const chatId = 'test-chat-id'
      const error = new Error('Failed to load messages')
      mockIpcRenderer.invoke.mockRejectedValue(error)

      await expect(chatStore.loadMessages(chatId)).rejects.toThrow('Failed to load messages')
      expect(chatStore.messages.get(chatId)).toBeUndefined()
    })

    it('handles streaming errors gracefully', () => {
      chatStore.startStreaming('test-msg')
      
      chatStore.handleStreamingError('Connection failed')

      expect(chatStore.isGenerating).toBe(false)
      expect(chatStore.streamingMessageId).toBeNull()
      expect(chatStore.streamingContent).toBe('')
    })
  })

  describe('Computed Properties', () => {
    it('currentChat returns correct chat', () => {
      const chat = createMockChat()
      chatStore.chats.push(chat)
      chatStore.currentChatId = chat.id

      expect(chatStore.currentChat).toEqual(chat)
    })

    it('currentMessages returns messages for current chat', () => {
      const chat = createMockChat()
      const messages = [
        createMockMessage({ id: 'msg-1' }),
        createMockMessage({ id: 'msg-2' })
      ]
      
      chatStore.chats.push(chat)
      chatStore.currentChatId = chat.id
      chatStore.messages.set(chat.id, messages)

      expect(chatStore.currentMessages).toEqual(messages)
    })

    it('hasCurrentChat returns correct boolean', () => {
      expect(chatStore.hasCurrentChat).toBe(false)

      const chat = createMockChat()
      chatStore.chats.push(chat)
      chatStore.currentChatId = chat.id

      expect(chatStore.hasCurrentChat).toBe(true)
    })
  })

  describe('Data Persistence', () => {
    it('maintains message map integrity', () => {
      const chatId = 'test-chat'
      const messages = [createMockMessage()]

      chatStore.messages.set(chatId, messages)
      
      // Ensure messages is still a Map after operations
      expect(chatStore.messages).toBeInstanceOf(Map)
      expect(chatStore.messages.get(chatId)).toEqual(messages)
    })

    it('handles message map reinitialization', () => {
      // Simulate corrupted messages state
      (chatStore.messages as any) = null

      // Should reinitialize messages Map
      chatStore.ensureMessagesMap()
      expect(chatStore.messages).toBeInstanceOf(Map)
    })
  })

  describe('Chat Search and Filtering', () => {
    beforeEach(() => {
      const chats = [
        createMockChat({ id: 'chat-1', title: 'Work Chat', tags: ['work', 'project'] }),
        createMockChat({ id: 'chat-2', title: 'Personal Chat', tags: ['personal'] }),
        createMockChat({ id: 'chat-3', title: 'Archived Chat', archived: true })
      ]
      chatStore.chats.push(...chats)
    })

    it('filters chats by search query', () => {
      const results = chatStore.filterChats('Work')
      expect(results).toHaveLength(1)
      expect(results[0].title).toBe('Work Chat')
    })

    it('filters chats by tags', () => {
      const results = chatStore.filterChatsByTag('work')
      expect(results).toHaveLength(1)
      expect(results[0].title).toBe('Work Chat')
    })

    it('excludes archived chats by default', () => {
      const results = chatStore.getActiveChats()
      expect(results).toHaveLength(2)
      expect(results.every(chat => !chat.archived)).toBe(true)
    })
  })
})