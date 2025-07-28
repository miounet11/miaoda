import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/genai'
import { Ollama } from 'ollama'

export interface LLMProvider {
  name: string
  sendMessage(message: string, onChunk?: (chunk: string) => void): Promise<string>
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
}