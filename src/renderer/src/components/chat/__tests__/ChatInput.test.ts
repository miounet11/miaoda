import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { mountComponent } from '../../../../../test/utils'
import ChatInput from '../ChatInput.vue'
import type { Attachment } from '@renderer/src/types'

// Mock components
vi.mock('../AttachmentsPreview.vue', () => ({
  default: {
    name: 'AttachmentsPreview',
    template: '<div class="attachments-preview"><slot /></div>',
    props: ['attachments'],
    emits: ['remove']
  }
}))

vi.mock('../VoiceInputButton.vue', () => ({
  default: {
    name: 'VoiceInputButton',
    template: '<button class="voice-input-btn" @click="$emit(\'recording-start\')" />',
    props: ['disabled', 'size', 'variant'],
    emits: ['recording-start', 'recording-stop', 'permission-required', 'error'],
    methods: {
      startRecording: vi.fn(),
      stopRecording: vi.fn(),
      isRecording: vi.fn(() => false),
      isSupported: vi.fn(() => true),
      hasPermission: vi.fn(() => true)
    }
  }
}))

vi.mock('@renderer/src/components/voice/VoiceRecorder.vue', () => ({
  default: {
    name: 'VoiceRecorder',
    template: '<div class="voice-recorder" />',
    props: ['showWaveform', 'continuous', 'autoStart'],
    emits: ['transcript', 'recording-stop', 'error']
  }
}))

// Mock composables
vi.mock('@/composables/useResponsive', () => ({
  useResponsive: () => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true
  })
}))

// Mock lucide icons
vi.mock('lucide-vue-next', () => ({
  Send: { template: '<div data-testid="send-icon" />' },
  Paperclip: { template: '<div data-testid="paperclip-icon" />' },
  Mic: { template: '<div data-testid="mic-icon" />' },
  MicOff: { template: '<div data-testid="mic-off-icon" />' },
  Settings: { template: '<div data-testid="settings-icon" />' },
  Smile: { template: '<div data-testid="smile-icon" />' },
  Plus: { template: '<div data-testid="plus-icon" />' }
}))

describe('ChatInput', () => {
  const defaultProps = {
    disabled: false,
    isConfigured: true,
    isLoading: false,
    autoFocus: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock file API
    global.File = vi.fn(() => ({ name: 'test.txt', size: 1000 })) as any
    global.FileReader = vi.fn(() => ({
      readAsDataURL: vi.fn(),
      result: 'data:text/plain;base64,dGVzdA==',
      onload: null
    })) as any
  })

  describe('Rendering', () => {
    it('renders input field correctly', () => {
      const wrapper = mountComponent(ChatInput, {
        props: defaultProps
      })

      expect(wrapper.find('textarea').exists()).toBe(true)
      expect(wrapper.find('.send-btn').exists()).toBe(true)
    })

    it('shows configuration prompt when not configured', () => {
      const wrapper = mountComponent(ChatInput, {
        props: {
          ...defaultProps,
          isConfigured: false
        }
      })

      expect(wrapper.find('.config-warning').exists()).toBe(true)
      expect(wrapper.text()).toContain('Please configure an LLM provider')
    })

    it('disables input when disabled prop is true', () => {
      const wrapper = mountComponent(ChatInput, {
        props: {
          ...defaultProps,
          disabled: true
        }
      })

      const textarea = wrapper.find('textarea')
      expect(textarea.attributes('disabled')).toBeDefined()
    })

    it('shows loading state when isLoading is true', () => {
      const wrapper = mountComponent(ChatInput, {
        props: {
          ...defaultProps,
          isLoading: true
        }
      })

      expect(wrapper.find('.loading-indicator').exists()).toBe(true)
    })

    it('auto-focuses input when autoFocus is true', async () => {
      const wrapper = mountComponent(ChatInput, {
        props: {
          ...defaultProps,
          autoFocus: true
        }
      })

      await nextTick()
      const textarea = wrapper.find('textarea')
      expect(document.activeElement).toBe(textarea.element)
    })
  })

  describe('Message Input', () => {
    it('updates message content on input', async () => {
      const wrapper = mountComponent(ChatInput, {
        props: defaultProps
      })

      const textarea = wrapper.find('textarea')
      await textarea.setValue('Hello world')

      expect(textarea.element.value).toBe('Hello world')
    })

    it('sends message on Enter key', async () => {
      const wrapper = mountComponent(ChatInput, {
        props: defaultProps
      })

      const textarea = wrapper.find('textarea')
      await textarea.setValue('Test message')
      await textarea.trigger('keydown', { key: 'Enter' })

      expect(wrapper.emitted('send')).toHaveLength(1)
      expect(wrapper.emitted('send')?.[0]).toEqual(['Test message', []])
    })

    it('does not send message on Shift+Enter', async () => {
      const wrapper = mountComponent(ChatInput, {
        props: defaultProps
      })

      const textarea = wrapper.find('textarea')
      await textarea.setValue('Test message')
      await textarea.trigger('keydown', { key: 'Enter', shiftKey: true })

      expect(wrapper.emitted('send')).toBeUndefined()
    })

    it('sends message on send button click', async () => {
      const wrapper = mountComponent(ChatInput, {
        props: defaultProps
      })

      const textarea = wrapper.find('textarea')
      await textarea.setValue('Test message')
      
      const sendButton = wrapper.find('[data-testid="send-button"]')
      await sendButton.trigger('click')

      expect(wrapper.emitted('send')).toHaveLength(1)
      expect(wrapper.emitted('send')?.[0]).toEqual(['Test message', []])
    })

    it('clears input after sending message', async () => {
      const wrapper = mountComponent(ChatInput, {
        props: defaultProps
      })

      const textarea = wrapper.find('textarea')
      await textarea.setValue('Test message')
      await textarea.trigger('keydown', { key: 'Enter' })

      expect(textarea.element.value).toBe('')
    })

    it('does not send empty messages', async () => {
      const wrapper = mountComponent(ChatInput, {
        props: defaultProps
      })

      const textarea = wrapper.find('textarea')
      await textarea.setValue('')
      await textarea.trigger('keydown', { key: 'Enter' })

      expect(wrapper.emitted('send')).toBeUndefined()
    })

    it('trims whitespace from messages', async () => {
      const wrapper = mountComponent(ChatInput, {
        props: defaultProps
      })

      const textarea = wrapper.find('textarea')
      await textarea.setValue('  Test message  ')
      await textarea.trigger('keydown', { key: 'Enter' })

      expect(wrapper.emitted('send')?.[0]).toEqual(['Test message', []])
    })
  })

  describe('Textarea Auto-resize', () => {
    it('auto-resizes textarea based on content', async () => {
      const wrapper = mountComponent(ChatInput, {
        props: defaultProps
      })

      const textarea = wrapper.find('textarea')
      const longText = 'This is a very long message that should cause the textarea to expand beyond its initial height to accommodate the content.'
      
      await textarea.setValue(longText)
      await nextTick()

      // Mock scrollHeight to simulate content overflow
      Object.defineProperty(textarea.element, 'scrollHeight', { value: 100 })
      
      await textarea.trigger('input')
      
      expect(parseInt(textarea.element.style.height)).toBeGreaterThan(50)
    })

    it('respects maximum height limit', async () => {
      const wrapper = mountComponent(ChatInput, {
        props: defaultProps
      })

      const textarea = wrapper.find('textarea')
      
      // Mock very large scroll height
      Object.defineProperty(textarea.element, 'scrollHeight', { value: 1000 })
      
      await textarea.trigger('input')
      
      expect(parseInt(textarea.element.style.height)).toBeLessThanOrEqual(200)
    })
  })

  describe('File Attachments', () => {
    it('shows attachment button', () => {
      const wrapper = mountComponent(ChatInput, {
        props: defaultProps
      })

      expect(wrapper.find('[data-testid="attach-button"]').exists()).toBe(true)
    })

    it('opens file picker when attachment button is clicked', async () => {
      const wrapper = mountComponent(ChatInput, {
        props: defaultProps
      })

      const attachButton = wrapper.find('[data-testid="attach-button"]')
      const fileInput = wrapper.find('input[type="file"]')
      
      const clickSpy = vi.spyOn(fileInput.element, 'click').mockImplementation(() => {})
      
      await attachButton.trigger('click')
      expect(clickSpy).toHaveBeenCalled()
    })

    it('handles file selection', async () => {
      const wrapper = mountComponent(ChatInput, {
        props: defaultProps
      })

      const fileInput = wrapper.find('input[type="file"]')
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
      
      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        result: 'data:text/plain;base64,dGVzdCBjb250ZW50',
        onload: null
      }
      
      global.FileReader = vi.fn(() => mockFileReader) as any
      
      const files = [file]
      Object.defineProperty(fileInput.element, 'files', { value: files })
      
      await fileInput.trigger('change')
      
      // Simulate FileReader onload
      mockFileReader.onload?.({} as any)
      
      await nextTick()
      
      expect(wrapper.vm.attachments).toHaveLength(1)
      expect(wrapper.vm.attachments[0]).toMatchObject({
        name: 'test.txt',
        type: 'text/plain',
        size: 12
      })
    })

    it('shows attachments preview when files are attached', async () => {
      const wrapper = mountComponent(ChatInput, {
        props: defaultProps
      })

      // Add mock attachment
      wrapper.vm.attachments = [{
        id: '1',
        name: 'test.txt',
        type: 'text/plain',
        size: 1000,
        data: 'data:text/plain;base64,dGVzdA=='
      }]

      await nextTick()

      expect(wrapper.findComponent({ name: 'AttachmentsPreview' }).exists()).toBe(true)
    })

    it('removes attachment when requested', async () => {
      const wrapper = mountComponent(ChatInput, {
        props: defaultProps
      })

      wrapper.vm.attachments = [{
        id: '1',
        name: 'test.txt',
        type: 'text/plain',
        size: 1000,
        data: 'data:text/plain;base64,dGVzdA=='
      }]

      await nextTick()

      const attachmentsPreview = wrapper.findComponent({ name: 'AttachmentsPreview' })
      await attachmentsPreview.vm.$emit('remove', '1')

      expect(wrapper.vm.attachments).toHaveLength(0)
    })

    it('includes attachments when sending message', async () => {
      const wrapper = mountComponent(ChatInput, {
        props: defaultProps
      })

      const attachment: Attachment = {
        id: '1',
        name: 'test.txt',
        type: 'text/plain',
        size: 1000,
        data: 'data:text/plain;base64,dGVzdA=='
      }

      wrapper.vm.attachments = [attachment]
      
      const textarea = wrapper.find('textarea')
      await textarea.setValue('Message with attachment')
      await textarea.trigger('keydown', { key: 'Enter' })

      expect(wrapper.emitted('send')?.[0]).toEqual(['Message with attachment', [attachment]])
    })
  })

  describe('Voice Input', () => {
    it('shows voice toggle button', () => {
      const wrapper = mountComponent(ChatInput, {
        props: defaultProps
      })

      expect(wrapper.find('[data-testid="voice-button"]').exists()).toBe(true)
    })

    it('toggles voice input on button click', async () => {
      const wrapper = mountComponent(ChatInput, {
        props: defaultProps
      })

      const voiceButton = wrapper.find('[data-testid="voice-button"]')
      await voiceButton.trigger('click')

      expect(wrapper.emitted('voice-toggle')).toHaveLength(1)
      expect(wrapper.emitted('voice-toggle')?.[0]).toEqual([true])
    })

    it('shows different icon when voice is active', async () => {
      const wrapper = mountComponent(ChatInput, {
        props: defaultProps
      })

      wrapper.vm.isVoiceActive = true
      await nextTick()

      expect(wrapper.find('[data-testid="mic-off-icon"]').exists()).toBe(true)
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('handles Ctrl+Enter for send', async () => {
      const wrapper = mountComponent(ChatInput, {
        props: defaultProps
      })

      const textarea = wrapper.find('textarea')
      await textarea.setValue('Test message')
      await textarea.trigger('keydown', { key: 'Enter', ctrlKey: true })

      expect(wrapper.emitted('send')).toHaveLength(1)
    })

    it('handles Cmd+Enter for send on Mac', async () => {
      const wrapper = mountComponent(ChatInput, {
        props: defaultProps
      })

      const textarea = wrapper.find('textarea')
      await textarea.setValue('Test message')
      await textarea.trigger('keydown', { key: 'Enter', metaKey: true })

      expect(wrapper.emitted('send')).toHaveLength(1)
    })

    it('handles Escape to clear input', async () => {
      const wrapper = mountComponent(ChatInput, {
        props: defaultProps
      })

      const textarea = wrapper.find('textarea')
      await textarea.setValue('Test message')
      await textarea.trigger('keydown', { key: 'Escape' })

      expect(textarea.element.value).toBe('')
    })
  })

  describe('Character Counter', () => {
    it('shows character counter near limit', async () => {
      const wrapper = mountComponent(ChatInput, {
        props: defaultProps
      })

      const longMessage = 'a'.repeat(4500) // Close to 5000 limit
      const textarea = wrapper.find('textarea')
      await textarea.setValue(longMessage)

      expect(wrapper.find('.char-counter').exists()).toBe(true)
      expect(wrapper.text()).toContain('4500')
    })

    it('shows warning when approaching limit', async () => {
      const wrapper = mountComponent(ChatInput, {
        props: defaultProps
      })

      const veryLongMessage = 'a'.repeat(4800)
      const textarea = wrapper.find('textarea')
      await textarea.setValue(veryLongMessage)

      const counter = wrapper.find('.char-counter')
      expect(counter.classes()).toContain('warning')
    })

    it('prevents sending when over limit', async () => {
      const wrapper = mountComponent(ChatInput, {
        props: defaultProps
      })

      const tooLongMessage = 'a'.repeat(5100)
      const textarea = wrapper.find('textarea')
      await textarea.setValue(tooLongMessage)
      await textarea.trigger('keydown', { key: 'Enter' })

      expect(wrapper.emitted('send')).toBeUndefined()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      const wrapper = mountComponent(ChatInput, {
        props: defaultProps
      })

      expect(wrapper.find('[aria-label="Type your message"]').exists()).toBe(true)
      expect(wrapper.find('[aria-label="Send message"]').exists()).toBe(true)
      expect(wrapper.find('[aria-label="Attach file"]').exists()).toBe(true)
    })

    it('shows placeholder text', () => {
      const wrapper = mountComponent(ChatInput, {
        props: defaultProps
      })

      const textarea = wrapper.find('textarea')
      expect(textarea.attributes('placeholder')).toContain('Type your message')
    })

    it('supports keyboard navigation', async () => {
      const wrapper = mountComponent(ChatInput, {
        props: defaultProps
      })

      const textarea = wrapper.find('textarea')
      await textarea.trigger('keydown', { key: 'Tab' })

      const sendButton = wrapper.find('[data-testid="send-button"]')
      expect(sendButton.attributes('tabindex')).toBe('0')
    })
  })

  describe('Edge Cases', () => {
    it('handles paste events correctly', async () => {
      const wrapper = mountComponent(ChatInput, {
        props: defaultProps
      })

      const textarea = wrapper.find('textarea')
      const pasteEvent = new ClipboardEvent('paste', {
        clipboardData: new DataTransfer()
      })
      
      pasteEvent.clipboardData?.setData('text/plain', 'Pasted text')
      
      await textarea.trigger('paste', pasteEvent)
      
      expect(textarea.element.value).toContain('Pasted text')
    })

    it('handles rapid typing without issues', async () => {
      const wrapper = mountComponent(ChatInput, {
        props: defaultProps
      })

      const textarea = wrapper.find('textarea')
      
      // Simulate rapid typing
      for (let i = 0; i < 100; i++) {
        await textarea.setValue(textarea.element.value + 'a')
      }

      expect(textarea.element.value.length).toBe(100)
    })

    it('maintains cursor position during auto-resize', async () => {
      const wrapper = mountComponent(ChatInput, {
        props: defaultProps
      })

      const textarea = wrapper.find('textarea')
      await textarea.setValue('Line 1\nLine 2\nLine 3')
      
      // Set cursor position
      textarea.element.selectionStart = 7 // After "Line 1\n"
      textarea.element.selectionEnd = 7
      
      await textarea.trigger('input')
      
      expect(textarea.element.selectionStart).toBe(7)
    })
  })

  describe('Voice Input Integration', () => {
    it('shows voice input button when showVoiceInput prop is true', () => {
      const wrapper = mountComponent(ChatInput, {
        props: { ...defaultProps, showVoiceInput: true }
      })

      expect(wrapper.find('.voice-input-btn').exists()).toBe(true)
    })

    it('does not show voice input button when showVoiceInput prop is false', () => {
      const wrapper = mountComponent(ChatInput, {
        props: { ...defaultProps, showVoiceInput: false }
      })

      expect(wrapper.find('.voice-input-btn').exists()).toBe(false)
    })

    it('handles voice recording start event', async () => {
      const wrapper = mountComponent(ChatInput, {
        props: { ...defaultProps, showVoiceInput: true }
      })

      const voiceButton = wrapper.findComponent({ name: 'VoiceInputButton' })
      await voiceButton.vm.$emit('recording-start')

      expect(wrapper.emitted('voice-toggle')?.[0]).toEqual([true])
    })

    it('handles voice recording stop event', async () => {
      const wrapper = mountComponent(ChatInput, {
        props: { ...defaultProps, showVoiceInput: true }
      })

      const voiceButton = wrapper.findComponent({ name: 'VoiceInputButton' })
      await voiceButton.vm.$emit('recording-stop')

      expect(wrapper.emitted('voice-toggle')?.[0]).toEqual([false])
    })

    it('handles voice permission required event', async () => {
      const wrapper = mountComponent(ChatInput, {
        props: { ...defaultProps, showVoiceInput: true }
      })

      const voiceButton = wrapper.findComponent({ name: 'VoiceInputButton' })
      await voiceButton.vm.$emit('permission-required')

      // Should not throw any errors
      expect(wrapper.exists()).toBe(true)
    })

    it('handles voice error event', async () => {
      const wrapper = mountComponent(ChatInput, {
        props: { ...defaultProps, showVoiceInput: true }
      })

      const voiceButton = wrapper.findComponent({ name: 'VoiceInputButton' })
      await voiceButton.vm.$emit('error', 'Test error')

      expect(wrapper.emitted('voice-error')?.[0]).toEqual(['Test error'])
    })

    it('shows voice interface when recording is active', async () => {
      const wrapper = mountComponent(ChatInput, {
        props: { ...defaultProps, showVoiceInput: true }
      })

      const voiceButton = wrapper.findComponent({ name: 'VoiceInputButton' })
      await voiceButton.vm.$emit('recording-start')

      expect(wrapper.find('.voice-interface').exists()).toBe(true)
      expect(wrapper.findComponent({ name: 'VoiceRecorder' }).exists()).toBe(true)
    })

    it('hides voice interface when recording stops', async () => {
      const wrapper = mountComponent(ChatInput, {
        props: { ...defaultProps, showVoiceInput: true }
      })

      const voiceButton = wrapper.findComponent({ name: 'VoiceInputButton' })
      
      // Start recording
      await voiceButton.vm.$emit('recording-start')
      expect(wrapper.find('.voice-interface').exists()).toBe(true)

      // Stop recording
      await voiceButton.vm.$emit('recording-stop')
      expect(wrapper.find('.voice-interface').exists()).toBe(false)
    })

    it('updates placeholder text when voice input is active', async () => {
      const wrapper = mountComponent(ChatInput, {
        props: { ...defaultProps, showVoiceInput: true }
      })

      const textarea = wrapper.find('textarea')
      const voiceButton = wrapper.findComponent({ name: 'VoiceInputButton' })

      // Start recording
      await voiceButton.vm.$emit('recording-start')
      await nextTick()

      expect(textarea.attributes('placeholder')).toBe('Speaking... Click mic to stop')
    })

    it('handles voice transcript events', async () => {
      const wrapper = mountComponent(ChatInput, {
        props: { ...defaultProps, showVoiceInput: true }
      })

      const voiceButton = wrapper.findComponent({ name: 'VoiceInputButton' })
      await voiceButton.vm.$emit('recording-start')

      const voiceRecorder = wrapper.findComponent({ name: 'VoiceRecorder' })
      await voiceRecorder.vm.$emit('transcript', 'Hello world', 0.9)

      expect(wrapper.emitted('voice-transcript')?.[0]).toEqual(['Hello world', 0.9])
    })

    it('adds transcript to input when confidence is high', async () => {
      const wrapper = mountComponent(ChatInput, {
        props: { ...defaultProps, showVoiceInput: true }
      })

      const voiceButton = wrapper.findComponent({ name: 'VoiceInputButton' })
      await voiceButton.vm.$emit('recording-start')

      const voiceRecorder = wrapper.findComponent({ name: 'VoiceRecorder' })
      await voiceRecorder.vm.$emit('transcript', 'Hello world', 0.9)

      const textarea = wrapper.find('textarea')
      expect(textarea.element.value).toBe('Hello world')
    })

    it('does not add transcript to input when confidence is low', async () => {
      const wrapper = mountComponent(ChatInput, {
        props: { ...defaultProps, showVoiceInput: true }
      })

      const voiceButton = wrapper.findComponent({ name: 'VoiceInputButton' })
      await voiceButton.vm.$emit('recording-start')

      const voiceRecorder = wrapper.findComponent({ name: 'VoiceRecorder' })
      await voiceRecorder.vm.$emit('transcript', 'Hello world', 0.5)

      const textarea = wrapper.find('textarea')
      expect(textarea.element.value).toBe('')
    })

    it('exposes toggleVoiceInput method', () => {
      const wrapper = mountComponent(ChatInput, {
        props: { ...defaultProps, showVoiceInput: true }
      })

      expect(wrapper.vm.toggleVoiceInput).toBeDefined()
      expect(typeof wrapper.vm.toggleVoiceInput).toBe('function')
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('toggles voice input with Ctrl+Shift+M', async () => {
      const wrapper = mountComponent(ChatInput, {
        props: { ...defaultProps, showVoiceInput: true }
      })

      // Mock the VoiceInputButton methods
      const voiceButton = wrapper.findComponent({ name: 'VoiceInputButton' })
      const startRecordingSpy = vi.spyOn(voiceButton.vm, 'startRecording')

      // Trigger keyboard shortcut
      await document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'M',
        ctrlKey: true,
        shiftKey: true
      }))

      expect(startRecordingSpy).toHaveBeenCalled()
    })

    it('stops voice recording with Escape key', async () => {
      const wrapper = mountComponent(ChatInput, {
        props: { ...defaultProps, showVoiceInput: true }
      })

      const voiceButton = wrapper.findComponent({ name: 'VoiceInputButton' })
      const stopRecordingSpy = vi.spyOn(voiceButton.vm, 'stopRecording')

      // Start recording first
      await voiceButton.vm.$emit('recording-start')

      // Trigger escape key
      await document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Escape'
      }))

      expect(stopRecordingSpy).toHaveBeenCalled()
    })

    it('shows keyboard shortcut hint when voice input is enabled', () => {
      const wrapper = mountComponent(ChatInput, {
        props: { ...defaultProps, showVoiceInput: true }
      })

      const hints = wrapper.find('.keyboard-hints')
      expect(hints.text()).toContain('Ctrl+Shift+M')
    })

    it('does not show voice shortcut hint when voice input is disabled', () => {
      const wrapper = mountComponent(ChatInput, {
        props: { ...defaultProps, showVoiceInput: false }
      })

      const hints = wrapper.find('.keyboard-hints')
      expect(hints.text()).not.toContain('Ctrl+Shift+M')
    })
  })
})