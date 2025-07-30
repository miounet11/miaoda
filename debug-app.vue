<template>
  <div class="debug-app">
    <h1>MiaoDa Chat Debug Mode</h1>
    <p>如果你能看到这个页面，说明基础的Vue应用可以正常运行。</p>
    
    <div class="debug-info">
      <h2>调试信息:</h2>
      <ul>
        <li>环境: {{ isDev ? '开发环境' : '生产环境' }}</li>
        <li>Vue版本: {{ vueVersion }}</li>
        <li>当前时间: {{ currentTime }}</li>
        <li>平台: {{ platform }}</li>
      </ul>
    </div>

    <div class="test-sections">
      <div class="test-section">
        <h3>API测试</h3>
        <button @click="testAPI">测试window.api</button>
        <p v-if="apiResult">结果: {{ apiResult }}</p>
      </div>

      <div class="test-section">
        <h3>路由测试</h3>
        <button @click="testRouter">测试Vue Router</button>
        <p v-if="routerResult">当前路由: {{ routerResult }}</p>
      </div>

      <div class="test-section">
        <h3>状态管理测试</h3>
        <button @click="testStore">测试Pinia Store</button>
        <p v-if="storeResult">Store状态: {{ storeResult }}</p>
      </div>
    </div>

    <div class="error-section" v-if="errors.length > 0">
      <h3>检测到的错误:</h3>
      <ul>
        <li v-for="error in errors" :key="error">{{ error }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 响应式数据
const currentTime = ref(new Date().toLocaleString())
const apiResult = ref('')
const routerResult = ref('')
const storeResult = ref('')
const errors = ref<string[]>([])

// 计算属性
const isDev = computed(() => import.meta.env.DEV)
const vueVersion = computed(() => '3.x')
const platform = computed(() => navigator.platform)

// 更新时间
const updateTime = () => {
  currentTime.value = new Date().toLocaleString()
}

// 测试方法
const testAPI = () => {
  try {
    if (window.api) {
      apiResult.value = 'window.api 可用，包含以下方法: ' + Object.keys(window.api).join(', ')
    } else {
      apiResult.value = 'window.api 不可用 - 可能是预加载脚本问题'
      errors.value.push('window.api undefined')
    }
  } catch (error) {
    apiResult.value = '测试API时出错: ' + error.message
    errors.value.push('API测试错误: ' + error.message)
  }
}

const testRouter = () => {
  try {
    routerResult.value = router.currentRoute.value.path
  } catch (error) {
    routerResult.value = '路由测试失败: ' + error.message
    errors.value.push('路由错误: ' + error.message)
  }
}

const testStore = () => {
  try {
    // 尝试导入store
    storeResult.value = 'Store模块检查中...'
    import('./src/stores/index.ts').then(() => {
      storeResult.value = 'Pinia stores 导入成功'
    }).catch(error => {
      storeResult.value = 'Store导入失败: ' + error.message
      errors.value.push('Store错误: ' + error.message)
    })
  } catch (error) {
    storeResult.value = '测试Store时出错: ' + error.message
    errors.value.push('Store测试错误: ' + error.message)
  }
}

// 生命周期
onMounted(() => {
  // 定时更新时间
  setInterval(updateTime, 1000)
  
  // 自动运行测试
  setTimeout(() => {
    testAPI()
    testRouter()
    testStore()
  }, 1000)
  
  // 全局错误监听
  window.addEventListener('error', (event) => {
    errors.value.push(`全局错误: ${event.error?.message || event.message}`)
  })
  
  window.addEventListener('unhandledrejection', (event) => {
    errors.value.push(`未处理的Promise错误: ${event.reason}`)
  })
})
</script>

<style scoped>
.debug-app {
  padding: 20px;
  font-family: Arial, sans-serif;
  max-width: 800px;
  margin: 0 auto;
}

.debug-info {
  background: #f0f0f0;
  padding: 15px;
  border-radius: 5px;
  margin: 20px 0;
}

.test-sections {
  margin: 20px 0;
}

.test-section {
  background: #e8f4f8;
  padding: 15px;
  margin: 10px 0;
  border-radius: 5px;
}

.test-section button {
  background: #007cba;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.test-section button:hover {
  background: #005a8b;
}

.error-section {
  background: #ffe6e6;
  padding: 15px;
  border-radius: 5px;
  margin: 20px 0;
  border: 1px solid #ff9999;
}

.error-section ul {
  color: #cc0000;
}

h1 { color: #333; }
h2 { color: #666; }
h3 { color: #888; }
</style>