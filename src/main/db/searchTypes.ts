// Import shared types
import type { Attachment } from './types'

// Search query types matching frontend expectations
export interface SearchQuery {
  text: string
  filters: SearchFilters
  options: SearchOptions
}

export interface SearchFilters {
  roles?: Array<'user' | 'assistant' | 'system'>
  dateRange?: {
    start: string
    end: string
  }
  chatIds?: string[]
  messageTypes?: Array<'text' | 'image' | 'code' | 'error'>
  hasAttachments?: boolean
  minLength?: number
  maxLength?: number
  tags?: string[]
  priority?: Array<'high' | 'medium' | 'low'>
  archived?: boolean
  starred?: boolean
}

export interface SearchOptions {
  caseSensitive?: boolean
  wholeWords?: boolean
  useRegex?: boolean
  fuzzyMatch?: boolean
  fuzzyThreshold?: number
  maxResults?: number
  sortBy?: 'relevance' | 'date' | 'length'
  sortOrder?: 'asc' | 'desc'
  highlightMatches?: boolean
  contextLines?: number
}

export interface SearchResult {
  message: SearchResultMessage
  score: number
  matches: SearchMatch[]
  context?: {
    before: SearchResultMessage[]
    after: SearchResultMessage[]
  }
}

export interface SearchResultMessage {
  id: string
  chatId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: Record<string, unknown>
  tags?: string[]
  attachments?: Attachment[]
  error?: string
}

export interface SearchMatch {
  field: 'content' | 'metadata' | 'tags'
  text: string
  startIndex: number
  endIndex: number
  highlighted: string
}

export interface SearchStats {
  totalMessages: number
  indexedMessages: number
  searchTime: number
  resultCount: number
  lastUpdated: Date
}

// Database search result types
export interface DBSearchResult {
  id: string
  chat_id: string
  role: string
  content: string
  created_at: string
  attachments?: string
  metadata?: string
  error?: string
  error_details?: string
  chat_title: string
  chat_tags?: string
  chat_archived?: number
  chat_starred?: number
  rank?: number
}
