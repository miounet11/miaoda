import { ElectronAPI } from '@electron-toolkit/preload'

export interface FileInfo {
  path: string
  name: string
  size: number
  type: string
  data?: string
  content?: string
}

declare global {
  interface Window {
    electron: ElectronAPI
    electronAPI: {
      getAppVersion: () => Promise<string>
      auth: {
        login: (credentials: any) => Promise<any>
        register: (userData: any) => Promise<any>
        logout: (params: any) => Promise<any>
        refreshToken: (data: { refreshToken: string }) => Promise<any>
        validateSession: (data: { sessionId: string }) => Promise<any>
        requestPasswordReset: (request: any) => Promise<any>
        confirmPasswordReset: (request: any) => Promise<any>
        getSessions: (data: { sessionId: string }) => Promise<any>
        revokeSession: (data: { sessionId: string; targetSessionId: string }) => Promise<any>
        updateProfile: (data: any) => Promise<any>
        changePassword: (data: any) => Promise<any>
      }
      // Include all other existing APIs for electronAPI
      mcp: any
      db: any
      search: any
      llm: any
      file: any
      shortcuts: any
      plugins: any
      export: any
      invoke: (channel: string, ...args: any[]) => Promise<any>
    }
    api: {
      getAppVersion: () => Promise<string>
      mcp: {
        connect: (server: any) => Promise<void>
        disconnect: (name: string) => Promise<void>
        getTools: () => Promise<any[]>
        callTool: (toolName: string, args: any) => Promise<any>
        discoverServers?: () => Promise<any[]>
        pingServer?: (id: string) => Promise<boolean>
      }
      db: {
        createChat: (chat: any) => Promise<void>
        updateChat: (id: string, title: string, updated_at: string) => Promise<void>
        deleteChat: (id: string) => Promise<void>
        getChat: (id: string) => Promise<any>
        getAllChats: () => Promise<any[]>
        createMessage: (message: any) => Promise<void>
        updateMessage?: (messageId: string, content: string) => Promise<void>
        getMessages: (chatId: string) => Promise<any[]>
        searchChats: (query: string) => Promise<any[]>
        // summaries
        updateChatSummary?: (
          chatId: string,
          summary: string,
          tags: string[],
          keyPoints: string[],
          tokens?: number
        ) => Promise<void>
        getChatSummary?: (chatId: string) => Promise<any>
        getAllChatsWithSummaries?: () => Promise<any[]>
        searchChatsByTags?: (tags: string[]) => Promise<any[]>
        getAllSummaryTags?: () => Promise<string[]>
        clearChatSummary?: (chatId: string) => Promise<void>
        needsSummaryUpdate?: (
          chatId: string,
          minMessages?: number,
          maxAgeHours?: number
        ) => Promise<boolean>
        // analytics
        generateAnalytics?: (filter: any) => Promise<any>
        getAnalyticsSummary?: (timeRange?: string) => Promise<any>
      }
      search: {
        messages: (searchQuery: any) => Promise<any[]>
        getStats: () => Promise<any>
        rebuildIndex?: () => Promise<any>
        optimizeIndex?: () => Promise<any>
        getIndexStatus?: () => Promise<any>
        buildSemanticIndex?: () => Promise<any>
        semantic?: (query: any) => Promise<any>
        hybrid?: (query: any) => Promise<any>
        findSimilar?: (messageId: string, limit?: number) => Promise<any>
        getSemanticStats?: () => Promise<any>
        buildVectorIndex?: () => Promise<any>
        optimizeVectorIndex?: () => Promise<any>
        getVectorStats?: () => Promise<any>
        multimodal?: (query: any) => Promise<any>
        images?: (query: any, options?: any) => Promise<any>
        documents?: (query: any) => Promise<any>
        audio?: (query: any) => Promise<any>
        getMultimodalStats?: () => Promise<any>
        getPerformanceAnalysis?: (timeRange?: string) => Promise<any>
        getPerformanceRecommendations?: () => Promise<any[]>
        optimizePerformance?: () => Promise<any>
      }
      llm: {
        setProvider: (config: any) => Promise<{ success: boolean; error?: string }>
        sendMessage: (message: string | any[], chatId: string, messageId: string) => Promise<string>
        getConfig: () => Promise<any>
        isConfigured: () => Promise<boolean>
        setToolsEnabled: (enabled: boolean) => Promise<void>
        getToolsEnabled: () => Promise<boolean>
        getAllProviders: () => Promise<any[]>
        addCustomProvider: (
          config: any
        ) => Promise<{ success: boolean; id?: string; error?: string }>
        updateCustomProvider: (
          id: string,
          updates: any
        ) => Promise<{ success: boolean; error?: string }>
        removeCustomProvider: (id: string) => Promise<{ success: boolean; error?: string }>
        getAllCustomProviders: () => Promise<any[]>
        getCustomProvider: (id: string) => Promise<any>
        checkCustomProviderHealth: (id: string) => Promise<any>
        checkAllCustomProvidersHealth: () => Promise<any[]>
        getAllProviderHealthStatuses: () => Promise<any[]>
        getCustomProviderHealth: (id: string) => Promise<any>
        exportCustomProviders: () => Promise<any[]>
        importCustomProviders: (
          providers: any[]
        ) => Promise<{ success: number; failed: number; errors: string[] }>
        onChunk: (callback: (data: any) => void) => () => void
        onStatus: (callback: (data: any) => void) => () => void
        onToolCall: (callback: (data: any) => void) => () => void
        generateSummary?: (prompt: string) => Promise<string>
      }
      file: {
        select: () => Promise<FileInfo[]>
        paste: (dataUrl: string) => Promise<FileInfo>
      }
      shortcuts: {
        getAll: () => Promise<any>
        on: (callback: (action: string) => void) => void
      }
      plugins: {
        getAll: () => Promise<any[]>
        enable: (pluginId: string) => Promise<void>
        disable: (pluginId: string) => Promise<void>
      }
      export: {
        getChat: (chatId: string) => Promise<any>
        getChats: (chatIds: string[]) => Promise<any[]>
        getAllChats: () => Promise<any[]>
        getMessages: (chatId: string) => Promise<any[]>
        getChatsStream?: (chatIds: string[], batchSize?: number) => Promise<any>
        getMessagesStream?: (chatId: string, offset?: number, limit?: number) => Promise<any>
        onProgress?: (callback: (data: any) => void) => () => void
      }
      window: {
        createWindow: (options?: any) => Promise<string | any>
        closeWindow: (windowId: string) => Promise<boolean>
        focusWindow: (windowId: string) => Promise<boolean>
        minimizeWindow: (windowId: string) => Promise<boolean>
        maximizeWindow: (windowId: string) => Promise<boolean>
        restoreWindow: (windowId: string) => Promise<boolean>
        getWindowState: (windowId: string) => Promise<any>
        getAllWindows: () => Promise<any[]>
        onWindowCreated: (callback: Function) => void
        onWindowClosed: (callback: Function) => void
        onWindowFocused: (callback: Function) => void
        onWindowStateChanged: (callback: Function) => void
      }
      error?: {
        report: (data: any) => Promise<void>
      }
      invoke: (channel: string, ...args: any[]) => Promise<any>
    }
  }
}
