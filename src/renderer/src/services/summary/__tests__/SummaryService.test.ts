import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SummaryService } from '../SummaryService'
import type { Message } from '@renderer/src/types'

// Mock window.api
const mockAPI = {
  db: {
    getChatSummary: vi.fn(),
    updateChatSummary: vi.fn(),
    getAllSummaryTags: vi.fn(),
    searchChatsByTags: vi.fn(),
    needsSummaryUpdate: vi.fn(),
    clearChatSummary: vi.fn()
  },
  llm: {
    generateSummary: vi.fn()
  }
}

// @ts-ignore
global.window = {
  api: mockAPI
}

describe('SummaryService', () => {
  let summaryService: SummaryService
  const mockChatId = 'test-chat-id'
  const mockMessages: Message[] = [
    {
      id: 'msg1',
      role: 'user',
      content: 'Hello, how are you today?',
      timestamp: new Date(),
      chatId: mockChatId
    },
    {
      id: 'msg2',
      role: 'assistant',
      content: 'I am doing well, thank you! How can I help you today?',
      timestamp: new Date(),
      chatId: mockChatId
    },
    {
      id: 'msg3',
      role: 'user',
      content: 'Can you help me write a JavaScript function to calculate fibonacci numbers?',
      timestamp: new Date(),
      chatId: mockChatId
    },
    {
      id: 'msg4',
      role: 'assistant',
      content: 'Here is a JavaScript function to calculate fibonacci numbers: function fibonacci(n) { if (n <= 1) return n; return fibonacci(n - 1) + fibonacci(n - 2); }',
      timestamp: new Date(),
      chatId: mockChatId
    }
  ]

  beforeEach(() => {
    summaryService = SummaryService.getInstance()
    vi.clearAllMocks()
  })

  it('should be a singleton', () => {
    const instance1 = SummaryService.getInstance()
    const instance2 = SummaryService.getInstance()
    expect(instance1).toBe(instance2)
  })

  it('should generate summary with LLM API', async () => {
    const mockSummaryResponse = `{
      "summary": "User asked about fibonacci numbers and received a JavaScript implementation.",
      "keyPoints": ["JavaScript programming", "Fibonacci algorithm", "Recursive implementation"],
      "tags": ["javascript", "programming", "algorithms"]
    }`

    mockAPI.llm.generateSummary.mockResolvedValue(mockSummaryResponse)
    mockAPI.db.updateChatSummary.mockResolvedValue(undefined)

    const result = await summaryService.generateSummary(mockChatId, mockMessages)

    expect(mockAPI.llm.generateSummary).toHaveBeenCalledWith(
      expect.stringContaining('请为以下对话生成摘要')
    )
    expect(mockAPI.db.updateChatSummary).toHaveBeenCalledWith(
      mockChatId,
      'User asked about fibonacci numbers and received a JavaScript implementation.',
      ['javascript', 'programming', 'algorithms'],
      ['JavaScript programming', 'Fibonacci algorithm', 'Recursive implementation'],
      undefined
    )

    expect(result.summary).toBe('User asked about fibonacci numbers and received a JavaScript implementation.')
    expect(result.tags).toEqual(['javascript', 'programming', 'algorithms'])
    expect(result.keyPoints).toEqual(['JavaScript programming', 'Fibonacci algorithm', 'Recursive implementation'])
  })

  it('should get existing summary from database', async () => {
    const mockSummary = {
      summary: 'Test summary',
      tags: ['test', 'example'],
      keyPoints: ['Point 1', 'Point 2'],
      summaryUpdatedAt: new Date(),
      summaryTokens: 100
    }

    mockAPI.db.getChatSummary.mockResolvedValue(mockSummary)

    const result = await summaryService.getChatSummary(mockChatId)

    expect(mockAPI.db.getChatSummary).toHaveBeenCalledWith(mockChatId)
    expect(result).toEqual(mockSummary)
  })

  it('should update summary', async () => {
    const mockExistingSummary = {
      summary: 'Old summary',
      tags: ['old'],
      keyPoints: ['Old point']
    }

    const updateData = {
      summary: 'New summary',
      tags: ['new', 'updated'],
      keyPoints: ['New point 1', 'New point 2']
    }

    mockAPI.db.getChatSummary.mockResolvedValue(mockExistingSummary)
    mockAPI.db.updateChatSummary.mockResolvedValue(undefined)

    await summaryService.updateSummary(mockChatId, updateData)

    expect(mockAPI.db.updateChatSummary).toHaveBeenCalledWith(
      mockChatId,
      'New summary',
      ['new', 'updated'],
      ['New point 1', 'New point 2'],
      undefined
    )
  })

  it('should get all tags', async () => {
    const mockTags = ['javascript', 'programming', 'algorithms', 'react']
    mockAPI.db.getAllSummaryTags.mockResolvedValue(mockTags)

    const result = await summaryService.getAllTags()

    expect(mockAPI.db.getAllSummaryTags).toHaveBeenCalled()
    expect(result).toEqual(mockTags)
  })

  it('should search chats by tags', async () => {
    const mockChats = [
      { id: 'chat1', title: 'JavaScript Chat', tags: 'javascript,programming' },
      { id: 'chat2', title: 'React Chat', tags: 'react,javascript' }
    ]
    const searchTags = ['javascript']

    mockAPI.db.searchChatsByTags.mockResolvedValue(mockChats)

    const result = await summaryService.searchChatsByTags(searchTags)

    expect(mockAPI.db.searchChatsByTags).toHaveBeenCalledWith(searchTags)
    expect(result).toEqual(mockChats)
  })

  it('should check if summary update is needed', async () => {
    mockAPI.db.needsSummaryUpdate.mockResolvedValue(true)

    const result = await summaryService.needsSummaryUpdate(mockChatId, 5, 24)

    expect(mockAPI.db.needsSummaryUpdate).toHaveBeenCalledWith(mockChatId, 5, 24)
    expect(result).toBe(true)
  })

  it('should clear summary', async () => {
    mockAPI.db.clearChatSummary.mockResolvedValue(undefined)

    await summaryService.clearSummary(mockChatId)

    expect(mockAPI.db.clearChatSummary).toHaveBeenCalledWith(mockChatId)
  })

  it('should extract text content from messages', () => {
    const result = summaryService.extractTextContent(mockMessages)

    expect(result).toContain('Hello, how are you today?')
    expect(result).toContain('fibonacci numbers')
    expect(result).not.toContain('system:') // Should filter out system messages
  })

  it('should calculate importance score', () => {
    const score = summaryService.calculateImportanceScore(mockMessages)

    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('should handle LLM API errors gracefully', async () => {
    mockAPI.llm.generateSummary.mockRejectedValue(new Error('LLM API error'))

    await expect(
      summaryService.generateSummary(mockChatId, mockMessages)
    ).rejects.toThrow('Summary generation failed: Failed to generate summary using LLM')
  })

  it('should handle malformed JSON response from LLM', async () => {
    const malformedResponse = 'This is not JSON'
    mockAPI.llm.generateSummary.mockResolvedValue(malformedResponse)
    mockAPI.db.updateChatSummary.mockResolvedValue(undefined)

    const result = await summaryService.generateSummary(mockChatId, mockMessages)

    // Should fallback to treating the entire response as summary
    expect(result.summary).toBe('This is not JSON')
    expect(result.tags).toEqual([])
    expect(result.keyPoints).toEqual([])
  })

  it('should create appropriate prompt for summary generation', async () => {
    const mockResponse = '{"summary": "test", "tags": [], "keyPoints": []}'
    mockAPI.llm.generateSummary.mockResolvedValue(mockResponse)
    mockAPI.db.updateChatSummary.mockResolvedValue(undefined)

    await summaryService.generateSummary(mockChatId, mockMessages, {
      maxLength: 100,
      includeKeyPoints: true,
      includeTags: true,
      language: 'en'
    })

    const prompt = mockAPI.llm.generateSummary.mock.calls[0][0]
    expect(prompt).toContain('Please generate a summary')
    expect(prompt).toContain('max 100 characters')
    expect(prompt).toContain('Key points')
    expect(prompt).toContain('Relevant tags')
  })
})