import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
// import { GoogleGenerativeAI } from '@google/genai'
import { Ollama } from 'ollama'

export interface LLMProvider {
  name: string
  displayName?: string
  baseURL?: string
  isCustom?: boolean
  sendMessage(messages: Array<{role: string, content: string}>, onChunk?: (chunk: string) => void): Promise<string>
  sendMessageWithTools?(
    messages: Array<{role: string, content: string}>,
    tools: any[],
    onChunk?: (chunk: string) => void,
    onToolCall?: (tool: string, args: any) => Promise<any>
  ): Promise<string>
  validateConnection?(): Promise<{ success: boolean; error?: string }>
}

// Configuration interfaces for different provider types
export interface CustomProviderConfig {
  id: string
  name: string
  displayName: string
  apiKey: string
  baseURL: string
  model: string
  type: 'openai-compatible' | 'anthropic-compatible' | 'custom'
  headers?: Record<string, string>
  parameters?: {
    temperature?: number
    maxTokens?: number
    topP?: number
    frequencyPenalty?: number
    presencePenalty?: number
  }
  createdAt: string
  updatedAt: string
}

export interface ProviderHealthStatus {
  providerName: string
  isHealthy: boolean
  lastChecked: string
  error?: string
  responseTime?: number
}

export class OpenAIProvider implements LLMProvider {
  name = 'openai'
  displayName = 'OpenAI'
  baseURL?: string
  isCustom = false
  private client: OpenAI

  constructor(apiKey: string, baseURL?: string) {
    this.baseURL = baseURL
    this.client = new OpenAI({
      apiKey,
      baseURL,
    })
  }

  async sendMessage(messages: Array<{role: string, content: string}>, onChunk?: (chunk: string) => void): Promise<string> {
    // 准备系统消息
    const systemMessage = {
      role: 'system' as const,
      content: '请用中文回复，除非用户特别要求使用其他语言。请保持回复简洁明了，提供有帮助的信息。',
    }

    // 转换消息格式并添加系统消息
    const openaiMessages = [
      systemMessage,
      ...messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ]

    // 检测是否需要使用Vision模型（暂时简化，后续可扩展多模态支持）
    const model = 'gpt-4o-mini'

    const stream = await this.client.chat.completions.create({
      model,
      messages: openaiMessages,
      stream: true,
    })

    let fullResponse = ''
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || ''
      if (content) {
        fullResponse += content
        onChunk?.(content)
      }
    }

    return fullResponse
  }

  async sendMessageWithTools(
    message: string | any[],
    tools: any[],
    onChunk?: (chunk: string) => void,
    onToolCall?: (tool: string, args: any) => Promise<any>,
  ): Promise<string> {
    const messageContent = typeof message === 'string' ? message : message
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system' as const,
        content:
          '请用中文回复，除非用户特别要求使用其他语言。请保持回复简洁明了，提供有帮助的信息。',
      },
      { role: 'user' as const, content: messageContent },
    ]

    // 检测是否需要使用Vision模型
    const hasImages =
      Array.isArray(messageContent) && messageContent.some(content => content.type === 'image_url')
    const model = hasImages ? 'gpt-4o' : 'gpt-4o-mini'

    // Convert MCP tools to OpenAI format
    const openAITools = tools.map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      },
    }))

    const response = await this.client.chat.completions.create({
      model,
      messages,
      tools: openAITools,
      stream: false,
    })

    const responseMessage = response.choices[0].message

    // Handle tool calls
    if (responseMessage.tool_calls) {
      for (const toolCall of responseMessage.tool_calls) {
        if (onToolCall) {
          const args = JSON.parse((toolCall as any).function.arguments)
          const result = await onToolCall((toolCall as any).function.name, args)

          // Add tool result to messages
          messages.push(responseMessage)
          messages.push({
            role: 'tool' as const,
            content: JSON.stringify(result),
            tool_call_id: toolCall.id,
          })
        }
      }

      // Get final response after tool calls
      const finalResponse = await this.client.chat.completions.create({
        model,
        messages,
        stream: true,
      })

      let fullResponse = ''
      for await (const chunk of finalResponse) {
        const content = chunk.choices[0]?.delta?.content || ''
        if (content) {
          fullResponse += content
          onChunk?.(content)
        }
      }

      return fullResponse
    }

    return responseMessage.content || ''
  }
}

export class AnthropicProvider implements LLMProvider {
  name = 'anthropic'
  displayName = 'Anthropic Claude'
  isCustom = false
  private client: Anthropic

  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey,
    })
  }

  async sendMessage(messages: Array<{role: string, content: string}>, onChunk?: (chunk: string) => void): Promise<string> {
    const model = 'claude-3-5-sonnet-20241022'

    // 转换消息格式给Anthropic API
    const anthropicMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' as const : 'user' as const,
      content: msg.content,
    }))

    const stream = await this.client.messages.create({
      model,
      system: '请用中文回复，除非用户特别要求使用其他语言。请保持回复简洁明了，提供有帮助的信息。',
      messages: anthropicMessages,
      max_tokens: 4096,
      stream: true,
    })

    let fullResponse = ''
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        const content = chunk.delta.text
        fullResponse += content
        onChunk?.(content)
      }
    }

    return fullResponse
  }

  async sendMessageWithTools(
    message: string | any[],
    tools: any[],
    onChunk?: (chunk: string) => void,
    onToolCall?: (tool: string, args: any) => Promise<any>,
  ): Promise<string> {
    // Convert MCP tools to Anthropic format
    const anthropicTools = tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema,
    }))

    // 处理多模态消息格式
    let messageContent: any
    let model = 'claude-3-5-sonnet-20241022'

    if (typeof message === 'string') {
      messageContent = message
    } else {
      // 转换为Anthropic格式
      messageContent = message
        .map(content => {
          if (content.type === 'text') {
            return { type: 'text', text: content.text }
          } else if (content.type === 'image_url') {
            // 解析base64图片数据
            const imageData = content.image_url.url
            const match = imageData.match(/^data:image\/([^;]+);base64,(.+)$/)
            if (match) {
              return {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: `image/${match[1]}`,
                  data: match[2],
                },
              }
            }
          }
          return content
        })
        .filter(Boolean)
      model = 'claude-3-5-sonnet-20241022'
    }

    const messages: Array<{ role: 'user' | 'assistant'; content: any }> = [
      { role: 'user' as const, content: messageContent },
    ]

    // Initial request with tools
    const response = await this.client.messages.create({
      model,
      system: '请用中文回复，除非用户特别要求使用其他语言。请保持回复简洁明了，提供有帮助的信息。',
      messages,
      max_tokens: 4096,
      tools: anthropicTools,
    })

    // Handle tool use
    if (response.content.some(block => block.type === 'tool_use')) {
      const toolResults: Array<{ type: string; tool_use_id: string; content: string }> = []

      for (const block of response.content) {
        if (block.type === 'tool_use' && onToolCall) {
          const result = await onToolCall(block.name, block.input)
          toolResults.push({
            type: 'tool_result' as const,
            tool_use_id: block.id,
            content: JSON.stringify(result),
          })
        }
      }

      // Get final response after tool calls
      // Convert content blocks to text representation
      const assistantContent = response.content
        .filter(block => block.type === 'text')
        .map(block => (block as any).text)
        .join('')

      messages.push({ role: 'assistant', content: assistantContent })
      messages.push({
        role: 'user',
        content: toolResults
          .map(result => `Tool ${result.tool_use_id}: ${result.content}`)
          .join('\n'),
      })

      const finalStream = await this.client.messages.create({
        model,
        system:
          '请用中文回复，除非用户特别要求使用其他语言。请保持回复简洁明了，提供有帮助的信息。',
        messages,
        max_tokens: 4096,
        stream: true,
      })

      let fullResponse = ''
      for await (const chunk of finalStream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          const content = chunk.delta.text
          fullResponse += content
          onChunk?.(content)
        }
      }

      return fullResponse
    }

    // If no tool use, return the direct response
    return response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('')
  }
}

export class OllamaProvider implements LLMProvider {
  name = 'ollama'
  displayName = 'Ollama Local'
  baseURL?: string
  isCustom = false
  private client: Ollama
  private model: string

  constructor(model: string = 'llama2', host?: string) {
    this.client = new Ollama({ host })
    this.baseURL = host
    this.model = model
  }

  async sendMessage(messages: Array<{role: string, content: string}>, onChunk?: (chunk: string) => void): Promise<string> {
    // 转换消息格式给Ollama API
    const ollamaMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }))

    const response = await this.client.chat({
      model: this.model,
      messages: ollamaMessages,
      stream: true,
    })

    let fullResponse = ''
    for await (const chunk of response) {
      const content = chunk.message.content
      fullResponse += content
      onChunk?.(content)
    }

    return fullResponse
  }

  async sendMessageWithTools(
    message: string | any[],
    tools: any[],
    onChunk?: (chunk: string) => void,
    onToolCall?: (tool: string, args: any) => Promise<any>,
  ): Promise<string> {
    // Convert tools to Ollama format
    const ollamaTools = tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      },
    }))

    // Ollama目前主要支持文本，复杂的多模态消息转换为文本描述
    const messageContent =
      typeof message === 'string'
        ? message
        : message
          .map(c =>
            c.type === 'text' ? c.text : c.type === 'image_url' ? '[Image provided]' : '',
          )
          .join('\n')

    const messages = [{ role: 'user', content: messageContent }]

    // Initial request with tools
    const response = await this.client.chat({
      model: this.model,
      messages,
      tools: ollamaTools,
      stream: false,
    })

    // Check if the model wants to use tools
    if (response.message.tool_calls && response.message.tool_calls.length > 0) {
      messages.push(response.message)

      // Execute tool calls
      for (const toolCall of response.message.tool_calls) {
        if (onToolCall) {
          const args = toolCall.function.arguments
          const result = await onToolCall(toolCall.function.name, args)

          messages.push({
            role: 'tool',
            content: JSON.stringify(result),
          })
        }
      }

      // Get final response after tool execution
      const finalResponse = await this.client.chat({
        model: this.model,
        messages,
        stream: true,
      })

      let fullResponse = ''
      for await (const chunk of finalResponse) {
        const content = chunk.message.content
        fullResponse += content
        onChunk?.(content)
      }

      return fullResponse
    }

    // If no tool calls, return the direct response
    return response.message.content
  }
}

/**
 * Custom OpenAI-compatible provider for third-party APIs
 */
export class CustomOpenAIProvider implements LLMProvider {
  name: string
  displayName: string
  baseURL: string
  isCustom = true
  private client: OpenAI
  private config: CustomProviderConfig

  constructor(config: CustomProviderConfig) {
    this.name = config.id
    this.displayName = config.displayName
    this.baseURL = config.baseURL
    this.config = config

    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      defaultHeaders: config.headers,
    })
  }

  async validateConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Test with a simple completion request
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5,
        stream: false,
      })

      if (response.choices && response.choices.length > 0) {
        return { success: true }
      } else {
        return { success: false, error: 'No valid response received' }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Connection validation failed',
      }
    }
  }

  async sendMessage(messages: Array<{role: string, content: string}>, onChunk?: (chunk: string) => void): Promise<string> {
    console.log('[CustomOpenAIProvider] Starting message send:', {
      model: this.config.model,
      baseURL: this.baseURL,
      hasOnChunk: !!onChunk,
    })

    // 转换消息格式并添加系统消息
    const systemMessage = {
      role: 'system' as const,
      content: '请用中文回复，除非用户特别要求使用其他语言。请保持回复简洁明了，提供有帮助的信息。',
    }

    const openaiMessages = [
      systemMessage,
      ...messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ]

    try {
      const stream = await this.client.chat.completions.create({
        model: this.config.model,
        messages: openaiMessages,
        temperature: this.config.parameters?.temperature,
        max_tokens: this.config.parameters?.maxTokens,
        top_p: this.config.parameters?.topP,
        frequency_penalty: this.config.parameters?.frequencyPenalty,
        presence_penalty: this.config.parameters?.presencePenalty,
        stream: true,
      })

      let fullResponse = ''
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || ''
        if (content) {
          console.log('[CustomOpenAIProvider] Received chunk:', content.substring(0, 50))
          fullResponse += content
          if (onChunk) {
            console.log('[CustomOpenAIProvider] Calling onChunk callback')
            onChunk(content)
          }
        }
      }

      console.log('[CustomOpenAIProvider] Complete response length:', fullResponse.length)
      return fullResponse
    } catch (error: any) {
      console.error('[CustomOpenAIProvider] Error sending message:', error)
      throw error
    }
  }

  async sendMessageWithTools(
    message: string | any[],
    tools: any[],
    onChunk?: (chunk: string) => void,
    onToolCall?: (tool: string, args: any) => Promise<any>,
  ): Promise<string> {
    // 处理多模态输入
    const messageContent = typeof message === 'string' ? message : message
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'user' as const, content: messageContent },
    ]

    // Convert MCP tools to OpenAI format
    const openAITools = tools.map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      },
    }))

    const response = await this.client.chat.completions.create({
      model: this.config.model,
      messages,
      tools: openAITools,
      temperature: this.config.parameters?.temperature,
      max_tokens: this.config.parameters?.maxTokens,
      top_p: this.config.parameters?.topP,
      stream: false,
    })

    const responseMessage = response.choices[0].message

    // Handle tool calls
    if (responseMessage.tool_calls) {
      for (const toolCall of responseMessage.tool_calls) {
        if (onToolCall) {
          const args = JSON.parse((toolCall as any).function.arguments)
          const result = await onToolCall((toolCall as any).function.name, args)

          // Add tool result to messages
          messages.push(responseMessage)
          messages.push({
            role: 'tool' as const,
            content: JSON.stringify(result),
            tool_call_id: toolCall.id,
          })
        }
      }

      // Get final response after tool calls
      const finalResponse = await this.client.chat.completions.create({
        model: this.config.model,
        messages,
        temperature: this.config.parameters?.temperature,
        max_tokens: this.config.parameters?.maxTokens,
        top_p: this.config.parameters?.topP,
        stream: true,
      })

      let fullResponse = ''
      for await (const chunk of finalResponse) {
        const content = chunk.choices[0]?.delta?.content || ''
        if (content) {
          fullResponse += content
          onChunk?.(content)
        }
      }

      return fullResponse
    }

    return responseMessage.content || ''
  }
}
