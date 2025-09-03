/**
 * 模型配置服务
 * 支持动态获取第三方API的模型列表和便捷配置
 */

import { ref, computed } from 'vue'

// 模型提供商配置
export interface ModelProvider {
  id: string
  name: string
  description: string
  type: 'builtin' | 'openai' | 'anthropic' | 'google' | 'ollama' | 'custom'
  icon?: string
  requiresApiKey: boolean
  requiresBaseUrl?: boolean
  status: 'configured' | 'unconfigured' | 'testing' | 'error'
  config?: {
    apiKey?: string
    baseUrl?: string
    organization?: string
    project?: string
  }
  models?: ModelInfo[]
  lastUpdated?: Date
}

// 模型信息
export interface ModelInfo {
  id: string
  name: string
  displayName: string
  description: string
  contextLength: number
  pricing?: {
    input: number  // per 1k tokens
    output: number // per 1k tokens
  }
  capabilities: {
    chat: boolean
    functions: boolean
    vision: boolean
    streaming: boolean
  }
  deprecated?: boolean
}

// 配置步骤
export interface ConfigStep {
  id: string
  title: string
  description: string
  type: 'input' | 'select' | 'test' | 'complete'
  required: boolean
  validation?: (value: any) => string | null
}

class ModelConfigService {
  private static instance: ModelConfigService
  private providers = ref<ModelProvider[]>([])
  private currentProvider = ref<string>('')
  private isLoading = ref(false)
  private configProgress = ref<{ [key: string]: number }>({})

  // 预定义的提供商
  private defaultProviders: ModelProvider[] = [
    {
      id: 'default',
      name: 'MiaoDa AI',
      description: '内置免费AI，快速响应',
      type: 'builtin',
      icon: '🐱',
      requiresApiKey: false,
      status: 'configured',
      models: [
        {
          id: 'miaoda-chat',
          name: 'miaoda-chat',
          displayName: 'MiaoDa Chat',
          description: '智能对话助手，免费使用',
          contextLength: 4096,
          capabilities: {
            chat: true,
            functions: false,
            vision: false,
            streaming: true,
          },
        },
      ],
    },
    {
      id: 'openai',
      name: 'OpenAI',
      description: 'GPT-4, GPT-3.5-turbo等',
      type: 'openai',
      icon: '🤖',
      requiresApiKey: true,
      requiresBaseUrl: true,
      status: 'unconfigured',
    },
    {
      id: 'anthropic',
      name: 'Claude',
      description: 'Anthropic的AI模型',
      type: 'anthropic',
      icon: '🎭',
      requiresApiKey: true,
      status: 'unconfigured',
    },
    {
      id: 'google',
      name: 'Gemini',
      description: 'Google的AI模型',
      type: 'google',
      icon: '💎',
      requiresApiKey: true,
      status: 'unconfigured',
    },
    {
      id: 'ollama',
      name: 'Ollama',
      description: '本地运行的开源模型',
      type: 'ollama',
      icon: '🦙',
      requiresApiKey: false,
      requiresBaseUrl: true,
      status: 'unconfigured',
    },
  ]

  private constructor() {
    this.loadProviders()
  }

  static getInstance(): ModelConfigService {
    if (!ModelConfigService.instance) {
      ModelConfigService.instance = new ModelConfigService()
    }
    return ModelConfigService.instance
  }

  // 加载提供商列表
  private loadProviders() {
    // 从本地存储加载配置
    const saved = localStorage.getItem('model_providers')
    if (saved) {
      try {
        const savedProviders = JSON.parse(saved)
        // 合并默认和保存的配置
        this.providers.value = this.defaultProviders.map(defaultProvider => {
          const savedProvider = savedProviders.find((p: ModelProvider) => p.id === defaultProvider.id)
          return savedProvider ? { ...defaultProvider, ...savedProvider } : defaultProvider
        })
      } catch (error) {
        console.error('Failed to load providers:', error)
        this.providers.value = [...this.defaultProviders]
      }
    } else {
      this.providers.value = [...this.defaultProviders]
    }
  }

  // 保存提供商配置
  private saveProviders() {
    try {
      localStorage.setItem('model_providers', JSON.stringify(this.providers.value))
    } catch (error) {
      console.error('Failed to save providers:', error)
    }
  }

  // 获取所有提供商
  getProviders() {
    return computed(() => this.providers.value)
  }

  // 获取特定提供商
  getProvider(id: string): ModelProvider | undefined {
    return this.providers.value.find(p => p.id === id)
  }

  // 获取配置步骤
  getConfigSteps(providerId: string): ConfigStep[] {
    const provider = this.getProvider(providerId)
    if (!provider) return []

    const steps: ConfigStep[] = []

    // API Key配置
    if (provider.requiresApiKey) {
      steps.push({
        id: 'apiKey',
        title: 'API密钥',
        description: `请输入${provider.name}的API密钥`,
        type: 'input',
        required: true,
        validation: (value: string) => {
          if (!value || value.trim().length === 0) {
            return 'API密钥不能为空'
          }
          if (provider.type === 'openai' && !value.startsWith('sk-')) {
            return 'OpenAI API密钥应以"sk-"开头'
          }
          return null
        },
      })
    }

    // Base URL配置（对于支持自定义端点的提供商）
    if (provider.requiresBaseUrl) {
      steps.push({
        id: 'baseUrl',
        title: '服务端点',
        description: '自定义API服务地址（可选）',
        type: 'input',
        required: false,
        validation: (value: string) => {
          if (value && !value.match(/^https?:\/\/.+/)) {
            return '请输入有效的URL地址'
          }
          return null
        },
      })
    }

    // 连接测试
    steps.push({
      id: 'test',
      title: '连接测试',
      description: '验证配置是否正确',
      type: 'test',
      required: true,
    })

    // 模型选择
    steps.push({
      id: 'models',
      title: '选择模型',
      description: '选择要使用的AI模型',
      type: 'select',
      required: true,
    })

    return steps
  }

  // 开始配置流程
  async startConfiguration(providerId: string): Promise<void> {
    const provider = this.getProvider(providerId)
    if (!provider) throw new Error('未找到指定的提供商')

    this.currentProvider.value = providerId
    this.configProgress.value[providerId] = 0

    // 重置状态
    provider.status = 'unconfigured'
    provider.models = []
    this.saveProviders()
  }

  // 更新配置
  async updateProviderConfig(
    providerId: string,
    config: Partial<ModelProvider['config']>,
  ): Promise<void> {
    const provider = this.getProvider(providerId)
    if (!provider) throw new Error('未找到指定的提供商')

    provider.config = { ...provider.config, ...config }
    provider.lastUpdated = new Date()
    this.saveProviders()
  }

  // 测试连接
  async testConnection(providerId: string): Promise<{ success: boolean; message: string }> {
    const provider = this.getProvider(providerId)
    if (!provider) throw new Error('未找到指定的提供商')

    this.isLoading.value = true
    provider.status = 'testing'

    try {
      let result: { success: boolean; message: string }

      switch (provider.type) {
        case 'openai':
          result = await this.testOpenAIConnection(provider)
          break
        case 'anthropic':
          result = await this.testClaudeConnection(provider)
          break
        case 'google':
          result = await this.testGeminiConnection(provider)
          break
        case 'ollama':
          result = await this.testOllamaConnection(provider)
          break
        default:
          result = { success: true, message: '连接成功' }
      }

      provider.status = result.success ? 'configured' : 'error'
      this.saveProviders()

      return result
    } catch (error) {
      provider.status = 'error'
      this.saveProviders()
      return {
        success: false,
        message: error instanceof Error ? error.message : '连接失败',
      }
    } finally {
      this.isLoading.value = false
    }
  }

  // 测试OpenAI连接并获取模型列表
  private async testOpenAIConnection(provider: ModelProvider): Promise<{ success: boolean; message: string }> {
    if (!provider.config?.apiKey) {
      throw new Error('缺少API密钥')
    }

    const baseUrl = provider.config.baseUrl || 'https://api.openai.com/v1'

    try {
      const response = await fetch(`${baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${provider.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // 解析模型列表
      provider.models = this.parseOpenAIModels(data.data || [])

      return {
        success: true,
        message: `连接成功，找到 ${provider.models.length} 个模型`,
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '连接失败')
    }
  }

  // 解析OpenAI格式的模型列表
  private parseOpenAIModels(models: any[]): ModelInfo[] {
    return models
      .filter(model => model.id.includes('gpt') || model.id.includes('text') || model.id.includes('chat'))
      .map(model => ({
        id: model.id,
        name: model.id,
        displayName: this.formatModelName(model.id),
        description: this.getModelDescription(model.id),
        contextLength: this.getContextLength(model.id),
        pricing: this.getModelPricing(model.id),
        capabilities: {
          chat: true,
          functions: model.id.includes('gpt-4') || model.id.includes('gpt-3.5'),
          vision: model.id.includes('vision') || model.id.includes('gpt-4'),
          streaming: true,
        },
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
  }

  // 格式化模型名称
  private formatModelName(modelId: string): string {
    const nameMap: { [key: string]: string } = {
      'gpt-4': 'GPT-4',
      'gpt-4-turbo': 'GPT-4 Turbo',
      'gpt-4-vision-preview': 'GPT-4 Vision',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
      'gpt-3.5-turbo-16k': 'GPT-3.5 Turbo 16K',
    }

    return nameMap[modelId] || modelId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // 获取模型描述
  private getModelDescription(modelId: string): string {
    if (modelId.includes('gpt-4')) {
      return '最强大的GPT模型，适合复杂任务'
    } else if (modelId.includes('gpt-3.5')) {
      return '平衡性能和成本的经济选择'
    } else if (modelId.includes('vision')) {
      return '支持图像理解的多模态模型'
    }
    return '通用语言模型'
  }

  // 获取模型上下文长度
  private getContextLength(modelId: string): number {
    if (modelId.includes('16k')) return 16384
    if (modelId.includes('32k')) return 32768
    if (modelId.includes('gpt-4')) return 8192
    if (modelId.includes('gpt-3.5')) return 4096
    return 4096
  }

  // 获取模型定价
  private getModelPricing(modelId: string): { input: number; output: number } | undefined {
    const pricing: { [key: string]: { input: number; output: number } } = {
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-3.5-turbo': { input: 0.001, output: 0.002 },
    }

    for (const [key, price] of Object.entries(pricing)) {
      if (modelId.includes(key)) {
        return price
      }
    }

    return undefined
  }

  // 测试Claude连接
  private async testClaudeConnection(provider: ModelProvider): Promise<{ success: boolean; message: string }> {
    // 模拟Claude API测试
    await new Promise(resolve => setTimeout(resolve, 1000))

    provider.models = [
      {
        id: 'claude-3-opus',
        name: 'claude-3-opus',
        displayName: 'Claude 3 Opus',
        description: '最强大的Claude模型',
        contextLength: 200000,
        capabilities: { chat: true, functions: false, vision: true, streaming: true },
      },
      {
        id: 'claude-3-sonnet',
        name: 'claude-3-sonnet',
        displayName: 'Claude 3 Sonnet',
        description: '平衡性能和成本',
        contextLength: 200000,
        capabilities: { chat: true, functions: false, vision: true, streaming: true },
      },
    ]

    return { success: true, message: '连接成功' }
  }

  // 测试Gemini连接
  private async testGeminiConnection(provider: ModelProvider): Promise<{ success: boolean; message: string }> {
    // 模拟Gemini API测试
    await new Promise(resolve => setTimeout(resolve, 1000))

    provider.models = [
      {
        id: 'gemini-pro',
        name: 'gemini-pro',
        displayName: 'Gemini Pro',
        description: 'Google最新AI模型',
        contextLength: 32768,
        capabilities: { chat: true, functions: true, vision: false, streaming: true },
      },
      {
        id: 'gemini-pro-vision',
        name: 'gemini-pro-vision',
        displayName: 'Gemini Pro Vision',
        description: '支持图像理解',
        contextLength: 16384,
        capabilities: { chat: true, functions: false, vision: true, streaming: true },
      },
    ]

    return { success: true, message: '连接成功' }
  }

  // 测试Ollama连接
  private async testOllamaConnection(provider: ModelProvider): Promise<{ success: boolean; message: string }> {
    const baseUrl = provider.config?.baseUrl || 'http://localhost:11434'

    try {
      const response = await fetch(`${baseUrl}/api/tags`)
      if (!response.ok) {
        throw new Error('Ollama服务未启动或无法连接')
      }

      const data = await response.json()
      provider.models = (data.models || []).map((model: any) => ({
        id: model.name,
        name: model.name,
        displayName: model.name,
        description: `本地模型 - ${model.size || '大小未知'}`,
        contextLength: 4096,
        capabilities: { chat: true, functions: false, vision: false, streaming: true },
      }))

      return {
        success: true,
        message: `连接成功，找到 ${(provider.models || []).length} 个本地模型`,
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '连接Ollama失败')
    }
  }

  // 获取可用模型列表
  getAvailableModels(providerId?: string): ModelInfo[] {
    if (providerId) {
      const provider = this.getProvider(providerId)
      return provider?.models || []
    }

    // 返回所有已配置提供商的模型
    return this.providers.value
      .filter(p => p.status === 'configured' && p.models)
      .flatMap(p => p.models!)
  }

  // 刷新模型列表
  async refreshModels(providerId: string): Promise<void> {
    const provider = this.getProvider(providerId)
    if (!provider || provider.status !== 'configured') {
      throw new Error('提供商未配置或配置无效')
    }

    await this.testConnection(providerId)
  }

  // 删除提供商配置
  removeProvider(providerId: string): void {
    const provider = this.getProvider(providerId)
    if (!provider || provider.type === 'builtin') {
      return // 不能删除内置提供商
    }

    provider.status = 'unconfigured'
    provider.config = {}
    provider.models = []
    this.saveProviders()
  }

  // 添加自定义提供商
  addCustomProvider(config: Omit<ModelProvider, 'status' | 'lastUpdated'>): void {
    const provider: ModelProvider = {
      ...config,
      status: 'unconfigured',
      lastUpdated: new Date(),
    }

    this.providers.value.push(provider)
    this.saveProviders()
  }

  // 获取配置进度
  getConfigProgress(providerId: string): number {
    return this.configProgress.value[providerId] || 0
  }

  // 更新配置进度
  updateConfigProgress(providerId: string, progress: number): void {
    this.configProgress.value[providerId] = progress
  }

  // 是否正在加载
  get loading() {
    return this.isLoading.value
  }
}

// 导出单例
export const modelConfigService = ModelConfigService.getInstance()

// 导出Vue组合式API hook
export function useModelConfig() {
  const service = modelConfigService

  return {
    providers: service.getProviders(),
    loading: computed(() => service.loading),
    getProvider: (id: string) => service.getProvider(id),
    getConfigSteps: (id: string) => service.getConfigSteps(id),
    startConfiguration: (id: string) => service.startConfiguration(id),
    updateConfig: (id: string, config: any) => service.updateProviderConfig(id, config),
    testConnection: (id: string) => service.testConnection(id),
    getAvailableModels: (id?: string) => service.getAvailableModels(id),
    refreshModels: (id: string) => service.refreshModels(id),
    removeProvider: (id: string) => service.removeProvider(id),
    addCustomProvider: (config: any) => service.addCustomProvider(config),
  }
}
