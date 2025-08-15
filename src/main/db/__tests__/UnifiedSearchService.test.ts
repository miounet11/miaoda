import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { UnifiedSearchService, UnifiedSearchConfig } from '../UnifiedSearchService'
import Database from 'better-sqlite3'
import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

describe('UnifiedSearchService', () => {
  let service: UnifiedSearchService
  let tempDir: string
  let db: Database.Database

  beforeEach(() => {
    // Create temporary database
    tempDir = mkdtempSync(join(tmpdir(), 'test-db-'))
    const dbPath = join(tempDir, 'test.db')
    
    // Initialize database with schema
    db = new Database(dbPath)
    db.exec(`
      CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        chat_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
      );

      CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
        id UNINDEXED,
        content,
        tokenize = 'porter unicode61'
      );
    `)

    // Insert test data
    const chatId = 'test-chat-1'
    db.prepare('INSERT INTO chats (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)').run(
      chatId,
      'Test Chat',
      new Date().toISOString(),
      new Date().toISOString()
    )

    const messages = [
      { id: 'msg-1', content: 'Hello, how can I help you today?', role: 'assistant' },
      { id: 'msg-2', content: 'I need help with TypeScript', role: 'user' },
      { id: 'msg-3', content: 'TypeScript is a typed superset of JavaScript', role: 'assistant' },
      { id: 'msg-4', content: 'Can you explain interfaces?', role: 'user' },
      { id: 'msg-5', content: 'Interfaces define the shape of objects in TypeScript', role: 'assistant' }
    ]

    for (const msg of messages) {
      db.prepare('INSERT INTO messages (id, chat_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)').run(
        msg.id,
        chatId,
        msg.role,
        msg.content,
        new Date().toISOString()
      )
      
      db.prepare('INSERT INTO messages_fts (id, content) VALUES (?, ?)').run(
        msg.id,
        msg.content
      )
    }

    service = new UnifiedSearchService(dbPath)
  })

  afterEach(() => {
    // Clean up
    if (db) {
      db.close()
    }
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })

  describe('Basic Search', () => {
    it('should find messages containing search query', async () => {
      const results = await service.search('TypeScript')
      
      expect(results).toBeDefined()
      expect(results.length).toBeGreaterThan(0)
      expect(results.some(r => r.content && r.content.includes('TypeScript'))).toBe(true)
    })

    it('should return empty array for non-matching query', async () => {
      const results = await service.search('Python')
      
      expect(results).toBeDefined()
      expect(results).toEqual([])
    })

    it('should search in chat titles', () => {
      const chats = service.searchChats('Test')
      
      expect(chats).toBeDefined()
      expect(chats.length).toBe(1)
      expect(chats[0].title).toBe('Test Chat')
    })
  })

  describe('Search Configuration', () => {
    it('should configure search mode', async () => {
      service.configure({ mode: 'advanced' })
      
      const results = await service.search('TypeScript')
      expect(results).toBeDefined()
    })

    it('should respect maxResults option', async () => {
      const config: Partial<UnifiedSearchConfig> = {
        mode: 'basic',
        options: { maxResults: 2 }
      }
      
      const results = await service.search('help', config)
      expect(results.length).toBeLessThanOrEqual(2)
    })

    it('should enable fuzzy search', async () => {
      const config: Partial<UnifiedSearchConfig> = {
        mode: 'basic',
        options: { fuzzySearch: true }
      }
      
      const results = await service.search('Chat', config)
      expect(results.length).toBeGreaterThan(0)
    })
  })

  describe('Cache Management', () => {
    it('should cache search results when enabled', async () => {
      service.configure({
        options: { cacheEnabled: true, cacheTimeout: 1000 }
      })
      
      // First search
      const results1 = await service.search('TypeScript')
      
      // Second search (should use cache)
      const results2 = await service.search('TypeScript')
      
      expect(results1).toEqual(results2)
    })

    it('should clear cache', async () => {
      service.configure({
        options: { cacheEnabled: true }
      })
      
      await service.search('TypeScript')
      service.clearCache()
      
      // This should not use cache
      const results = await service.search('TypeScript')
      expect(results).toBeDefined()
    })
  })

  describe('Search Modes', () => {
    it('should perform advanced search', async () => {
      const results = await service.search('TypeScript', { mode: 'advanced' })
      
      expect(results).toBeDefined()
      expect(results.length).toBeGreaterThan(0)
    })

    it('should perform semantic search', async () => {
      const results = await service.search('programming', { mode: 'semantic' })
      
      expect(results).toBeDefined()
      // Semantic search might find related content even without exact matches
    })

    it('should perform multimodal search', async () => {
      const results = await service.search('help', { mode: 'multimodal' })
      
      expect(results).toBeDefined()
    })
  })

  describe('Search Index', () => {
    it('should rebuild search index', () => {
      expect(() => service.rebuildSearchIndex()).not.toThrow()
    })

    it('should get search statistics', () => {
      const stats = service.getSearchStats()
      
      expect(stats).toBeDefined()
      expect(stats.totalIndexedMessages).toBeGreaterThanOrEqual(0)
      expect(stats.indexSize).toBeGreaterThanOrEqual(0)
      expect(stats.lastRebuild).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid search queries gracefully', async () => {
      const results = await service.search('')
      expect(results).toEqual([])
    })

    it('should handle database errors gracefully', async () => {
      // Close database to simulate error
      db.close()
      
      try {
        await service.search('test')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })
})