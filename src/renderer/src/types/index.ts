// Re-export all types for easy importing
export * from './chat'
export * from './ui'
export type { APIError } from './api'
export * from '../../../types/analytics'
export * from './recommendation'
export * from './settings'

// Utility types
export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type Maybe<T> = T | null | undefined

// Make all properties optional
export type Partial<T> = {
  [P in keyof T]?: T[P]
}

// Make all properties required
export type Required<T> = {
  [P in keyof T]-?: T[P]
}

// Pick only certain properties
export type Pick<T, K extends keyof T> = {
  [P in K]: T[P]
}

// Omit certain properties
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

// Deep partial - make all nested properties optional
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// Deep required - make all nested properties required
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P]
}

// Get value type from array
export type ArrayElement<T extends readonly unknown[]> = T extends readonly (infer E)[] ? E : never

// Get value type from Promise
export type PromiseType<T extends Promise<any>> = T extends Promise<infer U> ? U : never

// Function types
export type EventHandler<T = any> = (event: T) => void
export type AsyncEventHandler<T = any> = (event: T) => Promise<void>
export type Callback<T = void> = () => T
export type AsyncCallback<T = void> = () => Promise<T>

// ID types for better type safety
export type ChatId = string & { readonly __brand: unique symbol }
export type MessageId = string & { readonly __brand: unique symbol }
export type UserId = string & { readonly __brand: unique symbol }
export type ProviderId = string & { readonly __brand: unique symbol }
export type ModelId = string & { readonly __brand: unique symbol }

// Brand utility function
export function createId<T extends string>(id: string): T {
  return id as T
}

// Component ref types
export type ComponentRef<T = any> = {
  $el: HTMLElement
} & T

// Event types
export interface CustomEvent<T = any> {
  type: string
  detail: T
  target: EventTarget | null
  currentTarget: EventTarget | null
  preventDefault(): void
  stopPropagation(): void
}

// API response wrapper
export interface APIResponse<T = any> {
  data: T
  success: boolean
  message?: string
  error?: string
  timestamp: Date
  requestId?: string
}

// Paginated response
export interface PaginatedResponse<T = any> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasNext: boolean
  hasPrev: boolean
}

// Sort and filter types
export interface SortOption {
  field: string
  direction: 'asc' | 'desc'
}

export interface FilterOption {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'like' | 'exists'
  value: any
}

export interface QueryOptions {
  page?: number
  pageSize?: number
  sort?: SortOption[]
  filters?: FilterOption[]
  search?: string
}

// Configuration types
export interface AppConfig {
  version: string
  build: string
  environment: 'development' | 'production' | 'test'
  apiBaseUrl: string
  features: FeatureFlags
  limits: AppLimits
  defaults: AppDefaults
}

export interface FeatureFlags {
  voiceInput: boolean
  imageGeneration: boolean
  codeExecution: boolean
  pluginSystem: boolean
  multiUser: boolean
  encryption: boolean
  analytics: boolean
}

export interface AppLimits {
  maxChatHistory: number
  maxMessageLength: number
  maxFileSize: number
  maxAttachmentsPerMessage: number
  rateLimitRequests: number
  rateLimitWindow: number
}

export interface AppDefaults {
  theme: 'light' | 'dark' | 'system'
  language: string
  fontSize: 'small' | 'medium' | 'large'
  model: string
  provider: string
  temperature: number
  maxTokens: number
}

// Plugin system types
export interface Plugin {
  id: string
  name: string
  version: string
  description: string
  author: string
  homepage?: string
  keywords?: string[]
  main: string
  capabilities: PluginCapabilities
  permissions: PluginPermissions
  config?: PluginConfig
}

export interface PluginCapabilities {
  ui: boolean
  api: boolean
  storage: boolean
  network: boolean
  filesystem: boolean
  system: boolean
}

export interface PluginPermissions {
  readChats: boolean
  writeChats: boolean
  readFiles: boolean
  writeFiles: boolean
  network: boolean
  system: boolean
}

export interface PluginConfig {
  [key: string]: any
}

// Localization types
export interface LocaleMessages {
  [key: string]: string | LocaleMessages
}

export interface Locale {
  code: string
  name: string
  nativeName: string
  messages: LocaleMessages
  dateFormat: string
  timeFormat: string
  currency: string
  direction: 'ltr' | 'rtl'
}

// Theme types
export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  error: string
  warning: string
  info: string
  success: string
  text: string
  textSecondary: string
  border: string
  shadow: string
}

export interface ThemeConfig {
  name: string
  displayName: string
  colors: {
    light: ThemeColors
    dark: ThemeColors
  }
  fonts: {
    sans: string[]
    mono: string[]
    display: string[]
  }
  spacing: Record<string, string>
  borderRadius: Record<string, string>
  shadows: Record<string, string>
  animations: Record<string, string>
}
