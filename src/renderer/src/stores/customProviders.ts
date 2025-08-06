import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { customProviderService } from '@renderer/src/services/CustomProviderService'
import type { 
  CustomProviderConfig, 
  ProviderHealthStatus,
  CustomProviderFormData,
  ProviderListItem,
  CustomProviderOperationResult,
  ProviderImportResult 
} from '@/types/customProvider'

interface CustomProviderState {
  id: string
  config: CustomProviderConfig
  status: ProviderHealthStatus
  lastChecked: Date | null
  lastError: string | null
  isHealthy: boolean
}

interface CustomProviderCache {
  providers: CustomProviderState[]
  lastSyncTime: Date | null
  version: number
}

export const useCustomProvidersStore = defineStore('customProviders', () => {
  // State
  const providers = ref<Map<string, CustomProviderState>>(new Map())
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastSyncTime = ref<Date | null>(null)
  const healthCheckInterval = ref<NodeJS.Timeout | null>(null)
  const cacheVersion = ref(1)

  // Cache management
  const localStorageKey = 'custom-providers-cache'
  
  // Computed
  const providersList = computed(() => Array.from(providers.value.values()))
  
  const providerOptions = computed(() => 
    providersList.value.map(provider => ({
      id: provider.id,
      name: provider.config.name,
      displayName: provider.config.displayName || provider.config.name,
      isHealthy: provider.isHealthy,
      lastChecked: provider.lastChecked?.toISOString(),
      error: provider.lastError
    } as ProviderListItem))
  )

  const healthyProviders = computed(() => 
    providersList.value.filter(p => p.isHealthy)
  )

  const unhealthyProviders = computed(() => 
    providersList.value.filter(p => !p.isHealthy)
  )

  const providersCount = computed(() => providers.value.size)

  const hasProviders = computed(() => providers.value.size > 0)

  const isAnyProviderHealthy = computed(() => healthyProviders.value.length > 0)

  // Cache operations
  const saveToCache = () => {
    try {
      const cache: CustomProviderCache = {
        providers: providersList.value,
        lastSyncTime: lastSyncTime.value,
        version: cacheVersion.value
      }
      localStorage.setItem(localStorageKey, JSON.stringify(cache))
    } catch (err) {
      console.warn('Failed to save custom providers cache:', err)
    }
  }

  const loadFromCache = () => {
    try {
      const cached = localStorage.getItem(localStorageKey)
      if (!cached) return false

      const cache: CustomProviderCache = JSON.parse(cached)
      if (cache.version !== cacheVersion.value) {
        // Cache version mismatch, clear it
        localStorage.removeItem(localStorageKey)
        return false
      }

      // Restore providers from cache
      providers.value.clear()
      cache.providers.forEach(provider => {
        providers.value.set(provider.id, {
          ...provider,
          lastChecked: provider.lastChecked ? new Date(provider.lastChecked) : null
        })
      })
      
      lastSyncTime.value = cache.lastSyncTime ? new Date(cache.lastSyncTime) : null
      return true
    } catch (err) {
      console.warn('Failed to load custom providers cache:', err)
      localStorage.removeItem(localStorageKey)
      return false
    }
  }

  const clearCache = () => {
    localStorage.removeItem(localStorageKey)
  }

  // Actions
  const fetchProviders = async () => {
    if (loading.value) return

    loading.value = true
    error.value = null

    try {
      const result = await customProviderService.getAllProviders()
      
      if (result.success && result.data) {
        providers.value.clear()
        
        result.data.forEach((config: CustomProviderConfig) => {
          providers.value.set(config.id, {
            id: config.id,
            config,
            status: 'unknown',
            lastChecked: null,
            lastError: null,
            isHealthy: false
          })
        })

        lastSyncTime.value = new Date()
        saveToCache()
      } else {
        throw new Error(result.error || 'Failed to fetch providers')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Failed to fetch custom providers:', err)
    } finally {
      loading.value = false
    }
  }

  const addProvider = async (formData: CustomProviderFormData): Promise<CustomProviderOperationResult> => {
    // Validate form data first
    const validationErrors = customProviderService.validateProviderConfig(formData)
    if (validationErrors.length > 0) {
      error.value = validationErrors.join('; ')
      return {
        success: false,
        error: error.value
      }
    }

    loading.value = true
    error.value = null

    try {
      const result = await customProviderService.createProvider(formData)
      
      if (result.success && result.data) {
        const config = result.data
        providers.value.set(config.id, {
          id: config.id,
          config,
          status: 'unknown',
          lastChecked: null,
          lastError: null,
          isHealthy: false
        })

        // Perform initial health check
        await checkProviderHealth(config.id)
        
        saveToCache()
        
        return { 
          success: true, 
          id: config.id 
        }
      } else {
        throw new Error(result.error || 'Failed to create provider')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add provider'
      error.value = message
      return { 
        success: false, 
        error: message 
      }
    } finally {
      loading.value = false
    }
  }

  const updateProvider = async (id: string, formData: Partial<CustomProviderFormData>): Promise<CustomProviderOperationResult> => {
    const existingProvider = providers.value.get(id)
    if (!existingProvider) {
      return { 
        success: false, 
        error: 'Provider not found' 
      }
    }

    loading.value = true
    error.value = null

    try {
      const result = await customProviderService.updateProvider(id, formData)
      
      if (result.success && result.data) {
        const config = result.data
        providers.value.set(id, {
          ...existingProvider,
          config,
          // Reset health status since config changed
          status: 'unknown',
          lastChecked: null,
          lastError: null,
          isHealthy: false
        })

        // Perform health check with updated config
        await checkProviderHealth(id)
        
        saveToCache()
        
        return { 
          success: true, 
          id 
        }
      } else {
        throw new Error(result.error || 'Failed to update provider')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update provider'
      error.value = message
      return { 
        success: false, 
        error: message 
      }
    } finally {
      loading.value = false
    }
  }

  const removeProvider = async (id: string): Promise<CustomProviderOperationResult> => {
    if (!providers.value.has(id)) {
      return { 
        success: false, 
        error: 'Provider not found' 
      }
    }

    loading.value = true
    error.value = null

    try {
      const result = await customProviderService.deleteProvider(id)
      
      if (result.success) {
        providers.value.delete(id)
        saveToCache()
        
        return { 
          success: true 
        }
      } else {
        throw new Error(result.error || 'Failed to delete provider')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove provider'
      error.value = message
      return { 
        success: false, 
        error: message 
      }
    } finally {
      loading.value = false
    }
  }

  const getProvider = (id: string): CustomProviderState | undefined => {
    return providers.value.get(id)
  }

  const getProviderConfig = (id: string): CustomProviderConfig | undefined => {
    return providers.value.get(id)?.config
  }

  const checkProviderHealth = async (id: string): Promise<boolean> => {
    const provider = providers.value.get(id)
    if (!provider) return false

    try {
      const result = await customProviderService.checkProviderHealth(id)
      
      provider.status = result.status
      provider.lastChecked = new Date()
      provider.lastError = result.error || null
      provider.isHealthy = result.status === 'healthy'
      
      saveToCache()
      
      return provider.isHealthy
    } catch (err) {
      provider.status = 'error'
      provider.lastChecked = new Date()
      provider.lastError = err instanceof Error ? err.message : 'Health check failed'
      provider.isHealthy = false
      
      saveToCache()
      
      return false
    }
  }

  const checkAllProvidersHealth = async (): Promise<Map<string, boolean>> => {
    const results = new Map<string, boolean>()
    
    const healthChecks = Array.from(providers.value.keys()).map(async (id) => {
      const isHealthy = await checkProviderHealth(id)
      results.set(id, isHealthy)
    })

    await Promise.allSettled(healthChecks)
    return results
  }

  const startHealthCheckMonitoring = (intervalMs = 300000) => { // 5 minutes default
    if (healthCheckInterval.value) {
      clearInterval(healthCheckInterval.value)
    }

    healthCheckInterval.value = setInterval(() => {
      if (hasProviders.value) {
        checkAllProvidersHealth()
      }
    }, intervalMs)
  }

  const stopHealthCheckMonitoring = () => {
    if (healthCheckInterval.value) {
      clearInterval(healthCheckInterval.value)
      healthCheckInterval.value = null
    }
  }

  const exportProviders = (): string => {
    const exportData = {
      providers: providersList.value.map(p => p.config),
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }
    
    return JSON.stringify(exportData, null, 2)
  }

  const importProviders = async (jsonData: string): Promise<ProviderImportResult> => {
    const result: ProviderImportResult = {
      success: 0,
      failed: 0,
      errors: []
    }

    try {
      const importData = JSON.parse(jsonData)
      
      if (!importData.providers || !Array.isArray(importData.providers)) {
        throw new Error('Invalid import format: providers array not found')
      }

      for (const config of importData.providers) {
        try {
          // Convert to form data format
          const formData: CustomProviderFormData = {
            name: config.name,
            displayName: config.displayName || config.name,
            apiKey: config.apiKey || '',
            baseURL: config.baseURL || config.endpoint,
            model: config.model || config.models?.[0] || '',
            type: config.type || 'openai-compatible',
            headers: config.headers,
            parameters: config.parameters
          }

          const addResult = await addProvider(formData)
          
          if (addResult.success) {
            result.success++
          } else {
            result.failed++
            result.errors.push(`${config.name}: ${addResult.error}`)
          }
        } catch (err) {
          result.failed++
          result.errors.push(`${config.name || 'Unknown provider'}: ${err instanceof Error ? err.message : 'Import failed'}`)
        }
      }
    } catch (err) {
      result.failed++
      result.errors.push(`Parse error: ${err instanceof Error ? err.message : 'Invalid JSON format'}`)
    }

    return result
  }

  const resetAllProviders = async (): Promise<boolean> => {
    try {
      const result = await customProviderService.resetProviders()
      
      if (result.success) {
        providers.value.clear()
        lastSyncTime.value = new Date()
        clearCache()
        return true
      }
      
      return false
    } catch (err) {
      console.error('Failed to reset providers:', err)
      return false
    }
  }

  const clearError = () => {
    error.value = null
  }

  const refreshProvider = async (id: string): Promise<boolean> => {
    const provider = providers.value.get(id)
    if (!provider) return false

    try {
      const result = await customProviderService.getProvider(id)
      
      if (result.success && result.data) {
        provider.config = result.data
        await checkProviderHealth(id)
        saveToCache()
        return true
      }
      
      return false
    } catch (err) {
      console.error(`Failed to refresh provider ${id}:`, err)
      return false
    }
  }

  const initialize = async (): Promise<boolean> => {
    // Try to load from cache first for instant startup
    const cacheLoaded = loadFromCache()
    
    // Always fetch from backend for up-to-date data
    await fetchProviders()
    
    // Start health monitoring
    startHealthCheckMonitoring()
    
    return cacheLoaded
  }

  // Watch for changes and save to cache
  watch(
    () => providers.value.size,
    () => {
      saveToCache()
    },
    { deep: true }
  )

  // Cleanup on store disposal
  const dispose = () => {
    stopHealthCheckMonitoring()
  }

  return {
    // State
    providers: providersList,
    loading,
    error,
    lastSyncTime,
    
    // Computed
    providerOptions,
    healthyProviders,
    unhealthyProviders,
    providersCount,
    hasProviders,
    isAnyProviderHealthy,
    
    // Actions
    fetchProviders,
    addProvider,
    updateProvider,
    removeProvider,
    getProvider,
    getProviderConfig,
    checkProviderHealth,
    checkAllProvidersHealth,
    startHealthCheckMonitoring,
    stopHealthCheckMonitoring,
    exportProviders,
    importProviders,
    resetAllProviders,
    clearError,
    refreshProvider,
    initialize,
    dispose,
    
    // Cache management
    clearCache
  }
}, {
  persist: {
    key: 'custom-providers-store',
    paths: ['lastSyncTime'],
    storage: localStorage
  }
})