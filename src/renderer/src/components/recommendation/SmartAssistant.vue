<template>
  <div class="smart-assistant">
    <!-- 智能助手触发按钮 -->
    <div 
      v-if="!isExpanded && hasActiveSuggestions" 
      class="assistant-trigger"
      @click="expand"
    >
      <div class="trigger-content">
        <div class="assistant-avatar">
          <Bot class="w-5 h-5" />
        </div>
        <div class="trigger-text">
          <span class="trigger-title">智能助手</span>
          <span class="trigger-preview">{{ previewText }}</span>
        </div>
        <div class="suggestions-count">
          {{ activeSuggestionsCount }}
        </div>
      </div>
    </div>

    <!-- 展开的智能助手面板 -->
    <div v-if="isExpanded" class="assistant-panel">
      <div class="panel-header">
        <div class="header-left">
          <div class="assistant-avatar">
            <Bot class="w-5 h-5" />
          </div>
          <div class="header-info">
            <h3 class="panel-title">智能助手</h3>
            <p class="panel-subtitle">为您提供智能建议和深度洞察</p>
          </div>
        </div>
        <div class="header-actions">
          <button @click="refreshSuggestions" class="refresh-btn" :disabled="loading">
            <RefreshCw :class="['w-4 h-4', { 'animate-spin': loading }]" />
          </button>
          <button @click="collapse" class="close-btn">
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div class="panel-content">
        <!-- 当前上下文分析 -->
        <div v-if="contextAnalysis" class="context-section">
          <div class="section-title">
            <Brain class="w-4 h-4" />
            <span>上下文分析</span>
          </div>
          <div class="context-insights">
            <div class="insight-item">
              <span class="insight-label">主题:</span>
              <span class="insight-value">{{ contextAnalysis.mainTopic }}</span>
            </div>
            <div class="insight-item">
              <span class="insight-label">复杂度:</span>
              <div class="complexity-indicator">
                <div 
                  class="complexity-bar"
                  :style="{ width: `${contextAnalysis.complexity}%` }"
                ></div>
                <span class="complexity-text">{{ getComplexityLabel(contextAnalysis.complexity) }}</span>
              </div>
            </div>
            <div class="insight-item">
              <span class="insight-label">情绪倾向:</span>
              <span class="insight-value sentiment" :class="contextAnalysis.sentiment">
                {{ getSentimentLabel(contextAnalysis.sentiment) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 智能建议列表 -->
        <div v-if="suggestions.length > 0" class="suggestions-section">
          <div class="section-title">
            <Lightbulb class="w-4 h-4" />
            <span>智能建议</span>
          </div>
          <div class="suggestions-list">
            <div 
              v-for="suggestion in suggestions" 
              :key="`${suggestion.type}-${suggestion.content.slice(0, 20)}`"
              class="suggestion-card"
              :class="getSuggestionClass(suggestion.type)"
              @click="applySuggestion(suggestion)"
            >
              <div class="suggestion-header">
                <div class="suggestion-icon">
                  <component :is="getSuggestionIcon(suggestion.type)" class="w-4 h-4" />
                </div>
                <div class="suggestion-meta">
                  <span class="suggestion-title">{{ getSuggestionTitle(suggestion.type) }}</span>
                  <span class="suggestion-confidence">置信度: {{ Math.round(suggestion.confidence) }}%</span>
                </div>
              </div>
              <p class="suggestion-content">{{ suggestion.content }}</p>
              <div class="suggestion-actions">
                <button 
                  @click.stop="applySuggestion(suggestion)"
                  class="apply-suggestion-btn"
                >
                  <Play class="w-3 h-3" />
                  应用建议
                </button>
                <button 
                  @click.stop="dismissSuggestion(suggestion)"
                  class="dismiss-suggestion-btn"
                >
                  <Minus class="w-3 h-3" />
                  忽略
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 深度探索建议 -->
        <div v-if="deepDiveTopics.length > 0" class="deep-dive-section">
          <div class="section-title">
            <Search class="w-4 h-4" />
            <span>深度探索</span>
          </div>
          <div class="deep-dive-topics">
            <div 
              v-for="topic in deepDiveTopics" 
              :key="topic.id"
              class="deep-dive-card"
              @click="exploreDeep(topic)"
            >
              <div class="topic-header">
                <span class="topic-title">{{ topic.title }}</span>
                <span class="topic-difficulty">{{ topic.difficulty }}</span>
              </div>
              <p class="topic-description">{{ topic.description }}</p>
              <div class="topic-tags">
                <span 
                  v-for="tag in topic.tags.slice(0, 3)" 
                  :key="tag"
                  class="topic-tag"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 学习路径建议 -->
        <div v-if="learningPathSuggestions.length > 0" class="learning-path-section">
          <div class="section-title">
            <BookOpen class="w-4 h-4" />
            <span>学习路径</span>
          </div>
          <div class="learning-paths">
            <div 
              v-for="path in learningPathSuggestions" 
              :key="path.id"
              class="learning-path-card"
              @click="startLearningPath(path)"
            >
              <div class="path-header">
                <div class="path-icon">
                  <GraduationCap class="w-5 h-5" />
                </div>
                <div class="path-info">
                  <span class="path-title">{{ path.title }}</span>
                  <span class="path-duration">预计 {{ path.estimatedHours }} 小时</span>
                </div>
              </div>
              <p class="path-description">{{ path.description }}</p>
              <div class="path-progress">
                <div class="progress-steps">
                  <div 
                    v-for="(step, index) in path.steps.slice(0, 4)" 
                    :key="index"
                    class="progress-step"
                    :class="{ active: index === 0 }"
                  >
                    {{ index + 1 }}
                  </div>
                  <span v-if="path.steps.length > 4" class="steps-more">
                    +{{ path.steps.length - 4 }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 对话续写建议 -->
        <div v-if="continuationSuggestions.length > 0" class="continuation-section">
          <div class="section-title">
            <MessageSquare class="w-4 h-4" />
            <span>对话续写</span>
          </div>
          <div class="continuation-options">
            <div 
              v-for="(continuation, index) in continuationSuggestions" 
              :key="index"
              class="continuation-card"
              @click="applyContinuation(continuation)"
            >
              <div class="continuation-header">
                <span class="continuation-type">{{ continuation.type }}</span>
                <span class="continuation-confidence">{{ Math.round(continuation.confidence) }}%</span>
              </div>
              <p class="continuation-preview">{{ continuation.preview }}</p>
            </div>
          </div>
        </div>

        <!-- 无建议状态 */
        <div v-if="!hasAnySuggestions" class="no-suggestions">
          <div class="no-suggestions-icon">
            <MessageCircle class="w-8 h-8 text-gray-400" />
          </div>
          <p class="no-suggestions-text">
            暂无智能建议，继续对话以获得更多个性化建议
          </p>
          <button @click="generateSuggestions" class="generate-btn">
            生成建议
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { 
  Bot, RefreshCw, X, Brain, Lightbulb, Search, BookOpen, 
  GraduationCap, MessageSquare, MessageCircle, Play, Minus,
  ArrowRight, HelpCircle, Zap, ChevronRight
} from 'lucide-vue-next'
import { useRecommendationStore } from '../../stores/recommendation'
import type { SmartAssistantSuggestion } from '../../types/recommendation'

// Props
interface Props {
  currentMessage?: string
  recentMessages?: string[]
  chatId?: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  suggestionApplied: [suggestion: SmartAssistantSuggestion]
  deepExploreRequested: [topic: string]
  learningPathStarted: [pathId: string]
  continuationApplied: [content: string]
}>()

// Store
const recommendationStore = useRecommendationStore()

// State
const isExpanded = ref(false)
const loading = ref(false)

// Mock data for demo purposes
const contextAnalysis = ref({
  mainTopic: 'Web开发',
  complexity: 75,
  sentiment: 'neutral' as 'positive' | 'negative' | 'neutral'
})

const deepDiveTopics = ref([
  {
    id: 'react-hooks',
    title: 'React Hooks 深入解析',
    description: '深入理解 useState, useEffect 等核心 Hooks',
    difficulty: '中级',
    tags: ['React', 'Hooks', 'JavaScript']
  },
  {
    id: 'performance-optimization',
    title: '前端性能优化',
    description: '掌握现代前端性能优化的最佳实践',
    difficulty: '高级',
    tags: ['性能', '优化', 'Web']
  }
])

const learningPathSuggestions = ref([
  {
    id: 'path-1',
    title: 'Vue 3 完整学习路径',
    description: '从基础到高级，全面掌握 Vue 3 开发技能',
    estimatedHours: 40,
    steps: [
      { title: 'Vue 3 基础' },
      { title: 'Composition API' },
      { title: '状态管理' },
      { title: '路由配置' },
      { title: '项目实战' }
    ]
  }
])

const continuationSuggestions = ref([
  {
    type: '深入分析',
    confidence: 85,
    preview: '让我们深入分析这个问题的核心原理...'
  },
  {
    type: '实践应用',
    confidence: 78,
    preview: '基于刚才讨论的内容，我们来看看实际应用...'
  },
  {
    type: '替代方案',
    confidence: 70,
    preview: '除了这个方法，还有几种不同的解决思路...'
  }
])

// Computed
const suggestions = computed(() => recommendationStore.smartSuggestions)

const hasActiveSuggestions = computed(() => 
  suggestions.value.length > 0 || 
  deepDiveTopics.value.length > 0 || 
  learningPathSuggestions.value.length > 0
)

const activeSuggestionsCount = computed(() => 
  suggestions.value.length + 
  deepDiveTopics.value.length + 
  learningPathSuggestions.value.length
)

const previewText = computed(() => {
  if (suggestions.value.length > 0) {
    return suggestions.value[0].content.substring(0, 30) + '...'
  }
  if (deepDiveTopics.value.length > 0) {
    return `探索：${deepDiveTopics.value[0].title}`
  }
  return '有新建议'
})

const hasAnySuggestions = computed(() => 
  suggestions.value.length > 0 || 
  deepDiveTopics.value.length > 0 || 
  learningPathSuggestions.value.length > 0 ||
  continuationSuggestions.value.length > 0
)

// Methods
const expand = () => {
  isExpanded.value = true
}

const collapse = () => {
  isExpanded.value = false
}

const refreshSuggestions = async () => {
  loading.value = true
  try {
    await recommendationStore.generateSmartSuggestions({
      currentMessage: props.currentMessage,
      recentMessages: props.recentMessages,
      currentChatId: props.chatId
    })
  } finally {
    loading.value = false
  }
}

const applySuggestion = (suggestion: SmartAssistantSuggestion) => {
  emit('suggestionApplied', suggestion)
}

const dismissSuggestion = (suggestion: SmartAssistantSuggestion) => {
  // Remove from local suggestions
  const index = suggestions.value.findIndex(s => s.content === suggestion.content)
  if (index > -1) {
    suggestions.value.splice(index, 1)
  }
}

const exploreDeep = (topic: any) => {
  emit('deepExploreRequested', topic.title)
}

const startLearningPath = (path: any) => {
  emit('learningPathStarted', path.id)
}

const applyContinuation = (continuation: any) => {
  emit('continuationApplied', continuation.preview)
}

const generateSuggestions = async () => {
  await refreshSuggestions()
}

const getSuggestionIcon = (type: string) => {
  switch (type) {
    case 'continuation': return ArrowRight
    case 'deep_dive': return Search
    case 'clarification': return HelpCircle
    case 'alternative': return Zap
    default: return Lightbulb
  }
}

const getSuggestionTitle = (type: string): string => {
  switch (type) {
    case 'continuation': return '继续探讨'
    case 'deep_dive': return '深入分析'
    case 'clarification': return '澄清问题'
    case 'alternative': return '替代方案'
    default: return '智能建议'
  }
}

const getSuggestionClass = (type: string): string => {
  switch (type) {
    case 'continuation': return 'suggestion-continuation'
    case 'deep_dive': return 'suggestion-deep-dive'
    case 'clarification': return 'suggestion-clarification'
    case 'alternative': return 'suggestion-alternative'
    default: return 'suggestion-default'
  }
}

const getComplexityLabel = (complexity: number): string => {
  if (complexity >= 80) return '高级'
  if (complexity >= 50) return '中级'
  return '基础'
}

const getSentimentLabel = (sentiment: string): string => {
  switch (sentiment) {
    case 'positive': return '积极'
    case 'negative': return '消极'
    default: return '中性'
  }
}

// 监听消息变化
watch([() => props.currentMessage, () => props.recentMessages], async () => {
  if (props.currentMessage) {
    await refreshSuggestions()
  }
}, { debounce: 2000 })

// 初始化
onMounted(async () => {
  if (props.currentMessage) {
    await refreshSuggestions()
  }
})
</script>

<style scoped>
.smart-assistant {
  @apply relative z-10;
}

/* 触发按钮 */
.assistant-trigger {
  @apply fixed bottom-20 right-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg cursor-pointer transition-all hover:shadow-xl hover:scale-105 z-50;
}

.trigger-content {
  @apply flex items-center gap-3 p-3;
}

.assistant-avatar {
  @apply w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0;
}

.trigger-text {
  @apply flex flex-col;
}

.trigger-title {
  @apply text-sm font-semibold;
}

.trigger-preview {
  @apply text-xs opacity-90;
}

.suggestions-count {
  @apply w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold;
}

/* 助手面板 */
.assistant-panel {
  @apply fixed bottom-4 right-4 w-96 max-h-[32rem] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50;
}

.panel-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20;
}

.header-left {
  @apply flex items-center gap-3;
}

.header-info {
  @apply flex flex-col;
}

.panel-title {
  @apply text-sm font-semibold text-gray-800 dark:text-gray-200;
}

.panel-subtitle {
  @apply text-xs text-gray-600 dark:text-gray-400;
}

.header-actions {
  @apply flex items-center gap-2;
}

.refresh-btn, .close-btn {
  @apply p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-white hover:bg-opacity-50 transition-colors;
}

.panel-content {
  @apply max-h-96 overflow-y-auto p-4 space-y-4;
}

/* 通用section样式 */
.section-title {
  @apply flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3;
}

/* 上下文分析 */
.context-insights {
  @apply space-y-2;
}

.insight-item {
  @apply flex items-center justify-between text-sm;
}

.insight-label {
  @apply text-gray-600 dark:text-gray-400;
}

.insight-value {
  @apply font-medium text-gray-800 dark:text-gray-200;
}

.insight-value.sentiment.positive {
  @apply text-green-600;
}

.insight-value.sentiment.negative {
  @apply text-red-600;
}

.insight-value.sentiment.neutral {
  @apply text-blue-600;
}

.complexity-indicator {
  @apply flex items-center gap-2;
}

.complexity-bar {
  @apply h-2 bg-blue-500 rounded-full transition-all duration-500;
  width: 60px;
}

.complexity-text {
  @apply text-xs font-medium;
}

/* 建议卡片 */
.suggestions-list {
  @apply space-y-3;
}

.suggestion-card {
  @apply p-3 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer transition-all hover:shadow-md;
}

.suggestion-card.suggestion-continuation {
  @apply bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700;
}

.suggestion-card.suggestion-deep-dive {
  @apply bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700;
}

.suggestion-card.suggestion-clarification {
  @apply bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700;
}

.suggestion-card.suggestion-alternative {
  @apply bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700;
}

.suggestion-header {
  @apply flex items-center gap-2 mb-2;
}

.suggestion-icon {
  @apply p-1 rounded-full bg-white dark:bg-gray-700;
}

.suggestion-meta {
  @apply flex-1;
}

.suggestion-title {
  @apply text-sm font-medium text-gray-800 dark:text-gray-200 block;
}

.suggestion-confidence {
  @apply text-xs text-gray-600 dark:text-gray-400;
}

.suggestion-content {
  @apply text-sm text-gray-700 dark:text-gray-300 mb-3;
}

.suggestion-actions {
  @apply flex gap-2;
}

.apply-suggestion-btn, .dismiss-suggestion-btn {
  @apply flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors;
}

.apply-suggestion-btn {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}

.dismiss-suggestion-btn {
  @apply bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500;
}

/* 深度探索 */
.deep-dive-topics {
  @apply space-y-3;
}

.deep-dive-card {
  @apply p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700 cursor-pointer transition-all hover:bg-green-100 dark:hover:bg-green-900/30;
}

.topic-header {
  @apply flex items-center justify-between mb-2;
}

.topic-title {
  @apply text-sm font-medium text-gray-800 dark:text-gray-200;
}

.topic-difficulty {
  @apply px-2 py-1 text-xs bg-green-200 dark:bg-green-700 text-green-800 dark:text-green-200 rounded-full;
}

.topic-description {
  @apply text-sm text-gray-600 dark:text-gray-400 mb-2;
}

.topic-tags {
  @apply flex gap-2;
}

.topic-tag {
  @apply px-2 py-1 text-xs bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 rounded-md;
}

/* 学习路径 */
.learning-paths {
  @apply space-y-3;
}

.learning-path-card {
  @apply p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700 cursor-pointer transition-all hover:bg-blue-100 dark:hover:bg-blue-900/30;
}

.path-header {
  @apply flex items-center gap-3 mb-2;
}

.path-icon {
  @apply p-2 bg-blue-500 text-white rounded-lg;
}

.path-info {
  @apply flex-1;
}

.path-title {
  @apply text-sm font-medium text-gray-800 dark:text-gray-200 block;
}

.path-duration {
  @apply text-xs text-gray-600 dark:text-gray-400;
}

.path-description {
  @apply text-sm text-gray-600 dark:text-gray-400 mb-3;
}

.progress-steps {
  @apply flex items-center gap-2;
}

.progress-step {
  @apply w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 text-xs flex items-center justify-center text-gray-600 dark:text-gray-400;
}

.progress-step.active {
  @apply bg-blue-500 text-white;
}

.steps-more {
  @apply text-xs text-gray-500;
}

/* 对话续写 */
.continuation-options {
  @apply space-y-2;
}

.continuation-card {
  @apply p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700 cursor-pointer transition-all hover:bg-yellow-100 dark:hover:bg-yellow-900/30;
}

.continuation-header {
  @apply flex items-center justify-between mb-2;
}

.continuation-type {
  @apply text-sm font-medium text-yellow-800 dark:text-yellow-200;
}

.continuation-confidence {
  @apply text-xs text-yellow-600 dark:text-yellow-400;
}

.continuation-preview {
  @apply text-sm text-gray-700 dark:text-gray-300;
}

/* 无建议状态 */
.no-suggestions {
  @apply text-center py-8;
}

.no-suggestions-icon {
  @apply mb-4;
}

.no-suggestions-text {
  @apply text-sm text-gray-600 dark:text-gray-400 mb-4;
}

.generate-btn {
  @apply px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .assistant-panel {
    @apply w-80 right-2;
  }
}

@media (max-width: 640px) {
  .assistant-panel {
    @apply w-full left-4 right-4;
  }
}
</style>