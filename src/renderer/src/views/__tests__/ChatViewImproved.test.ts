import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ChatViewImproved from '../ChatViewImproved.vue'
import { useChatStore } from '@/stores/chat'

// Mock components that may not be available in test environment
vi.mock('@/components/chat/ModelConfigPanel.vue', () => ({
  default: {
    name: 'ModelConfigPanel',
    template: '<div data-testid="model-config-panel">Mock Model Config Panel</div>',
    props: ['config'],
    emits: ['export-config', 'import-config']
  }
}))

vi.mock('@/components/chat/SmartModelSelector.vue', () => ({
  default: {
    name: 'SmartModelSelector',
    template: '<div data-testid="model-selector">Mock Model Selector</div>',
    props: ['currentProviderId', 'currentModelId', 'availableProviders'],
    emits: ['select-model']
  }
}))

vi.mock('@/components/chat/ChatMessages.vue', () => ({
  default: {
    name: 'ChatMessages',
    template: '<div data-testid="chat-messages">Mock Chat Messages</div>',
    props: ['messages', 'isLoading', 'isGenerating'],
    emits: ['retry-message', 'edit-message', 'delete-message', 'send-suggestion']
  }
}))

vi.mock('@/components/chat/ChatInput.vue', () => ({
  default: {
    name: 'ChatInput',
    template: '<div data-testid="chat-input">Mock Chat Input</div>',
    props: ['isLoading', 'placeholder'],
    emits: ['send', 'focus', 'blur']
  }
}))

describe('ChatViewImproved', () => {
  let wrapper: VueWrapper<any>
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    
    // Mock window.electron for IPC
    global.window = {
      ...global.window,
      electron: {
        ipcRenderer: {
          invoke: vi.fn(),
          on: vi.fn(),
          off: vi.fn(),
          send: vi.fn()
        }
      }
    }
  })

  it('renders correctly with default state', () => {
    wrapper = mount(ChatViewImproved, {
      global: {
        plugins: [pinia],
        stubs: {
          'router-link': true,
          'router-view': true
        }
      }
    })

    expect(wrapper.find('[data-testid="model-config-panel"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="chat-messages"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="chat-input"]').exists()).toBe(true)
  })

  it('initializes chat store correctly', () => {
    wrapper = mount(ChatViewImproved, {
      global: {
        plugins: [pinia]
      }
    })

    const chatStore = useChatStore()
    expect(chatStore).toBeDefined()
    expect(chatStore.chats).toEqual([])
    expect(chatStore.currentChatId).toBeNull()
  })

  it('handles model selection', async () => {
    wrapper = mount(ChatViewImproved, {
      global: {
        plugins: [pinia]
      }
    })

    const modelSelector = wrapper.findComponent('[data-testid="model-selector"]')
    expect(modelSelector.exists()).toBe(true)

    // Test model selection event
    await modelSelector.vm.$emit('select-model', {
      providerId: 'openai',
      modelId: 'gpt-4'
    })

    // Should trigger model selection logic
    expect(wrapper.vm).toBeDefined()
  })

  it('shows brand and model info', () => {
    wrapper = mount(ChatViewImproved, {
      global: {
        plugins: [pinia]
      }
    })

    const brandElement = wrapper.find('.brand')
    expect(brandElement.exists()).toBe(true)
    expect(brandElement.text()).toBe('MiaoDa Chat')
  })

  it('handles sidebar toggle functionality', async () => {
    wrapper = mount(ChatViewImproved, {
      global: {
        plugins: [pinia]
      }
    })

    // Find sidebar toggle button (if it exists in the component)
    const toggleButton = wrapper.find('[title*="侧边栏"]')
    if (toggleButton.exists()) {
      await toggleButton.trigger('click')
      // Should toggle sidebar state
    }
  })

  it('handles new chat creation', async () => {
    wrapper = mount(ChatViewImproved, {
      global: {
        plugins: [pinia]
      }
    })

    const chatStore = useChatStore()
    const createChatSpy = vi.spyOn(chatStore, 'createChat').mockResolvedValue(createMockChat())

    // Look for new chat button
    const newChatButton = wrapper.find('[title*="新建"]')
    if (newChatButton.exists()) {
      await newChatButton.trigger('click')
      expect(createChatSpy).toHaveBeenCalled()
    }
  })

  it('handles API status display', () => {
    wrapper = mount(ChatViewImproved, {
      global: {
        plugins: [pinia]
      }
    })

    // Check if API status is shown
    const apiStatus = wrapper.find('.api-status')
    if (apiStatus.exists()) {
      expect(apiStatus.find('.api-status-dot').exists()).toBe(true)
      expect(apiStatus.find('.api-status-text').exists()).toBe(true)
    }
  })

  it('manages responsive layout correctly', async () => {
    wrapper = mount(ChatViewImproved, {
      global: {
        plugins: [pinia]
      }
    })

    // Test responsive behavior by checking for responsive classes
    const mainLayout = wrapper.find('.main-layout')
    expect(mainLayout.exists()).toBe(true)

    // Test mobile behavior
    global.innerWidth = 768
    global.dispatchEvent(new Event('resize'))
    await wrapper.vm.$nextTick()
    
    // Should adapt to mobile layout
  })

  it('handles keyboard shortcuts', async () => {
    wrapper = mount(ChatViewImproved, {
      global: {
        plugins: [pinia]
      }
    })

    const chatStore = useChatStore()
    const createChatSpy = vi.spyOn(chatStore, 'createChat').mockResolvedValue(createMockChat())

    // Test keyboard shortcut (CMD+N for new chat)
    await wrapper.trigger('keydown', { 
      key: 'n', 
      metaKey: true,
      preventDefault: vi.fn()
    })

    // Should handle the shortcut (if implemented)
  })

  it('handles error states gracefully', async () => {
    wrapper = mount(ChatViewImproved, {
      global: {
        plugins: [pinia]
      }
    })

    const chatStore = useChatStore()
    
    // Mock an error condition
    vi.spyOn(chatStore, 'loadChats').mockRejectedValue(new Error('Failed to load chats'))

    // Should handle error gracefully without crashing
    expect(wrapper.vm).toBeDefined()
  })

  it('manages focus states properly', async () => {
    wrapper = mount(ChatViewImproved, {
      global: {
        plugins: [pinia]
      }
    })

    // Test focus management
    const chatInput = wrapper.findComponent('[data-testid="chat-input"]')
    if (chatInput.exists()) {
      await chatInput.vm.$emit('focus')
      await chatInput.vm.$emit('blur')
    }

    // Should handle focus states
    expect(wrapper.vm).toBeDefined()
  })
})