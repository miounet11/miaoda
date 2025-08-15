<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
      <!-- 头部 -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
          分享对话
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
      <div class="p-6 space-y-6 max-h-96 overflow-y-auto">
        <!-- 分享设置 -->
        <div class="space-y-4">
          <div class="flex items-center space-x-3">
            <input
              id="public-share"
              v-model="shareSettings.isPublic"
              type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            >
            <label for="public-share" class="text-sm font-medium text-gray-700 dark:text-gray-300">
              公开分享
            </label>
          </div>

          <div class="flex items-center space-x-3">
            <input
              id="allow-anonymous"
              v-model="shareSettings.allowAnonymous"
              type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            >
            <label for="allow-anonymous" class="text-sm font-medium text-gray-700 dark:text-gray-300">
              允许匿名访问
            </label>
          </div>

          <div class="flex items-center space-x-3">
            <input
              id="require-approval"
              v-model="shareSettings.requireApproval"
              type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            >
            <label for="require-approval" class="text-sm font-medium text-gray-700 dark:text-gray-300">
              需要审批
            </label>
          </div>
        </div>

        <!-- 过期时间 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            过期时间
          </label>
          <select
            v-model="expiryOption"
            class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="never">永不过期</option>
            <option value="1h">1小时</option>
            <option value="1d">1天</option>
            <option value="7d">7天</option>
            <option value="30d">30天</option>
            <option value="custom">自定义</option>
          </select>
          
          <div v-if="expiryOption === 'custom'" class="mt-2">
            <input
              v-model="customExpiryDate"
              type="datetime-local"
              class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
          </div>
        </div>

        <!-- 最大参与者数 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            最大参与者数量
          </label>
          <input
            v-model.number="shareSettings.maxParticipants"
            type="number"
            min="1"
            max="100"
            placeholder="无限制"
            class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
        </div>

        <!-- 加密选项 -->
        <div class="space-y-4">
          <div class="flex items-center space-x-3">
            <input
              id="enable-encryption"
              v-model="encryptionSettings.enabled"
              type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            >
            <label for="enable-encryption" class="text-sm font-medium text-gray-700 dark:text-gray-300">
              启用端到端加密
            </label>
          </div>
          
          <div v-if="encryptionSettings.enabled" class="pl-7 space-y-2">
            <p class="text-xs text-gray-500 dark:text-gray-400">
              启用加密后，只有拥有密钥的用户才能查看对话内容
            </p>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                加密算法
              </label>
              <select
                v-model="encryptionSettings.algorithm"
                class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="AES-256-GCM">AES-256-GCM</option>
                <option value="ChaCha20-Poly1305">ChaCha20-Poly1305</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 分享结果 -->
        <div v-if="shareResult" class="space-y-3">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            分享链接已生成
          </h3>
          
          <div class="space-y-2">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                分享链接
              </label>
              <div class="flex">
                <input
                  :value="shareResult.shareUrl"
                  readonly
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                <button
                  @click="copyToClipboard(shareResult.shareUrl!)"
                  class="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  复制
                </button>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                分享代码
              </label>
              <div class="flex">
                <input
                  :value="shareResult.shareCode"
                  readonly
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                >
                <button
                  @click="copyToClipboard(shareResult.shareCode!)"
                  class="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  复制
                </button>
              </div>
            </div>
          </div>

          <!-- QR 码 -->
          <div class="flex justify-center">
            <div class="p-4 bg-white rounded-lg">
              <div
                ref="qrCodeContainer"
                class="w-32 h-32 flex items-center justify-center bg-gray-100 rounded"
              >
                QR Code
              </div>
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
          v-if="!shareResult"
          @click="createShare"
          :disabled="loading"
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
          {{ loading ? '创建中...' : '创建分享' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useCollaborationStore } from '../../stores/collaboration'
import type { ShareSettings, EncryptionSettings, CreateShareResponse } from '../../types/collaboration'

interface Props {
  chatId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  shared: [result: CreateShareResponse]
}>()

const collaborationStore = useCollaborationStore()

// 响应式状态
const loading = ref(false)
const expiryOption = ref('never')
const customExpiryDate = ref('')
const shareResult = ref<CreateShareResponse | null>(null)

const shareSettings = reactive<ShareSettings>({
  isPublic: false,
  allowAnonymous: true,
  requireApproval: false,
  allowInvites: true,
  accessCount: 0
})

const encryptionSettings = reactive<EncryptionSettings>({
  enabled: false,
  algorithm: 'AES-256-GCM',
  keyId: ''
})

// 计算属性
const expiresAt = computed(() => {
  const now = new Date()
  switch (expiryOption.value) {
    case '1h':
      return new Date(now.getTime() + 60 * 60 * 1000)
    case '1d':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000)
    case '7d':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    case '30d':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    case 'custom':
      return customExpiryDate.value ? new Date(customExpiryDate.value) : undefined
    default:
      return undefined
  }
})

// 方法
async function createShare() {
  loading.value = true
  try {
    const result = await collaborationStore.createShare({
      chatId: props.chatId,
      settings: {
        ...shareSettings,
        expiresAt: expiresAt.value
      },
      encryption: encryptionSettings.enabled ? encryptionSettings : undefined
    })

    if (result.success) {
      shareResult.value = result
      emit('shared', result)
    } else {
      console.error('Failed to create share:', result.error)
      // TODO: 显示错误消息
    }
  } catch (error) {
    console.error('Error creating share:', error)
    // TODO: 显示错误消息
  } finally {
    loading.value = false
  }
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    // TODO: 显示复制成功提示
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
  }
}

// 生命周期
onMounted(() => {
  // 初始化协作功能（如果还没有初始化）
  if (!collaborationStore.isInitialized) {
    collaborationStore.initialize()
  }
})
</script>

<style scoped>
/* 自定义样式 */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>