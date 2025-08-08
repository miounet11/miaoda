/**
 * AI个性化推荐系统类型定义
 */

// 用户兴趣标签
export interface UserInterest {
  keyword: string
  weight: number  // 权重 0-1
  category: string  // 分类：技术、学习、娱乐等
  lastUpdated: Date
  frequency: number  // 出现频率
}

// 用户聊天风格分析
export interface ChatStyle {
  averageMessageLength: number
  vocabularyComplexity: number  // 词汇复杂度
  questionRatio: number  // 问题比例
  emotionalTone: 'neutral' | 'positive' | 'negative' | 'mixed'
  commonPhrases: string[]
  preferredTopics: string[]
  communicationPattern: 'direct' | 'conversational' | 'formal' | 'casual'
}

// 用户知识领域
export interface KnowledgeDomain {
  domain: string
  proficiencyLevel: number  // 0-100
  interestLevel: number     // 0-100
  messageCount: number
  lastActivity: Date
  subDomains: string[]
  relatedKeywords: string[]
}

// 用户画像
export interface UserProfile {
  id: string
  created_at: Date
  updated_at: Date
  
  // 基础信息
  totalMessages: number
  totalChats: number
  averageSessionLength: number  // 分钟
  
  // 兴趣分析
  interests: UserInterest[]
  chatStyle: ChatStyle
  knowledgeDomains: KnowledgeDomain[]
  
  // 使用模式
  activeHours: number[]  // 24小时制活跃时间分布
  preferredModels: { model: string; usage: number }[]
  commonScenarios: string[]  // 常用场景
  
  // 学习路径
  learningGoals: string[]
  completedTopics: string[]
  suggestedTopics: string[]
}

// 推荐类型
export type RecommendationType = 
  | 'model'           // 模型推荐
  | 'prompt'          // 提示词推荐
  | 'topic'           // 话题推荐
  | 'continuation'    // 续写推荐
  | 'tool'            // 工具推荐
  | 'learning_path'   // 学习路径推荐

// 推荐项目
export interface RecommendationItem {
  id: string
  type: RecommendationType
  title: string
  description?: string
  content: string  // 实际内容（提示词、话题等）
  confidence: number  // 推荐置信度 0-100
  reason: string  // 推荐理由
  category?: string
  tags?: string[]
  metadata?: Record<string, any>
  created_at: Date
}

// 推荐上下文
export interface RecommendationContext {
  currentChatId?: string
  currentMessage?: string
  recentMessages?: string[]
  activeDomains?: string[]
  currentTime: Date
  sessionDuration: number  // 当前会话时长（分钟）
  userMood?: 'focused' | 'exploring' | 'learning' | 'casual'
}

// 推荐配置
export interface RecommendationConfig {
  maxRecommendations: number
  confidenceThreshold: number  // 最低置信度阈值
  enabledTypes: RecommendationType[]
  personalizedWeight: number   // 个性化权重 0-1
  diversityWeight: number     // 多样性权重 0-1
  recencyWeight: number       // 时效性权重 0-1
}

// 推荐结果
export interface RecommendationResult {
  recommendations: RecommendationItem[]
  context: RecommendationContext
  generatedAt: Date
  processingTime: number  // 毫秒
}

// 用户反馈
export interface UserFeedback {
  recommendationId: string
  action: 'click' | 'dismiss' | 'like' | 'dislike' | 'apply'
  timestamp: Date
  context?: string
}

// 推荐算法类型
export type AlgorithmType = 'tfidf' | 'collaborative' | 'content_based' | 'hybrid'

// TF-IDF 向量
export interface TFIDFVector {
  term: string
  tf: number    // 词频
  idf: number   // 逆文档频率
  tfidf: number // TF-IDF值
}

// 相似度计算结果
export interface SimilarityScore {
  itemId: string
  score: number
  algorithm: AlgorithmType
}

// 智能助手建议
export interface SmartAssistantSuggestion {
  type: 'continuation' | 'deep_dive' | 'clarification' | 'alternative'
  content: string
  confidence: number
  reasoning: string
}

// 学习路径节点
export interface LearningPathNode {
  id: string
  title: string
  description: string
  prerequisites: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: number  // 分钟
  completed: boolean
  topics: string[]
}

// 学习路径
export interface LearningPath {
  id: string
  title: string
  description: string
  nodes: LearningPathNode[]
  progress: number  // 0-100
  startedAt?: Date
  estimatedCompletion?: Date
}

// 个性化设置
export interface PersonalizationSettings {
  enableRecommendations: boolean
  enableSmartSuggestions: boolean
  enableLearningPaths: boolean
  enableAutoPrompts: boolean
  recommendationFrequency: 'high' | 'medium' | 'low'
  privacyLevel: 'full' | 'partial' | 'minimal'
  dataRetention: number  // 天数
}

// 推荐统计信息
export interface RecommendationStats {
  totalGenerated: number
  totalAccepted: number
  totalDismissed: number
  averageConfidence: number
  topCategories: { category: string; count: number }[]
  algorithmPerformance: { algorithm: AlgorithmType; accuracy: number }[]
}