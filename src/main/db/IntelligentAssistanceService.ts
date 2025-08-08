import { Database } from 'better-sqlite3'
import { BaseDatabaseService } from './BaseDatabaseService'
import { ContextService } from './ContextService'
import { RecommendationService } from './RecommendationService'
import { nanoid } from 'nanoid'

/**
 * Intelligent Assistance Service for smart prompt suggestions, model recommendations, and workflow automation
 */

interface PromptSuggestion {
  id: string
  type: 'continuation' | 'clarification' | 'expansion' | 'alternative' | 'template'
  content: string
  confidence: number
  reasoning: string
  category: string
  contextRelevant: boolean
  userPersonalized: boolean
  createdAt: Date
}

interface ModelRecommendation {
  modelId: string
  modelName: string
  provider: string
  confidence: number
  reasoning: string
  estimatedTokens: number
  estimatedCost?: number
  suitabilityScore: number
  features: string[]
}

interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  steps: WorkflowStep[]
  prompts: string[]
  expectedModels: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: number // in minutes
  usageCount: number
  rating: number
  createdBy: string
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

interface WorkflowStep {
  id: string
  order: number
  title: string
  description: string
  promptTemplate: string
  expectedOutputType: 'text' | 'code' | 'analysis' | 'creative'
  modelSuggestions: string[]
  validationCriteria?: string[]
}

interface TaskContext {
  taskType: 'coding' | 'writing' | 'analysis' | 'creative' | 'research' | 'learning' | 'debugging' | 'general'
  complexity: 'simple' | 'moderate' | 'complex'
  domain: string[]
  userExperience: 'beginner' | 'intermediate' | 'expert'
  timeConstraint?: 'urgent' | 'normal' | 'relaxed'
  outputFormat?: string
  additionalContext?: Record<string, any>
}

interface SmartSuggestion {
  type: 'prompt' | 'model' | 'workflow' | 'improvement' | 'optimization'
  title: string
  content: string
  actionable: boolean
  priority: 'low' | 'medium' | 'high'
  category: string
  metadata: Record<string, any>
  createdAt: Date
}

export class IntelligentAssistanceService extends BaseDatabaseService {
  private contextService: ContextService
  private recommendationService: RecommendationService

  constructor(db: Database) {
    super(db)
    this.contextService = new ContextService(db)
    this.recommendationService = new RecommendationService(db)
    this.initializeTables()
  }

  private initializeTables(): void {
    try {
      // Prompt suggestions table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS prompt_suggestions (
          id TEXT PRIMARY KEY,
          chat_id TEXT,
          user_id TEXT NOT NULL DEFAULT 'default',
          suggestion_type TEXT NOT NULL,
          content TEXT NOT NULL,
          confidence REAL NOT NULL,
          reasoning TEXT NOT NULL,
          category TEXT NOT NULL,
          context_relevant INTEGER NOT NULL DEFAULT 0,
          user_personalized INTEGER NOT NULL DEFAULT 0,
          usage_count INTEGER DEFAULT 0,
          success_rate REAL DEFAULT 0,
          created_at TEXT NOT NULL,
          FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_prompt_suggestions_chat ON prompt_suggestions(chat_id);
        CREATE INDEX IF NOT EXISTS idx_prompt_suggestions_user ON prompt_suggestions(user_id);
        CREATE INDEX IF NOT EXISTS idx_prompt_suggestions_type ON prompt_suggestions(suggestion_type);
        CREATE INDEX IF NOT EXISTS idx_prompt_suggestions_confidence ON prompt_suggestions(confidence);
      `)

      // Model recommendations history
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS model_recommendations (
          id TEXT PRIMARY KEY,
          chat_id TEXT,
          user_id TEXT NOT NULL DEFAULT 'default',
          message_context TEXT NOT NULL,
          task_type TEXT NOT NULL,
          recommended_model TEXT NOT NULL,
          recommended_provider TEXT NOT NULL,
          confidence REAL NOT NULL,
          reasoning TEXT NOT NULL,
          estimated_tokens INTEGER,
          estimated_cost REAL,
          suitability_score REAL NOT NULL,
          features TEXT NOT NULL DEFAULT '[]',
          was_accepted INTEGER DEFAULT 0,
          actual_performance REAL,
          user_feedback TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_model_recommendations_chat ON model_recommendations(chat_id);
        CREATE INDEX IF NOT EXISTS idx_model_recommendations_user ON model_recommendations(user_id);
        CREATE INDEX IF NOT EXISTS idx_model_recommendations_task ON model_recommendations(task_type);
        CREATE INDEX IF NOT EXISTS idx_model_recommendations_model ON model_recommendations(recommended_model);
      `)

      // Workflow templates
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS workflow_templates (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          category TEXT NOT NULL,
          steps TEXT NOT NULL DEFAULT '[]',
          prompts TEXT NOT NULL DEFAULT '[]',
          expected_models TEXT NOT NULL DEFAULT '[]',
          difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
          estimated_time INTEGER NOT NULL DEFAULT 30,
          usage_count INTEGER DEFAULT 0,
          rating REAL DEFAULT 0,
          rating_count INTEGER DEFAULT 0,
          created_by TEXT NOT NULL DEFAULT 'system',
          is_public INTEGER NOT NULL DEFAULT 1,
          tags TEXT DEFAULT '[]',
          metadata TEXT DEFAULT '{}',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON workflow_templates(category);
        CREATE INDEX IF NOT EXISTS idx_workflow_templates_difficulty ON workflow_templates(difficulty);
        CREATE INDEX IF NOT EXISTS idx_workflow_templates_rating ON workflow_templates(rating);
        CREATE INDEX IF NOT EXISTS idx_workflow_templates_usage ON workflow_templates(usage_count);
      `)

      // Task context tracking
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS task_contexts (
          id TEXT PRIMARY KEY,
          chat_id TEXT NOT NULL,
          user_id TEXT NOT NULL DEFAULT 'default',
          task_type TEXT NOT NULL,
          complexity TEXT NOT NULL,
          domain TEXT NOT NULL DEFAULT '[]',
          user_experience TEXT NOT NULL,
          time_constraint TEXT,
          output_format TEXT,
          additional_context TEXT DEFAULT '{}',
          detected_at TEXT NOT NULL,
          confidence REAL NOT NULL DEFAULT 0.5,
          FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_task_contexts_chat ON task_contexts(chat_id);
        CREATE INDEX IF NOT EXISTS idx_task_contexts_user ON task_contexts(user_id);
        CREATE INDEX IF NOT EXISTS idx_task_contexts_task_type ON task_contexts(task_type);
      `)

      // Smart suggestions cache
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS smart_suggestions (
          id TEXT PRIMARY KEY,
          chat_id TEXT,
          user_id TEXT NOT NULL DEFAULT 'default',
          suggestion_type TEXT NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          actionable INTEGER NOT NULL DEFAULT 1,
          priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
          category TEXT NOT NULL,
          metadata TEXT NOT NULL DEFAULT '{}',
          shown_at TEXT,
          clicked_at TEXT,
          dismissed_at TEXT,
          created_at TEXT NOT NULL,
          expires_at TEXT,
          FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_smart_suggestions_chat ON smart_suggestions(chat_id);
        CREATE INDEX IF NOT EXISTS idx_smart_suggestions_user ON smart_suggestions(user_id);
        CREATE INDEX IF NOT EXISTS idx_smart_suggestions_priority ON smart_suggestions(priority);
        CREATE INDEX IF NOT EXISTS idx_smart_suggestions_expires ON smart_suggestions(expires_at);
      `)

    } catch (error) {
      throw new Error(`Failed to initialize intelligent assistance tables: ${error}`)
    }
  }

  /**
   * Generate context-aware prompt suggestions
   */
  async generatePromptSuggestions(
    chatId: string,
    userId: string = 'default',
    currentMessage?: string,
    limit: number = 5
  ): Promise<PromptSuggestion[]> {
    try {
      const suggestions: PromptSuggestion[] = []
      
      // Get chat context
      const context = this.contextService.getEnhancedContext(chatId)
      const userPrefs = this.contextService.getUserPreferences(userId)
      
      // Get recent messages for context
      const recentMessages = this.db.prepare(`
        SELECT content, role FROM messages 
        WHERE chat_id = ? 
        ORDER BY created_at DESC 
        LIMIT 5
      `).all(chatId) as Array<{ content: string; role: string }>

      // Detect task context
      const taskContext = await this.detectTaskContext(chatId, userId, recentMessages, currentMessage)
      
      // Generate different types of suggestions
      
      // 1. Continuation suggestions
      if (recentMessages.length > 0) {
        const lastMessage = recentMessages[0]
        if (lastMessage.role === 'assistant') {
          suggestions.push({
            id: nanoid(),
            type: 'continuation',
            content: this.generateContinuationPrompt(lastMessage.content, taskContext),
            confidence: 0.8,
            reasoning: 'Based on the last assistant response',
            category: taskContext.taskType,
            contextRelevant: true,
            userPersonalized: false,
            createdAt: new Date()
          })
        }
      }

      // 2. Clarification suggestions
      if (this.needsClarification(recentMessages)) {
        suggestions.push({
          id: nanoid(),
          type: 'clarification',
          content: this.generateClarificationPrompt(recentMessages, taskContext),
          confidence: 0.9,
          reasoning: 'The conversation could benefit from clarification',
          category: 'clarification',
          contextRelevant: true,
          userPersonalized: false,
          createdAt: new Date()
        })
      }

      // 3. Template-based suggestions
      const templates = await this.getRelevantTemplates(taskContext, 3)
      templates.forEach(template => {
        suggestions.push({
          id: nanoid(),
          type: 'template',
          content: template.prompts[0] || `Try the ${template.name} workflow`,
          confidence: 0.7,
          reasoning: `Based on ${template.name} workflow template`,
          category: template.category,
          contextRelevant: true,
          userPersonalized: false,
          createdAt: new Date()
        })
      })

      // 4. Personalized suggestions based on user preferences
      userPrefs.slice(0, 2).forEach(pref => {
        suggestions.push({
          id: nanoid(),
          type: 'alternative',
          content: `Can you explain ${pref.key} in the context of ${taskContext.domain.join(' and ')}?`,
          confidence: 0.6,
          reasoning: `Based on your interest in ${pref.key}`,
          category: 'personalized',
          contextRelevant: false,
          userPersonalized: true,
          createdAt: new Date()
        })
      })

      // 5. Expansion suggestions
      if (context.context?.topicKeywords.length > 0) {
        const keyword = context.context.topicKeywords[0]
        suggestions.push({
          id: nanoid(),
          type: 'expansion',
          content: `Tell me more about ${keyword} and its applications`,
          confidence: 0.7,
          reasoning: `Expanding on the main topic: ${keyword}`,
          category: 'exploration',
          contextRelevant: true,
          userPersonalized: false,
          createdAt: new Date()
        })
      }

      // Save suggestions to database for tracking
      const sortedSuggestions = suggestions
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, limit)

      for (const suggestion of sortedSuggestions) {
        await this.saveSuggestion(suggestion, chatId, userId)
      }

      return sortedSuggestions

    } catch (error) {
      console.error('Failed to generate prompt suggestions:', error)
      return []
    }
  }

  /**
   * Recommend optimal model for the current task
   */
  async recommendModel(
    chatId: string,
    userId: string = 'default',
    messageContext: string,
    availableModels: Array<{ id: string; name: string; provider: string; features: string[] }>
  ): Promise<ModelRecommendation[]> {
    try {
      const taskContext = await this.detectTaskContext(chatId, userId, [], messageContext)
      const userPrefs = this.contextService.getUserPreferences(userId, 'model')
      
      const recommendations: ModelRecommendation[] = []

      for (const model of availableModels) {
        const recommendation = this.evaluateModelForTask(model, taskContext, messageContext, userPrefs)
        recommendations.push(recommendation)
      }

      // Sort by suitability score
      const sortedRecommendations = recommendations
        .sort((a, b) => b.suitabilityScore - a.suitabilityScore)
        .slice(0, 3)

      // Save recommendations for learning
      for (const rec of sortedRecommendations) {
        await this.saveModelRecommendation(rec, chatId, userId, messageContext, taskContext)
      }

      return sortedRecommendations

    } catch (error) {
      console.error('Failed to recommend model:', error)
      return []
    }
  }

  /**
   * Get relevant workflow templates
   */
  async getWorkflowSuggestions(
    taskContext: TaskContext,
    userId: string = 'default',
    limit: number = 5
  ): Promise<WorkflowTemplate[]> {
    try {
      // Get user's experience level and preferences
      const userPrefs = this.contextService.getUserPreferences(userId)
      const preferredCategories = userPrefs
        .filter(p => p.category === 'workflow')
        .map(p => p.key)

      let query = `
        SELECT * FROM workflow_templates 
        WHERE is_public = 1
      `
      const params: any[] = []

      // Filter by category if relevant
      if (taskContext.domain.length > 0) {
        const domainConditions = taskContext.domain.map(() => 'category LIKE ?').join(' OR ')
        query += ` AND (${domainConditions})`
        taskContext.domain.forEach(domain => params.push(`%${domain}%`))
      }

      // Filter by difficulty based on user experience
      if (taskContext.userExperience !== 'expert') {
        query += ` AND difficulty IN (?, ?)`
        if (taskContext.userExperience === 'beginner') {
          params.push('beginner', 'intermediate')
        } else {
          params.push('intermediate', 'advanced')
        }
      }

      query += ` ORDER BY 
        CASE WHEN category IN (${preferredCategories.map(() => '?').join(',')}) THEN 1 ELSE 0 END DESC,
        rating DESC, 
        usage_count DESC 
        LIMIT ?`
      
      params.push(...preferredCategories, limit)

      const templates = this.db.prepare(query).all(...params) as any[]

      return templates.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        steps: JSON.parse(template.steps),
        prompts: JSON.parse(template.prompts),
        expectedModels: JSON.parse(template.expected_models),
        difficulty: template.difficulty,
        estimatedTime: template.estimated_time,
        usageCount: template.usage_count,
        rating: template.rating,
        createdBy: template.created_by,
        isPublic: template.is_public === 1,
        createdAt: new Date(template.created_at),
        updatedAt: new Date(template.updated_at)
      }))

    } catch (error) {
      console.error('Failed to get workflow suggestions:', error)
      return []
    }
  }

  /**
   * Create custom workflow template
   */
  async createWorkflowTemplate(
    template: Omit<WorkflowTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'rating'>,
    userId: string = 'default'
  ): Promise<string> {
    try {
      const id = nanoid()
      const now = new Date().toISOString()

      this.db.prepare(`
        INSERT INTO workflow_templates 
        (id, name, description, category, steps, prompts, expected_models, difficulty, 
         estimated_time, created_by, is_public, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        template.name,
        template.description,
        template.category,
        JSON.stringify(template.steps),
        JSON.stringify(template.prompts),
        JSON.stringify(template.expectedModels),
        template.difficulty,
        template.estimatedTime,
        userId,
        template.isPublic ? 1 : 0,
        now,
        now
      )

      return id
    } catch (error) {
      console.error('Failed to create workflow template:', error)
      throw error
    }
  }

  /**
   * Generate smart suggestions for the current context
   */
  async generateSmartSuggestions(
    chatId: string,
    userId: string = 'default'
  ): Promise<SmartSuggestion[]> {
    try {
      const suggestions: SmartSuggestion[] = []
      
      // Get conversation context
      const context = this.contextService.getEnhancedContext(chatId)
      const recentMessages = this.db.prepare(`
        SELECT content, role, created_at FROM messages 
        WHERE chat_id = ? 
        ORDER BY created_at DESC 
        LIMIT 10
      `).all(chatId) as any[]

      const taskContext = await this.detectTaskContext(chatId, userId, recentMessages)
      
      // 1. Improvement suggestions
      if (this.hasRepeatedQuestions(recentMessages)) {
        suggestions.push({
          type: 'improvement',
          title: 'Consider Using a Workflow',
          content: 'I notice you\'re asking similar questions. Would you like me to suggest a workflow template that could help structure this process?',
          actionable: true,
          priority: 'medium',
          category: 'efficiency',
          metadata: { reason: 'repeated_patterns' },
          createdAt: new Date()
        })
      }

      // 2. Model optimization suggestions
      const modelPerformance = await this.analyzeModelPerformance(chatId)
      if (modelPerformance.suggestOptimization) {
        suggestions.push({
          type: 'optimization',
          title: 'Try a Different Model',
          content: `For ${taskContext.taskType} tasks, ${modelPerformance.recommendedModel} might give you better results.`,
          actionable: true,
          priority: 'high',
          category: 'performance',
          metadata: { recommendedModel: modelPerformance.recommendedModel },
          createdAt: new Date()
        })
      }

      // 3. Learning suggestions
      if (context.relatedConversations.length > 3) {
        suggestions.push({
          type: 'workflow',
          title: 'Explore Related Topics',
          content: `You have ${context.relatedConversations.length} related conversations. Would you like me to create a summary or suggest next steps?`,
          actionable: true,
          priority: 'low',
          category: 'exploration',
          metadata: { relatedCount: context.relatedConversations.length },
          createdAt: new Date()
        })
      }

      // Save suggestions to database
      for (const suggestion of suggestions) {
        await this.saveSmartSuggestion(suggestion, chatId, userId)
      }

      return suggestions

    } catch (error) {
      console.error('Failed to generate smart suggestions:', error)
      return []
    }
  }

  /**
   * Get intelligent assistance analytics
   */
  getAssistanceAnalytics(userId: string = 'default'): any {
    try {
      const promptSuggestionStats = this.db.prepare(`
        SELECT 
          suggestion_type,
          COUNT(*) as total,
          AVG(confidence) as avg_confidence,
          SUM(usage_count) as total_usage,
          AVG(success_rate) as avg_success_rate
        FROM prompt_suggestions 
        WHERE user_id = ?
        GROUP BY suggestion_type
      `).all(userId) as any[]

      const modelRecommendationStats = this.db.prepare(`
        SELECT 
          recommended_model,
          recommended_provider,
          COUNT(*) as total_recommendations,
          AVG(confidence) as avg_confidence,
          SUM(was_accepted) as total_accepted,
          AVG(actual_performance) as avg_performance
        FROM model_recommendations 
        WHERE user_id = ? AND actual_performance IS NOT NULL
        GROUP BY recommended_model, recommended_provider
      `).all(userId) as any[]

      const workflowUsage = this.db.prepare(`
        SELECT 
          category,
          difficulty,
          AVG(rating) as avg_rating,
          SUM(usage_count) as total_usage
        FROM workflow_templates 
        GROUP BY category, difficulty
      `).all() as any[]

      const taskContextDistribution = this.db.prepare(`
        SELECT 
          task_type,
          complexity,
          COUNT(*) as occurrences,
          AVG(confidence) as avg_detection_confidence
        FROM task_contexts 
        WHERE user_id = ?
        GROUP BY task_type, complexity
      `).all(userId) as any[]

      return {
        promptSuggestions: promptSuggestionStats,
        modelRecommendations: modelRecommendationStats,
        workflowUsage,
        taskContextDistribution,
        totalInteractions: promptSuggestionStats.reduce((sum, stat) => sum + stat.total_usage, 0)
      }

    } catch (error) {
      console.error('Failed to get assistance analytics:', error)
      return {
        promptSuggestions: [],
        modelRecommendations: [],
        workflowUsage: [],
        taskContextDistribution: [],
        totalInteractions: 0
      }
    }
  }

  // Private helper methods

  private async detectTaskContext(
    chatId: string,
    userId: string,
    messages: Array<{ content: string; role: string }>,
    currentMessage?: string
  ): Promise<TaskContext> {
    const allText = (currentMessage ? [currentMessage] : [])
      .concat(messages.map(m => m.content))
      .join(' ')
      .toLowerCase()

    // Simple task type detection based on keywords
    let taskType: TaskContext['taskType'] = 'general'
    if (allText.includes('code') || allText.includes('function') || allText.includes('debug')) {
      taskType = 'coding'
    } else if (allText.includes('write') || allText.includes('essay') || allText.includes('article')) {
      taskType = 'writing'
    } else if (allText.includes('analyze') || allText.includes('data') || allText.includes('research')) {
      taskType = 'analysis'
    } else if (allText.includes('creative') || allText.includes('story') || allText.includes('design')) {
      taskType = 'creative'
    } else if (allText.includes('learn') || allText.includes('explain') || allText.includes('understand')) {
      taskType = 'learning'
    }

    // Complexity detection
    let complexity: TaskContext['complexity'] = 'moderate'
    const complexWords = ['complex', 'advanced', 'detailed', 'comprehensive']
    const simpleWords = ['simple', 'basic', 'quick', 'easy']
    
    if (complexWords.some(word => allText.includes(word))) {
      complexity = 'complex'
    } else if (simpleWords.some(word => allText.includes(word))) {
      complexity = 'simple'
    }

    // Domain detection
    const domains: string[] = []
    const domainKeywords = {
      'programming': ['code', 'software', 'programming', 'development'],
      'science': ['research', 'experiment', 'hypothesis', 'data'],
      'business': ['business', 'strategy', 'market', 'profit'],
      'education': ['learn', 'teach', 'study', 'education'],
      'creative': ['creative', 'art', 'design', 'story']
    }

    Object.entries(domainKeywords).forEach(([domain, keywords]) => {
      if (keywords.some(keyword => allText.includes(keyword))) {
        domains.push(domain)
      }
    })

    return {
      taskType,
      complexity,
      domain: domains,
      userExperience: 'intermediate', // Could be inferred from user history
      timeConstraint: allText.includes('urgent') || allText.includes('quickly') ? 'urgent' : 'normal'
    }
  }

  private generateContinuationPrompt(lastAssistantMessage: string, context: TaskContext): string {
    const continuations = [
      'Can you provide a specific example of this?',
      'How would I implement this in practice?',
      'What are the potential challenges with this approach?',
      'Are there alternative methods to consider?',
      'Can you break this down into steps?'
    ]

    // Choose based on task type
    if (context.taskType === 'coding') {
      return 'Can you show me the code implementation for this?'
    } else if (context.taskType === 'learning') {
      return 'Can you give me a practical example to help me understand better?'
    }

    return continuations[Math.floor(Math.random() * continuations.length)]
  }

  private generateClarificationPrompt(messages: Array<{ content: string; role: string }>, context: TaskContext): string {
    const clarifications = [
      'Can you be more specific about what you need?',
      'What exactly are you trying to achieve?',
      'Can you provide more context about your situation?',
      'What have you tried so far?',
      'What would be the ideal outcome for you?'
    ]

    return clarifications[Math.floor(Math.random() * clarifications.length)]
  }

  private needsClarification(messages: Array<{ content: string; role: string }>): boolean {
    if (messages.length < 2) return false
    
    const lastUserMessage = messages.find(m => m.role === 'user')
    if (!lastUserMessage) return false

    // Simple heuristics for unclear messages
    const content = lastUserMessage.content.toLowerCase()
    const unclearIndicators = ['help', 'how', 'what', 'can you', 'i need']
    const hasUnclearIndicator = unclearIndicators.some(indicator => content.includes(indicator))
    const isShort = content.split(' ').length < 5

    return hasUnclearIndicator && isShort
  }

  private async getRelevantTemplates(context: TaskContext, limit: number): Promise<WorkflowTemplate[]> {
    const templates = await this.getWorkflowSuggestions(context, 'default', limit)
    return templates
  }

  private evaluateModelForTask(
    model: { id: string; name: string; provider: string; features: string[] },
    context: TaskContext,
    messageContext: string,
    userPrefs: any[]
  ): ModelRecommendation {
    let suitabilityScore = 0.5 // Base score
    let reasoning = `${model.name} is a general-purpose model`

    // Task-specific scoring
    if (context.taskType === 'coding' && model.features.includes('code')) {
      suitabilityScore += 0.3
      reasoning = `${model.name} is optimized for coding tasks`
    } else if (context.taskType === 'creative' && model.features.includes('creative')) {
      suitabilityScore += 0.3
      reasoning = `${model.name} excels at creative tasks`
    } else if (context.taskType === 'analysis' && model.features.includes('analysis')) {
      suitabilityScore += 0.3
      reasoning = `${model.name} is designed for analytical tasks`
    }

    // Complexity scoring
    if (context.complexity === 'complex' && model.features.includes('advanced')) {
      suitabilityScore += 0.2
    } else if (context.complexity === 'simple' && model.features.includes('fast')) {
      suitabilityScore += 0.1
    }

    // User preference bonus
    const preferredModel = userPrefs.find(p => p.key === model.id)
    if (preferredModel) {
      suitabilityScore += 0.1
      reasoning += ` (based on your preferences)`
    }

    // Estimate tokens (very rough)
    const estimatedTokens = Math.max(100, messageContext.split(' ').length * 1.3)

    return {
      modelId: model.id,
      modelName: model.name,
      provider: model.provider,
      confidence: Math.min(suitabilityScore, 1.0),
      reasoning,
      estimatedTokens: Math.round(estimatedTokens),
      suitabilityScore: Math.min(suitabilityScore, 1.0),
      features: model.features
    }
  }

  private hasRepeatedQuestions(messages: Array<{ content: string; role: string }>): boolean {
    const userMessages = messages.filter(m => m.role === 'user')
    if (userMessages.length < 3) return false

    // Simple similarity check
    const contents = userMessages.map(m => m.content.toLowerCase())
    const similarities = []
    
    for (let i = 0; i < contents.length - 1; i++) {
      for (let j = i + 1; j < contents.length; j++) {
        const similarity = this.calculateStringSimilarity(contents[i], contents[j])
        similarities.push(similarity)
      }
    }

    return similarities.some(sim => sim > 0.7)
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const words1 = str1.split(' ')
    const words2 = str2.split(' ')
    const commonWords = words1.filter(word => words2.includes(word))
    
    return commonWords.length / Math.max(words1.length, words2.length)
  }

  private async analyzeModelPerformance(chatId: string): Promise<{
    suggestOptimization: boolean
    recommendedModel?: string
    currentPerformance: number
  }> {
    // Simple placeholder implementation
    return {
      suggestOptimization: Math.random() > 0.7,
      recommendedModel: 'gpt-4',
      currentPerformance: 0.75
    }
  }

  // Database helper methods

  private async saveSuggestion(suggestion: PromptSuggestion, chatId: string, userId: string): Promise<void> {
    try {
      this.db.prepare(`
        INSERT INTO prompt_suggestions 
        (id, chat_id, user_id, suggestion_type, content, confidence, reasoning, category, 
         context_relevant, user_personalized, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        suggestion.id,
        chatId,
        userId,
        suggestion.type,
        suggestion.content,
        suggestion.confidence,
        suggestion.reasoning,
        suggestion.category,
        suggestion.contextRelevant ? 1 : 0,
        suggestion.userPersonalized ? 1 : 0,
        suggestion.createdAt.toISOString()
      )
    } catch (error) {
      // Silent failure for tracking
    }
  }

  private async saveModelRecommendation(
    recommendation: ModelRecommendation,
    chatId: string,
    userId: string,
    messageContext: string,
    taskContext: TaskContext
  ): Promise<void> {
    try {
      this.db.prepare(`
        INSERT INTO model_recommendations 
        (id, chat_id, user_id, message_context, task_type, recommended_model, recommended_provider,
         confidence, reasoning, estimated_tokens, suitability_score, features, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        nanoid(),
        chatId,
        userId,
        messageContext.substring(0, 500), // Truncate for storage
        taskContext.taskType,
        recommendation.modelId,
        recommendation.provider,
        recommendation.confidence,
        recommendation.reasoning,
        recommendation.estimatedTokens,
        recommendation.suitabilityScore,
        JSON.stringify(recommendation.features),
        new Date().toISOString()
      )
    } catch (error) {
      // Silent failure for tracking
    }
  }

  private async saveSmartSuggestion(suggestion: SmartSuggestion, chatId: string, userId: string): Promise<void> {
    try {
      this.db.prepare(`
        INSERT INTO smart_suggestions 
        (id, chat_id, user_id, suggestion_type, title, content, actionable, priority, 
         category, metadata, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        nanoid(),
        chatId,
        userId,
        suggestion.type,
        suggestion.title,
        suggestion.content,
        suggestion.actionable ? 1 : 0,
        suggestion.priority,
        suggestion.category,
        JSON.stringify(suggestion.metadata),
        suggestion.createdAt.toISOString()
      )
    } catch (error) {
      // Silent failure for tracking
    }
  }
}