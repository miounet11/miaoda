import { describe, it, expect } from 'vitest'

describe('Basic Test Setup', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2)
  })

  it('should have access to global utilities', () => {
    expect(createMockMessage).toBeDefined()
    expect(createMockChat).toBeDefined()
  })

  it('should create valid mock message', () => {
    const message = createMockMessage()
    expect(message).toBeValidMessage()
  })

  it('should create valid mock chat', () => {
    const chat = createMockChat()
    expect(chat).toBeValidChat()
  })

  it('should handle async operations', async () => {
    const promise = Promise.resolve('test')
    const result = await promise
    expect(result).toBe('test')
  })
})
