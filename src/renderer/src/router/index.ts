import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// Lazy load routes for better code splitting
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'chat',
    component: () => import('@/views/SimpleChatView.vue'),
    meta: {
      title: 'Chat',
      preload: true, // Preload this route
    },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/SimpleSettingsView.vue'),
    meta: {
      title: 'Settings',
      preload: false, // Load on demand
    },
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

// Route-level preloading optimization
router.beforeEach(async (to, from, next) => {
  // Preload critical routes on first navigation
  if (to.meta?.preload && from.name === undefined) {
    try {
      // Force preload critical components
      await Promise.all([
        import('@/components/chat/ChatMessages.vue'),
        import('@/components/chat/ChatInput.vue'),
        import('@/components/chat/ModelConfigPanel.vue'),
      ])
    } catch (error) {
      console.warn('Failed to preload components:', error)
    }
  }
  next()
})

export default router
