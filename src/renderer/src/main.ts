import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import App from './App.vue'
import router from './router'
import { pinia } from './stores'
import en from './locales/en'
import zh from './locales/zh-CN'
import './assets/css/main.css'
import './styles/mobile-improvements.css'

const app = createApp(App)

const i18n = createI18n({
  legacy: false,
  locale: 'zh',
  fallbackLocale: 'en',
  messages: {
    en,
    zh
  }
})

app.use(pinia)
app.use(router)
app.use(i18n)

app.mount('#app')
