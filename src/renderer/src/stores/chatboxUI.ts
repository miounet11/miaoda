import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface BotTemplate {
  id: string
  name: string
  icon?: string
  description?: string
  systemPrompt: string
  category: 'example' | 'custom' | 'official'
}

export const useChatboxUIStore = defineStore('chatboxUI', () => {
  // UI State
  const sidebarCollapsed = ref(false)
  const currentSessionId = ref<string | null>(null)
  const selectedTemplate = ref<BotTemplate | null>(null)
  const modelSelectorOpen = ref(false)
  const selectedModel = ref<string>('miaochat')
  const shouldFocusInput = ref(false)
  const showModelSelector = ref(false)
  
  // Actions
  const setSidebarCollapsed = (collapsed: boolean) => {
    sidebarCollapsed.value = collapsed
  }
  
  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }
  
  const setCurrentSession = (sessionId: string | null) => {
    currentSessionId.value = sessionId
  }
  
  const setSelectedTemplate = (template: BotTemplate | null) => {
    selectedTemplate.value = template
  }
  
  const toggleModelSelector = () => {
    modelSelectorOpen.value = !modelSelectorOpen.value
  }
  
  const setSelectedModel = (model: string) => {
    selectedModel.value = model
  }
  
  const setShouldFocusInput = (focus: boolean) => {
    shouldFocusInput.value = focus
  }
  
  const setShowModelSelector = (show: boolean) => {
    showModelSelector.value = show
  }
  
  // Reset UI state
  const resetUIState = () => {
    currentSessionId.value = null
    selectedTemplate.value = null
    modelSelectorOpen.value = false
    shouldFocusInput.value = false
    showModelSelector.value = false
  }
  
  return {
    // State
    sidebarCollapsed,
    currentSessionId,
    selectedTemplate,
    modelSelectorOpen,
    selectedModel,
    shouldFocusInput,
    showModelSelector,
    
    // Actions
    setSidebarCollapsed,
    toggleSidebar,
    setCurrentSession,
    setSelectedTemplate,
    toggleModelSelector,
    setSelectedModel,
    setShouldFocusInput,
    setShowModelSelector,
    resetUIState
  }
}, {
  persist: {
    // Only persist certain UI preferences
    paths: ['sidebarCollapsed', 'selectedModel']
  }
})