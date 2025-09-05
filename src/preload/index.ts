import { ipcRenderer } from 'electron'

// 简化的API，只保留核心功能
const api = {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  // 数据库API
  db: {
    createChat: (chat: any) => ipcRenderer.invoke('db:create-chat', chat),
    updateChat: (id: string, title: string, updated_at: string) =>
      ipcRenderer.invoke('db:update-chat', id, title, updated_at),
    deleteChat: (id: string) => ipcRenderer.invoke('db:delete-chat', id),
    getChat: (id: string) => ipcRenderer.invoke('db:get-chat', id),
    getAllChats: () => ipcRenderer.invoke('db:get-all-chats'),
    createMessage: (message: any) => ipcRenderer.invoke('db:create-message', message),
    updateMessage: (messageId: string, content: string) =>
      ipcRenderer.invoke('db:update-message', messageId, content),
    getMessages: (chatId: string) => ipcRenderer.invoke('db:get-messages', chatId),
    searchChats: (query: string) => ipcRenderer.invoke('db:search-chats', query)
  },
  llm: {
    // 发送消息 - 简化的接口
    sendMessage: (content: string, chatId: string, messageId: string) =>
      ipcRenderer.invoke('llm:send-message', content, chatId, messageId),
    // 获取支持的提供商
    getProviders: () => ipcRenderer.invoke('llm:get-providers'),
    // 保存设置
    saveSettings: (settings: any) => ipcRenderer.invoke('llm:save-settings', settings),
    // 加载设置
    loadSettings: () => ipcRenderer.invoke('llm:load-settings'),
    // 流式响应监听器
    onChunk: (callback: (data: any) => void) => {
      ipcRenderer.on('llm:chunk', (_, data) => callback(data))
    },
    onStatus: (callback: (data: any) => void) => {
      ipcRenderer.on('llm:stream-complete', (_, data) => callback(data))
    }
  },
  // 增强模型配置API
  enhancedModel: {
    // 获取所有可用提供商
    getAllProviders: () => ipcRenderer.invoke('enhanced-model:get-all-providers'),
    // 测试提供商连接
    testConnection: (providerConfig: any) =>
      ipcRenderer.invoke('enhanced-model:test-connection', providerConfig),
    // 使用增强配置发送消息
    sendMessage: (messages: Array<{ role: string; content: string }>, modelConfig: any) =>
      ipcRenderer.invoke('enhanced-model:send-message', messages, modelConfig),
    // 保存配置
    saveConfig: (config: any) => ipcRenderer.invoke('enhanced-model:save-config', config),
    // 加载配置
    loadConfig: () => ipcRenderer.invoke('enhanced-model:load-config'),
    // 获取激活配置
    getActiveConfig: () => ipcRenderer.invoke('enhanced-model:get-active-config'),
    // 设置激活配置
    setActiveConfig: (config: any) => ipcRenderer.invoke('enhanced-model:set-active-config', config)
  },
  // 通用invoke方法，为了向后兼容
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args)
}

console.log('[Preload] Script loaded, api object:', api)
console.log('[Preload] Context isolated:', process.contextIsolated)
console.log('[Preload] API keys:', Object.keys(api))

// 立即暴露API到window对象
;(window as any).electronAPI = api
;(window as any).api = api

// 触发自定义事件通知API已准备就绪
const apiReadyEvent = new CustomEvent('api-ready', { detail: api })
window.dispatchEvent(apiReadyEvent)

console.log('[Preload] API exposed successfully')

// 验证API暴露
setTimeout(() => {
  console.log('[Preload] Verification - window.api exists:', !!(window as any).api)
  console.log('[Preload] Verification - window.api.db exists:', !!(window as any).api?.db)
  console.log(
    '[Preload] Verification - API keys on window:',
    Object.keys((window as any).api || {})
  )
}, 100)
