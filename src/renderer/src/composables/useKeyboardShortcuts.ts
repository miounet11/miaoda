import { onMounted, onUnmounted, ref } from 'vue'
import type { KeyboardShortcuts } from '@renderer/src/types'

interface ShortcutHandler {
  key: string
  handler: (event: KeyboardEvent) => void
  description: string
  disabled?: () => boolean
}

export function useKeyboardShortcuts() {
  const shortcuts = ref<Map<string, ShortcutHandler>>(new Map())
  const isEnabled = ref(true)
  
  // Default shortcuts configuration
  const defaultShortcuts: KeyboardShortcuts = {
    newChat: 'cmd+n',
    openSettings: 'cmd+,',
    toggleSidebar: 'cmd+/',
    focusInput: 'cmd+k',
    sendMessage: 'cmd+enter',
    searchChats: 'cmd+f',
    nextChat: 'cmd+down',
    prevChat: 'cmd+up',
    clearChat: 'cmd+shift+c',
    exportChat: 'cmd+e'
  }
  
  // Parse shortcut string to key combination
  const parseShortcut = (shortcut: string) => {
    const parts = shortcut.toLowerCase().split('+')
    const modifiers = {
      ctrl: false,
      alt: false,
      shift: false,
      meta: false
    }
    
    let key = ''
    
    parts.forEach(part => {
      switch (part) {
        case 'ctrl':
        case 'cmd':
          modifiers.ctrl = true
          modifiers.meta = true // Support both Ctrl and Cmd
          break
        case 'alt':
          modifiers.alt = true
          break
        case 'shift':
          modifiers.shift = true
          break
        default:
          key = part
      }
    })
    
    return { modifiers, key }
  }
  
  // Check if event matches shortcut
  const matchesShortcut = (event: KeyboardEvent, shortcut: string) => {
    const { modifiers, key } = parseShortcut(shortcut)
    const eventKey = event.key.toLowerCase()
    
    // Special key mappings
    const keyMap: Record<string, string> = {
      'enter': 'enter',
      'space': ' ',
      'up': 'arrowup',
      'down': 'arrowdown',
      'left': 'arrowleft',
      'right': 'arrowright',
      'esc': 'escape',
      'escape': 'escape'
    }
    
    const normalizedKey = keyMap[key] || key
    const normalizedEventKey = keyMap[eventKey] || eventKey
    
    return (
      normalizedKey === normalizedEventKey &&
      modifiers.ctrl === (event.ctrlKey || event.metaKey) &&
      modifiers.alt === event.altKey &&
      modifiers.shift === event.shiftKey
    )
  }
  
  // Register a shortcut
  const register = (
    key: string,
    handler: (event: KeyboardEvent) => void,
    description: string,
    disabled?: () => boolean
  ) => {
    shortcuts.value.set(key, {
      key,
      handler,
      description,
      disabled
    })
  }
  
  // Unregister a shortcut
  const unregister = (key: string) => {
    shortcuts.value.delete(key)
  }
  
  // Handle keyboard events
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isEnabled.value) return
    
    // Don't handle shortcuts when typing in input fields
    const target = event.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true'
    ) {
      // Allow some shortcuts even in input fields
      const allowedInInputs = ['cmd+a', 'cmd+c', 'cmd+v', 'cmd+x', 'cmd+z', 'cmd+y']
      const currentShortcut = Array.from(shortcuts.value.values()).find(shortcut =>
        matchesShortcut(event, shortcut.key)
      )
      
      if (!currentShortcut || !allowedInInputs.includes(currentShortcut.key)) {
        return
      }
    }
    
    // Find matching shortcut
    for (const shortcut of shortcuts.value.values()) {
      if (
        matchesShortcut(event, shortcut.key) &&
        (!shortcut.disabled || !shortcut.disabled())
      ) {
        event.preventDefault()
        event.stopPropagation()
        shortcut.handler(event)
        break
      }
    }
  }
  
  // Enable/disable shortcuts
  const enable = () => {
    isEnabled.value = true
  }
  
  const disable = () => {
    isEnabled.value = false
  }
  
  // Get all registered shortcuts
  const getShortcuts = () => {
    return Array.from(shortcuts.value.values()).map(shortcut => ({
      key: shortcut.key,
      description: shortcut.description,
      disabled: shortcut.disabled?.() || false
    }))
  }
  
  // Format shortcut for display
  const formatShortcut = (shortcut: string) => {
    return shortcut
      .replace('cmd+', '⌘')
      .replace('ctrl+', 'Ctrl+')
      .replace('alt+', 'Alt+')
      .replace('shift+', 'Shift+')
      .replace('enter', '↵')
      .replace('escape', 'Esc')
      .replace('space', 'Space')
      .replace('up', '↑')
      .replace('down', '↓')
      .replace('left', '←')
      .replace('right', '→')
  }
  
  // Register default shortcuts
  const registerDefaults = (handlers: Partial<Record<keyof KeyboardShortcuts, (event: KeyboardEvent) => void>>) => {
    Object.entries(handlers).forEach(([action, handler]) => {
      const key = action as keyof KeyboardShortcuts
      const shortcut = defaultShortcuts[key]
      if (shortcut && handler) {
        register(shortcut, handler, getActionDescription(key))
      }
    })
  }
  
  // Get description for default actions
  const getActionDescription = (action: keyof KeyboardShortcuts): string => {
    const descriptions: Record<keyof KeyboardShortcuts, string> = {
      newChat: 'Create new chat',
      openSettings: 'Open settings',
      toggleSidebar: 'Toggle sidebar',
      focusInput: 'Focus message input',
      sendMessage: 'Send message',
      searchChats: 'Search chats',
      nextChat: 'Next chat',
      prevChat: 'Previous chat',
      clearChat: 'Clear current chat',
      exportChat: 'Export current chat'
    }
    
    return descriptions[action]
  }
  
  // Setup event listeners
  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown, true)
  })
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown, true)
    shortcuts.value.clear()
  })
  
  return {
    // State
    isEnabled,
    
    // Methods
    register,
    unregister,
    enable,
    disable,
    getShortcuts,
    formatShortcut,
    registerDefaults,
    
    // Default shortcuts
    defaultShortcuts
  }
}

// Global shortcut manager instance
let globalShortcutManager: ReturnType<typeof useKeyboardShortcuts> | null = null

export function useGlobalShortcuts() {
  if (!globalShortcutManager) {
    globalShortcutManager = useKeyboardShortcuts()
  }
  return globalShortcutManager
}