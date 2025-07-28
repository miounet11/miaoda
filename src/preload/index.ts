import { contextBridge, ipcRenderer } from 'electron'

// Custom APIs for renderer
const api = {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  mcp: {
    connect: (server: any) => ipcRenderer.invoke('mcp:connect', server),
    disconnect: (name: string) => ipcRenderer.invoke('mcp:disconnect', name),
    getTools: () => ipcRenderer.invoke('mcp:get-tools'),
    callTool: (toolName: string, args: any) => ipcRenderer.invoke('mcp:call-tool', toolName, args)
  },
  db: {
    createChat: (chat: any) => ipcRenderer.invoke('db:create-chat', chat),
    updateChat: (id: string, title: string, updated_at: string) => 
      ipcRenderer.invoke('db:update-chat', id, title, updated_at),
    deleteChat: (id: string) => ipcRenderer.invoke('db:delete-chat', id),
    getChat: (id: string) => ipcRenderer.invoke('db:get-chat', id),
    getAllChats: () => ipcRenderer.invoke('db:get-all-chats'),
    createMessage: (message: any) => ipcRenderer.invoke('db:create-message', message),
    getMessages: (chatId: string) => ipcRenderer.invoke('db:get-messages', chatId),
    searchChats: (query: string) => ipcRenderer.invoke('db:search-chats', query)
  },
  llm: {
    setProvider: (config: any) => ipcRenderer.invoke('llm:setProvider', config),
    sendMessage: (message: string, chatId: string, messageId: string) => 
      ipcRenderer.invoke('llm:sendMessage', message, chatId, messageId),
    getConfig: () => ipcRenderer.invoke('llm:getConfig'),
    isConfigured: () => ipcRenderer.invoke('llm:isConfigured'),
    onChunk: (callback: (data: any) => void) => {
      ipcRenderer.on('llm:chunk', (_, data) => callback(data))
    }
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.api = api
}