import { ipcMain, BrowserWindow } from 'electron'
import { logger } from '../utils/Logger'

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

export function registerWindowHandlers() {
  logger.info('注册窗口管理IPC处理器', 'WindowHandlers')

  // 创建窗口
  ipcMain.handle('window:create', async (_, options) => {
    try {
      const result = windowManager.createWindow(options)
      logger.info('窗口创建成功', 'WindowHandlers', { windowId: result.id })
      return result
    } catch (error: any) {
      logger.error('Failed to create window', 'WindowHandlers', error)
      throw new Error(`Failed to create window: ${error.message}`)
    }
  })

  // 关闭窗口
  ipcMain.handle('window:close', async (_, windowId) => {
    try {
      const result = windowManager.closeWindow(windowId)
      if (result) {
        logger.info('窗口关闭成功', 'WindowHandlers', { windowId })
      }
      return result
    } catch (error: any) {
      logger.error('Failed to close window', 'WindowHandlers', error)
      return false
    }
  })

  // 聚焦窗口
  ipcMain.handle('window:focus', async (_, windowId) => {
    try {
      const result = windowManager.focusWindow(windowId)
      if (result) {
        logger.info('窗口聚焦成功', 'WindowHandlers', { windowId })
      }
      return result
    } catch (error: any) {
      logger.error('Failed to focus window', 'WindowHandlers', error)
      return false
    }
  })

  // 最小化窗口
  ipcMain.handle('window:minimize', async (_, windowId) => {
    try {
      const result = windowManager.minimizeWindow(windowId)
      if (result) {
        logger.info('窗口最小化成功', 'WindowHandlers', { windowId })
      }
      return result
    } catch (error: any) {
      logger.error('Failed to minimize window', 'WindowHandlers', error)
      return false
    }
  })

  // 最大化/取消最大化窗口
  ipcMain.handle('window:maximize', async (_, windowId) => {
    try {
      const result = windowManager.maximizeWindow(windowId)
      if (result) {
        logger.info('窗口最大化切换成功', 'WindowHandlers', { windowId })
      }
      return result
    } catch (error: any) {
      logger.error('Failed to maximize window', 'WindowHandlers', error)
      return false
    }
  })

  // 恢复窗口
  ipcMain.handle('window:restore', async (_, windowId) => {
    try {
      const result = windowManager.restoreWindow(windowId)
      if (result) {
        logger.info('窗口恢复成功', 'WindowHandlers', { windowId })
      }
      return result
    } catch (error: any) {
      logger.error('Failed to restore window', 'WindowHandlers', error)
      return false
    }
  })

  // 获取窗口状态
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
      logger.error('Failed to get window state', 'WindowHandlers', error)
      return { id: windowId, title: 'MiaoDa Chat', isMaximized: false, error: error.message }
    }
  })

  // 获取所有窗口
  ipcMain.handle('window:get-all', async () => {
    try {
      return windowManager.getAllWindows()
    } catch (error: any) {
      logger.error('Failed to get all windows', 'WindowHandlers', error)
      return []
    }
  })

  logger.info('窗口管理IPC处理器注册完成', 'WindowHandlers')
}
