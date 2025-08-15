<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
      <!-- 头部 -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
          加入协作对话
        </h2>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- 内容区 -->
      <div class="p-6 space-y-6">
        <!-- Tab 切换 -->
        <div class="flex border-b border-gray-200 dark:border-gray-700">
          <button
            @click="activeTab = 'link'"
            class="flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors"
            :class="activeTab === 'link' 
              ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
          >
            通过链接加入
          </button>
          <button
            @click="activeTab = 'code'"
            class="flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors"
            :class="activeTab === 'code' 
              ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
          >
            通过代码加入
          </button>
        </div>

        <!-- 链接输入 -->
        <div v-if="activeTab === 'link'" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              分享链接
            </label>
            <input
              v-model="shareUrl"
              type="url"
              placeholder="https://example.com/share/..."
              class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
          </div>
        </div>

        <!-- 代码输入 -->
        <div v-if="activeTab === 'code'" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              分享代码
            </label>
            <input
              v-model="shareCode"
              type="text"
              placeholder="输入8位分享代码"
              maxlength="8"
              class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white font-mono text-center text-lg tracking-wider uppercase"
              @input="shareCode = shareCode.toUpperCase()"
            >
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              请输入邀请方提供的8位字母数字代码
            </p>
          </div>
        </div>

        <!-- 用户信息 -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              显示名称
            </label>
            <input
              v-model="userName"
              type="text"
              placeholder="输入您的名称"
              class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              邮箱（可选）
            </label>
            <input
              v-model="userEmail"
              type="email"
              placeholder="your.email@example.com"
              class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
          </div>
        </div>

        <!-- 错误信息 -->
        <div v-if="errorMessage" class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <div class="flex">
            <svg class="w-5 h-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="ml-3">
              <p class="text-sm text-red-800 dark:text-red-200">{{ errorMessage }}</p>
            </div>
          </div>
        </div>

        <!-- 成功信息 -->
        <div v-if="successMessage" class="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <div class="flex">
            <svg class="w-5 h-5 text-green-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <div class="ml-3">
              <p class="text-sm text-green-800 dark:text-green-200">{{ successMessage }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="flex items-center justify-end space-x-3 px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
        <button
          @click="$emit('close')"
          class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          取消
        </button>
        
        <button
          @click="joinShare"
          :disabled="!canJoin || loading"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          <svg
            v-if="loading"
            class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {{ loading ? '加入中...' : '加入对话' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCollaborationStore } from '../../stores/collaboration'
import type { JoinShareResponse } from '../../types/collaboration'

const emit = defineEmits<{
  close: []
  joined: [result: JoinShareResponse]
}>()

const collaborationStore = useCollaborationStore()

// 响应式状态
const activeTab = ref<'link' | 'code'>('link')
const shareUrl = ref('')
const shareCode = ref('')
const userName = ref('')
const userEmail = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// 计算属性
const canJoin = computed(() => {
  const hasIdentifier = (activeTab.value === 'link' && shareUrl.value.trim()) ||
                       (activeTab.value === 'code' && shareCode.value.length === 8)
  const hasName = userName.value.trim().length > 0
  return hasIdentifier && hasName
})

// 监听器
watch([shareUrl, shareCode, userName], () => {
  errorMessage.value = ''
  successMessage.value = ''
})

// 方法
async function joinShare() {
  if (!canJoin.value) return

  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const result = await collaborationStore.joinShare({
      shareUrl: activeTab.value === 'link' ? shareUrl.value : undefined,
      shareCode: activeTab.value === 'code' ? shareCode.value : undefined,
      userInfo: {
        name: userName.value.trim(),
        email: userEmail.value.trim() || undefined
      }
    })

    if (result.success) {
      successMessage.value = '成功加入协作对话！'
      setTimeout(() => {
        emit('joined', result)
        emit('close')
      }, 1000)
    } else {
      errorMessage.value = result.error || '加入失败，请检查输入信息'
    }
  } catch (error) {
    console.error('Error joining share:', error)
    errorMessage.value = '网络错误，请稍后重试'
  } finally {
    loading.value = false
  }
}

function extractShareCodeFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    const shareIndex = pathParts.indexOf('share')
    
    if (shareIndex !== -1 && shareIndex < pathParts.length - 1) {
      return pathParts[shareIndex + 1]
    }
    return null
  } catch {
    return null
  }
}

// 监听URL变化，自动提取分享代码
watch(shareUrl, (newUrl) => {
  if (newUrl && activeTab.value === 'link') {
    const extractedCode = extractShareCodeFromUrl(newUrl)
    if (extractedCode && extractedCode.length === 8) {
      // 可以选择性地切换到代码模式
      // activeTab.value = 'code'
      // shareCode.value = extractedCode.toUpperCase()
    }
  }
})
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>