declare global {
  interface Window {
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