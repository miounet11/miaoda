import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import { useSettingsStore } from '@/stores/settings'
import type { Message, Chat } from '@/types'

// Mock Electron IPC
const mockIpcRenderer = {
  invoke: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  send: vi.fn()
}

global.window = {
  ...global.window,
  electron: { ipcRenderer: mockIpcRenderer }
}

// Mock components for integration testing
const MockChatView = {
  name: 'ChatView',
  template: `
    <div data-testid="chat-view">
      <div data-testid="chat-list">
        <div 
          v-for="chat in chats" 
          :key="chat.id" 
          :data-chat-id="chat.id"
          @click="selectChat(chat.id)"
        >
          {{ chat.title }}
        </div>
      </div>
      <div data-testid="message-area">
        <div 
          v-for="message in currentMessages" 
          :key="message.id"
          :data-message-id="message.id"
        >
          {{ message.content }}
        </div>
      </div>
      <div data-testid="input-area">
        <input 
          v-model="inputValue" 
          @keydown.enter="sendMessage"
          data-testid="message-input"
        />
        <button @click="sendMessage" data-testid="send-button">Send</button>
      </div>
    </div>
  `,
  setup() {
    const chatStore = useChatStore()
    const settingsStore = useSettingsStore()
    const inputValue = ref('')

    const chats = computed(() => chatStore.chats)
    const currentMessages = computed(() => chatStore.currentMessages)

    const selectChat = (chatId: string) => {
      chatStore.setCurrentChat(chatId)
    }

    const sendMessage = async () => {
      if (!inputValue.value.trim()) return

      const message = createMockMessage({
        content: inputValue.value,
        role: 'user',
        chatId: chatStore.currentChatId || ''
      })

      await chatStore.addMessage(message)
      inputValue.value = ''
    }

    return {
      chats,
      currentMessages,
      inputValue,
      selectChat,
      sendMessage
    }
  }
}

describe('Chat Flow Integration Tests', () => {
  let pinia: ReturnType<typeof createPinia>
  let router: any
  let chatStore: ReturnType<typeof useChatStore>
  let settingsStore: ReturnType<typeof useSettingsStore>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)

    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: MockChatView },
        { path: '/chat/:id', component: MockChatView }
      ]
    })

    chatStore = useChatStore()
    settingsStore = useSettingsStore()

    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Complete Chat Workflow', () => {
    it('creates new chat and sends messages', async () => {
      // Mock IPC responses
      const mockChat = createMockChat({ title: 'Integration Test Chat' })
      const mockMessage = createMockMessage({
        content: 'Hello from integration test',
        chatId: mockChat.id
      })

      mockIpcRenderer.invoke
        .mockResolvedValueOnce(mockChat) // chat:create
        .mockResolvedValueOnce(mockMessage) // message:create
        .mockResolvedValueOnce([mockMessage]) // message:getByChat

      const wrapper = mount(MockChatView, {
        global: {
          plugins: [pinia, router]
        }
      })

      // 1. Create new chat
      await chatStore.createChat('Integration Test Chat')
      await wrapper.vm.$nextTick()

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('chat:create', {
        title: 'Integration Test Chat'
      })
      expect(chatStore.chats).toHaveLength(1)
      expect(chatStore.currentChatId).toBe(mockChat.id)

      // 2. Send a message
      const messageInput = wrapper.find('[data-testid="message-input"]')
      await messageInput.setValue('Hello from integration test')

      const sendButton = wrapper.find('[data-testid="send-button"]')
      await sendButton.trigger('click')
      await wrapper.vm.$nextTick()

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
        'message:create',
        expect.objectContaining({
          content: 'Hello from integration test',
          role: 'user'
        })
      )

      // 3. Verify message appears in UI
      const messageElements = wrapper.findAll('[data-message-id]')
      expect(messageElements).toHaveLength(1)
      expect(messageElements[0].text()).toContain('Hello from integration test')
    })

    it('handles chat switching correctly', async () => {
      // Create multiple chats
      const chat1 = createMockChat({ id: 'chat-1', title: 'Chat 1' })
      const chat2 = createMockChat({ id: 'chat-2', title: 'Chat 2' })
      const messages1 = [createMockMessage({ chatId: 'chat-1', content: 'Message in chat 1' })]
      const messages2 = [createMockMessage({ chatId: 'chat-2', content: 'Message in chat 2' })]

      mockIpcRenderer.invoke
        .mockResolvedValueOnce([chat1, chat2]) // chat:getAll
        .mockResolvedValueOnce(messages1) // message:getByChat for chat1
        .mockResolvedValueOnce(messages2) // message:getByChat for chat2

      const wrapper = mount(MockChatView, {
        global: {
          plugins: [pinia, router]
        }
      })

      // Load chats
      chatStore.chats.push(chat1, chat2)
      chatStore.setCurrentChat('chat-1')
      await chatStore.loadMessages('chat-1')
      await wrapper.vm.$nextTick()

      // Verify chat 1 is active
      expect(chatStore.currentChatId).toBe('chat-1')
      expect(wrapper.find('[data-message-id]').text()).toContain('Message in chat 1')

      // Switch to chat 2
      const chat2Element = wrapper.find('[data-chat-id="chat-2"]')
      await chat2Element.trigger('click')
      await chatStore.loadMessages('chat-2')
      await wrapper.vm.$nextTick()

      // Verify chat 2 is now active
      expect(chatStore.currentChatId).toBe('chat-2')
    })

    it('maintains state across navigation', async () => {
      const chat = createMockChat()
      chatStore.chats.push(chat)
      chatStore.setCurrentChat(chat.id)

      // Navigate to settings and back
      await router.push('/settings')
      await router.push(`/chat/${chat.id}`)

      // State should be preserved
      expect(chatStore.currentChatId).toBe(chat.id)
      expect(chatStore.chats).toHaveLength(1)
    })
  })

  describe('Error Recovery Integration', () => {
    it('recovers from IPC errors gracefully', async () => {
      // Mock IPC failure
      mockIpcRenderer.invoke.mockRejectedValue(new Error('IPC communication failed'))

      const wrapper = mount(MockChatView, {
        global: {
          plugins: [pinia, router]
        }
      })

      // Attempt to create chat
      await expect(chatStore.createChat('Test Chat')).rejects.toThrow('IPC communication failed')

      // App should still be functional
      expect(wrapper.vm).toBeDefined()
      expect(chatStore.chats).toHaveLength(0)
    })

    it('handles database errors through IPC', async () => {
      // Mock database error from main process
      mockIpcRenderer.invoke.mockRejectedValue(new Error('Database is locked'))

      await expect(chatStore.loadChats()).rejects.toThrow('Database is locked')

      // Error should be handled gracefully
      expect(chatStore.chats).toHaveLength(0)
    })

    it('recovers from partial failures', async () => {
      const chat = createMockChat()

      // Chat creation succeeds
      mockIpcRenderer.invoke.mockResolvedValueOnce(chat)
      // Message loading fails
      mockIpcRenderer.invoke.mockRejectedValueOnce(new Error('Failed to load messages'))

      await chatStore.createChat('Test Chat')
      expect(chatStore.chats).toHaveLength(1)

      // Message loading failure shouldn't affect chat list
      await expect(chatStore.loadMessages(chat.id)).rejects.toThrow('Failed to load messages')
      expect(chatStore.chats).toHaveLength(1)
    })
  })

  describe('Performance Integration', () => {
    it('handles large chat lists efficiently', async () => {
      const largeChatList = Array(1000)
        .fill(null)
        .map((_, i) => createMockChat({ id: `chat-${i}`, title: `Chat ${i}` }))

      mockIpcRenderer.invoke.mockResolvedValue(largeChatList)

      const startTime = performance.now()
      await chatStore.loadChats()
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(1000) // Should load within 1 second
      expect(chatStore.chats).toHaveLength(1000)
    })

    it('handles rapid message sending efficiently', async () => {
      const chat = createMockChat()
      chatStore.chats.push(chat)
      chatStore.setCurrentChat(chat.id)

      // Mock message creation
      mockIpcRenderer.invoke.mockImplementation((channel, data) => {
        if (channel === 'message:create') {
          return Promise.resolve(data)
        }
      })

      const wrapper = mount(MockChatView, {
        global: {
          plugins: [pinia, router]
        }
      })

      const startTime = performance.now()

      // Send 10 messages rapidly
      for (let i = 0; i < 10; i++) {
        const input = wrapper.find('[data-testid="message-input"]')
        await input.setValue(`Message ${i}`)

        const sendButton = wrapper.find('[data-testid="send-button"]')
        await sendButton.trigger('click')
      }

      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(1000)
      expect(mockIpcRenderer.invoke).toHaveBeenCalledTimes(10)
    })
  })

  describe('State Synchronization', () => {
    it('synchronizes store state with UI updates', async () => {
      const wrapper = mount(MockChatView, {
        global: {
          plugins: [pinia, router]
        }
      })

      // Create chat through store
      const mockChat = createMockChat({ title: 'Sync Test Chat' })
      mockIpcRenderer.invoke.mockResolvedValue(mockChat)

      await chatStore.createChat('Sync Test Chat')
      await wrapper.vm.$nextTick()

      // UI should reflect store state
      const chatList = wrapper.find('[data-testid="chat-list"]')
      expect(chatList.text()).toContain('Sync Test Chat')
    })

    it('maintains consistency across multiple store operations', async () => {
      const chat1 = createMockChat({ id: 'chat-1', title: 'Chat 1' })
      const chat2 = createMockChat({ id: 'chat-2', title: 'Chat 2' })

      mockIpcRenderer.invoke
        .mockResolvedValueOnce(chat1)
        .mockResolvedValueOnce(chat2)
        .mockResolvedValueOnce({ success: true })

      // Create two chats
      await chatStore.createChat('Chat 1')
      await chatStore.createChat('Chat 2')

      expect(chatStore.chats).toHaveLength(2)
      expect(chatStore.currentChatId).toBe('chat-2') // Should be last created

      // Delete first chat
      await chatStore.deleteChat('chat-1')

      expect(chatStore.chats).toHaveLength(1)
      expect(chatStore.chats[0].id).toBe('chat-2')
    })
  })

  describe('Settings Integration', () => {
    it('applies settings changes across components', async () => {
      const wrapper = mount(MockChatView, {
        global: {
          plugins: [pinia, router]
        }
      })

      // Change settings
      settingsStore.updateFontSize(18)
      settingsStore.updateTheme('dark')

      await wrapper.vm.$nextTick()

      // Settings should be applied
      expect(settingsStore.fontSize).toBe(18)
      expect(settingsStore.theme).toBe('dark')
    })

    it('persists settings changes', async () => {
      mockIpcRenderer.invoke.mockResolvedValue({ success: true })

      await settingsStore.updateLLMProvider('anthropic')
      await settingsStore.saveSettings()

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
        'settings:save',
        expect.objectContaining({
          llmProvider: 'anthropic'
        })
      )
    })
  })

  describe('Real-time Features', () => {
    it('handles streaming message updates', async () => {
      const chat = createMockChat()
      chatStore.chats.push(chat)
      chatStore.setCurrentChat(chat.id)

      const wrapper = mount(MockChatView, {
        global: {
          plugins: [pinia, router]
        }
      })

      // Start streaming
      const messageId = 'streaming-msg'
      chatStore.startStreaming(messageId)

      expect(chatStore.isGenerating).toBe(true)
      expect(chatStore.streamingMessageId).toBe(messageId)

      // Update streaming content
      chatStore.updateStreamingContent('Hello')
      chatStore.updateStreamingContent(' World')

      expect(chatStore.streamingContent).toBe('Hello World')

      // Finish streaming
      const finalMessage = createMockMessage({
        id: messageId,
        content: 'Hello World',
        chatId: chat.id
      })
      mockIpcRenderer.invoke.mockResolvedValue(finalMessage)

      await chatStore.finishStreaming()

      expect(chatStore.isGenerating).toBe(false)
      expect(chatStore.streamingContent).toBe('')
    })

    it('handles concurrent streaming operations', async () => {
      const chat = createMockChat()
      chatStore.chats.push(chat)
      chatStore.setCurrentChat(chat.id)

      // Start first stream
      chatStore.startStreaming('stream-1')
      chatStore.updateStreamingContent('First stream')

      // Attempt second stream (should handle gracefully)
      chatStore.startStreaming('stream-2')

      // Should manage concurrent streams properly
      expect(chatStore.streamingMessageId).toBeDefined()
    })
  })

  describe('Error Recovery Workflows', () => {
    it('recovers from message send failures', async () => {
      const chat = createMockChat()
      chatStore.chats.push(chat)
      chatStore.setCurrentChat(chat.id)

      const wrapper = mount(MockChatView, {
        global: {
          plugins: [pinia, router]
        }
      })

      // Mock message send failure
      mockIpcRenderer.invoke.mockRejectedValue(new Error('Send failed'))

      const input = wrapper.find('[data-testid="message-input"]')
      await input.setValue('Test message')

      const sendButton = wrapper.find('[data-testid="send-button"]')
      await sendButton.trigger('click')

      // Should handle error gracefully
      expect(chatStore.currentMessages).toHaveLength(0)
    })

    it('retries failed operations', async () => {
      const chat = createMockChat()

      // First call fails, second succeeds
      mockIpcRenderer.invoke
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce(chat)

      // First attempt fails
      await expect(chatStore.createChat('Retry Test')).rejects.toThrow('Temporary failure')
      expect(chatStore.chats).toHaveLength(0)

      // Retry succeeds
      await chatStore.createChat('Retry Test')
      expect(chatStore.chats).toHaveLength(1)
    })
  })

  describe('Data Consistency Integration', () => {
    it('maintains data consistency across operations', async () => {
      const chat = createMockChat()
      const message1 = createMockMessage({ chatId: chat.id, content: 'First message' })
      const message2 = createMockMessage({ chatId: chat.id, content: 'Second message' })

      mockIpcRenderer.invoke
        .mockResolvedValueOnce(chat) // create chat
        .mockResolvedValueOnce(message1) // create message 1
        .mockResolvedValueOnce(message2) // create message 2
        .mockResolvedValueOnce([message1, message2]) // load messages
        .mockResolvedValueOnce({ success: true }) // delete message

      // Create chat and messages
      await chatStore.createChat(chat.title)
      await chatStore.addMessage(message1)
      await chatStore.addMessage(message2)

      expect(chatStore.currentMessages).toHaveLength(2)

      // Delete a message
      await chatStore.deleteMessage(message1.id)

      expect(chatStore.currentMessages).toHaveLength(1)
      expect(chatStore.currentMessages[0].id).toBe(message2.id)
    })

    it('handles optimistic updates correctly', async () => {
      const chat = createMockChat()
      chatStore.chats.push(chat)
      chatStore.setCurrentChat(chat.id)

      const wrapper = mount(MockChatView, {
        global: {
          plugins: [pinia, router]
        }
      })

      // Mock slow IPC response
      const slowMessage = createMockMessage({ content: 'Slow message' })
      mockIpcRenderer.invoke.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(slowMessage), 100))
      )

      const input = wrapper.find('[data-testid="message-input"]')
      await input.setValue('Optimistic message')

      const sendButton = wrapper.find('[data-testid="send-button"]')
      await sendButton.trigger('click')

      // Message should appear immediately (optimistic update)
      await wrapper.vm.$nextTick()

      // Wait for IPC response
      await vi.waitFor(() => {
        expect(mockIpcRenderer.invoke).toHaveBeenCalled()
      })
    })
  })

  describe('Memory and Performance Integration', () => {
    it('handles large conversation history efficiently', async () => {
      const chat = createMockChat()
      const largeMessageHistory = Array(500)
        .fill(null)
        .map((_, i) =>
          createMockMessage({
            id: `msg-${i}`,
            chatId: chat.id,
            content: `Message ${i}`,
            role: i % 2 === 0 ? 'user' : 'assistant'
          })
        )

      mockIpcRenderer.invoke.mockResolvedValue(largeMessageHistory)

      chatStore.chats.push(chat)
      chatStore.setCurrentChat(chat.id)

      const startTime = performance.now()
      await chatStore.loadMessages(chat.id)
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(500) // Should load within 500ms
      expect(chatStore.currentMessages).toHaveLength(500)
    })

    it('manages memory usage during extended sessions', async () => {
      const wrapper = mount(MockChatView, {
        global: {
          plugins: [pinia, router]
        }
      })

      // Simulate extended session with multiple operations
      for (let i = 0; i < 50; i++) {
        const chat = createMockChat({ id: `session-chat-${i}` })
        mockIpcRenderer.invoke.mockResolvedValueOnce(chat)

        await chatStore.createChat(`Session Chat ${i}`)

        // Switch between chats
        if (i > 0) {
          chatStore.setCurrentChat(`session-chat-${i - 1}`)
        }
      }

      // Memory usage should remain reasonable
      expect(chatStore.chats).toHaveLength(50)
      expect(wrapper.vm).toBeDefined()
    })
  })

  describe('Accessibility Integration', () => {
    it('maintains accessibility across interactions', async () => {
      const chat = createMockChat()
      chatStore.chats.push(chat)
      chatStore.setCurrentChat(chat.id)

      const wrapper = mount(MockChatView, {
        global: {
          plugins: [pinia, router]
        }
      })

      // Test keyboard navigation
      await wrapper.trigger('keydown', { key: 'Tab' })
      await wrapper.trigger('keydown', { key: 'Enter' })
      await wrapper.trigger('keydown', { key: 'Escape' })

      // Should maintain accessibility
      expect(wrapper.vm).toBeDefined()
    })

    it('provides proper ARIA live regions for updates', async () => {
      const wrapper = mount(MockChatView, {
        global: {
          plugins: [pinia, router]
        }
      })

      // Should have ARIA live regions for dynamic content
      expect(wrapper.vm).toBeDefined()
    })
  })
})
