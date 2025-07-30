import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { vi } from 'vitest'

// Create a fresh pinia instance for tests
export function createTestingPinia() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

// Mock electron API
export const mockElectronAPI = {
  getAppVersion: vi.fn().mockResolvedValue('0.1.0'),
  chat: {
    create: vi.fn().mockResolvedValue({ id: 'test-chat-id', title: 'New Chat' }),
    update: vi.fn().mockResolvedValue(true),
    delete: vi.fn().mockResolvedValue(true),
    get: vi.fn().mockResolvedValue(null),
    getAll: vi.fn().mockResolvedValue([])
  },
  message: {
    create: vi.fn().mockResolvedValue({ id: 'test-message-id' }),
    update: vi.fn().mockResolvedValue(true),
    delete: vi.fn().mockResolvedValue(true),
    getAll: vi.fn().mockResolvedValue([])
  },
  llm: {
    generate: vi.fn().mockResolvedValue({ content: 'Test response' }),
    stream: vi.fn()
  },
  mcp: {
    connect: vi.fn().mockResolvedValue(true),
    disconnect: vi.fn().mockResolvedValue(true),
    getTools: vi.fn().mockResolvedValue([]),
    callTool: vi.fn().mockResolvedValue({ result: 'success' })
  },
  plugin: {
    getAll: vi.fn().mockResolvedValue([]),
    install: vi.fn().mockResolvedValue(true),
    uninstall: vi.fn().mockResolvedValue(true),
    enable: vi.fn().mockResolvedValue(true),
    disable: vi.fn().mockResolvedValue(true)
  },
  window: {
    minimize: vi.fn(),
    maximize: vi.fn(),
    close: vi.fn(),
    setAlwaysOnTop: vi.fn(),
    openExternal: vi.fn()
  },
  invoke: vi.fn()
}

// Setup function for tests
export function setupTest() {
  // Mock window.electronAPI
  Object.defineProperty(window, 'electronAPI', {
    value: mockElectronAPI,
    configurable: true,
    writable: true
  })

  // Create testing pinia
  const pinia = createTestingPinia()

  return {
    pinia,
    electronAPI: mockElectronAPI
  }
}

// Helper to mount component with common setup
export function mountWithSetup<T>(
  component: any,
  options: any = {}
): VueWrapper<T> {
  const { pinia } = setupTest()
  
  return mount(component, {
    global: {
      plugins: [pinia],
      stubs: {
        teleport: true,
        transition: false,
        'transition-group': false
      },
      ...options.global
    },
    ...options
  }) as VueWrapper<T>
}

// Wait for next tick helper
export async function waitForNextTick() {
  await new Promise(resolve => setTimeout(resolve, 0))
}

// Mock fetch for tests
export function mockFetch(data: any) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => data,
    text: async () => JSON.stringify(data)
  })
}

// Clean up after tests
export function cleanupTest() {
  vi.clearAllMocks()
  vi.restoreAllMocks()
}