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
}

// Re-export stores
export { useChatStore } from './chat'
export { useUIStore } from './ui'
export { useSettingsStore } from './settings'
export { useAuthStore } from './auth'

// Store composition for complex operations
export const useStores = () => {
  const chat = useChatStore()
  const ui = useUIStore()
  const settings = useSettingsStore()
  const auth = useAuthStore()

  return {
    chat,
    ui,
    settings,
    auth
  }
}