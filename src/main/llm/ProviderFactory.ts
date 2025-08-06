import { LLMProvider, OpenAIProvider, AnthropicProvider, OllamaProvider, CustomOpenAIProvider } from './provider'
import type { CustomProviderManager } from './customProviderManager'

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'ollama' | 'custom'
  apiKey?: string
  baseURL?: string
  model?: string
  customProviderId?: string // For custom providers
}

/**
 * Factory for creating LLM providers with proper validation
 */
export class ProviderFactory {
  private static customProviderManager: CustomProviderManager | null = null

  static setCustomProviderManager(manager: CustomProviderManager): void {
    this.customProviderManager = manager
  }

  static createProvider(config: LLMConfig): LLMProvider {
    this.validateConfig(config)

    switch (config.provider) {
      case 'openai':
        return new OpenAIProvider(config.apiKey!, config.baseURL)

      case 'anthropic':
        return new AnthropicProvider(config.apiKey!)

      case 'ollama':
        return new OllamaProvider(config.model || 'llama2', config.baseURL)

      case 'custom':
        return this.createCustomProvider(config)

      default:
        throw new Error(`Unknown provider: ${config.provider}`)
    }
  }

  private static createCustomProvider(config: LLMConfig): LLMProvider {
    if (!this.customProviderManager) {
      throw new Error('Custom provider manager not initialized')
    }

    if (!config.customProviderId) {
      throw new Error('Custom provider ID is required for custom providers')
    }

    const customConfig = this.customProviderManager.getProvider(config.customProviderId)
    if (!customConfig) {
      throw new Error(`Custom provider not found: ${config.customProviderId}`)
    }

    return new CustomOpenAIProvider(customConfig)
  }

  private static validateConfig(config: LLMConfig): void {
    if (!config.provider) {
      throw new Error('Provider is required')
    }

    switch (config.provider) {
      case 'openai':
      case 'anthropic':
        if (!config.apiKey) {
          throw new Error(`${config.provider} API key is required`)
        }
        break

      case 'ollama':
        // No API key required for Ollama
        break

      case 'custom':
        if (!config.customProviderId) {
          throw new Error('Custom provider ID is required for custom providers')
        }
        if (!this.customProviderManager) {
          throw new Error('Custom provider manager not initialized')
        }
        break

      default:
        throw new Error(`Unknown provider: ${config.provider}`)
    }
  }

  /**
   * Get available built-in providers
   */
  static getBuiltInProviders(): Array<{id: string; name: string; displayName: string}> {
    return [
      { id: 'openai', name: 'openai', displayName: 'OpenAI' },
      { id: 'anthropic', name: 'anthropic', displayName: 'Anthropic Claude' },
      { id: 'ollama', name: 'ollama', displayName: 'Ollama Local' }
    ]
  }

  /**
   * Get all available providers (built-in + custom)
   */
  static getAllProviders(): Array<{id: string; name: string; displayName: string; isCustom?: boolean}> {
    const builtIn = this.getBuiltInProviders()
    const custom = this.customProviderManager 
      ? this.customProviderManager.getAllProviders().map(config => ({
          id: config.id,
          name: config.name,
          displayName: config.displayName,
          isCustom: true
        }))
      : []
    
    return [...builtIn, ...custom]
  }
}