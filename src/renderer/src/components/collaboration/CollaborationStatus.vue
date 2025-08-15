<template>
  <div class="flex items-center space-x-4">
    <!-- 连接状态指示器 -->
    <div class="flex items-center space-x-2">
      <div
        class="w-2 h-2 rounded-full transition-colors duration-300"
        :class="connectionStatusClass"
      />
      <span class="text-xs text-gray-600 dark:text-gray-400">
        {{ connectionStatusText }}
      </span>
    </div>

    <!-- 延迟显示 -->
    <div v-if="isConnected && latency > 0" class="flex items-center space-x-1">
      <svg class="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      <span class="text-xs text-gray-500">
        {{ latency }}ms
      </span>
    </div>

    <!-- 在线用户头像 -->
    <div v-if="participants.length > 0" class="flex items-center space-x-1">
      <div class="flex -space-x-2">
        <div
          v-for="(participant, index) in displayParticipants"
          :key="participant.id"
          class="relative"
          :title="participant.name"
        >
          <div
            class="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-medium"
            :class="getUserStatusClass(participant.status)"
            :style="{ backgroundColor: getUserColor(participant.id) }"
          >
            {{ participant.name.charAt(0).toUpperCase() }}
          </div>
          
          <!-- 状态指示器 -->
          <div
            class="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-gray-800"
            :class="getStatusIndicatorClass(participant.status)"
          />
        </div>
        
        <!-- 更多用户指示器 -->
        <div
          v-if="participants.length > maxDisplayUsers"
          class="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300"
          :title="`+${participants.length - maxDisplayUsers} more`"
        >
          +{{ participants.length - maxDisplayUsers }}
        </div>
      </div>

      <!-- 参与者总数 -->
      <span class="text-xs text-gray-500 ml-2">
        {{ participants.length }}人在线
      </span>
    </div>

    <!-- 同步状态 -->
    <div v-if="syncState" class="flex items-center space-x-1">
      <svg
        v-if="syncState.isSyncing"
        class="w-3 h-3 text-blue-500 animate-spin"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      
      <span class="text-xs text-gray-500">
        {{ syncStatusText }}
      </span>
    </div>

    <!-- 冲突警告 -->
    <div v-if="activeConflicts.length > 0" class="flex items-center space-x-1">
      <svg class="w-3 h-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <span class="text-xs text-orange-600 dark:text-orange-400">
        {{ activeConflicts.length }}个冲突
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCollaborationStore } from '../../stores/collaboration'

const collaborationStore = useCollaborationStore()

// 属性
const maxDisplayUsers = 3

// 计算属性
const isConnected = computed(() => collaborationStore.isConnected)
const isReconnecting = computed(() => collaborationStore.isReconnecting)
const latency = computed(() => collaborationStore.connectionLatency)
const participants = computed(() => collaborationStore.participants)
const syncState = computed(() => {
  const currentShareId = collaborationStore.currentShareId
  return currentShareId ? collaborationStore.syncStates.get(currentShareId) : null
})
const activeConflicts = computed(() => collaborationStore.activeConflicts)

const displayParticipants = computed(() => 
  participants.value.slice(0, maxDisplayUsers)
)

const connectionStatusClass = computed(() => {
  if (isReconnecting.value) {
    return 'bg-yellow-500 animate-pulse'
  } else if (isConnected.value) {
    return 'bg-green-500'
  } else {
    return 'bg-red-500'
  }
})

const connectionStatusText = computed(() => {
  if (isReconnecting.value) {
    return '重连中...'
  } else if (isConnected.value) {
    return '已连接'
  } else {
    return '未连接'
  }
})

const syncStatusText = computed(() => {
  if (!syncState.value) return ''
  
  if (syncState.value.isSyncing) {
    return '同步中...'
  } else if (syncState.value.pendingOperations.length > 0) {
    return `${syncState.value.pendingOperations.length}个待同步`
  } else {
    return '已同步'
  }
})

// 方法
function getUserStatusClass(status: string): string {
  switch (status) {
    case 'online':
      return 'text-white'
    case 'away':
      return 'text-gray-100'
    case 'busy':
      return 'text-gray-200'
    default:
      return 'text-gray-300'
  }
}

function getStatusIndicatorClass(status: string): string {
  switch (status) {
    case 'online':
      return 'bg-green-500'
    case 'away':
      return 'bg-yellow-500'
    case 'busy':
      return 'bg-red-500'
    default:
      return 'bg-gray-400'
  }
}

function getUserColor(userId: string): string {
  // 基于用户ID生成颜色
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#06B6D4', '#F97316', '#84CC16',
    '#EC4899', '#6366F1', '#14B8A6', '#F59E0B'
  ]
  
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}
</script>

<style scoped>
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>