// Import better-sqlite3 using ES6 import syntax
import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { mkdirSync, existsSync } from 'fs'
import type { SearchQuery } from './searchTypes'
import type { ChatRecord, MessageRecord } from './types'

// Re-export types for external use
export type { ChatRecord, MessageRecord } from './types'
import { ChatService } from './ChatService'
import { MessageService } from './MessageService'
import { UnifiedSearchService, type SearchResult } from './UnifiedSearchService'
import { SummaryService } from './SummaryService'
import { AnalyticsService } from './AnalyticsService'
import { DatabaseInitializer } from './DatabaseInitializer'
import type { AnalyticsData, AnalyticsFilter, TimeRange } from '../../types/analytics'
import type { MessageRecordParsed } from './types'

/**
 * Main database class that orchestrates all database services
 * Refactored to reduce complexity and improve maintainability
 */
export class LocalDatabase {
  private db!: Database.Database // Database instance
  private chatService!: ChatService
  private messageService!: MessageService
  private searchService!: UnifiedSearchService
  private summaryService!: SummaryService
  private analyticsService!: AnalyticsService
  private initializer!: DatabaseInitializer

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
    this.searchService = new UnifiedSearchService(this.db)
    this.summaryService = new SummaryService(this.db)
    this.analyticsService = new AnalyticsService(this.db)
    this.initializer = new DatabaseInitializer(this.db)
  }

  private initializeDatabase(): void {
    try {
      this.initializer.initialize()
      // Search index initialized in UnifiedSearchService constructor
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

  getMessages(chatId: string): MessageRecordParsed[] {
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

  async searchMessages(query: SearchQuery): Promise<SearchResult[]> {
    return this.searchService.search(query)
  }

  rebuildSearchIndex(): void {
    this.searchService.rebuildSearchIndex()
  }

  getSearchStats(): {
    totalIndexedMessages: number
    indexSize: number
    lastRebuild: string | null
  } {
    return this.searchService.getSearchStats()
  }

  // Summary operations - delegated to SummaryService
  updateChatSummary(
    chatId: string,
    summary: string,
    tags: string[],
    keyPoints: string[],
    tokens?: number
  ): void {
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

  getAnalyticsSummary(timeRange: TimeRange = '30d'): {
    totalChats: number
    totalMessages: number
    activeToday: number
    averagePerDay: number
  } {
    return this.analyticsService.getAnalyticsSummary(timeRange)
  }

  // Database cleanup
  close(): void {
    this.db.close()
  }
}
