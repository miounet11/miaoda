<template>
  <div class="smart-prompt-suggestions">
    <!-- 主要推荐区域 -->
    <div v-if="hasRecommendations && isVisible" class="suggestions-container">
      <div class="suggestions-header">
        <div class="header-content">
          <Lightbulb class="w-4 h-4 text-yellow-500" />
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
            智能推荐
          </span>
          <span class="text-xs text-gray-500 dark:text-gray-400">
            {{ recommendations.length }} 个建议
          </span>
        </div>
        <button 
          @click="toggleVisibility"
          class="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ChevronDown 
            :class="['w-4 h-4 text-gray-500 transition-transform', { 'rotate-180': !isCollapsed }]" 
          />
        </button>
      </div>

      <div v-if="!isCollapsed" class="suggestions-content">
        <!-- 快速提示词 -->
        <div v-if="promptRecommendations.length > 0" class="suggestion-group">
          <h4 class="group-title">
            <MessageSquare class="w-3 h-3" />
            提示词模板
          </h4>
          <div class="recommendation-grid">
            <div 
              v-for="prompt in promptRecommendations.slice(0, 3)" 
              :key="prompt.id"
              class="recommendation-card prompt-card"
              @click="applyPrompt(prompt)"
            >
              <div class="card-header">
                <span class="card-title">{{ prompt.title }}</span>
                <span class="confidence-badge">{{ Math.round(prompt.confidence) }}%</span>
              </div>
              <p class="card-description">{{ prompt.description }}</p>
              <div class="card-actions">
                <button @click.stop="previewPrompt(prompt)" class="action-btn preview">
                  <Eye class="w-3 h-3" />
                  预览
                </button>
                <button @click.stop="applyPrompt(prompt)" class="action-btn apply">
                  <Plus class="w-3 h-3" />
                  应用
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 话题建议 -->
        <div v-if="topicRecommendations.length > 0" class="suggestion-group">
          <h4 class="group-title">
            <Hash class="w-3 h-3" />
            话题建议
          </h4>
          <div class="topic-list">
            <div 
              v-for="topic in topicRecommendations.slice(0, 4)" 
              :key="topic.id"
              class="topic-item"
              @click="startTopic(topic)"
            >
              <div class="topic-content">
                <span class="topic-title">{{ topic.title }}</span>
                <span class="topic-reason">{{ topic.reason }}</span>
              </div>
              <button @click.stop="recordFeedback(topic.id, 'dismiss')" class="dismiss-btn">
                <X class="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        <!-- 模型推荐 -->
        <div v-if="modelRecommendations.length > 0" class="suggestion-group">
          <h4 class="group-title">
            <Cpu class="w-3 h-3" />
            模型推荐
          </h4>
          <div class="model-list">
            <div 
              v-for="model in modelRecommendations.slice(0, 2)" 
              :key="model.id"
              class="model-item"
              @click="switchModel(model)"
            >
              <div class="model-info">
                <span class="model-name">{{ model.title }}</span>
                <span class="model-description">{{ model.description }}</span>
              </div>
              <div class="model-actions">
                <span class="confidence-badge small">{{ Math.round(model.confidence) }}%</span>
                <button class="switch-btn">切换</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 智能续写 -->
        <div v-if="smartSuggestions.length > 0" class="suggestion-group">
          <h4 class="group-title">
            <Zap class="w-3 h-3" />
            智能建议
          </h4>
          <div class="smart-suggestions">
            <div 
              v-for="suggestion in smartSuggestions.slice(0, 3)" 
              :key="`smart-${suggestion.type}`"
              class="smart-suggestion"
              @click="applySuggestion(suggestion)"
            >
              <div class="suggestion-icon">
                <component 
                  :is="getSuggestionIcon(suggestion.type)" 
                  class="w-4 h-4" 
                />
              </div>
              <div class="suggestion-text">
                <span class="suggestion-content">{{ suggestion.content }}</span>
                <span class="suggestion-confidence">置信度 {{ Math.round(suggestion.confidence) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 浮动建议按钮 -->
    <div 
      v-if="hasQuickSuggestions && !isVisible" 
      class="floating-suggestion"
      @click="showQuickSuggestion"
    >
      <div class="floating-content">
        <Sparkles class="w-4 h-4 text-blue-500" />
        <span class="text-sm">{{ quickSuggestionText }}</span>
      </div>
    </div>

    <!-- 提示词预览模态框 -->
    <div v-if="previewModal.show" class="modal-overlay" @click="closePreview">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ previewModal.prompt?.title }}</h3>
          <button @click="closePreview" class="close-btn">
            <X class="w-4 h-4" />
          </button>
        </div>
        <div class="modal-body">
          <p class="prompt-content">{{ previewModal.prompt?.content }}</p>
          <div class="prompt-meta">
            <span class="meta-item">分类: {{ previewModal.prompt?.category }}</span>
            <span class="meta-item">置信度: {{ Math.round(previewModal.prompt?.confidence || 0) }}%</span>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="closePreview" class="btn-secondary">取消</button>
          <button @click="applyPromptFromPreview" class="btn-primary">应用提示词</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { 
  Lightbulb, ChevronDown, MessageSquare, Eye, Plus, Hash, X, 
  Cpu, Zap, Sparkles, ArrowRight, BookOpen, HelpCircle 
} from 'lucide-vue-next'
import { useRecommendationStore } from '../../stores/recommendation'
import type { 
  RecommendationItem, 
  SmartAssistantSuggestion 
} from '../../types/recommendation'

// Props
interface Props {
  currentMessage?: string
  recentMessages?: string[]
  chatId?: string
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
}>()

// Store
const recommendationStore = useRecommendationStore()

// State
const isVisible = ref(props.visible)
const isCollapsed = ref(false)
const previewModal = ref<{
  show: boolean
  prompt: RecommendationItem | null
}>({
  show: false,
  prompt: null
})

// Computed
const recommendations = computed(() => recommendationStore.recommendations)
const smartSuggestions = computed(() => recommendationStore.smartSuggestions)

const hasRecommendations = computed(() => 
  recommendations.value.length > 0 || smartSuggestions.value.length > 0
)

const promptRecommendations = computed(() => 
  recommendations.value.filter(rec => rec.type === 'prompt')
)

const topicRecommendations = computed(() => 
  recommendations.value.filter(rec => rec.type === 'topic')
)

const modelRecommendations = computed(() => 
  recommendations.value.filter(rec => rec.type === 'model')
)

const hasQuickSuggestions = computed(() => {
  return smartSuggestions.value.length > 0 && 
         smartSuggestions.value.some(s => s.confidence > 70)
})

const quickSuggestionText = computed(() => {
  const topSuggestion = smartSuggestions.value
    .sort((a, b) => b.confidence - a.confidence)[0]
  return topSuggestion ? topSuggestion.content.substring(0, 30) + '...' : ''
})

// Methods
const toggleVisibility = () => {
  isCollapsed.value = !isCollapsed.value
}

const applyPrompt = (prompt: RecommendationItem) => {
  emit('promptApplied', prompt.content)
  recordFeedback(prompt.id, 'apply')
}

const previewPrompt = (prompt: RecommendationItem) => {
  previewModal.value = {
    show: true,
    prompt
  }
  recordFeedback(prompt.id, 'click')
}

const closePreview = () => {
  previewModal.value = {
    show: false,
    prompt: null
  }
}

const applyPromptFromPreview = () => {
  if (previewModal.value.prompt) {
    applyPrompt(previewModal.value.prompt)
  }
  closePreview()
}

const startTopic = (topic: RecommendationItem) => {
  emit('topicStarted', topic.content)
  recordFeedback(topic.id, 'apply')
}

const switchModel = (model: RecommendationItem) => {
  if (model.metadata?.model) {
    emit('modelSwitched', model.metadata.model)
    recordFeedback(model.id, 'apply')
  }
}

const applySuggestion = (suggestion: SmartAssistantSuggestion) => {
  emit('suggestionApplied', suggestion)
}

const showQuickSuggestion = () => {
  isVisible.value = true
  isCollapsed.value = false
}

const recordFeedback = (recommendationId: string, action: 'click' | 'dismiss' | 'apply') => {
  recommendationStore.recordFeedback(recommendationId, action)
}

const getSuggestionIcon = (type: string) => {
  switch (type) {
    case 'continuation': return ArrowRight
    case 'deep_dive': return BookOpen
    case 'clarification': return HelpCircle
    default: return Zap
  }
}

// 监听消息变化，生成新推荐
watch([() => props.currentMessage, () => props.recentMessages], async () => {
  if (recommendationStore.isEnabled && props.currentMessage) {
    await recommendationStore.generateRecommendations('current-user', {
      currentMessage: props.currentMessage,
      recentMessages: props.recentMessages,
      currentChatId: props.chatId
    })

    await recommendationStore.generateSmartSuggestions({
      currentMessage: props.currentMessage,
      recentMessages: props.recentMessages
    })
  }
}, { debounce: 1000 })

// 初始化
onMounted(async () => {
  if (recommendationStore.isEnabled) {
    await recommendationStore.initialize('current-user')
  }
})

// 键盘快捷键
const handleKeyDown = (event: KeyboardEvent) => {
  // Ctrl/Cmd + Shift + R: 切换推荐显示
  if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'R') {
    event.preventDefault()
    toggleVisibility()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.smart-prompt-suggestions {
  @apply relative;
}

.suggestions-container {
  @apply bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg mb-4;
}

.suggestions-header {
  @apply flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700;
}

.header-content {
  @apply flex items-center gap-2;
}

.suggestions-content {
  @apply p-4 space-y-4 max-h-96 overflow-y-auto;
}

.suggestion-group {
  @apply space-y-2;
}

.group-title {
  @apply flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2;
}

/* 提示词推荐 */
.recommendation-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3;
}

.recommendation-card {
  @apply bg-gray-50 dark:bg-gray-700 rounded-lg p-3 cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-gray-600 hover:shadow-md;
}

.prompt-card {
  @apply border-l-4 border-blue-500;
}

.card-header {
  @apply flex items-center justify-between mb-2;
}

.card-title {
  @apply text-sm font-medium text-gray-800 dark:text-gray-200;
}

.confidence-badge {
  @apply px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full;
}

.confidence-badge.small {
  @apply px-1.5 py-0.5 text-xs;
}

.card-description {
  @apply text-xs text-gray-600 dark:text-gray-400 mb-2;
}

.card-actions {
  @apply flex gap-2;
}

.action-btn {
  @apply flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors;
}

.action-btn.preview {
  @apply bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500;
}

.action-btn.apply {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}

/* 话题建议 */
.topic-list {
  @apply space-y-2;
}

.topic-item {
  @apply flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg cursor-pointer transition-all hover:bg-green-100 dark:hover:bg-green-900/30;
}

.topic-content {
  @apply flex-1;
}

.topic-title {
  @apply block text-sm font-medium text-gray-800 dark:text-gray-200;
}

.topic-reason {
  @apply block text-xs text-gray-600 dark:text-gray-400 mt-1;
}

.dismiss-btn {
  @apply p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700;
}

/* 模型推荐 */
.model-list {
  @apply space-y-2;
}

.model-item {
  @apply flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg cursor-pointer transition-all hover:bg-purple-100 dark:hover:bg-purple-900/30;
}

.model-info {
  @apply flex-1;
}

.model-name {
  @apply block text-sm font-medium text-gray-800 dark:text-gray-200;
}

.model-description {
  @apply block text-xs text-gray-600 dark:text-gray-400 mt-1;
}

.model-actions {
  @apply flex items-center gap-2;
}

.switch-btn {
  @apply px-3 py-1 bg-purple-500 text-white text-xs rounded-md hover:bg-purple-600;
}

/* 智能建议 */
.smart-suggestions {
  @apply space-y-2;
}

.smart-suggestion {
  @apply flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg cursor-pointer transition-all hover:bg-yellow-100 dark:hover:bg-yellow-900/30;
}

.suggestion-icon {
  @apply flex-shrink-0 p-1.5 bg-yellow-200 dark:bg-yellow-700 rounded-full;
}

.suggestion-text {
  @apply flex-1;
}

.suggestion-content {
  @apply block text-sm text-gray-800 dark:text-gray-200;
}

.suggestion-confidence {
  @apply block text-xs text-gray-600 dark:text-gray-400 mt-1;
}

/* 浮动建议 */
.floating-suggestion {
  @apply fixed bottom-4 right-4 z-50 bg-blue-500 text-white rounded-full shadow-lg cursor-pointer transition-all hover:bg-blue-600 hover:shadow-xl;
}

.floating-content {
  @apply flex items-center gap-2 px-4 py-3;
}

/* 模态框 */
.modal-overlay {
  @apply fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4;
}

.modal-content {
  @apply bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-96 overflow-y-auto;
}

.modal-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700;
}

.modal-title {
  @apply text-lg font-semibold text-gray-800 dark:text-gray-200;
}

.close-btn {
  @apply p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700;
}

.modal-body {
  @apply p-4 space-y-3;
}

.prompt-content {
  @apply text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 p-3 rounded-lg;
}

.prompt-meta {
  @apply flex gap-4 text-xs text-gray-600 dark:text-gray-400;
}

.meta-item {
  @apply flex items-center gap-1;
}

.modal-actions {
  @apply flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700;
}

.btn-secondary {
  @apply px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600;
}

.btn-primary {
  @apply px-4 py-2 text-sm text-white bg-blue-500 rounded-md hover:bg-blue-600;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .recommendation-grid {
    @apply grid-cols-1;
  }
  
  .suggestions-content {
    @apply max-h-80;
  }
}
</style>