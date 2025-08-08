import { BaseDatabaseService } from './BaseDatabaseService'

/**
 * Vector database interface for high-performance similarity search
 */
interface VectorIndex {
  id: string
  vector: number[]
  metadata: any
}

interface VectorSearchResult {
  id: string
  score: number
  metadata: any
}

interface VectorSearchOptions {
  topK?: number
  threshold?: number
  filter?: (metadata: any) => boolean
}

/**
 * High-performance in-memory vector index with SQLite persistence
 */
export class VectorDatabase extends BaseDatabaseService {
  private vectorIndex: Map<string, VectorIndex> = new Map()
  private vectorDimensions: number = 384
  private indexBuilt: boolean = false
  private updateQueue: Set<string> = new Set()
  private readonly UPDATE_BATCH_SIZE = 100
  private readonly INDEX_REBUILD_THRESHOLD = 0.1 // Rebuild if 10% of vectors are dirty

  constructor(db: any) {
    super(db)
    this.initializeVectorStorage()
  }

  /**
   * Initialize vector storage tables
   */
  private initializeVectorStorage(): void {
    try {
      this.db.exec(`
        -- High-performance vector storage
        CREATE TABLE IF NOT EXISTS vector_index (
          id TEXT PRIMARY KEY,
          vector BLOB NOT NULL,
          metadata TEXT NOT NULL,
          norm REAL NOT NULL, -- Pre-computed vector norm for faster similarity
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        -- Spatial partitioning for faster search (LSH-like)
        CREATE TABLE IF NOT EXISTS vector_buckets (
          bucket_id TEXT NOT NULL,
          vector_id TEXT NOT NULL,
          signature BLOB NOT NULL,
          PRIMARY KEY (bucket_id, vector_id),
          FOREIGN KEY (vector_id) REFERENCES vector_index(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_vector_norm ON vector_index(norm);
        CREATE INDEX IF NOT EXISTS idx_vector_updated ON vector_index(updated_at);
        CREATE INDEX IF NOT EXISTS idx_bucket_signature ON vector_buckets(signature);
      `)
    } catch (error) {
      throw new Error(`Failed to initialize vector storage: ${error}`)
    }
  }

  /**
   * Build in-memory index for fast vector search
   */
  async buildIndex(): Promise<void> {
    if (this.indexBuilt && this.updateQueue.size === 0) {
      return // Index is already built and up-to-date
    }

    const startTime = Date.now()
    console.log('Building vector index...')

    try {
      // Load all vectors from database
      const vectors = this.db.prepare(`
        SELECT id, vector, metadata, norm 
        FROM vector_index 
        ORDER BY created_at
      `).all() as Array<{
        id: string
        vector: Buffer
        metadata: string
        norm: number
      }>

      this.vectorIndex.clear()

      for (const row of vectors) {
        this.vectorIndex.set(row.id, {
          id: row.id,
          vector: this.deserializeVector(row.vector),
          metadata: JSON.parse(row.metadata)
        })
      }

      this.updateQueue.clear()
      this.indexBuilt = true
      
      const buildTime = Date.now() - startTime
      console.log(`Vector index built: ${vectors.length} vectors in ${buildTime}ms`)

    } catch (error) {
      throw new Error(`Failed to build vector index: ${error}`)
    }
  }

  /**
   * Add or update vector in the index
   */
  async upsertVector(id: string, vector: number[], metadata: any): Promise<void> {
    try {
      this.validateVector(vector)
      
      const norm = this.computeNorm(vector)
      const vectorBlob = this.serializeVector(vector)
      const metadataStr = JSON.stringify(metadata)
      const now = new Date().toISOString()

      // Update database
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO vector_index 
        (id, vector, metadata, norm, created_at, updated_at)
        VALUES (
          ?, ?, ?, ?, 
          COALESCE((SELECT created_at FROM vector_index WHERE id = ?), ?),
          ?
        )
      `)
      
      stmt.run(id, vectorBlob, metadataStr, norm, id, now, now)

      // Update in-memory index
      this.vectorIndex.set(id, { id, vector, metadata })

      // Update spatial buckets for faster search
      await this.updateVectorBuckets(id, vector)

      // Remove from update queue if present
      this.updateQueue.delete(id)

    } catch (error) {
      throw new Error(`Failed to upsert vector ${id}: ${error}`)
    }
  }

  /**
   * Remove vector from index
   */
  deleteVector(id: string): void {
    try {
      // Remove from database
      this.db.prepare('DELETE FROM vector_index WHERE id = ?').run(id)
      
      // Remove from in-memory index
      this.vectorIndex.delete(id)
      
      // Remove from update queue
      this.updateQueue.delete(id)

    } catch (error) {
      throw new Error(`Failed to delete vector ${id}: ${error}`)
    }
  }

  /**
   * High-performance vector similarity search
   */
  async search(
    queryVector: number[], 
    options: VectorSearchOptions = {}
  ): Promise<VectorSearchResult[]> {
    try {
      this.validateVector(queryVector)
      
      const { topK = 10, threshold = 0.0, filter } = options
      
      // Ensure index is built
      if (!this.indexBuilt) {
        await this.buildIndex()
      }

      // Use spatial partitioning for large indices
      if (this.vectorIndex.size > 10000) {
        return this.searchWithBuckets(queryVector, options)
      }

      // Brute force search for smaller indices
      return this.bruteForceSearch(queryVector, options)

    } catch (error) {
      throw new Error(`Vector search failed: ${error}`)
    }
  }

  /**
   * Batch vector operations for efficiency
   */
  async batchUpsert(vectors: Array<{ id: string; vector: number[]; metadata: any }>): Promise<void> {
    const startTime = Date.now()
    
    try {
      // Prepare batch statement
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO vector_index 
        (id, vector, metadata, norm, created_at, updated_at)
        VALUES (?, ?, ?, ?, 
          COALESCE((SELECT created_at FROM vector_index WHERE id = ?), ?), 
          ?
        )
      `)

      const transaction = this.db.transaction(() => {
        const now = new Date().toISOString()
        
        for (const { id, vector, metadata } of vectors) {
          this.validateVector(vector)
          
          const norm = this.computeNorm(vector)
          const vectorBlob = this.serializeVector(vector)
          const metadataStr = JSON.stringify(metadata)
          
          stmt.run(id, vectorBlob, metadataStr, norm, id, now, now)
          
          // Update in-memory index
          this.vectorIndex.set(id, { id, vector, metadata })
        }
      })

      transaction()

      // Update spatial buckets in batch
      await this.batchUpdateBuckets(vectors)
      
      const batchTime = Date.now() - startTime
      console.log(`Batch upserted ${vectors.length} vectors in ${batchTime}ms`)

    } catch (error) {
      throw new Error(`Batch upsert failed: ${error}`)
    }
  }

  /**
   * Get vector by ID
   */
  getVector(id: string): VectorIndex | undefined {
    return this.vectorIndex.get(id)
  }

  /**
   * Check if vector exists
   */
  hasVector(id: string): boolean {
    return this.vectorIndex.has(id)
  }

  /**
   * Get index statistics
   */
  getIndexStats(): any {
    const dbStats = this.db.prepare(`
      SELECT 
        COUNT(*) as total_vectors,
        AVG(LENGTH(vector)) as avg_vector_size,
        MAX(updated_at) as last_updated
      FROM vector_index
    `).get() as {
      total_vectors: number
      avg_vector_size: number
      last_updated: string
    }

    const bucketStats = this.db.prepare(`
      SELECT COUNT(DISTINCT bucket_id) as bucket_count
      FROM vector_buckets
    `).get() as { bucket_count: number }

    return {
      totalVectors: dbStats.total_vectors,
      inMemoryVectors: this.vectorIndex.size,
      indexBuilt: this.indexBuilt,
      avgVectorSize: dbStats.avg_vector_size,
      lastUpdated: dbStats.last_updated,
      bucketCount: bucketStats.bucket_count,
      pendingUpdates: this.updateQueue.size,
      vectorDimensions: this.vectorDimensions
    }
  }

  /**
   * Optimize the vector index
   */
  async optimize(): Promise<void> {
    const startTime = Date.now()
    
    try {
      // Vacuum the database
      this.db.exec('VACUUM')
      
      // Rebuild buckets if needed
      const needsRebuild = this.updateQueue.size > 
        this.vectorIndex.size * this.INDEX_REBUILD_THRESHOLD
      
      if (needsRebuild) {
        await this.rebuildBuckets()
      }
      
      // Clear update queue
      this.updateQueue.clear()
      
      const optimizeTime = Date.now() - startTime
      console.log(`Vector index optimized in ${optimizeTime}ms`)

    } catch (error) {
      throw new Error(`Vector index optimization failed: ${error}`)
    }
  }

  // Private helper methods

  private validateVector(vector: number[]): void {
    if (!Array.isArray(vector) || vector.length === 0) {
      throw new Error('Vector must be a non-empty array')
    }
    
    if (this.vectorDimensions === 0) {
      this.vectorDimensions = vector.length
    } else if (vector.length !== this.vectorDimensions) {
      throw new Error(`Vector dimension mismatch: expected ${this.vectorDimensions}, got ${vector.length}`)
    }
    
    if (!vector.every(v => typeof v === 'number' && !isNaN(v) && isFinite(v))) {
      throw new Error('Vector must contain only valid numbers')
    }
  }

  private computeNorm(vector: number[]): number {
    return Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0))
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

  private cosineSimilarity(a: number[], b: number[]): number {
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

  private bruteForceSearch(
    queryVector: number[], 
    options: VectorSearchOptions
  ): VectorSearchResult[] {
    const { topK = 10, threshold = 0.0, filter } = options
    const results: VectorSearchResult[] = []
    
    for (const [id, vectorData] of this.vectorIndex) {
      // Apply metadata filter if provided
      if (filter && !filter(vectorData.metadata)) {
        continue
      }
      
      const similarity = this.cosineSimilarity(queryVector, vectorData.vector)
      
      if (similarity >= threshold) {
        results.push({
          id,
          score: similarity,
          metadata: vectorData.metadata
        })
      }
    }
    
    // Sort by similarity (descending) and return top K
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
  }

  private searchWithBuckets(
    queryVector: number[], 
    options: VectorSearchOptions
  ): VectorSearchResult[] {
    // For large indices, use LSH-like bucketing for faster search
    // This is a simplified implementation - in production, use proper LSH
    
    const querySignature = this.computeSignature(queryVector)
    const candidateIds = new Set<string>()
    
    // Find candidate vectors from relevant buckets
    const buckets = this.db.prepare(`
      SELECT DISTINCT vector_id 
      FROM vector_buckets 
      WHERE bucket_id IN (
        SELECT DISTINCT bucket_id 
        FROM vector_buckets 
        WHERE signature = ?
      )
    `).all(querySignature) as Array<{ vector_id: string }>
    
    buckets.forEach(bucket => candidateIds.add(bucket.vector_id))
    
    // If no candidates found, fallback to brute force on a sample
    if (candidateIds.size === 0) {
      return this.bruteForceSearch(queryVector, options)
    }
    
    // Search within candidates
    const { topK = 10, threshold = 0.0, filter } = options
    const results: VectorSearchResult[] = []
    
    for (const id of candidateIds) {
      const vectorData = this.vectorIndex.get(id)
      if (!vectorData) continue
      
      if (filter && !filter(vectorData.metadata)) {
        continue
      }
      
      const similarity = this.cosineSimilarity(queryVector, vectorData.vector)
      
      if (similarity >= threshold) {
        results.push({
          id,
          score: similarity,
          metadata: vectorData.metadata
        })
      }
    }
    
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
  }

  private computeSignature(vector: number[]): Buffer {
    // Simple random projection signature for LSH
    // In production, use proper LSH functions
    const signatureSize = 64 // bits
    const signature = new Uint8Array(Math.ceil(signatureSize / 8))
    
    for (let i = 0; i < signatureSize; i++) {
      const randomProj = Math.random() > 0.5 ? 1 : -1
      const dotProduct = vector.reduce((sum, v, idx) => 
        sum + v * (idx % 2 === 0 ? randomProj : -randomProj), 0
      )
      
      if (dotProduct > 0) {
        const byteIdx = Math.floor(i / 8)
        const bitIdx = i % 8
        signature[byteIdx] |= (1 << bitIdx)
      }
    }
    
    return Buffer.from(signature)
  }

  private async updateVectorBuckets(id: string, vector: number[]): Promise<void> {
    try {
      const signature = this.computeSignature(vector)
      const bucketId = this.computeBucketId(signature)
      
      // Remove old bucket entries
      this.db.prepare('DELETE FROM vector_buckets WHERE vector_id = ?').run(id)
      
      // Insert new bucket entry
      this.db.prepare(`
        INSERT INTO vector_buckets (bucket_id, vector_id, signature)
        VALUES (?, ?, ?)
      `).run(bucketId, id, signature)
      
    } catch (error) {
      console.warn(`Failed to update buckets for vector ${id}:`, error)
    }
  }

  private async batchUpdateBuckets(vectors: Array<{ id: string; vector: number[]; metadata: any }>): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO vector_buckets (bucket_id, vector_id, signature)
        VALUES (?, ?, ?)
      `)

      const transaction = this.db.transaction(() => {
        for (const { id, vector } of vectors) {
          const signature = this.computeSignature(vector)
          const bucketId = this.computeBucketId(signature)
          stmt.run(bucketId, id, signature)
        }
      })

      transaction()
    } catch (error) {
      console.warn('Failed to batch update buckets:', error)
    }
  }

  private computeBucketId(signature: Buffer): string {
    // Use first 8 bytes of signature as bucket ID
    return signature.subarray(0, 8).toString('hex')
  }

  private async rebuildBuckets(): Promise<void> {
    console.log('Rebuilding vector buckets...')
    
    try {
      // Clear existing buckets
      this.db.exec('DELETE FROM vector_buckets')
      
      // Rebuild from current vectors
      const vectors = Array.from(this.vectorIndex.entries()).map(([id, data]) => ({
        id,
        vector: data.vector,
        metadata: data.metadata
      }))
      
      await this.batchUpdateBuckets(vectors)
      
    } catch (error) {
      console.error('Failed to rebuild buckets:', error)
    }
  }
}