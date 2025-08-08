/**
 * AI个性化推荐引擎核心服务
 */
import type { 
  RecommendationItem,
  RecommendationContext,
  RecommendationConfig,
  RecommendationResult,
  UserProfile,
  RecommendationType,
  UserFeedback,
  SmartAssistantSuggestion,
  LearningPath
} from '../../types/recommendation'
import type { MessageRecord, ChatRecord } from '../../types'
import { 
  HybridRecommendationEngine,
  TFIDFAnalyzer,
  TextProcessor 
} from './RecommendationAlgorithms'
import { UserProfileService } from './UserProfileService'

export class RecommendationEngine {
  private hybridEngine = new HybridRecommendationEngine()
  private tfidfAnalyzer = new TFIDFAnalyzer()
  private textProcessor = new TextProcessor()
  private userProfileService = new UserProfileService()
  
  private config: RecommendationConfig = {
    maxRecommendations: 10,
    confidenceThreshold: 0.3,
    enabledTypes: ['model', 'prompt', 'topic', 'continuation', 'tool', 'learning_path'],
    personalizedWeight: 0.6,
    diversityWeight: 0.3,
    recencyWeight: 0.1
  }

  // 内置推荐数据
  private modelRecommendations = [
    {
      id: 'gpt-4-creative',
      model: 'gpt-4',
      title: 'GPT-4 创意写作',
      description: '适合创意写作、故事创作和文学分析',
      scenarios: ['创作', '写作', '故事', '文学'],
      settings: { temperature: 0.8, max_tokens: 2048 }
    },
    {
      id: 'claude-analysis',
      model: 'claude-3-sonnet-20240229',
      title: 'Claude 深度分析',
      description: '适合复杂分析、逻辑推理和代码审查',
      scenarios: ['分析', '推理', '代码', '审查'],
      settings: { temperature: 0.3, max_tokens: 4096 }
    },
    {
      id: 'gemini-research',
      model: 'gemini-pro',
      title: 'Gemini 研究助手',
      description: '适合学术研究、资料整理和信息检索',
      scenarios: ['研究', '学习', '整理', '检索'],
      settings: { temperature: 0.5, max_tokens: 8192 }
    }
  ]

  private promptTemplates = [
    {
      id: 'explain-concept',
      title: '概念解释专家',
      content: '请用简单易懂的语言解释以下概念，并举出具体例子：',
      category: '学习教育',
      scenarios: ['学习', '解释', '概念']
    },
    {
      id: 'code-review',
      title: '代码审查助手',
      content: '请仔细审查以下代码，指出潜在问题、改进建议和最佳实践：',
      category: '编程开发',
      scenarios: ['代码', '审查', '编程']
    },
    {
      id: 'creative-writing',
      title: '创意写作指导',
      content: '让我们一起创作一个引人入胜的故事。请提供故事的背景、主角和情节发展：',
      category: '创意写作',
      scenarios: ['写作', '创作', '故事']
    },
    {
      id: 'problem-solving',
      title: '问题解决框架',
      content: '让我们用结构化的方法来解决这个问题。请分析问题的核心、可能的解决方案和实施步骤：',
      category: '逻辑分析',
      scenarios: ['解决', '问题', '分析']
    }
  ]

  private topicSuggestions = [
    {
      id: 'ai-trends',
      title: '人工智能发展趋势',
      content: 'AI技术的最新发展和未来趋势分析',
      category: '技术前沿',
      keywords: ['ai', '人工智能', '机器学习', '深度学习']
    },
    {
      id: 'web-dev-best-practices',
      title: 'Web开发最佳实践',
      content: '现代Web开发的最佳实践和架构模式',
      category: '编程开发',
      keywords: ['web', '开发', '前端', '后端', '架构']
    },
    {
      id: 'design-thinking',
      title: '设计思维方法论',
      content: '设计思维的核心原则和实践应用',
      category: '设计创意',
      keywords: ['设计', '用户体验', 'ui', 'ux', '创新']
    }
  ]

  /**
   * 生成个性化推荐
   */
  async generateRecommendations(
    userId: string,
    context: RecommendationContext,
    userProfile?: UserProfile
  ): Promise<RecommendationResult> {
    const startTime = Date.now()

    try {
      // 获取或生成用户画像
      let profile = userProfile
      if (!profile) {
        // 这里应该从数据库获取，简化实现
        profile = await this.getUserProfile(userId)
      }

      const recommendations: RecommendationItem[] = []

      // 生成不同类型的推荐
      if (this.config.enabledTypes.includes('model')) {
        const modelRecs = await this.generateModelRecommendations(profile, context)
        recommendations.push(...modelRecs)
      }

      if (this.config.enabledTypes.includes('prompt')) {
        const promptRecs = await this.generatePromptRecommendations(profile, context)
        recommendations.push(...promptRecs)
      }

      if (this.config.enabledTypes.includes('topic')) {
        const topicRecs = await this.generateTopicRecommendations(profile, context)
        recommendations.push(...topicRecs)
      }

      if (this.config.enabledTypes.includes('continuation')) {
        const continuationRecs = await this.generateContinuationRecommendations(context)
        recommendations.push(...continuationRecs)
      }

      // 应用过滤和排序
      const filteredRecs = this.filterAndRankRecommendations(recommendations, profile, context)

      const processingTime = Date.now() - startTime

      return {
        recommendations: filteredRecs.slice(0, this.config.maxRecommendations),
        context,
        generatedAt: new Date(),
        processingTime
      }
    } catch (error) {
      console.error('推荐生成失败:', error)
      return {
        recommendations: [],
        context,
        generatedAt: new Date(),
        processingTime: Date.now() - startTime
      }
    }
  }

  /**
   * 生成模型推荐
   */
  private async generateModelRecommendations(
    profile: UserProfile,
    context: RecommendationContext
  ): Promise<RecommendationItem[]> {
    const recommendations: RecommendationItem[] = []

    // 基于用户的知识领域和常用场景推荐模型
    const userScenarios = profile.commonScenarios
    const userDomains = profile.knowledgeDomains.map(d => d.domain)

    this.modelRecommendations.forEach(model => {
      let confidence = 0

      // 计算场景匹配度
      const scenarioMatch = userScenarios.filter(scenario => 
        model.scenarios.some(modelScenario => 
          scenario.includes(modelScenario) || modelScenario.includes(scenario)
        )
      ).length

      confidence += (scenarioMatch / userScenarios.length) * 60

      // 当前上下文相关性
      if (context.currentMessage) {
        const messageKeywords = this.textProcessor.extractKeywords(context.currentMessage, 10)
        const modelKeywordMatch = messageKeywords.filter(keyword =>
          model.scenarios.some(scenario => scenario.includes(keyword))
        ).length

        confidence += (modelKeywordMatch / messageKeywords.length) * 40
      }

      if (confidence >= this.config.confidenceThreshold * 100) {
        recommendations.push({
          id: `model_${model.id}`,
          type: 'model',
          title: model.title,
          description: model.description,
          content: model.model,
          confidence: Math.min(confidence, 100),
          reason: `基于您的${userScenarios.slice(0, 2).join('和')}使用模式`,
          category: '模型推荐',
          metadata: { 
            model: model.model,
            settings: model.settings 
          },
          created_at: new Date()
        })
      }
    })

    return recommendations
  }

  /**
   * 生成提示词推荐
   */
  private async generatePromptRecommendations(
    profile: UserProfile,
    context: RecommendationContext
  ): Promise<RecommendationItem[]> {
    const recommendations: RecommendationItem[] = []
    const userInterests = profile.interests.map(i => i.keyword)
    const userScenarios = profile.commonScenarios

    this.promptTemplates.forEach(template => {
      let confidence = 0

      // 基于用户兴趣计算匹配度
      const interestMatch = template.scenarios.filter(scenario => 
        userInterests.some(interest => 
          interest.includes(scenario) || scenario.includes(interest)
        )
      ).length

      confidence += (interestMatch / template.scenarios.length) * 50

      // 基于常用场景计算匹配度
      const scenarioMatch = template.scenarios.filter(scenario =>
        userScenarios.some(userScenario =>
          userScenario.includes(scenario) || scenario.includes(userScenario)
        )
      ).length

      confidence += (scenarioMatch / template.scenarios.length) * 30

      // 当前上下文相关性
      if (context.currentMessage) {
        const similarity = this.textProcessor.cosineSimilarity(
          context.currentMessage,
          template.content
        )
        confidence += similarity * 20
      }

      if (confidence >= this.config.confidenceThreshold * 100) {
        recommendations.push({
          id: `prompt_${template.id}`,
          type: 'prompt',
          title: template.title,
          description: `适用于${template.category}场景的提示词模板`,
          content: template.content,
          confidence: Math.min(confidence, 100),
          reason: `匹配您的${template.category}需求`,
          category: template.category,
          created_at: new Date()
        })
      }
    })

    return recommendations
  }

  /**
   * 生成话题推荐
   */
  private async generateTopicRecommendations(
    profile: UserProfile,
    context: RecommendationContext
  ): Promise<RecommendationItem[]> {
    const recommendations: RecommendationItem[] = []
    const userInterests = profile.interests.map(i => i.keyword)
    const userDomains = profile.knowledgeDomains.map(d => d.domain)

    this.topicSuggestions.forEach(topic => {
      let confidence = 0

      // 基于用户兴趣关键词匹配
      const keywordMatch = topic.keywords.filter(keyword =>
        userInterests.some(interest => 
          interest.includes(keyword) || keyword.includes(interest)
        )
      ).length

      confidence += (keywordMatch / topic.keywords.length) * 60

      // 基于知识领域匹配
      const domainMatch = userDomains.some(domain =>
        topic.category.includes(domain) || domain.includes(topic.category)
      )

      if (domainMatch) confidence += 25

      // 避免重复推荐已完成的话题
      const isCompleted = profile.completedTopics.some(completed =>
        completed.includes(topic.title) || topic.title.includes(completed)
      )

      if (isCompleted) confidence -= 30

      if (confidence >= this.config.confidenceThreshold * 100) {
        recommendations.push({
          id: `topic_${topic.id}`,
          type: 'topic',
          title: topic.title,
          description: topic.content,
          content: `让我们聊聊${topic.title}`,
          confidence: Math.min(confidence, 100),
          reason: `基于您对${topic.keywords.slice(0, 2).join('和')}的兴趣`,
          category: topic.category,
          created_at: new Date()
        })
      }
    })

    return recommendations
  }

  /**
   * 生成续写推荐
   */
  private async generateContinuationRecommendations(
    context: RecommendationContext
  ): Promise<RecommendationItem[]> {
    if (!context.currentMessage || !context.recentMessages) {
      return []
    }

    const recommendations: RecommendationItem[] = []
    const currentMsg = context.currentMessage
    const recentMsgs = context.recentMessages

    // 分析当前对话的特征
    const conversationContext = recentMsgs.join(' ')
    const keywords = this.textProcessor.extractKeywords(conversationContext, 10)

    // 生成不同类型的续写建议
    const continuationTypes = [
      {
        type: 'deep_dive',
        title: '深入探讨',
        template: `让我们深入分析一下${keywords.slice(0, 2).join('和')}的核心原理和应用场景`,
        confidence: 70
      },
      {
        type: 'practical_application',
        title: '实际应用',
        template: `基于刚才的讨论，我们来看看如何在实际项目中应用这些概念`,
        confidence: 65
      },
      {
        type: 'alternative_perspective',
        title: '不同角度',
        template: `从另一个角度来看这个问题，我们还可以考虑...`,
        confidence: 60
      },
      {
        type: 'next_steps',
        title: '后续步骤',
        template: `基于目前的进展，建议您接下来可以尝试...`,
        confidence: 75
      }
    ]

    continuationTypes.forEach(cont => {
      recommendations.push({
        id: `continuation_${cont.type}_${Date.now()}`,
        type: 'continuation',
        title: cont.title,
        description: '基于当前对话的智能续写建议',
        content: cont.template,
        confidence: cont.confidence,
        reason: '根据对话上下文生成的续写建议',
        category: '对话续写',
        created_at: new Date()
      })
    })

    return recommendations
  }

  /**
   * 过滤和排序推荐结果
   */
  private filterAndRankRecommendations(
    recommendations: RecommendationItem[],
    profile: UserProfile,
    context: RecommendationContext
  ): RecommendationItem[] {
    // 过滤低置信度推荐
    let filtered = recommendations.filter(rec => 
      rec.confidence >= this.config.confidenceThreshold * 100
    )

    // 多样性处理：确保不同类型的推荐都有
    const typeGroups = this.groupByType(filtered)
    const diversified: RecommendationItem[] = []

    // 从每个类型中选取最佳推荐
    Object.values(typeGroups).forEach(group => {
      const sorted = group.sort((a, b) => b.confidence - a.confidence)
      diversified.push(...sorted.slice(0, 3)) // 每类型最多3个
    })

    // 最终排序：综合考虑置信度、个性化、多样性
    return diversified
      .map(rec => ({
        ...rec,
        finalScore: this.calculateFinalScore(rec, profile, context)
      }))
      .sort((a, b) => b.finalScore - a.finalScore)
  }

  private groupByType(recommendations: RecommendationItem[]): Record<string, RecommendationItem[]> {
    return recommendations.reduce((groups, rec) => {
      const type = rec.type
      if (!groups[type]) {
        groups[type] = []
      }
      groups[type].push(rec)
      return groups
    }, {} as Record<string, RecommendationItem[]>)
  }

  private calculateFinalScore(
    rec: RecommendationItem,
    profile: UserProfile,
    context: RecommendationContext
  ): number {
    let score = rec.confidence * this.config.personalizedWeight

    // 多样性加分
    score += Math.random() * 20 * this.config.diversityWeight

    // 时效性加分（新推荐类型）
    const isNovel = !this.isRecentlyRecommended(rec, profile)
    if (isNovel) {
      score += 15 * this.config.recencyWeight
    }

    return score
  }

  private isRecentlyRecommended(rec: RecommendationItem, profile: UserProfile): boolean {
    // 简化实现：检查是否与用户已完成主题重复
    return profile.completedTopics.some(topic =>
      rec.title.includes(topic) || topic.includes(rec.title)
    )
  }

  /**
   * 生成智能助手建议
   */
  async generateSmartSuggestions(
    context: RecommendationContext,
    userProfile?: UserProfile
  ): Promise<SmartAssistantSuggestion[]> {
    if (!context.currentMessage) return []

    const suggestions: SmartAssistantSuggestion[] = []
    const message = context.currentMessage

    // 续写建议
    if (message.length > 50) {
      suggestions.push({
        type: 'continuation',
        content: '我可以帮您继续完善这个想法，展开更多细节...',
        confidence: 75,
        reasoning: '基于消息长度判断用户可能需要续写帮助'
      })
    }

    // 深入建议
    if (this.textProcessor.extractKeywords(message, 5).length > 2) {
      suggestions.push({
        type: 'deep_dive',
        content: '让我们深入探讨其中的关键概念和原理...',
        confidence: 80,
        reasoning: '消息包含多个关键词，用户可能需要深入分析'
      })
    }

    // 澄清建议
    const questionWords = ['什么', '怎么', '为什么', 'what', 'how', 'why']
    if (questionWords.some(word => message.toLowerCase().includes(word))) {
      suggestions.push({
        type: 'clarification',
        content: '我需要更多信息来给出准确答案，能否详细说明...',
        confidence: 70,
        reasoning: '检测到疑问词，可能需要澄清需求'
      })
    }

    // 替代方案建议
    suggestions.push({
      type: 'alternative',
      content: '除了这个方法，还有其他几种解决方案可以考虑...',
      confidence: 65,
      reasoning: '提供多样化的解决思路'
    })

    return suggestions.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * 记录用户反馈
   */
  async recordUserFeedback(feedback: UserFeedback): Promise<void> {
    // 这里应该保存到数据库
    console.log('用户反馈记录:', feedback)
    
    // 基于反馈调整推荐算法权重
    this.adjustAlgorithmWeights(feedback)
  }

  private adjustAlgorithmWeights(feedback: UserFeedback): void {
    // 根据用户反馈动态调整算法参数
    if (feedback.action === 'like' || feedback.action === 'apply') {
      // 正面反馈：略微提高相关权重
    } else if (feedback.action === 'dislike' || feedback.action === 'dismiss') {
      // 负面反馈：略微降低相关权重
    }
  }

  /**
   * 更新推荐配置
   */
  updateConfig(newConfig: Partial<RecommendationConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * 获取推荐统计信息
   */
  async getRecommendationStats(userId: string): Promise<any> {
    // 这里应该从数据库获取统计信息
    return {
      totalGenerated: 0,
      totalAccepted: 0,
      totalDismissed: 0,
      averageConfidence: 0,
      topCategories: [],
      algorithmPerformance: []
    }
  }

  /**
   * 生成学习路径
   */
  async generateLearningPath(
    userId: string,
    topic: string,
    userProfile: UserProfile
  ): Promise<LearningPath> {
    // 基于用户画像和主题生成个性化学习路径
    const currentLevel = this.assessUserLevel(topic, userProfile)
    
    return {
      id: `path_${topic}_${Date.now()}`,
      title: `${topic} 学习路径`,
      description: `基于您的背景定制的${topic}学习计划`,
      nodes: await this.generateLearningNodes(topic, currentLevel),
      progress: 0,
      startedAt: new Date()
    }
  }

  private assessUserLevel(topic: string, profile: UserProfile): 'beginner' | 'intermediate' | 'advanced' {
    const relevantDomain = profile.knowledgeDomains.find(domain =>
      domain.domain.includes(topic) || topic.includes(domain.domain)
    )

    if (!relevantDomain) return 'beginner'
    
    if (relevantDomain.proficiencyLevel > 70) return 'advanced'
    if (relevantDomain.proficiencyLevel > 40) return 'intermediate'
    return 'beginner'
  }

  private async generateLearningNodes(topic: string, level: string): Promise<any[]> {
    // 简化实现：生成学习节点
    const nodes = [
      {
        id: '1',
        title: `${topic} 基础概念`,
        description: `了解${topic}的基本概念和原理`,
        prerequisites: [],
        difficulty: level === 'beginner' ? 'beginner' : 'intermediate',
        estimatedTime: 60,
        completed: false,
        topics: [topic, '基础理论']
      }
    ]

    return nodes
  }

  private async getUserProfile(userId: string): Promise<UserProfile> {
    // 这里应该从数据库获取用户画像
    // 返回默认画像作为示例
    return {
      id: userId,
      created_at: new Date(),
      updated_at: new Date(),
      totalMessages: 0,
      totalChats: 0,
      averageSessionLength: 0,
      interests: [],
      chatStyle: {
        averageMessageLength: 100,
        vocabularyComplexity: 0.5,
        questionRatio: 0.3,
        emotionalTone: 'neutral',
        commonPhrases: [],
        preferredTopics: [],
        communicationPattern: 'conversational'
      },
      knowledgeDomains: [],
      activeHours: new Array(24).fill(50),
      preferredModels: [],
      commonScenarios: [],
      learningGoals: [],
      completedTopics: [],
      suggestedTopics: []
    }
  }
}