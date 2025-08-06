// LLM Provider Types
export interface LLMProvider {
  id: string
  name: string
  displayName: string
  description?: string
  website?: string
  icon?: string
  models: LLMModel[]
  capabilities: ProviderCapabilities
  configuration: ProviderConfiguration
  status: ProviderStatus
}

export interface LLMModel {
  id: string
  name: string
  displayName: string
  description?: string
  contextLength: number
  maxTokens?: number
  inputCostPer1k?: number
  outputCostPer1k?: number
  capabilities: ModelCapabilities
  metadata?: ModelMetadata
}

export interface ProviderCapabilities {
  chat: boolean
  streaming: boolean
  toolCalling: boolean
  imageInput: boolean
  imageOutput: boolean
  audioInput: boolean
  audioOutput: boolean
  videoInput: boolean
  systemMessages: boolean
  temperature: boolean
  topP: boolean
  topK: boolean
  presencePenalty: boolean
  frequencyPenalty: boolean
}

export interface ModelCapabilities extends ProviderCapabilities {
  maxImageSize?: number
  supportedImageFormats?: string[]
  maxAudioDuration?: number
  supportedAudioFormats?: string[]
}

export interface ModelMetadata {
  releaseDate?: string
  trainingCutoff?: string
  languages?: string[]
  specializations?: string[]
  benchmarks?: ModelBenchmark[]
}

export interface ModelBenchmark {
  name: string
  score: number
  details?: string
}

export interface ProviderConfiguration {
  apiKey?: string
  baseUrl?: string
  organizationId?: string
  timeout?: number
  retries?: number
  rateLimit?: RateLimit
  proxy?: ProxyConfiguration
}

export interface RateLimit {
  requestsPerMinute: number
  tokensPerMinute: number
  requestsPerDay?: number
  tokensPerDay?: number
}

export interface ProxyConfiguration {
  enabled: boolean
  host?: string
  port?: number
  protocol?: 'http' | 'https' | 'socks4' | 'socks5'
  auth?: {
    username: string
    password: string
  }
}

export type ProviderStatus = 'connected' | 'disconnected' | 'error' | 'configuring'

// API Request/Response Types
export interface ChatRequest {
  model: string
  messages: ChatMessage[]
  temperature?: number
  maxTokens?: number
  topP?: number
  topK?: number
  presencePenalty?: number
  frequencyPenalty?: number
  stop?: string[]
  stream?: boolean
  tools?: Tool[]
  toolChoice?: ToolChoice
  user?: string
  systemPrompt?: string
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | MessageContent[]
  name?: string
  toolCalls?: ToolCall[]
  toolCallId?: string
}

export interface MessageContent {
  type: 'text' | 'image' | 'audio'
  text?: string
  imageUrl?: ImageUrl
  audioUrl?: AudioUrl
}

export interface ImageUrl {
  url: string
  detail?: 'low' | 'high' | 'auto'
}

export interface AudioUrl {
  url: string
  format?: string
}

export interface Tool {
  type: 'function'
  function: FunctionDefinition
}

export interface FunctionDefinition {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, ParameterDefinition>
    required?: string[]
  }
}

export interface ParameterDefinition {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object'
  description?: string
  enum?: any[]
  items?: ParameterDefinition
  properties?: Record<string, ParameterDefinition>
  required?: string[]
}

export type ToolChoice = 'none' | 'auto' | 'required' | { type: 'function'; function: { name: string } }

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

// API Response Types
export interface ChatResponse {
  id: string
  object: 'chat.completion'
  created: number
  model: string
  choices: ChatChoice[]
  usage: TokenUsage
  systemFingerprint?: string
}

export interface ChatChoice {
  index: number
  message: ChatMessage
  finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'function_call'
  logprobs?: any
}

export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  promptCost?: number
  completionCost?: number
  totalCost?: number
}

// Streaming Types
export interface StreamChunk {
  id: string
  object: 'chat.completion.chunk'
  created: number
  model: string
  choices: StreamChoice[]
  usage?: TokenUsage
}

export interface StreamChoice {
  index: number
  delta: {
    role?: string
    content?: string
    toolCalls?: PartialToolCall[]
  }
  finishReason?: string
  logprobs?: any
}

export interface PartialToolCall {
  index: number
  id?: string
  type?: 'function'
  function?: {
    name?: string
    arguments?: string
  }
}

// Error Types
export interface APIError {
  error: {
    message: string
    type: string
    param?: string
    code?: string
  }
  statusCode?: number
  requestId?: string
}

export interface NetworkError {
  message: string
  code: 'NETWORK_ERROR' | 'TIMEOUT' | 'CONNECTION_REFUSED' | 'DNS_ERROR'
  details?: string
  retryable: boolean
}

// MCP (Model Context Protocol) Types
export interface MCPServer {
  id: string
  name: string
  description?: string
  url: string
  version: string
  capabilities: MCPCapabilities
  status: MCPServerStatus
  config?: MCPServerConfig
}

export interface MCPCapabilities {
  resources: boolean
  tools: boolean
  prompts: boolean
  sampling: boolean
}

export type MCPServerStatus = 'connected' | 'disconnected' | 'connecting' | 'error'

export interface MCPServerConfig {
  timeout?: number
  retries?: number
  headers?: Record<string, string>
  auth?: MCPAuth
}

export interface MCPAuth {
  type: 'none' | 'bearer' | 'basic' | 'apikey'
  token?: string
  username?: string
  password?: string
  apiKey?: string
}

export interface MCPResource {
  uri: string
  name: string
  mimeType?: string
  description?: string
  annotations?: Record<string, any>
}

export interface MCPTool {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, any>
    required?: string[]
  }
}

export interface MCPPrompt {
  name: string
  description: string
  arguments?: MCPPromptArgument[]
}

export interface MCPPromptArgument {
  name: string
  description: string
  required?: boolean
}

// File Handling Types
export interface FileUpload {
  id: string
  name: string
  size: number
  type: string
  lastModified: number
  content?: string | ArrayBuffer
  progress?: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
}

export interface FileHandler {
  accept: string[]
  maxSize: number
  multiple: boolean
  onSelect: (files: File[]) => void | Promise<void>
  onUpload?: (file: File) => Promise<FileUpload>
  onError?: (error: string) => void
}

// Search and Knowledge Types
export interface SearchProvider {
  id: string
  name: string
  displayName: string
  description?: string
  icon?: string
  baseUrl: string
  capabilities: SearchCapabilities
  config: SearchConfig
}

export interface SearchCapabilities {
  webSearch: boolean
  imageSearch: boolean
  newsSearch: boolean
  academicSearch: boolean
  codeSearch: boolean
  realtime: boolean
}

export interface SearchConfig {
  apiKey?: string
  maxResults?: number
  safeSearch?: boolean
  region?: string
  language?: string
}

export interface KnowledgeBase {
  id: string
  name: string
  description?: string
  type: 'vector' | 'graph' | 'hybrid'
  status: 'ready' | 'indexing' | 'error'
  documentCount: number
  lastUpdated: Date
  config: KnowledgeBaseConfig
}

export interface KnowledgeBaseConfig {
  embeddingModel: string
  chunkSize: number
  chunkOverlap: number
  indexingBatchSize: number
  similarityThreshold: number
}

// Custom LLM Provider Types
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

export interface CustomProviderCreateRequest {
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
}

export interface CustomProviderUpdateRequest {
  name?: string
  displayName?: string
  apiKey?: string
  baseURL?: string
  model?: string
  headers?: Record<string, string>
  parameters?: {
    temperature?: number
    maxTokens?: number
    topP?: number
    frequencyPenalty?: number
    presencePenalty?: number
  }
}

export interface ProviderImportExport {
  success: number
  failed: number
  errors: string[]
}