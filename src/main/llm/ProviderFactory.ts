import {
  LLMProvider,
  OpenAIProvider,
  AnthropicProvider,
  OllamaProvider,
  CustomOpenAIProvider
} from './provider'
import type { CustomProviderManager } from './customProviderManager'

export interface LLMConfig {
  provider: string // Allow any string to support custom provider IDs
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
    console.log('[ProviderFactory] Creating provider with config:', config)
    this.validateConfig(config)

    // Check if it's a custom provider ID (starts with 'custom-')
    if (config.provider.startsWith('custom-')) {
      console.log('[ProviderFactory] Detected custom provider ID:', config.provider)
      // It's a custom provider, use the provider ID as customProviderId
      return this.createCustomProvider({
        ...config,
        customProviderId: config.provider
      })
    }

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

    console.log('[ProviderFactory] Creating custom provider:', config.customProviderId)
    const customConfig = this.customProviderManager.getProvider(config.customProviderId)

    if (!customConfig) {
      // List available custom providers for debugging
      const available = this.customProviderManager.getAllProviders()
      console.error(
        '[ProviderFactory] Available custom providers:',
        available.map(p => p.id)
      )
      throw new Error(`Custom provider not found: ${config.customProviderId}`)
    }

    console.log('[ProviderFactory] Found custom provider config:', customConfig)
    return new CustomOpenAIProvider(customConfig)
  }

  private static validateConfig(config: LLMConfig): void {
    if (!config.provider) {
      throw new Error('Provider is required')
    }

    // Check if it's a custom provider ID (starts with 'custom-')
    if (config.provider.startsWith('custom-')) {
      if (!this.customProviderManager) {
        throw new Error('Custom provider manager not initialized')
      }
      // Check if the custom provider exists
      const customProvider = this.customProviderManager.getProvider(config.provider)
      if (!customProvider) {
        throw new Error(`Custom provider not found: ${config.provider}`)
      }
      return // Valid custom provider
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
  static getBuiltInProviders(): Array<{ id: string; name: string; displayName: string }> {
    return [
      { id: 'openai', name: 'openai', displayName: 'OpenAI' },
      { id: 'anthropic', name: 'anthropic', displayName: 'Anthropic Claude' },
      { id: 'ollama', name: 'ollama', displayName: 'Ollama Local' }
    ]
  }

  /**
   * Get all available providers (built-in + custom)
   */
  static getAllProviders(): Array<{
    id: string
    name: string
    displayName: string
    isCustom?: boolean
  }> {
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
