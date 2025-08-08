<template>
  <div class="keyword-cloud">
    <div class="mb-4">
      <h3 class="text-lg font-semibold mb-2">Top Keywords</h3>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Most frequently used words in conversations
      </p>
    </div>

    <div class="keyword-cloud-container">
      <BaseChart
        :option="chartOption"
        :loading="loading"
        :height="height"
        :theme="theme"
        @chart-click="handleChartClick"
      />
    </div>

    <div class="mt-4">
      <div class="keyword-list">
        <h4 class="font-medium text-sm text-gray-700 dark:text-gray-300 mb-3">
          Keyword Rankings
        </h4>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          <div
            v-for="(keyword, index) in displayKeywords"
            :key="keyword.keyword"
            class="keyword-item"
            :class="getKeywordRankClass(index)"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium truncate">
                {{ keyword.keyword }}
              </span>
              <div class="flex items-center gap-1 ml-2">
                <span class="text-xs text-gray-500">
                  #{{ index + 1 }}
                </span>
                <span class="text-sm font-semibold">
                  {{ keyword.count }}
                </span>
              </div>
            </div>
            <div class="mt-1">
              <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                <div
                  class="h-1 rounded-full transition-all duration-300"
                  :class="getKeywordBarColor(index)"
                  :style="{ 
                    width: `${(keyword.count / maxKeywordCount) * 100}%` 
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="hasMoreKeywords" class="mt-4 text-center">
          <button
            @click="toggleShowAll"
            class="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
          >
            {{ showAll ? 'Show Less' : `Show All ${keywords.length} Keywords` }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseChart from './BaseChart.vue'
import type { EChartsOption } from 'echarts'
import type { ContentAnalytics } from '../../types'

interface Props {
  data: ContentAnalytics | null
  height?: string
  theme?: 'light' | 'dark'
  loading?: boolean
  maxDisplay?: number
}

const props = withDefaults(defineProps<Props>(), {
  height: '300px',
  theme: 'light',
  loading: false,
  maxDisplay: 12
})

const emit = defineEmits<{
  chartClick: [params: any]
}>()

const showAll = ref(false)

const keywords = computed(() => {
  if (!props.data?.topKeywords) return []
  return props.data.topKeywords.filter(keyword => 
    keyword.keyword && keyword.keyword.length > 0
  )
})

const displayKeywords = computed(() => {
  if (showAll.value || keywords.value.length <= props.maxDisplay) {
    return keywords.value
  }
  return keywords.value.slice(0, props.maxDisplay)
})

const hasMoreKeywords = computed(() => {
  return keywords.value.length > props.maxDisplay
})

const maxKeywordCount = computed(() => {
  return Math.max(...keywords.value.map(k => k.count), 1)
})

const chartOption = computed((): EChartsOption => {
  if (!keywords.value || keywords.value.length === 0) {
    return {
      title: {
        text: 'No keyword data available',
        left: 'center',
        top: 'middle',
        textStyle: {
          color: '#9CA3AF',
          fontSize: 14
        }
      }
    }
  }

  // Create word cloud data
  const wordCloudData = keywords.value.slice(0, 50).map(keyword => ({
    name: keyword.keyword,
    value: keyword.count,
    textStyle: {
      color: getRandomColor()
    }
  }))

  return {
    textStyle: {
      fontFamily: 'Inter, system-ui, sans-serif'
    },
    title: {
      text: `Word Cloud (${keywords.value.length} keywords)`,
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 14,
        fontWeight: 'normal',
        color: props.theme === 'dark' ? '#F3F4F6' : '#374151'
      }
    },
    tooltip: {
      formatter: (params: any) => {
        return `${params.name}<br/>Count: ${params.value}`
      }
    },
    series: [{
      type: 'wordCloud',
      gridSize: 8,
      sizeRange: [12, 40],
      rotationRange: [-45, 45],
      rotationStep: 45,
      shape: 'circle',
      width: '100%',
      height: '80%',
      top: '15%',
      data: wordCloudData,
      textStyle: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontWeight: 'normal'
      },
      emphasis: {
        textStyle: {
          shadowBlur: 10,
          shadowColor: '#333'
        }
      }
    }]
  }
})

function getRandomColor(): string {
  const colors = [
    '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1',
    '#14B8A6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

function getKeywordRankClass(index: number): string {
  if (index < 3) return 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800 border border-yellow-200 dark:border-yellow-700'
  if (index < 8) return 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border border-blue-200 dark:border-blue-700'
  return 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
}

function getKeywordBarColor(index: number): string {
  if (index < 3) return 'bg-yellow-400'
  if (index < 8) return 'bg-blue-400'
  return 'bg-gray-400'
}

function toggleShowAll(): void {
  showAll.value = !showAll.value
}

function handleChartClick(params: any): void {
  emit('chartClick', params)
}
</script>

<style scoped>
.keyword-cloud {
  @apply bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm;
}

.keyword-cloud-container {
  @apply border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden;
}

.keyword-item {
  @apply p-3 rounded-lg transition-all duration-200 hover:shadow-sm;
}
</style>