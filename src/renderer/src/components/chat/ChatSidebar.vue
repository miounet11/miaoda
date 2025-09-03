<template>
  <aside
    class="chat-sidebar w-64 bg-gradient-to-b from-background to-background/95 backdrop-blur-md border-r border-border/60 flex flex-col transition-all duration-300 ease-out z-50 shadow-sm"
    :class="sidebarClasses"
  >
    <!-- Header -->
    <div class="sidebar-header p-5 border-b border-border/40">
      <div class="flex flex-col gap-4">
        <!-- Quick Search -->
        <div class="relative">
          <Search
            :size="18"
            class="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索对话记录..."
            class="search-input w-full pl-10 pr-4 py-3 bg-secondary/40 border border-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-background/80 focus:border-primary/20 transition-all duration-300 placeholder:text-muted-foreground input-enhanced focus-glow min-h-[44px]"
            style="
              font-family:
                system-ui,
                -apple-system,
                'PingFang SC',
                sans-serif;
              ime-mode: active;
            "
           aria-label="输入框">
        </div>
      </div>
    </div>

    <!-- Chat List -->
    <div class="sidebar-content flex-1 overflow-y-auto p-4 space-y-2">
      <!-- Empty State -->
      <div v-if="filteredChats.length === 0 && !searchQuery" class="empty-state text-center py-12">
        <div
          class="inline-flex items-center justify-center w-12 h-12 mb-3 bg-primary/10 rounded-full"
        >
          <MessageSquare :size="20" class="text-primary/60" />
        </div>
        <p class="text-sm text-muted-foreground font-medium">{{ t('chat.noChatsFound') }}</p>
        <p class="text-xs text-muted-foreground mt-1" style="opacity: 0.8">
          {{ t('chat.selectChat') }}
        </p>
      </div>

      <!-- No Search Results -->
      <div
        v-else-if="filteredChats.length === 0 && searchQuery"
        class="empty-state text-center py-8"
      >
        <Search :size="20" class="mx-auto mb-2 text-muted-foreground/40" />
        <p class="text-sm text-muted-foreground/80">{{ t('search.noResults') }}</p>
        <p class="text-xs text-muted-foreground/60 mt-1">尝试调整搜索关键词</p>
      </div>

      <!-- Chat Items -->
      <TransitionGroup name="chat-list" tag="div" class="space-y-2">
        <div
          v-for="chat in filteredChats"
          :key="chat.id"
          @click="$emit('select-chat', chat.id)"
          :class="[
            'chat-list-item sidebar-item px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-300 relative group border transform hover:scale-[1.01] active:scale-[0.99]',
            currentChatId === chat.id
              ? 'bg-primary/12 border-primary/25 shadow-md ring-1 ring-primary/20 active translate-x-1'
              : 'hover:bg-secondary/50 border-transparent hover:border-border/40 hover:shadow-sm hover:translate-x-2'
          ]"
        >
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0 mt-0.5">
              <div
                :class="[
                  'w-2 h-2 rounded-full transition-all duration-300',
                  currentChatId === chat.id
                    ? 'bg-primary scale-125 animate-pulse'
                    : 'bg-muted-foreground/30'
                ]"
              />
            </div>

            <div class="flex-1 min-w-0">
              <div class="font-semibold text-sm truncate leading-tight mb-1">
                {{ getDisplayTitle(chat) }}
              </div>

              <!-- Chat Preview -->
              <div
                v-if="getLastMessage(chat)"
                class="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-1"
                style="color: hsl(var(--muted-foreground) / 0.9)"
              >
                {{ getLastMessage(chat) }}
              </div>

              <div class="flex items-center justify-between">
                <div class="text-xs font-medium" style="color: hsl(var(--muted-foreground) / 0.8)">
                  {{ formatTime(chat.updatedAt) }}
                </div>

                <!-- Message Count Badge -->
                <div
                  v-if="chat.messageCount && chat.messageCount > 0"
                  class="px-1.5 py-0.5 bg-muted text-muted-foreground text-xs rounded-full font-medium"
                >
                  {{ chat.messageCount }}
                </div>
              </div>
            </div>

            <!-- Context Menu Trigger -->
            <div
              class="flex items-center"
              :class="
                activeContextMenuId === chat.id
                  ? 'opacity-100'
                  : 'opacity-0 group-hover:opacity-100 transition-opacity duration-200'
              "
            >
              <button
                @click.stop="toggleContextMenu(chat.id, $event)"
                :class="[
                  'p-1.5 rounded-lg transition-all duration-200 btn-interactive',
                  activeContextMenuId === chat.id
                    ? 'bg-secondary text-foreground rotate-90'
                    : 'hover:bg-background/70 hover:rotate-90'
                ]"
                title="更多选项"
               aria-label="按钮">
                <MoreVertical :size="14" />
              </button>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- Footer with More Menu -->
    <div class="sidebar-footer p-3 border-t border-border/40 bg-background/80 backdrop-blur-sm">
      <div class="flex items-center justify-between">
        <div class="text-xs font-medium" style="color: hsl(var(--muted-foreground) / 0.8)">
          {{ filteredChats.length }} conversation{{ filteredChats.length !== 1 ? 's' : '' }}
        </div>

        <!-- More Menu -->
        <div class="relative">
          <button
            @click="showMoreMenu = !showMoreMenu"
            :class="[
              'p-2 rounded-lg transition-colors duration-150 flex items-center gap-1',
              showMoreMenu
                ? 'bg-secondary text-foreground'
                : 'hover:bg-secondary/60 text-muted-foreground'
            ]"
            title="更多选项"
           aria-label="按钮">
            <MoreHorizontal :size="16" />
          </button>

          <!-- Dropdown Menu -->
          <Transition name="menu-slide">
            <div
              v-if="showMoreMenu"
              class="absolute bottom-full mb-2 right-0 w-48 bg-background/95 backdrop-blur-md border border-border/60 rounded-xl shadow-xl z-50"
            >
              <div class="p-2">
                <button
                  @click="handleMoreAction('settings')"
                  class="w-full px-3 py-2 text-left hover:bg-secondary/40 rounded-lg transition-colors duration-150 flex items-center gap-3 text-sm"
                 aria-label="按钮">
                  <Settings :size="16" />
                  {{ t('nav.settings') }}
                </button>
                <button
                  @click="handleMoreAction('analytics')"
                  class="w-full px-3 py-2 text-left hover:bg-secondary/40 rounded-lg transition-colors duration-150 flex items-center gap-3 text-sm"
                 aria-label="按钮">
                  <BarChart3 :size="16" />
                  分析统计
                </button>
                <button
                  @click="handleMoreAction('export')"
                  class="w-full px-3 py-2 text-left hover:bg-secondary/40 rounded-lg transition-colors duration-150 flex items-center gap-3 text-sm"
                 aria-label="按钮">
                  <Download :size="16" />
                  {{ t('chat.exportChat') }}
                </button>
                <div class="h-px bg-border/40 my-2" />
                <button
                  @click="handleMoreAction('clear-all')"
                  class="w-full px-3 py-2 text-left hover:bg-destructive/10 text-destructive rounded-lg transition-colors duration-150 flex items-center gap-3 text-sm"
                 aria-label="按钮">
                  <Trash2 :size="16" />
                  {{ t('chat.clearChat') }}
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Plus,
  Settings,
  MessageSquare,
  MoreVertical,
  MoreHorizontal,
  Search,
  BarChart3,
  Download,
  Trash2
} from 'lucide-vue-next'
import { formatDistanceToNow } from '@renderer/src/utils/time'

const { t } = useI18n()

interface Chat {
  id: string
  title: string
  updatedAt: Date
  messageCount?: number
  messages?: Array<{ role: string; content: string }>
}

interface Props {
  chats: Chat[]
  currentChatId?: string
  isMobile: boolean
  sidebarOpen: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'select-chat': [chatId: string]
  'open-settings': []
  'show-context-menu': [chatId: string, event: MouseEvent]
  'clear-all': []
  'open-analytics': []
  'export-chats': []
}>()

// Refs
const searchQuery = ref('')
const showMoreMenu = ref(false)
const activeContextMenuId = ref<string | null>(null)

// Computed
const sidebarClasses = computed(() => ({
  'fixed top-0 left-0 h-full md:relative md:translate-x-0': props.isMobile,
  '-translate-x-full': props.isMobile && !props.sidebarOpen,
  'translate-x-0': !props.isMobile || props.sidebarOpen
}))

const filteredChats = computed(() => {
  if (!searchQuery.value.trim()) return props.chats

  const query = searchQuery.value.toLowerCase()
  return props.chats.filter(
    chat =>
      chat.title.toLowerCase().includes(query) ||
      (chat.messages && chat.messages.some(msg => msg.content.toLowerCase().includes(query)))
  )
})

// Helper to translate chat titles
const getDisplayTitle = (chat: Chat): string => {
  return chat.title === 'New Chat' ? t('chat.newChat') : chat.title
}

// Methods
const formatTime = (date: Date | string | number | undefined) => {
  if (!date) return '未知时间'
  return formatDistanceToNow(date)
}

const getLastMessage = (chat: Chat): string => {
  if (!chat.messages || chat.messages.length === 0) return ''

  // Get the last user message for preview
  const lastMessage = chat.messages
    .slice()
    .reverse()
    .find(msg => msg.role === 'user' || msg.role === 'assistant')

  if (!lastMessage) return ''

  // Truncate long messages and remove markdown
  let content = lastMessage.content
    .replace(/```[\s\S]*?```/g, '[Code]') // Replace code blocks
    .replace(/!\[.*?\]\(.*?\)/g, '[Image]') // Replace images
    .replace(/\[.*?\]\(.*?\)/g, '') // Remove links but keep text
    .replace(/[*_`#]/g, '') // Remove markdown formatting
    .trim()

  return content.length > 80 ? content.substring(0, 80) + '...' : content
}

const toggleContextMenu = (chatId: string, event: MouseEvent) => {
  // If clicking the same chat's menu button, toggle it
  if (activeContextMenuId.value === chatId) {
    activeContextMenuId.value = null
  } else {
    activeContextMenuId.value = chatId
    emit('show-context-menu', chatId, event)
  }
}

const handleMoreAction = (action: string) => {
  showMoreMenu.value = false

  switch (action) {
    case 'settings':
      emit('open-settings')
      break
    case 'analytics':
      emit('open-analytics')
      break
    case 'export':
      emit('export-chats')
      break
    case 'clear-all':
      if (confirm('Are you sure you want to clear all conversations? This cannot be undone.')) {
        emit('clear-all')
      }
      break
  }
}

// Close more menu when clicking outside
const handleClickOutside = (event: Event) => {
  const target = event.target as Element
  if (!target.closest('.relative')) {
    showMoreMenu.value = false
  }
}

// Add click outside listener
if (typeof window !== 'undefined') {
  document.addEventListener('click', handleClickOutside)
}
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
.chat-sidebar {
  -webkit-app-region: no-drag;
}

/* Custom scrollbar for sidebar */
.sidebar-content::-webkit-scrollbar {
  width: 4px;
}

.sidebar-content::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-content::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.2);
  border-radius: 6px;
}

.sidebar-content::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.4);
}

/* === MICRO-INTERACTIONS === */

/* Chat item animations with subtle micro-interactions */
.chat-item {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, box-shadow, border-color;
}

.chat-item:hover {
  transform: translateX(3px) translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.chat-item:active {
  transform: translateX(2px) translateY(0px) scale(0.98);
  transition-duration: 0.1s;
}

/* Active state with breathing animation */
.chat-item:has(.bg-primary\\/15) {
  animation: gentle-pulse 3s ease-in-out infinite;
}

@keyframes gentle-pulse {
  0%,
  100% {
    box-shadow: 0 2px 8px rgba(var(--primary-rgb), 0.1);
  }
  50% {
    box-shadow: 0 4px 16px rgba(var(--primary-rgb), 0.15);
  }
}

/* Button micro-interactions */
button {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, box-shadow;
}

button:hover {
  transform: scale(1.05);
}

button:active {
  transform: scale(0.95);
  transition-duration: 0.1s;
}

/* New Chat button special animation */
.sidebar-header button:first-child {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-header button:first-child:hover {
  transform: scale(1.02) translateY(-1px);
  box-shadow: 0 8px 25px rgba(var(--primary-rgb), 0.25);
}

.sidebar-header button:first-child:active {
  transform: scale(0.98) translateY(0px);
}

/* Search input focus animation */
.sidebar-header input {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-header input:focus {
  transform: scale(1.02);
  box-shadow: 0 4px 20px rgba(var(--primary-rgb), 0.15);
}

/* === TRANSITION ANIMATIONS === */

/* Chat list transitions */
.chat-list-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.chat-list-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.8, 1);
}

.chat-list-enter-from {
  opacity: 0;
  transform: translateX(-20px) scale(0.95);
}

.chat-list-leave-to {
  opacity: 0;
  transform: translateX(20px) scale(0.95);
}

.chat-list-move {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Menu slide animation */
.menu-slide-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.menu-slide-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 1, 1);
}

.menu-slide-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.9);
}

.menu-slide-leave-to {
  opacity: 0;
  transform: translateY(5px) scale(0.95);
}

/* Empty state animation with stagger */
.empty-state {
  animation: fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeIn {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  60% {
    transform: translateY(-5px) scale(1.02);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* === ENHANCED VISUAL FEEDBACK === */

/* Loading states */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.loading-shimmer {
  background: linear-gradient(90deg, transparent 25%, hsl(var(--muted) / 0.5) 50%, transparent 75%);
  background-size: 200% 100%;
  animation: shimmer 2s infinite linear;
}

/* Icon animations */
@keyframes icon-bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-2px);
  }
}

.animate-in {
  animation: icon-bounce 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

/* More menu button rotation */
.sidebar-footer .relative > button {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-footer .relative > button[class*='bg-secondary'] {
  transform: rotate(90deg);
}

/* === TEXT ANIMATIONS === */

/* Text clamp animations */
.line-clamp-1,
.line-clamp-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-1 {
  -webkit-line-clamp: 1;
}

.line-clamp-2 {
  -webkit-line-clamp: 2;
}

/* === ACCESSIBILITY === */

/* Focus states for accessibility */
.chat-item:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
  border-radius: 12px;
}

button:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}

input:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .chat-item:hover {
    transform: none;
  }

  button:hover {
    transform: none;
  }
}

/* === RESPONSIVE TOUCH TARGETS === */

/* Mobile touch targets */
@media (max-width: 768px) {
  .chat-item {
    min-height: 56px; /* 44px + padding for better touch targets */
    padding: 12px 16px;
  }

  button {
    min-height: 44px;
    min-width: 44px;
  }

  .sidebar-footer button {
    padding: 12px 16px;
  }
}

/* High DPI displays */
@media (min-resolution: 2dppx) {
  .chat-item {
    border-width: 0.5px;
  }
}

/* === PERFORMANCE OPTIMIZATIONS === */

/* GPU acceleration for smooth animations */
.chat-item,
button,
.sidebar-header input {
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
}

/* Prevent layout shifts */
.sidebar-content {
  contain: layout style;
}

.chat-item {
  contain: layout;
}


/* 🎨 表单用户体验优化 */
.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: hsl(var(--foreground));
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: hsl(var(--ring));
  box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2);
}

.form-input.error {
  border-color: hsl(0 84% 60%);
}

.form-error {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: hsl(0 84% 60%);
}

.form-success {
  border-color: hsl(142 71% 45%);
}

/* 加载状态 */
.form-input.loading {
  background-image: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  background-size: 200% 100%;
  animation: loading-shimmer 1.5s infinite;
}

@keyframes loading-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}</style>
