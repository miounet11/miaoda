<template>
  <div v-if="isActive" class="feature-tour-overlay">
    <!-- 遮罩层 -->
    <div 
      class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] transition-opacity duration-300"
      :class="{ 'opacity-100': showOverlay, 'opacity-0': !showOverlay }"
    />
    
    <!-- 高亮区域 -->
    <div 
      v-if="currentTour"
      class="fixed z-[95] pointer-events-none transition-all duration-500 ease-out"
      :style="highlightStyle"
    >
      <div 
        class="absolute inset-0 bg-background/5 rounded-xl border-2 border-primary animate-pulse-border"
        :class="currentTour.highlightClass"
      />
    </div>
    
    <!-- 提示气泡 -->
    <div 
      v-if="currentTour"
      class="fixed z-[100] max-w-sm pointer-events-auto transition-all duration-500 ease-out"
      :style="tooltipStyle"
    >
      <div class="relative bg-background border border-border/20 rounded-2xl shadow-2xl p-6 m-4">
        <!-- 箭头 -->
        <div 
          class="absolute w-3 h-3 bg-background border-l border-t border-border/20 transform rotate-45"
          :style="arrowStyle"
        />
        
        <!-- 内容 -->
        <div class="relative z-10">
          <!-- 标题 -->
          <div class="flex items-center gap-3 mb-3">
            <div class="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <component :is="currentTour.icon" :size="18" class="text-primary" />
            </div>
            <div>
              <h3 class="font-semibold text-foreground">{{ currentTour.title }}</h3>
              <div class="text-xs text-muted-foreground">
                {{ currentStepIndex + 1 }} / {{ tours.length }}
              </div>
            </div>
          </div>
          
          <!-- 描述 -->
          <p class="text-sm text-muted-foreground leading-relaxed mb-4">
            {{ currentTour.description }}
          </p>
          
          <!-- 交互提示 -->
          <div 
            v-if="currentTour.interactionHint" 
            class="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg mb-4"
          >
            <Lightbulb :size="16" class="text-primary flex-shrink-0" />
            <span class="text-xs text-foreground">{{ currentTour.interactionHint }}</span>
          </div>
          
          <!-- 按钮组 */
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <!-- 步骤指示器 -->
          <div class="flex gap-1">
            <div
              v-for="(_, index) in tours"
              :key="index"
              class="w-2 h-2 rounded-full transition-all duration-300"
              :class="[
                index === currentStepIndex 
                  ? 'bg-primary scale-125' 
                  : index < currentStepIndex 
                    ? 'bg-green-500' 
                    : 'bg-secondary'
              ]"
            />
          </div>
        </div>
            
        <div class="flex items-center gap-2">
          <button
            v-if="currentStepIndex > 0"
            @click="previousStep"
            class="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-lg"
          >
            上一步
          </button>
              
          <button
            @click="nextStep"
            class="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors flex items-center gap-1"
          >
            {{ isLastStep ? '完成' : '下一步' }}
            <component :is="isLastStep ? Check : ArrowRight" :size="12" />
          </button>
        </div>
      </div>
          
      <!-- 跳过按钮 -->
      <div class="text-center mt-3">
        <button
          @click="skip"
          class="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
        >
          跳过导览
        </button>
      </div>
    </div>
  </div>
  </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { 
  MessageSquare, Search, Settings, Lightbulb, ArrowRight, Check,
  Mic, Send, Plus, MoreVertical, Sparkles
} from 'lucide-vue-next'

interface TourStep {
  id: string
  title: string
  description: string
  selector: string
  icon: any
  position: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  interactionHint?: string
  highlightClass?: string
  offset?: { x: number, y: number }
}

// Props
interface Props {
  autoStart?: boolean
  delay?: number
}

const props = withDefaults(defineProps<Props>(), {
  autoStart: false,
  delay: 1000
})

// Emits
const emit = defineEmits<{
  completed: []
  skipped: []
  stepChanged: [step: TourStep, index: number]
}>()

// 状态管理
const isActive = ref(false)
const showOverlay = ref(false)
const currentStepIndex = ref(0)
const highlightRect = ref<DOMRect | null>(null)

// 导览步骤配置
const tours: TourStep[] = [
  {
    id: 'new-chat',
    title: '创建新聊天',
    description: '点击这里开始一个新的对话。每个聊天都会保存你的对话历史。',
    selector: '[data-tour="new-chat-btn"]',
    icon: Plus,
    position: 'right',
    interactionHint: '试着点击创建你的第一个聊天'
  },
  {
    id: 'chat-input',
    title: '输入消息',
    description: '在这里输入你的问题或想法。支持文本、图片和文件上传。',
    selector: '[data-tour="chat-input"]',
    icon: MessageSquare,
    position: 'top',
    interactionHint: '按 Enter 发送消息，Shift+Enter 换行'
  },
  {
    id: 'voice-input',
    title: '语音输入',
    description: '点击麦克风图标或使用快捷键 Ctrl+Shift+M 进行语音输入。',
    selector: '[data-tour="voice-btn"]',
    icon: Mic,
    position: 'top',
    interactionHint: '支持多种语言的语音识别'
  },
  {
    id: 'send-button',
    title: '发送消息',
    description: '点击发送按钮或按 Enter 键发送消息给 AI。',
    selector: '[data-tour="send-btn"]',
    icon: Send,
    position: 'top'
  },
  {
    id: 'global-search',
    title: '全局搜索',
    description: '使用全局搜索快速找到历史对话。支持按内容和时间搜索。',
    selector: '[data-tour="global-search"]',
    icon: Search,
    position: 'bottom',
    interactionHint: '快捷键 Cmd+K (Mac) 或 Ctrl+K (Windows)'
  },
  {
    id: 'model-selector',
    title: '选择 AI 模型',
    description: '在这里切换不同的 AI 模型，每个模型都有独特的特点。',
    selector: '[data-tour="model-selector"]',
    icon: Sparkles,
    position: 'bottom',
    interactionHint: '不同模型在编程、创作、分析等方面各有优势'
  },
  {
    id: 'chat-list',
    title: '聊天历史',
    description: '你的所有对话都保存在这里，点击任意聊天可以继续对话。',
    selector: '[data-tour="chat-list"]',
    icon: MessageSquare,
    position: 'right',
    interactionHint: '可以通过搜索框快速找到特定对话'
  },
  {
    id: 'settings',
    title: '个性化设置',
    description: '在设置中配置 AI 提供商、调整界面主题和其他偏好设置。',
    selector: '[data-tour="settings-btn"]',
    icon: Settings,
    position: 'right',
    interactionHint: '建议先配置你喜欢的 AI 提供商'
  }
]

// 计算属性
const currentTour = computed(() => tours[currentStepIndex.value])
const isLastStep = computed(() => currentStepIndex.value === tours.length - 1)

// 高亮样式
const highlightStyle = computed(() => {
  if (!highlightRect.value) return {}
  
  const rect = highlightRect.value
  return {
    left: `${rect.left - 4}px`,
    top: `${rect.top - 4}px`,
    width: `${rect.width + 8}px`,
    height: `${rect.height + 8}px`,
  }
})

// 提示框样式
const tooltipStyle = computed(() => {
  if (!highlightRect.value || !currentTour.value) return {}
  
  const rect = highlightRect.value
  const position = currentTour.value.position
  const offset = currentTour.value.offset || { x: 0, y: 0 }
  
  let style: any = {}
  
  switch (position) {
    case 'top':
      style.left = `${rect.left + rect.width / 2 - 112}px` // 224/2 = 112 (max-w-sm)
      style.bottom = `${window.innerHeight - rect.top + 20 + offset.y}px`
      break
    case 'bottom':
      style.left = `${rect.left + rect.width / 2 - 112}px`
      style.top = `${rect.bottom + 20 + offset.y}px`
      break
    case 'left':
      style.right = `${window.innerWidth - rect.left + 20 + offset.x}px`
      style.top = `${rect.top + rect.height / 2 - 100 + offset.y}px`
      break
    case 'right':
      style.left = `${rect.right + 20 + offset.x}px`
      style.top = `${rect.top + rect.height / 2 - 100 + offset.y}px`
      break
    default: // auto
      // 智能定位逻辑
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      
      if (centerY < window.innerHeight / 2) {
        // 上半部分，提示框放下面
        style.top = `${rect.bottom + 20}px`
      } else {
        // 下半部分，提示框放上面
        style.bottom = `${window.innerHeight - rect.top + 20}px`
      }
      
      if (centerX < window.innerWidth / 2) {
        // 左半部分，提示框居左
        style.left = `${rect.left}px`
      } else {
        // 右半部分，提示框居右
        style.right = `${window.innerWidth - rect.right}px`
      }
  }
  
  return style
})

// 箭头样式
const arrowStyle = computed(() => {
  if (!currentTour.value) return {}
  
  const position = currentTour.value.position
  
  switch (position) {
    case 'top':
      return {
        bottom: '-6px',
        left: '50%',
        transform: 'translateX(-50%) rotate(45deg)',
        borderColor: 'transparent transparent var(--border) var(--border)'
      }
    case 'bottom':
      return {
        top: '-6px',
        left: '50%',
        transform: 'translateX(-50%) rotate(-135deg)',
        borderColor: 'var(--border) var(--border) transparent transparent'
      }
    case 'left':
      return {
        right: '-6px',
        top: '50%',
        transform: 'translateY(-50%) rotate(135deg)',
        borderColor: 'transparent var(--border) var(--border) transparent'
      }
    case 'right':
      return {
        left: '-6px',
        top: '50%',
        transform: 'translateY(-50%) rotate(-45deg)',
        borderColor: 'var(--border) transparent transparent var(--border)'
      }
    default:
      return {
        display: 'none'
      }
  }
})

// 方法
const startTour = async () => {
  console.log('[FeatureTour] Starting tour...')
  isActive.value = true
  currentStepIndex.value = 0
  
  // 延迟显示遮罩，确保动画流畅
  await nextTick()
  showOverlay.value = true
  
  // 更新高亮位置
  updateHighlight()
}

const nextStep = () => {
  if (isLastStep.value) {
    completeTour()
  } else {
    currentStepIndex.value++
    updateHighlight()
    emit('stepChanged', currentTour.value, currentStepIndex.value)
  }
}

const previousStep = () => {
  if (currentStepIndex.value > 0) {
    currentStepIndex.value--
    updateHighlight()
    emit('stepChanged', currentTour.value, currentStepIndex.value)
  }
}

const completeTour = () => {
  console.log('[FeatureTour] Tour completed')
  localStorage.setItem('feature-tour-completed', 'true')
  closeTour()
  emit('completed')
}

const skip = () => {
  console.log('[FeatureTour] Tour skipped')
  localStorage.setItem('feature-tour-completed', 'true')
  closeTour()
  emit('skipped')
}

const closeTour = () => {
  showOverlay.value = false
  setTimeout(() => {
    isActive.value = false
    highlightRect.value = null
  }, 300)
}

const updateHighlight = async () => {
  await nextTick()
  
  const selector = currentTour.value.selector
  const element = document.querySelector(selector) as HTMLElement
  
  if (element) {
    // 确保元素可见
    element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center',
      inline: 'center'
    })
    
    // 等待滚动完成
    setTimeout(() => {
      highlightRect.value = element.getBoundingClientRect()
    }, 500)
  } else {
    console.warn(`[FeatureTour] Element not found: ${selector}`)
    // 如果找不到元素，跳到下一步
    if (!isLastStep.value) {
      setTimeout(nextStep, 1000)
    } else {
      completeTour()
    }
  }
}

// 处理窗口大小变化
const handleResize = () => {
  if (isActive.value) {
    updateHighlight()
  }
}

// 生命周期
onMounted(() => {
  window.addEventListener('resize', handleResize)
  
  if (props.autoStart) {
    const hasCompletedTour = localStorage.getItem('feature-tour-completed')
    if (!hasCompletedTour) {
      setTimeout(startTour, props.delay)
    }
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// 监听步骤变化
watch(currentStepIndex, () => {
  updateHighlight()
})

// 暴露方法给父组件
defineExpose({
  startTour,
  nextStep,
  previousStep,
  skip,
  closeTour
})
</script>

<style scoped>
.feature-tour-overlay {
  position: relative;
  z-index: 90;
}

/* 脉冲边框动画 */
@keyframes pulse-border {
  0%, 100% {
    border-color: rgba(var(--primary), 0.6);
    box-shadow: 0 0 0 0 rgba(var(--primary), 0.4);
  }
  50% {
    border-color: rgba(var(--primary), 0.8);
    box-shadow: 0 0 0 4px rgba(var(--primary), 0.1);
  }
}

.animate-pulse-border {
  animation: pulse-border 2s ease-in-out infinite;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .max-w-sm {
    max-width: calc(100vw - 2rem);
  }
  
  .fixed[style*="left:"] {
    left: 1rem !important;
    right: 1rem !important;
    max-width: none !important;
  }
  
  .m-4 {
    margin: 1rem;
  }
}

/* 确保提示框在最上层 */
.feature-tour-overlay > .fixed {
  pointer-events: auto;
}

.feature-tour-overlay .pointer-events-none {
  pointer-events: none;
}

.feature-tour-overlay .pointer-events-auto {
  pointer-events: auto;
}
</style>