<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="context-menu-overlay fixed inset-0 z-50"
      @click="$emit('close')"
      @contextmenu.prevent="$emit('close')"
    >
      <div
        ref="menuRef"
        class="context-menu absolute bg-background border border-border rounded-lg shadow-lg py-1 min-w-[160px]"
        :style="menuStyle"
        @click.stop
      >
        <template v-for="(item, index) in items" :key="item.id">
          <!-- Separator -->
          <div v-if="item.separator" class="my-1 h-px bg-border" />

          <!-- Menu Item -->
          <div
            v-else
            class="context-menu-item px-3 py-2 text-sm cursor-pointer flex items-center gap-2 transition-colors"
            :class="{
              'hover:bg-accent': !item.disabled,
              'text-muted-foreground cursor-not-allowed': item.disabled,
              'text-destructive': item.id === 'delete' && !item.disabled
            }"
            @click="handleItemClick(item)"
          >
            <!-- Icon -->
            <component
              v-if="item.icon"
              :is="getIconComponent(item.icon)"
              :size="16"
              class="flex-shrink-0"
            />

            <!-- Label -->
            <span class="flex-1">{{ item.label }}</span>

            <!-- Shortcut -->
            <span v-if="item.shortcut" class="text-xs text-muted-foreground">
              {{ formatShortcut(item.shortcut) }}
            </span>

            <!-- Submenu indicator -->
            <ChevronRight
              v-if="item.submenu && item.submenu.length > 0"
              :size="14"
              class="flex-shrink-0"
            />
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import {
  Edit,
  Trash2,
  Download,
  Copy,
  Eye,
  EyeOff,
  Star,
  Archive,
  MoreHorizontal,
  ChevronRight
} from 'lucide-vue-next'
import type { ContextMenuItem } from '@renderer/src/types'

interface Props {
  x: number
  y: number
  items: ContextMenuItem[]
  visible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: false
})

defineEmits<{
  close: []
  action: [action: () => void]
}>()

const menuRef = ref<HTMLElement>()

// Icon mapping
const iconComponents = {
  edit: Edit,
  trash: Trash2,
  download: Download,
  copy: Copy,
  eye: Eye,
  'eye-off': EyeOff,
  star: Star,
  archive: Archive,
  more: MoreHorizontal
}

const getIconComponent = (iconName: string) => {
  return iconComponents[iconName as keyof typeof iconComponents] || MoreHorizontal
}

// Format keyboard shortcut for display
const formatShortcut = (shortcut: string) => {
  return shortcut
    .replace('cmd+', '⌘')
    .replace('ctrl+', 'Ctrl+')
    .replace('alt+', 'Alt+')
    .replace('shift+', 'Shift+')
    .toUpperCase()
}

// Calculate menu position
const menuStyle = computed(() => {
  const style: Record<string, string> = {
    left: `${props.x}px`,
    top: `${props.y}px`
  }

  return style
})

// Handle item click
const handleItemClick = (item: ContextMenuItem) => {
  if (item.disabled || !item.action) return

  emit('action', item.action)
}

// Position menu to stay within viewport
const positionMenu = async () => {
  if (!menuRef.value || !props.visible) return

  await nextTick()

  const menu = menuRef.value
  const rect = menu.getBoundingClientRect()
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  }

  let { x, y } = props

  // Adjust horizontal position
  if (x + rect.width > viewport.width) {
    x = viewport.width - rect.width - 8
  }
  if (x < 8) {
    x = 8
  }

  // Adjust vertical position
  if (y + rect.height > viewport.height) {
    y = viewport.height - rect.height - 8
  }
  if (y < 8) {
    y = 8
  }

  // Apply adjusted position
  menu.style.left = `${x}px`
  menu.style.top = `${y}px`
}

// Handle escape key
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    emit('close')
  }
}

// Handle clicks outside menu
const handleClickOutside = (event: MouseEvent) => {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    emit('close')
  }
}

// Watch for visibility changes
watch(
  () => props.visible,
  visible => {
    if (visible) {
      nextTick(() => {
        positionMenu()
      })
    }
  }
)

// Setup event listeners
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.context-menu-overlay {
  background: transparent;
}

.context-menu {
  animation: contextMenuAppear 0.15s ease-out;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

@keyframes contextMenuAppear {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-2px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.context-menu-item {
  position: relative;
}

.context-menu-item:hover {
  background: var(--accent);
}

.context-menu-item.text-destructive:hover {
  background: var(--destructive);
  color: var(--destructive-foreground);
}

/* Focus styles for keyboard navigation */
.context-menu-item:focus {
  outline: none;
  background: var(--accent);
}

.context-menu-item:focus.text-destructive {
  background: var(--destructive);
  color: var(--destructive-foreground);
}

/* Theme variables */
:root {
  --background: hsl(0, 0%, 100%);
  --border: hsl(214, 32%, 91%);
  --accent: hsl(210, 20%, 98%);
  --muted-foreground: hsl(215, 20%, 45%);
  --destructive: hsl(0, 84%, 60%);
  --destructive-foreground: hsl(0, 0%, 100%);
}

:root[data-theme='dark'] {
  --background: hsl(222, 47%, 15%);
  --border: hsl(215, 20%, 25%);
  --accent: hsl(217, 33%, 17%);
  --muted-foreground: hsl(215, 20%, 65%);
  --destructive: hsl(0, 84%, 70%);
  --destructive-foreground: hsl(222, 47%, 11%);
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .context-menu {
    border-width: 2px;
  }

  .context-menu-item:hover {
    outline: 2px solid var(--accent);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .context-menu {
    animation: none;
  }

  .context-menu-item {
    transition: none;
  }
}
</style>
