/**
 * Analytics type definitions
 */

// Time range options for analytics
export type TimeRange = '24h' | '7d' | '30d' | '90d' | '1y' | 'all'

// Analytics data interfaces
export interface ChatAnalytics {
  totalChats: number
  totalMessages: number
  averageMessagesPerChat: number
  activeChats: number
  archivedChats: number
}

export interface MessageAnalytics {
  userMessages: number
  assistantMessages: number
  averageMessageLength: number
  totalTokens: number
  averageTokensPerMessage: number
}

export interface UsageAnalytics {
  chatsByDay: Array<{ date: string; count: number }>
  messagesByDay: Array<{ date: string; count: number }>
  activeHours: Array<{ hour: number; count: number }>
  peakUsageTime: string
  dailyAverage: number
  weeklyTrend: 'up' | 'down' | 'stable'
}

export interface ContentAnalytics {
  topKeywords: Array<{ keyword: string; count: number }>
  topicDistribution: Array<{ topic: string; count: number; percentage: number }>
  averageResponseTime: number
  sentimentAnalysis: {
    positive: number
    neutral: number
    negative: number
  }
  messageLengthDistribution: Array<{ range: string; count: number }>
}

export interface PerformanceAnalytics {
  averageResponseTime: number
  errorRate: number
  successRate: number
  tokenUsageByModel: Array<{ model: string; tokens: number; cost?: number }>
  responseTimeByModel: Array<{ model: string; avgTime: number }>
  errorsByType: Array<{ type: string; count: number }>
}

export interface ModelAnalytics {
  modelUsage: Array<{ model: string; count: number; percentage: number }>
  preferredModels: string[]
  modelPerformance: Array<{
    model: string
    avgResponseTime: number
    errorRate: number
    tokenUsage: number
  }>
}

// Comprehensive analytics interface
export interface AnalyticsData {
  timeRange: TimeRange
  generatedAt: string
  chat: ChatAnalytics
  message: MessageAnalytics
  usage: UsageAnalytics
  content: ContentAnalytics
  performance: PerformanceAnalytics
  model: ModelAnalytics
}

// Filter options for analytics
export interface AnalyticsFilter {
  timeRange: TimeRange
  models?: string[]
  tags?: string[]
  chatIds?: string[]
  messageTypes?: ('user' | 'assistant' | 'system')[]
  includeArchived?: boolean
}

// Export configuration
export interface AnalyticsExportConfig {
  format: 'json' | 'csv' | 'pdf' | 'xlsx'
  includeCharts: boolean
  sections: string[]
  timeRange: TimeRange
}
