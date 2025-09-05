import { LocalDatabase } from '../db/database'
import { MCPManager } from '../mcp/mcpManager'
import { PluginManager } from '../plugins/pluginManager'
import { registerFileHandlers } from '../fileHandler'
import { registerShortcutHandlers } from '../shortcuts'
import { logger } from '../utils/Logger'

// 导入各个专门的处理器模块
import { registerDatabaseHandlers } from './databaseHandlers'
import { registerSearchHandlers } from './searchHandlers'
import { registerExportHandlers } from './exportHandlers'
import { registerLLMHandlers } from './llmHandlers'
import { registerMCPHandlers } from './mcpHandlers'
import { registerPluginHandlers } from './pluginHandlers'
import { registerWindowHandlers } from './windowHandlers'
import { registerSettingsHandlers } from './settingsHandlers'

export function registerIPCHandlers(
  db: LocalDatabase,
  mcpManager: MCPManager,
  pluginManager: PluginManager
) {
  logger.info('开始注册所有IPC处理器', 'IPCManager', { dbInitialized: !!db })

  try {
    // 注册各个功能模块的处理器
    registerDatabaseHandlers(db)
    registerSearchHandlers(db)
    registerExportHandlers(db)
    registerLLMHandlers(mcpManager)
    registerMCPHandlers(mcpManager)
    registerPluginHandlers(pluginManager)
    registerWindowHandlers()
    registerSettingsHandlers()

    // 注册文件处理器（来自现有模块）
    registerFileHandlers()

    // 注册快捷键处理器（来自现有模块）
    registerShortcutHandlers()

    // TODO: Re-enable authentication system after fixing initialization order
    // Initialize authentication system
    // const userService = new UserService((db as any).db) // Access the underlying SQLite database
    // registerAuthHandlers(userService)

    logger.info('所有IPC处理器注册成功', 'IPCManager')
  } catch (error: any) {
    logger.error('IPC处理器注册失败', 'IPCManager', error)
    throw error
  }
}
