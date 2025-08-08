import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'

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
  recommendation: ReturnType<typeof useRecommendationStore>
}

// Re-export stores
export { useChatStore } from './chat'
export { useUIStore } from './ui'
export { useSettingsStore } from './settings'
export { useAuthStore } from './auth'
export { useCustomProvidersStore } from './customProviders'
export { useAnalyticsStore } from './analytics'
export { useRecommendationStore } from './recommendation'

// Store composition for complex operations
export const useStores = () => {
  const chat = useChatStore()
  const ui = useUIStore()
  const settings = useSettingsStore()
  const auth = useAuthStore()
  const customProviders = useCustomProvidersStore()
  const analytics = useAnalyticsStore()
  const recommendation = useRecommendationStore()

  return {
    chat,
    ui,
    settings,
    auth,
    customProviders,
    analytics,
    recommendation
  }
}