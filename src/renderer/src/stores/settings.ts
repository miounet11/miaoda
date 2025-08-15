import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LLMProvider, AppSettings, KeyboardShortcuts } from '@renderer/src/types'
import { useCustomProvidersStore } from './customProviders'

export const useSettingsStore = defineStore('settings', () => {
  // State
  const llmProvider = ref<LLMProvider>('openai')
  const apiKey = ref('')
  const apiEndpoint = ref('')
  const modelName = ref('gpt-4')
  const temperature = ref(0.7)
  const maxTokens = ref(2048)
  const streamingEnabled = ref(true)
  
  // UI Settings
  const fontSize = ref(14)
  const fontFamily = ref('Inter')
  const lineHeight = ref(1.5)
  const messageSpacing = ref(16)
  const showTimestamps = ref(true)
  const showAvatars = ref(true)
  const compactMode = ref(false)
  const animationsEnabled = ref(true)
  
  // Chat Settings
  const autoScroll = ref(true)
  const enterToSend = ref(true)
  const showWordCount = ref(false)
  const spellCheck = ref(true)
  const autoSave = ref(true)
  const autoSaveInterval = ref(30) // seconds
  
  // Privacy Settings
  const dataCollection = ref(false)
  const crashReporting = ref(true)
  const analytics = ref(false)
  const saveConversations = ref(true)
  const encryptData = ref(false)
  const sendAnalytics = ref(false)
  const shareUsageData = ref(false)
  const storeChatHistory = ref(true)
  const allowAutoUpdates = ref(true)
  
  // Voice Settings
  const voiceEnabled = ref(false)
  const voiceLanguage = ref('en-US')
  const voiceRate = ref(1.0)
  const voicePitch = ref(1.0)
  const voiceVolume = ref(1.0)
  const voiceAutoPlay = ref(false)
  
  // Keyboard Shortcuts
  const keyboardShortcuts = ref<KeyboardShortcuts>({
    newChat: 'cmd+n',
    openSettings: 'cmd+,',
    toggleSidebar: 'cmd+/',
    focusInput: 'cmd+k',
    sendMessage: 'cmd+enter',
    searchChats: 'cmd+f',
    nextChat: 'cmd+down',
    prevChat: 'cmd+up',
    clearChat: 'cmd+shift+c',
    exportChat: 'cmd+e'
  })
  
  // Advanced Settings
  const debugMode = ref(false)
  const developmentMode = ref(false)
  const experimentalFeatures = ref(false)
  const betaFeatures = ref(false)
  
  // Plugin Settings
  const enabledPlugins = ref<string[]>([])
  const pluginSettings = ref<Map<string, any>>(new Map())
  
  // Backup Settings
  const autoBackup = ref(false)
  const backupInterval = ref('daily')
  const backupLocation = ref('')
  const maxBackups = ref(5)
  
  // Computed
  const isConfigured = computed(() => {
    return apiKey.value.length > 0 && modelName.value.length > 0
  })
  
  const currentModel = computed(() => {
    return `${llmProvider.value}:${modelName.value}`
  })
  
  const chatSettings = computed(() => ({
    autoScroll: autoScroll.value,
    enterToSend: enterToSend.value,
    showWordCount: showWordCount.value,
    spellCheck: spellCheck.value,
    showTimestamps: showTimestamps.value,
    showAvatars: showAvatars.value,
    compactMode: compactMode.value
  }))
  
  const llmSettings = computed(() => ({
    provider: llmProvider.value,
    apiKey: apiKey.value,
    endpoint: apiEndpoint.value,
    model: modelName.value,
    temperature: temperature.value,
    maxTokens: maxTokens.value,
    streaming: streamingEnabled.value
  }))
  
  const uiSettings = computed(() => ({
    fontSize: fontSize.value,
    fontFamily: fontFamily.value,
    lineHeight: lineHeight.value,
    messageSpacing: messageSpacing.value,
    animationsEnabled: animationsEnabled.value
  }))
  
  const privacySettings = computed(() => ({
    dataCollection: dataCollection.value,
    crashReporting: crashReporting.value,
    analytics: analytics.value,
    saveConversations: saveConversations.value,
    encryptData: encryptData.value,
    sendAnalytics: sendAnalytics.value,
    shareUsageData: shareUsageData.value,
    storeChatHistory: storeChatHistory.value,
    allowAutoUpdates: allowAutoUpdates.value
  }))
  
  const voiceSettings = computed(() => ({
    enabled: voiceEnabled.value,
    language: voiceLanguage.value,
    rate: voiceRate.value,
    pitch: voicePitch.value,
    volume: voiceVolume.value,
    autoPlay: voiceAutoPlay.value
  }))

  // Custom Providers integration
  const customProvidersStore = useCustomProvidersStore()
  
  const allProviders = computed(() => {
    const standardProviders = [
      { id: 'openai', name: 'OpenAI', displayName: 'OpenAI', isCustom: false },
      { id: 'anthropic', name: 'Anthropic', displayName: 'Claude', isCustom: false },
      { id: 'google', name: 'Google', displayName: 'Google Gemini', isCustom: false },
      { id: 'local', name: 'Local', displayName: 'Local (Ollama)', isCustom: false }
    ]
    
    const customProviders = customProvidersStore.providerOptions.map(provider => ({
      ...provider,
      isCustom: true
    }))
    
    return [...standardProviders, ...customProviders]
  })

  const isCustomProvider = computed(() => {
    return customProvidersStore.providerOptions.some(p => p.id === llmProvider.value)
  })

  const currentProviderConfig = computed(() => {
    if (isCustomProvider.value) {
      return customProvidersStore.getProviderConfig(llmProvider.value)
    }
    return null
  })
  
  // Actions
  const setLLMProvider = (provider: LLMProvider) => {
    llmProvider.value = provider
    
    // Set default endpoints and models for each provider
    switch (provider) {
      case 'openai':
        apiEndpoint.value = 'https://api.openai.com/v1'
        modelName.value = 'gpt-4'
        break
      case 'anthropic':
        apiEndpoint.value = 'https://api.anthropic.com'
        modelName.value = 'claude-3-sonnet-20240229'
        break
      case 'google':
        apiEndpoint.value = 'https://generativelanguage.googleapis.com'
        modelName.value = 'gemini-pro'
        break
      case 'local':
        apiEndpoint.value = 'http://localhost:11434'
        modelName.value = 'llama2'
        break
      case 'custom':
        // Keep existing values
        break
    }
  }
  
  const setApiKey = (key: string) => {
    apiKey.value = key
  }
  
  const setApiEndpoint = (endpoint: string) => {
    apiEndpoint.value = endpoint
  }
  
  const setModelName = (model: string) => {
    modelName.value = model
  }
  
  const setTemperature = (temp: number) => {
    temperature.value = Math.max(0, Math.min(2, temp))
  }
  
  const setMaxTokens = (tokens: number) => {
    maxTokens.value = Math.max(1, Math.min(8192, tokens))
  }
  
  const setStreamingEnabled = (enabled: boolean) => {
    streamingEnabled.value = enabled
  }
  
  const setFontSize = (size: number) => {
    fontSize.value = Math.max(10, Math.min(24, size))
    document.documentElement.style.setProperty('--font-size-base', `${size}px`)
  }
  
  const setFontFamily = (family: string) => {
    fontFamily.value = family
    document.documentElement.style.setProperty('--font-family-base', family)
  }
  
  const setLineHeight = (height: number) => {
    lineHeight.value = Math.max(1.0, Math.min(2.0, height))
    document.documentElement.style.setProperty('--line-height-base', height.toString())
  }
  
  const setMessageSpacing = (spacing: number) => {
    messageSpacing.value = Math.max(8, Math.min(32, spacing))
    document.documentElement.style.setProperty('--message-spacing', `${spacing}px`)
  }
  
  const toggleCompactMode = () => {
    compactMode.value = !compactMode.value
    document.documentElement.classList.toggle('compact-mode', compactMode.value)
  }
  
  const setAnimationsEnabled = (enabled: boolean) => {
    animationsEnabled.value = enabled
    document.documentElement.classList.toggle('no-animations', !enabled)
  }
  
  const updateKeyboardShortcut = (action: keyof KeyboardShortcuts, shortcut: string) => {
    keyboardShortcuts.value[action] = shortcut
  }
  
  const resetKeyboardShortcuts = () => {
    keyboardShortcuts.value = {
      newChat: 'cmd+n',
      openSettings: 'cmd+,',
      toggleSidebar: 'cmd+/',
      focusInput: 'cmd+k',
      sendMessage: 'cmd+enter',
      searchChats: 'cmd+f',
      nextChat: 'cmd+down',
      prevChat: 'cmd+up',
      clearChat: 'cmd+shift+c',
      exportChat: 'cmd+e'
    }
  }
  
  const enablePlugin = (pluginId: string) => {
    if (!enabledPlugins.value.includes(pluginId)) {
      enabledPlugins.value.push(pluginId)
    }
  }
  
  const disablePlugin = (pluginId: string) => {
    const index = enabledPlugins.value.indexOf(pluginId)
    if (index > -1) {
      enabledPlugins.value.splice(index, 1)
    }
  }
  
  const setPluginSetting = (pluginId: string, key: string, value: any) => {
    const pluginConfig = pluginSettings.value.get(pluginId) || {}
    pluginConfig[key] = value
    pluginSettings.value.set(pluginId, pluginConfig)
  }
  
  const getPluginSetting = (pluginId: string, key: string, defaultValue?: any) => {
    const pluginConfig = pluginSettings.value.get(pluginId) || {}
    return pluginConfig[key] ?? defaultValue
  }
  
  const validateSettings = () => {
    const errors: string[] = []
    
    if (!apiKey.value && llmProvider.value !== 'local') {
      errors.push('API key is required')
    }
    
    if (!apiEndpoint.value) {
      errors.push('API endpoint is required')
    }
    
    if (!modelName.value) {
      errors.push('Model name is required')
    }
    
    if (temperature.value < 0 || temperature.value > 2) {
      errors.push('Temperature must be between 0 and 2')
    }
    
    if (maxTokens.value < 1 || maxTokens.value > 8192) {
      errors.push('Max tokens must be between 1 and 8192')
    }
    
    return errors
  }
  
  const exportSettings = () => {
    const settings: AppSettings = {
      llm: llmSettings.value,
      ui: uiSettings.value,
      chat: chatSettings.value,
      privacy: privacySettings.value,
      voice: voiceSettings.value,
      shortcuts: keyboardShortcuts.value,
      plugins: {
        enabled: enabledPlugins.value,
        settings: Object.fromEntries(pluginSettings.value)
      },
      advanced: {
        debugMode: debugMode.value,
        developmentMode: developmentMode.value,
        experimentalFeatures: experimentalFeatures.value,
        betaFeatures: betaFeatures.value
      }
    }
    
    return JSON.stringify(settings, null, 2)
  }
  
  const importSettings = (settingsJson: string) => {
    try {
      const settings: AppSettings = JSON.parse(settingsJson)
      
      // LLM Settings
      if (settings.llm) {
        llmProvider.value = settings.llm.provider
        apiKey.value = settings.llm.apiKey
        apiEndpoint.value = settings.llm.endpoint
        modelName.value = settings.llm.model
        temperature.value = settings.llm.temperature
        maxTokens.value = settings.llm.maxTokens
        streamingEnabled.value = settings.llm.streaming
      }
      
      // UI Settings
      if (settings.ui) {
        setFontSize(settings.ui.fontSize)
        setFontFamily(settings.ui.fontFamily)
        setLineHeight(settings.ui.lineHeight)
        setMessageSpacing(settings.ui.messageSpacing)
        setAnimationsEnabled(settings.ui.animationsEnabled)
      }
      
      // Chat Settings
      if (settings.chat) {
        autoScroll.value = settings.chat.autoScroll
        enterToSend.value = settings.chat.enterToSend
        showWordCount.value = settings.chat.showWordCount
        spellCheck.value = settings.chat.spellCheck
        showTimestamps.value = settings.chat.showTimestamps
        showAvatars.value = settings.chat.showAvatars
        compactMode.value = settings.chat.compactMode
      }
      
      // Privacy Settings
      if (settings.privacy) {
        dataCollection.value = settings.privacy.dataCollection
        crashReporting.value = settings.privacy.crashReporting
        analytics.value = settings.privacy.analytics
        saveConversations.value = settings.privacy.saveConversations
        encryptData.value = settings.privacy.encryptData
      }
      
      // Voice Settings
      if (settings.voice) {
        voiceEnabled.value = settings.voice.enabled
        voiceLanguage.value = settings.voice.language
        voiceRate.value = settings.voice.rate
        voicePitch.value = settings.voice.pitch
        voiceVolume.value = settings.voice.volume
        voiceAutoPlay.value = settings.voice.autoPlay
      }
      
      // Keyboard Shortcuts
      if (settings.shortcuts) {
        keyboardShortcuts.value = { ...keyboardShortcuts.value, ...settings.shortcuts }
      }
      
      // Plugins
      if (settings.plugins) {
        enabledPlugins.value = settings.plugins.enabled || []
        pluginSettings.value = new Map(Object.entries(settings.plugins.settings || {}))
      }
      
      // Advanced Settings
      if (settings.advanced) {
        debugMode.value = settings.advanced.debugMode
        developmentMode.value = settings.advanced.developmentMode
        experimentalFeatures.value = settings.advanced.experimentalFeatures
        betaFeatures.value = settings.advanced.betaFeatures
      }
      
      return true
    } catch (error) {
      console.error('Failed to import settings:', error)
      return false
    }
  }
  
  const resetToDefaults = () => {
    // LLM Settings
    llmProvider.value = 'openai'
    apiKey.value = ''
    apiEndpoint.value = 'https://api.openai.com/v1'
    modelName.value = 'gpt-4'
    temperature.value = 0.7
    maxTokens.value = 2048
    streamingEnabled.value = true
    
    // UI Settings
    setFontSize(14)
    setFontFamily('Inter')
    setLineHeight(1.5)
    setMessageSpacing(16)
    showTimestamps.value = true
    showAvatars.value = true
    compactMode.value = false
    setAnimationsEnabled(true)
    
    // Chat Settings
    autoScroll.value = true
    enterToSend.value = true
    showWordCount.value = false
    spellCheck.value = true
    autoSave.value = true
    autoSaveInterval.value = 30
    
    // Privacy Settings
    dataCollection.value = false
    crashReporting.value = true
    analytics.value = false
    saveConversations.value = true
    encryptData.value = false
    
    // Voice Settings
    voiceEnabled.value = false
    voiceLanguage.value = 'en-US'
    voiceRate.value = 1.0
    voicePitch.value = 1.0
    voiceVolume.value = 1.0
    voiceAutoPlay.value = false
    
    // Keyboard Shortcuts
    resetKeyboardShortcuts()
    
    // Advanced Settings
    debugMode.value = false
    developmentMode.value = false
    experimentalFeatures.value = false
    betaFeatures.value = false
    
    // Plugins
    enabledPlugins.value = []
    pluginSettings.value.clear()
  }
  
  const initialize = async () => {
    // Apply UI settings
    setFontSize(fontSize.value)
    setFontFamily(fontFamily.value)
    setLineHeight(lineHeight.value)
    setMessageSpacing(messageSpacing.value)
    setAnimationsEnabled(animationsEnabled.value)
    
    if (compactMode.value) {
      document.documentElement.classList.add('compact-mode')
    }

    // Initialize custom providers
    await customProvidersStore.initialize()
  }

  // Custom Provider Actions
  const refreshCustomProviders = async () => {
    await customProvidersStore.fetchProviders()
  }

  const getProviderForSelection = (providerId: string) => {
    return allProviders.value.find(p => p.id === providerId)
  }

  const validateProviderConfiguration = async (providerId: string) => {
    const provider = getProviderForSelection(providerId)
    if (!provider) return false

    if (provider.isCustom) {
      // Check custom provider health
      return await customProvidersStore.checkProviderHealth(providerId)
    } else {
      // Validate standard provider settings
      const errors = validateSettings()
      return errors.length === 0
    }
  }
  
  return {
    // State
    llmProvider,
    apiKey,
    apiEndpoint,
    modelName,
    temperature,
    maxTokens,
    streamingEnabled,
    fontSize,
    fontFamily,
    lineHeight,
    messageSpacing,
    showTimestamps,
    showAvatars,
    compactMode,
    animationsEnabled,
    autoScroll,
    enterToSend,
    showWordCount,
    spellCheck,
    autoSave,
    autoSaveInterval,
    dataCollection,
    crashReporting,
    analytics,
    saveConversations,
    encryptData,
    voiceEnabled,
    voiceLanguage,
    voiceRate,
    voicePitch,
    voiceVolume,
    voiceAutoPlay,
    keyboardShortcuts,
    debugMode,
    developmentMode,
    experimentalFeatures,
    betaFeatures,
    enabledPlugins,
    autoBackup,
    backupInterval,
    backupLocation,
    maxBackups,
    
    // Computed
    isConfigured,
    currentModel,
    chatSettings,
    llmSettings,
    uiSettings,
    privacySettings,
    voiceSettings,
    allProviders,
    isCustomProvider,
    currentProviderConfig,
    
    // Actions
    setLLMProvider,
    setApiKey,
    setApiEndpoint,
    setModelName,
    setTemperature,
    setMaxTokens,
    setStreamingEnabled,
    setFontSize,
    setFontFamily,
    setLineHeight,
    setMessageSpacing,
    toggleCompactMode,
    setAnimationsEnabled,
    updateKeyboardShortcut,
    resetKeyboardShortcuts,
    enablePlugin,
    disablePlugin,
    setPluginSetting,
    getPluginSetting,
    validateSettings,
    exportSettings,
    importSettings,
    resetToDefaults,
    initialize,
    refreshCustomProviders,
    getProviderForSelection,
    validateProviderConfiguration
  }
}, {
  persist: {
    key: 'miaoda-settings-store',
    storage: localStorage
  }
})