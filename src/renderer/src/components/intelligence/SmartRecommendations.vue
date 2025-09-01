<template>
  <div class="smart-recommendations">
    <!-- 推荐卡片容器 -->
    <TransitionGroup 
      name="recommendation-list" 
      tag="div"
      class="recommendations-container"
    >
      <div
        v-for="recommendation in visibleRecommendations"
        :key="recommendation.id"
        class="recommendation-card"
        :class="{
          'high-priority': recommendation.priority === 'high',
          'medium-priority': recommendation.priority === 'medium',
          'low-priority': recommendation.priority === 'low'
        }"
      >
        <!-- 推荐类型图标 -->
        <div class="recommendation-icon">
          <component :is="getRecommendationIcon(recommendation.type)" :size="20" />
        </div>

        <!-- 推荐内容 -->
        <div class="recommendation-content">
          <h4 class="recommendation-title">{{ recommendation.title }}</h4>
          <p class="recommendation-description">{{ recommendation.description }}</p>
          <span class="recommendation-reason">{{ recommendation.reason }}</span>
        </div>

        <!-- 置信度指示器 -->
        <div class="confidence-indicator" v-if="showConfidence">
          <div class="confidence-bar">
            <div 
              class="confidence-fill" 
              :style="{ width: `${recommendation.confidence * 100}%` }"
            />
          </div>
          <span class="confidence-text">{{ Math.round(recommendation.confidence * 100) }}%</span>
        </div>

        <!-- 操作按钮 -->
        <div class="recommendation-actions">
          <button
            v-if="recommendation.action"
            @click="handleAction(recommendation)"
            class="action-button primary"
          >
            <Check :size="16" />
            <span>接受</span>
          </button>
          <button
            v-if="recommendation.dismissible"
            @click="dismissRecommendation(recommendation.id)"
            class="action-button ghost"
          >
            <X :size="16" />
          </button>
        </div>
      </div>
    </TransitionGroup>

    <!-- 空状态 -->
    <div v-if="!visibleRecommendations.length" class="empty-state">
      <Sparkles :size="48" class="empty-icon" />
      <p class="empty-text">暂无推荐内容</p>
      <span class="empty-hint">使用越多，推荐越精准</span>
    </div>

    <!-- 加载更多 -->
    <button
      v-if="hasMore"
      @click="loadMore"
      class="load-more-button"
    >
      加载更多推荐
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { 
  Sparkles, 
  Lightbulb, 
  BookOpen, 
  Bell, 
  Info,
  Check,
  X,
  ChevronRight
} from 'lucide-vue-next'
import { useUserMemory } from '@renderer/src/services/memory/UserMemoryService'
import type { SmartRecommendation } from '@renderer/src/services/memory/UserMemoryService'

interface Props {
  type?: SmartRecommendation['type']
  limit?: number
  showConfidence?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

const props = withDefaults(defineProps<Props>(), {
  limit: 5,
  showConfidence: false,
  autoRefresh: true,
  refreshInterval: 60000 // 1分钟
})

const emit = defineEmits<{
  'action': [recommendation: SmartRecommendation]
  'dismiss': [id: string]
  'load-more': []
}>()

// 使用记忆服务
const { recommendations, dismissRecommendation: dismissService } = useUserMemory()

// 状态
const displayLimit = ref(props.limit)
const dismissedIds = ref<Set<string>>(new Set())

// 计算可见的推荐
const visibleRecommendations = computed(() => {
  let filtered = recommendations.value || []
  
  // 按类型筛选
  if (props.type) {
    filtered = filtered.filter(r => r.type === props.type)
  }
  
  // 过滤已忽略的
  filtered = filtered.filter(r => !dismissedIds.value.has(r.id))
  
  // 按优先级和置信度排序
  filtered.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
    if (priorityDiff !== 0) return priorityDiff
    return b.confidence - a.confidence
  })
  
  // 限制显示数量
  return filtered.slice(0, displayLimit.value)
})

// 是否还有更多
const hasMore = computed(() => {
  const total = recommendations.value?.length || 0
  return total > displayLimit.value
})

// 获取推荐图标
const getRecommendationIcon = (type: SmartRecommendation['type']) => {
  const icons = {
    content: BookOpen,
    feature: Lightbulb,
    reminder: Bell,
    tip: Info
  }
  return icons[type] || Sparkles
}

// 处理推荐操作
const handleAction = (recommendation: SmartRecommendation) => {
  if (recommendation.action) {
    recommendation.action()
  }
  emit('action', recommendation)
  
  // 执行后自动隐藏
  if (recommendation.dismissible) {
    dismissRecommendation(recommendation.id)
  }
}

// 忽略推荐
const dismissRecommendation = (id: string) => {
  dismissedIds.value.add(id)
  dismissService(id)
  emit('dismiss', id)
}

// 加载更多
const loadMore = () => {
  displayLimit.value += props.limit
  emit('load-more')
}

// 自动刷新
let refreshTimer: NodeJS.Timeout | null = null

const startAutoRefresh = () => {
  if (!props.autoRefresh) return
  
  refreshTimer = setInterval(() => {
    // 触发推荐更新
    // 这里可以调用服务层的刷新方法
  }, props.refreshInterval)
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// 生命周期
onMounted(() => {
  startAutoRefresh()
})

// 监听属性变化
watch(() => props.autoRefresh, (newVal) => {
  if (newVal) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
})

// 清理
onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.smart-recommendations {
  padding: 16px;
}

.recommendations-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 推荐卡片 */
.recommendation-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.recommendation-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #3b82f6;
}

/* 优先级样式 */
.recommendation-card.high-priority {
  border-left: 3px solid #ef4444;
}

.recommendation-card.medium-priority {
  border-left: 3px solid #f59e0b;
}

.recommendation-card.low-priority {
  border-left: 3px solid #10b981;
}

/* 图标 */
.recommendation-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eff6ff;
  border-radius: 8px;
  color: #3b82f6;
  flex-shrink: 0;
}

/* 内容 */
.recommendation-content {
  flex: 1;
  min-width: 0;
}

.recommendation-title {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recommendation-description {
  margin: 0 0 4px 0;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.4;
}

.recommendation-reason {
  font-size: 11px;
  color: #9ca3af;
  font-style: italic;
}

/* 置信度指示器 */
.confidence-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 60px;
}

.confidence-bar {
  width: 60px;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}

.confidence-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #10b981);
  transition: width 0.3s ease;
}

.confidence-text {
  font-size: 11px;
  color: #6b7280;
}

/* 操作按钮 */
.recommendation-actions {
  display: flex;
  gap: 8px;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button.primary {
  background: #3b82f6;
  color: white;
}

.action-button.primary:hover {
  background: #2563eb;
}

.action-button.ghost {
  background: transparent;
  color: #6b7280;
  padding: 6px;
}

.action-button.ghost:hover {
  background: #f3f4f6;
  color: #374151;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.empty-icon {
  color: #d1d5db;
  margin-bottom: 16px;
}

.empty-text {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 500;
  color: #6b7280;
}

.empty-hint {
  font-size: 13px;
  color: #9ca3af;
}

/* 加载更多 */
.load-more-button {
  width: 100%;
  padding: 12px;
  margin-top: 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.load-more-button:hover {
  background: #f9fafb;
  color: #374151;
  border-color: #d1d5db;
}

/* 动画 */
.recommendation-list-enter-active,
.recommendation-list-leave-active {
  transition: all 0.3s ease;
}

.recommendation-list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.recommendation-list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.recommendation-list-move {
  transition: transform 0.3s ease;
}

/* 暗色模式 */
@media (prefers-color-scheme: dark) {
  .recommendation-card {
    background: #1f2937;
    border-color: #374151;
  }
  
  .recommendation-card:hover {
    border-color: #60a5fa;
  }
  
  .recommendation-icon {
    background: #1e3a8a;
    color: #60a5fa;
  }
  
  .recommendation-title {
    color: #f3f4f6;
  }
  
  .recommendation-description {
    color: #9ca3af;
  }
  
  .recommendation-reason {
    color: #6b7280;
  }
  
  .confidence-bar {
    background: #374151;
  }
  
  .action-button.ghost {
    color: #9ca3af;
  }
  
  .action-button.ghost:hover {
    background: #374151;
    color: #d1d5db;
  }
  
  .empty-state {
    color: #9ca3af;
  }
  
  .load-more-button {
    background: #1f2937;
    border-color: #374151;
    color: #9ca3af;
  }
  
  .load-more-button:hover {
    background: #374151;
    color: #d1d5db;
  }
}

/* 响应式 */
@media (max-width: 640px) {
  .recommendation-card {
    flex-direction: column;
    align-items: flex-start;
    padding: 12px;
  }
  
  .confidence-indicator {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    margin-top: 8px;
  }
  
  .confidence-bar {
    flex: 1;
    margin-right: 8px;
  }
  
  .recommendation-actions {
    width: 100%;
    justify-content: flex-end;
    margin-top: 8px;
  }
}
</style>