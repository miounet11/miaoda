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
import { DatabaseInitializer } from './DatabaseInitializer'


/**
 * Main database class that orchestrates all database services
 * Refactored to reduce complexity and improve maintainability
 */
export class LocalDatabase {
  private db: Database.Database
  private chatService: ChatService
  private messageService: MessageService
  private searchService: SearchService
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

  // Database cleanup
  close(): void {
    this.db.close()
  }
}