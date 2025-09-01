/**
 * 用户记忆系统服务
 * 实现个性化记忆和智能推荐功能
 */

import { ref, computed } from 'vue'

// 用户基础信息接口
export interface UserBasicInfo {
  name?: string
  nickname?: string
  occupation?: string
  interests: string[]
  birthday?: string
  location?: string
  timezone?: string
}

// 用户偏好设置接口
export interface UserPreferences {
  responseStyle: 'formal' | 'casual' | 'humorous' | 'concise' | 'detailed'
  language: string
  favoriteTopics: string[]
  dislikedTopics: string[]
  preferredModels: string[]
  voiceEnabled: boolean
  autoSuggestions: boolean
  responseLength: 'short' | 'medium' | 'long'
}

// 用户使用习惯接口
export interface UserHabits {
  activeHours: number[] // 0-23 活跃时间段
  frequentQueries: Map<string, number> // 常见问题及频率
  averageSessionLength: number // 平均会话时长(分钟)
  preferredFeatures: string[] // 常用功能
  interactionStyle: 'quick' | 'detailed' | 'exploratory'
}

// 记忆条目接口
export interface MemoryEntry {
  id: string
  type: 'fact' | 'preference' | 'habit' | 'context'
  content: string
  importance: number // 0-10 重要性评分
  timestamp: Date
  expiresAt?: Date
  tags: string[]
  source: 'explicit' | 'inferred' // 明确告知或推断
}

// 用户记忆完整模型
export interface UserMemory {
  userId: string
  basicInfo: UserBasicInfo
  preferences: UserPreferences
  habits: UserHabits
  memories: MemoryEntry[]
  lastUpdated: Date
  version: number
}

// 智能推荐接口
export interface SmartRecommendation {
  id: string
  type: 'content' | 'feature' | 'reminder' | 'tip'
  title: string
  description: string
  reason: string // 推荐理由
  confidence: number // 0-1 置信度
  priority: 'low' | 'medium' | 'high'
  action?: () => void
  dismissible: boolean
}

class UserMemoryService {
  private static instance: UserMemoryService
  private memory = ref<UserMemory | null>(null)
  private recommendations = ref<SmartRecommendation[]>([])
  private memoryUpdateCallbacks: Set<(memory: UserMemory) => void> = new Set()

  private constructor() {
    this.loadMemory()
    this.startBackgroundAnalysis()
  }

  static getInstance(): UserMemoryService {
    if (!UserMemoryService.instance) {
      UserMemoryService.instance = new UserMemoryService()
    }
    return UserMemoryService.instance
  }

  // 加载用户记忆
  private async loadMemory() {
    try {
      const stored = localStorage.getItem('user_memory')
      if (stored) {
        this.memory.value = JSON.parse(stored)
      } else {
        this.initializeMemory()
      }
    } catch (error) {
      console.error('Failed to load user memory:', error)
      this.initializeMemory()
    }
  }

  // 初始化记忆
  private initializeMemory() {
    this.memory.value = {
      userId: this.generateUserId(),
      basicInfo: {
        interests: []
      },
      preferences: {
        responseStyle: 'casual',
        language: 'zh-CN',
        favoriteTopics: [],
        dislikedTopics: [],
        preferredModels: [],
        voiceEnabled: true,
        autoSuggestions: true,
        responseLength: 'medium'
      },
      habits: {
        activeHours: [],
        frequentQueries: new Map(),
        averageSessionLength: 0,
        preferredFeatures: [],
        interactionStyle: 'quick'
      },
      memories: [],
      lastUpdated: new Date(),
      version: 1
    }
    this.saveMemory()
  }

  // 生成用户ID
  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 保存记忆到本地
  private async saveMemory() {
    if (!this.memory.value) return
    
    try {
      // 转换Map为数组以便序列化
      const memoryToSave = {
        ...this.memory.value,
        habits: {
          ...this.memory.value.habits,
          frequentQueries: Array.from(this.memory.value.habits.frequentQueries.entries())
        }
      }
      localStorage.setItem('user_memory', JSON.stringify(memoryToSave))
      
      // 触发更新回调
      this.memoryUpdateCallbacks.forEach(callback => {
        callback(this.memory.value!)
      })
    } catch (error) {
      console.error('Failed to save user memory:', error)
    }
  }

  // 更新基础信息
  updateBasicInfo(info: Partial<UserBasicInfo>) {
    if (!this.memory.value) return
    
    this.memory.value.basicInfo = {
      ...this.memory.value.basicInfo,
      ...info
    }
    this.memory.value.lastUpdated = new Date()
    this.saveMemory()
    
    // 根据新信息生成推荐
    this.generateRecommendations()
  }

  // 更新偏好设置
  updatePreferences(preferences: Partial<UserPreferences>) {
    if (!this.memory.value) return
    
    this.memory.value.preferences = {
      ...this.memory.value.preferences,
      ...preferences
    }
    this.memory.value.lastUpdated = new Date()
    this.saveMemory()
  }

  // 记录用户习惯
  recordHabit(habitType: string, value: any) {
    if (!this.memory.value) return
    
    switch (habitType) {
      case 'query':
        this.recordQuery(value)
        break
      case 'active_time':
        this.recordActiveTime()
        break
      case 'feature_use':
        this.recordFeatureUse(value)
        break
      case 'session_length':
        this.recordSessionLength(value)
        break
    }
    
    this.saveMemory()
  }

  // 记录查询
  private recordQuery(query: string) {
    const queries = this.memory.value!.habits.frequentQueries
    const count = queries.get(query) || 0
    queries.set(query, count + 1)
    
    // 保持最多100个查询记录
    if (queries.size > 100) {
      const entries = Array.from(queries.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 100)
      this.memory.value!.habits.frequentQueries = new Map(entries)
    }
  }

  // 记录活跃时间
  private recordActiveTime() {
    const hour = new Date().getHours()
    const hours = this.memory.value!.habits.activeHours
    if (!hours.includes(hour)) {
      hours.push(hour)
    }
  }

  // 记录功能使用
  private recordFeatureUse(feature: string) {
    const features = this.memory.value!.habits.preferredFeatures
    if (!features.includes(feature)) {
      features.push(feature)
    }
    
    // 保持最多20个常用功能
    if (features.length > 20) {
      features.shift()
    }
  }

  // 记录会话时长
  private recordSessionLength(minutes: number) {
    const habits = this.memory.value!.habits
    const current = habits.averageSessionLength
    // 计算移动平均
    habits.averageSessionLength = current * 0.8 + minutes * 0.2
  }

  // 添加记忆条目
  addMemory(entry: Omit<MemoryEntry, 'id' | 'timestamp'>) {
    if (!this.memory.value) return
    
    const newEntry: MemoryEntry = {
      ...entry,
      id: this.generateMemoryId(),
      timestamp: new Date()
    }
    
    this.memory.value.memories.push(newEntry)
    
    // 限制记忆条目数量
    if (this.memory.value.memories.length > 500) {
      // 按重要性和时间排序，保留重要的和最近的
      this.memory.value.memories.sort((a, b) => {
        const scoreA = a.importance + (Date.now() - a.timestamp.getTime()) / (1000 * 60 * 60 * 24)
        const scoreB = b.importance + (Date.now() - b.timestamp.getTime()) / (1000 * 60 * 60 * 24)
        return scoreB - scoreA
      })
      this.memory.value.memories = this.memory.value.memories.slice(0, 400)
    }
    
    this.memory.value.lastUpdated = new Date()
    this.saveMemory()
  }

  // 生成记忆ID
  private generateMemoryId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 搜索记忆
  searchMemories(query: string, type?: MemoryEntry['type']): MemoryEntry[] {
    if (!this.memory.value) return []
    
    return this.memory.value.memories.filter(entry => {
      const matchesType = !type || entry.type === type
      const matchesContent = entry.content.toLowerCase().includes(query.toLowerCase()) ||
                           entry.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      return matchesType && matchesContent
    })
  }

  // 获取相关记忆
  getRelevantMemories(context: string, limit: number = 5): MemoryEntry[] {
    if (!this.memory.value) return []
    
    // 简单的相关性评分算法
    const scored = this.memory.value.memories.map(entry => {
      let score = 0
      
      // 内容匹配
      const words = context.toLowerCase().split(' ')
      words.forEach(word => {
        if (entry.content.toLowerCase().includes(word)) {
          score += 1
        }
      })
      
      // 标签匹配
      entry.tags.forEach(tag => {
        if (context.toLowerCase().includes(tag.toLowerCase())) {
          score += 2
        }
      })
      
      // 重要性加权
      score *= (entry.importance / 10)
      
      // 时间衰减
      const daysSince = (Date.now() - entry.timestamp.getTime()) / (1000 * 60 * 60 * 24)
      score *= Math.exp(-daysSince / 30) // 30天半衰期
      
      return { entry, score }
    })
    
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.entry)
  }

  // 生成智能推荐
  private generateRecommendations() {
    const newRecommendations: SmartRecommendation[] = []
    
    if (!this.memory.value) return
    
    // 基于兴趣的推荐
    if (this.memory.value.basicInfo.interests.length > 0) {
      this.memory.value.basicInfo.interests.forEach(interest => {
        newRecommendations.push({
          id: `rec_interest_${interest}`,
          type: 'content',
          title: `探索${interest}相关内容`,
          description: `发现更多关于${interest}的精彩内容`,
          reason: `基于您的兴趣爱好`,
          confidence: 0.8,
          priority: 'medium',
          dismissible: true
        })
      })
    }
    
    // 基于使用习惯的推荐
    const activeHours = this.memory.value.habits.activeHours
    const currentHour = new Date().getHours()
    
    if (activeHours.includes(currentHour)) {
      newRecommendations.push({
        id: 'rec_active_time',
        type: 'tip',
        title: '您的活跃时段',
        description: '这是您经常使用的时间，我已准备好为您服务',
        reason: '基于您的使用习惯',
        confidence: 0.9,
        priority: 'low',
        dismissible: true
      })
    }
    
    // 基于常用功能的推荐
    if (this.memory.value.habits.preferredFeatures.length > 0) {
      const feature = this.memory.value.habits.preferredFeatures[0]
      newRecommendations.push({
        id: `rec_feature_${feature}`,
        type: 'feature',
        title: `快速访问${feature}`,
        description: '您经常使用此功能，已为您优先显示',
        reason: '基于您的使用频率',
        confidence: 0.85,
        priority: 'medium',
        dismissible: false
      })
    }
    
    this.recommendations.value = newRecommendations
  }

  // 获取推荐
  getRecommendations(type?: SmartRecommendation['type']): SmartRecommendation[] {
    if (type) {
      return this.recommendations.value.filter(rec => rec.type === type)
    }
    return this.recommendations.value
  }

  // 解除推荐
  dismissRecommendation(id: string) {
    this.recommendations.value = this.recommendations.value.filter(rec => rec.id !== id)
  }

  // 后台分析任务
  private startBackgroundAnalysis() {
    // 每30分钟分析一次用户行为
    setInterval(() => {
      this.analyzeUserBehavior()
      this.generateRecommendations()
    }, 30 * 60 * 1000)
  }

  // 分析用户行为
  private analyzeUserBehavior() {
    if (!this.memory.value) return
    
    // 分析查询模式
    const queries = Array.from(this.memory.value.habits.frequentQueries.entries())
    const topQueries = queries.sort((a, b) => b[1] - a[1]).slice(0, 10)
    
    // 推断兴趣话题
    const topics = new Set<string>()
    topQueries.forEach(([query]) => {
      // 简单的主题提取
      if (query.includes('编程') || query.includes('代码')) topics.add('编程')
      if (query.includes('学习') || query.includes('教育')) topics.add('学习')
      if (query.includes('工作') || query.includes('职业')) topics.add('工作')
      if (query.includes('健康') || query.includes('运动')) topics.add('健康')
      if (query.includes('美食') || query.includes('烹饪')) topics.add('美食')
    })
    
    // 更新偏好话题
    if (topics.size > 0) {
      this.memory.value.preferences.favoriteTopics = Array.from(topics)
    }
    
    // 推断交互风格
    const avgLength = this.memory.value.habits.averageSessionLength
    if (avgLength < 5) {
      this.memory.value.habits.interactionStyle = 'quick'
    } else if (avgLength < 15) {
      this.memory.value.habits.interactionStyle = 'detailed'
    } else {
      this.memory.value.habits.interactionStyle = 'exploratory'
    }
  }

  // 导出用户记忆
  exportMemory(): string {
    if (!this.memory.value) return '{}'
    return JSON.stringify(this.memory.value, null, 2)
  }

  // 导入用户记忆
  importMemory(data: string) {
    try {
      const imported = JSON.parse(data)
      // 验证导入的数据结构
      if (imported.userId && imported.basicInfo && imported.preferences) {
        this.memory.value = imported
        this.saveMemory()
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to import memory:', error)
      return false
    }
  }

  // 清除所有记忆
  clearMemory() {
    this.initializeMemory()
    this.recommendations.value = []
  }

  // 订阅记忆更新
  onMemoryUpdate(callback: (memory: UserMemory) => void) {
    this.memoryUpdateCallbacks.add(callback)
    return () => {
      this.memoryUpdateCallbacks.delete(callback)
    }
  }

  // 获取当前记忆
  getCurrentMemory() {
    return this.memory.value
  }

  // 获取用户画像摘要
  getUserProfile(): string {
    if (!this.memory.value) return '新用户'
    
    const { basicInfo, preferences, habits } = this.memory.value
    const profile: string[] = []
    
    if (basicInfo.name) profile.push(`姓名: ${basicInfo.name}`)
    if (basicInfo.occupation) profile.push(`职业: ${basicInfo.occupation}`)
    if (basicInfo.interests.length > 0) profile.push(`兴趣: ${basicInfo.interests.join(', ')}`)
    
    profile.push(`偏好风格: ${preferences.responseStyle}`)
    profile.push(`交互风格: ${habits.interactionStyle}`)
    
    return profile.join('\n')
  }
}

// 导出单例
export const userMemoryService = UserMemoryService.getInstance()

// 导出Vue组合式API hook
export function useUserMemory() {
  const service = userMemoryService
  
  return {
    memory: computed(() => service.getCurrentMemory()),
    recommendations: computed(() => service.getRecommendations()),
    updateBasicInfo: (info: Partial<UserBasicInfo>) => service.updateBasicInfo(info),
    updatePreferences: (prefs: Partial<UserPreferences>) => service.updatePreferences(prefs),
    recordHabit: (type: string, value: any) => service.recordHabit(type, value),
    addMemory: (entry: Omit<MemoryEntry, 'id' | 'timestamp'>) => service.addMemory(entry),
    searchMemories: (query: string, type?: MemoryEntry['type']) => service.searchMemories(query, type),
    getRelevantMemories: (context: string, limit?: number) => service.getRelevantMemories(context, limit),
    dismissRecommendation: (id: string) => service.dismissRecommendation(id),
    getUserProfile: () => service.getUserProfile(),
    exportMemory: () => service.exportMemory(),
    importMemory: (data: string) => service.importMemory(data),
    clearMemory: () => service.clearMemory()
  }
}