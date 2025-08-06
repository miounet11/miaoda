import { LLMProvider, OpenAIProvider, AnthropicProvider, OllamaProvider } from './provider'

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'ollama'
  apiKey?: string
  baseURL?: string
  model?: string
}

/**
 * Factory for creating LLM providers with proper validation
 */
export class ProviderFactory {
  static createProvider(config: LLMConfig): LLMProvider {
    this.validateConfig(config)

    switch (config.provider) {
      case 'openai':
        return new OpenAIProvider(config.apiKey!, config.baseURL)

      case 'anthropic':
        return new AnthropicProvider(config.apiKey!)

      case 'ollama':
        return new OllamaProvider(config.model || 'llama2', config.baseURL)

      default:
        throw new Error(`Unknown provider: ${config.provider}`)
    }
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

      default:
        throw new Error(`Unknown provider: ${config.provider}`)
    }
  }
}