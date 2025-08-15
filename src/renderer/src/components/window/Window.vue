<template>
  <div class="window" :class="windowClasses">
    <!-- Window Header -->
    <div v-if="showHeader" class="window-header" @dblclick="toggleMaximize">
      <!-- Window Controls (macOS style) -->
      <div class="window-controls">
        <button 
          @click="minimizeWindow" 
          class="control-btn minimize-btn"
          :title="t('window.minimize')"
        >
          <Minus :size="12" />
        </button>
        <button 
          @click="toggleMaximize" 
          class="control-btn maximize-btn"
          :title="isMaximized ? t('window.restore') : t('window.maximize')"
        >
          <Square :size="12" v-if="!isMaximized" />
          <Copy :size="12" v-else />
        </button>
        <button 
          @click="closeWindow" 
          class="control-btn close-btn"
          :title="t('window.close')"
        >
          <X :size="12" />
        </button>
      </div>
      
      <!-- Window Title -->
      <div class="window-title">
        <h1>{{ windowState?.title || 'MiaoDa Chat' }}</h1>
        <span v-if="activeTab?.modified" class="modified-indicator">•</span>
      </div>
      
      <!-- Window Actions -->
      <div class="window-actions">
        <button
          @click="openSettings"
          class="settings-btn"
          :title="t('common.settings')"
        >
          <Settings :size="16" />
        </button>
        <button
          @click="showWindowMenu"
          class="window-menu-btn"
          :title="t('window.menu')"
        >
          <MoreHorizontal :size="16" />
        </button>
      </div>
    </div>

    <!-- Tab Bar -->
    <TabBar
      v-if="windowState"
      ref="tabBarRef"
      :window-id="windowState.id"
      :tabs="windowState.tabs"
      :active-tab-id="windowState.activeTabId"
      :allow-tab-drag="allowTabDrag"
      :show-add-button="showAddButton"
      :show-navigation="showNavigation"
      :show-tab-menu="showTabMenu"
      :max-tab-width="maxTabWidth"
      :min-tab-width="minTabWidth"
      @tab-select="handleTabSelect"
      @tab-close="handleTabClose"
      @tab-add="handleTabAdd"
      @tab-move="handleTabMove"
      @tab-context="handleTabContext"
    />

    <!-- Content Area -->
    <div class="window-content" :class="contentClasses">
      <TabContent
        v-if="activeTab"
        :key="activeTab.id"
        :tab="activeTab"
        :window-id="windowState?.id || ''"
        @tab-title-change="handleTabTitleChange"
        @tab-modified-change="handleTabModifiedChange"
        @tab-close="handleTabClose"
      />
      
      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-content">
          <FileText :size="48" class="empty-icon" />
          <h2>{{ t('window.noTabsTitle') }}</h2>
          <p>{{ t('window.noTabsDescription') }}</p>
          <button @click="handleTabAdd" class="add-tab-button">
            <Plus :size="16" />
            {{ t('tab.addNew') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Window Status Bar -->
    <div v-if="showStatusBar" class="window-status-bar">
      <div class="status-left">
        <span class="status-item">
          {{ t('window.tabs', { count: windowState?.tabs.length || 0 }) }}
        </span>
        <span v-if="connectionStatus" class="status-item connection-status" :class="connectionStatus">
          <Wifi :size="14" v-if="connectionStatus === 'connected'" />
          <WifiOff :size="14" v-else />
          {{ t(`connection.${connectionStatus}`) }}
        </span>
      </div>
      
      <div class="status-right">
        <span v-if="activeTab?.type === 'chat'" class="status-item">
          {{ t('chat.model') }}: {{ currentModel }}
        </span>
        <span class="status-item">
          {{ formattedTime }}
        </span>
      </div>
    </div>

    <!-- Window Menu -->
    <ContextMenu
      v-if="windowMenu.visible"
      :x="windowMenu.x"
      :y="windowMenu.y"
      :items="windowMenu.items"
      @close="hideWindowMenu"
      @action="handleWindowMenuAction"
    />

    <!-- Resize Handles (for custom window frame) -->
    <div v-if="!isMaximized && allowResize" class="resize-handles">
      <div class="resize-handle resize-n" @mousedown="startResize('n')" />
      <div class="resize-handle resize-s" @mousedown="startResize('s')" />
      <div class="resize-handle resize-e" @mousedown="startResize('e')" />
      <div class="resize-handle resize-w" @mousedown="startResize('w')" />
      <div class="resize-handle resize-nw" @mousedown="startResize('nw')" />
      <div class="resize-handle resize-ne" @mousedown="startResize('ne')" />
      <div class="resize-handle resize-sw" @mousedown="startResize('sw')" />
      <div class="resize-handle resize-se" @mousedown="startResize('se')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { 
  Minus, Square, Copy, X, MoreHorizontal, Plus, FileText, 
  Wifi, WifiOff, Settings 
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { windowManager, type WindowState, type WindowTab } from '@renderer/src/services/window/WindowManager'
import { mcpService } from '@renderer/src/services/mcp/MCPService'
import TabBar from './TabBar.vue'
import TabContent from './TabContent.vue'
import ContextMenu from '@renderer/src/components/ui/ContextMenu.vue'
import type { ContextMenuItem } from '@renderer/src/types'

// Props
interface Props {
  windowId?: string
  showHeader?: boolean
  showStatusBar?: boolean
  allowTabDrag?: boolean
  showAddButton?: boolean
  showNavigation?: boolean
  showTabMenu?: boolean
  allowResize?: boolean
  maxTabWidth?: number
  minTabWidth?: number
}

const props = withDefaults(defineProps<Props>(), {
  showHeader: true,
  showStatusBar: true,
  allowTabDrag: true,
  showAddButton: true,
  showNavigation: true,
  showTabMenu: true,
  allowResize: true,
  maxTabWidth: 200,
  minTabWidth: 120
})

// Emits
const emit = defineEmits<{
  'window-close': [windowId: string]
  'window-minimize': [windowId: string]
  'window-maximize': [windowId: string]
  'window-focus': [windowId: string]
  'tab-change': [windowId: string, tabId: string]
}>()

// Composables
const { t } = useI18n()

// Refs
const tabBarRef = ref<InstanceType<typeof TabBar>>()
const windowState = ref<WindowState | null>(null)
const currentTime = ref(new Date())
const resizing = ref<string | null>(null)

// State
const windowMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  items: [] as ContextMenuItem[]
})

// Computed
const activeTab = computed(() => {
  if (!windowState.value || !windowState.value.activeTabId) return null
  return windowState.value.tabs.find(tab => tab.id === windowState.value!.activeTabId) || null
})

const isMaximized = computed(() => windowState.value?.isMaximized || false)

const windowClasses = computed(() => ({
  'window-maximized': isMaximized.value,
  'window-minimized': windowState.value?.isMinimized || false,
  'window-focused': windowState.value?.id === windowManager.getActiveWindow()?.id,
  'window-resizing': resizing.value !== null
}))

const contentClasses = computed(() => ({
  'content-with-header': props.showHeader,
  'content-with-status': props.showStatusBar
}))

const connectionStatus = computed(() => {
  return mcpService.isConnected() ? 'connected' : 'disconnected'
})

const currentModel = computed(() => {
  // This would come from your chat store/service
  return 'Claude 3.5 Sonnet'
})

const formattedTime = computed(() => {
  return currentTime.value.toLocaleTimeString()
})

// Methods
const loadWindowState = async () => {
  const windowId = props.windowId || windowManager.getActiveWindow()?.id
  if (!windowId) {
    // Create a new window if none exists
    const newWindowId = await windowManager.createWindow({
      title: 'MiaoDa Chat'
    })
    windowState.value = windowManager.getWindow(newWindowId)
  } else {
    windowState.value = windowManager.getWindow(windowId)
  }
}

const minimizeWindow = async () => {
  if (!windowState.value) return
  await windowManager.minimizeWindow(windowState.value.id)
  emit('window-minimize', windowState.value.id)
}

const toggleMaximize = async () => {
  if (!windowState.value) return
  await windowManager.maximizeWindow(windowState.value.id)
  emit('window-maximize', windowState.value.id)
}

const closeWindow = async () => {
  if (!windowState.value) return
  const closed = await windowManager.closeWindow(windowState.value.id)
  if (closed) {
    emit('window-close', windowState.value.id)
  }
}

const handleTabSelect = (tabId: string) => {
  if (!windowState.value) return
  windowManager.switchTab(windowState.value.id, tabId)
  emit('tab-change', windowState.value.id, tabId)
}

const handleTabClose = async (tabId: string) => {
  if (!windowState.value) return
  await windowManager.closeTab(windowState.value.id, tabId)
}

const handleTabAdd = async () => {
  if (!windowState.value) return
  
  await windowManager.createTab(windowState.value.id, {
    title: 'New Chat',
    type: 'chat'
  })
}

const handleTabMove = (tabId: string, newIndex: number) => {
  if (!windowState.value) return
  windowManager.moveTab(windowState.value.id, tabId, newIndex)
}

const handleTabContext = (tab: WindowTab, event: MouseEvent) => {
  // Tab context is handled by TabBar component
}

const handleTabTitleChange = (tabId: string, title: string) => {
  if (!windowState.value) return
  windowManager.updateTabTitle(windowState.value.id, tabId, title)
}

const handleTabModifiedChange = (tabId: string, modified: boolean) => {
  if (!windowState.value) return
  windowManager.markTabModified(windowState.value.id, tabId, modified)
}

// Window Menu
const showWindowMenu = (event?: MouseEvent) => {
  const items: ContextMenuItem[] = [
    {
      id: 'new-tab',
      label: t('tab.addNew'),
      icon: 'plus',
      action: () => handleTabAdd()
    },
    {
      id: 'new-window',
      label: t('window.newWindow'),
      icon: 'external-link',
      action: () => createNewWindow()
    },
    {
      id: 'separator1',
      label: '',
      separator: true
    },
    {
      id: 'save-layout',
      label: t('window.saveLayout'),
      icon: 'save',
      action: () => saveCurrentLayout()
    },
    {
      id: 'restore-layout',
      label: t('window.restoreLayout'),
      icon: 'folder-open',
      action: () => showLayoutMenu()
    },
    {
      id: 'separator2',
      label: '',
      separator: true
    },
    {
      id: 'settings',
      label: t('common.settings'),
      icon: 'settings',
      action: () => openSettings()
    }
  ]

  windowMenu.value = {
    visible: true,
    x: event?.clientX || window.innerWidth - 200,
    y: event?.clientY || 50,
    items
  }
}

const hideWindowMenu = () => {
  windowMenu.value.visible = false
}

const handleWindowMenuAction = (action: () => void) => {
  action()
  hideWindowMenu()
}

const createNewWindow = async () => {
  const newWindowId = await windowManager.createWindow({
    title: 'MiaoDa Chat',
    bounds: {
      x: (windowState.value?.bounds.x || 0) + 50,
      y: (windowState.value?.bounds.y || 0) + 50,
      width: windowState.value?.bounds.width || 1200,
      height: windowState.value?.bounds.height || 800
    }
  })
  
  emit('window-focus', newWindowId)
}

const saveCurrentLayout = async () => {
  const layoutName = prompt(t('window.layoutNamePrompt'))
  if (layoutName) {
    await windowManager.saveLayout(layoutName)
    // TODO: Show success toast
  }
}

const showLayoutMenu = () => {
  // TODO: Implement layout selection menu
}

const openSettings = async () => {
  if (!windowState.value) return
  
  await windowManager.createTab(windowState.value.id, {
    title: 'Settings',
    type: 'settings'
  })
}

// Window Resizing
const startResize = (direction: string) => {
  if (isMaximized.value) return
  
  resizing.value = direction
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = getResizeCursor(direction)
}

const handleResize = (event: MouseEvent) => {
  if (!resizing.value || !windowState.value) return
  
  const bounds = { ...windowState.value.bounds }
  const { movementX, movementY } = event
  
  switch (resizing.value) {
    case 'n':
      bounds.y += movementY
      bounds.height -= movementY
      break
    case 's':
      bounds.height += movementY
      break
    case 'e':
      bounds.width += movementX
      break
    case 'w':
      bounds.x += movementX
      bounds.width -= movementX
      break
    case 'nw':
      bounds.x += movementX
      bounds.y += movementY
      bounds.width -= movementX
      bounds.height -= movementY
      break
    case 'ne':
      bounds.y += movementY
      bounds.width += movementX
      bounds.height -= movementY
      break
    case 'sw':
      bounds.x += movementX
      bounds.width -= movementX
      bounds.height += movementY
      break
    case 'se':
      bounds.width += movementX
      bounds.height += movementY
      break
  }
  
  // Enforce minimum size
  bounds.width = Math.max(bounds.width, 400)
  bounds.height = Math.max(bounds.height, 300)
  
  windowManager.setWindowBounds(windowState.value.id, bounds)
}

const stopResize = () => {
  resizing.value = null
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
}

const getResizeCursor = (direction: string): string => {
  const cursors: Record<string, string> = {
    n: 'ns-resize',
    s: 'ns-resize',
    e: 'ew-resize',
    w: 'ew-resize',
    nw: 'nw-resize',
    ne: 'ne-resize',
    sw: 'sw-resize',
    se: 'se-resize'
  }
  return cursors[direction] || 'default'
}

// Time update
const updateTime = () => {
  currentTime.value = new Date()
}

// Event Listeners
const setupEventListeners = () => {
  // Window manager events
  windowManager.on('window-bounds-changed', (windowId, bounds) => {
    if (windowState.value?.id === windowId) {
      loadWindowState()
    }
  })
  
  windowManager.on('tab-created', (windowId, tab) => {
    if (windowState.value?.id === windowId) {
      loadWindowState()
    }
  })
  
  windowManager.on('tab-closed', (windowId, tabId) => {
    if (windowState.value?.id === windowId) {
      loadWindowState()
    }
  })
  
  windowManager.on('tab-switched', (windowId, tabId) => {
    if (windowState.value?.id === windowId) {
      loadWindowState()
      emit('tab-change', windowId, tabId)
    }
  })
}

// Lifecycle
onMounted(async () => {
  await loadWindowState()
  setupEventListeners()
  
  // Update time every second
  const timeInterval = setInterval(updateTime, 1000)
  
  onUnmounted(() => {
    clearInterval(timeInterval)
  })
})

// Watch for window ID changes
watch(() => props.windowId, async () => {
  await loadWindowState()
})

// Expose methods
defineExpose({
  loadWindowState,
  createNewWindow,
  getWindowState: () => windowState.value,
  getActiveTab: () => activeTab.value
})
</script>

<style scoped>
.window {
  @apply flex flex-col h-full bg-background text-foreground;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.window-maximized {
  border-radius: 0;
}

.window-focused {
  @apply ring-2 ring-primary/20;
}

/* Window Header */
.window-header {
  @apply flex items-center justify-between bg-background/95 backdrop-blur-sm border-b border-border;
  height: 36px;
  padding: 0 12px;
  user-select: none;
  -webkit-app-region: drag;
}

.window-controls {
  @apply flex items-center gap-2;
  -webkit-app-region: no-drag;
}

.control-btn {
  @apply w-3 h-3 rounded-full flex items-center justify-center transition-all;
  border: none;
  cursor: pointer;
}

.minimize-btn {
  @apply bg-yellow-400 hover:bg-yellow-500;
}

.maximize-btn {
  @apply bg-green-400 hover:bg-green-500;
}

.close-btn {
  @apply bg-red-400 hover:bg-red-500;
}

.control-btn:hover svg {
  @apply opacity-100;
}

.control-btn svg {
  @apply opacity-0 transition-opacity;
  color: rgba(0, 0, 0, 0.6);
}

.window-title {
  @apply flex-1 flex items-center justify-center gap-2;
  pointer-events: none;
}

.window-title h1 {
  @apply text-sm font-medium truncate;
  max-width: 300px;
}

.modified-indicator {
  @apply text-orange-500 font-bold;
  font-size: 14px;
}

.window-actions {
  @apply flex items-center gap-2;
  -webkit-app-region: no-drag;
}

.window-menu-btn {
  @apply p-1 rounded hover:bg-accent transition-colors;
}

.settings-btn {
  @apply p-1 rounded hover:bg-accent transition-colors;
}

/* Content Area */
.window-content {
  @apply flex-1 overflow-hidden;
}

.content-with-header {
  height: calc(100% - 36px);
}

.content-with-status {
  height: calc(100% - 24px);
}

.content-with-header.content-with-status {
  height: calc(100% - 60px);
}

/* Empty State */
.empty-state {
  @apply flex items-center justify-center h-full;
}

.empty-content {
  @apply text-center space-y-4;
  max-width: 400px;
}

.empty-icon {
  @apply mx-auto text-muted-foreground/50;
}

.empty-content h2 {
  @apply text-xl font-semibold text-muted-foreground;
}

.empty-content p {
  @apply text-muted-foreground;
}

.add-tab-button {
  @apply flex items-center gap-2 mx-auto px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors;
}

/* Status Bar */
.window-status-bar {
  @apply flex items-center justify-between px-3 py-1 bg-muted/50 border-t border-border text-xs;
  height: 24px;
}

.status-left, .status-right {
  @apply flex items-center gap-3;
}

.status-item {
  @apply flex items-center gap-1 text-muted-foreground;
}

.connection-status.connected {
  @apply text-green-600;
}

.connection-status.disconnected {
  @apply text-red-600;
}

/* Resize Handles */
.resize-handles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.resize-handle {
  position: absolute;
  pointer-events: auto;
  z-index: 10;
}

.resize-n, .resize-s {
  left: 8px;
  right: 8px;
  height: 4px;
}

.resize-n {
  top: -2px;
  cursor: ns-resize;
}

.resize-s {
  bottom: -2px;
  cursor: ns-resize;
}

.resize-e, .resize-w {
  top: 8px;
  bottom: 8px;
  width: 4px;
}

.resize-e {
  right: -2px;
  cursor: ew-resize;
}

.resize-w {
  left: -2px;
  cursor: ew-resize;
}

.resize-nw, .resize-ne, .resize-sw, .resize-se {
  width: 8px;
  height: 8px;
}

.resize-nw {
  top: -2px;
  left: -2px;
  cursor: nw-resize;
}

.resize-ne {
  top: -2px;
  right: -2px;
  cursor: ne-resize;
}

.resize-sw {
  bottom: -2px;
  left: -2px;
  cursor: sw-resize;
}

.resize-se {
  bottom: -2px;
  right: -2px;
  cursor: se-resize;
}

/* Animation for window state changes */
.window {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.window-resizing {
  transition: none;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .window-focused {
    @apply ring-4 ring-primary;
  }
  
  .control-btn svg {
    @apply opacity-100;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .window {
    transition: none;
  }
  
  .control-btn {
    transition: none;
  }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .window-header {
    @apply bg-background/90;
  }
  
  .control-btn svg {
    color: rgba(255, 255, 255, 0.8);
  }
}
</style>
