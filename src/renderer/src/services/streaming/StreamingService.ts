import { EventEmitter } from '@renderer/src/utils/performance'

export interface StreamChunk {
  id: string
  content: string
  delta?: string
  finished: boolean
  metadata?: {
    model?: string
    timestamp?: number
    tokens?: number
  }
}

export interface StreamingOptions {
  model: string
  temperature?: number
  maxTokens?: number
  signal?: AbortSignal
  onChunk?: (chunk: StreamChunk) => void
  onComplete?: (content: string) => void
  onError?: (error: Error) => void
}

export interface StreamingResponse {
  id: string
  stream: ReadableStream<Uint8Array>
  controller: AbortController
  metadata: {
    model: string
    startTime: number
    estimatedTokens?: number
  }
}

export class StreamingService extends EventEmitter<{
  chunk: [StreamChunk]
  complete: [string, string] // content, messageId
  error: [Error, string] // error, messageId
  start: [string] // messageId
  abort: [string] // messageId
}> {
  private activeStreams = new Map<string, AbortController>()
  private streamHistory = new Map<string, StreamChunk[]>()
  
  async sendMessage(
    content: string,
    options: StreamingOptions
  ): Promise<StreamingResponse> {
    const messageId = this.generateMessageId()
    const controller = new AbortController()
    
    // Store active stream
    this.activeStreams.set(messageId, controller)
    this.streamHistory.set(messageId, [])
    
    try {
      // Create the streaming request
      const response = await this.createStreamingRequest(content, {
        ...options,
        signal: controller.signal
      })
      
      const stream = this.processStream(response, messageId, options)
      
      this.emit('start', messageId)
      
      return {
        id: messageId,
        stream,
        controller,
        metadata: {
          model: options.model,
          startTime: Date.now(),
          estimatedTokens: this.estimateTokens(content)
        }
      }
      
    } catch (error) {
      this.activeStreams.delete(messageId)
      this.streamHistory.delete(messageId)
      throw error
    }
  }
  
  private async createStreamingRequest(
    content: string,
    options: StreamingOptions
  ): Promise<Response> {
    // Check if we have the modern API or fallback to legacy
    if (window.api.llm?.streamMessage) {
      return await window.api.llm.streamMessage({
        content,
        model: options.model,
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 2048,
        stream: true
      }, options.signal)
    }
    
    // Fallback to HTTP streaming
    const apiEndpoint = this.getApiEndpoint()
    const headers = this.getHeaders()
    
    const requestBody = this.buildRequestBody(content, options)
    
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: options.signal
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    if (!response.body) {
      throw new Error('No response body for streaming')
    }
    
    return response
  }
  
  private processStream(
    response: Response,
    messageId: string,
    options: StreamingOptions
  ): ReadableStream<Uint8Array> {
    const decoder = new TextDecoder()
    let buffer = ''
    let fullContent = ''
    
    return new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader()
        
        try {
          while (true) {
            const { done, value } = await reader.read()
            
            if (done) {
              // Stream complete
              const chunk: StreamChunk = {
                id: messageId,
                content: fullContent,
                finished: true,
                metadata: {
                  model: options.model,
                  timestamp: Date.now()
                }
              }
              
              this.handleChunk(chunk, messageId, options)
              this.emit('complete', fullContent, messageId)
              controller.close()
              break
            }
            
            // Process the chunk
            const chunkText = decoder.decode(value, { stream: true })
            buffer += chunkText
            
            // Parse Server-Sent Events
            const lines = buffer.split('\n')
            buffer = lines.pop() || '' // Keep incomplete line in buffer
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const dataStr = line.slice(6)
                  
                  if (dataStr === '[DONE]') {
                    continue
                  }
                  
                  const data = JSON.parse(dataStr)
                  const content = this.extractContent(data)
                  
                  if (content) {
                    fullContent += content
                    
                    const chunk: StreamChunk = {
                      id: messageId,
                      content: fullContent,
                      delta: content,
                      finished: false,
                      metadata: {
                        model: data.model || options.model,
                        timestamp: Date.now()
                      }
                    }
                    
                    this.handleChunk(chunk, messageId, options)
                    this.emit('chunk', chunk)
                  }
                } catch (parseError) {
                  console.warn('Failed to parse streaming chunk:', parseError)
                }
              }
            }
            
            controller.enqueue(value)
          }
        } catch (error) {
          if (error.name !== 'AbortError') {
            this.emit('error', error as Error, messageId)
            controller.error(error)
          }
        } finally {
          reader.releaseLock()
          this.activeStreams.delete(messageId)
        }
      }
    })
  }
  
  private handleChunk(
    chunk: StreamChunk,
    messageId: string,
    options: StreamingOptions
  ) {
    // Store chunk in history
    const history = this.streamHistory.get(messageId) || []
    history.push(chunk)
    this.streamHistory.set(messageId, history)
    
    // Call callback if provided
    if (options.onChunk) {
      options.onChunk(chunk)
    }
    
    // Call completion callback if stream is finished
    if (chunk.finished && options.onComplete) {
      options.onComplete(chunk.content)
    }
  }
  
  private extractContent(data: any): string {
    // Handle different API response formats
    if (data.choices?.[0]?.delta?.content) {
      // OpenAI format
      return data.choices[0].delta.content
    }
    
    if (data.delta?.text) {
      // Anthropic format
      return data.delta.text
    }
    
    if (data.content) {
      // Generic format
      return data.content
    }
    
    if (data.text) {
      // Simple text format
      return data.text
    }
    
    return ''
  }
  
  private buildRequestBody(content: string, options: StreamingOptions) {
    // Build request body based on API provider
    const provider = this.getProvider()
    
    switch (provider) {
      case 'openai':
        return {
          model: options.model,
          messages: [{ role: 'user', content }],
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2048,
          stream: true
        }
      
      case 'anthropic':
        return {
          model: options.model,
          messages: [{ role: 'user', content }],
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2048,
          stream: true
        }
      
      case 'google':
        return {
          contents: [{
            parts: [{ text: content }]
          }],
          generationConfig: {
            temperature: options.temperature || 0.7,
            maxOutputTokens: options.maxTokens || 2048
          }
        }
      
      default:
        return {
          prompt: content,
          model: options.model,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2048,
          stream: true
        }
    }
  }
  
  private getApiEndpoint(): string {
    // Get from settings store or environment
    const settings = this.getSettings()
    
    if (settings?.apiEndpoint) {
      return settings.apiEndpoint
    }
    
    // Default endpoints
    const provider = this.getProvider()
    switch (provider) {
      case 'openai':
        return 'https://api.openai.com/v1/chat/completions'
      case 'anthropic':
        return 'https://api.anthropic.com/v1/messages'
      case 'google':
        return 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:streamGenerateContent'
      default:
        return 'http://localhost:11434/api/generate'
    }
  }
  
  private getHeaders(): Record<string, string> {
    const settings = this.getSettings()
    const provider = this.getProvider()
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream'
    }
    
    if (settings?.apiKey) {
      switch (provider) {
        case 'openai':
          headers['Authorization'] = `Bearer ${settings.apiKey}`
          break
        case 'anthropic':
          headers['Authorization'] = `Bearer ${settings.apiKey}`
          headers['anthropic-version'] = '2023-06-01'
          break
        case 'google':
          headers['Authorization'] = `Bearer ${settings.apiKey}`
          break
      }
    }
    
    return headers
  }
  
  private getProvider(): string {
    // Get from settings store
    try {
      const settings = this.getSettings()
      return settings?.llmProvider || 'openai'
    } catch {
      return 'openai'
    }
  }
  
  private getSettings() {
    // Access settings store if available
    try {
      return JSON.parse(localStorage.getItem('miaoda-settings-store') || '{}')
    } catch {
      return null
    }
  }
  
  private estimateTokens(content: string): number {
    // Rough token estimation (1 token ≈ 4 characters)
    return Math.ceil(content.length / 4)
  }
  
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  // Public methods
  abortStream(messageId: string): boolean {
    const controller = this.activeStreams.get(messageId)
    if (controller) {
      controller.abort()
      this.activeStreams.delete(messageId)
      this.emit('abort', messageId)
      return true
    }
    return false
  }
  
  getStreamHistory(messageId: string): StreamChunk[] {
    return this.streamHistory.get(messageId) || []
  }
  
  getActiveStreams(): string[] {
    return Array.from(this.activeStreams.keys())
  }
  
  isStreaming(messageId?: string): boolean {
    if (messageId) {
      return this.activeStreams.has(messageId)
    }
    return this.activeStreams.size > 0
  }
  
  clearHistory(messageId?: string) {
    if (messageId) {
      this.streamHistory.delete(messageId)
    } else {
      this.streamHistory.clear()
    }
  }
  
  // Cleanup
  destroy() {
    // Abort all active streams
    for (const controller of this.activeStreams.values()) {
      controller.abort()
    }
    
    this.activeStreams.clear()
    this.streamHistory.clear()
    this.clear()
  }
}

// Global streaming service instance
export const streamingService = new StreamingService()

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    streamingService.destroy()
  })
}