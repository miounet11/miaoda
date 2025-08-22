import Store from 'electron-store'
import { CustomProviderConfig, ProviderHealthStatus, CustomOpenAIProvider } from './provider'
import { logger } from '../utils/Logger'

/**
 * Manager for custom LLM providers with secure storage and health monitoring
 */
export class CustomProviderManager {
  private store: Store<{ providers: Record<string, any>; healthStatus: Record<string, any> }>
  private providers: Map<string, CustomProviderConfig> = new Map()
  private healthStatus: Map<string, ProviderHealthStatus> = new Map()
  private healthCheckInterval: NodeJS.Timeout | null = null

  constructor() {
    this.store = new Store({
      name: 'custom-providers',
      encryptionKey: 'miaoda-chat-custom-providers-key',
      defaults: {
        providers: {},
        healthStatus: {}
      }
    })
    
    this.loadProviders()
    this.startHealthMonitoring()
  }

  /**
   * Add a new custom provider
   */
  async addProvider(config: Omit<CustomProviderConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const id = this.generateProviderId(config.name)
      const now = new Date().toISOString()
      
      const fullConfig: CustomProviderConfig = {
        ...config,
        id,
        createdAt: now,
        updatedAt: now
      }

      // Validate connection before adding
      const provider = new CustomOpenAIProvider(fullConfig)
      const validationResult = await provider.validateConnection()
      
      if (!validationResult.success) {
        return { 
          success: false, 
          error: `Connection validation failed: ${validationResult.error}` 
        }
      }

      // Store provider
      this.providers.set(id, fullConfig)
      this.saveProviders()
      
      // Initialize health status
      this.healthStatus.set(id, {
        providerName: config.displayName,
        isHealthy: true,
        lastChecked: now
      })
      this.saveHealthStatus()

      logger.info(`Custom provider added: ${config.displayName}`, 'CustomProviderManager', { id })
      
      return { success: true, id }
    } catch (error: any) {
      logger.error('Failed to add custom provider', 'CustomProviderManager', { error: error.message })
      return { success: false, error: error.message }
    }
  }

  /**
   * Update an existing custom provider
   */
  async updateProvider(id: string, updates: Partial<Omit<CustomProviderConfig, 'id' | 'createdAt' | 'updatedAt'>>): Promise<{ success: boolean; error?: string }> {
    try {
      const existingConfig = this.providers.get(id)
      if (!existingConfig) {
        return { success: false, error: 'Provider not found' }
      }

      const updatedConfig: CustomProviderConfig = {
        ...existingConfig,
        ...updates,
        updatedAt: new Date().toISOString()
      }

      // Validate connection if API details changed
      const needsValidation = updates.apiKey || updates.baseURL || updates.model
      if (needsValidation) {
        const provider = new CustomOpenAIProvider(updatedConfig)
        const validationResult = await provider.validateConnection()
        
        if (!validationResult.success) {
          return { 
            success: false, 
            error: `Connection validation failed: ${validationResult.error}` 
          }
        }
      }

      this.providers.set(id, updatedConfig)
      this.saveProviders()

      logger.info(`Custom provider updated: ${updatedConfig.displayName}`, 'CustomProviderManager', { id })
      
      return { success: true }
    } catch (error: any) {
      logger.error('Failed to update custom provider', 'CustomProviderManager', { error: error.message, id })
      return { success: false, error: error.message }
    }
  }

  /**
   * Remove a custom provider
   */
  removeProvider(id: string): { success: boolean; error?: string } {
    try {
      const config = this.providers.get(id)
      if (!config) {
        return { success: false, error: 'Provider not found' }
      }

      this.providers.delete(id)
      this.healthStatus.delete(id)
      
      this.saveProviders()
      this.saveHealthStatus()

      logger.info(`Custom provider removed: ${config.displayName}`, 'CustomProviderManager', { id })
      
      return { success: true }
    } catch (error: any) {
      logger.error('Failed to remove custom provider', 'CustomProviderManager', { error: error.message, id })
      return { success: false, error: error.message }
    }
  }

  /**
   * Get all custom providers
   */
  getAllProviders(): CustomProviderConfig[] {
    return Array.from(this.providers.values())
  }

  /**
   * Get a specific provider by ID
   */
  getProvider(id: string): CustomProviderConfig | undefined {
    return this.providers.get(id)
  }

  /**
   * Get provider health status
   */
  getProviderHealth(id: string): ProviderHealthStatus | undefined {
    return this.healthStatus.get(id)
  }

  /**
   * Get all health statuses
   */
  getAllHealthStatuses(): ProviderHealthStatus[] {
    return Array.from(this.healthStatus.values())
  }

  /**
   * Manually check health of a specific provider
   */
  async checkProviderHealth(id: string): Promise<ProviderHealthStatus> {
    const config = this.providers.get(id)
    if (!config) {
      throw new Error('Provider not found')
    }

    const startTime = Date.now()
    const provider = new CustomOpenAIProvider(config)
    
    try {
      const result = await provider.validateConnection()
      const responseTime = Date.now() - startTime
      
      const healthStatus: ProviderHealthStatus = {
        providerName: config.displayName,
        isHealthy: result.success,
        lastChecked: new Date().toISOString(),
        error: result.error,
        responseTime
      }

      this.healthStatus.set(id, healthStatus)
      this.saveHealthStatus()
      
      return healthStatus
    } catch (error: any) {
      const healthStatus: ProviderHealthStatus = {
        providerName: config.displayName,
        isHealthy: false,
        lastChecked: new Date().toISOString(),
        error: error.message,
        responseTime: Date.now() - startTime
      }

      this.healthStatus.set(id, healthStatus)
      this.saveHealthStatus()
      
      return healthStatus
    }
  }

  /**
   * Check health of all providers
   */
  async checkAllProvidersHealth(): Promise<ProviderHealthStatus[]> {
    const results: ProviderHealthStatus[] = []
    
    for (const [id] of this.providers) {
      try {
        const health = await this.checkProviderHealth(id)
        results.push(health)
      } catch (error: any) {
        logger.error(`Health check failed for provider ${id}`, 'CustomProviderManager', { error: error.message })
      }
    }
    
    return results
  }

  /**
   * Export providers configuration (without API keys)
   */
  exportProviders(): Omit<CustomProviderConfig, 'apiKey'>[] {
    return this.getAllProviders().map(({ apiKey, ...config }) => config)
  }

  /**
   * Import providers configuration
   */
  async importProviders(providers: CustomProviderConfig[]): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0
    let failed = 0
    const errors: string[] = []

    for (const config of providers) {
      try {
        const result = await this.addProvider(config)
        if (result.success) {
          success++
        } else {
          failed++
          errors.push(`${config.displayName}: ${result.error}`)
        }
      } catch (error: any) {
        failed++
        errors.push(`${config.displayName}: ${error.message}`)
      }
    }

    return { success, failed, errors }
  }

  /**
   * Generate unique provider ID
   */
  private generateProviderId(name: string): string {
    const base = name.toLowerCase().replace(/[^a-z0-9]/g, '-')
    const timestamp = Date.now().toString(36)
    return `custom-${base}-${timestamp}`
  }

  /**
   * Load providers from store
   */
  private loadProviders(): void {
    try {
      const storedProviders = this.store.get('providers', {}) as Record<string, CustomProviderConfig>
      const storedHealth = this.store.get('healthStatus', {}) as Record<string, ProviderHealthStatus>
      
      console.log('[CustomProviderManager] Loading providers from store:', storedProviders)
      
      for (const [id, config] of Object.entries(storedProviders)) {
        this.providers.set(id, config)
      }
      
      for (const [id, health] of Object.entries(storedHealth)) {
        this.healthStatus.set(id, health)
      }
      
      logger.info(`Loaded ${this.providers.size} custom providers`, 'CustomProviderManager')
      console.log('[CustomProviderManager] Loaded providers:', Array.from(this.providers.keys()))
    } catch (error: any) {
      logger.error('Failed to load custom providers', 'CustomProviderManager', { error: error.message })
    }
  }

  /**
   * Save providers to store
   */
  private saveProviders(): void {
    try {
      const providersObj = Object.fromEntries(this.providers.entries())
      this.store.set('providers', providersObj)
    } catch (error: any) {
      logger.error('Failed to save custom providers', 'CustomProviderManager', { error: error.message })
    }
  }

  /**
   * Save health status to store
   */
  private saveHealthStatus(): void {
    try {
      const healthObj = Object.fromEntries(this.healthStatus.entries())
      this.store.set('healthStatus', healthObj)
    } catch (error: any) {
      logger.error('Failed to save health status', 'CustomProviderManager', { error: error.message })
    }
  }

  /**
   * Start periodic health monitoring
   */
  private startHealthMonitoring(): void {
    // Check health every 5 minutes
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.checkAllProvidersHealth()
      } catch (error: any) {
        logger.error('Periodic health check failed', 'CustomProviderManager', { error: error.message })
      }
    }, 5 * 60 * 1000)
    
    logger.info('Started health monitoring for custom providers', 'CustomProviderManager')
  }

  /**
   * Stop health monitoring
   */
  private stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
      logger.info('Stopped health monitoring for custom providers', 'CustomProviderManager')
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopHealthMonitoring()
    this.providers.clear()
    this.healthStatus.clear()
  }
}