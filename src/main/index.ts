import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { MCPManager } from './mcp/mcpManager'
import { getAllServers } from './mcp/servers'
import { LocalDatabase } from './db/database'
import { createLLMManager } from './llm/llmManager'
import { PluginManager } from './plugins/pluginManager'
import './fileHandler' // Import for file handling
import { registerShortcuts } from './shortcuts'

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
  })

  // Make mainWindow globally accessible
  global.mainWindow = mainWindow
  
  // Register shortcuts
  registerShortcuts(mainWindow)

  mainWindow.webContents.setWindowOpenHandler((details) => {
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

  // Initialize database
  db = new LocalDatabase()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()
  
  // Initialize plugin manager
  pluginManager.initialize().catch(console.error)
  
  // Connect plugin manager to MCP
  mcpManager.setPluginManager(pluginManager)
  
  // Initialize MCP and LLM after window is created
  initializeMCP().catch(console.error)
  
  // Create LLM manager with MCP integration
  createLLMManager(mcpManager)

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC handlers
ipcMain.handle('get-app-version', () => app.getVersion())

// MCP handlers
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

ipcMain.handle('db:get-messages', async (_, chatId) => {
  return db.getMessages(chatId)
})

ipcMain.handle('db:search-chats', async (_, query) => {
  return db.searchChats(query)
})

// Initialize MCP servers on app ready
async function initializeMCP() {
  const servers = getAllServers()
  for (const server of servers) {
    try {
      await mcpManager.connectServer(server)
    } catch (error) {
      console.error(`Failed to connect to ${server.name}:`, error)
    }
  }
}