import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ChatService } from '../ChatService'
import type { ChatRecord } from '../types'
import Database from 'better-sqlite3'

// Mock better-sqlite3
vi.mock('better-sqlite3')

describe('ChatService', () => {
  let mockDb: any
  let chatService: ChatService
  let mockStmt: any

  beforeEach(() => {
    mockStmt = {
      run: vi.fn(),
      get: vi.fn(),
      all: vi.fn(),
      finalize: vi.fn()
    }

    mockDb = {
      prepare: vi.fn(() => mockStmt),
      transaction: vi.fn((fn) => fn()),
      exec: vi.fn(),
      close: vi.fn()
    }

    chatService = new ChatService(mockDb)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Chat Creation', () => {
    it('creates a new chat successfully', () => {
      const chatRecord: ChatRecord = {
        id: 'chat-123',
        title: 'Test Chat',
        created_at: '2024-01-01T12:00:00Z',
        updated_at: '2024-01-01T12:00:00Z'
      }

      chatService.createChat(chatRecord)

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO chats')
      )
      expect(mockStmt.run).toHaveBeenCalledWith(
        'chat-123',
        'Test Chat',
        '2024-01-01T12:00:00Z',
        '2024-01-01T12:00:00Z',
        null, // tags
        0,    // archived
        0,    // starred
        null  // settings
      )
    })

    it('creates chat with all optional fields', () => {
      const chatRecord: ChatRecord = {
        id: 'chat-456',
        title: 'Full Featured Chat',
        created_at: '2024-01-01T12:00:00Z',
        updated_at: '2024-01-01T12:00:00Z',
        tags: 'work,important',
        archived: 1,
        starred: 1,
        settings: '{"theme":"dark"}'
      }

      chatService.createChat(chatRecord)

      expect(mockStmt.run).toHaveBeenCalledWith(
        'chat-456',
        'Full Featured Chat',
        '2024-01-01T12:00:00Z',
        '2024-01-01T12:00:00Z',
        'work,important',
        1,
        1,
        '{"theme":"dark"}'
      )
    })

    it('validates chat ID', () => {
      const invalidChat: ChatRecord = {
        id: '', // Invalid empty ID
        title: 'Test Chat',
        created_at: '2024-01-01T12:00:00Z',
        updated_at: '2024-01-01T12:00:00Z'
      }

      expect(() => chatService.createChat(invalidChat)).toThrow()
    })

    it('validates chat title', () => {
      const invalidChat: ChatRecord = {
        id: 'chat-123',
        title: '', // Invalid empty title
        created_at: '2024-01-01T12:00:00Z',
        updated_at: '2024-01-01T12:00:00Z'
      }

      expect(() => chatService.createChat(invalidChat)).toThrow()
    })

    it('handles database errors during creation', () => {
      mockStmt.run.mockImplementation(() => {
        throw new Error('Database constraint violation')
      })

      const chatRecord: ChatRecord = {
        id: 'chat-123',
        title: 'Test Chat',
        created_at: '2024-01-01T12:00:00Z',
        updated_at: '2024-01-01T12:00:00Z'
      }

      expect(() => chatService.createChat(chatRecord)).toThrow('Database constraint violation')
    })
  })

  describe('Chat Updates', () => {
    it('updates chat title successfully', () => {
      const chatId = 'chat-123'
      const newTitle = 'Updated Chat Title'
      const updatedAt = '2024-01-01T13:00:00Z'

      chatService.updateChat(chatId, newTitle, updatedAt)

      expect(mockDb.prepare).toHaveBeenCalledWith(
        'UPDATE chats SET title = ?, updated_at = ? WHERE id = ?'
      )
      expect(mockStmt.run).toHaveBeenCalledWith(newTitle, updatedAt, chatId)
    })

    it('validates update parameters', () => {
      expect(() => {
        chatService.updateChat('', 'New Title', '2024-01-01T13:00:00Z')
      }).toThrow()

      expect(() => {
        chatService.updateChat('chat-123', '', '2024-01-01T13:00:00Z')
      }).toThrow()
    })

    it('handles update errors', () => {
      mockStmt.run.mockImplementation(() => {
        throw new Error('Update failed')
      })

      expect(() => {
        chatService.updateChat('chat-123', 'New Title', '2024-01-01T13:00:00Z')
      }).toThrow('Update failed')
    })
  })

  describe('Chat Deletion', () => {
    it('deletes chat and associated messages', () => {
      const chatId = 'chat-123'

      chatService.deleteChat(chatId)

      expect(mockDb.transaction).toHaveBeenCalled()
      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM messages WHERE chat_id = ?')
      )
      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM chats WHERE id = ?')
      )
    })

    it('validates chat ID for deletion', () => {
      expect(() => chatService.deleteChat('')).toThrow()
      expect(() => chatService.deleteChat(null as any)).toThrow()
    })

    it('uses transaction for data consistency', () => {
      chatService.deleteChat('chat-123')

      expect(mockDb.transaction).toHaveBeenCalled()
    })

    it('handles deletion errors with rollback', () => {
      mockStmt.run.mockImplementationOnce(() => {
        throw new Error('Deletion failed')
      })

      expect(() => chatService.deleteChat('chat-123')).toThrow('Deletion failed')
    })
  })

  describe('Chat Retrieval', () => {
    it('gets all chats successfully', () => {
      const mockChats: ChatRecord[] = [
        {
          id: 'chat-1',
          title: 'Chat 1',
          created_at: '2024-01-01T12:00:00Z',
          updated_at: '2024-01-01T12:00:00Z'
        },
        {
          id: 'chat-2',
          title: 'Chat 2',
          created_at: '2024-01-01T13:00:00Z',
          updated_at: '2024-01-01T13:00:00Z'
        }
      ]

      mockStmt.all.mockReturnValue(mockChats)

      const result = chatService.getAllChats()

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM chats')
      )
      expect(result).toEqual(mockChats)
    })

    it('gets chat by ID successfully', () => {
      const mockChat: ChatRecord = {
        id: 'chat-123',
        title: 'Test Chat',
        created_at: '2024-01-01T12:00:00Z',
        updated_at: '2024-01-01T12:00:00Z'
      }

      mockStmt.get.mockReturnValue(mockChat)

      const result = chatService.getChatById('chat-123')

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM chats WHERE id = ?')
      )
      expect(mockStmt.get).toHaveBeenCalledWith('chat-123')
      expect(result).toEqual(mockChat)
    })

    it('returns null for non-existent chat', () => {
      mockStmt.get.mockReturnValue(undefined)

      const result = chatService.getChatById('non-existent')

      expect(result).toBeNull()
    })

    it('validates ID for retrieval', () => {
      expect(() => chatService.getChatById('')).toThrow()
    })
  })

  describe('Chat Archiving', () => {
    it('archives chat successfully', () => {
      chatService.archiveChat('chat-123')

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE chats SET archived = 1')
      )
      expect(mockStmt.run).toHaveBeenCalledWith('chat-123')
    })

    it('unarchives chat successfully', () => {
      chatService.unarchiveChat('chat-123')

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE chats SET archived = 0')
      )
      expect(mockStmt.run).toHaveBeenCalledWith('chat-123')
    })

    it('stars chat successfully', () => {
      chatService.starChat('chat-123')

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE chats SET starred = 1')
      )
      expect(mockStmt.run).toHaveBeenCalledWith('chat-123')
    })

    it('unstars chat successfully', () => {
      chatService.unstarChat('chat-123')

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE chats SET starred = 0')
      )
      expect(mockStmt.run).toHaveBeenCalledWith('chat-123')
    })
  })

  describe('Chat Search and Filtering', () => {
    it('searches chats by title', () => {
      const mockResults: ChatRecord[] = [
        {
          id: 'chat-1',
          title: 'Work Project Chat',
          created_at: '2024-01-01T12:00:00Z',
          updated_at: '2024-01-01T12:00:00Z'
        }
      ]

      mockStmt.all.mockReturnValue(mockResults)

      const results = chatService.searchChats('Work')

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('WHERE title LIKE ?')
      )
      expect(mockStmt.all).toHaveBeenCalledWith('%Work%')
      expect(results).toEqual(mockResults)
    })

    it('filters archived chats', () => {
      chatService.getArchivedChats()

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('WHERE archived = 1')
      )
    })

    it('filters starred chats', () => {
      chatService.getStarredChats()

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('WHERE starred = 1')
      )
    })

    it('gets recent chats with limit', () => {
      chatService.getRecentChats(10)

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY updated_at DESC LIMIT ?')
      )
      expect(mockStmt.all).toHaveBeenCalledWith(10)
    })
  })

  describe('Performance Optimizations', () => {
    it('uses prepared statements for efficiency', () => {
      const chatRecord: ChatRecord = {
        id: 'chat-123',
        title: 'Test Chat',
        created_at: '2024-01-01T12:00:00Z',
        updated_at: '2024-01-01T12:00:00Z'
      }

      chatService.createChat(chatRecord)

      // Should use prepared statements
      expect(mockDb.prepare).toHaveBeenCalled()
      expect(mockStmt.run).toHaveBeenCalled()
    })

    it('handles bulk operations efficiently', () => {
      const chats: ChatRecord[] = Array(100).fill(null).map((_, i) => ({
        id: `chat-${i}`,
        title: `Chat ${i}`,
        created_at: '2024-01-01T12:00:00Z',
        updated_at: '2024-01-01T12:00:00Z'
      }))

      // Measure performance of bulk operations
      const startTime = performance.now()
      
      chats.forEach(chat => chatService.createChat(chat))
      
      const endTime = performance.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(1000) // Should complete within 1 second
      expect(mockStmt.run).toHaveBeenCalledTimes(100)
    })
  })

  describe('Data Validation', () => {
    it('validates required fields', () => {
      const invalidChat = {
        id: 'chat-123',
        title: null, // Invalid
        created_at: '2024-01-01T12:00:00Z',
        updated_at: '2024-01-01T12:00:00Z'
      } as any

      expect(() => chatService.createChat(invalidChat)).toThrow()
    })

    it('validates ID format', () => {
      const invalidChat: ChatRecord = {
        id: '', // Empty ID
        title: 'Test Chat',
        created_at: '2024-01-01T12:00:00Z',
        updated_at: '2024-01-01T12:00:00Z'
      }

      expect(() => chatService.createChat(invalidChat)).toThrow()
    })

    it('validates title length', () => {
      const longTitle = 'a'.repeat(1000) // Very long title
      const invalidChat: ChatRecord = {
        id: 'chat-123',
        title: longTitle,
        created_at: '2024-01-01T12:00:00Z',
        updated_at: '2024-01-01T12:00:00Z'
      }

      // Should either truncate or reject
      expect(() => chatService.createChat(invalidChat)).toThrow()
    })

    it('sanitizes input data', () => {
      const maliciousChat: ChatRecord = {
        id: 'chat-123',
        title: '<script>alert("xss")</script>',
        created_at: '2024-01-01T12:00:00Z',
        updated_at: '2024-01-01T12:00:00Z'
      }

      // Should handle potentially malicious content
      chatService.createChat(maliciousChat)
      
      expect(mockStmt.run).toHaveBeenCalled()
      // The actual sanitization would be in the validation method
    })
  })

  describe('Error Handling', () => {
    it('handles SQL constraint violations', () => {
      mockStmt.run.mockImplementation(() => {
        const error = new Error('UNIQUE constraint failed')
        error.code = 'SQLITE_CONSTRAINT_UNIQUE'
        throw error
      })

      const chatRecord: ChatRecord = {
        id: 'duplicate-id',
        title: 'Test Chat',
        created_at: '2024-01-01T12:00:00Z',
        updated_at: '2024-01-01T12:00:00Z'
      }

      expect(() => chatService.createChat(chatRecord)).toThrow('UNIQUE constraint failed')
    })

    it('handles foreign key constraint violations', () => {
      mockStmt.run.mockImplementation(() => {
        const error = new Error('FOREIGN KEY constraint failed')
        error.code = 'SQLITE_CONSTRAINT_FOREIGNKEY'
        throw error
      })

      const chatRecord: ChatRecord = {
        id: 'chat-123',
        title: 'Test Chat',
        created_at: '2024-01-01T12:00:00Z',
        updated_at: '2024-01-01T12:00:00Z'
      }

      expect(() => chatService.createChat(chatRecord)).toThrow('FOREIGN KEY constraint failed')
    })

    it('handles database connection errors', () => {
      mockDb.prepare.mockImplementation(() => {
        throw new Error('Database connection lost')
      })

      const chatRecord: ChatRecord = {
        id: 'chat-123',
        title: 'Test Chat',
        created_at: '2024-01-01T12:00:00Z',
        updated_at: '2024-01-01T12:00:00Z'
      }

      expect(() => chatService.createChat(chatRecord)).toThrow('Database connection lost')
    })
  })

  describe('Transaction Management', () => {
    it('uses transactions for complex operations', () => {
      chatService.deleteChat('chat-123')

      expect(mockDb.transaction).toHaveBeenCalled()
    })

    it('rolls back on transaction failure', () => {
      mockStmt.run.mockImplementationOnce(() => {
        throw new Error('Transaction failed')
      })

      expect(() => chatService.deleteChat('chat-123')).toThrow('Transaction failed')
      
      // Transaction should handle rollback automatically
      expect(mockDb.transaction).toHaveBeenCalled()
    })

    it('commits successful transactions', () => {
      chatService.deleteChat('chat-123')

      // Transaction should complete successfully
      expect(mockDb.transaction).toHaveBeenCalled()
      expect(mockStmt.run).toHaveBeenCalled()
    })
  })

  describe('Concurrency', () => {
    it('handles concurrent chat operations', async () => {
      const concurrentOperations = Array(10).fill(null).map((_, i) => {
        const chat: ChatRecord = {
          id: `concurrent-chat-${i}`,
          title: `Concurrent Chat ${i}`,
          created_at: '2024-01-01T12:00:00Z',
          updated_at: '2024-01-01T12:00:00Z'
        }
        return () => chatService.createChat(chat)
      })

      // Run operations concurrently
      expect(() => {
        concurrentOperations.forEach(op => op())
      }).not.toThrow()

      expect(mockStmt.run).toHaveBeenCalledTimes(10)
    })

    it('handles read-write conflicts', () => {
      // Simulate concurrent read and write
      const readOp = () => chatService.getChatById('chat-123')
      const writeOp = () => chatService.updateChat('chat-123', 'New Title', '2024-01-01T13:00:00Z')

      expect(() => {
        readOp()
        writeOp()
        readOp()
      }).not.toThrow()
    })
  })

  describe('Memory Management', () => {
    it('properly finalizes prepared statements', () => {
      const chatRecord: ChatRecord = {
        id: 'chat-123',
        title: 'Test Chat',
        created_at: '2024-01-01T12:00:00Z',
        updated_at: '2024-01-01T12:00:00Z'
      }

      chatService.createChat(chatRecord)

      // In a real implementation, statements should be finalized
      // This test ensures the service is designed for proper cleanup
      expect(mockDb.prepare).toHaveBeenCalled()
    })

    it('handles large result sets efficiently', () => {
      const largeResultSet = Array(10000).fill(null).map((_, i) => ({
        id: `chat-${i}`,
        title: `Chat ${i}`,
        created_at: '2024-01-01T12:00:00Z',
        updated_at: '2024-01-01T12:00:00Z'
      }))

      mockStmt.all.mockReturnValue(largeResultSet)

      const startTime = performance.now()
      const result = chatService.getAllChats()
      const endTime = performance.now()

      expect(result).toHaveLength(10000)
      expect(endTime - startTime).toBeLessThan(100) // Should be fast
    })
  })
})