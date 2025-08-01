import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { mountComponent } from '../../../../../test/utils'
import ChatSidebar from '../ChatSidebar.vue'
import type { Chat } from '@renderer/src/types'

// Mock composables
vi.mock('@/composables/useResponsive', () => ({
  useResponsive: () => ({
    isMobile: false,
    isDesktop: true
  })
}))

// Mock lucide icons
vi.mock('lucide-vue-next', () => ({
  Plus: { template: '<div data-testid="plus-icon" />' },
  Settings: { template: '<div data-testid="settings-icon" />' },
  Search: { template: '<div data-testid="search-icon" />' },
  MoreHorizontal: { template: '<div data-testid="more-icon" />' },
  Trash2: { template: '<div data-testid="trash-icon" />' },
  MessageSquare: { template: '<div data-testid="message-icon" />' }
}))

const mockChats: Chat[] = [
  {
    id: '1',
    title: 'First Chat',
    messages: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '2',
    title: 'Second Chat',
    messages: [],
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02')
  }
]

describe('ChatSidebar', () => {
  const defaultProps = {
    chats: mockChats,
    currentChatId: '1',
    isMobile: false,
    sidebarOpen: true
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders chat list correctly', () => {
      const wrapper = mountComponent(ChatSidebar, {
        props: defaultProps
      })

      expect(wrapper.find('[data-testid="chat-sidebar"]').exists()).toBe(true)
      expect(wrapper.findAll('.chat-item')).toHaveLength(2)
      expect(wrapper.text()).toContain('First Chat')
      expect(wrapper.text()).toContain('Second Chat')
    })

    it('applies mobile classes when isMobile is true', () => {
      const wrapper = mountComponent(ChatSidebar, {
        props: {
          ...defaultProps,
          isMobile: true
        }
      })

      const sidebar = wrapper.find('[data-testid="chat-sidebar"]')
      expect(sidebar.classes()).toContain('mobile')
    })

    it('highlights current chat', () => {
      const wrapper = mountComponent(ChatSidebar, {
        props: defaultProps
      })

      const currentChatItem = wrapper.find('[data-chat-id="1"]')
      expect(currentChatItem.classes()).toContain('active')
    })

    it('shows empty state when no chats', () => {
      const wrapper = mountComponent(ChatSidebar, {
        props: {
          ...defaultProps,
          chats: []
        }
      })

      expect(wrapper.find('.empty-state').exists()).toBe(true)
      expect(wrapper.text()).toContain('No conversations yet')
    })
  })

  describe('Events', () => {
    it('emits new-chat when new chat button is clicked', async () => {
      const wrapper = mountComponent(ChatSidebar, {
        props: defaultProps
      })

      await wrapper.find('[data-testid="new-chat-btn"]').trigger('click')
      expect(wrapper.emitted('new-chat')).toHaveLength(1)
    })

    it('emits select-chat when chat item is clicked', async () => {
      const wrapper = mountComponent(ChatSidebar, {
        props: defaultProps
      })

      await wrapper.find('[data-chat-id="2"]').trigger('click')
      expect(wrapper.emitted('select-chat')).toHaveLength(1)
      expect(wrapper.emitted('select-chat')?.[0]).toEqual(['2'])
    })

    it('emits open-settings when settings button is clicked', async () => {
      const wrapper = mountComponent(ChatSidebar, {
        props: defaultProps
      })

      await wrapper.find('[data-testid="settings-btn"]').trigger('click')
      expect(wrapper.emitted('open-settings')).toHaveLength(1)
    })

    it('emits show-context-menu on right click', async () => {
      const wrapper = mountComponent(ChatSidebar, {
        props: defaultProps
      })

      const chatItem = wrapper.find('[data-chat-id="1"]')
      await chatItem.trigger('contextmenu')
      
      expect(wrapper.emitted('show-context-menu')).toHaveLength(1)
      expect(wrapper.emitted('show-context-menu')?.[0][0]).toBe('1')
    })
  })

  describe('Search Functionality', () => {
    it('filters chats based on search query', async () => {
      const wrapper = mountComponent(ChatSidebar, {
        props: defaultProps
      })

      const searchInput = wrapper.find('input[type="text"]')
      await searchInput.setValue('First')
      await nextTick()

      const visibleChats = wrapper.findAll('.chat-item:not(.hidden)')
      expect(visibleChats).toHaveLength(1)
      expect(wrapper.text()).toContain('First Chat')
      expect(wrapper.text()).not.toContain('Second Chat')
    })

    it('shows no results when search has no matches', async () => {
      const wrapper = mountComponent(ChatSidebar, {
        props: defaultProps
      })

      const searchInput = wrapper.find('input[type="text"]')
      await searchInput.setValue('Nonexistent')
      await nextTick()

      expect(wrapper.find('.no-results').exists()).toBe(true)
      expect(wrapper.text()).toContain('No chats found')
    })

    it('clears search when clear button is clicked', async () => {
      const wrapper = mountComponent(ChatSidebar, {
        props: defaultProps
      })

      const searchInput = wrapper.find('input[type="text"]')
      await searchInput.setValue('First')
      await nextTick()

      await wrapper.find('[data-testid="clear-search"]').trigger('click')
      expect(searchInput.element.value).toBe('')
    })
  })

  describe('Responsive Behavior', () => {
    it('shows mobile header on mobile', () => {
      const wrapper = mountComponent(ChatSidebar, {
        props: {
          ...defaultProps,
          isMobile: true
        }
      })

      expect(wrapper.find('.mobile-header').exists()).toBe(true)
    })

    it('hides sidebar when sidebarOpen is false on mobile', () => {
      const wrapper = mountComponent(ChatSidebar, {
        props: {
          ...defaultProps,
          isMobile: true,
          sidebarOpen: false
        }
      })

      const sidebar = wrapper.find('[data-testid="chat-sidebar"]')
      expect(sidebar.classes()).toContain('hidden')
    })
  })

  describe('Keyboard Navigation', () => {
    it('navigates chats with arrow keys', async () => {
      const wrapper = mountComponent(ChatSidebar, {
        props: defaultProps
      })

      const sidebar = wrapper.find('[data-testid="chat-sidebar"]')
      await sidebar.trigger('keydown', { key: 'ArrowDown' })
      
      // Should focus next chat
      expect(wrapper.emitted('select-chat')).toHaveLength(1)
      expect(wrapper.emitted('select-chat')?.[0]).toEqual(['2'])
    })

    it('creates new chat with Ctrl+N', async () => {
      const wrapper = mountComponent(ChatSidebar, {
        props: defaultProps
      })

      const sidebar = wrapper.find('[data-testid="chat-sidebar"]')
      await sidebar.trigger('keydown', { key: 'n', ctrlKey: true })
      
      expect(wrapper.emitted('new-chat')).toHaveLength(1)
    })
  })

  describe('Context Menu', () => {
    it('shows context menu on more button click', async () => {
      const wrapper = mountComponent(ChatSidebar, {
        props: defaultProps
      })

      const moreButton = wrapper.find('[data-testid="chat-more-1"]')
      await moreButton.trigger('click')
      
      expect(wrapper.emitted('show-context-menu')).toHaveLength(1)
    })

    it('prevents default on context menu event', async () => {
      const wrapper = mountComponent(ChatSidebar, {
        props: defaultProps
      })

      const chatItem = wrapper.find('[data-chat-id="1"]')
      const event = { preventDefault: vi.fn() }
      
      await chatItem.trigger('contextmenu', event)
      expect(event.preventDefault).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      const wrapper = mountComponent(ChatSidebar, {
        props: defaultProps
      })

      expect(wrapper.find('[aria-label="Create new chat"]').exists()).toBe(true)
      expect(wrapper.find('[aria-label="Search conversations"]').exists()).toBe(true)
      expect(wrapper.find('[role="list"]').exists()).toBe(true)
    })

    it('has proper focus management', async () => {
      const wrapper = mountComponent(ChatSidebar, {
        props: defaultProps
      })

      const chatItems = wrapper.findAll('[role="listitem"]')
      expect(chatItems[0].attributes('tabindex')).toBe('0')
    })
  })

  describe('Edge Cases', () => {
    it('handles undefined currentChatId', () => {
      const wrapper = mountComponent(ChatSidebar, {
        props: {
          ...defaultProps,
          currentChatId: undefined
        }
      })

      expect(wrapper.findAll('.active')).toHaveLength(0)
    })

    it('handles long chat titles', () => {
      const longTitleChats = [{
        ...mockChats[0],
        title: 'This is a very long chat title that should be truncated properly'
      }]

      const wrapper = mountComponent(ChatSidebar, {
        props: {
          ...defaultProps,
          chats: longTitleChats
        }
      })

      const chatTitle = wrapper.find('.chat-title')
      expect(chatTitle.classes()).toContain('truncate')
    })

    it('handles empty search gracefully', async () => {
      const wrapper = mountComponent(ChatSidebar, {
        props: defaultProps
      })

      const searchInput = wrapper.find('input[type="text"]')
      await searchInput.setValue('')
      await nextTick()

      expect(wrapper.findAll('.chat-item')).toHaveLength(2)
    })
  })
})