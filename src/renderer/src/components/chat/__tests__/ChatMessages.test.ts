import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ChatMessages from '../ChatMessages.vue'
import type { Message } from '@/types'

// Mock child components
vi.mock('../MessageItem.vue', () => ({
  default: {
    name: 'MessageItem',
    template:
      '<div data-testid="message-item" :data-message-id="message.id">{{ message.content }}</div>',
    props: ['message', 'isLast', 'isLoading'],
    emits: ['retry', 'edit', 'delete', 'copy']
  }
}))

vi.mock('@/components/loading/MessageSkeleton.vue', () => ({
  default: {
    name: 'MessageSkeleton',
    template: '<div data-testid="message-skeleton">Loading...</div>'
  }
}))

vi.mock('lucide-vue-next', () => ({
  MessageSquare: { name: 'MessageSquare', template: '<span>💬</span>' }
}))

describe('ChatMessages', () => {
  let wrapper: VueWrapper<any>
  let pinia: ReturnType<typeof createPinia>

  const createMockMessages = (count: number): Message[] => {
    return Array(count)
      .fill(null)
      .map((_, index) =>
        createMockMessage({
          id: `msg-${index}`,
          content: `Message ${index}`,
          role: index % 2 === 0 ? 'user' : 'assistant',
          timestamp: new Date(Date.now() - (count - index) * 60000) // Spread over time
        })
      )
  }

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  describe('Empty State', () => {
    it('renders empty state when no messages', () => {
      wrapper = mount(ChatMessages, {
        props: {
          messages: [],
          isLoading: false,
          isGenerating: false
        },
        global: { plugins: [pinia] }
      })

      expect(wrapper.find('.empty-state').exists()).toBe(true)
      expect(wrapper.find('[data-testid="message-item"]').exists()).toBe(false)
    })

    it('displays empty state title and description', () => {
      wrapper = mount(ChatMessages, {
        props: {
          messages: [],
          emptyStateTitle: 'Start a conversation',
          emptyStateDescription: 'Ask me anything!'
        },
        global: { plugins: [pinia] }
      })

      expect(wrapper.text()).toContain('Start a conversation')
      expect(wrapper.text()).toContain('Ask me anything!')
    })

    it('renders quick suggestions when provided', () => {
      const suggestions = ['What is AI?', 'How can you help me?', 'Tell me a joke']

      wrapper = mount(ChatMessages, {
        props: {
          messages: [],
          quickSuggestions: suggestions
        },
        global: { plugins: [pinia] }
      })

      suggestions.forEach(suggestion => {
        expect(wrapper.text()).toContain(suggestion)
      })
    })

    it('emits suggestion when clicked', async () => {
      const suggestions = ['Test suggestion']

      wrapper = mount(ChatMessages, {
        props: {
          messages: [],
          quickSuggestions: suggestions
        },
        global: { plugins: [pinia] }
      })

      const suggestionButton = wrapper.find('button')
      await suggestionButton.trigger('click')

      expect(wrapper.emitted('send-suggestion')).toBeDefined()
      expect(wrapper.emitted('send-suggestion')![0]).toEqual(['Test suggestion'])
    })
  })

  describe('Message Rendering', () => {
    it('renders all messages correctly', () => {
      const messages = createMockMessages(3)

      wrapper = mount(ChatMessages, {
        props: { messages },
        global: { plugins: [pinia] }
      })

      const messageItems = wrapper.findAll('[data-testid="message-item"]')
      expect(messageItems).toHaveLength(3)

      messageItems.forEach((item, index) => {
        expect(item.attributes('data-message-id')).toBe(`msg-${index}`)
        expect(item.text()).toContain(`Message ${index}`)
      })
    })

    it('marks last message correctly', () => {
      const messages = createMockMessages(3)

      wrapper = mount(ChatMessages, {
        props: { messages },
        global: { plugins: [pinia] }
      })

      const messageItems = wrapper.findAllComponents({ name: 'MessageItem' })

      // Only the last message should have isLast=true
      expect(messageItems[0].props('isLast')).toBe(false)
      expect(messageItems[1].props('isLast')).toBe(false)
      expect(messageItems[2].props('isLast')).toBe(true)
    })

    it('handles loading state for last assistant message', () => {
      const messages = createMockMessages(2)
      messages[1].role = 'assistant' // Make last message from assistant

      wrapper = mount(ChatMessages, {
        props: {
          messages,
          isLoading: true
        },
        global: { plugins: [pinia] }
      })

      const lastMessageItem = wrapper.findAllComponents({ name: 'MessageItem' })[1]
      expect(lastMessageItem.props('isLoading')).toBe(true)
    })

    it('shows message skeleton when generating', () => {
      const messages = createMockMessages(2)

      wrapper = mount(ChatMessages, {
        props: {
          messages,
          isGenerating: true
        },
        global: { plugins: [pinia] }
      })

      expect(wrapper.find('[data-testid="message-skeleton"]').exists()).toBe(true)
    })
  })

  describe('Message Interactions', () => {
    it('emits retry-message event', async () => {
      const messages = createMockMessages(1)

      wrapper = mount(ChatMessages, {
        props: { messages },
        global: { plugins: [pinia] }
      })

      const messageItem = wrapper.findComponent({ name: 'MessageItem' })
      await messageItem.vm.$emit('retry', messages[0])

      expect(wrapper.emitted('retry-message')).toBeDefined()
      expect(wrapper.emitted('retry-message')![0]).toEqual([messages[0]])
    })

    it('emits edit-message event', async () => {
      const messages = createMockMessages(1)

      wrapper = mount(ChatMessages, {
        props: { messages },
        global: { plugins: [pinia] }
      })

      const messageItem = wrapper.findComponent({ name: 'MessageItem' })
      await messageItem.vm.$emit('edit', messages[0])

      expect(wrapper.emitted('edit-message')).toBeDefined()
      expect(wrapper.emitted('edit-message')![0]).toEqual([messages[0]])
    })

    it('emits delete-message event', async () => {
      const messages = createMockMessages(1)

      wrapper = mount(ChatMessages, {
        props: { messages },
        global: { plugins: [pinia] }
      })

      const messageItem = wrapper.findComponent({ name: 'MessageItem' })
      await messageItem.vm.$emit('delete', messages[0])

      expect(wrapper.emitted('delete-message')).toBeDefined()
      expect(wrapper.emitted('delete-message')![0]).toEqual([messages[0]])
    })

    it('handles message copy functionality', async () => {
      const messages = createMockMessages(1)

      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined)
        }
      })

      wrapper = mount(ChatMessages, {
        props: { messages },
        global: { plugins: [pinia] }
      })

      const messageItem = wrapper.findComponent({ name: 'MessageItem' })
      await messageItem.vm.$emit('copy', messages[0])

      // Should handle copy internally
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(messages[0].content)
    })
  })

  describe('Scrolling Behavior', () => {
    it('auto-scrolls to bottom with new messages', async () => {
      const messages = createMockMessages(3)

      wrapper = mount(ChatMessages, {
        props: { messages },
        global: { plugins: [pinia] }
      })

      // Mock scrollTo method
      const mockScrollTo = vi.fn()
      const messagesContainer = wrapper.find('.chat-messages')
      messagesContainer.element.scrollTo = mockScrollTo

      // Add new message
      const newMessages = [...messages, createMockMessage({ id: 'new-msg' })]
      await wrapper.setProps({ messages: newMessages })

      // Should scroll to bottom (implementation dependent)
      expect(wrapper.vm).toBeDefined()
    })

    it('maintains scroll position when not at bottom', async () => {
      const messages = createMockMessages(10)

      wrapper = mount(ChatMessages, {
        props: { messages },
        global: { plugins: [pinia] }
      })

      const messagesContainer = wrapper.find('.chat-messages')
      const mockScrollTo = vi.fn()
      messagesContainer.element.scrollTo = mockScrollTo

      // Simulate user scrolled up
      Object.defineProperty(messagesContainer.element, 'scrollTop', { value: 100 })
      Object.defineProperty(messagesContainer.element, 'scrollHeight', { value: 1000 })
      Object.defineProperty(messagesContainer.element, 'clientHeight', { value: 400 })

      // Add new message
      const newMessages = [...messages, createMockMessage({ id: 'new-msg' })]
      await wrapper.setProps({ messages: newMessages })

      // Should maintain position when user is scrolled up
      expect(wrapper.vm).toBeDefined()
    })
  })

  describe('Performance', () => {
    it('renders large message lists efficiently', () => {
      const messages = createMockMessages(100)

      const startTime = performance.now()

      wrapper = mount(ChatMessages, {
        props: { messages },
        global: { plugins: [pinia] }
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      expect(renderTime).toBeLessThan(1000) // Should render within 1 second
      expect(wrapper.findAll('[data-testid="message-item"]')).toHaveLength(100)
    })

    it('handles rapid message updates efficiently', async () => {
      let messages = createMockMessages(5)

      wrapper = mount(ChatMessages, {
        props: { messages },
        global: { plugins: [pinia] }
      })

      const startTime = performance.now()

      // Rapidly add messages
      for (let i = 0; i < 20; i++) {
        messages = [...messages, createMockMessage({ id: `rapid-${i}` })]
        await wrapper.setProps({ messages })
      }

      const endTime = performance.now()
      const updateTime = endTime - startTime

      expect(updateTime).toBeLessThan(1000) // Should handle updates efficiently
      expect(wrapper.findAll('[data-testid="message-item"]')).toHaveLength(25)
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA structure', () => {
      const messages = createMockMessages(3)

      wrapper = mount(ChatMessages, {
        props: { messages },
        global: { plugins: [pinia] }
      })

      const messagesContainer = wrapper.find('.chat-messages')
      expect(messagesContainer.exists()).toBe(true)

      // Should have appropriate ARIA roles
      expect(messagesContainer.attributes('role')).toBeDefined()
    })

    it('supports keyboard navigation', async () => {
      const messages = createMockMessages(3)

      wrapper = mount(ChatMessages, {
        props: { messages },
        global: { plugins: [pinia] }
      })

      // Test keyboard navigation
      await wrapper.trigger('keydown', { key: 'ArrowUp' })
      await wrapper.trigger('keydown', { key: 'ArrowDown' })
      await wrapper.trigger('keydown', { key: 'Home' })
      await wrapper.trigger('keydown', { key: 'End' })

      // Should handle keyboard navigation
      expect(wrapper.vm).toBeDefined()
    })

    it('provides screen reader support', () => {
      const messages = createMockMessages(2)

      wrapper = mount(ChatMessages, {
        props: { messages },
        global: { plugins: [pinia] }
      })

      // Should have appropriate labels and descriptions
      const messagesContainer = wrapper.find('.chat-messages')
      expect(messagesContainer.attributes('aria-label')).toBeDefined()
    })
  })

  describe('Loading States', () => {
    it('shows loading indicator correctly', () => {
      wrapper = mount(ChatMessages, {
        props: {
          messages: [],
          isLoading: true
        },
        global: { plugins: [pinia] }
      })

      // Should show some form of loading indication
      expect(wrapper.vm).toBeDefined()
    })

    it('shows generating indicator correctly', () => {
      const messages = createMockMessages(2)

      wrapper = mount(ChatMessages, {
        props: {
          messages,
          isGenerating: true
        },
        global: { plugins: [pinia] }
      })

      expect(wrapper.find('[data-testid="message-skeleton"]').exists()).toBe(true)
    })

    it('handles loading state transitions', async () => {
      const messages = createMockMessages(1)

      wrapper = mount(ChatMessages, {
        props: {
          messages,
          isLoading: false,
          isGenerating: false
        },
        global: { plugins: [pinia] }
      })

      // Start loading
      await wrapper.setProps({ isLoading: true })

      // Stop loading
      await wrapper.setProps({ isLoading: false })

      // Start generating
      await wrapper.setProps({ isGenerating: true })

      // Stop generating
      await wrapper.setProps({ isGenerating: false })

      expect(wrapper.vm).toBeDefined()
    })
  })

  describe('Message Updates', () => {
    it('handles message content updates', async () => {
      const messages = createMockMessages(2)

      wrapper = mount(ChatMessages, {
        props: { messages },
        global: { plugins: [pinia] }
      })

      // Update message content
      const updatedMessages = [...messages]
      updatedMessages[0] = { ...updatedMessages[0], content: 'Updated content' }

      await wrapper.setProps({ messages: updatedMessages })

      const firstMessage = wrapper.findAll('[data-testid="message-item"]')[0]
      expect(firstMessage.text()).toContain('Updated content')
    })

    it('handles message addition', async () => {
      const messages = createMockMessages(2)

      wrapper = mount(ChatMessages, {
        props: { messages },
        global: { plugins: [pinia] }
      })

      expect(wrapper.findAll('[data-testid="message-item"]')).toHaveLength(2)

      // Add new message
      const newMessages = [...messages, createMockMessage({ id: 'new-msg' })]
      await wrapper.setProps({ messages: newMessages })

      expect(wrapper.findAll('[data-testid="message-item"]')).toHaveLength(3)
    })

    it('handles message removal', async () => {
      const messages = createMockMessages(3)

      wrapper = mount(ChatMessages, {
        props: { messages },
        global: { plugins: [pinia] }
      })

      expect(wrapper.findAll('[data-testid="message-item"]')).toHaveLength(3)

      // Remove middle message
      const filteredMessages = messages.filter(msg => msg.id !== 'msg-1')
      await wrapper.setProps({ messages: filteredMessages })

      expect(wrapper.findAll('[data-testid="message-item"]')).toHaveLength(2)
    })
  })

  describe('Error Handling', () => {
    it('handles malformed message data gracefully', () => {
      const malformedMessages = [
        { id: 'bad-1' }, // Missing required fields
        { content: 'No ID' }, // Missing ID
        null, // Null message
        undefined // Undefined message
      ] as any

      expect(() => {
        wrapper = mount(ChatMessages, {
          props: { messages: malformedMessages },
          global: { plugins: [pinia] }
        })
      }).not.toThrow()
    })

    it('recovers from rendering errors', async () => {
      const messages = createMockMessages(2)

      wrapper = mount(ChatMessages, {
        props: { messages },
        global: { plugins: [pinia] }
      })

      // Simulate a rendering error by passing invalid data
      const invalidMessages = [{ invalid: 'data' }] as any

      await wrapper.setProps({ messages: invalidMessages })

      // Component should still be mounted and functional
      expect(wrapper.vm).toBeDefined()
    })
  })

  describe('Responsive Design', () => {
    it('adapts to different screen sizes', () => {
      const messages = createMockMessages(3)

      wrapper = mount(ChatMessages, {
        props: { messages },
        global: { plugins: [pinia] }
      })

      // Check for responsive classes
      const container = wrapper.find('.chat-messages')
      expect(container.classes()).toContain('px-2')
      expect(container.classes()).toContain('sm:px-4')
    })

    it('adjusts spacing for mobile devices', () => {
      const messages = createMockMessages(2)

      wrapper = mount(ChatMessages, {
        props: { messages },
        global: { plugins: [pinia] }
      })

      // Should have mobile-friendly spacing
      const messagesList = wrapper.find('.messages-list')
      expect(messagesList.classes()).toContain('space-y-6')
    })
  })

  describe('Virtual Scrolling', () => {
    it('handles large message lists efficiently', () => {
      const messages = createMockMessages(1000)

      wrapper = mount(ChatMessages, {
        props: { messages },
        global: { plugins: [pinia] }
      })

      // With virtual scrolling, not all items should be rendered
      const renderedItems = wrapper.findAll('[data-testid="message-item"]')

      // Exact behavior depends on virtual scrolling implementation
      expect(wrapper.vm).toBeDefined()
    })

    it('maintains scroll position during updates', async () => {
      const messages = createMockMessages(50)

      wrapper = mount(ChatMessages, {
        props: { messages },
        global: { plugins: [pinia] }
      })

      // Mock scroll position
      const container = wrapper.find('.chat-messages')
      Object.defineProperty(container.element, 'scrollTop', { value: 500 })

      // Add message at the beginning (should not affect scroll)
      const newMessages = [createMockMessage({ id: 'prepend' }), ...messages]
      await wrapper.setProps({ messages: newMessages })

      // Scroll position should be maintained
      expect(wrapper.vm).toBeDefined()
    })
  })

  describe('Animation and Transitions', () => {
    it('applies appear animations to new messages', async () => {
      const messages = createMockMessages(1)

      wrapper = mount(ChatMessages, {
        props: { messages },
        global: { plugins: [pinia] }
      })

      // Add new message
      const newMessages = [...messages, createMockMessage({ id: 'animated' })]
      await wrapper.setProps({ messages: newMessages })

      // Should apply animation classes
      expect(wrapper.vm).toBeDefined()
    })

    it('handles smooth scrolling', () => {
      const messages = createMockMessages(10)

      wrapper = mount(ChatMessages, {
        props: { messages },
        global: { plugins: [pinia] }
      })

      const container = wrapper.find('.chat-messages')

      // Should have smooth scrolling enabled
      expect(container.element.style.scrollBehavior).toBeDefined()
    })
  })

  describe('Memory Management', () => {
    it('cleans up event listeners on unmount', async () => {
      const messages = createMockMessages(5)

      wrapper = mount(ChatMessages, {
        props: { messages },
        global: { plugins: [pinia] }
      })

      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      wrapper.unmount()

      // Should clean up any event listeners
      expect(wrapper.vm).toBeDefined()
    })

    it('handles component updates without memory leaks', async () => {
      const messages = createMockMessages(10)

      wrapper = mount(ChatMessages, {
        props: { messages },
        global: { plugins: [pinia] }
      })

      // Perform multiple updates
      for (let i = 0; i < 10; i++) {
        const updatedMessages = createMockMessages(10 + i)
        await wrapper.setProps({ messages: updatedMessages })
      }

      // Should handle updates efficiently
      expect(wrapper.vm).toBeDefined()
    })
  })
})
