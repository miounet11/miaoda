// @ts-nocheck
/**
 * 语义搜索增强服务
 * 提供智能语义理解和多源搜索能力
 */

import { ref } from 'vue'
import { userMemoryService } from '../memory/UserMemoryService'

// 搜索结果接口
export interface SearchResult {
  id: string
  type: 'chat' | 'message' | 'memory' | 'web' | 'file'
  title: string
  content: string
  excerpt: string
  relevanceScore: number
  source: string
  timestamp: Date
  metadata?: Record<string, any>
  highlights?: string[]
}

// 搜索上下文接口
export interface SearchContext {
  query: string
  previousQueries?: string[]
  userContext?: string
  filters?: SearchFilters
  limit?: number
}

// 搜索过滤器接口
export interface SearchFilters {
  types?: SearchResult['type'][]
  dateRange?: {
    start: Date
    end: Date
  }
  sources?: string[]
  minRelevance?: number
}

// 语义分析结果
export interface SemanticAnalysis {
  intent: 'question' | 'command' | 'search' | 'conversation'
  entities: Array<{
    type: string
    value: string
    confidence: number
  }>
  keywords: string[]
  expandedQueries: string[]
  sentiment?: 'positive' | 'neutral' | 'negative'
}

class SemanticSearchService {
  private static instance: SemanticSearchService
  private searchHistory = ref<SearchContext[]>([])
  private cachedResults = new Map<string, SearchResult[]>()
  private semanticCache = new Map<string, SemanticAnalysis>()

  // 同义词词典
  private synonyms = new Map<string, string[]>([
    ['编程', ['编码', '开发', '写代码', 'coding', 'programming']],
    ['学习', ['学习', '教育', '培训', '课程', '知识']],
    ['工作', ['工作', '职业', '事业', '任务', '项目']],
    ['健康', ['健康', '健身', '运动', '养生', '医疗']],
    ['美食', ['美食', '烹饪', '菜谱', '食物', '餐饮']]
  ])

  private constructor() {
    this.initializeService()
  }

  static getInstance(): SemanticSearchService {
    if (!SemanticSearchService.instance) {
      SemanticSearchService.instance = new SemanticSearchService()
    }
    return SemanticSearchService.instance
  }

  // 初始化服务
  private initializeService() {
    // 加载搜索历史
    const saved = localStorage.getItem('search_history')
    if (saved) {
      try {
        this.searchHistory.value = JSON.parse(saved)
      } catch (error) {
        console.error('Failed to load search history:', error)
      }
    }
  }

  // 执行语义搜索
  async search(context: SearchContext): Promise<SearchResult[]> {
    // 检查缓存
    const cacheKey = this.getCacheKey(context)
    if (this.cachedResults.has(cacheKey)) {
      return this.cachedResults.get(cacheKey)!
    }

    // 语义分析
    const analysis = await this.analyzeQuery(context.query)

    // 扩展查询
    const expandedQueries = this.expandQuery(context.query, analysis)

    // 多源搜索
    const results = await this.performMultiSourceSearch(expandedQueries, context)

    // 语义排序
    const rankedResults = this.rankByRelevance(results, context, analysis)

    // 缓存结果
    this.cachedResults.set(cacheKey, rankedResults)

    // 记录搜索历史
    this.addToHistory(context)

    // 更新用户记忆
    this.updateUserMemory(context, rankedResults)

    return rankedResults
  }

  // 分析查询语义
  private async analyzeQuery(query: string): Promise<SemanticAnalysis> {
    // 检查缓存
    if (this.semanticCache.has(query)) {
      return this.semanticCache.get(query)!
    }

    // 简单的语义分析实现
    const analysis: SemanticAnalysis = {
      intent: this.detectIntent(query),
      entities: this.extractEntities(query),
      keywords: this.extractKeywords(query),
      expandedQueries: [],
      sentiment: this.analyzeSentiment(query)
    }

    // 缓存分析结果
    this.semanticCache.set(query, analysis)

    return analysis
  }

  // 检测查询意图
  private detectIntent(query: string): SemanticAnalysis['intent'] {
    const lowerQuery = query.toLowerCase()

    // 问题模式
    if (
      lowerQuery.includes('什么') ||
      lowerQuery.includes('为什么') ||
      lowerQuery.includes('怎么') ||
      lowerQuery.includes('如何') ||
      lowerQuery.includes('吗') ||
      lowerQuery.includes('呢') ||
      lowerQuery.includes('?') ||
      lowerQuery.includes('？')
    ) {
      return 'question'
    }

    // 命令模式
    if (
      lowerQuery.includes('帮我') ||
      lowerQuery.includes('请') ||
      lowerQuery.includes('生成') ||
      lowerQuery.includes('创建') ||
      lowerQuery.includes('打开') ||
      lowerQuery.includes('执行')
    ) {
      return 'command'
    }

    // 搜索模式
    if (
      lowerQuery.includes('搜索') ||
      lowerQuery.includes('查找') ||
      lowerQuery.includes('找') ||
      lowerQuery.includes('查')
    ) {
      return 'search'
    }

    // 默认为对话
    return 'conversation'
  }

  // 提取实体
  private extractEntities(
    query: string
  ): Array<{ type: string; value: string; confidence: number }> {
    const entities: Array<{ type: string; value: string; confidence: number }> = []

    // 时间实体
    const timePatterns = [
      /今天|明天|昨天|本周|上周|下周|本月|上月|下月/g,
      /\d{4}年\d{1,2}月\d{1,2}日/g,
      /\d{1,2}月\d{1,2}日/g,
      /\d{1,2}:\d{2}/g
    ]

    timePatterns.forEach(pattern => {
      const matches = query.match(pattern)
      if (matches) {
        matches.forEach(match => {
          entities.push({
            type: 'time',
            value: match,
            confidence: 0.9
          })
        })
      }
    })

    // 地点实体
    const locationPatterns = [/北京|上海|广州|深圳|杭州|成都|武汉|西安|南京|重庆/g]

    locationPatterns.forEach(pattern => {
      const matches = query.match(pattern)
      if (matches) {
        matches.forEach(match => {
          entities.push({
            type: 'location',
            value: match,
            confidence: 0.85
          })
        })
      }
    })

    // 数字实体
    const numberPattern = /\d+/g
    const numbers = query.match(numberPattern)
    if (numbers) {
      numbers.forEach(num => {
        entities.push({
          type: 'number',
          value: num,
          confidence: 1.0
        })
      })
    }

    return entities
  }

  // 提取关键词
  private extractKeywords(query: string): string[] {
    // 移除停用词
    const stopWords = new Set([
      '的',
      '了',
      '在',
      '是',
      '我',
      '你',
      '他',
      '她',
      '它',
      '这',
      '那',
      '有',
      '和',
      '与',
      '或',
      '但',
      '因为',
      '所以',
      'the',
      'a',
      'an',
      'is',
      'are',
      'was',
      'were',
      'be',
      'been'
    ])

    // 分词（简单实现）
    const words = query
      .split(/[\s,，。.!！?？;；]+/)
      .filter(word => word.length > 1 && !stopWords.has(word.toLowerCase()))

    return [...new Set(words)]
  }

  // 分析情感
  private analyzeSentiment(query: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['好', '棒', '优秀', '喜欢', '开心', '快乐', '感谢']
    const negativeWords = ['差', '糟糕', '讨厌', '难过', '失望', '生气', '问题']

    const lowerQuery = query.toLowerCase()
    let score = 0

    positiveWords.forEach(word => {
      if (lowerQuery.includes(word)) score++
    })

    negativeWords.forEach(word => {
      if (lowerQuery.includes(word)) score--
    })

    if (score > 0) return 'positive'
    if (score < 0) return 'negative'
    return 'neutral'
  }

  // 扩展查询
  private expandQuery(query: string, analysis: SemanticAnalysis): string[] {
    const expanded = new Set<string>([query])

    // 添加同义词扩展
    analysis.keywords.forEach(keyword => {
      const synonymList = this.getSynonyms(keyword)
      synonymList.forEach(synonym => {
        const expandedQuery = query.replace(keyword, synonym)
        expanded.add(expandedQuery)
      })
    })

    // 添加实体变体
    analysis.entities.forEach(entity => {
      if (entity.type === 'time') {
        // 时间实体扩展
        const timeVariants = this.getTimeVariants(entity.value)
        timeVariants.forEach(variant => {
          const expandedQuery = query.replace(entity.value, variant)
          expanded.add(expandedQuery)
        })
      }
    })

    return Array.from(expanded).slice(0, 5) // 限制扩展数量
  }

  // 获取同义词
  private getSynonyms(word: string): string[] {
    // 检查精确匹配
    if (this.synonyms.has(word)) {
      return this.synonyms.get(word)!
    }

    // 检查是否是某个同义词组的成员
    for (const [key, values] of this.synonyms.entries()) {
      if (values.includes(word)) {
        return [key, ...values.filter(v => v !== word)]
      }
    }

    return []
  }

  // 获取时间变体
  private getTimeVariants(timeStr: string): string[] {
    const variants: string[] = []

    if (timeStr === '今天') {
      variants.push('当天', '今日', 'today')
    } else if (timeStr === '明天') {
      variants.push('次日', '明日', 'tomorrow')
    } else if (timeStr === '昨天') {
      variants.push('前一天', '昨日', 'yesterday')
    }

    return variants
  }

  // 执行多源搜索
  private async performMultiSourceSearch(
    queries: string[],
    context: SearchContext
  ): Promise<SearchResult[]> {
    const allResults: SearchResult[] = []

    // 搜索本地聊天记录
    const chatResults = await this.searchLocalChats(queries, context)
    allResults.push(...chatResults)

    // 搜索用户记忆
    const memoryResults = await this.searchUserMemories(queries, context)
    allResults.push(...memoryResults)

    // 搜索文件（如果启用）
    if (!context.filters || context.filters.types?.includes('file')) {
      const fileResults = await this.searchFiles(queries, context)
      allResults.push(...fileResults)
    }

    // 搜索网络（如果启用）
    if (!context.filters || context.filters.types?.includes('web')) {
      const webResults = await this.searchWeb(queries, context)
      allResults.push(...webResults)
    }

    return allResults
  }

  // 搜索本地聊天记录
  private async searchLocalChats(
    queries: string[],
    _context: SearchContext
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = []

    // 这里应该调用实际的数据库搜索
    // 示例实现
    queries.forEach(query => {
      // 模拟搜索结果
      const mockResult: SearchResult = {
        id: `chat_${Date.now()}_${Math.random()}`,
        type: 'chat',
        title: `关于"${query}"的对话`,
        content: `之前讨论过${query}相关的内容...`,
        excerpt: `...${query}...`,
        relevanceScore: 0.8,
        source: 'local_chats',
        timestamp: new Date(),
        metadata: {
          chatId: 'chat_123',
          messageCount: 10
        }
      }
      results.push(mockResult)
    })

    return results
  }

  // 搜索用户记忆
  private async searchUserMemories(
    queries: string[],
    _context: SearchContext
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = []

    queries.forEach(query => {
      const memories = userMemoryService.searchMemories(query)
      memories.forEach(memory => {
        results.push({
          id: memory.id,
          type: 'memory',
          title: `记忆: ${memory.content.substring(0, 30)}...`,
          content: memory.content,
          excerpt: memory.content.substring(0, 100),
          relevanceScore: memory.importance / 10,
          source: 'user_memory',
          timestamp: memory.timestamp,
          metadata: {
            tags: memory.tags,
            type: memory.type
          }
        })
      })
    })

    return results
  }

  // 搜索文件
  private async searchFiles(_queries: string[], _context: SearchContext): Promise<SearchResult[]> {
    // 这里应该实现实际的文件搜索
    // 暂时返回空数组 (queries 和 context 参数保留给将来实现)
    return []
  }

  // 搜索网络
  private async searchWeb(_queries: string[], _context: SearchContext): Promise<SearchResult[]> {
    // 这里应该调用网络搜索API
    // 暂时返回模拟结果
    const results: SearchResult[] = []

    _queries.forEach(query => {
      results.push({
        id: `web_${Date.now()}_${Math.random()}`,
        type: 'web',
        title: `网络搜索: ${query}`,
        content: `从网络找到关于${query}的相关信息...`,
        excerpt: `${query}的定义和解释...`,
        relevanceScore: 0.7,
        source: 'web_search',
        timestamp: new Date(),
        metadata: {
          url: `https://example.com/search?q=${encodeURIComponent(query)}`
        }
      })
    })

    return results
  }

  // 按相关性排序
  private rankByRelevance(
    results: SearchResult[],
    context: SearchContext,
    analysis: SemanticAnalysis
  ): SearchResult[] {
    // 计算每个结果的综合得分
    const scoredResults = results.map(result => {
      let score = result.relevanceScore

      // 根据用户偏好调整
      const userMemory = userMemoryService.getCurrentMemory()
      if (userMemory) {
        // 偏好话题加分
        userMemory.preferences.favoriteTopics.forEach(topic => {
          if (result.content.toLowerCase().includes(topic.toLowerCase())) {
            score += 0.1
          }
        })

        // 不喜欢的话题减分
        userMemory.preferences.dislikedTopics.forEach(topic => {
          if (result.content.toLowerCase().includes(topic.toLowerCase())) {
            score -= 0.2
          }
        })
      }

      // 根据意图调整
      if (analysis.intent === 'question' && result.type === 'web') {
        score += 0.05 // 问题倾向于网络搜索
      } else if (analysis.intent === 'conversation' && result.type === 'chat') {
        score += 0.1 // 对话倾向于历史聊天
      }

      // 时间衰减
      const daysSince = (Date.now() - result.timestamp.getTime()) / (1000 * 60 * 60 * 24)
      score *= Math.exp(-daysSince / 30) // 30天半衰期

      return { result, score }
    })

    // 排序并返回
    return scoredResults
      .sort((a, b) => b.score - a.score)
      .map(item => item.result)
      .slice(0, context.limit || 20)
  }

  // 获取缓存键
  private getCacheKey(context: SearchContext): string {
    return JSON.stringify({
      query: context.query,
      filters: context.filters,
      limit: context.limit
    })
  }

  // 添加到历史
  private addToHistory(context: SearchContext) {
    this.searchHistory.value.unshift(context)

    // 限制历史记录数量
    if (this.searchHistory.value.length > 100) {
      this.searchHistory.value = this.searchHistory.value.slice(0, 100)
    }

    // 保存到本地
    localStorage.setItem('search_history', JSON.stringify(this.searchHistory.value))
  }

  // 更新用户记忆
  private updateUserMemory(context: SearchContext, results: SearchResult[]) {
    // 记录搜索行为
    userMemoryService.recordHabit('query', context.query)

    // 如果搜索结果有用，添加到记忆
    if (results.length > 0 && results[0].relevanceScore > 0.8) {
      userMemoryService.addMemory({
        type: 'context',
        content: `搜索了"${context.query}"并找到相关信息`,
        importance: 3,
        tags: ['search', ...this.extractKeywords(context.query)],
        source: 'inferred'
      })
    }
  }

  // 获取搜索建议
  async getSuggestions(partial: string): Promise<string[]> {
    const suggestions: string[] = []

    // 从历史记录中获取建议
    this.searchHistory.value.forEach(history => {
      if (history.query.toLowerCase().includes(partial.toLowerCase())) {
        suggestions.push(history.query)
      }
    })

    // 从用户记忆中获取建议
    const userMemory = userMemoryService.getCurrentMemory()
    if (userMemory) {
      // 常用查询
      const frequentQueries = Array.from(userMemory.habits.frequentQueries.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([query]) => query)
        .filter(query => query.toLowerCase().includes(partial.toLowerCase()))

      suggestions.push(...frequentQueries)
    }

    // 去重并限制数量
    return [...new Set(suggestions)].slice(0, 10)
  }

  // 清除缓存
  clearCache() {
    this.cachedResults.clear()
    this.semanticCache.clear()
  }

  // 获取搜索历史
  getSearchHistory(): SearchContext[] {
    return this.searchHistory.value
  }

  // 清除搜索历史
  clearHistory() {
    this.searchHistory.value = []
    localStorage.removeItem('search_history')
  }
}

// 导出单例
export const semanticSearchService = SemanticSearchService.getInstance()

// 导出Vue组合式API hook
export function useSemanticSearch() {
  const service = semanticSearchService

  return {
    search: (context: SearchContext) => service.search(context),
    getSuggestions: (partial: string) => service.getSuggestions(partial),
    getSearchHistory: () => service.getSearchHistory(),
    clearHistory: () => service.clearHistory(),
    clearCache: () => service.clearCache()
  }
}
