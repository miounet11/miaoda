import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
// import { GoogleGenerativeAI } from '@google/genai'
import { Ollama } from 'ollama'

export interface LLMProvider {
  name: string
  displayName?: string
  baseURL?: string
  isCustom?: boolean
  sendMessage(message: string, onChunk?: (chunk: string) => void): Promise<string>
  sendMessageWithTools?(
    message: string, 
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
      baseURL
    })
  }

  async sendMessage(message: string, onChunk?: (chunk: string) => void): Promise<string> {
    const stream = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: message }],
      stream: true
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
    message: string,
    tools: any[],
    onChunk?: (chunk: string) => void,
    onToolCall?: (tool: string, args: any) => Promise<any>
  ): Promise<string> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [{ role: 'user' as const, content: message }]
    
    // Convert MCP tools to OpenAI format
    const openAITools = tools.map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema
      }
    }))

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      tools: openAITools,
      stream: false
    })

    const responseMessage = response.choices[0].message

    // Handle tool calls
    if (responseMessage.tool_calls) {
      for (const toolCall of responseMessage.tool_calls) {
        if (onToolCall) {
          const args = JSON.parse(toolCall.function.arguments)
          const result = await onToolCall(toolCall.function.name, args)
          
          // Add tool result to messages
          messages.push(responseMessage)
          messages.push({
            role: 'tool' as const,
            content: JSON.stringify(result),
            tool_call_id: toolCall.id
          })
        }
      }

      // Get final response after tool calls
      const finalResponse = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        stream: true
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
      apiKey
    })
  }

  async sendMessage(message: string, onChunk?: (chunk: string) => void): Promise<string> {
    const stream = await this.client.messages.create({
      model: 'claude-3-sonnet-20240229',
      messages: [{ role: 'user', content: message }],
      max_tokens: 4096,
      stream: true
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
    message: string,
    tools: any[],
    onChunk?: (chunk: string) => void,
    onToolCall?: (tool: string, args: any) => Promise<any>
  ): Promise<string> {
    // Convert MCP tools to Anthropic format
    const anthropicTools = tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema
    }))

    const messages: Array<{role: 'user' | 'assistant'; content: string | any[]}> = [{ role: 'user' as const, content: message }]
    
    // Initial request with tools
    const response = await this.client.messages.create({
      model: 'claude-3-sonnet-20240229',
      messages,
      max_tokens: 4096,
      tools: anthropicTools
    })

    // Handle tool use
    if (response.content.some(block => block.type === 'tool_use')) {
      const toolResults: Array<{type: string; tool_use_id: string; content: string}> = []
      
      for (const block of response.content) {
        if (block.type === 'tool_use' && onToolCall) {
          const result = await onToolCall(block.name, block.input)
          toolResults.push({
            type: 'tool_result' as const,
            tool_use_id: block.id,
            content: JSON.stringify(result)
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
        content: toolResults.map(result => 
          `Tool ${result.tool_use_id}: ${result.content}`
        ).join('\n')
      })

      const finalStream = await this.client.messages.create({
        model: 'claude-3-sonnet-20240229',
        messages,
        max_tokens: 4096,
        stream: true
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

  async sendMessage(message: string, onChunk?: (chunk: string) => void): Promise<string> {
    const response = await this.client.chat({
      model: this.model,
      messages: [{ role: 'user', content: message }],
      stream: true
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
    message: string,
    tools: any[],
    onChunk?: (chunk: string) => void,
    onToolCall?: (tool: string, args: any) => Promise<any>
  ): Promise<string> {
    // Convert tools to Ollama format
    const ollamaTools = tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema
      }
    }))

    const messages = [{ role: 'user', content: message }]

    // Initial request with tools
    const response = await this.client.chat({
      model: this.model,
      messages,
      tools: ollamaTools,
      stream: false
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
            content: JSON.stringify(result)
          })
        }
      }

      // Get final response after tool execution
      const finalResponse = await this.client.chat({
        model: this.model,
        messages,
        stream: true
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
      defaultHeaders: config.headers
    })
  }

  async validateConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Test with a simple completion request
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5,
        stream: false
      })
      
      if (response.choices && response.choices.length > 0) {
        return { success: true }
      } else {
        return { success: false, error: 'No valid response received' }
      }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Connection validation failed' 
      }
    }
  }

  async sendMessage(message: string, onChunk?: (chunk: string) => void): Promise<string> {
    const stream = await this.client.chat.completions.create({
      model: this.config.model,
      messages: [{ role: 'user', content: message }],
      temperature: this.config.parameters?.temperature,
      max_tokens: this.config.parameters?.maxTokens,
      top_p: this.config.parameters?.topP,
      frequency_penalty: this.config.parameters?.frequencyPenalty,
      presence_penalty: this.config.parameters?.presencePenalty,
      stream: true
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
    message: string,
    tools: any[],
    onChunk?: (chunk: string) => void,
    onToolCall?: (tool: string, args: any) => Promise<any>
  ): Promise<string> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [{ role: 'user' as const, content: message }]
    
    // Convert MCP tools to OpenAI format
    const openAITools = tools.map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema
      }
    }))

    const response = await this.client.chat.completions.create({
      model: this.config.model,
      messages,
      tools: openAITools,
      temperature: this.config.parameters?.temperature,
      max_tokens: this.config.parameters?.maxTokens,
      top_p: this.config.parameters?.topP,
      stream: false
    })

    const responseMessage = response.choices[0].message

    // Handle tool calls
    if (responseMessage.tool_calls) {
      for (const toolCall of responseMessage.tool_calls) {
        if (onToolCall) {
          const args = JSON.parse(toolCall.function.arguments)
          const result = await onToolCall(toolCall.function.name, args)
          
          // Add tool result to messages
          messages.push(responseMessage)
          messages.push({
            role: 'tool' as const,
            content: JSON.stringify(result),
            tool_call_id: toolCall.id
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
        stream: true
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