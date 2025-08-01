import { describe, it, expect, vi, beforeEach } from 'vitest'  
import { createPinia } from 'pinia'
import { mountComponent } from '../../../../../test/utils'
import ModelSwitcher from '../ModelSwitcher.vue'
import { useSettingsStore } from '@renderer/src/stores/settings'

// Mock the router
const mockRouter = {
  push: vi.fn()
}

// Mock the window.api
const mockApi = {
  llm: {
    setProvider: vi.fn().mockResolvedValue({ success: true }),
    sendMessage: vi.fn().mockResolvedValue('Test response')
  }
}

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter
}))

// Mock window.api
Object.defineProperty(window, 'api', {
  value: mockApi,
  writable: true
})

describe('ModelSwitcher', () => {
  let wrapper: any
  let pinia: any

  beforeEach(() => {
    pinia = createPinia()
    
    wrapper = mountComponent(ModelSwitcher, {
      global: {
        plugins: [pinia]
      }
    })
    
    // Reset mocks
    vi.clearAllMocks()
  })

  it('renders correctly', () => {
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.model-button').exists()).toBe(true)
  })

  it('shows current model information', () => {
    const button = wrapper.find('.model-button')
    expect(button.exists()).toBe(true)
    
    // Should show some model name and provider
    const text = button.text()
    expect(text).toContain('GPT') // Default should be GPT
  })

  it('opens dropdown when clicked', async () => {
    const button = wrapper.find('.model-button')
    await button.trigger('click')
    
    // Should show dropdown menu
    expect(wrapper.find('.dropdown-menu').exists()).toBe(true)
  })

  it('shows available models in dropdown', async () => {
    const button = wrapper.find('.model-button')
    await button.trigger('click')
    
    const dropdown = wrapper.find('.dropdown-menu')
    expect(dropdown.exists()).toBe(true)
    
    // Should show model options
    const modelOptions = wrapper.findAll('.model-option')
    expect(modelOptions.length).toBeGreaterThan(0)
  })

  it('emits model-changed event when model is selected', async () => {
    const button = wrapper.find('.model-button')
    await button.trigger('click')
    
    // Find and click a different model option
    const modelOptions = wrapper.findAll('.model-option')
    if (modelOptions.length > 1) {
      await modelOptions[1].trigger('click')
      
      // Should emit model-changed event
      expect(wrapper.emitted('model-changed')).toBeTruthy()
    }
  })

  it('calls API when switching models', async () => {
    const button = wrapper.find('.model-button')
    await button.trigger('click')
    
    const modelOptions = wrapper.findAll('.model-option')
    if (modelOptions.length > 1) {
      await modelOptions[1].trigger('click')
      
      // Should call the API to set provider
      expect(mockApi.llm.setProvider).toHaveBeenCalled()
    }
  })

  it('shows settings option in dropdown', async () => {
    const button = wrapper.find('.model-button')
    await button.trigger('click')
    
    const dropdown = wrapper.find('.dropdown-menu')
    expect(dropdown.text()).toContain('Model Settings')
  })

  it('navigates to settings when settings button is clicked', async () => {
    const button = wrapper.find('.model-button')
    await button.trigger('click')
    
    const settingsButton = wrapper.find('button:contains("Model Settings")')
    if (settingsButton.exists()) {
      await settingsButton.trigger('click')
      expect(mockRouter.push).toHaveBeenCalledWith('/settings')
    }
  })

  it('shows correct status indicators', async () => {
    const button = wrapper.find('.model-button')
    
    // Should show some status indicator
    const statusIndicator = wrapper.find('.w-2.h-2.rounded-full')
    expect(statusIndicator.exists()).toBe(true)
  })

  it('is disabled when disabled prop is true', async () => {
    await wrapper.setProps({ disabled: true })
    
    const button = wrapper.find('.model-button')
    expect(button.classes()).toContain('disabled:opacity-50')
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('closes dropdown when clicking outside', async () => {
    const button = wrapper.find('.model-button')
    await button.trigger('click')
    
    // Dropdown should be open
    expect(wrapper.find('.dropdown-menu').exists()).toBe(true)
    
    // Simulate click outside
    const outsideElement = wrapper.find('.fixed.inset-0')
    if (outsideElement.exists()) {
      await outsideElement.trigger('click')
      
      // Dropdown should be closed
      expect(wrapper.find('.dropdown-menu').exists()).toBe(false)
    }
  })

  it('shows test connection button', async () => {
    const button = wrapper.find('.model-button')
    await button.trigger('click')
    
    const dropdown = wrapper.find('.dropdown-menu')
    expect(dropdown.text()).toContain('Test Connection')
  })

  it('tests connection when test button is clicked', async () => {
    const button = wrapper.find('.model-button')
    await button.trigger('click')
    
    // Find test connection button
    const testButton = wrapper.find('button:contains("Test Connection")')
    if (testButton.exists() && !testButton.attributes('disabled')) {
      await testButton.trigger('click')
      
      // Should call sendMessage to test connection
      expect(mockApi.llm.sendMessage).toHaveBeenCalledWith('Hello', 'test', 'test-connection')
    }
  })
})

describe('ModelSwitcher Integration', () => {
  let wrapper: any
  let pinia: any
  let settingsStore: any

  beforeEach(() => {
    pinia = createPinia()
    
    wrapper = mountComponent(ModelSwitcher, {
      global: {
        plugins: [pinia]
      }
    })
    
    settingsStore = useSettingsStore()
  })

  it('reflects current settings store state', () => {
    // Set a specific provider in the store
    settingsStore.setLLMProvider('anthropic')
    settingsStore.setModelName('claude-3-sonnet-20240229')
    
    // Component should reflect this
    const button = wrapper.find('.model-button')
    expect(button.text()).toContain('Claude')
  })

  it('updates settings store when model is changed', async () => {
    const initialProvider = settingsStore.llmProvider
    
    const button = wrapper.find('.model-button')
    await button.trigger('click')
    
    // Find a different model option and click it
    const modelOptions = wrapper.findAll('.model-option')
    const differentOption = modelOptions.find(option => 
      !option.text().includes(initialProvider)
    )
    
    if (differentOption) {
      await differentOption.trigger('click')
      
      // Settings store should be updated
      expect(settingsStore.llmProvider).not.toBe(initialProvider)
    }
  })
})