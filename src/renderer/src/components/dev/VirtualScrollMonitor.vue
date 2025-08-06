<template>
  <div v-if="isDevelopment" class="virtual-scroll-monitor">
    <div class="monitor-header">
      <h3>Virtual Scroll Performance</h3>
      <button @click="clearStats" class="clear-btn">Clear</button>
    </div>
    
    <div class="monitor-grid">
      <!-- Scroll Performance -->
      <div class="metric-card">
        <div class="metric-title">Scroll Performance</div>
        <div class="metric-value">{{ scrollFps }}fps</div>
        <div class="metric-subtitle">Average: {{ avgScrollFps }}fps</div>
      </div>
      
      <!-- Memory Usage -->
      <div class="metric-card">
        <div class="metric-title">Memory Usage</div>
        <div class="metric-value">{{ formatBytes(memoryUsage) }}</div>
        <div class="metric-subtitle">{{ memoryUsagePercent }}% of limit</div>
      </div>
      
      <!-- Cache Statistics -->
      <div class="metric-card">
        <div class="metric-title">Cache Size</div>
        <div class="metric-value">{{ cacheStats.size }}</div>
        <div class="metric-subtitle">Hit rate: {{ cacheStats.hitRate }}%</div>
      </div>
      
      <!-- Render Performance -->
      <div class="metric-card">
        <div class="metric-title">Render Time</div>
        <div class="metric-value">{{ renderTime }}ms</div>
        <div class="metric-subtitle">Items: {{ visibleItems }}</div>
      </div>
    </div>
    
    <!-- Performance Chart -->
    <div class="chart-container">
      <canvas ref="chartCanvas" width="300" height="100"></canvas>
    </div>
    
    <!-- Detailed Stats -->
    <details class="detailed-stats">
      <summary>Detailed Statistics</summary>
      <div class="stats-grid">
        <div>Scroll Events: {{ stats.scrollEvents }}</div>
        <div>Render Cycles: {{ stats.renderCycles }}</div>
        <div>Cache Hits: {{ stats.cacheHits }}</div>
        <div>Cache Misses: {{ stats.cacheMisses }}</div>
        <div>Memory Cleanups: {{ stats.memoryCleanups }}</div>
        <div>Average Item Height: {{ avgItemHeight }}px</div>
      </div>
    </details>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { performanceMonitor } from '@renderer/src/utils/performance'

interface Props {
  scrollContainer?: HTMLElement
  cacheSize?: number
  visibleItemCount?: number
}

const props = defineProps<Props>()

// Development mode check
const isDevelopment = ref(import.meta.env.MODE === 'development')

// Refs
const chartCanvas = ref<HTMLCanvasElement>()

// Performance metrics
const scrollFps = ref(0)
const avgScrollFps = ref(0)
const memoryUsage = ref(0)
const memoryUsagePercent = ref(0)
const renderTime = ref(0)
const visibleItems = ref(0)

// Cache statistics
const cacheStats = reactive({
  size: 0,
  hitRate: 0
})

// Detailed statistics
const stats = reactive({
  scrollEvents: 0,
  renderCycles: 0,
  cacheHits: 0,
  cacheMisses: 0,
  memoryCleanups: 0,
  totalItemHeight: 0,
  itemCount: 0
})

// Performance history for charts
const fpsHistory = ref<number[]>([])
const memoryHistory = ref<number[]>([])
const maxHistoryLength = 60 // Keep last 60 data points

// Computed properties
const avgItemHeight = computed(() => {
  return stats.itemCount > 0 
    ? Math.round(stats.totalItemHeight / stats.itemCount) 
    : 0
})

// Performance tracking
let lastScrollTime = 0
let scrollFrameCount = 0
let fpsTimer: NodeJS.Timeout | null = null

const trackScrollPerformance = () => {
  const now = performance.now()
  scrollFrameCount++
  
  if (now - lastScrollTime >= 1000) {
    const currentFps = Math.round(scrollFrameCount * 1000 / (now - lastScrollTime))
    scrollFps.value = currentFps
    
    // Update FPS history
    fpsHistory.value.push(currentFps)
    if (fpsHistory.value.length > maxHistoryLength) {
      fpsHistory.value.shift()
    }
    
    // Calculate average
    avgScrollFps.value = Math.round(
      fpsHistory.value.reduce((sum, fps) => sum + fps, 0) / fpsHistory.value.length
    )
    
    scrollFrameCount = 0
    lastScrollTime = now
    
    stats.scrollEvents++
  }
}

const updateMemoryUsage = () => {
  if ('memory' in performance) {
    const memInfo = (performance as any).memory
    memoryUsage.value = memInfo.usedJSHeapSize
    memoryUsagePercent.value = Math.round(
      (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100
    )
    
    // Update memory history
    memoryHistory.value.push(memoryUsage.value)
    if (memoryHistory.value.length > maxHistoryLength) {
      memoryHistory.value.shift()
    }
  }
}

const updateRenderMetrics = () => {
  const renderStats = performanceMonitor.getStats('message-grouping')
  if (renderStats) {
    renderTime.value = Math.round(renderStats.avg)
    stats.renderCycles = renderStats.count
  }
  
  if (props.visibleItemCount) {
    visibleItems.value = props.visibleItemCount
  }
  
  if (props.cacheSize) {
    cacheStats.size = props.cacheSize
    // Calculate hit rate (simplified)
    const totalRequests = stats.cacheHits + stats.cacheMisses
    cacheStats.hitRate = totalRequests > 0 
      ? Math.round((stats.cacheHits / totalRequests) * 100)
      : 0
  }
}

const drawChart = () => {
  const canvas = chartCanvas.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  const width = canvas.width
  const height = canvas.height
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height)
  
  // Draw FPS chart
  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 2
  ctx.beginPath()
  
  fpsHistory.value.forEach((fps, index) => {
    const x = (index / (maxHistoryLength - 1)) * width
    const y = height - (fps / 60) * height // Assuming 60fps as max
    
    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })
  
  ctx.stroke()
  
  // Draw memory usage line
  ctx.strokeStyle = '#ef4444'
  ctx.lineWidth = 1
  ctx.beginPath()
  
  const maxMemory = Math.max(...memoryHistory.value, 1)
  memoryHistory.value.forEach((memory, index) => {
    const x = (index / (maxHistoryLength - 1)) * width
    const y = height - (memory / maxMemory) * height
    
    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })
  
  ctx.stroke()
  
  // Draw grid lines
  ctx.strokeStyle = 'rgba(156, 163, 175, 0.3)'
  ctx.lineWidth = 1
  
  // Horizontal lines
  for (let i = 0; i <= 4; i++) {
    const y = (height / 4) * i
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
  
  // Vertical lines
  for (let i = 0; i <= 6; i++) {
    const x = (width / 6) * i
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const clearStats = () => {
  // Reset all statistics
  Object.keys(stats).forEach(key => {
    ;(stats as any)[key] = 0
  })
  
  fpsHistory.value = []
  memoryHistory.value = []
  scrollFps.value = 0
  avgScrollFps.value = 0
  renderTime.value = 0
  
  performanceMonitor.clear()
}

// Set up monitoring
let monitoringInterval: NodeJS.Timeout

onMounted(() => {
  if (!isDevelopment.value) return
  
  // Set up scroll event listener
  if (props.scrollContainer) {
    props.scrollContainer.addEventListener('scroll', trackScrollPerformance)
  }
  
  // Update metrics periodically
  monitoringInterval = setInterval(() => {
    updateMemoryUsage()
    updateRenderMetrics()
    nextTick(() => {
      drawChart()
    })
  }, 1000)
  
  // Initialize chart
  nextTick(() => {
    drawChart()
  })
})

onUnmounted(() => {
  if (monitoringInterval) {
    clearInterval(monitoringInterval)
  }
  
  if (fpsTimer) {
    clearTimeout(fpsTimer)
  }
  
  if (props.scrollContainer) {
    props.scrollContainer.removeEventListener('scroll', trackScrollPerformance)
  }
})

// Public API for external monitoring
const recordCacheHit = () => {
  stats.cacheHits++
}

const recordCacheMiss = () => {
  stats.cacheMisses++
}

const recordMemoryCleanup = () => {
  stats.memoryCleanups++
}

const recordItemHeight = (height: number) => {
  stats.totalItemHeight += height
  stats.itemCount++
}

defineExpose({
  recordCacheHit,
  recordCacheMiss,
  recordMemoryCleanup,
  recordItemHeight,
  clearStats
})
</script>

<style scoped>
.virtual-scroll-monitor {
  position: fixed;
  top: 10px;
  right: 10px;
  width: 320px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  border-radius: 8px;
  padding: 12px;
  font-size: 12px;
  font-family: 'Monaco', 'Menlo', monospace;
  z-index: 9999;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.monitor-header {
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.monitor-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.clear-btn {
  background: rgba(239, 68, 68, 0.8);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 10px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.clear-btn:hover {
  background: rgba(239, 68, 68, 1);
}

.monitor-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.metric-card {
  background: rgba(255, 255, 255, 0.1);
  padding: 8px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.metric-title {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 4px;
}

.metric-value {
  font-size: 16px;
  font-weight: 700;
  color: #60a5fa;
  margin-bottom: 2px;
}

.metric-subtitle {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
}

.chart-container {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.detailed-stats {
  margin-top: 8px;
}

.detailed-stats summary {
  cursor: pointer;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8px;
}

.detailed-stats[open] summary {
  margin-bottom: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
}

/* Animations */
.metric-value {
  transition: color 0.3s ease;
}

.metric-card:hover .metric-value {
  color: #93c5fd;
}

/* Responsive */
@media (max-width: 768px) {
  .virtual-scroll-monitor {
    width: 280px;
    font-size: 11px;
  }
  
  .monitor-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>