import { LLMProvider, OpenAIProvider, AnthropicProvider, OllamaProvider } from './provider'
import { ipcMain } from 'electron'
import Store from 'electron-store'

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

  constructor() {
    this.store = new Store()
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
      const response = await this.currentProvider.sendMessage(message, (chunk) => {
        onChunk?.(chunk)
        // Send chunk to renderer
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
}

// Global instance
export const llmManager = new LLMManager()

// IPC handlers
ipcMain.handle('llm:setProvider', async (_, config: LLMConfig) => {
  return llmManager.setProvider(config)
})

ipcMain.handle('llm:sendMessage', async (_, message: string, chatId: string, messageId: string) => {
  return llmManager.sendMessage(message, chatId, messageId)
})

ipcMain.handle('llm:getConfig', () => {
  return llmManager.getConfig()
})

ipcMain.handle('llm:isConfigured', () => {
  return llmManager.isConfigured()
})