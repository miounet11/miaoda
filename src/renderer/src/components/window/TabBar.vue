<template>
  <div class="tab-bar" :class="tabBarClasses">
    <!-- Tab List -->
    <div ref="tabListRef" class="tab-list" @wheel="handleWheel">
      <div
        v-for="(tab, index) in tabs"
        :key="tab.id"
        class="tab"
        :class="getTabClasses(tab)"
        @click="selectTab(tab.id)"
        @contextmenu="showTabContextMenu(tab, $event)"
        @mousedown="handleTabMouseDown(tab, $event)"
        :draggable="allowTabDrag"
        @dragstart="handleDragStart(tab, $event)"
        @dragover="handleDragOver($event)"
        @drop="handleDrop(tab, $event)"
      >
        <!-- Tab Icon -->
        <div v-if="tab.icon || getTabIcon(tab)" class="tab-icon">
          <component v-if="tab.icon" :is="tab.icon" :size="14" />
          <component v-else :is="getTabIcon(tab)" :size="14" />
        </div>

        <!-- Tab Title -->
        <div class="tab-title" :title="tab.title">
          {{ tab.title }}
          <span v-if="tab.modified" class="modified-indicator">•</span>
        </div>

        <!-- Tab Actions -->
        <div class="tab-actions">
          <!-- Loading indicator -->
          <div v-if="isTabLoading(tab)" class="tab-loading">
            <Loader :size="12" class="animate-spin" />
          </div>

          <!-- Close button -->
          <button
            v-if="tab.closable"
            @click.stop="closeTab(tab.id)"
            class="tab-close"
            :title="$t('common.close')"
           aria-label="按钮">
            <X :size="12" />
          </button>
        </div>
      </div>

      <!-- Add Tab Button -->
      <button v-if="showAddButton" @click="addTab" class="add-tab-btn" :title="$t('tab.addNew')" aria-label="按钮">
        <Plus :size="14" />
      </button>
    </div>

    <!-- Tab Navigation Buttons -->
    <div v-if="showNavigation" class="tab-navigation">
      <button
        @click="scrollLeft"
        class="nav-btn"
        :disabled="!canScrollLeft"
        :title="$t('tab.scrollLeft')"
       aria-label="按钮">
        <ChevronLeft :size="16" />
      </button>

      <button
        @click="scrollRight"
        class="nav-btn"
        :disabled="!canScrollRight"
        :title="$t('tab.scrollRight')"
       aria-label="按钮">
        <ChevronRight :size="16" />
      </button>
    </div>

    <!-- Tab Menu -->
    <div v-if="showTabMenu" class="tab-menu">
      <button @click="showAllTabsMenu" class="tab-menu-btn" :title="$t('tab.showAll')" aria-label="按钮">
        <MoreHorizontal :size="16" />
      </button>
    </div>

    <!-- Context Menu -->
    <ContextMenu
      v-if="contextMenu.visible"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :items="contextMenu.items"
      @close="hideContextMenu"
      @action="handleContextAction"
    />

    <!-- All Tabs Menu -->
    <div v-if="allTabsMenuVisible" class="all-tabs-menu" @click.self="allTabsMenuVisible = false">
      <div class="all-tabs-menu-content">
        <div class="menu-header">
          <h3>{{ $t('tab.allTabs') }}</h3>
          <button @click="allTabsMenuVisible = false" aria-label="按钮">
            <X :size="16" />
          </button>
        </div>

        <div class="menu-tabs">
          <div
            v-for="tab in tabs"
            :key="tab.id"
            class="menu-tab"
            :class="{ active: tab.id === activeTabId }"
            @click="selectTabAndCloseMenu(tab.id)"
          >
            <component :is="getTabIcon(tab)" :size="14" />
            <span class="menu-tab-title">{{ tab.title }}</span>
            <span v-if="tab.modified" class="modified-indicator">•</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import {
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Loader,
  MessageSquare,
  Settings,
  Wrench,
  Puzzle,
  FileText
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { windowManager, type WindowTab } from '@renderer/src/services/window/WindowManager'
import ContextMenu from '@renderer/src/components/ui/ContextMenu.vue'
import type { ContextMenuItem } from '@renderer/src/types'

// Props
interface Props {
  windowId: string
  tabs: WindowTab[]
  activeTabId: string | null
  allowTabDrag?: boolean
  showAddButton?: boolean
  showNavigation?: boolean
  showTabMenu?: boolean
  maxTabWidth?: number
  minTabWidth?: number
}

const props = withDefaults(defineProps<Props>(), {
  allowTabDrag: true,
  showAddButton: true,
  showNavigation: true,
  showTabMenu: true,
  maxTabWidth: 200,
  minTabWidth: 120
})

// Emits
const emit = defineEmits<{
  'tab-select': [tabId: string]
  'tab-close': [tabId: string]
  'tab-add': []
  'tab-move': [tabId: string, newIndex: number]
  'tab-context': [tab: WindowTab, event: MouseEvent]
}>()

// Composables
const { t } = useI18n()

// Refs
const tabListRef = ref<HTMLElement>()
const scrollPosition = ref(0)
const draggedTab = ref<WindowTab | null>(null)
const dragOverIndex = ref(-1)

// State
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  items: [] as ContextMenuItem[],
  tab: null as WindowTab | null
})
const allTabsMenuVisible = ref(false)
const loadingTabs = ref(new Set<string>())

// Computed
const tabBarClasses = computed(() => ({
  'tab-bar-dragging': draggedTab.value !== null
}))

const canScrollLeft = computed(() => scrollPosition.value > 0)

const canScrollRight = computed(() => {
  if (!tabListRef.value) return false
  const { scrollLeft, scrollWidth, clientWidth } = tabListRef.value
  return scrollLeft < scrollWidth - clientWidth
})

// Methods
const getTabClasses = (tab: WindowTab) => ({
  'tab-active': tab.id === props.activeTabId,
  'tab-modified': tab.modified,
  'tab-loading': loadingTabs.value.has(tab.id),
  'tab-dragging': draggedTab.value?.id === tab.id,
  'tab-drag-over': dragOverIndex.value === props.tabs.indexOf(tab)
})

const getTabIcon = (tab: WindowTab) => {
  switch (tab.type) {
    case 'chat':
      return MessageSquare
    case 'settings':
      return Settings
    case 'tools':
      return Wrench
    case 'plugins':
      return Puzzle
    default:
      return FileText
  }
}

const selectTab = (tabId: string) => {
  windowManager.switchTab(props.windowId, tabId)
  emit('tab-select', tabId)
}

const selectTabAndCloseMenu = (tabId: string) => {
  selectTab(tabId)
  allTabsMenuVisible.value = false
}

const closeTab = (tabId: string) => {
  windowManager.closeTab(props.windowId, tabId)
  emit('tab-close', tabId)
}

const addTab = () => {
  emit('tab-add')
}

const isTabLoading = (tab: WindowTab): boolean => {
  return loadingTabs.value.has(tab.id)
}

const setTabLoading = (tabId: string, loading: boolean) => {
  if (loading) {
    loadingTabs.value.add(tabId)
  } else {
    loadingTabs.value.delete(tabId)
  }
}

// Scrolling
const handleWheel = (event: WheelEvent) => {
  if (!tabListRef.value) return

  event.preventDefault()
  const delta = event.deltaY || event.deltaX
  tabListRef.value.scrollLeft += delta
  scrollPosition.value = tabListRef.value.scrollLeft
}

const scrollLeft = () => {
  if (!tabListRef.value) return

  const scrollAmount = 150
  tabListRef.value.scrollBy({ left: -scrollAmount, behavior: 'smooth' })

  setTimeout(() => {
    scrollPosition.value = tabListRef.value!.scrollLeft
  }, 300)
}

const scrollRight = () => {
  if (!tabListRef.value) return

  const scrollAmount = 150
  tabListRef.value.scrollBy({ left: scrollAmount, behavior: 'smooth' })

  setTimeout(() => {
    scrollPosition.value = tabListRef.value!.scrollLeft
  }, 300)
}

// Context Menu
const showTabContextMenu = (tab: WindowTab, event: MouseEvent) => {
  event.preventDefault()

  const items: ContextMenuItem[] = [
    {
      id: 'duplicate',
      label: t('tab.duplicate'),
      icon: 'copy',
      action: () => duplicateTab(tab)
    },
    {
      id: 'separator1',
      label: '',
      separator: true
    },
    {
      id: 'close',
      label: t('common.close'),
      icon: 'x',
      action: () => closeTab(tab.id),
      disabled: !tab.closable
    },
    {
      id: 'close-others',
      label: t('tab.closeOthers'),
      icon: 'x',
      action: () => closeOtherTabs(tab.id)
    },
    {
      id: 'close-right',
      label: t('tab.closeToRight'),
      icon: 'x',
      action: () => closeTabsToRight(tab.id)
    },
    {
      id: 'separator2',
      label: '',
      separator: true
    },
    {
      id: 'move-to-window',
      label: t('tab.moveToNewWindow'),
      icon: 'external-link',
      action: () => moveTabToNewWindow(tab.id)
    }
  ]

  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    items,
    tab
  }

  emit('tab-context', tab, event)
}

const hideContextMenu = () => {
  contextMenu.value.visible = false
  contextMenu.value.tab = null
}

const handleContextAction = (action: () => void) => {
  action()
  hideContextMenu()
}

// Tab Actions
const duplicateTab = async (tab: WindowTab) => {
  await windowManager.createTab(props.windowId, {
    title: `${tab.title} (Copy)`,
    type: tab.type,
    chatId: tab.chatId,
    data: { ...tab.data }
  })
}

const closeOtherTabs = async (keepTabId: string) => {
  const tabsToClose = props.tabs.filter(tab => tab.id !== keepTabId && tab.closable)

  for (const tab of tabsToClose) {
    await closeTab(tab.id)
  }
}

const closeTabsToRight = async (fromTabId: string) => {
  const fromIndex = props.tabs.findIndex(tab => tab.id === fromTabId)
  if (fromIndex === -1) return

  const tabsToClose = props.tabs.slice(fromIndex + 1).filter(tab => tab.closable)

  for (const tab of tabsToClose) {
    await closeTab(tab.id)
  }
}

const moveTabToNewWindow = async (tabId: string) => {
  const tab = props.tabs.find(t => t.id === tabId)
  if (!tab) return

  // Create new window
  const newWindowId = await windowManager.createWindow({
    title: tab.title,
    tabs: []
  })

  // Move tab to new window
  windowManager.moveTabToWindow(props.windowId, tabId, newWindowId)
}

// Drag and Drop
const handleTabMouseDown = (tab: WindowTab, event: MouseEvent) => {
  // Handle middle click to close tab
  if (event.button === 1 && tab.closable) {
    event.preventDefault()
    closeTab(tab.id)
  }
}

const handleDragStart = (tab: WindowTab, event: DragEvent) => {
  if (!props.allowTabDrag) {
    event.preventDefault()
    return
  }

  draggedTab.value = tab

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', tab.id)
  }
}

const handleDragOver = (event: DragEvent) => {
  if (!draggedTab.value) return

  event.preventDefault()
  event.dataTransfer!.dropEffect = 'move'

  // Calculate drop position
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const midpoint = rect.left + rect.width / 2
  const isAfter = event.clientX > midpoint

  const targetTab = props.tabs.find(
    tab =>
      tab.id === (event.currentTarget as HTMLElement).closest('.tab')?.getAttribute('data-tab-id')
  )

  if (targetTab) {
    const targetIndex = props.tabs.indexOf(targetTab)
    dragOverIndex.value = isAfter ? targetIndex + 1 : targetIndex
  }
}

const handleDrop = (targetTab: WindowTab, event: DragEvent) => {
  event.preventDefault()

  if (!draggedTab.value || draggedTab.value.id === targetTab.id) {
    draggedTab.value = null
    dragOverIndex.value = -1
    return
  }

  const sourceIndex = props.tabs.findIndex(tab => tab.id === draggedTab.value!.id)
  const targetIndex = props.tabs.findIndex(tab => tab.id === targetTab.id)

  if (sourceIndex !== -1 && targetIndex !== -1) {
    // Calculate new index based on drop position
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const midpoint = rect.left + rect.width / 2
    const isAfter = event.clientX > midpoint
    const newIndex = isAfter ? targetIndex + 1 : targetIndex

    windowManager.moveTab(props.windowId, draggedTab.value.id, newIndex)
    emit('tab-move', draggedTab.value.id, newIndex)
  }

  draggedTab.value = null
  dragOverIndex.value = -1
}

// All Tabs Menu
const showAllTabsMenu = () => {
  allTabsMenuVisible.value = true
}

// Keyboard Shortcuts
const handleKeyDown = (event: KeyboardEvent) => {
  const { key, ctrlKey, metaKey, shiftKey } = event
  const cmd = ctrlKey || metaKey

  // Ctrl/Cmd + T: New tab
  if (cmd && key === 't') {
    event.preventDefault()
    addTab()
    return
  }

  // Ctrl/Cmd + W: Close tab
  if (cmd && key === 'w') {
    event.preventDefault()
    if (props.activeTabId) {
      closeTab(props.activeTabId)
    }
    return
  }

  // Ctrl/Cmd + Shift + T: Reopen closed tab
  if (cmd && shiftKey && key === 'T') {
    event.preventDefault()
    // TODO: Implement reopen closed tab
    return
  }

  // Ctrl/Cmd + 1-9: Switch to tab by index
  if (cmd && key >= '1' && key <= '9') {
    event.preventDefault()
    const index = parseInt(key) - 1
    if (index < props.tabs.length) {
      selectTab(props.tabs[index].id)
    }
    return
  }

  // Ctrl/Cmd + Tab: Next tab
  if (cmd && key === 'Tab' && !shiftKey) {
    event.preventDefault()
    const currentIndex = props.tabs.findIndex(tab => tab.id === props.activeTabId)
    const nextIndex = (currentIndex + 1) % props.tabs.length
    selectTab(props.tabs[nextIndex].id)
    return
  }

  // Ctrl/Cmd + Shift + Tab: Previous tab
  if (cmd && key === 'Tab' && shiftKey) {
    event.preventDefault()
    const currentIndex = props.tabs.findIndex(tab => tab.id === props.activeTabId)
    const prevIndex = currentIndex === 0 ? props.tabs.length - 1 : currentIndex - 1
    selectTab(props.tabs[prevIndex].id)
    return
  }
}

// Auto-scroll to active tab
const scrollToActiveTab = async () => {
  if (!tabListRef.value || !props.activeTabId) return

  await nextTick()

  const activeTabElement = tabListRef.value.querySelector(
    `[data-tab-id="${props.activeTabId}"]`
  ) as HTMLElement
  if (!activeTabElement) return

  const containerRect = tabListRef.value.getBoundingClientRect()
  const tabRect = activeTabElement.getBoundingClientRect()

  if (tabRect.left < containerRect.left || tabRect.right > containerRect.right) {
    activeTabElement.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center'
    })
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
  scrollToActiveTab()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})

// Expose methods
defineExpose({
  setTabLoading,
  scrollToActiveTab
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
.container-sm { max-width: var(--breakpoint-sm); }
.container-md { max-width: var(--breakpoint-md); }
.container-lg { max-width: var(--breakpoint-lg); }
.container-xl { max-width: var(--breakpoint-xl); }

/* 响应式显示 */
.hidden-sm { display: none; }
.hidden-md { display: none; }
.hidden-lg { display: none; }

@media (min-width: 640px) {
  .hidden-sm { display: block; }
}

@media (min-width: 768px) {
  .hidden-md { display: block; }
}

@media (min-width: 1024px) {
  .hidden-lg { display: block; }
}

/* 响应式文本 */
.text-responsive-sm { font-size: clamp(0.875rem, 2vw, 1rem); }
.text-responsive-base { font-size: clamp(1rem, 2.5vw, 1.125rem); }
.text-responsive-lg { font-size: clamp(1.125rem, 3vw, 1.25rem); }
.text-responsive-xl { font-size: clamp(1.25rem, 3.5vw, 1.5rem); }

/* 响应式间距 */
.space-responsive-sm { gap: clamp(0.5rem, 2vw, 1rem); }
.space-responsive-md { gap: clamp(1rem, 3vw, 1.5rem); }
.space-responsive-lg { gap: clamp(1.5rem, 4vw, 2rem); }

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
  .flex-col-mobile { flex-direction: column; }
  .grid-1-mobile { grid-template-columns: 1fr; }
  .gap-2-mobile { gap: var(--space-2); }
  .p-4-mobile { padding: var(--space-4); }
}

@media (max-width: 768px) {
  .flex-col-tablet { flex-direction: column; }
  .grid-2-tablet { grid-template-columns: repeat(2, 1fr); }
  .gap-4-tablet { gap: var(--space-4); }
  .p-6-tablet { padding: var(--space-6); }
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

.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

.grid-gap-2 { gap: var(--space-2); }
.grid-gap-4 { gap: var(--space-4); }
.grid-gap-6 { gap: var(--space-6); }

/* 🎨 卡片布局 */
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.card-interactive:hover {
  cursor: pointer;
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1);
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

  .hidden-mobile { display: none; }
  .flex-mobile-col { flex-direction: column; }
  .grid-mobile-1 { grid-template-columns: 1fr; }
}

/* 🎨 完整间距系统 - 基于4px网格 */
:root {
  --space-0: 0;
  --space-1: 0.25rem;    /* 4px */
  --space-2: 0.5rem;     /* 8px */
  --space-3: 0.75rem;    /* 12px */
  --space-4: 1rem;       /* 16px */
  --space-5: 1.25rem;    /* 20px */
  --space-6: 1.5rem;     /* 24px */
  --space-8: 2rem;       /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */
  --space-20: 5rem;      /* 80px */
  --space-24: 6rem;      /* 96px */
  --space-32: 8rem;      /* 128px */

  /* 负间距 */
  --space-neg-1: -0.25rem;
  --space-neg-2: -0.5rem;
  --space-neg-4: -1rem;
}

/* 🎨 间距实用类 */
.m-1 { margin: var(--space-1); }
.m-2 { margin: var(--space-2); }
.m-3 { margin: var(--space-3); }
.m-4 { margin: var(--space-4); }
.m-6 { margin: var(--space-6); }
.m-8 { margin: var(--space-8); }

.p-1 { padding: var(--space-1); }
.p-2 { padding: var(--space-2); }
.p-3 { padding: var(--space-3); }
.p-4 { padding: var(--space-4); }
.p-6 { padding: var(--space-6); }
.p-8 { padding: var(--space-8); }

.mx-auto { margin-left: auto; margin-right: auto; }
.my-auto { margin-top: auto; margin-bottom: auto; }

.px-1 { padding-left: var(--space-1); padding-right: var(--space-1); }
.px-2 { padding-left: var(--space-2); padding-right: var(--space-2); }
.px-3 { padding-left: var(--space-3); padding-right: var(--space-3); }
.px-4 { padding-left: var(--space-4); padding-right: var(--space-4); }
.px-6 { padding-left: var(--space-6); padding-right: var(--space-6); }

.py-1 { padding-top: var(--space-1); padding-bottom: var(--space-1); }
.py-2 { padding-top: var(--space-2); padding-bottom: var(--space-2); }
.py-3 { padding-top: var(--space-3); padding-bottom: var(--space-3); }
.py-4 { padding-top: var(--space-4); padding-bottom: var(--space-4); }
.py-6 { padding-top: var(--space-6); padding-bottom: var(--space-6); }

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

.stack-sm > * + * { margin-top: var(--space-2); }
.stack-md > * + * { margin-top: var(--space-4); }
.stack-lg > * + * { margin-top: var(--space-6); }
.stack-xl > * + * { margin-top: var(--space-8); }

.inline-sm > * + * { margin-left: var(--space-2); }
.inline-md > * + * { margin-left: var(--space-4); }
.inline-lg > * + * { margin-left: var(--space-6); }

/* 🎨 完整字体系统 */
:root {
  /* 字体族 */
  --font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', 'Source Code Pro', monospace;

  /* 字体大小 - 基于1.25的倍数比例 */
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-3xl: 1.875rem;  /* 30px */
  --font-size-4xl: 2.25rem;   /* 36px */
  --font-size-5xl: 3rem;      /* 48px */

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
.font-sans { font-family: var(--font-family-sans); }
.font-mono { font-family: var(--font-family-mono); }

.text-xs { font-size: var(--font-size-xs); line-height: var(--line-height-tight); }
.text-sm { font-size: var(--font-size-sm); line-height: var(--line-height-snug); }
.text-base { font-size: var(--font-size-base); line-height: var(--line-height-normal); }
.text-lg { font-size: var(--font-size-lg); line-height: var(--line-height-relaxed); }
.text-xl { font-size: var(--font-size-xl); line-height: var(--line-height-relaxed); }
.text-2xl { font-size: var(--font-size-2xl); line-height: var(--line-height-loose); }
.text-3xl { font-size: var(--font-size-3xl); line-height: var(--line-height-loose); }

.font-thin { font-weight: var(--font-weight-thin); }
.font-light { font-weight: var(--font-weight-light); }
.font-normal { font-weight: var(--font-weight-normal); }
.font-medium { font-weight: var(--font-weight-medium); }
.font-semibold { font-weight: var(--font-weight-semibold); }
.font-bold { font-weight: var(--font-weight-bold); }

.leading-tight { line-height: var(--line-height-tight); }
.leading-snug { line-height: var(--line-height-snug); }
.leading-normal { line-height: var(--line-height-normal); }
.leading-relaxed { line-height: var(--line-height-relaxed); }

.tracking-tight { letter-spacing: var(--letter-spacing-tight); }
.tracking-normal { letter-spacing: var(--letter-spacing-normal); }
.tracking-wide { letter-spacing: var(--letter-spacing-wide); }

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
.text-primary { color: var(--color-primary); }
.text-success { color: var(--color-success); }
.text-warning { color: var(--color-warning); }
.text-error { color: var(--color-error); }
.text-gray-500 { color: var(--color-gray-500); }
.text-gray-600 { color: var(--color-gray-600); }
.text-gray-700 { color: var(--color-gray-700); }

.bg-primary { background-color: var(--color-primary); }
.bg-primary-hover:hover { background-color: var(--color-primary-hover); }
.bg-success { background-color: var(--color-success); }
.bg-warning { background-color: var(--color-warning); }
.bg-error { background-color: var(--color-error); }

.border-primary { border-color: var(--color-primary); }
.border-success { border-color: var(--color-success); }
.border-error { border-color: var(--color-error); }

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
.tab-bar {
  @apply flex items-center bg-background border-b border-border;
  height: 40px;
  user-select: none;
}

.tab-list {
  @apply flex-1 flex items-center overflow-x-auto overflow-y-hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.tab-list::-webkit-scrollbar {
  display: none;
}

.tab {
  @apply flex items-center gap-2 px-3 py-2 border-r border-border cursor-pointer transition-all duration-200;
  min-width: v-bind('minTabWidth + "px"');
  max-width: v-bind('maxTabWidth + "px"');
  height: 40px;
  position: relative;
}

.tab:hover {
  @apply bg-accent/50;
}

.tab-active {
  @apply bg-accent border-b-2 border-b-primary;
}

.tab-modified {
  @apply bg-yellow-50 dark:bg-yellow-950/20;
}

.tab-loading {
  @apply opacity-75;
}

.tab-dragging {
  @apply opacity-50 transform scale-95;
}

.tab-drag-over::before {
  content: '';
  @apply absolute left-0 top-0 w-1 h-full bg-primary;
}

.tab-icon {
  @apply flex-shrink-0 text-muted-foreground;
}

.tab-active .tab-icon {
  @apply text-primary;
}

.tab-title {
  @apply flex-1 truncate text-sm font-medium;
  display: flex;
  align-items: center;
  gap: 4px;
}

.modified-indicator {
  @apply text-orange-500 font-bold;
  font-size: 16px;
  line-height: 1;
}

.tab-actions {
  @apply flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity;
}

.tab:hover .tab-actions {
  @apply opacity-100;
}

.tab-loading {
  @apply text-blue-500;
}

.tab-close {
  @apply p-1 rounded hover:bg-accent transition-colors;
}

.tab-close:hover {
  @apply bg-red-100 dark:bg-red-900/20 text-red-600;
}

.add-tab-btn {
  @apply p-2 hover:bg-accent transition-colors flex-shrink-0;
}

.tab-navigation {
  @apply flex items-center border-l border-border;
}

.nav-btn {
  @apply p-2 hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

.tab-menu {
  @apply border-l border-border;
}

.tab-menu-btn {
  @apply p-2 hover:bg-accent transition-colors;
}

.all-tabs-menu {
  @apply fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center;
}

.all-tabs-menu-content {
  @apply bg-background border border-border rounded-lg shadow-lg max-w-md w-full mx-4;
}

.menu-header {
  @apply flex items-center justify-between p-4 border-b border-border;
}

.menu-header h3 {
  @apply font-semibold;
}

.menu-tabs {
  @apply max-h-96 overflow-y-auto;
}

.menu-tab {
  @apply flex items-center gap-3 p-3 hover:bg-accent cursor-pointer transition-colors;
}

.menu-tab.active {
  @apply bg-primary/10 text-primary;
}

.menu-tab-title {
  @apply flex-1 truncate;
}

/* Drag and drop visual feedback */
.tab-bar-dragging .tab {
  @apply transition-transform duration-200;
}

.tab-bar-dragging .tab-drag-over {
  @apply transform translate-x-1;
}

/* Responsive */
@media (max-width: 768px) {
  .tab {
    min-width: 100px;
    max-width: 150px;
  }

  .tab-title {
    @apply text-xs;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .tab-active {
    @apply border-b-4;
  }

  .tab:focus {
    @apply ring-2 ring-primary;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .tab {
    @apply transition-none;
  }

  .tab-actions {
    @apply opacity-100;
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
  transition: width 0.3s ease, height 0.3s ease;
}

.btn-primary:active::before {
  width: 300px;
  height: 300px;
}

/* 悬停效果 */
.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 加载动画 */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-in {
  animation: fade-in 0.3s ease-out;
}

/* 成功状态动画 */
@keyframes success-bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

.success-animation {
  animation: success-bounce 1s ease;
}</style>
