import { describe, it, expect } from 'vitest'
import { mountComponent } from '../../../../../test/utils'
import TypingIndicator from './TypingIndicator.vue'

describe('TypingIndicator', () => {
  it('renders with default message', () => {
    const wrapper = mountComponent(TypingIndicator)
    
    expect(wrapper.find('.typing-indicator').exists()).toBe(true)
    expect(wrapper.text()).toContain('AI is typing...')
  })
  
  it('renders with custom message', () => {
    const wrapper = mountComponent(TypingIndicator, {
      props: { message: 'Processing your request...' }
    })
    
    expect(wrapper.text()).toContain('Processing your request...')
  })
  
  it('has three typing dots', () => {
    const wrapper = mountComponent(TypingIndicator)
    
    const dots = wrapper.findAll('.typing-dot')
    expect(dots.length).toBe(3)
  })
  
  it('has staggered animation delays', () => {
    const wrapper = mountComponent(TypingIndicator)
    
    const dots = wrapper.findAll('.typing-dot')
    
    // First dot has no delay
    expect(dots[0].element.style.animationDelay).toBe('')
    
    // Second dot has 0.2s delay
    expect(dots[1].element.style.animationDelay).toBe('0.2s')
    
    // Third dot has 0.4s delay
    expect(dots[2].element.style.animationDelay).toBe('0.4s')
  })
  
  it('applies correct CSS classes', () => {
    const wrapper = mountComponent(TypingIndicator)
    
    const container = wrapper.find('.typing-indicator')
    expect(container.classes()).toContain('flex')
    expect(container.classes()).toContain('items-center')
    expect(container.classes()).toContain('gap-2')
    
    const dots = wrapper.findAll('.typing-dot')
    dots.forEach(dot => {
      expect(dot.classes()).toContain('typing-dot')
    })
  })
  
  it('has fade-in animation', () => {
    const wrapper = mountComponent(TypingIndicator)
    
    const container = wrapper.find('.typing-indicator')
    expect(container.element.style.animation).toContain('fadeIn')
  })
})