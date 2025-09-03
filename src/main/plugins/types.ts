// @ts-nocheck
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

// Plugin Market Types
export interface PluginMarketListing {
  id: string
  name: string
  description: string
  shortDescription?: string
  version: string
  latestVersion?: string
  author: string
  authorId: string
  homepage?: string
  repository?: string

  // Market metadata
  category: PluginCategory
  tags: string[]
  screenshots?: string[]
  icon?: string
  banner?: string

  // Statistics
  downloads: number
  rating: number
  reviewCount: number
  lastUpdated: string
  createdAt: string

  // Pricing
  pricing: 'free' | 'paid' | 'freemium'
  price?: number
  currency?: string

  // Status
  status: 'available' | 'installed' | 'updating' | 'deprecated'
  verified: boolean
  featured: boolean

  // Compatibility
  minVersion: string
  maxVersion?: string
  platforms: ('win' | 'mac' | 'linux')[]
}

export interface PluginCategory {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
  parentId?: string
  children?: PluginCategory[]
}

export interface PluginRating {
  id: string
  pluginId: string
  userId: string
  userName: string
  rating: number // 1-5
  review?: string
  createdAt: string
  helpful: number
  verified: boolean
}

export interface PluginFilters {
  category?: string
  tags?: string[]
  pricing?: ('free' | 'paid' | 'freemium')[]
  rating?: number // minimum rating
  verified?: boolean
  platform?: string
  search?: string
  sortBy?: 'name' | 'rating' | 'downloads' | 'updated' | 'created'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface PluginSearchResult {
  plugins: PluginMarketListing[]
  total: number
  page: number
  limit: number
  hasMore: boolean
  categories: PluginCategory[]
  facets: {
    categories: { [key: string]: number }
    tags: { [key: string]: number }
    pricing: { [key: string]: number }
  }
}

export interface DeveloperProfile {
  id: string
  name: string
  email: string
  avatar?: string
  bio?: string
  website?: string
  github?: string
  verified: boolean
  joinedAt: string
  pluginCount: number
  totalDownloads: number
  averageRating: number
}

// Enhanced Plugin Development Framework Types
export interface PluginSDK {
  // Core APIs
  core: PluginCoreAPI
  ui: PluginUIAPI
  data: PluginDataAPI
  system: PluginSystemAPI
  workflow: PluginWorkflowAPI
  theme: PluginThemeAPI

  // Development utilities
  dev: PluginDevAPI

  // Plugin metadata
  manifest: PluginManifest
  context: PluginContext
}

export interface PluginCoreAPI extends PluginAPI {
  // Enhanced workspace operations
  workspace: {
    onDidOpenChat(listener: (chatId: string) => void): Disposable
    onDidCloseChat(listener: (chatId: string) => void): Disposable
    onDidSwitchChat(listener: (fromChatId: string, toChatId: string) => void): Disposable
    getActiveChat(): { id: string; title: string } | null
    getAllChats(): { id: string; title: string }[]
    createChat(title: string): Promise<string>
    deleteChat(chatId: string): Promise<void>
  }

  // Enhanced message operations
  messages: {
    onDidReceiveMessage(listener: (message: ChatMessage) => void): Disposable
    onDidSendMessage(listener: (message: ChatMessage) => void): Disposable
    sendMessage(chatId: string, content: string | MessageContent): Promise<void>
    getMessage(messageId: string): Promise<ChatMessage | null>
    updateMessage(messageId: string, content: Partial<ChatMessage>): Promise<void>
    deleteMessage(messageId: string): Promise<void>
    searchMessages(query: string, options?: SearchOptions): Promise<ChatMessage[]>
  }

  // Plugin lifecycle
  lifecycle: {
    onActivate(callback: () => Promise<void>): void
    onDeactivate(callback: () => Promise<void>): void
    onUpdate(callback: (oldVersion: string, newVersion: string) => Promise<void>): void
  }
}

export interface PluginUIAPI {
  // Menu and commands
  menus: {
    registerCommand(command: PluginCommand): Disposable
    registerContextMenu(item: ContextMenuItem): Disposable
    registerToolbar(item: ToolbarItem): Disposable
  }

  // Panels and views
  panels: {
    createPanel(config: PanelConfig): PluginPanel
    registerSidebarPanel(config: SidebarPanelConfig): Disposable
    registerModalDialog(config: ModalDialogConfig): Disposable
  }

  // Notifications and feedback
  notifications: {
    showMessage(message: string, type?: MessageType): void
    showNotification(notification: NotificationConfig): Disposable
    showProgress(config: ProgressConfig): ProgressHandle
  }

  // Input and dialogs
  dialogs: {
    showInputBox(options: InputBoxOptions): Promise<string | null>
    showQuickPick<T>(items: QuickPickItem<T>[], options?: QuickPickOptions): Promise<T | null>
    showOpenDialog(options: OpenDialogOptions): Promise<string[] | null>
    showSaveDialog(options: SaveDialogOptions): Promise<string | null>
  }

  // Status and indicators
  status: {
    setStatusBarItem(id: string, config: StatusBarItemConfig): Disposable
    updateStatusBarItem(id: string, config: Partial<StatusBarItemConfig>): void
  }
}

export interface PluginDataAPI {
  // Persistent storage
  storage: {
    get<T>(key: string): Promise<T | undefined>
    set<T>(key: string, value: T): Promise<void>
    delete(key: string): Promise<void>
    clear(): Promise<void>
    keys(): Promise<string[]>

    // Scoped storage
    createScope(scopeName: string): PluginStorageScope
  }

  // Temporary cache
  cache: {
    get<T>(key: string): T | undefined
    set<T>(key: string, value: T, ttl?: number): void
    delete(key: string): void
    clear(): void
  }

  // File system operations (sandboxed)
  fs: {
    readFile(path: string): Promise<Buffer>
    writeFile(path: string, data: Buffer | string): Promise<void>
    exists(path: string): Promise<boolean>
    mkdir(path: string): Promise<void>
    readdir(path: string): Promise<string[]>
    stat(path: string): Promise<FileStats>
  }

  // Database operations (if allowed)
  db?: {
    query<T>(sql: string, params?: any[]): Promise<T[]>
    execute(sql: string, params?: any[]): Promise<void>
  }
}

export interface PluginSystemAPI {
  // Environment info
  env: {
    platform: 'win' | 'mac' | 'linux'
    version: string
    isDev: boolean
    userDataPath: string
    pluginPath: string
  }

  // Network operations (if allowed)
  http?: {
    get(url: string, options?: HttpOptions): Promise<HttpResponse>
    post(url: string, data?: any, options?: HttpOptions): Promise<HttpResponse>
    put(url: string, data?: any, options?: HttpOptions): Promise<HttpResponse>
    delete(url: string, options?: HttpOptions): Promise<HttpResponse>
  }

  // Process operations (if allowed)
  process?: {
    spawn(command: string, args: string[], options?: SpawnOptions): Promise<ProcessResult>
    exec(command: string, options?: ExecOptions): Promise<ProcessResult>
  }

  // Clipboard operations
  clipboard: {
    readText(): Promise<string>
    writeText(text: string): Promise<void>
    readImage(): Promise<Buffer | null>
    writeImage(image: Buffer): Promise<void>
  }
}

export interface PluginWorkflowAPI {
  // Workflow definition and execution
  workflows: {
    define(workflow: WorkflowDefinition): WorkflowInstance
    execute(workflowId: string, input?: any): Promise<any>
    getStatus(executionId: string): Promise<WorkflowStatus>
    cancel(executionId: string): Promise<void>
  }

  // Step definitions
  steps: {
    registerStep(name: string, handler: WorkflowStepHandler): Disposable
    getAvailableSteps(): string[]
  }

  // Triggers
  triggers: {
    onChatMessage(pattern: string | RegExp, handler: WorkflowTriggerHandler): Disposable
    onFileChange(pattern: string, handler: WorkflowTriggerHandler): Disposable
    onSchedule(cron: string, handler: WorkflowTriggerHandler): Disposable
  }
}

export interface PluginThemeAPI {
  // Theme management
  themes: {
    registerTheme(theme: ThemeDefinition): Disposable
    getCurrentTheme(): ThemeDefinition
    onThemeChanged(listener: (theme: ThemeDefinition) => void): Disposable
  }

  // Style customization
  styles: {
    addGlobalStyles(css: string): Disposable
    addComponentStyles(selector: string, css: string): Disposable
    getCSSSVariables(): Record<string, string>
    setCSSVariable(name: string, value: string): void
  }

  // Icon management
  icons: {
    registerIcon(name: string, svg: string): Disposable
    getIcon(name: string): string | null
  }
}

export interface PluginDevAPI {
  // Development utilities
  logger: {
    debug(message: string, ...args: any[]): void
    info(message: string, ...args: any[]): void
    warn(message: string, ...args: any[]): void
    error(message: string, ...args: any[]): void
  }

  // Performance monitoring
  performance: {
    mark(name: string): void
    measure(name: string, startMark?: string, endMark?: string): number
    getMetrics(): PerformanceMetrics
  }

  // Testing utilities
  testing?: {
    createMockContext(): PluginContext
    simulateEvent(event: string, data?: any): void
    runTests(): Promise<TestResults>
  }
}

export interface PluginContext {
  pluginId: string
  version: string
  isDev: boolean

  // Runtime info
  activatedAt: Date

  // Permissions
  permissions: PluginPermissions

  // Configuration
  config: PluginConfiguration

  // State
  state: Record<string, any>
}

// Additional interface definitions
export interface ChatMessage {
  id: string
  chatId: string
  role: 'user' | 'assistant' | 'system'
  content: string | MessageContent
  timestamp: Date
  metadata?: Record<string, any>
}

export interface MessageContent {
  text?: string
  attachments?: Attachment[]
  mentions?: Mention[]
}

export interface PanelConfig {
  id: string
  title: string
  icon?: string
  component: string
  position?: 'left' | 'right' | 'bottom'
  size?: number
}

export interface WorkflowDefinition {
  id: string
  name: string
  description?: string
  steps: WorkflowStep[]
  triggers?: WorkflowTrigger[]
}

export interface ThemeDefinition {
  id: string
  name: string
  description?: string
  colors: Record<string, string>
  variables?: Record<string, string>
  styles?: string
}

export interface PluginPermissions {
  filesystem?: {
    read: string[]
    write: string[]
    execute: string[]
  }
  network?: {
    outbound: string[]
    inbound: boolean
  }
  system?: {
    clipboard: boolean
    notifications: boolean
    childProcess: boolean
  }
  app?: {
    chat: 'read' | 'write' | 'full'
    settings: 'read' | 'write'
    ui: boolean
  }
}

export interface PluginConfiguration {
  [key: string]: any
}

// Plugin Development Template Types
export interface PluginTemplate {
  id: string
  name: string
  description: string
  category: string
  language: 'javascript' | 'typescript'
  framework?: 'vue' | 'react' | 'vanilla'
  features: string[]
  files: TemplateFile[]
  dependencies: Record<string, string>
  devDependencies?: Record<string, string>
}

export interface TemplateFile {
  path: string
  content: string
  template?: boolean // If true, content will be processed as a template
}

export type SearchOptions = Record<string, any>
export type ContextMenuItem = { id: string; title: string }
export type ToolbarItem = { id: string; title: string }
export type PluginPanel = any
export type SidebarPanelConfig = any
export type ModalDialogConfig = any
export type MessageType = 'info' | 'warning' | 'error' | 'success'
export type NotificationConfig = { title: string; message: string; type?: MessageType }
export type ProgressConfig = { title?: string; total?: number }
export type ProgressHandle = { update: (n: number) => void; done: () => void }
export type InputBoxOptions = { prompt?: string; value?: string }
export type QuickPickItem<T = any> = { label: string; value: T }
export type QuickPickOptions = { placeholder?: string }
export type OpenDialogOptions = { filters?: any[] }
export type SaveDialogOptions = { defaultPath?: string }
export type StatusBarItemConfig = { text: string; tooltip?: string }
export type PluginStorageScope = { get: (k: string) => Promise<any> }
export type FileStats = { size: number; mtime: number }
export type HttpOptions = { headers?: Record<string, string> }
export type HttpResponse = { status: number; data: any }
export type SpawnOptions = any
export type ProcessResult = { code: number; stdout: string; stderr: string }
export type ExecOptions = any
export type WorkflowInstance = any
export type WorkflowStatus = 'pending' | 'running' | 'completed' | 'failed'
export type WorkflowStepHandler = (...args: any[]) => any
export type WorkflowTriggerHandler = (...args: any[]) => any
export type PerformanceMetrics = any
export type TestResults = { passed: number; failed: number }
export type Attachment = { url: string; name?: string }
export type Mention = { userId: string }
export type WorkflowStep = any
export type WorkflowTrigger = any
