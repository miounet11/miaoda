import { ipcMain } from 'electron'
import { MCPManager } from '../mcp/mcpManager'
import { getAllServers } from '../mcp/servers'
import { logger } from '../utils/Logger'
import { InputValidator } from '../security/InputValidator'

export function registerMCPHandlers(mcpManager: MCPManager) {
  logger.info('注册MCP IPC处理器', 'MCPHandlers')

  // 获取可用的MCP服务器
  ipcMain.handle('mcp:get-servers', () => {
    return getAllServers()
  })

  ipcMain.handle('mcp:discover-servers', () => {
    return getAllServers() // Return same as get-servers for compatibility
  })

  // 连接MCP服务器
  ipcMain.handle('mcp:connect', async (_, server) => {
    try {
      await mcpManager.connectServer(server)
      logger.info('MCP服务器连接成功', 'MCPHandlers', { server: server.name })
    } catch (error: any) {
      logger.error('MCP服务器连接失败', 'MCPHandlers', {
        server: server.name,
        error: error.message
      })
      throw error
    }
  })

  // 断开MCP服务器连接
  ipcMain.handle('mcp:disconnect', async (_, name) => {
    try {
      const validatedName = InputValidator.validateServerName(name)
      await mcpManager.disconnectServer(validatedName)
      logger.info('MCP服务器断开连接', 'MCPHandlers', { serverName: validatedName })
    } catch (error: any) {
      logger.error('MCP服务器断开连接失败', 'MCPHandlers', {
        serverName: name,
        error: error.message
      })
      throw error
    }
  })

  // 获取可用的MCP工具
  ipcMain.handle('mcp:get-tools', () => {
    try {
      return mcpManager.getAvailableTools()
    } catch (error: any) {
      logger.error('获取MCP工具失败', 'MCPHandlers', error)
      return []
    }
  })

  // 调用MCP工具
  ipcMain.handle('mcp:call-tool', async (_, toolName, args) => {
    try {
      const validatedToolCall = InputValidator.validateMCPToolCall({ toolName, args })
      const result = await mcpManager.callTool(validatedToolCall.toolName, validatedToolCall.args)
      logger.info('MCP工具调用成功', 'MCPHandlers', { toolName: validatedToolCall.toolName })
      return result
    } catch (error: any) {
      logger.error('MCP工具调用失败', 'MCPHandlers', { toolName, error: error.message })
      throw error
    }
  })

  logger.info('MCP IPC处理器注册完成', 'MCPHandlers')
}
