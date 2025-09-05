import { ref, computed } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useSettingsStore } from '@/stores/settings'
import { providers } from '@/config/providers'

export interface ConfigPrompt {
  id: string
  type: 'api-key' | 'provider-setup' | 'first-configuration' | 'model-unavailable'
  provider?: string
  model?: string
  priority: number
  autoDismiss?: number
  showImmediately?: boolean
}

const activePrompts = ref<ConfigPrompt[]>([])
const dismissedPrompts = ref<Set<string>>(new Set())

export function useConfigPrompts() {
  const chatStore = useChatStore()
  const settingsStore = useSettingsStore()

  // Check if a provider requires API key configuration
  const isProviderConfigured = (providerId: string) => {
    const provider = providers.find(p => p.id === providerId)
    if (!provider) return false
    
    if (!provider.apiKeyRequired) return true // Free providers are always configured
    
    // Check if API key is set (this would need to be implemented in settings)
    // For now, we'll assume providers with apiKeyRequired need configuration
    return false
  }

  // Generate appropriate prompts based on current state
  const generatePrompts = (): ConfigPrompt[] => {
    const prompts: ConfigPrompt[] = []
    const currentProvider = chatStore.currentProvider
    const currentModel = chatStore.currentModel
    
    // Check if current provider needs configuration
    if (currentProvider && !isProviderConfigured(currentProvider)) {
      const provider = providers.find(p => p.id === currentProvider)
      if (provider?.apiKeyRequired) {
        prompts.push({
          id: `api-key-${currentProvider}`,
          type: 'api-key',
          provider: provider.name,
          priority: 1,
          autoDismiss: 30
        })
      }
    }

    // Check if selected model is unavailable
    if (currentProvider && currentModel) {
      const provider = providers.find(p => p.id === currentProvider)
      const model = provider?.models.find(m => m.id === currentModel)
      
      if (provider?.apiKeyRequired && !isProviderConfigured(currentProvider)) {
        prompts.push({
          id: `model-unavailable-${currentModel}`,
          type: 'model-unavailable',
          provider: provider.name,
          model: model?.name || currentModel,
          priority: 2,
          autoDismiss: 20
        })
      }
    }

    // Check for first-time configuration
    const hasCompletedWelcome = settingsStore.settings.general?.hasCompletedWelcome
    if (!hasCompletedWelcome) {
      prompts.push({
        id: 'first-configuration',
        type: 'first-configuration',
        priority: 0, // Highest priority
        showImmediately: true
      })
    }

    // Filter out dismissed prompts
    return prompts
      .filter(prompt => !dismissedPrompts.value.has(prompt.id))
      .sort((a, b) => a.priority - b.priority)
  }

  // Add a new prompt
  const addPrompt = (prompt: ConfigPrompt) => {
    if (dismissedPrompts.value.has(prompt.id)) return
    
    const existingIndex = activePrompts.value.findIndex(p => p.id === prompt.id)
    if (existingIndex >= 0) {
      activePrompts.value[existingIndex] = prompt
    } else {
      activePrompts.value.push(prompt)
      activePrompts.value.sort((a, b) => a.priority - b.priority)
    }
  }

  // Remove a prompt
  const removePrompt = (promptId: string) => {
    const index = activePrompts.value.findIndex(p => p.id === promptId)
    if (index >= 0) {
      activePrompts.value.splice(index, 1)
    }
  }

  // Dismiss a prompt (won't show again in this session)
  const dismissPrompt = (promptId: string, persistent = false) => {
    removePrompt(promptId)
    if (persistent) {
      dismissedPrompts.value.add(promptId)
      // Could also persist to localStorage here
      localStorage.setItem('dismissed-config-prompts', JSON.stringify([...dismissedPrompts.value]))
    }
  }

  // Show API key configuration prompt
  const showApiKeyPrompt = (providerId: string, autoDismiss = 30) => {
    const provider = providers.find(p => p.id === providerId)
    if (!provider) return

    addPrompt({
      id: `api-key-${providerId}`,
      type: 'api-key',
      provider: provider.name,
      priority: 1,
      autoDismiss
    })
  }

  // Show model unavailable prompt
  const showModelUnavailablePrompt = (providerId: string, modelId: string, autoDismiss = 20) => {
    const provider = providers.find(p => p.id === providerId)
    const model = provider?.models.find(m => m.id === modelId)
    
    addPrompt({
      id: `model-unavailable-${modelId}`,
      type: 'model-unavailable',
      provider: provider?.name,
      model: model?.name || modelId,
      priority: 2,
      autoDismiss
    })
  }

  // Show first configuration prompt
  const showFirstConfigPrompt = () => {
    addPrompt({
      id: 'first-configuration',
      type: 'first-configuration',
      priority: 0,
      showImmediately: true
    })
  }

  // Check and show relevant prompts
  const checkAndShowPrompts = () => {
    const newPrompts = generatePrompts()
    newPrompts.forEach(addPrompt)
  }

  // Get the highest priority active prompt
  const currentPrompt = computed(() => {
    return activePrompts.value[0] || null
  })

  // Initialize from persisted dismissed prompts
  const initialize = () => {
    const stored = localStorage.getItem('dismissed-config-prompts')
    if (stored) {
      try {
        const dismissed = JSON.parse(stored)
        dismissedPrompts.value = new Set(dismissed)
      } catch (e) {
        console.warn('Failed to parse dismissed config prompts')
      }
    }
    
    // Check for prompts after initialization
    setTimeout(checkAndShowPrompts, 1000)
  }

  // Clear all dismissed prompts (for testing)
  const clearDismissedPrompts = () => {
    dismissedPrompts.value.clear()
    localStorage.removeItem('dismissed-config-prompts')
  }

  return {
    // State
    activePrompts: computed(() => activePrompts.value),
    currentPrompt,
    
    // Methods
    addPrompt,
    removePrompt,
    dismissPrompt,
    showApiKeyPrompt,
    showModelUnavailablePrompt,
    showFirstConfigPrompt,
    checkAndShowPrompts,
    initialize,
    clearDismissedPrompts,
    
    // Utilities
    isProviderConfigured
  }
}