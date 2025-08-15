<template>
  <div class="personalization-engine">
    <!-- 个性化设置面板 -->
    <Transition name="panel-slide">
      <div
        v-if="showPanel"
        class="personalization-panel fixed top-4 right-4 w-80 bg-background border border-border/20 rounded-xl shadow-2xl z-50 overflow-hidden"
      >
        <!-- 面板头部 -->
        <div class="panel-header p-4 border-b border-border/10 bg-gradient-to-r from-primary/5 to-transparent">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <User :size="18" class="text-primary" />
              </div>
              <div>
                <h3 class="font-semibold text-foreground">个性化设置</h3>
                <p class="text-xs text-muted-foreground">为你定制专属体验</p>
              </div>
            </div>
            <button
              @click="showPanel = false"
              class="w-6 h-6 hover:bg-secondary rounded-lg flex items-center justify-center transition-colors"
            >
              <X :size="14" class="text-muted-foreground" />
            </button>
          </div>
        </div>

        <!-- 面板内容 -->
        <div class="panel-content max-h-96 overflow-y-auto p-4 space-y-6">
          <!-- 使用习惯分析 -->
          <div class="usage-insights">
            <h4 class="font-medium text-sm mb-3 flex items-center gap-2">
              <BarChart :size="16" class="text-blue-500" />
              使用习惯分析
            </h4>
            <div class="insights-grid grid grid-cols-2 gap-3">
              <div class="insight-card p-3 bg-secondary/30 rounded-lg">
                <div class="text-lg font-bold text-primary">{{ userInsights.mostUsedModel }}</div>
                <div class="text-xs text-muted-foreground">常用模型</div>
              </div>
              <div class="insight-card p-3 bg-secondary/30 rounded-lg">
                <div class="text-lg font-bold text-green-500">{{ userInsights.averageSessionTime }}</div>
                <div class="text-xs text-muted-foreground">平均会话时长</div>
              </div>
              <div class="insight-card p-3 bg-secondary/30 rounded-lg">
                <div class="text-lg font-bold text-orange-500">{{ userInsights.favoriteTime }}</div>
                <div class="text-xs text-muted-foreground">活跃时段</div>
              </div>
              <div class="insight-card p-3 bg-secondary/30 rounded-lg">
                <div class="text-lg font-bold text-purple-500">{{ userInsights.topCategory }}</div>
                <div class="text-xs text-muted-foreground">主要用途</div>
              </div>
            </div>
          </div>

          <!-- 偏好设置 -->
          <div class="preferences">
            <h4 class="font-medium text-sm mb-3 flex items-center gap-2">
              <Settings :size="16" class="text-green-500" />
              偏好设置
            </h4>
            <div class="space-y-4">
              <!-- 智能推荐 -->
              <div class="preference-item">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Sparkles :size="14" class="text-yellow-500" />
                    <span class="text-sm">智能推荐</span>
                  </div>
                  <button
                    @click="togglePreference('smartRecommendations')"
                    class="toggle-switch"
                    :class="{ 'active': preferences.smartRecommendations }"
                  >
                    <div class="toggle-thumb" />
                  </button>
                </div>
                <p class="text-xs text-muted-foreground mt-1 ml-6">
                  根据使用习惯推荐模型和功能
                </p>
              </div>

              <!-- 自动模型切换 -->
              <div class="preference-item">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Zap :size="14" class="text-blue-500" />
                    <span class="text-sm">自动模型切换</span>
                  </div>
                  <button
                    @click="togglePreference('autoModelSwitch')"
                    class="toggle-switch"
                    :class="{ 'active': preferences.autoModelSwitch }"
                  >
                    <div class="toggle-thumb" />
                  </button>
                </div>
                <p class="text-xs text-muted-foreground mt-1 ml-6">
                  根据任务类型自动选择最适合的模型
                </p>
              </div>

              <!-- 上下文感知 -->
              <div class="preference-item">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Brain :size="14" class="text-purple-500" />
                    <span class="text-sm">上下文感知</span>
                  </div>
                  <button
                    @click="togglePreference('contextAware')"
                    class="toggle-switch"
                    :class="{ 'active': preferences.contextAware }"
                  >
                    <div class="toggle-thumb" />
                  </button>
                </div>
                <p class="text-xs text-muted-foreground mt-1 ml-6">
                  基于对话历史提供个性化建议
                </p>
              </div>
            </div>
          </div>

          <!-- 学习偏好 -->
          <div class="learning-preferences">
            <h4 class="font-medium text-sm mb-3 flex items-center gap-2">
              <BookOpen :size="16" class="text-indigo-500" />
              学习偏好
            </h4>
            <div class="space-y-3">
              <div class="learning-style">
                <label class="text-sm text-muted-foreground">交互风格</label>
                <select
                  v-model="preferences.interactionStyle"
                  @change="updatePreference('interactionStyle', $event.target.value)"
                  class="w-full mt-1 px-3 py-2 bg-secondary/50 border border-border/30 rounded-lg text-sm focus:outline-none focus:border-primary/50 transition-colors"
                >
                  <option value="casual">随意对话</option>
                  <option value="professional">专业严谨</option>
                  <option value="educational">教学引导</option>
                  <option value="creative">创意激发</option>
                </select>
              </div>
              
              <div class="response-length">
                <label class="text-sm text-muted-foreground">回答详细度</label>
                <div class="range-input mt-2">
                  <input
                    v-model="preferences.responseDetail"
                    @input="updatePreference('responseDetail', $event.target.value)"
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    class="w-full"
                  >
                  <div class="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>简洁</span>
                    <span>详细</span>
                  </div>
                </div>
              </div>

              <div class="topics-interest">
                <label class="text-sm text-muted-foreground mb-2 block">感兴趣的话题</label>
                <div class="topics-grid grid grid-cols-2 gap-2">
                  <button
                    v-for="topic in availableTopics"
                    :key="topic.id"
                    @click="toggleTopic(topic.id)"
                    class="topic-tag px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    :class="[
                      preferences.interestedTopics.includes(topic.id)
                        ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                        : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
                    ]"
                  >
                    <component :is="topic.icon" :size="12" class="mr-1" />
                    {{ topic.name }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 面板底部 -->
        <div class="panel-footer p-4 border-t border-border/10 bg-secondary/20">
          <div class="flex items-center justify-between">
            <button
              @click="resetPreferences"
              class="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              重置设置
            </button>
            <div class="flex gap-2">
              <button
                @click="exportPreferences"
                class="px-3 py-1.5 text-xs border border-border/30 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                导出
              </button>
              <button
                @click="savePreferences"
                class="px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded-lg hover:bg-primary/90 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 浮动操作按钮 -->
    <button
      v-if="!showPanel"
      @click="showPanel = true"
      class="personalization-fab fixed bottom-32 right-6 w-14 h-14 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 z-40"
      title="个性化设置"
    >
      <User :size="24" />
      
      <!-- 新功能提示点 -->
      <div 
        v-if="hasNewFeatures"
        class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center animate-pulse"
      >
        <div class="w-2 h-2 bg-white rounded-full" />
      </div>
    </button>

    <!-- 智能建议横幅 -->
    <Transition name="banner-slide">
      <div
        v-if="currentSuggestion && showSuggestionBanner"
        class="suggestion-banner fixed top-4 left-1/2 -translate-x-1/2 max-w-md bg-background border border-primary/20 rounded-xl shadow-xl p-4 z-40"
      >
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mt-0.5">
            <component :is="currentSuggestion.icon" :size="16" class="text-primary" />
          </div>
          
          <div class="flex-1">
            <h4 class="font-medium text-sm mb-1">{{ currentSuggestion.title }}</h4>
            <p class="text-xs text-muted-foreground mb-3 leading-relaxed">
              {{ currentSuggestion.description }}
            </p>
            
            <div class="flex items-center gap-2">
              <button
                @click="applySuggestion(currentSuggestion)"
                class="px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded-lg hover:bg-primary/90 transition-colors"
              >
                {{ currentSuggestion.actionText }}
              </button>
              <button
                @click="dismissSuggestion"
                class="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                稍后再说
              </button>
            </div>
          </div>
          
          <button
            @click="dismissSuggestion"
            class="flex-shrink-0 w-6 h-6 hover:bg-secondary rounded-lg flex items-center justify-center transition-colors"
          >
            <X :size="12" class="text-muted-foreground" />
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { 
  User, X, Settings, Sparkles, Zap, Brain, BookOpen, BarChart,
  Code2, Image, FileText, HelpCircle, Lightbulb, Gamepad2
} from 'lucide-vue-next'

interface UserInsights {
  mostUsedModel: string
  averageSessionTime: string
  favoriteTime: string
  topCategory: string
}

interface Preferences {
  smartRecommendations: boolean
  autoModelSwitch: boolean
  contextAware: boolean
  interactionStyle: string
  responseDetail: number
  interestedTopics: string[]
}

interface Topic {
  id: string
  name: string
  icon: any
}

interface Suggestion {
  id: string
  title: string
  description: string
  actionText: string
  icon: any
  action: () => void
  priority: number
}

// Props
interface Props {
  enabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  enabled: true
})

// Emits
const emit = defineEmits<{
  'preference-changed': [key: string, value: any]
  'suggestion-applied': [suggestion: Suggestion]
}>()

// 状态管理
const showPanel = ref(false)
const showSuggestionBanner = ref(false)
const hasNewFeatures = ref(true)

// 用户洞察数据
const userInsights = ref<UserInsights>({
  mostUsedModel: 'GPT-4o',
  averageSessionTime: '8.5分钟',
  favoriteTime: '14:00-18:00',
  topCategory: '编程'
})

// 用户偏好设置
const preferences = ref<Preferences>({
  smartRecommendations: true,
  autoModelSwitch: false,
  contextAware: true,
  interactionStyle: 'professional',
  responseDetail: 3,
  interestedTopics: ['coding', 'ai']
})

// 可选话题
const availableTopics: Topic[] = [
  { id: 'coding', name: '编程', icon: Code2 },
  { id: 'design', name: '设计', icon: Image },
  { id: 'writing', name: '写作', icon: FileText },
  { id: 'learning', name: '学习', icon: BookOpen },
  { id: 'research', name: '研究', icon: HelpCircle },
  { id: 'creative', name: '创意', icon: Lightbulb },
  { id: 'gaming', name: '游戏', icon: Gamepad2 },
  { id: 'ai', name: 'AI技术', icon: Brain }
]

// 智能建议
const suggestions = ref<Suggestion[]>([
  {
    id: 'model-optimization',
    title: '模型使用优化建议',
    description: '检测到你经常进行编程任务，推荐使用 Claude 3.5 Sonnet 获得更好的代码质量',
    actionText: '切换模型',
    icon: Zap,
    action: () => {
      // 切换到推荐模型
      console.log('Switching to Claude 3.5 Sonnet')
    },
    priority: 9
  },
  {
    id: 'workflow-improvement',
    title: '工作流程改进',
    description: '基于你的使用习惯，建议开启自动模型切换功能，提升工作效率',
    actionText: '启用功能',
    icon: Settings,
    action: () => {
      preferences.value.autoModelSwitch = true
      updatePreference('autoModelSwitch', true)
    },
    priority: 7
  },
  {
    id: 'new-feature',
    title: '新功能推荐',
    description: '发现新的语音输入功能，可以更快速地与 AI 交互',
    actionText: '了解更多',
    icon: Sparkles,
    action: () => {
      // 显示功能介绍
      console.log('Show voice feature tour')
    },
    priority: 5
  }
])

// 计算属性
const currentSuggestion = computed(() => {
  if (!preferences.value.smartRecommendations) return null
  
  return suggestions.value
    .filter(s => s.priority > 6)
    .sort((a, b) => b.priority - a.priority)[0] || null
})

// 方法
const togglePreference = (key: keyof Preferences) => {
  preferences.value[key] = !preferences.value[key] as any
  updatePreference(key, preferences.value[key])
}

const updatePreference = (key: string, value: any) => {
  emit('preference-changed', key, value)
  savePreferencesToStorage()
  
  // 根据偏好变化调整建议
  if (key === 'smartRecommendations' && value) {
    setTimeout(() => {
      showSuggestionBanner.value = true
    }, 1000)
  }
}

const toggleTopic = (topicId: string) => {
  const index = preferences.value.interestedTopics.indexOf(topicId)
  if (index > -1) {
    preferences.value.interestedTopics.splice(index, 1)
  } else {
    preferences.value.interestedTopics.push(topicId)
  }
  updatePreference('interestedTopics', preferences.value.interestedTopics)
}

const applySuggestion = (suggestion: Suggestion) => {
  suggestion.action()
  emit('suggestion-applied', suggestion)
  dismissSuggestion()
}

const dismissSuggestion = () => {
  showSuggestionBanner.value = false
  
  // 延迟显示下一个建议
  setTimeout(() => {
    if (preferences.value.smartRecommendations) {
      showSuggestionBanner.value = true
    }
  }, 30000) // 30秒后显示下一个建议
}

const savePreferences = () => {
  savePreferencesToStorage()
  
  // 给用户反馈
  console.log('Preferences saved successfully')
  
  // 可以显示成功提示
}

const resetPreferences = () => {
  if (confirm('确定要重置所有个性化设置吗？')) {
    preferences.value = {
      smartRecommendations: true,
      autoModelSwitch: false,
      contextAware: true,
      interactionStyle: 'professional',
      responseDetail: 3,
      interestedTopics: ['coding', 'ai']
    }
    
    savePreferencesToStorage()
    console.log('Preferences reset')
  }
}

const exportPreferences = () => {
  const data = {
    preferences: preferences.value,
    insights: userInsights.value,
    exportDate: new Date().toISOString()
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'miaoda-chat-preferences.json'
  a.click()
  URL.revokeObjectURL(url)
}

const savePreferencesToStorage = () => {
  try {
    localStorage.setItem('personalization-preferences', JSON.stringify(preferences.value))
    localStorage.setItem('user-insights', JSON.stringify(userInsights.value))
  } catch (error) {
    console.error('Failed to save preferences:', error)
  }
}

const loadPreferencesFromStorage = () => {
  try {
    const savedPreferences = localStorage.getItem('personalization-preferences')
    if (savedPreferences) {
      preferences.value = { ...preferences.value, ...JSON.parse(savedPreferences) }
    }
    
    const savedInsights = localStorage.getItem('user-insights')
    if (savedInsights) {
      userInsights.value = { ...userInsights.value, ...JSON.parse(savedInsights) }
    }
  } catch (error) {
    console.error('Failed to load preferences:', error)
  }
}

const analyzeUsagePatterns = () => {
  // 模拟分析用户使用模式
  const patterns = {
    mostActiveHour: new Date().getHours(),
    preferredMessageLength: 150,
    topCategories: ['coding', 'learning', 'creative']
  }
  
  // 根据分析结果更新洞察
  console.log('Usage patterns analyzed:', patterns)
}

// 生命周期
onMounted(() => {
  loadPreferencesFromStorage()
  
  // 延迟显示智能建议
  if (preferences.value.smartRecommendations) {
    setTimeout(() => {
      showSuggestionBanner.value = true
    }, 5000)
  }
  
  // 分析使用模式
  analyzeUsagePatterns()
  
  // 检查是否有新功能
  const lastFeatureCheckTime = localStorage.getItem('last-feature-check')
  const currentTime = Date.now()
  if (!lastFeatureCheckTime || currentTime - parseInt(lastFeatureCheckTime) > 7 * 24 * 60 * 60 * 1000) {
    hasNewFeatures.value = true
    localStorage.setItem('last-feature-check', currentTime.toString())
  } else {
    hasNewFeatures.value = false
  }
})

// 监听偏好变化
watch(
  () => preferences.value,
  (newPreferences) => {
    // 根据偏好变化调整界面行为
    if (newPreferences.smartRecommendations && !showSuggestionBanner.value) {
      setTimeout(() => {
        showSuggestionBanner.value = true
      }, 2000)
    }
  },
  { deep: true }
)

// 暴露方法给父组件
defineExpose({
  openPanel: () => { showPanel.value = true },
  closePanel: () => { showPanel.value = false },
  showSuggestion: () => { showSuggestionBanner.value = true }
})
</script>

<style scoped>
/* 面板滑动动画 */
.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* 横幅滑动动画 */
.banner-slide-enter-active,
.banner-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.banner-slide-enter-from,
.banner-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

/* 切换开关样式 */
.toggle-switch {
  position: relative;
  width: 40px;
  height: 20px;
  background-color: hsl(var(--secondary));
  border-radius: 20px;
  transition: all 0.3s ease;
  border: 1px solid hsl(var(--border));
}

.toggle-switch.active {
  background-color: hsl(var(--primary));
  border-color: hsl(var(--primary));
}

.toggle-thumb {
  position: absolute;
  top: 1px;
  left: 1px;
  width: 16px;
  height: 16px;
  background-color: white;
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.toggle-switch.active .toggle-thumb {
  transform: translateX(20px);
}

/* 范围输入样式 */
.range-input input[type="range"] {
  width: 100%;
  height: 6px;
  background: hsl(var(--secondary));
  border-radius: 3px;
  outline: none;
  -webkit-appearance: none;
}

.range-input input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: hsl(var(--primary));
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.range-input input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: hsl(var(--primary));
  border-radius: 50%;
  cursor: pointer;
  border: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

/* 话题标签动画 */
.topic-tag {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
}

.topic-tag:hover {
  transform: translateY(-1px);
}

.topic-tag:active {
  transform: translateY(0);
}

/* 洞察卡片 */
.insight-card {
  transition: all 0.2s ease;
}

.insight-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 浮动按钮 */
.personalization-fab {
  backdrop-filter: blur(10px);
}

.personalization-fab:hover {
  box-shadow: 0 8px 30px rgba(var(--primary), 0.4);
}

/* 建议横幅 */
.suggestion-banner {
  backdrop-filter: blur(20px);
  background: rgba(var(--background), 0.95);
}

/* 面板 */
.personalization-panel {
  backdrop-filter: blur(20px);
  background: rgba(var(--background), 0.98);
}

/* 响应式设计 */
@media (max-width: 640px) {
  .personalization-panel {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    max-width: none;
    border-radius: 0;
  }
  
  .suggestion-banner {
    left: 1rem;
    right: 1rem;
    transform: translateX(0);
    max-width: none;
  }
  
  .personalization-fab {
    bottom: 6rem;
    right: 1rem;
  }
  
  .insights-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .topics-grid {
    grid-template-columns: 1fr;
  }
}

/* 确保在最上层 */
.personalization-panel,
.suggestion-banner {
  z-index: 1000;
}
</style>