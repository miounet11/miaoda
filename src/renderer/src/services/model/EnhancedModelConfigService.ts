/**
 * 增强模型配置服务
 * 支持国内外主流大模型的便捷配置和管理
 */

import { ref, computed } from 'vue'

// 扩展模型提供商类型
export type ModelProviderType =
  | 'builtin'
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'ollama'
  | 'deepseek' // DeepSeek
  | 'qwen' // 通义千问
  | 'baidu' // 百度文心
  | 'zhipu' // 智谱清言
  | 'moonshot' // Kimi
  | 'minimax' // MiniMax
  | 'sensetime' // 商汤日日新
  | 'custom' // 自定义

// 模型提供商预设配置
export interface ModelProviderPreset {
  id: string
  name: string
  displayName: string
  description: string
  type: ModelProviderType
  icon: string
  category: 'domestic' | 'international' | 'local' | 'builtin'
  officialUrl: string
  requiresApiKey: boolean
  requiresBaseUrl?: boolean
  defaultBaseUrl?: string
  apiKeyPattern?: RegExp
  apiKeyPlaceholder?: string
  configFields?: ConfigField[]
  models?: ModelPreset[]
  popular?: boolean // 是否为热门选择
}

// 配置字段
export interface ConfigField {
  key: string
  label: string
  type: 'text' | 'password' | 'url' | 'select'
  placeholder?: string
  required: boolean
  validation?: RegExp | ((value: string) => boolean)
  options?: { label: string; value: string }[]
  description?: string
}

// 模型预设
export interface ModelPreset {
  id: string
  name: string
  displayName: string
  description: string
  contextLength: number
  maxTokens?: number
  pricing?: {
    input: number // 每1k token价格(元)
    output: number
    unit: 'RMB' | 'USD'
  }
  capabilities: {
    chat: boolean
    functions: boolean
    vision: boolean
    streaming: boolean
    chinese: boolean
  }
  recommended?: boolean
}

class EnhancedModelConfigService {
  private static instance: EnhancedModelConfigService
  // private providers = ref<ModelProviderPreset[]>([])
  private userConfigs = ref<{ [providerId: string]: any }>({})
  private isLoading = ref(false)

  // 国内外主流大模型预设配置
  private readonly presetProviders: ModelProviderPreset[] = [
    // ============ 内置/免费 ============
    {
      id: 'builtin',
      name: 'miaoda-ai',
      displayName: 'MiaoDa AI',
      description: '内置免费AI助手，快速响应无需配置',
      type: 'builtin',
      icon: '🐱',
      category: 'builtin',
      officialUrl: '',
      requiresApiKey: false,
      popular: true,
      models: [
        {
          id: 'miaoda-chat',
          name: 'miaoda-chat',
          displayName: 'MiaoDa Chat',
          description: '智能对话助手，完全免费',
          contextLength: 4096,
          capabilities: {
            chat: true,
            functions: false,
            vision: false,
            streaming: true,
            chinese: true
          },
          recommended: true
        }
      ]
    },

    // ============ 国内主流大模型 ============
    {
      id: 'deepseek',
      name: 'deepseek',
      displayName: 'DeepSeek',
      description: '深度求索 - 高性价比的国产大模型，编程能力突出',
      type: 'deepseek',
      icon: '🌊',
      category: 'domestic',
      officialUrl: 'https://www.deepseek.com',
      requiresApiKey: true,
      requiresBaseUrl: true,
      defaultBaseUrl: 'https://api.deepseek.com/v1',
      apiKeyPattern: /^sk-[a-zA-Z0-9]{48}$/,
      apiKeyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      popular: true,
      models: [
        {
          id: 'deepseek-chat',
          name: 'deepseek-chat',
          displayName: 'DeepSeek Chat',
          description: '通用对话模型，支持中英双语',
          contextLength: 32768,
          pricing: { input: 0.0014, output: 0.002, unit: 'RMB' },
          capabilities: {
            chat: true,
            functions: true,
            vision: false,
            streaming: true,
            chinese: true
          },
          recommended: true
        },
        {
          id: 'deepseek-coder',
          name: 'deepseek-coder',
          displayName: 'DeepSeek Coder',
          description: '专业代码生成模型，编程能力强悍',
          contextLength: 16384,
          pricing: { input: 0.0014, output: 0.002, unit: 'RMB' },
          capabilities: {
            chat: true,
            functions: true,
            vision: false,
            streaming: true,
            chinese: true
          }
        }
      ]
    },

    {
      id: 'qwen',
      name: 'qwen',
      displayName: '通义千问',
      description: '阿里云大模型 - 中文理解能力出色，多模态支持',
      type: 'qwen',
      icon: '🌟',
      category: 'domestic',
      officialUrl: 'https://tongyi.aliyun.com',
      requiresApiKey: true,
      requiresBaseUrl: true,
      defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      apiKeyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      popular: true,
      models: [
        {
          id: 'qwen-turbo',
          name: 'qwen-turbo',
          displayName: '通义千问-Turbo',
          description: '平衡性能和成本的经济选择',
          contextLength: 6144,
          pricing: { input: 0.003, output: 0.006, unit: 'RMB' },
          capabilities: {
            chat: true,
            functions: true,
            vision: false,
            streaming: true,
            chinese: true
          },
          recommended: true
        },
        {
          id: 'qwen-plus',
          name: 'qwen-plus',
          displayName: '通义千问-Plus',
          description: '增强版模型，更强的推理能力',
          contextLength: 32768,
          pricing: { input: 0.008, output: 0.02, unit: 'RMB' },
          capabilities: {
            chat: true,
            functions: true,
            vision: false,
            streaming: true,
            chinese: true
          }
        },
        {
          id: 'qwen-vl-plus',
          name: 'qwen-vl-plus',
          displayName: '通义千问-VL-Plus',
          description: '多模态模型，支持图像理解',
          contextLength: 8192,
          pricing: { input: 0.02, output: 0.02, unit: 'RMB' },
          capabilities: {
            chat: true,
            functions: false,
            vision: true,
            streaming: true,
            chinese: true
          }
        }
      ]
    },

    {
      id: 'baidu',
      name: 'ernie',
      displayName: '百度文心',
      description: '百度文心大模型 - 中文语言理解深度优化',
      type: 'baidu',
      icon: '🐻',
      category: 'domestic',
      officialUrl: 'https://cloud.baidu.com/product/wenxinworkshop',
      requiresApiKey: true,
      requiresBaseUrl: true,
      defaultBaseUrl: 'https://aip.baidubce.com',
      configFields: [
        {
          key: 'apiKey',
          label: 'API Key',
          type: 'password',
          required: true,
          placeholder: 'API Key'
        },
        {
          key: 'secretKey',
          label: 'Secret Key',
          type: 'password',
          required: true,
          placeholder: 'Secret Key'
        }
      ],
      models: [
        {
          id: 'ernie-4.0-8k',
          name: 'ernie-4.0-8k',
          displayName: '文心大模型 4.0',
          description: '最新一代大模型，理解生成能力全面提升',
          contextLength: 8192,
          pricing: { input: 0.12, output: 0.12, unit: 'RMB' },
          capabilities: {
            chat: true,
            functions: true,
            vision: false,
            streaming: true,
            chinese: true
          },
          recommended: true
        },
        {
          id: 'ernie-3.5-8k',
          name: 'ernie-3.5-8k',
          displayName: '文心大模型 3.5',
          description: '高性价比选择，适合日常对话',
          contextLength: 8192,
          pricing: { input: 0.008, output: 0.008, unit: 'RMB' },
          capabilities: {
            chat: true,
            functions: true,
            vision: false,
            streaming: true,
            chinese: true
          }
        }
      ]
    },

    {
      id: 'zhipu',
      name: 'glm',
      displayName: '智谱清言',
      description: '智谱AI GLM系列 - 清华技术支持，推理能力强',
      type: 'zhipu',
      icon: '🧠',
      category: 'domestic',
      officialUrl: 'https://www.zhipuai.cn',
      requiresApiKey: true,
      requiresBaseUrl: true,
      defaultBaseUrl: 'https://open.bigmodel.cn/api/paas/v4',
      apiKeyPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxx',
      models: [
        {
          id: 'glm-4',
          name: 'glm-4',
          displayName: 'GLM-4',
          description: '最新一代模型，多模态能力强',
          contextLength: 128000,
          pricing: { input: 0.1, output: 0.1, unit: 'RMB' },
          capabilities: {
            chat: true,
            functions: true,
            vision: true,
            streaming: true,
            chinese: true
          },
          recommended: true
        },
        {
          id: 'glm-3-turbo',
          name: 'glm-3-turbo',
          displayName: 'GLM-3-Turbo',
          description: '高速响应模型，性价比高',
          contextLength: 128000,
          pricing: { input: 0.005, output: 0.005, unit: 'RMB' },
          capabilities: {
            chat: true,
            functions: false,
            vision: false,
            streaming: true,
            chinese: true
          }
        }
      ]
    },

    {
      id: 'moonshot',
      name: 'moonshot',
      displayName: 'Kimi',
      description: 'Moonshot AI - 超长上下文，支持200万字文档',
      type: 'moonshot',
      icon: '🌙',
      category: 'domestic',
      officialUrl: 'https://www.moonshot.cn',
      requiresApiKey: true,
      requiresBaseUrl: true,
      defaultBaseUrl: 'https://api.moonshot.cn/v1',
      apiKeyPattern: /^sk-[a-zA-Z0-9]{48}$/,
      popular: true,
      models: [
        {
          id: 'moonshot-v1-8k',
          name: 'moonshot-v1-8k',
          displayName: 'Moonshot v1 8K',
          description: '经济实用，适合日常对话',
          contextLength: 8192,
          pricing: { input: 0.012, output: 0.012, unit: 'RMB' },
          capabilities: {
            chat: true,
            functions: false,
            vision: false,
            streaming: true,
            chinese: true
          }
        },
        {
          id: 'moonshot-v1-32k',
          name: 'moonshot-v1-32k',
          displayName: 'Moonshot v1 32K',
          description: '中等上下文长度，平衡性能',
          contextLength: 32768,
          pricing: { input: 0.024, output: 0.024, unit: 'RMB' },
          capabilities: {
            chat: true,
            functions: false,
            vision: false,
            streaming: true,
            chinese: true
          },
          recommended: true
        },
        {
          id: 'moonshot-v1-128k',
          name: 'moonshot-v1-128k',
          displayName: 'Moonshot v1 128K',
          description: '超长上下文，支持长文档分析',
          contextLength: 131072,
          pricing: { input: 0.06, output: 0.06, unit: 'RMB' },
          capabilities: {
            chat: true,
            functions: false,
            vision: false,
            streaming: true,
            chinese: true
          }
        }
      ]
    },

    {
      id: 'minimax',
      name: 'minimax',
      displayName: 'MiniMax',
      description: 'MiniMax海螺AI - 多模态交互体验优秀',
      type: 'minimax',
      icon: '🌀',
      category: 'domestic',
      officialUrl: 'https://www.minimaxi.com',
      requiresApiKey: true,
      requiresBaseUrl: true,
      defaultBaseUrl: 'https://api.minimax.chat/v1',
      models: [
        {
          id: 'abab6.5s-chat',
          name: 'abab6.5s-chat',
          displayName: 'abab6.5s',
          description: '高速响应聊天模型',
          contextLength: 245760,
          capabilities: {
            chat: true,
            functions: true,
            vision: false,
            streaming: true,
            chinese: true
          },
          recommended: true
        }
      ]
    },

    // ============ 国际主流大模型 ============
    {
      id: 'openai',
      name: 'openai',
      displayName: 'OpenAI',
      description: 'ChatGPT系列 - 全球领先的AI模型',
      type: 'openai',
      icon: '🤖',
      category: 'international',
      officialUrl: 'https://openai.com',
      requiresApiKey: true,
      requiresBaseUrl: true,
      defaultBaseUrl: 'https://api.openai.com/v1',
      apiKeyPattern: /^sk-[a-zA-Z0-9\-_]{48,}$/,
      apiKeyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      popular: true,
      models: [
        {
          id: 'gpt-4o',
          name: 'gpt-4o',
          displayName: 'GPT-4o',
          description: '最新旗舰模型，多模态能力强',
          contextLength: 128000,
          maxTokens: 4096,
          pricing: { input: 0.005, output: 0.015, unit: 'USD' },
          capabilities: {
            chat: true,
            functions: true,
            vision: true,
            streaming: true,
            chinese: true
          },
          recommended: true
        },
        {
          id: 'gpt-4-turbo',
          name: 'gpt-4-turbo',
          displayName: 'GPT-4 Turbo',
          description: '高性能模型，128K上下文',
          contextLength: 128000,
          pricing: { input: 0.01, output: 0.03, unit: 'USD' },
          capabilities: {
            chat: true,
            functions: true,
            vision: true,
            streaming: true,
            chinese: true
          }
        },
        {
          id: 'gpt-3.5-turbo',
          name: 'gpt-3.5-turbo',
          displayName: 'GPT-3.5 Turbo',
          description: '经济实用的经典选择',
          contextLength: 16385,
          pricing: { input: 0.0015, output: 0.002, unit: 'USD' },
          capabilities: {
            chat: true,
            functions: true,
            vision: false,
            streaming: true,
            chinese: true
          }
        }
      ]
    },

    {
      id: 'anthropic',
      name: 'claude',
      displayName: 'Claude',
      description: 'Anthropic Claude - 安全可靠的AI助手',
      type: 'anthropic',
      icon: '🎭',
      category: 'international',
      officialUrl: 'https://www.anthropic.com',
      requiresApiKey: true,
      requiresBaseUrl: true,
      defaultBaseUrl: 'https://api.anthropic.com',
      apiKeyPattern: /^sk-ant-[a-zA-Z0-9\-_]{95,}$/,
      popular: true,
      models: [
        {
          id: 'claude-3-5-sonnet-20241022',
          name: 'claude-3-5-sonnet-20241022',
          displayName: 'Claude 3.5 Sonnet',
          description: '最新最强的Claude模型',
          contextLength: 200000,
          pricing: { input: 0.003, output: 0.015, unit: 'USD' },
          capabilities: {
            chat: true,
            functions: true,
            vision: true,
            streaming: true,
            chinese: true
          },
          recommended: true
        },
        {
          id: 'claude-3-opus-20240229',
          name: 'claude-3-opus-20240229',
          displayName: 'Claude 3 Opus',
          description: '最强推理能力的Claude模型',
          contextLength: 200000,
          pricing: { input: 0.015, output: 0.075, unit: 'USD' },
          capabilities: {
            chat: true,
            functions: false,
            vision: true,
            streaming: true,
            chinese: true
          }
        }
      ]
    },

    {
      id: 'google',
      name: 'gemini',
      displayName: 'Gemini',
      description: 'Google Gemini - 多模态AI的先驱',
      type: 'google',
      icon: '💎',
      category: 'international',
      officialUrl: 'https://ai.google.dev',
      requiresApiKey: true,
      requiresBaseUrl: true,
      defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1',
      models: [
        {
          id: 'gemini-pro',
          name: 'gemini-pro',
          displayName: 'Gemini Pro',
          description: '强大的通用AI模型',
          contextLength: 32768,
          capabilities: {
            chat: true,
            functions: true,
            vision: false,
            streaming: true,
            chinese: true
          },
          recommended: true
        },
        {
          id: 'gemini-pro-vision',
          name: 'gemini-pro-vision',
          displayName: 'Gemini Pro Vision',
          description: '支持图像理解的多模态模型',
          contextLength: 16384,
          capabilities: {
            chat: true,
            functions: false,
            vision: true,
            streaming: true,
            chinese: true
          }
        }
      ]
    },

    // ============ 本地模型 ============
    {
      id: 'ollama',
      name: 'ollama',
      displayName: 'Ollama',
      description: '本地部署开源模型 - 隐私安全无限制',
      type: 'ollama',
      icon: '🦙',
      category: 'local',
      officialUrl: 'https://ollama.ai',
      requiresApiKey: false,
      requiresBaseUrl: true,
      defaultBaseUrl: 'http://localhost:11434',
      models: [
        // 模型列表将在连接测试时动态获取
      ]
    }
  ]

  private constructor() {
    // 异步加载配置
    this.loadConfig().catch(error => {
      console.error('Failed to initialize config:', error)
    })
  }

  static getInstance(): EnhancedModelConfigService {
    if (!EnhancedModelConfigService.instance) {
      EnhancedModelConfigService.instance = new EnhancedModelConfigService()
    }
    return EnhancedModelConfigService.instance
  }

  // 加载用户配置
  private async loadConfig() {
    try {
      // 从后端加载配置，而不是localStorage
      const electronAPI = (window as any).electronAPI || (window as any).api
      if (electronAPI?.enhancedModel?.loadConfig) {
        const saved = await electronAPI.enhancedModel.loadConfig()
        if (saved && typeof saved === 'object') {
          this.userConfigs.value = saved
        }
      }
    } catch (error) {
      console.error('Failed to load model configs:', error)
    }
  }

  // 保存用户配置
  private async saveConfig() {
    try {
      // 保存到后端，而不是localStorage
      const electronAPI = (window as any).electronAPI || (window as any).api
      if (electronAPI?.enhancedModel?.saveConfig) {
        await electronAPI.enhancedModel.saveConfig(this.userConfigs.value)
      }
    } catch (error) {
      console.error('Failed to save model configs:', error)
    }
  }

  // 获取所有预设提供商
  getPresetProviders() {
    return computed(() => this.presetProviders)
  }

  // 按分类获取提供商
  getProvidersByCategory(category: 'domestic' | 'international' | 'local' | 'builtin') {
    return computed(() => this.presetProviders.filter(p => p.category === category))
  }

  // 获取热门提供商
  getPopularProviders() {
    return computed(() => this.presetProviders.filter(p => p.popular))
  }

  // 获取已配置的提供商
  getConfiguredProviders() {
    return computed(() =>
      this.presetProviders.filter(
        p => p.type === 'builtin' || this.userConfigs.value[p.id]?.configured
      )
    )
  }

  // 获取提供商配置
  getProviderConfig(providerId: string) {
    return this.userConfigs.value[providerId] || {}
  }

  // 获取提供商状态
  getProviderStatus(providerId: string): 'configured' | 'unconfigured' | 'testing' | 'error' {
    const provider = this.presetProviders.find(p => p.id === providerId)
    if (!provider) return 'error'
    if (provider.type === 'builtin') return 'configured'

    const config = this.userConfigs.value[providerId]
    if (!config) return 'unconfigured'

    return config.configured ? 'configured' : 'unconfigured'
  }

  // 更新提供商配置
  updateProviderConfig(providerId: string, config: any) {
    if (!this.userConfigs.value[providerId]) {
      this.userConfigs.value[providerId] = {}
    }

    this.userConfigs.value[providerId] = {
      ...this.userConfigs.value[providerId],
      ...config,
      lastUpdated: new Date().toISOString()
    }

    this.saveConfig()
  }

  // 测试提供商连接
  async testProviderConnection(
    providerId: string
  ): Promise<{ success: boolean; message: string; models?: ModelPreset[] }> {
    const provider = this.presetProviders.find(p => p.id === providerId)
    if (!provider) {
      return { success: false, message: '未找到指定的提供商' }
    }

    const config = this.userConfigs.value[providerId]
    if (!config && provider.requiresApiKey) {
      return { success: false, message: '请先配置API密钥' }
    }

    this.isLoading.value = true

    try {
      // 使用后端API测试连接
      const electronAPI = (window as any).electronAPI || (window as any).api
      if (!electronAPI?.enhancedModel?.testConnection) {
        throw new Error('后端API不可用')
      }

      // 构造测试配置
      const testConfig = {
        providerId,
        apiKey: config?.apiKey,
        baseUrl: config?.baseUrl || provider.defaultBaseUrl,
        model: config?.model || provider.models?.[0]?.id,
        secretKey: config?.secretKey, // 百度文心需要
        headers: config?.headers,
        parameters: config?.parameters
      }

      const result = await electronAPI.enhancedModel.testConnection(testConfig)

      if (result.success) {
        this.updateProviderConfig(providerId, {
          configured: true,
          models: result.models || provider.models,
          lastTested: new Date().toISOString()
        })
      }

      return {
        success: result.success,
        message: result.message,
        models: result.models || provider.models
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '连接测试失败'
      }
    } finally {
      this.isLoading.value = false
    }
  }

  // 已移除旧的本地测试方法，现在使用后端API进行连接测试

  // 使用增强模型配置发送消息
  async sendMessage(
    messages: Array<{ role: string; content: string }>,
    providerId: string,
    modelId?: string
  ): Promise<string> {
    const provider = this.presetProviders.find(p => p.id === providerId)
    if (!provider) {
      throw new Error('未找到指定的提供商')
    }

    const config = this.userConfigs.value[providerId]
    if (!config || !config.configured) {
      throw new Error('提供商未配置或未通过连接测试')
    }

    const electronAPI = (window as any).electronAPI || (window as any).api
    if (!electronAPI?.enhancedModel?.sendMessage) {
      throw new Error('后端API不可用')
    }

    // 构造模型配置
    const modelConfig = {
      providerId,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || provider.defaultBaseUrl,
      model: modelId || config.model || provider.models?.[0]?.id,
      secretKey: config.secretKey, // 百度文心需要
      headers: config.headers,
      parameters: config.parameters
    }

    try {
      const response = await electronAPI.enhancedModel.sendMessage(messages, modelConfig)
      return response
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '消息发送失败')
    }
  }

  // 获取所有可用模型
  getAllAvailableModels(): ModelPreset[] {
    const allModels: ModelPreset[] = []

    for (const provider of this.presetProviders) {
      if (this.getProviderStatus(provider.id) === 'configured') {
        const config = this.userConfigs.value[provider.id]
        const models = config?.models || provider.models || []

        // 为每个模型添加提供商信息
        const modelsWithProvider = models.map((model: ModelPreset) => ({
          ...model,
          providerId: provider.id,
          providerName: provider.displayName,
          providerIcon: provider.icon
        }))

        allModels.push(...modelsWithProvider)
      }
    }

    return allModels
  }

  // 获取推荐模型
  getRecommendedModels(): ModelPreset[] {
    return this.getAllAvailableModels().filter(model => model.recommended)
  }

  // 添加自定义提供商
  addCustomProvider(customProvider: Omit<ModelProviderPreset, 'category'>) {
    const provider: ModelProviderPreset = {
      ...customProvider,
      category: 'domestic', // 默认归类为国内
      type: 'custom'
    }

    this.presetProviders.push(provider)
  }

  // 删除自定义提供商
  removeCustomProvider(providerId: string) {
    const index = this.presetProviders.findIndex(p => p.id === providerId && p.type === 'custom')
    if (index > -1) {
      this.presetProviders.splice(index, 1)
      delete this.userConfigs.value[providerId]
      this.saveConfig()
    }
  }

  get loading() {
    return computed(() => this.isLoading.value)
  }
}

// 导出单例实例
export const enhancedModelConfigService = EnhancedModelConfigService.getInstance()

// Vue 组合式 API
export function useEnhancedModelConfig() {
  const service = enhancedModelConfigService

  return {
    // 提供商管理
    presetProviders: service.getPresetProviders(),
    domesticProviders: service.getProvidersByCategory('domestic'),
    internationalProviders: service.getProvidersByCategory('international'),
    localProviders: service.getProvidersByCategory('local'),
    popularProviders: service.getPopularProviders(),
    configuredProviders: service.getConfiguredProviders(),

    // 配置管理
    getProviderConfig: (id: string) => service.getProviderConfig(id),
    getProviderStatus: (id: string) => service.getProviderStatus(id),
    updateProviderConfig: (id: string, config: any) => service.updateProviderConfig(id, config),
    testConnection: (id: string) => service.testProviderConnection(id),

    // 模型管理
    getAllModels: () => service.getAllAvailableModels(),
    getRecommendedModels: () => service.getRecommendedModels(),

    // 消息发送
    sendMessage: (
      messages: Array<{ role: string; content: string }>,
      providerId: string,
      modelId?: string
    ) => service.sendMessage(messages, providerId, modelId),

    // 自定义提供商
    addCustomProvider: (provider: any) => service.addCustomProvider(provider),
    removeCustomProvider: (id: string) => service.removeCustomProvider(id),

    // 状态
    loading: service.loading
  }
}
