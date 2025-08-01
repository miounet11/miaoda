import type { SearchQuery, SearchResult, SearchStats } from '@main/db/searchTypes'

export class BackendSearchService {
  private static instance: BackendSearchService | null = null

  private constructor() {}

  static getInstance(): BackendSearchService {
    if (!BackendSearchService.instance) {
      BackendSearchService.instance = new BackendSearchService()
    }
    return BackendSearchService.instance
  }

  /**
   * Search messages using backend database
   */
  async searchMessages(query: SearchQuery): Promise<SearchResult[]> {
    try {
      const results = await window.api.search.messages(query)
      
      // Convert date strings to Date objects
      return results.map(result => ({
        ...result,
        message: {
          ...result.message,
          timestamp: new Date(result.message.timestamp)
        }
      }))
    } catch (error) {
      console.error('Backend search failed:', error)
      throw error
    }
  }

  /**
   * Get search statistics
   */
  async getSearchStats(): Promise<SearchStats> {
    try {
      const stats = await window.api.search.getStats()
      return {
        ...stats,
        lastUpdated: new Date(stats.lastSearchAt || Date.now())
      }
    } catch (error) {
      console.error('Failed to get search stats:', error)
      throw error
    }
  }

  /**
   * Rebuild search index
   */
  async rebuildSearchIndex(): Promise<{ success: boolean }> {
    try {
      return await window.api.search.rebuildIndex()
    } catch (error) {
      console.error('Failed to rebuild search index:', error)
      throw error
    }
  }

  /**
   * Optimize search index for better performance
   */
  async optimizeSearchIndex(): Promise<{ success: boolean }> {
    try {
      return await window.api.search.optimizeIndex()
    } catch (error) {
      console.error('Failed to optimize search index:', error)
      throw error
    }
  }

  /**
   * Get search index status
   */
  async getSearchIndexStatus(): Promise<{ needsRebuild: boolean, messageCount: number, indexedCount: number }> {
    try {
      return await window.api.search.getIndexStatus()
    } catch (error) {
      console.error('Failed to get search index status:', error)
      throw error
    }
  }

  /**
   * Quick search with default options
   */
  async quickSearch(text: string, maxResults = 20): Promise<SearchResult[]> {
    return this.searchMessages({
      text,
      filters: {},
      options: {
        maxResults,
        sortBy: 'relevance',
        highlightMatches: true
      }
    })
  }

  /**
   * Search by role
   */
  async searchByRole(role: 'user' | 'assistant' | 'system'): Promise<SearchResult[]> {
    return this.searchMessages({
      text: '',
      filters: { roles: [role] },
      options: { sortBy: 'date', sortOrder: 'desc' }
    })
  }

  /**
   * Search by date range
   */
  async searchByDateRange(start: Date, end: Date): Promise<SearchResult[]> {
    return this.searchMessages({
      text: '',
      filters: { 
        dateRange: { 
          start: start.toISOString(), 
          end: end.toISOString() 
        } 
      },
      options: { sortBy: 'date', sortOrder: 'desc' }
    })
  }

  /**
   * Search with advanced filters
   */
  async advancedSearch(
    text: string,
    filters: Partial<SearchQuery['filters']>,
    options: Partial<SearchQuery['options']> = {}
  ): Promise<SearchResult[]> {
    // Convert Date objects to ISO strings for date range
    const processedFilters = { ...filters }
    if (filters.dateRange) {
      processedFilters.dateRange = {
        start: filters.dateRange.start instanceof Date 
          ? filters.dateRange.start.toISOString() 
          : filters.dateRange.start,
        end: filters.dateRange.end instanceof Date 
          ? filters.dateRange.end.toISOString() 
          : filters.dateRange.end
      }
    }

    return this.searchMessages({
      text,
      filters: processedFilters as SearchQuery['filters'],
      options: {
        maxResults: 50,
        sortBy: 'relevance',
        highlightMatches: true,
        ...options
      }
    })
  }
}

// Export singleton instance
export const backendSearchService = BackendSearchService.getInstance()