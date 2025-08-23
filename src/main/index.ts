import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { MCPManager } from './mcp/mcpManager'
import { getAllServers } from './mcp/servers'
import { LocalDatabase } from './db/database'
import { PluginManager } from './plugins/pluginManager'
import { registerShortcuts } from './shortcuts'
import { registerIPCHandlers } from './ipcHandlers'
import { logger } from './utils/Logger'
import { memoryMonitor } from './performance/MemoryMonitor'

let mainWindow: BrowserWindow | null = null
const mcpManager = new MCPManager()
const pluginManager = new PluginManager()
let db: LocalDatabase

// Make mainWindow globally accessible for LLM manager
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

  // Register shortcuts
  registerShortcuts(mainWindow)

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
  logger.logStartup()

  // Initialize database first
  try {
    logger.time('database-init')
    db = new LocalDatabase()
    logger.timeEnd('database-init')
    logger.info('Database initialized successfully', 'Main')
  } catch (error) {
    logger.error('Failed to initialize database', 'Main', error)
    app.quit()
    return
  }

  // Register all IPC handlers after db is initialized
  registerIPCHandlers(db, mcpManager, pluginManager)

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  // Debug: Log when window is created
  logger.info('Window created with preload', 'Main', join(__dirname, '../preload/index.js'))

  // Initialize plugin manager
  pluginManager
    .initialize()
    .catch(error => logger.error('Plugin manager initialization failed', 'Main', error))

  // Connect plugin manager to MCP
  mcpManager.setPluginManager(pluginManager)

  // Initialize MCP after window is created
  initializeMCP().catch(error => logger.error('MCP initialization failed', 'Main', error))

  // Start memory monitoring in production
  if (!is.dev) {
    memoryMonitor.startMonitoring()
    logger.info('Memory monitoring started', 'Main')
  }

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// All IPC handlers have been moved to ipcHandlers.ts and are registered in app.whenReady()

// Initialize MCP servers on app ready
async function initializeMCP() {
  const servers = getAllServers()
  for (const server of servers) {
    try {
      await mcpManager.connectServer(server)
    } catch (error) {
      logger.error(`Failed to connect to ${server.name}`, 'MCP', error)
    }
  }
}
