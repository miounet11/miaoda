import { BaseDatabaseService } from './BaseDatabaseService'
import type { SearchQuery, SearchResult, SearchMatch } from './searchTypes'
import type { MessageRecord } from './types'
import axios from 'axios'

/**
 * Embedding provider interface
 */
interface EmbeddingProvider {
  name: string
  generateEmbedding(text: string): Promise<number[]>
  batchGenerateEmbeddings(texts: string[]): Promise<number[][]>
  getDimensions(): number
}

/**
 * Local embedding provider using lightweight models
 */
class LocalEmbeddingProvider implements EmbeddingProvider {
  name = 'local-transformer'
  private dimensions = 384 // Typical for sentence transformers

  async generateEmbedding(text: string): Promise<number[]> {
    // Fallback to simple TF-IDF based embedding for now
    // In production, this would use a proper embedding model
    return this.simpleTextEmbedding(text)
  }

  async batchGenerateEmbeddings(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map(text => this.generateEmbedding(text)))
  }

  getDimensions(): number {
    return this.dimensions
  }

  private simpleTextEmbedding(text: string): number[] {
    // Simple hash-based embedding (placeholder for real implementation)
    const words = text.toLowerCase().split(/\s+/)
    const embedding = new Array(this.dimensions).fill(0)
    
    for (const word of words) {
      const hash = this.simpleHash(word)
      for (let i = 0; i < this.dimensions; i++) {
        embedding[i] += Math.sin(hash * (i + 1)) / words.length
      }
    }
    
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
    return embedding.map(val => magnitude > 0 ? val / magnitude : 0)
  }

  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }
}

/**
 * OpenAI embedding provider
 */
class OpenAIEmbeddingProvider implements EmbeddingProvider {
  name = 'openai-text-embedding-3-small'
  private apiKey: string
  private dimensions = 1536
  private baseURL = 'https://api.openai.com/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await axios.post(
        `${this.baseURL}/embeddings`,
        {
          input: text,
          model: 'text-embedding-3-small',
          dimensions: this.dimensions
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      return response.data.data[0].embedding
    } catch (error) {
      console.warn('OpenAI embedding failed, falling back to local:', error)
      // Fallback to local embedding
      const localProvider = new LocalEmbeddingProvider()
      return localProvider.generateEmbedding(text)
    }
  }

  async batchGenerateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await axios.post(
        `${this.baseURL}/embeddings`,
        {
          input: texts,
          model: 'text-embedding-3-small',
          dimensions: this.dimensions
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      return response.data.data.map((item: any) => item.embedding)
    } catch (error) {
      console.warn('OpenAI batch embedding failed, falling back to local:', error)
      const localProvider = new LocalEmbeddingProvider()
      return localProvider.batchGenerateEmbeddings(texts)
    }
  }

  getDimensions(): number {
    return this.dimensions
  }
}

/**
 * Vector similarity calculation utilities
 */
class VectorUtils {
  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0
    
    let dotProduct = 0
    let normA = 0
    let normB = 0
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }
    
    const magnitude = Math.sqrt(normA) * Math.sqrt(normB)
    return magnitude > 0 ? dotProduct / magnitude : 0
  }

  static euclideanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) return Infinity
    
    let sum = 0
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i]
      sum += diff * diff
    }
    return Math.sqrt(sum)
  }

  static dotProduct(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0
    
    let product = 0
    for (let i = 0; i < a.length; i++) {
      product += a[i] * b[i]
    }
    return product
  }
}

/**
 * High-performance semantic search service with vector embeddings
 */
export class SemanticSearchService extends BaseDatabaseService {
  private embeddingProvider: EmbeddingProvider
  private searchCache: Map<string, { embedding: number[], timestamp: number }> = new Map()
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours
  private readonly CACHE_MAX_SIZE = 1000
  private readonly BATCH_SIZE = 50
  private readonly SIMILARITY_THRESHOLD = 0.3

  constructor(db: any, apiKey?: string) {
    super(db)
    
    // Choose embedding provider based on availability
    if (apiKey) {
      this.embeddingProvider = new OpenAIEmbeddingProvider(apiKey)
    } else {
      this.embeddingProvider = new LocalEmbeddingProvider()
    }
    
    this.initializeVectorTables()
  }

  /**
   * Initialize vector storage tables
   */
  private initializeVectorTables(): void {
    try {
      // Create vector embeddings table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS message_embeddings (
          message_id TEXT PRIMARY KEY,
          chat_id TEXT NOT NULL,
          content_hash TEXT NOT NULL,
          embedding BLOB NOT NULL,
          model_name TEXT NOT NULL,
          dimensions INTEGER NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
          FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_embeddings_chat_id ON message_embeddings(chat_id);
        CREATE INDEX IF NOT EXISTS idx_embeddings_model ON message_embeddings(model_name);
        CREATE INDEX IF NOT EXISTS idx_embeddings_hash ON message_embeddings(content_hash);

        -- Semantic search statistics
        CREATE TABLE IF NOT EXISTS semantic_search_stats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          query TEXT NOT NULL,
          query_embedding_time_ms INTEGER NOT NULL,
          vector_search_time_ms INTEGER NOT NULL,
          total_search_time_ms INTEGER NOT NULL,
          result_count INTEGER NOT NULL,
          similarity_threshold REAL NOT NULL,
          created_at TEXT NOT NULL
        );

        -- Search query cache for performance
        CREATE TABLE IF NOT EXISTS search_query_cache (
          query_hash TEXT PRIMARY KEY,
          query_text TEXT NOT NULL,
          embedding BLOB NOT NULL,
          model_name TEXT NOT NULL,
          created_at TEXT NOT NULL,
          access_count INTEGER DEFAULT 1,
          last_accessed TEXT NOT NULL
        );
      `)
    } catch (error) {
      throw new Error(`Failed to initialize vector tables: ${error}`)
    }
  }

  /**
   * Generate and store embeddings for all messages
   */
  async buildSemanticIndex(): Promise<{ processed: number, failed: number }> {
    const startTime = Date.now()
    let processed = 0
    let failed = 0

    try {
      // Get all messages that need embedding
      const messages = this.db.prepare(`
        SELECT m.id, m.chat_id, m.content, m.created_at
        FROM messages m
        LEFT JOIN message_embeddings e ON m.id = e.message_id 
          AND e.model_name = ?
        WHERE e.message_id IS NULL
          AND LENGTH(TRIM(m.content)) > 10
        ORDER BY m.created_at DESC
      `).all(this.embeddingProvider.name) as Array<{
        id: string
        chat_id: string
        content: string
        created_at: string
      }>

      console.log(`Building semantic index for ${messages.length} messages`)

      // Process in batches for efficiency
      for (let i = 0; i < messages.length; i += this.BATCH_SIZE) {
        const batch = messages.slice(i, i + this.BATCH_SIZE)
        
        try {
          // Generate embeddings for batch
          const texts = batch.map(msg => this.preprocessText(msg.content))
          const embeddings = await this.embeddingProvider.batchGenerateEmbeddings(texts)

          // Store embeddings
          const insertStmt = this.db.prepare(`
            INSERT OR REPLACE INTO message_embeddings 
            (message_id, chat_id, content_hash, embedding, model_name, dimensions, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `)

          for (let j = 0; j < batch.length; j++) {
            const message = batch[j]
            const embedding = embeddings[j]
            const contentHash = this.hashContent(message.content)
            
            insertStmt.run(
              message.id,
              message.chat_id,
              contentHash,
              this.serializeVector(embedding),
              this.embeddingProvider.name,
              embedding.length,
              message.created_at,
              new Date().toISOString()
            )
            processed++
          }

          // Progress logging every 100 messages
          if (processed % 100 === 0) {
            console.log(`Processed ${processed}/${messages.length} embeddings`)
          }

        } catch (error) {
          console.error(`Failed to process batch ${i}:`, error)
          failed += batch.length
        }
      }

      const totalTime = Date.now() - startTime
      console.log(`Semantic index built: ${processed} processed, ${failed} failed in ${totalTime}ms`)

      return { processed, failed }
    } catch (error) {
      throw new Error(`Failed to build semantic index: ${error}`)
    }
  }

  /**
   * Perform semantic search with vector similarity
   */
  async semanticSearch(query: SearchQuery): Promise<SearchResult[]> {
    const startTime = Date.now()

    try {
      // Generate query embedding
      const queryEmbeddingStart = Date.now()
      const queryText = this.preprocessText(query.text)
      const queryEmbedding = await this.getCachedQueryEmbedding(queryText)
      const queryEmbeddingTime = Date.now() - queryEmbeddingStart

      // Vector search
      const vectorSearchStart = Date.now()
      const vectorResults = await this.vectorSimilaritySearch(
        queryEmbedding, 
        query.options?.maxResults || 50,
        query.filters
      )
      const vectorSearchTime = Date.now() - vectorSearchStart

      // Convert to SearchResult format
      const searchResults = await this.formatSemanticResults(vectorResults, query)

      // Log search statistics
      const totalTime = Date.now() - startTime
      this.logSemanticSearchStats(
        query.text,
        queryEmbeddingTime,
        vectorSearchTime,
        totalTime,
        searchResults.length,
        this.SIMILARITY_THRESHOLD
      )

      return searchResults

    } catch (error) {
      console.error('Semantic search failed:', error)
      throw error
    }
  }

  /**
   * Hybrid search combining semantic and lexical search
   */
  async hybridSearch(query: SearchQuery): Promise<SearchResult[]> {
    try {
      // Run both searches in parallel
      const [semanticResults, lexicalResults] = await Promise.all([
        this.semanticSearch(query).catch(err => {
          console.warn('Semantic search failed:', err)
          return []
        }),
        this.legacySearch(query)
      ])

      // Merge and re-rank results
      return this.mergeSearchResults(semanticResults, lexicalResults, query)
    } catch (error) {
      console.error('Hybrid search failed:', error)
      // Fallback to lexical search only
      return this.legacySearch(query)
    }
  }

  /**
   * Get similar messages for contextual search
   */
  async findSimilarMessages(messageId: string, limit = 5): Promise<SearchResult[]> {
    try {
      // Get the target message embedding
      const targetEmbedding = this.db.prepare(`
        SELECT embedding FROM message_embeddings WHERE message_id = ?
      `).get(messageId) as { embedding: Buffer } | undefined

      if (!targetEmbedding) {
        return []
      }

      const embedding = this.deserializeVector(targetEmbedding.embedding)
      
      // Find similar messages
      const similarResults = await this.vectorSimilaritySearch(
        embedding,
        limit + 1, // +1 to exclude the original message
        {}
      )

      // Filter out the original message
      const filtered = similarResults.filter(result => result.message_id !== messageId)

      return this.formatSemanticResults(filtered.slice(0, limit), {
        text: '',
        filters: {},
        options: { maxResults: limit }
      })

    } catch (error) {
      console.error('Failed to find similar messages:', error)
      return []
    }
  }

  /**
   * Update embedding when message content changes
   */
  async updateMessageEmbedding(messageId: string, content: string): Promise<void> {
    try {
      const contentHash = this.hashContent(content)
      
      // Check if embedding needs update
      const existing = this.db.prepare(`
        SELECT content_hash FROM message_embeddings WHERE message_id = ?
      `).get(messageId) as { content_hash: string } | undefined

      if (existing && existing.content_hash === contentHash) {
        return // No update needed
      }

      // Generate new embedding
      const preprocessedText = this.preprocessText(content)
      const embedding = await this.embeddingProvider.generateEmbedding(preprocessedText)

      // Update database
      this.db.prepare(`
        INSERT OR REPLACE INTO message_embeddings 
        (message_id, chat_id, content_hash, embedding, model_name, dimensions, created_at, updated_at)
        SELECT m.chat_id, ?, ?, ?, ?, ?, m.created_at, ?
        FROM messages m WHERE m.id = ?
      `).run(
        contentHash,
        this.serializeVector(embedding),
        this.embeddingProvider.name,
        embedding.length,
        new Date().toISOString(),
        messageId
      )

    } catch (error) {
      console.error('Failed to update message embedding:', error)
    }
  }

  /**
   * Delete embedding when message is deleted
   */
  deleteMessageEmbedding(messageId: string): void {
    try {
      this.db.prepare('DELETE FROM message_embeddings WHERE message_id = ?').run(messageId)
    } catch (error) {
      console.error('Failed to delete message embedding:', error)
    }
  }

  /**
   * Get semantic search statistics
   */
  getSemanticSearchStats(): any {
    try {
      const totalEmbeddings = this.db.prepare(
        'SELECT COUNT(*) as count FROM message_embeddings'
      ).get() as { count: number }

      const totalMessages = this.db.prepare(
        'SELECT COUNT(*) as count FROM messages'
      ).get() as { count: number }

      const avgSearchTime = this.db.prepare(`
        SELECT AVG(total_search_time_ms) as avg_time
        FROM semantic_search_stats
        WHERE created_at > datetime('now', '-30 days')
      `).get() as { avg_time: number } | undefined

      const modelStats = this.db.prepare(`
        SELECT model_name, COUNT(*) as count, AVG(dimensions) as avg_dim
        FROM message_embeddings
        GROUP BY model_name
      `).all() as Array<{ model_name: string, count: number, avg_dim: number }>

      const recentSearches = this.db.prepare(`
        SELECT COUNT(*) as count
        FROM semantic_search_stats
        WHERE created_at > datetime('now', '-24 hours')
      `).get() as { count: number }

      return {
        embeddedMessages: totalEmbeddings.count,
        totalMessages: totalMessages.count,
        indexingComplete: totalEmbeddings.count >= totalMessages.count,
        avgSearchTime: avgSearchTime?.avg_time || 0,
        modelStats,
        recentSearches: recentSearches.count,
        embeddingProvider: this.embeddingProvider.name,
        dimensions: this.embeddingProvider.getDimensions(),
        similarityThreshold: this.SIMILARITY_THRESHOLD
      }
    } catch (error) {
      console.error('Failed to get semantic search stats:', error)
      return {
        embeddedMessages: 0,
        totalMessages: 0,
        indexingComplete: false,
        avgSearchTime: 0,
        modelStats: [],
        recentSearches: 0,
        embeddingProvider: this.embeddingProvider.name,
        dimensions: 0,
        similarityThreshold: this.SIMILARITY_THRESHOLD
      }
    }
  }

  // Private helper methods

  private preprocessText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s\u4e00-\u9fff]/g, ' ') // Keep alphanumeric and Chinese characters
      .trim()
      .toLowerCase()
  }

  private hashContent(content: string): string {
    // Simple content hash for change detection
    let hash = 0
    const str = this.preprocessText(content)
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(16)
  }

  private serializeVector(vector: number[]): Buffer {
    const buffer = Buffer.allocUnsafe(vector.length * 4)
    for (let i = 0; i < vector.length; i++) {
      buffer.writeFloatLE(vector[i], i * 4)
    }
    return buffer
  }

  private deserializeVector(buffer: Buffer): number[] {
    const vector: number[] = []
    for (let i = 0; i < buffer.length; i += 4) {
      vector.push(buffer.readFloatLE(i))
    }
    return vector
  }

  private async getCachedQueryEmbedding(queryText: string): Promise<number[]> {
    const queryHash = this.hashContent(queryText)
    
    // Check cache first
    let cached = this.searchCache.get(queryHash)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.embedding
    }

    // Check database cache
    const dbCached = this.db.prepare(`
      SELECT embedding FROM search_query_cache WHERE query_hash = ?
    `).get(queryHash) as { embedding: Buffer } | undefined

    if (dbCached) {
      const embedding = this.deserializeVector(dbCached.embedding)
      this.searchCache.set(queryHash, { embedding, timestamp: Date.now() })
      
      // Update access stats
      this.db.prepare(`
        UPDATE search_query_cache 
        SET access_count = access_count + 1, last_accessed = ?
        WHERE query_hash = ?
      `).run(new Date().toISOString(), queryHash)
      
      return embedding
    }

    // Generate new embedding
    const embedding = await this.embeddingProvider.generateEmbedding(queryText)
    
    // Cache in memory
    this.searchCache.set(queryHash, { embedding, timestamp: Date.now() })
    
    // Cache in database
    this.db.prepare(`
      INSERT OR REPLACE INTO search_query_cache 
      (query_hash, query_text, embedding, model_name, created_at, last_accessed)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      queryHash,
      queryText,
      this.serializeVector(embedding),
      this.embeddingProvider.name,
      new Date().toISOString(),
      new Date().toISOString()
    )

    // Cleanup cache if too large
    this.cleanupCache()

    return embedding
  }

  private cleanupCache(): void {
    if (this.searchCache.size > this.CACHE_MAX_SIZE) {
      // Remove oldest entries
      const entries = Array.from(this.searchCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
      
      const toRemove = entries.slice(0, Math.floor(this.CACHE_MAX_SIZE * 0.2))
      toRemove.forEach(([key]) => this.searchCache.delete(key))
    }

    // Cleanup database cache
    this.db.prepare(`
      DELETE FROM search_query_cache 
      WHERE created_at < datetime('now', '-30 days')
      OR (access_count = 1 AND created_at < datetime('now', '-7 days'))
    `).run()
  }

  private async vectorSimilaritySearch(
    queryEmbedding: number[], 
    limit: number, 
    filters: any
  ): Promise<any[]> {
    // Get all embeddings (in production, this would use a proper vector database)
    let sql = `
      SELECT 
        e.message_id, e.chat_id, e.embedding,
        m.content, m.role, m.created_at, m.attachments, m.metadata,
        c.title as chat_title
      FROM message_embeddings e
      JOIN messages m ON e.message_id = m.id
      JOIN chats c ON e.chat_id = c.id
      WHERE 1=1
    `

    const params: any[] = []

    // Apply filters
    if (filters?.chatIds?.length) {
      sql += ` AND e.chat_id IN (${filters.chatIds.map(() => '?').join(',')})`
      params.push(...filters.chatIds)
    }

    if (filters?.roles?.length) {
      sql += ` AND m.role IN (${filters.roles.map(() => '?').join(',')})`
      params.push(...filters.roles)
    }

    if (filters?.dateRange) {
      sql += ` AND m.created_at BETWEEN ? AND ?`
      params.push(filters.dateRange.start, filters.dateRange.end)
    }

    const rows = this.db.prepare(sql).all(...params)

    // Calculate similarities
    const similarities = rows
      .map(row => {
        const embedding = this.deserializeVector(row.embedding)
        const similarity = VectorUtils.cosineSimilarity(queryEmbedding, embedding)
        return { ...row, similarity }
      })
      .filter(result => result.similarity >= this.SIMILARITY_THRESHOLD)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)

    return similarities
  }

  private async formatSemanticResults(vectorResults: any[], query: SearchQuery): Promise<SearchResult[]> {
    return vectorResults.map(result => ({
      message: {
        id: result.message_id,
        chatId: result.chat_id,
        role: result.role as 'user' | 'assistant' | 'system',
        content: result.content,
        timestamp: new Date(result.created_at),
        metadata: result.metadata ? JSON.parse(result.metadata) : undefined,
        attachments: result.attachments ? JSON.parse(result.attachments) : []
      },
      score: result.similarity,
      matches: this.createSemanticMatches(result.content, query.text)
    }))
  }

  private createSemanticMatches(content: string, queryText: string): SearchMatch[] {
    // Create semantic matches based on query similarity
    return [{
      field: 'content' as const,
      text: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
      startIndex: 0,
      endIndex: Math.min(100, content.length),
      highlighted: content.substring(0, 100) + (content.length > 100 ? '...' : '')
    }]
  }

  private async legacySearch(query: SearchQuery): Promise<SearchResult[]> {
    // Fallback to existing search functionality
    const searchService = new (await import('./SearchService')).SearchService(this.db)
    return searchService.searchMessages(query)
  }

  private mergeSearchResults(semanticResults: SearchResult[], lexicalResults: SearchResult[], query: SearchQuery): SearchResult[] {
    // Combine results with hybrid scoring
    const mergedMap = new Map<string, SearchResult>()
    
    // Add semantic results with boosted scores
    semanticResults.forEach(result => {
      const boostedScore = result.score * 1.2 // Boost semantic relevance
      mergedMap.set(result.message.id, { ...result, score: boostedScore })
    })

    // Add lexical results, combining scores if message already exists
    lexicalResults.forEach(result => {
      const existing = mergedMap.get(result.message.id)
      if (existing) {
        // Combine scores
        existing.score = (existing.score + result.score) / 2
        existing.matches.push(...result.matches)
      } else {
        mergedMap.set(result.message.id, result)
      }
    })

    // Sort by combined score and return
    return Array.from(mergedMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, query.options?.maxResults || 50)
  }

  private logSemanticSearchStats(
    query: string,
    embeddingTime: number,
    vectorTime: number,
    totalTime: number,
    resultCount: number,
    threshold: number
  ): void {
    try {
      this.db.prepare(`
        INSERT INTO semantic_search_stats 
        (query, query_embedding_time_ms, vector_search_time_ms, total_search_time_ms, 
         result_count, similarity_threshold, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        query,
        embeddingTime,
        vectorTime,
        totalTime,
        resultCount,
        threshold,
        new Date().toISOString()
      )
    } catch (error) {
      // Silent logging failure
    }
  }
}