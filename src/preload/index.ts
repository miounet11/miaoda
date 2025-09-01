import { ipcRenderer } from 'electron'

// 简化的API，只保留核心功能
const api = {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  llm: {
    // 发送消息 - 简化的接口
    sendMessage: (messages: Array<{role: string, content: string}>) =>
      ipcRenderer.invoke('llm:send-message', messages),
    // 获取支持的提供商
    getProviders: () => ipcRenderer.invoke('llm:get-providers'),
    // 保存设置
    saveSettings: (settings: any) => ipcRenderer.invoke('llm:save-settings', settings),
    // 加载设置
    loadSettings: () => ipcRenderer.invoke('llm:load-settings')
  },
  // 通用invoke方法，为了向后兼容
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args)
}

console.log('[Preload] Script loaded, api object:', api)
console.log('[Preload] Context isolated:', process.contextIsolated)

// 简化的API暴露
;(window as any).electronAPI = api
;(window as any).api = api
console.log('[Preload] API exposed successfully')
