import type { Message } from '@renderer/src/types'

export interface ChatSummary {
  summary: string
  tags: string[]
  keyPoints: string[]
  summaryUpdatedAt?: Date
  summaryTokens?: number
}

export interface SummaryGenerationOptions {
  maxLength?: number
  includeKeyPoints?: boolean
  includeTags?: boolean
  language?: string
}

/**
 * Frontend service for handling chat summary functionality
 */
export class SummaryService {
  private static instance: SummaryService | null = null

  static getInstance(): SummaryService {
    if (!SummaryService.instance) {
      SummaryService.instance = new SummaryService()
    }
    return SummaryService.instance
  }

  /**
   * Generate summary using LLM API
   */
  async generateSummary(
    chatId: string, 
    messages: Message[], 
    options: SummaryGenerationOptions = {}
  ): Promise<ChatSummary> {
    const {
      maxLength = 200,
      includeKeyPoints = true,
      includeTags = true,
      language = 'zh-CN'
    } = options

    try {
      // Filter out system messages and get content
      const conversationContent = messages
        .filter(msg => msg.role !== 'system')
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n\n')

      if (conversationContent.length === 0) {
        throw new Error('No conversation content to summarize')
      }

      // Create summary prompt
      const summaryPrompt = this.createSummaryPrompt(
        conversationContent, 
        maxLength, 
        includeKeyPoints, 
        includeTags,
        language
      )

      // Call LLM API for summary generation
      const response = await this.callLLMForSummary(summaryPrompt)
      
      // Parse the response
      const summary = this.parseSummaryResponse(response)

      // Save summary to database
      await this.saveSummaryToDatabase(chatId, summary)

      return summary
    } catch (error) {
      console.error('Failed to generate summary:', error)
      throw new Error(`Summary generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get existing summary from database
   */
  async getChatSummary(chatId: string): Promise<ChatSummary | null> {
    try {
      if (!window.api?.db?.getChatSummary) {
        console.warn('Summary API not available')
        return null
      }

      const summaryData = await window.api.db.getChatSummary(chatId)
      return summaryData
    } catch (error) {
      console.error('Failed to get chat summary:', error)
      return null
    }
  }

  /**
   * Update summary manually
   */
  async updateSummary(chatId: string, summary: Partial<ChatSummary>): Promise<void> {
    try {
      if (!window.api?.db?.updateChatSummary) {
        throw new Error('Summary API not available')
      }

      const existingSummary = await this.getChatSummary(chatId)
      const updatedSummary = {
        summary: summary.summary || existingSummary?.summary || '',
        tags: summary.tags || existingSummary?.tags || [],
        keyPoints: summary.keyPoints || existingSummary?.keyPoints || []
      }

      await window.api.db.updateChatSummary(
        chatId,
        updatedSummary.summary,
        updatedSummary.tags,
        updatedSummary.keyPoints,
        summary.summaryTokens
      )
    } catch (error) {
      console.error('Failed to update summary:', error)
      throw error
    }
  }

  /**
   * Get all unique tags
   */
  async getAllTags(): Promise<string[]> {
    try {
      if (!window.api?.db?.getAllSummaryTags) {
        return []
      }

      return await window.api.db.getAllSummaryTags()
    } catch (error) {
      console.error('Failed to get all tags:', error)
      return []
    }
  }

  /**
   * Search chats by tags
   */
  async searchChatsByTags(tags: string[]) {
    try {
      if (!window.api?.db?.searchChatsByTags) {
        return []
      }

      return await window.api.db.searchChatsByTags(tags)
    } catch (error) {
      console.error('Failed to search chats by tags:', error)
      return []
    }
  }

  /**
   * Check if chat needs summary update
   */
  async needsSummaryUpdate(chatId: string, minMessages = 5, maxAgeHours = 24): Promise<boolean> {
    try {
      if (!window.api?.db?.needsSummaryUpdate) {
        return false
      }

      return await window.api.db.needsSummaryUpdate(chatId, minMessages, maxAgeHours)
    } catch (error) {
      console.error('Failed to check summary update need:', error)
      return false
    }
  }

  /**
   * Clear chat summary
   */
  async clearSummary(chatId: string): Promise<void> {
    try {
      if (!window.api?.db?.clearChatSummary) {
        throw new Error('Summary API not available')
      }

      await window.api.db.clearChatSummary(chatId)
    } catch (error) {
      console.error('Failed to clear summary:', error)
      throw error
    }
  }

  /**
   * Create summary prompt for LLM
   */
  private createSummaryPrompt(
    conversationContent: string,
    maxLength: number,
    includeKeyPoints: boolean,
    includeTags: boolean,
    language: string
  ): string {
    const instructions = language === 'zh-CN' ? {
      title: '请为以下对话生成摘要',
      summary: `简洁摘要（最多${maxLength}字）`,
      keyPoints: '关键要点（3-5个）',
      tags: '相关标签（3-8个）',
      format: '请以JSON格式返回结果'
    } : {
      title: 'Please generate a summary for the following conversation',
      summary: `Concise summary (max ${maxLength} characters)`,
      keyPoints: 'Key points (3-5 items)',
      tags: 'Relevant tags (3-8 items)',
      format: 'Please return the result in JSON format'
    }

    let prompt = `${instructions.title}:

${conversationContent}

${instructions.format}:
{
  "summary": "${instructions.summary}",`

    if (includeKeyPoints) {
      prompt += `
  "keyPoints": ["${instructions.keyPoints}"],`
    }

    if (includeTags) {
      prompt += `
  "tags": ["${instructions.tags}"]`
    }

    prompt += `
}`

    return prompt
  }

  /**
   * Call LLM API for summary generation
   */
  private async callLLMForSummary(prompt: string): Promise<string> {
    // Use the existing LLM API from the application
    if (!window.api?.llm?.generateSummary) {
      throw new Error('LLM API not available for summary generation')
    }

    try {
      const response = await window.api.llm.generateSummary(prompt)
      return response
    } catch (error) {
      console.error('LLM API call failed:', error)
      throw new Error('Failed to generate summary using LLM')
    }
  }

  /**
   * Parse LLM response to extract summary data
   */
  private parseSummaryResponse(response: string): ChatSummary {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])
      
      return {
        summary: parsed.summary || '',
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
        summaryUpdatedAt: new Date()
      }
    } catch (error) {
      console.error('Failed to parse summary response:', error)
      
      // Fallback: treat the entire response as summary
      return {
        summary: response.substring(0, 200),
        tags: [],
        keyPoints: [],
        summaryUpdatedAt: new Date()
      }
    }
  }

  /**
   * Save summary to database
   */
  private async saveSummaryToDatabase(chatId: string, summary: ChatSummary): Promise<void> {
    if (!window.api?.db?.updateChatSummary) {
      throw new Error('Database API not available')
    }

    await window.api.db.updateChatSummary(
      chatId,
      summary.summary,
      summary.tags,
      summary.keyPoints,
      summary.summaryTokens
    )
  }

  /**
   * Extract text content from messages for analysis
   */
  extractTextContent(messages: Message[]): string {
    return messages
      .filter(msg => msg.role !== 'system' && msg.content.trim())
      .map(msg => msg.content)
      .join(' ')
      .substring(0, 10000) // Limit text size for performance
  }

  /**
   * Calculate summary importance score based on message count, length, etc.
   */
  calculateImportanceScore(messages: Message[]): number {
    const messageCount = messages.length
    const avgLength = messages.reduce((sum, msg) => sum + msg.content.length, 0) / messageCount
    const hasAttachments = messages.some(msg => msg.attachments && msg.attachments.length > 0)
    
    let score = 0
    
    // Message count factor
    if (messageCount >= 10) score += 30
    else if (messageCount >= 5) score += 20
    else if (messageCount >= 3) score += 10
    
    // Message length factor
    if (avgLength > 200) score += 20
    else if (avgLength > 100) score += 10
    
    // Attachment factor
    if (hasAttachments) score += 15
    
    // Conversation activity (recent messages)
    const recentMessages = messages.filter(msg => {
      const hoursSinceMessage = (Date.now() - msg.timestamp.getTime()) / (1000 * 60 * 60)
      return hoursSinceMessage < 24
    })
    
    if (recentMessages.length > 0) score += 10
    
    return Math.min(score, 100) // Cap at 100
  }
}