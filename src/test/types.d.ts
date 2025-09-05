import type { Message, Chat } from '@/types'

declare global {
  function createMockMessage(overrides?: Partial<Message>): Message
  function createMockChat(overrides?: Partial<Chat>): Chat

  namespace Vi {
    interface JestAssertion<T = any> {
      toBeValidMessage(): T
      toBeValidChat(): T
    }
  }
}

export {}
