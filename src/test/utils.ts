import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { Component } from 'vue'

// Test utilities for consistent component testing
export function createTestApp() {
  const pinia = createPinia()
  
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div>Home</div>' } },
      { path: '/settings', component: { template: '<div>Settings</div>' } }
    ]
  })

  // Create a simple i18n-like plugin for testing
  const i18n = {
    install(app: any) {
      app.config.globalProperties.$t = (key: string) => key
      app.config.globalProperties.$tc = (key: string) => key
      app.config.globalProperties.$te = () => true
      app.config.globalProperties.$d = (date: Date) => date.toString()
      app.config.globalProperties.$n = (num: number) => num.toString()
      app.provide('i18n', {
        global: {
          t: (key: string) => key,
          tc: (key: string) => key,
          te: () => true,
          d: (date: Date) => date.toString(),
          n: (num: number) => num.toString(),
          locale: { value: 'en' }
        }
      })
    }
  }
  
  return { pinia, router, i18n }
}

export function mountComponent(
  component: Component,
  options: {
    props?: Record<string, any>
    slots?: Record<string, any>
    attachTo?: HTMLElement
    shallow?: boolean
  } = {}
): VueWrapper {
  const { pinia, router, i18n } = createTestApp()
  
  return mount(component, {
    global: {
      plugins: [pinia, router, i18n],
      stubs: {
        'router-link': true,
        'router-view': true,
        'Teleport': {
          template: '<div class="teleport-stub"><slot /></div>'
        }
      }
    },
    ...options
  })
}

// Mock data factories
export const createMockMessage = (overrides = {}) => ({
  id: '1',
  role: 'user' as const,
  content: 'Test message',
  timestamp: new Date(),
  ...overrides
})

export const createMockChat = (overrides = {}) => ({
  id: '1',
  title: 'Test Chat',
  messages: [createMockMessage()],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

export const createMockAttachment = (overrides = {}) => ({
  name: 'test.png',
  type: 'image' as const,
  url: 'data:image/png;base64,test',
  ...overrides
})

// Helper to wait for Vue's reactivity system
export const nextTick = () => new Promise(resolve => setTimeout(resolve, 0))

// Helper to trigger events
export const triggerEvent = async (wrapper: VueWrapper, selector: string, event: string, data?: any) => {
  const element = wrapper.find(selector)
  await element.trigger(event, data)
  await nextTick()
}

// Helper to check if element is visible
export const isVisible = (wrapper: VueWrapper, selector: string): boolean => {
  const element = wrapper.find(selector)
  return element.exists() && element.isVisible()
}

// Helper to wait for element to appear
export const waitForElement = async (wrapper: VueWrapper, selector: string, timeout = 1000) => {
  const start = Date.now()
  
  while (Date.now() - start < timeout) {
    if (wrapper.find(selector).exists()) {
      return wrapper.find(selector)
    }
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  
  throw new Error(`Element ${selector} not found within ${timeout}ms`)
}

// Helper for async testing
export const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))