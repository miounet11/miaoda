import { vi } from 'vitest'

// Mock lucide-vue-next globally
vi.mock('lucide-vue-next', () => {
  const createMockIcon = (name: string) => ({
    name,
    template: `<div data-testid="${name.toLowerCase()}-icon" />`
  })
  
  return {
    // Add all icons used in the codebase
    Edit: createMockIcon('Edit'),
    Trash2: createMockIcon('Trash2'),
    Download: createMockIcon('Download'),
    Copy: createMockIcon('Copy'),
    ChevronRight: createMockIcon('ChevronRight'),
    Plus: createMockIcon('Plus'),
    X: createMockIcon('X'),
    ChevronLeft: createMockIcon('ChevronLeft'),
    Settings: createMockIcon('Settings'),
    Search: createMockIcon('Search'),
    MoreHorizontal: createMockIcon('MoreHorizontal'),
    MessageSquare: createMockIcon('MessageSquare'),
    Sparkles: createMockIcon('Sparkles'),
    ChevronDown: createMockIcon('ChevronDown'),
    Send: createMockIcon('Send'),
    Paperclip: createMockIcon('Paperclip'),
    Mic: createMockIcon('Mic'),
    MicOff: createMockIcon('MicOff'),
    Eye: createMockIcon('Eye'),
    EyeOff: createMockIcon('EyeOff'),
    Maximize2: createMockIcon('Maximize2'),
    Minimize2: createMockIcon('Minimize2'),
    RotateCw: createMockIcon('RotateCw'),
    Square: createMockIcon('Square'),
    Check: createMockIcon('Check'),
    AlertCircle: createMockIcon('AlertCircle'),
    Info: createMockIcon('Info'),
    AlertTriangle: createMockIcon('AlertTriangle'),
    CheckCircle: createMockIcon('CheckCircle'),
    XCircle: createMockIcon('XCircle'),
    Loader2: createMockIcon('Loader2'),
    // Add more icons as needed
  }
})

// Mock electron APIs
const mockElectronAPI = {
  api: {
    llm: {
      isConfigured: vi.fn().mockResolvedValue(true),
      sendMessage: vi.fn().mockResolvedValue('Mock response'),
      onChunk: vi.fn().mockReturnValue(() => {}),
      onStatus: vi.fn().mockReturnValue(() => {}),
      onToolCall: vi.fn().mockReturnValue(() => {})
    },
    file: {
      select: vi.fn().mockResolvedValue([]),
      paste: vi.fn().mockResolvedValue({ name: 'test.png', data: 'data:image/png;base64,test' })
    }
  }
}

// Mock window.api
global.window = Object.assign(global.window || {}, {
  api: mockElectronAPI.api
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue('')
  }
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock HTMLElement.scrollIntoView
HTMLElement.prototype.scrollIntoView = vi.fn()

// Mock VoiceService
vi.mock('@renderer/src/services/voice/VoiceService', () => {
  const mockVoiceService = {
    getCapabilities: vi.fn().mockReturnValue({
      speechRecognition: true,
      speechSynthesis: true,
      getUserMedia: true
    }),
    isRecognitionSupported: vi.fn().mockReturnValue(true),
    isSynthesisSupported: vi.fn().mockReturnValue(true),
    isRecognitionRunning: vi.fn().mockReturnValue(false),
    isSynthesisRunning: vi.fn().mockReturnValue(false),
    hasMicrophonePermission: vi.fn().mockReturnValue(true),
    startRecognition: vi.fn().mockResolvedValue(true),
    stopRecognition: vi.fn().mockReturnValue(true),
    synthesizeSpeech: vi.fn().mockResolvedValue(true),
    stopSynthesis: vi.fn().mockReturnValue(true),
    pauseSynthesis: vi.fn().mockReturnValue(true),
    resumeSynthesis: vi.fn().mockReturnValue(true),
    updateConfig: vi.fn(),
    getConfig: vi.fn().mockReturnValue({
      recognition: {
        language: 'zh-CN',
        continuous: true,
        interimResults: true,
        maxAlternatives: 3,
        noiseSuppressionLevel: 0.8
      },
      synthesis: {
        voice: null,
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        language: 'zh-CN'
      },
      permissions: {
        microphone: false,
        autoStart: false
      },
      ui: {
        showWaveform: true,
        showConfidence: true,
        highlightKeywords: true
      }
    }),
    getAvailableVoices: vi.fn().mockReturnValue([]),
    getSupportedLanguages: vi.fn().mockReturnValue(['zh-CN', 'en-US']),
    destroy: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    clear: vi.fn()
  }

  return {
    VoiceService: vi.fn().mockImplementation(() => mockVoiceService),
    voiceService: mockVoiceService
  }
})

// Mock vue-i18n
vi.mock('vue-i18n', () => ({
  createI18n: vi.fn(() => ({
    global: {
      t: vi.fn((key: string) => key),
      tc: vi.fn((key: string) => key),
      te: vi.fn(() => true),
      d: vi.fn((date: Date) => date.toString()),
      n: vi.fn((num: number) => num.toString()),
      locale: { value: 'en' },
      availableLocales: ['en', 'zh-CN'],
      setLocaleMessage: vi.fn(),
      fallbackLocale: 'en'
    },
    install: vi.fn()
  })),
  useI18n: vi.fn(() => ({
    t: vi.fn((key: string) => key),
    tc: vi.fn((key: string) => key),
    te: vi.fn(() => true),
    d: vi.fn((date: Date) => date.toString()),
    n: vi.fn((num: number) => num.toString()),
    locale: { value: 'en' }
  }))
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

// Add custom matchers for testing
expect.extend({
  toBeVisible(received) {
    const isVisible = received.style.display !== 'none' && 
                     received.style.visibility !== 'hidden' &&
                     received.style.opacity !== '0'
    
    return {
      message: () => `expected element to ${this.isNot ? 'not ' : ''}be visible`,
      pass: isVisible
    }
  }
})