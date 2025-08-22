import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import App from './App.vue'
import router from './router'
import { pinia } from './stores'
import en from './locales/en'
import zh from './locales/zh-CN'
import ja from './locales/ja'
import hi from './locales/hi'
import './assets/css/main.css'
import './styles/mobile-improvements.css'
import './styles/micro-interactions.css'
import './styles/layout-optimizations.css'
import './styles/sidebar-enhancements.css' // Enhanced sidebar visibility and interactions
import './assets/css/stable-animations.css' // Override problematic scale animations

// Initialize error boundary service early to catch all errors
import { errorBoundary } from './utils/ErrorBoundary'
import { logger } from './utils/Logger'

const app = createApp(App)

const i18n = createI18n({
  legacy: false,
  locale: 'zh',
  fallbackLocale: 'en',
  messages: {
    en,
    zh,
    ja,
    hi
  }
})

// Global error handler for Vue
app.config.errorHandler = (error, instance, info) => {
  errorBoundary.handleComponentError(error, instance?.$?.type?.name || 'UnknownComponent', { info })
}

// Global warning handler for Vue
app.config.warnHandler = (msg, instance, trace) => {
  if (msg.includes('value.replace is not a function') || 
      msg.includes('Invalid date') ||
      msg.includes('MCP server') ||
      msg.includes('server.id')) {
    // Suppress known recurring warnings that we're already handling
    return
  }
  logger.warn('Vue warning', 'VueApp', { msg, trace })
}

app.use(pinia)
app.use(router)
app.use(i18n)

logger.info('Application initializing', 'Main', { 
  errorBoundaryActive: true,
  version: import.meta.env.VITE_APP_VERSION || 'development'
})

app.mount('#app')
