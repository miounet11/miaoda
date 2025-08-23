import { EventEmitter } from '@renderer/src/utils/performance'

export interface WindowTab {
  id: string
  title: string
  type: 'chat' | 'settings' | 'tools' | 'plugins' | 'custom'
  chatId?: string
  icon?: string
  closable: boolean
  modified: boolean
  data?: any
  createdAt: Date
  lastActiveAt: Date
}

export interface WindowState {
  id: string
  title: string
  bounds: {
    x: number
    y: number
    width: number
    height: number
  }
  isMaximized: boolean
  isMinimized: boolean
  isFullscreen: boolean
  isAlwaysOnTop: boolean
  tabs: WindowTab[]
  activeTabId: string | null
  theme: 'light' | 'dark' | 'system'
  opacity: number
}

export interface WindowLayout {
  id: string
  name: string
  description: string
  windows: Partial<WindowState>[]
  createdAt: Date
}

export class WindowManager extends EventEmitter<{
  'window-created': [WindowState]
  'window-closed': [string] // windowId
  'window-focused': [string] // windowId
  'window-bounds-changed': [string, WindowState['bounds']]
  'tab-created': [string, WindowTab] // windowId, tab
  'tab-closed': [string, string] // windowId, tabId
  'tab-switched': [string, string] // windowId, tabId
  'tab-moved': [string, string, number] // windowId, tabId, newIndex
  'layout-saved': [WindowLayout]
  'layout-restored': [WindowLayout]
}> {
  private windows = new Map<string, WindowState>()
  private layouts = new Map<string, WindowLayout>()
  private activeWindowId: string | null = null

  constructor() {
    super()
    this.initialize()
  }

  private async initialize() {
    // Load saved layouts
    await this.loadLayouts()

    // Setup event listeners for Electron window events
    if (window.api?.window) {
      this.setupElectronEventListeners()
    }

    // Create default window if none exist
    if (this.windows.size === 0) {
      await this.createWindow({
        title: 'MiaoDa Chat',
        bounds: {
          x: 100,
          y: 100,
          width: 1200,
          height: 800
        }
      })
    }
  }

  private setupElectronEventListeners() {
    if (!window.api?.window) return

    // Window events
    window.api.window.onWindowCreated?.((windowId: string, state: WindowState) => {
      this.windows.set(windowId, state)
      this.emit('window-created', state)
    })

    window.api.window.onWindowClosed?.((windowId: string) => {
      this.windows.delete(windowId)
      if (this.activeWindowId === windowId) {
        this.activeWindowId = this.windows.keys().next().value || null
      }
      this.emit('window-closed', windowId)
    })

    window.api.window.onWindowFocused?.((windowId: string) => {
      this.activeWindowId = windowId
      this.emit('window-focused', windowId)
    })

    window.api.window.onWindowStateChanged?.((windowId: string, bounds: WindowState['bounds']) => {
      const window = this.windows.get(windowId)
      if (window) {
        window.bounds = bounds
        this.emit('window-bounds-changed', windowId, bounds)
      }
    })
  }

  async createWindow(options: {
    title?: string
    bounds?: Partial<WindowState['bounds']>
    tabs?: Partial<WindowTab>[]
    parentWindowId?: string
  }): Promise<string> {
    const windowId = this.generateWindowId()

    const defaultBounds = {
      x: 100,
      y: 100,
      width: 1200,
      height: 800
    }

    const windowState: WindowState = {
      id: windowId,
      title: options.title || 'MiaoDa Chat',
      bounds: { ...defaultBounds, ...options.bounds },
      isMaximized: false,
      isMinimized: false,
      isFullscreen: false,
      isAlwaysOnTop: false,
      tabs: [],
      activeTabId: null,
      theme: 'system',
      opacity: 1.0
    }

    // Store window first before creating tabs
    this.windows.set(windowId, windowState)

    // Create default tabs if none provided
    if (!options.tabs || options.tabs.length === 0) {
      const defaultTab = await this.createTab(windowId, {
        title: 'New Chat',
        type: 'chat'
      })
      windowState.activeTabId = defaultTab.id
    } else {
      // Create provided tabs
      for (const tabOptions of options.tabs) {
        const tab = await this.createTab(windowId, tabOptions)
        if (!windowState.activeTabId) {
          windowState.activeTabId = tab.id
        }
      }
    }

    // Create Electron window if available
    if (window.api?.window?.createWindow) {
      await window.api.window.createWindow({
        title: windowState.title,
        ...windowState.bounds,
        parent: options.parentWindowId
      })
    }

    this.activeWindowId = windowId
    this.emit('window-created', windowState)

    return windowId
  }

  async closeWindow(windowId: string, force = false): Promise<boolean> {
    const window = this.windows.get(windowId)
    if (!window) return false

    // Check for unsaved changes
    if (!force) {
      const hasUnsavedChanges = window.tabs.some(tab => tab.modified)
      if (hasUnsavedChanges) {
        const shouldClose = await this.confirmCloseWindow(window)
        if (!shouldClose) return false
      }
    }

    // Close Electron window
    if (window.api?.window?.closeWindow) {
      await window.api.window.closeWindow(windowId)
    }

    // Clean up
    this.windows.delete(windowId)
    if (this.activeWindowId === windowId) {
      this.activeWindowId = this.windows.keys().next().value || null
    }

    this.emit('window-closed', windowId)

    return true
  }

  private async confirmCloseWindow(window: WindowState): Promise<boolean> {
    // Show confirmation dialog
    if (window.api?.dialog?.showMessageBox) {
      const response = await window.api.dialog.showMessageBox({
        type: 'question',
        title: 'Unsaved Changes',
        message:
          'You have unsaved changes in some tabs. Are you sure you want to close this window?',
        buttons: ['Close', 'Cancel'],
        defaultId: 1,
        cancelId: 1
      })

      return response.response === 0
    }

    // Fallback to browser confirm
    return confirm('You have unsaved changes. Are you sure you want to close this window?')
  }

  async createTab(windowId: string, options: Partial<WindowTab>): Promise<WindowTab> {
    const window = this.windows.get(windowId)
    if (!window) throw new Error(`Window ${windowId} not found`)

    const tab: WindowTab = {
      id: this.generateTabId(),
      title: options.title || 'New Tab',
      type: options.type || 'chat',
      chatId: options.chatId,
      icon: options.icon,
      closable: options.closable ?? true,
      modified: false,
      data: options.data,
      createdAt: new Date(),
      lastActiveAt: new Date()
    }

    window.tabs.push(tab)
    this.emit('tab-created', windowId, tab)

    return tab
  }

  async closeTab(windowId: string, tabId: string, force = false): Promise<boolean> {
    const window = this.windows.get(windowId)
    if (!window) return false

    const tabIndex = window.tabs.findIndex(tab => tab.id === tabId)
    if (tabIndex === -1) return false

    const tab = window.tabs[tabIndex]

    // Check if tab is closable
    if (!tab.closable && !force) return false

    // Check for unsaved changes
    if (!force && tab.modified) {
      const shouldClose = await this.confirmCloseTab(tab)
      if (!shouldClose) return false
    }

    // Remove tab
    window.tabs.splice(tabIndex, 1)

    // Update active tab if necessary
    if (window.activeTabId === tabId) {
      if (window.tabs.length > 0) {
        const newActiveIndex = Math.min(tabIndex, window.tabs.length - 1)
        window.activeTabId = window.tabs[newActiveIndex].id
      } else {
        window.activeTabId = null
      }
    }

    this.emit('tab-closed', windowId, tabId)

    // Close window if no tabs remain
    if (window.tabs.length === 0) {
      await this.closeWindow(windowId, true)
    }

    return true
  }

  private async confirmCloseTab(tab: WindowTab): Promise<boolean> {
    return confirm(`Tab "${tab.title}" has unsaved changes. Are you sure you want to close it?`)
  }

  switchTab(windowId: string, tabId: string): boolean {
    const window = this.windows.get(windowId)
    if (!window) return false

    const tab = window.tabs.find(t => t.id === tabId)
    if (!tab) return false

    window.activeTabId = tabId
    tab.lastActiveAt = new Date()

    this.emit('tab-switched', windowId, tabId)

    return true
  }

  moveTab(windowId: string, tabId: string, newIndex: number): boolean {
    const window = this.windows.get(windowId)
    if (!window) return false

    const currentIndex = window.tabs.findIndex(tab => tab.id === tabId)
    if (currentIndex === -1) return false

    // Validate new index
    const maxIndex = window.tabs.length - 1
    newIndex = Math.max(0, Math.min(newIndex, maxIndex))

    if (currentIndex === newIndex) return true

    // Move tab
    const [tab] = window.tabs.splice(currentIndex, 1)
    window.tabs.splice(newIndex, 0, tab)

    this.emit('tab-moved', windowId, tabId, newIndex)

    return true
  }

  moveTabToWindow(
    sourceWindowId: string,
    tabId: string,
    targetWindowId: string,
    index?: number
  ): boolean {
    const sourceWindow = this.windows.get(sourceWindowId)
    const targetWindow = this.windows.get(targetWindowId)

    if (!sourceWindow || !targetWindow) return false

    const tabIndex = sourceWindow.tabs.findIndex(tab => tab.id === tabId)
    if (tabIndex === -1) return false

    const [tab] = sourceWindow.tabs.splice(tabIndex, 1)

    // Add to target window
    const insertIndex = index ?? targetWindow.tabs.length
    targetWindow.tabs.splice(insertIndex, 0, tab)

    // Update active tab in source window
    if (sourceWindow.activeTabId === tabId) {
      if (sourceWindow.tabs.length > 0) {
        const newActiveIndex = Math.min(tabIndex, sourceWindow.tabs.length - 1)
        sourceWindow.activeTabId = sourceWindow.tabs[newActiveIndex].id
      } else {
        sourceWindow.activeTabId = null
      }
    }

    // Emit events
    this.emit('tab-closed', sourceWindowId, tabId)
    this.emit('tab-created', targetWindowId, tab)

    return true
  }

  updateTabTitle(windowId: string, tabId: string, title: string): boolean {
    const window = this.windows.get(windowId)
    if (!window) return false

    const tab = window.tabs.find(t => t.id === tabId)
    if (!tab) return false

    tab.title = title
    tab.lastActiveAt = new Date()

    return true
  }

  markTabModified(windowId: string, tabId: string, modified = true): boolean {
    const window = this.windows.get(windowId)
    if (!window) return false

    const tab = window.tabs.find(t => t.id === tabId)
    if (!tab) return false

    tab.modified = modified

    return true
  }

  // Window management
  focusWindow(windowId: string): boolean {
    const window = this.windows.get(windowId)
    if (!window) return false

    this.activeWindowId = windowId

    if (window.api?.window?.focusWindow) {
      window.api.window.focusWindow(windowId)
    }

    this.emit('window-focused', windowId)

    return true
  }

  async minimizeWindow(windowId: string): Promise<boolean> {
    const window = this.windows.get(windowId)
    if (!window) return false

    window.isMinimized = true

    if (window.api?.window?.minimizeWindow) {
      await window.api.window.minimizeWindow(windowId)
    }

    return true
  }

  async maximizeWindow(windowId: string): Promise<boolean> {
    const window = this.windows.get(windowId)
    if (!window) return false

    window.isMaximized = !window.isMaximized

    if (window.api?.window?.maximizeWindow) {
      await window.api.window.maximizeWindow(windowId)
    }

    return true
  }

  async setWindowBounds(
    windowId: string,
    bounds: Partial<WindowState['bounds']>
  ): Promise<boolean> {
    const window = this.windows.get(windowId)
    if (!window) return false

    window.bounds = { ...window.bounds, ...bounds }

    if (window.api?.window?.setWindowBounds) {
      await window.api.window.setWindowBounds(windowId, window.bounds)
    }

    this.emit('window-bounds-changed', windowId, window.bounds)

    return true
  }

  // Layout management
  async saveLayout(name: string, description = ''): Promise<string> {
    const layoutId = this.generateLayoutId()

    const layout: WindowLayout = {
      id: layoutId,
      name,
      description,
      windows: Array.from(this.windows.values()).map(window => ({
        title: window.title,
        bounds: { ...window.bounds },
        tabs: window.tabs.map(tab => ({
          title: tab.title,
          type: tab.type,
          chatId: tab.chatId,
          data: tab.data
        }))
      })),
      createdAt: new Date()
    }

    this.layouts.set(layoutId, layout)
    await this.saveLayoutsToDisk()

    this.emit('layout-saved', layout)

    return layoutId
  }

  async restoreLayout(layoutId: string): Promise<boolean> {
    const layout = this.layouts.get(layoutId)
    if (!layout) return false

    // Close existing windows
    const windowIds = Array.from(this.windows.keys())
    for (const windowId of windowIds) {
      await this.closeWindow(windowId, true)
    }

    // Create windows from layout
    for (const windowConfig of layout.windows) {
      await this.createWindow({
        title: windowConfig.title,
        bounds: windowConfig.bounds,
        tabs: windowConfig.tabs
      })
    }

    this.emit('layout-restored', layout)

    return true
  }

  private async loadLayouts(): Promise<void> {
    try {
      const saved = localStorage.getItem('miaoda-window-layouts')
      if (saved) {
        const layouts = JSON.parse(saved)
        for (const [id, layout] of Object.entries(layouts)) {
          this.layouts.set(id, layout as WindowLayout)
        }
      }
    } catch (error) {
      console.warn('Failed to load window layouts:', error)
    }
  }

  private async saveLayoutsToDisk(): Promise<void> {
    try {
      const layoutsObject = Object.fromEntries(this.layouts)
      localStorage.setItem('miaoda-window-layouts', JSON.stringify(layoutsObject))
    } catch (error) {
      console.warn('Failed to save window layouts:', error)
    }
  }

  // Getters
  getWindows(): WindowState[] {
    return Array.from(this.windows.values())
  }

  getWindow(windowId: string): WindowState | null {
    return this.windows.get(windowId) || null
  }

  getActiveWindow(): WindowState | null {
    return this.activeWindowId ? this.windows.get(this.activeWindowId) || null : null
  }

  getWindowTabs(windowId: string): WindowTab[] {
    const window = this.windows.get(windowId)
    return window ? window.tabs : []
  }

  getActiveTab(windowId: string): WindowTab | null {
    const window = this.windows.get(windowId)
    if (!window || !window.activeTabId) return null

    return window.tabs.find(tab => tab.id === window.activeTabId) || null
  }

  getLayouts(): WindowLayout[] {
    return Array.from(this.layouts.values())
  }

  // Utilities
  private generateWindowId(): string {
    return `window_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateLayoutId(): string {
    return `layout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Cleanup
  destroy(): void {
    // Close all windows
    const windowIds = Array.from(this.windows.keys())
    windowIds.forEach(windowId => {
      this.closeWindow(windowId, true)
    })

    this.windows.clear()
    this.layouts.clear()
    this.clear()
  }
}

// Global window manager instance
export const windowManager = new WindowManager()

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    windowManager.destroy()
  })
}
