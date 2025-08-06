import { LLMProvider } from './provider'
import { ipcMain } from 'electron'
import Store from 'electron-store'
import { MCPManager } from '../mcp/mcpManager'
import { ProviderFactory, LLMConfig } from './ProviderFactory'
import { MessageService, MessageContext, ChunkCallback } from './MessageService'

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

  constructor(mcpManager: MCPManager) {
    this.store = new Store()
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
    message: string,
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

  ipcMain.handle('llm:sendMessage', async (_, message: string, chatId: string, messageId: string) => {
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
}