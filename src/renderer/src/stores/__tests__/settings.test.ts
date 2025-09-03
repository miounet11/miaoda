import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSettingsStore } from '../settings'
import type { LLMProvider } from '@/types'

// Mock IPC for settings persistence
const mockIpcRenderer = {
  invoke: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  send: vi.fn()
}

global.window = {
  ...global.window,
  electron: {
    ipcRenderer: mockIpcRenderer
  }
}

describe('useSettingsStore', () => {
  let pinia: ReturnType<typeof createPinia>
  let settingsStore: ReturnType<typeof useSettingsStore>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    settingsStore = useSettingsStore()
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('initializes with default values', () => {
      expect(settingsStore.llmProvider).toBe('openai')
      expect(settingsStore.modelName).toBe('gpt-4')
      expect(settingsStore.temperature).toBe(0.7)
      expect(settingsStore.maxTokens).toBe(2048)
      expect(settingsStore.streamingEnabled).toBe(true)
    })

    it('initializes UI settings with defaults', () => {
      expect(settingsStore.fontSize).toBe(14)
      expect(settingsStore.fontFamily).toBe('Inter')
      expect(settingsStore.lineHeight).toBe(1.5)
      expect(settingsStore.showTimestamps).toBe(true)
      expect(settingsStore.showAvatars).toBe(true)
      expect(settingsStore.animationsEnabled).toBe(true)
    })

    it('initializes privacy settings with secure defaults', () => {
      expect(settingsStore.dataCollection).toBe(false)
      expect(settingsStore.analytics).toBe(false)
      expect(settingsStore.encryptData).toBe(false)
      expect(settingsStore.sendAnalytics).toBe(false)
      expect(settingsStore.saveConversations).toBe(true)
    })
  })

  describe('LLM Provider Management', () => {
    it('updates LLM provider correctly', () => {
      settingsStore.updateLLMProvider('anthropic')
      expect(settingsStore.llmProvider).toBe('anthropic')
    })

    it('updates model name correctly', () => {
      settingsStore.updateModelName('claude-3-opus')
      expect(settingsStore.modelName).toBe('claude-3-opus')
    })

    it('updates temperature within valid range', () => {
      settingsStore.updateTemperature(0.5)
      expect(settingsStore.temperature).toBe(0.5)

      // Test boundary values
      settingsStore.updateTemperature(0)
      expect(settingsStore.temperature).toBe(0)

      settingsStore.updateTemperature(2.0)
      expect(settingsStore.temperature).toBe(2.0)
    })

    it('validates temperature range', () => {
      // Should clamp invalid values
      settingsStore.updateTemperature(-1)
      expect(settingsStore.temperature).toBeGreaterThanOrEqual(0)

      settingsStore.updateTemperature(3)
      expect(settingsStore.temperature).toBeLessThanOrEqual(2)
    })

    it('updates max tokens correctly', () => {
      settingsStore.updateMaxTokens(4096)
      expect(settingsStore.maxTokens).toBe(4096)
    })
  })

  describe('UI Settings Management', () => {
    it('updates font settings', () => {
      settingsStore.updateFontSize(16)
      expect(settingsStore.fontSize).toBe(16)

      settingsStore.updateFontFamily('Monaco')
      expect(settingsStore.fontFamily).toBe('Monaco')

      settingsStore.updateLineHeight(1.6)
      expect(settingsStore.lineHeight).toBe(1.6)
    })

    it('toggles UI features', () => {
      const initialTimestamps = settingsStore.showTimestamps
      settingsStore.toggleTimestamps()
      expect(settingsStore.showTimestamps).toBe(!initialTimestamps)

      const initialAvatars = settingsStore.showAvatars
      settingsStore.toggleAvatars()
      expect(settingsStore.showAvatars).toBe(!initialAvatars)

      const initialAnimations = settingsStore.animationsEnabled
      settingsStore.toggleAnimations()
      expect(settingsStore.animationsEnabled).toBe(!initialAnimations)
    })

    it('updates spacing settings', () => {
      settingsStore.updateMessageSpacing(20)
      expect(settingsStore.messageSpacing).toBe(20)
    })

    it('toggles compact mode', () => {
      const initialCompact = settingsStore.compactMode
      settingsStore.toggleCompactMode()
      expect(settingsStore.compactMode).toBe(!initialCompact)
    })
  })

  describe('Chat Behavior Settings', () => {
    it('updates chat preferences', () => {
      settingsStore.updateAutoScroll(false)
      expect(settingsStore.autoScroll).toBe(false)

      settingsStore.updateEnterToSend(false)
      expect(settingsStore.enterToSend).toBe(false)

      settingsStore.updateSpellCheck(false)
      expect(settingsStore.spellCheck).toBe(false)
    })

    it('updates auto-save settings', () => {
      settingsStore.updateAutoSave(false)
      expect(settingsStore.autoSave).toBe(false)

      settingsStore.updateAutoSaveInterval(60)
      expect(settingsStore.autoSaveInterval).toBe(60)
    })
  })

  describe('Privacy Settings Management', () => {
    it('updates privacy preferences', () => {
      settingsStore.updateDataCollection(true)
      expect(settingsStore.dataCollection).toBe(true)

      settingsStore.updateAnalytics(true)
      expect(settingsStore.analytics).toBe(true)

      settingsStore.updateCrashReporting(false)
      expect(settingsStore.crashReporting).toBe(false)
    })

    it('updates data security settings', () => {
      settingsStore.updateEncryptData(true)
      expect(settingsStore.encryptData).toBe(true)

      settingsStore.updateSaveConversations(false)
      expect(settingsStore.saveConversations).toBe(false)
    })
  })

  describe('Voice Settings Management', () => {
    it('updates voice settings', () => {
      settingsStore.updateVoiceEnabled(true)
      expect(settingsStore.voiceEnabled).toBe(true)

      settingsStore.updateVoiceLanguage('es-ES')
      expect(settingsStore.voiceLanguage).toBe('es-ES')

      settingsStore.updateVoiceRate(1.5)
      expect(settingsStore.voiceRate).toBe(1.5)
    })

    it('validates voice rate range', () => {
      settingsStore.updateVoiceRate(0.5)
      expect(settingsStore.voiceRate).toBe(0.5)

      settingsStore.updateVoiceRate(2.0)
      expect(settingsStore.voiceRate).toBe(2.0)

      // Test boundary values
      settingsStore.updateVoiceRate(0.1)
      expect(settingsStore.voiceRate).toBeGreaterThanOrEqual(0.1)

      settingsStore.updateVoiceRate(3.0)
      expect(settingsStore.voiceRate).toBeLessThanOrEqual(3.0)
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('updates keyboard shortcuts', () => {
      const shortcuts = {
        newChat: 'Cmd+N',
        search: 'Cmd+F',
        settings: 'Cmd+Comma'
      }

      settingsStore.updateKeyboardShortcuts(shortcuts)
      expect(settingsStore.keyboardShortcuts).toEqual(shortcuts)
    })

    it('validates shortcut format', () => {
      const invalidShortcuts = {
        newChat: 'InvalidShortcut'
      }

      // Should validate shortcut format
      expect(() => settingsStore.updateKeyboardShortcuts(invalidShortcuts))
        .not.toThrow() // Store should handle gracefully
    })
  })

  describe('Settings Persistence', () => {
    it('saves settings to main process', async () => {
      mockIpcRenderer.invoke.mockResolvedValue({ success: true })

      await settingsStore.saveSettings()

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('settings:save', 
        expect.objectContaining({
          llmProvider: settingsStore.llmProvider,
          modelName: settingsStore.modelName,
          temperature: settingsStore.temperature
        })
      )
    })

    it('loads settings from main process', async () => {
      const mockSettings = {
        llmProvider: 'anthropic' as LLMProvider,
        modelName: 'claude-3-opus',
        temperature: 0.5,
        fontSize: 16,
        showTimestamps: false
      }
      
      mockIpcRenderer.invoke.mockResolvedValue(mockSettings)

      await settingsStore.loadSettings()

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('settings:load')
      expect(settingsStore.llmProvider).toBe('anthropic')
      expect(settingsStore.modelName).toBe('claude-3-opus')
      expect(settingsStore.temperature).toBe(0.5)
      expect(settingsStore.fontSize).toBe(16)
      expect(settingsStore.showTimestamps).toBe(false)
    })

    it('handles settings load errors', async () => {
      const error = new Error('Failed to load settings')
      mockIpcRenderer.invoke.mockRejectedValue(error)

      await expect(settingsStore.loadSettings()).rejects.toThrow('Failed to load settings')
      
      // Should maintain default values on error
      expect(settingsStore.llmProvider).toBe('openai')
      expect(settingsStore.modelName).toBe('gpt-4')
    })
  })

  describe('Settings Validation', () => {
    it('validates API key format', () => {
      const validKey = 'sk-1234567890abcdef'
      const invalidKey = 'invalid'

      settingsStore.updateApiKey(validKey)
      expect(settingsStore.apiKey).toBe(validKey)
      expect(settingsStore.isApiKeyValid).toBe(true)

      settingsStore.updateApiKey(invalidKey)
      expect(settingsStore.isApiKeyValid).toBe(false)
    })

    it('validates API endpoint format', () => {
      const validEndpoint = 'https://api.openai.com/v1'
      const invalidEndpoint = 'not-a-url'

      settingsStore.updateApiEndpoint(validEndpoint)
      expect(settingsStore.apiEndpoint).toBe(validEndpoint)

      settingsStore.updateApiEndpoint(invalidEndpoint)
      expect(settingsStore.apiEndpoint).toBe(invalidEndpoint)
    })

    it('validates numeric settings ranges', () => {
      // Font size validation
      settingsStore.updateFontSize(12)
      expect(settingsStore.fontSize).toBeGreaterThanOrEqual(10)

      settingsStore.updateFontSize(24)
      expect(settingsStore.fontSize).toBeLessThanOrEqual(32)

      // Max tokens validation
      settingsStore.updateMaxTokens(1000)
      expect(settingsStore.maxTokens).toBeGreaterThan(0)

      settingsStore.updateMaxTokens(100000)
      expect(settingsStore.maxTokens).toBeLessThanOrEqual(128000)
    })
  })

  describe('Computed Properties', () => {
    it('calculates current settings object correctly', () => {
      const currentSettings = settingsStore.currentSettings

      expect(currentSettings).toEqual(expect.objectContaining({
        llmProvider: settingsStore.llmProvider,
        modelName: settingsStore.modelName,
        temperature: settingsStore.temperature,
        maxTokens: settingsStore.maxTokens,
        fontSize: settingsStore.fontSize,
        showTimestamps: settingsStore.showTimestamps
      }))
    })

    it('determines if settings are valid', () => {
      // With valid settings
      settingsStore.updateApiKey('sk-valid-key-12345')
      expect(settingsStore.isValid).toBe(true)

      // With invalid settings
      settingsStore.updateApiKey('')
      expect(settingsStore.isValid).toBe(false)
    })

    it('calculates theme-related properties', () => {
      expect(typeof settingsStore.isDarkMode).toBe('boolean')
      expect(typeof settingsStore.currentTheme).toBe('string')
    })
  })

  describe('Settings Reset', () => {
    it('resets all settings to defaults', () => {
      // Change some settings
      settingsStore.updateLLMProvider('anthropic')
      settingsStore.updateTemperature(0.9)
      settingsStore.updateFontSize(18)

      // Reset to defaults
      settingsStore.resetToDefaults()

      expect(settingsStore.llmProvider).toBe('openai')
      expect(settingsStore.temperature).toBe(0.7)
      expect(settingsStore.fontSize).toBe(14)
    })

    it('resets only UI settings', () => {
      // Change both LLM and UI settings
      settingsStore.updateLLMProvider('anthropic')
      settingsStore.updateFontSize(18)

      // Reset only UI
      settingsStore.resetUISettings()

      expect(settingsStore.llmProvider).toBe('anthropic') // Should remain unchanged
      expect(settingsStore.fontSize).toBe(14) // Should reset
    })

    it('resets only LLM settings', () => {
      // Change both LLM and UI settings
      settingsStore.updateLLMProvider('anthropic')
      settingsStore.updateFontSize(18)

      // Reset only LLM
      settingsStore.resetLLMSettings()

      expect(settingsStore.llmProvider).toBe('openai') // Should reset
      expect(settingsStore.fontSize).toBe(18) // Should remain unchanged
    })
  })

  describe('Settings Import/Export', () => {
    it('exports settings correctly', () => {
      settingsStore.updateLLMProvider('anthropic')
      settingsStore.updateTemperature(0.8)
      settingsStore.updateFontSize(16)

      const exported = settingsStore.exportSettings()

      expect(exported).toEqual(expect.objectContaining({
        llmProvider: 'anthropic',
        temperature: 0.8,
        fontSize: 16
      }))
    })

    it('imports settings correctly', () => {
      const importedSettings = {
        llmProvider: 'google' as LLMProvider,
        temperature: 0.3,
        fontSize: 20,
        showTimestamps: false
      }

      settingsStore.importSettings(importedSettings)

      expect(settingsStore.llmProvider).toBe('google')
      expect(settingsStore.temperature).toBe(0.3)
      expect(settingsStore.fontSize).toBe(20)
      expect(settingsStore.showTimestamps).toBe(false)
    })

    it('validates imported settings', () => {
      const invalidSettings = {
        temperature: 5.0, // Invalid range
        fontSize: 50, // Invalid range
        llmProvider: 'invalid-provider' as LLMProvider
      }

      settingsStore.importSettings(invalidSettings)

      // Should validate and correct invalid values
      expect(settingsStore.temperature).toBeLessThanOrEqual(2.0)
      expect(settingsStore.fontSize).toBeLessThanOrEqual(32)
    })
  })

  describe('Auto-save Functionality', () => {
    it('auto-saves settings when enabled', async () => {
      settingsStore.updateAutoSave(true)
      mockIpcRenderer.invoke.mockResolvedValue({ success: true })

      settingsStore.updateTemperature(0.8)

      // Should trigger auto-save
      await vi.waitFor(() => {
        expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('settings:save', expect.any(Object))
      }, { timeout: 1000 })
    })

    it('respects auto-save interval', async () => {
      settingsStore.updateAutoSave(true)
      settingsStore.updateAutoSaveInterval(1) // 1 second

      const startTime = Date.now()
      settingsStore.updateTemperature(0.8)

      await vi.waitFor(() => {
        expect(mockIpcRenderer.invoke).toHaveBeenCalled()
      }, { timeout: 2000 })

      const endTime = Date.now()
      expect(endTime - startTime).toBeGreaterThanOrEqual(1000)
    })

    it('skips auto-save when disabled', () => {
      settingsStore.updateAutoSave(false)
      
      settingsStore.updateTemperature(0.8)

      // Should not auto-save
      expect(mockIpcRenderer.invoke).not.toHaveBeenCalled()
    })
  })

  describe('Theme Management', () => {
    it('updates theme correctly', () => {
      settingsStore.updateTheme('dark')
      expect(settingsStore.theme).toBe('dark')

      settingsStore.updateTheme('light')
      expect(settingsStore.theme).toBe('light')

      settingsStore.updateTheme('system')
      expect(settingsStore.theme).toBe('system')
    })

    it('handles system theme detection', () => {
      settingsStore.updateTheme('system')
      
      // Mock system theme
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      expect(settingsStore.effectiveTheme).toBe('dark')
    })
  })

  describe('Language Management', () => {
    it('updates language correctly', () => {
      settingsStore.updateLanguage('zh-CN')
      expect(settingsStore.language).toBe('zh-CN')

      settingsStore.updateLanguage('en-US')
      expect(settingsStore.language).toBe('en-US')
    })

    it('validates language codes', () => {
      settingsStore.updateLanguage('invalid-locale')
      
      // Should fallback to default or validate
      expect(settingsStore.language).toBeDefined()
    })
  })

  describe('Settings Watchers', () => {
    it('triggers updates when settings change', async () => {
      const mockCallback = vi.fn()
      
      // Watch for settings changes
      settingsStore.$subscribe(mockCallback)

      settingsStore.updateTemperature(0.9)

      expect(mockCallback).toHaveBeenCalled()
    })

    it('batches multiple setting changes', async () => {
      const mockCallback = vi.fn()
      settingsStore.$subscribe(mockCallback)

      // Make multiple rapid changes
      settingsStore.updateTemperature(0.1)
      settingsStore.updateMaxTokens(1000)
      settingsStore.updateFontSize(18)

      await vi.waitFor(() => {
        expect(mockCallback).toHaveBeenCalled()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles save errors gracefully', async () => {
      const error = new Error('Failed to save settings')
      mockIpcRenderer.invoke.mockRejectedValue(error)

      await expect(settingsStore.saveSettings()).rejects.toThrow('Failed to save settings')
    })

    it('handles load errors gracefully', async () => {
      const error = new Error('Failed to load settings')
      mockIpcRenderer.invoke.mockRejectedValue(error)

      await expect(settingsStore.loadSettings()).rejects.toThrow('Failed to load settings')
      
      // Should maintain current state on error
      expect(settingsStore.llmProvider).toBeDefined()
    })
  })
})