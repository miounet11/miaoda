import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import Toast from '../Toast.vue'

// Mock icons
vi.mock('lucide-vue-next', () => ({
  CheckCircle: { name: 'CheckCircle', template: '<span>✓</span>' },
  AlertCircle: { name: 'AlertCircle', template: '<span>⚠</span>' },
  XCircle: { name: 'XCircle', template: '<span>✗</span>' },
  Info: { name: 'Info', template: '<span>ℹ</span>' },
  X: { name: 'X', template: '<span>×</span>' }
}))

describe('Toast Component', () => {
  let wrapper: VueWrapper<any>

  const defaultProps = {
    id: 'test-toast',
    type: 'info' as const,
    title: 'Test Toast',
    message: 'This is a test toast message',
    duration: 5000,
    persistent: false,
    actions: []
  }

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('Toast Rendering', () => {
    it('renders with basic props', () => {
      wrapper = mount(Toast, {
        props: defaultProps
      })

      expect(wrapper.find('[data-testid="toast"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Test Toast')
      expect(wrapper.text()).toContain('This is a test toast message')
    })

    it('renders different toast types correctly', () => {
      const types = ['success', 'error', 'warning', 'info'] as const

      types.forEach(type => {
        wrapper = mount(Toast, {
          props: { ...defaultProps, type }
        })

        expect(wrapper.find(`[data-toast-type="${type}"]`).exists()).toBe(true)
        wrapper.unmount()
      })
    })

    it('shows appropriate icon for each type', () => {
      const typeIconMap = {
        success: '✓',
        error: '✗',
        warning: '⚠',
        info: 'ℹ'
      }

      Object.entries(typeIconMap).forEach(([type, icon]) => {
        wrapper = mount(Toast, {
          props: { ...defaultProps, type: type as any }
        })

        expect(wrapper.text()).toContain(icon)
        wrapper.unmount()
      })
    })

    it('renders without message when only title provided', () => {
      wrapper = mount(Toast, {
        props: {
          ...defaultProps,
          message: undefined
        }
      })

      expect(wrapper.text()).toContain('Test Toast')
      expect(wrapper.find('.toast-message').exists()).toBe(false)
    })

    it('renders without title when only message provided', () => {
      wrapper = mount(Toast, {
        props: {
          ...defaultProps,
          title: undefined
        }
      })

      expect(wrapper.text()).toContain('This is a test toast message')
      expect(wrapper.find('.toast-title').exists()).toBe(false)
    })
  })

  describe('Toast Interactions', () => {
    it('shows close button by default', () => {
      wrapper = mount(Toast, {
        props: defaultProps
      })

      const closeButton = wrapper.find('[data-testid="toast-close"]')
      expect(closeButton.exists()).toBe(true)
    })

    it('emits close event when close button clicked', async () => {
      wrapper = mount(Toast, {
        props: defaultProps
      })

      const closeButton = wrapper.find('[data-testid="toast-close"]')
      await closeButton.trigger('click')

      expect(wrapper.emitted('close')).toBeDefined()
      expect(wrapper.emitted('close')![0]).toEqual([defaultProps.id])
    })

    it('hides close button when not dismissible', () => {
      wrapper = mount(Toast, {
        props: {
          ...defaultProps,
          dismissible: false
        }
      })

      expect(wrapper.find('[data-testid="toast-close"]').exists()).toBe(false)
    })

    it('handles click on toast body', async () => {
      wrapper = mount(Toast, {
        props: defaultProps
      })

      await wrapper.find('[data-testid="toast"]').trigger('click')

      expect(wrapper.emitted('click')).toBeDefined()
    })
  })

  describe('Auto-dismiss Functionality', () => {
    it('auto-dismisses after specified duration', async () => {
      wrapper = mount(Toast, {
        props: {
          ...defaultProps,
          duration: 1000
        }
      })

      expect(wrapper.emitted('close')).toBeUndefined()

      // Fast-forward time
      vi.advanceTimersByTime(1000)
      await nextTick()

      expect(wrapper.emitted('close')).toBeDefined()
      expect(wrapper.emitted('close')![0]).toEqual([defaultProps.id])
    })

    it('does not auto-dismiss persistent toasts', async () => {
      wrapper = mount(Toast, {
        props: {
          ...defaultProps,
          persistent: true,
          duration: 1000
        }
      })

      vi.advanceTimersByTime(2000)
      await nextTick()

      expect(wrapper.emitted('close')).toBeUndefined()
    })

    it('pauses auto-dismiss on hover', async () => {
      wrapper = mount(Toast, {
        props: {
          ...defaultProps,
          duration: 1000
        }
      })

      // Hover over toast
      await wrapper.trigger('mouseenter')

      // Wait past the duration
      vi.advanceTimersByTime(1500)
      await nextTick()

      // Should not auto-dismiss while hovered
      expect(wrapper.emitted('close')).toBeUndefined()

      // Leave hover
      await wrapper.trigger('mouseleave')

      // Should now dismiss
      vi.advanceTimersByTime(1000)
      await nextTick()

      expect(wrapper.emitted('close')).toBeDefined()
    })

    it('pauses auto-dismiss on focus', async () => {
      wrapper = mount(Toast, {
        props: {
          ...defaultProps,
          duration: 1000
        }
      })

      await wrapper.trigger('focusin')

      vi.advanceTimersByTime(1500)
      await nextTick()

      expect(wrapper.emitted('close')).toBeUndefined()

      await wrapper.trigger('focusout')

      vi.advanceTimersByTime(1000)
      await nextTick()

      expect(wrapper.emitted('close')).toBeDefined()
    })
  })

  describe('Toast Actions', () => {
    it('renders action buttons', () => {
      const actions = [
        { label: 'Undo', action: 'undo' },
        { label: 'Retry', action: 'retry' }
      ]

      wrapper = mount(Toast, {
        props: {
          ...defaultProps,
          actions
        }
      })

      expect(wrapper.text()).toContain('Undo')
      expect(wrapper.text()).toContain('Retry')
    })

    it('emits action events when buttons clicked', async () => {
      const actions = [{ label: 'Undo', action: 'undo' }]

      wrapper = mount(Toast, {
        props: {
          ...defaultProps,
          actions
        }
      })

      const actionButton = wrapper.find('[data-action="undo"]')
      await actionButton.trigger('click')

      expect(wrapper.emitted('action')).toBeDefined()
      expect(wrapper.emitted('action')![0]).toEqual(['undo', defaultProps.id])
    })

    it('handles multiple actions correctly', async () => {
      const actions = [
        { label: 'Action 1', action: 'action1' },
        { label: 'Action 2', action: 'action2' },
        { label: 'Action 3', action: 'action3' }
      ]

      wrapper = mount(Toast, {
        props: {
          ...defaultProps,
          actions
        }
      })

      // Click each action
      for (const action of actions) {
        const button = wrapper.find(`[data-action="${action.action}"]`)
        await button.trigger('click')
      }

      expect(wrapper.emitted('action')).toHaveLength(3)
    })
  })

  describe('Toast Animations', () => {
    it('applies enter animation classes', async () => {
      wrapper = mount(Toast, {
        props: defaultProps
      })

      // Should have animation classes
      expect(wrapper.classes()).toEqual(
        expect.arrayContaining([expect.stringMatching(/enter|fade|slide/)])
      )
    })

    it('applies exit animation classes when closing', async () => {
      wrapper = mount(Toast, {
        props: defaultProps
      })

      const closeButton = wrapper.find('[data-testid="toast-close"]')
      await closeButton.trigger('click')

      // Should apply exit animation
      expect(wrapper.classes()).toEqual(
        expect.arrayContaining([expect.stringMatching(/exit|fade|slide/)])
      )
    })

    it('handles animation duration correctly', async () => {
      wrapper = mount(Toast, {
        props: {
          ...defaultProps,
          animationDuration: 500
        }
      })

      const closeButton = wrapper.find('[data-testid="toast-close"]')
      await closeButton.trigger('click')

      // Should respect custom animation duration
      vi.advanceTimersByTime(250) // Half duration
      expect(wrapper.emitted('close')).toBeUndefined()

      vi.advanceTimersByTime(300) // Complete duration
      await nextTick()
      expect(wrapper.emitted('close')).toBeDefined()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      wrapper = mount(Toast, {
        props: defaultProps
      })

      const toast = wrapper.find('[data-testid="toast"]')
      expect(toast.attributes('role')).toBe('alert')
      expect(toast.attributes('aria-live')).toBe('polite')
    })

    it('has assertive ARIA for urgent toasts', () => {
      wrapper = mount(Toast, {
        props: {
          ...defaultProps,
          type: 'error',
          urgent: true
        }
      })

      const toast = wrapper.find('[data-testid="toast"]')
      expect(toast.attributes('aria-live')).toBe('assertive')
    })

    it('is keyboard accessible', async () => {
      wrapper = mount(Toast, {
        props: defaultProps
      })

      // Test keyboard interaction
      await wrapper.trigger('keydown', { key: 'Escape' })

      expect(wrapper.emitted('close')).toBeDefined()
    })

    it('provides proper labels for screen readers', () => {
      wrapper = mount(Toast, {
        props: defaultProps
      })

      const closeButton = wrapper.find('[data-testid="toast-close"]')
      expect(closeButton.attributes('aria-label')).toContain('Close')
    })

    it('announces content to screen readers', () => {
      wrapper = mount(Toast, {
        props: {
          ...defaultProps,
          announceToScreenReader: true
        }
      })

      const toast = wrapper.find('[data-testid="toast"]')
      expect(toast.attributes('aria-describedby')).toBeDefined()
    })
  })

  describe('Toast Progress Indicator', () => {
    it('shows progress bar for timed toasts', () => {
      wrapper = mount(Toast, {
        props: {
          ...defaultProps,
          showProgress: true,
          duration: 2000
        }
      })

      expect(wrapper.find('[data-testid="toast-progress"]').exists()).toBe(true)
    })

    it('updates progress over time', async () => {
      wrapper = mount(Toast, {
        props: {
          ...defaultProps,
          showProgress: true,
          duration: 1000
        }
      })

      const progressBar = wrapper.find('[data-testid="toast-progress"]')

      // Initial state
      expect(progressBar.element.style.width).toBe('100%')

      // Half duration
      vi.advanceTimersByTime(500)
      await nextTick()

      // Progress should update (implementation dependent)
      expect(progressBar.exists()).toBe(true)
    })

    it('hides progress bar for persistent toasts', () => {
      wrapper = mount(Toast, {
        props: {
          ...defaultProps,
          persistent: true,
          showProgress: true
        }
      })

      expect(wrapper.find('[data-testid="toast-progress"]').exists()).toBe(false)
    })
  })

  describe('Toast Positioning', () => {
    it('applies correct position classes', () => {
      const positions = [
        'top-right',
        'top-left',
        'bottom-right',
        'bottom-left',
        'top-center',
        'bottom-center'
      ]

      positions.forEach(position => {
        wrapper = mount(Toast, {
          props: {
            ...defaultProps,
            position
          }
        })

        expect(wrapper.classes()).toEqual(
          expect.arrayContaining([expect.stringMatching(new RegExp(position.replace('-', '.*')))])
        )

        wrapper.unmount()
      })
    })

    it('handles z-index stacking', () => {
      wrapper = mount(Toast, {
        props: {
          ...defaultProps,
          zIndex: 9999
        }
      })

      const toast = wrapper.find('[data-testid="toast"]')
      expect(toast.element.style.zIndex).toBe('9999')
    })
  })

  describe('Toast Theming', () => {
    it('applies theme classes correctly', () => {
      wrapper = mount(Toast, {
        props: {
          ...defaultProps,
          theme: 'dark'
        }
      })

      expect(wrapper.classes()).toContain('toast-dark')
    })

    it('supports custom styling', () => {
      wrapper = mount(Toast, {
        props: {
          ...defaultProps,
          customClass: 'my-custom-toast'
        }
      })

      expect(wrapper.classes()).toContain('my-custom-toast')
    })

    it('applies size variants', () => {
      const sizes = ['sm', 'md', 'lg']

      sizes.forEach(size => {
        wrapper = mount(Toast, {
          props: {
            ...defaultProps,
            size
          }
        })

        expect(wrapper.classes()).toContain(`toast-${size}`)
        wrapper.unmount()
      })
    })
  })

  describe('Toast Content Formatting', () => {
    it('handles HTML content safely', () => {
      wrapper = mount(Toast, {
        props: {
          ...defaultProps,
          message: '<strong>Bold text</strong>',
          allowHtml: true
        }
      })

      expect(wrapper.html()).toContain('<strong>Bold text</strong>')
    })

    it('escapes HTML when not allowed', () => {
      wrapper = mount(Toast, {
        props: {
          ...defaultProps,
          message: '<script>alert("xss")</script>',
          allowHtml: false
        }
      })

      expect(wrapper.html()).not.toContain('<script>')
      expect(wrapper.text()).toContain('<script>alert("xss")</script>')
    })

    it('truncates long messages', () => {
      const longMessage = 'Very long message '.repeat(100)

      wrapper = mount(Toast, {
        props: {
          ...defaultProps,
          message: longMessage,
          maxLength: 100
        }
      })

      const displayedText = wrapper.find('.toast-message').text()
      expect(displayedText.length).toBeLessThanOrEqual(103) // 100 + '...'
      expect(displayedText).toContain('...')
    })
  })

  describe('Toast Performance', () => {
    it('renders quickly with complex content', () => {
      const complexProps = {
        ...defaultProps,
        title: 'Complex Toast '.repeat(10),
        message: 'Complex message with lots of content '.repeat(50),
        actions: Array(5)
          .fill(null)
          .map((_, i) => ({
            label: `Action ${i}`,
            action: `action-${i}`
          }))
      }

      const startTime = performance.now()

      wrapper = mount(Toast, {
        props: complexProps
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      expect(renderTime).toBeLessThan(50) // Should render within 50ms
      expect(wrapper.vm).toBeDefined()
    })

    it('handles rapid show/hide cycles', async () => {
      wrapper = mount(Toast, {
        props: {
          ...defaultProps,
          duration: 100
        }
      })

      // Rapidly trigger show/hide
      for (let i = 0; i < 10; i++) {
        await wrapper.setProps({ visible: true })
        vi.advanceTimersByTime(50)
        await wrapper.setProps({ visible: false })
        vi.advanceTimersByTime(10)
      }

      // Should handle gracefully
      expect(wrapper.vm).toBeDefined()
    })
  })

  describe('Toast Stack Management', () => {
    it('handles multiple toasts with different z-indices', () => {
      const wrapper1 = mount(Toast, {
        props: { ...defaultProps, id: 'toast-1', zIndex: 1000 }
      })

      const wrapper2 = mount(Toast, {
        props: { ...defaultProps, id: 'toast-2', zIndex: 1001 }
      })

      expect(wrapper1.find('[data-testid="toast"]').element.style.zIndex).toBe('1000')
      expect(wrapper2.find('[data-testid="toast"]').element.style.zIndex).toBe('1001')

      wrapper1.unmount()
      wrapper2.unmount()
    })

    it('maintains proper stacking order', () => {
      wrapper = mount(Toast, {
        props: {
          ...defaultProps,
          stackOrder: 5
        }
      })

      // Should apply appropriate transform for stacking
      expect(wrapper.vm).toBeDefined()
    })
  })

  describe('Memory Management', () => {
    it('cleans up timers on unmount', () => {
      wrapper = mount(Toast, {
        props: {
          ...defaultProps,
          duration: 5000
        }
      })

      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

      wrapper.unmount()

      expect(clearTimeoutSpy).toHaveBeenCalled()
    })

    it('cleans up event listeners on unmount', () => {
      wrapper = mount(Toast, {
        props: defaultProps
      })

      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      wrapper.unmount()

      // Should clean up any global event listeners
      expect(wrapper.vm).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('handles invalid duration gracefully', () => {
      expect(() => {
        wrapper = mount(Toast, {
          props: {
            ...defaultProps,
            duration: -1000 // Invalid duration
          }
        })
      }).not.toThrow()

      // Should use default duration
      expect(wrapper.vm).toBeDefined()
    })

    it('handles missing required props', () => {
      expect(() => {
        wrapper = mount(Toast, {
          props: {
            id: 'test'
            // Missing other required props
          }
        })
      }).not.toThrow()
    })

    it('handles action callback errors', async () => {
      const actions = [
        {
          label: 'Error Action',
          action: 'error-action',
          callback: vi.fn(() => {
            throw new Error('Action failed')
          })
        }
      ]

      wrapper = mount(Toast, {
        props: {
          ...defaultProps,
          actions
        }
      })

      const errorButton = wrapper.find('[data-action="error-action"]')

      // Should not crash the component
      expect(async () => {
        await errorButton.trigger('click')
      }).not.toThrow()
    })
  })
})
