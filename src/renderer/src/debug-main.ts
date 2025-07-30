import { createApp } from 'vue'
import SimpleApp from './SimpleApp.vue'

console.log('开始初始化简化版App...')

try {
  const app = createApp(SimpleApp)
  
  console.log('Vue应用创建成功')
  
  app.mount('#app')
  
  console.log('Vue应用挂载成功')
  
} catch (error) {
  console.error('应用初始化失败:', error)
  
  // 在页面上显示错误
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h1 style="color: red;">应用启动失败</h1>
      <p><strong>错误信息:</strong> ${error.message}</p>
      <details>
        <summary>详细错误信息</summary>
        <pre style="background: #f5f5f5; padding: 10px; overflow: auto;">${error.stack}</pre>
      </details>
    </div>
  `
}