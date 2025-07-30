<template>
  <div class="tab-bar" :class="tabBarClasses">
    <!-- Tab List -->
    <div 
      ref="tabListRef"
      class="tab-list"
      @wheel="handleWheel"
    >
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
          <component 
            v-if="tab.icon"
            :is="tab.icon" 
            :size="14" 
          />
          <component 
            v-else
            :is="getTabIcon(tab)" 
            :size="14" 
          />
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
          >
            <X :size="12" />
          </button>
        </div>
      </div>
      
      <!-- Add Tab Button -->
      <button
        v-if="showAddButton"
        @click="addTab"
        class="add-tab-btn"
        :title="$t('tab.addNew')"
      >
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
      >
        <ChevronLeft :size="16" />
      </button>
      
      <button
        @click="scrollRight"
        class="nav-btn"
        :disabled="!canScrollRight"
        :title="$t('tab.scrollRight')"
      >
        <ChevronRight :size="16" />
      </button>
    </div>
    
    <!-- Tab Menu -->
    <div v-if="showTabMenu" class="tab-menu">
      <button
        @click="showAllTabsMenu"
        class="tab-menu-btn"
        :title="$t('tab.showAll')"
      >
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
    <div 
      v-if="allTabsMenuVisible"
      class="all-tabs-menu"
      @click.self="allTabsMenuVisible = false"
    >
      <div class="all-tabs-menu-content">
        <div class="menu-header">
          <h3>{{ $t('tab.allTabs') }}</h3>
          <button @click="allTabsMenuVisible = false">
            <X :size="16" />
          </button>
        </div>
        
        <div class="menu-tabs">
          <div
            v-for="tab in tabs"
            :key="tab.id"
            class="menu-tab"
            :class="{ 'active': tab.id === activeTabId }"
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
  Plus, X, ChevronLeft, ChevronRight, MoreHorizontal, Loader,
  MessageSquare, Settings, Wrench, Puzzle, FileText
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
  
  const targetTab = props.tabs.find(tab => 
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
  
  const activeTabElement = tabListRef.value.querySelector(`[data-tab-id="${props.activeTabId}"]`) as HTMLElement
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
</style>