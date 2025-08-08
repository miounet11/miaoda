import { BaseDatabaseService } from './BaseDatabaseService'
import { SemanticSearchService } from './SemanticSearchService'
import { ContextService } from './ContextService'
import type { SearchQuery, SearchResult } from './searchTypes'
import type { MessageRecord } from './types'

/**
 * Advanced Search Service combining semantic search, context awareness, and intelligent discovery
 */

interface SearchInsight {
  type: 'pattern' | 'trend' | 'suggestion' | 'related_topic'
  title: string
  description: string
  confidence: number
  actionable: boolean
  metadata: Record<string, any>
}

interface SearchAnalytics {
  totalSearches: number
  popularQueries: Array<{ query: string; count: number }>
  searchSuccessRate: number
  averageResponseTime: number
  commonTopics: string[]
  userSearchPatterns: Record<string, number>
}

interface KnowledgeGraphNode {
  id: string
  type: 'chat' | 'topic' | 'keyword' | 'user'
  label: string
  properties: Record<string, any>
  connections: number
}

interface KnowledgeGraphEdge {
  from: string
  to: string
  type: 'contains' | 'relates_to' | 'mentions' | 'follows'
  weight: number
  properties: Record<string, any>
}

interface KnowledgeGraph {
  nodes: KnowledgeGraphNode[]
  edges: KnowledgeGraphEdge[]
  clusters: Array<{ id: string; nodes: string[]; topic: string }>
}

export class AdvancedSearchService extends BaseDatabaseService {
  private semanticSearch: SemanticSearchService
  private contextService: ContextService
  private searchCache: Map<string, { results: SearchResult[], timestamp: number }> = new Map()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  constructor(db: any, apiKey?: string) {
    super(db)
    this.semanticSearch = new SemanticSearchService(db, apiKey)
    this.contextService = new ContextService(db)
    this.initializeAdvancedTables()
  }

  private initializeAdvancedTables(): void {
    try {
      // Search analytics table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS search_analytics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          query TEXT NOT NULL,
          user_id TEXT NOT NULL DEFAULT 'default',
          result_count INTEGER NOT NULL,
          execution_time_ms INTEGER NOT NULL,
          search_type TEXT NOT NULL,
          success INTEGER NOT NULL DEFAULT 1,
          clicked_results TEXT DEFAULT '[]',
          created_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics(query);
        CREATE INDEX IF NOT EXISTS idx_search_analytics_user ON search_analytics(user_id);
        CREATE INDEX IF NOT EXISTS idx_search_analytics_created ON search_analytics(created_at);
      `)

      // Knowledge graph nodes
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS knowledge_graph_nodes (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          label TEXT NOT NULL,
          properties TEXT NOT NULL DEFAULT '{}',
          connections INTEGER DEFAULT 0,
          importance_score REAL DEFAULT 0.5,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_kg_nodes_type ON knowledge_graph_nodes(type);
        CREATE INDEX IF NOT EXISTS idx_kg_nodes_label ON knowledge_graph_nodes(label);
        CREATE INDEX IF NOT EXISTS idx_kg_nodes_importance ON knowledge_graph_nodes(importance_score);
      `)

      // Knowledge graph edges
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS knowledge_graph_edges (
          id TEXT PRIMARY KEY,
          from_node TEXT NOT NULL,
          to_node TEXT NOT NULL,
          edge_type TEXT NOT NULL,
          weight REAL NOT NULL DEFAULT 0.5,
          properties TEXT NOT NULL DEFAULT '{}',
          created_at TEXT NOT NULL,
          FOREIGN KEY (from_node) REFERENCES knowledge_graph_nodes(id) ON DELETE CASCADE,
          FOREIGN KEY (to_node) REFERENCES knowledge_graph_nodes(id) ON DELETE CASCADE,
          UNIQUE(from_node, to_node, edge_type)
        );

        CREATE INDEX IF NOT EXISTS idx_kg_edges_from ON knowledge_graph_edges(from_node);
        CREATE INDEX IF NOT EXISTS idx_kg_edges_to ON knowledge_graph_edges(to_node);
        CREATE INDEX IF NOT EXISTS idx_kg_edges_weight ON knowledge_graph_edges(weight);
      `)

      // Search insights table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS search_insights (
          id TEXT PRIMARY KEY,
          insight_type TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          confidence REAL NOT NULL,
          actionable INTEGER NOT NULL DEFAULT 0,
          metadata TEXT NOT NULL DEFAULT '{}',
          user_id TEXT NOT NULL DEFAULT 'default',
          created_at TEXT NOT NULL,
          shown_at TEXT,
          dismissed_at TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_search_insights_type ON search_insights(insight_type);
        CREATE INDEX IF NOT EXISTS idx_search_insights_user ON search_insights(user_id);
        CREATE INDEX IF NOT EXISTS idx_search_insights_confidence ON search_insights(confidence);
      `)

    } catch (error) {
      throw new Error(`Failed to initialize advanced search tables: ${error}`)
    }
  }

  /**
   * Enhanced search with context awareness and intelligent suggestions
   */
  async intelligentSearch(query: SearchQuery, userId: string = 'default'): Promise<{
    results: SearchResult[]
    insights: SearchInsight[]
    suggestions: string[]
    relatedTopics: string[]
    analytics: any
  }> {
    const startTime = Date.now()
    
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(query)
      const cached = this.searchCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return {
          results: cached.results,
          insights: [],
          suggestions: [],
          relatedTopics: [],
          analytics: { cached: true, executionTime: Date.now() - startTime }
        }
      }

      // Get user context for personalization
      const userPreferences = this.contextService.getUserPreferences(userId)
      const contextKeywords = userPreferences
        .filter(p => p.category === 'topic' || p.category === 'keyword')
        .slice(0, 10)
        .map(p => p.key)

      // Enhance query with context
      const enhancedQuery = this.enhanceQueryWithContext(query, contextKeywords)

      // Run multiple search strategies in parallel
      const [
        semanticResults,
        contextualResults,
        relatedConversations
      ] = await Promise.all([
        this.semanticSearch.hybridSearch(enhancedQuery),
        this.contextualSearch(enhancedQuery, userId),
        this.findRelatedConversations(query.text)
      ])

      // Merge and re-rank results
      const mergedResults = this.mergeAndRankResults([
        ...semanticResults,
        ...contextualResults
      ], query, userPreferences)

      // Generate insights and suggestions
      const insights = await this.generateSearchInsights(query, mergedResults, userId)
      const suggestions = this.generateQuerySuggestions(query.text, userPreferences)
      const relatedTopics = this.extractRelatedTopics(mergedResults)

      // Cache results
      this.searchCache.set(cacheKey, {
        results: mergedResults,
        timestamp: Date.now()
      })

      // Log analytics
      const executionTime = Date.now() - startTime
      await this.logSearchAnalytics(query.text, userId, mergedResults.length, executionTime)

      return {
        results: mergedResults,
        insights,
        suggestions,
        relatedTopics,
        analytics: {
          executionTime,
          strategiesUsed: ['semantic', 'contextual', 'related'],
          totalResults: mergedResults.length
        }
      }

    } catch (error) {
      console.error('Intelligent search failed:', error)
      throw error
    }
  }

  /**
   * Build and update knowledge graph from conversations
   */
  async buildKnowledgeGraph(): Promise<void> {
    try {
      console.log('Building knowledge graph...')

      // Clear existing graph
      this.db.prepare('DELETE FROM knowledge_graph_edges').run()
      this.db.prepare('DELETE FROM knowledge_graph_nodes').run()

      // Get all chats and their contexts
      const chats = this.db.prepare(`
        SELECT c.id, c.title, cc.topic_keywords, cc.context_summary
        FROM chats c
        LEFT JOIN conversation_contexts cc ON c.id = cc.chat_id
        ORDER BY c.updated_at DESC
      `).all() as any[]

      const nodeMap: Map<string, KnowledgeGraphNode> = new Map()
      const edges: Array<{ from: string; to: string; type: string; weight: number }> = []

      // Create chat nodes
      for (const chat of chats) {
        const chatNode: KnowledgeGraphNode = {
          id: `chat_${chat.id}`,
          type: 'chat',
          label: chat.title || 'Untitled Chat',
          properties: {
            chatId: chat.id,
            summary: chat.context_summary || ''
          },
          connections: 0
        }
        nodeMap.set(chatNode.id, chatNode)

        // Create topic nodes from keywords
        if (chat.topic_keywords) {
          const keywords = JSON.parse(chat.topic_keywords)
          for (const keyword of keywords) {
            const topicId = `topic_${keyword.toLowerCase()}`
            
            if (!nodeMap.has(topicId)) {
              const topicNode: KnowledgeGraphNode = {
                id: topicId,
                type: 'topic',
                label: keyword,
                properties: { keyword },
                connections: 0
              }
              nodeMap.set(topicId, topicNode)
            }

            // Create edge between chat and topic
            edges.push({
              from: chatNode.id,
              to: topicId,
              type: 'contains',
              weight: 0.8
            })
          }
        }
      }

      // Find related chats and create connections
      const conversationLinks = this.db.prepare(`
        SELECT from_chat_id, to_chat_id, strength, shared_keywords
        FROM conversation_links
        WHERE strength > 0.3
      `).all() as any[]

      for (const link of conversationLinks) {
        edges.push({
          from: `chat_${link.from_chat_id}`,
          to: `chat_${link.to_chat_id}`,
          type: 'relates_to',
          weight: link.strength
        })
      }

      // Create topic-to-topic connections based on co-occurrence
      const topicCoOccurrence = this.calculateTopicCoOccurrence(chats)
      for (const [topicPair, weight] of Object.entries(topicCoOccurrence)) {
        const [topic1, topic2] = topicPair.split('|')
        if (weight > 0.2) {
          edges.push({
            from: `topic_${topic1}`,
            to: `topic_${topic2}`,
            type: 'relates_to',
            weight: weight as number
          })
        }
      }

      // Calculate node importance and connections
      for (const edge of edges) {
        const fromNode = nodeMap.get(edge.from)
        const toNode = nodeMap.get(edge.to)
        if (fromNode) fromNode.connections++
        if (toNode) toNode.connections++
      }

      // Save nodes to database
      const insertNodeStmt = this.db.prepare(`
        INSERT INTO knowledge_graph_nodes 
        (id, type, label, properties, connections, importance_score, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)

      const now = new Date().toISOString()
      for (const node of nodeMap.values()) {
        const importanceScore = this.calculateNodeImportance(node, edges)
        insertNodeStmt.run(
          node.id,
          node.type,
          node.label,
          JSON.stringify(node.properties),
          node.connections,
          importanceScore,
          now,
          now
        )
      }

      // Save edges to database
      const insertEdgeStmt = this.db.prepare(`
        INSERT INTO knowledge_graph_edges 
        (id, from_node, to_node, edge_type, weight, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `)

      for (const edge of edges) {
        insertEdgeStmt.run(
          `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          edge.from,
          edge.to,
          edge.type,
          edge.weight,
          now
        )
      }

      console.log(`Knowledge graph built: ${nodeMap.size} nodes, ${edges.length} edges`)

    } catch (error) {
      console.error('Failed to build knowledge graph:', error)
    }
  }

  /**
   * Get knowledge graph data for visualization
   */
  getKnowledgeGraph(limit: number = 100): KnowledgeGraph {
    try {
      const nodes = this.db.prepare(`
        SELECT * FROM knowledge_graph_nodes 
        ORDER BY importance_score DESC, connections DESC 
        LIMIT ?
      `).all(limit) as any[]

      const nodeIds = nodes.map(n => n.id)
      const placeholders = nodeIds.map(() => '?').join(',')

      const edges = this.db.prepare(`
        SELECT * FROM knowledge_graph_edges 
        WHERE from_node IN (${placeholders}) AND to_node IN (${placeholders})
        ORDER BY weight DESC
      `).all(...nodeIds, ...nodeIds) as any[]

      // Generate clusters based on connected components
      const clusters = this.findGraphClusters(nodes, edges)

      return {
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type,
          label: node.label,
          properties: JSON.parse(node.properties || '{}'),
          connections: node.connections
        })),
        edges: edges.map(edge => ({
          from: edge.from_node,
          to: edge.to_node,
          type: edge.edge_type,
          weight: edge.weight,
          properties: JSON.parse(edge.properties || '{}')
        })),
        clusters
      }
    } catch (error) {
      console.error('Failed to get knowledge graph:', error)
      return { nodes: [], edges: [], clusters: [] }
    }
  }

  /**
   * Generate intelligent search suggestions based on user patterns
   */
  async generateSmartSuggestions(userId: string = 'default'): Promise<string[]> {
    try {
      // Get user's recent search patterns
      const recentSearches = this.db.prepare(`
        SELECT query, COUNT(*) as frequency
        FROM search_analytics 
        WHERE user_id = ? AND created_at > datetime('now', '-30 days')
        GROUP BY query
        ORDER BY frequency DESC, created_at DESC
        LIMIT 10
      `).all(userId) as Array<{ query: string; frequency: number }>

      // Get trending topics from knowledge graph
      const trendingTopics = this.db.prepare(`
        SELECT label, connections
        FROM knowledge_graph_nodes 
        WHERE type = 'topic' 
        ORDER BY importance_score DESC, connections DESC
        LIMIT 10
      `).all() as Array<{ label: string; connections: number }>

      // Get user preferences
      const preferences = this.contextService.getUserPreferences(userId, 'topic')

      const suggestions: string[] = []

      // Add personalized suggestions based on preferences
      preferences.slice(0, 3).forEach(pref => {
        suggestions.push(`Tell me more about ${pref.key}`)
        suggestions.push(`Recent updates on ${pref.key}`)
      })

      // Add trending topic suggestions
      trendingTopics.slice(0, 3).forEach(topic => {
        suggestions.push(`Explore ${topic.label}`)
        suggestions.push(`What did we discuss about ${topic.label}?`)
      })

      // Add query expansion suggestions based on recent searches
      recentSearches.slice(0, 3).forEach(search => {
        suggestions.push(`${search.query} examples`)
        suggestions.push(`More details about ${search.query}`)
      })

      return suggestions.slice(0, 12) // Return top 12 suggestions

    } catch (error) {
      console.error('Failed to generate smart suggestions:', error)
      return []
    }
  }

  /**
   * Get search analytics and insights
   */
  getSearchAnalytics(userId: string = 'default', days: number = 30): SearchAnalytics {
    try {
      const since = new Date()
      since.setDate(since.getDate() - days)
      const sinceIso = since.toISOString()

      const totalSearches = this.db.prepare(`
        SELECT COUNT(*) as count FROM search_analytics 
        WHERE user_id = ? AND created_at > ?
      `).get(userId, sinceIso) as { count: number }

      const popularQueries = this.db.prepare(`
        SELECT query, COUNT(*) as count 
        FROM search_analytics 
        WHERE user_id = ? AND created_at > ?
        GROUP BY query 
        ORDER BY count DESC 
        LIMIT 10
      `).all(userId, sinceIso) as Array<{ query: string; count: number }>

      const successRate = this.db.prepare(`
        SELECT AVG(success) as rate FROM search_analytics 
        WHERE user_id = ? AND created_at > ?
      `).get(userId, sinceIso) as { rate: number }

      const avgResponseTime = this.db.prepare(`
        SELECT AVG(execution_time_ms) as avg_time FROM search_analytics 
        WHERE user_id = ? AND created_at > ?
      `).get(userId, sinceIso) as { avg_time: number }

      const commonTopics = this.db.prepare(`
        SELECT label, COUNT(*) as mentions
        FROM knowledge_graph_nodes n
        JOIN knowledge_graph_edges e ON n.id = e.to_node
        WHERE n.type = 'topic'
        GROUP BY label
        ORDER BY mentions DESC
        LIMIT 10
      `).all() as Array<{ label: string; mentions: number }>

      return {
        totalSearches: totalSearches.count,
        popularQueries,
        searchSuccessRate: successRate.rate || 0,
        averageResponseTime: avgResponseTime.avg_time || 0,
        commonTopics: commonTopics.map(t => t.label),
        userSearchPatterns: {} // Would need more complex analysis
      }

    } catch (error) {
      console.error('Failed to get search analytics:', error)
      return {
        totalSearches: 0,
        popularQueries: [],
        searchSuccessRate: 0,
        averageResponseTime: 0,
        commonTopics: [],
        userSearchPatterns: {}
      }
    }
  }

  // Private helper methods

  private enhanceQueryWithContext(query: SearchQuery, contextKeywords: string[]): SearchQuery {
    // Add relevant context keywords to boost search relevance
    const enhancedText = query.text + ' ' + contextKeywords.join(' ')
    
    return {
      ...query,
      text: enhancedText,
      options: {
        ...query.options,
        contextEnhanced: true,
        originalQuery: query.text
      }
    }
  }

  private async contextualSearch(query: SearchQuery, userId: string): Promise<SearchResult[]> {
    // Get user's conversation contexts that might be relevant
    const userContexts = this.db.prepare(`
      SELECT chat_id, context_summary, topic_keywords
      FROM conversation_contexts
      WHERE user_id = ?
      ORDER BY updated_at DESC
      LIMIT 20
    `).all(userId) as any[]

    const relevantChatIds: string[] = []
    const queryLower = query.text.toLowerCase()

    for (const context of userContexts) {
      const keywords = JSON.parse(context.topic_keywords || '[]')
      const hasRelevantKeyword = keywords.some((kw: string) => 
        queryLower.includes(kw.toLowerCase()) || kw.toLowerCase().includes(queryLower)
      )
      
      if (hasRelevantKeyword || context.context_summary.toLowerCase().includes(queryLower)) {
        relevantChatIds.push(context.chat_id)
      }
    }

    if (relevantChatIds.length === 0) return []

    // Search within relevant chats
    const contextualQuery = {
      ...query,
      filters: {
        ...query.filters,
        chatIds: relevantChatIds
      }
    }

    return this.semanticSearch.semanticSearch(contextualQuery)
  }

  private async findRelatedConversations(queryText: string): Promise<SearchResult[]> {
    // Simple keyword-based related conversation finding
    const keywords = queryText.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    if (keywords.length === 0) return []

    const results: SearchResult[] = []
    
    for (const keyword of keywords.slice(0, 3)) { // Check top 3 keywords
      const relatedChats = this.db.prepare(`
        SELECT DISTINCT c.id, c.title, m.id as message_id, m.content, m.role, m.created_at
        FROM chats c
        JOIN messages m ON c.id = m.chat_id
        WHERE LOWER(m.content) LIKE ?
        ORDER BY m.created_at DESC
        LIMIT 5
      `).all(`%${keyword}%`) as any[]

      for (const chat of relatedChats) {
        results.push({
          message: {
            id: chat.message_id,
            chatId: chat.id,
            role: chat.role as 'user' | 'assistant',
            content: chat.content,
            timestamp: new Date(chat.created_at)
          },
          score: 0.6, // Medium relevance for keyword matches
          matches: [{
            field: 'content',
            text: chat.content.substring(0, 100),
            startIndex: 0,
            endIndex: 100,
            highlighted: this.highlightKeyword(chat.content.substring(0, 100), keyword)
          }]
        })
      }
    }

    return results.slice(0, 10) // Return top 10 results
  }

  private mergeAndRankResults(
    results: SearchResult[], 
    query: SearchQuery, 
    userPreferences: any[]
  ): SearchResult[] {
    const userKeywords = userPreferences.map(p => p.key.toLowerCase())
    
    // Re-rank results based on user preferences
    return results
      .map(result => {
        let boostedScore = result.score
        
        // Boost score if content matches user preferences
        const content = result.message.content.toLowerCase()
        const matchingPrefs = userKeywords.filter(kw => content.includes(kw))
        boostedScore += matchingPrefs.length * 0.1
        
        return { ...result, score: boostedScore }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, query.options?.maxResults || 50)
  }

  private async generateSearchInsights(
    query: SearchQuery, 
    results: SearchResult[], 
    userId: string
  ): Promise<SearchInsight[]> {
    const insights: SearchInsight[] = []

    // Pattern detection
    if (results.length > 10) {
      const chatIds = [...new Set(results.map(r => r.message.chatId))]
      if (chatIds.length < 3) {
        insights.push({
          type: 'pattern',
          title: 'Concentrated Topic',
          description: `Most results come from ${chatIds.length} conversation(s). This topic seems to be a focused area of discussion.`,
          confidence: 0.8,
          actionable: true,
          metadata: { chatIds }
        })
      }
    }

    // Trend detection
    const recentResults = results.filter(r => 
      Date.now() - r.message.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000 // Last 7 days
    )

    if (recentResults.length > results.length * 0.6) {
      insights.push({
        type: 'trend',
        title: 'Recent Activity',
        description: 'This topic has been frequently discussed recently. You might want to explore related areas.',
        confidence: 0.7,
        actionable: true,
        metadata: { recentPercentage: recentResults.length / results.length }
      })
    }

    return insights
  }

  private generateQuerySuggestions(queryText: string, userPreferences: any[]): string[] {
    const suggestions: string[] = []
    const words = queryText.toLowerCase().split(/\s+/)
    
    // Add expansion suggestions
    suggestions.push(`${queryText} examples`)
    suggestions.push(`How to ${queryText}`)
    suggestions.push(`${queryText} best practices`)
    
    // Add preference-based suggestions
    userPreferences.slice(0, 2).forEach(pref => {
      suggestions.push(`${queryText} and ${pref.key}`)
    })

    return suggestions.slice(0, 6)
  }

  private extractRelatedTopics(results: SearchResult[]): string[] {
    const topicFreq: Record<string, number> = {}
    
    results.forEach(result => {
      const words = result.message.content.toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 4 && !['this', 'that', 'with', 'from', 'they', 'have', 'been'].includes(w))
      
      words.forEach(word => {
        topicFreq[word] = (topicFreq[word] || 0) + 1
      })
    })

    return Object.entries(topicFreq)
      .filter(([_, count]) => count >= 3)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 8)
      .map(([word, _]) => word)
  }

  private calculateTopicCoOccurrence(chats: any[]): Record<string, number> {
    const coOccurrence: Record<string, number> = {}
    
    chats.forEach(chat => {
      if (chat.topic_keywords) {
        const keywords = JSON.parse(chat.topic_keywords)
        
        for (let i = 0; i < keywords.length; i++) {
          for (let j = i + 1; j < keywords.length; j++) {
            const pair1 = `${keywords[i]}|${keywords[j]}`
            const pair2 = `${keywords[j]}|${keywords[i]}`
            const key = pair1 < pair2 ? pair1 : pair2
            
            coOccurrence[key] = (coOccurrence[key] || 0) + 1
          }
        }
      }
    })

    // Normalize by total co-occurrences
    const maxCount = Math.max(...Object.values(coOccurrence))
    Object.keys(coOccurrence).forEach(key => {
      coOccurrence[key] = coOccurrence[key] / maxCount
    })

    return coOccurrence
  }

  private calculateNodeImportance(node: KnowledgeGraphNode, edges: any[]): number {
    // Simple PageRank-like calculation
    let importance = 0.15 // Base importance
    
    const incomingEdges = edges.filter(e => e.to === node.id)
    const outgoingEdges = edges.filter(e => e.from === node.id)
    
    // Weight based on connections and edge weights
    const incomingWeight = incomingEdges.reduce((sum, e) => sum + e.weight, 0)
    const outgoingWeight = outgoingEdges.reduce((sum, e) => sum + e.weight, 0)
    
    importance += (incomingWeight + outgoingWeight * 0.5) / 10
    
    // Boost for certain node types
    if (node.type === 'topic') importance *= 1.2
    if (node.type === 'chat') importance *= 1.1
    
    return Math.min(importance, 1.0)
  }

  private findGraphClusters(nodes: any[], edges: any[]): Array<{ id: string; nodes: string[]; topic: string }> {
    // Simple clustering based on connected components
    const visited = new Set<string>()
    const clusters: Array<{ id: string; nodes: string[]; topic: string }> = []
    
    const getConnected = (nodeId: string): string[] => {
      const connected = new Set<string>()
      const queue = [nodeId]
      
      while (queue.length > 0) {
        const current = queue.shift()!
        if (visited.has(current)) continue
        
        visited.add(current)
        connected.add(current)
        
        edges.forEach(edge => {
          if (edge.from_node === current && !visited.has(edge.to_node)) {
            queue.push(edge.to_node)
          }
          if (edge.to_node === current && !visited.has(edge.from_node)) {
            queue.push(edge.from_node)
          }
        })
      }
      
      return Array.from(connected)
    }

    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        const clusterNodes = getConnected(node.id)
        if (clusterNodes.length >= 3) { // Only clusters with 3+ nodes
          const topicNodes = clusterNodes.filter(id => id.startsWith('topic_'))
          const clusterTopic = topicNodes.length > 0 ? 
            nodes.find(n => n.id === topicNodes[0])?.label || 'Mixed Topics' :
            'General Discussion'
          
          clusters.push({
            id: `cluster_${clusters.length + 1}`,
            nodes: clusterNodes,
            topic: clusterTopic
          })
        }
      }
    })

    return clusters
  }

  private generateCacheKey(query: SearchQuery): string {
    return `${query.text}_${JSON.stringify(query.filters)}_${JSON.stringify(query.options)}`
  }

  private highlightKeyword(text: string, keyword: string): string {
    const regex = new RegExp(`(${keyword})`, 'gi')
    return text.replace(regex, '<mark>$1</mark>')
  }

  private async logSearchAnalytics(
    query: string,
    userId: string,
    resultCount: number,
    executionTime: number,
    success: boolean = true
  ): Promise<void> {
    try {
      this.db.prepare(`
        INSERT INTO search_analytics 
        (query, user_id, result_count, execution_time_ms, search_type, success, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        query,
        userId,
        resultCount,
        executionTime,
        'intelligent',
        success ? 1 : 0,
        new Date().toISOString()
      )
    } catch (error) {
      // Silent failure for analytics
    }
  }
}