<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isVisible"
        class="global-search-overlay fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click="closeIfClickOutside"
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-title"
        aria-describedby="search-description"
      >
        <div
          ref="modalRef"
          class="global-search-modal w-full max-w-2xl mt-16 sm:mt-20 bg-background border border-border rounded-xl shadow-2xl overflow-hidden"
          @click.stop
        >
          <!-- Search Header -->
          <div class="search-header p-4 border-b border-border">
            <div class="flex items-center gap-3">
              <Search :size="20" class="text-muted-foreground" aria-hidden="true" />
              <div class="flex-1">
                <label for="global-search-input" class="sr-only">Search conversations and messages</label>
                <input
                  id="global-search-input"
                  ref="searchInputRef"
                  v-model="searchQuery"
                  type="search"
                  placeholder="Search conversations and messages..."
                  class="w-full text-lg bg-transparent border-0 outline-none placeholder:text-muted-foreground focus-visible:outline-none"
                  @keydown="handleKeydown"
                  @input="handleSearchInput"
                  autocomplete="off"
                  spellcheck="false"
                />
              </div>
              <button
                @click="$emit('close')"
                class="touch-target p-2 hover:bg-muted rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Close search"
              >
                <X :size="18" aria-hidden="true" />
              </button>
            </div>
            
            <div id="search-description" class="mt-2 text-sm text-muted-foreground">
              Search through all your conversations and messages
            </div>
          </div>

          <!-- Search Results -->
          <div class="search-results max-h-96 overflow-y-auto">
            <!-- Loading State -->
            <div v-if="isSearching" class="p-8 text-center" role="status" aria-label="Searching">
              <div class="inline-flex items-center gap-2">
                <div class="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" aria-hidden="true" />
                <span class="text-sm text-muted-foreground">Searching...</span>
              </div>
            </div>

            <!-- Search Results -->
            <div v-else-if="hasResults" role="region" aria-label="Search results">
              <!-- Chat Results -->
              <div v-if="chatResults.length > 0" class="search-section">
                <h3 class="text-sm font-semibold text-muted-foreground px-4 py-2 bg-muted/30">
                  Conversations ({{ chatResults.length }})
                </h3>
                <div role="list">
                  <button
                    v-for="(chat, index) in chatResults"
                    :key="`chat-${chat.id}`"
                    @click="handleChatClick(chat.id)"
                    @keydown="handleResultKeydown($event, 'chat', index)"
                    class="search-result-item w-full text-left p-4 hover:bg-muted/50 transition-colors focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                    role="listitem"
                    :aria-label="`Conversation: ${chat.title}. ${chat.messageCount} messages. Last updated ${formatTime(chat.updatedAt)}`"
                    :data-index="index"
                    :data-type="'chat'"
                  >
                    <div class="flex items-start gap-3">
                      <MessageSquare :size="16" class="text-muted-foreground mt-1 flex-shrink-0" aria-hidden="true" />
                      <div class="flex-1 min-w-0">
                        <h4 class="font-medium text-sm truncate" v-html="highlightMatch(chat.title, searchQuery)" />
                        <p class="text-xs text-muted-foreground mt-1">
                          {{ chat.messageCount }} messages • {{ formatTime(chat.updatedAt) }}
                        </p>
                        <p v-if="chat.preview" class="text-xs text-muted-foreground mt-1 line-clamp-2" v-html="highlightMatch(chat.preview, searchQuery)" />
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <!-- Message Results -->
              <div v-if="messageResults.length > 0" class="search-section">
                <h3 class="text-sm font-semibold text-muted-foreground px-4 py-2 bg-muted/30">
                  Messages ({{ messageResults.length }})
                </h3>
                <div role="list">
                  <button
                    v-for="(message, index) in messageResults"
                    :key="`message-${message.id}`"
                    @click="handleMessageClick(message.id, message.chatId)"
                    @keydown="handleResultKeydown($event, 'message', index + chatResults.length)"
                    class="search-result-item w-full text-left p-4 hover:bg-muted/50 transition-colors focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                    role="listitem"
                    :aria-label="`Message from ${message.role === 'user' ? 'you' : 'assistant'} in conversation ${message.chatTitle}. Sent ${formatTime(message.timestamp)}`"
                    :data-index="index + chatResults.length"
                    :data-type="'message'"
                  >
                    <div class="flex items-start gap-3">
                      <div class="flex-shrink-0 mt-1">
                        <User v-if="message.role === 'user'" :size="16" class="text-primary" aria-hidden="true" />
                        <Bot v-else :size="16" class="text-green-600" aria-hidden="true" />
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                          <span class="text-xs font-medium">
                            {{ message.role === 'user' ? 'You' : 'Assistant' }}
                          </span>
                          <span class="text-xs text-muted-foreground">in {{ message.chatTitle }}</span>
                        </div>
                        <p class="text-sm line-clamp-3" v-html="highlightMatch(message.content, searchQuery)" />
                        <p class="text-xs text-muted-foreground mt-1">{{ formatTime(message.timestamp) }}</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div 
              v-else-if="searchQuery && !isSearching" 
              class="empty-state p-8 text-center"
              role="status"
              aria-live="polite"
            >
              <Search :size="48" class="mx-auto mb-4 text-muted-foreground/30" aria-hidden="true" />
              <h3 class="text-lg font-medium mb-2">No results found</h3>
              <p class="text-sm text-muted-foreground">
                Try adjusting your search terms or check the spelling
              </p>
            </div>

            <!-- Initial State -->
            <div v-else class="initial-state p-8 text-center">
              <Search :size="48" class="mx-auto mb-4 text-muted-foreground/30" aria-hidden="true" />
              <h3 class="text-lg font-medium mb-2">Search your conversations</h3>
              <p class="text-sm text-muted-foreground mb-4">
                Find messages, conversations, or specific topics
              </p>
              <div class="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                <kbd class="kbd">↑↓</kbd> <span>Navigate</span>
                <kbd class="kbd">Enter</kbd> <span>Open</span>
                <kbd class="kbd">Esc</kbd> <span>Close</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Live region for announcements -->
        <div
          aria-live="polite"
          aria-atomic="true"
          class="sr-only"
          role="status"
        >
          {{ currentAnnouncement }}
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { Search, X, MessageSquare, User, Bot } from 'lucide-vue-next'

interface Props {
  isVisible: boolean
}

interface SearchResult {
  id: string
  type: 'chat' | 'message'
  chatId?: string
  chatTitle?: string
  title?: string
  content: string
  role?: 'user' | 'assistant'
  timestamp: Date
  messageCount?: number
  preview?: string
  updatedAt?: Date
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  'message-click': [messageId: string, chatId: string]
  'chat-click': [chatId: string]
}>()

// Reactive state
const searchQuery = ref('')
const isSearching = ref(false)
const selectedIndex = ref(-1)
const currentAnnouncement = ref('')

// Refs
const searchInputRef = ref<HTMLInputElement>()
const modalRef = ref<HTMLElement>()

// Mock data - replace with actual store/service
const mockChats = [
  {
    id: '1',
    title: 'JavaScript Best Practices',
    messages: [
      { id: '1-1', role: 'user', content: 'What are JavaScript best practices?', timestamp: new Date() },
      { id: '1-2', role: 'assistant', content: 'Here are some key JavaScript best practices...', timestamp: new Date() }
    ],
    updatedAt: new Date()
  }
]

// Computed
const searchResults = computed(() => {
  if (!searchQuery.value.trim()) return []

  const query = searchQuery.value.toLowerCase().trim()
  const results: SearchResult[] = []

  // Search through chats
  mockChats.forEach(chat => {
    // Check chat title
    if (chat.title?.toLowerCase().includes(query)) {
      results.push({
        id: chat.id,
        type: 'chat',
        title: chat.title,
        content: chat.title,
        timestamp: chat.updatedAt || new Date(),
        messageCount: chat.messages?.length || 0,
        preview: chat.messages?.[chat.messages.length - 1]?.content?.substring(0, 100),
        updatedAt: chat.updatedAt
      })
    }

    // Search through messages
    if (chat.messages) {
      chat.messages.forEach(message => {
        if (message.content.toLowerCase().includes(query)) {
          results.push({
            id: message.id,
            type: 'message',
            chatId: chat.id,
            chatTitle: chat.title || 'Untitled',
            content: message.content,
            role: message.role,
            timestamp: message.timestamp || new Date()
          })
        }
      })
    }
  })

  return results.slice(0, 20) // Limit results
})

const chatResults = computed(() => 
  searchResults.value.filter(result => result.type === 'chat')
)

const messageResults = computed(() => 
  searchResults.value.filter(result => result.type === 'message')
)

const hasResults = computed(() => searchResults.value.length > 0)

const totalResults = computed(() => searchResults.value.length)

// Methods
const handleSearchInput = () => {
  isSearching.value = true
  selectedIndex.value = -1
  
  // Debounce search
  setTimeout(() => {
    isSearching.value = false
  }, 300)
}

const handleKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'Escape':
      event.preventDefault()
      emit('close')
      break
    
    case 'ArrowDown':
      event.preventDefault()
      navigateResults(1)
      break
    
    case 'ArrowUp':
      event.preventDefault()
      navigateResults(-1)
      break
    
    case 'Enter':
      event.preventDefault()
      selectCurrentResult()
      break
  }
}

const handleResultKeydown = (event: KeyboardEvent, type: string, index: number) => {
  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault()
      if (type === 'chat') {
        handleChatClick(chatResults.value[index].id)
      } else {
        const result = messageResults.value[index - chatResults.value.length]
        handleMessageClick(result.id, result.chatId!)
      }
      break
  }
}

const navigateResults = (direction: number) => {
  const maxIndex = totalResults.value - 1
  
  if (direction > 0) {
    selectedIndex.value = selectedIndex.value >= maxIndex ? 0 : selectedIndex.value + 1
  } else {
    selectedIndex.value = selectedIndex.value <= 0 ? maxIndex : selectedIndex.value - 1
  }
  
  // Focus the selected result
  focusSelectedResult()
}

const focusSelectedResult = () => {
  nextTick(() => {
    const resultElements = modalRef.value?.querySelectorAll('.search-result-item')
    const selectedElement = resultElements?.[selectedIndex.value] as HTMLElement
    selectedElement?.focus()
  })
}

const selectCurrentResult = () => {
  const selectedResult = searchResults.value[selectedIndex.value]
  if (!selectedResult) return

  if (selectedResult.type === 'chat') {
    handleChatClick(selectedResult.id)
  } else {
    handleMessageClick(selectedResult.id, selectedResult.chatId!)
  }
}

const handleChatClick = (chatId: string) => {
  emit('chat-click', chatId)
  announceToScreenReader('Opening conversation')
}

const handleMessageClick = (messageId: string, chatId: string) => {
  emit('message-click', messageId, chatId)
  announceToScreenReader('Jumping to message')
}

const closeIfClickOutside = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    emit('close')
  }
}

const highlightMatch = (text: string, query: string) => {
  if (!query.trim()) return text
  
  const regex = new RegExp(`(${escapeRegex(query.trim())})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800/50 px-1 rounded">$1</mark>')
}

const escapeRegex = (str: string) => {
  return str.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')
}

const formatTime = (date: Date | string | undefined) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString()
}

// Screen reader announcements
const announceToScreenReader = (message: string) => {
  currentAnnouncement.value = message
  setTimeout(() => {
    currentAnnouncement.value = ''
  }, 1000)
}

// Trap focus within modal
const trapFocus = (event: KeyboardEvent) => {
  if (!props.isVisible) return
  
  const focusableElements = modalRef.value?.querySelectorAll(
    'input, button, textarea, select, a[href], [tabindex]:not([tabindex="-1"])'
  )
  
  if (!focusableElements?.length) return
  
  const firstElement = focusableElements[0] as HTMLElement
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
  
  if (event.key === 'Tab') {
    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', trapFocus)
})

onUnmounted(() => {
  document.removeEventListener('keydown', trapFocus)
})

// Watchers
watch(() => props.isVisible, (visible) => {
  if (visible) {
    nextTick(() => {
      searchInputRef.value?.focus()
    })
    document.body.style.overflow = 'hidden'
    announceToScreenReader('Search dialog opened')
  } else {
    searchQuery.value = ''
    selectedIndex.value = -1
    document.body.style.overflow = ''
    announceToScreenReader('Search dialog closed')
  }
})

watch(searchQuery, () => {
  if (searchQuery.value.trim()) {
    announceToScreenReader(`Searching for: ${searchQuery.value}`)
  }
})

watch(totalResults, (count) => {
  if (searchQuery.value.trim() && !isSearching.value) {
    announceToScreenReader(`Found ${count} result${count === 1 ? '' : 's'}`)
  }
})
</script>

<style scoped>
/* Modal animations */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.modal-enter-from .global-search-modal,
.modal-leave-to .global-search-modal {
  transform: translateY(-20px) scale(0.95);
}

/* Search result highlighting */
.search-result-item {
  border-radius: 0.5rem;
}

.search-result-item:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}

/* Line clamp utility */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}

/* Keyboard shortcut styling */
.kbd {
  display: inline-block;
  padding: 2px 6px;
  background: hsl(var(--muted));
  border: 1px solid hsl(var(--border));
  border-radius: 4px;
  font-size: 11px;
  font-family: ui-monospace, monospace;
  font-weight: 500;
}

/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Touch target optimization */
.touch-target {
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Mobile responsive */
@media (max-width: 640px) {
  .global-search-modal {
    margin: 1rem;
    margin-top: 2rem;
    max-height: calc(100vh - 4rem);
  }
  
  .search-results {
    max-height: calc(100vh - 12rem);
  }
  
  .touch-target {
    min-height: 48px;
    min-width: 48px;
  }
}

/* High contrast support */
@media (prefers-contrast: high) {
  .search-result-item:hover,
  .search-result-item:focus {
    background: hsl(var(--foreground) / 0.1);
    border: 2px solid hsl(var(--foreground) / 0.3);
  }
  
  .global-search-modal {
    border: 2px solid hsl(var(--foreground) / 0.3);
  }
}

/* Dark theme enhancements */
.dark mark {
  background: rgba(250, 204, 21, 0.3);
  color: rgb(254, 240, 138);
}

/* Animation performance optimization */
@media (prefers-reduced-motion: reduce) {
  .modal-enter-active,
  .modal-leave-active {
    transition: opacity 0.2s ease;
  }
  
  .modal-enter-from,
  .modal-leave-to {
    opacity: 0;
    transform: none;
  }
  
  .animate-spin {
    animation: none;
  }
}
</style>