import { LLMProvider } from './provider'
import { MCPManager } from '../mcp/mcpManager'

export interface MessageContext {
  chatId: string
  messageId: string
}

export interface ChunkCallback {
  (chunk: string): void
}

export interface ToolCallback {
  (toolName: string, args: any): Promise<any>
}

/**
 * Service for handling LLM message processing with tools integration
 */
export class MessageService {
  constructor(
    private mcpManager: MCPManager,
    private enableTools: boolean = false
  ) {}

  async sendMessage(
    provider: LLMProvider,
    message: string | any[],
    context: MessageContext,
    onChunk?: ChunkCallback
  ): Promise<string> {
    // 转换单个消息为消息历史格式
    const messages =
      typeof message === 'string'
        ? [{ role: 'user', content: message }]
        : [
            {
              role: 'user',
              content: Array.isArray(message)
                ? message.map(m => m.text || '').join('\n')
                : String(message)
            }
          ]

    if (this.shouldUseTools(provider)) {
      return this.sendMessageWithTools(provider, messages, context, onChunk)
    }

    return this.sendBasicMessage(provider, messages, context, onChunk)
  }

  private shouldUseTools(provider: LLMProvider): boolean {
    if (!this.enableTools || !provider.sendMessageWithTools) {
      return false
    }

    const tools = this.mcpManager.getAvailableTools()
    return tools.length > 0
  }

  private async sendMessageWithTools(
    provider: LLMProvider,
    messages: Array<{ role: string; content: string }>,
    context: MessageContext,
    onChunk?: ChunkCallback
  ): Promise<string> {
    const tools = this.mcpManager.getAvailableTools()

    this.notifyToolsAvailable(
      context,
      tools.map(t => t.name)
    )

    const response = await provider.sendMessageWithTools!(
      messages,
      tools,
      this.createChunkHandler(context, onChunk),
      this.createToolHandler(context)
    )

    // Notify that streaming is complete
    this.notifyStreamComplete(context, response)

    return response
  }

  private async sendBasicMessage(
    provider: LLMProvider,
    messages: Array<{ role: string; content: string }>,
    context: MessageContext,
    onChunk?: ChunkCallback
  ): Promise<string> {
    const response = await provider.sendMessage(messages, this.createChunkHandler(context, onChunk))

    // Notify that streaming is complete
    this.notifyStreamComplete(context, response)

    return response
  }

  private createChunkHandler(context: MessageContext, onChunk?: ChunkCallback): ChunkCallback {
    return (chunk: string) => {
      onChunk?.(chunk)
      this.notifyChunk(context, chunk)
    }
  }

  private createToolHandler(context: MessageContext): ToolCallback {
    return async (toolName: string, args: any) => {
      this.notifyToolCall(context, toolName, args)
      return this.mcpManager.callTool(toolName, args)
    }
  }

  private notifyToolsAvailable(context: MessageContext, toolNames: string[]): void {
    if (global.mainWindow) {
      global.mainWindow.webContents.send('llm:status', {
        ...context,
        status: 'Tools available',
        tools: toolNames
      })
    }
  }

  private notifyChunk(context: MessageContext, chunk: string): void {
    console.log('[MessageService] Sending chunk:', { context, chunk: chunk.substring(0, 50) })
    if (global.mainWindow) {
      global.mainWindow.webContents.send('llm:chunk', {
        ...context,
        chunk
      })
    } else {
      console.error('[MessageService] No mainWindow available for chunk sending')
    }
  }

  private notifyStreamComplete(context: MessageContext, finalContent: string): void {
    if (global.mainWindow) {
      global.mainWindow.webContents.send('llm:stream-complete', {
        ...context,
        finalContent
      })
    }
  }

  private notifyToolCall(context: MessageContext, toolName: string, args: any): void {
    if (global.mainWindow) {
      global.mainWindow.webContents.send('llm:tool-call', {
        ...context,
        tool: toolName,
        args
      })
    }
  }

  setToolsEnabled(enabled: boolean): void {
    this.enableTools = enabled
  }

  getToolsEnabled(): boolean {
    return this.enableTools
  }
}
