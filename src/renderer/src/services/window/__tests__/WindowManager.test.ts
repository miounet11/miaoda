import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { WindowManager, type WindowState, type WindowTab } from '../WindowManager'

// Mock window.api
const mockApi = {
  window: {
    createWindow: vi.fn(),
    closeWindow: vi.fn(),
    focusWindow: vi.fn(),
    minimizeWindow: vi.fn(),
    maximizeWindow: vi.fn(),
    setWindowBounds: vi.fn(),
    onWindowCreated: vi.fn(),
    onWindowClosed: vi.fn(),
    onWindowFocused: vi.fn(),
    onWindowBoundsChanged: vi.fn()
  },
  dialog: {
    showMessageBox: vi.fn()
  }
}

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'api', {
  value: mockApi,
  writable: true
})

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
})

// Mock confirm
const mockConfirm = vi.fn()
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true
})

describe('WindowManager', () => {
  let windowManager: WindowManager
  
  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Create a minimal WindowManager instance for testing
    windowManager = Object.create(WindowManager.prototype)
    
    // Initialize the internal state
    ;(windowManager as any).windows = new Map()
    ;(windowManager as any).layouts = new Map()
    ;(windowManager as any).activeWindowId = null
    ;(windowManager as any).connectionRetryDelays = new Map()
    ;(windowManager as any).heartbeatIntervals = new Map()
    
    // Call the parent EventEmitter constructor
    ;(windowManager as any).eventNames = () => []
    ;(windowManager as any).listeners = () => []
    ;(windowManager as any).listenerCount = () => 0
    ;(windowManager as any).emit = vi.fn()
    ;(windowManager as any).on = vi.fn()
    ;(windowManager as any).off = vi.fn()
    ;(windowManager as any).clear = vi.fn()
    
    // Set up proper event emitter functionality
    const events = new Map()
    ;(windowManager as any).emit = vi.fn((event: string, ...args: any[]) => {
      const listeners = events.get(event) || []
      listeners.forEach((listener: any) => listener(...args))
    })
    ;(windowManager as any).on = vi.fn((event: string, listener: any) => {
      if (!events.has(event)) {
        events.set(event, [])
      }
      events.get(event).push(listener)
    })
    
    // Mock the methods that are used in tests
    Object.setPrototypeOf(windowManager, WindowManager.prototype)
  })
  
  afterEach(() => {
    if (windowManager?.destroy) {
      windowManager.destroy()
    }
  })

  describe('Window Management', () => {
    it('should create a window with default properties', async () => {
      const windowId = await windowManager.createWindow({
        title: 'Test Window'
      })
      
      expect(windowId).toBeDefined()
      expect(typeof windowId).toBe('string')
      
      const window = windowManager.getWindow(windowId)
      expect(window).toBeDefined()
      expect(window!.title).toBe('Test Window')
      expect(window!.tabs).toHaveLength(1) // Default tab should be created
      expect(window!.activeTabId).toBeDefined()
    })

    it('should create a window with custom bounds', async () => {
      const customBounds = {
        x: 200,
        y: 300,
        width: 800,
        height: 600
      }
      
      const windowId = await windowManager.createWindow({
        bounds: customBounds
      })
      
      const window = windowManager.getWindow(windowId)
      expect(window!.bounds).toEqual(customBounds)
    })

    it('should create a window with custom tabs', async () => {
      const customTabs = [
        { title: 'Chat Tab', type: 'chat' as const },
        { title: 'Settings Tab', type: 'settings' as const }
      ]
      
      const windowId = await windowManager.createWindow({
        tabs: customTabs
      })
      
      const window = windowManager.getWindow(windowId)
      expect(window!.tabs).toHaveLength(2)
      expect(window!.tabs[0].title).toBe('Chat Tab')
      expect(window!.tabs[1].title).toBe('Settings Tab')
    })

    it('should close a window successfully', async () => {
      const windowId = await windowManager.createWindow({})
      
      const result = await windowManager.closeWindow(windowId, true) // Force close
      
      expect(result).toBe(true)
      expect(windowManager.getWindow(windowId)).toBeNull()
    })

    it('should not close window with unsaved changes without confirmation', async () => {
      const windowId = await windowManager.createWindow({})
      const window = windowManager.getWindow(windowId)!
      
      // Mark tab as modified
      windowManager.markTabModified(windowId, window.tabs[0].id, true)
      
      // Mock user canceling close
      mockConfirm.mockReturnValue(false)
      
      const result = await windowManager.closeWindow(windowId)
      
      expect(result).toBe(false)
      expect(windowManager.getWindow(windowId)).toBeDefined()
    })

    it('should focus a window', () => {
      const windowId = 'test-window-id'
      const window: WindowState = {
        id: windowId,
        title: 'Test Window',
        bounds: { x: 0, y: 0, width: 800, height: 600 },
        isMaximized: false,
        isMinimized: false,
        isFullscreen: false,
        isAlwaysOnTop: false,
        tabs: [],
        activeTabId: null,
        theme: 'system',
        opacity: 1.0
      }
      
      // Manually add window for this test
      ;(windowManager as any).windows.set(windowId, window)
      
      const result = windowManager.focusWindow(windowId)
      
      expect(result).toBe(true)
      expect(windowManager.getActiveWindow()?.id).toBe(windowId)
    })

    it('should set window bounds', async () => {
      const windowId = await windowManager.createWindow({})
      const newBounds = { x: 100, y: 200, width: 1000, height: 700 }
      
      const result = await windowManager.setWindowBounds(windowId, newBounds)
      
      expect(result).toBe(true)
      
      const window = windowManager.getWindow(windowId)
      expect(window!.bounds).toEqual(newBounds)
    })
  })

  describe('Tab Management', () => {
    let windowId: string
    
    beforeEach(async () => {
      windowId = await windowManager.createWindow({})
    })

    it('should create a tab with default properties', async () => {
      const tab = await windowManager.createTab(windowId, {
        title: 'New Tab'
      })
      
      expect(tab).toBeDefined()
      expect(tab.title).toBe('New Tab')
      expect(tab.type).toBe('chat') // Default type
      expect(tab.closable).toBe(true)
      expect(tab.modified).toBe(false)
      expect(tab.id).toBeDefined()
    })

    it('should create a tab with custom properties', async () => {
      const tabOptions = {
        title: 'Settings Tab',
        type: 'settings' as const,
        closable: false,
        data: { section: 'general' }
      }
      
      const tab = await windowManager.createTab(windowId, tabOptions)
      
      expect(tab.title).toBe('Settings Tab')
      expect(tab.type).toBe('settings')
      expect(tab.closable).toBe(false)
      expect(tab.data).toEqual({ section: 'general' })
    })

    it('should close a tab successfully', async () => {
      const tab = await windowManager.createTab(windowId, { title: 'Test Tab' })
      
      const result = await windowManager.closeTab(windowId, tab.id, true) // Force close
      
      expect(result).toBe(true)
      
      const window = windowManager.getWindow(windowId)
      expect(window!.tabs.find(t => t.id === tab.id)).toBeUndefined()
    })

    it('should not close non-closable tab without force', async () => {
      const tab = await windowManager.createTab(windowId, {
        title: 'Non-closable Tab',
        closable: false
      })
      
      const result = await windowManager.closeTab(windowId, tab.id)
      
      expect(result).toBe(false)
      
      const window = windowManager.getWindow(windowId)
      expect(window!.tabs.find(t => t.id === tab.id)).toBeDefined()
    })

    it('should switch to a tab', () => {
      const window = windowManager.getWindow(windowId)!
      const firstTabId = window.tabs[0].id
      
      // Create another tab
      windowManager.createTab(windowId, { title: 'Second Tab' }).then(secondTab => {
        // Switch to second tab
        const result = windowManager.switchTab(windowId, secondTab.id)
        
        expect(result).toBe(true)
        
        const updatedWindow = windowManager.getWindow(windowId)
        expect(updatedWindow!.activeTabId).toBe(secondTab.id)
      })
    })

    it('should move a tab to a different position', async () => {
      // Create multiple tabs
      const tab1 = await windowManager.createTab(windowId, { title: 'Tab 1' })
      const tab2 = await windowManager.createTab(windowId, { title: 'Tab 2' })
      const tab3 = await windowManager.createTab(windowId, { title: 'Tab 3' })
      
      // Move tab1 to position 2
      const result = windowManager.moveTab(windowId, tab1.id, 2)
      
      expect(result).toBe(true)
      
      const window = windowManager.getWindow(windowId)
      const tabIds = window!.tabs.map(t => t.id)
      
      // Tab order should now be: defaultTab, tab2, tab1, tab3
      expect(tabIds.indexOf(tab1.id)).toBe(2)
    })

    it('should move tab between windows', async () => {
      // Create second window
      const secondWindowId = await windowManager.createWindow({})
      
      // Create a tab to move
      const tab = await windowManager.createTab(windowId, { title: 'Movable Tab' })
      
      const result = windowManager.moveTabToWindow(windowId, tab.id, secondWindowId)
      
      expect(result).toBe(true)
      
      // Tab should no longer be in first window
      const firstWindow = windowManager.getWindow(windowId)
      expect(firstWindow!.tabs.find(t => t.id === tab.id)).toBeUndefined()
      
      // Tab should be in second window
      const secondWindow = windowManager.getWindow(secondWindowId)
      expect(secondWindow!.tabs.find(t => t.id === tab.id)).toBeDefined()
    })

    it('should update tab title', () => {
      const window = windowManager.getWindow(windowId)!
      const tabId = window.tabs[0].id
      
      const result = windowManager.updateTabTitle(windowId, tabId, 'Updated Title')
      
      expect(result).toBe(true)
      
      const updatedWindow = windowManager.getWindow(windowId)
      const updatedTab = updatedWindow!.tabs.find(t => t.id === tabId)
      expect(updatedTab!.title).toBe('Updated Title')
    })

    it('should mark tab as modified', () => {
      const window = windowManager.getWindow(windowId)!
      const tabId = window.tabs[0].id
      
      const result = windowManager.markTabModified(windowId, tabId, true)
      
      expect(result).toBe(true)
      
      const updatedWindow = windowManager.getWindow(windowId)
      const updatedTab = updatedWindow!.tabs.find(t => t.id === tabId)
      expect(updatedTab!.modified).toBe(true)
    })
  })

  describe('Layout Management', () => {
    let windowId: string
    
    beforeEach(async () => {
      windowId = await windowManager.createWindow({
        title: 'Layout Test Window'
      })
    })

    it('should save a layout', async () => {
      const layoutId = await windowManager.saveLayout('Test Layout', 'Test description')
      
      expect(layoutId).toBeDefined()
      expect(typeof layoutId).toBe('string')
      
      const layouts = windowManager.getLayouts()
      expect(layouts).toHaveLength(1)
      expect(layouts[0].name).toBe('Test Layout')
      expect(layouts[0].description).toBe('Test description')
    })

    it('should restore a layout', async () => {
      // Save current layout
      const layoutId = await windowManager.saveLayout('Test Layout')
      
      // Create another window to test restoration
      await windowManager.createWindow({ title: 'Another Window' })
      
      // Restore layout
      const result = await windowManager.restoreLayout(layoutId)
      
      expect(result).toBe(true)
      
      // Should have same number of windows as when layout was saved
      const windows = windowManager.getWindows()
      expect(windows).toHaveLength(1) // Only the original window from the layout
      expect(windows[0].title).toBe('Layout Test Window')
    })

    it('should not restore non-existent layout', async () => {
      const result = await windowManager.restoreLayout('non-existent-layout')
      
      expect(result).toBe(false)
    })
  })

  describe('Event Handling', () => {
    it('should emit window-created event', async () => {
      const eventSpy = vi.fn()
      windowManager.on('window-created', eventSpy)
      
      await windowManager.createWindow({ title: 'Event Test' })
      
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Event Test'
        })
      )
    })

    it('should emit tab-created event', async () => {
      const windowId = await windowManager.createWindow({})
      const eventSpy = vi.fn()
      windowManager.on('tab-created', eventSpy)
      
      await windowManager.createTab(windowId, { title: 'Event Tab' })
      
      expect(eventSpy).toHaveBeenCalledWith(
        windowId,
        expect.objectContaining({
          title: 'Event Tab'
        })
      )
    })

    it('should emit tab-switched event', async () => {
      const windowId = await windowManager.createWindow({})
      const tab = await windowManager.createTab(windowId, { title: 'Switch Tab' })
      
      const eventSpy = vi.fn()
      windowManager.on('tab-switched', eventSpy)
      
      windowManager.switchTab(windowId, tab.id)
      
      expect(eventSpy).toHaveBeenCalledWith(windowId, tab.id)
    })
  })

  describe('Utility Methods', () => {
    it('should get all windows', async () => {
      const windowId1 = await windowManager.createWindow({ title: 'Window 1' })
      const windowId2 = await windowManager.createWindow({ title: 'Window 2' })
      
      const windows = windowManager.getWindows()
      
      expect(windows).toHaveLength(2)
      expect(windows.find(w => w.id === windowId1)).toBeDefined()
      expect(windows.find(w => w.id === windowId2)).toBeDefined()
    })

    it('should get window tabs', async () => {
      const windowId = await windowManager.createWindow({})
      await windowManager.createTab(windowId, { title: 'Tab 1' })
      await windowManager.createTab(windowId, { title: 'Tab 2' })
      
      const tabs = windowManager.getWindowTabs(windowId)
      
      expect(tabs).toHaveLength(3) // Including default tab
      expect(tabs.find(t => t.title === 'Tab 1')).toBeDefined()
      expect(tabs.find(t => t.title === 'Tab 2')).toBeDefined()
    })

    it('should get active tab', async () => {
      const windowId = await windowManager.createWindow({})
      const newTab = await windowManager.createTab(windowId, { title: 'Active Tab' })
      
      windowManager.switchTab(windowId, newTab.id)
      
      const activeTab = windowManager.getActiveTab(windowId)
      
      expect(activeTab).toBeDefined()
      expect(activeTab!.id).toBe(newTab.id)
      expect(activeTab!.title).toBe('Active Tab')
    })

    it('should generate unique IDs', () => {
      const windowManager1 = new WindowManager()
      const windowManager2 = new WindowManager()
      
      const id1 = (windowManager1 as any).generateWindowId()
      const id2 = (windowManager2 as any).generateWindowId()
      
      expect(id1).not.toBe(id2)
      expect(typeof id1).toBe('string')
      expect(typeof id2).toBe('string')
      
      windowManager1.destroy()
      windowManager2.destroy()
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid window ID gracefully', () => {
      const result = windowManager.focusWindow('invalid-window-id')
      expect(result).toBe(false)
    })

    it('should handle invalid tab operations gracefully', async () => {
      const windowId = await windowManager.createWindow({})
      
      const result = await windowManager.closeTab(windowId, 'invalid-tab-id')
      expect(result).toBe(false)
    })

    it('should handle tab operations on non-existent window', async () => {
      const result = windowManager.switchTab('invalid-window-id', 'some-tab-id')
      expect(result).toBe(false)
    })
  })

  describe('Cleanup', () => {
    it('should destroy all resources properly', async () => {
      // Create some windows and tabs
      const windowId1 = await windowManager.createWindow({})
      const windowId2 = await windowManager.createWindow({})
      await windowManager.createTab(windowId1, { title: 'Tab 1' })
      
      // Verify they exist
      expect(windowManager.getWindows()).toHaveLength(2)
      
      // Destroy
      windowManager.destroy()
      
      // Verify cleanup
      expect(windowManager.getWindows()).toHaveLength(0)
      expect(windowManager.getActiveWindow()).toBeNull()
    })
  })
})