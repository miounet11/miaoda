import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, Pinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import type { ComponentPublicInstance } from 'vue'
import type { Message, Chat, Attachment } from '@/types'

/**
 * Enhanced test utilities for Vue components with Pinia and Vue Router
 */

export interface TestWrapperOptions {
  props?: Record<string, any>
  slots?: Record<string, any>
  global?: {
    plugins?: any[]
    mocks?: Record<string, any>
    stubs?: Record<string, any>
    provide?: Record<string, any>
  }
  attachTo?: HTMLElement
}

/**
 * Creates a Vue component wrapper with common testing setup
 */
export function createWrapper<T extends ComponentPublicInstance>(
  component: any,
  options: TestWrapperOptions = {}
): { wrapper: VueWrapper<T>; pinia: Pinia; router: any } {
  const pinia = createPinia()

  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div>Home</div>' } },
      { path: '/chat/:id?', component: { template: '<div>Chat</div>' } },
      { path: '/settings', component: { template: '<div>Settings</div>' } }
    ]
  })

  const wrapper = mount(component, {
    ...options,
    global: {
      plugins: [pinia, router],
      ...options.global
    }
  })

  return { wrapper, pinia, router }
}

/**
 * Factory function for creating mock messages
 */
export function createMockMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    role: 'user',
    content: 'Test message content',
    timestamp: new Date(),
    chatId: 'test-chat-id',
    ...overrides
  }
}

/**
 * Factory function for creating mock chats
 */
export function createMockChat(overrides: Partial<Chat> = {}): Chat {
  return {
    id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: 'Test Chat',
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }
}

/**
 * Factory function for creating mock attachments
 */
export function createMockAttachment(overrides: Partial<Attachment> = {}): Attachment {
  return {
    id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: 'test-file.txt',
    type: 'text',
    data: 'SGVsbG8gV29ybGQ=', // "Hello World" in base64
    size: 1024,
    ...overrides
  }
}

/**
 * Creates a mock conversation with multiple messages
 */
export function createMockConversation(messageCount: number = 5): {
  chat: Chat
  messages: Message[]
} {
  const chat = createMockChat()
  const messages = Array(messageCount)
    .fill(null)
    .map((_, index) =>
      createMockMessage({
        id: `msg-${index}`,
        chatId: chat.id,
        role: index % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${index}: ${index % 2 === 0 ? 'User message' : 'Assistant response'}`,
        timestamp: new Date(Date.now() - (messageCount - index) * 60000) // Spread over time
      })
    )

  chat.messages = messages
  return { chat, messages }
}

/**
 * Simulates typing in an input field
 */
export async function typeInInput(wrapper: VueWrapper<any>, selector: string, text: string) {
  const input = wrapper.find(selector)
  if (!input.exists()) {
    throw new Error(`Input with selector "${selector}" not found`)
  }

  await input.setValue(text)
  await input.trigger('input')
  await wrapper.vm.$nextTick()
}

/**
 * Simulates keyboard events
 */
export async function pressKey(
  wrapper: VueWrapper<any>,
  key: string,
  options: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean } = {}
) {
  await wrapper.trigger('keydown', {
    key,
    ...options,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn()
  })
  await wrapper.vm.$nextTick()
}

/**
 * Waits for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 50
): Promise<void> {
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return
    }
    await new Promise(resolve => setTimeout(resolve, interval))
  }

  throw new Error(`Condition not met within ${timeout}ms`)
}

/**
 * Waits for the next Vue tick
 */
export async function nextTick(wrapper: VueWrapper<any>) {
  await wrapper.vm.$nextTick()
}

/**
 * Simulates scroll events
 */
export async function simulateScroll(
  wrapper: VueWrapper<any>,
  selector: string,
  scrollTop: number
) {
  const element = wrapper.find(selector)
  if (!element.exists()) {
    throw new Error(`Element with selector "${selector}" not found`)
  }

  Object.defineProperty(element.element, 'scrollTop', { value: scrollTop })
  await element.trigger('scroll')
  await wrapper.vm.$nextTick()
}

/**
 * Mocks the clipboard API for testing copy functionality
 */
export function mockClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined)
  const readText = vi.fn().mockResolvedValue('')

  Object.assign(navigator, {
    clipboard: { writeText, readText }
  })

  return { writeText, readText }
}

/**
 * Mocks the intersection observer for testing virtual scrolling
 */
export function mockIntersectionObserver() {
  const mockObserver = {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }

  global.IntersectionObserver = vi.fn(() => mockObserver)

  return mockObserver
}

/**
 * Mocks the resize observer for testing responsive behavior
 */
export function mockResizeObserver() {
  const mockObserver = {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }

  global.ResizeObserver = vi.fn(() => mockObserver)

  return mockObserver
}

/**
 * Creates a mock file for testing file operations
 */
export function createMockFile(
  name: string = 'test.txt',
  content: string = 'test content',
  type: string = 'text/plain'
): File {
  const file = new File([content], name, { type })
  return file
}

/**
 * Simulates drag and drop events
 */
export async function simulateDragDrop(wrapper: VueWrapper<any>, selector: string, files: File[]) {
  const element = wrapper.find(selector)
  if (!element.exists()) {
    throw new Error(`Element with selector "${selector}" not found`)
  }

  const dataTransfer = {
    files,
    items: files.map(file => ({ kind: 'file', type: file.type, getAsFile: () => file })),
    types: ['Files']
  }

  await element.trigger('dragover', { dataTransfer })
  await element.trigger('drop', { dataTransfer })
  await wrapper.vm.$nextTick()
}

/**
 * Asserts that an element is visible
 */
export function expectToBeVisible(element: any) {
  expect(element.exists()).toBe(true)
  expect(element.isVisible()).toBe(true)
}

/**
 * Asserts that an element is hidden
 */
export function expectToBeHidden(element: any) {
  if (element.exists()) {
    expect(element.isVisible()).toBe(false)
  }
}

/**
 * Creates a performance timer for testing render times
 */
export class TestPerformanceTimer {
  private startTime: number = 0

  start(): void {
    this.startTime = performance.now()
  }

  end(): number {
    return performance.now() - this.startTime
  }

  expectWithinTime(maxTime: number): void {
    const duration = this.end()
    expect(duration).toBeLessThan(maxTime)
  }
}

/**
 * Mock data generators for testing
 */
export const TestDataGenerators = {
  /**
   * Generates random text content
   */
  randomText(length: number = 100): string {
    const words = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit']
    const result = []
    for (let i = 0; i < length; i++) {
      result.push(words[Math.floor(Math.random() * words.length)])
    }
    return result.join(' ')
  },

  /**
   * Generates markdown content for testing
   */
  markdownContent(): string {
    return `# Test Heading

This is **bold** text and *italic* text.

\`\`\`javascript
console.log('Hello world');
\`\`\`

- List item 1
- List item 2
- List item 3

[Link](https://example.com)`
  },

  /**
   * Generates code content for testing
   */
  codeContent(language: string = 'typescript'): string {
    return `\`\`\`${language}
interface TestInterface {
  id: string;
  name: string;
  value: number;
}

function testFunction(param: TestInterface): void {
  console.log('Testing:', param.name);
}
\`\`\``
  }
}

/**
 * Performance assertion helpers
 */
export const PerformanceAssertions = {
  expectRenderTime(wrapper: VueWrapper<any>, maxTime: number) {
    const timer = new TestPerformanceTimer()
    timer.start()

    // Force re-render
    wrapper.vm.$forceUpdate()

    timer.expectWithinTime(maxTime)
  },

  expectUpdateTime(wrapper: VueWrapper<any>, updateFn: () => Promise<void>, maxTime: number) {
    return async () => {
      const timer = new TestPerformanceTimer()
      timer.start()

      await updateFn()

      timer.expectWithinTime(maxTime)
    }
  }
}
