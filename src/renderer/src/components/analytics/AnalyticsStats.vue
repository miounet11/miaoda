<template>
  <div class="analytics-stats">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <!-- Total Chats -->
      <div class="stat-card">
        <div class="stat-icon bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.418 8-9.899 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.418-8 9.899-8s9.901 3.582 9.901 8z"></path>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ formatNumber(totalChats) }}</div>
          <div class="stat-label">Total Chats</div>
          <div class="stat-change" v-if="summary">
            <span class="text-xs text-gray-500">
              {{ summary.activeToday }} today
            </span>
          </div>
        </div>
      </div>

      <!-- Total Messages -->
      <div class="stat-card">
        <div class="stat-icon bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ formatNumber(totalMessages) }}</div>
          <div class="stat-label">Total Messages</div>
          <div class="stat-change" v-if="averagePerDay !== null">
            <span class="text-xs text-gray-500">
              {{ formatNumber(averagePerDay) }}/day avg
            </span>
          </div>
        </div>
      </div>

      <!-- Average Messages per Chat -->
      <div class="stat-card">
        <div class="stat-icon bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ averageMessagesPerChat.toFixed(1) }}</div>
          <div class="stat-label">Avg Messages/Chat</div>
          <div class="stat-change" v-if="weeklyTrend">
            <span 
              class="text-xs inline-flex items-center gap-1"
              :class="getTrendColor(weeklyTrend)"
            >
              {{ getTrendIcon(weeklyTrend) }} {{ weeklyTrend }}
            </span>
          </div>
        </div>
      </div>

      <!-- Active Chats -->
      <div class="stat-card">
        <div class="stat-icon bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ formatNumber(activeChats) }}</div>
          <div class="stat-label">Active Chats</div>
          <div class="stat-change">
            <span class="text-xs text-gray-500">
              {{ formatNumber(archivedChats) }} archived
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Performance Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" v-if="performance">
      <!-- Success Rate -->
      <div class="performance-card">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">Success Rate</h4>
          <div class="flex items-center text-green-600">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span class="font-semibold">{{ performance.successRate.toFixed(1) }}%</span>
          </div>
        </div>
        <div class="mt-2">
          <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div 
              class="bg-green-500 h-2 rounded-full transition-all duration-500"
              :style="{ width: `${performance.successRate}%` }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Error Rate -->
      <div class="performance-card">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">Error Rate</h4>
          <div class="flex items-center text-red-600">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            <span class="font-semibold">{{ performance.errorRate.toFixed(1) }}%</span>
          </div>
        </div>
        <div class="mt-2">
          <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div 
              class="bg-red-500 h-2 rounded-full transition-all duration-500"
              :style="{ width: `${Math.max(performance.errorRate, 1)}%` }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Peak Usage Time -->
      <div class="performance-card">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">Peak Usage</h4>
          <div class="flex items-center text-blue-600">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span class="font-semibold">{{ peakUsageTime }}</span>
          </div>
        </div>
        <div class="mt-2 text-xs text-gray-500">
          Most active hour of the day
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { 
  ChatAnalytics, 
  MessageAnalytics, 
  UsageAnalytics, 
  PerformanceAnalytics 
} from '../../types'

interface Props {
  chatData: ChatAnalytics | null
  messageData: MessageAnalytics | null
  usageData: UsageAnalytics | null
  performanceData: PerformanceAnalytics | null
  summary?: {
    totalChats: number
    totalMessages: number
    activeToday: number
    averagePerDay: number
  } | null
}

const props = defineProps<Props>()

// Computed properties
const totalChats = computed(() => props.chatData?.totalChats || 0)
const totalMessages = computed(() => props.chatData?.totalMessages || 0)
const averageMessagesPerChat = computed(() => props.chatData?.averageMessagesPerChat || 0)
const activeChats = computed(() => props.chatData?.activeChats || 0)
const archivedChats = computed(() => props.chatData?.archivedChats || 0)
const averagePerDay = computed(() => props.summary?.averagePerDay || 0)
const weeklyTrend = computed(() => props.usageData?.weeklyTrend || null)
const peakUsageTime = computed(() => props.usageData?.peakUsageTime || 'N/A')
const performance = computed(() => props.performanceData)

// Utility functions
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

function getTrendIcon(trend: string): string {
  switch (trend) {
    case 'up': return '↗️'
    case 'down': return '↘️'
    case 'stable': return '➡️'
    default: return '➡️'
  }
}

function getTrendColor(trend: string): string {
  switch (trend) {
    case 'up': return 'text-green-600'
    case 'down': return 'text-red-600'
    case 'stable': return 'text-gray-600'
    default: return 'text-gray-600'
  }
}
</script>

<style scoped>
.analytics-stats {
  @apply space-y-6;
}

.stat-card {
  @apply bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200;
}

.stat-icon {
  @apply w-12 h-12 rounded-full flex items-center justify-center mb-3;
}

.stat-content {
  @apply space-y-1;
}

.stat-value {
  @apply text-2xl font-bold text-gray-900 dark:text-gray-100;
}

.stat-label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.stat-change {
  @apply text-xs;
}

.performance-card {
  @apply bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700;
}
</style>