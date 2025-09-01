<template>
  <div class="modern-chat-container">
    <!-- 侧边栏 -->
    <aside
      :class="[
        'modern-sidebar',
        { collapsed: sidebarCollapsed, open: sidebarOpen && isMobile }
      ]"
    >
      <!-- 侧边栏头部 -->
      <div class="modern-sidebar-header">
        <button
          v-if="isMobile"
          @click="closeSidebar"
          class="modern-menu-btn"
          aria-label="关闭侧边栏"
        >
          <X :size="20" />
        </button>
        <div v-else class="flex-1"></div>
      </div>

      <!-- 新建聊天按钮 -->
      <div class="px-4">
        <button @click="createNewChat" class="modern-new-chat-btn" aria-label="按钮">
          <Plus :size="16" />
          <span>新建聊天</span>
        </button>
      </div>

      <!-- 搜索框 -->
      <div class="modern-search-box">
        <Search class="modern-search-icon" :size="16" />
        <input
          v-model="searchQuery"
          type="text"
          class="modern-search-input"
          placeholder="搜索聊天记录..."
          @input="debouncedSearch"
         aria-label="输入框">
      </div>

      <!-- 聊天列表 -->
      <div class="modern-chat-list">
        <div
          v-for="chat in filteredChats"
          :key="chat.id"
          :class="[
            'modern-chat-item',
            { active: currentChatId === chat.id }
          ]"
          @click="selectChat(chat.id)"
        >
          <MessageSquare class="modern-chat-icon" :size="16" />
          <div class="modern-chat-content">
            <div class="modern-chat-title">{{ chat.title || '新对话' }}</div>
            <div class="modern-chat-time">{{ formatTime(chat.updatedAt) }}</div>
          </div>
          <div class="modern-chat-actions">
            <button
              @click.stop="deleteChat(chat.id)"
              class="modern-chat-action-btn"
              title="删除聊天"
             aria-label="按钮">
              <Trash2 :size="14" />
            </button>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="filteredChats.length === 0" class="text-center py-12">
          <MessageSquare :size="32" class="mx-auto mb-4 text-muted-foreground/50" />
          <p class="text-sm text-muted-foreground">
            {{ searchQuery ? '没有找到匹配的聊天' : '还没有聊天记录' }}
          </p>
        </div>
      </div>

      <!-- 侧边栏底部 -->
      <div class="p-4 border-t border-border/10 space-y-2">
        <button
          @click="$router.push('/settings')"
          class="w-full px-4 py-3 hover:bg-muted/50 rounded-lg transition-all flex items-center gap-3 font-medium"
          :class="{ 'bg-primary/10 border border-primary/20': $route.name === 'settings' }"
         aria-label="按钮">
          <Settings :size="20" class="text-muted-foreground" />
          <span class="text-base">设置</span>
        </button>
      </div>
    </aside>

    <!-- 主聊天区域 -->
    <main class="modern-main-chat">
      <!-- 聊天头部 -->
      <header class="modern-chat-header">
        <div class="modern-header-left">
          <button
            v-if="isMobile || sidebarCollapsed"
            @click="openSidebar"
            class="modern-menu-btn"
            aria-label="打开侧边栏"
          >
            <Menu :size="20" />
          </button>

          <div class="modern-chat-title-wrapper">
            <div class="modern-chat-title-text">
              {{ currentChat?.title || '新对话' }}
            </div>
            <div v-if="isLoading" class="modern-chat-subtitle">
              AI 正在思考...
            </div>
            <div v-else-if="currentChat?.messages?.length" class="modern-chat-subtitle">
              {{ currentChat.messages.length }} 条消息
            </div>
          </div>
        </div>

        <div class="modern-header-right">
          <!-- 搜索 -->
          <button
            @click="openGlobalSearch"
            class="modern-header-btn"
            title="搜索对话 (⌘K)"
           aria-label="按钮">
            <Search :size="18" />
          </button>

          <!-- 主题切换 -->
          <button
            @click="toggleTheme"
            class="modern-header-btn"
            :title="isDark ? '切换到亮色主题' : '切换到暗色主题'"
           aria-label="按钮">
            <Sun v-if="isDark" :size="18" />
            <Moon v-else :size="18" />
          </button>

          <!-- 设置 -->
          <button
            v-if="sidebarCollapsed || isMobile"
            @click="$router.push('/settings')"
            class="modern-header-btn"
            title="设置"
           aria-label="按钮">
            <Settings :size="18" />
          </button>
        </div>
      </header>

      <!-- 消息区域 -->
      <div class="modern-messages-area">
        <div class="modern-messages-container">
          <!-- 欢迎界面 -->
          <div
            v-if="!currentChat || (!currentChat.messages?.length && !isLoading)"
            class="modern-welcome-screen"
          >
            <div class="modern-welcome-icon">
              <Sparkles :size="32" />
            </div>
            <h1 class="modern-welcome-title">MiaoDa Chat</h1>
            <p class="modern-welcome-subtitle">
              您的智能 AI 助手，随时准备解答问题、编写代码、翻译文本等
            </p>

            <div class="modern-suggestions-grid">
              <div
                v-for="(suggestion, index) in quickSuggestions"
                :key="index"
                @click="sendQuickMessage(suggestion.text)"
                class="modern-suggestion-card"
              >
                <component :is="suggestion.icon" class="modern-suggestion-icon" :size="24" />
                <h3 class="modern-suggestion-title">{{ suggestion.title }}</h3>
                <p class="modern-suggestion-desc">{{ suggestion.description }}</p>
              </div>
            </div>
          </div>

          <!-- 消息列表 -->
          <div v-else class="space-y-6">
            <div
              v-for="(message, index) in currentMessages"
              :key="message.id"
              :class="[
                'modern-message-wrapper',
                message.role === 'user' ? 'modern-user-message' : 'modern-assistant-message'
              ]"
            >
              <!-- 头像 -->
              <div
                :class="[
                  'modern-message-avatar',
                  message.role === 'user' ? 'modern-user-avatar' : 'modern-assistant-avatar'
                ]"
              >
                {{ message.role === 'user' ? 'U' : 'A' }}
              </div>

              <!-- 消息内容 -->
              <div class="modern-message-content">
                <div class="modern-message-header">
                  <span class="modern-message-author">
                    {{ message.role === 'user' ? '您' : 'MiaoDa' }}
                  </span>
                  <span class="modern-message-time">
                    {{ formatMessageTime(message.timestamp) }}
                  </span>
                </div>

                <div class="modern-message-bubble">
                  <div v-html="formatMessageContent(message.content)"></div>
                </div>

                <!-- 消息操作 -->
                <div class="modern-message-actions">
                  <button
                    @click="copyMessage(message.content)"
                    class="modern-message-action-btn"
                    title="复制消息"
                   aria-label="按钮">
                    <Copy :size="14" />
                  </button>
                  <button
                    v-if="message.role === 'assistant'"
                    @click="regenerateMessage(index)"
                    class="modern-message-action-btn"
                    title="重新生成"
                   aria-label="按钮">
                    <RefreshCw :size="14" />
                  </button>
                </div>
              </div>
            </div>

            <!-- 打字指示器 -->
            <div v-if="isLoading" class="modern-typing-indicator">
              <div class="modern-typing-avatar">A</div>
              <div class="modern-typing-content">
                <div class="modern-typing-bubble">
                  <span>AI 正在思考</span>
                  <div class="modern-typing-dots">
                    <div class="modern-typing-dot"></div>
                    <div class="modern-typing-dot"></div>
                    <div class="modern-typing-dot"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="modern-input-area">
        <div class="modern-input-container">
          <div class="modern-input-wrapper">
            <textarea
              v-model="inputMessage"
              @keydown.enter.prevent="handleSend"
              @input="onInputChange"
              :placeholder="getPlaceholder()"
              :disabled="isLoading"
              class="modern-input-field"
              rows="1"
              ref="messageInput"
            />

            <div class="modern-input-actions">
              <!-- 附件按钮 -->
              <button
                @click="selectFiles"
                class="modern-attach-btn"
                title="添加附件"
                :disabled="isLoading"
               aria-label="按钮">
                <Paperclip :size="18" />
              </button>

              <!-- 发送按钮 -->
              <button
                @click="sendMessage"
                :disabled="!canSend"
                class="modern-send-btn"
                :title="canSend ? '发送消息' : '输入消息后发送'"
               aria-label="按钮">
                <Send :size="18" />
              </button>
            </div>
          </div>

          <!-- 输入提示 -->
          <div class="flex items-center justify-between text-xs text-muted-foreground mt-2 px-1">
            <div class="flex items-center gap-4">
              <span>Enter 发送</span>
              <span>Shift+Enter 换行</span>
              <span v-if="!isMobile">⌘K 搜索</span>
            </div>
            <span v-if="inputCharacterCount > 0">
              {{ inputCharacterCount }}/4000
            </span>
          </div>
        </div>
      </div>
    </main>

    <!-- 移动端遮罩 -->
    <div
      v-if="isMobile && (sidebarOpen || !sidebarCollapsed)"
      class="fixed inset-0 bg-black/50 z-40"
      @click="closeSidebar"
    />

    <!-- 全局搜索 -->
    <GlobalSearch
      v-if="showGlobalSearch"
      :is-visible="showGlobalSearch"
      @close="showGlobalSearch = false"
      @message-click="handleSearchMessageClick"
      @chat-click="handleSearchChatClick"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import {
  Plus,
  Send,
  Search,
  Settings,
  Menu,
  X,
  MessageSquare,
  Trash2,
  Sun,
  Moon,
  Copy,
  RefreshCw,
  Paperclip,
  Sparkles,
  Code2,
  Languages,
  HelpCircle
} from 'lucide-vue-next'
import { useChatStore } from '@/stores/chat'
import { useSettingsStore } from '@/stores/settings'
import { formatTimeWithFallback } from '@/utils/time'
import { debounce } from '@/utils/performance'
import GlobalSearch from '@/components/search/GlobalSearch.vue'

// 类型定义
interface QuickSuggestion {
  icon: any
  title: string
  description: string
  text: string
}

// 响应式数据
const chatStore = useChatStore()
const settingsStore = useSettingsStore()

// 界面状态
const sidebarCollapsed = ref(false)
const sidebarOpen = ref(false)
const searchQuery = ref('')
const inputMessage = ref('')
const isLoading = ref(false)
const showGlobalSearch = ref(false)
const inputCharacterCount = ref(0)
const isDark = ref(false)
const isMobile = ref(false)
const messageInput = ref<HTMLTextAreaElement>()

// 计算属性
const chats = computed(() => chatStore.chats || [])
const currentChatId = computed(() => chatStore.currentChatId)
const currentChat = computed(() => chatStore.currentChat)
const currentMessages = computed(() => currentChat.value?.messages || [])

const filteredChats = computed(() => {
  if (!searchQuery.value) return chats.value

  const query = searchQuery.value.toLowerCase()
  return chats.value.filter(chat =>
    chat.title?.toLowerCase().includes(query) ||
    chat.messages?.some(msg => msg.content.toLowerCase().includes(query))
  )
})

const canSend = computed(() => {
  return inputMessage.value.trim().length > 0 && !isLoading.value
})

// 快速建议
const quickSuggestions: QuickSuggestion[] = [
  {
    icon: Code2,
    title: '代码编写',
    description: '帮我编写一个 Python 函数来处理数据',
    text: '帮我编写一个 Python 函数来处理数据'
  },
  {
    icon: Languages,
    title: '文本翻译',
    description: '将这段文字翻译成英文',
    text: '将这段文字翻译成英文'
  },
  {
    icon: HelpCircle,
    title: '问题解答',
    description: '解释量子计算的基本原理',
    text: '解释量子计算的基本原理'
  },
  {
    icon: Sparkles,
    title: '创意写作',
    description: '写一个关于未来城市的短故事',
    text: '写一个关于未来城市的短故事'
  }
]

// 方法
const createNewChat = () => {
  chatStore.createChat()
  if (isMobile.value) {
    closeSidebar()
  }
}

const selectChat = (chatId: string) => {
  chatStore.selectChat(chatId)
  if (isMobile.value) {
    closeSidebar()
  }
}

const deleteChat = async (chatId: string) => {
  if (confirm('确定要删除这个对话吗？')) {
    await chatStore.deleteChat(chatId)
  }
}

const formatTime = (date: Date | string | number | undefined | null) => {
  if (!date) return '刚刚'
  return formatTimeWithFallback(date)
}

const formatMessageTime = (timestamp: Date | string | undefined) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatMessageContent = (content: string) => {
  // 简单的Markdown处理
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
}

const openSidebar = () => {
  sidebarOpen.value = true
}

const closeSidebar = () => {
  sidebarOpen.value = false
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark')
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

const openGlobalSearch = () => {
  showGlobalSearch.value = true
}

const sendQuickMessage = (text: string) => {
  inputMessage.value = text
  sendMessage()
}

const handleSend = (event: KeyboardEvent) => {
  if (!event.shiftKey) {
    sendMessage()
  }
}

const sendMessage = async () => {
  if (!canSend.value) return

  const message = inputMessage.value.trim()
  inputMessage.value = ''

  // 添加用户消息
  await chatStore.addMessage({
    role: 'user',
    content: message,
    timestamp: new Date()
  })

  // 模拟AI回复
  isLoading.value = true
  setTimeout(async () => {
    await chatStore.addMessage({
      role: 'assistant',
      content: `这是对"${message}"的回复。`,
      timestamp: new Date()
    })
    isLoading.value = false

    // 滚动到底部
    nextTick(() => {
      scrollToBottom()
    })
  }, 1000)
}

const copyMessage = async (content: string) => {
  try {
    await navigator.clipboard.writeText(content)
    // 这里可以添加一个toast通知
  } catch (error) {
    console.error('复制失败:', error)
  }
}

const regenerateMessage = async (index: number) => {
  // 重新生成消息的逻辑
  console.log('重新生成消息:', index)
}

const selectFiles = () => {
  // 文件选择逻辑
  console.log('选择文件')
}

const onInputChange = () => {
  inputCharacterCount.value = inputMessage.value.length
  adjustTextareaHeight()
}

const adjustTextareaHeight = () => {
  if (messageInput.value) {
    messageInput.value.style.height = 'auto'
    messageInput.value.style.height = Math.min(messageInput.value.scrollHeight, 200) + 'px'
  }
}

const getPlaceholder = () => {
  if (isLoading.value) return 'AI 正在思考...'
  return '输入消息...'
}

const scrollToBottom = () => {
  // 滚动到底部的逻辑
  const container = document.querySelector('.modern-messages-area')
  if (container) {
    container.scrollTop = container.scrollHeight
  }
}

const debouncedSearch = debounce(() => {
  // 搜索逻辑
}, 300)

const handleSearchMessageClick = (messageId: string, chatId: string) => {
  chatStore.selectChat(chatId)
  showGlobalSearch.value = false
  // 这里可以添加定位到特定消息的逻辑
}

const handleSearchChatClick = (chatId: string) => {
  chatStore.selectChat(chatId)
  showGlobalSearch.value = false
}

// 生命周期
onMounted(() => {
  // 检测主题
  isDark.value = document.documentElement.classList.contains('dark')

  // 检测移动端
  const checkMobile = () => {
    isMobile.value = window.innerWidth < 768
    if (isMobile.value) {
      sidebarCollapsed.value = true
    }
  }

  checkMobile()
  window.addEventListener('resize', checkMobile)

  // 键盘快捷键
  const handleKeydown = (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault()
      openGlobalSearch()
    }
  }

  document.addEventListener('keydown', handleKeydown)

  onUnmounted(() => {
    window.removeEventListener('resize', checkMobile)
    document.removeEventListener('keydown', handleKeydown)
  })
})
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
/* 样式已在统一样式系统中定义 - unified-design-system.css */


/* 无障碍支持 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* 焦点样式 */
:focus-visible {
  outline: 2px solid hsl(var(--ring, 59 130 230));
  outline-offset: 2px;
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
