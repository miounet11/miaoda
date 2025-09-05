import { ipcMain, dialog } from 'electron'
import { writeFile } from 'fs/promises'
import { LocalDatabase, ChatRecord } from '../db/database'
import { logger } from '../utils/Logger'

export function registerExportHandlers(db: LocalDatabase) {
  logger.info('注册导出IPC处理器', 'ExportHandlers')

  // 导出单个聊天
  ipcMain.handle('export:get-chat', async (_, chatId: string) => {
    try {
      return db.getChat(chatId)
    } catch (error: any) {
      logger.error('Failed to get chat', 'ExportHandlers', error)
      throw new Error(`Failed to load chat: ${error.message}`)
    }
  })

  // 批量导出聊天
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
      logger.error('Failed to get chats', 'ExportHandlers', error)
      throw new Error(`Failed to load chats: ${error.message}`)
    }
  })

  // 获取聊天消息
  ipcMain.handle('export:get-messages', async (_, chatId: string) => {
    try {
      return db.getMessages(chatId)
    } catch (error: any) {
      logger.error('Failed to get messages for chat', 'ExportHandlers', error)
      throw new Error(`Failed to load messages: ${error.message}`)
    }
  })

  // 保存文件到磁盘
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
      logger.error('Failed to save export file', 'ExportHandlers', error)
      throw new Error(`Failed to save file: ${error.message}`)
    }
  })

  // 流式获取消息（分页）
  ipcMain.handle(
    'export:get-messages-stream',
    async (_event, chatId: string, offset: number = 0, limit: number = 100) => {
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
        logger.error('Failed to stream messages for chat', 'ExportHandlers', error)
        throw new Error(`Failed to stream messages: ${error.message}`)
      }
    }
  )

  // 获取所有聊天
  ipcMain.handle('export:get-all-chats', async () => {
    try {
      return db.getAllChats()
    } catch (error: any) {
      logger.error('Failed to get all chats', 'ExportHandlers', error)
      throw new Error(`Failed to load all chats: ${error.message}`)
    }
  })

  // 流式获取聊天（批处理）
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
        logger.error('Failed to stream chats', 'ExportHandlers', error)
        throw new Error(`Failed to stream chats: ${error.message}`)
      }
    }
  )

  logger.info('导出IPC处理器注册完成', 'ExportHandlers')
}
