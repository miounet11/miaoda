import { ipcMain, dialog, app, BrowserWindow } from 'electron'
import { writeFile } from 'fs/promises'
import { LocalDatabase, ChatRecord } from './db/database'
import { MCPManager } from './mcp/mcpManager'
import { PluginManager } from './plugins/pluginManager'
import { getAllServers } from './mcp/servers'
import { createLLMManager, registerLLMHandlers } from './llm/llmManager'
import { registerFileHandlers } from './fileHandler'
import { registerShortcutHandlers } from './shortcuts'
import { logger } from './utils/Logger'
import { InputValidator, auditLog as _auditLog } from './security/InputValidator'
import { UserService as _UserService } from './db/UserService'
import { registerAuthHandlers as _registerAuthHandlers } from './security/authHandlers'

// Simple window manager for multi-window support
class WindowManager {
  private windows = new Map<string, BrowserWindow>()

  createWindow(options: any = {}): { id: string; [key: string]: any } {
    const windowId = `window-${Date.now()}`

    const window = new BrowserWindow({
      width: options.width || 1200,
      height: options.height || 800,
      title: options.title || 'MiaoDa Chat',
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    })

    this.windows.set(windowId, window)

    // Clean up when window is closed
    window.on('closed', () => {
      this.windows.delete(windowId)
    })

    return { id: windowId, ...options }
  }

  closeWindow(windowId: string): boolean {
    const window = this.windows.get(windowId)
    if (window) {
      window.close()
      this.windows.delete(windowId)
      return true
    }
    return false
  }

  focusWindow(windowId: string): boolean {
    const window = this.windows.get(windowId)
    if (window) {
      window.focus()
      return true
    }
    return false
  }

  minimizeWindow(windowId: string): boolean {
    const window = this.windows.get(windowId)
    if (window) {
      window.minimize()
      return true
    }
    return false
  }

  maximizeWindow(windowId: string): boolean {
    const window = this.windows.get(windowId)
    if (window) {
      if (window.isMaximized()) {
        window.unmaximize()
      } else {
        window.maximize()
      }
      return true
    }
    return false
  }

  restoreWindow(windowId: string): boolean {
    const window = this.windows.get(windowId)
    if (window) {
      window.restore()
      return true
    }
    return false
  }

  getWindowState(windowId: string): any {
    const window = this.windows.get(windowId)
    if (window) {
      return {
        id: windowId,
        title: window.getTitle(),
        isMaximized: window.isMaximized(),
        isMinimized: window.isMinimized(),
        isVisible: window.isVisible(),
        bounds: window.getBounds()
      }
    }
    return null
  }

  getAllWindows(): any[] {
    return Array.from(this.windows.entries()).map(([id, window]) => ({
      id,
      title: window.getTitle(),
      isMaximized: window.isMaximized(),
      isMinimized: window.isMinimized(),
      isVisible: window.isVisible()
    }))
  }
}

const windowManager = new WindowManager()

export function registerIPCHandlers(
  db: LocalDatabase,
  mcpManager: MCPManager,
  pluginManager: PluginManager
) {
  logger.info('Registering IPC handlers', 'IPC', { dbInitialized: !!db })

  // TODO: Re-enable authentication system after fixing initialization order
  // Initialize authentication system
  // const userService = new UserService((db as any).db) // Access the underlying SQLite database
  // registerAuthHandlers(userService)

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
      // Validate and sanitize input
      const validatedPrompt = InputValidator.validateLLMPrompt(prompt)

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
        validatedPrompt,
        tempChatId,
        '', // Empty provider ID instead of undefined
        chunk => {
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

  ipcMain.handle('mcp:discover-servers', () => {
    return getAllServers() // Return same as get-servers for compatibility
  })

  ipcMain.handle('mcp:connect', async (_, server) => {
    await mcpManager.connectServer(server)
  })

  ipcMain.handle('mcp:disconnect', async (_, name) => {
    const validatedName = InputValidator.validateServerName(name)
    await mcpManager.disconnectServer(validatedName)
  })

  ipcMain.handle('mcp:get-tools', () => {
    return mcpManager.getAvailableTools()
  })

  ipcMain.handle('mcp:call-tool', async (_, toolName, args) => {
    const validatedToolCall = InputValidator.validateMCPToolCall({ toolName, args })
    return mcpManager.callTool(validatedToolCall.toolName, validatedToolCall.args)
  })

  // Window management handlers
  ipcMain.handle('window:create', async (_, options) => {
    try {
      return windowManager.createWindow(options)
    } catch (error: any) {
      logger.error('Failed to create window', 'WindowManager', error)
      throw new Error(`Failed to create window: ${error.message}`)
    }
  })

  ipcMain.handle('window:close', async (_, windowId) => {
    try {
      return windowManager.closeWindow(windowId)
    } catch (error: any) {
      logger.error('Failed to close window', 'WindowManager', error)
      return false
    }
  })

  ipcMain.handle('window:focus', async (_, windowId) => {
    try {
      return windowManager.focusWindow(windowId)
    } catch (error: any) {
      logger.error('Failed to focus window', 'WindowManager', error)
      return false
    }
  })

  ipcMain.handle('window:minimize', async (_, windowId) => {
    try {
      return windowManager.minimizeWindow(windowId)
    } catch (error: any) {
      logger.error('Failed to minimize window', 'WindowManager', error)
      return false
    }
  })

  ipcMain.handle('window:maximize', async (_, windowId) => {
    try {
      return windowManager.maximizeWindow(windowId)
    } catch (error: any) {
      logger.error('Failed to maximize window', 'WindowManager', error)
      return false
    }
  })

  ipcMain.handle('window:restore', async (_, windowId) => {
    try {
      return windowManager.restoreWindow(windowId)
    } catch (error: any) {
      logger.error('Failed to restore window', 'WindowManager', error)
      return false
    }
  })

  ipcMain.handle('window:get-state', async (_, windowId) => {
    try {
      const state = windowManager.getWindowState(windowId)
      return (
        state || {
          id: windowId,
          title: 'MiaoDa Chat',
          isMaximized: false,
          error: 'Window not found'
        }
      )
    } catch (error: any) {
      logger.error('Failed to get window state', 'WindowManager', error)
      return { id: windowId, title: 'MiaoDa Chat', isMaximized: false, error: error.message }
    }
  })

  ipcMain.handle('window:get-all', async () => {
    try {
      return windowManager.getAllWindows()
    } catch (error: any) {
      logger.error('Failed to get all windows', 'WindowManager', error)
      return []
    }
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
    const validatedPluginId = InputValidator.validatePluginId(pluginId)
    await pluginManager.activatePlugin(validatedPluginId)
  })

  ipcMain.handle('plugins:disable', async (_, pluginId: string) => {
    const validatedPluginId = InputValidator.validatePluginId(pluginId)
    await pluginManager.deactivatePlugin(validatedPluginId)
  })

  // Database handlers with input validation
  ipcMain.handle('db:create-chat', async (_, chat) => {
    const validatedChat = InputValidator.validateChatInput(chat)
    // Convert timestamp to string for database
    const chatRecord = {
      ...validatedChat,
      created_at: validatedChat.created_at.toString(),
      updated_at: validatedChat.updated_at.toString()
    }
    db.createChat(chatRecord)
  })

  ipcMain.handle('db:update-chat', async (_, id, title, updated_at) => {
    const validatedUpdate = InputValidator.validateChatInput({
      id,
      title,
      updated_at,
      created_at: Date.now()
    })
    db.updateChat(
      validatedUpdate.id,
      validatedUpdate.title,
      updated_at?.toString() || new Date().toISOString()
    )
  })

  ipcMain.handle('db:delete-chat', async (_, id) => {
    const validatedId = InputValidator.validatePluginId(id) // Reuse SafeID validation
    db.deleteChat(validatedId)
  })

  ipcMain.handle('db:get-chat', async (_, id) => {
    const validatedId = InputValidator.validatePluginId(id)
    return db.getChat(validatedId)
  })

  ipcMain.handle('db:get-all-chats', async () => {
    return db.getAllChats()
  })

  ipcMain.handle('db:create-message', async (_, message) => {
    const validatedMessage = InputValidator.validateMessageInput(message)
    // Convert timestamp to string for database and serialize attachments
    const messageRecord = {
      ...validatedMessage,
      created_at: validatedMessage.created_at?.toString() || new Date().toISOString(),
      attachments: validatedMessage.attachments
        ? JSON.stringify(validatedMessage.attachments)
        : undefined
    }
    db.createMessage(messageRecord)
  })

  ipcMain.handle('db:update-message', async (_, messageId, content) => {
    const validatedUpdate = InputValidator.validateMessageInput({
      id: messageId,
      chat_id: 'temp-chat-id',
      role: 'user',
      content,
      created_at: Date.now()
    })
    db.updateMessage(validatedUpdate.id, validatedUpdate.content)
  })

  ipcMain.handle('db:get-messages', async (_, chatId) => {
    const validatedChatId = InputValidator.validatePluginId(chatId)
    return db.getMessages(validatedChatId)
  })

  ipcMain.handle('db:search-chats', async (_, query) => {
    const validatedQuery = InputValidator.validateSearchInput({ query })
    return db.searchChats(validatedQuery.query)
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
      logger.error('Search failed', 'IPCHandlers', error)
      throw new Error(`Search failed: ${error.message}`)
    }
  })

  ipcMain.handle('search:get-stats', async () => {
    try {
      return db.getSearchStats()
    } catch (error: any) {
      logger.error('Failed to get search stats', 'IPCHandlers', error)
      throw new Error(`Failed to get search stats: ${error.message}`)
    }
  })

  // Search index management handlers
  ipcMain.handle('search:rebuild-index', async () => {
    try {
      db.rebuildSearchIndex()
      return { success: true }
    } catch (error: any) {
      logger.error('Failed to rebuild search index', 'IPCHandlers', error)
      throw new Error(`Failed to rebuild search index: ${error.message}`)
    }
  })

  ipcMain.handle('search:optimize-index', async () => {
    try {
      // @ts-ignore - Method may not exist on all database implementations
      db.optimizeSearchIndex?.()
      return { success: true }
    } catch (error: any) {
      logger.error('Failed to optimize search index', 'IPCHandlers', error)
      throw new Error(`Failed to optimize search index: ${error.message}`)
    }
  })

  ipcMain.handle('search:get-index-status', async () => {
    try {
      // @ts-ignore - Method may not exist on all database implementations
      return db.getSearchIndexStatus?.() || db.getSearchStats?.()
    } catch (error: any) {
      logger.error('Failed to get search index status', 'IPCHandlers', error)
      throw new Error(`Failed to get search index status: ${error.message}`)
    }
  })

  // Semantic search handlers
  ipcMain.handle('search:build-semantic-index', async () => {
    try {
      // @ts-ignore - Method may not exist on all database implementations
      return (await db.buildSemanticIndex?.()) || { success: false, message: 'Not implemented' }
    } catch (error: any) {
      logger.error('Failed to build semantic index', 'IPCHandlers', error)
      throw new Error(`Failed to build semantic index: ${error.message}`)
    }
  })

  ipcMain.handle('search:semantic', async (_, searchQuery) => {
    try {
      // @ts-ignore - Method may not exist on all database implementations
      return (await db.semanticSearch?.(searchQuery)) || []
    } catch (error: any) {
      logger.error('Failed to perform semantic search', 'IPCHandlers', error)
      throw new Error(`Failed to perform semantic search: ${error.message}`)
    }
  })

  ipcMain.handle('search:hybrid', async (_, searchQuery) => {
    try {
      // @ts-ignore - Method may not exist on all database implementations
      return (await db.hybridSearch?.(searchQuery)) || []
    } catch (error: any) {
      logger.error('Failed to perform hybrid search', 'IPCHandlers', error)
      throw new Error(`Failed to perform hybrid search: ${error.message}`)
    }
  })

  ipcMain.handle('search:find-similar', async (_, messageId, limit = 5) => {
    try {
      // @ts-ignore - Method may not exist on all database implementations
      return (await db.findSimilarMessages?.(messageId, limit)) || []
    } catch (error: any) {
      logger.error('Failed to find similar messages', 'IPCHandlers', error)
      throw new Error(`Failed to find similar messages: ${error.message}`)
    }
  })

  ipcMain.handle('search:get-semantic-stats', async () => {
    try {
      // @ts-ignore - Method may not exist on all database implementations
      return db.getSemanticSearchStats?.() || {}
    } catch (error: any) {
      logger.error('Failed to get semantic search stats', 'IPCHandlers', error)
      throw new Error(`Failed to get semantic search stats: ${error.message}`)
    }
  })

  // Vector database handlers
  ipcMain.handle('search:build-vector-index', async () => {
    try {
      // @ts-ignore - Method may not exist on all database implementations
      return (await db.buildVectorIndex?.()) || { success: false, message: 'Not implemented' }
    } catch (error: any) {
      logger.error('Failed to build vector index', 'IPCHandlers', error)
      throw new Error(`Failed to build vector index: ${error.message}`)
    }
  })

  ipcMain.handle('search:optimize-vector-index', async () => {
    try {
      // @ts-ignore - Method may not exist on all database implementations
      return (await db.optimizeVectorIndex?.()) || { success: false, message: 'Not implemented' }
    } catch (error: any) {
      logger.error('Failed to optimize vector index', 'IPCHandlers', error)
      throw new Error(`Failed to optimize vector index: ${error.message}`)
    }
  })

  ipcMain.handle('search:get-vector-stats', async () => {
    try {
      // @ts-ignore - Method may not exist on all database implementations
      return db.getVectorIndexStats?.() || {}
    } catch (error: any) {
      logger.error('Failed to get vector index stats', 'IPCHandlers', error)
      throw new Error(`Failed to get vector index stats: ${error.message}`)
    }
  })

  // Multimodal search handlers
  ipcMain.handle('search:multimodal', async (_, searchQuery) => {
    try {
      // @ts-ignore - Method may not exist on all database implementations
      return (await db.multimodalSearch?.(searchQuery)) || []
    } catch (error: any) {
      logger.error('Failed to perform multimodal search', 'IPCHandlers', error)
      throw new Error(`Failed to perform multimodal search: ${error.message}`)
    }
  })

  ipcMain.handle('search:images', async (_, query, options) => {
    try {
      // @ts-ignore - Method may not exist on all database implementations
      return (await db.searchImages?.(query, options)) || []
    } catch (error: any) {
      logger.error('Failed to search images', 'IPCHandlers', error)
      throw new Error(`Failed to search images: ${error.message}`)
    }
  })

  ipcMain.handle('search:documents', async (_, query) => {
    try {
      // @ts-ignore - Method may not exist on all database implementations
      return (await db.searchDocuments?.(query)) || []
    } catch (error: any) {
      logger.error('Failed to search documents', 'IPCHandlers', error)
      throw new Error(`Failed to search documents: ${error.message}`)
    }
  })

  ipcMain.handle('search:audio', async (_, query) => {
    try {
      // @ts-ignore - Method may not exist on all database implementations
      return (await db.searchAudio?.(query)) || []
    } catch (error: any) {
      logger.error('Failed to search audio', 'IPCHandlers', error)
      throw new Error(`Failed to search audio: ${error.message}`)
    }
  })

  ipcMain.handle('search:get-multimodal-stats', async () => {
    try {
      // @ts-ignore - Method may not exist on all database implementations
      return db.getMultimodalSearchStats?.() || {}
    } catch (error: any) {
      logger.error('Failed to get multimodal search stats', 'IPCHandlers', error)
      throw new Error(`Failed to get multimodal search stats: ${error.message}`)
    }
  })

  // Search performance monitoring handlers
  ipcMain.handle('search:get-performance-analysis', async (_, timeRange = '7d') => {
    try {
      // @ts-ignore - Method may not exist on all database implementations
      return db.getSearchPerformanceAnalysis?.(timeRange) || {}
    } catch (error: any) {
      logger.error('Failed to get performance analysis', 'IPCHandlers', error)
      throw new Error(`Failed to get performance analysis: ${error.message}`)
    }
  })

  ipcMain.handle('search:get-performance-recommendations', async () => {
    try {
      // @ts-ignore - Method may not exist on all database implementations
      return db.getSearchPerformanceRecommendations?.() || []
    } catch (error: any) {
      logger.error('Failed to get performance recommendations', 'IPCHandlers', error)
      throw new Error(`Failed to get performance recommendations: ${error.message}`)
    }
  })

  ipcMain.handle('search:optimize', async (_event, payload) => {
    try {
      const result = (db as any).optimizeSearchPerformance
        ? await (db as any).optimizeSearchPerformance(payload)
        : { success: false, error: 'optimizeSearchPerformance not implemented' }
      _event.sender.send('search:optimize:result', result)
    } catch (error) {
      _event.sender.send('search:optimize:result', { success: false, error: String(error) })
    }
  })

  // Export handlers
  ipcMain.handle('export:get-chat', async (_, chatId: string) => {
    try {
      return db.getChat(chatId)
    } catch (error: any) {
      logger.error('Failed to get chat', 'IPCHandlers', error)
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
      logger.error('Failed to get chats', 'IPCHandlers', error)
      throw new Error(`Failed to load chats: ${error.message}`)
    }
  })

  ipcMain.handle('export:get-messages', async (_, chatId: string) => {
    try {
      return db.getMessages(chatId)
    } catch (error: any) {
      logger.error('Failed to get messages for chat', 'IPCHandlers', error)
      throw new Error(`Failed to load messages: ${error.message}`)
    }
  })

  ipcMain.handle('export:save-file', async (_, { fileName, content, filters }) => {
    try {
      const result = await dialog.showSaveDialog({
        defaultPath: fileName,
        filters: filters || [{ name: 'All Files', extensions: ['*'] }]
      })

      if (!result.canceled && result.filePath) {
        await writeFile(result.filePath, content, 'utf-8')
        return { success: true, filePath: result.filePath }
      }

      return { success: false, canceled: true }
    } catch (error: any) {
      logger.error('Failed to save export file', 'IPCHandlers', error)
      throw new Error(`Failed to save file: ${error.message}`)
    }
  })

  ipcMain.handle(
    'export:get-messages-stream',
    async (event, chatId: string, offset: number = 0, limit: number = 100) => {
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
        logger.error('Failed to stream messages for chat', 'IPCHandlers', error)
        throw new Error(`Failed to stream messages: ${error.message}`)
      }
    }
  )

  ipcMain.handle('export:get-all-chats', async () => {
    try {
      return db.getAllChats()
    } catch (error: any) {
      logger.error('Failed to get all chats', 'IPCHandlers', error)
      throw new Error(`Failed to load all chats: ${error.message}`)
    }
  })

  ipcMain.handle(
    'export:get-chats-stream',
    async (event, chatIds: string[], batchSize: number = 10) => {
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
        logger.error('Failed to stream chats', 'IPCHandlers', error)
        throw new Error(`Failed to stream chats: ${error.message}`)
      }
    }
  )

  logger.info('IPC handlers registered successfully', 'IPCHandlers')
}
