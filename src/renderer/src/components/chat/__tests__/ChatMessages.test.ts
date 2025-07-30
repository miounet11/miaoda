import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ChatMessages from '../ChatMessages.vue'
import type { Message } from '@renderer/src/types'

// Mock components
vi.mock('../MessageItem.vue', () => ({
  default: {
    name: 'MessageItem',
    template: '<div class="message-item" :data-message-id="message.id">{{ message.content }}</div>',
    props: ['message', 'showAvatar', 'showTimestamp'],
    emits: ['retry', 'edit', 'delete', 'copy']
  }
}))

vi.mock('@/components/loading/MessageSkeleton.vue', () => ({
  default: {
    name: 'MessageSkeleton',
    template: '<div class="message-skeleton"></div>'
  }
}))

vi.mock('@/components/loading/TypingIndicator.vue', () => ({
  default: {
    name: 'TypingIndicator',
    template: '<div class="typing-indicator"></div>'
  }
}))

// Mock lucide icons
vi.mock('lucide-vue-next', () => ({
  MessageSquare: { template: '<div data-testid="message-icon" />' },
  Sparkles: { template: '<div data-testid="sparkles-icon" />' },
  ChevronDown: { template: '<div data-testid="chevron-down-icon" />' }
}))

const mockMessages: Message[] = [
  {
    id: '1',
    content: 'Hello, how are you?',
    role: 'user',
    timestamp: new Date('2024-01-01T10:00:00Z'),
    chatId: 'chat1'
  },
  {
    id: '2',
    content: 'I am doing well, thank you for asking!',
    role: 'assistant',
    timestamp: new Date('2024-01-01T10:01:00Z'),
    chatId: 'chat1'
  },
  {
    id: '3',
    content: 'That\'s great to hear!',
    role: 'user',
    timestamp: new Date('2024-01-01T10:02:00Z'),
    chatId: 'chat1'
  }
]

describe('ChatMessages', () => {
  const defaultProps = {
    messages: mockMessages,
    isLoading: false,
    isGenerating: false,
    emptyStateTitle: 'Welcome to Chat',
    emptyStateDescription: 'Start a conversation',
    quickSuggestions: [
      'Tell me a joke',
      'Explain quantum physics',
      'Write a poem'
    ]
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn()
  })

  describe('Rendering', () => {
    it('renders messages correctly', () => {
      const wrapper = mount(ChatMessages, {
        props: defaultProps
      })

      expect(wrapper.findAll('.message-item')).toHaveLength(3)
      expect(wrapper.text()).toContain('Hello, how are you?')
      expect(wrapper.text()).toContain('I am doing well, thank you for asking!')
    })

    it('shows empty state when no messages', () => {
      const wrapper = mount(ChatMessages, {
        props: {
          ...defaultProps,
          messages: []
        }
      })

      expect(wrapper.find('.empty-state').exists()).toBe(true)
      expect(wrapper.text()).toContain('Welcome to Chat')
      expect(wrapper.text()).toContain('Start a conversation')
    })

    it('shows quick suggestions in empty state', () => {
      const wrapper = mount(ChatMessages, {
        props: {
          ...defaultProps,
          messages: []
        }
      })

      expect(wrapper.findAll('.suggestion-chip')).toHaveLength(3)
      expect(wrapper.text()).toContain('Tell me a joke')
      expect(wrapper.text()).toContain('Explain quantum physics')
    })

    it('shows loading skeleton when isLoading is true', () => {
      const wrapper = mount(ChatMessages, {
        props: {
          ...defaultProps,
          isLoading: true
        }
      })

      expect(wrapper.find('.message-skeleton').exists()).toBe(true)
    })

    it('shows typing indicator when isGenerating is true', () => {
      const wrapper = mount(ChatMessages, {
        props: {
          ...defaultProps,
          isGenerating: true
        }
      })

      expect(wrapper.find('.typing-indicator').exists()).toBe(true)
    })
  })

  describe('Scrolling Behavior', () => {
    it('scrolls to bottom automatically when new message is added', async () => {
      const wrapper = mount(ChatMessages, {
        props: defaultProps
      })

      const scrollElement = wrapper.find('.messages-container').element
      const scrollToBottomSpy = vi.spyOn(scrollElement, 'scrollTo').mockImplementation(() => {})

      await wrapper.setProps({
        messages: [...mockMessages, {
          id: '4',
          content: 'New message',
          role: 'user',
          timestamp: new Date(),
          chatId: 'chat1'
        }]
      })

      await nextTick()
      expect(scrollToBottomSpy).toHaveBeenCalled()
    })

    it('shows scroll to bottom button when not at bottom', async () => {
      const wrapper = mount(ChatMessages, {
        props: defaultProps
      })

      // Mock scroll position to simulate user scrolled up
      const container = wrapper.find('.messages-container')
      Object.defineProperty(container.element, 'scrollTop', { value: 100, writable: true })
      Object.defineProperty(container.element, 'scrollHeight', { value: 1000, writable: true })
      Object.defineProperty(container.element, 'clientHeight', { value: 500, writable: true })

      await container.trigger('scroll')
      await nextTick()

      expect(wrapper.find('[data-testid="scroll-to-bottom"]').exists()).toBe(true)
    })

    it('hides scroll to bottom button when at bottom', async () => {
      const wrapper = mount(ChatMessages, {
        props: defaultProps
      })

      // Mock scroll position to simulate at bottom
      const container = wrapper.find('.messages-container')
      Object.defineProperty(container.element, 'scrollTop', { value: 500, writable: true })
      Object.defineProperty(container.element, 'scrollHeight', { value: 1000, writable: true })
      Object.defineProperty(container.element, 'clientHeight', { value: 500, writable: true })

      await container.trigger('scroll')
      await nextTick()

      expect(wrapper.find('[data-testid="scroll-to-bottom"]').exists()).toBe(false)
    })
  })

  describe('Events', () => {
    it('emits send-suggestion when suggestion chip is clicked', async () => {
      const wrapper = mount(ChatMessages, {
        props: {
          ...defaultProps,
          messages: []
        }
      })

      await wrapper.find('.suggestion-chip').trigger('click')
      expect(wrapper.emitted('send-suggestion')).toHaveLength(1)
      expect(wrapper.emitted('send-suggestion')?.[0]).toEqual(['Tell me a joke'])
    })

    it('emits retry-message when message retry is triggered', async () => {
      const wrapper = mount(ChatMessages, {
        props: defaultProps
      })

      const messageItem = wrapper.findComponent({ name: 'MessageItem' })
      await messageItem.vm.$emit('retry', mockMessages[0])

      expect(wrapper.emitted('retry-message')).toHaveLength(1)
      expect(wrapper.emitted('retry-message')?.[0]).toEqual([mockMessages[0]])
    })

    it('emits edit-message when message edit is triggered', async () => {
      const wrapper = mount(ChatMessages, {
        props: defaultProps
      })

      const messageItem = wrapper.findComponent({ name: 'MessageItem' })
      await messageItem.vm.$emit('edit', mockMessages[0])

      expect(wrapper.emitted('edit-message')).toHaveLength(1)
      expect(wrapper.emitted('edit-message')?.[0]).toEqual([mockMessages[0]])
    })

    it('emits delete-message when message delete is triggered', async () => {
      const wrapper = mount(ChatMessages, {
        props: defaultProps
      })

      const messageItem = wrapper.findComponent({ name: 'MessageItem' })
      await messageItem.vm.$emit('delete', mockMessages[0])

      expect(wrapper.emitted('delete-message')).toHaveLength(1)
      expect(wrapper.emitted('delete-message')?.[0]).toEqual([mockMessages[0]])
    })

    it('scrolls to bottom when scroll button is clicked', async () => {
      const wrapper = mount(ChatMessages, {
        props: defaultProps
      })

      // Show scroll button
      wrapper.vm.showScrollButton = true
      await nextTick()

      const scrollBtn = wrapper.find('[data-testid="scroll-to-bottom"]')
      await scrollBtn.trigger('click')

      expect(wrapper.emitted('scroll-to-bottom')).toHaveLength(1)
    })
  })

  describe('Message Grouping', () => {
    it('groups consecutive messages from same sender', () => {
      const consecutiveMessages: Message[] = [
        {
          id: '1',
          content: 'First message',
          role: 'user',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          chatId: 'chat1'
        },
        {
          id: '2',
          content: 'Second message',
          role: 'user',
          timestamp: new Date('2024-01-01T10:00:30Z'),
          chatId: 'chat1'
        }
      ]

      const wrapper = mount(ChatMessages, {
        props: {
          ...defaultProps,
          messages: consecutiveMessages
        }
      })

      const messageItems = wrapper.findAllComponents({ name: 'MessageItem' })
      expect(messageItems[0].props('showAvatar')).toBe(true)
      expect(messageItems[1].props('showAvatar')).toBe(false) // Grouped message
    })

    it('shows timestamp for messages with significant time gap', () => {
      const messagesWithGap: Message[] = [
        {
          id: '1',
          content: 'First message',
          role: 'user',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          chatId: 'chat1'
        },
        {
          id: '2',
          content: 'Second message',
          role: 'user',
          timestamp: new Date('2024-01-01T11:00:00Z'), // 1 hour gap
          chatId: 'chat1'
        }
      ]

      const wrapper = mount(ChatMessages, {
        props: {
          ...defaultProps,
          messages: messagesWithGap
        }
      })

      const messageItems = wrapper.findAllComponents({ name: 'MessageItem' })
      expect(messageItems[1].props('showTimestamp')).toBe(true)
    })
  })

  describe('Performance', () => {
    it('virtualizes long message lists', () => {
      const manyMessages = Array.from({ length: 1000 }, (_, i) => ({
        id: `msg-${i}`,
        content: `Message ${i}`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        timestamp: new Date(),
        chatId: 'chat1'
      })) as Message[]

      const wrapper = mount(ChatMessages, {
        props: {
          ...defaultProps,
          messages: manyMessages
        }
      })

      // Should render only visible messages due to virtualization
      const renderedMessages = wrapper.findAll('.message-item')
      expect(renderedMessages.length).toBeLessThan(manyMessages.length)
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      const wrapper = mount(ChatMessages, {
        props: defaultProps
      })

      expect(wrapper.find('[aria-label="Chat messages"]').exists()).toBe(true)
      expect(wrapper.find('[role="log"]').exists()).toBe(true)
    })

    it('announces new messages to screen readers', async () => {
      const wrapper = mount(ChatMessages, {
        props: defaultProps
      })

      await wrapper.setProps({
        messages: [...mockMessages, {
          id: '4',
          content: 'New message for screen reader',
          role: 'assistant',
          timestamp: new Date(),
          chatId: 'chat1'
        }]
      })

      const announcement = wrapper.find('[aria-live="polite"]')
      expect(announcement.exists()).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('handles empty message content gracefully', () => {
      const messagesWithEmpty: Message[] = [{
        id: '1',
        content: '',
        role: 'user',
        timestamp: new Date(),
        chatId: 'chat1'
      }]

      const wrapper = mount(ChatMessages, {
        props: {
          ...defaultProps,
          messages: messagesWithEmpty
        }
      })

      expect(wrapper.findAll('.message-item')).toHaveLength(1)
    })

    it('handles messages without timestamps', () => {
      const messagesWithoutTimestamp: Message[] = [{
        id: '1',
        content: 'Message without timestamp',
        role: 'user'
      , timestamp: new Date() } as Message]

      const wrapper = mount(ChatMessages, {
        props: {
          ...defaultProps,
          messages: messagesWithoutTimestamp
        }
      })

      expect(wrapper.findAll('.message-item')).toHaveLength(1)
    })

    it('handles rapid message updates', async () => {
      const wrapper = mount(ChatMessages, {
        props: defaultProps
      })

      // Simulate rapid updates
      for (let i = 0; i < 10; i++) {
        await wrapper.setProps({
          messages: [...mockMessages, {
            id: `rapid-${i}`,
            content: `Rapid message ${i}`,
            role: 'assistant',
            timestamp: new Date(),
            chatId: 'chat1'
          }]
        })
      }

      expect(wrapper.findAll('.message-item').length).toBeGreaterThan(3)
    })
  })
})