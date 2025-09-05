<template>
  <div
    class="chatbox-sidebar"
    :class="{
      'chatbox-sidebar-collapsed': modelValue,
      'chatbox-sidebar-expanded': !modelValue
    }"
  >
    <!-- Logo and Header -->
    <div class="chatbox-sidebar-header">
      <!-- Logo -->
      <div class="chatbox-logo" :class="{ 'chatbox-logo-collapsed': modelValue }">
        <div class="chatbox-logo-icon">
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="2"
              y="2"
              width="24"
              height="24"
              rx="6"
              fill="url(#logo-gradient)"
              stroke="currentColor"
              stroke-width="1.5"
            />
            <circle cx="10" cy="10" r="2.5" fill="white" opacity="0.9" />
            <circle cx="18" cy="10" r="2.5" fill="white" opacity="0.9" />
            <path
              d="M9 18c0-2.5 2-4.5 5-4.5s5 2 5 4.5"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
              opacity="0.9"
            />
            <defs>
              <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#3b82f6" />
                <stop offset="100%" stop-color="#1d4ed8" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div v-if="!modelValue" class="chatbox-logo-content">
          <span class="chatbox-logo-text">ChatBox</span>
          <span class="chatbox-logo-subtitle">AI Assistant</span>
        </div>
      </div>

      <!-- Dual Action Buttons -->
      <div v-if="!modelValue" class="chatbox-action-buttons">
        <button @click="handleNewChat" class="chatbox-primary-button">
          <MessageSquarePlus :size="16" />
          <span>New Chat</span>
        </button>
        <button @click="handleNewImages" class="chatbox-secondary-button">
          <ImagePlus :size="16" />
          <span>Images</span>
        </button>
      </div>

      <!-- Collapsed New Chat Button -->
      <button v-else @click="handleNewChat" class="chatbox-new-chat-collapsed" title="New Chat">
        <Plus :size="18" />
      </button>
    </div>

    <!-- Search Bar -->
    <div v-if="!modelValue" class="chatbox-sidebar-search">
      <div class="chatbox-search-container">
        <Search class="chatbox-search-icon" :size="16" />
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Search conversations..."
          class="chatbox-search-input"
          @focus="isSearchFocused = true"
          @blur="isSearchFocused = false"
        />
        <kbd v-if="!searchQuery && !isSearchFocused" class="chatbox-search-shortcut">⌘K</kbd>
      </div>
    </div>

    <!-- Sessions List -->
    <div class="chatbox-sessions-container">
      <div v-if="!modelValue" class="chatbox-sessions-header">
        <span class="chatbox-sessions-title">Conversations</span>
        <button class="chatbox-sessions-action">
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2 4h10M2 7h10M2 10h10"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>

      <div class="chatbox-sessions-list" @dragover.prevent @drop="handleDrop">
        <div
          v-for="session in filteredSessions"
          :key="session.id"
          class="chatbox-session-item"
          :class="{
            'chatbox-session-active': session.id === activeSessionId,
            'chatbox-session-collapsed': modelValue
          }"
          @click="selectSession(session.id)"
          @dragstart="handleDragStart(session.id, $event)"
          @dragend="handleDragEnd"
          @dragenter="handleDragEnter(session.id)"
          draggable="true"
        >
          <!-- Session Icon (shown when collapsed) -->
          <div v-if="modelValue" class="chatbox-session-icon">
            <MessageCircle :size="18" />
          </div>

          <!-- Session Content (shown when expanded) -->
          <div v-else class="chatbox-session-content">
            <!-- Session Avatar and Info -->
            <div class="chatbox-session-main">
              <div class="chatbox-session-avatar">
                <div
                  class="chatbox-avatar-circle"
                  :style="{ backgroundColor: session.avatarColor }"
                >
                  <component :is="getSessionIcon(session.type)" :size="16" />
                </div>
              </div>
              <div class="chatbox-session-info">
                <div class="chatbox-session-header">
                  <span class="chatbox-session-title">{{ session.title }}</span>
                  <button
                    @click.stop="toggleStar(session.id)"
                    class="chatbox-star-button"
                    :class="{ starred: session.starred }"
                  >
                    <Star :size="14" :fill="session.starred ? 'currentColor' : 'none'" />
                  </button>
                </div>
                <div class="chatbox-session-preview">{{ session.preview }}</div>
                <div class="chatbox-session-meta">
                  <span class="chatbox-session-badge">{{ session.model }}</span>
                  <span class="chatbox-session-time">{{ formatTime(session.updatedAt) }}</span>
                </div>
              </div>
            </div>

            <!-- More Menu -->
            <div class="chatbox-session-actions">
              <button
                @click.stop="showMoreMenu(session.id)"
                class="chatbox-more-button"
                :class="{ active: activeMenuId === session.id }"
              >
                <MoreVertical :size="16" />
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredSessions.length === 0" class="chatbox-sessions-empty">
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="8"
              y="12"
              width="32"
              height="24"
              rx="4"
              stroke="currentColor"
              stroke-width="2"
              opacity="0.3"
            />
            <path
              d="M16 20h16M16 24h12M16 28h14"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              opacity="0.3"
            />
          </svg>
          <p v-if="!modelValue">No conversations yet</p>
        </div>
      </div>
    </div>

    <!-- Bottom Menu -->
    <div class="chatbox-sidebar-footer">
      <!-- Bottom Navigation Menu -->
      <div v-if="!modelValue" class="chatbox-bottom-menu">
        <button
          @click="openCopilots"
          class="chatbox-menu-item"
          :class="{ active: activeMenu === 'copilots' }"
        >
          <Users :size="18" />
          <span>My Copilots</span>
        </button>

        <button
          @click="openSettings"
          class="chatbox-menu-item"
          :class="{ active: activeMenu === 'settings' }"
        >
          <Settings :size="18" />
          <span>Settings</span>
        </button>

        <button
          @click="openAbout"
          class="chatbox-menu-item"
          :class="{ active: activeMenu === 'about' }"
        >
          <Info :size="18" />
          <span>About</span>
        </button>
      </div>

      <!-- Divider -->
      <div class="chatbox-footer-divider"></div>

      <!-- Collapse Toggle -->
      <button
        @click="toggleCollapse"
        class="chatbox-collapse-button"
        :title="modelValue ? 'Expand sidebar' : 'Collapse sidebar'"
      >
        <ChevronLeft v-if="!modelValue" :size="16" />
        <ChevronRight v-else :size="16" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  MessageSquarePlus,
  ImagePlus,
  Plus,
  Search,
  MessageCircle,
  Star,
  MoreVertical,
  Users,
  Settings,
  Info,
  ChevronLeft,
  ChevronRight,
  Bot,
  Sparkles,
  Zap
} from 'lucide-vue-next'
import { useChatStore } from '@/stores/chat'
import { useToast } from '@/composables/useToast'

// Props & Emits
const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'session-select': [sessionId: string]
  'new-chat': []
  'new-images': []
}>()

// Store and Router
const chatStore = useChatStore()
const router = useRouter()
const { showToast } = useToast()

// State
const searchQuery = ref('')
const activeSessionId = ref<string | null>(null)
const draggedSessionId = ref<string | null>(null)
const dragOverSessionId = ref<string | null>(null)
const isSearchFocused = ref(false)
const activeMenuId = ref<string | null>(null)
const activeMenu = ref<string | null>(null)

// Computed sessions from chat store
const sessions = computed(() => {
  return chatStore.chats.map(chat => ({
    id: chat.id,
    title: chat.title,
    preview: getLastMessagePreview(chat),
    model: 'GPT-4', // TODO: Get from chat settings
    type: 'chat',
    messageCount: chat.messages?.length || 0,
    starred: chat.starred || false,
    avatarColor: getAvatarColor(chat.id),
    updatedAt: chat.updatedAt
  }))
})

// Computed
const filteredSessions = computed(() => {
  if (!searchQuery.value) return sessions.value

  const query = searchQuery.value.toLowerCase()
  return sessions.value.filter(
    session =>
      session.title.toLowerCase().includes(query) || session.preview.toLowerCase().includes(query)
  )
})

// Methods
const toggleCollapse = () => {
  emit('update:modelValue', !props.modelValue)
  localStorage.setItem('chatbox-sidebar-collapsed', String(!props.modelValue))
}

const handleNewChat = async () => {
  try {
    console.log('handleNewChat called')
    console.log('chatStore.isInitialized:', chatStore.isInitialized)

    // Ensure chat store is initialized
    if (!chatStore.isInitialized) {
      console.log('Chat store not initialized, initializing now...')
      await chatStore.initialize()
    }

    console.log('Creating new chat...')
    const newChatId = await chatStore.createChat()
    console.log('New chat created with ID:', newChatId)

    if (newChatId) {
      activeSessionId.value = newChatId
      emit('session-select', newChatId)
      emit('new-chat')
      console.log('New chat setup completed')
    } else {
      console.error('Failed to create chat: no ID returned')
      showToast('创建聊天失败', 'error')
    }
  } catch (error) {
    console.error('Failed to create new chat:', error)
    showToast('创建聊天失败：' + error.message, 'error')
  }
}

const handleNewImages = () => {
  emit('new-images')
}

const toggleStar = (sessionId: string) => {
  const session = sessions.value.find(s => s.id === sessionId)
  if (session) {
    session.starred = !session.starred
  }
}

const showMoreMenu = (sessionId: string) => {
  activeMenuId.value = activeMenuId.value === sessionId ? null : sessionId
}

const getSessionIcon = (type: string) => {
  const iconMap = {
    chat: MessageCircle,
    code: Bot,
    api: Zap,
    creative: Sparkles
  }
  return iconMap[type as keyof typeof iconMap] || MessageCircle
}

const openCopilots = () => {
  activeMenu.value = 'copilots'
  // TODO: Navigate to copilots page
}

const openSettings = () => {
  activeMenu.value = 'settings'
  router.push('/settings')
}

const openAbout = () => {
  activeMenu.value = 'about'
  // TODO: Show about dialog
}

const selectSession = async (sessionId: string) => {
  try {
    console.log('Selecting session:', sessionId)
    activeSessionId.value = sessionId
    await chatStore.selectChat(sessionId)
    emit('session-select', sessionId)
  } catch (error) {
    console.error('Failed to select session:', error)
  }
}

const getLastMessagePreview = (chat: any) => {
  if (!chat.messages || chat.messages.length === 0) {
    return 'No messages yet'
  }

  const lastMessage = chat.messages[chat.messages.length - 1]
  const content = lastMessage.content || 'No content'

  // Truncate long messages
  return content.length > 80 ? content.substring(0, 80) + '...' : content
}

const getAvatarColor = (chatId: string) => {
  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']
  const index = chatId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[index % colors.length]
}

const formatTime = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const openImportExport = () => {
  // TODO: Implement import/export functionality
  console.log('Import/Export clicked')
}

// Drag and Drop
const handleDragStart = (sessionId: string, event: DragEvent) => {
  draggedSessionId.value = sessionId
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

const handleDragEnd = () => {
  draggedSessionId.value = null
  dragOverSessionId.value = null
}

const handleDragEnter = (sessionId: string) => {
  if (draggedSessionId.value && draggedSessionId.value !== sessionId) {
    dragOverSessionId.value = sessionId
  }
}

const handleDrop = () => {
  if (draggedSessionId.value && dragOverSessionId.value) {
    // Reorder sessions
    const draggedIndex = sessions.value.findIndex(s => s.id === draggedSessionId.value)
    const targetIndex = sessions.value.findIndex(s => s.id === dragOverSessionId.value)

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [draggedSession] = sessions.value.splice(draggedIndex, 1)
      sessions.value.splice(targetIndex, 0, draggedSession)
    }
  }

  draggedSessionId.value = null
  dragOverSessionId.value = null
}

// Lifecycle
onMounted(async () => {
  // Initialize chat store if needed
  if (!chatStore.isInitialized) {
    await chatStore.initialize()
  }

  // Load active session from store
  if (chatStore.currentChatId) {
    activeSessionId.value = chatStore.currentChatId
  }
})

// Watch for current chat changes from store
watch(
  () => chatStore.currentChatId,
  newChatId => {
    if (newChatId) {
      activeSessionId.value = newChatId
    }
  }
)

// Watch for collapse state changes
watch(
  () => props.modelValue,
  collapsed => {
    // Handle any animations or transitions
    document.body.classList.toggle('chatbox-sidebar-collapsed', collapsed)
  }
)
</script>

<style>
@import './app-sidebar.css';
</style>
