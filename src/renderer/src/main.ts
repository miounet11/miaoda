import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { pinia } from './stores'
import { setupI18n } from './services/i18n'
import './assets/css/main.css'
import './styles/micro-interaction-system.css' // 新的统一微交互系统
import './styles/button-system-enhanced.css' // 按钮系统增强
import './styles/input-system-enhanced.css' // 输入框系统增强
import './styles/mobile-improvements.css'
import './styles/micro-interactions.css'
import './styles/layout-optimizations.css'
import './styles/sidebar-enhancements.css' // Enhanced sidebar visibility and interactions
import './assets/css/stable-animations.css' // Override problematic scale animations

// Initialize error boundary service early to catch all errors
import { errorBoundary } from './utils/ErrorBoundary'
import { logger } from './utils/Logger'

const app = createApp(App)

// Setup i18n with our comprehensive service
setupI18n(app)

// Global error handler for Vue
app.config.errorHandler = (error, instance, info) => {
  errorBoundary.handleComponentError(error, instance?.$?.type?.name || 'UnknownComponent', { info })
}

// Global warning handler for Vue
app.config.warnHandler = (msg, instance, trace) => {
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
