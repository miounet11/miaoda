<template>
  <div class="app-container h-screen flex flex-col bg-white">
    <!-- macOS draggable title bar area -->
    <div
      v-if="isMac"
      class="titlebar-drag-region fixed top-0 left-0 right-0 h-8 z-50 pointer-events-none"
    >
      <div class="w-full h-full" style="-webkit-app-region: drag" />
      <!-- Window controls area (no-drag) -->
      <div
        class="window-controls-area absolute top-0 left-0 w-20 h-8 pointer-events-auto"
        style="-webkit-app-region: no-drag"
      />
    </div>

    <!-- Error Fallback -->
    <ErrorFallback
      v-if="hasCriticalError"
      :error="criticalErrorMessage"
      :details="criticalErrorDetails"
    />

    <!-- Normal App Content -->
    <template v-else>
      <!-- Simple Single-Window Layout -->
      <div class="flex-1 overflow-hidden">
        <!-- Title bar for Windows/Linux -->
        <div
          v-if="!isMac"
          class="title-bar h-12 bg-white border-b border-gray-200 flex items-center px-6"
        >
          <span class="text-lg font-semibold text-gray-800">MiaoDa Chat</span>
          <div class="ml-auto text-sm text-gray-500">免费AI对话平台</div>
        </div>

        <!-- Main content -->
        <div class="flex-1 overflow-hidden">
          <router-view />
        </div>
      </div>

      <!-- Global Loading Overlay -->
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-content">
          <Loader :size="32" class="animate-spin" />
          <p>{{ loadingMessage }}</p>
        </div>
      </div>

      <!-- Global Error Toast -->
      <ErrorToast v-if="globalError" :message="globalError" @close="clearGlobalError" />

      <!-- Toast Container -->
      <ToastContainer />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, onErrorCaptured } from 'vue'
import { useRouter } from 'vue-router'
import { Loader } from 'lucide-vue-next'
import ErrorFallback from '@renderer/src/components/ErrorFallback.vue'
import ErrorToast from '@renderer/src/components/error/ErrorToast.vue'
import ToastContainer from '@renderer/src/components/ui/ToastContainer.vue'
import { logger } from '@renderer/src/utils/Logger'

const router = useRouter()

// State - 简化状态管理
const isLoading = ref(false)
const loadingMessage = ref('')
const globalError = ref<string | null>(null)
const hasCriticalError = ref(false)
const criticalErrorMessage = ref('')
const criticalErrorDetails = ref('')

// Computed
const isMac = computed(() => navigator.platform.toLowerCase().includes('mac'))

// Methods
const initializeApplication = async () => {
  logger.info('Starting MiaoDa Chat v1.0', 'App')
  try {
    isLoading.value = true
    loadingMessage.value = '正在启动MiaoDa Chat...'

    // 简单的初始化逻辑
    await new Promise(resolve => setTimeout(resolve, 1000))

    logger.info('MiaoDa Chat启动成功', 'App')
  } catch (error) {
    logger.error('应用启动失败', 'App', error)
    globalError.value = '应用启动失败，请重试'
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

const clearGlobalError = () => {
  globalError.value = null
}

// Error handling
const handleGlobalError = (error: Error | string) => {
  const message = error instanceof Error ? error.message : error
  globalError.value = message
  logger.error('全局错误', 'App', message)

  // 3秒后自动清除错误
  setTimeout(() => {
    if (globalError.value === message) {
      globalError.value = null
    }
  }, 3000)
}

// Error handling
onErrorCaptured((error, instance, info) => {
  logger.error('捕获到错误', 'App', error)

  // 对于严重错误，显示错误回退界面
  if (error?.message?.includes('Cannot read') || error?.message?.includes('Cannot access')) {
    hasCriticalError.value = true
    criticalErrorMessage.value = error.message || '发生严重错误'
    criticalErrorDetails.value = error?.stack || ''
    return false // 阻止错误传播
  }

  // 对于其他错误，显示提示信息
  globalError.value = error?.message || '发生未知错误'
  return false
})

// Lifecycle
onMounted(async () => {
  try {
    await initializeApplication()

    // 设置全局错误处理
    window.addEventListener('error', event => {
      handleGlobalError(event.error || event.message)
    })

    window.addEventListener('unhandledrejection', event => {
      handleGlobalError(event.reason)
    })
  } catch (error) {
    logger.error('应用启动失败', 'App', error)
    handleGlobalError('应用启动失败')
  }
})

onUnmounted(() => {
  // 清理事件监听器
})
</script>

<style scoped>
/* MiaoDa Chat v1.0 简洁样式 */

/* 应用容器 */
.app-container {
  height: 100vh;
  background: white;
}

/* 标题栏样式 */
.title-bar {
  height: 48px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  padding: 0 24px;
}

/* 加载覆盖层 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-content {
  text-align: center;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 错误状态样式 */
.error-state {
  padding: 16px;
  border: 1px solid #ef4444;
  border-radius: 8px;
  background-color: #fef2f2;
  color: #dc2626;
  margin: 16px;
}

.error-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.error-message {
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 12px;
}

.error-actions {
  display: flex;
  gap: 8px;
}

/* 按钮样式 */
.btn-primary {
  padding: 8px 16px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #1d4ed8;
}

/* 无障碍支持 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
</style>
