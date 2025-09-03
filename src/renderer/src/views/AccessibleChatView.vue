<template>
  <div
    class="chat-view h-screen flex flex-col bg-background text-foreground relative overflow-hidden"
    role="main"
    aria-label="Chat Application"
  >
    <!-- Skip Links for Screen Reader Navigation -->
    <nav class="sr-only focus:not-sr-only">
      <a href="#main-chat" class="skip-link">Skip to main chat</a>
      <a href="#chat-input" class="skip-link">Skip to message input</a>
      <a href="#chat-list" class="skip-link">Skip to chat list</a>
    </nav>

    <!-- Mobile Header with Safe Area -->
    <header
      v-if="isMobile"
      class="mobile-header sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border"
      :style="{ paddingTop: 'var(--safe-area-top)' }"
      role="banner"
    >
      <div class="flex items-center justify-between h-14 px-4">
        <button
          @click="toggleSidebar"
          class="touch-target-comfortable p-2 hover:bg-muted rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-ring"
          :aria-label="sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'"
          :aria-expanded="sidebarOpen"
        >
          <Menu v-if="!sidebarOpen" :size="20" />
          <X v-else :size="20" />
        </button>
        
        <h1 class="text-lg font-semibold truncate mx-3">
          {{ currentChat?.title || 'New Conversation' }}
        </h1>
        
        <button
          @click="toggleTheme"
          class="touch-target-comfortable p-2 hover:bg-muted rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-ring"
          :aria-label="isDark ? 'Switch to light theme' : 'Switch to dark theme'"
        >
          <Sun v-if="isDark" :size="20" />
          <Moon v-else :size="20" />
        </button>
      </div>
    </header>

    <div class="flex-1 flex overflow-hidden">
      <!-- Enhanced Sidebar with Accessibility -->
      <aside
        :class="[
          'sidebar transition-transform duration-300 ease-in-out',
          'flex flex-col bg-muted/30 border-r border-border',
          'w-full sm:w-80 lg:w-72 xl:w-80',
          isMobile ? 'fixed inset-y-0 left-0 z-40' : 'relative',
          isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'
        ]"
        role="navigation"
        aria-label="Chat navigation"
        :style="isMobile ? { paddingTop: 'var(--safe-area-top)' } : {}"
      >
        <!-- Sidebar Header -->
        <div class="p-4 border-b border-border/50">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold" id="chat-list-title">Conversations</h2>
            <button
              @click="createNewChat"
              class="touch-target-comfortable p-2 hover:bg-background rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Create new chat conversation"
            >
              <Plus :size="20" />
            </button>
          </div>
        </div>

        <!-- Search -->
        <div class="p-4 pb-2">
          <div class="relative">
            <label for="chat-search" class="sr-only">Search conversations</label>
            <Search
              :size="16"
              class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="chat-search"
              v-model="searchQuery"
              type="search"
              placeholder="Search conversations..."
              class="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring transition-colors"
              aria-describedby="search-help"
            />
          </div>
          <div id="search-help" class="sr-only">
            Search through your conversation history
          </div>
        </div>

        <!-- Chat List -->
        <div
          class="flex-1 overflow-y-auto px-4 pb-4"
          id="chat-list"
          role="list"
          :aria-describedby="filteredChats.length > 0 ? 'chat-list-title' : 'empty-state-message'"
        >
          <!-- Chat Items -->
          <div
            v-for="(chat, index) in filteredChats"
            :key="chat.id"
            role="listitem"
            class="mb-1"
          >
            <button
              @click="selectChat(chat.id)"
              @keydown="handleChatItemKeydown($event, chat.id, index)"
              :class="[
                'chat-item w-full text-left p-3 rounded-lg transition-all duration-200',
                'hover:bg-background/80 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-ring',
                currentChatId === chat.id ? 'bg-background shadow-sm border border-border' : ''
              ]"
              :aria-label="`Chat conversation: ${chat.title || 'Untitled'}. Last updated ${formatTime(chat.updatedAt)}. ${chat.messages?.length || 0} messages.`"
              :aria-current="currentChatId === chat.id ? 'page' : undefined"
              :tabindex="0"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-3 flex-1 min-w-0">
                  <MessageSquare
                    :size="16"
                    :class="currentChatId === chat.id ? 'text-primary' : 'text-muted-foreground'"
                    aria-hidden="true"
                  />
                  <div class="flex-1 min-w-0">
                    <h3 class="font-medium text-sm truncate">
                      {{ chat.title || 'New Conversation' }}
                    </h3>
                    <p class="text-xs text-muted-foreground mt-1">
                      {{ formatTime(chat.updatedAt) }}
                    </p>
                  </div>
                </div>
                
                <button
                  @click.stop="deleteChat(chat.id)"
                  @keydown.stop
                  class="touch-target p-2 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded transition-all focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-destructive"
                  :aria-label="`Delete conversation: ${chat.title || 'Untitled'}`"
                >
                  <Trash2 :size="14" class="text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            </button>
          </div>

          <!-- Empty State -->
          <div
            v-if="filteredChats.length === 0"
            class="text-center py-12"
            role="status"
            id="empty-state-message"
          >
            <MessageSquare :size="48" class="mx-auto mb-4 text-muted-foreground/30" aria-hidden="true" />
            <p class="text-sm text-muted-foreground mb-2">
              {{ searchQuery ? 'No matching conversations found' : 'No conversations yet' }}
            </p>
            <p v-if="searchQuery" class="text-xs text-muted-foreground">
              Try adjusting your search terms
            </p>
          </div>
        </div>

        <!-- Sidebar Footer -->
        <div class="p-4 border-t border-border/50 space-y-2" :style="{ paddingBottom: isMobile ? 'var(--safe-area-bottom)' : '' }">
          <nav role="navigation" aria-label="Application navigation">
            <ul class="space-y-1">
              <li>
                <router-link
                  to="/analytics"
                  class="nav-link w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all hover:bg-background focus-visible:ring-2 focus-visible:ring-ring"
                  :class="$route.name === 'analytics' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-foreground'"
                  role="menuitem"
                >
                  <BarChart3 :size="18" aria-hidden="true" />
                  <span>Analytics</span>
                </router-link>
              </li>
              <li>
                <router-link
                  to="/settings"
                  class="nav-link w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all hover:bg-background focus-visible:ring-2 focus-visible:ring-ring"
                  :class="$route.name === 'settings' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-foreground'"
                  role="menuitem"
                >
                  <Settings :size="18" aria-hidden="true" />
                  <span>Settings</span>
                </router-link>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      <!-- Mobile Sidebar Overlay -->
      <div
        v-if="isMobile && sidebarOpen"
        @click="closeSidebar"
        @touchstart="handleOverlayTouchStart"
        class="fixed inset-0 bg-black/50 z-30"
        role="button"
        aria-label="Close navigation menu"
        tabindex="0"
        @keydown.escape="closeSidebar"
      />

      <!-- Main Chat Area -->
      <main
        class="flex-1 flex flex-col min-w-0 bg-background relative"
        id="main-chat"
        role="main"
        aria-label="Chat messages and input"
      >
        <!-- Desktop Header -->
        <header
          v-if="!isMobile"
          class="chat-header flex items-center justify-between border-b border-border bg-background/95 backdrop-blur-md"
          :class="{ 'pt-8': isMacOS }"
          role="banner"
        >
          <div class="flex items-center gap-3 flex-1 min-w-0 px-6 py-4">
            <button
              v-if="sidebarCollapsed"
              @click="toggleSidebar"
              class="touch-target p-2 hover:bg-muted rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Open navigation sidebar"
            >
              <Menu :size="20" />
            </button>
            
            <div class="flex-1 min-w-0">
              <h1 class="text-lg font-semibold truncate">
                {{ currentChat?.title || 'New Conversation' }}
              </h1>
              <p class="text-sm text-muted-foreground">
                {{ getConversationStatus() }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 px-6">
            <button
              @click="openGlobalSearch"
              class="touch-target p-2 hover:bg-muted rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Search conversations (Ctrl+K)"
              title="Search conversations (Ctrl+K)"
            >
              <Search :size="18" />
            </button>
            
            <button
              @click="toggleTheme"
              class="touch-target p-2 hover:bg-muted rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-ring"
              :aria-label="isDark ? 'Switch to light theme' : 'Switch to dark theme'"
            >
              <Sun v-if="isDark" :size="18" />
              <Moon v-else :size="18" />
            </button>
          </div>
        </header>

        <!-- Messages Area with Virtual Scrolling -->
        <div
          class="messages-area flex-1 overflow-hidden relative"
          role="log"
          aria-label="Chat messages"
          aria-live="polite"
          aria-relevant="additions text"
        >
          <div class="h-full overflow-y-auto px-4 sm:px-6 py-4">
            <!-- Welcome Screen -->
            <div
              v-if="!currentChat || (!currentChat.messages?.length && !isLoading)"
              class="welcome-container flex-1 flex items-center justify-center min-h-full"
              role="region"
              aria-label="Welcome screen"
            >
              <div class="text-center max-w-2xl px-4">
                <div class="mb-6">
                  <Sparkles :size="48" class="mx-auto text-primary mb-4" aria-hidden="true" />
                  <h2 class="text-2xl font-bold mb-2">Welcome to MiaoDa Chat</h2>
                  <p class="text-muted-foreground text-lg leading-relaxed">
                    Your intelligent AI assistant, ready to help with questions, coding, translation, and more.
                  </p>
                </div>

                <div
                  class="suggestions-grid grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8"
                  role="group"
                  aria-label="Quick suggestion prompts"
                >
                  <button
                    v-for="(suggestion, index) in quickSuggestions"
                    :key="index"
                    @click="sendQuickMessage(suggestion.text)"
                    class="suggestion-card p-4 text-left bg-muted hover:bg-muted/80 rounded-xl border border-transparent hover:border-border transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring group"
                    :aria-label="`Quick prompt: ${suggestion.title}. ${suggestion.description}`"
                  >
                    <component
                      :is="suggestion.icon"
                      :size="24"
                      class="text-primary mb-3 group-hover:scale-110 transition-transform"
                      aria-hidden="true"
                    />
                    <h3 class="font-medium mb-1">{{ suggestion.title }}</h3>
                    <p class="text-sm text-muted-foreground leading-relaxed">{{ suggestion.description }}</p>
                  </button>
                </div>
              </div>
            </div>

            <!-- Message List -->
            <div
              v-else
              class="message-list space-y-4 pb-4"
              role="log"
              aria-label="Conversation messages"
            >
              <article
                v-for="(message, index) in currentMessages"
                :key="message.id"
                :class="[
                  'message-wrapper transition-all duration-200',
                  message.role === 'user' ? 'message-user flex justify-end' : 'message-assistant flex justify-start'
                ]"
                role="article"
                :aria-label="`${message.role === 'user' ? 'Your' : 'Assistant'} message from ${formatMessageTime(message.timestamp)}`"
                :tabindex="0"
                @keydown="handleMessageKeydown($event, index)"
              >
                <div
                  :class="[
                    'message-content max-w-[85%] sm:max-w-[75%] relative group',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm'
                      : 'bg-muted text-foreground rounded-2xl rounded-bl-sm'
                  ]"
                >
                  <!-- Message Header -->
                  <div class="message-header flex items-baseline justify-between gap-2 p-3 pb-2">
                    <span class="font-medium text-sm">
                      {{ message.role === 'user' ? 'You' : 'Assistant' }}
                    </span>
                    <time
                      :datetime="message.timestamp?.toISOString()"
                      class="text-xs opacity-70"
                    >
                      {{ formatMessageTime(message.timestamp) }}
                    </time>
                  </div>

                  <!-- Message Content -->
                  <div
                    class="message-text px-3 pb-3 leading-relaxed"
                    v-html="formatMessageContent(message.content)"
                  />

                  <!-- Message Actions -->
                  <div
                    class="message-actions flex gap-1 p-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
                    role="toolbar"
                    :aria-label="`Actions for ${message.role} message`"
                  >
                    <button
                      @click="copyMessage(message.content)"
                      class="touch-target p-1.5 hover:bg-background/20 rounded transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label="Copy message to clipboard"
                      title="Copy message"
                    >
                      <Copy :size="14" />
                    </button>
                    
                    <button
                      v-if="message.role === 'assistant'"
                      @click="regenerateMessage(index)"
                      class="touch-target p-1.5 hover:bg-background/20 rounded transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label="Regenerate this response"
                      title="Regenerate response"
                    >
                      <RefreshCw :size="14" />
                    </button>
                  </div>
                </div>
              </article>

              <!-- Typing Indicator -->
              <div
                v-if="isLoading"
                class="message-wrapper message-assistant flex justify-start"
                role="status"
                aria-live="polite"
                aria-label="Assistant is typing"
              >
                <div class="message-content bg-muted rounded-2xl rounded-bl-sm p-4">
                  <div class="flex items-center gap-3">
                    <div class="typing-indicator flex gap-1">
                      <div
                        v-for="i in 3"
                        :key="i"
                        class="typing-dot w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
                        :style="{ animationDelay: `${(i - 1) * 0.15}s` }"
                        aria-hidden="true"
                      />
                    </div>
                    <span class="text-sm text-muted-foreground">Assistant is thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Enhanced Input Area -->
        <div
          class="input-area bg-background border-t border-border"
          :style="{ paddingBottom: isMobile ? 'max(1rem, var(--safe-area-bottom))' : '' }"
        >
          <div class="px-4 sm:px-6 py-4">
            <form @submit.prevent="sendMessage" class="relative">
              <div
                class="input-wrapper flex items-end gap-2 p-3 bg-muted/50 hover:bg-muted/70 focus-within:bg-muted/80 border border-transparent focus-within:border-ring rounded-2xl transition-all duration-200"
              >
                <!-- Attachment Button -->
                <button
                  type="button"
                  @click="selectFiles"
                  class="touch-target-comfortable p-2 hover:bg-background/60 rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Attach files"
                  title="Attach files"
                  :disabled="isLoading"
                >
                  <Paperclip :size="18" class="text-muted-foreground hover:text-primary transition-colors" />
                </button>

                <!-- Message Input -->
                <div class="flex-1 min-w-0 relative">
                  <label for="message-input" class="sr-only">Type your message</label>
                  <textarea
                    id="message-input"
                    ref="messageInputRef"
                    v-model="inputMessage"
                    @keydown="handleInputKeydown"
                    @input="handleInputChange"
                    :placeholder="getInputPlaceholder()"
                    :disabled="isLoading"
                    class="message-input w-full min-h-[44px] max-h-32 px-3 py-3 bg-transparent border-0 outline-none resize-none placeholder:text-muted-foreground/60 text-base leading-relaxed focus-visible:outline-none"
                    style="field-sizing: content;"
                    rows="1"
                    :aria-describedby="inputMessage.length > 3500 ? 'char-count-warning' : 'input-help'"
                    :aria-invalid="inputMessage.length > 4000 ? 'true' : 'false'"
                  />
                </div>

                <!-- Send Button -->
                <button
                  type="submit"
                  :disabled="!canSend"
                  class="send-button touch-target-comfortable p-2.5 rounded-xl transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                  :class="canSend ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95' : 'bg-muted text-muted-foreground'"
                  :aria-label="canSend ? 'Send message' : 'Type a message to send'"
                >
                  <Send :size="18" />
                </button>
              </div>

              <!-- Input Help Text -->
              <div class="flex items-center justify-between mt-2 px-2 text-xs text-muted-foreground">
                <div id="input-help" class="flex items-center gap-4">
                  <span>Press Enter to send</span>
                  <span>Shift+Enter for new line</span>
                  <span v-if="!isMobile">Ctrl+K to search</span>
                </div>
                
                <div
                  v-if="inputMessage.length > 0"
                  :id="inputMessage.length > 3500 ? 'char-count-warning' : undefined"
                  :class="[
                    'character-count transition-colors',
                    inputMessage.length > 3500 ? 'text-warning' : '',
                    inputMessage.length > 4000 ? 'text-destructive font-medium' : ''
                  ]"
                  :aria-live="inputMessage.length > 3500 ? 'polite' : 'off'"
                >
                  {{ inputMessage.length }}/4000
                  <span v-if="inputMessage.length > 4000" class="ml-1">(limit exceeded)</span>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>

    <!-- Live Region for Announcements -->
    <div
      id="announcements"
      aria-live="polite"
      aria-atomic="true"
      class="sr-only"
      role="status"
    >
      {{ currentAnnouncement }}
    </div>

    <!-- Global Search Modal -->
    <GlobalSearch
      v-if="showGlobalSearch"
      :is-visible="showGlobalSearch"
      @close="closeGlobalSearch"
      @message-click="handleSearchMessageClick"
      @chat-click="handleSearchChatClick"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import {
  Menu,
  X,
  Plus,
  Search,
  MessageSquare,
  Trash2,
  Settings,
  BarChart3,
  Sun,
  Moon,
  Sparkles,
  Paperclip,
  Send,
  Copy,
  RefreshCw,
  Code2,
  Languages,
  HelpCircle
} from 'lucide-vue-next'
import { useChatStore } from '@/stores/chat'
import { useSettingsStore } from '@/stores/settings'
import { formatTimeWithFallback } from '@/utils/time'
import GlobalSearch from '@/components/search/GlobalSearch.vue'

// Interfaces
interface QuickSuggestion {
  icon: any
  title: string
  description: string
  text: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// Stores
const chatStore = useChatStore()
const settingsStore = useSettingsStore()

// Reactive State
const sidebarOpen = ref(false)
const sidebarCollapsed = ref(false)
const searchQuery = ref('')
const inputMessage = ref('')
const isLoading = ref(false)
const showGlobalSearch = ref(false)
const isDark = ref(false)
const isMobile = ref(false)
const isMacOS = ref(false)
const currentAnnouncement = ref('')

// Refs
const messageInputRef = ref<HTMLTextAreaElement>()

// Computed Properties
const chats = computed(() => chatStore.chats || [])
const currentChatId = computed(() => chatStore.currentChatId)
const currentChat = computed(() => chatStore.currentChat)
const currentMessages = computed(() => currentChat.value?.messages || [])

const filteredChats = computed(() => {
  if (!searchQuery.value) return chats.value

  const query = searchQuery.value.toLowerCase()
  return chats.value.filter(chat =>
    chat.title?.toLowerCase().includes(query) ||
    chat.messages?.some((msg: Message) => msg.content.toLowerCase().includes(query))
  )
})

const canSend = computed(() => {
  return inputMessage.value.trim().length > 0 && !isLoading.value && inputMessage.value.length <= 4000
})

// Quick Suggestions
const quickSuggestions: QuickSuggestion[] = [
  {
    icon: Code2,
    title: 'Code Writing',
    description: 'Help me write a Python function to process data',
    text: 'Help me write a Python function to process data'
  },
  {
    icon: Languages,
    title: 'Translation',
    description: 'Translate this text to English',
    text: 'Translate this text to English'
  },
  {
    icon: HelpCircle,
    title: 'Q&A',
    description: 'Explain quantum computing basics',
    text: 'Explain quantum computing basics'
  },
  {
    icon: Sparkles,
    title: 'Creative Writing',
    description: 'Write a short story about a future city',
    text: 'Write a short story about a future city'
  }
]

// Methods
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
  announceToScreenReader(sidebarOpen.value ? 'Navigation opened' : 'Navigation closed')
}

const closeSidebar = () => {
  sidebarOpen.value = false
  announceToScreenReader('Navigation closed')
}

const createNewChat = () => {
  chatStore.createChat()
  if (isMobile.value) {
    closeSidebar()
  }
  announceToScreenReader('New conversation created')
  // Focus input after creating new chat
  nextTick(() => {
    messageInputRef.value?.focus()
  })
}

const selectChat = (chatId: string) => {
  chatStore.selectChat(chatId)
  const selectedChat = chats.value.find(chat => chat.id === chatId)
  announceToScreenReader(`Conversation selected: ${selectedChat?.title || 'Untitled'}`)
  
  if (isMobile.value) {
    closeSidebar()
    // Focus input after selecting chat on mobile
    nextTick(() => {
      messageInputRef.value?.focus()
    })
  }
}

const deleteChat = async (chatId: string) => {
  const chatToDelete = chats.value.find(chat => chat.id === chatId)
  if (!chatToDelete) return
  
  if (confirm(`Are you sure you want to delete "${chatToDelete.title || 'Untitled conversation'}"?`)) {
    await chatStore.deleteChat(chatId)
    announceToScreenReader('Conversation deleted')
  }
}

const sendMessage = async () => {
  if (!canSend.value) return

  const message = inputMessage.value.trim()
  inputMessage.value = ''
  
  // Reset textarea height
  if (messageInputRef.value) {
    messageInputRef.value.style.height = 'auto'
  }

  // Add user message
  await chatStore.addMessage({
    role: 'user',
    content: message,
    timestamp: new Date()
  })

  announceToScreenReader('Message sent')

  // Simulate AI response
  isLoading.value = true
  announceToScreenReader('Assistant is responding')
  
  setTimeout(async () => {
    await chatStore.addMessage({
      role: 'assistant',
      content: `This is a response to "${message}".`,
      timestamp: new Date()
    })
    isLoading.value = false
    announceToScreenReader('Response received')

    // Scroll to bottom
    nextTick(() => {
      scrollToBottom()
    })
  }, 1000)
}

const sendQuickMessage = (text: string) => {
  inputMessage.value = text
  announceToScreenReader(`Quick prompt selected: ${text}`)
  nextTick(() => {
    messageInputRef.value?.focus()
  })
}

// Enhanced keyboard navigation
const handleInputKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  } else if (event.key === 'Escape') {
    if (inputMessage.value) {
      inputMessage.value = ''
      announceToScreenReader('Input cleared')
    } else {
      messageInputRef.value?.blur()
    }
  }
}

const handleChatItemKeydown = (event: KeyboardEvent, chatId: string, index: number) => {
  switch (event.key) {
    case 'Delete':
    case 'Backspace':
      event.preventDefault()
      deleteChat(chatId)
      break
    case 'ArrowDown':
      event.preventDefault()
      focusNextChatItem(index)
      break
    case 'ArrowUp':
      event.preventDefault()
      focusPreviousChatItem(index)
      break
    case 'Home':
      event.preventDefault()
      focusFirstChatItem()
      break
    case 'End':
      event.preventDefault()
      focusLastChatItem()
      break
  }
}

const handleMessageKeydown = (event: KeyboardEvent, index: number) => {
  switch (event.key) {
    case 'c':
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
        copyMessage(currentMessages.value[index].content)
      }
      break
    case 'r':
      if ((event.ctrlKey || event.metaKey) && currentMessages.value[index].role === 'assistant') {
        event.preventDefault()
        regenerateMessage(index)
      }
      break
  }
}

const focusNextChatItem = (currentIndex: number) => {
  const nextIndex = Math.min(currentIndex + 1, filteredChats.value.length - 1)
  focusChatItemByIndex(nextIndex)
}

const focusPreviousChatItem = (currentIndex: number) => {
  const prevIndex = Math.max(currentIndex - 1, 0)
  focusChatItemByIndex(prevIndex)
}

const focusFirstChatItem = () => {
  focusChatItemByIndex(0)
}

const focusLastChatItem = () => {
  focusChatItemByIndex(filteredChats.value.length - 1)
}

const focusChatItemByIndex = (index: number) => {
  const chatItems = document.querySelectorAll('.chat-item')
  const item = chatItems[index] as HTMLElement
  item?.focus()
}

// Accessibility helpers
const announceToScreenReader = (message: string) => {
  currentAnnouncement.value = message
  // Clear after screen reader has had time to read it
  setTimeout(() => {
    currentAnnouncement.value = ''
  }, 1000)
}

const getConversationStatus = () => {
  if (isLoading.value) return 'AI is responding...'
  if (!currentChat.value) return 'No conversation selected'
  const messageCount = currentChat.value.messages?.length || 0
  return `${messageCount} message${messageCount === 1 ? '' : 's'}`
}

const getInputPlaceholder = () => {
  if (isLoading.value) return 'AI is responding...'
  return 'Type your message...'
}

// Utility methods
const formatTime = (date: Date | string | number | undefined | null) => {
  if (!date) return 'Just now'
  return formatTimeWithFallback(date)
}

const formatMessageTime = (timestamp: Date | string | undefined) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatMessageContent = (content: string) => {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
    .replace(/\n/g, '<br>')
}

const copyMessage = async (content: string) => {
  try {
    await navigator.clipboard.writeText(content)
    announceToScreenReader('Message copied to clipboard')
  } catch (error) {
    console.error('Copy failed:', error)
    announceToScreenReader('Failed to copy message')
  }
}

const regenerateMessage = async (index: number) => {
  announceToScreenReader('Regenerating response')
  // Implementation for regenerating message
  console.log('Regenerating message at index:', index)
}

const selectFiles = () => {
  announceToScreenReader('File selection opened')
  // Implementation for file selection
  console.log('Select files')
}

const handleInputChange = () => {
  adjustTextareaHeight()
}

const adjustTextareaHeight = () => {
  if (messageInputRef.value) {
    messageInputRef.value.style.height = 'auto'
    messageInputRef.value.style.height = Math.min(messageInputRef.value.scrollHeight, 128) + 'px'
  }
}

const scrollToBottom = () => {
  const container = document.querySelector('.messages-area .overflow-y-auto')
  if (container) {
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth'
    })
  }
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark')
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  announceToScreenReader(`Switched to ${isDark.value ? 'dark' : 'light'} theme`)
}

const openGlobalSearch = () => {
  showGlobalSearch.value = true
  announceToScreenReader('Global search opened')
}

const closeGlobalSearch = () => {
  showGlobalSearch.value = false
  announceToScreenReader('Global search closed')
}

const handleSearchMessageClick = (messageId: string, chatId: string) => {
  selectChat(chatId)
  closeGlobalSearch()
}

const handleSearchChatClick = (chatId: string) => {
  selectChat(chatId)
  closeGlobalSearch()
}

const handleOverlayTouchStart = (event: TouchEvent) => {
  // Handle swipe to close gesture
  const startY = event.touches[0].clientY
  const startX = event.touches[0].clientX
  
  const handleTouchMove = (moveEvent: TouchEvent) => {
    const currentX = moveEvent.touches[0].clientX
    const deltaX = currentX - startX
    
    // If swiping left significantly, close sidebar
    if (deltaX < -100) {
      closeSidebar()
    }
  }
  
  const cleanup = () => {
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', cleanup)
  }
  
  document.addEventListener('touchmove', handleTouchMove, { passive: true })
  document.addEventListener('touchend', cleanup, { once: true })
}

// Global keyboard shortcuts
const handleGlobalKeydown = (event: KeyboardEvent) => {
  const isInputFocused = document.activeElement === messageInputRef.value
  
  // Global shortcuts (only when input is not focused)
  if (!isInputFocused) {
    switch (true) {
      case (event.ctrlKey || event.metaKey) && event.key === 'k':
        event.preventDefault()
        openGlobalSearch()
        break
      case (event.ctrlKey || event.metaKey) && event.key === 'n':
        event.preventDefault()
        createNewChat()
        break
      case event.key === 'Escape':
        if (showGlobalSearch.value) {
          closeGlobalSearch()
        } else if (sidebarOpen.value && isMobile.value) {
          closeSidebar()
        }
        break
      case event.key === '/':
        event.preventDefault()
        messageInputRef.value?.focus()
        break
    }
  }
  
  // Always available shortcuts
  if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
    event.preventDefault()
    toggleTheme()
  }
}

// Platform and device detection
const detectPlatformAndDevice = () => {
  isMacOS.value = navigator.platform.toLowerCase().includes('mac')
  
  const checkMobile = () => {
    isMobile.value = window.innerWidth < 768
    if (isMobile.value) {
      sidebarCollapsed.value = true
      sidebarOpen.value = false
    } else {
      sidebarCollapsed.value = false
    }
  }

  checkMobile()
  window.addEventListener('resize', checkMobile)
  
  return () => {
    window.removeEventListener('resize', checkMobile)
  }
}

// Initialize theme
const initializeTheme = () => {
  const savedTheme = localStorage.getItem('theme')
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  
  isDark.value = savedTheme === 'dark' || (!savedTheme && systemDark)
  
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  }
  
  // Listen for system theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const handleSystemThemeChange = (e: MediaQueryListEvent) => {
    if (!localStorage.getItem('theme')) {
      isDark.value = e.matches
      document.documentElement.classList.toggle('dark', e.matches)
    }
  }
  
  mediaQuery.addListener(handleSystemThemeChange)
  
  return () => {
    mediaQuery.removeListener(handleSystemThemeChange)
  }
}

// Lifecycle
onMounted(() => {
  const cleanupPlatform = detectPlatformAndDevice()
  const cleanupTheme = initializeTheme()
  
  document.addEventListener('keydown', handleGlobalKeydown)
  
  // Announce app ready state
  setTimeout(() => {
    announceToScreenReader('MiaoDa Chat is ready')
  }, 500)

  onUnmounted(() => {
    document.removeEventListener('keydown', handleGlobalKeydown)
    cleanupPlatform()
    cleanupTheme()
  })
})

// Watchers
watch(searchQuery, () => {
  if (filteredChats.value.length === 0 && searchQuery.value) {
    announceToScreenReader(`No conversations found for "${searchQuery.value}"`)
  }
})
</script>

<style scoped>
/* Component uses global design system styles from unified-design-system.css */

/* Mobile-specific enhancements */
@media (max-width: 767px) {
  .mobile-header {
    /* Ensure safe area adaptation */
    padding-left: max(1rem, var(--safe-area-left));
    padding-right: max(1rem, var(--safe-area-right));
  }
  
  .sidebar {
    /* Full-screen sidebar on mobile */
    width: 100vw !important;
    height: 100vh;
  }
}

/* Welcome container animation */
.welcome-container {
  animation: fade-in 0.5s ease-in-out;
}

/* Suggestion cards hover effects */
.suggestion-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

@media (prefers-reduced-motion: reduce) {
  .suggestion-card:hover {
    transform: none;
  }
}

/* Message animations */
.message-wrapper {
  animation: slide-up 0.3s ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .message-wrapper {
    animation: none;
  }
}

/* Enhanced focus states for better visibility */
.chat-item:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
  background: hsl(var(--muted));
}

.message-wrapper:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 4px;
  border-radius: var(--radius-lg);
}

/* Dark theme message contrast enhancement */
.dark .message-content {
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.dark .message-user .message-content {
  background: hsl(var(--primary));
  border-color: hsl(var(--primary) / 0.3);
}

.dark .message-assistant .message-content {
  background: hsl(var(--muted));
  border-color: hsl(var(--border));
}

/* High contrast support */
@media (prefers-contrast: high) {
  .message-content {
    border: 2px solid currentColor !important;
  }
  
  .input-wrapper {
    border: 2px solid hsl(var(--border)) !important;
  }
  
  .input-wrapper:focus-within {
    border-color: hsl(var(--ring)) !important;
    box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2) !important;
  }
}

/* Touch feedback for mobile interactions */
@media (hover: none) {
  .touch-target:active {
    background: hsl(var(--muted));
    transform: scale(0.98);
  }
  
  .suggestion-card:active {
    transform: scale(0.98);
    background: hsl(var(--muted));
  }
  
  .chat-item:active {
    background: hsl(var(--muted));
  }
}
</style>