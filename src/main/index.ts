import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerIPCHandlers } from './ipcHandlers'
import { logger } from './utils/Logger'
import { LocalDatabase } from './db/database'
import { MCPManager } from './mcp/mcpManager'
import { PluginManager } from './plugins/pluginManager'

let mainWindow: BrowserWindow | null = null

// Make mainWindow globally accessible
declare global {
  var mainWindow: BrowserWindow | null
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()

    // Open DevTools in development mode
    if (is.dev) {
      mainWindow?.webContents.openDevTools()
    }
  })

  // Make mainWindow globally accessible
  global.mainWindow = mainWindow

  // No shortcuts needed for simplified version

  mainWindow.webContents.setWindowOpenHandler(details => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.miaoda.chat')

  // Log application startup
  logger.info('MiaoDa Chat v1.0 启动中...', 'Main')

  // Initialize dependencies
  const db = new LocalDatabase()
  const mcpManager = new MCPManager()
  const pluginManager = new PluginManager()

  // Register IPC handlers
  registerIPCHandlers(db, mcpManager, pluginManager)

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  logger.info('MiaoDa Chat 启动成功', 'Main')
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
