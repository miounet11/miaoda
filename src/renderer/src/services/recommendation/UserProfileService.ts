/**
 * 用户画像分析服务
 */
import type { 
  UserProfile, 
  UserInterest, 
  ChatStyle, 
  KnowledgeDomain,
  MessageRecord,
  ChatRecord
} from '../../types'
import { TextProcessor } from './RecommendationAlgorithms'

export class UserProfileService {
  private textProcessor = new TextProcessor()

  /**
   * 生成用户画像
   */
  async generateUserProfile(
    userId: string,
    chats: ChatRecord[],
    messages: MessageRecord[]
  ): Promise<UserProfile> {
    const userMessages = messages.filter(msg => msg.role === 'user')
    const assistantMessages = messages.filter(msg => msg.role === 'assistant')

    // 基础统计信息
    const totalMessages = userMessages.length
    const totalChats = chats.length
    const averageSessionLength = this.calculateAverageSessionLength(chats, messages)

    // 分析用户兴趣
    const interests = await this.analyzeUserInterests(userMessages)

    // 分析聊天风格
    const chatStyle = this.analyzeChatStyle(userMessages)

    // 分析知识领域
    const knowledgeDomains = this.analyzeKnowledgeDomains(userMessages, assistantMessages)

    // 分析使用模式
    const activeHours = this.analyzeActiveHours(messages)
    const preferredModels = this.analyzePreferredModels(chats)
    const commonScenarios = this.analyzeCommonScenarios(userMessages)

    // 生成学习建议
    const learningGoals = this.generateLearningGoals(interests, knowledgeDomains)
    const completedTopics = this.identifyCompletedTopics(userMessages, assistantMessages)
    const suggestedTopics = this.generateSuggestedTopics(interests, knowledgeDomains)

    return {
      id: userId,
      created_at: new Date(),
      updated_at: new Date(),
      totalMessages,
      totalChats,
      averageSessionLength,
      interests,
      chatStyle,
      knowledgeDomains,
      activeHours,
      preferredModels,
      commonScenarios,
      learningGoals,
      completedTopics,
      suggestedTopics
    }
  }

  /**
   * 分析用户兴趣
   */
  private async analyzeUserInterests(userMessages: MessageRecord[]): Promise<UserInterest[]> {
    const allText = userMessages.map(msg => msg.content).join(' ')
    const keywords = this.textProcessor.extractKeywords(allText, 50)
    
    // 计算关键词频率和权重
    const keywordStats: Record<string, { count: number; contexts: string[] }> = {}
    
    userMessages.forEach(msg => {
      const tokens = this.textProcessor.tokenize(msg.content)
      tokens.forEach(token => {
        if (keywords.includes(token)) {
          if (!keywordStats[token]) {
            keywordStats[token] = { count: 0, contexts: [] }
          }
          keywordStats[token].count++
          keywordStats[token].contexts.push(msg.content.substring(0, 100))
        }
      })
    })

    const interests: UserInterest[] = Object.entries(keywordStats)
      .map(([keyword, stats]) => ({
        keyword,
        weight: Math.min(stats.count / userMessages.length, 1),
        category: this.categorizeKeyword(keyword, stats.contexts),
        lastUpdated: new Date(),
        frequency: stats.count
      }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 20)

    return interests
  }

  /**
   * 分析聊天风格
   */
  private analyzeChatStyle(userMessages: MessageRecord[]): ChatStyle {
    const messageLengths = userMessages.map(msg => msg.content.length)
    const averageMessageLength = messageLengths.reduce((sum, len) => sum + len, 0) / messageLengths.length

    // 计算词汇复杂度
    const allText = userMessages.map(msg => msg.content).join(' ')
    const uniqueWords = new Set(this.textProcessor.tokenize(allText))
    const totalWords = this.textProcessor.tokenize(allText).length
    const vocabularyComplexity = uniqueWords.size / totalWords

    // 计算问题比例
    const questionCount = userMessages.filter(msg => 
      msg.content.includes('?') || 
      msg.content.includes('？') ||
      msg.content.toLowerCase().startsWith('what') ||
      msg.content.toLowerCase().startsWith('how') ||
      msg.content.toLowerCase().startsWith('why') ||
      msg.content.startsWith('什么') ||
      msg.content.startsWith('怎么') ||
      msg.content.startsWith('为什么')
    ).length
    const questionRatio = questionCount / userMessages.length

    // 分析情感倾向
    const emotionalTone = this.analyzeEmotionalTone(userMessages)

    // 提取常用短语
    const commonPhrases = this.extractCommonPhrases(userMessages)

    // 分析偏好主题
    const preferredTopics = this.extractPreferredTopics(userMessages)

    // 判断交流模式
    const communicationPattern = this.determineCommunicationPattern(
      averageMessageLength,
      vocabularyComplexity,
      questionRatio
    )

    return {
      averageMessageLength,
      vocabularyComplexity,
      questionRatio,
      emotionalTone,
      commonPhrases,
      preferredTopics,
      communicationPattern
    }
  }

  /**
   * 分析知识领域
   */
  private analyzeKnowledgeDomains(
    userMessages: MessageRecord[], 
    assistantMessages: MessageRecord[]
  ): KnowledgeDomain[] {
    const domains = new Map<string, {
      messages: MessageRecord[]
      keywords: Set<string>
      complexity: number[]
    }>()

    // 预定义知识领域关键词
    const domainKeywords = {
      '编程开发': ['code', 'programming', '编程', '代码', 'javascript', 'python', 'react', 'vue', '开发', '软件'],
      '数据科学': ['data', 'analysis', '数据', '分析', 'machine learning', 'ai', '人工智能', '算法'],
      '设计创意': ['design', '设计', 'ui', 'ux', '创意', 'creative', '界面', '用户体验'],
      '商业管理': ['business', 'management', '商业', '管理', '市场', 'marketing', '运营', '战略'],
      '学术研究': ['research', '研究', 'academic', '学术', '论文', 'paper', '理论'],
      '技术支持': ['help', 'support', '帮助', '支持', 'troubleshoot', '问题', '解决'],
      '语言学习': ['language', 'learn', '语言', '学习', 'english', '英语', 'translation', '翻译'],
      '创作写作': ['writing', '写作', 'story', '故事', 'creative writing', '创意写作', '文案']
    }

    // 分析每个消息属于哪个领域
    userMessages.forEach(msg => {
      const tokens = this.textProcessor.tokenize(msg.content.toLowerCase())
      
      Object.entries(domainKeywords).forEach(([domain, keywords]) => {
        const matchCount = tokens.filter(token => 
          keywords.some(keyword => token.includes(keyword) || keyword.includes(token))
        ).length

        if (matchCount > 0) {
          if (!domains.has(domain)) {
            domains.set(domain, { messages: [], keywords: new Set(), complexity: [] })
          }
          
          const domainData = domains.get(domain)!
          domainData.messages.push(msg)
          tokens.forEach(token => domainData.keywords.add(token))
          domainData.complexity.push(msg.content.length)
        }
      })
    })

    // 转换为KnowledgeDomain格式
    const knowledgeDomains: KnowledgeDomain[] = Array.from(domains.entries())
      .map(([domain, data]) => {
        const messageCount = data.messages.length
        const avgComplexity = data.complexity.reduce((sum, c) => sum + c, 0) / data.complexity.length
        
        // 计算熟练度（基于消息复杂度和数量）
        const proficiencyLevel = Math.min(
          (messageCount * 5) + (avgComplexity / 10), 
          100
        )
        
        // 计算兴趣度（基于消息频率）
        const interestLevel = Math.min(
          (messageCount / userMessages.length) * 100, 
          100
        )

        return {
          domain,
          proficiencyLevel,
          interestLevel,
          messageCount,
          lastActivity: new Date(Math.max(...data.messages.map(msg => new Date(msg.created_at).getTime()))),
          subDomains: this.extractSubDomains(domain, Array.from(data.keywords)),
          relatedKeywords: Array.from(data.keywords).slice(0, 10)
        }
      })
      .filter(domain => domain.messageCount >= 2) // 至少2条消息才认为是有效领域
      .sort((a, b) => b.interestLevel - a.interestLevel)

    return knowledgeDomains
  }

  /**
   * 计算平均会话时长
   */
  private calculateAverageSessionLength(chats: ChatRecord[], messages: MessageRecord[]): number {
    const sessionLengths: number[] = []

    chats.forEach(chat => {
      const chatMessages = messages
        .filter(msg => msg.chat_id === chat.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

      if (chatMessages.length >= 2) {
        const startTime = new Date(chatMessages[0].created_at).getTime()
        const endTime = new Date(chatMessages[chatMessages.length - 1].created_at).getTime()
        const duration = (endTime - startTime) / (1000 * 60) // 转换为分钟
        sessionLengths.push(duration)
      }
    })

    return sessionLengths.length > 0 
      ? sessionLengths.reduce((sum, len) => sum + len, 0) / sessionLengths.length 
      : 0
  }

  /**
   * 分析活跃时间
   */
  private analyzeActiveHours(messages: MessageRecord[]): number[] {
    const hourCounts = new Array(24).fill(0)

    messages.forEach(msg => {
      const hour = new Date(msg.created_at).getHours()
      hourCounts[hour]++
    })

    // 归一化到0-100范围
    const maxCount = Math.max(...hourCounts)
    return hourCounts.map(count => maxCount > 0 ? (count / maxCount) * 100 : 0)
  }

  /**
   * 分析偏好模型
   */
  private analyzePreferredModels(chats: ChatRecord[]): { model: string; usage: number }[] {
    const modelUsage: Record<string, number> = {}

    chats.forEach(chat => {
      try {
        const settings = chat.settings ? JSON.parse(chat.settings) : null
        const model = settings?.model || 'unknown'
        modelUsage[model] = (modelUsage[model] || 0) + 1
      } catch {
        modelUsage['unknown'] = (modelUsage['unknown'] || 0) + 1
      }
    })

    return Object.entries(modelUsage)
      .map(([model, usage]) => ({ model, usage }))
      .sort((a, b) => b.usage - a.usage)
  }

  /**
   * 分析常用场景
   */
  private analyzeCommonScenarios(userMessages: MessageRecord[]): string[] {
    const scenarios = {
      '问答咨询': ['help', 'question', '帮助', '问题', 'how to', '怎么'],
      '创作协助': ['write', 'create', '写', '创作', 'generate', '生成'],
      '学习指导': ['learn', 'study', '学习', 'understand', '理解', 'explain'],
      '代码编程': ['code', 'programming', '代码', '编程', 'bug', 'debug'],
      '翻译服务': ['translate', 'translation', '翻译', 'english', '中文'],
      '分析总结': ['analyze', 'summary', '分析', '总结', 'summarize'],
      '头脑风暴': ['idea', 'brainstorm', '想法', '创意', 'creative', 'think']
    }

    const scenarioScores: Record<string, number> = {}

    Object.entries(scenarios).forEach(([scenario, keywords]) => {
      const relevantMessages = userMessages.filter(msg => 
        keywords.some(keyword => 
          msg.content.toLowerCase().includes(keyword.toLowerCase())
        )
      )
      scenarioScores[scenario] = relevantMessages.length
    })

    return Object.entries(scenarioScores)
      .filter(([, score]) => score > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([scenario]) => scenario)
  }

  // 辅助方法
  private categorizeKeyword(keyword: string, contexts: string[]): string {
    const categories = {
      '技术': ['code', 'programming', 'javascript', 'python', 'react', 'vue', 'css', 'html'],
      '学习': ['learn', 'study', 'understand', 'explain', 'tutorial'],
      '创作': ['write', 'create', 'story', 'design', 'creative'],
      '商业': ['business', 'market', 'sales', 'strategy', 'management'],
      '生活': ['daily', 'life', 'personal', 'family', 'health'],
      '娱乐': ['game', 'movie', 'music', 'entertainment', 'fun']
    }

    for (const [category, terms] of Object.entries(categories)) {
      if (terms.some(term => keyword.includes(term) || term.includes(keyword))) {
        return category
      }
    }

    return '通用'
  }

  private analyzeEmotionalTone(messages: MessageRecord[]): 'neutral' | 'positive' | 'negative' | 'mixed' {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', '好', '棒', '优秀', '很棒']
    const negativeWords = ['bad', 'terrible', 'awful', 'problem', 'error', '坏', '糟糕', '问题', '错误']

    let positiveCount = 0
    let negativeCount = 0

    messages.forEach(msg => {
      const content = msg.content.toLowerCase()
      positiveCount += positiveWords.filter(word => content.includes(word)).length
      negativeCount += negativeWords.filter(word => content.includes(word)).length
    })

    if (positiveCount > negativeCount * 1.5) return 'positive'
    if (negativeCount > positiveCount * 1.5) return 'negative'
    if (positiveCount > 0 && negativeCount > 0) return 'mixed'
    return 'neutral'
  }

  private extractCommonPhrases(messages: MessageRecord[]): string[] {
    const phrases: Record<string, number> = {}
    
    messages.forEach(msg => {
      // 简单的2-3词短语提取
      const words = msg.content.split(' ')
      for (let i = 0; i < words.length - 1; i++) {
        const phrase = words.slice(i, i + 2).join(' ').toLowerCase()
        if (phrase.length > 5) {
          phrases[phrase] = (phrases[phrase] || 0) + 1
        }
      }
    })

    return Object.entries(phrases)
      .filter(([, count]) => count >= 2)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([phrase]) => phrase)
  }

  private extractPreferredTopics(messages: MessageRecord[]): string[] {
    // 这里可以实现更复杂的主题建模
    // 简化版本：基于关键词频率
    const allText = messages.map(msg => msg.content).join(' ')
    return this.textProcessor.extractKeywords(allText, 10)
  }

  private determineCommunicationPattern(
    avgLength: number,
    complexity: number,
    questionRatio: number
  ): 'direct' | 'conversational' | 'formal' | 'casual' {
    if (avgLength < 50 && questionRatio < 0.3) return 'direct'
    if (avgLength > 150 && complexity > 0.7) return 'formal'
    if (questionRatio > 0.5) return 'conversational'
    return 'casual'
  }

  private extractSubDomains(domain: string, keywords: string[]): string[] {
    const subDomainMap: Record<string, string[]> = {
      '编程开发': ['前端开发', '后端开发', '移动开发', '数据库', '架构设计'],
      '数据科学': ['机器学习', '深度学习', '数据分析', '统计学', '可视化'],
      '设计创意': ['UI设计', 'UX设计', '平面设计', '产品设计', '交互设计']
    }

    return subDomainMap[domain] || keywords.slice(0, 5)
  }

  private generateLearningGoals(interests: UserInterest[], domains: KnowledgeDomain[]): string[] {
    const goals: string[] = []

    // 基于兴趣生成学习目标
    interests.slice(0, 3).forEach(interest => {
      goals.push(`深入学习${interest.keyword}相关知识`)
    })

    // 基于知识领域生成进阶目标
    domains.slice(0, 2).forEach(domain => {
      if (domain.proficiencyLevel < 80) {
        goals.push(`提高${domain.domain}专业水平`)
      }
    })

    return goals.slice(0, 5)
  }

  private identifyCompletedTopics(userMessages: MessageRecord[], assistantMessages: MessageRecord[]): string[] {
    // 简化实现：识别用户反复询问后获得满意答案的主题
    const topicInteractions: Record<string, number> = {}
    
    userMessages.forEach(msg => {
      const keywords = this.textProcessor.extractKeywords(msg.content, 5)
      keywords.forEach(keyword => {
        topicInteractions[keyword] = (topicInteractions[keyword] || 0) + 1
      })
    })

    // 假设交互次数较多的主题已经得到了充分讨论
    return Object.entries(topicInteractions)
      .filter(([, count]) => count >= 5)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([topic]) => topic)
  }

  private generateSuggestedTopics(interests: UserInterest[], domains: KnowledgeDomain[]): string[] {
    const suggestions: string[] = []

    // 基于兴趣扩展相关主题
    interests.slice(0, 3).forEach(interest => {
      suggestions.push(`${interest.keyword}的进阶应用`)
      suggestions.push(`${interest.keyword}最新发展`)
    })

    // 基于知识领域推荐交叉主题
    if (domains.length >= 2) {
      const domain1 = domains[0].domain
      const domain2 = domains[1].domain
      suggestions.push(`${domain1}与${domain2}的结合应用`)
    }

    return suggestions.slice(0, 10)
  }

  /**
   * 更新用户画像
   */
  async updateUserProfile(
    existingProfile: UserProfile,
    newMessages: MessageRecord[]
  ): Promise<UserProfile> {
    // 增量更新逻辑
    const userMessages = newMessages.filter(msg => msg.role === 'user')
    
    // 更新基础统计
    const updatedProfile = { ...existingProfile }
    updatedProfile.totalMessages += userMessages.length
    updatedProfile.updated_at = new Date()

    // 更新兴趣（增量分析）
    const newInterests = await this.analyzeUserInterests(userMessages)
    updatedProfile.interests = this.mergeInterests(existingProfile.interests, newInterests)

    // 更新其他字段...
    // 这里可以实现更精细的增量更新逻辑

    return updatedProfile
  }

  private mergeInterests(existing: UserInterest[], newInterests: UserInterest[]): UserInterest[] {
    const merged = new Map<string, UserInterest>()

    // 添加现有兴趣
    existing.forEach(interest => {
      merged.set(interest.keyword, interest)
    })

    // 合并新兴趣
    newInterests.forEach(newInterest => {
      const existing = merged.get(newInterest.keyword)
      if (existing) {
        // 更新权重和频率
        existing.weight = (existing.weight + newInterest.weight) / 2
        existing.frequency += newInterest.frequency
        existing.lastUpdated = new Date()
      } else {
        merged.set(newInterest.keyword, newInterest)
      }
    })

    return Array.from(merged.values())
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 20)
  }
}