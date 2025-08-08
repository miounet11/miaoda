/**
 * 推荐系统数据库服务
 */
import { Database } from 'better-sqlite3'
import type { 
  UserProfile,
  UserInterest,
  KnowledgeDomain,
  RecommendationItem,
  UserFeedback,
  RecommendationStats,
  PersonalizationSettings
} from '../../renderer/src/types/recommendation'
import { BaseDatabaseService } from './BaseDatabaseService'

interface UserProfileRecord {
  id: string
  user_id: string
  created_at: string
  updated_at: string
  total_messages: number
  total_chats: number
  average_session_length: number
  active_hours: string // JSON array
  preferred_models: string // JSON array
  common_scenarios: string // JSON array
  learning_goals: string // JSON array
  completed_topics: string // JSON array
  suggested_topics: string // JSON array
  chat_style: string // JSON object
}

interface UserInterestRecord {
  id: string
  user_id: string
  keyword: string
  weight: number
  category: string
  last_updated: string
  frequency: number
}

interface KnowledgeDomainRecord {
  id: string
  user_id: string
  domain: string
  proficiency_level: number
  interest_level: number
  message_count: number
  last_activity: string
  sub_domains: string // JSON array
  related_keywords: string // JSON array
}

interface RecommendationRecord {
  id: string
  user_id: string
  type: string
  title: string
  description: string
  content: string
  confidence: number
  reason: string
  category: string
  tags: string // JSON array
  metadata: string // JSON object
  created_at: string
  shown_at?: string
  clicked_at?: string
  dismissed_at?: string
  applied_at?: string
}

interface UserFeedbackRecord {
  id: string
  user_id: string
  recommendation_id: string
  action: string
  timestamp: string
  context: string
}

interface PersonalizationSettingsRecord {
  id: string
  user_id: string
  enable_recommendations: number
  enable_smart_suggestions: number
  enable_learning_paths: number
  enable_auto_prompts: number
  recommendation_frequency: string
  privacy_level: string
  data_retention: number
  created_at: string
  updated_at: string
}

export class RecommendationService extends BaseDatabaseService {
  constructor(db: Database) {
    super(db)
    this.initializeTables()
  }

  private initializeTables() {
    // 用户画像表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        total_messages INTEGER DEFAULT 0,
        total_chats INTEGER DEFAULT 0,
        average_session_length REAL DEFAULT 0,
        active_hours TEXT DEFAULT '[]',
        preferred_models TEXT DEFAULT '[]',
        common_scenarios TEXT DEFAULT '[]',
        learning_goals TEXT DEFAULT '[]',
        completed_topics TEXT DEFAULT '[]',
        suggested_topics TEXT DEFAULT '[]',
        chat_style TEXT DEFAULT '{}'
      )
    `)

    // 用户兴趣表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_interests (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        keyword TEXT NOT NULL,
        weight REAL NOT NULL,
        category TEXT NOT NULL,
        last_updated TEXT NOT NULL,
        frequency INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES user_profiles (user_id),
        UNIQUE(user_id, keyword)
      )
    `)

    // 知识领域表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS knowledge_domains (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        domain TEXT NOT NULL,
        proficiency_level REAL DEFAULT 0,
        interest_level REAL DEFAULT 0,
        message_count INTEGER DEFAULT 0,
        last_activity TEXT NOT NULL,
        sub_domains TEXT DEFAULT '[]',
        related_keywords TEXT DEFAULT '[]',
        FOREIGN KEY (user_id) REFERENCES user_profiles (user_id),
        UNIQUE(user_id, domain)
      )
    `)

    // 推荐记录表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS recommendations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        content TEXT NOT NULL,
        confidence REAL NOT NULL,
        reason TEXT NOT NULL,
        category TEXT,
        tags TEXT DEFAULT '[]',
        metadata TEXT DEFAULT '{}',
        created_at TEXT NOT NULL,
        shown_at TEXT,
        clicked_at TEXT,
        dismissed_at TEXT,
        applied_at TEXT,
        FOREIGN KEY (user_id) REFERENCES user_profiles (user_id)
      )
    `)

    // 用户反馈表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_feedback (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        recommendation_id TEXT NOT NULL,
        action TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        context TEXT,
        FOREIGN KEY (user_id) REFERENCES user_profiles (user_id),
        FOREIGN KEY (recommendation_id) REFERENCES recommendations (id)
      )
    `)

    // 个性化设置表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS personalization_settings (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL,
        enable_recommendations INTEGER DEFAULT 1,
        enable_smart_suggestions INTEGER DEFAULT 1,
        enable_learning_paths INTEGER DEFAULT 1,
        enable_auto_prompts INTEGER DEFAULT 0,
        recommendation_frequency TEXT DEFAULT 'medium',
        privacy_level TEXT DEFAULT 'partial',
        data_retention INTEGER DEFAULT 90,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user_profiles (user_id)
      )
    `)

    // 创建索引
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_user_interests_user_id ON user_interests (user_id);
      CREATE INDEX IF NOT EXISTS idx_user_interests_keyword ON user_interests (keyword);
      CREATE INDEX IF NOT EXISTS idx_knowledge_domains_user_id ON knowledge_domains (user_id);
      CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations (user_id);
      CREATE INDEX IF NOT EXISTS idx_recommendations_type ON recommendations (type);
      CREATE INDEX IF NOT EXISTS idx_recommendations_created_at ON recommendations (created_at);
      CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON user_feedback (user_id);
      CREATE INDEX IF NOT EXISTS idx_user_feedback_recommendation_id ON user_feedback (recommendation_id);
    `)
  }

  /**
   * 保存用户画像
   */
  async saveUserProfile(profile: UserProfile): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO user_profiles (
        id, user_id, created_at, updated_at, total_messages, total_chats,
        average_session_length, active_hours, preferred_models, common_scenarios,
        learning_goals, completed_topics, suggested_topics, chat_style
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run([
      profile.id,
      profile.id, // 假设profile.id就是user_id
      profile.created_at.toISOString(),
      profile.updated_at.toISOString(),
      profile.totalMessages,
      profile.totalChats,
      profile.averageSessionLength,
      JSON.stringify(profile.activeHours),
      JSON.stringify(profile.preferredModels),
      JSON.stringify(profile.commonScenarios),
      JSON.stringify(profile.learningGoals),
      JSON.stringify(profile.completedTopics),
      JSON.stringify(profile.suggestedTopics),
      JSON.stringify(profile.chatStyle)
    ])

    // 保存用户兴趣
    await this.saveUserInterests(profile.id, profile.interests)

    // 保存知识领域
    await this.saveKnowledgeDomains(profile.id, profile.knowledgeDomains)
  }

  /**
   * 获取用户画像
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM user_profiles WHERE user_id = ?
    `)
    const record = stmt.get(userId) as UserProfileRecord | undefined

    if (!record) return null

    const interests = await this.getUserInterests(userId)
    const knowledgeDomains = await this.getKnowledgeDomains(userId)

    return {
      id: record.user_id,
      created_at: new Date(record.created_at),
      updated_at: new Date(record.updated_at),
      totalMessages: record.total_messages,
      totalChats: record.total_chats,
      averageSessionLength: record.average_session_length,
      interests,
      chatStyle: JSON.parse(record.chat_style),
      knowledgeDomains,
      activeHours: JSON.parse(record.active_hours),
      preferredModels: JSON.parse(record.preferred_models),
      commonScenarios: JSON.parse(record.common_scenarios),
      learningGoals: JSON.parse(record.learning_goals),
      completedTopics: JSON.parse(record.completed_topics),
      suggestedTopics: JSON.parse(record.suggested_topics)
    }
  }

  /**
   * 保存用户兴趣
   */
  private async saveUserInterests(userId: string, interests: UserInterest[]): Promise<void> {
    // 清除旧的兴趣记录
    this.db.prepare('DELETE FROM user_interests WHERE user_id = ?').run(userId)

    if (interests.length === 0) return

    const stmt = this.db.prepare(`
      INSERT INTO user_interests (
        id, user_id, keyword, weight, category, last_updated, frequency
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    interests.forEach(interest => {
      stmt.run([
        `${userId}_${interest.keyword}_${Date.now()}`,
        userId,
        interest.keyword,
        interest.weight,
        interest.category,
        interest.lastUpdated.toISOString(),
        interest.frequency
      ])
    })
  }

  /**
   * 获取用户兴趣
   */
  private async getUserInterests(userId: string): Promise<UserInterest[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM user_interests WHERE user_id = ? ORDER BY weight DESC
    `)
    const records = stmt.all(userId) as UserInterestRecord[]

    return records.map(record => ({
      keyword: record.keyword,
      weight: record.weight,
      category: record.category,
      lastUpdated: new Date(record.last_updated),
      frequency: record.frequency
    }))
  }

  /**
   * 保存知识领域
   */
  private async saveKnowledgeDomains(userId: string, domains: KnowledgeDomain[]): Promise<void> {
    // 清除旧的领域记录
    this.db.prepare('DELETE FROM knowledge_domains WHERE user_id = ?').run(userId)

    if (domains.length === 0) return

    const stmt = this.db.prepare(`
      INSERT INTO knowledge_domains (
        id, user_id, domain, proficiency_level, interest_level,
        message_count, last_activity, sub_domains, related_keywords
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    domains.forEach(domain => {
      stmt.run([
        `${userId}_${domain.domain}_${Date.now()}`,
        userId,
        domain.domain,
        domain.proficiencyLevel,
        domain.interestLevel,
        domain.messageCount,
        domain.lastActivity.toISOString(),
        JSON.stringify(domain.subDomains),
        JSON.stringify(domain.relatedKeywords)
      ])
    })
  }

  /**
   * 获取知识领域
   */
  private async getKnowledgeDomains(userId: string): Promise<KnowledgeDomain[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM knowledge_domains WHERE user_id = ? ORDER BY interest_level DESC
    `)
    const records = stmt.all(userId) as KnowledgeDomainRecord[]

    return records.map(record => ({
      domain: record.domain,
      proficiencyLevel: record.proficiency_level,
      interestLevel: record.interest_level,
      messageCount: record.message_count,
      lastActivity: new Date(record.last_activity),
      subDomains: JSON.parse(record.sub_domains),
      relatedKeywords: JSON.parse(record.related_keywords)
    }))
  }

  /**
   * 保存推荐记录
   */
  async saveRecommendation(userId: string, recommendation: RecommendationItem): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO recommendations (
        id, user_id, type, title, description, content, confidence,
        reason, category, tags, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run([
      recommendation.id,
      userId,
      recommendation.type,
      recommendation.title,
      recommendation.description || '',
      recommendation.content,
      recommendation.confidence,
      recommendation.reason,
      recommendation.category || '',
      JSON.stringify(recommendation.tags || []),
      JSON.stringify(recommendation.metadata || {}),
      recommendation.created_at.toISOString()
    ])
  }

  /**
   * 获取用户推荐历史
   */
  async getUserRecommendations(
    userId: string,
    limit: number = 50,
    type?: string
  ): Promise<RecommendationItem[]> {
    let query = `
      SELECT * FROM recommendations 
      WHERE user_id = ?
    `
    const params: any[] = [userId]

    if (type) {
      query += ' AND type = ?'
      params.push(type)
    }

    query += ' ORDER BY created_at DESC LIMIT ?'
    params.push(limit)

    const stmt = this.db.prepare(query)
    const records = stmt.all(...params) as RecommendationRecord[]

    return records.map(record => ({
      id: record.id,
      type: record.type as any,
      title: record.title,
      description: record.description,
      content: record.content,
      confidence: record.confidence,
      reason: record.reason,
      category: record.category,
      tags: JSON.parse(record.tags),
      metadata: JSON.parse(record.metadata),
      created_at: new Date(record.created_at)
    }))
  }

  /**
   * 记录推荐反馈
   */
  async recordUserFeedback(feedback: UserFeedback): Promise<void> {
    // 保存反馈记录
    const feedbackStmt = this.db.prepare(`
      INSERT INTO user_feedback (
        id, user_id, recommendation_id, action, timestamp, context
      ) VALUES (?, ?, ?, ?, ?, ?)
    `)

    feedbackStmt.run([
      `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      feedback.recommendationId.split('_')[1] || 'unknown', // 从推荐ID推导用户ID
      feedback.recommendationId,
      feedback.action,
      feedback.timestamp.toISOString(),
      feedback.context || ''
    ])

    // 更新推荐记录的相应字段
    const updateStmt = this.db.prepare(`
      UPDATE recommendations 
      SET ${feedback.action}_at = ? 
      WHERE id = ?
    `)

    updateStmt.run([
      feedback.timestamp.toISOString(),
      feedback.recommendationId
    ])
  }

  /**
   * 获取推荐统计信息
   */
  async getRecommendationStats(userId: string): Promise<RecommendationStats> {
    const totalGenerated = this.db.prepare(`
      SELECT COUNT(*) as count FROM recommendations WHERE user_id = ?
    `).get(userId) as { count: number }

    const totalAccepted = this.db.prepare(`
      SELECT COUNT(*) as count FROM recommendations 
      WHERE user_id = ? AND (clicked_at IS NOT NULL OR applied_at IS NOT NULL)
    `).get(userId) as { count: number }

    const totalDismissed = this.db.prepare(`
      SELECT COUNT(*) as count FROM recommendations 
      WHERE user_id = ? AND dismissed_at IS NOT NULL
    `).get(userId) as { count: number }

    const avgConfidence = this.db.prepare(`
      SELECT AVG(confidence) as avg FROM recommendations WHERE user_id = ?
    `).get(userId) as { avg: number }

    const topCategories = this.db.prepare(`
      SELECT category, COUNT(*) as count 
      FROM recommendations 
      WHERE user_id = ? AND category IS NOT NULL 
      GROUP BY category 
      ORDER BY count DESC 
      LIMIT 10
    `).all(userId) as { category: string; count: number }[]

    return {
      totalGenerated: totalGenerated.count,
      totalAccepted: totalAccepted.count,
      totalDismissed: totalDismissed.count,
      averageConfidence: avgConfidence.avg || 0,
      topCategories,
      algorithmPerformance: [] // 需要更复杂的逻辑计算
    }
  }

  /**
   * 保存个性化设置
   */
  async savePersonalizationSettings(userId: string, settings: PersonalizationSettings): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO personalization_settings (
        id, user_id, enable_recommendations, enable_smart_suggestions,
        enable_learning_paths, enable_auto_prompts, recommendation_frequency,
        privacy_level, data_retention, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const now = new Date().toISOString()
    stmt.run([
      `settings_${userId}`,
      userId,
      settings.enableRecommendations ? 1 : 0,
      settings.enableSmartSuggestions ? 1 : 0,
      settings.enableLearningPaths ? 1 : 0,
      settings.enableAutoPrompts ? 1 : 0,
      settings.recommendationFrequency,
      settings.privacyLevel,
      settings.dataRetention,
      now,
      now
    ])
  }

  /**
   * 获取个性化设置
   */
  async getPersonalizationSettings(userId: string): Promise<PersonalizationSettings> {
    const stmt = this.db.prepare(`
      SELECT * FROM personalization_settings WHERE user_id = ?
    `)
    const record = stmt.get(userId) as PersonalizationSettingsRecord | undefined

    if (!record) {
      // 返回默认设置
      return {
        enableRecommendations: true,
        enableSmartSuggestions: true,
        enableLearningPaths: true,
        enableAutoPrompts: false,
        recommendationFrequency: 'medium',
        privacyLevel: 'partial',
        dataRetention: 90
      }
    }

    return {
      enableRecommendations: record.enable_recommendations === 1,
      enableSmartSuggestions: record.enable_smart_suggestions === 1,
      enableLearningPaths: record.enable_learning_paths === 1,
      enableAutoPrompts: record.enable_auto_prompts === 1,
      recommendationFrequency: record.recommendation_frequency as any,
      privacyLevel: record.privacy_level as any,
      dataRetention: record.data_retention
    }
  }

  /**
   * 清理过期数据
   */
  async cleanupExpiredData(): Promise<void> {
    // 获取所有用户的数据保留设置
    const settingsStmt = this.db.prepare(`
      SELECT user_id, data_retention FROM personalization_settings
    `)
    const settings = settingsStmt.all() as { user_id: string; data_retention: number }[]

    for (const setting of settings) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - setting.data_retention)
      const cutoffIso = cutoffDate.toISOString()

      // 删除过期的推荐记录
      this.db.prepare(`
        DELETE FROM recommendations 
        WHERE user_id = ? AND created_at < ?
      `).run([setting.user_id, cutoffIso])

      // 删除过期的反馈记录
      this.db.prepare(`
        DELETE FROM user_feedback 
        WHERE user_id = ? AND timestamp < ?
      `).run([setting.user_id, cutoffIso])
    }
  }

  /**
   * 获取推荐趋势数据
   */
  async getRecommendationTrends(userId: string, days: number = 30): Promise<any> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const stmt = this.db.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total,
        AVG(confidence) as avg_confidence,
        SUM(CASE WHEN clicked_at IS NOT NULL OR applied_at IS NOT NULL THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN dismissed_at IS NOT NULL THEN 1 ELSE 0 END) as dismissed
      FROM recommendations 
      WHERE user_id = ? AND created_at >= ?
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `)

    return stmt.all([userId, startDate.toISOString()])
  }
}