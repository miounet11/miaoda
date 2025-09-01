import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { pinia } from './stores'
import { setupI18n } from './services/i18n'
import './assets/css/main.css' // 🏆 Tailwind CSS 基础样式
import './styles/unified-design-system.css' // 🏆 统一样式设计系统
import './styles/z-index-system.css' // 🏆 统一Z-Index管理系统

// Initialize error boundary service early to catch all errors
import { errorBoundary } from './utils/ErrorBoundary'
import { logger } from './utils/Logger'

const app = createApp(App)

// Setup i18n with our comprehensive service
setupI18n(app)

// Global error handler for Vue
app.config.errorHandler = (error, _instance, info) => {
  errorBoundary.handleComponentError(error, _instance?.$?.type?.name || 'UnknownComponent', { info })
}

// Global warning handler for Vue
app.config.warnHandler = (msg, _instance, trace) => {
  if (
    msg.includes('value.replace is not a function') ||
    msg.includes('Invalid date') ||
    msg.includes('MCP server') ||
    msg.includes('server.id')
  ) {
    // Suppress known recurring warnings that we're already handling
    return
  }
  logger.warn('Vue warning', 'VueApp', { msg, trace })
}

app.use(pinia)
app.use(router)
// i18n is already setup above

logger.info('Application initializing', 'Main', {
  errorBoundaryActive: true,
  version: import.meta.env.VITE_APP_VERSION || 'development'
})

app.mount('#app')
