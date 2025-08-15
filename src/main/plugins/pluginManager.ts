import { Plugin, PluginManifest, PluginInstance, PluginAPI } from './types'
import { Tool } from '@modelcontextprotocol/sdk/types.js'
import { readdir, readFile, stat } from 'fs/promises'
import { join } from 'path'
import { app, ipcMain } from 'electron'
import Store from 'electron-store'
import { EventEmitter } from 'events'

export class PluginManager extends EventEmitter {
  private plugins: Map<string, Plugin> = new Map()
  private store: Store
  private pluginApi: PluginAPI
  private pluginsPath: string
  
  constructor() {
    super()
    this.store = new Store()
    this.pluginsPath = join(app.getPath('userData'), 'plugins')
    this.pluginApi = this.createPluginAPI()
  }
  
  private createPluginAPI(): PluginAPI {
    // const disposables = new WeakMap<object, () => void>()
    
    return {
      workspace: {
        onDidOpenChat: (listener) => {
          const handler = (_: any, chatId: string) => listener(chatId)
          ipcMain.on('chat:opened', handler)
          const disposable = { dispose: () => ipcMain.removeListener('chat:opened', handler) }
          return disposable
        },
        onDidCloseChat: (listener) => {
          const handler = (_: any, chatId: string) => listener(chatId)
          ipcMain.on('chat:closed', handler)
          const disposable = { dispose: () => ipcMain.removeListener('chat:closed', handler) }
          return disposable
        },
        getActiveChat: () => {
          // Get active chat from renderer
          if (global.mainWindow) {
            const result = global.mainWindow.webContents.executeJavaScript('window.__activeChat')
            return result || null
          }
          return null
        }
      },
      
      messages: {
        onDidReceiveMessage: (listener) => {
          const handler = (_: any, message: any) => listener(message)
          ipcMain.on('message:received', handler)
          const disposable = { dispose: () => ipcMain.removeListener('message:received', handler) }
          return disposable
        },
        sendMessage: async (chatId, content) => {
          // Send message through IPC to renderer
          if (global.mainWindow) {
            global.mainWindow.webContents.send('plugin:send-message', { chatId, content })
          }
        }
      },
      
      storage: {
        get: (key) => this.store.get(`plugins.${key}`),
        set: (key, value) => this.store.set(`plugins.${key}`, value),
        delete: (key) => this.store.delete(`plugins.${key}`)
      },
      
      ui: {
        showMessage: (message, type = 'info') => {
          if (global.mainWindow) {
            global.mainWindow.webContents.send('ui:showMessage', { message, type })
          }
        },
        showInputBox: async (options) => {
          // Show input box through IPC
          if (global.mainWindow) {
            return await ipcMain.invoke('dialog:show-input-box', options)
          }
          return null
        }
      }
    }
  }
  
  async initialize() {
    // Ensure plugins directory exists
    try {
      await stat(this.pluginsPath)
    } catch {
      await require('fs/promises').mkdir(this.pluginsPath, { recursive: true })
    }
    
    // Load all plugins
    await this.loadPlugins()
  }
  
  async loadPlugins() {
    try {
      const entries = await readdir(this.pluginsPath, { withFileTypes: true })
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          await this.loadPlugin(join(this.pluginsPath, entry.name))
        }
      }
    } catch (error) {
      console.error('Failed to load plugins:', error)
    }
  }
  
  async loadPlugin(pluginPath: string) {
    try {
      // Read manifest
      const manifestPath = join(pluginPath, 'manifest.json')
      const manifestContent = await readFile(manifestPath, 'utf-8')
      const manifest: PluginManifest = JSON.parse(manifestContent)
      
      // Check if plugin is enabled
      const enabledPlugins = this.store.get('enabledPlugins', []) as string[]
      const enabled = enabledPlugins.includes(manifest.id)
      
      const plugin: Plugin = {
        manifest,
        path: pluginPath,
        enabled
      }
      
      this.plugins.set(manifest.id, plugin)
      
      if (enabled) {
        await this.activatePlugin(manifest.id)
      }
      
      console.log(`Loaded plugin: ${manifest.name} v${manifest.version}`)
    } catch (error) {
      console.error(`Failed to load plugin from ${pluginPath}:`, error)
    }
  }
  
  async activatePlugin(pluginId: string) {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`)
    }
    
    if (plugin.instance) {
      return // Already activated
    }
    
    try {
      // Load main entry point
      if (plugin.manifest.main) {
        const mainPath = join(plugin.path, plugin.manifest.main)
        const PluginClass = require(mainPath).default || require(mainPath)
        
        // Create instance
        const instance: PluginInstance = new PluginClass(this.pluginApi)
        plugin.instance = instance
        
        // Activate
        await instance.activate()
        
        // Update enabled plugins
        const enabledPlugins = this.store.get('enabledPlugins', []) as string[]
        if (!enabledPlugins.includes(pluginId)) {
          enabledPlugins.push(pluginId)
          this.store.set('enabledPlugins', enabledPlugins)
        }
        
        this.emit('plugin:activated', pluginId)
        console.log(`Activated plugin: ${plugin.manifest.name}`)
      }
    } catch (error) {
      console.error(`Failed to activate plugin ${pluginId}:`, error)
      throw error
    }
  }
  
  async deactivatePlugin(pluginId: string) {
    const plugin = this.plugins.get(pluginId)
    if (!plugin || !plugin.instance) {
      return
    }
    
    try {
      await plugin.instance.deactivate()
      plugin.instance = undefined
      
      // Update enabled plugins
      const enabledPlugins = this.store.get('enabledPlugins', []) as string[]
      const index = enabledPlugins.indexOf(pluginId)
      if (index !== -1) {
        enabledPlugins.splice(index, 1)
        this.store.set('enabledPlugins', enabledPlugins)
      }
      
      this.emit('plugin:deactivated', pluginId)
      console.log(`Deactivated plugin: ${plugin.manifest.name}`)
    } catch (error) {
      console.error(`Failed to deactivate plugin ${pluginId}:`, error)
      throw error
    }
  }
  
  getPlugins(): Plugin[] {
    return Array.from(this.plugins.values())
  }
  
  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId)
  }
  
  // Get all tools from enabled plugins
  getAllTools(): Tool[] {
    const tools: Tool[] = []
    
    for (const plugin of this.plugins.values()) {
      if (plugin.enabled && plugin.instance?.getTools) {
        const pluginTools = plugin.instance.getTools()
        // Prefix tool names with plugin ID
        pluginTools.forEach(tool => {
          tools.push({
            ...tool,
            name: `${plugin.manifest.id}:${tool.name}`
          })
        })
      }
    }
    
    return tools
  }
  
  // Execute a tool from a plugin
  async executeTool(toolName: string, args: any): Promise<any> {
    // Parse plugin ID and actual tool name
    const [pluginId, actualToolName] = toolName.split(':', 2)
    
    const plugin = this.plugins.get(pluginId)
    if (!plugin || !plugin.instance?.executeTool) {
      throw new Error(`Plugin or tool not found: ${toolName}`)
    }
    
    return await plugin.instance.executeTool(actualToolName, args)
  }
  
  // Install a plugin from a path or URL
  async installPlugin(_source: string) {
    // Future: Implement plugin installation - Issue #plugin-installation
    // - Download/copy plugin files
    // - Validate manifest
    // - Install dependencies
    // - Copy to plugins directory
  }
  
  // Uninstall a plugin
  async uninstallPlugin(pluginId: string) {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`)
    }
    
    // Deactivate if active
    if (plugin.instance) {
      await this.deactivatePlugin(pluginId)
    }
    
    // Remove from plugins map
    this.plugins.delete(pluginId)
    
    // Future: Remove plugin files from filesystem - Issue #plugin-cleanup
  }
}