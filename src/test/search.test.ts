import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { LocalDatabase } from '../main/db/database'
import type { SearchQuery } from '../main/db/searchTypes'
import { v4 as uuidv4 } from 'uuid'

// Mock electron
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/tmp/test-data')
  }
}))

// Mock fs
vi.mock('fs', () => ({
  default: {},
  mkdirSync: vi.fn(),
  existsSync: vi.fn(() => true)
}))

describe('Search Backend', () => {
  let db: LocalDatabase
  let testChatId: string
  let testMessageIds: string[]

  beforeEach(() => {
    // Create a new database instance for each test
    db = new LocalDatabase()
    
    // Create test data
    testChatId = uuidv4()
    testMessageIds = []
    
    // Create a test chat
    db.createChat({
      id: testChatId,
      title: 'Test Chat',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: 'test,search',
      starred: 1
    })
    
    // Create test messages
    const testMessages = [
      {
        id: uuidv4(),
        chat_id: testChatId,
        role: 'user' as const,
        content: 'Hello, can you help me with TypeScript?',
        created_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        chat_id: testChatId,
        role: 'assistant' as const,
        content: 'Of course! TypeScript is a typed superset of JavaScript. What would you like to know?',
        created_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        chat_id: testChatId,
        role: 'user' as const,
        content: 'How do I define interfaces in TypeScript?',
        created_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        chat_id: testChatId,
        role: 'assistant' as const,
        content: 'In TypeScript, you can define interfaces using the interface keyword. Here\'s an example:\n\ninterface User {\n  name: string;\n  age: number;\n  email?: string;\n}',
        created_at: new Date().toISOString()
      }
    ]
    
    testMessages.forEach(msg => {
      db.createMessage(msg)
      testMessageIds.push(msg.id)
    })
  })

  afterEach(() => {
    // Clean up
    db.close()
  })

  describe('Text Search', () => {
    it('should find messages by keyword', () => {
      const query: SearchQuery = {
        text: 'TypeScript',
        filters: {},
        options: {
          maxResults: 10,
          highlightMatches: true
        }
      }
      
      const results = db.searchMessages(query)
      
      expect(results).toHaveLength(3)
      expect(results[0].message.content).toContain('TypeScript')
      expect(results[0].matches).toHaveLength(1)
      expect(results[0].matches[0].text).toBe('TypeScript')
    })
    
    it('should perform case-insensitive search by default', () => {
      const query: SearchQuery = {
        text: 'typescript',
        filters: {},
        options: {}
      }
      
      const results = db.searchMessages(query)
      
      expect(results).toHaveLength(3)
    })
    
    it('should support whole word search', () => {
      const query: SearchQuery = {
        text: 'interface',
        filters: {},
        options: {
          wholeWords: true
        }
      }
      
      const results = db.searchMessages(query)
      
      expect(results).toHaveLength(2)
    })
  })

  describe('Filter Search', () => {
    it('should filter by role', () => {
      const query: SearchQuery = {
        text: '',
        filters: {
          roles: ['user']
        },
        options: {}
      }
      
      const results = db.searchMessages(query)
      
      expect(results).toHaveLength(2)
      expect(results.every(r => r.message.role === 'user')).toBe(true)
    })
    
    it('should filter by chat ID', () => {
      const query: SearchQuery = {
        text: '',
        filters: {
          chatIds: [testChatId]
        },
        options: {}
      }
      
      const results = db.searchMessages(query)
      
      expect(results).toHaveLength(4)
      expect(results.every(r => r.message.chatId === testChatId)).toBe(true)
    })
    
    it('should filter by date range', () => {
      const startDate = new Date()
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date()
      
      const query: SearchQuery = {
        text: '',
        filters: {
          dateRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString()
          }
        },
        options: {}
      }
      
      const results = db.searchMessages(query)
      
      expect(results).toHaveLength(4) // All messages created today
    })
    
    it('should filter by starred chats', () => {
      const query: SearchQuery = {
        text: '',
        filters: {
          starred: true
        },
        options: {}
      }
      
      const results = db.searchMessages(query)
      
      expect(results).toHaveLength(4) // All messages from starred chat
    })
  })

  describe('Combined Search', () => {
    it('should combine text search with filters', () => {
      const query: SearchQuery = {
        text: 'TypeScript',
        filters: {
          roles: ['assistant']
        },
        options: {
          sortBy: 'relevance'
        }
      }
      
      const results = db.searchMessages(query)
      
      expect(results).toHaveLength(2)
      expect(results.every(r => r.message.role === 'assistant')).toBe(true)
      expect(results.every(r => r.message.content.includes('TypeScript'))).toBe(true)
    })
  })

  describe('Search Options', () => {
    it('should limit results', () => {
      const query: SearchQuery = {
        text: '',
        filters: {},
        options: {
          maxResults: 2
        }
      }
      
      const results = db.searchMessages(query)
      
      expect(results).toHaveLength(2)
    })
    
    it('should sort by date', () => {
      const query: SearchQuery = {
        text: '',
        filters: {},
        options: {
          sortBy: 'date',
          sortOrder: 'desc'
        }
      }
      
      const results = db.searchMessages(query)
      
      expect(results).toHaveLength(4)
      // Check that results are sorted by date (newest first)
      for (let i = 1; i < results.length; i++) {
        const prevDate = new Date(results[i - 1].message.timestamp)
        const currDate = new Date(results[i].message.timestamp)
        expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime())
      }
    })
  })

  describe('Search Stats', () => {
    it('should track search statistics', () => {
      const query: SearchQuery = {
        text: 'TypeScript',
        filters: {},
        options: {}
      }
      
      // Perform multiple searches
      db.searchMessages(query)
      db.searchMessages(query)
      
      const stats = db.getSearchStats()
      
      expect(stats.totalSearches).toBe(2)
      expect(stats.lastSearchAt).toBeTruthy()
      expect(stats.popularTerms).toContain('TypeScript')
    })
  })
})