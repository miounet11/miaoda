import type { 
  AnalyticsData, 
  AnalyticsFilter, 
  AnalyticsExportConfig,
  TimeRange
} from '../../types'

/**
 * Frontend Analytics Service
 * Handles communication with the backend analytics system
 */
export class AnalyticsService {
  private cache = new Map<string, { data: AnalyticsData; timestamp: number }>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  /**
   * Generate comprehensive analytics data
   */
  async generateAnalytics(filter: AnalyticsFilter): Promise<AnalyticsData> {
    const cacheKey = this.getCacheKey(filter)
    const cached = this.cache.get(cacheKey)
    
    // Return cached data if available and not expired
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }

    try {
      const data = await window.electronAPI.generateAnalytics(filter)
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      })
      
      return data
    } catch (error) {
      console.error('Failed to generate analytics:', error)
      throw new Error(`Failed to generate analytics: ${error}`)
    }
  }

  /**
   * Get analytics summary
   */
  async getAnalyticsSummary(timeRange: TimeRange = '30d'): Promise<{
    totalChats: number
    totalMessages: number
    activeToday: number
    averagePerDay: number
  }> {
    try {
      return await window.electronAPI.getAnalyticsSummary(timeRange)
    } catch (error) {
      console.error('Failed to get analytics summary:', error)
      throw new Error(`Failed to get analytics summary: ${error}`)
    }
  }

  /**
   * Export analytics data
   */
  async exportAnalytics(config: AnalyticsExportConfig): Promise<void> {
    try {
      const filter: AnalyticsFilter = {
        timeRange: config.timeRange,
        includeArchived: false
      }

      const data = await this.generateAnalytics(filter)

      switch (config.format) {
        case 'json':
          await this.exportAsJSON(data, config)
          break
        case 'csv':
          await this.exportAsCSV(data, config)
          break
        case 'pdf':
          await this.exportAsPDF(data, config)
          break
        case 'xlsx':
          await this.exportAsXLSX(data, config)
          break
        default:
          throw new Error(`Unsupported export format: ${config.format}`)
      }
    } catch (error) {
      console.error('Failed to export analytics:', error)
      throw new Error(`Failed to export analytics: ${error}`)
    }
  }

  /**
   * Clear analytics cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get cache status
   */
  getCacheStatus(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }

  private getCacheKey(filter: AnalyticsFilter): string {
    return JSON.stringify({
      timeRange: filter.timeRange,
      models: filter.models?.sort() || [],
      tags: filter.tags?.sort() || [],
      chatIds: filter.chatIds?.sort() || [],
      messageTypes: filter.messageTypes?.sort() || [],
      includeArchived: filter.includeArchived || false
    })
  }

  private async exportAsJSON(data: AnalyticsData, config: AnalyticsExportConfig): Promise<void> {
    const jsonData = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonData], { type: 'application/json' })
    await this.downloadBlob(blob, `analytics-${Date.now()}.json`)
  }

  private async exportAsCSV(data: AnalyticsData, config: AnalyticsExportConfig): Promise<void> {
    let csv = 'Section,Metric,Value\n'
    
    // Chat analytics
    csv += `Chat,Total Chats,${data.chat.totalChats}\n`
    csv += `Chat,Total Messages,${data.chat.totalMessages}\n`
    csv += `Chat,Average Messages Per Chat,${data.chat.averageMessagesPerChat}\n`
    csv += `Chat,Active Chats,${data.chat.activeChats}\n`
    csv += `Chat,Archived Chats,${data.chat.archivedChats}\n`
    
    // Message analytics
    csv += `Message,User Messages,${data.message.userMessages}\n`
    csv += `Message,Assistant Messages,${data.message.assistantMessages}\n`
    csv += `Message,Average Message Length,${data.message.averageMessageLength}\n`
    csv += `Message,Total Tokens,${data.message.totalTokens}\n`
    csv += `Message,Average Tokens Per Message,${data.message.averageTokensPerMessage}\n`
    
    // Usage analytics
    csv += `Usage,Daily Average,${data.usage.dailyAverage}\n`
    csv += `Usage,Peak Usage Time,${data.usage.peakUsageTime}\n`
    csv += `Usage,Weekly Trend,${data.usage.weeklyTrend}\n`
    
    // Top keywords
    data.content.topKeywords.forEach(keyword => {
      csv += `Keyword,"${keyword.keyword}",${keyword.count}\n`
    })
    
    const blob = new Blob([csv], { type: 'text/csv' })
    await this.downloadBlob(blob, `analytics-${Date.now()}.csv`)
  }

  private async exportAsPDF(data: AnalyticsData, config: AnalyticsExportConfig): Promise<void> {
    // Would require jsPDF integration
    throw new Error('PDF export not implemented yet')
  }

  private async exportAsXLSX(data: AnalyticsData, config: AnalyticsExportConfig): Promise<void> {
    // Would require xlsx library integration
    throw new Error('XLSX export not implemented yet')
  }

  private async downloadBlob(blob: Blob, filename: string): Promise<void> {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * Get time range options for UI
   */
  getTimeRangeOptions(): Array<{ value: TimeRange; label: string; description: string }> {
    return [
      { value: '24h', label: '24 Hours', description: 'Last 24 hours' },
      { value: '7d', label: '7 Days', description: 'Last 7 days' },
      { value: '30d', label: '30 Days', description: 'Last 30 days' },
      { value: '90d', label: '90 Days', description: 'Last 3 months' },
      { value: '1y', label: '1 Year', description: 'Last 12 months' },
      { value: 'all', label: 'All Time', description: 'All available data' }
    ]
  }

  /**
   * Get export format options
   */
  getExportFormatOptions(): Array<{ value: string; label: string; description: string }> {
    return [
      { value: 'json', label: 'JSON', description: 'Raw data in JSON format' },
      { value: 'csv', label: 'CSV', description: 'Comma-separated values for spreadsheets' },
      { value: 'pdf', label: 'PDF', description: 'Formatted report with charts (coming soon)' },
      { value: 'xlsx', label: 'Excel', description: 'Excel workbook (coming soon)' }
    ]
  }
}