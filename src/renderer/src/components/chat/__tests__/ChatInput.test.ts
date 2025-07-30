import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
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
      const wrapper = mount(ChatInput, {
        props: defaultProps
      })

      expect(wrapper.find('textarea').exists()).toBe(true)
      expect(wrapper.find('[data-testid="send-button"]').exists()).toBe(true)
    })

    it('shows configuration prompt when not configured', () => {
      const wrapper = mount(ChatInput, {
        props: {
          ...defaultProps,
          isConfigured: false
        }
      })

      expect(wrapper.find('.config-prompt').exists()).toBe(true)
      expect(wrapper.text()).toContain('Configure your LLM')
    })

    it('disables input when disabled prop is true', () => {
      const wrapper = mount(ChatInput, {
        props: {
          ...defaultProps,
          disabled: true
        }
      })

      const textarea = wrapper.find('textarea')
      expect(textarea.attributes('disabled')).toBeDefined()
    })

    it('shows loading state when isLoading is true', () => {
      const wrapper = mount(ChatInput, {
        props: {
          ...defaultProps,
          isLoading: true
        }
      })

      expect(wrapper.find('.loading-indicator').exists()).toBe(true)
    })

    it('auto-focuses input when autoFocus is true', async () => {
      const wrapper = mount(ChatInput, {
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
      const wrapper = mount(ChatInput, {
        props: defaultProps
      })

      const textarea = wrapper.find('textarea')
      await textarea.setValue('Hello world')

      expect(textarea.element.value).toBe('Hello world')
    })

    it('sends message on Enter key', async () => {
      const wrapper = mount(ChatInput, {
        props: defaultProps
      })

      const textarea = wrapper.find('textarea')
      await textarea.setValue('Test message')
      await textarea.trigger('keydown', { key: 'Enter' })

      expect(wrapper.emitted('send')).toHaveLength(1)
      expect(wrapper.emitted('send')?.[0]).toEqual(['Test message', []])
    })

    it('does not send message on Shift+Enter', async () => {
      const wrapper = mount(ChatInput, {
        props: defaultProps
      })

      const textarea = wrapper.find('textarea')
      await textarea.setValue('Test message')
      await textarea.trigger('keydown', { key: 'Enter', shiftKey: true })

      expect(wrapper.emitted('send')).toBeUndefined()
    })

    it('sends message on send button click', async () => {
      const wrapper = mount(ChatInput, {
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
      const wrapper = mount(ChatInput, {
        props: defaultProps
      })

      const textarea = wrapper.find('textarea')
      await textarea.setValue('Test message')
      await textarea.trigger('keydown', { key: 'Enter' })

      expect(textarea.element.value).toBe('')
    })

    it('does not send empty messages', async () => {
      const wrapper = mount(ChatInput, {
        props: defaultProps
      })

      const textarea = wrapper.find('textarea')
      await textarea.setValue('')
      await textarea.trigger('keydown', { key: 'Enter' })

      expect(wrapper.emitted('send')).toBeUndefined()
    })

    it('trims whitespace from messages', async () => {
      const wrapper = mount(ChatInput, {
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
      const wrapper = mount(ChatInput, {
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
      const wrapper = mount(ChatInput, {
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
      const wrapper = mount(ChatInput, {
        props: defaultProps
      })

      expect(wrapper.find('[data-testid="attach-button"]').exists()).toBe(true)
    })

    it('opens file picker when attachment button is clicked', async () => {
      const wrapper = mount(ChatInput, {
        props: defaultProps
      })

      const attachButton = wrapper.find('[data-testid="attach-button"]')
      const fileInput = wrapper.find('input[type="file"]')
      
      const clickSpy = vi.spyOn(fileInput.element, 'click').mockImplementation(() => {})
      
      await attachButton.trigger('click')
      expect(clickSpy).toHaveBeenCalled()
    })

    it('handles file selection', async () => {
      const wrapper = mount(ChatInput, {
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
      const wrapper = mount(ChatInput, {
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
      const wrapper = mount(ChatInput, {
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
      const wrapper = mount(ChatInput, {
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
      const wrapper = mount(ChatInput, {
        props: defaultProps
      })

      expect(wrapper.find('[data-testid="voice-button"]').exists()).toBe(true)
    })

    it('toggles voice input on button click', async () => {
      const wrapper = mount(ChatInput, {
        props: defaultProps
      })

      const voiceButton = wrapper.find('[data-testid="voice-button"]')
      await voiceButton.trigger('click')

      expect(wrapper.emitted('voice-toggle')).toHaveLength(1)
      expect(wrapper.emitted('voice-toggle')?.[0]).toEqual([true])
    })

    it('shows different icon when voice is active', async () => {
      const wrapper = mount(ChatInput, {
        props: defaultProps
      })

      wrapper.vm.isVoiceActive = true
      await nextTick()

      expect(wrapper.find('[data-testid="mic-off-icon"]').exists()).toBe(true)
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('handles Ctrl+Enter for send', async () => {
      const wrapper = mount(ChatInput, {
        props: defaultProps
      })

      const textarea = wrapper.find('textarea')
      await textarea.setValue('Test message')
      await textarea.trigger('keydown', { key: 'Enter', ctrlKey: true })

      expect(wrapper.emitted('send')).toHaveLength(1)
    })

    it('handles Cmd+Enter for send on Mac', async () => {
      const wrapper = mount(ChatInput, {
        props: defaultProps
      })

      const textarea = wrapper.find('textarea')
      await textarea.setValue('Test message')
      await textarea.trigger('keydown', { key: 'Enter', metaKey: true })

      expect(wrapper.emitted('send')).toHaveLength(1)
    })

    it('handles Escape to clear input', async () => {
      const wrapper = mount(ChatInput, {
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
      const wrapper = mount(ChatInput, {
        props: defaultProps
      })

      const longMessage = 'a'.repeat(4500) // Close to 5000 limit
      const textarea = wrapper.find('textarea')
      await textarea.setValue(longMessage)

      expect(wrapper.find('.char-counter').exists()).toBe(true)
      expect(wrapper.text()).toContain('4500')
    })

    it('shows warning when approaching limit', async () => {
      const wrapper = mount(ChatInput, {
        props: defaultProps
      })

      const veryLongMessage = 'a'.repeat(4800)
      const textarea = wrapper.find('textarea')
      await textarea.setValue(veryLongMessage)

      const counter = wrapper.find('.char-counter')
      expect(counter.classes()).toContain('warning')
    })

    it('prevents sending when over limit', async () => {
      const wrapper = mount(ChatInput, {
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
      const wrapper = mount(ChatInput, {
        props: defaultProps
      })

      expect(wrapper.find('[aria-label="Type your message"]').exists()).toBe(true)
      expect(wrapper.find('[aria-label="Send message"]').exists()).toBe(true)
      expect(wrapper.find('[aria-label="Attach file"]').exists()).toBe(true)
    })

    it('shows placeholder text', () => {
      const wrapper = mount(ChatInput, {
        props: defaultProps
      })

      const textarea = wrapper.find('textarea')
      expect(textarea.attributes('placeholder')).toContain('Type your message')
    })

    it('supports keyboard navigation', async () => {
      const wrapper = mount(ChatInput, {
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
      const wrapper = mount(ChatInput, {
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
      const wrapper = mount(ChatInput, {
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
      const wrapper = mount(ChatInput, {
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
})