import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useChat } from '../useChat'
import type { Chat, Message } from '@renderer/src/types'

// Mock window.api
const mockApi = {
  db: {
    getAllChats: vi.fn(),
    createChat: vi.fn(),
    updateChat: vi.fn(),
    deleteChat: vi.fn(),
    getMessages: vi.fn(),
    createMessage: vi.fn(),
    updateMessage: vi.fn(),
    deleteMessage: vi.fn()
  },
  chat: {
    getChats: vi.fn(),
    createChat: vi.fn(),
    updateChat: vi.fn(),
    deleteChat: vi.fn()
  },
  llm: {
    sendMessage: vi.fn()
  },
  on: vi.fn()
}

Object.defineProperty(window, 'api', {
  value: mockApi,
  writable: true
})

const mockChats: Chat[] = [
  {
    id: 'chat1',
    title: 'First Chat',
    messages: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'chat2',
    title: 'Second Chat',
    messages: [],
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02')
  }
]

const mockMessages: Message[] = [
  {
    id: 'msg1',
    content: 'Hello',
    role: 'user',
    timestamp: new Date('2024-01-01T10:00:00Z'),
    chatId: 'chat1'
  },
  {
    id: 'msg2',
    content: 'Hi there!',
    role: 'assistant',
    timestamp: new Date('2024-01-01T10:01:00Z'),
    chatId: 'chat1'
  }
]

describe('useChat', () => {
  beforeEach(() => {
    // Create fresh Pinia instance for each test
    const pinia = createPinia()
    setActivePinia(pinia)
    
    vi.clearAllMocks()
    mockApi.db.getAllChats.mockResolvedValue(mockChats)
    mockApi.db.getMessages.mockResolvedValue(mockMessages)
    mockApi.db.createChat.mockResolvedValue('new-chat-id')
    mockApi.db.createMessage.mockResolvedValue({
      id: 'new-msg-id',
      content: 'Response message',
      role: 'assistant',
      timestamp: new Date(),
      chatId: 'chat1'
    })
    mockApi.llm.sendMessage.mockResolvedValue('Assistant response')
  })

  describe('Initialization', () => {
    it('loads chats on initialization', async () => {
      const { chats } = useChat()
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(mockApi.db.getAllChats).toHaveBeenCalled()
      expect(chats.value).toEqual(mockChats)
    })

    it('handles initialization errors gracefully', async () => {
      mockApi.chat.getChats.mockRejectedValue(new Error('Failed to load chats'))
      
      const { chats } = useChat()
      
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(chats.value).toEqual([])
    })
  })

  describe('Chat Management', () => {
    it('creates new chat', async () => {
      const { createChat, chats } = useChat()
      
      const chatId = await createChat()
      
      expect(mockApi.chat.createChat).toHaveBeenCalled()
      expect(chatId).toBe('new-chat-id')
    })

    it('creates chat with custom title', async () => {
      const { createChat } = useChat()
      
      await createChat('Custom Title')
      
      expect(mockApi.chat.createChat).toHaveBeenCalledWith({
        title: 'Custom Title'
      })
    })

    it('selects chat and loads messages', async () => {
      const { selectChat, currentChatId, messages } = useChat()
      
      await selectChat('chat1')
      
      expect(currentChatId.value).toBe('chat1')
      expect(mockApi.chat.getMessages).toHaveBeenCalledWith('chat1')
      expect(messages.value).toEqual(mockMessages)
    })

    it('handles selecting non-existent chat', async () => {
      const { selectChat, currentChatId } = useChat()
      
      mockApi.chat.getMessages.mockRejectedValue(new Error('Chat not found'))
      
      await selectChat('non-existent-chat')
      
      expect(currentChatId.value).toBe('non-existent-chat')
      // Should still attempt to load messages
      expect(mockApi.chat.getMessages).toHaveBeenCalledWith('non-existent-chat')
    })

    it('deletes chat', async () => {
      const { deleteChat, chats, currentChatId } = useChat()
      
      // First load chats and select one
      await new Promise(resolve => setTimeout(resolve, 0))
      await selectChat('chat1')
      
      await deleteChat('chat1')
      
      expect(mockApi.chat.deleteChat).toHaveBeenCalledWith('chat1')
      // Should clear current chat if deleted chat was selected
      expect(currentChatId.value).toBeNull()
    })

    it('does not clear current chat when deleting different chat', async () => {
      const { deleteChat, selectChat, currentChatId } = useChat()
      
      await selectChat('chat1')
      await deleteChat('chat2')
      
      expect(currentChatId.value).toBe('chat1')
    })

    it('exports chat', async () => {
      mockApi.chat.exportChat.mockResolvedValue('# Chat Export\n\nChat content...')
      
      const { exportChat } = useChat()
      
      const result = await exportChat('chat1', 'markdown')
      
      expect(mockApi.chat.exportChat).toHaveBeenCalledWith('chat1', 'markdown')
      expect(result).toBe('# Chat Export\n\nChat content...')
    })
  })

  describe('Message Management', () => {
    it('sends message to current chat', async () => {
      const { sendMessage, selectChat, messages } = useChat()
      
      await selectChat('chat1')
      await sendMessage('Hello world', [])
      
      expect(mockApi.chat.sendMessage).toHaveBeenCalledWith({
        chatId: 'chat1',
        content: 'Hello world',
        attachments: []
      })
    })

    it('creates new chat if none selected when sending message', async () => {
      const { sendMessage, currentChatId } = useChat()
      
      await sendMessage('Hello world', [])
      
      expect(mockApi.chat.createChat).toHaveBeenCalled()
      expect(mockApi.chat.sendMessage).toHaveBeenCalled()
    })

    it('sends message with attachments', async () => {
      const { sendMessage, selectChat } = useChat()
      const attachments = [{
        id: 'att1',
        name: 'file.txt',
        type: 'text/plain',
        size: 1000,
        data: 'data:text/plain;base64,dGVzdA=='
      }]
      
      await selectChat('chat1')
      await sendMessage('Message with attachment', attachments)
      
      expect(mockApi.chat.sendMessage).toHaveBeenCalledWith({
        chatId: 'chat1',
        content: 'Message with attachment',
        attachments
      })
    })

    it('retries failed message', async () => {
      const { retryMessage, selectChat } = useChat()
      
      await selectChat('chat1')
      await retryMessage('msg1')
      
      expect(mockApi.chat.sendMessage).toHaveBeenCalled()
    })

    it('edits message', async () => {
      const { editMessage } = useChat()
      
      await editMessage('msg1', 'Edited content')
      
      // Implementation should handle editing
      expect(mockApi.chat.sendMessage).toHaveBeenCalled()
    })

    it('deletes message', async () => {
      const { deleteMessage, selectChat, messages } = useChat()
      
      await selectChat('chat1')
      await deleteMessage('msg1')
      
      expect(mockApi.chat.deleteMessage).toHaveBeenCalledWith('msg1')
    })

    it('copies message content', async () => {
      const mockClipboard = {
        writeText: vi.fn().mockResolvedValue(undefined)
      }
      Object.defineProperty(navigator, 'clipboard', { value: mockClipboard })
      
      const { copyMessage } = useChat()
      
      await copyMessage('msg1')
      
      expect(mockClipboard.writeText).toHaveBeenCalledWith('Hello')
    })
  })

  describe('Loading States', () => {
    it('tracks loading state during operations', async () => {
      const { isLoading, createChat } = useChat()
      
      expect(isLoading.value).toBe(false)
      
      const promise = createChat()
      expect(isLoading.value).toBe(true)
      
      await promise
      expect(isLoading.value).toBe(false)
    })

    it('tracks generating state during message sending', async () => {
      const { isGenerating, sendMessage, selectChat } = useChat()
      
      await selectChat('chat1')
      
      expect(isGenerating.value).toBe(false)
      
      const promise = sendMessage('Test message', [])
      expect(isGenerating.value).toBe(true)
      
      await promise
      expect(isGenerating.value).toBe(false)
    })
  })

  describe('Computed Properties', () => {
    it('computes current chat correctly', async () => {
      const { currentChat, selectChat } = useChat()
      
      await new Promise(resolve => setTimeout(resolve, 0)) // Wait for chats to load
      await selectChat('chat1')
      
      expect(currentChat.value).toEqual(mockChats[0])
    })

    it('returns null for current chat when none selected', () => {
      const { currentChat } = useChat()
      
      expect(currentChat.value).toBeNull()
    })

    it('computes canSendMessage correctly', async () => {
      const { canSendMessage, selectChat } = useChat()
      
      expect(canSendMessage.value).toBe(false)
      
      await selectChat('chat1')
      expect(canSendMessage.value).toBe(true)
    })

    it('blocks sending when loading', async () => {
      const { canSendMessage, isLoading, selectChat } = useChat()
      
      await selectChat('chat1')
      isLoading.value = true
      
      expect(canSendMessage.value).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('handles API errors during chat creation', async () => {
      mockApi.chat.createChat.mockRejectedValue(new Error('API Error'))
      
      const { createChat } = useChat()
      
      await expect(createChat()).rejects.toThrow('API Error')
    })

    it('handles API errors during message sending', async () => {
      mockApi.chat.sendMessage.mockRejectedValue(new Error('Send failed'))
      
      const { sendMessage, selectChat } = useChat()
      
      await selectChat('chat1')
      await expect(sendMessage('Test', [])).rejects.toThrow('Send failed')
    })

    it('handles network errors gracefully', async () => {
      mockApi.chat.getChats.mockRejectedValue(new Error('Network error'))
      
      const { chats } = useChat()
      
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(chats.value).toEqual([])
    })
  })

  describe('Real-time Updates', () => {
    it('handles streaming responses', async () => {
      const mockStream = {
        getReader: () => ({
          read: vi.fn()
            .mockResolvedValueOnce({ done: false, value: 'Hello' })
            .mockResolvedValueOnce({ done: false, value: ' world' })
            .mockResolvedValueOnce({ done: true, value: undefined })
        })
      }
      
      mockApi.chat.sendMessage.mockResolvedValue({
        stream: mockStream,
        id: 'stream-msg',
        role: 'assistant',
        chatId: 'chat1'
      })
      
      const { sendMessage, selectChat, messages } = useChat()
      
      await selectChat('chat1')
      await sendMessage('Test streaming', [])
      
      // Should handle streaming response
      expect(messages.value.some(m => m.content.includes('Hello world'))).toBe(true)
    })
  })

  describe('Chat History', () => {
    it('sorts chats by recent activity', async () => {
      const recentChats = [
        { ...mockChats[1], updatedAt: new Date('2024-01-03') },
        { ...mockChats[0], updatedAt: new Date('2024-01-01') }
      ]
      
      mockApi.chat.getChats.mockResolvedValue(recentChats)
      
      const { chats } = useChat()
      
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(chats.value[0].updatedAt > chats.value[1].updatedAt).toBe(true)
    })

    it('limits chat history to maximum count', async () => {
      const manyChats = Array.from({ length: 1000 }, (_, i) => ({
        id: `chat-${i}`,
        title: `Chat ${i}`,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }))
      
      mockApi.chat.getChats.mockResolvedValue(manyChats)
      
      const { chats } = useChat()
      
      await new Promise(resolve => setTimeout(resolve, 0))
      
      // Should limit to reasonable number
      expect(chats.value.length).toBeLessThanOrEqual(100)
    })
  })

  describe('Search and Filtering', () => {
    it('searches chats by title', () => {
      const { searchChats } = useChat()
      
      const results = searchChats('First')
      
      expect(results).toEqual([mockChats[0]])
    })

    it('searches chats by content', async () => {
      const { searchChats, selectChat } = useChat()
      
      await selectChat('chat1') // Load messages
      
      const results = searchChats('Hello')
      
      expect(results.length).toBeGreaterThan(0)
    })

    it('returns empty array for no matches', () => {
      const { searchChats } = useChat()
      
      const results = searchChats('NonexistentQuery')
      
      expect(results).toEqual([])
    })
  })

  describe('Persistence', () => {
    it('persists selected chat ID', async () => {
      const { selectChat, currentChatId } = useChat()
      
      await selectChat('chat1')
      
      // Should persist to localStorage or similar
      expect(localStorage.getItem).toHaveBeenCalledWith('currentChatId')
    })

    it('restores selected chat on initialization', () => {
      localStorage.getItem = vi.fn().mockReturnValue('chat1')
      
      const { currentChatId } = useChat()
      
      expect(currentChatId.value).toBe('chat1')
    })
  })
})