import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import type { 
  AnalyticsData, 
  AnalyticsFilter, 
  TimeRange,
  AnalyticsExportConfig
} from '../types'
import { AnalyticsService } from '../services/analytics/AnalyticsService'

export const useAnalyticsStore = defineStore('analytics', () => {
  // State
  const analyticsData = ref<AnalyticsData | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<Date | null>(null)
  const currentFilter = ref<AnalyticsFilter>({
    timeRange: '30d',
    includeArchived: false
  })
  
  // Summary data for quick access
  const summary = ref<{
    totalChats: number
    totalMessages: number
    activeToday: number
    averagePerDay: number
  } | null>(null)

  // Services
  const analyticsService = new AnalyticsService()

  // Computed
  const isLoaded = computed(() => analyticsData.value !== null)
  const hasError = computed(() => error.value !== null)
  const isStale = computed(() => {
    if (!lastUpdated.value) return true
    const staleThreshold = 5 * 60 * 1000 // 5 minutes
    return Date.now() - lastUpdated.value.getTime() > staleThreshold
  })

  // Time range options
  const timeRangeOptions = computed(() => analyticsService.getTimeRangeOptions())
  const exportFormatOptions = computed(() => analyticsService.getExportFormatOptions())

  // Chart data computed properties
  const chartData = computed(() => {
    if (!analyticsData.value) return null

    return {
      usage: {
        dailyChats: analyticsData.value.usage.chatsByDay,
        dailyMessages: analyticsData.value.usage.messagesByDay,
        activeHours: analyticsData.value.usage.activeHours
      },
      content: {
        keywords: analyticsData.value.content.topKeywords,
        messageLengthDistribution: analyticsData.value.content.messageLengthDistribution
      },
      models: {
        usage: analyticsData.value.model.modelUsage
      },
      performance: {
        errorsByType: analyticsData.value.performance.errorsByType
      }
    }
  })

  // Actions
  async function generateAnalytics(filter?: Partial<AnalyticsFilter>) {
    loading.value = true
    error.value = null

    try {
      const finalFilter = { ...currentFilter.value, ...filter }
      currentFilter.value = finalFilter

      const data = await analyticsService.generateAnalytics(finalFilter)
      analyticsData.value = data
      lastUpdated.value = new Date()
    } catch (err: any) {
      error.value = err.message || 'Failed to generate analytics'
      console.error('Analytics generation failed:', err)
    } finally {
      loading.value = false
    }
  }

  async function loadSummary(timeRange: TimeRange = '30d') {
    try {
      const summaryData = await analyticsService.getAnalyticsSummary(timeRange)
      summary.value = summaryData
    } catch (err: any) {
      console.error('Failed to load analytics summary:', err)
    }
  }

  async function refreshAnalytics() {
    await generateAnalytics()
  }

  async function updateTimeRange(newTimeRange: TimeRange) {
    if (newTimeRange !== currentFilter.value.timeRange) {
      await generateAnalytics({ timeRange: newTimeRange })
    }
  }

  async function updateFilter(newFilter: Partial<AnalyticsFilter>) {
    await generateAnalytics(newFilter)
  }

  async function exportAnalytics(config: AnalyticsExportConfig) {
    loading.value = true
    error.value = null

    try {
      await analyticsService.exportAnalytics(config)
    } catch (err: any) {
      error.value = err.message || 'Failed to export analytics'
      console.error('Analytics export failed:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  function clearAnalytics() {
    analyticsData.value = null
    summary.value = null
    lastUpdated.value = null
    error.value = null
    analyticsService.clearCache()
  }

  function clearError() {
    error.value = null
  }

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

  function formatPercentage(num: number): string {
    return num.toFixed(1) + '%'
  }

  function getTimeRangeLabel(range: TimeRange): string {
    const option = timeRangeOptions.value.find(opt => opt.value === range)
    return option?.label || range
  }

  function getTrendIcon(trend: 'up' | 'down' | 'stable'): string {
    switch (trend) {
      case 'up': return '↗️'
      case 'down': return '↘️' 
      case 'stable': return '➡️'
      default: return '➡️'
    }
  }

  function getTrendColor(trend: 'up' | 'down' | 'stable'): string {
    switch (trend) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      case 'stable': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  // Getters for specific analytics sections
  const chatAnalytics = computed(() => analyticsData.value?.chat || null)
  const messageAnalytics = computed(() => analyticsData.value?.message || null)
  const usageAnalytics = computed(() => analyticsData.value?.usage || null)
  const contentAnalytics = computed(() => analyticsData.value?.content || null)
  const performanceAnalytics = computed(() => analyticsData.value?.performance || null)
  const modelAnalytics = computed(() => analyticsData.value?.model || null)

  return {
    // State
    analyticsData,
    loading,
    error,
    lastUpdated,
    currentFilter,
    summary,

    // Computed
    isLoaded,
    hasError,
    isStale,
    timeRangeOptions,
    exportFormatOptions,
    chartData,
    chatAnalytics,
    messageAnalytics,
    usageAnalytics,
    contentAnalytics,
    performanceAnalytics,
    modelAnalytics,

    // Actions
    generateAnalytics,
    loadSummary,
    refreshAnalytics,
    updateTimeRange,
    updateFilter,
    exportAnalytics,
    clearAnalytics,
    clearError,

    // Utilities
    formatNumber,
    formatPercentage,
    getTimeRangeLabel,
    getTrendIcon,
    getTrendColor
  }
}, {
  persist: {
    key: 'analytics-store',
    paths: ['currentFilter'] // Only persist filter settings
  }
})