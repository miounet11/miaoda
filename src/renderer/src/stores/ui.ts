import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Theme, ToastMessage } from '@renderer/src/types'

export const useUIStore = defineStore('ui', () => {
  // State
  const theme = ref<Theme>('system')
  const sidebarOpen = ref(true)
  const sidebarWidth = ref(280)
  const windowFocused = ref(true)
  const isFullscreen = ref(false)
  const toasts = ref<ToastMessage[]>([])
  const modals = ref<Map<string, boolean>>(new Map())
  const loading = ref<Map<string, boolean>>(new Map())
  
  // Mobile and responsive state
  const isMobile = ref(false)
  const windowWidth = ref(window.innerWidth)
  const windowHeight = ref(window.innerHeight)
  
  // Chat UI state
  const chatInputHeight = ref(60)
  const messagesScrollPosition = ref(0)
  const showScrollToBottom = ref(false)
  const selectedMessages = ref<Set<string>>(new Set())
  
  // Search state
  const searchQuery = ref('')
  const searchResults = ref<any[]>([])
  const isSearching = ref(false)
  
  // Settings state
  const settingsTab = ref('general')
  const showSettings = ref(false)
  
  // Voice state
  const isRecording = ref(false)
  const voiceEnabled = ref(false)
  
  // Computed
  const effectiveTheme = computed(() => {
    if (theme.value === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return theme.value
  })
  
  const isDark = computed(() => effectiveTheme.value === 'dark')
  
  const sidebarCollapsed = computed(() => {
    return isMobile.value ? !sidebarOpen.value : sidebarWidth.value < 200
  })
  
  const canShowSidebar = computed(() => {
    return !isMobile.value || sidebarOpen.value
  })
  
  const activeModals = computed(() => {
    const active: string[] = []
    for (const [modal, isOpen] of modals.value) {
      if (isOpen) active.push(modal)
    }
    return active
  })
  
  const hasActiveLoading = computed(() => {
    return Array.from(loading.value.values()).some(Boolean)
  })
  
  // Actions
  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme
    applyTheme()
  }
  
  const toggleTheme = () => {
    if (theme.value === 'system') {
      setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark')
    } else {
      setTheme(theme.value === 'light' ? 'dark' : 'light')
    }
  }
  
  const applyTheme = () => {
    const root = document.documentElement
    root.setAttribute('data-theme', effectiveTheme.value)
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      const backgroundColor = isDark.value ? '#1a1a1a' : '#ffffff'
      metaThemeColor.setAttribute('content', backgroundColor)
    }
  }
  
  const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value
  }
  
  const setSidebarOpen = (open: boolean) => {
    sidebarOpen.value = open
  }
  
  const setSidebarWidth = (width: number) => {
    sidebarWidth.value = Math.max(200, Math.min(600, width))
  }
  
  const updateWindowSize = (width: number, height: number) => {
    windowWidth.value = width
    windowHeight.value = height
    isMobile.value = width < 768
    
    // Auto-close sidebar on mobile when window becomes small
    if (isMobile.value && sidebarOpen.value) {
      sidebarOpen.value = false
    }
  }
  
  const setWindowFocus = (focused: boolean) => {
    windowFocused.value = focused
  }
  
  const toggleFullscreen = () => {
    isFullscreen.value = !isFullscreen.value
    
    if (isFullscreen.value) {
      document.documentElement.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }
  
  // Toast management
  const showToast = (toast: Omit<ToastMessage, 'id' | 'timestamp'>) => {
    const newToast: ToastMessage = {
      ...toast,
      id: Date.now().toString(),
      timestamp: new Date()
    }
    
    toasts.value.push(newToast)
    
    // Auto-remove toast after timeout
    if (toast.timeout !== 0) {
      setTimeout(() => {
        removeToast(newToast.id)
      }, toast.timeout || 5000)
    }
    
    return newToast.id
  }
  
  const removeToast = (id: string) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }
  
  const clearToasts = () => {
    toasts.value = []
  }
  
  // Modal management
  const openModal = (modalId: string) => {
    modals.value.set(modalId, true)
  }
  
  const closeModal = (modalId: string) => {
    modals.value.set(modalId, false)
  }
  
  const toggleModal = (modalId: string) => {
    const isOpen = modals.value.get(modalId) || false
    modals.value.set(modalId, !isOpen)
  }
  
  const isModalOpen = (modalId: string) => {
    return modals.value.get(modalId) || false
  }
  
  // Loading management
  const setLoading = (key: string, isLoading: boolean) => {
    loading.value.set(key, isLoading)
  }
  
  const isLoading = (key: string) => {
    return loading.value.get(key) || false
  }
  
  // Search management
  const setSearchQuery = (query: string) => {
    searchQuery.value = query
  }
  
  const setSearchResults = (results: any[]) => {
    searchResults.value = results
  }
  
  const setSearching = (searching: boolean) => {
    isSearching.value = searching
  }
  
  const clearSearch = () => {
    searchQuery.value = ''
    searchResults.value = []
    isSearching.value = false
  }
  
  // Settings management
  const setSettingsTab = (tab: string) => {
    settingsTab.value = tab
  }
  
  const toggleSettings = () => {
    showSettings.value = !showSettings.value
  }
  
  const openSettings = (tab?: string) => {
    showSettings.value = true
    if (tab) {
      settingsTab.value = tab
    }
  }
  
  const closeSettings = () => {
    showSettings.value = false
  }
  
  // Message selection
  const selectMessage = (messageId: string) => {
    selectedMessages.value.add(messageId)
  }
  
  const deselectMessage = (messageId: string) => {
    selectedMessages.value.delete(messageId)
  }
  
  const toggleMessageSelection = (messageId: string) => {
    if (selectedMessages.value.has(messageId)) {
      selectedMessages.value.delete(messageId)
    } else {
      selectedMessages.value.add(messageId)
    }
  }
  
  const clearMessageSelection = () => {
    selectedMessages.value.clear()
  }
  
  const isMessageSelected = (messageId: string) => {
    return selectedMessages.value.has(messageId)
  }
  
  // Chat input management
  const setChatInputHeight = (height: number) => {
    chatInputHeight.value = Math.max(60, Math.min(300, height))
  }
  
  const setMessagesScrollPosition = (position: number) => {
    messagesScrollPosition.value = position
  }
  
  const setShowScrollToBottom = (show: boolean) => {
    showScrollToBottom.value = show
  }
  
  // Voice management
  const setRecording = (recording: boolean) => {
    isRecording.value = recording
  }
  
  const setVoiceEnabled = (enabled: boolean) => {
    voiceEnabled.value = enabled
  }
  
  const toggleVoice = () => {
    voiceEnabled.value = !voiceEnabled.value
  }
  
  // Keyboard shortcuts
  const handleKeyboardShortcut = (event: KeyboardEvent) => {
    const { key, ctrlKey, metaKey, shiftKey, altKey } = event
    const cmd = ctrlKey || metaKey
    
    // Global shortcuts
    if (cmd && key === ',') {
      event.preventDefault()
      toggleSettings()
      return
    }
    
    if (cmd && key === '/') {
      event.preventDefault()
      toggleSidebar()
      return
    }
    
    if (cmd && key === 'f') {
      event.preventDefault()
      openModal('search')
      return
    }
    
    if (key === 'Escape') {
      // Close modals, clear selections, etc.
      if (activeModals.value.length > 0) {
        activeModals.value.forEach(modal => closeModal(modal))
      } else if (selectedMessages.value.size > 0) {
        clearMessageSelection()
      } else if (showSettings.value) {
        closeSettings()
      }
      return
    }
    
    // Theme toggle
    if (cmd && shiftKey && key === 'T') {
      event.preventDefault()
      toggleTheme()
      return
    }
  }
  
  // Initialize UI store
  const initialize = () => {
    // Apply saved theme
    applyTheme()
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', () => {
      if (theme.value === 'system') {
        applyTheme()
      }
    })
    
    // Listen for window resize
    const handleResize = () => {
      updateWindowSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)
    handleResize()
    
    // Listen for focus changes
    const handleFocus = () => setWindowFocus(true)
    const handleBlur = () => setWindowFocus(false)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)
    
    // Listen for fullscreen changes
    const handleFullscreenChange = () => {
      isFullscreen.value = !!document.fullscreenElement
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    
    // Global keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcut)
    
    // Cleanup function
    return () => {
      mediaQuery.removeEventListener('change', applyTheme)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('keydown', handleKeyboardShortcut)
    }
  }
  
  return {
    // State
    theme,
    sidebarOpen,
    sidebarWidth,
    windowFocused,
    isFullscreen,
    toasts,
    isMobile,
    windowWidth,
    windowHeight,
    chatInputHeight,
    messagesScrollPosition,
    showScrollToBottom,
    selectedMessages,
    searchQuery,
    searchResults,
    isSearching,
    settingsTab,
    showSettings,
    isRecording,
    voiceEnabled,
    
    // Computed
    effectiveTheme,
    isDark,
    sidebarCollapsed,
    canShowSidebar,
    activeModals,
    hasActiveLoading,
    
    // Actions
    setTheme,
    toggleTheme,
    toggleSidebar,
    setSidebarOpen,
    setSidebarWidth,
    updateWindowSize,
    setWindowFocus,
    toggleFullscreen,
    showToast,
    removeToast,
    clearToasts,
    openModal,
    closeModal,
    toggleModal,
    isModalOpen,
    setLoading,
    isLoading,
    setSearchQuery,
    setSearchResults,
    setSearching,
    clearSearch,
    setSettingsTab,
    toggleSettings,
    openSettings,
    closeSettings,
    selectMessage,
    deselectMessage,
    toggleMessageSelection,
    clearMessageSelection,
    isMessageSelected,
    setChatInputHeight,
    setMessagesScrollPosition,
    setShowScrollToBottom,
    setRecording,
    setVoiceEnabled,
    toggleVoice,
    initialize
  }
}, {
  persist: {
    key: 'miaoda-ui-store',
    paths: ['theme', 'sidebarOpen', 'sidebarWidth', 'voiceEnabled'],
    storage: localStorage
  }
})