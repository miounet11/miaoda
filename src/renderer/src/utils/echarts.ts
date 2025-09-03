// Optimized ECharts import with proper tree shaking
import { init, registerTheme } from 'echarts/core'
import type { EChartsCoreOption, ECharts } from 'echarts/core'

// Import only required renderers
import { CanvasRenderer } from 'echarts/renderers'

// Import only required charts
import { LineChart, BarChart, PieChart } from 'echarts/charts'

// Import only required components
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
} from 'echarts/components'

// Register components
import { use } from 'echarts/core'
use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
])

// Dark theme configuration (optimized)
const darkTheme = {
  color: [
    '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1',
  ],
  backgroundColor: '#1F2937',
  textStyle: {
    color: '#F3F4F6',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  title: {
    textStyle: { color: '#F3F4F6' },
    subtextStyle: { color: '#9CA3AF' },
  },
  line: {
    itemStyle: { borderWidth: 2 },
    lineStyle: { width: 3 },
    symbolSize: 6,
    symbol: 'circle',
    smooth: true,
  },
  bar: {
    itemStyle: { borderRadius: [4, 4, 0, 0] },
  },
  pie: {
    itemStyle: {
      borderRadius: 5,
      borderColor: '#1F2937',
      borderWidth: 2,
    },
  },
  categoryAxis: {
    axisLine: { show: true, lineStyle: { color: '#4B5563' } },
    axisTick: { show: true, lineStyle: { color: '#4B5563' } },
    axisLabel: { show: true, color: '#9CA3AF' },
    splitLine: { show: false, lineStyle: { color: ['#374151'] } },
  },
  valueAxis: {
    axisLine: { show: true, lineStyle: { color: '#4B5563' } },
    axisTick: { show: true, lineStyle: { color: '#4B5563' } },
    axisLabel: { show: true, color: '#9CA3AF' },
    splitLine: { show: true, lineStyle: { color: ['#374151'] } },
  },
  legend: {
    textStyle: { color: '#9CA3AF' },
  },
  tooltip: {
    axisPointer: {
      lineStyle: { color: '#4B5563', width: 1 },
      crossStyle: { color: '#4B5563', width: 1 },
    },
  },
}

// Register dark theme
registerTheme('dark', darkTheme)

// Default configuration function
export function getDefaultChartOptions(isDark = false) {
  return {
    textStyle: {
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? '#374151' : '#FFFFFF',
      borderColor: isDark ? '#4B5563' : '#E5E7EB',
      borderWidth: 1,
      textStyle: {
        color: isDark ? '#F3F4F6' : '#374151',
      },
      extraCssText: 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);',
    },
    legend: {
      top: 'top',
      textStyle: {
        color: isDark ? '#9CA3AF' : '#6B7280',
      },
    },
  }
}

// Export optimized ECharts instance
export { init as createChart, type EChartsCoreOption, type ECharts }
export default { init, registerTheme }
