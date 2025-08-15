<template>
  <div v-if="isVisible" class="performance-test-panel">
    <div class="panel-header">
      <h3>Performance Test Panel</h3>
      <button @click="togglePanel" class="close-btn">×</button>
    </div>
    
    <div class="panel-content">
      <!-- 性能指标显示 -->
      <div class="metrics-section">
        <h4>Performance Metrics</h4>
        <div class="metric-item">
          <span>FPS:</span>
          <span class="metric-value">{{ currentFPS }}</span>
        </div>
        <div class="metric-item">
          <span>Memory Usage:</span>
          <span class="metric-value">{{ memoryUsage }}MB</span>
        </div>
        <div class="metric-item">
          <span>Render Time:</span>
          <span class="metric-value">{{ renderTime }}ms</span>
        </div>
      </div>

      <!-- 测试控制 -->
      <div class="test-controls">
        <h4>Test Controls</h4>
        <div class="control-group">
          <button @click="startPerformanceTest" :disabled="isTestRunning">
            {{ isTestRunning ? 'Testing...' : 'Start Performance Test' }}
          </button>
          <button @click="clearMetrics">Clear Metrics</button>
        </div>
        
        <!-- 消息数量控制 -->
        <div class="control-group">
          <label>Test Message Count:</label>
          <input 
            v-model.number="testMessageCount" 
            type="number" 
            min="10" 
            max="1000" 
            step="10"
          >
        </div>
      </div>

      <!-- 测试结果 -->
      <div class="test-results" v-if="testResults.length > 0">
        <h4>Test Results</h4>
        <div class="results-list">
          <div v-for="result in testResults" :key="result.timestamp" class="result-item">
            <div class="result-header">
              Test {{ result.id }} - {{ new Date(result.timestamp).toLocaleTimeString() }}
            </div>
            <div class="result-metrics">
              <span>Messages: {{ result.messageCount }}</span>
              <span>Avg FPS: {{ result.avgFPS }}</span>
              <span>Max Memory: {{ result.maxMemory }}MB</span>
              <span>Total Time: {{ result.totalTime }}ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 悬浮按钮 -->
  <div v-else class="floating-toggle">
    <button @click="togglePanel" class="toggle-btn" title="Open Performance Panel">
      📊
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// 组件状态
const isVisible = ref(false)
const isTestRunning = ref(false)
const testMessageCount = ref(100)

// 性能指标
const currentFPS = ref(0)
const memoryUsage = ref(0)
const renderTime = ref(0)

// 测试结果
interface TestResult {
  id: number
  timestamp: number
  messageCount: number
  avgFPS: number
  maxMemory: number
  totalTime: number
}

const testResults = ref<TestResult[]>([])
let testCounter = 0

// FPS 监控
let frameCount = 0
let lastTime = performance.now()
let fpsInterval: number | null = null

// 内存监控
let memoryInterval: number | null = null

// 切换面板显示
const togglePanel = () => {
  isVisible.value = !isVisible.value
  if (isVisible.value) {
    startMonitoring()
  } else {
    stopMonitoring()
  }
}

// 开始性能监控
const startMonitoring = () => {
  // 监控 FPS
  const measureFPS = () => {
    frameCount++
    requestAnimationFrame(() => {
      const now = performance.now()
      if (now - lastTime >= 1000) {
        currentFPS.value = Math.round((frameCount * 1000) / (now - lastTime))
        frameCount = 0
        lastTime = now
      }
      if (isVisible.value) {
        measureFPS()
      }
    })
  }
  measureFPS()

  // 监控内存使用
  memoryInterval = window.setInterval(() => {
    if ((performance as any).memory) {
      const memory = (performance as any).memory
      memoryUsage.value = Math.round(memory.usedJSHeapSize / 1024 / 1024)
    }
  }, 1000)
}

// 停止性能监控
const stopMonitoring = () => {
  if (memoryInterval) {
    clearInterval(memoryInterval)
    memoryInterval = null
  }
}

// 开始性能测试
const startPerformanceTest = async () => {
  if (isTestRunning.value) return
  
  isTestRunning.value = true
  const testStartTime = performance.now()
  
  // 记录测试开始时的指标
  const startMetrics = {
    fps: currentFPS.value,
    memory: memoryUsage.value
  }
  
  try {
    // 模拟大量消息渲染的性能测试
    const testMessages = generateTestMessages(testMessageCount.value)
    
    // 触发消息渲染（这里需要根据实际的消息系统来实现）
    await simulateMessageRendering(testMessages)
    
    // 等待渲染完成并收集指标
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const testEndTime = performance.now()
    const totalTime = testEndTime - testStartTime
    
    // 记录测试结果
    const result: TestResult = {
      id: ++testCounter,
      timestamp: Date.now(),
      messageCount: testMessageCount.value,
      avgFPS: currentFPS.value,
      maxMemory: memoryUsage.value,
      totalTime: Math.round(totalTime)
    }
    
    testResults.value.unshift(result)
    
    // 限制结果数量
    if (testResults.value.length > 10) {
      testResults.value = testResults.value.slice(0, 10)
    }
    
  } catch (error) {
    console.error('Performance test failed:', error)
  } finally {
    isTestRunning.value = false
  }
}

// 生成测试消息
const generateTestMessages = (count: number) => {
  const messages = []
  for (let i = 0; i < count; i++) {
    messages.push({
      id: `test-${i}`,
      content: `Test message ${i} - Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
      role: i % 2 === 0 ? 'user' : 'assistant',
      timestamp: Date.now() - (count - i) * 1000
    })
  }
  return messages
}

// 模拟消息渲染
const simulateMessageRendering = async (messages: any[]) => {
  // 这里可以集成实际的消息渲染逻辑
  // 目前只是模拟延迟
  return new Promise(resolve => {
    setTimeout(resolve, messages.length * 10)
  })
}

// 清除指标
const clearMetrics = () => {
  testResults.value = []
  testCounter = 0
}

// 组件挂载时开始监控
onMounted(() => {
  if (isVisible.value) {
    startMonitoring()
  }
})

// 组件卸载时清理
onUnmounted(() => {
  stopMonitoring()
})
</script>

<style scoped>
.performance-test-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 350px;
  max-height: 80vh;
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid #333;
  border-radius: 8px;
  color: #fff;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  z-index: 10000;
  overflow-y: auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid #333;
  background: rgba(0, 0, 0, 0.8);
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: bold;
}

.close-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
}

.panel-content {
  padding: 15px;
}

.metrics-section,
.test-controls,
.test-results {
  margin-bottom: 20px;
}

.metrics-section h4,
.test-controls h4,
.test-results h4 {
  margin: 0 0 10px 0;
  font-size: 13px;
  color: #4CAF50;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.metric-value {
  font-weight: bold;
  color: #FFC107;
}

.control-group {
  margin-bottom: 10px;
}

.control-group button {
  background: #2196F3;
  border: none;
  color: white;
  padding: 5px 10px;
  margin-right: 5px;
  margin-bottom: 5px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
}

.control-group button:disabled {
  background: #666;
  cursor: not-allowed;
}

.control-group button:hover:not(:disabled) {
  background: #1976D2;
}

.control-group label {
  display: block;
  margin-bottom: 5px;
  font-size: 11px;
}

.control-group input {
  width: 100%;
  padding: 3px 5px;
  background: #333;
  border: 1px solid #555;
  color: #fff;
  border-radius: 3px;
}

.results-list {
  max-height: 200px;
  overflow-y: auto;
}

.result-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #333;
  border-radius: 3px;
  padding: 8px;
  margin-bottom: 8px;
}

.result-header {
  font-weight: bold;
  margin-bottom: 5px;
  color: #4CAF50;
}

.result-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
  font-size: 10px;
}

.floating-toggle {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
}

.toggle-btn {
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid #333;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.toggle-btn:hover {
  background: rgba(0, 0, 0, 0.9);
  transform: scale(1.1);
}

/* 滚动条样式 */
.performance-test-panel::-webkit-scrollbar,
.results-list::-webkit-scrollbar {
  width: 6px;
}

.performance-test-panel::-webkit-scrollbar-track,
.results-list::-webkit-scrollbar-track {
  background: #333;
}

.performance-test-panel::-webkit-scrollbar-thumb,
.results-list::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 3px;
}

.performance-test-panel::-webkit-scrollbar-thumb:hover,
.results-list::-webkit-scrollbar-thumb:hover {
  background: #777;
}
</style>