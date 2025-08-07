import { LLMProvider, CustomProviderConfig, ProviderHealthStatus } from './provider'
import { ipcMain } from 'electron'
import Store from 'electron-store'
import { MCPManager } from '../mcp/mcpManager'
import { ProviderFactory, LLMConfig } from './ProviderFactory'
import { MessageService, MessageContext, ChunkCallback } from './MessageService'
import { CustomProviderManager } from './customProviderManager'
import { logger } from '../utils/Logger'

// Re-export for convenience
export type { LLMConfig }

/**
 * Refactored LLM Manager with reduced complexity
 * Delegates provider creation to ProviderFactory
 * Delegates message handling to MessageService
 */
export class LLMManager {
  private providers: Map<string, LLMProvider> = new Map()
  private currentProvider: LLMProvider | null = null
  private store: Store
  private messageService: MessageService
  private customProviderManager: CustomProviderManager

  constructor(mcpManager: MCPManager) {
    this.store = new Store()
    this.customProviderManager = new CustomProviderManager()
    
    // Initialize custom provider manager with factory
    ProviderFactory.setCustomProviderManager(this.customProviderManager)
    
    this.messageService = new MessageService(
      mcpManager,
      this.store.get('enableTools', false) as boolean
    )
    this.loadConfig()
  }

  private loadConfig() {
    const config = this.store.get('llmConfig') as LLMConfig | undefined
    if (config) {
      this.setProvider(config)
    }
  }

  setProvider(config: LLMConfig) {
    try {
      const provider = ProviderFactory.createProvider(config)
      
      this.providers.set(config.provider, provider)
      this.currentProvider = provider
      this.store.set('llmConfig', config)

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async sendMessage(
    message: string | any[],
    chatId: string,
    messageId: string,
    onChunk?: ChunkCallback
  ): Promise<string> {
    this.validateProvider()

    try {
      const context: MessageContext = { chatId, messageId }
      return await this.messageService.sendMessage(
        this.currentProvider!,
        message,
        context,
        onChunk
      )
    } catch (error: any) {
      throw new Error(`LLM Error: ${error.message}`)
    }
  }

  private validateProvider(): void {
    if (!this.currentProvider) {
      throw new Error('No LLM provider configured')
    }
  }

  getConfig(): LLMConfig | undefined {
    return this.store.get('llmConfig') as LLMConfig | undefined
  }

  isConfigured(): boolean {
    return this.currentProvider !== null
  }

  setToolsEnabled(enabled: boolean): void {
    this.messageService.setToolsEnabled(enabled)
    this.store.set('enableTools', enabled)
  }

  getToolsEnabled(): boolean {
    return this.messageService.getToolsEnabled()
  }

  // Custom Provider Management Methods
  async addCustomProvider(config: Omit<CustomProviderConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; id?: string; error?: string }> {
    return await this.customProviderManager.addProvider(config)
  }

  async updateCustomProvider(id: string, updates: Partial<Omit<CustomProviderConfig, 'id' | 'createdAt' | 'updatedAt'>>): Promise<{ success: boolean; error?: string }> {
    return await this.customProviderManager.updateProvider(id, updates)
  }

  removeCustomProvider(id: string): { success: boolean; error?: string } {
    return this.customProviderManager.removeProvider(id)
  }

  getAllCustomProviders(): CustomProviderConfig[] {
    return this.customProviderManager.getAllProviders()
  }

  getCustomProvider(id: string): CustomProviderConfig | undefined {
    return this.customProviderManager.getProvider(id)
  }

  async checkCustomProviderHealth(id: string): Promise<ProviderHealthStatus> {
    return await this.customProviderManager.checkProviderHealth(id)
  }

  async checkAllCustomProvidersHealth(): Promise<ProviderHealthStatus[]> {
    return await this.customProviderManager.checkAllProvidersHealth()
  }

  getAllProviderHealthStatuses(): ProviderHealthStatus[] {
    return this.customProviderManager.getAllHealthStatuses()
  }

  getCustomProviderHealth(id: string): ProviderHealthStatus | undefined {
    return this.customProviderManager.getProviderHealth(id)
  }

  exportCustomProviders(): Omit<CustomProviderConfig, 'apiKey'>[] {
    return this.customProviderManager.exportProviders()
  }

  async importCustomProviders(providers: CustomProviderConfig[]): Promise<{ success: number; failed: number; errors: string[] }> {
    return await this.customProviderManager.importProviders(providers)
  }

  /**
   * Get all available providers (built-in + custom)
   */
  getAllProviders(): Array<{id: string; name: string; displayName: string; isCustom?: boolean}> {
    return ProviderFactory.getAllProviders()
  }

  /**
   * Cleanup resources when manager is destroyed
   */
  destroy(): void {
    this.customProviderManager.destroy()
    this.providers.clear()
    this.currentProvider = null
  }
}

// Create manager with MCP
export function createLLMManager(mcpManager: MCPManager): LLMManager {
  return new LLMManager(mcpManager)
}

// Register LLM IPC handlers
export function registerLLMHandlers(manager: LLMManager) {
  ipcMain.handle('llm:setProvider', async (_, config: LLMConfig) => {
    return manager.setProvider(config)
  })

  ipcMain.handle('llm:sendMessage', async (_, message: string | any[], chatId: string, messageId: string) => {
    return manager.sendMessage(message, chatId, messageId)
  })

  ipcMain.handle('llm:getConfig', () => {
    return manager.getConfig()
  })

  ipcMain.handle('llm:isConfigured', () => {
    return manager.isConfigured()
  })

  ipcMain.handle('llm:setToolsEnabled', async (_, enabled: boolean) => {
    manager.setToolsEnabled(enabled)
  })

  ipcMain.handle('llm:getToolsEnabled', () => {
    return manager.getToolsEnabled()
  })

  ipcMain.handle('llm:getAllProviders', () => {
    return manager.getAllProviders()
  })

  // Custom provider handlers
  ipcMain.handle('llm:addCustomProvider', async (_, config: Omit<CustomProviderConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      return await manager.addCustomProvider(config)
    } catch (error: any) {
      logger.error('Failed to add custom provider', 'LLM-IPC', { error: error.message })
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('llm:updateCustomProvider', async (_, id: string, updates: Partial<Omit<CustomProviderConfig, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      return await manager.updateCustomProvider(id, updates)
    } catch (error: any) {
      logger.error('Failed to update custom provider', 'LLM-IPC', { error: error.message, id })
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('llm:removeCustomProvider', (_, id: string) => {
    try {
      return manager.removeCustomProvider(id)
    } catch (error: any) {
      logger.error('Failed to remove custom provider', 'LLM-IPC', { error: error.message, id })
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('llm:getAllCustomProviders', () => {
    try {
      return manager.getAllCustomProviders()
    } catch (error: any) {
      logger.error('Failed to get all custom providers', 'LLM-IPC', { error: error.message })
      return []
    }
  })

  ipcMain.handle('llm:getCustomProvider', (_, id: string) => {
    try {
      return manager.getCustomProvider(id)
    } catch (error: any) {
      logger.error('Failed to get custom provider', 'LLM-IPC', { error: error.message, id })
      return null
    }
  })

  ipcMain.handle('llm:checkCustomProviderHealth', async (_, id: string) => {
    try {
      return await manager.checkCustomProviderHealth(id)
    } catch (error: any) {
      logger.error('Failed to check custom provider health', 'LLM-IPC', { error: error.message, id })
      return { providerName: 'Unknown', isHealthy: false, lastChecked: new Date().toISOString(), error: error.message }
    }
  })

  ipcMain.handle('llm:checkAllCustomProvidersHealth', async () => {
    try {
      return await manager.checkAllCustomProvidersHealth()
    } catch (error: any) {
      logger.error('Failed to check all custom providers health', 'LLM-IPC', { error: error.message })
      return []
    }
  })

  ipcMain.handle('llm:getAllProviderHealthStatuses', () => {
    try {
      return manager.getAllProviderHealthStatuses()
    } catch (error: any) {
      logger.error('Failed to get provider health statuses', 'LLM-IPC', { error: error.message })
      return []
    }
  })

  ipcMain.handle('llm:getCustomProviderHealth', (_, id: string) => {
    try {
      return manager.getCustomProviderHealth(id)
    } catch (error: any) {
      logger.error('Failed to get custom provider health', 'LLM-IPC', { error: error.message, id })
      return null
    }
  })

  ipcMain.handle('llm:exportCustomProviders', () => {
    try {
      return manager.exportCustomProviders()
    } catch (error: any) {
      logger.error('Failed to export custom providers', 'LLM-IPC', { error: error.message })
      return []
    }
  })

  ipcMain.handle('llm:importCustomProviders', async (_, providers: CustomProviderConfig[]) => {
    try {
      return await manager.importCustomProviders(providers)
    } catch (error: any) {
      logger.error('Failed to import custom providers', 'LLM-IPC', { error: error.message })
      return { success: 0, failed: providers.length, errors: [error.message] }
    }
  })
}