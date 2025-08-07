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
    updateMessage: (messageId: string, content: string) => ipcRenderer.invoke('db:update-message', messageId, content),
    getMessages: (chatId: string) => ipcRenderer.invoke('db:get-messages', chatId),
    searchChats: (query: string) => ipcRenderer.invoke('db:search-chats', query)
  },
  search: {
    messages: (searchQuery: any) => ipcRenderer.invoke('search:messages', searchQuery),
    getStats: () => ipcRenderer.invoke('search:get-stats'),
    rebuildIndex: () => ipcRenderer.invoke('search:rebuild-index'),
    optimizeIndex: () => ipcRenderer.invoke('search:optimize-index'),
    getIndexStatus: () => ipcRenderer.invoke('search:get-index-status')
  },
  llm: {
    setProvider: (config: any) => ipcRenderer.invoke('llm:setProvider', config),
    sendMessage: (message: string | any[], chatId: string, messageId: string) => 
      ipcRenderer.invoke('llm:sendMessage', message, chatId, messageId),
    getConfig: () => ipcRenderer.invoke('llm:getConfig'),
    isConfigured: () => ipcRenderer.invoke('llm:isConfigured'),
    setToolsEnabled: (enabled: boolean) => ipcRenderer.invoke('llm:setToolsEnabled', enabled),
    getToolsEnabled: () => ipcRenderer.invoke('llm:getToolsEnabled'),
    getAllProviders: () => ipcRenderer.invoke('llm:getAllProviders'),
    // Custom provider methods
    addCustomProvider: (config: any) => ipcRenderer.invoke('llm:addCustomProvider', config),
    updateCustomProvider: (id: string, updates: any) => 
      ipcRenderer.invoke('llm:updateCustomProvider', id, updates),
    removeCustomProvider: (id: string) => ipcRenderer.invoke('llm:removeCustomProvider', id),
    getAllCustomProviders: () => ipcRenderer.invoke('llm:getAllCustomProviders'),
    getCustomProvider: (id: string) => ipcRenderer.invoke('llm:getCustomProvider', id),
    checkCustomProviderHealth: (id: string) => 
      ipcRenderer.invoke('llm:checkCustomProviderHealth', id),
    checkAllCustomProvidersHealth: () => 
      ipcRenderer.invoke('llm:checkAllCustomProvidersHealth'),
    getAllProviderHealthStatuses: () => 
      ipcRenderer.invoke('llm:getAllProviderHealthStatuses'),
    getCustomProviderHealth: (id: string) => 
      ipcRenderer.invoke('llm:getCustomProviderHealth', id),
    exportCustomProviders: () => ipcRenderer.invoke('llm:exportCustomProviders'),
    importCustomProviders: (providers: any[]) => 
      ipcRenderer.invoke('llm:importCustomProviders', providers),
    onChunk: (callback: (data: any) => void) => {
      const handler = (_: any, data: any) => callback(data)
      ipcRenderer.on('llm:chunk', handler)
      return () => ipcRenderer.removeListener('llm:chunk', handler)
    },
    onStatus: (callback: (data: any) => void) => {
      const handler = (_: any, data: any) => callback(data)
      ipcRenderer.on('llm:status', handler)
      return () => ipcRenderer.removeListener('llm:status', handler)
    },
    onToolCall: (callback: (data: any) => void) => {
      const handler = (_: any, data: any) => callback(data)
      ipcRenderer.on('llm:tool-call', handler)
      return () => ipcRenderer.removeListener('llm:tool-call', handler)
    }
  },
  file: {
    select: () => ipcRenderer.invoke('file:select'),
    paste: (dataUrl: string) => ipcRenderer.invoke('file:paste', dataUrl)
  },
  shortcuts: {
    getAll: () => ipcRenderer.invoke('shortcuts:get-all'),
    on: (callback: (action: string) => void) => {
      const events = [
        'shortcut:new-chat',
        'shortcut:open-settings',
        'shortcut:focus-input',
        'shortcut:clear-chat',
        'shortcut:prev-chat',
        'shortcut:next-chat'
      ]
      
      events.forEach(event => {
        ipcRenderer.on(event, () => callback(event.replace('shortcut:', '')))
      })
    }
  },
  plugins: {
    getAll: () => ipcRenderer.invoke('plugins:get-all'),
    enable: (pluginId: string) => ipcRenderer.invoke('plugins:enable', pluginId),
    disable: (pluginId: string) => ipcRenderer.invoke('plugins:disable', pluginId)
  },
  export: {
    getChat: (chatId: string) => ipcRenderer.invoke('export:get-chat', chatId),
    getChats: (chatIds: string[]) => ipcRenderer.invoke('export:get-chats', chatIds),
    getAllChats: () => ipcRenderer.invoke('export:get-all-chats'),
    getMessages: (chatId: string) => ipcRenderer.invoke('export:get-messages', chatId),
    getChatsStream: (chatIds: string[], batchSize?: number) => 
      ipcRenderer.invoke('export:get-chats-stream', chatIds, batchSize),
    getMessagesStream: (chatId: string, offset?: number, limit?: number) => 
      ipcRenderer.invoke('export:get-messages-stream', chatId, offset, limit),
    onProgress: (callback: (data: any) => void) => {
      const handler = (_: any, data: any) => callback(data)
      ipcRenderer.on('export:progress', handler)
      return () => ipcRenderer.removeListener('export:progress', handler)
    }
  },
  // 通用invoke方法，为了向后兼容
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args)
}

console.log('[Preload] Script loaded, api object:', api)
console.log('[Preload] Context isolated:', process.contextIsolated)

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
    console.log('[Preload] API exposed to main world successfully')
  } catch (error) {
    console.error('[Preload] Failed to expose API:', error)
  }
} else {
  window.api = api
  console.log('[Preload] API attached to window directly')
}