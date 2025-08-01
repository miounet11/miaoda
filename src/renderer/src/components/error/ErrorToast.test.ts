import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountComponent, nextTick } from '../../../../../test/utils'
import ErrorToast from './ErrorToast.vue'

describe('ErrorToast', () => {
  beforeEach(() => {
    vi.clearAllTimers()
    vi.useFakeTimers()
  })
  
  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })
  
  it('renders without errors initially', () => {
    const wrapper = mountComponent(ErrorToast)
    
    expect(wrapper.find('.toast-container').exists()).toBe(true)
    expect(wrapper.findAll('.error-toast').length).toBe(0)
  })
  
  it('shows error when showError is called', async () => {
    const wrapper = mountComponent(ErrorToast)
    const component = wrapper.vm as any
    
    component.showError({
      title: 'Test Error',
      message: 'This is a test error',
      severity: 'error'
    })
    
    await nextTick()
    
    const toast = wrapper.find('.error-toast')
    expect(toast.exists()).toBe(true)
    expect(toast.text()).toContain('Test Error')
    expect(toast.text()).toContain('This is a test error')
  })
  
  it('applies correct severity classes', async () => {
    const wrapper = mountComponent(ErrorToast)
    const component = wrapper.vm as any
    
    // Test error severity
    component.showError({
      title: 'Error',
      severity: 'error'
    })
    
    await nextTick()
    
    let toast = wrapper.find('.error-toast')
    expect(toast.classes()).toContain('severity-error')
    
    // Test warning severity
    component.dismissAll()
    component.showError({
      title: 'Warning',
      severity: 'warning'
    })
    
    await nextTick()
    
    toast = wrapper.find('.error-toast')
    expect(toast.classes()).toContain('severity-warning')
  })
  
  it('auto-dismisses after specified duration', async () => {
    const wrapper = mountComponent(ErrorToast)
    const component = wrapper.vm as any
    
    component.showError({
      title: 'Auto Dismiss',
      severity: 'info',
      duration: 1000
    })
    
    await nextTick()
    
    // Should exist initially
    expect(wrapper.find('.error-toast').exists()).toBe(true)
    
    // Fast-forward time
    vi.advanceTimersByTime(1000)
    await nextTick()
    
    // Should be dismissed
    expect(wrapper.find('.error-toast').exists()).toBe(false)
  })
  
  it('dismisses when close button is clicked', async () => {
    const wrapper = mountComponent(ErrorToast)
    const component = wrapper.vm as any
    
    component.showError({
      title: 'Dismissible',
      severity: 'info'
    })
    
    await nextTick()
    
    // Should exist initially
    expect(wrapper.find('.error-toast').exists()).toBe(true)
    
    // Click close button
    await wrapper.find('.toast-close').trigger('click')
    await nextTick()
    
    // Should be dismissed
    expect(wrapper.find('.error-toast').exists()).toBe(false)
  })
  
  it('handles multiple errors', async () => {
    const wrapper = mountComponent(ErrorToast)
    const component = wrapper.vm as any
    
    component.showError({
      title: 'Error 1',
      severity: 'error'
    })
    
    component.showError({
      title: 'Error 2',
      severity: 'warning'
    })
    
    await nextTick()
    
    const toasts = wrapper.findAll('.error-toast')
    expect(toasts.length).toBe(2)
    expect(toasts[0].text()).toContain('Error 1')
    expect(toasts[1].text()).toContain('Error 2')
  })
  
  it('dismisses all errors when dismissAll is called', async () => {
    const wrapper = mountComponent(ErrorToast)
    const component = wrapper.vm as any
    
    component.showError({ title: 'Error 1', severity: 'error' })
    component.showError({ title: 'Error 2', severity: 'warning' })
    
    await nextTick()
    
    expect(wrapper.findAll('.error-toast').length).toBe(2)
    
    component.dismissAll()
    
    await nextTick()
    
    expect(wrapper.findAll('.error-toast').length).toBe(0)
  })
  
  it('shows correct icons for different severities', async () => {
    const wrapper = mountComponent(ErrorToast)
    const component = wrapper.vm as any
    
    // Test error icon (AlertCircle)
    component.showError({
      title: 'Error',
      severity: 'error'
    })
    
    await nextTick()
    
    expect(wrapper.find('[data-lucide="alert-circle"]').exists()).toBe(true)
    
    component.dismissAll()
    
    // Test warning icon (AlertTriangle)
    component.showError({
      title: 'Warning',
      severity: 'warning'
    })
    
    await nextTick()
    
    expect(wrapper.find('[data-lucide="alert-triangle"]').exists()).toBe(true)
  })
})