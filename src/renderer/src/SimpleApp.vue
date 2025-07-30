<template>
  <div class="simple-app">
    <div class="header">
      <h1>MiaoDa Chat</h1>
      <p>应用正在加载...</p>
    </div>
    
    <div class="content">
      <router-view />
    </div>
    
    <!-- 错误显示 -->
    <div v-if="error" class="error-display">
      <h3>启动错误:</h3>
      <p>{{ error }}</p>
      <button @click="retry">重试</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onErrorCaptured } from 'vue'

const error = ref<string | null>(null)

const retry = () => {
  error.value = null
  location.reload()
}

onMounted(() => {
  console.log('SimpleApp mounted successfully')
})

// 捕获组件错误
onErrorCaptured((err: any) => {
  error.value = err.message || '未知错误'
  console.error('Component error:', err)
  return false
})

// 全局错误监听
window.addEventListener('error', (event) => {
  error.value = event.error?.message || event.message
})

window.addEventListener('unhandledrejection', (event) => {
  error.value = `Promise rejection: ${event.reason}`
})
</script>

<style scoped>
.simple-app {
  min-height: 100vh;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.header h1 {
  color: #333;
  margin-bottom: 10px;
}

.content {
  max-width: 800px;
  margin: 0 auto;
}

.error-display {
  background: #ffebee;
  border: 1px solid #f44336;
  border-radius: 4px;
  padding: 16px;
  margin: 20px 0;
  color: #c62828;
}

.error-display button {
  background: #f44336;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.error-display button:hover {
  background: #d32f2f;
}
</style>