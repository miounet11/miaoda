/**
 * Settings type definitions
 */
import type { KeyboardShortcuts } from './ui'

export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'ollama' | 'local' | 'custom'

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
  dataCollection: boolean
  crashReporting: boolean
  analytics: boolean
  saveConversations: boolean
  encryptData: boolean
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

export interface VoiceSettings {
  enabled: boolean
  language: string
  rate: number
  pitch: number
  volume: number
  autoPlay: boolean
}

export interface UISettings {
  fontSize: number
  fontFamily: string
  lineHeight: number
  messageSpacing: number
  animationsEnabled: boolean
}

export interface AppChatSettings {
  autoScroll: boolean
  enterToSend: boolean
  showWordCount: boolean
  spellCheck: boolean
  showTimestamps: boolean
  showAvatars: boolean
  compactMode: boolean
}

export interface LLMSettings {
  provider: LLMProvider
  apiKey: string
  endpoint: string
  model: string
  temperature: number
  maxTokens: number
  streaming: boolean
}

export interface PluginSettings {
  enabled: string[]
  settings: Record<string, any>
}

export interface AdvancedSettings {
  debugMode: boolean
  developmentMode: boolean
  experimentalFeatures: boolean
  betaFeatures: boolean
}

export interface AppSettings {
  llm: LLMSettings
  ui: UISettings
  chat: AppChatSettings
  privacy: PrivacySettings
  voice: VoiceSettings
  shortcuts: KeyboardShortcuts
  plugins: PluginSettings
  advanced: AdvancedSettings
}

export interface SettingsState extends LLMConfig, AppearanceSettings, BehaviorSettings, ShortcutSettings, PrivacySettings, NetworkSettings {
  llmProvider: LLMProvider
}