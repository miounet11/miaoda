/**
 * Frontend Integration Support for Custom Provider Management
 * MCP Integration Agent - Technical Integration Guide
 */

import { ipcMain } from 'electron'
import { CustomProviderConfig, ProviderHealthStatus } from './provider'
import { PROVIDER_TEMPLATES, ProviderTemplate } from './providerTemplates'
import { ProviderValidator, ValidationResult, EnhancedValidationOptions } from './providerValidator'
import { CustomProviderManager } from './customProviderManager'
import { logger } from '../utils/Logger'

/**
 * Enhanced IPC handlers for frontend integration
 */
export class FrontendIntegrationService {
  private validator: ProviderValidator
  
  constructor(private customProviderManager: CustomProviderManager) {
    this.validator = new ProviderValidator()
    this.registerEnhancedHandlers()
  }

  /**
   * Register additional IPC handlers for enhanced frontend support
   */
  private registerEnhancedHandlers(): void {
    // Template management
    ipcMain.handle('llm:getProviderTemplates', this.getProviderTemplates.bind(this))
    ipcMain.handle('llm:getProviderTemplatesByCategory', this.getProviderTemplatesByCategory.bind(this))
    ipcMain.handle('llm:createProviderFromTemplate', this.createProviderFromTemplate.bind(this))

    // Enhanced validation
    ipcMain.handle('llm:validateProviderConfig', this.validateProviderConfig.bind(this))
    ipcMain.handle('llm:validateProviderEnhanced', this.validateProviderEnhanced.bind(this))
    ipcMain.handle('llm:testProviderFeatures', this.testProviderFeatures.bind(this))

    // Provider management helpers
    ipcMain.handle('llm:duplicateProvider', this.duplicateProvider.bind(this))
    ipcMain.handle('llm:getProviderUsageStats', this.getProviderUsageStats.bind(this))
    ipcMain.handle('llm:bulkProviderOperation', this.bulkProviderOperation.bind(this))

    // Configuration helpers
    ipcMain.handle('llm:getProviderConfigSuggestions', this.getProviderConfigSuggestions.bind(this))
    ipcMain.handle('llm:validateProviderUrl', this.validateProviderUrl.bind(this))
    ipcMain.handle('llm:detectProviderType', this.detectProviderType.bind(this))
  }

  /**
   * Get all available provider templates
   */
  async getProviderTemplates(): Promise<ProviderTemplate[]> {
    try {
      return PROVIDER_TEMPLATES
    } catch (error: any) {
      logger.error('Failed to get provider templates', 'FrontendIntegration', { error: error.message })
      return []
    }
  }

  /**
   * Get provider templates by category
   */
  async getProviderTemplatesByCategory(
    _: any, 
    category: ProviderTemplate['category']
  ): Promise<ProviderTemplate[]> {
    try {
      return PROVIDER_TEMPLATES.filter(template => template.category === category)
    } catch (error: any) {
      logger.error('Failed to get templates by category', 'FrontendIntegration', { error: error.message })
      return []
    }
  }

  /**
   * Create a provider from template with custom overrides
   */
  async createProviderFromTemplate(
    _: any,
    templateId: string,
    overrides: Partial<CustomProviderConfig>
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const template = PROVIDER_TEMPLATES.find(t => t.id === templateId)
      if (!template) {
        return { success: false, error: 'Template not found' }
      }

      const config = {
        ...template.config,
        ...overrides
      } as Omit<CustomProviderConfig, 'id' | 'createdAt' | 'updatedAt'>

      return await this.customProviderManager.addProvider(config)
    } catch (error: any) {
      logger.error('Failed to create provider from template', 'FrontendIntegration', { error: error.message })
      return { success: false, error: error.message }
    }
  }

  /**
   * Validate provider configuration (basic)
   */
  async validateProviderConfig(
    _: any,
    config: Partial<CustomProviderConfig>
  ): Promise<ValidationResult> {
    try {
      // Create a temporary full config for validation
      const fullConfig = {
        id: 'temp',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...config
      } as CustomProviderConfig

      return await this.validator.validateProvider(fullConfig, { detectFeatures: false })
    } catch (error: any) {
      logger.error('Failed to validate provider config', 'FrontendIntegration', { error: error.message })
      return { success: false, error: error.message }
    }
  }

  /**
   * Enhanced provider validation with feature detection
   */
  async validateProviderEnhanced(
    _: any,
    config: Partial<CustomProviderConfig>,
    options: EnhancedValidationOptions = {}
  ): Promise<ValidationResult> {
    try {
      const fullConfig = {
        id: 'temp',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...config
      } as CustomProviderConfig

      const enhancedOptions = {
        testStreaming: true,
        testToolCalling: true,
        detectFeatures: true,
        timeout: 30000,
        ...options
      }

      return await this.validator.validateProvider(fullConfig, enhancedOptions)
    } catch (error: any) {
      logger.error('Failed to validate provider enhanced', 'FrontendIntegration', { error: error.message })
      return { success: false, error: error.message }
    }
  }

  /**
   * Test specific provider features
   */
  async testProviderFeatures(
    _: any,
    providerId: string,
    features: string[]
  ): Promise<{ [feature: string]: boolean }> {
    try {
      const config = this.customProviderManager.getProvider(providerId)
      if (!config) {
        throw new Error('Provider not found')
      }

      const results: { [feature: string]: boolean } = {}
      const options: EnhancedValidationOptions = {}

      if (features.includes('streaming')) options.testStreaming = true
      if (features.includes('toolCalling')) options.testToolCalling = true

      const validation = await this.validator.validateProvider(config, options)
      
      if (validation.success && validation.details?.supportedFeatures) {
        const supportedFeatures = validation.details.supportedFeatures
        results.streaming = supportedFeatures.streaming
        results.toolCalling = supportedFeatures.toolCalling  
        results.multimodal = supportedFeatures.multimodal
      }

      return results
    } catch (error: any) {
      logger.error('Failed to test provider features', 'FrontendIntegration', { error: error.message })
      return {}
    }
  }

  /**
   * Duplicate an existing provider with new name
   */
  async duplicateProvider(
    _: any,
    sourceId: string,
    newName: string
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const sourceConfig = this.customProviderManager.getProvider(sourceId)
      if (!sourceConfig) {
        return { success: false, error: 'Source provider not found' }
      }

      const duplicateConfig = {
        ...sourceConfig,
        name: newName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        displayName: newName
      }

      // Remove id and timestamps to create new provider
      const { id, createdAt, updatedAt, ...configWithoutId } = duplicateConfig
      return await this.customProviderManager.addProvider(configWithoutId)
    } catch (error: any) {
      logger.error('Failed to duplicate provider', 'FrontendIntegration', { error: error.message })
      return { success: false, error: error.message }
    }
  }

  /**
   * Get provider usage statistics (placeholder for future implementation)
   */
  async getProviderUsageStats(_: any, providerId: string): Promise<{
    messagesCount: number
    avgResponseTime: number
    successRate: number
    lastUsed: string | null
  }> {
    try {
      // Future: Implement actual usage tracking - Issue #usage-analytics
      // This would require integrating with the message history system
      return {
        messagesCount: 0,
        avgResponseTime: 0,
        successRate: 100,
        lastUsed: null
      }
    } catch (error: any) {
      logger.error('Failed to get provider usage stats', 'FrontendIntegration', { error: error.message })
      return {
        messagesCount: 0,
        avgResponseTime: 0,
        successRate: 0,
        lastUsed: null
      }
    }
  }

  /**
   * Bulk operations on multiple providers
   */
  async bulkProviderOperation(
    _: any,
    operation: 'delete' | 'export' | 'healthCheck',
    providerIds: string[]
  ): Promise<{
    success: number
    failed: number
    results: { [providerId: string]: any }
  }> {
    const results: { [providerId: string]: any } = {}
    let success = 0
    let failed = 0

    for (const providerId of providerIds) {
      try {
        switch (operation) {
          case 'delete':
            results[providerId] = this.customProviderManager.removeProvider(providerId)
            break
          case 'export':
            const config = this.customProviderManager.getProvider(providerId)
            results[providerId] = config ? { ...config, apiKey: undefined } : null
            break
          case 'healthCheck':
            results[providerId] = await this.customProviderManager.checkProviderHealth(providerId)
            break
        }
        success++
      } catch (error: any) {
        results[providerId] = { error: error.message }
        failed++
      }
    }

    return { success, failed, results }
  }

  /**
   * Get configuration suggestions based on URL
   */
  async getProviderConfigSuggestions(
    _: any,
    baseURL: string
  ): Promise<{
    suggestedType: CustomProviderConfig['type']
    suggestedHeaders: Record<string, string>
    suggestedModel: string
    template?: string
  }> {
    try {
      const url = new URL(baseURL)
      const hostname = url.hostname.toLowerCase()

      // Azure OpenAI
      if (hostname.includes('openai.azure.com')) {
        return {
          suggestedType: 'openai-compatible',
          suggestedHeaders: { 'api-version': '2024-02-15-preview' },
          suggestedModel: 'gpt-4',
          template: 'azure-openai'
        }
      }

      // Hugging Face
      if (hostname.includes('huggingface.co')) {
        return {
          suggestedType: 'openai-compatible',
          suggestedHeaders: { 'Content-Type': 'application/json' },
          suggestedModel: 'microsoft/DialoGPT-medium',
          template: 'huggingface-endpoints'
        }
      }

      // Local installations (common ports)
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        const port = url.port
        if (port === '8080') {
          return {
            suggestedType: 'openai-compatible',
            suggestedHeaders: {},
            suggestedModel: 'llama-2-7b-chat',
            template: 'llamacpp-server'
          }
        }
        if (port === '5000') {
          return {
            suggestedType: 'openai-compatible',
            suggestedHeaders: {},
            suggestedModel: 'model-name',
            template: 'text-generation-webui'
          }
        }
      }

      // Default OpenAI-compatible
      return {
        suggestedType: 'openai-compatible',
        suggestedHeaders: {},
        suggestedModel: 'gpt-3.5-turbo'
      }
    } catch (error: any) {
      logger.warn('Failed to get config suggestions', 'FrontendIntegration', { error: error.message })
      return {
        suggestedType: 'openai-compatible',
        suggestedHeaders: {},
        suggestedModel: 'gpt-3.5-turbo'
      }
    }
  }

  /**
   * Validate provider URL format and accessibility
   */
  async validateProviderUrl(_: any, url: string): Promise<{
    valid: boolean
    accessible?: boolean
    error?: string
  }> {
    try {
      // Basic URL format validation
      new URL(url)

      // Test accessibility
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(10000)
      })

      return {
        valid: true,
        accessible: response.ok
      }
    } catch (error: any) {
      return {
        valid: false,
        accessible: false,
        error: error.message
      }
    }
  }

  /**
   * Detect provider type based on URL and response
   */
  async detectProviderType(_: any, baseURL: string): Promise<{
    detectedType: CustomProviderConfig['type']
    confidence: number
    reasoning: string
  }> {
    try {
      const url = new URL(baseURL)
      const hostname = url.hostname.toLowerCase()

      // High confidence detections
      if (hostname.includes('openai.azure.com')) {
        return {
          detectedType: 'openai-compatible',
          confidence: 95,
          reasoning: 'Azure OpenAI Service URL pattern detected'
        }
      }

      if (hostname.includes('api.anthropic.com')) {
        return {
          detectedType: 'anthropic-compatible',
          confidence: 95,
          reasoning: 'Anthropic API URL detected'
        }
      }

      // Try to detect by testing endpoints
      try {
        const response = await fetch(`${baseURL}/v1/models`, {
          method: 'GET',
          signal: AbortSignal.timeout(10000)
        })

        if (response.ok) {
          return {
            detectedType: 'openai-compatible',
            confidence: 80,
            reasoning: 'OpenAI-compatible /v1/models endpoint responded successfully'
          }
        }
      } catch {
        // Continue to other detection methods
      }

      // Default fallback
      return {
        detectedType: 'openai-compatible',
        confidence: 50,
        reasoning: 'Default assumption - most providers are OpenAI-compatible'
      }
    } catch (error: any) {
      return {
        detectedType: 'custom',
        confidence: 0,
        reasoning: `Could not analyze URL: ${error.message}`
      }
    }
  }
}

/**
 * Frontend data models for enhanced UI support
 */
export interface FrontendProviderData {
  id: string
  config: CustomProviderConfig
  health: ProviderHealthStatus
  features: {
    streaming: boolean
    toolCalling: boolean
    multimodal: boolean
  }
  usage: {
    messagesCount: number
    avgResponseTime: number
    successRate: number
    lastUsed: string | null
  }
  template?: ProviderTemplate
}

/**
 * Frontend integration helper functions
 */
export const FrontendHelpers = {
  /**
   * Format provider for display in UI
   */
  formatProviderForUI: (config: CustomProviderConfig, health?: ProviderHealthStatus): FrontendProviderData => {
    return {
      id: config.id,
      config,
      health: health || {
        providerName: config.displayName,
        isHealthy: false,
        lastChecked: new Date().toISOString()
      },
      features: {
        streaming: false,
        toolCalling: false,
        multimodal: false
      },
      usage: {
        messagesCount: 0,
        avgResponseTime: 0,
        successRate: 100,
        lastUsed: null
      }
    }
  },

  /**
   * Get provider status color for UI
   */
  getProviderStatusColor: (health: ProviderHealthStatus) => {
    if (!health.isHealthy) return 'red'
    if (health.responseTime && health.responseTime > 5000) return 'yellow'
    return 'green'
  },

  /**
   * Format response time for display
   */
  formatResponseTime: (ms?: number) => {
    if (!ms) return 'Unknown'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }
}