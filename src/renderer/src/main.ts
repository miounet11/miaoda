import { createApp } from 'vue'
// 临时使用简化版本来调试启动问题
import App from './SimpleApp.vue'
// import App from './App.vue'
import router from './router'
import { pinia } from './stores'
import './assets/css/main.css'

const app = createApp(App)

app.use(pinia)
app.use(router)

app.mount('#app')