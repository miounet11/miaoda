import {
  LLMProvider,
  OpenAIProvider,
  AnthropicProvider,
  OllamaProvider,
  CustomOpenAIProvider
} from './provider'
import { FallbackProvider } from './FallbackProvider'
import type { CustomProviderManager } from './customProviderManager'

export interface LLMConfig {
  provider: string // Allow any string to support custom provider IDs
  apiKey?: string
  baseURL?: string
  model?: string
  customProviderId?: string // For custom providers
  // Extended fields for enhanced model config integration
  secretKey?: string // For Baidu
  headers?: Record<string, string> // For custom headers
  parameters?: {
    temperature?: number
    maxTokens?: number
    topP?: number
    frequencyPenalty?: number
    presencePenalty?: number
  }
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
      case 'fallback':
      case 'builtin':
      case 'default':
        return new FallbackProvider()

      case 'openai':
        return new OpenAIProvider(config.apiKey!, config.baseURL)

      case 'anthropic':
        return new AnthropicProvider(config.apiKey!)

      case 'ollama':
        return new OllamaProvider(config.model || 'llama2', config.baseURL)

      // 国内大模型支持
      case 'deepseek':
        return this.createOpenAICompatibleProvider('DeepSeek', config, {
          defaultBaseURL: 'https://api.deepseek.com/v1',
          defaultModel: 'deepseek-chat'
        })

      case 'qwen':
        return this.createOpenAICompatibleProvider('通义千问', config, {
          defaultBaseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
          defaultModel: 'qwen-turbo'
        })

      case 'moonshot':
        return this.createOpenAICompatibleProvider('Kimi', config, {
          defaultBaseURL: 'https://api.moonshot.cn/v1',
          defaultModel: 'moonshot-v1-8k'
        })

      case 'zhipu':
        return this.createOpenAICompatibleProvider('智谱清言', config, {
          defaultBaseURL: 'https://open.bigmodel.cn/api/paas/v4',
          defaultModel: 'glm-4'
        })

      case 'minimax':
        return this.createOpenAICompatibleProvider('MiniMax', config, {
          defaultBaseURL: 'https://api.minimax.chat/v1',
          defaultModel: 'abab6.5s-chat'
        })

      case 'baidu':
        // 百度文心需要特殊处理，使用secretKey
        if (!config.apiKey || !config.secretKey) {
          throw new Error('Baidu provider requires both API Key and Secret Key')
        }
        return this.createBaiduProvider(config)

      case 'google':
        return this.createOpenAICompatibleProvider('Gemini', config, {
          defaultBaseURL: 'https://generativelanguage.googleapis.com/v1',
          defaultModel: 'gemini-pro'
        })

      case 'custom':
        return this.createCustomProvider(config)

      default:
        throw new Error(`Unknown provider: ${config.provider}`)
    }
  }

  /**
   * 创建OpenAI兼容的提供商
   */
  private static createOpenAICompatibleProvider(
    displayName: string,
    config: LLMConfig,
    defaults: { defaultBaseURL: string; defaultModel: string }
  ): LLMProvider {
    if (!config.apiKey) {
      throw new Error(`${displayName} provider requires API key`)
    }

    const customConfig = {
      id: `enhanced-${config.provider}`,
      name: config.provider,
      displayName,
      apiKey: config.apiKey,
      baseURL: config.baseURL || defaults.defaultBaseURL,
      model: config.model || defaults.defaultModel,
      type: 'openai-compatible' as const,
      headers: config.headers || {},
      parameters: config.parameters || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    return new CustomOpenAIProvider(customConfig)
  }

  /**
   * 创建百度文心提供商（需要特殊处理）
   */
  private static createBaiduProvider(config: LLMConfig): LLMProvider {
    // 百度文心使用不同的认证方式，但可以通过适配器转换为OpenAI兼容格式
    const customConfig = {
      id: 'enhanced-baidu',
      name: 'baidu',
      displayName: '百度文心',
      apiKey: config.apiKey!,
      baseURL: config.baseURL || 'https://aip.baidubce.com',
      model: config.model || 'ernie-4.0-8k',
      type: 'openai-compatible' as const,
      headers: {
        'Content-Type': 'application/json',
        'X-Secret-Key': config.secretKey!, // 百度特有的Secret Key
        ...config.headers
      },
      parameters: config.parameters || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    return new CustomOpenAIProvider(customConfig)
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
      case 'deepseek':
      case 'qwen':
      case 'moonshot':
      case 'zhipu':
      case 'minimax':
      case 'google':
        if (!config.apiKey) {
          throw new Error(`${config.provider} API key is required`)
        }
        break

      case 'baidu':
        if (!config.apiKey || !config.secretKey) {
          throw new Error('Baidu provider requires both API Key and Secret Key')
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
      // 国际大模型
      { id: 'openai', name: 'openai', displayName: 'OpenAI' },
      { id: 'anthropic', name: 'anthropic', displayName: 'Anthropic Claude' },
      { id: 'google', name: 'google', displayName: 'Google Gemini' },

      // 国内大模型
      { id: 'deepseek', name: 'deepseek', displayName: 'DeepSeek' },
      { id: 'qwen', name: 'qwen', displayName: '通义千问' },
      { id: 'baidu', name: 'baidu', displayName: '百度文心' },
      { id: 'zhipu', name: 'zhipu', displayName: '智谱清言' },
      { id: 'moonshot', name: 'moonshot', displayName: 'Kimi' },
      { id: 'minimax', name: 'minimax', displayName: 'MiniMax' },

      // 本地模型
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
