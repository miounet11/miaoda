import { ipcMain, app } from 'electron'
import { logger } from '../utils/Logger'

export function registerSettingsHandlers() {
  logger.info('注册设置IPC处理器', 'SettingsHandlers')

  // 获取应用版本
  ipcMain.handle('get-app-version', () => {
    try {
      return app.getVersion()
    } catch (error: any) {
      logger.error('获取应用版本失败', 'SettingsHandlers', error)
      return '0.0.0'
    }
  })

  logger.info('设置IPC处理器注册完成', 'SettingsHandlers')
}
