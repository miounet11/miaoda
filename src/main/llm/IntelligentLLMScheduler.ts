/**
 * 智能LLM调度系统
 * 根据任务类型、成本、性能等因素智能选择最优LLM
 */

// import { OpenAI } from 'openai' // Temporarily commented out as not currently used

// LLM模型定义
export interface LLMModel {
  id: string
  provider: 'openai' | 'anthropic' | 'gemini' | 'ollama' | 'default'
  name: string
  description: string
  capabilities: {
    maxTokens: number
    supportsFunctions: boolean
    supportsVision: boolean
    supportsStreaming: boolean
    languages: string[]
    specialties: string[] // 擅长领域
  }
  performance: {
    avgResponseTime: number // 平均响应时间(ms)
    successRate: number // 成功率(0-1)
    quality: number // 质量评分(0-10)
  }
  cost: {
    inputTokenPrice: number // 每1000 token价格
    outputTokenPrice: number
    freeQuota?: number // 免费额度
  }
  limits: {
    rateLimit: number // 每分钟请求限制
    dailyLimit?: number // 每日请求限制
  }
  status: 'available' | 'limited' | 'unavailable'
}

// 任务类型
export type TaskType =
  | 'chat' // 对话
  | 'code' // 编程
  | 'translation' // 翻译
  | 'summarization' // 摘要
  | 'creative' // 创作
  | 'analysis' // 分析
  | 'reasoning' // 推理
  | 'vision' // 视觉理解

// 调度策略
export interface SchedulingStrategy {
  priority: 'quality' | 'speed' | 'cost' | 'balanced'
  fallbackEnabled: boolean
  multiModelComparison: boolean
  cacheResults: boolean
}

// 任务上下文
export interface TaskContext {
  type: TaskType
  complexity: 'simple' | 'medium' | 'complex'
  urgency: 'low' | 'normal' | 'high'
  expectedTokens: number
  language?: string
  requiresVision?: boolean
  requiresFunctions?: boolean
  userPreference?: string // 用户偏好的模型
}

// 调度决策
export interface SchedulingDecision {
  primaryModel: LLMModel
  fallbackModels: LLMModel[]
  reasoning: string
  estimatedCost: number
  estimatedTime: number
  confidence: number
}

// 执行结果
export interface ExecutionResult {
  model: string
  success: boolean
  response?: string
  error?: string
  metrics: {
    tokensUsed: number
    responseTime: number
    cost: number
  }
}

class IntelligentLLMScheduler {
  private static instance: IntelligentLLMScheduler
  private models: Map<string, LLMModel> = new Map()
  private usageHistory: Map<string, ExecutionResult[]> = new Map()
  private strategy: SchedulingStrategy = {
    priority: 'balanced',
    fallbackEnabled: true,
    multiModelComparison: false,
    cacheResults: true,
  }

  // 模型配置
  private modelConfigs: LLMModel[] = [
    {
      id: 'gpt-4-turbo',
      provider: 'openai',
      name: 'GPT-4 Turbo',
      description: '最强大的通用模型',
      capabilities: {
        maxTokens: 128000,
        supportsFunctions: true,
        supportsVision: true,
        supportsStreaming: true,
        languages: ['all'],
        specialties: ['reasoning', 'code', 'creative', 'analysis'],
      },
      performance: {
        avgResponseTime: 3000,
        successRate: 0.98,
        quality: 9.5,
      },
      cost: {
        inputTokenPrice: 0.01,
        outputTokenPrice: 0.03,
      },
      limits: {
        rateLimit: 60,
        dailyLimit: 10000,
      },
      status: 'available',
    },
    {
      id: 'gpt-3.5-turbo',
      provider: 'openai',
      name: 'GPT-3.5 Turbo',
      description: '快速且经济的模型',
      capabilities: {
        maxTokens: 16385,
        supportsFunctions: true,
        supportsVision: false,
        supportsStreaming: true,
        languages: ['all'],
        specialties: ['chat', 'translation', 'summarization'],
      },
      performance: {
        avgResponseTime: 1000,
        successRate: 0.95,
        quality: 7.5,
      },
      cost: {
        inputTokenPrice: 0.001,
        outputTokenPrice: 0.002,
      },
      limits: {
        rateLimit: 120,
        dailyLimit: 50000,
      },
      status: 'available',
    },
    {
      id: 'claude-3-opus',
      provider: 'anthropic',
      name: 'Claude 3 Opus',
      description: '强大的推理和创作能力',
      capabilities: {
        maxTokens: 200000,
        supportsFunctions: false,
        supportsVision: true,
        supportsStreaming: true,
        languages: ['all'],
        specialties: ['reasoning', 'creative', 'analysis', 'code'],
      },
      performance: {
        avgResponseTime: 2500,
        successRate: 0.97,
        quality: 9.2,
      },
      cost: {
        inputTokenPrice: 0.015,
        outputTokenPrice: 0.075,
      },
      limits: {
        rateLimit: 40,
        dailyLimit: 5000,
      },
      status: 'available',
    },
    {
      id: 'gemini-pro',
      provider: 'gemini',
      name: 'Gemini Pro',
      description: 'Google的多模态模型',
      capabilities: {
        maxTokens: 32768,
        supportsFunctions: true,
        supportsVision: true,
        supportsStreaming: true,
        languages: ['all'],
        specialties: ['vision', 'analysis', 'translation'],
      },
      performance: {
        avgResponseTime: 2000,
        successRate: 0.94,
        quality: 8.0,
      },
      cost: {
        inputTokenPrice: 0.0005,
        outputTokenPrice: 0.0015,
        freeQuota: 1000,
      },
      limits: {
        rateLimit: 60,
        dailyLimit: 20000,
      },
      status: 'available',
    },
    {
      id: 'ollama-llama2',
      provider: 'ollama',
      name: 'Llama 2 (本地)',
      description: '本地运行的开源模型',
      capabilities: {
        maxTokens: 4096,
        supportsFunctions: false,
        supportsVision: false,
        supportsStreaming: true,
        languages: ['en', 'zh'],
        specialties: ['chat', 'code'],
      },
      performance: {
        avgResponseTime: 500,
        successRate: 0.90,
        quality: 6.5,
      },
      cost: {
        inputTokenPrice: 0,
        outputTokenPrice: 0,
      },
      limits: {
        rateLimit: 1000,
        dailyLimit: undefined,
      },
      status: 'available',
    },
    {
      id: 'default-ai',
      provider: 'default',
      name: 'MiaoDa AI',
      description: '内置免费AI模型',
      capabilities: {
        maxTokens: 2048,
        supportsFunctions: false,
        supportsVision: false,
        supportsStreaming: false,
        languages: ['zh', 'en'],
        specialties: ['chat'],
      },
      performance: {
        avgResponseTime: 100,
        successRate: 0.99,
        quality: 5.0,
      },
      cost: {
        inputTokenPrice: 0,
        outputTokenPrice: 0,
      },
      limits: {
        rateLimit: 1000,
        dailyLimit: undefined,
      },
      status: 'available',
    },
  ]

  private constructor() {
    this.initializeModels()
  }

  static getInstance(): IntelligentLLMScheduler {
    if (!IntelligentLLMScheduler.instance) {
      IntelligentLLMScheduler.instance = new IntelligentLLMScheduler()
    }
    return IntelligentLLMScheduler.instance
  }

  // 初始化模型
  private initializeModels() {
    this.modelConfigs.forEach(config => {
      this.models.set(config.id, config)
    })

    // 加载使用历史
    this.loadUsageHistory()
  }

  // 加载使用历史
  private loadUsageHistory() {
    try {
      const saved = localStorage.getItem('llm_usage_history')
      if (saved) {
        const history = JSON.parse(saved)
        Object.entries(history).forEach(([model, results]) => {
          this.usageHistory.set(model, results as ExecutionResult[])
        })
      }
    } catch (error) {
      console.error('Failed to load usage history:', error)
    }
  }

  // 保存使用历史
  private saveUsageHistory() {
    try {
      const history: Record<string, ExecutionResult[]> = {}
      this.usageHistory.forEach((results, model) => {
        history[model] = results.slice(-100) // 只保留最近100条
      })
      localStorage.setItem('llm_usage_history', JSON.stringify(history))
    } catch (error) {
      console.error('Failed to save usage history:', error)
    }
  }

  // 选择最优模型
  async selectOptimalModel(context: TaskContext): Promise<SchedulingDecision> {
    const availableModels = this.getAvailableModels(context)

    if (availableModels.length === 0) {
      throw new Error('没有可用的模型')
    }

    // 计算每个模型的得分
    const scoredModels = availableModels.map(model => ({
      model,
      score: this.calculateModelScore(model, context),
    }))

    // 排序
    scoredModels.sort((a, b) => b.score - a.score)

    // 选择主模型和备用模型
    const primaryModel = scoredModels[0].model
    const fallbackModels = scoredModels.slice(1, 3).map(item => item.model)

    // 生成决策理由
    const reasoning = this.generateDecisionReasoning(primaryModel, context)

    // 估算成本和时间
    const estimatedCost = this.estimateCost(primaryModel, context.expectedTokens)
    const estimatedTime = this.estimateTime(primaryModel, context)

    return {
      primaryModel,
      fallbackModels,
      reasoning,
      estimatedCost,
      estimatedTime,
      confidence: scoredModels[0].score / 10,
    }
  }

  // 获取可用模型
  private getAvailableModels(context: TaskContext): LLMModel[] {
    return Array.from(this.models.values()).filter(model => {
      // 检查状态
      if (model.status !== 'available') return false

      // 检查能力匹配
      if (context.requiresVision && !model.capabilities.supportsVision) return false
      if (context.requiresFunctions && !model.capabilities.supportsFunctions) return false

      // 检查语言支持
      if (context.language &&
          !model.capabilities.languages.includes('all') &&
          !model.capabilities.languages.includes(context.language)) {
        return false
      }

      // 检查令牌限制
      if (context.expectedTokens > model.capabilities.maxTokens) return false

      return true
    })
  }

  // 计算模型得分
  private calculateModelScore(model: LLMModel, context: TaskContext): number {
    let score = 0

    // 基础质量分
    score += model.performance.quality * 2

    // 任务匹配度
    const taskMatch = this.calculateTaskMatch(model, context.type)
    score += taskMatch * 3

    // 性能因素
    if (context.urgency === 'high') {
      score += (10 - model.performance.avgResponseTime / 1000) * 2
    } else {
      score += (10 - model.performance.avgResponseTime / 1000)
    }

    // 成本因素
    const costScore = this.calculateCostScore(model, context.expectedTokens)
    switch (this.strategy.priority) {
      case 'cost':
        score += costScore * 3
        break
      case 'quality':
        score += costScore * 0.5
        break
      case 'speed':
        score += costScore * 1
        break
      default:
        score += costScore * 1.5
    }

    // 成功率
    score += model.performance.successRate * 5

    // 用户偏好
    if (context.userPreference === model.id) {
      score += 5
    }

    // 历史表现
    const historicalScore = this.calculateHistoricalScore(model.id)
    score += historicalScore * 2

    return Math.min(100, Math.max(0, score))
  }

  // 计算任务匹配度
  private calculateTaskMatch(model: LLMModel, taskType: TaskType): number {
    const taskSpecialties: Record<TaskType, string[]> = {
      'chat': ['chat'],
      'code': ['code'],
      'translation': ['translation'],
      'summarization': ['summarization'],
      'creative': ['creative'],
      'analysis': ['analysis'],
      'reasoning': ['reasoning'],
      'vision': ['vision'],
    }

    const requiredSpecialties = taskSpecialties[taskType] || []
    const matchCount = requiredSpecialties.filter(spec =>
      model.capabilities.specialties.includes(spec),
    ).length

    return (matchCount / Math.max(1, requiredSpecialties.length)) * 10
  }

  // 计算成本得分
  private calculateCostScore(model: LLMModel, expectedTokens: number): number {
    const cost = this.estimateCost(model, expectedTokens)

    // 免费模型得满分
    if (cost === 0) return 10

    // 根据成本计算得分
    if (cost < 0.01) return 9
    if (cost < 0.05) return 7
    if (cost < 0.1) return 5
    if (cost < 0.5) return 3
    return 1
  }

  // 计算历史得分
  private calculateHistoricalScore(modelId: string): number {
    const history = this.usageHistory.get(modelId)
    if (!history || history.length === 0) return 5 // 默认中等分数

    // 计算最近10次的成功率
    const recent = history.slice(-10)
    const successRate = recent.filter(r => r.success).length / recent.length

    return successRate * 10
  }

  // 估算成本
  private estimateCost(model: LLMModel, tokens: number): number {
    const inputTokens = Math.floor(tokens * 0.3) // 假设输入占30%
    const outputTokens = Math.floor(tokens * 0.7) // 输出占70%

    const inputCost = (inputTokens / 1000) * model.cost.inputTokenPrice
    const outputCost = (outputTokens / 1000) * model.cost.outputTokenPrice

    return inputCost + outputCost
  }

  // 估算时间
  private estimateTime(model: LLMModel, context: TaskContext): number {
    let baseTime = model.performance.avgResponseTime

    // 根据复杂度调整
    switch (context.complexity) {
      case 'simple':
        baseTime *= 0.7
        break
      case 'complex':
        baseTime *= 1.5
        break
    }

    // 根据令牌数调整
    const tokenFactor = Math.min(2, context.expectedTokens / 1000)
    baseTime *= tokenFactor

    return Math.floor(baseTime)
  }

  // 生成决策理由
  private generateDecisionReasoning(model: LLMModel, context: TaskContext): string {
    const reasons: string[] = []

    // 任务匹配
    if (model.capabilities.specialties.includes(context.type)) {
      reasons.push(`${model.name}擅长${context.type}任务`)
    }

    // 性能优势
    if (model.performance.avgResponseTime < 1500) {
      reasons.push('响应速度快')
    }

    // 成本优势
    if (model.cost.inputTokenPrice === 0) {
      reasons.push('完全免费')
    } else if (model.cost.inputTokenPrice < 0.001) {
      reasons.push('成本极低')
    }

    // 质量优势
    if (model.performance.quality >= 9) {
      reasons.push('输出质量最高')
    }

    // 特殊能力
    if (context.requiresVision && model.capabilities.supportsVision) {
      reasons.push('支持图像理解')
    }

    return reasons.join('，') || `${model.name}综合表现最佳`
  }

  // 执行任务
  async executeTask(
    messages: Array<{ role: string; content: string }>,
    context: TaskContext,
  ): Promise<ExecutionResult> {
    const decision = await this.selectOptimalModel(context)

    // 尝试主模型
    let result = await this.executeWithModel(decision.primaryModel, messages)

    // 如果失败且启用了回退
    if (!result.success && this.strategy.fallbackEnabled && decision.fallbackModels.length > 0) {
      console.log(`主模型${decision.primaryModel.name}失败，尝试备用模型`)

      for (const fallbackModel of decision.fallbackModels) {
        result = await this.executeWithModel(fallbackModel, messages)
        if (result.success) break
      }
    }

    // 记录使用历史
    this.recordUsage(result)

    return result
  }

  // 使用特定模型执行
  private async executeWithModel(
    model: LLMModel,
    messages: Array<{ role: string; content: string }>,
  ): Promise<ExecutionResult> {
    const startTime = Date.now()

    try {
      // 根据不同提供商调用不同的API
      let response: string = ''
      let tokensUsed = 0

      switch (model.provider) {
        case 'openai':
          const result = await this.callOpenAI(model, messages)
          response = result.response
          tokensUsed = result.tokens
          break

        case 'anthropic':
          // 调用Anthropic API
          response = await this.callAnthropic(model, messages)
          break

        case 'gemini':
          // 调用Gemini API
          response = await this.callGemini(model, messages)
          break

        case 'ollama':
          // 调用本地Ollama
          response = await this.callOllama(model, messages)
          break

        case 'default':
          // 使用内置模型
          response = this.callDefault(messages)
          break
      }

      const responseTime = Date.now() - startTime
      const cost = this.estimateCost(model, tokensUsed)

      return {
        model: model.id,
        success: true,
        response,
        metrics: {
          tokensUsed,
          responseTime,
          cost,
        },
      }
    } catch (error) {
      return {
        model: model.id,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metrics: {
          tokensUsed: 0,
          responseTime: Date.now() - startTime,
          cost: 0,
        },
      }
    }
  }

  // 调用OpenAI
  private async callOpenAI(
    model: LLMModel,
    messages: Array<{ role: string; content: string }>,
  ): Promise<{ response: string; tokens: number }> {
    // 这里应该使用实际的OpenAI客户端
    // 暂时返回模拟结果
    await new Promise(resolve => setTimeout(resolve, model.performance.avgResponseTime))

    return {
      response: `来自${model.name}的回复: ${messages[messages.length - 1].content}`,
      tokens: 100,
    }
  }

  // 调用Anthropic
  private async callAnthropic(
    model: LLMModel,
    _messages: Array<{ role: string; content: string }>,
  ): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, model.performance.avgResponseTime))
    return `来自${model.name}的回复`
  }

  // 调用Gemini
  private async callGemini(
    model: LLMModel,
    _messages: Array<{ role: string; content: string }>,
  ): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, model.performance.avgResponseTime))
    return `来自${model.name}的回复`
  }

  // 调用Ollama
  private async callOllama(
    model: LLMModel,
    _messages: Array<{ role: string; content: string }>,
  ): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, model.performance.avgResponseTime))
    return `来自${model.name}的本地回复`
  }

  // 调用默认模型
  private callDefault(_messages: Array<{ role: string; content: string }>): string {
    // const lastMessage = messages[messages.length - 1].content // Not currently used
    const responses = [
      '我理解您的问题，让我来帮您解答...',
      '这是一个很好的问题！',
      '根据我的理解，我可以这样回答...',
      '让我为您提供一些建议...',
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }

  // 记录使用情况
  private recordUsage(result: ExecutionResult) {
    const history = this.usageHistory.get(result.model) || []
    history.push(result)

    // 限制历史记录数量
    if (history.length > 100) {
      history.shift()
    }

    this.usageHistory.set(result.model, history)
    this.saveUsageHistory()

    // 更新模型性能统计
    this.updateModelPerformance(result)
  }

  // 更新模型性能
  private updateModelPerformance(result: ExecutionResult) {
    const model = this.models.get(result.model)
    if (!model) return

    const history = this.usageHistory.get(result.model) || []
    if (history.length < 10) return // 数据太少不更新

    // 计算最近的平均响应时间
    const recentResults = history.slice(-20)
    const avgResponseTime = recentResults.reduce((sum, r) => sum + r.metrics.responseTime, 0) / recentResults.length

    // 计算成功率
    const successRate = recentResults.filter(r => r.success).length / recentResults.length

    // 更新模型性能
    model.performance.avgResponseTime = Math.floor(avgResponseTime)
    model.performance.successRate = successRate
  }

  // 比较多个模型
  async compareModels(
    messages: Array<{ role: string; content: string }>,
    context: TaskContext,
    modelIds?: string[],
  ): Promise<Map<string, ExecutionResult>> {
    const results = new Map<string, ExecutionResult>()

    // 选择要比较的模型
    const modelsToCompare = modelIds
      ? modelIds.map(id => this.models.get(id)).filter(Boolean) as LLMModel[]
      : this.getAvailableModels(context).slice(0, 3)

    // 并行执行
    const promises = modelsToCompare.map(model =>
      this.executeWithModel(model, messages),
    )

    const executionResults = await Promise.all(promises)

    // 整理结果
    modelsToCompare.forEach((model, index) => {
      results.set(model.id, executionResults[index])
    })

    return results
  }

  // 获取模型统计
  getModelStatistics(modelId: string): {
    totalRequests: number
    successRate: number
    avgResponseTime: number
    totalCost: number
  } | null {
    const history = this.usageHistory.get(modelId)
    if (!history || history.length === 0) return null

    const totalRequests = history.length
    const successCount = history.filter(r => r.success).length
    const successRate = successCount / totalRequests
    const avgResponseTime = history.reduce((sum, r) => sum + r.metrics.responseTime, 0) / totalRequests
    const totalCost = history.reduce((sum, r) => sum + r.metrics.cost, 0)

    return {
      totalRequests,
      successRate,
      avgResponseTime,
      totalCost,
    }
  }

  // 获取所有模型
  getAllModels(): LLMModel[] {
    return Array.from(this.models.values())
  }

  // 更新策略
  updateStrategy(strategy: Partial<SchedulingStrategy>) {
    this.strategy = { ...this.strategy, ...strategy }
  }

  // 获取当前策略
  getStrategy(): SchedulingStrategy {
    return this.strategy
  }

  // 重置统计
  resetStatistics(modelId?: string) {
    if (modelId) {
      this.usageHistory.delete(modelId)
    } else {
      this.usageHistory.clear()
    }
    this.saveUsageHistory()
  }
}

// 导出单例
export const llmScheduler = IntelligentLLMScheduler.getInstance()

// 类型已在上面定义并导出，无需重复导出
