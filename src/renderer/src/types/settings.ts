/**
 * Settings type definitions
 */

export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'ollama' | 'custom'

export interface LLMConfig {
  provider: LLMProvider
  apiKey?: string
  apiEndpoint?: string
  modelName: string
  temperature?: number
  maxTokens?: number
  streamingEnabled?: boolean
  customHeaders?: Record<string, string>
}

export interface AppearanceSettings {
  fontSize: number
  fontFamily: string
  lineHeight: number
  messageSpacing: number
  showTimestamps: boolean
  showAvatars: boolean
  compactMode: boolean
  animationsEnabled: boolean
}

export interface BehaviorSettings {
  autoScroll: boolean
  enterToSend: boolean
  showWordCount: boolean
  spellCheck: boolean
  autoSave: boolean
  autoSaveInterval: number
}

export interface ShortcutSettings {
  newChat: string
  deleteChat: string
  searchChats: string
  toggleSidebar: string
  toggleTheme: string
  focusInput: string
  clearInput: string
  regenerateResponse: string
}

export interface PrivacySettings {
  sendAnalytics: boolean
  shareUsageData: boolean
  storeChatHistory: boolean
  allowAutoUpdates: boolean
}

export interface NetworkSettings {
  proxyEnabled: boolean
  proxyHost?: string
  proxyPort?: number
  proxyAuth?: boolean
  proxyUsername?: string
  proxyPassword?: string
  connectionTimeout: number
  retryAttempts: number
  retryDelay: number
}

export interface AppSettings {
  llm: LLMConfig
  appearance: AppearanceSettings
  behavior: BehaviorSettings
  shortcuts: ShortcutSettings
  privacy: PrivacySettings
  network: NetworkSettings
  version: string
  lastUpdated: Date
}

export interface SettingsState extends LLMConfig, AppearanceSettings, BehaviorSettings, ShortcutSettings, PrivacySettings, NetworkSettings {
  llmProvider: LLMProvider
}