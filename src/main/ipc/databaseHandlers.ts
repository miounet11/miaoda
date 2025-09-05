import { ipcMain } from 'electron'
import { LocalDatabase } from '../db/database'
import { logger } from '../utils/Logger'
import { InputValidator } from '../security/InputValidator'

export function registerDatabaseHandlers(db: LocalDatabase) {
  logger.info('注册数据库IPC处理器', 'DatabaseHandlers')

  // 聊天相关处理器
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

  // 消息相关处理器
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

  // 摘要相关处理器
  ipcMain.handle('db:update-chat-summary', async (_, chatId, summary, tags, keyPoints, tokens) => {
    try {
      db.updateChatSummary(chatId, summary, tags, keyPoints, tokens)
      return { success: true }
    } catch (error: any) {
      logger.error('Failed to update chat summary', 'DatabaseHandlers', error)
      throw new Error(`Failed to update chat summary: ${error.message}`)
    }
  })

  ipcMain.handle('db:get-chat-summary', async (_, chatId) => {
    try {
      return db.getChatSummary(chatId)
    } catch (error: any) {
      logger.error('Failed to get chat summary', 'DatabaseHandlers', error)
      throw new Error(`Failed to get chat summary: ${error.message}`)
    }
  })

  ipcMain.handle('db:get-all-chats-with-summaries', async () => {
    try {
      return db.getAllChatsWithSummaries()
    } catch (error: any) {
      logger.error('Failed to get chats with summaries', 'DatabaseHandlers', error)
      throw new Error(`Failed to get chats with summaries: ${error.message}`)
    }
  })

  ipcMain.handle('db:search-chats-by-tags', async (_, tags) => {
    try {
      return db.searchChatsByTags(tags)
    } catch (error: any) {
      logger.error('Failed to search chats by tags', 'DatabaseHandlers', error)
      throw new Error(`Failed to search chats by tags: ${error.message}`)
    }
  })

  ipcMain.handle('db:get-all-summary-tags', async () => {
    try {
      return db.getAllSummaryTags()
    } catch (error: any) {
      logger.error('Failed to get summary tags', 'DatabaseHandlers', error)
      throw new Error(`Failed to get summary tags: ${error.message}`)
    }
  })

  ipcMain.handle('db:clear-chat-summary', async (_, chatId) => {
    try {
      db.clearChatSummary(chatId)
      return { success: true }
    } catch (error: any) {
      logger.error('Failed to clear chat summary', 'DatabaseHandlers', error)
      throw new Error(`Failed to clear chat summary: ${error.message}`)
    }
  })

  ipcMain.handle('db:needs-summary-update', async (_, chatId, minMessages, maxAgeHours) => {
    try {
      return db.needsSummaryUpdate(chatId, minMessages, maxAgeHours)
    } catch (error: any) {
      logger.error('Failed to check summary update need', 'DatabaseHandlers', error)
      return false
    }
  })

  // 分析相关处理器
  ipcMain.handle('db:generate-analytics', async (_, filter) => {
    try {
      logger.debug('Generating analytics', 'DatabaseHandlers', { filter })
      const result = db.generateAnalytics(filter)
      logger.debug('Analytics generated successfully', 'DatabaseHandlers', {
        timeRange: result.timeRange,
        totalChats: result.chat.totalChats,
        totalMessages: result.chat.totalMessages
      })
      return result
    } catch (error: any) {
      logger.error('Failed to generate analytics', 'DatabaseHandlers', error)
      throw error
    }
  })

  ipcMain.handle('db:get-analytics-summary', async (_, timeRange) => {
    try {
      logger.debug('Getting analytics summary', 'DatabaseHandlers', { timeRange })
      const result = db.getAnalyticsSummary(timeRange)
      logger.debug('Analytics summary retrieved', 'DatabaseHandlers', result)
      return result
    } catch (error: any) {
      logger.error('Failed to get analytics summary', 'DatabaseHandlers', error)
      throw error
    }
  })

  logger.info('数据库IPC处理器注册完成', 'DatabaseHandlers')
}
