import { onMounted, onUnmounted } from 'vue'
import { useChatStore } from '@renderer/src/stores/chat'
import { useUIStore } from '@renderer/src/stores/ui'

interface ShortcutDefinition {
  key: string
  modifiers?: {
    meta?: boolean
    ctrl?: boolean
    alt?: boolean
    shift?: boolean
  }
  action: () => void
}

export function useGlobalShortcuts() {
  // const router = useRouter()
  const chatsStore = useChatStore()
  const uiStore = useUIStore()

  const shortcuts: ShortcutDefinition[] = [
    // New Chat: Cmd/Ctrl + N
    {
      key: 'n',
      modifiers: { meta: true, ctrl: true },
      action: async () => {
        await chatsStore.createChat()
      }
    },
    // Quick Search: Cmd/Ctrl + K
    {
      key: 'k',
      modifiers: { meta: true, ctrl: true },
      action: () => {
        uiStore.toggleQuickSearch()
      }
    },
    // Show Shortcuts Help: Cmd/Ctrl + /
    {
      key: '/',
      modifiers: { meta: true, ctrl: true },
      action: () => {
        uiStore.toggleShortcutHelp()
      }
    },
    // Send Message: Cmd/Ctrl + Enter
    {
      key: 'Enter',
      modifiers: { meta: true, ctrl: true },
      action: () => {
        // Send the current draft message by triggering a custom event
        document.dispatchEvent(new CustomEvent('shortcuts:send-message'))
      }
    },
    // Close Modal/Cancel: Escape
    {
      key: 'Escape',
      action: () => {
        // Close any open modals or cancel current operation
        uiStore.closeActiveModal()
      }
    }
  ]

  // Add Chat Tab Switching: Cmd/Ctrl + 1-9
  for (let i = 1; i <= 9; i++) {
    shortcuts.push({
      key: `${i}`,
      modifiers: { meta: true, ctrl: true },
      action: () => {
        // Switch to chat at index (dispatching event for implementation)
        document.dispatchEvent(
          new CustomEvent('shortcuts:switch-chat', {
            detail: { index: i - 1 }
          })
        )
      }
    })
  }

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0

  const handleKeydown = (event: KeyboardEvent) => {
    // Don't handle shortcuts when typing in inputs, textareas, or contenteditable elements
    const target = event.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable ||
      target.closest('[contenteditable="true"]')
    ) {
      // Allow Escape key to work in inputs
      if (event.key === 'Escape') {
        uiStore.closeActiveModal()
      }
      return
    }

    const matchedShortcut = shortcuts.find(shortcut => {
      const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase()

      // Check modifiers - if shortcut has both meta and ctrl, use the right one for platform
      if (shortcut.modifiers?.meta && shortcut.modifiers?.ctrl) {
        const platformModifier = isMac ? event.metaKey : event.ctrlKey
        const altMatch = shortcut.modifiers?.alt ? event.altKey : !event.altKey
        const shiftMatch = shortcut.modifiers?.shift ? event.shiftKey : !event.shiftKey

        return keyMatch && platformModifier && altMatch && shiftMatch
      }

      // Handle individual modifier checks
      const metaMatch = shortcut.modifiers?.meta ? event.metaKey : !event.metaKey
      const ctrlMatch = shortcut.modifiers?.ctrl ? event.ctrlKey : !event.ctrlKey
      const altMatch = shortcut.modifiers?.alt ? event.altKey : !event.altKey
      const shiftMatch = shortcut.modifiers?.shift ? event.shiftKey : !event.shiftKey

      return keyMatch && metaMatch && ctrlMatch && altMatch && shiftMatch
    })

    if (matchedShortcut) {
      event.preventDefault()
      matchedShortcut.action()
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })

  return {
    shortcuts
  }
}
