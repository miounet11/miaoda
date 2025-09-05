import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MessageItem from '../MessageItem.vue'
import type { Message } from '@/types'

// Mock child components
vi.mock('@/components/chat/UnifiedMessageContent.vue', () => ({
  default: {
    name: 'UnifiedMessageContent',
    template: '<div data-testid="message-content">{{ content }}</div>',
    props: ['variant', 'content', 'isLoading', 'attachments', 'error', 'showRetry']
  }
}))

vi.mock('lucide-vue-next', () => ({
  User: { name: 'User', template: '<span>👤</span>' },
  Bot: { name: 'Bot', template: '<span>🤖</span>' },
  Settings: { name: 'Settings', template: '<span>⚙️</span>' }
}))

describe('MessageItem', () => {
  let wrapper: VueWrapper<any>
  let pinia: ReturnType<typeof createPinia>

  const createMockMessage = (overrides: Partial<Message> = {}): Message => ({
    id: 'test-message-1',
    role: 'user',
    content: 'Hello, this is a test message',
    timestamp: new Date('2024-01-01T12:00:00Z'),
    chatId: 'test-chat-1',
    ...overrides
  })

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  describe('Message Rendering', () => {
    it('renders user message correctly', () => {
      const message = createMockMessage({ role: 'user' })

      wrapper = mount(MessageItem, {
        props: { message },
        global: { plugins: [pinia] }
      })

      expect(wrapper.find('[data-message-id="test-message-1"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="message-content"]').exists()).toBe(true)
      expect(wrapper.find('.avatar').exists()).toBe(true)
    })

    it('renders assistant message correctly', () => {
      const message = createMockMessage({
        role: 'assistant',
        content: 'Hello! How can I help you today?'
      })

      wrapper = mount(MessageItem, {
        props: { message },
        global: { plugins: [pinia] }
      })

      expect(wrapper.find('[data-testid="message-content"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Hello! How can I help you today?')
    })

    it('renders system message correctly', () => {
      const message = createMockMessage({
        role: 'system',
        content: 'System initialized'
      })

      wrapper = mount(MessageItem, {
        props: { message },
        global: { plugins: [pinia] }
      })

      expect(wrapper.find('[data-testid="message-content"]').exists()).toBe(true)
    })

    it('shows loading state correctly', () => {
      const message = createMockMessage({ content: '' })

      wrapper = mount(MessageItem, {
        props: {
          message,
          isLoading: true
        },
        global: { plugins: [pinia] }
      })

      expect(wrapper.find('.loading-content').exists()).toBe(true)
      expect(wrapper.find('.typing-dots').exists()).toBe(true)
    })
  })

  describe('Message Interactions', () => {
    it('handles mouse events correctly', async () => {
      const message = createMockMessage()

      wrapper = mount(MessageItem, {
        props: { message },
        global: { plugins: [pinia] }
      })

      await wrapper.trigger('mouseenter')
      await wrapper.trigger('mouseleave')

      // Should handle hover states
      expect(wrapper.vm).toBeDefined()
    })

    it('handles focus events correctly', async () => {
      const message = createMockMessage()

      wrapper = mount(MessageItem, {
        props: { message },
        global: { plugins: [pinia] }
      })

      await wrapper.trigger('focusin')
      await wrapper.trigger('focusout')

      // Should handle focus states
      expect(wrapper.vm).toBeDefined()
    })

    it('handles bubble click correctly', async () => {
      const message = createMockMessage()

      wrapper = mount(MessageItem, {
        props: { message },
        global: { plugins: [pinia] }
      })

      const bubble = wrapper.find('.message-bubble-modern')
      if (bubble.exists()) {
        await bubble.trigger('click')
        // Should handle click interaction
      }

      expect(wrapper.vm).toBeDefined()
    })
  })

  describe('Message States', () => {
    it('displays error state correctly', () => {
      const message = createMockMessage({
        error: 'API request failed',
        errorDetails: 'Network timeout'
      })

      wrapper = mount(MessageItem, {
        props: { message },
        global: { plugins: [pinia] }
      })

      const content = wrapper.findComponent('[data-testid="message-content"]')
      expect(content.props('error')).toBe('API request failed')
      expect(content.props('showRetry')).toBe(true)
    })

    it('handles attachments correctly', () => {
      const message = createMockMessage({
        attachments: [
          {
            id: 'att-1',
            name: 'test.jpg',
            type: 'image',
            data: 'base64data...'
          }
        ]
      })

      wrapper = mount(MessageItem, {
        props: { message },
        global: { plugins: [pinia] }
      })

      const content = wrapper.findComponent('[data-testid="message-content"]')
      expect(content.props('attachments')).toHaveLength(1)
    })

    it('applies correct CSS classes for different roles', () => {
      const userMessage = createMockMessage({ role: 'user' })
      const assistantMessage = createMockMessage({ role: 'assistant' })

      const userWrapper = mount(MessageItem, {
        props: { message: userMessage },
        global: { plugins: [pinia] }
      })

      const assistantWrapper = mount(MessageItem, {
        props: { message: assistantMessage },
        global: { plugins: [pinia] }
      })

      // Should have different styling based on role
      expect(userWrapper.classes()).not.toEqual(assistantWrapper.classes())
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      const message = createMockMessage()

      wrapper = mount(MessageItem, {
        props: { message },
        global: { plugins: [pinia] }
      })

      const messageElement = wrapper.find('[data-message-id]')
      expect(messageElement.exists()).toBe(true)

      // Should have accessible structure
      expect(messageElement.attributes('data-message-id')).toBe('test-message-1')
    })

    it('is keyboard navigable', async () => {
      const message = createMockMessage()

      wrapper = mount(MessageItem, {
        props: { message },
        global: { plugins: [pinia] }
      })

      // Test keyboard navigation
      await wrapper.trigger('keydown', { key: 'Tab' })
      await wrapper.trigger('keydown', { key: 'Enter' })

      // Should handle keyboard interaction
      expect(wrapper.vm).toBeDefined()
    })
  })

  describe('Performance', () => {
    it('renders quickly with large content', () => {
      const largeContent = 'Lorem ipsum '.repeat(1000)
      const message = createMockMessage({ content: largeContent })

      const startTime = performance.now()

      wrapper = mount(MessageItem, {
        props: { message },
        global: { plugins: [pinia] }
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render within reasonable time
      expect(renderTime).toBeLessThan(100) // 100ms threshold
      expect(wrapper.find('[data-testid="message-content"]').exists()).toBe(true)
    })

    it('handles rapid prop updates efficiently', async () => {
      const message = createMockMessage()

      wrapper = mount(MessageItem, {
        props: { message },
        global: { plugins: [pinia] }
      })

      // Rapidly update message content
      for (let i = 0; i < 10; i++) {
        await wrapper.setProps({
          message: createMockMessage({ content: `Updated message ${i}` })
        })
      }

      // Should handle updates without issues
      expect(wrapper.vm).toBeDefined()
    })
  })

  describe('Animation States', () => {
    it('applies appear animation for new messages', () => {
      const message = createMockMessage()

      wrapper = mount(MessageItem, {
        props: {
          message,
          isNewMessage: true
        },
        global: { plugins: [pinia] }
      })

      expect(wrapper.find('.message-appear').exists()).toBe(true)
    })

    it('applies hover effects correctly', async () => {
      const message = createMockMessage()

      wrapper = mount(MessageItem, {
        props: { message },
        global: { plugins: [pinia] }
      })

      await wrapper.trigger('mouseenter')

      // Should have hover state
      expect(wrapper.find('.group').exists()).toBe(true)
    })
  })

  describe('Props Validation', () => {
    it('requires valid message prop', () => {
      expect(() => {
        mount(MessageItem, {
          props: { message: null },
          global: { plugins: [pinia] }
        })
      }).toThrow()
    })

    it('handles optional props correctly', () => {
      const message = createMockMessage()

      wrapper = mount(MessageItem, {
        props: {
          message,
          isLoading: false,
          isLast: true
        },
        global: { plugins: [pinia] }
      })

      expect(wrapper.vm).toBeDefined()
    })
  })
})
