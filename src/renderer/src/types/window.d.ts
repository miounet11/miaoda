declare global {
  interface Window {
    api: {
      getAppVersion: () => Promise<string>
      db: {
        createChat: (chat: any) => Promise<any>
        updateChat: (id: string, title: string, updated_at: string) => Promise<any>
        deleteChat: (id: string) => Promise<any>
        getChat: (id: string) => Promise<any>
        getAllChats: () => Promise<any[]>
        createMessage: (message: any) => Promise<any>
        updateMessage: (messageId: string, content: string) => Promise<any>
        getMessages: (chatId: string) => Promise<any[]>
        searchChats: (query: string) => Promise<any[]>
      }
      llm: {
        sendMessage: (content: string, chatId: string, messageId: string) => Promise<any>
        getProviders: () => Promise<any[]>
        saveSettings: (settings: any) => Promise<any>
        loadSettings: () => Promise<any>
        onChunk: (callback: (data: any) => void) => void
        onStatus: (callback: (data: any) => void) => void
      }
      invoke: (channel: string, ...args: any[]) => Promise<any>
    }
    electronAPI: {
      getAppVersion: () => Promise<string>
      chat: {
        create: (chat: any) => Promise<any>
        update: (id: string, updates: any) => Promise<boolean>
        delete: (id: string) => Promise<boolean>
        get: (id: string) => Promise<any>
        getAll: () => Promise<any[]>
      }
      message: {
        create: (message: any) => Promise<any>
        update: (id: string, updates: any) => Promise<boolean>
        delete: (id: string) => Promise<boolean>
        getAll: (chatId: string) => Promise<any[]>
      }
      llm: {
        generate: (params: any) => Promise<any>
        stream: (params: any, callback: (chunk: any) => void) => Promise<void>
        setProvider: (config: any) => Promise<{ success: boolean; error?: string }>
        getConfig: () => Promise<any>
        isConfigured: () => Promise<boolean>
        setToolsEnabled: (enabled: boolean) => Promise<void>
        getToolsEnabled: () => Promise<boolean>
        getAllProviders: () => Promise<any[]>
        // Custom provider methods
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
      }
      mcp: {
        connect: (server: any) => Promise<void>
        disconnect: (name: string) => Promise<void>
        getTools: () => Promise<any[]>
        callTool: (toolName: string, args: any) => Promise<any>
      }
      plugin: {
        getAll: () => Promise<any[]>
        install: (url: string) => Promise<boolean>
        uninstall: (id: string) => Promise<boolean>
        enable: (id: string) => Promise<boolean>
        disable: (id: string) => Promise<boolean>
      }
      window: {
        minimize: () => void
        maximize: () => void
        close: () => void
        setAlwaysOnTop: (flag: boolean) => void
        openExternal: (url: string) => void
      }
      invoke: (channel: string, ...args: any[]) => Promise<any>
    }
  }
}

export {}
