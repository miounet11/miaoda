import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// Lazy load routes for better code splitting
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'chatbox',
    component: () => import('@/views/ChatboxLayoutView.vue'),
    meta: {
      title: 'Chatbox',
      preload: true // Preload this route
    }
  },
  {
    path: '/legacy',
    name: 'legacy-chat',
    component: () => import('@/layouts/ChatBoxLayout.vue'),
    meta: {
      title: 'ChatBox (Legacy)',
      preload: false
    }
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/ChatBoxSettingsView.vue'),
    meta: {
      title: 'Settings',
      preload: false // Load on demand
    }
  },
  {
    path: '/settings/providers',
    name: 'provider-settings',
    component: () => import('@/views/ProviderSettings.vue'),
    meta: {
      title: 'Provider Settings',
      preload: false
    }
  },
  // Legacy route - redirect to new chatbox interface
  {
    path: '/old-chat',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// Route-level preloading optimization
router.beforeEach(async (to, from, next) => {
  // Preload critical routes on first navigation
  if (to.meta?.preload && from.name === undefined) {
    try {
      // Force preload critical components for ChatBox interface
      await Promise.all([
        import('@/components/chatbox/ChatView.vue'),
        import('@/components/chatbox/ChatMessages.vue'),
        import('@/components/chatbox/ChatInput.vue'),
        import('@/components/chatbox/AppSidebar.vue')
      ])
    } catch (error) {
      console.warn('Failed to preload components:', error)
    }
  }
  next()
})

export default router
