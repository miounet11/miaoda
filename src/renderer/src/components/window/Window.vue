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
          aria-label="按钮"
        >
          <Minus :size="12" />
        </button>
        <button
          @click="toggleMaximize"
          class="control-btn maximize-btn"
          :title="isMaximized ? t('window.restore') : t('window.maximize')"
          aria-label="按钮"
        >
          <Square :size="12" v-if="!isMaximized" />
          <Copy :size="12" v-else />
        </button>
        <button
          @click="closeWindow"
          class="control-btn close-btn"
          :title="t('window.close')"
          aria-label="按钮"
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
          aria-label="按钮"
        >
          <Settings :size="16" />
        </button>
        <button
          @click="showWindowMenu"
          class="window-menu-btn"
          :title="t('window.menu')"
          aria-label="按钮"
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
          <button @click="handleTabAdd" class="add-tab-button" aria-label="按钮">
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
        <span
          v-if="connectionStatus"
          class="status-item connection-status"
          :class="connectionStatus"
        >
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
  Minus,
  Square,
  Copy,
  X,
  MoreHorizontal,
  Plus,
  FileText,
  Wifi,
  WifiOff,
  Settings
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import {
  windowManager,
  type WindowState,
  type WindowTab
} from '@renderer/src/services/window/WindowManager'
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
watch(
  () => props.windowId,
  async () => {
    await loadWindowState()
  }
)

// Expose methods
defineExpose({
  loadWindowState,
  createNewWindow,
  getWindowState: () => windowState.value,
  getActiveTab: () => activeTab.value
})
</script>

<style scoped>
/* 🎨 响应式设计系统 */
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}

/* 🎨 响应式实用类 */
.container-sm {
  max-width: var(--breakpoint-sm);
}
.container-md {
  max-width: var(--breakpoint-md);
}
.container-lg {
  max-width: var(--breakpoint-lg);
}
.container-xl {
  max-width: var(--breakpoint-xl);
}

/* 响应式显示 */
.hidden-sm {
  display: none;
}
.hidden-md {
  display: none;
}
.hidden-lg {
  display: none;
}

@media (min-width: 640px) {
  .hidden-sm {
    display: block;
  }
}

@media (min-width: 768px) {
  .hidden-md {
    display: block;
  }
}

@media (min-width: 1024px) {
  .hidden-lg {
    display: block;
  }
}

/* 响应式文本 */
.text-responsive-sm {
  font-size: clamp(0.875rem, 2vw, 1rem);
}
.text-responsive-base {
  font-size: clamp(1rem, 2.5vw, 1.125rem);
}
.text-responsive-lg {
  font-size: clamp(1.125rem, 3vw, 1.25rem);
}
.text-responsive-xl {
  font-size: clamp(1.25rem, 3.5vw, 1.5rem);
}

/* 响应式间距 */
.space-responsive-sm {
  gap: clamp(0.5rem, 2vw, 1rem);
}
.space-responsive-md {
  gap: clamp(1rem, 3vw, 1.5rem);
}
.space-responsive-lg {
  gap: clamp(1.5rem, 4vw, 2rem);
}

/* 响应式网格 */
.grid-responsive-sm {
  grid-template-columns: repeat(auto-fit, minmax(clamp(200px, 25vw, 300px), 1fr));
}

.grid-responsive-md {
  grid-template-columns: repeat(auto-fit, minmax(clamp(250px, 30vw, 350px), 1fr));
}

.grid-responsive-lg {
  grid-template-columns: repeat(auto-fit, minmax(clamp(300px, 35vw, 400px), 1fr));
}

/* 响应式布局调整 */
@media (max-width: 640px) {
  .flex-col-mobile {
    flex-direction: column;
  }
  .grid-1-mobile {
    grid-template-columns: 1fr;
  }
  .gap-2-mobile {
    gap: var(--space-2);
  }
  .p-4-mobile {
    padding: var(--space-4);
  }
}

@media (max-width: 768px) {
  .flex-col-tablet {
    flex-direction: column;
  }
  .grid-2-tablet {
    grid-template-columns: repeat(2, 1fr);
  }
  .gap-4-tablet {
    gap: var(--space-4);
  }
  .p-6-tablet {
    padding: var(--space-6);
  }
}

@media (max-width: 1024px) {
  .sidebar-layout {
    grid-template-columns: 1fr;
  }
  .sidebar {
    position: static;
  }
}

/* 🎨 现代布局系统 */
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.flex-start {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.flex-end {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.flex-col {
  display: flex;
  flex-direction: column;
}

.flex-wrap {
  display: flex;
  flex-wrap: wrap;
}

/* 🎨 网格系统 */
.grid-auto-fit {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-4);
}

.grid-auto-fill {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-4);
}

.grid-cols-2 {
  grid-template-columns: repeat(2, 1fr);
}
.grid-cols-3 {
  grid-template-columns: repeat(3, 1fr);
}
.grid-cols-4 {
  grid-template-columns: repeat(4, 1fr);
}

.grid-gap-2 {
  gap: var(--space-2);
}
.grid-gap-4 {
  gap: var(--space-4);
}
.grid-gap-6 {
  gap: var(--space-6);
}

/* 🎨 卡片布局 */
.card {
  background: white;
  border-radius: 12px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.06);
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.card:hover {
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.1),
    0 2px 4px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.card-interactive:hover {
  cursor: pointer;
  transform: translateY(-2px);
  box-shadow:
    0 10px 25px rgba(0, 0, 0, 0.15),
    0 4px 10px rgba(0, 0, 0, 0.1);
}

/* 🎨 页面布局 */
.page-layout {
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr auto;
}

.page-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: white;
  border-bottom: 1px solid var(--color-gray-200);
}

.page-main {
  padding: var(--space-6) 0;
}

.page-footer {
  border-top: 1px solid var(--color-gray-200);
  background: var(--color-gray-50);
}

/* 🎨 侧边栏布局 */
.sidebar-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--space-6);
}

.sidebar {
  position: sticky;
  top: var(--space-6);
  height: fit-content;
}

.sidebar-content {
  padding: var(--space-6);
  background: white;
  border-radius: 12px;
  border: 1px solid var(--color-gray-200);
}

/* 🎨 响应式工具 */
@media (max-width: 768px) {
  .sidebar-layout {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }

  .hidden-mobile {
    display: none;
  }
  .flex-mobile-col {
    flex-direction: column;
  }
  .grid-mobile-1 {
    grid-template-columns: 1fr;
  }
}

/* 🎨 完整间距系统 - 基于4px网格 */
:root {
  --space-0: 0;
  --space-1: 0.25rem; /* 4px */
  --space-2: 0.5rem; /* 8px */
  --space-3: 0.75rem; /* 12px */
  --space-4: 1rem; /* 16px */
  --space-5: 1.25rem; /* 20px */
  --space-6: 1.5rem; /* 24px */
  --space-8: 2rem; /* 32px */
  --space-10: 2.5rem; /* 40px */
  --space-12: 3rem; /* 48px */
  --space-16: 4rem; /* 64px */
  --space-20: 5rem; /* 80px */
  --space-24: 6rem; /* 96px */
  --space-32: 8rem; /* 128px */

  /* 负间距 */
  --space-neg-1: -0.25rem;
  --space-neg-2: -0.5rem;
  --space-neg-4: -1rem;
}

/* 🎨 间距实用类 */
.m-1 {
  margin: var(--space-1);
}
.m-2 {
  margin: var(--space-2);
}
.m-3 {
  margin: var(--space-3);
}
.m-4 {
  margin: var(--space-4);
}
.m-6 {
  margin: var(--space-6);
}
.m-8 {
  margin: var(--space-8);
}

.p-1 {
  padding: var(--space-1);
}
.p-2 {
  padding: var(--space-2);
}
.p-3 {
  padding: var(--space-3);
}
.p-4 {
  padding: var(--space-4);
}
.p-6 {
  padding: var(--space-6);
}
.p-8 {
  padding: var(--space-8);
}

.mx-auto {
  margin-left: auto;
  margin-right: auto;
}
.my-auto {
  margin-top: auto;
  margin-bottom: auto;
}

.px-1 {
  padding-left: var(--space-1);
  padding-right: var(--space-1);
}
.px-2 {
  padding-left: var(--space-2);
  padding-right: var(--space-2);
}
.px-3 {
  padding-left: var(--space-3);
  padding-right: var(--space-3);
}
.px-4 {
  padding-left: var(--space-4);
  padding-right: var(--space-4);
}
.px-6 {
  padding-left: var(--space-6);
  padding-right: var(--space-6);
}

.py-1 {
  padding-top: var(--space-1);
  padding-bottom: var(--space-1);
}
.py-2 {
  padding-top: var(--space-2);
  padding-bottom: var(--space-2);
}
.py-3 {
  padding-top: var(--space-3);
  padding-bottom: var(--space-3);
}
.py-4 {
  padding-top: var(--space-4);
  padding-bottom: var(--space-4);
}
.py-6 {
  padding-top: var(--space-6);
  padding-bottom: var(--space-6);
}

/* 🎨 容器和布局间距 */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding-left: var(--space-4);
  padding-right: var(--space-4);
}

.section-spacing {
  padding-top: var(--space-12);
  padding-bottom: var(--space-12);
}

.card-spacing {
  padding: var(--space-6);
}

.stack-sm > * + * {
  margin-top: var(--space-2);
}
.stack-md > * + * {
  margin-top: var(--space-4);
}
.stack-lg > * + * {
  margin-top: var(--space-6);
}
.stack-xl > * + * {
  margin-top: var(--space-8);
}

.inline-sm > * + * {
  margin-left: var(--space-2);
}
.inline-md > * + * {
  margin-left: var(--space-4);
}
.inline-lg > * + * {
  margin-left: var(--space-6);
}

/* 🎨 完整字体系统 */
:root {
  /* 字体族 */
  --font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', 'Source Code Pro', monospace;

  /* 字体大小 - 基于1.25的倍数比例 */
  --font-size-xs: 0.75rem; /* 12px */
  --font-size-sm: 0.875rem; /* 14px */
  --font-size-base: 1rem; /* 16px */
  --font-size-lg: 1.125rem; /* 18px */
  --font-size-xl: 1.25rem; /* 20px */
  --font-size-2xl: 1.5rem; /* 24px */
  --font-size-3xl: 1.875rem; /* 30px */
  --font-size-4xl: 2.25rem; /* 36px */
  --font-size-5xl: 3rem; /* 48px */

  /* 字体权重 */
  --font-weight-thin: 100;
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;

  /* 行高 */
  --line-height-tight: 1.25;
  --line-height-snug: 1.375;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.625;
  --line-height-loose: 2;

  /* 字母间距 */
  --letter-spacing-tighter: -0.05em;
  --letter-spacing-tight: -0.025em;
  --letter-spacing-normal: 0;
  --letter-spacing-wide: 0.025em;
  --letter-spacing-wider: 0.05em;
  --letter-spacing-widest: 0.1em;
}

/* 🎨 字体实用类 */
.font-sans {
  font-family: var(--font-family-sans);
}
.font-mono {
  font-family: var(--font-family-mono);
}

.text-xs {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-tight);
}
.text-sm {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-snug);
}
.text-base {
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
}
.text-lg {
  font-size: var(--font-size-lg);
  line-height: var(--line-height-relaxed);
}
.text-xl {
  font-size: var(--font-size-xl);
  line-height: var(--line-height-relaxed);
}
.text-2xl {
  font-size: var(--font-size-2xl);
  line-height: var(--line-height-loose);
}
.text-3xl {
  font-size: var(--font-size-3xl);
  line-height: var(--line-height-loose);
}

.font-thin {
  font-weight: var(--font-weight-thin);
}
.font-light {
  font-weight: var(--font-weight-light);
}
.font-normal {
  font-weight: var(--font-weight-normal);
}
.font-medium {
  font-weight: var(--font-weight-medium);
}
.font-semibold {
  font-weight: var(--font-weight-semibold);
}
.font-bold {
  font-weight: var(--font-weight-bold);
}

.leading-tight {
  line-height: var(--line-height-tight);
}
.leading-snug {
  line-height: var(--line-height-snug);
}
.leading-normal {
  line-height: var(--line-height-normal);
}
.leading-relaxed {
  line-height: var(--line-height-relaxed);
}

.tracking-tight {
  letter-spacing: var(--letter-spacing-tight);
}
.tracking-normal {
  letter-spacing: var(--letter-spacing-normal);
}
.tracking-wide {
  letter-spacing: var(--letter-spacing-wide);
}

/* 🎨 文本层次优化 */
.heading-1 {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tighter);
  margin-bottom: 1rem;
}

.heading-2 {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tighter);
  margin-bottom: 0.875rem;
}

.heading-3 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-snug);
  letter-spacing: var(--letter-spacing-tight);
  margin-bottom: 0.75rem;
}

.body-large {
  font-size: var(--font-size-lg);
  line-height: var(--line-height-relaxed);
  letter-spacing: var(--letter-spacing-normal);
}

.body-regular {
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-normal);
}

.body-small {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-wide);
}

.caption {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-snug);
  letter-spacing: var(--letter-spacing-wide);
  color: var(--color-gray-600);
}

/* 🎨 高级色彩系统 */
:root {
  /* 基础色彩 */
  --color-primary: hsl(221 83% 53%);
  --color-primary-hover: hsl(221 83% 48%);
  --color-primary-active: hsl(221 83% 43%);

  /* 语义色彩 */
  --color-success: hsl(142 71% 45%);
  --color-warning: hsl(38 92% 50%);
  --color-error: hsl(0 84% 60%);
  --color-info: hsl(217 91% 60%);

  /* 中性色彩 */
  --color-gray-50: hsl(210 20% 98%);
  --color-gray-100: hsl(210 15% 95%);
  --color-gray-200: hsl(210 10% 89%);
  --color-gray-300: hsl(210 8% 75%);
  --color-gray-400: hsl(210 8% 56%);
  --color-gray-500: hsl(210 6% 43%);
  --color-gray-600: hsl(210 8% 35%);
  --color-gray-700: hsl(210 10% 28%);
  --color-gray-800: hsl(210 12% 21%);
  --color-gray-900: hsl(210 15% 15%);

  /* 透明度变体 */
  --color-primary-10: hsl(221 83% 53% / 0.1);
  --color-primary-20: hsl(221 83% 53% / 0.2);
  --color-primary-30: hsl(221 83% 53% / 0.3);
  --color-success-10: hsl(142 71% 45% / 0.1);
  --color-error-10: hsl(0 84% 60% / 0.1);
}

/* 🎨 色彩实用类 */
.text-primary {
  color: var(--color-primary);
}
.text-success {
  color: var(--color-success);
}
.text-warning {
  color: var(--color-warning);
}
.text-error {
  color: var(--color-error);
}
.text-gray-500 {
  color: var(--color-gray-500);
}
.text-gray-600 {
  color: var(--color-gray-600);
}
.text-gray-700 {
  color: var(--color-gray-700);
}

.bg-primary {
  background-color: var(--color-primary);
}
.bg-primary-hover:hover {
  background-color: var(--color-primary-hover);
}
.bg-success {
  background-color: var(--color-success);
}
.bg-warning {
  background-color: var(--color-warning);
}
.bg-error {
  background-color: var(--color-error);
}

.border-primary {
  border-color: var(--color-primary);
}
.border-success {
  border-color: var(--color-success);
}
.border-error {
  border-color: var(--color-error);
}

/* 🎨 对比度增强 */
.high-contrast {
  --color-primary: hsl(221 100% 40%);
  --color-gray-900: hsl(210 20% 10%);
  --color-gray-100: hsl(210 15% 95%);
}

/* 🎨 暗色主题支持 */
@media (prefers-color-scheme: dark) {
  :root {
    --color-gray-50: hsl(210 15% 15%);
    --color-gray-100: hsl(210 12% 21%);
    --color-gray-200: hsl(210 10% 28%);
    --color-gray-300: hsl(210 8% 35%);
    --color-gray-400: hsl(210 6% 43%);
    --color-gray-500: hsl(210 8% 56%);
    --color-gray-600: hsl(210 8% 75%);
    --color-gray-700: hsl(210 10% 89%);
    --color-gray-800: hsl(210 15% 95%);
    --color-gray-900: hsl(210 20% 98%);
  }
}
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

.status-left,
.status-right {
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

.resize-n,
.resize-s {
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

.resize-e,
.resize-w {
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

.resize-nw,
.resize-ne,
.resize-sw,
.resize-se {
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

/* 焦点样式 */
:focus-visible {
  outline: 2px solid hsl(var(--ring, 59 130 230));
  outline-offset: 2px;
}

/* 🎨 微交互和动画 */
.btn-primary {
  position: relative;
  overflow: hidden;
  transition: all 0.2s ease;
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition:
    width 0.3s ease,
    height 0.3s ease;
}

.btn-primary:active::before {
  width: 300px;
  height: 300px;
}

/* 悬停效果 */
.hover-lift {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 加载动画 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid hsl(var(--border));
  border-top: 2px solid hsl(var(--primary));
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 淡入动画 */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fade-in 0.3s ease-out;
}

/* 成功状态动画 */
@keyframes success-bounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

.success-animation {
  animation: success-bounce 1s ease;
}
</style>
