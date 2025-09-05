// @ts-nocheck
import { EventEmitter } from '@renderer/src/utils/performance'
import type { Message, Chat } from '@renderer/src/types'

// Plugin System Types
export type PluginHook =
  | 'beforeMessageSend'
  | 'afterMessageSend'
  | 'beforeMessageReceive'
  | 'afterMessageReceive'
  | 'onChatCreate'
  | 'onChatSelect'
  | 'onChatDelete'
  | 'onAppInit'
  | 'onAppDestroy'
  | 'onThemeChange'
  | 'onSettingsChange'

export interface PluginContext {
  // Core services
  chatStore: any
  searchService: any
  voiceService: any
  mcpService: any

  // UI utilities
  showNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void
  showDialog: (options: DialogOptions) => Promise<any>
  showToast: (message: string, duration?: number) => void

  // System utilities
  storage: PluginStorage
  http: PluginHttpClient
  utils: PluginUtils
}

export interface DialogOptions {
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'confirm'
  buttons?: Array<{
    text: string
    value: any
    primary?: boolean
  }>
}

export interface PluginStorage {
  get<T = any>(key: string, defaultValue?: T): Promise<T>
  set(key: string, value: any): Promise<void>
  remove(key: string): Promise<void>
  clear(): Promise<void>
  keys(): Promise<string[]>
}

export interface PluginHttpClient {
  get<T = any>(url: string, options?: RequestInit): Promise<T>
  post<T = any>(url: string, data?: any, options?: RequestInit): Promise<T>
  put<T = any>(url: string, data?: any, options?: RequestInit): Promise<T>
  delete<T = any>(url: string, options?: RequestInit): Promise<T>
}

export interface PluginUtils {
  debounce<T extends (...args: any[]) => any>(func: T, delay: number): T
  throttle<T extends (...args: any[]) => any>(func: T, limit: number): T
  nanoid: () => string
  formatDate: (date: Date, format?: string) => string
  formatBytes: (bytes: number) => string
  isValidUrl: (url: string) => boolean
  sanitizeHtml: (html: string) => string
  escapeRegex: (text: string) => string
}

export interface PluginManifest {
  id: string
  name: string
  version: string
  description: string
  author: string
  homepage?: string
  repository?: string
  license?: string

  // Runtime requirements
  minAppVersion: string
  maxAppVersion?: string
  requiredPermissions: PluginPermission[]

  // Entry points
  main?: string
  ui?: PluginUIConfig[]

  // Metadata
  icon?: string
  keywords?: string[]
  category: PluginCategory

  // Configuration
  settings?: PluginSettingSchema[]

  // Dependencies
  dependencies?: Record<string, string>
}

export type PluginPermission =
  | 'storage'
  | 'network'
  | 'filesystem'
  | 'notifications'
  | 'clipboard'
  | 'system'
  | 'chat.read'
  | 'chat.write'
  | 'chat.delete'
  | 'search.read'
  | 'search.write'
  | 'voice.use'
  | 'mcp.use'

export type PluginCategory =
  | 'productivity'
  | 'entertainment'
  | 'utility'
  | 'development'
  | 'education'
  | 'social'
  | 'customization'
  | 'integration'

export interface PluginUIConfig {
  type: 'sidebar' | 'toolbar' | 'menu' | 'modal' | 'panel'
  position?: 'top' | 'bottom' | 'left' | 'right'
  title: string
  icon?: string
  component: string
  hotkey?: string
}

export interface PluginSettingSchema {
  key: string
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'textarea' | 'file'
  title: string
  description?: string
  default?: any
  required?: boolean
  options?: Array<{ label: string; value: any }>
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
}

export interface PluginInstance {
  manifest: PluginManifest
  module: PluginModule
  context: PluginContext
  settings: Record<string, any>
  enabled: boolean
  loaded: boolean
  error?: string
}

export interface PluginModule {
  activate?(context: PluginContext): Promise<void> | void
  deactivate?(context: PluginContext): Promise<void> | void

  // Hook handlers
  [key: string]: any
}

export interface PluginHookHandler<T = any> {
  (data: T, context: PluginContext): Promise<T> | T
}

export interface PluginEvent {
  type: string
  data: any
  source: string
  timestamp: Date
}

export class PluginManager extends EventEmitter<{
  'plugin-loaded': [plugin: PluginInstance]
  'plugin-unloaded': [pluginId: string]
  'plugin-enabled': [pluginId: string]
  'plugin-disabled': [pluginId: string]
  'plugin-error': [pluginId: string, error: Error]
  'hook-executed': [hook: PluginHook, pluginId: string, data: any]
}> {
  private plugins = new Map<string, PluginInstance>()
  private hooks = new Map<PluginHook, Set<string>>()
  private context: PluginContext
  private initialized = false

  constructor() {
    super()
    this.context = this.createPluginContext()
  }

  // Plugin lifecycle management
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Load built-in plugins
      await this.loadBuiltinPlugins()

      // Load user-installed plugins
      await this.loadUserPlugins()

      // Enable previously enabled plugins
      await this.restoreEnabledPlugins()

      this.initialized = true
      console.log(`Plugin system initialized with ${this.plugins.size} plugins`)
    } catch (error) {
      console.error('Failed to initialize plugin system:', error)
      throw error
    }
  }

  async loadPlugin(manifestOrPath: PluginManifest | string): Promise<PluginInstance> {
    let manifest: PluginManifest
    let modulePath: string

    if (typeof manifestOrPath === 'string') {
      // Load from file path
      const response = await fetch(`${manifestOrPath}/manifest.json`)
      manifest = await response.json()
      modulePath = `${manifestOrPath}/${manifest.main || 'index.js'}`
    } else {
      manifest = manifestOrPath
      modulePath = manifest.main || 'index.js'
    }

    // Validate manifest
    this.validateManifest(manifest)

    // Check if plugin already loaded
    if (this.plugins.has(manifest.id)) {
      throw new Error(`Plugin ${manifest.id} is already loaded`)
    }

    try {
      // Load plugin module
      const module = await this.loadPluginModule(modulePath)

      // Create plugin instance
      const plugin: PluginInstance = {
        manifest,
        module,
        context: this.context,
        settings: await this.loadPluginSettings(manifest.id),
        enabled: false,
        loaded: true
      }

      // Register plugin
      this.plugins.set(manifest.id, plugin)

      // Register hooks
      this.registerPluginHooks(manifest.id, module)

      this.emit('plugin-loaded', plugin)
      console.log(`Plugin loaded: ${manifest.name} v${manifest.version}`)

      return plugin
    } catch (error) {
      const pluginError = new Error(`Failed to load plugin ${manifest.id}: ${error}`)
      this.emit('plugin-error', manifest.id, pluginError)
      throw pluginError
    }
  }

  async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    try {
      // Disable plugin first
      if (plugin.enabled) {
        await this.disablePlugin(pluginId)
      }

      // Unregister hooks
      this.unregisterPluginHooks(pluginId)

      // Remove plugin
      this.plugins.delete(pluginId)

      this.emit('plugin-unloaded', pluginId)
      console.log(`Plugin unloaded: ${pluginId}`)
    } catch (error) {
      const pluginError = new Error(`Failed to unload plugin ${pluginId}: ${error}`)
      this.emit('plugin-error', pluginId, pluginError)
      throw pluginError
    }
  }

  async enablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    if (plugin.enabled) return

    try {
      // Check permissions
      await this.checkPluginPermissions(plugin)

      // Activate plugin
      if (plugin.module.activate) {
        await plugin.module.activate(plugin.context)
      }

      plugin.enabled = true
      plugin.error = undefined

      // Save enabled state
      await this.savePluginState(pluginId, true)

      this.emit('plugin-enabled', pluginId)
      console.log(`Plugin enabled: ${pluginId}`)
    } catch (error) {
      plugin.error = error instanceof Error ? error.message : 'Unknown error'
      const pluginError = new Error(`Failed to enable plugin ${pluginId}: ${error}`)
      this.emit('plugin-error', pluginId, pluginError)
      throw pluginError
    }
  }

  async disablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    if (!plugin.enabled) return

    try {
      // Deactivate plugin
      if (plugin.module.deactivate) {
        await plugin.module.deactivate(plugin.context)
      }

      plugin.enabled = false

      // Save disabled state
      await this.savePluginState(pluginId, false)

      this.emit('plugin-disabled', pluginId)
      console.log(`Plugin disabled: ${pluginId}`)
    } catch (error) {
      const pluginError = new Error(`Failed to disable plugin ${pluginId}: ${error}`)
      this.emit('plugin-error', pluginId, pluginError)
      throw pluginError
    }
  }

  // Hook system
  async executeHook<T = any>(hook: PluginHook, data: T): Promise<T> {
    const pluginIds = this.hooks.get(hook)
    if (!pluginIds || pluginIds.size === 0) {
      return data
    }

    let result = data

    for (const pluginId of pluginIds) {
      const plugin = this.plugins.get(pluginId)
      if (!plugin || !plugin.enabled) continue

      try {
        const handler = plugin.module[hook]
        if (typeof handler === 'function') {
          result = await handler(result, plugin.context)
          this.emit('hook-executed', hook, pluginId, result)
        }
      } catch (error) {
        console.error(`Plugin ${pluginId} hook ${hook} failed:`, error)
        this.emit('plugin-error', pluginId, error as Error)
      }
    }

    return result
  }

  // Plugin management
  getPlugin(pluginId: string): PluginInstance | undefined {
    return this.plugins.get(pluginId)
  }

  getPlugins(): PluginInstance[] {
    return Array.from(this.plugins.values())
  }

  getEnabledPlugins(): PluginInstance[] {
    return Array.from(this.plugins.values()).filter(p => p.enabled)
  }

  getPluginsByCategory(category: PluginCategory): PluginInstance[] {
    return Array.from(this.plugins.values()).filter(p => p.manifest.category === category)
  }

  async updatePluginSettings(pluginId: string, settings: Record<string, any>): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    // Validate settings
    this.validatePluginSettings(plugin.manifest, settings)

    // Update settings
    plugin.settings = { ...plugin.settings, ...settings }

    // Save settings
    await this.savePluginSettings(pluginId, plugin.settings)

    console.log(`Plugin settings updated: ${pluginId}`)
  }

  // Private methods
  private createPluginContext(): PluginContext {
    return {
      chatStore: null, // Will be injected
      searchService: null, // Will be injected
      voiceService: null, // Will be injected
      mcpService: null, // Will be injected

      showNotification: (message: string, type = 'info') => {
        // Implementation will be injected
        console.log(`[${type.toUpperCase()}] ${message}`)
      },

      showDialog: async (options: DialogOptions) => {
        // Implementation will be injected
        return confirm(`${options.title}\n\n${options.message}`)
      },

      showToast: (message: string, duration = 3000) => {
        // Implementation will be injected
        console.log(`Toast: ${message}`)
      },

      storage: this.createPluginStorage(),
      http: this.createPluginHttpClient(),
      utils: this.createPluginUtils()
    }
  }

  private createPluginStorage(): PluginStorage {
    return {
      async get<T>(key: string, defaultValue?: T): Promise<T> {
        try {
          const stored = localStorage.getItem(`plugin-storage:${key}`)
          return stored ? JSON.parse(stored) : defaultValue
        } catch {
          return defaultValue as T
        }
      },

      async set(key: string, value: any): Promise<void> {
        localStorage.setItem(`plugin-storage:${key}`, JSON.stringify(value))
      },

      async remove(key: string): Promise<void> {
        localStorage.removeItem(`plugin-storage:${key}`)
      },

      async clear(): Promise<void> {
        const keys = Object.keys(localStorage).filter(k => k.startsWith('plugin-storage:'))
        keys.forEach(key => localStorage.removeItem(key))
      },

      async keys(): Promise<string[]> {
        return Object.keys(localStorage)
          .filter(k => k.startsWith('plugin-storage:'))
          .map(k => k.replace('plugin-storage:', ''))
      }
    }
  }

  private createPluginHttpClient(): PluginHttpClient {
    const request = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return response.json()
    }

    return {
      get: <T>(url: string, options?: RequestInit) =>
        request<T>(url, { ...options, method: 'GET' }),
      post: <T>(url: string, data?: any, options?: RequestInit) =>
        request<T>(url, {
          ...options,
          method: 'POST',
          body: data ? JSON.stringify(data) : undefined
        }),
      put: <T>(url: string, data?: any, options?: RequestInit) =>
        request<T>(url, {
          ...options,
          method: 'PUT',
          body: data ? JSON.stringify(data) : undefined
        }),
      delete: <T>(url: string, options?: RequestInit) =>
        request<T>(url, { ...options, method: 'DELETE' })
    }
  }

  private createPluginUtils(): PluginUtils {
    return {
      debounce: <T extends (...args: any[]) => any>(func: T, delay: number): T => {
        let timeoutId: NodeJS.Timeout
        return ((...args: any[]) => {
          clearTimeout(timeoutId)
          timeoutId = setTimeout(() => func.apply(null, args), delay)
        }) as T
      },

      throttle: <T extends (...args: any[]) => any>(func: T, limit: number): T => {
        let inThrottle: boolean
        return ((...args: any[]) => {
          if (!inThrottle) {
            func.apply(null, args)
            inThrottle = true
            setTimeout(() => (inThrottle = false), limit)
          }
        }) as T
      },

      nanoid: () => Math.random().toString(36).substr(2, 9),

      formatDate: (date: Date, format = 'YYYY-MM-DD HH:mm:ss') => {
        // Simple date formatting
        return date.toLocaleString()
      },

      formatBytes: (bytes: number) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
      },

      isValidUrl: (url: string) => {
        try {
          new URL(url)
          return true
        } catch {
          return false
        }
      },

      sanitizeHtml: (html: string) => {
        // Basic HTML sanitization
        return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      },

      escapeRegex: (text: string) => {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      }
    }
  }

  private validateManifest(manifest: PluginManifest): void {
    const required = ['id', 'name', 'version', 'description', 'author']
    for (const field of required) {
      if (!(field in manifest)) {
        throw new Error(`Missing required field: ${field}`)
      }
    }

    if (!/^[a-z0-9-_]+$/.test(manifest.id)) {
      throw new Error(
        'Plugin ID must contain only lowercase letters, numbers, hyphens, and underscores'
      )
    }

    if (!/^\d+\.\d+\.\d+/.test(manifest.version)) {
      throw new Error('Plugin version must follow semantic versioning (x.y.z)')
    }
  }

  private async loadPluginModule(modulePath: string): Promise<PluginModule> {
    try {
      // In a real implementation, this would load the module based on the runtime environment
      // For now, we'll assume ES modules
      const module = await import(modulePath)
      return module.default || module
    } catch (error) {
      throw new Error(`Failed to load module: ${error}`)
    }
  }

  private registerPluginHooks(pluginId: string, module: PluginModule): void {
    const hookNames: PluginHook[] = [
      'beforeMessageSend',
      'afterMessageSend',
      'beforeMessageReceive',
      'afterMessageReceive',
      'onChatCreate',
      'onChatSelect',
      'onChatDelete',
      'onAppInit',
      'onAppDestroy',
      'onThemeChange',
      'onSettingsChange'
    ]

    for (const hookName of hookNames) {
      if (typeof module[hookName] === 'function') {
        if (!this.hooks.has(hookName)) {
          this.hooks.set(hookName, new Set())
        }
        this.hooks.get(hookName)!.add(pluginId)
      }
    }
  }

  private unregisterPluginHooks(pluginId: string): void {
    for (const [_, pluginIds] of this.hooks) {
      pluginIds.delete(pluginId)
    }
  }

  private async loadBuiltinPlugins(): Promise<void> {
    // Load built-in plugins from the app bundle
    // This would be implemented based on the app's structure
  }

  private async loadUserPlugins(): Promise<void> {
    // Load user-installed plugins
    // This would typically read from a plugins directory
  }

  private async restoreEnabledPlugins(): Promise<void> {
    try {
      const enabled = JSON.parse(localStorage.getItem('enabled-plugins') || '[]')
      for (const pluginId of enabled) {
        if (this.plugins.has(pluginId)) {
          await this.enablePlugin(pluginId)
        }
      }
    } catch (error) {
      console.warn('Failed to restore enabled plugins:', error)
    }
  }

  private async checkPluginPermissions(plugin: PluginInstance): Promise<void> {
    // Check if plugin has required permissions
    // In a real implementation, this would validate against user-granted permissions
    for (const permission of plugin.manifest.requiredPermissions) {
      // Simplified permission check
      console.log(`Checking permission: ${permission}`)
    }
  }

  private async loadPluginSettings(pluginId: string): Promise<Record<string, any>> {
    try {
      const settings = localStorage.getItem(`plugin-settings:${pluginId}`)
      return settings ? JSON.parse(settings) : {}
    } catch {
      return {}
    }
  }

  private async savePluginSettings(pluginId: string, settings: Record<string, any>): Promise<void> {
    localStorage.setItem(`plugin-settings:${pluginId}`, JSON.stringify(settings))
  }

  private async savePluginState(pluginId: string, enabled: boolean): Promise<void> {
    try {
      const enabledPlugins = JSON.parse(localStorage.getItem('enabled-plugins') || '[]')
      const index = enabledPlugins.indexOf(pluginId)

      if (enabled && index === -1) {
        enabledPlugins.push(pluginId)
      } else if (!enabled && index !== -1) {
        enabledPlugins.splice(index, 1)
      }

      localStorage.setItem('enabled-plugins', JSON.stringify(enabledPlugins))
    } catch (error) {
      console.warn('Failed to save plugin state:', error)
    }
  }

  private validatePluginSettings(manifest: PluginManifest, settings: Record<string, any>): void {
    if (!manifest.settings) return

    for (const schema of manifest.settings) {
      const value = settings[schema.key]

      if (schema.required && (value === undefined || value === null)) {
        throw new Error(`Required setting missing: ${schema.key}`)
      }

      if (value !== undefined && schema.validation) {
        // Perform validation based on schema
        if (schema.type === 'number') {
          if (schema.validation.min !== undefined && value < schema.validation.min) {
            throw new Error(`${schema.key} must be at least ${schema.validation.min}`)
          }
          if (schema.validation.max !== undefined && value > schema.validation.max) {
            throw new Error(`${schema.key} must be at most ${schema.validation.max}`)
          }
        }

        if (schema.type === 'string' && schema.validation.pattern) {
          const regex = new RegExp(schema.validation.pattern)
          if (!regex.test(value)) {
            throw new Error(schema.validation.message || `${schema.key} format is invalid`)
          }
        }
      }
    }
  }

  // Public utilities
  injectServices(services: Partial<PluginContext>): void {
    Object.assign(this.context, services)
  }

  async reloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    const wasEnabled = plugin.enabled
    await this.unloadPlugin(pluginId)
    const newPlugin = await this.loadPlugin(plugin.manifest)

    if (wasEnabled) {
      await this.enablePlugin(pluginId)
    }
  }

  async installPlugin(pluginPackage: Blob | string): Promise<PluginInstance> {
    // Plugin installation logic would go here
    // This would handle downloading, extracting, and loading plugins
    throw new Error('Plugin installation not implemented yet')
  }

  async uninstallPlugin(pluginId: string): Promise<void> {
    await this.unloadPlugin(pluginId)
    // Additional cleanup logic for removing plugin files
  }

  destroy(): void {
    // Cleanup when the plugin manager is destroyed
    for (const [pluginId] of this.plugins) {
      this.disablePlugin(pluginId).catch(console.error)
    }
    this.plugins.clear()
    this.hooks.clear()
    this.clear()
  }
}

// Global plugin manager instance
export const pluginManager = new PluginManager()

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    pluginManager.destroy()
  })
}
