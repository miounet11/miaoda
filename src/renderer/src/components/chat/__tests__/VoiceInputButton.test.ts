import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import VoiceInputButton from '../VoiceInputButton.vue'
import { voiceService } from '@renderer/src/services/voice/VoiceService'

// Mock the voice service
vi.mock('@renderer/src/services/voice/VoiceService', () => ({
  voiceService: {
    getCapabilities: vi.fn(),
    hasMicrophonePermission: vi.fn(),
    isRecognitionSupported: vi.fn(),
    startRecognition: vi.fn(),
    stopRecognition: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    destroy: vi.fn()
  }
}))

// Mock navigator.mediaDevices
const mockGetUserMedia = vi.fn()
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia
  },
  writable: true
})

describe('VoiceInputButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock implementations
    vi.mocked(voiceService.getCapabilities).mockReturnValue({
      speechRecognition: true,
      speechSynthesis: true,
      mediaDevices: true,
      permissions: true
    })
    vi.mocked(voiceService.hasMicrophonePermission).mockReturnValue(true)
    vi.mocked(voiceService.isRecognitionSupported).mockReturnValue(true)
    vi.mocked(voiceService.startRecognition).mockResolvedValue(true)
    vi.mocked(voiceService.stopRecognition).mockReturnValue(true)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders correctly with default props', () => {
    const wrapper = mount(VoiceInputButton)
    
    expect(wrapper.find('.voice-input-btn').exists()).toBe(true)
    expect(wrapper.find('.voice-input-btn--md').exists()).toBe(true)
    expect(wrapper.find('.voice-input-btn--default').exists()).toBe(true)
  })

  it('applies size classes correctly', () => {
    const wrapper = mount(VoiceInputButton, {
      props: { size: 'lg' }
    })
    
    expect(wrapper.find('.voice-input-btn--lg').exists()).toBe(true)
  })

  it('applies variant classes correctly', () => {
    const wrapper = mount(VoiceInputButton, {
      props: { variant: 'ghost' }
    })
    
    expect(wrapper.find('.voice-input-btn--ghost').exists()).toBe(true)
  })

  it('shows disabled state when not supported', async () => {
    vi.mocked(voiceService.getCapabilities).mockReturnValue({
      speechRecognition: false,
      speechSynthesis: true,
      mediaDevices: true,
      permissions: true
    })

    const wrapper = mount(VoiceInputButton)
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('.voice-input-btn--disabled').exists()).toBe(true)
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('shows permission indicator when permission is required', async () => {
    vi.mocked(voiceService.hasMicrophonePermission).mockReturnValue(false)

    const wrapper = mount(VoiceInputButton, {
      props: { showPermissionIndicator: true }
    })
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('.permission-indicator').exists()).toBe(true)
    expect(wrapper.find('.voice-input-btn--no-permission').exists()).toBe(true)
  })

  it('starts recording when clicked', async () => {
    const wrapper = mount(VoiceInputButton)
    await wrapper.vm.$nextTick()
    
    await wrapper.find('button').trigger('click')
    
    expect(voiceService.startRecognition).toHaveBeenCalledWith({
      language: 'zh-CN',
      continuous: true,
      interimResults: true,
      maxAlternatives: 3
    })
  })

  it('emits recording-start event when recording starts', async () => {
    const wrapper = mount(VoiceInputButton)
    await wrapper.vm.$nextTick()
    
    // Click to start recording
    await wrapper.find('button').trigger('click')
    
    expect(wrapper.emitted('recording-start')).toBeTruthy()
  })

  it('emits recording-stop event when recording stops', async () => {
    const wrapper = mount(VoiceInputButton)
    await wrapper.vm.$nextTick()
    
    // Start recording first
    await wrapper.find('button').trigger('click')
    
    // Simulate recording state by triggering the voice service event
    const onStartCallback = vi.mocked(voiceService.on).mock.calls.find(
      call => call[0] === 'recognition-start'
    )?.[1]
    onStartCallback?.()
    
    // Click again to stop
    await wrapper.find('button').trigger('click')
    
    expect(wrapper.emitted('recording-stop')).toBeTruthy()
  })

  it('emits error event when voice service errors occur', async () => {
    const wrapper = mount(VoiceInputButton)
    await wrapper.vm.$nextTick()
    
    const errorMessage = 'Test error'
    const error = new Error(errorMessage)
    
    // Simulate voice service error event
    const onCallback = vi.mocked(voiceService.on).mock.calls.find(
      call => call[0] === 'recognition-error'
    )?.[1]
    
    expect(onCallback).toBeDefined()
    onCallback?.(error)
    
    expect(wrapper.emitted('error')).toBeTruthy()
    expect(wrapper.emitted('error')?.[0]).toEqual([errorMessage])
  })

  it('requests permission when no permission and clicked', async () => {
    vi.mocked(voiceService.hasMicrophonePermission).mockReturnValue(false)
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }]
    } as any)

    const wrapper = mount(VoiceInputButton)
    await wrapper.vm.$nextTick()
    
    await wrapper.find('button').trigger('click')
    
    expect(wrapper.emitted('permission-required')).toBeTruthy()
    expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true })
  })

  it('handles permission denial correctly', async () => {
    vi.mocked(voiceService.hasMicrophonePermission).mockReturnValue(false)
    mockGetUserMedia.mockRejectedValue(new Error('Permission denied'))

    const wrapper = mount(VoiceInputButton)
    await wrapper.vm.$nextTick()
    
    await wrapper.find('button').trigger('click')
    await wrapper.vm.$nextTick()
    
    expect(wrapper.emitted('error')).toBeTruthy()
    expect(wrapper.emitted('error')?.[0]).toEqual(['Microphone permission denied'])
  })

  it('stops recording when clicked while recording', async () => {
    const wrapper = mount(VoiceInputButton)
    await wrapper.vm.$nextTick()
    
    // Simulate recording state
    const startCallback = vi.mocked(voiceService.on).mock.calls.find(
      call => call[0] === 'recognition-start'
    )?.[1]
    startCallback?.()
    
    await wrapper.vm.$nextTick()
    
    // Click to stop
    await wrapper.find('button').trigger('click')
    
    expect(voiceService.stopRecognition).toHaveBeenCalled()
  })

  it('shows correct button title based on state', async () => {
    // Not supported case
    vi.mocked(voiceService.getCapabilities).mockReturnValue({
      speechRecognition: false,
      speechSynthesis: true,
      mediaDevices: true,
      permissions: true
    })
    
    const wrapper = mount(VoiceInputButton)
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('button').attributes('title')).toBe('Voice input not supported in this browser')
  })

  it('cleans up event listeners on unmount', () => {
    const wrapper = mount(VoiceInputButton)
    wrapper.unmount()
    
    expect(voiceService.off).toHaveBeenCalledWith('recognition-start', expect.any(Function))
    expect(voiceService.off).toHaveBeenCalledWith('recognition-end', expect.any(Function))
    expect(voiceService.off).toHaveBeenCalledWith('recognition-error', expect.any(Function))
  })

  it('exposes methods correctly', () => {
    const wrapper = mount(VoiceInputButton)
    
    expect(wrapper.vm.startRecording).toBeDefined()
    expect(wrapper.vm.stopRecording).toBeDefined()
    expect(wrapper.vm.isRecording).toBeDefined()
    expect(wrapper.vm.isSupported).toBeDefined()
    expect(wrapper.vm.hasPermission).toBeDefined()
  })

  it('accepts auto-start prop', () => {
    const wrapper = mount(VoiceInputButton, {
      props: { autoStart: true }
    })
    
    expect(wrapper.props('autoStart')).toBe(true)
  })
})