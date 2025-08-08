import { ipcMain, dialog, app } from 'electron'
import { writeFile } from 'fs/promises'
import { LocalDatabase, ChatRecord } from './db/database'
import { MCPManager } from './mcp/mcpManager'
import { PluginManager } from './plugins/pluginManager'
import { getAllServers } from './mcp/servers'
import { createLLMManager, registerLLMHandlers } from './llm/llmManager'
import { registerFileHandlers } from './fileHandler'
import { registerShortcutHandlers } from './shortcuts'
import { logger } from './utils/Logger'

export function registerIPCHandlers(
  db: LocalDatabase,
  mcpManager: MCPManager,
  pluginManager: PluginManager
) {
  logger.info('Registering IPC handlers', 'IPC', { dbInitialized: !!db })
  
  // App version handler
  ipcMain.handle('get-app-version', () => app.getVersion())

  // Register file handlers
  registerFileHandlers()

  // Register shortcut handlers
  registerShortcutHandlers()

  // LLM handlers - create manager and register handlers
  const llmManager = createLLMManager(mcpManager)
  registerLLMHandlers(llmManager)

  // LLM Summary generation handler
  ipcMain.handle('llm:generate-summary', async (_, prompt: string) => {
    try {
      // Check if LLM is configured
      if (!llmManager.isConfigured()) {
        throw new Error('No LLM provider configured')
      }

      // Use llmManager to send message for summary generation
      // Create a temporary chat ID for summary generation
      const tempChatId = `summary-${Date.now()}`
      let fullResponse = ''
      
      // Send message through llmManager
      await llmManager.sendMessage(
        prompt,
        tempChatId,
        undefined,
        (chunk) => {
          fullResponse += chunk
        }
      )
      
      if (!fullResponse.trim()) {
        throw new Error('Empty response from LLM provider')
      }

      return fullResponse
    } catch (error: any) {
      logger.error('Failed to generate summary with LLM', 'IPC', error)
      throw new Error(`Summary generation failed: ${error.message}`)
    }
  })

  // Note: llm:getProviders replaced by llm:getAllProviders in llmManager.ts

  // MCP handlers
  ipcMain.handle('mcp:get-servers', () => {
    return getAllServers()
  })

  ipcMain.handle('mcp:connect', async (_, server) => {
    await mcpManager.connectServer(server)
  })

  ipcMain.handle('mcp:disconnect', async (_, name) => {
    await mcpManager.disconnectServer(name)
  })

  ipcMain.handle('mcp:get-tools', () => {
    return mcpManager.getAvailableTools()
  })

  ipcMain.handle('mcp:call-tool', async (_, toolName, args) => {
    return mcpManager.callTool(toolName, args)
  })

  // Plugin handlers
  ipcMain.handle('plugins:get-all', () => {
    return pluginManager.getPlugins().map(p => ({
      id: p.manifest.id,
      name: p.manifest.name,
      version: p.manifest.version,
      description: p.manifest.description,
      author: p.manifest.author,
      capabilities: p.manifest.capabilities,
      enabled: p.enabled
    }))
  })

  ipcMain.handle('plugins:enable', async (_, pluginId: string) => {
    await pluginManager.activatePlugin(pluginId)
  })

  ipcMain.handle('plugins:disable', async (_, pluginId: string) => {
    await pluginManager.deactivatePlugin(pluginId)
  })

  // Database handlers
  ipcMain.handle('db:create-chat', async (_, chat) => {
    db.createChat(chat)
  })

  ipcMain.handle('db:update-chat', async (_, id, title, updated_at) => {
    db.updateChat(id, title, updated_at)
  })

  ipcMain.handle('db:delete-chat', async (_, id) => {
    db.deleteChat(id)
  })

  ipcMain.handle('db:get-chat', async (_, id) => {
    return db.getChat(id)
  })

  ipcMain.handle('db:get-all-chats', async () => {
    return db.getAllChats()
  })

  ipcMain.handle('db:create-message', async (_, message) => {
    db.createMessage(message)
  })

  ipcMain.handle('db:update-message', async (_, messageId, content) => {
    db.updateMessage(messageId, content)
  })

  ipcMain.handle('db:get-messages', async (_, chatId) => {
    return db.getMessages(chatId)
  })

  ipcMain.handle('db:search-chats', async (_, query) => {
    return db.searchChats(query)
  })

  // Summary handlers
  ipcMain.handle('db:update-chat-summary', async (_, chatId, summary, tags, keyPoints, tokens) => {
    try {
      db.updateChatSummary(chatId, summary, tags, keyPoints, tokens)
      return { success: true }
    } catch (error: any) {
      logger.error('Failed to update chat summary', 'IPC', error)
      throw new Error(`Failed to update chat summary: ${error.message}`)
    }
  })

  ipcMain.handle('db:get-chat-summary', async (_, chatId) => {
    try {
      return db.getChatSummary(chatId)
    } catch (error: any) {
      logger.error('Failed to get chat summary', 'IPC', error)
      throw new Error(`Failed to get chat summary: ${error.message}`)
    }
  })

  ipcMain.handle('db:get-all-chats-with-summaries', async () => {
    try {
      return db.getAllChatsWithSummaries()
    } catch (error: any) {
      logger.error('Failed to get chats with summaries', 'IPC', error)
      throw new Error(`Failed to get chats with summaries: ${error.message}`)
    }
  })

  ipcMain.handle('db:search-chats-by-tags', async (_, tags) => {
    try {
      return db.searchChatsByTags(tags)
    } catch (error: any) {
      logger.error('Failed to search chats by tags', 'IPC', error)
      throw new Error(`Failed to search chats by tags: ${error.message}`)
    }
  })

  ipcMain.handle('db:get-all-summary-tags', async () => {
    try {
      return db.getAllSummaryTags()
    } catch (error: any) {
      logger.error('Failed to get summary tags', 'IPC', error)
      throw new Error(`Failed to get summary tags: ${error.message}`)
    }
  })

  ipcMain.handle('db:clear-chat-summary', async (_, chatId) => {
    try {
      db.clearChatSummary(chatId)
      return { success: true }
    } catch (error: any) {
      logger.error('Failed to clear chat summary', 'IPC', error)
      throw new Error(`Failed to clear chat summary: ${error.message}`)
    }
  })

  ipcMain.handle('db:needs-summary-update', async (_, chatId, minMessages, maxAgeHours) => {
    try {
      return db.needsSummaryUpdate(chatId, minMessages, maxAgeHours)
    } catch (error: any) {
      logger.error('Failed to check summary update need', 'IPC', error)
      return false
    }
  })

  // Analytics handlers
  ipcMain.handle('db:generate-analytics', async (_, filter) => {
    try {
      logger.debug('Generating analytics', 'IPC', { filter })
      const result = db.generateAnalytics(filter)
      logger.debug('Analytics generated successfully', 'IPC', { 
        timeRange: result.timeRange,
        totalChats: result.chat.totalChats,
        totalMessages: result.chat.totalMessages 
      })
      return result
    } catch (error: any) {
      logger.error('Failed to generate analytics', 'IPC', error)
      throw error
    }
  })

  ipcMain.handle('db:get-analytics-summary', async (_, timeRange) => {
    try {
      logger.debug('Getting analytics summary', 'IPC', { timeRange })
      const result = db.getAnalyticsSummary(timeRange)
      logger.debug('Analytics summary retrieved', 'IPC', result)
      return result
    } catch (error: any) {
      logger.error('Failed to get analytics summary', 'IPC', error)
      throw error
    }
  })

  // Advanced search handlers
  ipcMain.handle('search:messages', async (_, searchQuery) => {
    try {
      return db.searchMessages(searchQuery)
    } catch (error: any) {
      console.error('Search failed:', error)
      throw new Error(`Search failed: ${error.message}`)
    }
  })

  ipcMain.handle('search:get-stats', async () => {
    try {
      return db.getSearchStats()
    } catch (error: any) {
      console.error('Failed to get search stats:', error)
      throw new Error(`Failed to get search stats: ${error.message}`)
    }
  })

  // Search index management handlers
  ipcMain.handle('search:rebuild-index', async () => {
    try {
      db.rebuildSearchIndex()
      return { success: true }
    } catch (error: any) {
      console.error('Failed to rebuild search index:', error)
      throw new Error(`Failed to rebuild search index: ${error.message}`)
    }
  })

  ipcMain.handle('search:optimize-index', async () => {
    try {
      db.optimizeSearchIndex()
      return { success: true }
    } catch (error: any) {
      console.error('Failed to optimize search index:', error)
      throw new Error(`Failed to optimize search index: ${error.message}`)
    }
  })

  ipcMain.handle('search:get-index-status', async () => {
    try {
      return db.getSearchIndexStatus()
    } catch (error: any) {
      console.error('Failed to get search index status:', error)
      throw new Error(`Failed to get search index status: ${error.message}`)
    }
  })

  // Semantic search handlers
  ipcMain.handle('search:build-semantic-index', async () => {
    try {
      return await db.buildSemanticIndex()
    } catch (error: any) {
      console.error('Failed to build semantic index:', error)
      throw new Error(`Failed to build semantic index: ${error.message}`)
    }
  })

  ipcMain.handle('search:semantic', async (_, searchQuery) => {
    try {
      return await db.semanticSearch(searchQuery)
    } catch (error: any) {
      console.error('Failed to perform semantic search:', error)
      throw new Error(`Failed to perform semantic search: ${error.message}`)
    }
  })

  ipcMain.handle('search:hybrid', async (_, searchQuery) => {
    try {
      return await db.hybridSearch(searchQuery)
    } catch (error: any) {
      console.error('Failed to perform hybrid search:', error)
      throw new Error(`Failed to perform hybrid search: ${error.message}`)
    }
  })

  ipcMain.handle('search:find-similar', async (_, messageId, limit = 5) => {
    try {
      return await db.findSimilarMessages(messageId, limit)
    } catch (error: any) {
      console.error('Failed to find similar messages:', error)
      throw new Error(`Failed to find similar messages: ${error.message}`)
    }
  })

  ipcMain.handle('search:get-semantic-stats', async () => {
    try {
      return db.getSemanticSearchStats()
    } catch (error: any) {
      console.error('Failed to get semantic search stats:', error)
      throw new Error(`Failed to get semantic search stats: ${error.message}`)
    }
  })

  // Vector database handlers
  ipcMain.handle('search:build-vector-index', async () => {
    try {
      return await db.buildVectorIndex()
    } catch (error: any) {
      console.error('Failed to build vector index:', error)
      throw new Error(`Failed to build vector index: ${error.message}`)
    }
  })

  ipcMain.handle('search:optimize-vector-index', async () => {
    try {
      return await db.optimizeVectorIndex()
    } catch (error: any) {
      console.error('Failed to optimize vector index:', error)
      throw new Error(`Failed to optimize vector index: ${error.message}`)
    }
  })

  ipcMain.handle('search:get-vector-stats', async () => {
    try {
      return db.getVectorIndexStats()
    } catch (error: any) {
      console.error('Failed to get vector index stats:', error)
      throw new Error(`Failed to get vector index stats: ${error.message}`)
    }
  })

  // Multimodal search handlers
  ipcMain.handle('search:multimodal', async (_, searchQuery) => {
    try {
      return await db.multimodalSearch?.(searchQuery) || []
    } catch (error: any) {
      console.error('Failed to perform multimodal search:', error)
      throw new Error(`Failed to perform multimodal search: ${error.message}`)
    }
  })

  ipcMain.handle('search:images', async (_, query, options) => {
    try {
      return await db.searchImages?.(query, options) || []
    } catch (error: any) {
      console.error('Failed to search images:', error)
      throw new Error(`Failed to search images: ${error.message}`)
    }
  })

  ipcMain.handle('search:documents', async (_, query) => {
    try {
      return await db.searchDocuments?.(query) || []
    } catch (error: any) {
      console.error('Failed to search documents:', error)
      throw new Error(`Failed to search documents: ${error.message}`)
    }
  })

  ipcMain.handle('search:audio', async (_, query) => {
    try {
      return await db.searchAudio?.(query) || []
    } catch (error: any) {
      console.error('Failed to search audio:', error)
      throw new Error(`Failed to search audio: ${error.message}`)
    }
  })

  ipcMain.handle('search:get-multimodal-stats', async () => {
    try {
      return db.getMultimodalSearchStats?.() || {}
    } catch (error: any) {
      console.error('Failed to get multimodal search stats:', error)
      throw new Error(`Failed to get multimodal search stats: ${error.message}`)
    }
  })

  // Search performance monitoring handlers
  ipcMain.handle('search:get-performance-analysis', async (_, timeRange = '7d') => {
    try {
      return db.getSearchPerformanceAnalysis?.(timeRange) || {}
    } catch (error: any) {
      console.error('Failed to get performance analysis:', error)
      throw new Error(`Failed to get performance analysis: ${error.message}`)
    }
  })

  ipcMain.handle('search:get-performance-recommendations', async () => {
    try {
      return db.getSearchPerformanceRecommendations?.() || []
    } catch (error: any) {
      console.error('Failed to get performance recommendations:', error)
      throw new Error(`Failed to get performance recommendations: ${error.message}`)
    }
  })

  ipcMain.handle('search:optimize-performance', async () => {
    try {
      return await db.optimizeSearchPerformance?.() || { optimizationsApplied: [], estimatedImprovement: 'No optimizations available' }
    } catch (error: any) {
      console.error('Failed to optimize search performance:', error)
      throw new Error(`Failed to optimize search performance: ${error.message}`)
    }
  })

  // Export handlers
  ipcMain.handle('export:get-chat', async (_, chatId: string) => {
    try {
      return db.getChat(chatId)
    } catch (error: any) {
      console.error(`Failed to get chat ${chatId}:`, error)
      throw new Error(`Failed to load chat: ${error.message}`)
    }
  })

  ipcMain.handle('export:get-chats', async (_, chatIds: string[]) => {
    try {
      const chats: ChatRecord[] = []
      for (const id of chatIds) {
        const chat = db.getChat(id)
        if (chat) {
          chats.push(chat)
        }
      }
      return chats
    } catch (error: any) {
      console.error('Failed to get chats:', error)
      throw new Error(`Failed to load chats: ${error.message}`)
    }
  })

  ipcMain.handle('export:get-messages', async (_, chatId: string) => {
    try {
      return db.getMessages(chatId)
    } catch (error: any) {
      console.error(`Failed to get messages for chat ${chatId}:`, error)
      throw new Error(`Failed to load messages: ${error.message}`)
    }
  })

  ipcMain.handle('export:save-file', async (_, { fileName, content, filters }) => {
    try {
      const result = await dialog.showSaveDialog({
        defaultPath: fileName,
        filters: filters || [
          { name: 'All Files', extensions: ['*'] }
        ]
      })
      
      if (!result.canceled && result.filePath) {
        await writeFile(result.filePath, content, 'utf-8')
        return { success: true, filePath: result.filePath }
      }
      
      return { success: false, canceled: true }
    } catch (error: any) {
      console.error('Failed to save export file:', error)
      throw new Error(`Failed to save file: ${error.message}`)
    }
  })

  ipcMain.handle('export:get-messages-stream', async (event, chatId: string, offset: number = 0, limit: number = 100) => {
    try {
      // This would need to be implemented in the database layer
      // For now, return all messages but could be enhanced for pagination
      const messages = db.getMessages(chatId)
      
      // Simulate streaming by chunking
      const chunk = messages.slice(offset, offset + limit)
      const hasMore = offset + limit < messages.length
      
      return {
        messages: chunk,
        hasMore,
        total: messages.length,
        offset: offset + chunk.length
      }
    } catch (error: any) {
      console.error(`Failed to stream messages for chat ${chatId}:`, error)
      throw new Error(`Failed to stream messages: ${error.message}`)
    }
  })

  ipcMain.handle('export:get-all-chats', async () => {
    try {
      return db.getAllChats()
    } catch (error: any) {
      console.error('Failed to get all chats:', error)
      throw new Error(`Failed to load all chats: ${error.message}`)
    }
  })

  ipcMain.handle('export:get-chats-stream', async (event, chatIds: string[], batchSize: number = 10) => {
    try {
      const batches: ChatRecord[][] = []
      for (let i = 0; i < chatIds.length; i += batchSize) {
        const batch = chatIds.slice(i, i + batchSize)
        const chats: ChatRecord[] = []
        
        for (const id of batch) {
          const chat = db.getChat(id)
          if (chat) chats.push(chat)
        }
        
        batches.push(chats)
        
        // Send progress update
        event.sender.send('export:progress', {
          processed: Math.min(i + batchSize, chatIds.length),
          total: chatIds.length,
          stage: 'loading-chats'
        })
        
        // Small delay to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 10))
      }
      
      return batches.flat()
    } catch (error: any) {
      console.error('Failed to stream chats:', error)
      throw new Error(`Failed to stream chats: ${error.message}`)
    }
  })

  console.log('IPC handlers registered successfully')
}