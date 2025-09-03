import { CustomProviderConfig, ProviderHealthStatus } from './provider'
import { VALIDATION_RULES, TEST_MESSAGES, ERROR_SOLUTIONS } from './providerTemplates'
import { logger } from '../utils/Logger'

export interface ValidationResult {
  success: boolean
  error?: string
  details?: {
    connectionTime?: number
    supportedFeatures?: {
      streaming: boolean
      toolCalling: boolean
      multimodal: boolean
    }
    availableModels?: string[]
    rateLimits?: {
      requestsPerMinute?: number
      tokensPerMinute?: number
    }
  }
}

export interface EnhancedValidationOptions {
  testStreaming?: boolean
  testToolCalling?: boolean
  detectFeatures?: boolean
  timeout?: number
}

/**
 * Enhanced provider validation service with comprehensive testing
 * Developed with MCP Integration Agent assistance
 */
export class ProviderValidator {
  private readonly DEFAULT_TIMEOUT = 30000 // 30 seconds
  // private readonly MAX_RETRIES = 3 // Reserved for future retry logic implementation

  /**
   * Validate provider configuration and capabilities
   */
  async validateProvider(
    config: CustomProviderConfig,
    options: EnhancedValidationOptions = {},
  ): Promise<ValidationResult> {
    const startTime = Date.now()

    try {
      // Basic configuration validation
      const configValidation = this.validateConfiguration(config)
      if (!configValidation.success) {
        return configValidation
      }

      // Connection test
      const connectionResult = await this.testConnection(config, options.timeout)
      if (!connectionResult.success) {
        return connectionResult
      }

      // Feature detection
      const features = options.detectFeatures
        ? await this.detectSupportedFeatures(config, options)
        : { streaming: false, toolCalling: false, multimodal: false }

      // Model availability check
      const availableModels = await this.getAvailableModels(config)

      const connectionTime = Date.now() - startTime

      return {
        success: true,
        details: {
          connectionTime,
          supportedFeatures: features,
          availableModels,
          rateLimits: await this.detectRateLimits(config),
        },
      }
    } catch (error: any) {
      logger.error('Provider validation failed', 'ProviderValidator', {
        error: error.message,
        config: { ...config, apiKey: '***' },
      })

      return {
        success: false,
        error: this.getErrorSolution(error),
      }
    }
  }

  /**
   * Validate basic configuration format and required fields
   */
  private validateConfiguration(config: CustomProviderConfig): ValidationResult {
    const rules = VALIDATION_RULES[config.type]
    if (!rules) {
      return {
        success: false,
        error: `Unsupported provider type: ${config.type}`,
      }
    }

    // Check required fields
    for (const field of rules.requiredFields) {
      if (!(field in config) || !config[field as keyof CustomProviderConfig]) {
        return {
          success: false,
          error: `Required field missing: ${field}`,
        }
      }
    }

    // Validate URL format
    if (config.baseURL && !rules.urlPattern.test(config.baseURL)) {
      return {
        success: false,
        error: 'Invalid Base URL format. Must start with http:// or https://',
      }
    }

    // Validate model name
    if (config.model && !rules.modelPattern.test(config.model)) {
      return {
        success: false,
        error: `Invalid model name format for ${config.type}`,
      }
    }

    return { success: true }
  }

  /**
   * Test basic connectivity to the provider
   */
  private async testConnection(
    config: CustomProviderConfig,
    timeout = this.DEFAULT_TIMEOUT,
  ): Promise<ValidationResult> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(`${config.baseURL}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
          ...config.headers,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return { success: true }
    } catch (error: any) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  /**
   * Detect supported features through API testing
   */
  private async detectSupportedFeatures(
    config: CustomProviderConfig,
    options: EnhancedValidationOptions,
  ): Promise<{ streaming: boolean; toolCalling: boolean; multimodal: boolean }> {
    const features = {
      streaming: false,
      toolCalling: false,
      multimodal: false,
    }

    try {
      // Test streaming capability
      if (options.testStreaming) {
        features.streaming = await this.testStreaming(config)
      }

      // Test tool calling capability
      if (options.testToolCalling) {
        features.toolCalling = await this.testToolCalling(config)
      }

      // Multimodal detection is based on known model capabilities
      features.multimodal = this.detectMultimodal(config.model)
    } catch (error: any) {
      logger.warn('Feature detection partially failed', 'ProviderValidator', {
        error: error.message,
      })
    }

    return features
  }

  /**
   * Test streaming capability
   */
  private async testStreaming(config: CustomProviderConfig): Promise<boolean> {
    try {
      const response = await fetch(`${config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
          ...config.headers,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: TEST_MESSAGES.basic }],
          stream: true,
          max_tokens: 10,
        }),
      })

      return response.ok && response.body !== null
    } catch {
      return false
    }
  }

  /**
   * Test tool calling capability
   */
  private async testToolCalling(config: CustomProviderConfig): Promise<boolean> {
    try {
      const testTool = {
        type: 'function',
        function: {
          name: 'get_time',
          description: 'Get current time',
          parameters: {
            type: 'object',
            properties: {},
          },
        },
      }

      const response = await fetch(`${config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
          ...config.headers,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: 'What time is it?' }],
          tools: [testTool],
          max_tokens: 50,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        return data.choices?.[0]?.message?.tool_calls !== undefined
      }
      return false
    } catch {
      return false
    }
  }

  /**
   * Detect multimodal capability based on model name
   */
  private detectMultimodal(model: string): boolean {
    const multimodalPatterns = [
      /gpt-4.*vision/i,
      /gpt-4v/i,
      /claude-3/i,
      /gemini.*vision/i,
      /dall-e/i,
    ]

    return multimodalPatterns.some(pattern => pattern.test(model))
  }

  /**
   * Get available models from the provider
   */
  private async getAvailableModels(config: CustomProviderConfig): Promise<string[]> {
    try {
      const response = await fetch(`${config.baseURL}/models`, {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          ...config.headers,
        },
      })

      if (response.ok) {
        const data = await response.json()
        return data.data?.map((model: any) => model.id) || []
      }
      return []
    } catch {
      return []
    }
  }

  /**
   * Detect rate limits through response headers
   */
  private async detectRateLimits(
    config: CustomProviderConfig,
  ): Promise<{ requestsPerMinute?: number; tokensPerMinute?: number }> {
    try {
      const response = await fetch(`${config.baseURL}/models`, {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          ...config.headers,
        },
      })

      const rateLimits: { requestsPerMinute?: number; tokensPerMinute?: number } = {}

      // Common rate limit headers
      const requestLimit = response.headers.get('x-ratelimit-limit-requests')
      const tokenLimit = response.headers.get('x-ratelimit-limit-tokens')

      if (requestLimit) {
        rateLimits.requestsPerMinute = parseInt(requestLimit, 10)
      }
      if (tokenLimit) {
        rateLimits.tokensPerMinute = parseInt(tokenLimit, 10)
      }

      return rateLimits
    } catch {
      return {}
    }
  }

  /**
   * Get user-friendly error message with solution
   */
  private getErrorSolution(error: any): string {
    const message = error.message || error.toString()

    // Match error patterns
    for (const [pattern, solution] of Object.entries(ERROR_SOLUTIONS)) {
      if (message.includes(pattern) || message.includes(pattern.toLowerCase())) {
        return `${message}\n\nSolution: ${solution}`
      }
    }

    // Network errors
    if (error.name === 'AbortError') {
      return 'Request timeout. The server took too long to respond.'
    }

    if (error.code === 'ECONNREFUSED') {
      return ERROR_SOLUTIONS.ECONNREFUSED
    }

    if (error.code === 'ENOTFOUND') {
      return ERROR_SOLUTIONS.ENOTFOUND
    }

    // HTTP status errors
    if (message.includes('401')) {
      return ERROR_SOLUTIONS.UNAUTHORIZED
    }

    if (message.includes('403')) {
      return ERROR_SOLUTIONS.FORBIDDEN
    }

    if (message.includes('429')) {
      return ERROR_SOLUTIONS.RATE_LIMITED
    }

    return `Validation failed: ${message}`
  }

  /**
   * Create health status from validation result
   */
  createHealthStatus(
    providerName: string,
    validationResult: ValidationResult,
  ): ProviderHealthStatus {
    return {
      providerName,
      isHealthy: validationResult.success,
      lastChecked: new Date().toISOString(),
      error: validationResult.error,
      responseTime: validationResult.details?.connectionTime,
    }
  }
}
