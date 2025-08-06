// Re-export types for frontend usage
export type {
  CustomProviderConfig,
  ProviderHealthStatus
} from '../main/llm/provider'

export interface CustomProviderFormData {
  name: string
  displayName: string
  apiKey: string
  baseURL: string
  model: string
  type: 'openai-compatible' | 'anthropic-compatible' | 'custom'
  headers?: Record<string, string>
  parameters?: {
    temperature?: number
    maxTokens?: number
    topP?: number
    frequencyPenalty?: number
    presencePenalty?: number
  }
}

export interface ProviderListItem {
  id: string
  name: string
  displayName: string
  isCustom?: boolean
  isHealthy?: boolean
  lastChecked?: string
  error?: string
}

export interface CustomProviderOperationResult {
  success: boolean
  id?: string
  error?: string
}

export interface ProviderImportResult {
  success: number
  failed: number
  errors: string[]
}