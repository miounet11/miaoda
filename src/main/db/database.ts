import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { mkdirSync, existsSync } from 'fs'
import type { 
  SearchQuery, 
  SearchResult, 
  SearchMatch,
  DBSearchResult,
  SearchFilters,
  SearchOptions
} from './searchTypes'
import type { ChatRecord, MessageRecord, SearchIndex } from './types'
import { ChatService } from './ChatService'
import { MessageService } from './MessageService'
import { SearchService } from './SearchService'
import { SummaryService } from './SummaryService'
import { AnalyticsService } from './AnalyticsService'
import { DatabaseInitializer } from './DatabaseInitializer'
import type { AnalyticsData, AnalyticsFilter } from '../../types/analytics'
import { SemanticSearchService } from './SemanticSearchService'
import { VectorDatabase } from './VectorDatabase'


/**
 * Main database class that orchestrates all database services
 * Refactored to reduce complexity and improve maintainability
 */
export class LocalDatabase {
  private db: Database.Database
  private chatService: ChatService
  private messageService: MessageService
  private searchService: SearchService
  private summaryService: SummaryService
  private analyticsService: AnalyticsService
  private semanticSearchService: SemanticSearchService
  private vectorDatabase: VectorDatabase
  private initializer: DatabaseInitializer

  constructor() {
    const userDataPath = app.getPath('userData')
    const dbPath = join(userDataPath, 'data')
    
    this.ensureDirectoryExists(dbPath)
    this.db = this.openDatabase(dbPath)
    this.initializeServices()
    this.initializeDatabase()
  }

  private ensureDirectoryExists(dbPath: string): void {
    if (!existsSync(dbPath)) {
      mkdirSync(dbPath, { recursive: true })
    }
  }

  private openDatabase(dbPath: string): Database.Database {
    try {
      const dbFile = join(dbPath, 'chats.db')
      return new Database(dbFile)
    } catch (error) {
      throw new Error(`Failed to initialize database: ${error}`)
    }
  }

  private initializeServices(): void {
    this.chatService = new ChatService(this.db)
    this.messageService = new MessageService(this.db)
    this.searchService = new SearchService(this.db)
    this.summaryService = new SummaryService(this.db)
    this.analyticsService = new AnalyticsService(this.db)
    this.vectorDatabase = new VectorDatabase(this.db)
    this.semanticSearchService = new SemanticSearchService(this.db)
    this.initializer = new DatabaseInitializer(this.db)
  }

  private initializeDatabase(): void {
    try {
      this.initializer.initialize()
      this.searchService.initializeSearchIndex()
    } catch (error) {
      throw new Error(`Failed to initialize database: ${error}`)
    }
  }

  // Chat operations - delegated to ChatService
  createChat(chat: ChatRecord): void {
    this.chatService.createChat(chat)
  }

  updateChat(id: string, title: string, updated_at: string): void {
    this.chatService.updateChat(id, title, updated_at)
  }

  deleteChat(id: string): void {
    this.chatService.deleteChat(id)
  }

  getChat(id: string): ChatRecord | undefined {
    return this.chatService.getChat(id)
  }

  getAllChats(): ChatRecord[] {
    return this.chatService.getAllChats()
  }

  // Message operations - delegated to MessageService
  createMessage(message: MessageRecord): void {
    this.messageService.createMessage(message)
  }

  getMessages(chatId: string): MessageRecord[] {
    return this.messageService.getMessages(chatId)
  }

  updateMessage(id: string, content: string): void {
    this.messageService.updateMessage(id, content)
  }

  deleteMessage(id: string): void {
    this.messageService.deleteMessage(id)
  }

  // Search operations - delegated to SearchService
  searchChats(query: string): ChatRecord[] {
    return this.searchService.searchChats(query)
  }

  searchMessages(query: SearchQuery): SearchResult[] {
    return this.searchService.searchMessages(query)
  }

  rebuildSearchIndex(): void {
    this.searchService.rebuildSearchIndex()
  }

  optimizeSearchIndex(): void {
    this.searchService.optimizeSearchIndex()
  }

  getSearchIndexStatus(): { needsRebuild: boolean; messageCount: number; indexedCount: number } {
    return this.searchService.getSearchIndexStatus()
  }

  getSearchStats(): any {
    return this.searchService.getSearchStats()
  }

  // Summary operations - delegated to SummaryService
  updateChatSummary(chatId: string, summary: string, tags: string[], keyPoints: string[], tokens?: number): void {
    this.summaryService.updateChatSummary(chatId, summary, tags, keyPoints, tokens)
  }

  getChatSummary(chatId: string) {
    return this.summaryService.getChatSummary(chatId)
  }

  getAllChatsWithSummaries() {
    return this.summaryService.getAllChatsWithSummaries()
  }

  searchChatsByTags(tags: string[]): ChatRecord[] {
    return this.summaryService.searchChatsByTags(tags)
  }

  getAllSummaryTags(): string[] {
    return this.summaryService.getAllSummaryTags()
  }

  clearChatSummary(chatId: string): void {
    this.summaryService.clearChatSummary(chatId)
  }

  needsSummaryUpdate(chatId: string, minMessages?: number, maxAgeHours?: number): boolean {
    return this.summaryService.needsSummaryUpdate(chatId, minMessages, maxAgeHours)
  }

  // Analytics operations - delegated to AnalyticsService
  generateAnalytics(filter: AnalyticsFilter): AnalyticsData {
    return this.analyticsService.generateAnalytics(filter)
  }

  getAnalyticsSummary(timeRange: any = '30d'): any {
    return this.analyticsService.getAnalyticsSummary(timeRange)
  }

  // Semantic search operations - delegated to SemanticSearchService
  async buildSemanticIndex(): Promise<{ processed: number, failed: number }> {
    return this.semanticSearchService.buildSemanticIndex()
  }

  async semanticSearch(query: SearchQuery): Promise<SearchResult[]> {
    return this.semanticSearchService.semanticSearch(query)
  }

  async hybridSearch(query: SearchQuery): Promise<SearchResult[]> {
    return this.semanticSearchService.hybridSearch(query)
  }

  async findSimilarMessages(messageId: string, limit = 5): Promise<SearchResult[]> {
    return this.semanticSearchService.findSimilarMessages(messageId, limit)
  }

  async updateMessageEmbedding(messageId: string, content: string): Promise<void> {
    return this.semanticSearchService.updateMessageEmbedding(messageId, content)
  }

  deleteMessageEmbedding(messageId: string): void {
    this.semanticSearchService.deleteMessageEmbedding(messageId)
  }

  getSemanticSearchStats(): any {
    return this.semanticSearchService.getSemanticSearchStats()
  }

  // Vector database operations - delegated to VectorDatabase
  async buildVectorIndex(): Promise<void> {
    return this.vectorDatabase.buildIndex()
  }

  async optimizeVectorIndex(): Promise<void> {
    return this.vectorDatabase.optimize()
  }

  getVectorIndexStats(): any {
    return this.vectorDatabase.getIndexStats()
  }

  // Database cleanup
  close(): void {
    this.db.close()
  }
}