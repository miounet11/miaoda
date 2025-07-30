import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
// import { GoogleGenerativeAI } from '@google/genai'
import { Ollama } from 'ollama'

export interface LLMProvider {
  name: string
  sendMessage(message: string, onChunk?: (chunk: string) => void): Promise<string>
  sendMessageWithTools?(
    message: string, 
    tools: any[],
    onChunk?: (chunk: string) => void,
    onToolCall?: (tool: string, args: any) => Promise<any>
  ): Promise<string>
}

export class OpenAIProvider implements LLMProvider {
  name = 'openai'
  private client: OpenAI

  constructor(apiKey: string, baseURL?: string) {
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
  private client: Ollama
  private model: string

  constructor(model: string = 'llama2', host?: string) {
    this.client = new Ollama({ host })
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