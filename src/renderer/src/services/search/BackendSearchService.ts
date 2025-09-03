// @ts-nocheck
import type { SearchQuery, SearchResult, SearchStats } from '@main/db/searchTypes'
import { logger } from '../../utils/Logger'

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
          timestamp: new Date(result.message.timestamp),
        },
      }))
    } catch (error) {
      logger.error('Backend search failed', 'BackendSearchService', error)
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
        lastUpdated: new Date(stats.lastSearchAt || Date.now()),
      }
    } catch (error) {
      logger.error('Failed to get search stats', 'BackendSearchService', error)
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
      logger.error('Failed to rebuild search index', 'BackendSearchService', error)
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
      logger.error('Failed to optimize search index', 'BackendSearchService', error)
      throw error
    }
  }

  /**
   * Get search index status
   */
  async getSearchIndexStatus(): Promise<{
    needsRebuild: boolean
    messageCount: number
    indexedCount: number
  }> {
    try {
      return await window.api.search.getIndexStatus()
    } catch (error) {
      logger.error('Failed to get search index status', 'BackendSearchService', error)
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
        highlightMatches: true,
      },
    })
  }

  /**
   * Search by role
   */
  async searchByRole(role: 'user' | 'assistant' | 'system'): Promise<SearchResult[]> {
    return this.searchMessages({
      text: '',
      filters: { roles: [role] },
      options: { sortBy: 'date', sortOrder: 'desc' },
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
          end: end.toISOString(),
        },
      },
      options: { sortBy: 'date', sortOrder: 'desc' },
    })
  }

  /**
   * Build semantic search index
   */
  async buildSemanticIndex(): Promise<{ processed: number; failed: number }> {
    try {
      return (await window.api.search?.buildSemanticIndex?.()) || { processed: 0, failed: 0 }
    } catch (error) {
      logger.error('Failed to build semantic index', 'BackendSearchService', error)
      throw error
    }
  }

  /**
   * Perform semantic search
   */
  async semanticSearch(query: SearchQuery): Promise<SearchResult[]> {
    try {
      const results = await window.api.search?.semantic?.(query)

      if (!results) return []

      // Convert date strings to Date objects
      return results.map(result => ({
        ...result,
        message: {
          ...result.message,
          timestamp: new Date(result.message.timestamp),
        },
      }))
    } catch (error) {
      logger.error('Semantic search failed', 'BackendSearchService', error)
      throw error
    }
  }

  /**
   * Perform hybrid search (combines semantic and lexical)
   */
  async hybridSearch(query: SearchQuery): Promise<SearchResult[]> {
    try {
      const results = await window.api.search?.hybrid?.(query)

      if (!results) return await this.searchMessages(query)

      return results.map(result => ({
        ...result,
        message: {
          ...result.message,
          timestamp: new Date(result.message.timestamp),
        },
      }))
    } catch (error) {
      logger.error('Hybrid search failed', 'BackendSearchService', error)
      // Fallback to regular search
      return await this.searchMessages(query)
    }
  }

  /**
   * Find similar messages
   */
  async findSimilarMessages(messageId: string, limit = 5): Promise<SearchResult[]> {
    try {
      const results = await window.api.search?.findSimilar?.(messageId, limit)

      if (!results) return []

      return results.map(result => ({
        ...result,
        message: {
          ...result.message,
          timestamp: new Date(result.message.timestamp),
        },
      }))
    } catch (error) {
      logger.error('Failed to find similar messages', 'BackendSearchService', error)
      throw error
    }
  }

  /**
   * Get semantic search statistics
   */
  async getSemanticSearchStats(): Promise<any> {
    try {
      return (await window.api.search?.getSemanticStats?.()) || {}
    } catch (error) {
      logger.error('Failed to get semantic search stats', 'BackendSearchService', error)
      throw error
    }
  }

  /**
   * Build vector index
   */
  async buildVectorIndex(): Promise<void> {
    try {
      return await window.api.search?.buildVectorIndex?.()
    } catch (error) {
      logger.error('Failed to build vector index', 'BackendSearchService', error)
      throw error
    }
  }

  /**
   * Optimize vector index
   */
  async optimizeVectorIndex(): Promise<void> {
    try {
      return await window.api.search?.optimizeVectorIndex?.()
    } catch (error) {
      logger.error('Failed to optimize vector index', 'BackendSearchService', error)
      throw error
    }
  }

  /**
   * Get vector index statistics
   */
  async getVectorIndexStats(): Promise<any> {
    try {
      return (await window.api.search?.getVectorStats?.()) || {}
    } catch (error) {
      logger.error('Failed to get vector index stats', 'BackendSearchService', error)
      throw error
    }
  }

  /**
   * Perform multimodal search
   */
  async multimodalSearch(query: SearchQuery): Promise<SearchResult[]> {
    try {
      const results = await window.api.search?.multimodal?.(query)

      if (!results) return []

      return results.map(result => ({
        ...result,
        message: {
          ...result.message,
          timestamp: new Date(result.message.timestamp),
        },
      }))
    } catch (error) {
      logger.error('Multimodal search failed', 'BackendSearchService', error)
      throw error
    }
  }

  /**
   * Search in images (OCR and descriptions)
   */
  async searchImages(
    query: string,
    options: { useOCR?: boolean; useDescriptions?: boolean } = {},
  ): Promise<SearchResult[]> {
    try {
      const results = await window.api.search?.images?.(query, options)

      if (!results) return []

      return results.map(result => ({
        ...result,
        message: {
          ...result.message,
          timestamp: new Date(result.message.timestamp),
        },
      }))
    } catch (error) {
      logger.error('Image search failed', 'BackendSearchService', error)
      throw error
    }
  }

  /**
   * Search in documents
   */
  async searchDocuments(query: string): Promise<SearchResult[]> {
    try {
      const results = await window.api.search?.documents?.(query)

      if (!results) return []

      return results.map(result => ({
        ...result,
        message: {
          ...result.message,
          timestamp: new Date(result.message.timestamp),
        },
      }))
    } catch (error) {
      logger.error('Document search failed', 'BackendSearchService', error)
      throw error
    }
  }

  /**
   * Search in audio transcripts
   */
  async searchAudio(query: string): Promise<SearchResult[]> {
    try {
      const results = await window.api.search?.audio?.(query)

      if (!results) return []

      return results.map(result => ({
        ...result,
        message: {
          ...result.message,
          timestamp: new Date(result.message.timestamp),
        },
      }))
    } catch (error) {
      logger.error('Audio search failed', 'BackendSearchService', error)
      throw error
    }
  }

  /**
   * Get multimodal search statistics
   */
  async getMultimodalSearchStats(): Promise<any> {
    try {
      return (await window.api.search?.getMultimodalStats?.()) || {}
    } catch (error) {
      logger.error('Failed to get multimodal search stats', 'BackendSearchService', error)
      throw error
    }
  }

  /**
   * Get search performance analysis
   */
  async getPerformanceAnalysis(timeRange = '7d'): Promise<any> {
    try {
      return (await window.api.search?.getPerformanceAnalysis?.(timeRange)) || {}
    } catch (error) {
      logger.error('Failed to get performance analysis', 'BackendSearchService', error)
      throw error
    }
  }

  /**
   * Get performance recommendations
   */
  async getPerformanceRecommendations(): Promise<any[]> {
    try {
      return (await window.api.search?.getPerformanceRecommendations?.()) || []
    } catch (error) {
      logger.error('Failed to get performance recommendations', 'BackendSearchService', error)
      throw error
    }
  }

  /**
   * Optimize search performance
   */
  async optimizePerformance(): Promise<any> {
    try {
      return (
        (await window.api.search?.optimizePerformance?.()) || {
          optimizationsApplied: [],
          estimatedImprovement: 'No optimizations available',
        }
      )
    } catch (error) {
      logger.error('Failed to optimize search performance', 'BackendSearchService', error)
      throw error
    }
  }

  /**
   * Search with advanced filters
   */
  async advancedSearch(
    text: string,
    filters: Partial<SearchQuery['filters']>,
    options: Partial<SearchQuery['options']> = {},
  ): Promise<SearchResult[]> {
    // Convert Date objects to ISO strings for date range
    const processedFilters = { ...filters }
    if (filters.dateRange) {
      processedFilters.dateRange = {
        start:
          filters.dateRange.start instanceof Date
            ? filters.dateRange.start.toISOString()
            : filters.dateRange.start,
        end:
          filters.dateRange.end instanceof Date
            ? filters.dateRange.end.toISOString()
            : filters.dateRange.end,
      }
    }

    return this.searchMessages({
      text,
      filters: processedFilters as SearchQuery['filters'],
      options: {
        maxResults: 50,
        sortBy: 'relevance',
        highlightMatches: true,
        ...options,
      },
    })
  }
}

// Export singleton instance
export const backendSearchService = BackendSearchService.getInstance()
