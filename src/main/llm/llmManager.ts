import { LLMProvider, OpenAIProvider, AnthropicProvider, OllamaProvider } from './provider'
import { ipcMain } from 'electron'
import Store from 'electron-store'
import { MCPManager } from '../mcp/mcpManager'

interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'ollama'
  apiKey?: string
  baseURL?: string
  model?: string
}

export class LLMManager {
  private providers: Map<string, LLMProvider> = new Map()
  private currentProvider: LLMProvider | null = null
  private store: Store
  private mcpManager: MCPManager
  private enableTools: boolean = false

  constructor(mcpManager: MCPManager) {
    this.store = new Store()
    this.mcpManager = mcpManager
    this.loadConfig()
    this.enableTools = this.store.get('enableTools', false) as boolean
  }

  private loadConfig() {
    const config = this.store.get('llmConfig') as LLMConfig | undefined
    if (config) {
      this.setProvider(config)
    }
  }

  setProvider(config: LLMConfig) {
    try {
      let provider: LLMProvider

      switch (config.provider) {
        case 'openai':
          if (!config.apiKey) throw new Error('OpenAI API key is required')
          provider = new OpenAIProvider(config.apiKey, config.baseURL)
          break

        case 'anthropic':
          if (!config.apiKey) throw new Error('Anthropic API key is required')
          provider = new AnthropicProvider(config.apiKey)
          break

        case 'ollama':
          provider = new OllamaProvider(config.model || 'llama2', config.baseURL)
          break

        default:
          throw new Error(`Unknown provider: ${config.provider}`)
      }

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
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    if (!this.currentProvider) {
      throw new Error('No LLM provider configured')
    }

    try {
      // Check if tools are enabled and provider supports tools
      if (this.enableTools && this.currentProvider.sendMessageWithTools) {
        const tools = this.mcpManager.getAvailableTools()
        
        if (tools.length > 0) {
          // Send status update to UI
          if (global.mainWindow) {
            global.mainWindow.webContents.send('llm:status', {
              chatId,
              messageId,
              status: 'Tools available',
              tools: tools.map(t => t.name)
            })
          }

          const response = await this.currentProvider.sendMessageWithTools(
            message,
            tools,
            (chunk) => {
              onChunk?.(chunk)
              if (global.mainWindow) {
                global.mainWindow.webContents.send('llm:chunk', {
                  chatId,
                  messageId,
                  chunk
                })
              }
            },
            async (toolName, args) => {
              // Notify UI about tool call
              if (global.mainWindow) {
                global.mainWindow.webContents.send('llm:tool-call', {
                  chatId,
                  messageId,
                  tool: toolName,
                  args
                })
              }

              // Execute tool via MCP
              const result = await this.mcpManager.callTool(toolName, args)
              return result
            }
          )

          return response
        }
      }

      // Fallback to regular message without tools
      const response = await this.currentProvider.sendMessage(message, (chunk) => {
        onChunk?.(chunk)
        if (global.mainWindow) {
          global.mainWindow.webContents.send('llm:chunk', {
            chatId,
            messageId,
            chunk
          })
        }
      })

      return response
    } catch (error: any) {
      throw new Error(`LLM Error: ${error.message}`)
    }
  }

  getConfig(): LLMConfig | undefined {
    return this.store.get('llmConfig') as LLMConfig | undefined
  }

  isConfigured(): boolean {
    return this.currentProvider !== null
  }

  setToolsEnabled(enabled: boolean) {
    this.enableTools = enabled
    this.store.set('enableTools', enabled)
  }

  getToolsEnabled(): boolean {
    return this.enableTools
  }
}

// Create manager with MCP
export function createLLMManager(mcpManager: MCPManager): LLMManager {
  const manager = new LLMManager(mcpManager)
  
  // IPC handlers
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
  
  return manager
}