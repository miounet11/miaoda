<template>
  <div class="smart-suggestions">
    <!-- 智能提示卡片 -->
    <Transition name="card-slide-up">
      <div
        v-if="currentSuggestion && shouldShow"
        class="suggestion-card fixed bottom-24 right-6 max-w-sm bg-background border border-border/20 rounded-xl shadow-xl p-4 z-30"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
      >
        <div class="flex items-start gap-3">
          <!-- 图标 -->
          <div class="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mt-0.5">
            <component :is="currentSuggestion.icon" :size="16" class="text-primary" />
          </div>
          
          <!-- 内容 -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-sm font-medium text-foreground">{{ currentSuggestion.title }}</span>
              <div class="flex items-center gap-1">
                <div class="w-1 h-1 bg-primary/40 rounded-full animate-pulse"></div>
                <span class="text-xs text-primary font-medium">智能建议</span>
              </div>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed mb-3">
              {{ currentSuggestion.description }}
            </p>
            
            <!-- 操作按钮 -->
            <div class="flex items-center gap-2">
              <button
                @click="applySuggestion"
                class="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors flex items-center gap-1"
              >
                <Sparkles :size="12" />
                应用建议
              </button>
              <button
                @click="dismissSuggestion"
                class="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                忽略
              </button>
            </div>
          </div>
          
          <!-- 关闭按钮 -->
          <button
            @click="dismissSuggestion"
            class="flex-shrink-0 w-6 h-6 hover:bg-secondary rounded-lg flex items-center justify-center transition-colors"
          >
            <X :size="14" class="text-muted-foreground" />
          </button>
        </div>
        
        <!-- 进度条 -->
        <div class="mt-3 w-full bg-secondary/50 rounded-full h-1">
          <div 
            class="h-full bg-primary rounded-full transition-all duration-300"
            :style="{ width: `${progress}%` }"
          />
        </div>
      </div>
    </Transition>
    
    <!-- 快捷操作浮动按钮 -->
    <Transition name="fab-slide-up">
      <div
        v-if="showQuickActions && !currentSuggestion"
        class="quick-actions fixed bottom-24 right-6 z-30"
      >
        <div class="space-y-3">
          <!-- 主要快捷操作 -->
          <div class="flex flex-col gap-2">
            <button
              v-for="action in priorityActions"
              :key="action.id"
              @click="executeAction(action)"
              class="action-fab group"
              :title="action.title"
            >
              <component :is="action.icon" :size="20" class="text-primary" />
              <span class="action-label">{{ action.title }}</span>
            </button>
          </div>
          
          <!-- 展开按钮 -->
          <button
            @click="toggleQuickActions"
            class="w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
          >
            <component :is="isExpanded ? X : Plus" :size="24" />
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { 
  Lightbulb, Sparkles, X, Plus, MessageSquare, Search, Settings, 
  Code2, Languages, HelpCircle, Zap, BookOpen
} from 'lucide-vue-next'

interface Suggestion {
  id: string
  title: string
  description: string
  icon: any
  type: 'tip' | 'shortcut' | 'feature' | 'optimization'
  condition?: () => boolean
  action: () => void
  priority: number
  cooldown?: number // 冷却时间（毫秒）
}

interface QuickAction {
  id: string
  title: string
  icon: any
  action: () => void
  condition?: () => boolean
}

// Props
interface Props {
  enabled?: boolean
  autoShow?: boolean
  showInterval?: number
  maxSuggestions?: number
}

const props = withDefaults(defineProps<Props>(), {
  enabled: true,
  autoShow: true,
  showInterval: 30000, // 30秒
  maxSuggestions: 5
})

// Emits
const emit = defineEmits<{
  suggestionApplied: [suggestion: Suggestion]
  actionExecuted: [action: QuickAction]
}>()

// 状态管理
const currentSuggestion = ref<Suggestion | null>(null)
const shouldShow = ref(false)
const isHovered = ref(false)
const showQuickActions = ref(false)
const isExpanded = ref(false)
const progress = ref(0)
const dismissedSuggestions = ref<Set<string>>(new Set())
const suggestionCooldowns = ref<Map<string, number>>(new Map())

// 建议配置
const suggestions: Suggestion[] = [
  {
    id: 'first-message',
    title: '开始你的第一次对话',
    description: '试着问 AI 一个问题，比如"你好"或"帮我写一段代码"',
    icon: MessageSquare,
    type: 'tip',
    condition: () => {
      // 检查是否有消息记录
      return !localStorage.getItem('has-sent-message')
    },
    action: () => {
      // 聚焦到输入框
      const input = document.querySelector('[data-tour="chat-input"]') as HTMLElement
      input?.focus()
    },
    priority: 10
  },
  {
    id: 'keyboard-shortcuts',
    title: '使用快捷键提升效率',
    description: '按 Cmd+K 打开全局搜索，Cmd+T 创建新聊天',
    icon: Zap,
    type: 'shortcut',
    condition: () => {
      // 用户已经发送过几条消息后显示
      const messageCount = parseInt(localStorage.getItem('message-count') || '0')
      return messageCount >= 3 && !localStorage.getItem('shortcuts-tip-shown')
    },
    action: () => {
      localStorage.setItem('shortcuts-tip-shown', 'true')
      // 可以打开快捷键帮助
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '/', ctrlKey: true }))
    },
    priority: 8
  },
  {
    id: 'voice-input',
    title: '尝试语音输入功能',
    description: '按 Ctrl+Shift+M 或点击麦克风图标，直接说出你的问题',
    icon: HelpCircle,
    type: 'feature',
    condition: () => {
      const hasUsedVoice = localStorage.getItem('has-used-voice')
      const messageCount = parseInt(localStorage.getItem('message-count') || '0')
      return !hasUsedVoice && messageCount >= 2
    },
    action: () => {
      const voiceBtn = document.querySelector('[data-tour="voice-btn"]') as HTMLElement
      voiceBtn?.click()
    },
    priority: 7
  },
  {
    id: 'provider-config',
    title: '配置更多 AI 模型',
    description: '在设置中添加更多 AI 提供商，体验不同模型的特色',
    icon: Settings,
    type: 'optimization',
    condition: () => {
      const configuredProviders = JSON.parse(localStorage.getItem('configured-providers') || '[]')
      return configuredProviders.length < 2
    },
    action: () => {
      // 跳转到设置页面
      window.location.hash = '/settings'
    },
    priority: 6
  },
  {
    id: 'search-history',
    title: '搜索历史对话',
    description: '使用全局搜索功能快速找到之前的对话内容',
    icon: Search,
    type: 'feature',
    condition: () => {
      const chatCount = parseInt(localStorage.getItem('chat-count') || '0')
      return chatCount >= 3 && !localStorage.getItem('search-tip-shown')
    },
    action: () => {
      localStorage.setItem('search-tip-shown', 'true')
      // 触发全局搜索
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
    },
    priority: 5
  }
]

// 快捷操作配置
const quickActions: QuickAction[] = [
  {
    id: 'new-chat',
    title: '新建聊天',
    icon: Plus,
    action: () => {
      window.dispatchEvent(new CustomEvent('app:new-chat'))
    }
  },
  {
    id: 'global-search',
    title: '全局搜索',
    icon: Search,
    action: () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
    }
  },
  {
    id: 'help',
    title: '查看帮助',
    icon: BookOpen,
    action: () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '/', ctrlKey: true }))
    }
  }
]

// 计算属性
const availableSuggestions = computed(() => 
  suggestions
    .filter(s => !dismissedSuggestions.value.has(s.id))
    .filter(s => !suggestionCooldowns.value.has(s.id) || 
                Date.now() > (suggestionCooldowns.value.get(s.id) || 0))
    .filter(s => !s.condition || s.condition())
    .sort((a, b) => b.priority - a.priority)
    .slice(0, props.maxSuggestions)
)

const priorityActions = computed(() => 
  quickActions
    .filter(a => !a.condition || a.condition())
    .slice(0, isExpanded.value ? quickActions.length : 3)
)

// 方法
const showNextSuggestion = () => {
  if (!props.enabled || availableSuggestions.value.length === 0) return
  
  currentSuggestion.value = availableSuggestions.value[0]
  shouldShow.value = true
  
  // 重置进度条
  progress.value = 0
  
  // 自动隐藏计时器
  startAutoHideTimer()
}

const applySuggestion = () => {
  if (!currentSuggestion.value) return
  
  const suggestion = currentSuggestion.value
  
  // 执行建议的操作
  suggestion.action()
  
  // 添加冷却时间
  if (suggestion.cooldown) {
    suggestionCooldowns.value.set(suggestion.id, Date.now() + suggestion.cooldown)
  }
  
  // 发出事件
  emit('suggestionApplied', suggestion)
  
  // 隐藏建议
  dismissSuggestion()
}

const dismissSuggestion = () => {
  if (!currentSuggestion.value) return
  
  dismissedSuggestions.value.add(currentSuggestion.value.id)
  shouldShow.value = false
  
  setTimeout(() => {
    currentSuggestion.value = null
  }, 300)
}

const executeAction = (action: QuickAction) => {
  action.action()
  emit('actionExecuted', action)
  
  // 暂时隐藏快捷操作
  showQuickActions.value = false
  setTimeout(() => {
    showQuickActions.value = true
  }, 2000)
}

const toggleQuickActions = () => {
  isExpanded.value = !isExpanded.value
}

const handleMouseEnter = () => {
  isHovered.value = true
}

const handleMouseLeave = () => {
  isHovered.value = false
  // 重新启动自动隐藏计时器
  startAutoHideTimer()
}

let autoHideTimer: NodeJS.Timeout | null = null
let progressTimer: NodeJS.Timeout | null = null

const startAutoHideTimer = () => {
  if (autoHideTimer) clearTimeout(autoHideTimer)
  if (progressTimer) clearInterval(progressTimer)
  
  if (isHovered.value) return
  
  // 进度条动画
  progress.value = 0
  const duration = 8000 // 8秒自动隐藏
  const interval = 50
  const increment = (interval / duration) * 100
  
  progressTimer = setInterval(() => {
    if (isHovered.value) {
      if (progressTimer) clearInterval(progressTimer)
      return
    }
    
    progress.value += increment
    if (progress.value >= 100) {
      if (progressTimer) clearInterval(progressTimer)
      dismissSuggestion()
    }
  }, interval)
}

// 定期显示建议
let suggestionInterval: NodeJS.Timeout | null = null

const startSuggestionCycle = () => {
  if (!props.autoShow) return
  
  suggestionInterval = setInterval(() => {
    if (!shouldShow.value && !isHovered.value) {
      showNextSuggestion()
    }
  }, props.showInterval)
}

const stopSuggestionCycle = () => {
  if (suggestionInterval) {
    clearInterval(suggestionInterval)
    suggestionInterval = null
  }
}

// 生命周期
onMounted(() => {
  // 延迟启动，避免干扰初始加载
  setTimeout(() => {
    startSuggestionCycle()
    
    // 显示快捷操作
    setTimeout(() => {
      showQuickActions.value = true
    }, 2000)
  }, 5000)
  
  // 监听用户活动
  document.addEventListener('click', handleUserActivity)
  document.addEventListener('keydown', handleUserActivity)
})

onUnmounted(() => {
  stopSuggestionCycle()
  if (autoHideTimer) clearTimeout(autoHideTimer)
  if (progressTimer) clearInterval(progressTimer)
  
  document.removeEventListener('click', handleUserActivity)
  document.removeEventListener('keydown', handleUserActivity)
})

const handleUserActivity = () => {
  // 用户活动时，重置建议显示时机
  if (suggestionInterval) {
    clearInterval(suggestionInterval)
    startSuggestionCycle()
  }
}

// 监听属性变化
watch(() => props.enabled, (enabled) => {
  if (enabled) {
    startSuggestionCycle()
  } else {
    stopSuggestionCycle()
    shouldShow.value = false
  }
})

// 暴露方法
defineExpose({
  showNextSuggestion,
  dismissSuggestion
})
</script>

<style scoped>
/* 卡片滑入动画 */
.card-slide-up-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.card-slide-up-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

/* FAB 滑入动画 */
.fab-slide-up-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fab-slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fab-slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fab-slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* 建议卡片样式 */
.suggestion-card {
  backdrop-filter: blur(10px);
  border: 1px solid rgba(var(--border), 0.2);
  background: rgba(var(--background), 0.95);
  animation: gentle-glow 3s ease-in-out infinite;
}

@keyframes gentle-glow {
  0%, 100% {
    box-shadow: 0 4px 20px rgba(var(--primary), 0.1);
  }
  50% {
    box-shadow: 0 8px 30px rgba(var(--primary), 0.15);
  }
}

/* 快捷操作按钮 */
.action-fab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(var(--background), 0.95);
  border: 1px solid rgba(var(--border), 0.2);
  border-radius: 0.75rem;
  backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.action-fab:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border-color: rgba(var(--primary), 0.3);
  background: rgba(var(--background), 1);
}

.action-fab .action-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--foreground);
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s ease;
}

.action-fab:hover .action-label {
  opacity: 1;
  transform: translateX(0);
}

/* 响应式设计 */
@media (max-width: 640px) {
  .suggestion-card {
    right: 1rem;
    left: 1rem;
    bottom: 6rem;
    max-width: none;
  }
  
  .quick-actions {
    right: 1rem;
    bottom: 6rem;
  }
  
  .action-fab {
    padding: 0.5rem;
    border-radius: 50%;
    width: 2.5rem;
    height: 2.5rem;
    justify-content: center;
  }
  
  .action-fab .action-label {
    display: none;
  }
  
  .action-fab:hover .action-label {
    display: none;
  }
}

/* 确保在最上层但不阻挡交互 */
.smart-suggestions {
  pointer-events: none;
}

.smart-suggestions > * {
  pointer-events: auto;
}
</style>