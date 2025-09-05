/**
 * Database type definitions
 */

// 附件类型定义
export interface Attachment {
  id: string
  name: string
  type: string
  size: number
  url?: string
  content?: string
}

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
  attachments?: string // JSON string of attachment array
  metadata?: string // JSON string of metadata object
  parent_id?: string
  error?: string
  error_details?: string
  timestamp?: string // For backward compatibility
}

// 扩展的消息记录类型，包含解析后的 JSON 字段
export interface MessageRecordParsed extends Omit<MessageRecord, 'attachments' | 'metadata'> {
  attachments?: Attachment[] | null
  metadata?: Record<string, unknown> | null
}

export interface SearchIndex {
  message_id: string
  chat_id: string
  content_normalized: string
  tokens: string
  created_at: string
}
