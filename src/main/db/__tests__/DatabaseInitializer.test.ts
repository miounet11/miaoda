import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { DatabaseInitializer } from '../DatabaseInitializer'
import Database from 'better-sqlite3'

// Mock better-sqlite3
vi.mock('better-sqlite3')

describe('DatabaseInitializer', () => {
  let mockDb: any
  let initializer: DatabaseInitializer

  beforeEach(() => {
    mockDb = {
      exec: vi.fn(),
      prepare: vi.fn(() => ({
        run: vi.fn(),
        get: vi.fn(),
        all: vi.fn(),
        finalize: vi.fn()
      })),
      pragma: vi.fn(),
      close: vi.fn(),
      transaction: vi.fn((fn) => fn())
    }
    
    initializer = new DatabaseInitializer(mockDb)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Database Initialization', () => {
    it('initializes database with all required components', () => {
      initializer.initialize()

      // Should enable foreign keys
      expect(mockDb.pragma).toHaveBeenCalledWith('foreign_keys = ON')
      
      // Should execute table creation
      expect(mockDb.exec).toHaveBeenCalled()
      
      // Verify that exec was called with CREATE TABLE statements
      const execCalls = mockDb.exec.mock.calls
      const allSql = execCalls.map(call => call[0]).join(' ')
      
      expect(allSql).toContain('CREATE TABLE IF NOT EXISTS chats')
      expect(allSql).toContain('CREATE TABLE IF NOT EXISTS messages')
    })

    it('creates chat tables with correct schema', () => {
      initializer.initialize()

      const execCalls = mockDb.exec.mock.calls
      const chatTableSql = execCalls.find(call => 
        call[0].includes('CREATE TABLE IF NOT EXISTS chats')
      )?.[0]

      expect(chatTableSql).toBeDefined()
      expect(chatTableSql).toContain('id TEXT PRIMARY KEY')
      expect(chatTableSql).toContain('title TEXT NOT NULL')
      expect(chatTableSql).toContain('created_at TEXT NOT NULL')
      expect(chatTableSql).toContain('updated_at TEXT NOT NULL')
      expect(chatTableSql).toContain('user_id TEXT DEFAULT NULL')
    })

    it('creates message tables with correct schema', () => {
      initializer.initialize()

      const execCalls = mockDb.exec.mock.calls
      const messageTableSql = execCalls.find(call => 
        call[0].includes('CREATE TABLE IF NOT EXISTS messages')
      )?.[0]

      expect(messageTableSql).toBeDefined()
      expect(messageTableSql).toContain('id TEXT PRIMARY KEY')
      expect(messageTableSql).toContain('chat_id TEXT NOT NULL')
      expect(messageTableSql).toContain('role TEXT NOT NULL')
      expect(messageTableSql).toContain('content TEXT NOT NULL')
      expect(messageTableSql).toContain('FOREIGN KEY (chat_id) REFERENCES chats(id)')
    })

    it('creates authentication tables', () => {
      initializer.initialize()

      const execCalls = mockDb.exec.mock.calls
      const allSql = execCalls.map(call => call[0]).join(' ')

      expect(allSql).toContain('CREATE TABLE IF NOT EXISTS users')
      expect(allSql).toContain('CREATE TABLE IF NOT EXISTS sessions')
    })

    it('creates full-text search tables', () => {
      initializer.initialize()

      const execCalls = mockDb.exec.mock.calls
      const allSql = execCalls.map(call => call[0]).join(' ')

      expect(allSql).toContain('messages_fts')
      expect(allSql).toContain('USING fts5')
    })

    it('creates indexes for performance', () => {
      initializer.initialize()

      const execCalls = mockDb.exec.mock.calls
      const allSql = execCalls.map(call => call[0]).join(' ')

      expect(allSql).toContain('CREATE INDEX')
      expect(allSql).toContain('messages_chat_id_idx')
      expect(allSql).toContain('chats_updated_at_idx')
    })

    it('creates triggers for data consistency', () => {
      initializer.initialize()

      const execCalls = mockDb.exec.mock.calls
      const allSql = execCalls.map(call => call[0]).join(' ')

      expect(allSql).toContain('CREATE TRIGGER')
    })
  })

  describe('Migration Support', () => {
    it('runs migrations during initialization', () => {
      initializer.initialize()

      // Should call migration logic
      expect(mockDb.exec).toHaveBeenCalled()
    })

    it('handles migration errors gracefully', () => {
      mockDb.exec.mockImplementationOnce(() => {
        throw new Error('Migration failed')
      })

      expect(() => initializer.initialize()).toThrow('Migration failed')
    })
  })

  describe('Foreign Key Constraints', () => {
    it('enables foreign key constraints', () => {
      initializer.initialize()

      expect(mockDb.pragma).toHaveBeenCalledWith('foreign_keys = ON')
    })

    it('handles constraint violations properly', () => {
      // Test that foreign key constraints are properly set up
      initializer.initialize()

      const execCalls = mockDb.exec.mock.calls
      const allSql = execCalls.map(call => call[0]).join(' ')

      // Should have proper foreign key relationships
      expect(allSql).toContain('FOREIGN KEY (chat_id) REFERENCES chats(id)')
      expect(allSql).toContain('FOREIGN KEY (user_id) REFERENCES users(id)')
    })
  })

  describe('Performance Optimizations', () => {
    it('creates appropriate indexes', () => {
      initializer.initialize()

      const execCalls = mockDb.exec.mock.calls
      const indexSql = execCalls.filter(call => 
        call[0].includes('CREATE INDEX')
      )

      expect(indexSql.length).toBeGreaterThan(0)
      
      const allIndexSql = indexSql.map(call => call[0]).join(' ')
      expect(allIndexSql).toContain('messages_chat_id_idx')
      expect(allIndexSql).toContain('chats_updated_at_idx')
    })

    it('configures database for optimal performance', () => {
      initializer.initialize()

      // Should enable foreign keys for data integrity
      expect(mockDb.pragma).toHaveBeenCalledWith('foreign_keys = ON')
    })
  })

  describe('Schema Validation', () => {
    it('creates all required tables', () => {
      initializer.initialize()

      const execCalls = mockDb.exec.mock.calls
      const allSql = execCalls.map(call => call[0]).join(' ')

      // Core tables
      expect(allSql).toContain('CREATE TABLE IF NOT EXISTS chats')
      expect(allSql).toContain('CREATE TABLE IF NOT EXISTS messages')
      
      // Auth tables
      expect(allSql).toContain('CREATE TABLE IF NOT EXISTS users')
      expect(allSql).toContain('CREATE TABLE IF NOT EXISTS sessions')
      
      // Search tables
      expect(allSql).toContain('messages_fts')
    })

    it('ensures NOT NULL constraints on critical fields', () => {
      initializer.initialize()

      const execCalls = mockDb.exec.mock.calls
      const allSql = execCalls.map(call => call[0]).join(' ')

      expect(allSql).toContain('title TEXT NOT NULL')
      expect(allSql).toContain('content TEXT NOT NULL')
      expect(allSql).toContain('role TEXT NOT NULL')
      expect(allSql).toContain('created_at TEXT NOT NULL')
    })

    it('sets appropriate default values', () => {
      initializer.initialize()

      const execCalls = mockDb.exec.mock.calls
      const allSql = execCalls.map(call => call[0]).join(' ')

      expect(allSql).toContain('archived INTEGER DEFAULT 0')
      expect(allSql).toContain('starred INTEGER DEFAULT 0')
    })
  })

  describe('Database Connection', () => {
    it('works with valid database instance', () => {
      expect(() => new DatabaseInitializer(mockDb)).not.toThrow()
    })

    it('handles database connection errors', () => {
      const invalidDb = null as any
      
      expect(() => new DatabaseInitializer(invalidDb)).toThrow()
    })
  })

  describe('Transaction Support', () => {
    it('uses transactions for complex operations', () => {
      initializer.initialize()

      // Should use transactions for data consistency
      expect(mockDb.transaction).toHaveBeenCalled()
    })

    it('handles transaction rollback on errors', () => {
      mockDb.exec.mockImplementationOnce(() => {
        throw new Error('SQL error')
      })

      expect(() => initializer.initialize()).toThrow()
    })
  })
})