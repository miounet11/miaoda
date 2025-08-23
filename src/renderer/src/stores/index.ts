import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'

// Re-export stores first
export { useChatStore } from './chat'
export { useUIStore } from './ui'
export { useSettingsStore } from './settings'
export { useAuthStore } from './auth'
export { useCustomProvidersStore } from './customProviders'
export { useAnalyticsStore } from './analytics'

// Import stores after re-exporting them
import { useChatStore } from './chat'
import { useUIStore } from './ui'
import { useSettingsStore } from './settings'
import { useAuthStore } from './auth'
import { useCustomProvidersStore } from './customProviders'
import { useAnalyticsStore } from './analytics'

// Create pinia instance
export const pinia = createPinia()

// Configure persistence plugin
pinia.use(
  createPersistedState({
    storage: localStorage,
    debug: import.meta.env.DEV,
    serializer: {
      serialize: JSON.stringify,
      deserialize: JSON.parse
    }
  })
)

// Export store types for better TypeScript support
export type StoreState = {
  chat: ReturnType<typeof useChatStore>
  ui: ReturnType<typeof useUIStore>
  settings: ReturnType<typeof useSettingsStore>
  auth: ReturnType<typeof useAuthStore>
  customProviders: ReturnType<typeof useCustomProvidersStore>
  analytics: ReturnType<typeof useAnalyticsStore>
}

// Store composition for complex operations
export const useStores = () => {
  const chat = useChatStore()
  const ui = useUIStore()
  const settings = useSettingsStore()
  const auth = useAuthStore()
  const customProviders = useCustomProvidersStore()
  const analytics = useAnalyticsStore()

  return {
    chat,
    ui,
    settings,
    auth,
    customProviders,
    analytics
  }
}
