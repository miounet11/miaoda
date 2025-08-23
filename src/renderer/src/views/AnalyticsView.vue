<template>
  <div class="analytics-view">
    <!-- Header -->
    <div class="analytics-header">
      <div class="flex items-center justify-between">
        <div class="flex items-start gap-4">
          <!-- Back Button -->
          <button
            @click="$router.push('/')"
            class="mt-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Back to Chat"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics Dashboard</h1>
            <p class="text-gray-600 dark:text-gray-400 mt-1">
              Comprehensive insights into your chat activity and usage patterns
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <!-- Time Range Selector -->
          <select
            v-model="selectedTimeRange"
            @change="handleTimeRangeChange"
            class="time-range-selector"
          >
            <option v-for="option in timeRangeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>

          <!-- Refresh Button -->
          <button
            @click="refreshAnalytics"
            :disabled="loading"
            class="refresh-btn"
            title="Refresh Analytics"
          >
            <svg
              class="w-5 h-5"
              :class="{ 'animate-spin': loading }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>

          <!-- Export Button -->
          <button
            @click="showExportDialog = true"
            :disabled="loading || !isLoaded"
            class="export-btn"
            title="Export Analytics"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export
          </button>
        </div>
      </div>

      <!-- Last Updated -->
      <div class="mt-4 text-sm text-gray-500" v-if="lastUpdated">
        Last updated: {{ formatDateTime(lastUpdated) }}
        <span v-if="isStale" class="text-orange-500 ml-2"> (Data may be outdated) </span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !isLoaded" class="loading-container">
      <div class="loading-spinner">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        <p class="mt-2 text-gray-600 dark:text-gray-400">Loading analytics...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError && !isLoaded" class="error-container">
      <div class="error-message">
        <svg
          class="w-8 h-8 text-red-500 mb-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
          Failed to load analytics
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          {{ error }}
        </p>
        <button
          @click="refreshAnalytics"
          class="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else-if="isLoaded" class="analytics-content">
      <!-- Stats Overview -->
      <AnalyticsStats
        :chat-data="chatAnalytics"
        :message-data="messageAnalytics"
        :usage-data="usageAnalytics"
        :performance-data="performanceAnalytics"
        :summary="summary"
      />

      <!-- Charts Grid -->
      <div class="charts-grid">
        <!-- Usage Trends -->
        <div class="chart-container full-width">
          <UsageChart
            :data="usageAnalytics"
            title="Usage Trends"
            height="400px"
            :theme="theme"
            :loading="loading"
          />
        </div>

        <!-- Model Usage -->
        <div class="chart-container">
          <ModelUsageChart
            :data="modelAnalytics"
            :performance-data="performanceAnalytics"
            height="350px"
            :theme="theme"
            :loading="loading"
          />
        </div>

        <!-- Keyword Cloud -->
        <div class="chart-container">
          <KeywordCloud :data="contentAnalytics" height="350px" :theme="theme" :loading="loading" />
        </div>

        <!-- Message Length Distribution -->
        <div class="chart-container">
          <BaseChart
            :option="messageLengthChartOption"
            height="300px"
            :theme="theme"
            :loading="loading"
            title="Message Length Distribution"
          />
        </div>

        <!-- Error Analysis -->
        <div class="chart-container" v-if="performanceAnalytics?.errorsByType?.length">
          <BaseChart
            :option="errorAnalysisChartOption"
            height="300px"
            :theme="theme"
            :loading="loading"
            title="Error Analysis"
          />
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-message">
        <svg
          class="w-16 h-16 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <h3 class="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">No Analytics Data</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Start chatting to see your analytics dashboard come to life.
        </p>
        <button
          @click="refreshAnalytics"
          class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Check for Data
        </button>
      </div>
    </div>

    <!-- Export Dialog -->
    <ExportDialog
      v-if="showExportDialog"
      :time-range="selectedTimeRange"
      @export="handleExport"
      @close="showExportDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAnalyticsStore } from '../stores/analytics'
import { useUIStore } from '../stores/ui'
import type { TimeRange, AnalyticsExportConfig } from '../types'

// Components
import AnalyticsStats from '../components/analytics/AnalyticsStats.vue'
import UsageChart from '../components/analytics/UsageChart.vue'
import ModelUsageChart from '../components/analytics/ModelUsageChart.vue'
import KeywordCloud from '../components/analytics/KeywordCloud.vue'
import BaseChart from '../components/analytics/BaseChart.vue'
import ExportDialog from '../components/analytics/ExportDialog.vue'

// Stores
const analyticsStore = useAnalyticsStore()
const uiStore = useUIStore()

// State
const selectedTimeRange = ref<TimeRange>('30d')
const showExportDialog = ref(false)

// Computed
const {
  loading,
  error,
  hasError,
  isLoaded,
  isStale,
  lastUpdated,
  timeRangeOptions,
  chatAnalytics,
  messageAnalytics,
  usageAnalytics,
  contentAnalytics,
  performanceAnalytics,
  modelAnalytics,
  summary
} = analyticsStore

const theme = computed(() => (uiStore.theme === 'dark' ? 'dark' : 'light'))

// Chart options
const messageLengthChartOption = computed(() => {
  if (!contentAnalytics?.messageLengthDistribution) return {}

  return {
    title: {
      text: 'Message Length Distribution',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 'normal' }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} messages ({d}%)'
    },
    series: [
      {
        type: 'pie',
        radius: ['30%', '70%'],
        center: ['50%', '55%'],
        data: contentAnalytics.messageLengthDistribution.map(item => ({
          name: item.range,
          value: item.count
        })),
        itemStyle: {
          borderRadius: 5,
          borderColor: '#fff',
          borderWidth: 2
        }
      }
    ]
  }
})

const errorAnalysisChartOption = computed(() => {
  if (!performanceAnalytics?.errorsByType?.length) return {}

  return {
    title: {
      text: 'Error Types Distribution',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 'normal' }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    xAxis: {
      type: 'category',
      data: performanceAnalytics.errorsByType.map(e => e.type),
      axisLabel: {
        rotate: 45,
        fontSize: 10
      }
    },
    yAxis: {
      type: 'value',
      name: 'Count'
    },
    series: [
      {
        type: 'bar',
        data: performanceAnalytics.errorsByType.map(e => e.count),
        itemStyle: {
          color: '#EF4444',
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  }
})

// Methods
async function refreshAnalytics() {
  await analyticsStore.generateAnalytics({
    timeRange: selectedTimeRange.value,
    includeArchived: false
  })
  await analyticsStore.loadSummary(selectedTimeRange.value)
}

async function handleTimeRangeChange() {
  await analyticsStore.updateTimeRange(selectedTimeRange.value)
  await analyticsStore.loadSummary(selectedTimeRange.value)
}

async function handleExport(config: AnalyticsExportConfig) {
  try {
    await analyticsStore.exportAnalytics(config)
    showExportDialog.value = false
  } catch (error) {
    console.error('Export failed:', error)
  }
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}

// Lifecycle
onMounted(async () => {
  if (!isLoaded.value || isStale.value) {
    await refreshAnalytics()
  }
})

// Watch for time range changes in store
watch(
  () => analyticsStore.currentFilter.timeRange,
  newRange => {
    selectedTimeRange.value = newRange
  }
)
</script>

<style scoped>
.analytics-view {
  @apply min-h-screen bg-gray-50 dark:bg-gray-900 p-6;
}

.analytics-header {
  @apply bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-6 border border-gray-200 dark:border-gray-700;
}

.time-range-selector {
  @apply px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.refresh-btn,
.export-btn {
  @apply px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2;
}

.loading-container,
.error-container,
.empty-state {
  @apply flex items-center justify-center min-h-96;
}

.loading-spinner,
.error-message,
.empty-message {
  @apply text-center;
}

.analytics-content {
  @apply space-y-6;
}

.charts-grid {
  @apply grid grid-cols-1 lg:grid-cols-2 gap-6;
}

.chart-container {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700;
}

.chart-container.full-width {
  @apply lg:col-span-2;
}
</style>
