import { ipcMain } from 'electron'
import { PluginManager } from '../plugins/pluginManager'
import { logger } from '../utils/Logger'
import { InputValidator } from '../security/InputValidator'

export function registerPluginHandlers(pluginManager: PluginManager) {
  logger.info('注册插件IPC处理器', 'PluginHandlers')

  // 获取所有插件
  ipcMain.handle('plugins:get-all', () => {
    try {
      return pluginManager.getPlugins().map(p => ({
        id: p.manifest.id,
        name: p.manifest.name,
        version: p.manifest.version,
        description: p.manifest.description,
        author: p.manifest.author,
        capabilities: p.manifest.capabilities,
        enabled: p.enabled
      }))
    } catch (error: any) {
      logger.error('获取插件列表失败', 'PluginHandlers', error)
      return []
    }
  })

  // 启用插件
  ipcMain.handle('plugins:enable', async (_, pluginId: string) => {
    try {
      const validatedPluginId = InputValidator.validatePluginId(pluginId)
      await pluginManager.activatePlugin(validatedPluginId)
      logger.info('插件启用成功', 'PluginHandlers', { pluginId: validatedPluginId })
    } catch (error: any) {
      logger.error('插件启用失败', 'PluginHandlers', { pluginId, error: error.message })
      throw error
    }
  })

  // 禁用插件
  ipcMain.handle('plugins:disable', async (_, pluginId: string) => {
    try {
      const validatedPluginId = InputValidator.validatePluginId(pluginId)
      await pluginManager.deactivatePlugin(validatedPluginId)
      logger.info('插件禁用成功', 'PluginHandlers', { pluginId: validatedPluginId })
    } catch (error: any) {
      logger.error('插件禁用失败', 'PluginHandlers', { pluginId, error: error.message })
      throw error
    }
  })

  logger.info('插件IPC处理器注册完成', 'PluginHandlers')
}
