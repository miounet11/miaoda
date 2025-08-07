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