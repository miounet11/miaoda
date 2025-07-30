<template>
  <div class="chat-view flex h-full bg-background">
    <!-- 侧边栏 -->
    <aside 
      class="sidebar flex flex-col border-r border-border/50 transition-all duration-300"
      :style="{ width: sidebarWidth + 'px' }"
    >
      <!-- 侧边栏头部 -->
      <div class="sidebar-header p-4 border-b border-border/50">
        <div class="flex items-center justify-between mb-3">
          <h1 class="text-lg font-semibold">聊天</h1>
          <button
            @click="toggleSidebar"
            class="p-1.5 hover:bg-secondary/80 rounded-lg transition-colors"
            :title="sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'"
          >
            <PanelLeftClose v-if="!sidebarCollapsed" :size="18" />
            <PanelLeft v-else :size="18" />
          </button>
        </div>
        
        <!-- 新建聊天按钮 -->
        <button 
          @click="createNewChat"
          class="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 font-medium shadow-sm"
        >
          <Plus :size="18" />
          <span v-if="!sidebarCollapsed">新建聊天</span>
        </button>
      </div>
      
      <!-- 搜索栏 -->
      <div v-if="!sidebarCollapsed" class="p-3 border-b border-border/30">
        <div class="relative">
          <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索聊天..."
            class="w-full pl-9 pr-3 py-2 bg-secondary/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>
      
      <!-- 聊天列表 -->
      <div class="flex-1 overflow-y-auto p-2 space-y-1">
        <TransitionGroup name="chat-list">
          <div
            v-for="chat in filteredChats"
            :key="chat.id"
            @click="selectChat(chat.id)"
            class="chat-item group"
            :class="[
              'relative px-3 py-3 rounded-lg cursor-pointer transition-all',
              currentChatId === chat.id 
                ? 'bg-primary/10 border border-primary/20' 
                : 'hover:bg-secondary/50 border border-transparent'
            ]"
          >
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 mt-0.5">
                <MessageSquare 
                  :size="16" 
                  :class="[
                    'transition-colors',
                    currentChatId === chat.id ? 'text-primary' : 'text-muted-foreground'
                  ]"
                />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-medium text-sm truncate">{{ chat.title }}</h3>
                <p class="text-xs text-muted-foreground mt-1">{{ formatTime(chat.updatedAt) }}</p>
              </div>
              
              <!-- 操作按钮 -->
              <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  @click.stop="deleteChat(chat.id)"
                  class="p-1 hover:bg-background rounded transition-colors"
                  title="删除聊天"
                >
                  <Trash2 :size="14" class="text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            </div>
          </div>
        </TransitionGroup>
        
        <!-- 空状态 -->
        <div v-if="filteredChats.length === 0" class="text-center py-12">
          <MessageSquare :size="32" class="mx-auto mb-3 text-muted-foreground/50" />
          <p class="text-sm text-muted-foreground">
            {{ searchQuery ? '没有找到匹配的聊天' : '还没有聊天记录' }}
          </p>
        </div>
      </div>
      
      <!-- 侧边栏底部 -->
      <div class="sidebar-footer p-3 border-t border-border/50">
        <button
          @click="$router.push('/settings')"
          class="w-full px-3 py-2 hover:bg-secondary/50 rounded-lg transition-colors flex items-center gap-2"
        >
          <Settings :size="18" />
          <span v-if="!sidebarCollapsed">设置</span>
        </button>
      </div>
    </aside>
    
    <!-- 可调整大小的分隔条 -->
    <div
      class="sidebar-resizer w-1 hover:w-2 bg-transparent hover:bg-primary/20 cursor-col-resize transition-all"
      @mousedown="startResize"
    />

    <!-- 主聊天区域 -->
    <main class="flex-1 flex flex-col min-w-0">
      <!-- 聊天头部 -->
      <header class="chat-header h-14 px-4 border-b border-border/50 flex items-center justify-between bg-background/95 backdrop-blur">
        <div class="flex items-center gap-3">
          <button
            v-if="isMobile"
            @click="toggleSidebar"
            class="p-2 hover:bg-secondary/50 rounded-lg transition-colors lg:hidden"
          >
            <Menu :size="20" />
          </button>
          <h2 class="font-semibold">{{ currentChat?.title || '新对话' }}</h2>
        </div>
        
        <div class="flex items-center gap-2">
          <!-- 主题切换 -->
          <button
            @click="toggleTheme"
            class="p-2 hover:bg-secondary/50 rounded-lg transition-colors"
            :title="isDark ? '切换到亮色主题' : '切换到暗色主题'"
          >
            <Sun v-if="isDark" :size="18" />
            <Moon v-else :size="18" />
          </button>
          
          <!-- 更多操作 -->
          <button
            class="p-2 hover:bg-secondary/50 rounded-lg transition-colors"
            title="更多操作"
          >
            <MoreVertical :size="18" />
          </button>
        </div>
      </header>

      <!-- 消息区域 -->
      <div 
        class="flex-1 overflow-y-auto"
        ref="messagesContainer"
        @drop="handleDrop"
        @dragover.prevent
        @dragenter.prevent
      >
        <div class="max-w-4xl mx-auto px-4 py-6">
          <!-- 欢迎界面 -->
          <div v-if="!currentChat?.messages.length" class="welcome-screen">
            <div class="text-center py-20">
              <div class="inline-flex items-center justify-center w-16 h-16 mb-6 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl">
                <Sparkles :size="32" class="text-primary" />
              </div>
              <h2 class="text-3xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                欢迎使用 MiaoDa Chat
              </h2>
              <p class="text-muted-foreground mb-8 max-w-md mx-auto">
                我是你的 AI 助手，可以帮你回答问题、编写代码、翻译文本等
              </p>
              
              <!-- 快速开始建议 -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                <button
                  v-for="(suggestion, index) in quickSuggestions"
                  :key="index"
                  @click="sendQuickMessage(suggestion.text)"
                  class="group text-left p-4 bg-secondary/30 hover:bg-secondary/50 rounded-xl transition-all hover:scale-[1.02] hover:shadow-sm"
                >
                  <div class="flex items-start gap-3">
                    <div class="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <component :is="suggestion.icon" :size="20" class="text-primary" />
                    </div>
                    <div>
                      <h4 class="font-medium text-sm mb-1">{{ suggestion.title }}</h4>
                      <p class="text-xs text-muted-foreground">{{ suggestion.text }}</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
          
          <!-- 消息列表 -->
          <div v-else class="space-y-4">
            <TransitionGroup name="message">
              <div
                v-for="(message, index) in currentChat.messages"
                :key="message.id"
                class="message-wrapper"
                :class="[
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                ]"
              >
                <!-- 助手头像 -->
                <div v-if="message.role === 'assistant'" class="flex-shrink-0">
                  <div class="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                    <Bot :size="18" class="text-primary" />
                  </div>
                </div>
                
                <!-- 消息内容 -->
                <div class="flex flex-col gap-2 max-w-[80%] group">
                  <div
                    :class="[
                      'message-bubble rounded-2xl px-4 py-3 relative',
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground ml-auto' 
                        : 'bg-secondary/50'
                    ]"
                  >
                    <MessageContent 
                      :content="message.content" 
                      :isLoading="isLoading && index === currentChat.messages.length - 1 && message.role === 'assistant'"
                    />
                    
                    <!-- 消息操作 -->
                    <div 
                      class="message-actions absolute -bottom-8 right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background rounded-lg shadow-sm border p-1"
                      v-if="!isLoading || index !== currentChat.messages.length - 1"
                    >
                      <button
                        @click="copyMessage(message.content)"
                        class="p-1.5 hover:bg-secondary rounded transition-colors"
                        title="复制"
                      >
                        <Copy :size="14" />
                      </button>
                      <button
                        v-if="message.role === 'assistant'"
                        @click="regenerateMessage(index)"
                        class="p-1.5 hover:bg-secondary rounded transition-colors"
                        title="重新生成"
                      >
                        <RefreshCw :size="14" />
                      </button>
                    </div>
                  </div>
                  
                  <!-- 时间戳 -->
                  <div 
                    class="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    :class="message.role === 'user' ? 'text-right' : 'text-left'"
                  >
                    {{ formatMessageTime(message.createdAt) }}
                  </div>
                </div>
                
                <!-- 用户头像 -->
                <div v-if="message.role === 'user'" class="flex-shrink-0">
                  <div class="w-8 h-8 bg-gradient-to-br from-secondary to-secondary/80 rounded-lg flex items-center justify-center">
                    <User :size="18" />
                  </div>
                </div>
              </div>
            </TransitionGroup>
            
            <!-- 加载状态 -->
            <div v-if="isLoading" class="flex items-center gap-2 text-muted-foreground text-sm ml-11">
              <Loader2 :size="16" class="animate-spin" />
              <span>AI 正在思考...</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-area border-t border-border/50 bg-background/95 backdrop-blur">
        <div class="max-w-4xl mx-auto p-4">
          <!-- 配置提示 -->
          <div 
            v-if="!isConfigured" 
            class="mb-3 p-3 bg-warning/10 border border-warning/20 rounded-lg flex items-center gap-2"
          >
            <AlertCircle :size="16" class="text-warning flex-shrink-0" />
            <span class="text-sm">请先在设置中配置 LLM 提供商</span>
            <button 
              @click="$router.push('/settings')" 
              class="ml-auto text-sm font-medium text-primary hover:underline"
            >
              立即配置 →
            </button>
          </div>
          
          <!-- 附件预览 -->
          <div v-if="attachments.length > 0" class="mb-3">
            <div class="flex flex-wrap gap-2">
              <TransitionGroup name="attachment">
                <div
                  v-for="(attachment, index) in attachments"
                  :key="attachment.id"
                  class="attachment-item relative group"
                >
                  <!-- 图片附件 -->
                  <div v-if="attachment.type === 'image'" class="relative">
                    <img 
                      :src="attachment.data" 
                      :alt="attachment.name"
                      class="h-20 w-20 object-cover rounded-lg border border-border"
                    />
                    <button
                      @click="removeAttachment(index)"
                      class="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <X :size="12" />
                    </button>
                  </div>
                  
                  <!-- 文件附件 -->
                  <div v-else class="flex items-center gap-2 px-3 py-2 bg-secondary/50 rounded-lg border border-border">
                    <FileText :size="16" class="text-muted-foreground" />
                    <span class="text-sm max-w-[150px] truncate">{{ attachment.name }}</span>
                    <button
                      @click="removeAttachment(index)"
                      class="p-1 hover:bg-background rounded transition-colors"
                    >
                      <X :size="12" class="text-muted-foreground" />
                    </button>
                  </div>
                </div>
              </TransitionGroup>
            </div>
          </div>
          
          <!-- 输入框容器 -->
          <div class="relative">
            <div 
              class="input-container flex items-end gap-2 p-3 bg-secondary/30 rounded-2xl border-2 transition-all"
              :class="[
                isFocused ? 'border-primary/30 shadow-sm' : 'border-transparent'
              ]"
            >
              <!-- 附件按钮 -->
              <div class="flex gap-1 pb-1">
                <button
                  @click="selectFiles"
                  class="p-2 hover:bg-background/70 rounded-lg transition-colors group"
                  title="添加附件"
                  :disabled="isLoading"
                >
                  <Paperclip 
                    :size="20" 
                    class="transition-colors"
                    :class="isLoading ? 'text-muted-foreground/50' : 'group-hover:text-primary'"
                  />
                </button>
              </div>
              
              <!-- 文本输入框 -->
              <textarea
                v-model="inputMessage"
                @keydown.enter.prevent="handleSend"
                @focus="isFocused = true"
                @blur="isFocused = false"
                @paste="handlePaste"
                :placeholder="getPlaceholder()"
                :disabled="isLoading || !isConfigured"
                class="flex-1 min-h-[44px] max-h-[200px] px-2 py-2 bg-transparent resize-none outline-none placeholder:text-muted-foreground/60 disabled:opacity-50"
                :rows="1"
                ref="messageInput"
              />
              
              <!-- 发送按钮 -->
              <div class="pb-1">
                <button
                  @click="sendMessage"
                  :disabled="!canSend"
                  class="send-button p-2.5 rounded-lg transition-all transform"
                  :class="[
                    canSend
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 shadow-sm' 
                      : 'bg-secondary text-muted-foreground cursor-not-allowed'
                  ]"
                  :title="getSendButtonTooltip()"
                >
                  <Send :size="20" class="transition-transform" :class="canSend ? 'translate-x-0' : '-translate-x-0.5'" />
                </button>
              </div>
            </div>
            
            <!-- 快捷键提示 -->
            <div class="absolute -bottom-6 left-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                <kbd class="px-1.5 py-0.5 bg-secondary/50 rounded text-[10px] font-mono">Enter</kbd> 发送
              </span>
              <span>
                <kbd class="px-1.5 py-0.5 bg-secondary/50 rounded text-[10px] font-mono">Shift+Enter</kbd> 换行
              </span>
              <span>
                <kbd class="px-1.5 py-0.5 bg-secondary/50 rounded text-[10px] font-mono">Cmd+K</kbd> 新建对话
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
    
    <!-- 移动端侧边栏遮罩 -->
    <div
      v-if="isMobile && !sidebarCollapsed"
      class="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
      @click="toggleSidebar"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { 
  Plus, Send, Settings, Paperclip, X, FileText, Bot, User, 
  MessageSquare, Loader2, AlertCircle, Search, Trash2, Menu,
  Sun, Moon, MoreVertical, Copy, RefreshCw, PanelLeft, PanelLeftClose,
  Sparkles, Code2, Languages, HelpCircle
} from 'lucide-vue-next'
import { useChatStore } from '@renderer/src/stores/chat'
import { formatDistanceToNow } from '@renderer/src/utils/time'
import MessageContent from '@renderer/src/components/MessageContentImproved.vue'

// 类型定义
interface Attachment {
  id: string
  name: string
  type: 'image' | 'text' | 'file'
  data?: string
  content?: string
}

// 响应式数据
const chatStore = useChatStore()
const messagesContainer = ref<HTMLElement>()
const messageInput = ref<HTMLTextAreaElement>()

// 界面状态
const inputMessage = ref('')
const isLoading = ref(false)
const attachments = ref<Attachment[]>([])
const isConfigured = ref(false)
const searchQuery = ref('')
const isFocused = ref(false)
const isDark = ref(false)
const isMobile = ref(false)

// 侧边栏状态
const sidebarWidth = ref(280)
const sidebarCollapsed = ref(false)
const minSidebarWidth = 200
const maxSidebarWidth = 400

// 快速建议配置
const quickSuggestions = [
  {
    icon: Code2,
    title: '编写代码',
    text: '帮我编写一个 Python 函数来处理数据'
  },
  {
    icon: Languages,
    title: '翻译文本',
    text: '将这段文字翻译成英文'
  },
  {
    icon: HelpCircle,
    title: '解答问题',
    text: '解释量子计算的基本原理'
  },
  {
    icon: Sparkles,
    title: '创意写作',
    text: '写一个关于未来城市的短故事'
  }
]

// 计算属性
const chats = computed(() => chatStore.chats)
const currentChatId = computed(() => chatStore.currentChatId)
const currentChat = computed(() => chatStore.currentChat)

const filteredChats = computed(() => {
  if (!searchQuery.value) return chats.value
  
  const query = searchQuery.value.toLowerCase()
  return chats.value.filter(chat => 
    chat.title.toLowerCase().includes(query) ||
    chat.messages.some(msg => msg.content.toLowerCase().includes(query))
  )
})

const canSend = computed(() => {
  return (inputMessage.value.trim() || attachments.value.length > 0) && 
         !isLoading.value && 
         isConfigured.value
})

// 生命周期
onMounted(async () => {
  await chatStore.initialize()
  
  // 检查 LLM 配置
  isConfigured.value = await window.api.llm.isConfigured()
  
  // 检查主题
  isDark.value = document.documentElement.classList.contains('dark')
  
  // 检查移动端
  checkMobile()
  window.addEventListener('resize', checkMobile)
  
  // 注册快捷键
  setupShortcuts()
  
  // 恢复侧边栏宽度
  const savedWidth = localStorage.getItem('sidebarWidth')
  if (savedWidth) {
    sidebarWidth.value = parseInt(savedWidth)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  cleanupShortcuts()
})

// 监听配置变化
watch(() => chatStore.currentChatId, () => {
  // 切换聊天时滚动到底部
  nextTick(() => {
    scrollToBottom()
  })
})

// 方法
const createNewChat = () => {
  chatStore.createChat()
  if (isMobile.value) {
    sidebarCollapsed.value = true
  }
}

const selectChat = (chatId: string) => {
  chatStore.selectChat(chatId)
  if (isMobile.value) {
    sidebarCollapsed.value = true
  }
}

const deleteChat = async (chatId: string) => {
  if (confirm('确定要删除这个聊天吗？')) {
    await chatStore.deleteChat(chatId)
  }
}

const formatTime = (date: Date) => {
  return formatDistanceToNow(date)
}

const formatMessageTime = (date: Date) => {
  return new Date(date).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark')
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
  if (isMobile.value) {
    sidebarCollapsed.value = true
  }
}

// 侧边栏调整大小
const startResize = (e: MouseEvent) => {
  const startX = e.clientX
  const startWidth = sidebarWidth.value
  
  const handleMouseMove = (e: MouseEvent) => {
    const newWidth = startWidth + (e.clientX - startX)
    sidebarWidth.value = Math.max(minSidebarWidth, Math.min(maxSidebarWidth, newWidth))
  }
  
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    localStorage.setItem('sidebarWidth', sidebarWidth.value.toString())
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

// 文件处理
const selectFiles = async () => {
  const files = await window.api.file.select()
  
  for (const file of files) {
    const attachment: Attachment = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type as any,
      data: file.data,
      content: file.content
    }
    attachments.value.push(attachment)
  }
}

const handlePaste = async (event: ClipboardEvent) => {
  const items = event.clipboardData?.items
  if (!items) return
  
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      event.preventDefault()
      
      const file = item.getAsFile()
      if (!file) continue
      
      const reader = new FileReader()
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string
        const fileInfo = await window.api.file.paste(dataUrl)
        
        attachments.value.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: fileInfo.name,
          type: 'image',
          data: fileInfo.data
        })
      }
      reader.readAsDataURL(file)
    }
  }
}

const handleDrop = async (event: DragEvent) => {
  event.preventDefault()
  const files = event.dataTransfer?.files
  if (!files) return
  
  for (const file of files) {
    const reader = new FileReader()
    
    if (file.type.startsWith('image/')) {
      reader.onload = (e) => {
        attachments.value.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: 'image',
          data: e.target?.result as string
        })
      }
      reader.readAsDataURL(file)
    } else if (file.type.startsWith('text/')) {
      reader.onload = (e) => {
        attachments.value.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: 'text',
          content: e.target?.result as string
        })
      }
      reader.readAsText(file)
    }
  }
}

const removeAttachment = (index: number) => {
  attachments.value.splice(index, 1)
}

// 消息操作
const copyMessage = async (content: string) => {
  await navigator.clipboard.writeText(content)
  // TODO: 显示复制成功提示
}

const regenerateMessage = async (index: number) => {
  // TODO: 实现重新生成功能
  console.log('Regenerating message at index:', index)
}

// 发送消息
const handleSend = (e: KeyboardEvent) => {
  if (!e.shiftKey) {
    sendMessage()
  }
}

const sendQuickMessage = (message: string) => {
  inputMessage.value = message
  sendMessage()
}

const sendMessage = async () => {
  if (!canSend.value) return
  
  const message = inputMessage.value
  const messageAttachments = [...attachments.value]
  
  inputMessage.value = ''
  attachments.value = []
  
  // 构建消息内容
  let fullContent = message
  
  for (const attachment of messageAttachments) {
    if (attachment.type === 'image' && attachment.data) {
      fullContent = `![${attachment.name}](${attachment.data})\n\n${fullContent}`
    } else if (attachment.type === 'text' && attachment.content) {
      fullContent = `${fullContent}\n\n\`\`\`\n${attachment.content}\n\`\`\``
    }
  }
  
  // 添加用户消息
  await chatStore.addMessage({
    role: 'user',
    content: fullContent
  })
  
  // 滚动到底部
  await nextTick()
  scrollToBottom()
  
  // 检查配置
  if (!isConfigured.value) {
    await chatStore.addMessage({
      role: 'assistant',
      content: '请先在设置中配置 LLM 提供商。'
    })
    return
  }
  
  isLoading.value = true
  
  // 创建助手消息
  const assistantMessage = await chatStore.addMessage({
    role: 'assistant',
    content: ''
  })
  
  try {
    // 设置流式响应监听
    let streamedContent = ''
    const cleanupChunk = window.api.llm.onChunk((data: any) => {
      if (data.chatId === currentChat.value?.id && data.messageId === assistantMessage.id) {
        streamedContent += data.chunk
        const msg = currentChat.value?.messages.find(m => m.id === assistantMessage.id)
        if (msg) {
          msg.content = streamedContent
        }
        
        nextTick(() => {
          scrollToBottom()
        })
      }
    })
    
    // 发送到 LLM
    const response = await window.api.llm.sendMessage(
      fullContent,
      currentChat.value!.id,
      assistantMessage.id
    )
    
    // 更新最终响应
    const msg = currentChat.value?.messages.find(m => m.id === assistantMessage.id)
    if (msg) {
      msg.content = response
    }
    
    cleanupChunk()
  } catch (error: any) {
    const msg = currentChat.value?.messages.find(m => m.id === assistantMessage.id)
    if (msg) {
      msg.content = `错误: ${error.message}`
    }
  } finally {
    isLoading.value = false
    await nextTick()
    scrollToBottom()
  }
}

// 辅助方法
const getPlaceholder = () => {
  if (!isConfigured.value) return '请先配置 LLM 提供商...'
  if (isLoading.value) return 'AI 正在响应...'
  return '输入消息...'
}

const getSendButtonTooltip = () => {
  if (!isConfigured.value) return '请先配置 LLM 提供商'
  if (isLoading.value) return '请稍候...'
  if (!inputMessage.value.trim() && attachments.value.length === 0) return '输入消息'
  return '发送消息'
}

const scrollToBottom = () => {
  messagesContainer.value?.scrollTo({
    top: messagesContainer.value.scrollHeight,
    behavior: 'smooth'
  })
}

// 快捷键设置
const setupShortcuts = () => {
  window.addEventListener('app:new-chat', createNewChat)
  window.addEventListener('app:focus-input', () => messageInput.value?.focus())
  window.addEventListener('app:clear-chat', () => {
    if (currentChat.value && confirm('清空当前聊天？')) {
      createNewChat()
    }
  })
}

const cleanupShortcuts = () => {
  window.removeEventListener('app:new-chat', createNewChat)
}
</script>

<style scoped>
/* 动画定义 */
.chat-list-move,
.chat-list-enter-active,
.chat-list-leave-active {
  transition: all 0.3s ease;
}

.chat-list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.chat-list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.message-move,
.message-enter-active,
.message-leave-active {
  transition: all 0.3s ease;
}

.message-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.message-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.attachment-enter-active,
.attachment-leave-active {
  transition: all 0.2s ease;
}

.attachment-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.attachment-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* 自定义滚动条 */
.sidebar::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar::-webkit-scrollbar-thumb {
  @apply bg-border/50 rounded-full;
}

.sidebar::-webkit-scrollbar-thumb:hover {
  @apply bg-border;
}

/* 响应式文本域 */
textarea {
  field-sizing: content;
  min-height: 44px;
}

/* 消息气泡样式 */
.message-bubble {
  word-break: break-word;
  animation: messageIn 0.3s ease-out;
}

@keyframes messageIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 输入框聚焦效果 */
.input-container {
  transition: border-color 0.2s, box-shadow 0.2s;
}

/* 侧边栏调整大小 */
.sidebar-resizer {
  position: relative;
  flex-shrink: 0;
}

.sidebar-resizer::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 2px;
  height: 30px;
  background: currentColor;
  opacity: 0;
  transition: opacity 0.2s;
}

.sidebar-resizer:hover::after {
  opacity: 0.3;
}

/* 移动端样式 */
@media (max-width: 768px) {
  .sidebar {
    @apply fixed left-0 top-0 h-full z-50 shadow-lg;
  }
  
  .sidebar.collapsed {
    @apply -translate-x-full;
  }
  
  .sidebar-resizer {
    @apply hidden;
  }
}
</style>