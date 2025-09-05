/**
 * Accessibility Utilities for MiaoDa Chat
 * Provides comprehensive WCAG 2.1 AA compliance features
 */

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite',
  atomic = true
): void {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', atomic.toString())
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  // Clean up after announcement
  setTimeout(() => {
    try {
      document.body.removeChild(announcement)
    } catch (e) {
      // Element may have already been removed
    }
  }, 1000)
}

/**
 * Focus trap utility for modals and dialogs
 */
export class FocusTrap {
  private container: HTMLElement
  private focusableElements: HTMLElement[]
  private firstFocusable: HTMLElement | null = null
  private lastFocusable: HTMLElement | null = null
  private previouslyFocused: HTMLElement | null = null

  constructor(container: HTMLElement) {
    this.container = container
    this.focusableElements = []
    this.updateFocusableElements()
  }

  private updateFocusableElements(): void {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')

    this.focusableElements = Array.from(
      this.container.querySelectorAll(focusableSelectors)
    ) as HTMLElement[]

    this.firstFocusable = this.focusableElements[0] || null
    this.lastFocusable = this.focusableElements[this.focusableElements.length - 1] || null
  }

  public activate(): void {
    this.previouslyFocused = document.activeElement as HTMLElement
    this.container.addEventListener('keydown', this.handleKeydown)

    // Focus first element
    if (this.firstFocusable) {
      this.firstFocusable.focus()
    }
  }

  public deactivate(): void {
    this.container.removeEventListener('keydown', this.handleKeydown)

    // Restore previous focus
    if (this.previouslyFocused) {
      this.previouslyFocused.focus()
    }
  }

  private handleKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab') return

    // Update focusable elements in case DOM changed
    this.updateFocusableElements()

    if (this.focusableElements.length === 0) {
      event.preventDefault()
      return
    }

    if (this.focusableElements.length === 1) {
      event.preventDefault()
      this.firstFocusable?.focus()
      return
    }

    if (event.shiftKey) {
      // Shift + Tab (backwards)
      if (document.activeElement === this.firstFocusable) {
        event.preventDefault()
        this.lastFocusable?.focus()
      }
    } else {
      // Tab (forwards)
      if (document.activeElement === this.lastFocusable) {
        event.preventDefault()
        this.firstFocusable?.focus()
      }
    }
  }
}

/**
 * Create skip links for keyboard navigation
 */
export function createSkipLinks(targets: { id: string; label: string }[]): HTMLElement {
  const nav = document.createElement('nav')
  nav.className = 'skip-links sr-only focus:not-sr-only'
  nav.setAttribute('aria-label', 'Skip navigation links')

  targets.forEach(({ id, label }) => {
    const link = document.createElement('a')
    link.href = `#${id}`
    link.textContent = label
    link.className = 'skip-link'

    link.addEventListener('click', e => {
      e.preventDefault()
      const target = document.getElementById(id)
      if (target) {
        target.focus()
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        announceToScreenReader(`Skipped to ${label}`)
      }
    })

    nav.appendChild(link)
  })

  return nav
}

/**
 * Enhanced keyboard navigation handler
 */
export function createKeyboardNavigation(options: {
  container: HTMLElement
  items: HTMLElement[]
  onSelect?: (index: number, item: HTMLElement) => void
  onEscape?: () => void
  circular?: boolean
  skipDisabled?: boolean
}) {
  let currentIndex = -1

  const navigate = (direction: 'next' | 'prev' | 'first' | 'last') => {
    const { items, circular = true, skipDisabled = true } = options

    if (items.length === 0) return

    let newIndex = currentIndex

    switch (direction) {
      case 'next':
        newIndex = currentIndex + 1
        if (newIndex >= items.length) {
          newIndex = circular ? 0 : items.length - 1
        }
        break
      case 'prev':
        newIndex = currentIndex - 1
        if (newIndex < 0) {
          newIndex = circular ? items.length - 1 : 0
        }
        break
      case 'first':
        newIndex = 0
        break
      case 'last':
        newIndex = items.length - 1
        break
    }

    // Skip disabled items if requested
    if (skipDisabled) {
      let attempts = 0
      while (attempts < items.length && items[newIndex]?.hasAttribute('disabled')) {
        newIndex =
          direction === 'next' || direction === 'first'
            ? (newIndex + 1) % items.length
            : newIndex - 1 < 0
              ? items.length - 1
              : newIndex - 1
        attempts++
      }
    }

    if (newIndex !== currentIndex && items[newIndex]) {
      currentIndex = newIndex
      items[newIndex].focus()
      announceToScreenReader(`Item ${newIndex + 1} of ${items.length}`)
    }
  }

  const handleKeydown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault()
        navigate('next')
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault()
        navigate('prev')
        break
      case 'Home':
        event.preventDefault()
        navigate('first')
        break
      case 'End':
        event.preventDefault()
        navigate('last')
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (currentIndex >= 0 && options.onSelect) {
          options.onSelect(currentIndex, options.items[currentIndex])
        }
        break
      case 'Escape':
        event.preventDefault()
        if (options.onEscape) {
          options.onEscape()
        }
        break
    }
  }

  const activate = () => {
    options.container.addEventListener('keydown', handleKeydown)
  }

  const deactivate = () => {
    options.container.removeEventListener('keydown', handleKeydown)
  }

  const setActiveIndex = (index: number) => {
    currentIndex = index
  }

  return {
    activate,
    deactivate,
    navigate,
    setActiveIndex,
    getCurrentIndex: () => currentIndex
  }
}

/**
 * Touch gesture detection for mobile
 */
export class TouchGestureDetector {
  private element: HTMLElement
  private onSwipe?: (direction: 'left' | 'right' | 'up' | 'down', event: TouchEvent) => void
  private onTap?: (event: TouchEvent) => void
  private onLongPress?: (event: TouchEvent) => void

  private touchState = {
    startX: 0,
    startY: 0,
    startTime: 0,
    isTracking: false
  }

  private readonly swipeThreshold = 50
  private readonly longPressDelay = 500
  private longPressTimer: NodeJS.Timeout | null = null

  constructor(
    element: HTMLElement,
    handlers: {
      onSwipe?: (direction: 'left' | 'right' | 'up' | 'down', event: TouchEvent) => void
      onTap?: (event: TouchEvent) => void
      onLongPress?: (event: TouchEvent) => void
    }
  ) {
    this.element = element
    this.onSwipe = handlers.onSwipe
    this.onTap = handlers.onTap
    this.onLongPress = handlers.onLongPress

    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    this.element.addEventListener('touchstart', this.handleTouchStart, { passive: false })
    this.element.addEventListener('touchmove', this.handleTouchMove, { passive: false })
    this.element.addEventListener('touchend', this.handleTouchEnd, { passive: false })
    this.element.addEventListener('touchcancel', this.handleTouchCancel)
  }

  private handleTouchStart = (event: TouchEvent): void => {
    if (event.touches.length !== 1) return

    const touch = event.touches[0]
    this.touchState = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      isTracking: true
    }

    // Start long press timer
    if (this.onLongPress) {
      this.longPressTimer = setTimeout(() => {
        if (this.touchState.isTracking) {
          this.onLongPress?.(event)
          this.touchState.isTracking = false
        }
      }, this.longPressDelay)
    }
  }

  private handleTouchMove = (event: TouchEvent): void => {
    if (!this.touchState.isTracking || event.touches.length !== 1) return

    const touch = event.touches[0]
    const deltaX = Math.abs(touch.clientX - this.touchState.startX)
    const deltaY = Math.abs(touch.clientY - this.touchState.startY)

    // Cancel long press if moved too much
    if ((deltaX > 10 || deltaY > 10) && this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }

    // Prevent default for potential swipes
    if (deltaX > deltaY && deltaX > 10) {
      event.preventDefault()
    }
  }

  private handleTouchEnd = (event: TouchEvent): void => {
    if (!this.touchState.isTracking) return

    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - this.touchState.startX
    const deltaY = touch.clientY - this.touchState.startY
    const deltaTime = Date.now() - this.touchState.startTime

    this.touchState.isTracking = false

    // Clear long press timer
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }

    // Detect gestures
    if (deltaTime < 300) {
      const absDeltaX = Math.abs(deltaX)
      const absDeltaY = Math.abs(deltaY)

      if (absDeltaX > this.swipeThreshold || absDeltaY > this.swipeThreshold) {
        // Swipe detected
        let direction: 'left' | 'right' | 'up' | 'down'
        if (absDeltaX > absDeltaY) {
          direction = deltaX > 0 ? 'right' : 'left'
        } else {
          direction = deltaY > 0 ? 'down' : 'up'
        }
        this.onSwipe?.(direction, event)
      } else if (absDeltaX < 10 && absDeltaY < 10) {
        // Tap detected
        this.onTap?.(event)
      }
    }
  }

  private handleTouchCancel = (): void => {
    this.touchState.isTracking = false
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }
  }

  public destroy(): void {
    this.element.removeEventListener('touchstart', this.handleTouchStart)
    this.element.removeEventListener('touchmove', this.handleTouchMove)
    this.element.removeEventListener('touchend', this.handleTouchEnd)
    this.element.removeEventListener('touchcancel', this.handleTouchCancel)

    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
    }
  }
}

/**
 * Color contrast validator for WCAG compliance
 */
export function validateColorContrast(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA'
): { isValid: boolean; ratio: number; required: number } {
  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : null
  }

  // Calculate relative luminance
  const getLuminance = (r: number, g: number, b: number) => {
    const rsRGB = r / 255
    const gsRGB = g / 255
    const bsRGB = b / 255

    const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4)
    const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4)
    const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4)

    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear
  }

  const fg = hexToRgb(foreground)
  const bg = hexToRgb(background)

  if (!fg || !bg) {
    return { isValid: false, ratio: 0, required: level === 'AAA' ? 7 : 4.5 }
  }

  const fgLuminance = getLuminance(fg.r, fg.g, fg.b)
  const bgLuminance = getLuminance(bg.r, bg.g, bg.b)

  const lighter = Math.max(fgLuminance, bgLuminance)
  const darker = Math.min(fgLuminance, bgLuminance)
  const ratio = (lighter + 0.05) / (darker + 0.05)

  const required = level === 'AAA' ? 7 : 4.5
  const isValid = ratio >= required

  return { isValid, ratio, required }
}

/**
 * Generate accessible IDs for form elements
 */
export function generateAccessibleId(prefix: string = 'element'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Check if user prefers high contrast
 */
export function prefersHighContrast(): boolean {
  return window.matchMedia('(prefers-contrast: high)').matches
}

/**
 * Check if user prefers dark theme
 */
export function prefersDarkTheme(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * Enhanced focus management utilities
 */
export class FocusManager {
  private static instance: FocusManager
  private focusHistory: HTMLElement[] = []
  private maxHistorySize = 10

  static getInstance(): FocusManager {
    if (!FocusManager.instance) {
      FocusManager.instance = new FocusManager()
    }
    return FocusManager.instance
  }

  public saveFocus(element?: HTMLElement): void {
    const elementToSave = element || (document.activeElement as HTMLElement)
    if (elementToSave && elementToSave !== document.body) {
      this.focusHistory.push(elementToSave)
      if (this.focusHistory.length > this.maxHistorySize) {
        this.focusHistory.shift()
      }
    }
  }

  public restoreFocus(): boolean {
    const lastFocused = this.focusHistory.pop()
    if (lastFocused && document.contains(lastFocused)) {
      try {
        lastFocused.focus()
        return true
      } catch (e) {
        // Element might not be focusable anymore
        return this.restoreFocus() // Try next in history
      }
    }
    return false
  }

  public clearHistory(): void {
    this.focusHistory = []
  }
}

/**
 * Roving tabindex manager for component groups
 */
export class RovingTabindexManager {
  private container: HTMLElement
  private items: HTMLElement[]
  private currentIndex = 0

  constructor(container: HTMLElement, itemSelector: string) {
    this.container = container
    this.items = Array.from(container.querySelectorAll(itemSelector))
    this.initialize()
  }

  private initialize(): void {
    this.items.forEach((item, index) => {
      item.setAttribute('tabindex', index === 0 ? '0' : '-1')
      item.addEventListener('keydown', this.handleKeydown)
      item.addEventListener('focus', () => this.setCurrentIndex(index))
    })
  }

  private handleKeydown = (event: KeyboardEvent): void => {
    let newIndex = this.currentIndex

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault()
        newIndex = (this.currentIndex + 1) % this.items.length
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault()
        newIndex = this.currentIndex - 1 < 0 ? this.items.length - 1 : this.currentIndex - 1
        break
      case 'Home':
        event.preventDefault()
        newIndex = 0
        break
      case 'End':
        event.preventDefault()
        newIndex = this.items.length - 1
        break
      default:
        return
    }

    this.setCurrentIndex(newIndex)
    this.items[newIndex].focus()
  }

  private setCurrentIndex(index: number): void {
    // Update tabindex
    this.items[this.currentIndex]?.setAttribute('tabindex', '-1')
    this.currentIndex = index
    this.items[this.currentIndex]?.setAttribute('tabindex', '0')
  }

  public updateItems(itemSelector: string): void {
    // Remove old listeners
    this.items.forEach(item => {
      item.removeEventListener('keydown', this.handleKeydown)
    })

    // Update items and reinitialize
    this.items = Array.from(this.container.querySelectorAll(itemSelector))
    this.currentIndex = 0
    this.initialize()
  }

  public destroy(): void {
    this.items.forEach(item => {
      item.removeEventListener('keydown', this.handleKeydown)
    })
  }
}

/**
 * Accessible modal/dialog utilities
 */
export function createAccessibleModal(
  modalElement: HTMLElement,
  options: {
    title?: string
    description?: string
    closeButton?: HTMLElement
    onClose?: () => void
  }
) {
  const focusTrap = new FocusTrap(modalElement)
  const focusManager = FocusManager.getInstance()

  // Set up ARIA attributes
  modalElement.setAttribute('role', 'dialog')
  modalElement.setAttribute('aria-modal', 'true')
  if (options.title) {
    modalElement.setAttribute('aria-label', options.title)
  }
  if (options.description) {
    modalElement.setAttribute('aria-describedby', options.description)
  }

  const open = () => {
    focusManager.saveFocus()
    focusTrap.activate()
    announceToScreenReader('Dialog opened')

    // Handle escape key
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close()
      }
    }
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }

  const close = () => {
    focusTrap.deactivate()
    focusManager.restoreFocus()
    announceToScreenReader('Dialog closed')
    options.onClose?.()
  }

  // Set up close button if provided
  if (options.closeButton) {
    options.closeButton.addEventListener('click', close)
  }

  return { open, close, focusTrap }
}

/**
 * Accessible notification/toast system
 */
export function createAccessibleNotification(
  message: string,
  options: {
    type?: 'info' | 'success' | 'warning' | 'error'
    duration?: number
    persistent?: boolean
  } = {}
) {
  const { type = 'info', duration = 5000, persistent = false } = options

  const notification = document.createElement('div')
  notification.className = `notification notification-${type}`
  notification.setAttribute('role', type === 'error' ? 'alert' : 'status')
  notification.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite')
  notification.textContent = message

  // Add to DOM
  let container = document.getElementById('notifications-container')
  if (!container) {
    container = document.createElement('div')
    container.id = 'notifications-container'
    container.className = 'notifications-container'
    container.setAttribute('aria-label', 'Notifications')
    document.body.appendChild(container)
  }

  container.appendChild(notification)

  // Auto-remove after duration (unless persistent)
  if (!persistent) {
    setTimeout(() => {
      try {
        container?.removeChild(notification)
        if (container?.children.length === 0) {
          document.body.removeChild(container)
        }
      } catch (e) {
        // Element might have been removed already
      }
    }, duration)
  }

  return {
    element: notification,
    remove: () => {
      try {
        container?.removeChild(notification)
        if (container?.children.length === 0) {
          document.body.removeChild(container)
        }
      } catch (e) {
        // Element might have been removed already
      }
    }
  }
}

/**
 * Check if element is visible to screen readers
 */
export function isAccessible(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element)

  return !(
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.opacity === '0' ||
    element.hasAttribute('aria-hidden') ||
    element.hasAttribute('hidden')
  )
}

/**
 * Enhanced error announcements for forms
 */
export function announceFormError(field: HTMLElement, message: string): void {
  // Create or update error message element
  const fieldId = field.id || generateAccessibleId('field')
  field.id = fieldId

  const errorId = `${fieldId}-error`
  let errorElement = document.getElementById(errorId)

  if (!errorElement) {
    errorElement = document.createElement('div')
    errorElement.id = errorId
    errorElement.className = 'field-error sr-only'
    errorElement.setAttribute('aria-live', 'assertive')
    errorElement.setAttribute('role', 'alert')
    field.parentNode?.insertBefore(errorElement, field.nextSibling)
  }

  errorElement.textContent = message
  field.setAttribute('aria-describedby', errorId)
  field.setAttribute('aria-invalid', 'true')

  // Focus the field
  field.focus()
}

/**
 * Clear form field error
 */
export function clearFormError(field: HTMLElement): void {
  const fieldId = field.id
  if (fieldId) {
    const errorElement = document.getElementById(`${fieldId}-error`)
    if (errorElement) {
      errorElement.textContent = ''
    }
  }

  field.removeAttribute('aria-invalid')
  field.removeAttribute('aria-describedby')
}
