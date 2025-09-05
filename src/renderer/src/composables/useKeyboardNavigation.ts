import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

/**
 * Enhanced Keyboard Navigation Hook
 * Provides comprehensive keyboard navigation for MiaoDa Chat
 */

export interface KeyboardNavigationOptions {
  enableGlobalShortcuts?: boolean
  enableModalNavigation?: boolean
  enableChatNavigation?: boolean
  enableFocusTrap?: boolean
  autoFocus?: boolean
}

export interface FocusableElement extends HTMLElement {
  tabIndex: number
  disabled?: boolean
  'aria-hidden'?: string
}

export const useKeyboardNavigation = (options: KeyboardNavigationOptions = {}) => {
  const {
    enableGlobalShortcuts = true,
    enableModalNavigation = true,
    enableChatNavigation = true,
    enableFocusTrap = true,
    autoFocus = true
  } = options

  // State
  const isNavigationActive = ref(true)
  const currentFocusIndex = ref(0)
  const focusableElements = ref<FocusableElement[]>([])
  const modalStack = ref<HTMLElement[]>([])
  const lastFocusedElement = ref<HTMLElement | null>(null)

  // Selectors for focusable elements
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
    '.focusable',
    '[role="button"]',
    '[role="link"]',
    '[role="menuitem"]',
    '[role="option"]'
  ].join(', ')

  // Global keyboard shortcuts
  const globalShortcuts = {
    // Chat navigation
    'ctrl+n': () => emit('new-chat'),
    'ctrl+/': () => emit('toggle-search'),
    'ctrl+k': () => emit('command-palette'),
    'ctrl+,': () => emit('open-settings'),

    // Message actions
    'ctrl+enter': () => emit('send-message'),
    'ctrl+shift+r': () => emit('regenerate-response'),
    'ctrl+d': () => emit('duplicate-message'),

    // Navigation
    'ctrl+tab': () => navigateChat('next'),
    'ctrl+shift+tab': () => navigateChat('previous'),
    'ctrl+1': () => selectChat(0),
    'ctrl+2': () => selectChat(1),
    'ctrl+3': () => selectChat(2),
    'ctrl+4': () => selectChat(3),
    'ctrl+5': () => selectChat(4),

    // UI controls
    'ctrl+b': () => emit('toggle-sidebar'),
    'ctrl+shift+d': () => emit('toggle-dark-mode'),
    f11: () => emit('toggle-fullscreen'),
    escape: () => handleEscape(),

    // Accessibility
    'alt+1': () => focusMainContent(),
    'alt+2': () => focusSidebar(),
    'alt+3': () => focusChatInput(),

    // Voice and media
    'ctrl+shift+v': () => emit('toggle-voice-recording'),
    'ctrl+shift+i': () => emit('upload-image'),
    'ctrl+shift+f': () => emit('upload-file')
  }

  // Focus management
  const updateFocusableElements = (container?: HTMLElement) => {
    const root = container || document.body
    const elements = Array.from(root.querySelectorAll(focusableSelectors)) as FocusableElement[]

    focusableElements.value = elements.filter(el => {
      const style = window.getComputedStyle(el)
      return (
        !el.disabled &&
        el.getAttribute('aria-hidden') !== 'true' &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        el.offsetParent !== null
      )
    })
  }

  const getCurrentFocusIndex = () => {
    const activeElement = document.activeElement as FocusableElement
    return focusableElements.value.indexOf(activeElement)
  }

  const focusElement = (index: number) => {
    if (!focusableElements.value[index]) return

    focusableElements.value[index].focus()
    currentFocusIndex.value = index
  }

  const focusNext = () => {
    updateFocusableElements()
    const currentIndex = getCurrentFocusIndex()
    const nextIndex = (currentIndex + 1) % focusableElements.value.length
    focusElement(nextIndex)
  }

  const focusPrevious = () => {
    updateFocusableElements()
    const currentIndex = getCurrentFocusIndex()
    const prevIndex = currentIndex <= 0 ? focusableElements.value.length - 1 : currentIndex - 1
    focusElement(prevIndex)
  }

  // Modal focus management
  const pushModal = (modalElement: HTMLElement) => {
    lastFocusedElement.value = document.activeElement as HTMLElement
    modalStack.value.push(modalElement)

    if (enableFocusTrap) {
      nextTick(() => {
        updateFocusableElements(modalElement)
        if (autoFocus && focusableElements.value.length > 0) {
          focusElement(0)
        }
      })
    }
  }

  const popModal = () => {
    modalStack.value.pop()

    if (modalStack.value.length > 0) {
      // Focus the previous modal
      const previousModal = modalStack.value[modalStack.value.length - 1]
      updateFocusableElements(previousModal)
    } else {
      // Restore focus to the previously focused element
      if (lastFocusedElement.value && lastFocusedElement.value.isConnected) {
        lastFocusedElement.value.focus()
      }
      updateFocusableElements()
    }
  }

  const trapFocus = (event: KeyboardEvent) => {
    if (!enableFocusTrap || modalStack.value.length === 0) return

    if (event.key === 'Tab') {
      const currentModal = modalStack.value[modalStack.value.length - 1]
      updateFocusableElements(currentModal)

      if (focusableElements.value.length === 0) return

      const currentIndex = getCurrentFocusIndex()

      if (event.shiftKey) {
        // Shift + Tab (previous)
        event.preventDefault()
        const prevIndex = currentIndex <= 0 ? focusableElements.value.length - 1 : currentIndex - 1
        focusElement(prevIndex)
      } else {
        // Tab (next)
        event.preventDefault()
        const nextIndex = (currentIndex + 1) % focusableElements.value.length
        focusElement(nextIndex)
      }
    }
  }

  // Specific navigation functions
  const focusMainContent = () => {
    const mainContent = document.querySelector('[role="main"], .chat-messages, #main-content')
    if (mainContent) {
      ;(mainContent as HTMLElement).focus()
    }
  }

  const focusSidebar = () => {
    const sidebar = document.querySelector('.sidebar, [role="navigation"], .chat-list')
    if (sidebar) {
      ;(sidebar as HTMLElement).focus()
    }
  }

  const focusChatInput = () => {
    const chatInput = document.querySelector(
      '.chat-input, [data-testid="chat-input"], textarea[placeholder*="消息"]'
    )
    if (chatInput) {
      ;(chatInput as HTMLElement).focus()
    }
  }

  const navigateChat = (direction: 'next' | 'previous') => {
    emit('navigate-chat', direction)
  }

  const selectChat = (index: number) => {
    emit('select-chat', index)
  }

  const handleEscape = () => {
    if (modalStack.value.length > 0) {
      emit('close-modal')
      popModal()
    } else {
      emit('escape')
    }
  }

  // Arrow key navigation for lists and grids
  const handleArrowNavigation = (event: KeyboardEvent, container?: HTMLElement) => {
    const { key } = event
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) return

    const root =
      container ||
      document.activeElement?.closest(
        '[role="listbox"], [role="grid"], [role="menu"], .navigation-container'
      )
    if (!root) return

    const items = Array.from(
      root.querySelectorAll('[role="option"], [role="gridcell"], [role="menuitem"], .nav-item')
    )
    const currentIndex = items.indexOf(document.activeElement as Element)

    if (currentIndex === -1) return

    let nextIndex = currentIndex
    const cols = parseInt(root.getAttribute('data-cols') || '1')

    switch (key) {
      case 'ArrowUp':
        nextIndex = Math.max(0, currentIndex - cols)
        break
      case 'ArrowDown':
        nextIndex = Math.min(items.length - 1, currentIndex + cols)
        break
      case 'ArrowLeft':
        nextIndex = Math.max(0, currentIndex - 1)
        break
      case 'ArrowRight':
        nextIndex = Math.min(items.length - 1, currentIndex + 1)
        break
    }

    if (nextIndex !== currentIndex) {
      event.preventDefault()
      ;(items[nextIndex] as HTMLElement).focus()
    }
  }

  // Event handlers
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isNavigationActive.value) return

    const { key, ctrlKey, shiftKey, altKey } = event

    // Handle global shortcuts
    if (enableGlobalShortcuts) {
      const shortcutKey = [
        ctrlKey && 'ctrl',
        shiftKey && 'shift',
        altKey && 'alt',
        key.toLowerCase()
      ]
        .filter(Boolean)
        .join('+')

      const shortcutHandler = globalShortcuts[shortcutKey as keyof typeof globalShortcuts]
      if (shortcutHandler) {
        event.preventDefault()
        shortcutHandler()
        return
      }
    }

    // Handle focus trap for modals
    if (enableModalNavigation) {
      trapFocus(event)
    }

    // Handle arrow navigation
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      handleArrowNavigation(event)
    }

    // Handle chat-specific navigation
    if (enableChatNavigation) {
      if (key === 'Tab' && !ctrlKey && modalStack.value.length === 0) {
        // Allow normal tab navigation when not in modal
        return
      }
    }
  }

  // Accessibility announcements
  const announceNavigation = (message: string) => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message

    document.body.appendChild(announcement)

    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  // Focus indicators
  const addFocusIndicators = () => {
    const style = document.createElement('style')
    style.textContent = `
      .focus-visible {
        outline: 2px solid var(--primary, #3b82f6);
        outline-offset: 2px;
        border-radius: 4px;
      }
      
      .focus-visible:not(.focus-visible-added) {
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
      }
      
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    `
    document.head.appendChild(style)
  }

  // Event emission
  const emit = (eventName: string, ...args: any[]) => {
    const event = new CustomEvent(`keyboard-navigation:${eventName}`, {
      detail: args,
      bubbles: true
    })
    document.dispatchEvent(event)
  }

  // Lifecycle
  onMounted(() => {
    if (enableGlobalShortcuts || enableModalNavigation || enableChatNavigation) {
      document.addEventListener('keydown', handleKeyDown)
      addFocusIndicators()
      updateFocusableElements()
    }
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })

  // Public API
  return {
    // State
    isNavigationActive,
    currentFocusIndex,
    focusableElements: computed(() => focusableElements.value),

    // Focus management
    updateFocusableElements,
    focusElement,
    focusNext,
    focusPrevious,

    // Modal management
    pushModal,
    popModal,

    // Specific navigation
    focusMainContent,
    focusSidebar,
    focusChatInput,
    navigateChat,
    selectChat,

    // Arrow navigation
    handleArrowNavigation,

    // Utilities
    announceNavigation,

    // Control
    enable: () => {
      isNavigationActive.value = true
    },
    disable: () => {
      isNavigationActive.value = false
    }
  }
}
