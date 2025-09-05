import { vi } from 'vitest'

// Mock Electron modules for main process testing
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn((name: string) => {
      const paths = {
        userData: '/tmp/test-user-data',
        documents: '/tmp/test-documents',
        temp: '/tmp/test-temp'
      }
      return paths[name] || '/tmp/test'
    }),
    getVersion: vi.fn(() => '1.0.0'),
    getName: vi.fn(() => 'MiaoDa Chat'),
    quit: vi.fn(),
    on: vi.fn(),
    whenReady: vi.fn(() => Promise.resolve()),
    isReady: vi.fn(() => true)
  },
  BrowserWindow: vi.fn().mockImplementation(() => ({
    loadFile: vi.fn(),
    loadURL: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    close: vi.fn(),
    destroy: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    webContents: {
      send: vi.fn(),
      on: vi.fn(),
      off: vi.fn()
    }
  })),
  ipcMain: {
    handle: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    removeAllListeners: vi.fn()
  },
  dialog: {
    showOpenDialog: vi.fn().mockResolvedValue({
      canceled: false,
      filePaths: ['/tmp/test.txt']
    }),
    showSaveDialog: vi.fn().mockResolvedValue({
      canceled: false,
      filePath: '/tmp/test.txt'
    }),
    showMessageBox: vi.fn().mockResolvedValue({ response: 0 })
  },
  shell: {
    openExternal: vi.fn(),
    openPath: vi.fn()
  },
  Menu: {
    buildFromTemplate: vi.fn(),
    setApplicationMenu: vi.fn()
  },
  globalShortcut: {
    register: vi.fn(),
    unregister: vi.fn(),
    unregisterAll: vi.fn()
  }
}))

// Mock better-sqlite3
vi.mock('better-sqlite3', () => {
  const createMockStatement = () => ({
    run: vi.fn().mockReturnValue({ changes: 1, lastInsertRowid: 1 }),
    get: vi.fn(),
    all: vi.fn().mockReturnValue([]),
    finalize: vi.fn(),
    bind: vi.fn(),
    safeIntegers: vi.fn()
  })

  const mockDatabase = {
    prepare: vi.fn(() => createMockStatement()),
    exec: vi.fn(),
    close: vi.fn(),
    pragma: vi.fn(),
    transaction: vi.fn(fn => fn()),
    serialize: vi.fn(),
    backup: vi.fn(),
    function: vi.fn(),
    aggregate: vi.fn(),
    defaultSafeIntegers: vi.fn(),
    unsafeMode: vi.fn()
  }

  return {
    default: vi.fn(() => mockDatabase),
    __esModule: true
  }
})

// Mock electron-store
vi.mock('electron-store', () => {
  class MockStore {
    private data = new Map()

    get(key: string, defaultValue?: any) {
      return this.data.get(key) ?? defaultValue
    }

    set(key: string, value: any) {
      this.data.set(key, value)
    }

    delete(key: string) {
      return this.data.delete(key)
    }

    clear() {
      this.data.clear()
    }

    has(key: string) {
      return this.data.has(key)
    }

    get store() {
      return Object.fromEntries(this.data)
    }

    set store(obj: any) {
      this.data.clear()
      Object.entries(obj).forEach(([key, value]) => {
        this.data.set(key, value)
      })
    }
  }

  return {
    default: MockStore,
    __esModule: true
  }
})

// Mock electron-log
vi.mock('electron-log', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    verbose: vi.fn(),
    transports: {
      file: {
        level: 'info',
        resolvePathFn: vi.fn(),
        format: '',
        maxSize: 10 * 1024 * 1024
      },
      console: {
        level: 'info',
        format: ''
      }
    }
  },
  __esModule: true
}))

// Mock fs operations
vi.mock('fs', () => ({
  existsSync: vi.fn(() => true),
  mkdirSync: vi.fn(),
  readFileSync: vi.fn(() => 'mock file content'),
  writeFileSync: vi.fn(),
  promises: {
    readFile: vi.fn().mockResolvedValue('mock file content'),
    writeFile: vi.fn().mockResolvedValue(undefined),
    mkdir: vi.fn().mockResolvedValue(undefined),
    stat: vi.fn().mockResolvedValue({ isFile: () => true, size: 1024 })
  }
}))

// Mock path operations
vi.mock('path', async () => {
  const actual = await vi.importActual('path')
  return {
    ...actual,
    join: vi.fn((...args) => args.join('/')),
    resolve: vi.fn((...args) => '/' + args.join('/'))
  }
})

// Mock LLM providers
vi.mock('@anthropic-ai/sdk', () => ({
  Anthropic: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ text: 'Mocked response' }]
      }),
      stream: vi.fn().mockResolvedValue({
        async *[Symbol.asyncIterator]() {
          yield { delta: { text: 'Hello' } }
          yield { delta: { text: ' World' } }
        }
      })
    }
  }))
}))

vi.mock('openai', () => ({
  OpenAI: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Mocked OpenAI response' } }]
        })
      }
    }
  }))
}))

vi.mock('@google/genai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn(() => ({
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: vi.fn(() => 'Mocked Google response')
        }
      })
    }))
  }))
}))

vi.mock('ollama', () => ({
  Ollama: vi.fn().mockImplementation(() => ({
    chat: vi.fn().mockResolvedValue({
      message: { content: 'Mocked Ollama response' }
    }),
    generate: vi.fn().mockResolvedValue({
      response: 'Mocked Ollama response'
    })
  }))
}))

// Mock nanoid for consistent IDs
vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'test-id-123456789')
}))

// Global test utilities for main process
global.createMockChatRecord = (overrides = {}) => ({
  id: 'test-chat-id',
  title: 'Test Chat',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  tags: null,
  archived: 0,
  starred: 0,
  settings: null,
  ...overrides
})

global.createMockMessageRecord = (overrides = {}) => ({
  id: 'test-message-id',
  chat_id: 'test-chat-id',
  role: 'user' as const,
  content: 'Test message content',
  created_at: new Date().toISOString(),
  attachments: null,
  metadata: null,
  parent_id: null,
  error: null,
  error_details: null,
  ...overrides
})

// Suppress console output during tests
global.console = {
  ...global.console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}

// Mock process.env for testing
process.env.NODE_ENV = 'test'
