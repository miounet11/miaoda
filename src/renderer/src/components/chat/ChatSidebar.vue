<template>
  <aside 
    class="chat-sidebar w-64 bg-gradient-to-b from-background to-background/95 backdrop-blur-md border-r border-border/60 flex flex-col transition-all duration-300 ease-out z-50 shadow-sm"
    :class="sidebarClasses"
  >
    <!-- Header -->
    <div class="sidebar-header p-4 border-b border-border/40">
      <div class="flex flex-col gap-3">
        <!-- New Chat Button -->
        <button 
          @click="$emit('new-chat')"
          class="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center justify-center gap-2.5 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] btn-interactive magnetic-hover ripple"
        >
          <Plus :size="18" class="animate-in" />
          <span class="tracking-wide">New Chat</span>
        </button>
        
        <!-- Quick Search -->
        <div class="relative">
          <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search conversations..."
            class="w-full pl-9 pr-3 py-2 bg-secondary/40 border border-transparent rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-background/80 focus:border-primary/20 transition-all duration-300 placeholder:text-muted-foreground input-enhanced focus-glow"
          >
        </div>
      </div>
    </div>
    
    <!-- Chat List -->
    <div class="sidebar-content flex-1 overflow-y-auto p-3 space-y-1">
      <!-- Empty State -->
      <div v-if="filteredChats.length === 0 && !searchQuery" class="empty-state text-center py-12">
        <div class="inline-flex items-center justify-center w-12 h-12 mb-3 bg-primary/10 rounded-full">
          <MessageSquare :size="20" class="text-primary/60" />
        </div>
        <p class="text-sm text-muted-foreground font-medium">No conversations yet</p>
        <p class="text-xs text-muted-foreground mt-1" style="opacity: 0.8;">Start chatting to see your conversations here</p>
      </div>
      
      <!-- No Search Results -->
      <div v-else-if="filteredChats.length === 0 && searchQuery" class="empty-state text-center py-8">
        <Search :size="20" class="mx-auto mb-2 text-muted-foreground/40" />
        <p class="text-sm text-muted-foreground/80">No conversations found</p>
        <p class="text-xs text-muted-foreground/60 mt-1">Try adjusting your search terms</p>
      </div>
      
      <!-- Chat Items -->
      <TransitionGroup name="chat-list" tag="div" class="space-y-1">
        <div 
          v-for="chat in filteredChats" 
          :key="chat.id"
          @click="$emit('select-chat', chat.id)"
          :class="[
            'chat-item sidebar-item px-3 py-3 rounded-xl cursor-pointer transition-all duration-300 relative group border transform',
            currentChatId === chat.id 
              ? 'bg-primary/15 border-primary/30 shadow-sm ring-1 ring-primary/20 active' 
              : 'hover:bg-secondary/40 border-transparent hover:border-border/40 hover:shadow-sm hover:translate-x-1'
          ]"
        >
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0 mt-0.5">
              <div
                :class="[
                  'w-2 h-2 rounded-full transition-all duration-300',
                  currentChatId === chat.id ? 'bg-primary scale-125 animate-pulse' : 'bg-muted-foreground/30'
                ]"
              />
            </div>
            
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-sm truncate leading-tight mb-1">{{ chat.title }}</div>
              
              <!-- Chat Preview -->
              <div v-if="getLastMessage(chat)" class="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-1" style="color: hsl(var(--muted-foreground) / 0.9);">
                {{ getLastMessage(chat) }}
              </div>
              
              <div class="flex items-center justify-between">
                <div class="text-xs font-medium" style="color: hsl(var(--muted-foreground) / 0.8);">
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
            <div class="flex items-center" :class="activeContextMenuId === chat.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity duration-200'">
              <button
                @click.stop="toggleContextMenu(chat.id, $event)"
                :class="[
                  'p-1.5 rounded-lg transition-all duration-200 btn-interactive',
                  activeContextMenuId === chat.id ? 'bg-secondary text-foreground rotate-90' : 'hover:bg-background/70 hover:rotate-90'
                ]"
                title="More options"
              >
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
        <div class="text-xs font-medium" style="color: hsl(var(--muted-foreground) / 0.8);">
          {{ filteredChats.length }} conversation{{ filteredChats.length !== 1 ? 's' : '' }}
        </div>
        
        <!-- More Menu -->
        <div class="relative">
          <button
            @click="showMoreMenu = !showMoreMenu"
            :class="[
              'p-2 rounded-lg transition-colors duration-150 flex items-center gap-1',
              showMoreMenu ? 'bg-secondary text-foreground' : 'hover:bg-secondary/60 text-muted-foreground'
            ]"
            title="More options"
          >
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
                >
                  <Settings :size="16" />
                  Settings
                </button>
                <button
                  @click="handleMoreAction('analytics')"
                  class="w-full px-3 py-2 text-left hover:bg-secondary/40 rounded-lg transition-colors duration-150 flex items-center gap-3 text-sm"
                >
                  <BarChart3 :size="16" />
                  Analytics
                </button>
                <button
                  @click="handleMoreAction('export')"
                  class="w-full px-3 py-2 text-left hover:bg-secondary/40 rounded-lg transition-colors duration-150 flex items-center gap-3 text-sm"
                >
                  <Download :size="16" />
                  Export Chats
                </button>
                <div class="h-px bg-border/40 my-2" />
                <button
                  @click="handleMoreAction('clear-all')"
                  class="w-full px-3 py-2 text-left hover:bg-destructive/10 text-destructive rounded-lg transition-colors duration-150 flex items-center gap-3 text-sm"
                >
                  <Trash2 :size="16" />
                  Clear All Chats
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
import { 
  Plus, Settings, MessageSquare, MoreVertical, MoreHorizontal, 
  Search, BarChart3, Download, Trash2 
} from 'lucide-vue-next'
import { formatDistanceToNow } from '@renderer/src/utils/time'

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
  'new-chat': []
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
  return props.chats.filter(chat => 
    chat.title.toLowerCase().includes(query) ||
    (chat.messages && chat.messages.some(msg => 
      msg.content.toLowerCase().includes(query)
    ))
  )
})

// Methods
const formatTime = (date: Date | string | number | undefined) => {
  if (!date) return 'unknown'
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
  0%, 100% { 
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
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.loading-shimmer {
  background: linear-gradient(
    90deg,
    transparent 25%,
    hsl(var(--muted) / 0.5) 50%,
    transparent 75%
  );
  background-size: 200% 100%;
  animation: shimmer 2s infinite linear;
}

/* Icon animations */
@keyframes icon-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

.animate-in {
  animation: icon-bounce 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

/* More menu button rotation */
.sidebar-footer .relative > button {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-footer .relative > button[class*="bg-secondary"] {
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
</style>