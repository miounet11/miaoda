# MiaoDa Chat 性能优化使用指南

## 快速启用优化

### 1. 在主进程中集成性能管理器

```typescript
// src/main/index.ts
import { createPerformanceManager } from './performance/PerformanceManager'
import { LocalDatabase } from './db/database'

const db = new LocalDatabase()
const performanceManager = createPerformanceManager({
  enabled: true,
  enableDatabaseOptimization: true,
  enableStreamingOptimization: true,
  enableMultiLevelCache: true,
  enableElectronOptimization: true,
  enablePerformanceMonitoring: true,
  enableMemoryLeakDetection: true,
  autoOptimizationEnabled: true
})

// 初始化性能管理器
await performanceManager.initialize(db.db)

// 创建优化后的窗口
const mainWindow = performanceManager.createOptimizedWindow({
  width: 1200,
  height: 800,
  webPreferences: {
    preload: path.join(__dirname, '../preload/index.js')
  }
})
```

### 2. 在渲染进程中使用智能加载器

```typescript
// src/renderer/src/main.ts
import { globalSmartLoader } from './utils/SmartLoader'

// 注册需要预加载的资源
globalSmartLoader.registerResource({
  id: 'chat-component',
  type: 'component',
  loader: () => import('./components/chat/ChatMessages.vue'),
  priority: 'high'
})

// 预加载关键资源
await globalSmartLoader.preloadResources(['chat-component'])
```

### 3. Vue组件中使用智能加载

```vue
<template>
  <div ref="containerRef">
    <VirtualMessageList 
      :messages="messages"
      :auto-scroll="true"
      @visibility-change="handleVisibilityChange"
    />
  </div>
</template>

<script setup lang="ts">
import { useSmartLoader } from '@/utils/SmartLoader'

const { registerResource, setupLazyElement } = useSmartLoader({
  enablePreloading: true,
  enablePredictiveLoading: true
})

// 设置懒加载元素
onMounted(() => {
  if (containerRef.value) {
    setupLazyElement(containerRef.value, 'message-images')
  }
})
</script>
```

## 性能监控使用

### 1. 获取实时性能状态

```typescript
// 获取综合性能状态
const status = await performanceManager.getPerformanceStatus()
console.log('Overall Status:', status.overall)
console.log('Components:', status.components)
console.log('Recommendations:', status.recommendations)
```

### 2. 执行系统优化

```typescript
// 手动触发优化
const result = await performanceManager.optimizeSystem()
console.log('Optimizations performed:', result.optimizationsPerformed)
console.log('Performance improvement:', result.performanceImprovement + '%')
```

### 3. 生成性能报告

```typescript
// 生成详细性能报告
const report = await performanceManager.generatePerformanceReport()
console.log('Performance Report:', report)
```

## 数据库优化使用

### 1. 启用数据库优化器

```typescript
import { createDatabasePerformanceOptimizer } from './db/PerformanceOptimizer'

const dbOptimizer = createDatabasePerformanceOptimizer(database, {
  enableQueryCache: true,
  maxCacheSize: 1000,
  slowQueryThreshold: 100
})

// 执行优化查询
const result = dbOptimizer.executeQuery(
  'SELECT * FROM messages WHERE chat_id = ?',
  [chatId]
)
```

### 2. 批量查询优化

```typescript
// 批量执行查询以获得更好性能
const queries = [
  { sql: 'SELECT * FROM chats ORDER BY updated_at DESC', params: [] },
  { sql: 'SELECT COUNT(*) FROM messages', params: [] }
]

const results = dbOptimizer.executeBatch(queries)
```

## 缓存系统使用

### 1. 基本缓存操作

```typescript
import { MultiLevelCache } from './cache/MultiLevelCache'

const cache = new MultiLevelCache({
  l1: { maxSize: 50 * 1024 * 1024 }, // 50MB内存缓存
  l2: { maxSize: 200 * 1024 * 1024 }, // 200MB持久化缓存
  enablePredictiveLoading: true
})

// 存储数据
await cache.set('user-settings', userSettings, { ttl: 60000 })

// 获取数据
const settings = await cache.get('user-settings')

// 预热缓存
await cache.warmup([
  { key: 'chat-list', value: chatList },
  { key: 'user-profile', value: userProfile }
])
```

### 2. 高级缓存策略

```typescript
// 高优先级数据立即缓存
await cache.set('critical-data', data, { 
  priority: 'high',
  skipL3: true // 只存储在L1和L2
})

// 预测性缓存
await cache.prefetchPredictiveResources()
```

## 内存管理

### 1. 内存泄漏检测

```typescript
import { createMemoryLeakDetector } from './performance/MemoryLeakDetector'

const memoryDetector = createMemoryLeakDetector({
  enabled: true,
  snapshotInterval: 30000,
  enableDetailedAnalysis: true
})

// 注册清理回调
const unregister = memoryDetector.registerCleanupCallback(() => {
  // 清理应用特定的资源
  clearApplicationCaches()
})

// 获取内存分析报告
const report = memoryDetector.getDetailedReport()
console.log('Memory Health Score:', report.summary.healthScore)
```

### 2. 对象生命周期跟踪

```typescript
// 跟踪大对象
memoryDetector.trackObject('large-data-set', largeObject)

// 跟踪事件监听器
memoryDetector.trackEventListeners('vue-component', listenerCount)
```

## 配置调优建议

### 1. 开发环境配置

```typescript
const developmentConfig = {
  enabled: true,
  enablePerformanceMonitoring: true,
  enableMemoryLeakDetection: true,
  autoOptimizationEnabled: false, // 开发时手动控制
  alertThresholds: {
    cpuUsage: 90, // 开发环境更宽松
    memoryUsage: 90,
    queryTime: 2000,
    renderTime: 33, // 30fps acceptable
    errorRate: 10
  }
}
```

### 2. 生产环境配置

```typescript
const productionConfig = {
  enabled: true,
  enableDatabaseOptimization: true,
  enableStreamingOptimization: true,
  enableMultiLevelCache: true,
  enableElectronOptimization: true,
  enablePerformanceMonitoring: true,
  enableMemoryLeakDetection: true,
  autoOptimizationEnabled: true,
  optimizationInterval: 5 * 60 * 1000, // 5分钟自动优化
  alertThresholds: {
    cpuUsage: 80,
    memoryUsage: 85,
    queryTime: 1000,
    renderTime: 16.67, // 60fps
    errorRate: 5
  }
}
```

## 监控最佳实践

### 1. 关键指标监控

```typescript
// 监听性能告警
performanceManager.on('performance-alert', (alert) => {
  if (alert.level === 'critical') {
    // 发送紧急通知
    sendCriticalAlert(alert)
  }
})

// 监听内存泄漏
performanceManager.on('critical-memory-leaks', (leaks) => {
  // 记录并尝试修复
  logger.error('Memory leaks detected:', leaks)
  performanceManager.optimizeSystem()
})
```

### 2. 定期性能检查

```typescript
// 每小时检查一次性能状态
setInterval(async () => {
  const status = await performanceManager.getPerformanceStatus()
  
  if (status.overall === 'poor' || status.overall === 'critical') {
    // 触发自动优化
    await performanceManager.optimizeSystem()
  }
}, 60 * 60 * 1000)
```

## 故障排除

### 1. 性能问题诊断

```typescript
// 获取详细性能指标
const metrics = performanceManager.getMetrics()

// 检查各组件状态
console.log('Database metrics:', metrics.database)
console.log('Cache metrics:', metrics.cache)
console.log('Memory metrics:', metrics.memory)
```

### 2. 常见问题解决

```typescript
// 内存使用过高
if (metrics.memory?.summary.healthScore < 50) {
  // 强制垃圾回收
  memoryDetector.forceGarbageCollection()
  
  // 清理缓存
  await cache.clear()
}

// 数据库查询慢
if (metrics.database?.averageQueryTime > 1000) {
  // 重建索引
  await dbOptimizer.optimizeSearchIndex()
  
  // 分析慢查询
  const analysis = await dbOptimizer.analyzeIndexUsage()
  console.log('Recommendations:', analysis.recommendations)
}
```

## 清理和销毁

```typescript
// 应用退出时清理资源
app.on('before-quit', () => {
  performanceManager.destroy()
})

// 组件销毁时清理
onUnmounted(() => {
  smartLoader.destroy()
  unregisterCleanupCallback()
})
```

这个使用指南提供了实际集成和使用性能优化系统的具体方法，开发者可以根据需要选择性启用不同的优化功能。