<template>
  <div class="chat-view-with-recommendations flex h-screen bg-background overflow-hidden">
    <!-- 原有的侧边栏 (左侧) -->
    <aside 
      class="sidebar flex flex-col border-r border-border/50 transition-all duration-300"
      :style="{ width: sidebarWidth + 'px' }"
    >
      <!-- 这里包含原有的聊天列表等内容 -->
      <!-- ... 原有侧边栏内容 ... -->
    </aside>

    <!-- 主聊天区域 -->
    <main 
      class="flex-1 flex flex-col min-w-0 min-h-0"
      :class="{ 'personalized-sidebar-open': showPersonalizedSidebar }"
    >
      <!-- 聊天头部 -->
      <header class="chat-header h-16 px-6 border-b border-border/50 flex items-center justify-between bg-background/95 backdrop-blur">
        <!-- 原有头部内容 -->
        <div class="flex items-center gap-4">
          <h2 class="font-bold text-lg text-foreground/90">{{ currentChat?.title || '新对话' }}</h2>
        </div>
        
        <div class="flex items-center gap-2 sm:gap-3">
          <!-- 原有的控制按钮 -->
          <!-- ... -->
          
          <!-- 推荐系统控制按钮 -->
          <button
            @click="toggleRecommendations"
            class="p-2 sm:p-2.5 hover:bg-secondary/60 rounded-xl transition-all hover:scale-105"
            :class="{ 'bg-primary/10': recommendationStore.isEnabled }"
            title="智能推荐"
          >
            <Brain :size="18" :class="recommendationStore.isEnabled ? 'text-primary' : 'text-muted-foreground'" />
          </button>
        </div>
      </header>

      <!-- 智能提示词推荐区域 -->
      <div v-if="recommendationStore.isEnabled && showSmartPrompts" class="border-b border-border/30">
        <SmartPromptSuggestions
          :current-message="inputMessage"
          :recent-messages="getRecentMessages()"
          :chat-id="currentChatId"
          @prompt-applied="handlePromptApplied"
          @topic-started="handleTopicStarted"
          @model-switched="handleModelSwitched"
          @suggestion-applied="handleSuggestionApplied"
        />
      </div>

      <!-- 消息区域 -->
      <div class="flex-1 flex flex-col min-h-0">
        <!-- 原有的消息显示组件 -->
        <!-- ... -->
        
        <!-- 在消息区域底部添加智能续写建议 -->
        <div v-if="showContinuationSuggestions && continuationSuggestions.length > 0" class="px-6 py-2">
          <div class="flex items-center gap-2 mb-2">
            <Zap class="w-4 h-4 text-blue-500" />
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">续写建议</span>
          </div>
          <div class="flex gap-2 overflow-x-auto pb-2">
            <button
              v-for="(suggestion, index) in continuationSuggestions.slice(0, 3)"
              :key="index"
              @click="applyContinuationSuggestion(suggestion)"
              class="flex-shrink-0 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              {{ suggestion.preview }}
            </button>
          </div>
        </div>
      </div>

      <!-- 输入区域 (保持原有功能并增强) -->
      <div class="input-area border-t border-border/50 bg-background/95 backdrop-blur">
        <div class="max-w-4xl mx-auto p-4">
          <!-- 智能提示词快捷应用 -->
          <div v-if="showQuickPrompts && quickPrompts.length > 0" class="mb-3">
            <div class="flex items-center gap-2 mb-2">
              <Lightbulb class="w-4 h-4 text-yellow-500" />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">推荐提示词</span>
            </div>
            <div class="flex gap-2 flex-wrap">
              <button
                v-for="prompt in quickPrompts.slice(0, 3)"
                :key="prompt.id"
                @click="applyQuickPrompt(prompt)"
                class="px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-md text-sm hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
              >
                {{ prompt.title }}
              </button>
            </div>
          </div>
          
          <!-- 原有的输入框 -->
          <div class="relative">
            <div class="input-container flex items-end gap-4 p-4 bg-secondary/40 rounded-2xl border-2 border-transparent hover:border-primary/20">
              <!-- 原有输入控件 -->
              <textarea
                v-model="inputMessage"
                @keydown.enter.prevent="handleSend"
                @input="handleInputChange"
                placeholder="输入消息..."
                class="flex-1 bg-transparent resize-none outline-none min-h-[48px] max-h-[200px] px-3 py-3"
                ref="messageInput"
              />
              
              <!-- 发送按钮 -->
              <button
                @click="handleSend"
                :disabled="!inputMessage.trim() || isLoading"
                class="p-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send :size="20" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 个性化侧边栏 (右侧) -->
    <PersonalizedSidebar
      v-if="showPersonalizedSidebar"
      :user-id="currentUserId"
      @interest-explored="handleInterestExplored"
      @domain-explored="handleDomainExplored"
      @action-executed="handleActionExecuted"
      @scenario-started="handleScenarioStarted"
      @settings-opened="openRecommendationSettings"
      @learning-continued="handleLearningContinued"
      @new-learning-path="handleNewLearningPath"
    />

    <!-- 智能助手浮动组件 -->
    <SmartAssistant
      v-if="recommendationStore.isEnabled"
      :current-message="inputMessage"
      :recent-messages="getRecentMessages()"
      :chat-id="currentChatId"
      @suggestion-applied="handleSuggestionApplied"
      @deep-explore-requested="handleDeepExplore"
      @learning-path-started="handleLearningPathStarted"
      @continuation-applied="handleContinuationApplied"
    />

    <!-- 推荐设置模态框 -->
    <div v-if="showRecommendationSettings" class="modal-overlay" @click="closeRecommendationSettings">
      <div class="modal-content" @click.stop>
        <RecommendationSettings :user-id="currentUserId" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Brain, Zap, Lightbulb, Send } from 'lucide-vue-next'
import PersonalizedSidebar from '../components/recommendation/PersonalizedSidebar.vue'
import SmartPromptSuggestions from '../components/recommendation/SmartPromptSuggestions.vue'
import SmartAssistant from '../components/recommendation/SmartAssistant.vue'
import RecommendationSettings from '../components/recommendation/RecommendationSettings.vue'
import { useRecommendationStore } from '../stores/recommendation'
import { useChatStore } from '../stores/chat'
import type { 
  RecommendationItem,
  SmartAssistantSuggestion,
  UserInterest,
  KnowledgeDomain
} from '../types/recommendation'

// Stores
const recommendationStore = useRecommendationStore()
const chatStore = useChatStore()

// State
const inputMessage = ref('')
const isLoading = ref(false)
const showPersonalizedSidebar = ref(false)
const showSmartPrompts = ref(true)
const showRecommendationSettings = ref(false)
const sidebarWidth = ref(280)

// Mock data - 在实际实现中这些数据来自stores
const currentUserId = ref('current-user')
const currentChatId = ref('current-chat')
const currentChat = ref({ title: '新对话' })

// Computed
const showContinuationSuggestions = computed(() => 
  inputMessage.value.length > 50 && recommendationStore.smartSuggestions.length > 0
)

const continuationSuggestions = computed(() => 
  recommendationStore.smartSuggestions.filter(s => s.type === 'continuation')
)

const showQuickPrompts = computed(() => 
  recommendationStore.recommendations.filter(r => r.type === 'prompt').length > 0
)

const quickPrompts = computed(() => 
  recommendationStore.recommendations.filter(r => r.type === 'prompt')
)

// Methods
const toggleRecommendations = async () => {
  const newState = !recommendationStore.isEnabled
  await recommendationStore.updatePersonalizationSettings(currentUserId.value, {
    enableRecommendations: newState
  })
  
  if (newState) {
    await recommendationStore.initialize(currentUserId.value)
  }
}

const handlePromptApplied = (content: string) => {
  inputMessage.value = content
  // 自动聚焦到输入框
  nextTick(() => {
    const input = document.querySelector('textarea') as HTMLTextAreaElement
    input?.focus()
  })
}

const handleTopicStarted = (topic: string) => {
  // 创建新聊天并发送话题
  createNewChatWithMessage(topic)
}

const handleModelSwitched = (modelId: string) => {
  // 切换AI模型
  console.log('切换模型到:', modelId)
  // 这里调用设置store的相关方法
}

const handleSuggestionApplied = (suggestion: SmartAssistantSuggestion) => {
  if (suggestion.type === 'continuation') {
    inputMessage.value += ' ' + suggestion.content
  } else {
    inputMessage.value = suggestion.content
  }
}

const applyContinuationSuggestion = (suggestion: any) => {
  inputMessage.value += ' ' + suggestion.preview
}

const applyQuickPrompt = (prompt: RecommendationItem) => {
  inputMessage.value = prompt.content
  recommendationStore.recordFeedback(prompt.id, 'apply')
}

const handleInterestExplored = (interest: UserInterest) => {
  const message = `我想深入了解${interest.keyword}相关的内容`
  createNewChatWithMessage(message)
}

const handleDomainExplored = (domain: KnowledgeDomain) => {
  const message = `作为${domain.domain}专家，我想了解这个领域的最新发展`
  createNewChatWithMessage(message)
}

const handleActionExecuted = (actionId: string) => {
  // 执行快捷操作
  switch (actionId) {
    case 'new-chat':
      createNewChat()
      break
    case 'code-review':
      inputMessage.value = '请帮我审查以下代码，指出潜在问题和改进建议：'
      break
    // ... 其他操作
  }
}

const handleScenarioStarted = (scenario: string) => {
  const scenarioPrompts = {
    '问答咨询': '我有一个问题想请教：',
    '创作协助': '我需要创作方面的帮助：',
    '学习指导': '我想学习以下内容，请指导：'
  }
  
  inputMessage.value = scenarioPrompts[scenario] || `关于${scenario}：`
}

const handleDeepExplore = (topic: string) => {
  const message = `让我们深入探讨"${topic}"这个话题，请从多个角度进行分析：`
  inputMessage.value = message
}

const handleContinuationApplied = (content: string) => {
  inputMessage.value += ' ' + content
}

const openRecommendationSettings = () => {
  showRecommendationSettings.value = true
}

const closeRecommendationSettings = () => {
  showRecommendationSettings.value = false
}

const handleSend = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return
  
  isLoading.value = true
  try {
    // 发送消息的逻辑
    await sendMessage(inputMessage.value)
    inputMessage.value = ''
    
    // 记录用户行为用于推荐分析
    await recordUserInteraction(inputMessage.value)
  } finally {
    isLoading.value = false
  }
}

const handleInputChange = () => {
  // 当用户输入时，生成智能建议
  if (inputMessage.value.length > 20) {
    recommendationStore.generateSmartSuggestions({
      currentMessage: inputMessage.value,
      recentMessages: getRecentMessages()
    })
  }
}

const getRecentMessages = () => {
  // 获取最近的消息用于上下文分析
  return chatStore.currentMessages?.slice(-5).map(m => m.content) || []
}

const createNewChat = () => {
  // 创建新聊天的逻辑
  console.log('创建新聊天')
}

const createNewChatWithMessage = (message: string) => {
  createNewChat()
  inputMessage.value = message
}

const sendMessage = async (message: string) => {
  // 发送消息的实际逻辑
  console.log('发送消息:', message)
}

const recordUserInteraction = async (message: string) => {
  // 记录用户交互用于推荐系统学习
  // 这会用于更新用户画像和改进推荐算法
}

// 初始化
onMounted(async () => {
  if (recommendationStore.isEnabled) {
    await recommendationStore.initialize(currentUserId.value)
  }
})

// 监听消息变化，自动生成推荐
watch(inputMessage, async (newMessage) => {
  if (newMessage.length > 30 && recommendationStore.isEnabled) {
    await recommendationStore.generateRecommendations(currentUserId.value, {
      currentMessage: newMessage,
      recentMessages: getRecentMessages(),
      currentChatId: currentChatId.value
    })
  }
}, { debounce: 1000 })
</script>

<style scoped>
.chat-view-with-recommendations {
  @apply relative;
}

/* 当个性化侧边栏打开时调整主区域边距 */
.personalized-sidebar-open {
  @apply mr-64;
}

.modal-overlay {
  @apply fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4;
}

.modal-content {
  @apply bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl;
}

/* 推荐元素的动画效果 */
.recommendation-enter-active,
.recommendation-leave-active {
  @apply transition-all duration-300;
}

.recommendation-enter-from {
  @apply opacity-0 transform scale-95;
}

.recommendation-leave-to {
  @apply opacity-0 transform scale-95;
}

/* 智能建议的特殊样式 */
.smart-suggestion {
  @apply animate-pulse-gentle;
}

@keyframes pulse-gentle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.animate-pulse-gentle {
  animation: pulse-gentle 2s ease-in-out infinite;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .personalized-sidebar-open {
    @apply mr-56;
  }
}

@media (max-width: 768px) {
  .personalized-sidebar-open {
    @apply mr-0;
  }
  
  .chat-view-with-recommendations {
    @apply flex-col;
  }
}
</style>