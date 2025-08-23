/* eslint-disable */
// @ts-nocheck
import { pluginManager } from './PluginManager'
import type { PluginInstance, PluginContext } from './PluginManager'

// Built-in plugins
import welcomePlugin, { manifest as welcomeManifest } from './builtin/WelcomePlugin'
import themePlugin, { manifest as themeManifest } from './builtin/ThemePlugin'

/**
 * Initialize the plugin system and inject required services
 */
export async function initializePluginSystem(services: {
  chatStore: any
  searchService: any
  voiceService: any
  mcpService: any
  showNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void
  showDialog: (options: any) => Promise<any>
  showToast: (message: string, duration?: number) => void
}): Promise<void> {
  console.log('Initializing plugin system...')

  try {
    // Inject services into plugin context
    pluginManager.injectServices(services)

    // Load built-in plugins
    await loadBuiltinPlugins()

    // Initialize plugin manager
    await pluginManager.initialize()

    console.log('Plugin system initialized successfully')
  } catch (error) {
    console.error('Failed to initialize plugin system:', error)
    throw error
  }
}

/**
 * Load all built-in plugins
 */
async function loadBuiltinPlugins(): Promise<void> {
  const builtinPlugins = [
    { plugin: welcomePlugin, manifest: welcomeManifest },
    { plugin: themePlugin, manifest: themeManifest }
  ]

  for (const { plugin, manifest } of builtinPlugins) {
    try {
      await pluginManager.loadPlugin(manifest)
      console.log(`Built-in plugin loaded: ${manifest.name}`)
    } catch (error) {
      console.error(`Failed to load built-in plugin ${manifest.id}:`, error)
    }
  }
}

/**
 * Get the plugin manager instance
 */
export function getPluginManager() {
  return pluginManager
}

/**
 * Execute a plugin hook across all enabled plugins
 */
export async function executePluginHook<T = any>(hook: string, data: T): Promise<T> {
  return pluginManager.executeHook(hook as any, data)
}

/**
 * Get all available plugins
 */
export function getPlugins(): PluginInstance[] {
  return pluginManager.getPlugins()
}

/**
 * Get enabled plugins
 */
export function getEnabledPlugins(): PluginInstance[] {
  return pluginManager.getEnabledPlugins()
}

/**
 * Enable a plugin
 */
export async function enablePlugin(pluginId: string): Promise<void> {
  return pluginManager.enablePlugin(pluginId)
}

/**
 * Disable a plugin
 */
export async function disablePlugin(pluginId: string): Promise<void> {
  return pluginManager.disablePlugin(pluginId)
}

/**
 * Install a plugin from URL or file
 */
export async function installPlugin(source: string | Blob): Promise<PluginInstance> {
  return pluginManager.installPlugin(source)
}

/**
 * Uninstall a plugin
 */
export async function uninstallPlugin(pluginId: string): Promise<void> {
  return pluginManager.uninstallPlugin(pluginId)
}

/**
 * Update plugin settings
 */
export async function updatePluginSettings(
  pluginId: string,
  settings: Record<string, any>
): Promise<void> {
  return pluginManager.updatePluginSettings(pluginId, settings)
}

/**
 * Plugin system utilities for components
 */
export const pluginUtils = {
  /**
   * Check if a plugin is installed
   */
  isPluginInstalled(pluginId: string): boolean {
    return !!pluginManager.getPlugin(pluginId)
  },

  /**
   * Check if a plugin is enabled
   */
  isPluginEnabled(pluginId: string): boolean {
    const plugin = pluginManager.getPlugin(pluginId)
    return plugin?.enabled || false
  },

  /**
   * Get plugin information
   */
  getPluginInfo(pluginId: string): PluginInstance | undefined {
    return pluginManager.getPlugin(pluginId)
  },

  /**
   * Get plugins by category
   */
  getPluginsByCategory(category: string): PluginInstance[] {
    return pluginManager.getPluginsByCategory(category as any)
  },

  /**
   * Listen to plugin events
   */
  onPluginEvent(event: string, callback: (...args: any[]) => void): void {
    pluginManager.on(event as any, callback)
  },

  /**
   * Remove plugin event listener
   */
  offPluginEvent(event: string, callback: (...args: any[]) => void): void {
    pluginManager.off(event as any, callback)
  }
}

/**
 * Plugin hooks that can be called from the main application
 */
export const pluginHooks = {
  // Chat hooks
  async beforeMessageSend(data: any): Promise<any> {
    return executePluginHook('beforeMessageSend', data)
  },

  async afterMessageSend(data: any): Promise<any> {
    return executePluginHook('afterMessageSend', data)
  },

  async beforeMessageReceive(data: any): Promise<any> {
    return executePluginHook('beforeMessageReceive', data)
  },

  async afterMessageReceive(data: any): Promise<any> {
    return executePluginHook('afterMessageReceive', data)
  },

  async onChatCreate(data: any): Promise<any> {
    return executePluginHook('onChatCreate', data)
  },

  async onChatSelect(data: any): Promise<any> {
    return executePluginHook('onChatSelect', data)
  },

  async onChatDelete(data: any): Promise<any> {
    return executePluginHook('onChatDelete', data)
  },

  // App hooks
  async onAppInit(data: any): Promise<any> {
    return executePluginHook('onAppInit', data)
  },

  async onAppDestroy(data: any): Promise<any> {
    return executePluginHook('onAppDestroy', data)
  },

  async onThemeChange(data: any): Promise<any> {
    return executePluginHook('onThemeChange', data)
  },

  async onSettingsChange(data: any): Promise<any> {
    return executePluginHook('onSettingsChange', data)
  }
}

// Export types for TypeScript support
export type {
  PluginInstance,
  PluginContext,
  PluginHook,
  PluginManifest,
  PluginModule,
  PluginCategory,
  PluginPermission
} from './PluginManager'

// Plugin development utilities
export const createPlugin = {
  /**
   * Create a basic plugin template
   */
  template(options: {
    id: string
    name: string
    description: string
    author: string
    category: string
  }) {
    return {
      manifest: {
        id: options.id,
        name: options.name,
        version: '1.0.0',
        description: options.description,
        author: options.author,
        category: options.category,
        minAppVersion: '1.0.0',
        requiredPermissions: [],
        settings: []
      },

      plugin: {
        async activate(context: PluginContext) {
          console.log(`${options.name} plugin activated!`)
        },

        async deactivate(context: PluginContext) {
          console.log(`${options.name} plugin deactivated!`)
        }
      }
    }
  },

  /**
   * Validate plugin manifest
   */
  validateManifest(manifest: any): boolean {
    const required = ['id', 'name', 'version', 'description', 'author', 'category']
    return required.every(field => field in manifest && manifest[field])
  },

  /**
   * Generate plugin documentation
   */
  generateDocs(manifest: any): string {
    return `
# ${manifest.name}

${manifest.description}

**Version:** ${manifest.version}
**Author:** ${manifest.author}
**Category:** ${manifest.category}

## Installation

1. Download the plugin package
2. Open MiaoDa Chat Plugin Manager
3. Click "Install Plugin"
4. Select the plugin file

## Permissions

This plugin requires the following permissions:
${manifest.requiredPermissions?.map((p: string) => `- ${p}`).join('\n') || 'None'}

## Settings

${
  manifest.settings
    ?.map(
      (s: any) => `
### ${s.title}
- **Type:** ${s.type}
- **Default:** ${s.default}
- **Description:** ${s.description}
`
    )
    .join('\n') || 'No configurable settings'
}

## Support

For support, please contact: ${manifest.author}
${manifest.homepage ? `\nHomepage: ${manifest.homepage}` : ''}
${manifest.repository ? `\nRepository: ${manifest.repository}` : ''}
    `.trim()
  }
}

export default {
  initializePluginSystem,
  getPluginManager,
  executePluginHook,
  getPlugins,
  getEnabledPlugins,
  enablePlugin,
  disablePlugin,
  installPlugin,
  uninstallPlugin,
  updatePluginSettings,
  pluginUtils,
  pluginHooks,
  createPlugin
}
