<template>
  <div class="chatbox-settings-sidebar h-full flex flex-col" style="background: rgb(16, 16, 20)">
    <!-- Navigation List with exact ChatBox styling -->
    <nav class="chatbox-nav flex-1">
      <ul class="chatbox-nav-list">
        <li v-for="item in navigationItems" :key="item.id">
          <button
            @click="selectSection(item.id)"
            class="chatbox-nav-item"
            :class="{
              'chatbox-nav-active': activeSection === item.id,
              'chatbox-nav-inactive': activeSection !== item.id
            }"
            @mouseover="handleMouseOver"
            @mouseleave="handleMouseLeave"
          >
            <div class="chatbox-nav-icon">
              <component
                :is="item.icon"
                :size="20"
                :style="{
                  width: '1.25rem',
                  height: '1.25rem',
                  color:
                    activeSection === item.id
                      ? 'var(--mantine-color-chatbox-primary-text)'
                      : 'var(--mantine-color-chatbox-secondary-text)'
                }"
              />
            </div>
            <span class="chatbox-nav-label">{{ item.label }}</span>
          </button>
        </li>
      </ul>
    </nav>

    <!-- Footer with ChatBox styling -->
    <div class="chatbox-footer">
      <div class="chatbox-footer-content">
        <div class="chatbox-footer-version">MiaoDa Chat v1.0.0</div>
        <div class="chatbox-footer-copyright">© 2024 MiaoDa</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Settings,
  Palette,
  Shield,
  Database,
  Keyboard,
  Mic,
  Puzzle,
  Info,
  Zap,
  MessageSquare,
  Search
} from 'lucide-vue-next'

interface NavigationItem {
  id: string
  label: string
  icon: any
}

interface Props {
  activeSection: string
}

interface Emits {
  (e: 'section-change', section: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const navigationItems = ref<NavigationItem[]>([
  {
    id: 'general',
    label: '通用',
    icon: Settings
  },
  {
    id: 'models',
    label: '模型提供商',
    icon: Zap
  },
  {
    id: 'chat',
    label: '聊天设置',
    icon: MessageSquare
  },
  {
    id: 'appearance',
    label: '外观',
    icon: Palette
  },
  {
    id: 'websearch',
    label: '网络搜索',
    icon: Search
  },
  {
    id: 'shortcuts',
    label: '快捷键',
    icon: Keyboard
  },
  {
    id: 'privacy',
    label: '隐私',
    icon: Shield
  },
  {
    id: 'voice',
    label: '语音',
    icon: Mic
  },
  {
    id: 'plugins',
    label: '插件',
    icon: Puzzle
  },
  {
    id: 'advanced',
    label: '高级',
    icon: Database
  },
  {
    id: 'about',
    label: '关于',
    icon: Info
  }
])

const selectSection = (sectionId: string) => {
  emit('section-change', sectionId)
}

// Handle hover states for navigation items
const handleMouseOver = (event: MouseEvent) => {
  const target = event.currentTarget as HTMLButtonElement
  const isActive = target.classList.contains('chatbox-nav-active')
  if (!isActive) {
    target.style.backgroundColor = 'var(--mantine-color-chatbox-brand-outline-hover)'
  }
}

const handleMouseLeave = (event: MouseEvent) => {
  const target = event.currentTarget as HTMLButtonElement
  const isActive = target.classList.contains('chatbox-nav-active')
  if (!isActive) {
    target.style.backgroundColor = 'transparent'
  }
}
</script>

<style scoped>
/* ChatBox Settings Sidebar - Exact Styling */
.chatbox-settings-sidebar {
  min-height: 100%;
  background: rgb(16, 16, 20);
  width: 16rem;
  display: flex;
  flex-direction: column;
}

.chatbox-nav {
  padding: var(--mantine-spacing-md) 0;
}

.chatbox-nav-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.chatbox-nav-item {
  display: flex;
  align-items: center;
  width: 100%;
  height: calc(2.5rem * var(--mantine-scale));
  padding: 0.625rem 0.75rem;
  border: none;
  border-radius: 0.375rem;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
  gap: var(--mantine-spacing-xs);
  font-size: var(--mantine-font-size-sm);
  line-height: 1.25;
  margin: 0 var(--mantine-spacing-xs);
}

.chatbox-nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.chatbox-nav-label {
  flex: 1;
  color: inherit;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chatbox-nav-active {
  background: var(--mantine-color-chatbox-brand-light) !important;
  color: var(--mantine-color-chatbox-primary-text) !important;
}

.chatbox-nav-inactive {
  color: var(--mantine-color-chatbox-secondary-text);
}

.chatbox-footer {
  padding: var(--mantine-spacing-md);
  border-top: 1px solid var(--mantine-color-chatbox-border-primary-outline);
  margin-top: auto;
}

.chatbox-footer-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.chatbox-footer-version,
.chatbox-footer-copyright {
  font-size: var(--mantine-font-size-xs);
  color: var(--mantine-color-chatbox-tertiary-text);
  line-height: 1.4;
}

/* Custom scrollbar for sidebar */
.chatbox-settings-sidebar ::-webkit-scrollbar {
  width: 4px;
}

.chatbox-settings-sidebar ::-webkit-scrollbar-track {
  background: transparent;
}

.chatbox-settings-sidebar ::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.chatbox-settings-sidebar ::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Focus styles for accessibility */
.chatbox-nav-item:focus-visible {
  outline: 2px solid var(--mantine-color-chatbox-brand-filled);
  outline-offset: 2px;
}

/* Smooth transitions */
.chatbox-nav-item {
  transition: all 0.15s ease;
}

/* Text truncation for long labels */
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
