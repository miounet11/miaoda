<template>
  <div class="usage-chart">
    <div class="mb-4">
      <h3 class="text-lg font-semibold mb-2">{{ title }}</h3>
      <div class="flex gap-2 mb-2">
        <button
          v-for="type in chartTypes"
          :key="type.value"
          @click="currentType = type.value"
          :class="[
            'px-3 py-1 text-sm rounded-md transition-colors',
            currentType === type.value
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          ]"
        >
          {{ type.label }}
        </button>
      </div>
    </div>

    <BaseChart
      :option="chartOption"
      :loading="loading"
      :height="height"
      :theme="theme"
      @chart-click="handleChartClick"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseChart from './BaseChart.vue'
import type { EChartsOption } from 'echarts'
import type { UsageAnalytics } from '../../types'

interface Props {
  data: UsageAnalytics | null
  title?: string
  height?: string
  theme?: 'light' | 'dark'
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Usage Analytics',
  height: '400px',
  theme: 'light',
  loading: false
})

const emit = defineEmits<{
  chartClick: [params: any]
}>()

const currentType = ref<'daily-messages' | 'daily-chats' | 'active-hours'>('daily-messages')

const chartTypes = [
  { value: 'daily-messages', label: 'Daily Messages' },
  { value: 'daily-chats', label: 'Daily Chats' },
  { value: 'active-hours', label: 'Active Hours' }
]

const chartOption = computed((): EChartsOption => {
  if (!props.data) return {}

  const baseStyle = {
    textStyle: {
      fontFamily: 'Inter, system-ui, sans-serif'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    }
  }

  switch (currentType.value) {
    case 'daily-messages':
      return {
        ...baseStyle,
        title: {
          text: 'Daily Message Activity',
          left: 'center',
          textStyle: {
            fontSize: 16,
            fontWeight: 'normal'
          }
        },
        tooltip: {
          trigger: 'axis',
          formatter: '{b}<br/>{a}: {c} messages'
        },
        xAxis: {
          type: 'category',
          data: props.data.messagesByDay.map(item => {
            const date = new Date(item.date)
            return date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })
          }),
          axisLabel: {
            rotate: 45
          }
        },
        yAxis: {
          type: 'value',
          name: 'Messages',
          nameLocation: 'middle',
          nameGap: 50
        },
        series: [
          {
            name: 'Messages',
            type: 'line',
            smooth: true,
            data: props.data.messagesByDay.map(item => item.count),
            itemStyle: {
              color: '#3B82F6'
            },
            lineStyle: {
              color: '#3B82F6',
              width: 3
            },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                  { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
                ]
              }
            }
          }
        ]
      }

    case 'daily-chats':
      return {
        ...baseStyle,
        title: {
          text: 'Daily Chat Creation',
          left: 'center',
          textStyle: {
            fontSize: 16,
            fontWeight: 'normal'
          }
        },
        tooltip: {
          trigger: 'axis',
          formatter: '{b}<br/>{a}: {c} chats'
        },
        xAxis: {
          type: 'category',
          data: props.data.chatsByDay.map(item => {
            const date = new Date(item.date)
            return date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })
          }),
          axisLabel: {
            rotate: 45
          }
        },
        yAxis: {
          type: 'value',
          name: 'Chats Created',
          nameLocation: 'middle',
          nameGap: 50
        },
        series: [
          {
            name: 'Chats',
            type: 'bar',
            data: props.data.chatsByDay.map(item => item.count),
            itemStyle: {
              color: '#10B981',
              borderRadius: [4, 4, 0, 0]
            }
          }
        ]
      }

    case 'active-hours':
      return {
        ...baseStyle,
        title: {
          text: 'Activity by Hour of Day',
          left: 'center',
          textStyle: {
            fontSize: 16,
            fontWeight: 'normal'
          }
        },
        tooltip: {
          trigger: 'axis',
          formatter: '{b}:00<br/>{a}: {c} messages'
        },
        polar: {
          radius: '70%'
        },
        angleAxis: {
          type: 'category',
          data: Array.from({ length: 24 }, (_, i) => `${i}:00`),
          boundaryGap: false,
          splitLine: {
            show: true,
            lineStyle: {
              color: '#E5E7EB',
              type: 'dashed'
            }
          }
        },
        radiusAxis: {
          type: 'value',
          name: 'Messages',
          nameLocation: 'middle',
          nameGap: 20
        },
        series: [
          {
            name: 'Activity',
            type: 'line',
            coordinateSystem: 'polar',
            data: Array.from({ length: 24 }, (_, hour) => {
              const hourData = props.data.activeHours.find(h => h.hour === hour)
              return hourData ? hourData.count : 0
            }),
            smooth: true,
            itemStyle: {
              color: '#8B5CF6'
            },
            lineStyle: {
              color: '#8B5CF6',
              width: 3
            },
            areaStyle: {
              color: 'rgba(139, 92, 246, 0.2)'
            }
          }
        ]
      }

    default:
      return {}
  }
})

const handleChartClick = (params: any) => {
  emit('chartClick', params)
}
</script>

<style scoped>
.usage-chart {
  @apply bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm;
}
</style>
