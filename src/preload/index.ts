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
    loadSettings: () => ipcRenderer.invoke('llm:load-settings'),
  },
  // 增强模型配置API
  enhancedModel: {
    // 获取所有可用提供商
    getAllProviders: () => ipcRenderer.invoke('enhanced-model:get-all-providers'),
    // 测试提供商连接
    testConnection: (providerConfig: any) => ipcRenderer.invoke('enhanced-model:test-connection', providerConfig),
    // 使用增强配置发送消息
    sendMessage: (messages: Array<{role: string, content: string}>, modelConfig: any) =>
      ipcRenderer.invoke('enhanced-model:send-message', messages, modelConfig),
    // 保存配置
    saveConfig: (config: any) => ipcRenderer.invoke('enhanced-model:save-config', config),
    // 加载配置
    loadConfig: () => ipcRenderer.invoke('enhanced-model:load-config'),
    // 获取激活配置
    getActiveConfig: () => ipcRenderer.invoke('enhanced-model:get-active-config'),
    // 设置激活配置
    setActiveConfig: (config: any) => ipcRenderer.invoke('enhanced-model:set-active-config', config),
  },
  // 通用invoke方法，为了向后兼容
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
}

console.log('[Preload] Script loaded, api object:', api)
console.log('[Preload] Context isolated:', process.contextIsolated)

// 简化的API暴露
;(window as any).electronAPI = api
;(window as any).api = api
console.log('[Preload] API exposed successfully')
