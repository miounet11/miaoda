<template>
  <div class="app-container h-screen flex flex-col bg-background">
    <!-- Multi-Window Layout -->
    <div v-if="useMultiWindow" class="flex-1 overflow-hidden">
      <Window
        ref="mainWindowRef"
        :window-id="activeWindowId"
        :show-header="!isMac"
        :show-status-bar="true"
        @window-close="handleWindowClose"
        @window-minimize="handleWindowMinimize"
        @window-maximize="handleWindowMaximize"
        @window-focus="handleWindowFocus"
        @tab-change="handleTabChange"
      />
    </div>
    
    <!-- Legacy Single-Window Layout (fallback) -->
    <div v-else class="flex-1 overflow-hidden">
      <!-- Title bar for Windows/Linux -->
      <div v-if="!isMac" class="title-bar h-8 bg-background border-b flex items-center px-4">
        <span class="text-sm font-medium">MiaoDa Chat</span>
      </div>
      
      <!-- Main content -->
      <div class="flex-1 overflow-hidden">
        <router-view />
      </div>
    </div>
    
    <!-- Global Loading Overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <Loader :size="32" class="animate-spin" />
        <p>{{ loadingMessage }}</p>
      </div>
    </div>
    
    <!-- Global Error Toast -->
    <ErrorToast
      v-if="globalError"
      :message="globalError"
      @close="clearGlobalError"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Loader } from 'lucide-vue-next'
import Window from '@renderer/src/components/window/Window.vue'
import ErrorToast from '@renderer/src/components/error/ErrorToast.vue'
import { windowManager } from '@renderer/src/services/window/WindowManager'
import { mcpService } from '@renderer/src/services/mcp/MCPService'

const router = useRouter()

// Refs
const mainWindowRef = ref<InstanceType<typeof Window>>()

// State
const useMultiWindow = ref(true) // Feature flag for multi-window support
const activeWindowId = ref<string | null>(null)
const isLoading = ref(false)
const loadingMessage = ref('')
const globalError = ref<string | null>(null)

// Computed
const isMac = computed(() => navigator.platform.toLowerCase().includes('mac'))

// Methods
const initializeApplication = async () => {
  try {
    isLoading.value = true
    loadingMessage.value = 'Initializing application...'
    
    // Initialize services
    await Promise.all([
      initializeWindowManager(),
      initializeMCPService()
    ])
    
    // Set up active window
    const activeWindow = windowManager.getActiveWindow()
    if (activeWindow) {
      activeWindowId.value = activeWindow.id
    }
    
  } catch (error) {
    console.error('Failed to initialize application:', error)
    globalError.value = 'Failed to initialize application. Please try restarting.'
    
    // Fallback to single-window mode
    useMultiWindow.value = false
    
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

const initializeWindowManager = async () => {
  try {
    // Window manager initializes automatically
    // Set up event listeners
    windowManager.on('window-created', (window) => {
      console.log('Window created:', window.id)
    })
    
    windowManager.on('window-closed', (windowId) => {
      console.log('Window closed:', windowId)
      
      // If this was the active window, switch to another
      if (activeWindowId.value === windowId) {
        const remainingWindows = windowManager.getWindows()
        activeWindowId.value = remainingWindows.length > 0 ? remainingWindows[0].id : null
      }
    })
    
    windowManager.on('window-focused', (windowId) => {
      activeWindowId.value = windowId
    })
    
  } catch (error) {
    console.error('Failed to initialize window manager:', error)
    throw error
  }
}

const initializeMCPService = async () => {
  try {
    // MCP service initializes automatically
    // Set up event listeners
    mcpService.on('server-connected', (server) => {
      console.log('MCP server connected:', server.name)
    })
    
    mcpService.on('server-disconnected', (serverId) => {
      console.log('MCP server disconnected:', serverId)
    })
    
    mcpService.on('tool-call-error', (call, error) => {
      console.error('MCP tool call failed:', call.name, error)
    })
    
  } catch (error) {
    console.error('Failed to initialize MCP service:', error)
    // MCP service failure is not critical for basic functionality
  }
}

const handleWindowClose = (windowId: string) => {
  console.log('Handling window close:', windowId)
  
  // If this is the last window, quit the application
  const remainingWindows = windowManager.getWindows()
  if (remainingWindows.length === 0) {
    if (window.api?.app?.quit) {
      window.api.app.quit()
    }
  }
}

const handleWindowMinimize = (windowId: string) => {
  console.log('Handling window minimize:', windowId)
}

const handleWindowMaximize = (windowId: string) => {
  console.log('Handling window maximize:', windowId)
}

const handleWindowFocus = (windowId: string) => {
  activeWindowId.value = windowId
  console.log('Handling window focus:', windowId)
}

const handleTabChange = (windowId: string, tabId: string) => {
  console.log('Handling tab change:', windowId, tabId)
  
  // Update router if needed for legacy compatibility
  const window = windowManager.getWindow(windowId)
  if (window) {
    const tab = window.tabs.find(t => t.id === tabId)
    if (tab && !useMultiWindow.value) {
      // Map tab types to routes for single-window fallback
      const routeMap: Record<string, string> = {
        chat: '/',
        settings: '/settings'
      }
      
      const route = routeMap[tab.type]
      if (route && router.currentRoute.value.path !== route) {
        router.push(route)
      }
    }
  }
}

const clearGlobalError = () => {
  globalError.value = null
}

// Global shortcuts
const setupGlobalShortcuts = () => {
  const handleShortcut = (action: string) => {
    try {
      switch (action) {
        case 'new-chat':
          handleNewChat()
          break
        case 'new-window':
          handleNewWindow()
          break
        case 'close-tab':
          handleCloseTab()
          break
        case 'next-tab':
          handleNextTab()
          break
        case 'prev-tab':
          handlePrevTab()
          break
        case 'open-settings':
          handleOpenSettings()
          break
        case 'focus-input':
          handleFocusInput()
          break
        case 'clear-chat':
          handleClearChat()
          break
        case 'toggle-sidebar':
          handleToggleSidebar()
          break
        default:
          console.log('Unknown shortcut action:', action)
      }
    } catch (error) {
      console.error('Failed to handle shortcut:', action, error)
    }
  }
  
  // Listen for shortcuts from main process
  if (window.api?.shortcuts?.on) {
    window.api.shortcuts.on(handleShortcut)
  }
  
  // Also listen for keyboard shortcuts
  document.addEventListener('keydown', (event) => {
    const { key, ctrlKey, metaKey, shiftKey, altKey } = event
    const cmd = ctrlKey || metaKey
    
    // Global shortcuts that work anywhere
    if (cmd && key === 't' && !shiftKey) {
      event.preventDefault()
      handleNewChat()
    } else if (cmd && shiftKey && key === 'T') {
      event.preventDefault()
      handleNewWindow()
    } else if (cmd && key === 'w') {
      event.preventDefault()
      handleCloseTab()
    } else if (cmd && key === ',') {
      event.preventDefault()
      handleOpenSettings()
    }
  })
}

// Shortcut handlers
const handleNewChat = async () => {
  if (useMultiWindow.value && activeWindowId.value) {
    await windowManager.createTab(activeWindowId.value, {
      title: 'New Chat',
      type: 'chat'
    })
  } else {
    window.dispatchEvent(new CustomEvent('app:new-chat'))
  }
}

const handleNewWindow = async () => {
  if (useMultiWindow.value) {
    const windowId = await windowManager.createWindow({
      title: 'MiaoDa Chat'
    })
    handleWindowFocus(windowId)
  }
}

const handleCloseTab = () => {
  if (useMultiWindow.value && activeWindowId.value) {
    const window = windowManager.getWindow(activeWindowId.value)
    if (window && window.activeTabId) {
      windowManager.closeTab(activeWindowId.value, window.activeTabId)
    }
  }
}

const handleNextTab = () => {
  if (useMultiWindow.value && activeWindowId.value) {
    const window = windowManager.getWindow(activeWindowId.value)
    if (window && window.tabs.length > 1) {
      const currentIndex = window.tabs.findIndex(tab => tab.id === window.activeTabId)
      const nextIndex = (currentIndex + 1) % window.tabs.length
      windowManager.switchTab(activeWindowId.value, window.tabs[nextIndex].id)
    }
  }
}

const handlePrevTab = () => {
  if (useMultiWindow.value && activeWindowId.value) {
    const window = windowManager.getWindow(activeWindowId.value)
    if (window && window.tabs.length > 1) {
      const currentIndex = window.tabs.findIndex(tab => tab.id === window.activeTabId)
      const prevIndex = currentIndex === 0 ? window.tabs.length - 1 : currentIndex - 1
      windowManager.switchTab(activeWindowId.value, window.tabs[prevIndex].id)
    }
  }
}

const handleOpenSettings = async () => {
  if (useMultiWindow.value && activeWindowId.value) {
    await windowManager.createTab(activeWindowId.value, {
      title: 'Settings',
      type: 'settings'
    })
  } else {
    router.push('/settings')
  }
}

const handleFocusInput = () => {
  window.dispatchEvent(new CustomEvent('app:focus-input'))
}

const handleClearChat = () => {
  window.dispatchEvent(new CustomEvent('app:clear-chat'))
}

const handleToggleSidebar = () => {
  window.dispatchEvent(new CustomEvent('app:toggle-sidebar'))
}

// Error handling
const handleGlobalError = (error: Error | string) => {
  const message = error instanceof Error ? error.message : error
  globalError.value = message
  console.error('Global error:', message)
  
  // Auto-clear error after 5 seconds
  setTimeout(() => {
    if (globalError.value === message) {
      globalError.value = null
    }
  }, 5000)
}

// Window event handlers
const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  // Check for unsaved changes
  const windows = windowManager.getWindows()
  const hasUnsavedChanges = windows.some(window => 
    window.tabs.some(tab => tab.modified)
  )
  
  if (hasUnsavedChanges) {
    event.preventDefault()
    event.returnValue = 'You have unsaved changes. Are you sure you want to close?'
    return event.returnValue
  }
}

// Lifecycle
onMounted(async () => {
  try {
    await initializeApplication()
    setupGlobalShortcuts()
    
    // Set up global error handling
    window.addEventListener('error', (event) => {
      handleGlobalError(event.error || event.message)
    })
    
    window.addEventListener('unhandledrejection', (event) => {
      handleGlobalError(event.reason)
    })
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    
  } catch (error) {
    console.error('Failed to start application:', error)
    handleGlobalError('Failed to start application')
  }
})

onUnmounted(() => {
  // Cleanup
  windowManager.destroy()
  mcpService.destroy()
  
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

// Expose methods for debugging
if (import.meta.env.DEV) {
  (window as any).__app = {
    windowManager,
    mcpService,
    activeWindowId: () => activeWindowId.value,
    switchToSingleWindow: () => { useMultiWindow.value = false },
    switchToMultiWindow: () => { useMultiWindow.value = true }
  }
}
</script>

<style>
.app-container {
  -webkit-app-region: drag;
}

.app-container * {
  -webkit-app-region: no-drag;
}

.title-bar {
  -webkit-app-region: drag;
}

/* Loading Overlay */
.loading-overlay {
  @apply fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center;
}

.loading-content {
  @apply text-center space-y-4;
}

.loading-content p {
  @apply text-muted-foreground;
}

/* Ensure proper layering */
.loading-overlay {
  pointer-events: auto;
}

/* Animation for loading spinner */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>