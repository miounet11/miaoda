import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import UnifiedMessageContent from '../UnifiedMessageContent.vue'

describe('UnifiedMessageContent', () => {
  const defaultProps = {
    content: 'Test message content'
  }

  describe('Rendering Modes', () => {
    it('should render markdown content by default', () => {
      const wrapper = mount(UnifiedMessageContent, {
        props: {
          ...defaultProps,
          content: '# Hello World\n\nThis is **bold** text.'
        }
      })
      
      const html = wrapper.html()
      expect(html).toContain('<h1>Hello World</h1>')
      expect(html).toContain('<strong>bold</strong>')
    })

    it('should render plain text when renderMode is text', () => {
      const wrapper = mount(UnifiedMessageContent, {
        props: {
          ...defaultProps,
          renderMode: 'text'
        }
      })
      
      expect(wrapper.text()).toContain('Test message content')
      expect(wrapper.html()).not.toContain('<p>')
    })

    it('should render HTML when renderMode is html', () => {
      const wrapper = mount(UnifiedMessageContent, {
        props: {
          content: '<div class="custom">Custom HTML</div>',
          renderMode: 'html'
        }
      })
      
      expect(wrapper.html()).toContain('Custom HTML')
    })
  })

  describe('Loading State', () => {
    it('should show loading indicator when isLoading is true', () => {
      const wrapper = mount(UnifiedMessageContent, {
        props: {
          ...defaultProps,
          isLoading: true
        }
      })
      
      expect(wrapper.find('.typing-indicator').exists()).toBe(true)
    })

    it('should show loading text if provided', () => {
      const wrapper = mount(UnifiedMessageContent, {
        props: {
          ...defaultProps,
          isLoading: true,
          loadingText: 'Processing...'
        }
      })
      
      expect(wrapper.text()).toContain('Processing...')
    })
  })

  describe('Attachments', () => {
    it('should render image attachments', () => {
      const wrapper = mount(UnifiedMessageContent, {
        props: {
          ...defaultProps,
          attachments: [
            {
              url: 'test.jpg',
              name: 'Test Image',
              type: 'image'
            }
          ]
        }
      })
      
      const img = wrapper.find('img')
      expect(img.exists()).toBe(true)
      expect(img.attributes('src')).toBe('test.jpg')
      expect(img.attributes('alt')).toBe('Test Image')
    })

    it('should render file attachments', () => {
      const wrapper = mount(UnifiedMessageContent, {
        props: {
          ...defaultProps,
          attachments: [
            {
              url: 'document.pdf',
              name: 'Document.pdf',
              type: 'file'
            }
          ]
        }
      })
      
      expect(wrapper.find('.file-attachment').exists()).toBe(true)
      expect(wrapper.text()).toContain('Document.pdf')
    })

    it('should hide attachments when showAttachments is false', () => {
      const wrapper = mount(UnifiedMessageContent, {
        props: {
          ...defaultProps,
          showAttachments: false,
          attachments: [
            {
              url: 'test.jpg',
              name: 'Test Image',
              type: 'image'
            }
          ]
        }
      })
      
      expect(wrapper.find('img').exists()).toBe(false)
    })
  })

  describe('Variants', () => {
    it('should apply simple variant class', () => {
      const wrapper = mount(UnifiedMessageContent, {
        props: {
          ...defaultProps,
          variant: 'simple'
        }
      })
      
      expect(wrapper.find('.message-content-simple').exists()).toBe(true)
    })

    it('should apply enhanced variant class', () => {
      const wrapper = mount(UnifiedMessageContent, {
        props: {
          ...defaultProps,
          variant: 'enhanced'
        }
      })
      
      expect(wrapper.find('.message-content-enhanced').exists()).toBe(true)
    })

    it('should apply enhanced class when enhanced prop is true', () => {
      const wrapper = mount(UnifiedMessageContent, {
        props: {
          ...defaultProps,
          enhanced: true
        }
      })
      
      expect(wrapper.find('.message-content-enhanced').exists()).toBe(true)
    })
  })

  describe('Thumbnail', () => {
    it('should show thumbnail when withThumbnail is true', () => {
      const wrapper = mount(UnifiedMessageContent, {
        props: {
          ...defaultProps,
          withThumbnail: true,
          thumbnail: 'thumbnail.jpg',
          thumbnailAlt: 'Thumbnail'
        }
      })
      
      const thumbnail = wrapper.find('.message-thumbnail img')
      expect(thumbnail.exists()).toBe(true)
      expect(thumbnail.attributes('src')).toBe('thumbnail.jpg')
      expect(thumbnail.attributes('alt')).toBe('Thumbnail')
    })
  })

  describe('Actions', () => {
    it('should show actions when showActions is true and enhanced', () => {
      const wrapper = mount(UnifiedMessageContent, {
        props: {
          ...defaultProps,
          enhanced: true,
          showActions: true
        }
      })
      
      expect(wrapper.find('.message-actions').exists()).toBe(true)
    })

    it('should emit copy event', async () => {
      const wrapper = mount(UnifiedMessageContent, {
        props: {
          ...defaultProps,
          enhanced: true,
          showActions: true
        }
      })
      
      await wrapper.find('.message-actions button').trigger('click')
      expect(wrapper.emitted('copy')).toBeTruthy()
    })
  })

  describe('Code Blocks', () => {
    it('should render code blocks when enhanced', () => {
      const wrapper = mount(UnifiedMessageContent, {
        props: {
          ...defaultProps,
          enhanced: true,
          codeBlocks: [
            {
              language: 'javascript',
              code: 'console.log("Hello");'
            }
          ]
        }
      })
      
      expect(wrapper.find('.code-blocks').exists()).toBe(true)
      expect(wrapper.find('.code-block').exists()).toBe(true)
      expect(wrapper.text()).toContain('javascript')
      expect(wrapper.text()).toContain('console.log("Hello");')
    })

    it('should handle copy code button', async () => {
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn()
        }
      })

      const wrapper = mount(UnifiedMessageContent, {
        props: {
          ...defaultProps,
          enhanced: true,
          codeBlocks: [
            {
              language: 'javascript',
              code: 'const test = true;'
            }
          ]
        }
      })
      
      const copyButton = wrapper.find('.code-block button')
      await copyButton.trigger('click')
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('const test = true;')
    })
  })

  describe('Styling', () => {
    it('should apply prose classes by default', () => {
      const wrapper = mount(UnifiedMessageContent, {
        props: defaultProps
      })
      
      expect(wrapper.find('.prose').exists()).toBe(true)
    })

    it('should not apply prose classes when prose is false', () => {
      const wrapper = mount(UnifiedMessageContent, {
        props: {
          ...defaultProps,
          prose: false
        }
      })
      
      expect(wrapper.find('.prose').exists()).toBe(false)
    })

    it('should apply compact classes when compact is true', () => {
      const wrapper = mount(UnifiedMessageContent, {
        props: {
          ...defaultProps,
          compact: true
        }
      })
      
      expect(wrapper.find('.message-content-compact').exists()).toBe(true)
    })
  })

  describe('Events', () => {
    it('should emit imageClick event when image is clicked', async () => {
      const wrapper = mount(UnifiedMessageContent, {
        props: {
          ...defaultProps,
          attachments: [
            {
              url: 'test.jpg',
              name: 'Test',
              type: 'image'
            }
          ]
        }
      })
      
      // Mock window.open
      vi.spyOn(window, 'open').mockImplementation(() => null)
      
      await wrapper.find('img').trigger('click')
      
      expect(wrapper.emitted('imageClick')).toBeTruthy()
      expect(wrapper.emitted('imageClick')[0]).toEqual(['test.jpg'])
      expect(window.open).toHaveBeenCalledWith('test.jpg', '_blank')
    })
  })
})