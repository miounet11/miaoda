<template>
  <div class="model-usage-chart">
    <div class="mb-4">
      <h3 class="text-lg font-semibold mb-2">Model Usage Distribution</h3>
      <p class="text-sm text-gray-600 dark:text-gray-400">Usage percentage by AI model</p>
    </div>

    <BaseChart
      :option="chartOption"
      :loading="loading"
      :height="height"
      :theme="theme"
      @chart-click="handleChartClick"
    />

    <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="stats-summary">
        <h4 class="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">Top Models</h4>
        <div class="space-y-1">
          <div
            v-for="model in topModels"
            :key="model.model"
            class="flex justify-between items-center text-sm"
          >
            <span class="text-gray-600 dark:text-gray-400">{{ model.model }}</span>
            <div class="flex items-center gap-2">
              <span class="text-gray-900 dark:text-gray-100 font-medium">
                {{ model.count }}
              </span>
              <span class="text-xs text-gray-500"> ({{ model.percentage.toFixed(1) }}%) </span>
            </div>
          </div>
        </div>
      </div>

      <div class="performance-summary" v-if="performanceData">
        <h4 class="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">
          Performance Summary
        </h4>
        <div class="space-y-1 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Success Rate:</span>
            <span class="text-green-600 font-medium">
              {{ performanceData.successRate.toFixed(1) }}%
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Error Rate:</span>
            <span class="text-red-600 font-medium">
              {{ performanceData.errorRate.toFixed(1) }}%
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseChart from './BaseChart.vue'
import type { EChartsOption } from 'echarts'
import type { ModelAnalytics, PerformanceAnalytics } from '../../types'

interface Props {
  data: ModelAnalytics | null
  performanceData?: PerformanceAnalytics | null
  height?: string
  theme?: 'light' | 'dark'
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  height: '350px',
  theme: 'light',
  loading: false
})

const emit = defineEmits<{
  chartClick: [params: any]
}>()

const colors = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#8B5CF6', // Purple
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#EC4899', // Pink
  '#6B7280' // Gray
]

const topModels = computed(() => {
  if (!props.data?.modelUsage) return []
  return props.data.modelUsage.filter(model => model.model !== 'Unknown').slice(0, 5)
})

const chartOption = computed((): EChartsOption => {
  if (!props.data?.modelUsage || props.data.modelUsage.length === 0) {
    return {
      title: {
        text: 'No model usage data available',
        left: 'center',
        top: 'middle',
        textStyle: {
          color: '#9CA3AF',
          fontSize: 14
        }
      }
    }
  }

  const validModels = props.data.modelUsage.filter(
    model => model.model !== 'Unknown' && model.count > 0
  )

  if (validModels.length === 0) {
    return {
      title: {
        text: 'No valid model data available',
        left: 'center',
        top: 'middle',
        textStyle: {
          color: '#9CA3AF',
          fontSize: 14
        }
      }
    }
  }

  return {
    textStyle: {
      fontFamily: 'Inter, system-ui, sans-serif'
    },
    title: {
      text: `Model Distribution (${validModels.length} models)`,
      left: 'center',
      top: 20,
      textStyle: {
        fontSize: 14,
        fontWeight: 'normal',
        color: props.theme === 'dark' ? '#F3F4F6' : '#374151'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        return `${params.name}<br/>Count: ${params.value}<br/>Percentage: ${params.percent}%`
      }
    },
    legend: {
      type: 'scroll',
      orient: 'horizontal',
      bottom: 10,
      left: 'center',
      textStyle: {
        fontSize: 12
      }
    },
    series: [
      {
        name: 'Model Usage',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '50%'],
        data: validModels.map((model, index) => ({
          name: model.model,
          value: model.count,
          itemStyle: {
            color: colors[index % colors.length]
          }
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          show: true,
          formatter: '{b}\n{d}%',
          fontSize: 11
        },
        labelLine: {
          show: true,
          length: 15,
          length2: 10
        }
      }
    ]
  }
})

const handleChartClick = (params: any) => {
  emit('chartClick', params)
}
</script>

<style scoped>
.model-usage-chart {
  @apply bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm;
}

.stats-summary,
.performance-summary {
  @apply bg-gray-50 dark:bg-gray-700 rounded-lg p-3;
}
</style>
