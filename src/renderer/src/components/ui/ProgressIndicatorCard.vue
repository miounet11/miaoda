<template>
  <div
    class="progress-indicator-card bg-background/95 backdrop-blur-sm border border-border rounded-lg p-4 shadow-lg"
    role="progressbar"
    :aria-valuenow="progress.progress"
    :aria-valuemin="0"
    :aria-valuemax="100"
    :aria-label="progress.title"
  >
    <div class="flex items-center justify-between mb-2">
      <h4 class="font-medium text-sm text-foreground">{{ progress.title }}</h4>

      <div class="flex items-center gap-2">
        <span v-if="!progress.indeterminate" class="text-xs text-muted-foreground">
          {{ progress.progress }}%
        </span>

        <button
          v-if="progress.cancellable"
          @click="$emit('cancel')"
          class="p-1 hover:bg-muted/50 rounded transition-colors"
          aria-label="取消操作"
        >
          <X :size="14" class="text-muted-foreground hover:text-foreground" />
        </button>
      </div>
    </div>

    <p v-if="progress.message" class="text-xs text-muted-foreground mb-3">
      {{ progress.message }}
    </p>

    <!-- 进度条 -->
    <div class="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
      <div
        v-if="!progress.indeterminate"
        class="bg-primary h-full rounded-full transition-all duration-300 ease-out"
        :style="{ width: `${progress.progress}%` }"
      />

      <div
        v-else
        class="bg-primary h-full rounded-full animate-pulse"
        style="width: 100%"
      />
    </div>

    <!-- 预估时间 (可选) -->
    <div v-if="estimatedTime" class="mt-2 text-xs text-muted-foreground text-right">
      预计还需 {{ estimatedTime }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { X } from 'lucide-vue-next'
import type { ProgressIndicator } from '@/services/StatusFeedbackService'

// Props
interface Props {
  progress: ProgressIndicator
}

defineProps<Props>()

// Emits
const emit = defineEmits<{
  cancel: []
}>()

// 计算属性
const estimatedTime = computed(() => {
  // 基于进度和时间戳估算剩余时间
  if (!progress.progress || progress.indeterminate) return null

  const elapsed = Date.now() - progress.timestamp
  const remaining = (elapsed / progress.progress) * (100 - progress.progress)

  if (remaining < 1000) return '不到1秒'
  if (remaining < 60000) return `${Math.ceil(remaining / 1000)}秒`
  if (remaining < 3600000) return `${Math.ceil(remaining / 60000)}分钟`

  return `${Math.ceil(remaining / 3600000)}小时`
})
</script>

<style scoped>
/* 进度条动画 */
.progress-indicator-card {
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 悬停效果 */
.progress-indicator-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

/* 响应式调整 */
@media (max-width: 767px) {
  .progress-indicator-card {
    margin: 0 1rem;
    max-width: calc(100vw - 2rem);
  }
}
</style>
