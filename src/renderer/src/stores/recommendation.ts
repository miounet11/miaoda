/// <reference path="../types/window.d.ts" />

/**
 * 推荐系统状态管理
 */
import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import type {
  RecommendationItem,
  RecommendationContext,
  RecommendationConfig,
  UserProfile,
  UserFeedback,
  SmartAssistantSuggestion,
  PersonalizationSettings,
  LearningPath,
  RecommendationStats
} from '../types/recommendation'
import { RecommendationEngine } from '../services/recommendation/RecommendationEngine'
import { UserProfileService } from '../services/recommendation/UserProfileService'

export const useRecommendationStore = defineStore('recommendation', () => {
  // Services
  const recommendationEngine = new RecommendationEngine()
  const userProfileService = new UserProfileService()

  // State
  const recommendations = ref<RecommendationItem[]>([])
  const smartSuggestions = ref<SmartAssistantSuggestion[]>([])
  const userProfile = ref<UserProfile | null>(null)
  const learningPaths = ref<LearningPath[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<Date | null>(null)

  // 推荐配置
  const config = ref<RecommendationConfig>({
    maxRecommendations: 10,
    confidenceThreshold: 0.3,
    enabledTypes: ['model', 'prompt', 'topic', 'continuation', 'tool', 'learning_path'],
    personalizedWeight: 0.6,
    diversityWeight: 0.3,
    recencyWeight: 0.1
  })

  // 个性化设置
  const personalizationSettings = ref<PersonalizationSettings>({
    enableRecommendations: true,
    enableSmartSuggestions: true,
    enableLearningPaths: true,
    enableAutoPrompts: false,
    recommendationFrequency: 'medium',
    privacyLevel: 'partial',
    dataRetention: 90
  })

  // 统计信息
  const stats = ref<RecommendationStats>({
    totalGenerated: 0,
    totalAccepted: 0,
    totalDismissed: 0,
    averageConfidence: 0,
    topCategories: [],
    algorithmPerformance: []
  })

  // 当前上下文
  const currentContext = reactive<RecommendationContext>({
    currentTime: new Date(),
    sessionDuration: 0
  })

  // Computed
  const isEnabled = computed(() => 
    personalizationSettings.value.enableRecommendations
  )

  const hasProfile = computed(() => 
    userProfile.value !== null
  )

  const hasRecommendations = computed(() => 
    recommendations.value.length > 0
  )

  const topRecommendations = computed(() => 
    recommendations.value
      .filter(rec => rec.confidence >= config.value.confidenceThreshold * 100)
      .slice(0, 5)
  )

  const recommendationsByType = computed(() => {
    const grouped: Record<string, RecommendationItem[]> = {}
    recommendations.value.forEach(rec => {
      if (!grouped[rec.type]) {
        grouped[rec.type] = []
      }
      grouped[rec.type].push(rec)
    })
    return grouped
  })

  const profileCompleteness = computed(() => {
    if (!userProfile.value) return 0
    
    let completeness = 0
    const profile = userProfile.value

    // 基础信息完整度
    if (profile.totalMessages > 10) completeness += 20
    if (profile.totalChats > 5) completeness += 15

    // 兴趣分析完整度
    if (profile.interests.length > 5) completeness += 20
    if (profile.interests.length > 10) completeness += 10

    // 知识领域完整度
    if (profile.knowledgeDomains.length > 2) completeness += 15
    if (profile.knowledgeDomains.length > 5) completeness += 10

    // 使用模式完整度
    if (profile.commonScenarios.length > 3) completeness += 10

    return Math.min(completeness, 100)
  })

  // Actions
  
  /**
   * 初始化推荐系统
   */
  async function initialize(userId: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      // 加载用户画像
      await loadUserProfile(userId)
      
      // 加载个性化设置
      await loadPersonalizationSettings(userId)
      
      // 加载统计信息
      await loadStats(userId)

      // 更新推荐引擎配置
      recommendationEngine.updateConfig(config.value)

      console.log('推荐系统初始化完成')
    } catch (err: any) {
      error.value = err.message || '推荐系统初始化失败'
      console.error('推荐系统初始化错误:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 生成推荐
   */
  async function generateRecommendations(
    userId: string,
    context: Partial<RecommendationContext> = {}
  ): Promise<void> {
    if (!isEnabled.value) return

    loading.value = true
    error.value = null

    try {
      // 更新上下文
      const fullContext: RecommendationContext = {
        ...currentContext,
        ...context,
        currentTime: new Date()
      }

      // 生成推荐
      const result = await recommendationEngine.generateRecommendations(
        userId,
        fullContext,
        userProfile.value || undefined
      )

      recommendations.value = result.recommendations
      lastUpdated.value = result.generatedAt

      // 保存推荐记录到数据库（通过IPC）
      await saveRecommendationsToDb(userId, result.recommendations)

      console.log(`生成了 ${result.recommendations.length} 个推荐`)
    } catch (err: any) {
      error.value = err.message || '推荐生成失败'
      console.error('推荐生成错误:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 生成智能建议
   */
  async function generateSmartSuggestions(
    context: Partial<RecommendationContext> = {}
  ): Promise<void> {
    if (!personalizationSettings.value.enableSmartSuggestions) return

    try {
      const fullContext: RecommendationContext = {
        ...currentContext,
        ...context,
        currentTime: new Date()
      }

      const suggestions = await recommendationEngine.generateSmartSuggestions(
        fullContext,
        userProfile.value || undefined
      )

      smartSuggestions.value = suggestions
    } catch (err: any) {
      console.error('智能建议生成错误:', err)
    }
  }

  /**
   * 记录用户反馈
   */
  async function recordFeedback(
    recommendationId: string,
    action: 'click' | 'dismiss' | 'like' | 'dislike' | 'apply',
    context?: string
  ): Promise<void> {
    try {
      const feedback: UserFeedback = {
        recommendationId,
        action,
        timestamp: new Date(),
        context
      }

      // 记录到推荐引擎
      await recommendationEngine.recordUserFeedback(feedback)

      // 保存到数据库（通过IPC）
      await saveFeedbackToDb(feedback)

      // 更新本地统计
      updateStatsAfterFeedback(action)

      console.log('用户反馈记录成功:', action)
    } catch (err: any) {
      console.error('反馈记录失败:', err)
    }
  }

  /**
   * 应用推荐
   */
  async function applyRecommendation(recommendation: RecommendationItem): Promise<void> {
    try {
      // 记录应用反馈
      await recordFeedback(recommendation.id, 'apply')

      // 根据推荐类型执行相应操作
      await executeRecommendation(recommendation)

      console.log('推荐应用成功:', recommendation.title)
    } catch (err: any) {
      error.value = err.message || '推荐应用失败'
      console.error('推荐应用错误:', err)
    }
  }

  /**
   * 更新用户画像
   */
  async function updateUserProfile(userId: string): Promise<void> {
    loading.value = true

    try {
      // 从数据库获取最新聊天数据
      const { chats, messages } = await getChatDataFromDb(userId)

      // 生成新的用户画像
      const newProfile = await userProfileService.generateUserProfile(
        userId,
        chats,
        messages
      )

      userProfile.value = newProfile

      // 保存到数据库
      await saveUserProfileToDb(newProfile)

      console.log('用户画像更新完成')
    } catch (err: any) {
      error.value = err.message || '用户画像更新失败'
      console.error('用户画像更新错误:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新推荐配置
   */
  function updateConfig(newConfig: Partial<RecommendationConfig>): void {
    config.value = { ...config.value, ...newConfig }
    recommendationEngine.updateConfig(config.value)
  }

  /**
   * 更新个性化设置
   */
  async function updatePersonalizationSettings(
    userId: string,
    newSettings: Partial<PersonalizationSettings>
  ): Promise<void> {
    try {
      personalizationSettings.value = {
        ...personalizationSettings.value,
        ...newSettings
      }

      // 保存到数据库
      await savePersonalizationSettingsToDb(userId, personalizationSettings.value)

      console.log('个性化设置更新完成')
    } catch (err: any) {
      error.value = err.message || '设置更新失败'
      console.error('设置更新错误:', err)
    }
  }

  /**
   * 创建学习路径
   */
  async function createLearningPath(
    userId: string,
    topic: string
  ): Promise<void> {
    if (!personalizationSettings.value.enableLearningPaths || !userProfile.value) return

    loading.value = true

    try {
      const learningPath = await recommendationEngine.generateLearningPath(
        userId,
        topic,
        userProfile.value
      )

      learningPaths.value.push(learningPath)

      console.log('学习路径创建完成:', learningPath.title)
    } catch (err: any) {
      error.value = err.message || '学习路径创建失败'
      console.error('学习路径创建错误:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 清除推荐
   */
  function clearRecommendations(): void {
    recommendations.value = []
    smartSuggestions.value = []
    lastUpdated.value = null
  }

  /**
   * 清除错误
   */
  function clearError(): void {
    error.value = null
  }

  // Private helper methods

  async function loadUserProfile(userId: string): Promise<void> {
    try {
      // 通过IPC从数据库加载用户画像
      const profile = await window.electronAPI.invoke(
        'recommendation:getUserProfile',
        userId
      )
      userProfile.value = profile
    } catch (err) {
      console.warn('用户画像加载失败，将生成新的画像')
      // 如果没有画像，生成一个新的
      await updateUserProfile(userId)
    }
  }

  async function loadPersonalizationSettings(userId: string): Promise<void> {
    try {
      const settings = await window.electronAPI.invoke(
        'recommendation:getPersonalizationSettings',
        userId
      )
      personalizationSettings.value = settings
    } catch (err) {
      console.warn('个性化设置加载失败，使用默认设置')
    }
  }

  async function loadStats(userId: string): Promise<void> {
    try {
      const statsData = await window.electronAPI.invoke(
        'recommendation:getStats',
        userId
      )
      stats.value = statsData
    } catch (err) {
      console.warn('统计信息加载失败')
    }
  }

  async function saveRecommendationsToDb(
    userId: string,
    recommendations: RecommendationItem[]
  ): Promise<void> {
    try {
      await window.electronAPI.invoke(
        'recommendation:saveRecommendations',
        userId,
        recommendations
      )
    } catch (err) {
      console.warn('推荐记录保存失败')
    }
  }

  async function saveFeedbackToDb(feedback: UserFeedback): Promise<void> {
    try {
      await window.electronAPI.invoke(
        'recommendation:saveFeedback',
        feedback
      )
    } catch (err) {
      console.warn('反馈记录保存失败')
    }
  }

  async function saveUserProfileToDb(profile: UserProfile): Promise<void> {
    try {
      await window.electronAPI.invoke(
        'recommendation:saveUserProfile',
        profile
      )
    } catch (err) {
      console.warn('用户画像保存失败')
    }
  }

  async function savePersonalizationSettingsToDb(
    userId: string,
    settings: PersonalizationSettings
  ): Promise<void> {
    try {
      await window.electronAPI.invoke(
        'recommendation:savePersonalizationSettings',
        userId,
        settings
      )
    } catch (err) {
      console.warn('个性化设置保存失败')
    }
  }

  async function getChatDataFromDb(userId: string): Promise<{ chats: any[], messages: any[] }> {
    try {
      return await window.electronAPI.invoke(
        'recommendation:getChatData',
        userId
      )
    } catch (err) {
      console.error('聊天数据获取失败')
      return { chats: [], messages: [] }
    }
  }

  async function executeRecommendation(recommendation: RecommendationItem): Promise<void> {
    switch (recommendation.type) {
      case 'model':
        // 切换到推荐的模型
        await switchToRecommendedModel(recommendation)
        break
      case 'prompt':
        // 应用推荐的提示词
        await applyRecommendedPrompt(recommendation)
        break
      case 'topic':
        // 开始推荐的话题
        await startRecommendedTopic(recommendation)
        break
      case 'continuation':
        // 应用续写建议
        await applyContinuationSuggestion(recommendation)
        break
      default:
        console.log('推荐类型暂不支持自动执行:', recommendation.type)
    }
  }

  async function switchToRecommendedModel(recommendation: RecommendationItem): Promise<void> {
    if (recommendation.metadata?.model) {
      // 这里需要与设置store交互来切换模型
      console.log('切换到推荐模型:', recommendation.metadata.model)
    }
  }

  async function applyRecommendedPrompt(recommendation: RecommendationItem): Promise<void> {
    // 将推荐的提示词填入聊天输入框
    console.log('应用推荐提示词:', recommendation.content)
    // 这里需要与聊天store交互
  }

  async function startRecommendedTopic(recommendation: RecommendationItem): Promise<void> {
    // 开始新的话题对话
    console.log('开始推荐话题:', recommendation.title)
  }

  async function applyContinuationSuggestion(recommendation: RecommendationItem): Promise<void> {
    // 应用续写建议
    console.log('应用续写建议:', recommendation.content)
  }

  function updateStatsAfterFeedback(action: string): void {
    switch (action) {
      case 'click':
      case 'apply':
      case 'like':
        stats.value.totalAccepted++
        break
      case 'dismiss':
      case 'dislike':
        stats.value.totalDismissed++
        break
    }
  }

  return {
    // State
    recommendations,
    smartSuggestions,
    userProfile,
    learningPaths,
    loading,
    error,
    lastUpdated,
    config,
    personalizationSettings,
    stats,
    currentContext,

    // Computed
    isEnabled,
    hasProfile,
    hasRecommendations,
    topRecommendations,
    recommendationsByType,
    profileCompleteness,

    // Actions
    initialize,
    generateRecommendations,
    generateSmartSuggestions,
    recordFeedback,
    applyRecommendation,
    updateUserProfile,
    updateConfig,
    updatePersonalizationSettings,
    createLearningPath,
    clearRecommendations,
    clearError
  }
})

// 使用组合式 API 的持久化配置
export const useRecommendationStoreWithPersist = () => {
  const store = useRecommendationStore()
  
  // 持久化配置
  if (typeof window !== 'undefined' && window.localStorage) {
    const savedConfig = localStorage.getItem('recommendation-config')
    const savedSettings = localStorage.getItem('recommendation-settings')
    
    if (savedConfig) {
      try {
        store.config = JSON.parse(savedConfig)
      } catch (e) {
        console.error('Failed to parse saved config:', e)
      }
    }
    
    if (savedSettings) {
      try {
        store.personalizationSettings = JSON.parse(savedSettings)
      } catch (e) {
        console.error('Failed to parse saved settings:', e)
      }
    }
    
    // 监听变化并保存
    store.$subscribe((_mutation, state) => {
      localStorage.setItem('recommendation-config', JSON.stringify(state.config))
      localStorage.setItem('recommendation-settings', JSON.stringify(state.personalizationSettings))
    })
  }
  
  return store
}