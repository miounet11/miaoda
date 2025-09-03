import { ref } from 'vue'
import type { App } from 'vue'

export interface ShortcutAction {
  key: string
  handler: () => void
  description: string
  context?: string
  enabled?: () => boolean
}

export interface ShortcutGroup {
  name: string
  shortcuts: ShortcutAction[]
}

class ShortcutService {
  private shortcuts = ref<Map<string, ShortcutAction>>(new Map())
  private isEnabled = ref(true)
  private isHelpOpen = ref(false)

  private normalizeKey(event: KeyboardEvent): string {
    const parts: string[] = []

    // Use cmd on mac, ctrl on other platforms
    const isMac = navigator.platform.toLowerCase().includes('mac')
    const modifier = isMac ? event.metaKey : event.ctrlKey

    if (modifier) parts.push('mod')
    if (event.shiftKey) parts.push('shift')
    if (event.altKey) parts.push('alt')

    // Normalize key names
    let key = event.key.toLowerCase()
    if (key === ' ') key = 'space'
    if (key === 'enter') key = 'enter'
    if (key === 'escape') key = 'escape'

    parts.push(key)

    return parts.join('+')
  }

  register(key: string, action: ShortcutAction): void {
    this.shortcuts.value.set(key, action)
  }

  unregister(key: string): void {
    this.shortcuts.value.delete(key)
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.isEnabled.value) return

    // Don't handle shortcuts when typing in inputs, textareas, or contenteditable elements
    const target = event.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable ||
      target.closest('[contenteditable="true"]')
    ) {
      // Allow some global shortcuts even in inputs
      const normalizedKey = this.normalizeKey(event)
      const action = this.shortcuts.value.get(normalizedKey)
      if (action && ['mod+/', 'escape'].includes(normalizedKey)) {
        event.preventDefault()
        action.handler()
      }
      return
    }

    const normalizedKey = this.normalizeKey(event)
    const action = this.shortcuts.value.get(normalizedKey)

    if (action && (!action.enabled || action.enabled())) {
      event.preventDefault()
      action.handler()
    }
  }

  enable(): void {
    this.isEnabled.value = true
  }

  disable(): void {
    this.isEnabled.value = false
  }

  openHelp(): void {
    this.isHelpOpen.value = true
  }

  closeHelp(): void {
    this.isHelpOpen.value = false
  }

  toggleHelp(): void {
    this.isHelpOpen.value = !this.isHelpOpen.value
  }

  getShortcuts(): ShortcutGroup[] {
    const shortcutsArray = Array.from(this.shortcuts.value.entries())
    const groups = new Map<string, ShortcutAction[]>()

    shortcutsArray.forEach(([key, action]) => {
      const context = action.context || 'Global'
      if (!groups.has(context)) {
        groups.set(context, [])
      }
      groups.get(context)!.push({ ...action, key })
    })

    return Array.from(groups.entries()).map(([name, shortcuts]) => ({
      name,
      shortcuts: shortcuts.sort((a, b) => a.description.localeCompare(b.description)),
    }))
  }

  getDisplayKey(key: string): string {
    const isMac = navigator.platform.toLowerCase().includes('mac')
    return key
      .replace('mod', isMac ? '⌘' : 'Ctrl')
      .replace('shift', isMac ? '⇧' : 'Shift')
      .replace('alt', isMac ? '⌥' : 'Alt')
      .replace('enter', '↵')
      .replace('escape', 'Esc')
      .replace('space', '␣')
      .split('+')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(isMac ? ' ' : ' + ')
  }

  initialize(): () => void {
    document.addEventListener('keydown', this.handleKeyDown)

    return () => {
      document.removeEventListener('keydown', this.handleKeyDown)
    }
  }

  get helpOpen() {
    return this.isHelpOpen
  }

  get enabled() {
    return this.isEnabled
  }
}

// Create singleton instance
export const shortcutService = new ShortcutService()

// Vue plugin
export default {
  install(app: App) {
    app.config.globalProperties.$shortcuts = shortcutService
    app.provide('shortcuts', shortcutService)
  },
}

// Composable
export function useShortcuts() {
  return shortcutService
}
