<template>
  <Teleport to="body">
    <!-- 全局状态消息 -->
    <TransitionGroup
      name="status-message"
      tag="div"
      class="fixed top-4 right-4 z-50 space-y-2 max-w-sm"
    >
      <StatusMessageCard
        v-for="message in statusMessages"
        :key="message.id"
        :message="message"
        @close="removeMessage(message.id)"
      />
    </TransitionGroup>

    <!-- 全局进度指示器 -->
    <TransitionGroup
      name="progress-indicator"
      tag="div"
      class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 space-y-2 max-w-md"
    >
      <ProgressIndicatorCard
        v-for="progress in progressIndicators"
        :key="progress.id"
        :progress="progress"
        @cancel="cancelProgress(progress.id)"
      />
    </TransitionGroup>

    <!-- 全局加载遮罩 -->
    <Transition name="fade">
      <div
        v-if="isGlobalLoading"
        class="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 flex items-center justify-center"
      >
        <div class="bg-background border border-border rounded-lg p-6 shadow-lg">
          <div class="flex items-center gap-3">
            <div
              class="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"
            />
            <div>
              <div class="font-medium text-foreground">处理中...</div>
              <div class="text-sm text-muted-foreground">请稍候</div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 全局消息区域 (用于屏幕阅读器) -->
    <div id="global-status-region" class="sr-only" aria-live="polite" aria-atomic="true">
      {{ globalAriaMessage }}
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { statusFeedback } from '@/services/StatusFeedbackService'
import StatusMessageCard from './StatusMessageCard.vue'
import ProgressIndicatorCard from './ProgressIndicatorCard.vue'

// 计算属性
const statusMessages = computed(() => statusFeedback.state.messages)
const progressIndicators = computed(() => statusFeedback.state.progressIndicators)
const isGlobalLoading = computed(() => statusFeedback.state.isLoading)

// 全局无障碍消息
const globalAriaMessage = computed(() => {
  const latestMessage = statusMessages.value[statusMessages.value.length - 1]
  return latestMessage
    ? `${latestMessage.title}${latestMessage.message ? ': ' + latestMessage.message : ''}`
    : ''
})

// 方法
const removeMessage = (id: string) => {
  statusFeedback.removeMessage(id)
}

const cancelProgress = (id: string) => {
  statusFeedback.removeProgress(id)
}

// 监听消息变化，为屏幕阅读器提供反馈
watch(
  statusMessages,
  (newMessages, oldMessages) => {
    if (newMessages.length > oldMessages.length) {
      // 新消息到达
      const newMessage = newMessages[newMessages.length - 1]
      announceToScreenReader(newMessage)
    }
  },
  { deep: true }
)

const announceToScreenReader = (message: any) => {
  // 使用 Web Speech API 为屏幕阅读器提供语音反馈 (可选)
  if ('speechSynthesis' in window && message.type === 'error') {
    const utterance = new SpeechSynthesisUtterance(`${message.title}: ${message.message || ''}`)
    utterance.rate = 1.2
    utterance.pitch = 1
    speechSynthesis.speak(utterance)
  }
}
</script>

<style scoped>
/* 状态消息动画 */
.status-message-enter-active,
.status-message-leave-active {
  transition: all 0.3s ease-out;
}

.status-message-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.status-message-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.status-message-move {
  transition: all 0.3s ease-out;
}

/* 进度指示器动画 */
.progress-indicator-enter-active,
.progress-indicator-leave-active {
  transition: all 0.3s ease-out;
}

.progress-indicator-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.9);
}

.progress-indicator-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.9);
}

/* 全局加载动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式调整 */
@media (max-width: 767px) {
  .fixed.top-4.right-4 {
    top: 1rem;
    right: 1rem;
    left: 1rem;
    max-width: none;
  }

  .fixed.top-4.left-1\/2 {
    top: 1rem;
    left: 1rem;
    right: 1rem;
    transform: none;
    max-width: none;
  }
}
</style>
