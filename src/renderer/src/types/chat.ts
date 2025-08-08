export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  createdAt?: Date  // Add createdAt for compatibility
  error?: string
  errorDetails?: string
  attachments?: Attachment[]
  metadata?: MessageMetadata
  parentId?: string
  children?: string[]
  pending?: boolean  // Add pending for streaming messages
  chatId?: string    // Add chatId for reference
}

export interface Attachment {
  id: string
  name: string
  type: 'image' | 'text' | 'file' | 'audio' | 'video'
  data?: string
  content?: string
  size?: number
  url?: string
  mimeType?: string
  width?: number
  height?: number
}

export interface MessageMetadata {
  tokenCount?: number
  processingTime?: number
  model?: string
  provider?: string
  toolCalls?: ToolCall[]
  citations?: Citation[]
}

export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, any>
  result?: any
  error?: string
  startTime?: Date
  endTime?: Date
}

export interface Citation {
  id: string
  source: string
  url?: string
  title?: string
  snippet?: string
}

export interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  settings?: ChatSettings
  tags?: string[]
  archived?: boolean
  starred?: boolean
  summary?: ChatSummary
}

export interface ChatSummary {
  summary: string
  tags: string[]
  keyPoints: string[]
  summaryUpdatedAt?: Date
  summaryTokens?: number
}

export interface ChatSettings {
  model?: string
  provider?: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
  enableTools?: boolean
  enableSearch?: boolean
}

export interface ChatContext {
  currentChatId?: string
  isLoading: boolean
  isGenerating: boolean
  error?: string
  lastActivity?: Date
}

export interface QuickSuggestion {
  id: string
  text: string
  category?: string
  icon?: string
}

// Database record types (matching main process)
export interface ChatRecord {
  id: string
  title: string
  created_at: string
  updated_at: string
  tags?: string
  archived?: number
  starred?: number
  settings?: string
  summary?: string
  summary_tags?: string
  summary_updated_at?: string
  summary_tokens?: number
  key_points?: string
}

export interface MessageRecord {
  id: string
  chat_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
  attachments?: string
  metadata?: string
  parent_id?: string
  error?: string
  error_details?: string
}

export interface MessageDraft {
  chatId: string
  content: string
  attachments: Attachment[]
  timestamp: Date
}

// Event types for chat interactions
export interface ChatEvent {
  type: ChatEventType
  chatId: string
  messageId?: string
  timestamp: Date
  data?: any
}

export enum ChatEventType {
  MESSAGE_SENT = 'message_sent',
  MESSAGE_RECEIVED = 'message_received',
  MESSAGE_EDITED = 'message_edited',
  MESSAGE_DELETED = 'message_deleted',
  CHAT_CREATED = 'chat_created',
  CHAT_UPDATED = 'chat_updated',
  CHAT_DELETED = 'chat_deleted',
  TYPING_START = 'typing_start',
  TYPING_END = 'typing_end',
  ERROR_OCCURRED = 'error_occurred'
}

// Stream response types
export interface StreamResponse {
  chatId: string
  messageId: string
  chunk: string
  isComplete: boolean
  metadata?: StreamMetadata
}

export interface StreamMetadata {
  tokenCount?: number
  tokensPerSecond?: number
  model?: string
  provider?: string
}

export interface StreamError {
  chatId: string
  messageId: string
  error: string
  code?: string
  retryable?: boolean
}

// Search related types
export interface SearchResult {
  id: string
  title: string
  snippet: string
  url: string
  source: string
  relevance?: number
  timestamp?: Date
}

export interface SearchContext {
  query: string
  results: SearchResult[]
  totalResults?: number
  searchTime?: number
  provider?: string
}

// Export configuration types
export interface ExportOptions {
  format: 'markdown' | 'pdf' | 'html' | 'json' | 'txt'
  includeAttachments: boolean
  includeMetadata: boolean
  includeSystemMessages: boolean
  dateRange?: {
    start: Date
    end: Date
  }
  chatIds?: string[]
}

export interface ExportResult {
  success: boolean
  filePath?: string
  error?: string
  stats?: {
    messagesExported: number
    attachmentsExported: number
    fileSize: number
  }
}