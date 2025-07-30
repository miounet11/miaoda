import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getAppVersion: () => Promise<string>
      mcp: {
        connect: (server: any) => Promise<void>
        disconnect: (name: string) => Promise<void>
        getTools: () => Promise<any[]>
        callTool: (toolName: string, args: any) => Promise<any>
      }
      db: {
        createChat: (chat: any) => Promise<void>
        updateChat: (id: string, title: string, updated_at: string) => Promise<void>
        deleteChat: (id: string) => Promise<void>
        getChat: (id: string) => Promise<any>
        getAllChats: () => Promise<any[]>
        createMessage: (message: any) => Promise<void>
        getMessages: (chatId: string) => Promise<any[]>
        searchChats: (query: string) => Promise<any[]>
      }
      llm: {
        setProvider: (config: any) => Promise<{ success: boolean; error?: string }>
        sendMessage: (message: string, chatId: string, messageId: string) => Promise<string>
        getConfig: () => Promise<any>
        isConfigured: () => Promise<boolean>
        setToolsEnabled: (enabled: boolean) => Promise<void>
        getToolsEnabled: () => Promise<boolean>
        onChunk: (callback: (data: any) => void) => () => void
        onStatus: (callback: (data: any) => void) => () => void
        onToolCall: (callback: (data: any) => void) => () => void
      }
      file: {
        select: () => Promise<string[]>
        paste: (dataUrl: string) => Promise<string>
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
      }
      invoke: (channel: string, ...args: any[]) => Promise<any>
    }
  }
}