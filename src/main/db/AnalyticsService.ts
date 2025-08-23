import type Database from 'better-sqlite3'
import type {
  AnalyticsData,
  AnalyticsFilter,
  TimeRange,
  ChatAnalytics,
  MessageAnalytics,
  UsageAnalytics,
  ContentAnalytics,
  PerformanceAnalytics,
  ModelAnalytics
} from '../../types/analytics'

/**
 * Analytics service for generating statistical data from chat and message records
 */
export class AnalyticsService {
  private db: Database.Database

  constructor(db: Database.Database) {
    this.db = db
  }

  /**
   * Generate comprehensive analytics data
   */
  generateAnalytics(filter: AnalyticsFilter): AnalyticsData {
    const timeConstraint = this.getTimeConstraint(filter.timeRange)

    return {
      timeRange: filter.timeRange,
      generatedAt: new Date().toISOString(),
      chat: this.getChatAnalytics(timeConstraint, filter),
      message: this.getMessageAnalytics(timeConstraint, filter),
      usage: this.getUsageAnalytics(timeConstraint, filter),
      content: this.getContentAnalytics(timeConstraint, filter),
      performance: this.getPerformanceAnalytics(timeConstraint, filter),
      model: this.getModelAnalytics(timeConstraint, filter)
    }
  }

  /**
   * Get chat-related analytics
   */
  private getChatAnalytics(timeConstraint: string, filter: AnalyticsFilter): ChatAnalytics {
    const baseQuery = `
      FROM chats c 
      WHERE 1=1 ${timeConstraint}
      ${filter.includeArchived ? '' : 'AND (c.archived IS NULL OR c.archived = 0)'}
    `

    const totalChats = this.db
      .prepare(
        `
      SELECT COUNT(*) as count ${baseQuery}
    `
      )
      .get() as { count: number }

    const totalMessages = this.db
      .prepare(
        `
      SELECT COUNT(*) as count
      FROM messages m
      JOIN chats c ON m.chat_id = c.id
      WHERE 1=1 ${timeConstraint.replace('c.', 'm.')}
      ${filter.includeArchived ? '' : 'AND (c.archived IS NULL OR c.archived = 0)'}
    `
      )
      .get() as { count: number }

    const averageMessages = this.db
      .prepare(
        `
      SELECT AVG(message_count) as avg
      FROM (
        SELECT COUNT(*) as message_count
        FROM messages m
        JOIN chats c ON m.chat_id = c.id
        WHERE 1=1 ${timeConstraint.replace('c.', 'm.')}
        ${filter.includeArchived ? '' : 'AND (c.archived IS NULL OR c.archived = 0)'}
        GROUP BY m.chat_id
      )
    `
      )
      .get() as { avg: number }

    const archivedChats = this.db
      .prepare(
        `
      SELECT COUNT(*) as count
      FROM chats c
      WHERE c.archived = 1 ${timeConstraint}
    `
      )
      .get() as { count: number }

    return {
      totalChats: totalChats.count,
      totalMessages: totalMessages.count,
      averageMessagesPerChat: Math.round((averageMessages.avg || 0) * 100) / 100,
      activeChats: totalChats.count - archivedChats.count,
      archivedChats: archivedChats.count
    }
  }

  /**
   * Get message-related analytics
   */
  private getMessageAnalytics(timeConstraint: string, filter: AnalyticsFilter): MessageAnalytics {
    const baseQuery = `
      FROM messages m
      JOIN chats c ON m.chat_id = c.id
      WHERE 1=1 ${timeConstraint.replace('c.', 'm.')}
      ${filter.includeArchived ? '' : 'AND (c.archived IS NULL OR c.archived = 0)'}
      ${filter.messageTypes ? `AND m.role IN (${filter.messageTypes.map(t => `'${t}'`).join(',')})` : ''}
    `

    const messageStats = this.db
      .prepare(
        `
      SELECT 
        m.role,
        COUNT(*) as count,
        AVG(LENGTH(m.content)) as avg_length,
        SUM(LENGTH(m.content)) as total_length
      ${baseQuery}
      GROUP BY m.role
    `
      )
      .all() as Array<{ role: string; count: number; avg_length: number; total_length: number }>

    const userMessages = messageStats.find(s => s.role === 'user')?.count || 0
    const assistantMessages = messageStats.find(s => s.role === 'assistant')?.count || 0
    const totalLength = messageStats.reduce((sum, s) => sum + s.total_length, 0)
    const totalMessages = messageStats.reduce((sum, s) => sum + s.count, 0)

    // Estimate tokens (rough calculation: ~4 chars per token)
    const estimatedTokens = Math.round(totalLength / 4)

    return {
      userMessages,
      assistantMessages,
      averageMessageLength: Math.round((totalLength / totalMessages) * 100) / 100 || 0,
      totalTokens: estimatedTokens,
      averageTokensPerMessage: Math.round((estimatedTokens / totalMessages) * 100) / 100 || 0
    }
  }

  /**
   * Get usage pattern analytics
   */
  private getUsageAnalytics(timeConstraint: string, filter: AnalyticsFilter): UsageAnalytics {
    // Daily chat creation
    const chatsByDay = this.db
      .prepare(
        `
      SELECT 
        DATE(c.created_at) as date,
        COUNT(*) as count
      FROM chats c
      WHERE 1=1 ${timeConstraint}
      ${filter.includeArchived ? '' : 'AND (c.archived IS NULL OR c.archived = 0)'}
      GROUP BY DATE(c.created_at)
      ORDER BY date DESC
      LIMIT 30
    `
      )
      .all() as Array<{ date: string; count: number }>

    // Daily message creation
    const messagesByDay = this.db
      .prepare(
        `
      SELECT 
        DATE(m.created_at) as date,
        COUNT(*) as count
      FROM messages m
      JOIN chats c ON m.chat_id = c.id
      WHERE 1=1 ${timeConstraint.replace('c.', 'm.')}
      ${filter.includeArchived ? '' : 'AND (c.archived IS NULL OR c.archived = 0)'}
      GROUP BY DATE(m.created_at)
      ORDER BY date DESC
      LIMIT 30
    `
      )
      .all() as Array<{ date: string; count: number }>

    // Active hours analysis
    const activeHours = this.db
      .prepare(
        `
      SELECT 
        CAST(strftime('%H', m.created_at) AS INTEGER) as hour,
        COUNT(*) as count
      FROM messages m
      JOIN chats c ON m.chat_id = c.id
      WHERE 1=1 ${timeConstraint.replace('c.', 'm.')}
      ${filter.includeArchived ? '' : 'AND (c.archived IS NULL OR c.archived = 0)'}
      GROUP BY hour
      ORDER BY hour
    `
      )
      .all() as Array<{ hour: number; count: number }>

    // Calculate trends and averages
    const dailyAverage =
      messagesByDay.length > 0
        ? Math.round(
            (messagesByDay.reduce((sum, day) => sum + day.count, 0) / messagesByDay.length) * 100
          ) / 100
        : 0

    const peakHour = activeHours.reduce((max, hour) => (hour.count > max.count ? hour : max), {
      hour: 0,
      count: 0
    })

    // Simple trend calculation
    const recentAvg = messagesByDay.slice(0, 7).reduce((sum, day) => sum + day.count, 0) / 7
    const olderAvg = messagesByDay.slice(7, 14).reduce((sum, day) => sum + day.count, 0) / 7
    const weeklyTrend =
      recentAvg > olderAvg * 1.1 ? 'up' : recentAvg < olderAvg * 0.9 ? 'down' : 'stable'

    return {
      chatsByDay: chatsByDay.reverse(),
      messagesByDay: messagesByDay.reverse(),
      activeHours,
      peakUsageTime: `${peakHour.hour}:00`,
      dailyAverage,
      weeklyTrend
    }
  }

  /**
   * Get content analysis
   */
  private getContentAnalytics(timeConstraint: string, filter: AnalyticsFilter): ContentAnalytics {
    // Extract keywords from message content (simple approach)
    const messages = this.db
      .prepare(
        `
      SELECT m.content, m.role
      FROM messages m
      JOIN chats c ON m.chat_id = c.id
      WHERE 1=1 ${timeConstraint.replace('c.', 'm.')}
      ${filter.includeArchived ? '' : 'AND (c.archived IS NULL OR c.archived = 0)'}
      AND LENGTH(m.content) > 0
    `
      )
      .all() as Array<{ content: string; role: string }>

    // Simple keyword extraction (could be enhanced with NLP)
    const keywordCounts = new Map<string, number>()
    const wordRegex = /\b[a-zA-Z]{3,}\b/g
    const stopWords = new Set([
      'the',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'can',
      'you',
      'are',
      'is',
      'was',
      'were',
      'have',
      'has',
      'had',
      'will',
      'would',
      'could',
      'should'
    ])

    messages.forEach(msg => {
      const words = msg.content.toLowerCase().match(wordRegex) || []
      words.forEach(word => {
        if (!stopWords.has(word) && word.length > 3) {
          keywordCounts.set(word, (keywordCounts.get(word) || 0) + 1)
        }
      })
    })

    const topKeywords = Array.from(keywordCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([keyword, count]) => ({ keyword, count }))

    // Message length distribution
    const messageLengthDistribution = this.db
      .prepare(
        `
      SELECT 
        CASE 
          WHEN LENGTH(content) < 50 THEN 'Short (< 50)'
          WHEN LENGTH(content) < 200 THEN 'Medium (50-200)'
          WHEN LENGTH(content) < 500 THEN 'Long (200-500)'
          ELSE 'Very Long (> 500)'
        END as range,
        COUNT(*) as count
      FROM messages m
      JOIN chats c ON m.chat_id = c.id
      WHERE 1=1 ${timeConstraint.replace('c.', 'm.')}
      ${filter.includeArchived ? '' : 'AND (c.archived IS NULL OR c.archived = 0)'}
      GROUP BY range
    `
      )
      .all() as Array<{ range: string; count: number }>

    return {
      topKeywords,
      topicDistribution: [], // Could be enhanced with topic modeling
      averageResponseTime: 0, // Would need response time tracking
      sentimentAnalysis: {
        positive: 0,
        neutral: 0,
        negative: 0
      }, // Could be enhanced with sentiment analysis
      messageLengthDistribution
    }
  }

  /**
   * Get performance analytics
   */
  private getPerformanceAnalytics(
    timeConstraint: string,
    filter: AnalyticsFilter
  ): PerformanceAnalytics {
    // Error analysis
    const errorStats = this.db
      .prepare(
        `
      SELECT 
        COUNT(*) as total_messages,
        SUM(CASE WHEN m.error IS NOT NULL THEN 1 ELSE 0 END) as error_count
      FROM messages m
      JOIN chats c ON m.chat_id = c.id
      WHERE 1=1 ${timeConstraint.replace('c.', 'm.')}
      ${filter.includeArchived ? '' : 'AND (c.archived IS NULL OR c.archived = 0)'}
    `
      )
      .get() as { total_messages: number; error_count: number }

    const errorRate =
      errorStats.total_messages > 0 ? (errorStats.error_count / errorStats.total_messages) * 100 : 0

    const successRate = 100 - errorRate

    // Error types
    const errorsByType = this.db
      .prepare(
        `
      SELECT 
        COALESCE(m.error, 'Unknown Error') as type,
        COUNT(*) as count
      FROM messages m
      JOIN chats c ON m.chat_id = c.id
      WHERE m.error IS NOT NULL ${timeConstraint.replace('c.', 'm.')}
      ${filter.includeArchived ? '' : 'AND (c.archived IS NULL OR c.archived = 0)'}
      GROUP BY m.error
      ORDER BY count DESC
    `
      )
      .all() as Array<{ type: string; count: number }>

    return {
      averageResponseTime: 0, // Would need response time tracking
      errorRate: Math.round(errorRate * 100) / 100,
      successRate: Math.round(successRate * 100) / 100,
      tokenUsageByModel: [], // Would need model tracking in metadata
      responseTimeByModel: [], // Would need response time tracking
      errorsByType
    }
  }

  /**
   * Get model usage analytics
   */
  private getModelAnalytics(timeConstraint: string, filter: AnalyticsFilter): ModelAnalytics {
    // Extract model info from metadata (if available)
    const modelUsage = this.db
      .prepare(
        `
      SELECT 
        COALESCE(
          json_extract(m.metadata, '$.model'), 
          json_extract(c.settings, '$.model'),
          'Unknown'
        ) as model,
        COUNT(*) as count
      FROM messages m
      JOIN chats c ON m.chat_id = c.id
      WHERE m.role = 'assistant' ${timeConstraint.replace('c.', 'm.')}
      ${filter.includeArchived ? '' : 'AND (c.archived IS NULL OR c.archived = 0)'}
      GROUP BY 1
      ORDER BY count DESC
    `
      )
      .all() as Array<{ model: string; count: number }>

    const totalModelUsage = modelUsage.reduce((sum, m) => sum + m.count, 0)
    const modelUsageWithPercentage = modelUsage.map(m => ({
      ...m,
      percentage: totalModelUsage > 0 ? Math.round((m.count / totalModelUsage) * 10000) / 100 : 0
    }))

    return {
      modelUsage: modelUsageWithPercentage,
      preferredModels: modelUsageWithPercentage.slice(0, 3).map(m => m.model),
      modelPerformance: modelUsage.map(m => ({
        model: m.model,
        avgResponseTime: 0, // Would need response time tracking
        errorRate: 0, // Would need error tracking by model
        tokenUsage: 0 // Would need token tracking by model
      }))
    }
  }

  /**
   * Get time constraint SQL for date filtering
   */
  private getTimeConstraint(timeRange: TimeRange): string {
    switch (timeRange) {
      case '24h':
        return `AND c.created_at >= datetime('now', '-1 day')`
      case '7d':
        return `AND c.created_at >= datetime('now', '-7 days')`
      case '30d':
        return `AND c.created_at >= datetime('now', '-30 days')`
      case '90d':
        return `AND c.created_at >= datetime('now', '-90 days')`
      case '1y':
        return `AND c.created_at >= datetime('now', '-1 year')`
      case 'all':
      default:
        return ''
    }
  }

  /**
   * Get analytics summary for dashboard
   */
  getAnalyticsSummary(timeRange: TimeRange = '30d'): {
    totalChats: number
    totalMessages: number
    activeToday: number
    averagePerDay: number
  } {
    const timeConstraint = this.getTimeConstraint(timeRange)

    const summary = this.db
      .prepare(
        `
      SELECT 
        (SELECT COUNT(*) FROM chats c WHERE 1=1 ${timeConstraint}) as total_chats,
        (SELECT COUNT(*) FROM messages m JOIN chats c ON m.chat_id = c.id 
         WHERE 1=1 ${timeConstraint.replace('c.created_at', 'm.created_at')}) as total_messages,
        (SELECT COUNT(*) FROM messages m JOIN chats c ON m.chat_id = c.id 
         WHERE DATE(m.created_at) = DATE('now')) as active_today
    `
      )
      .get() as { total_chats: number; total_messages: number; active_today: number }

    const days =
      timeRange === '24h'
        ? 1
        : timeRange === '7d'
          ? 7
          : timeRange === '30d'
            ? 30
            : timeRange === '90d'
              ? 90
              : timeRange === '1y'
                ? 365
                : 30

    return {
      totalChats: summary.total_chats,
      totalMessages: summary.total_messages,
      activeToday: summary.active_today,
      averagePerDay: Math.round((summary.total_messages / days) * 100) / 100
    }
  }
}
