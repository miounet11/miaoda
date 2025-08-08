<template>
  <aside 
    class="chat-sidebar w-64 bg-secondary/30 backdrop-blur-sm border-r flex flex-col transition-transform duration-300 ease-in-out z-50"
    :class="sidebarClasses"
  >
    <!-- Header -->
    <div class="sidebar-header p-3 border-b">
      <div class="flex gap-2">
        <button 
          @click="$emit('new-chat')"
          class="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 font-medium shadow-sm"
        >
          <Plus :size="16" />
          <span>New Chat</span>
        </button>
        <button
          @click="$emit('open-settings')"
          class="p-2 bg-secondary/50 hover:bg-secondary/70 rounded-lg transition-colors"
          title="Settings"
        >
          <Settings :size="18" />
        </button>
      </div>
    </div>

    <!-- Tag Cloud Filter -->
    <div class="sidebar-filters p-3 border-b">
      <TagCloud 
        ref="tagCloud"
        :show-when-empty="false"
        :max-collapsed-tags="4"
        @tags-changed="handleTagsChanged"
        @tag-clicked="handleTagClicked"
      />
    </div>
    
    <!-- Chat List -->
    <div class="sidebar-content flex-1 overflow-y-auto p-2">
      <div v-if="chats.length === 0" class="empty-state text-center py-8 text-muted-foreground text-sm">
        No conversations yet
      </div>
      <div 
        v-for="chat in chats" 
        :key="chat.id"
        @click="$emit('select-chat', chat.id)"
        :class="[
          'chat-item px-3 py-2.5 rounded-lg cursor-pointer transition-all mb-1 relative group',
          currentChatId === chat.id 
            ? 'bg-primary/10 border border-primary/20' 
            : 'hover:bg-accent/50 border border-transparent'
        ]"
      >
        <div class="flex items-start gap-2">
          <MessageSquare :size="14" class="mt-0.5 flex-shrink-0 text-muted-foreground" />
          <div class="flex-1 min-w-0">
            <div class="font-medium text-sm truncate">{{ chat.title }}</div>
            <div class="text-xs text-muted-foreground mt-0.5">{{ formatTime(chat.updatedAt) }}</div>
            
            <!-- Summary Preview -->
            <div v-if="chat.summary" class="mt-1">
              <p class="text-xs text-muted-foreground/80 line-clamp-1 leading-relaxed">
                {{ chat.summary.summary }}
              </p>
              <div v-if="chat.summary.tags && chat.summary.tags.length > 0" class="flex flex-wrap gap-1 mt-1">
                <span
                  v-for="tag in chat.summary.tags.slice(0, 2)"
                  :key="tag"
                  class="inline-flex items-center px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
                >
                  {{ tag }}
                </span>
                <span 
                  v-if="chat.summary.tags.length > 2"
                  class="inline-flex items-center px-1.5 py-0.5 bg-muted text-muted-foreground text-xs rounded-full"
                >
                  +{{ chat.summary.tags.length - 2 }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- Context Menu Trigger -->
          <button
            v-if="currentChatId === chat.id"
            @click.stop="$emit('show-context-menu', chat.id, $event)"
            class="opacity-0 group-hover:opacity-100 p-1 hover:bg-background rounded transition-all"
            title="More options"
          >
            <MoreVertical :size="12" />
          </button>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="sidebar-footer p-3 border-t">
      <div class="flex items-center justify-between text-xs text-muted-foreground">
        <span>{{ chats.length }} conversation{{ chats.length !== 1 ? 's' : '' }}</span>
        <button
          v-if="chats.length > 0"
          @click="$emit('clear-all')"
          class="hover:text-foreground transition-colors"
          title="Clear all conversations"
        >
          Clear All
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Plus, Settings, MessageSquare, MoreVertical } from 'lucide-vue-next'
import { formatDistanceToNow } from '@renderer/src/utils/time'
import TagCloud from './TagCloud.vue'
import type { ChatSummary } from '@renderer/src/types'

interface Chat {
  id: string
  title: string
  updatedAt: Date
  messageCount?: number
  summary?: ChatSummary
}

interface Props {
  chats: Chat[]
  currentChatId?: string
  isMobile: boolean
  sidebarOpen: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'new-chat': []
  'select-chat': [chatId: string]
  'open-settings': []
  'show-context-menu': [chatId: string, event: MouseEvent]
  'clear-all': []
  'filter-by-tags': [tags: string[]]
  'tag-selected': [tag: string]
}>()

// Refs
const tagCloud = ref<InstanceType<typeof TagCloud> | null>(null)

const sidebarClasses = computed(() => ({
  'fixed top-0 left-0 h-full md:relative md:translate-x-0': props.isMobile,
  '-translate-x-full': props.isMobile && !props.sidebarOpen,
  'translate-x-0': !props.isMobile || props.sidebarOpen
}))

const formatTime = (date: Date) => {
  return formatDistanceToNow(date)
}

// Tag handling
const handleTagsChanged = (selectedTags: string[]) => {
  emit('filter-by-tags', selectedTags)
}

const handleTagClicked = (tag: string) => {
  emit('tag-selected', tag)
}

// Methods to refresh tag cloud when chats are updated
const refreshTagCloud = () => {
  if (tagCloud.value) {
    tagCloud.value.refreshTags()
  }
}

// Expose methods for parent components
defineExpose({
  refreshTagCloud
})
</script>

<style scoped>
.chat-sidebar {
  -webkit-app-region: no-drag;
}

/* Custom scrollbar for sidebar */
.sidebar-content ::-webkit-scrollbar {
  width: 6px;
}

.sidebar-content ::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-content ::-webkit-scrollbar-thumb {
  background: rgb(var(--muted-foreground) / 0.3);
  border-radius: 3px;
}

.sidebar-content ::-webkit-scrollbar-thumb:hover {
  background: rgb(var(--muted-foreground) / 0.5);
}

/* Chat item animations */
.chat-item {
  transition: all 0.2s ease;
}

.chat-item:hover {
  transform: translateX(2px);
}

.chat-item.active {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* Empty state animation */
.empty-state {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Text truncation */
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Focus states for accessibility */
.chat-item:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

button:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

/* Theme variables */
:root {
  --primary: hsl(221, 83%, 53%);
  --primary-foreground: hsl(0, 0%, 100%);
  --secondary: hsl(210, 20%, 96%);
  --muted-foreground: hsl(215, 20%, 45%);
  --accent: hsl(210, 20%, 96%);
  --background: hsl(0, 0%, 100%);
  --foreground: hsl(222, 47%, 11%);
}

:root[data-theme="dark"] {
  --primary: hsl(221, 83%, 65%);
  --secondary: hsl(217, 33%, 17%);
  --muted-foreground: hsl(215, 20%, 65%);
  --accent: hsl(217, 33%, 17%);
  --background: hsl(222, 47%, 11%);
  --foreground: hsl(210, 20%, 98%);
}
</style>