<template>
  <div class="session-list-container">
    <!-- Active Sessions -->
    <div 
      v-for="chat in sortedChats" 
      :key="chat.id"
      class="session-item"
      :class="{ 
        'active': chat.id === currentChatId,
        'has-unread': chat.unreadCount > 0 
      }"
      @click="selectChat(chat.id)"
      @contextmenu.prevent="showContextMenu(chat, $event)"
    >
      <div class="session-icon">
        <span v-if="chat.icon">{{ chat.icon }}</span>
        <svg v-else width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/>
          <path d="M10 6v4M10 14h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
      
      <div class="session-content">
        <div class="session-title">{{ chat.title || 'New Chat' }}</div>
        <div class="session-preview" v-if="chat.lastMessage">
          {{ chat.lastMessage }}
        </div>
        <div class="session-time" v-if="chat.updatedAt">
          {{ formatTime(chat.updatedAt) }}
        </div>
      </div>
      
      <div class="session-actions">
        <button 
          class="action-btn"
          @click.stop="deleteChat(chat.id)"
          v-if="hoveredChatId === chat.id"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-if="sortedChats.length === 0" class="empty-state">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" opacity="0.3">
        <rect x="8" y="8" width="32" height="32" rx="8" stroke="currentColor" stroke-width="2"/>
        <path d="M16 20h16M16 28h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <p>No conversations yet</p>
      <p class="empty-hint">Start a new chat to begin</p>
    </div>
    
    <!-- Context Menu -->
    <div 
      v-if="contextMenu.visible"
      class="context-menu"
      :style="{
        left: contextMenu.x + 'px',
        top: contextMenu.y + 'px'
      }"
      @click.stop
    >
      <button class="context-menu-item" @click="renameChat(contextMenu.chat)">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M11 2l3 3-9 9H2v-3l9-9z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Rename
      </button>
      <button class="context-menu-item" @click="duplicateChat(contextMenu.chat)">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="5" y="5" width="9" height="9" rx="1" stroke="currentColor" stroke-width="1.5"/>
          <path d="M11 5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v7a1 1 0 001 1h2" stroke="currentColor" stroke-width="1.5"/>
        </svg>
        Duplicate
      </button>
      <button class="context-menu-item danger" @click="deleteChat(contextMenu.chat?.id)">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 4h12M5 4V2a1 1 0 011-1h4a1 1 0 011 1v2M6 7v5M10 7v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        Delete
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useChatStore } from '../../stores/chat'
import { useChatboxUIStore } from '../../stores/chatboxUI'

const chatStore = useChatStore()
const chatboxUIStore = useChatboxUIStore()

const hoveredChatId = ref<string | null>(null)
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  chat: null as any
})

// Computed
const sortedChats = computed(() => {
  return chatStore.chats.slice().sort((a, b) => {
    const aTime = new Date(a.updatedAt || a.createdAt).getTime()
    const bTime = new Date(b.updatedAt || b.createdAt).getTime()
    return bTime - aTime
  })
})

const currentChatId = computed(() => chatStore.currentChatId)

// Methods
const selectChat = (chatId: string) => {
  chatStore.setCurrentChat(chatId)
  chatboxUIStore.setCurrentSession(chatId)
  closeContextMenu()
}

const deleteChat = async (chatId: string) => {
  if (confirm('Are you sure you want to delete this conversation?')) {
    await chatStore.deleteChat(chatId)
    closeContextMenu()
  }
}

const renameChat = async (chat: any) => {
  const newTitle = prompt('Enter new title:', chat.title)
  if (newTitle && newTitle !== chat.title) {
    await chatStore.updateChat(chat.id, { title: newTitle })
  }
  closeContextMenu()
}

const duplicateChat = async (chat: any) => {
  const newChat = await chatStore.createChat({
    title: `${chat.title} (Copy)`,
    model: chat.model,
    provider: chat.provider
  })
  
  // Copy messages if needed
  if (chat.messages && chat.messages.length > 0) {
    // TODO: Copy messages to new chat
  }
  
  closeContextMenu()
}

const showContextMenu = (chat: any, event: MouseEvent) => {
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    chat
  }
}

const closeContextMenu = () => {
  contextMenu.value.visible = false
  contextMenu.value.chat = null
}

const formatTime = (date: string | Date) => {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    const hours = d.getHours()
    const minutes = d.getMinutes()
    return `${hours}:${minutes < 10 ? '0' : ''}${minutes}`
  } else if (days === 1) {
    return 'Yesterday'
  } else if (days < 7) {
    return `${days} days ago`
  } else {
    return d.toLocaleDateString()
  }
}

// Event listeners
onMounted(() => {
  document.addEventListener('click', closeContextMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', closeContextMenu)
})
</script>

<style scoped>
.session-list-container {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

.session-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  margin: 0 8px 2px 8px;
  border-radius: var(--chatbox-radius-lg);
  cursor: pointer;
  transition: all var(--chatbox-transition-fast);
  position: relative;
}

.session-item:hover {
  background-color: var(--chatbox-bg-hover);
}

.session-item.active {
  background-color: var(--chatbox-accent-light);
  color: var(--chatbox-accent-dark);
}

.session-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: var(--chatbox-text-secondary);
}

.session-content {
  flex: 1;
  min-width: 0;
}

.session-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--chatbox-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-preview {
  font-size: 12px;
  color: var(--chatbox-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.session-time {
  font-size: 11px;
  color: var(--chatbox-text-tertiary);
  margin-top: 2px;
}

.session-actions {
  flex-shrink: 0;
}

.action-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--chatbox-text-secondary);
  cursor: pointer;
  border-radius: var(--chatbox-radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--chatbox-transition-fast);
}

.action-btn:hover {
  background-color: var(--chatbox-bg-hover);
  color: var(--chatbox-error);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--chatbox-text-secondary);
  text-align: center;
}

.empty-state p {
  margin: 8px 0 0 0;
  font-size: 14px;
}

.empty-hint {
  font-size: 12px;
  color: var(--chatbox-text-tertiary);
}

/* Context Menu */
.context-menu {
  position: fixed;
  background: var(--chatbox-bg-primary);
  border: 1px solid var(--chatbox-border);
  border-radius: var(--chatbox-radius-lg);
  box-shadow: var(--chatbox-shadow-lg);
  padding: 4px;
  z-index: var(--chatbox-z-popover);
  min-width: 160px;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: var(--chatbox-text-primary);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  border-radius: var(--chatbox-radius-md);
  transition: all var(--chatbox-transition-fast);
}

.context-menu-item:hover {
  background-color: var(--chatbox-bg-hover);
}

.context-menu-item.danger {
  color: var(--chatbox-error);
}

.context-menu-item svg {
  flex-shrink: 0;
}
</style>