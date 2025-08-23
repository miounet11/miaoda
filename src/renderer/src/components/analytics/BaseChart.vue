<template>
  <div class="base-chart" :style="{ height: height }">
    <div ref="chartContainer" class="chart-container w-full h-full" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

interface Props {
  option: EChartsOption
  height?: string
  theme?: 'light' | 'dark'
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  height: '400px',
  theme: 'light',
  loading: false
})

const emit = defineEmits<{
  chartClick: [params: any]
  chartReady: [chart: echarts.ECharts]
}>()

const chartContainer = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null

const initChart = async () => {
  if (!chartContainer.value) return

  await nextTick()

  // Dispose existing chart
  if (chart) {
    chart.dispose()
  }

  // Create new chart
  chart = echarts.init(chartContainer.value, props.theme === 'dark' ? 'dark' : null)

  // Set option
  chart.setOption(props.option, true)

  // Add event listeners
  chart.on('click', (params: any) => {
    emit('chartClick', params)
  })

  // Handle resize
  const handleResize = () => {
    if (chart && !chart.isDisposed()) {
      chart.resize()
    }
  }

  window.addEventListener('resize', handleResize)

  // Show/hide loading
  if (props.loading) {
    chart.showLoading()
  } else {
    chart.hideLoading()
  }

  emit('chartReady', chart)
}

const updateChart = () => {
  if (chart && !chart.isDisposed()) {
    chart.setOption(props.option, true)
  }
}

// Watch for option changes
watch(() => props.option, updateChart, { deep: true })

// Watch for theme changes
watch(
  () => props.theme,
  () => {
    initChart()
  }
)

// Watch for loading state
watch(
  () => props.loading,
  loading => {
    if (chart && !chart.isDisposed()) {
      if (loading) {
        chart.showLoading()
      } else {
        chart.hideLoading()
      }
    }
  }
)

onMounted(() => {
  initChart()
})

onUnmounted(() => {
  if (chart) {
    chart.dispose()
    chart = null
  }
  window.removeEventListener('resize', () => {})
})

// Expose chart instance for parent components
defineExpose({
  chart: () => chart,
  resize: () => {
    if (chart && !chart.isDisposed()) {
      chart.resize()
    }
  }
})
</script>

<style scoped>
.base-chart {
  width: 100%;
  min-height: 200px;
}

.chart-container {
  position: relative;
  overflow: hidden;
}
</style>
