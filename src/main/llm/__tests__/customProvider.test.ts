/**
 * Basic integration tests for custom provider functionality
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { CustomProviderManager } from '../customProviderManager'
import { ProviderFactory } from '../ProviderFactory'
import { CustomOpenAIProvider } from '../provider'
import type { CustomProviderConfig } from '../provider'

// Mock electron-store
vi.mock('electron-store', () => {
  return {
    default: class MockStore {
      private data = new Map()
      
      constructor(config: any) {}
      
      get(key: string, defaultValue?: any) {
        return this.data.get(key) || defaultValue
      }
      
      set(key: string, value: any) {
        this.data.set(key, value)
      }
      
      delete(key: string) {
        this.data.delete(key)
      }
    }
  }
})

// Mock logger
vi.mock('../../utils/Logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}))

// Mock OpenAI to avoid browser environment issues
vi.mock('openai', () => {
  return {
    default: class MockOpenAI {
      constructor() {}
      chat = {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{ message: { content: 'test response' } }]
          })
        }
      }
    }
  }
})

describe('CustomProviderManager', () => {
  let manager: CustomProviderManager
  
  beforeEach(() => {
    manager = new CustomProviderManager()
    // Stop health monitoring for tests
    ;(manager as any).stopHealthMonitoring()
  })
  
  afterEach(() => {
    manager.destroy()
  })

  describe('Provider Management', () => {
    const sampleConfig = {
      name: 'test-provider',
      displayName: 'Test Provider',
      apiKey: 'test-key',
      baseURL: 'https://api.test.com/v1',
      model: 'test-model',
      type: 'openai-compatible' as const
    }

    it('should add a custom provider', async () => {
      // Mock the validation to avoid actual API calls
      vi.spyOn(CustomOpenAIProvider.prototype, 'validateConnection')
        .mockResolvedValue({ success: true })

      const result = await manager.addProvider(sampleConfig)
      
      expect(result.success).toBe(true)
      expect(result.id).toBeDefined()
      
      const providers = manager.getAllProviders()
      expect(providers).toHaveLength(1)
      expect(providers[0].name).toBe('test-provider')
    })

    it('should update a custom provider', async () => {
      // Mock the validation
      vi.spyOn(CustomOpenAIProvider.prototype, 'validateConnection')
        .mockResolvedValue({ success: true })

      const addResult = await manager.addProvider(sampleConfig)
      expect(addResult.success).toBe(true)
      
      const updateResult = await manager.updateProvider(addResult.id!, {
        displayName: 'Updated Test Provider'
      })
      
      expect(updateResult.success).toBe(true)
      
      const provider = manager.getProvider(addResult.id!)
      expect(provider?.displayName).toBe('Updated Test Provider')
    })

    it('should remove a custom provider', async () => {
      // Mock the validation
      vi.spyOn(CustomOpenAIProvider.prototype, 'validateConnection')
        .mockResolvedValue({ success: true })

      const addResult = await manager.addProvider(sampleConfig)
      expect(addResult.success).toBe(true)
      
      const removeResult = manager.removeProvider(addResult.id!)
      expect(removeResult.success).toBe(true)
      
      const providers = manager.getAllProviders()
      expect(providers).toHaveLength(0)
    })

    it('should handle validation failures', async () => {
      // Mock failed validation
      vi.spyOn(CustomOpenAIProvider.prototype, 'validateConnection')
        .mockResolvedValue({ success: false, error: 'Connection failed' })

      const result = await manager.addProvider(sampleConfig)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Connection failed')
    })
  })

  describe('Health Monitoring', () => {
    it('should check provider health', async () => {
      // Mock the validation
      vi.spyOn(CustomOpenAIProvider.prototype, 'validateConnection')
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: true })

      const addResult = await manager.addProvider({
        name: 'test-provider',
        displayName: 'Test Provider',
        apiKey: 'test-key',
        baseURL: 'https://api.test.com/v1',
        model: 'test-model',
        type: 'openai-compatible' as const
      })
      
      expect(addResult.success).toBe(true)
      
      const health = await manager.checkProviderHealth(addResult.id!)
      expect(health.providerName).toBe('Test Provider')
      expect(health.isHealthy).toBe(true)
    })
  })
})

describe('ProviderFactory', () => {
  let manager: CustomProviderManager
  
  beforeEach(() => {
    manager = new CustomProviderManager()
    ProviderFactory.setCustomProviderManager(manager)
    ;(manager as any).stopHealthMonitoring()
  })
  
  afterEach(() => {
    manager.destroy()
  })

  it('should create custom provider', async () => {
    // Mock validation
    vi.spyOn(CustomOpenAIProvider.prototype, 'validateConnection')
      .mockResolvedValue({ success: true })

    // Add a custom provider
    const addResult = await manager.addProvider({
      name: 'test-provider',
      displayName: 'Test Provider',
      apiKey: 'test-key',
      baseURL: 'https://api.test.com/v1',
      model: 'test-model',
      type: 'openai-compatible' as const
    })
    
    expect(addResult.success).toBe(true)
    
    // Create provider using factory
    const provider = ProviderFactory.createProvider({
      provider: 'custom',
      customProviderId: addResult.id!
    })
    
    expect(provider).toBeInstanceOf(CustomOpenAIProvider)
    expect(provider.name).toBe(addResult.id!)
    expect(provider.displayName).toBe('Test Provider')
    expect(provider.isCustom).toBe(true)
  })

  it('should get all providers', () => {
    const providers = ProviderFactory.getAllProviders()
    
    // Should include built-in providers
    const builtInProviders = providers.filter(p => !p.isCustom)
    expect(builtInProviders).toEqual([
      { id: 'openai', name: 'openai', displayName: 'OpenAI' },
      { id: 'anthropic', name: 'anthropic', displayName: 'Anthropic Claude' },
      { id: 'ollama', name: 'ollama', displayName: 'Ollama Local' }
    ])
  })
})