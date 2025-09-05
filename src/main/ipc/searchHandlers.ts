import { ipcMain } from 'electron'
import { LocalDatabase } from '../db/database'
import { logger } from '../utils/Logger'

export function registerSearchHandlers(db: LocalDatabase) {
  logger.info('注册搜索IPC处理器', 'SearchHandlers')

  // 基础搜索功能
  ipcMain.handle('search:messages', async (_, searchQuery) => {
    try {
      return db.searchMessages(searchQuery)
    } catch (error: any) {
      logger.error('Search failed', 'SearchHandlers', error)
      throw new Error(`Search failed: ${error.message}`)
    }
  })

  ipcMain.handle('search:get-stats', async () => {
    try {
      return db.getSearchStats()
    } catch (error: any) {
      logger.error('Failed to get search stats', 'SearchHandlers', error)
      throw new Error(`Failed to get search stats: ${error.message}`)
    }
  })

  // 搜索索引管理
  ipcMain.handle('search:rebuild-index', async () => {
    try {
      db.rebuildSearchIndex()
      return { success: true }
    } catch (error: any) {
      logger.error('Failed to rebuild search index', 'SearchHandlers', error)
      throw new Error(`Failed to rebuild search index: ${error.message}`)
    }
  })

  ipcMain.handle('search:optimize-index', async () => {
    try {
      // @ts-ignore - Method may not exist on all database implementations
      db.optimizeSearchIndex?.()
      return { success: true }
    } catch (error: any) {
      logger.error('Failed to optimize search index', 'SearchHandlers', error)
      throw new Error(`Failed to optimize search index: ${error.message}`)
    }
  })

  ipcMain.handle('search:get-index-status', async () => {
    try {
      // @ts-ignore - Method may not exist on all database implementations
      return db.getSearchIndexStatus?.() || db.getSearchStats?.()
    } catch (error: any) {
      logger.error('Failed to get search index status', 'SearchHandlers', error)
      throw new Error(`Failed to get search index status: ${error.message}`)
    }
  })

  // 语义搜索功能
  ipcMain.handle('search:build-semantic-index', async () => {
    try {
      // @ts-ignore - Method may not exist on all database implementations
      return (await db.buildSemanticIndex?.()) || { success: false, message: 'Not implemented' }
    } catch (error: any) {
      logger.error('Failed to build semantic index', 'SearchHandlers', error)
      throw new Error(`Failed to build semantic index: ${error.message}`)
    }
  })

  ipcMain.handle('search:semantic', async (_, searchQuery) => {
    try {
      // @ts-ignore - Method may not exist on all database implementations
      return (await db.semanticSearch?.(searchQuery)) || []
    } catch (error: any) {
      logger.error('Failed to perform semantic search', 'SearchHandlers', error)
      throw new Error(`Failed to perform semantic search: ${error.message}`)
    }
  })

  ipcMain.handle('search:hybrid', async (_, searchQuery) => {
    try {
      // @ts-ignore - Method may not exist on all database implementations
      return (await db.hybridSearch?.(searchQuery)) || []
    } catch (error: any) {
      logger.error('Failed to perform hybrid search', 'SearchHandlers', error)
      throw new Error(`Failed to perform hybrid search: ${error.message}`)
    }
  })

  ipcMain.handle('search:find-similar', async (_, messageId, limit = 5) => {
    try {
      // @ts-ignore - Method may not exist on all database implementations
      return (await db.findSimilarMessages?.(messageId, limit)) || []
    } catch (error: any) {
      logger.error('Failed to find similar messages', 'SearchHandlers', error)
      throw new Error(`Failed to find similar messages: ${error.message}`)
    }
  })

  ipcMain.handle('search:get-semantic-stats', async () => {
    try {
      // @ts-ignore - Method may not exist on all database implementations
      return db.getSemanticSearchStats?.() || {}
    } catch (error: any) {
      logger.error('Failed to get semantic search stats', 'SearchHandlers', error)
      throw new Error(`Failed to get semantic search stats: ${error.message}`)
    }
  })

  // 向量数据库功能
  ipcMain.handle('search:build-vector-index', async () => {
    try {
      // @ts-ignore - Method may not exist on all database implementations
      return (await db.buildVectorIndex?.()) || { success: false, message: 'Not implemented' }
    } catch (error: any) {
      logger.error('Failed to build vector index', 'SearchHandlers', error)
      throw new Error(`Failed to build vector index: ${error.message}`)
    }
  })

  ipcMain.handle('search:optimize-vector-index', async () => {
    try {
      // @ts-ignore - Method may not exist on all database implementations
      return (await db.optimizeVectorIndex?.()) || { success: false, message: 'Not implemented' }
    } catch (error: any) {
      logger.error('Failed to optimize vector index', 'SearchHandlers', error)
      throw new Error(`Failed to optimize vector index: ${error.message}`)
    }
  })

  ipcMain.handle('search:get-vector-stats', async () => {
    try {
      // @ts-ignore - Method may not exist on all database implementations
      return db.getVectorIndexStats?.() || {}
    } catch (error: any) {
      logger.error('Failed to get vector index stats', 'SearchHandlers', error)
      throw new Error(`Failed to get vector index stats: ${error.message}`)
    }
  })

  // 多模态搜索功能
  ipcMain.handle('search:multimodal', async (_, searchQuery) => {
    try {
      // @ts-ignore - Method may not exist on all database implementations
      return (await db.multimodalSearch?.(searchQuery)) || []
    } catch (error: any) {
      logger.error('Failed to perform multimodal search', 'SearchHandlers', error)
      throw new Error(`Failed to perform multimodal search: ${error.message}`)
    }
  })

  ipcMain.handle('search:images', async (_, query, options) => {
    try {
      // @ts-ignore - Method may not exist on all database implementations
      return (await db.searchImages?.(query, options)) || []
    } catch (error: any) {
      logger.error('Failed to search images', 'SearchHandlers', error)
      throw new Error(`Failed to search images: ${error.message}`)
    }
  })

  ipcMain.handle('search:documents', async (_, query) => {
    try {
      // @ts-ignore - Method may not exist on all database implementations
      return (await db.searchDocuments?.(query)) || []
    } catch (error: any) {
      logger.error('Failed to search documents', 'SearchHandlers', error)
      throw new Error(`Failed to search documents: ${error.message}`)
    }
  })

  ipcMain.handle('search:audio', async (_, query) => {
    try {
      // @ts-ignore - Method may not exist on all database implementations
      return (await db.searchAudio?.(query)) || []
    } catch (error: any) {
      logger.error('Failed to search audio', 'SearchHandlers', error)
      throw new Error(`Failed to search audio: ${error.message}`)
    }
  })

  ipcMain.handle('search:get-multimodal-stats', async () => {
    try {
      // @ts-ignore - Method may not exist on all database implementations
      return db.getMultimodalSearchStats?.() || {}
    } catch (error: any) {
      logger.error('Failed to get multimodal search stats', 'SearchHandlers', error)
      throw new Error(`Failed to get multimodal search stats: ${error.message}`)
    }
  })

  // 搜索性能监控
  ipcMain.handle('search:get-performance-analysis', async (_, timeRange = '7d') => {
    try {
      // @ts-ignore - Method may not exist on all database implementations
      return db.getSearchPerformanceAnalysis?.(timeRange) || {}
    } catch (error: any) {
      logger.error('Failed to get performance analysis', 'SearchHandlers', error)
      throw new Error(`Failed to get performance analysis: ${error.message}`)
    }
  })

  ipcMain.handle('search:get-performance-recommendations', async () => {
    try {
      // @ts-ignore - Method may not exist on all database implementations
      return db.getSearchPerformanceRecommendations?.() || []
    } catch (error: any) {
      logger.error('Failed to get performance recommendations', 'SearchHandlers', error)
      throw new Error(`Failed to get performance recommendations: ${error.message}`)
    }
  })

  ipcMain.handle('search:optimize', async (_event, payload) => {
    try {
      if ((db as any).optimizeSearchPerformance) {
        await (db as any).optimizeSearchPerformance(payload)
      }
      /* no-op sender in headless optimize */
    } catch {
      /* no-op */
    }
  })

  logger.info('搜索IPC处理器注册完成', 'SearchHandlers')
}
