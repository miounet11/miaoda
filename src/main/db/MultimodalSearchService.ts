import { BaseDatabaseService } from './BaseDatabaseService'
import type { SearchQuery, SearchResult } from './searchTypes'
import { readFileSync, existsSync } from 'fs'
import { extname } from 'path'

/**
 * Attachment metadata for search indexing
 */
interface AttachmentMetadata {
  id: string
  messageId: string
  fileName: string
  fileType: string
  mimeType: string
  size: number
  extractedText?: string
  imageDescription?: string
  ocrText?: string
  audioTranscript?: string
  documentSummary?: string
  createdAt: string
}

/**
 * Multimodal search result
 */
interface MultimodalSearchResult extends SearchResult {
  contentType: 'text' | 'image' | 'document' | 'audio' | 'mixed'
  attachmentMatches?: Array<{
    attachmentId: string
    fileName: string
    matchType: 'filename' | 'content' | 'ocr' | 'description'
    confidence: number
    snippet: string
  }>
}

/**
 * Content extraction interface
 */
interface ContentExtractor {
  extractText(filePath: string, mimeType: string): Promise<string>
  extractImageDescription(filePath: string): Promise<string>
  extractOCRText(filePath: string): Promise<string>
  extractAudioTranscript(filePath: string): Promise<string>
}

/**
 * Simple content extractor implementation
 */
class SimpleContentExtractor implements ContentExtractor {
  async extractText(filePath: string, mimeType: string): Promise<string> {
    try {
      // Basic text extraction for common formats
      if (mimeType.startsWith('text/') || mimeType === 'application/json') {
        return readFileSync(filePath, 'utf-8')
      }
      
      // For other formats, we would use specialized libraries
      // This is a simplified implementation
      return ''
    } catch (error) {
      console.error('Text extraction failed:', error)
      return ''
    }
  }

  async extractImageDescription(filePath: string): Promise<string> {
    // In a real implementation, this would use computer vision APIs
    // For now, return basic metadata
    try {
      const fileName = filePath.split('/').pop() || ''
      const ext = extname(fileName).toLowerCase()
      
      const imageTypes: Record<string, string> = {
        '.jpg': 'JPEG image',
        '.jpeg': 'JPEG image', 
        '.png': 'PNG image',
        '.gif': 'GIF animation',
        '.webp': 'WebP image',
        '.svg': 'SVG vector graphic'
      }
      
      return imageTypes[ext] || 'Image file'
    } catch (error) {
      return 'Image file'
    }
  }

  async extractOCRText(filePath: string): Promise<string> {
    // OCR would be implemented using libraries like Tesseract.js
    // This is a placeholder implementation
    return ''
  }

  async extractAudioTranscript(filePath: string): Promise<string> {
    // Audio transcription would use speech-to-text APIs
    // This is a placeholder implementation
    return ''
  }
}

/**
 * Advanced multimodal search service with content analysis
 */
export class MultimodalSearchService extends BaseDatabaseService {
  private contentExtractor: ContentExtractor
  private readonly SUPPORTED_IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
  private readonly SUPPORTED_DOCUMENT_TYPES = ['.pdf', '.doc', '.docx', '.txt', '.md', '.json']
  private readonly SUPPORTED_AUDIO_TYPES = ['.mp3', '.wav', '.ogg', '.m4a']

  constructor(db: any) {
    super(db)
    this.contentExtractor = new SimpleContentExtractor()
    this.initializeMultimodalTables()
  }

  /**
   * Initialize multimodal search tables
   */
  private initializeMultimodalTables(): void {
    try {
      this.db.exec(`
        -- Attachment metadata and search index
        CREATE TABLE IF NOT EXISTS attachment_search_index (
          attachment_id TEXT PRIMARY KEY,
          message_id TEXT NOT NULL,
          chat_id TEXT NOT NULL,
          file_name TEXT NOT NULL,
          file_type TEXT NOT NULL,
          mime_type TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          extracted_text TEXT,
          image_description TEXT,
          ocr_text TEXT,
          audio_transcript TEXT,
          document_summary TEXT,
          search_keywords TEXT, -- Space-separated keywords
          content_hash TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
          FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
        );

        -- Full-text search for attachment content
        CREATE VIRTUAL TABLE IF NOT EXISTS attachment_fts USING fts5(
          file_name,
          extracted_text,
          image_description,
          ocr_text,
          audio_transcript,
          document_summary,
          search_keywords,
          content_normalized UNINDEXED,
          tokenize = 'porter unicode61 remove_diacritics 1'
        );

        -- Multimodal search statistics
        CREATE TABLE IF NOT EXISTS multimodal_search_stats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          search_type TEXT NOT NULL, -- 'text', 'image', 'document', 'audio', 'mixed'
          query_text TEXT NOT NULL,
          result_count INTEGER NOT NULL,
          attachment_matches INTEGER NOT NULL,
          search_time_ms INTEGER NOT NULL,
          created_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_attachment_message ON attachment_search_index(message_id);
        CREATE INDEX IF NOT EXISTS idx_attachment_type ON attachment_search_index(file_type);
        CREATE INDEX IF NOT EXISTS idx_attachment_size ON attachment_search_index(file_size);
      `)
    } catch (error) {
      throw new Error(`Failed to initialize multimodal tables: ${error}`)
    }
  }

  /**
   * Index attachment for multimodal search
   */
  async indexAttachment(
    attachmentId: string,
    messageId: string,
    chatId: string,
    filePath: string,
    fileName: string,
    mimeType: string,
    fileSize: number
  ): Promise<void> {
    try {
      if (!existsSync(filePath)) {
        console.warn(`Attachment file not found: ${filePath}`)
        return
      }

      const fileType = this.categorizeFileType(fileName, mimeType)
      const contentHash = this.calculateFileHash(filePath)
      
      // Check if already indexed with same content
      const existing = this.db.prepare(`
        SELECT content_hash FROM attachment_search_index WHERE attachment_id = ?
      `).get(attachmentId) as { content_hash: string } | undefined

      if (existing && existing.content_hash === contentHash) {
        return // No update needed
      }

      // Extract content based on file type
      const extractedContent = await this.extractContent(filePath, fileName, mimeType)
      const keywords = this.generateSearchKeywords(fileName, extractedContent)

      // Store in database
      this.db.prepare(`
        INSERT OR REPLACE INTO attachment_search_index 
        (attachment_id, message_id, chat_id, file_name, file_type, mime_type, file_size,
         extracted_text, image_description, ocr_text, audio_transcript, document_summary,
         search_keywords, content_hash, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        attachmentId,
        messageId,
        chatId,
        fileName,
        fileType,
        mimeType,
        fileSize,
        extractedContent.text || null,
        extractedContent.imageDescription || null,
        extractedContent.ocrText || null,
        extractedContent.audioTranscript || null,
        extractedContent.documentSummary || null,
        keywords.join(' '),
        contentHash,
        new Date().toISOString(),
        new Date().toISOString()
      )

      // Update FTS index
      this.updateAttachmentFTS(attachmentId, {
        fileName,
        ...extractedContent,
        keywords: keywords.join(' ')
      })

    } catch (error) {
      console.error(`Failed to index attachment ${attachmentId}:`, error)
    }
  }

  /**
   * Perform multimodal search across text and attachments
   */
  async multimodalSearch(query: SearchQuery): Promise<MultimodalSearchResult[]> {
    const startTime = Date.now()

    try {
      // Determine search strategy based on query
      const searchStrategy = this.analyzeSearchQuery(query.text)
      
      // Perform parallel searches
      const [textResults, attachmentResults] = await Promise.all([
        this.searchMessages(query),
        this.searchAttachments(query, searchStrategy)
      ])

      // Merge and rank results
      const mergedResults = this.mergeMultimodalResults(textResults, attachmentResults)
      
      // Log statistics
      const searchTime = Date.now() - startTime
      this.logMultimodalSearchStats(searchStrategy.type, query.text, mergedResults.length, attachmentResults.length, searchTime)

      return mergedResults

    } catch (error) {
      console.error('Multimodal search failed:', error)
      throw error
    }
  }

  /**
   * Search specifically in image content (OCR + descriptions)
   */
  async searchImages(query: string, options: { useOCR?: boolean, useDescriptions?: boolean } = {}): Promise<MultimodalSearchResult[]> {
    const { useOCR = true, useDescriptions = true } = options

    try {
      let searchFields: string[] = []
      if (useOCR) searchFields.push('ocr_text')
      if (useDescriptions) searchFields.push('image_description')

      if (searchFields.length === 0) {
        searchFields = ['file_name'] // Fallback to filename search
      }

      const results = await this.searchAttachmentsByType('image', query, searchFields)
      return this.formatMultimodalResults(results, 'image')

    } catch (error) {
      console.error('Image search failed:', error)
      return []
    }
  }

  /**
   * Search in document content
   */
  async searchDocuments(query: string): Promise<MultimodalSearchResult[]> {
    try {
      const results = await this.searchAttachmentsByType('document', query, ['extracted_text', 'document_summary', 'file_name'])
      return this.formatMultimodalResults(results, 'document')
    } catch (error) {
      console.error('Document search failed:', error)
      return []
    }
  }

  /**
   * Search in audio transcripts
   */
  async searchAudio(query: string): Promise<MultimodalSearchResult[]> {
    try {
      const results = await this.searchAttachmentsByType('audio', query, ['audio_transcript', 'file_name'])
      return this.formatMultimodalResults(results, 'audio')
    } catch (error) {
      console.error('Audio search failed:', error)
      return []
    }
  }

  /**
   * Get similar attachments based on content
   */
  async findSimilarAttachments(attachmentId: string, limit = 5): Promise<MultimodalSearchResult[]> {
    try {
      const target = this.db.prepare(`
        SELECT file_type, extracted_text, image_description, search_keywords
        FROM attachment_search_index WHERE attachment_id = ?
      `).get(attachmentId) as {
        file_type: string
        extracted_text?: string
        image_description?: string
        search_keywords: string
      } | undefined

      if (!target) return []

      // Find similar based on keywords and content
      const keywords = target.search_keywords.split(' ').slice(0, 10) // Use top keywords
      const query = keywords.join(' ')

      const results = await this.searchAttachmentsByType(
        target.file_type as any, 
        query, 
        ['search_keywords', 'extracted_text', 'image_description']
      )

      // Filter out the original attachment
      const filtered = results.filter(r => r.attachment_id !== attachmentId)
      
      return this.formatMultimodalResults(filtered.slice(0, limit), target.file_type as any)

    } catch (error) {
      console.error('Failed to find similar attachments:', error)
      return []
    }
  }

  /**
   * Get multimodal search statistics
   */
  getMultimodalSearchStats(): any {
    try {
      const attachmentStats = this.db.prepare(`
        SELECT 
          COUNT(*) as total_attachments,
          COUNT(CASE WHEN file_type = 'image' THEN 1 END) as images,
          COUNT(CASE WHEN file_type = 'document' THEN 1 END) as documents,
          COUNT(CASE WHEN file_type = 'audio' THEN 1 END) as audio_files,
          COUNT(CASE WHEN extracted_text IS NOT NULL THEN 1 END) as text_extracted,
          COUNT(CASE WHEN image_description IS NOT NULL THEN 1 END) as images_described,
          COUNT(CASE WHEN ocr_text IS NOT NULL THEN 1 END) as ocr_processed,
          COUNT(CASE WHEN audio_transcript IS NOT NULL THEN 1 END) as audio_transcribed
        FROM attachment_search_index
      `).get() as any

      const searchStats = this.db.prepare(`
        SELECT 
          search_type,
          COUNT(*) as search_count,
          AVG(search_time_ms) as avg_search_time,
          AVG(result_count) as avg_results,
          AVG(attachment_matches) as avg_attachment_matches
        FROM multimodal_search_stats
        WHERE created_at > datetime('now', '-30 days')
        GROUP BY search_type
      `).all() as any[]

      return {
        attachmentStats,
        searchStats: searchStats.reduce((acc, stat) => {
          acc[stat.search_type] = {
            searchCount: stat.search_count,
            avgSearchTime: stat.avg_search_time,
            avgResults: stat.avg_results,
            avgAttachmentMatches: stat.avg_attachment_matches
          }
          return acc
        }, {})
      }
    } catch (error) {
      console.error('Failed to get multimodal search stats:', error)
      return { attachmentStats: {}, searchStats: {} }
    }
  }

  /**
   * Clean up orphaned attachment indexes
   */
  async cleanupOrphanedIndexes(): Promise<number> {
    try {
      const result = this.db.prepare(`
        DELETE FROM attachment_search_index 
        WHERE message_id NOT IN (SELECT id FROM messages)
      `).run()

      return result.changes
    } catch (error) {
      console.error('Failed to cleanup orphaned indexes:', error)
      return 0
    }
  }

  // Private helper methods

  private categorizeFileType(fileName: string, mimeType: string): string {
    const ext = extname(fileName).toLowerCase()
    
    if (this.SUPPORTED_IMAGE_TYPES.includes(ext) || mimeType.startsWith('image/')) {
      return 'image'
    }
    
    if (this.SUPPORTED_DOCUMENT_TYPES.includes(ext) || mimeType.startsWith('application/')) {
      return 'document'
    }
    
    if (this.SUPPORTED_AUDIO_TYPES.includes(ext) || mimeType.startsWith('audio/')) {
      return 'audio'
    }
    
    return 'other'
  }

  private calculateFileHash(filePath: string): string {
    try {
      // Simple hash based on file stats for change detection
      const stats = require('fs').statSync(filePath)
      return `${stats.size}_${stats.mtime.getTime()}`
    } catch (error) {
      return Date.now().toString()
    }
  }

  private async extractContent(filePath: string, fileName: string, mimeType: string) {
    const content: any = {}

    try {
      const fileType = this.categorizeFileType(fileName, mimeType)

      switch (fileType) {
        case 'image':
          content.imageDescription = await this.contentExtractor.extractImageDescription(filePath)
          content.ocrText = await this.contentExtractor.extractOCRText(filePath)
          break

        case 'document':
          content.text = await this.contentExtractor.extractText(filePath, mimeType)
          if (content.text) {
            content.documentSummary = this.generateDocumentSummary(content.text)
          }
          break

        case 'audio':
          content.audioTranscript = await this.contentExtractor.extractAudioTranscript(filePath)
          break

        default:
          // Try basic text extraction for unknown types
          content.text = await this.contentExtractor.extractText(filePath, mimeType)
          break
      }
    } catch (error) {
      console.error('Content extraction failed:', error)
    }

    return content
  }

  private generateSearchKeywords(fileName: string, extractedContent: any): string[] {
    const keywords = new Set<string>()

    // Extract keywords from filename
    const fileWords = fileName
      .replace(/[^\w\s]/g, ' ')
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2)

    fileWords.forEach(word => keywords.add(word))

    // Extract keywords from extracted content
    const contents = [
      extractedContent.text,
      extractedContent.imageDescription,
      extractedContent.ocrText,
      extractedContent.audioTranscript,
      extractedContent.documentSummary
    ].filter(Boolean)

    contents.forEach(content => {
      const words = content
        .replace(/[^\w\s]/g, ' ')
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3) // Slightly longer for content keywords

      words.forEach(word => keywords.add(word))
    })

    return Array.from(keywords).slice(0, 50) // Limit keyword count
  }

  private generateDocumentSummary(text: string): string {
    // Simple extractive summarization
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20)
    
    if (sentences.length <= 3) {
      return text.substring(0, 300) + (text.length > 300 ? '...' : '')
    }

    // Return first and last sentences as summary
    const summary = [sentences[0], sentences[sentences.length - 1]]
      .join('. ')
      .substring(0, 300)
    
    return summary + (summary.length === 300 ? '...' : '')
  }

  private updateAttachmentFTS(attachmentId: string, content: any): void {
    try {
      // Remove existing FTS entry
      this.db.prepare('DELETE FROM attachment_fts WHERE rowid = ?').run(attachmentId)

      // Insert updated entry
      this.db.prepare(`
        INSERT INTO attachment_fts(rowid, file_name, extracted_text, image_description, 
                                  ocr_text, audio_transcript, document_summary, search_keywords)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        attachmentId,
        content.fileName || '',
        content.text || '',
        content.imageDescription || '',
        content.ocrText || '',
        content.audioTranscript || '',
        content.documentSummary || '',
        content.keywords || ''
      )
    } catch (error) {
      console.error('Failed to update attachment FTS:', error)
    }
  }

  private analyzeSearchQuery(query: string): { type: string, strategy: string } {
    const lowerQuery = query.toLowerCase()
    
    // Detect search intent
    if (lowerQuery.includes('image') || lowerQuery.includes('picture') || lowerQuery.includes('photo')) {
      return { type: 'image', strategy: 'visual_content' }
    }
    
    if (lowerQuery.includes('document') || lowerQuery.includes('file') || lowerQuery.includes('pdf')) {
      return { type: 'document', strategy: 'document_content' }
    }
    
    if (lowerQuery.includes('audio') || lowerQuery.includes('voice') || lowerQuery.includes('recording')) {
      return { type: 'audio', strategy: 'audio_content' }
    }
    
    return { type: 'mixed', strategy: 'comprehensive' }
  }

  private async searchMessages(query: SearchQuery): Promise<SearchResult[]> {
    // Delegate to existing search service
    // This would be imported from SearchService
    return []
  }

  private async searchAttachments(query: SearchQuery, strategy: any): Promise<any[]> {
    const searchText = query.text || ''
    const results: any[] = []

    try {
      // Use FTS to search across all attachment content
      const ftsResults = this.db.prepare(`
        SELECT 
          a.attachment_id, a.message_id, a.chat_id, a.file_name, a.file_type, a.mime_type,
          a.extracted_text, a.image_description, a.ocr_text, a.audio_transcript,
          a.document_summary, a.search_keywords,
          bm25(attachment_fts) as rank
        FROM attachment_search_index a
        JOIN attachment_fts ON attachment_fts.rowid = a.attachment_id
        WHERE attachment_fts MATCH ?
        ORDER BY rank DESC
        LIMIT ?
      `).all(searchText, query.options?.maxResults || 25)

      results.push(...ftsResults)
    } catch (error) {
      console.error('Attachment search failed:', error)
    }

    return results
  }

  private async searchAttachmentsByType(
    fileType: 'image' | 'document' | 'audio',
    query: string,
    searchFields: string[]
  ): Promise<any[]> {
    try {
      const fieldConditions = searchFields
        .map(field => `${field} LIKE ?`)
        .join(' OR ')

      const sql = `
        SELECT * FROM attachment_search_index
        WHERE file_type = ? AND (${fieldConditions})
        ORDER BY file_name
        LIMIT 25
      `

      const params = [fileType, ...searchFields.map(() => `%${query}%`)]
      return this.db.prepare(sql).all(...params)

    } catch (error) {
      console.error(`Search in ${fileType} files failed:`, error)
      return []
    }
  }

  private mergeMultimodalResults(textResults: SearchResult[], attachmentResults: any[]): MultimodalSearchResult[] {
    const mergedMap = new Map<string, MultimodalSearchResult>()

    // Add text results
    textResults.forEach(result => {
      mergedMap.set(result.message.id, {
        ...result,
        contentType: 'text',
        attachmentMatches: []
      })
    })

    // Add attachment results and merge with existing text results
    attachmentResults.forEach(attachment => {
      const existing = mergedMap.get(attachment.message_id)
      
      const attachmentMatch = {
        attachmentId: attachment.attachment_id,
        fileName: attachment.file_name,
        matchType: this.determineMatchType(attachment),
        confidence: attachment.rank || 0.5,
        snippet: this.createAttachmentSnippet(attachment)
      }

      if (existing) {
        existing.contentType = 'mixed'
        existing.attachmentMatches = existing.attachmentMatches || []
        existing.attachmentMatches.push(attachmentMatch)
      } else {
        // Create new result for attachment-only match
        mergedMap.set(attachment.message_id, {
          message: {
            id: attachment.message_id,
            chatId: attachment.chat_id,
            role: 'user', // Assumption
            content: `Attachment: ${attachment.file_name}`,
            timestamp: new Date(), // Would need actual timestamp
            attachments: [attachment]
          },
          score: attachment.rank || 0.5,
          matches: [],
          contentType: attachment.file_type as any,
          attachmentMatches: [attachmentMatch]
        })
      }
    })

    return Array.from(mergedMap.values())
      .sort((a, b) => b.score - a.score)
  }

  private formatMultimodalResults(results: any[], contentType: string): MultimodalSearchResult[] {
    return results.map(result => ({
      message: {
        id: result.message_id,
        chatId: result.chat_id,
        role: 'user',
        content: `${contentType}: ${result.file_name}`,
        timestamp: new Date(result.created_at),
        attachments: [result]
      },
      score: result.rank || 0.5,
      matches: [],
      contentType: contentType as any,
      attachmentMatches: [{
        attachmentId: result.attachment_id,
        fileName: result.file_name,
        matchType: this.determineMatchType(result),
        confidence: result.rank || 0.5,
        snippet: this.createAttachmentSnippet(result)
      }]
    }))
  }

  private determineMatchType(attachment: any): 'filename' | 'content' | 'ocr' | 'description' {
    if (attachment.ocr_text) return 'ocr'
    if (attachment.extracted_text || attachment.document_summary || attachment.audio_transcript) return 'content'
    if (attachment.image_description) return 'description'
    return 'filename'
  }

  private createAttachmentSnippet(attachment: any): string {
    const contents = [
      attachment.extracted_text,
      attachment.image_description,
      attachment.ocr_text,
      attachment.audio_transcript,
      attachment.document_summary
    ].filter(Boolean)

    const snippet = contents[0] || attachment.file_name
    return snippet.substring(0, 150) + (snippet.length > 150 ? '...' : '')
  }

  private logMultimodalSearchStats(
    searchType: string,
    query: string,
    resultCount: number,
    attachmentMatches: number,
    searchTime: number
  ): void {
    try {
      this.db.prepare(`
        INSERT INTO multimodal_search_stats 
        (search_type, query_text, result_count, attachment_matches, search_time_ms, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        searchType,
        query.substring(0, 200),
        resultCount,
        attachmentMatches,
        searchTime,
        new Date().toISOString()
      )
    } catch (error) {
      // Silent logging failure
    }
  }
}