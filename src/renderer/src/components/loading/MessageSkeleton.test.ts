import { describe, it, expect } from 'vitest'
import { mountComponent } from '../../../../test/utils'
import MessageSkeleton from './MessageSkeleton.vue'

describe('MessageSkeleton', () => {
  it('renders correctly', () => {
    const wrapper = mountComponent(MessageSkeleton)
    
    expect(wrapper.find('.message-skeleton').exists()).toBe(true)
    expect(wrapper.find('.skeleton-avatar').exists()).toBe(true)
    expect(wrapper.find('.skeleton-content').exists()).toBe(true)
  })
  
  it('has correct structure', () => {
    const wrapper = mountComponent(MessageSkeleton)
    
    // Should have avatar placeholder
    const avatar = wrapper.find('.skeleton-avatar')
    expect(avatar.exists()).toBe(true)
    
    // Should have content lines
    const lines = wrapper.findAll('.skeleton-line')
    expect(lines.length).toBe(3)
    
    // Lines should have different widths
    expect(lines[0].classes()).toContain('w-3/4')
    expect(lines[1].classes()).toContain('w-1/2')
    expect(lines[2].classes()).toContain('w-5/6')
  })
  
  it('has shimmer animation classes', () => {
    const wrapper = mountComponent(MessageSkeleton)
    
    const avatar = wrapper.find('.skeleton-avatar')
    const lines = wrapper.findAll('.skeleton-line')
    
    // Avatar should have shimmer animation
    expect(avatar.element.style.animation).toContain('shimmer')
    
    // Lines should have shimmer animation
    lines.forEach(line => {
      expect(line.element.style.animation).toContain('shimmer')
    })
  })
  
  it('has proper accessibility', () => {
    const wrapper = mountComponent(MessageSkeleton)
    
    // Should have proper role for screen readers
    const skeleton = wrapper.find('.message-skeleton')
    expect(skeleton.attributes('role')).toBe('status')
    expect(skeleton.attributes('aria-live')).toBe('polite')
    expect(skeleton.attributes('aria-label')).toBe('Loading message')
  })
})