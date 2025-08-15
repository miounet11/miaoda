<template>
  <div class="recommendation-integration">
    <!-- 个性化侧边栏 (右侧) -->
    <Transition name="slide-left">
      <PersonalizedSidebar
        v-if="showPersonalizedSidebar"
        :user-id="userId"
        class="personalized-sidebar-container"
        @interest-explored="handleInterestExplored"
        @domain-explored="handleDomainExplored"
        @action-executed="handleActionExecuted"
        @scenario-started="handleScenarioStarted"
        @settings-opened="handleSettingsOpened"
        @learning-continued="handleLearningContinued"
        @new-learning-path="handleNewLearningPath"
      />
    </Transition>

    <!-- 智能提示词推荐 (聊天区域上方) -->
    <SmartPromptSuggestions
      v-if="showSmartPrompts"
      :current-message="currentMessage"
      :recent-messages="recentMessages"
      :chat-id="chatId"
      class="smart-prompts-container"
      @prompt-applied="handlePromptApplied"
      @topic-started="handleTopicStarted"
      @model-switched="handleModelSwitched"
      @suggestion-applied="handleSuggestionApplied"
    />

    <!-- 智能助手 (浮动) -->
    <SmartAssistant
      :current-message="currentMessage"
      :recent-messages="recentMessages"
      :chat-id="chatId"
      class="smart-assistant-container"
      @suggestion-applied="handleSuggestionApplied"
      @deep-explore-requested="handleDeepExplore"
      @learning-path-started="handleLearningPathStarted"
      @continuation-applied="handleContinuationApplied"
    />

    <!-- 推荐系统控制面板 -->
    <div class="recommendation-controls">
      <!-- 切换按钮 -->
      <div class="control-buttons">
        <button
          @click="togglePersonalizedSidebar"
          class="control-btn"
          :class="{ active: showPersonalizedSidebar }"
          title="个性化侧边栏"
        >
          <User class="w-4 h-4" />
        </button>
        
        <button
          @click="toggleSmartPrompts"
          class="control-btn"
          :class="{ active: showSmartPrompts }"
          title="智能提示词"
        >
          <Lightbulb class="w-4 h-4" />
        </button>
        
        <button
          @click="refreshRecommendations"
          class="control-btn refresh"
          :disabled="loading"
          title="刷新推荐"
        >
          <RefreshCw :class="['w-4 h-4', { 'animate-spin': loading }]" />
        </button>
        
        <button
          @click="openRecommendationSettings"
          class="control-btn"
          title="推荐设置"
        >
          <Settings class="w-4 h-4" />
        </button>
      </div>

      <!-- 推荐状态指示器 -->
      <div class="recommendation-status">
        <div 
          v-if="recommendationStore.hasRecommendations"
          class="status-indicator active"
          :title="`${recommendationStore.recommendations.length} 个推荐`"
        >
          <div class="indicator-dot" />
          <span class="indicator-text">{{ recommendationStore.recommendations.length }}</span>
        </div>
        <div v-else class="status-indicator inactive">
          <div class="indicator-dot" />
        </div>
      </div>
    </div>

    <!-- 推荐设置模态框 -->
    <div v-if="showSettingsModal" class="settings-modal-overlay" @click="closeSettingsModal">
      <div class="settings-modal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">推荐系统设置</h3>
          <button @click="closeSettingsModal" class="close-btn">
            <X class="w-4 h-4" />
          </button>
        </div>
        <div class="modal-content">
          <RecommendationSettings :user-id="userId" />
        </div>
      </div>
    </div>

    <!-- 快速开始引导 (首次使用) -->
    <div v-if="showOnboarding" class="onboarding-overlay">
      <div class="onboarding-content">
        <div class="onboarding-header">
          <Sparkles class="w-8 h-8 text-blue-500" />
          <h2 class="onboarding-title">智能推荐系统</h2>
        </div>
        <p class="onboarding-description">
          基于您的使用习惯和偏好，为您提供个性化的AI助手体验
        </p>
        <div class="onboarding-features">
          <div class="feature-item">
            <User class="w-5 h-5 text-green-500" />
            <span>个人画像分析</span>
          </div>
          <div class="feature-item">
            <Lightbulb class="w-5 h-5 text-yellow-500" />
            <span>智能提示词推荐</span>
          </div>
          <div class="feature-item">
            <Brain class="w-5 h-5 text-purple-500" />
            <span>对话续写建议</span>
          </div>
          <div class="feature-item">
            <BookOpen class="w-5 h-5 text-blue-500" />
            <span>学习路径规划</span>
          </div>
        </div>
        <div class="onboarding-actions">
          <button @click="skipOnboarding" class="btn-secondary">
            暂时跳过
          </button>
          <button @click="enableRecommendations" class="btn-primary">
            开始使用
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { 
  User, Lightbulb, RefreshCw, Settings, X, Sparkles, 
  Brain, BookOpen 
} from 'lucide-vue-next'
import PersonalizedSidebar from './PersonalizedSidebar.vue'
import SmartPromptSuggestions from './SmartPromptSuggestions.vue'
import SmartAssistant from './SmartAssistant.vue'
import RecommendationSettings from './RecommendationSettings.vue'
import { useRecommendationStore } from '../../stores/recommendation'
import type { 
  UserInterest, 
  KnowledgeDomain, 
  SmartAssistantSuggestion 
} from '../../types/recommendation'

// Props
interface Props {
  userId: string
  chatId?: string
  currentMessage?: string
  recentMessages?: string[]
  visible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: true
})

// Emits
const emit = defineEmits<{
  promptApplied: [content: string]
  topicStarted: [topic: string]
  modelSwitched: [modelId: string]
  suggestionApplied: [suggestion: SmartAssistantSuggestion]
  continuationApplied: [content: string]
  newChatRequested: []
  settingsOpened: []
}>()

// Store
const recommendationStore = useRecommendationStore()

// State
const showPersonalizedSidebar = ref(false)
const showSmartPrompts = ref(true)
const showSettingsModal = ref(false)
const showOnboarding = ref(false)
const loading = ref(false)

// Computed
const isFirstTime = computed(() => {
  return !localStorage.getItem('recommendation_onboarding_completed')
})

// Methods
const togglePersonalizedSidebar = () => {
  showPersonalizedSidebar.value = !showPersonalizedSidebar.value
  
  // 保存用户偏好
  localStorage.setItem(
    'personalized_sidebar_visible', 
    showPersonalizedSidebar.value.toString()
  )
}

const toggleSmartPrompts = () => {
  showSmartPrompts.value = !showSmartPrompts.value
  
  // 保存用户偏好
  localStorage.setItem(
    'smart_prompts_visible', 
    showSmartPrompts.value.toString()
  )
}

const refreshRecommendations = async () => {
  loading.value = true
  try {
    await recommendationStore.generateRecommendations(props.userId, {
      currentMessage: props.currentMessage,
      recentMessages: props.recentMessages,
      currentChatId: props.chatId
    })
  } finally {
    loading.value = false
  }
}

const openRecommendationSettings = () => {
  showSettingsModal.value = true
}

const closeSettingsModal = () => {
  showSettingsModal.value = false
}

// Event Handlers
const handleInterestExplored = (interest: UserInterest) => {
  // 基于兴趣开始新的对话
  const topic = `让我们深入探讨${interest.keyword}相关的内容`
  emit('topicStarted', topic)
}

const handleDomainExplored = (domain: KnowledgeDomain) => {
  // 基于知识领域开始专业对话
  const topic = `作为${domain.domain}专家，我想了解更多关于这个领域的最新发展`
  emit('topicStarted', topic)
}

const handleActionExecuted = (actionId: string) => {
  switch (actionId) {
    case 'new-chat':
      emit('newChatRequested')
      break
    case 'code-review':
      emit('promptApplied', '请帮我审查以下代码，指出潜在问题和改进建议：')
      break
    case 'creative-writing':
      emit('promptApplied', '让我们一起创作一个有趣的故事。请提供一个引人入胜的开头：')
      break
    case 'learning-assistant':
      emit('promptApplied', '我想学习一个新的主题，请帮我制定一个循序渐进的学习计划：')
      break
    default:
      console.log('执行动作:', actionId)
  }
}

const handleScenarioStarted = (scenario: string) => {
  // 根据常用场景启动相应的对话
  const scenarioPrompts = {
    '问答咨询': '我有一个问题想请教：',
    '创作协助': '我需要创作方面的帮助：',
    '学习指导': '我想学习以下内容，请指导：',
    '代码编程': '关于编程，我遇到了这个问题：',
    '翻译服务': '请帮我翻译以下内容：',
    '分析总结': '请帮我分析总结以下内容：'
  }
  
  const prompt = scenarioPrompts[scenario] || `关于${scenario}：`
  emit('promptApplied', prompt)
}

const handleSettingsOpened = () => {
  emit('settingsOpened')
}

const handleLearningContinued = (pathId: string) => {
  // 继续学习路径
  console.log('继续学习路径:', pathId)
}

const handleNewLearningPath = () => {
  // 创建新的学习路径
  emit('promptApplied', '我想为以下主题创建一个个性化的学习路径：')
}

const handlePromptApplied = (content: string) => {
  emit('promptApplied', content)
}

const handleTopicStarted = (topic: string) => {
  emit('topicStarted', topic)
}

const handleModelSwitched = (modelId: string) => {
  emit('modelSwitched', modelId)
}

const handleSuggestionApplied = (suggestion: SmartAssistantSuggestion) => {
  emit('suggestionApplied', suggestion)
}

const handleDeepExplore = (topic: string) => {
  const prompt = `让我们深入探讨"${topic}"这个话题，请从多个角度进行分析：`
  emit('promptApplied', prompt)
}

const handleLearningPathStarted = (pathId: string) => {
  console.log('开始学习路径:', pathId)
}

const handleContinuationApplied = (content: string) => {
  emit('continuationApplied', content)
}

// Onboarding
const enableRecommendations = async () => {
  await recommendationStore.updatePersonalizationSettings(props.userId, {
    enableRecommendations: true,
    enableSmartSuggestions: true,
    enableLearningPaths: true
  })
  
  showOnboarding.value = false
  showPersonalizedSidebar.value = true
  showSmartPrompts.value = true
  
  localStorage.setItem('recommendation_onboarding_completed', 'true')
}

const skipOnboarding = () => {
  showOnboarding.value = false
  localStorage.setItem('recommendation_onboarding_completed', 'true')
}

// 键盘快捷键
const handleKeydown = (event: KeyboardEvent) => {
  // Ctrl/Cmd + Shift + R: 刷新推荐
  if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'R') {
    event.preventDefault()
    refreshRecommendations()
  }
  
  // Ctrl/Cmd + Shift + P: 切换个性化侧边栏
  if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'P') {
    event.preventDefault()
    togglePersonalizedSidebar()
  }
}

// Lifecycle
onMounted(async () => {
  // 初始化推荐系统
  if (recommendationStore.isEnabled) {
    await recommendationStore.initialize(props.userId)
  }
  
  // 恢复用户界面偏好
  const sidebarVisible = localStorage.getItem('personalized_sidebar_visible')
  const promptsVisible = localStorage.getItem('smart_prompts_visible')
  
  if (sidebarVisible !== null) {
    showPersonalizedSidebar.value = sidebarVisible === 'true'
  }
  
  if (promptsVisible !== null) {
    showSmartPrompts.value = promptsVisible === 'true'
  }
  
  // 首次使用引导
  if (isFirstTime.value && recommendationStore.isEnabled) {
    setTimeout(() => {
      showOnboarding.value = true
    }, 2000)
  }
  
  // 添加键盘事件监听
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// 监听推荐系统状态变化
watch(() => recommendationStore.isEnabled, (enabled) => {
  if (!enabled) {
    showPersonalizedSidebar.value = false
    showSmartPrompts.value = false
  }
})

// 监听消息变化，自动生成推荐
watch([() => props.currentMessage, () => props.recentMessages], async () => {
  if (recommendationStore.isEnabled && props.currentMessage) {
    // 延迟生成推荐，避免频繁调用
    setTimeout(async () => {
      await recommendationStore.generateRecommendations(props.userId, {
        currentMessage: props.currentMessage,
        recentMessages: props.recentMessages,
        currentChatId: props.chatId
      })
    }, 1000)
  }
}, { debounce: 500 })
</script>

<style scoped>
.recommendation-integration {
  @apply relative z-10;
}

/* 个性化侧边栏 */
.personalized-sidebar-container {
  @apply fixed top-0 right-0 h-full z-40 shadow-2xl;
}

/* 智能提示词 */
.smart-prompts-container {
  @apply relative z-20;
}

/* 智能助手 */
.smart-assistant-container {
  @apply relative z-30;
}

/* 推荐控制面板 */
.recommendation-controls {
  @apply fixed top-1/2 right-4 transform -translate-y-1/2 z-50 flex flex-col items-center gap-3;
}

.control-buttons {
  @apply flex flex-col gap-2 p-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700;
}

.control-btn {
  @apply p-2.5 rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400;
}

.control-btn.active {
  @apply bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400;
}

.control-btn.refresh:hover {
  @apply bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400;
}

.control-btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}

/* 推荐状态指示器 */
.recommendation-status {
  @apply mt-2;
}

.status-indicator {
  @apply flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all;
}

.status-indicator.active {
  @apply bg-blue-500 border-blue-400 text-white text-xs font-bold;
}

.status-indicator.inactive {
  @apply bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600;
}

.indicator-dot {
  @apply w-2 h-2 rounded-full;
}

.status-indicator.active .indicator-dot {
  @apply bg-white animate-pulse;
}

.status-indicator.inactive .indicator-dot {
  @apply bg-gray-400 dark:bg-gray-500;
}

.indicator-text {
  @apply ml-1;
}

/* 设置模态框 */
.settings-modal-overlay {
  @apply fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4;
}

.settings-modal {
  @apply bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl;
}

.modal-header {
  @apply flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700;
}

.modal-title {
  @apply text-lg font-semibold text-gray-800 dark:text-gray-200;
}

.close-btn {
  @apply p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700;
}

.modal-content {
  @apply max-h-[calc(90vh-80px)] overflow-y-auto;
}

/* 引导界面 */
.onboarding-overlay {
  @apply fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4;
}

.onboarding-content {
  @apply bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-lg w-full text-center shadow-2xl;
}

.onboarding-header {
  @apply flex flex-col items-center gap-4 mb-6;
}

.onboarding-title {
  @apply text-2xl font-bold text-gray-800 dark:text-gray-200;
}

.onboarding-description {
  @apply text-gray-600 dark:text-gray-400 mb-6 leading-relaxed;
}

.onboarding-features {
  @apply grid grid-cols-2 gap-4 mb-8;
}

.feature-item {
  @apply flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg;
}

.onboarding-actions {
  @apply flex gap-4 justify-center;
}

.btn-secondary {
  @apply px-6 py-3 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors;
}

.btn-primary {
  @apply px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors;
}

/* 动画 */
.slide-left-enter-active,
.slide-left-leave-active {
  @apply transition-transform duration-300;
}

.slide-left-enter-from {
  @apply translate-x-full;
}

.slide-left-leave-to {
  @apply translate-x-full;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .personalized-sidebar-container {
    @apply w-full;
  }
  
  .recommendation-controls {
    @apply right-2 top-auto bottom-20 transform-none flex-row;
  }
  
  .control-buttons {
    @apply flex-row;
  }
  
  .settings-modal {
    @apply m-2;
  }
  
  .onboarding-content {
    @apply p-6;
  }
  
  .onboarding-features {
    @apply grid-cols-1;
  }
  
  .onboarding-actions {
    @apply flex-col;
  }
}

/* 当个性化侧边栏打开时，为主内容添加边距 */
.personalized-sidebar-open {
  @apply mr-64;
}

@media (max-width: 1024px) {
  .personalized-sidebar-open {
    @apply mr-56;
  }
}

@media (max-width: 768px) {
  .personalized-sidebar-open {
    @apply mr-0;
  }
}
</style>