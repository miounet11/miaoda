/**
 * Database type definitions
 */

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

export interface SearchIndex {
  message_id: string
  chat_id: string
  content_normalized: string
  tokens: string
  created_at: string
}
