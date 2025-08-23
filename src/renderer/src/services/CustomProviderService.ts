import type {
  CustomProviderConfig,
  CustomProviderCreateRequest,
  CustomProviderUpdateRequest,
  ProviderHealthStatus,
  ProviderImportExport
} from '../types/api'
import type { CustomProviderFormData } from '@/types/customProvider'

/**
 * Service for managing custom LLM providers
 */
export class CustomProviderService {
  private static instance: CustomProviderService

  static getInstance(): CustomProviderService {
    if (!CustomProviderService.instance) {
      CustomProviderService.instance = new CustomProviderService()
    }
    return CustomProviderService.instance
  }

  /**
   * Add a new custom provider
   */
  async addProvider(
    config: CustomProviderCreateRequest
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      return await window.api.llm.addCustomProvider(config)
    } catch (error: any) {
      console.error('Failed to add custom provider:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Create a new provider (alias for addProvider with form data)
   */
  async createProvider(
    formData: CustomProviderFormData
  ): Promise<{ success: boolean; data?: CustomProviderConfig; error?: string }> {
    try {
      const config: CustomProviderCreateRequest = {
        name: formData.name,
        displayName: formData.displayName,
        apiKey: formData.apiKey,
        baseURL: formData.baseURL,
        model: formData.model,
        type: formData.type,
        headers: formData.headers,
        parameters: formData.parameters
      }

      const result = await window.api.llm.addCustomProvider(config)

      if (result.success && result.id) {
        // Fetch the created provider to return full config
        const getResult = await this.getProvider(result.id)
        if (getResult.success && getResult.data) {
          return {
            success: true,
            data: getResult.data
          }
        }
        // If we can't get the provider, still return success with basic info
        return {
          success: true,
          data: { ...config, id: result.id } as CustomProviderConfig
        }
      }

      return { success: false, error: result.error }
    } catch (error: any) {
      console.error('Failed to create custom provider:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Update an existing custom provider
   */
  async updateProvider(
    id: string,
    updates: Partial<CustomProviderFormData>
  ): Promise<{ success: boolean; data?: CustomProviderConfig; error?: string }> {
    try {
      const updateRequest: CustomProviderUpdateRequest = {
        name: updates.name,
        displayName: updates.displayName,
        apiKey: updates.apiKey,
        baseURL: updates.baseURL,
        model: updates.model,
        headers: updates.headers,
        parameters: updates.parameters
      }

      const result = await window.api.llm.updateCustomProvider(id, updateRequest)

      if (result.success) {
        // Fetch the updated provider to return full config
        const updated = await this.getProvider(id)
        return {
          success: !!updated.success,
          data: updated.data || undefined,
          error: updated.error
        }
      }

      return { success: false, error: result.error }
    } catch (error: any) {
      console.error('Failed to update custom provider:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Remove a custom provider
   */
  async removeProvider(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      return await window.api.llm.removeCustomProvider(id)
    } catch (error: any) {
      console.error('Failed to remove custom provider:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Delete a provider (alias for removeProvider)
   */
  async deleteProvider(id: string): Promise<{ success: boolean; error?: string }> {
    return this.removeProvider(id)
  }

  /**
   * Get all custom providers
   */
  async getAllProviders(): Promise<{
    success: boolean
    data?: CustomProviderConfig[]
    error?: string
  }> {
    try {
      const providers = await window.api.llm.getAllCustomProviders()
      return { success: true, data: providers }
    } catch (error: any) {
      console.error('Failed to get custom providers:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get a specific custom provider by ID
   */
  async getProvider(
    id: string
  ): Promise<{ success: boolean; data?: CustomProviderConfig; error?: string }> {
    try {
      const provider = await window.api.llm.getCustomProvider(id)
      if (provider) {
        return { success: true, data: provider }
      } else {
        return { success: false, error: 'Provider not found' }
      }
    } catch (error: any) {
      console.error('Failed to get custom provider:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Check health of a specific provider
   */
  async checkProviderHealth(
    id: string
  ): Promise<{
    status: 'healthy' | 'unhealthy' | 'unknown' | 'error'
    error?: string
    responseTime?: number
  }> {
    try {
      const health = await window.api.llm.checkCustomProviderHealth(id)
      if (health) {
        return {
          status: health.isHealthy ? 'healthy' : 'unhealthy',
          error: health.error,
          responseTime: health.responseTime
        }
      } else {
        return { status: 'unknown', error: 'No health information available' }
      }
    } catch (error: any) {
      console.error('Failed to check provider health:', error)
      return { status: 'error', error: error.message }
    }
  }

  /**
   * Check health of all providers
   */
  async checkAllProvidersHealth(): Promise<ProviderHealthStatus[]> {
    try {
      return await window.api.llm.checkAllCustomProvidersHealth()
    } catch (error: any) {
      console.error('Failed to check all providers health:', error)
      return []
    }
  }

  /**
   * Get all provider health statuses (cached)
   */
  async getAllHealthStatuses(): Promise<ProviderHealthStatus[]> {
    try {
      return await window.api.llm.getAllProviderHealthStatuses()
    } catch (error: any) {
      console.error('Failed to get provider health statuses:', error)
      return []
    }
  }

  /**
   * Get health status of a specific provider (cached)
   */
  async getProviderHealth(id: string): Promise<ProviderHealthStatus | null> {
    try {
      return await window.api.llm.getCustomProviderHealth(id)
    } catch (error: any) {
      console.error('Failed to get provider health:', error)
      return null
    }
  }

  /**
   * Export providers configuration (without API keys)
   */
  async exportProviders(): Promise<Omit<CustomProviderConfig, 'apiKey'>[]> {
    try {
      return await window.api.llm.exportCustomProviders()
    } catch (error: any) {
      console.error('Failed to export providers:', error)
      return []
    }
  }

  /**
   * Import providers configuration
   */
  async importProviders(providers: CustomProviderConfig[]): Promise<ProviderImportExport> {
    try {
      return await window.api.llm.importCustomProviders(providers)
    } catch (error: any) {
      console.error('Failed to import providers:', error)
      return { success: 0, failed: providers.length, errors: [error.message] }
    }
  }

  /**
   * Reset all providers
   */
  async resetProviders(): Promise<{ success: boolean; error?: string }> {
    try {
      // This should call a backend method to clear all custom providers
      const providers = await window.api.llm.getAllCustomProviders()
      let allSuccess = true
      const errors: string[] = []

      for (const provider of providers) {
        try {
          await window.api.llm.removeCustomProvider(provider.id)
        } catch (error: any) {
          allSuccess = false
          errors.push(`Failed to remove ${provider.name}: ${error.message}`)
        }
      }

      return {
        success: allSuccess,
        error: errors.length > 0 ? errors.join('; ') : undefined
      }
    } catch (error: any) {
      console.error('Failed to reset providers:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Validate provider configuration form data
   */
  validateProviderConfig(formData: CustomProviderFormData): string[] {
    const errors: string[] = []

    if (!formData.name?.trim()) {
      errors.push('Provider name is required')
    }

    if (!formData.displayName?.trim()) {
      errors.push('Display name is required')
    }

    if (!formData.apiKey?.trim()) {
      errors.push('API key is required')
    }

    if (!formData.baseURL?.trim()) {
      errors.push('Base URL is required')
    } else {
      try {
        new URL(formData.baseURL)
      } catch {
        errors.push('Invalid base URL format')
      }
    }

    if (!formData.model?.trim()) {
      errors.push('Model name is required')
    }

    if (formData.parameters) {
      const { temperature, maxTokens, topP, frequencyPenalty, presencePenalty } =
        formData.parameters

      if (temperature !== undefined && (temperature < 0 || temperature > 2)) {
        errors.push('Temperature must be between 0 and 2')
      }

      if (maxTokens !== undefined && (maxTokens < 1 || maxTokens > 100000)) {
        errors.push('Max tokens must be between 1 and 100000')
      }

      if (topP !== undefined && (topP < 0 || topP > 1)) {
        errors.push('Top P must be between 0 and 1')
      }

      if (frequencyPenalty !== undefined && (frequencyPenalty < -2 || frequencyPenalty > 2)) {
        errors.push('Frequency penalty must be between -2 and 2')
      }

      if (presencePenalty !== undefined && (presencePenalty < -2 || presencePenalty > 2)) {
        errors.push('Presence penalty must be between -2 and 2')
      }
    }

    return errors
  }

  /**
   * Validate provider configuration without saving
   */
  async validateProvider(
    config: CustomProviderCreateRequest
  ): Promise<{ valid: boolean; error?: string }> {
    // Basic client-side validation
    if (!config.name || config.name.trim() === '') {
      return { valid: false, error: 'Provider name is required' }
    }

    if (!config.displayName || config.displayName.trim() === '') {
      return { valid: false, error: 'Display name is required' }
    }

    if (!config.apiKey || config.apiKey.trim() === '') {
      return { valid: false, error: 'API key is required' }
    }

    if (!config.baseURL || config.baseURL.trim() === '') {
      return { valid: false, error: 'Base URL is required' }
    }

    try {
      new URL(config.baseURL)
    } catch {
      return { valid: false, error: 'Invalid base URL format' }
    }

    if (!config.model || config.model.trim() === '') {
      return { valid: false, error: 'Model name is required' }
    }

    // Validate parameters if provided
    if (config.parameters) {
      const { temperature, maxTokens, topP, frequencyPenalty, presencePenalty } = config.parameters

      if (temperature !== undefined && (temperature < 0 || temperature > 2)) {
        return { valid: false, error: 'Temperature must be between 0 and 2' }
      }

      if (maxTokens !== undefined && (maxTokens < 1 || maxTokens > 100000)) {
        return { valid: false, error: 'Max tokens must be between 1 and 100000' }
      }

      if (topP !== undefined && (topP < 0 || topP > 1)) {
        return { valid: false, error: 'Top P must be between 0 and 1' }
      }

      if (frequencyPenalty !== undefined && (frequencyPenalty < -2 || frequencyPenalty > 2)) {
        return { valid: false, error: 'Frequency penalty must be between -2 and 2' }
      }

      if (presencePenalty !== undefined && (presencePenalty < -2 || presencePenalty > 2)) {
        return { valid: false, error: 'Presence penalty must be between -2 and 2' }
      }
    }

    return { valid: true }
  }

  /**
   * Get available provider types
   */
  getProviderTypes(): Array<{ value: string; label: string; description: string }> {
    return [
      {
        value: 'openai-compatible',
        label: 'OpenAI Compatible',
        description: 'Use with APIs that follow OpenAI format (GPT, Groq, DeepSeek, etc.)'
      },
      {
        value: 'anthropic-compatible',
        label: 'Anthropic Compatible',
        description: 'Use with APIs that follow Anthropic Claude format'
      },
      {
        value: 'custom',
        label: 'Custom',
        description: 'Custom implementation with specific requirements'
      }
    ]
  }

  /**
   * Get default parameters for a provider type
   */
  getDefaultParameters(type: string) {
    switch (type) {
      case 'openai-compatible':
        return {
          temperature: 0.7,
          maxTokens: 4096,
          topP: 1.0,
          frequencyPenalty: 0,
          presencePenalty: 0
        }
      case 'anthropic-compatible':
        return {
          temperature: 0.7,
          maxTokens: 4096
        }
      default:
        return {}
    }
  }
}

// Export singleton instance
export const customProviderService = CustomProviderService.getInstance()
