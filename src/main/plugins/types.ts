// Plugin system types and interfaces
import { Tool } from '@modelcontextprotocol/sdk/types.js'

export interface PluginManifest {
  id: string
  name: string
  version: string
  description?: string
  author?: string
  homepage?: string
  
  // Plugin capabilities
  capabilities: {
    tools?: boolean
    commands?: boolean
    themes?: boolean
    ui?: boolean
  }
  
  // Entry points
  main?: string // Main process entry
  renderer?: string // Renderer process entry
  
  // Dependencies
  dependencies?: Record<string, string>
  
  // Permissions
  permissions?: string[]
}

export interface Plugin {
  manifest: PluginManifest
  path: string
  enabled: boolean
  instance?: PluginInstance
}

export interface PluginInstance {
  // Lifecycle methods
  activate(): Promise<void>
  deactivate(): Promise<void>
  
  // Tool provider
  getTools?(): Tool[]
  executeTool?(toolName: string, args: any): Promise<any>
  
  // Command provider
  getCommands?(): PluginCommand[]
  executeCommand?(commandId: string, ...args: any[]): Promise<any>
  
  // UI provider
  getUIComponents?(): PluginUIComponent[]
}

export interface PluginCommand {
  id: string
  title: string
  description?: string
  keybinding?: string
}

export interface PluginUIComponent {
  id: string
  type: 'panel' | 'statusbar' | 'sidebar'
  title: string
  icon?: string
  component: string // Path to component file
}

export interface PluginAPI {
  // Core APIs
  workspace: {
    onDidOpenChat(listener: (chatId: string) => void): Disposable
    onDidCloseChat(listener: (chatId: string) => void): Disposable
    getActiveChat(): { id: string; title: string } | null
  }
  
  messages: {
    onDidReceiveMessage(listener: (message: any) => void): Disposable
    sendMessage(chatId: string, content: string): Promise<void>
  }
  
  storage: {
    get(key: string): any
    set(key: string, value: any): void
    delete(key: string): void
  }
  
  ui: {
    showMessage(message: string, type?: 'info' | 'warning' | 'error'): void
    showInputBox(options: { prompt: string; placeholder?: string }): Promise<string | null>
  }
}

export interface Disposable {
  dispose(): void
}