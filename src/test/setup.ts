import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Electron APIs
global.window = Object.assign(global.window || {}, {
  electron: {
    ipcRenderer: {
      invoke: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      send: vi.fn(),
      once: vi.fn(),
      removeAllListeners: vi.fn()
    },
    api: {
      // Mock common API methods
      openExternal: vi.fn(),
      showSaveDialog: vi.fn(),
      showOpenDialog: vi.fn(),
      showMessageBox: vi.fn()
    }
  }
})

// Mock better-sqlite3 for main process tests
vi.mock('better-sqlite3', () => {
  const mockDb = {
    exec: vi.fn(),
    prepare: vi.fn(() => ({
      run: vi.fn(),
      get: vi.fn(),
      all: vi.fn(),
      finalize: vi.fn()
    })),
    close: vi.fn(),
    pragma: vi.fn(),
    transaction: vi.fn((fn) => fn())
  }
  return {
    default: vi.fn(() => mockDb),
    __esModule: true
  }
})

// Mock electron-store
vi.mock('electron-store', () => {
  const mockStore = new Map()
  return {
    default: vi.fn(() => ({
      get: vi.fn((key: string, defaultValue?: any) => mockStore.get(key) ?? defaultValue),
      set: vi.fn((key: string, value: any) => mockStore.set(key, value)),
      delete: vi.fn((key: string) => mockStore.delete(key)),
      clear: vi.fn(() => mockStore.clear()),
      has: vi.fn((key: string) => mockStore.has(key)),
      store: Object.fromEntries(mockStore)
    }))
  }
})

// Mock electron modules
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/tmp/test'),
    getVersion: vi.fn(() => '1.0.0'),
    getName: vi.fn(() => 'MiaoDa Chat'),
    quit: vi.fn(),
    on: vi.fn(),
    whenReady: vi.fn(() => Promise.resolve())
  },
  BrowserWindow: vi.fn(),
  ipcMain: {
    handle: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    removeAllListeners: vi.fn()
  },
  ipcRenderer: {
    invoke: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    send: vi.fn(),
    once: vi.fn(),
    removeAllListeners: vi.fn()
  },
  dialog: {
    showOpenDialog: vi.fn(),
    showSaveDialog: vi.fn(),
    showMessageBox: vi.fn()
  },
  shell: {
    openExternal: vi.fn()
  },
  Menu: {
    buildFromTemplate: vi.fn(),
    setApplicationMenu: vi.fn()
  }
}))

// Mock node modules that don't work in test environment
vi.mock('electron-log', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    verbose: vi.fn(),
    transports: {
      file: { level: 'info', format: '', maxSize: 0, resolvePathFn: vi.fn() },
      console: { level: 'info', format: '' }
    }
  },
  __esModule: true
}))

// Mock fs operations
vi.mock('fs', () => ({
  existsSync: vi.fn(() => true),
  mkdirSync: vi.fn(),
  readFileSync: vi.fn(() => 'mock content'),
  writeFileSync: vi.fn(),
  promises: {
    readFile: vi.fn().mockResolvedValue('mock content'),
    writeFile: vi.fn().mockResolvedValue(undefined)
  }
}))

// Mock nanoid for consistent IDs in tests
vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'test-id-123')
}))

// Global test utilities
global.createMockMessage = (overrides = {}) => ({
  id: 'test-message-id',
  content: 'Test message content',
  role: 'user' as const,
  timestamp: Date.now(),
  chatId: 'test-chat-id',
  ...overrides
})

global.createMockChat = (overrides = {}) => ({
  id: 'test-chat-id',
  title: 'Test Chat',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  messages: [],
  ...overrides
})

// Add custom matchers
expect.extend({
  toBeValidMessage(received) {
    const pass = received && 
      typeof received.id === 'string' &&
      typeof received.content === 'string' &&
      ['user', 'assistant', 'system'].includes(received.role) &&
      typeof received.timestamp === 'number'
    
    return {
      message: () => `expected ${received} to be a valid message`,
      pass
    }
  },
  
  toBeValidChat(received) {
    const pass = received &&
      typeof received.id === 'string' &&
      typeof received.title === 'string' &&
      Array.isArray(received.messages)
    
    return {
      message: () => `expected ${received} to be a valid chat`,
      pass
    }
  }
})

// Configure console to reduce noise in tests
global.console = {
  ...global.console,
  // Suppress specific logs during tests
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}