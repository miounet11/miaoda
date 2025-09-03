<template>
  <div
    :class="[
      'status-message-card flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm',
      cardClasses
    ]"
    role="alert"
    :aria-live="isImportant ? 'assertive' : 'polite'"
  >
    <!-- 图标 -->
    <div class="flex-shrink-0 mt-0.5">
      <component :is="iconComponent" :size="20" :class="iconClasses" />
    </div>

    <!-- 内容 -->
    <div class="flex-1 min-w-0">
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1">
          <h4 class="font-medium text-sm leading-tight">{{ props.message.title }}</h4>
          <p v-if="props.message.message" class="text-sm text-muted-foreground mt-1 leading-relaxed">
            {{ props.message.message }}
          </p>
        </div>

        <!-- 操作按钮 -->
        <div class="flex items-center gap-1 flex-shrink-0">
          <button
            v-if="props.message.action"
            @click="handleAction"
            class="text-xs px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded transition-colors"
          >
            {{ props.message.action.label }}
          </button>

          <button
            v-if="!isLoading"
            @click="$emit('close')"
            class="p-1 hover:bg-muted/50 rounded transition-colors"
            aria-label="关闭消息"
          >
            <X :size="14" class="text-muted-foreground hover:text-foreground" />
          </button>
        </div>
      </div>

      <!-- 进度条 (用于加载状态) -->
      <div v-if="isLoading" class="mt-3">
        <div class="w-full bg-muted/30 rounded-full h-1">
          <div class="bg-primary h-1 rounded-full animate-pulse" style="width: 100%" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Loader,
  X
} from 'lucide-vue-next'
import type { StatusMessage } from '@/services/StatusFeedbackService'

// Props
interface Props {
  message: StatusMessage
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
}>()

// 计算属性
const iconComponent = computed(() => {
  switch (props.message.type) {
    case 'success': return CheckCircle
    case 'error': return XCircle
    case 'warning': return AlertTriangle
    case 'info': return Info
    case 'loading': return Loader
    default: return Info
  }
})

const cardClasses = computed(() => {
  const baseClasses = 'bg-background/95 border-border'

  switch (props.message.type) {
    case 'success':
      return `${baseClasses} border-green-200 bg-green-50/95 dark:bg-green-950/50 dark:border-green-800`
    case 'error':
      return `${baseClasses} border-red-200 bg-red-50/95 dark:bg-red-950/50 dark:border-red-800`
    case 'warning':
      return `${baseClasses} border-yellow-200 bg-yellow-50/95 dark:bg-yellow-950/50 dark:border-yellow-800`
    case 'info':
      return `${baseClasses} border-blue-200 bg-blue-50/95 dark:bg-blue-950/50 dark:border-blue-800`
    case 'loading':
      return `${baseClasses} border-blue-200 bg-blue-50/95 dark:bg-blue-950/50 dark:border-blue-800`
    default:
      return baseClasses
  }
})

const iconClasses = computed(() => {
  switch (props.message.type) {
    case 'success': return 'text-green-600 dark:text-green-400'
    case 'error': return 'text-red-600 dark:text-red-400'
    case 'warning': return 'text-yellow-600 dark:text-yellow-400'
    case 'info': return 'text-blue-600 dark:text-blue-400'
    case 'loading': return 'text-blue-600 dark:text-blue-400 animate-spin'
    default: return 'text-muted-foreground'
  }
})

const isImportant = computed(() => {
  return props.message.type === 'error' || props.message.type === 'warning'
})

const isLoading = computed(() => {
  return props.message.type === 'loading'
})

// 方法
const handleAction = () => {
  if (props.message.action) {
    props.message.action.handler()
    emit('close') // 执行操作后关闭消息
  }
}
</script>

<style scoped>
/* 悬停效果 */
.status-message-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

/* 动画增强 */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.status-message-card {
  animation: slideIn 0.3s ease-out;
}

/* 响应式调整 */
@media (max-width: 767px) {
  .status-message-card {
    margin: 0 1rem;
    max-width: calc(100vw - 2rem);
  }
}
</style>
