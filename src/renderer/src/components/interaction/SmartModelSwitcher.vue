<template>
  <div class="smart-model-switcher relative">
    <!-- 主切换器 -->
    <div class="model-selector-container">
      <button
        @click="toggleDropdown"
        class="model-selector flex items-center gap-3 px-4 py-2 bg-secondary/60 hover:bg-secondary/80 rounded-xl transition-all group border border-transparent hover:border-primary/20 min-w-[180px]"
        :class="{ 'border-primary/50 bg-secondary/90': isOpen }"
        data-tour="model-selector"
      >
        <!-- 提供商图标 -->
        <div class="provider-icon relative">
          <div 
            class="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            :class="[
              getCurrentProviderColor(),
              'group-hover:scale-110'
            ]"
          >
            <component :is="getCurrentProviderIcon()" :size="18" class="text-white" />
          </div>
          
          <!-- 连接状态指示器 -->
          <div 
            class="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background transition-all"
            :class="[
              connectionStatus === 'connected' ? 'bg-green-500' :
              connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
              'bg-red-500'
            ]"
            :title="getConnectionStatusText()"
          />
        </div>
        
        <!-- 模型信息 -->
        <div class="model-info flex-1 text-left">
          <div class="model-name font-medium text-sm truncate">
            {{ currentModel?.name || '选择模型' }}
          </div>
          <div class="provider-name text-xs text-muted-foreground truncate">
            {{ getCurrentProviderName() }}
          </div>
        </div>
        
        <!-- 下拉箭头 -->
        <ChevronDown 
          :size="16" 
          class="transition-transform duration-200"
          :class="{ 'rotate-180': isOpen }"
        />
        
        <!-- 智能推荐标识 -->
        <div 
          v-if="hasRecommendation"
          class="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse"
          title="有智能推荐"
        />
      </button>
    </div>
    
    <!-- 下拉菜单 -->
    <Transition name="dropdown-slide">
      <div
        v-if="isOpen"
        class="dropdown-menu absolute top-full left-0 right-0 mt-2 bg-background border border-border/20 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-sm"
      >
        <!-- 智能推荐区域 -->
        <div v-if="recommendation" class="recommendation-section p-3 bg-gradient-to-r from-primary/5 to-transparent border-b border-border/10">
          <div class="flex items-center gap-2 mb-2">
            <Sparkles :size="14" class="text-primary" />
            <span class="text-xs font-medium text-primary">智能推荐</span>
          </div>
          <button
            @click="applyRecommendation"
            class="w-full flex items-center gap-3 p-2 hover:bg-primary/10 rounded-lg transition-colors text-left"
          >
            <div class="w-6 h-6 bg-primary/20 rounded flex items-center justify-center">
              <component :is="recommendation.icon" :size="12" class="text-primary" />
            </div>
            <div class="flex-1">
              <div class="text-sm font-medium">{{ recommendation.title }}</div>
              <div class="text-xs text-muted-foreground">{{ recommendation.reason }}</div>
            </div>
          </button>
        </div>
        
        <!-- 模型列表 -->
        <div class="models-list max-h-96 overflow-y-auto">
          <div 
            v-for="provider in availableProviders" 
            :key="provider.id"
            class="provider-section"
          >
            <!-- 提供商标题 -->
            <div class="provider-header sticky top-0 bg-background/95 backdrop-blur-sm px-3 py-2 border-b border-border/10">
              <div class="flex items-center gap-2">
                <component :is="provider.icon" :size="16" :class="provider.color" />
                <span class="text-sm font-medium">{{ provider.name }}</span>
                <div 
                  v-if="provider.status === 'configured'"
                  class="ml-auto w-2 h-2 bg-green-500 rounded-full"
                  title="已配置"
                />
                <div 
                  v-else
                  class="ml-auto text-xs text-muted-foreground"
                >
                  未配置
                </div>
              </div>
            </div>
            
            <!-- 模型列表 -->
            <div class="models-list">
              <template v-if="provider.status === 'configured'">
                <button
                  v-for="model in provider.models"
                  :key="model.id"
                  @click="selectModel(provider.id, model)"
                  class="model-item w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
                  :class="{ 'bg-primary/10 border-l-2 border-l-primary': isCurrentModel(provider.id, model.id) }"
                >
                  <!-- 模型能力指示器 -->
                  <div class="capabilities flex gap-1">
                    <div 
                      v-if="model.capabilities.includes('text')"
                      class="capability-badge"
                      title="文本处理"
                    >
                      <Type :size="10" />
                    </div>
                    <div 
                      v-if="model.capabilities.includes('image')"
                      class="capability-badge bg-blue-500/20 text-blue-500"
                      title="图像理解"
                    >
                      <Image :size="10" />
                    </div>
                    <div 
                      v-if="model.capabilities.includes('code')"
                      class="capability-badge bg-green-500/20 text-green-500"
                      title="代码生成"
                    >
                      <Code2 :size="10" />
                    </div>
                    <div 
                      v-if="model.capabilities.includes('function')"
                      class="capability-badge bg-purple-500/20 text-purple-500"
                      title="函数调用"
                    >
                      <Zap :size="10" />
                    </div>
                  </div>
                  
                  <!-- 模型信息 -->
                  <div class="model-details flex-1">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-medium">{{ model.name }}</span>
                      <div class="performance-indicators flex gap-1">
                        <!-- 速度指示器 -->
                        <div 
                          class="performance-bar"
                          :class="getPerformanceColor(model.performance.speed)"
                          :style="{ width: `${(model.performance.speed / 5) * 100}%` }"
                          title="速度"
                        />
                        <!-- 质量指示器 -->
                        <div 
                          class="performance-bar"
                          :class="getPerformanceColor(model.performance.quality)"
                          :style="{ width: `${(model.performance.quality / 5) * 100}%` }"
                          title="质量"
                        />
                      </div>
                    </div>
                    <div class="text-xs text-muted-foreground flex items-center gap-2">
                      <span>{{ model.description }}</span>
                      <div v-if="model.contextLength" class="context-info">
                        • {{ formatContextLength(model.contextLength) }} 上下文
                      </div>
                    </div>
                  </div>
                  
                  <!-- 选中标识 -->
                  <Check 
                    v-if="isCurrentModel(provider.id, model.id)"
                    :size="16" 
                    class="text-primary" 
                  />
                </button>
              </template>
              
              <!-- 未配置提示 -->
              <div v-else class="px-4 py-6 text-center">
                <div class="text-sm text-muted-foreground mb-3">
                  尚未配置 {{ provider.name }}
                </div>
                <button
                  @click="configureProvider(provider.id)"
                  class="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
                >
                  立即配置
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 底部操作 -->
        <div class="dropdown-footer border-t border-border/10 p-3">
          <div class="flex items-center justify-between">
            <button
              @click="openSettings"
              class="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings :size="12" />
              管理提供商
            </button>
            
            <div class="flex items-center gap-2">
              <!-- 使用统计 -->
              <div v-if="usageStats" class="usage-stats text-xs text-muted-foreground">
                今日: {{ usageStats.today }} 次
              </div>
              
              <!-- 刷新按钮 -->
              <button
                @click="refreshModels"
                :disabled="isRefreshing"
                class="p-1 hover:bg-secondary/50 rounded transition-colors"
                title="刷新模型列表"
              >
                <RotateCcw :size="12" :class="{ 'animate-spin': isRefreshing }" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
    
    <!-- 快捷切换按钮（紧凑模式） -->
    <div v-if="showQuickSwitch" class="quick-switch-buttons flex gap-1 mt-2">
      <button
        v-for="model in frequentModels"
        :key="`${model.providerId}-${model.id}`"
        @click="selectModel(model.providerId, model)"
        class="quick-switch-btn px-2 py-1 text-xs rounded-md transition-colors"
        :class="[
          isCurrentModel(model.providerId, model.id)
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground'
        ]"
        :title="model.name"
      >
        {{ model.shortName || model.name.slice(0, 3) }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  ChevronDown, Check, Settings, Sparkles, Type, Image, Code2, Zap, 
  RotateCcw, Bot, Brain, Star, Cpu
} from 'lucide-vue-next'

interface Model {
  id: string
  name: string
  shortName?: string
  description: string
  capabilities: string[]
  contextLength?: number
  performance: {
    speed: number // 1-5
    quality: number // 1-5
  }
}

interface Provider {
  id: string
  name: string
  icon: any
  color: string
  status: 'configured' | 'not-configured'
  models: Model[]
}

interface Recommendation {
  title: string
  reason: string
  providerId: string
  modelId: string
  icon: any
}

interface UsageStats {
  today: number
  thisWeek: number
  mostUsed: { providerId: string, modelId: string }[]
}

// Props
interface Props {
  currentProvider?: string
  currentModel?: string
  compact?: boolean
  showQuickSwitch?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
  showQuickSwitch: true
})

// Emits
const emit = defineEmits<{
  'provider-changed': [providerId: string]
  'model-changed': [providerId: string, modelId: string]
  'configure-provider': [providerId: string]
}>()

// 状态管理
const isOpen = ref(false)
const isRefreshing = ref(false)
const connectionStatus = ref<'connected' | 'connecting' | 'disconnected'>('connected')
const usageStats = ref<UsageStats | null>(null)

// 模拟数据 - 实际应用中应该从后端获取
const availableProviders = ref<Provider[]>([
  {
    id: 'openai',
    name: 'OpenAI',
    icon: Bot,
    color: 'text-green-500',
    status: 'configured',
    models: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        shortName: 'GPT4o',
        description: '最新的多模态模型，支持文本和图像',
        capabilities: ['text', 'image', 'code', 'function'],
        contextLength: 128000,
        performance: { speed: 4, quality: 5 }
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        shortName: 'GPT4T',
        description: '高性能模型，适合复杂任务',
        capabilities: ['text', 'image', 'code', 'function'],
        contextLength: 128000,
        performance: { speed: 3, quality: 5 }
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        shortName: 'GPT35',
        description: '快速且经济的选择',
        capabilities: ['text', 'code', 'function'],
        contextLength: 16000,
        performance: { speed: 5, quality: 4 }
      }
    ]
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    icon: Brain,
    color: 'text-orange-500',
    status: 'configured',
    models: [
      {
        id: 'claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet',
        shortName: 'C3.5S',
        description: '平衡性能和质量的最佳选择',
        capabilities: ['text', 'image', 'code'],
        contextLength: 200000,
        performance: { speed: 4, quality: 5 }
      },
      {
        id: 'claude-3-haiku',
        name: 'Claude 3 Haiku',
        shortName: 'C3H',
        description: '快速响应，适合简单任务',
        capabilities: ['text', 'image'],
        contextLength: 200000,
        performance: { speed: 5, quality: 3 }
      }
    ]
  },
  {
    id: 'google',
    name: 'Google Gemini',
    icon: Star,
    color: 'text-blue-500',
    status: 'not-configured',
    models: [
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        shortName: 'G1.5P',
        description: '谷歌最强大的多模态模型',
        capabilities: ['text', 'image', 'code', 'function'],
        contextLength: 1000000,
        performance: { speed: 3, quality: 5 }
      }
    ]
  },
  {
    id: 'local',
    name: '本地模型',
    icon: Cpu,
    color: 'text-purple-500',
    status: 'not-configured',
    models: []
  }
])

// 计算属性
const currentModel = computed(() => {
  const provider = availableProviders.value.find(p => p.id === props.currentProvider)
  return provider?.models.find(m => m.id === props.currentModel)
})

const recommendation = computed((): Recommendation | null => {
  // 基于使用习惯和任务类型提供智能推荐
  const currentTime = new Date().getHours()
  
  // 上午推荐效率模型
  if (currentTime >= 9 && currentTime <= 12) {
    return {
      title: 'GPT-3.5 Turbo',
      reason: '上午工作时间，推荐快速响应模型',
      providerId: 'openai',
      modelId: 'gpt-3.5-turbo',
      icon: Zap
    }
  }
  
  // 下午推荐质量模型
  if (currentTime >= 14 && currentTime <= 18) {
    return {
      title: 'Claude 3.5 Sonnet',
      reason: '下午深度工作，推荐高质量模型',
      providerId: 'anthropic',
      modelId: 'claude-3.5-sonnet',
      icon: Brain
    }
  }
  
  return null
})

const hasRecommendation = computed(() => 
  recommendation.value && !isCurrentModel(recommendation.value.providerId, recommendation.value.modelId)
)

const frequentModels = computed(() => {
  // 基于使用频率返回常用模型
  return [
    { providerId: 'openai', id: 'gpt-4o', name: 'GPT-4o', shortName: 'GPT4o' },
    { providerId: 'anthropic', id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', shortName: 'C3.5S' },
    { providerId: 'openai', id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', shortName: 'GPT35' }
  ].filter(model => {
    const provider = availableProviders.value.find(p => p.id === model.providerId)
    return provider?.status === 'configured'
  })
})

// 方法
const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const selectModel = (providerId: string, model: Model) => {
  emit('provider-changed', providerId)
  emit('model-changed', providerId, model.id)
  isOpen.value = false
  
  // 更新连接状态
  connectionStatus.value = 'connecting'
  setTimeout(() => {
    connectionStatus.value = 'connected'
  }, 1000)
}

const configureProvider = (providerId: string) => {
  emit('configure-provider', providerId)
  isOpen.value = false
}

const applyRecommendation = () => {
  if (recommendation.value) {
    const provider = availableProviders.value.find(p => p.id === recommendation.value!.providerId)
    const model = provider?.models.find(m => m.id === recommendation.value!.modelId)
    if (model) {
      selectModel(recommendation.value.providerId, model)
    }
  }
}

const refreshModels = async () => {
  isRefreshing.value = true
  
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 这里应该调用实际的API来刷新模型列表
    console.log('Refreshing models...')
    
  } catch (error) {
    console.error('Failed to refresh models:', error)
  } finally {
    isRefreshing.value = false
  }
}

const openSettings = () => {
  // 跳转到设置页面
  window.location.hash = '/settings'
  isOpen.value = false
}

const isCurrentModel = (providerId: string, modelId: string) => {
  return props.currentProvider === providerId && props.currentModel === modelId
}

const getCurrentProviderName = () => {
  const provider = availableProviders.value.find(p => p.id === props.currentProvider)
  return provider?.name || '未选择'
}

const getCurrentProviderIcon = () => {
  const provider = availableProviders.value.find(p => p.id === props.currentProvider)
  return provider?.icon || Bot
}

const getCurrentProviderColor = () => {
  const provider = availableProviders.value.find(p => p.id === props.currentProvider)
  return provider?.color || 'text-gray-500'
}

const getConnectionStatusText = () => {
  switch (connectionStatus.value) {
    case 'connected': return '已连接'
    case 'connecting': return '连接中...'
    case 'disconnected': return '已断开'
    default: return '未知状态'
  }
}

const getPerformanceColor = (level: number) => {
  if (level >= 4) return 'bg-green-500'
  if (level >= 3) return 'bg-yellow-500'
  return 'bg-red-500'
}

const formatContextLength = (length: number) => {
  if (length >= 1000000) {
    return `${(length / 1000000).toFixed(1)}M`
  }
  if (length >= 1000) {
    return `${(length / 1000).toFixed(0)}K`
  }
  return length.toString()
}

// 点击外部关闭下拉菜单
const handleClickOutside = (event: Event) => {
  const target = event.target as Element
  if (!target.closest('.smart-model-switcher')) {
    isOpen.value = false
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  
  // 模拟加载使用统计
  usageStats.value = {
    today: 15,
    thisWeek: 89,
    mostUsed: [
      { providerId: 'openai', modelId: 'gpt-4o' },
      { providerId: 'anthropic', modelId: 'claude-3.5-sonnet' }
    ]
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* 下拉动画 */
.dropdown-slide-enter-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: top;
}

.dropdown-slide-leave-active {
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: top;
}

.dropdown-slide-enter-from {
  opacity: 0;
  transform: scaleY(0.95) translateY(-10px);
}

.dropdown-slide-leave-to {
  opacity: 0;
  transform: scaleY(0.95) translateY(-10px);
}

/* 能力标识 */
.capability-badge {
  @apply w-5 h-5 bg-secondary/80 text-muted-foreground rounded flex items-center justify-center transition-colors;
}

/* 性能指示器 */
.performance-indicators {
  width: 40px;
  height: 8px;
  display: flex;
  gap: 1px;
}

.performance-bar {
  height: 2px;
  border-radius: 1px;
  transition: all 0.3s ease;
}

/* 快捷切换按钮 */
.quick-switch-btn {
  min-width: 2rem;
  text-align: center;
  font-weight: 500;
}

.quick-switch-btn:hover {
  transform: translateY(-1px);
}

/* 下拉菜单样式 */
.dropdown-menu {
  backdrop-filter: blur(20px);
  background: rgba(var(--background), 0.95);
  border: 1px solid rgba(var(--border), 0.2);
}

/* 模型项悬停效果 */
.model-item {
  position: relative;
}

.model-item:hover {
  transform: translateX(2px);
}

.model-item.selected::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--primary);
  border-radius: 0 2px 2px 0;
}

/* 提供商头部 */
.provider-header {
  z-index: 1;
  border-bottom: 1px solid rgba(var(--border), 0.1);
}

/* 推荐区域动画 */
.recommendation-section {
  background: linear-gradient(135deg, rgba(var(--primary), 0.05) 0%, transparent 100%);
}

.recommendation-section button:hover {
  background: rgba(var(--primary), 0.1);
  transform: translateY(-1px);
}

/* 响应式设计 */
@media (max-width: 640px) {
  .model-selector {
    min-width: 140px;
  }
  
  .model-name {
    max-width: 80px;
  }
  
  .provider-name,
  .model-details .text-xs {
    display: none;
  }
  
  .dropdown-menu {
    left: -100px;
    right: -100px;
  }
  
  .performance-indicators {
    display: none;
  }
  
  .context-info {
    display: none;
  }
}

/* 确保下拉菜单在最上层 */
.dropdown-menu {
  z-index: 1000;
}
</style>