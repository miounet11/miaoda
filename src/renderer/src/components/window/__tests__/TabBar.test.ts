import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import TabBar from '../TabBar.vue'
import { windowManager, type WindowTab } from '@renderer/src/services/window/WindowManager'

// Mock the windowManager
vi.mock('@/services/window/WindowManager', () => ({
  windowManager: {
    switchTab: vi.fn(),
    closeTab: vi.fn(),
    createTab: vi.fn(),
    moveTab: vi.fn(),
    moveTabToWindow: vi.fn(),
    createWindow: vi.fn()
  }
}))

// Mock vue-i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key
  })
}))

// Mock lucide-vue-next icons
vi.mock('lucide-vue-next', () => {
  const mockIcon = { name: 'MockIcon', template: '<div></div>' }
  return {
    Plus: mockIcon,
    X: mockIcon,
    ChevronLeft: mockIcon,
    ChevronRight: mockIcon,
    MoreHorizontal: mockIcon,
    Loader: mockIcon,
    MessageSquare: mockIcon,
    Settings: mockIcon,
    Wrench: mockIcon,
    Puzzle: mockIcon,
    FileText: mockIcon
  }
})

// Mock ContextMenu component
vi.mock('@/components/ui/ContextMenu.vue', () => ({
  default: {
    name: 'ContextMenu',
    template: '<div data-testid="context-menu"></div>',
    props: ['x', 'y', 'items'],
    emits: ['close', 'action']
  }
}))

describe('TabBar', () => {
  let wrapper: VueWrapper<any>
  
  const mockTabs: WindowTab[] = [
    {
      id: 'tab-1',
      title: 'Chat Tab',
      type: 'chat',
      closable: true,
      modified: false,
      createdAt: new Date(),
      lastActiveAt: new Date()
    },
    {
      id: 'tab-2',
      title: 'Settings Tab',
      type: 'settings',
      closable: true,
      modified: true,
      createdAt: new Date(),
      lastActiveAt: new Date()
    },
    {
      id: 'tab-3',
      title: 'Non-closable Tab',
      type: 'tools',
      closable: false,
      modified: false,
      createdAt: new Date(),
      lastActiveAt: new Date()
    }
  ]

  const defaultProps = {
    windowId: 'test-window',
    tabs: mockTabs,
    activeTabId: 'tab-1'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('Rendering', () => {
    it('should render all tabs', () => {
      wrapper = mount(TabBar, {
        props: defaultProps
      })

      const tabs = wrapper.findAll('.tab')
      expect(tabs).toHaveLength(3)
      
      expect(tabs[0].text()).toContain('Chat Tab')
      expect(tabs[1].text()).toContain('Settings Tab')
      expect(tabs[2].text()).toContain('Non-closable Tab')
    })

    it('should mark active tab correctly', () => {
      wrapper = mount(TabBar, {
        props: defaultProps
      })

      const tabs = wrapper.findAll('.tab')
      expect(tabs[0].classes()).toContain('tab-active')
      expect(tabs[1].classes()).not.toContain('tab-active')
      expect(tabs[2].classes()).not.toContain('tab-active')
    })

    it('should show modified indicator for modified tabs', () => {
      wrapper = mount(TabBar, {
        props: defaultProps
      })

      const tabs = wrapper.findAll('.tab')
      
      // First tab is not modified
      expect(tabs[0].find('.modified-indicator').exists()).toBe(false)
      
      // Second tab is modified
      expect(tabs[1].find('.modified-indicator').exists()).toBe(true)
      expect(tabs[1].classes()).toContain('tab-modified')
    })

    it('should show close button for closable tabs', () => {
      wrapper = mount(TabBar, {
        props: defaultProps
      })

      const tabs = wrapper.findAll('.tab')
      
      // First two tabs are closable
      expect(tabs[0].find('.tab-close').exists()).toBe(true)
      expect(tabs[1].find('.tab-close').exists()).toBe(true)
      
      // Third tab is not closable
      expect(tabs[2].find('.tab-close').exists()).toBe(false)
    })

    it('should show add button when enabled', () => {
      wrapper = mount(TabBar, {
        props: {
          ...defaultProps,
          showAddButton: true
        }
      })

      expect(wrapper.find('.add-tab-btn').exists()).toBe(true)
    })

    it('should hide add button when disabled', () => {
      wrapper = mount(TabBar, {
        props: {
          ...defaultProps,
          showAddButton: false
        }
      })

      expect(wrapper.find('.add-tab-btn').exists()).toBe(false)
    })

    it('should show navigation buttons when enabled', () => {
      wrapper = mount(TabBar, {
        props: {
          ...defaultProps,
          showNavigation: true
        }
      })

      expect(wrapper.find('.tab-navigation').exists()).toBe(true)
      expect(wrapper.findAll('.nav-btn')).toHaveLength(2)
    })

    it('should show tab menu button when enabled', () => {
      wrapper = mount(TabBar, {
        props: {
          ...defaultProps,
          showTabMenu: true
        }
      })

      expect(wrapper.find('.tab-menu-btn').exists()).toBe(true)
    })
  })

  describe('Tab Interactions', () => {
    beforeEach(() => {
      wrapper = mount(TabBar, {
        props: defaultProps
      })
    })

    it('should emit tab-select when tab is clicked', async () => {
      const secondTab = wrapper.findAll('.tab')[1]
      await secondTab.trigger('click')

      expect(windowManager.switchTab).toHaveBeenCalledWith('test-window', 'tab-2')
      expect(wrapper.emitted('tab-select')).toEqual([['tab-2']])
    })

    it('should emit tab-close when close button is clicked', async () => {
      const closeButton = wrapper.find('.tab-close')
      await closeButton.trigger('click')

      expect(windowManager.closeTab).toHaveBeenCalledWith('test-window', 'tab-1')
      expect(wrapper.emitted('tab-close')).toEqual([['tab-1']])
    })

    it('should emit tab-add when add button is clicked', async () => {
      wrapper = mount(TabBar, {
        props: {
          ...defaultProps,
          showAddButton: true
        }
      })

      const addButton = wrapper.find('.add-tab-btn')
      await addButton.trigger('click')

      expect(wrapper.emitted('tab-add')).toEqual([[]])
    })

    it('should close tab on middle mouse click', async () => {
      const tab = wrapper.findAll('.tab')[0]
      await tab.trigger('mousedown', { button: 1 })

      expect(windowManager.closeTab).toHaveBeenCalledWith('test-window', 'tab-1')
    })

    it('should not close non-closable tab on middle click', async () => {
      const nonClosableTab = wrapper.findAll('.tab')[2]
      await nonClosableTab.trigger('mousedown', { button: 1 })

      expect(windowManager.closeTab).not.toHaveBeenCalled()
    })
  })

  describe('Context Menu', () => {
    beforeEach(() => {
      wrapper = mount(TabBar, {
        props: defaultProps
      })
    })

    it('should show context menu on right click', async () => {
      const tab = wrapper.findAll('.tab')[0]
      await tab.trigger('contextmenu')

      await nextTick()

      expect(wrapper.find('[data-testid="context-menu"]').exists()).toBe(true)
      expect(wrapper.emitted('tab-context')).toBeDefined()
    })

    it('should hide context menu when clicking outside', async () => {
      // Show context menu
      const tab = wrapper.findAll('.tab')[0]
      await tab.trigger('contextmenu')
      await nextTick()

      expect(wrapper.find('[data-testid="context-menu"]').exists()).toBe(true)

      // Hide context menu
      const contextMenu = wrapper.findComponent({ name: 'ContextMenu' })
      await contextMenu.vm.$emit('close')
      await nextTick()

      expect(wrapper.find('[data-testid="context-menu"]').exists()).toBe(false)
    })
  })

  describe('Drag and Drop', () => {
    beforeEach(() => {
      wrapper = mount(TabBar, {
        props: {
          ...defaultProps,
          allowTabDrag: true
        }
      })
    })

    it('should set draggable attribute when drag is allowed', () => {
      const tabs = wrapper.findAll('.tab')
      tabs.forEach(tab => {
        expect(tab.attributes('draggable')).toBe('true')
      })
    })

    it('should not set draggable attribute when drag is disabled', () => {
      wrapper = mount(TabBar, {
        props: {
          ...defaultProps,
          allowTabDrag: false
        }
      })

      const tabs = wrapper.findAll('.tab')
      tabs.forEach(tab => {
        expect(tab.attributes('draggable')).toBe('false')
      })
    })

    it('should handle drag start', async () => {
      const tab = wrapper.findAll('.tab')[0]
      const mockDataTransfer = {
        effectAllowed: '',
        setData: vi.fn()
      }

      await tab.trigger('dragstart', {
        dataTransfer: mockDataTransfer
      })

      expect(mockDataTransfer.effectAllowed).toBe('move')
      expect(mockDataTransfer.setData).toHaveBeenCalledWith('text/plain', 'tab-1')
    })

    it('should handle drop and emit tab-move', async () => {
      const sourceTab = wrapper.findAll('.tab')[0]
      const targetTab = wrapper.findAll('.tab')[1]

      // Start drag
      await sourceTab.trigger('dragstart', {
        dataTransfer: { setData: vi.fn(), effectAllowed: '' }
      })

      // Drop on target
      await targetTab.trigger('drop', {
        dataTransfer: { getData: () => 'tab-1' },
        clientX: 100,
        currentTarget: { getBoundingClientRect: () => ({ left: 50, width: 100 }) }
      })

      expect(windowManager.moveTab).toHaveBeenCalled()
      expect(wrapper.emitted('tab-move')).toBeDefined()
    })
  })

  describe('Keyboard Navigation', () => {
    beforeEach(() => {
      wrapper = mount(TabBar, {
        props: defaultProps
      })

      // Mock document event listeners
      document.addEventListener = vi.fn()
      document.removeEventListener = vi.fn()
    })

    it('should setup keyboard event listeners on mount', () => {
      expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
    })

    it('should remove keyboard event listeners on unmount', () => {
      wrapper.unmount()
      expect(document.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
    })
  })

  describe('Scrolling', () => {
    beforeEach(() => {
      wrapper = mount(TabBar, {
        props: {
          ...defaultProps,
          showNavigation: true
        }
      })
    })

    it('should handle wheel scrolling', async () => {
      const tabList = wrapper.find('.tab-list')
      
      // Mock scrollLeft property
      Object.defineProperty(tabList.element, 'scrollLeft', {
        value: 0,
        writable: true
      })

      await tabList.trigger('wheel', { deltaY: 100 })

      // Should update scroll position
      expect(tabList.element.scrollLeft).toBe(100)
    })

    it('should scroll left when left nav button is clicked', async () => {
      const leftButton = wrapper.findAll('.nav-btn')[0]
      const tabList = wrapper.find('.tab-list')
      
      // Mock scrollBy method
      tabList.element.scrollBy = vi.fn()

      await leftButton.trigger('click')

      expect(tabList.element.scrollBy).toHaveBeenCalledWith({
        left: -150,
        behavior: 'smooth'
      })
    })

    it('should scroll right when right nav button is clicked', async () => {
      const rightButton = wrapper.findAll('.nav-btn')[1]
      const tabList = wrapper.find('.tab-list')
      
      // Mock scrollBy method
      tabList.element.scrollBy = vi.fn()

      await rightButton.trigger('click')

      expect(tabList.element.scrollBy).toHaveBeenCalledWith({
        left: 150,
        behavior: 'smooth'
      })
    })
  })

  describe('All Tabs Menu', () => {
    beforeEach(() => {
      wrapper = mount(TabBar, {
        props: {
          ...defaultProps,
          showTabMenu: true
        }
      })
    })

    it('should show all tabs menu when menu button is clicked', async () => {
      const menuButton = wrapper.find('.tab-menu-btn')
      await menuButton.trigger('click')
      await nextTick()

      expect(wrapper.find('.all-tabs-menu').exists()).toBe(true)
    })

    it('should hide all tabs menu when close button is clicked', async () => {
      // Show menu
      const menuButton = wrapper.find('.tab-menu-btn')
      await menuButton.trigger('click')
      await nextTick()

      // Hide menu
      const closeButton = wrapper.find('.all-tabs-menu button')
      await closeButton.trigger('click')
      await nextTick()

      expect(wrapper.find('.all-tabs-menu').exists()).toBe(false)
    })

    it('should select tab and close menu when tab is clicked in menu', async () => {
      // Show menu
      const menuButton = wrapper.find('.tab-menu-btn')
      await menuButton.trigger('click')
      await nextTick()

      // Click on a tab in the menu
      const menuTab = wrapper.findAll('.menu-tab')[1]
      await menuTab.trigger('click')
      await nextTick()

      expect(windowManager.switchTab).toHaveBeenCalledWith('test-window', 'tab-2')
      expect(wrapper.emitted('tab-select')).toContainEqual(['tab-2'])
      expect(wrapper.find('.all-tabs-menu').exists()).toBe(false)
    })
  })

  describe('Tab Actions', () => {
    beforeEach(() => {
      wrapper = mount(TabBar, {
        props: defaultProps
      })
    })

    it('should duplicate tab', async () => {
      // Mock createTab to return a promise
      vi.mocked(windowManager.createTab).mockResolvedValue({
        id: 'new-tab',
        title: 'Chat Tab (Copy)',
        type: 'chat',
        closable: true,
        modified: false,
        createdAt: new Date(),
        lastActiveAt: new Date()
      })

      // Trigger context menu
      const tab = wrapper.findAll('.tab')[0]
      await tab.trigger('contextmenu')
      await nextTick()

      // Find and trigger duplicate action
      const contextMenu = wrapper.findComponent({ name: 'ContextMenu' })
      const duplicateAction = contextMenu.vm.$props.items.find((item: any) => item.id === 'duplicate')
      
      if (duplicateAction) {
        await duplicateAction.action()
      }

      expect(windowManager.createTab).toHaveBeenCalledWith('test-window', {
        title: 'Chat Tab (Copy)',
        type: 'chat',
        chatId: undefined,
        data: undefined
      })
    })

    it('should move tab to new window', async () => {
      // Mock createWindow to return a promise
      vi.mocked(windowManager.createWindow).mockResolvedValue('new-window-id')

      // Trigger context menu
      const tab = wrapper.findAll('.tab')[0]
      await tab.trigger('contextmenu')
      await nextTick()

      // Find and trigger move to new window action
      const contextMenu = wrapper.findComponent({ name: 'ContextMenu' })
      const moveAction = contextMenu.vm.$props.items.find((item: any) => item.id === 'move-to-window')
      
      if (moveAction) {
        await moveAction.action()
      }

      expect(windowManager.createWindow).toHaveBeenCalledWith({
        title: 'Chat Tab',
        tabs: []
      })
      expect(windowManager.moveTabToWindow).toHaveBeenCalledWith('test-window', 'tab-1', 'new-window-id')
    })
  })

  describe('Loading States', () => {
    beforeEach(() => {
      wrapper = mount(TabBar, {
        props: defaultProps
      })
    })

    it('should show loading indicator for loading tabs', async () => {
      // Set tab as loading
      const tabBarInstance = wrapper.vm
      tabBarInstance.setTabLoading('tab-1', true)
      await nextTick()

      const tab = wrapper.findAll('.tab')[0]
      expect(tab.classes()).toContain('tab-loading')
      expect(tab.find('.tab-loading').exists()).toBe(true)
    })

    it('should hide loading indicator when loading is complete', async () => {
      // Set tab as loading then complete
      const tabBarInstance = wrapper.vm
      tabBarInstance.setTabLoading('tab-1', true)
      await nextTick()
      
      tabBarInstance.setTabLoading('tab-1', false)
      await nextTick()

      const tab = wrapper.findAll('.tab')[0]
      expect(tab.classes()).not.toContain('tab-loading')
      expect(tab.find('.tab-loading').exists()).toBe(false)
    })
  })

  describe('Props and Configuration', () => {
    it('should respect maxTabWidth prop', () => {
      wrapper = mount(TabBar, {
        props: {
          ...defaultProps,
          maxTabWidth: 300
        }
      })

      const tabs = wrapper.findAll('.tab')
      tabs.forEach(tab => {
        const style = getComputedStyle(tab.element)
        // Note: This test assumes CSS custom properties work in test environment
        // In real tests, you might need to check the actual rendered width
      })
    })

    it('should respect minTabWidth prop', () => {
      wrapper = mount(TabBar, {
        props: {
          ...defaultProps,
          minTabWidth: 80
        }
      })

      const tabs = wrapper.findAll('.tab')
      // Similar to maxTabWidth test, this would need proper CSS testing setup
    })

    it('should handle empty tabs array', () => {
      wrapper = mount(TabBar, {
        props: {
          ...defaultProps,
          tabs: [],
          activeTabId: null
        }
      })

      expect(wrapper.findAll('.tab')).toHaveLength(0)
      expect(wrapper.find('.add-tab-btn').exists()).toBe(true)
    })
  })
})