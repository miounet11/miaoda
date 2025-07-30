/**
 * PWA Service - Handles Progressive Web App functionality
 * 
 * Features:
 * - Service Worker registration and management
 * - App installation prompts
 * - Offline status detection
 * - Update notifications
 * - Background sync management
 * - Push notification handling
 */

export interface PWAInstallPrompt {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface PWAUpdateInfo {
  available: boolean
  skipWaiting?: () => Promise<void>
  reload?: () => void
}

export interface PWANotificationOptions {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

export interface PWAServiceConfig {
  swPath?: string
  scope?: string
  updateCheckInterval?: number
  enableNotifications?: boolean
  enableBackgroundSync?: boolean
  debug?: boolean
}

export class PWAService {
  private swRegistration: ServiceWorkerRegistration | null = null
  private installPrompt: PWAInstallPrompt | null = null
  private updateCheckInterval: number | null = null
  private config: Required<PWAServiceConfig>
  private eventListeners: Map<string, Set<Function>> = new Map()

  constructor(config: PWAServiceConfig = {}) {
    this.config = {
      swPath: '/sw.js',
      scope: '/',
      updateCheckInterval: 60000, // 1 minute
      enableNotifications: true,
      enableBackgroundSync: true,
      debug: false,
      ...config
    }

    this.init()
  }

  private async init(): Promise<void> {
    try {
      // Check PWA support
      if (!this.isPWASupported()) {
        this.log('PWA not supported in this browser')
        return
      }

      // Register service worker
      await this.registerServiceWorker()

      // Setup install prompt handling
      this.setupInstallPrompt()

      // Setup offline detection
      this.setupOfflineDetection()

      // Setup update checking
      this.setupUpdateChecking()

      // Request notification permission if enabled
      if (this.config.enableNotifications) {
        await this.requestNotificationPermission()
      }

      this.log('PWA Service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize PWA Service:', error)
    }
  }

  // Service Worker Management
  private async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported')
    }

    try {
      this.swRegistration = await navigator.serviceWorker.register(
        this.config.swPath,
        { scope: this.config.scope }
      )

      this.log('Service Worker registered:', this.swRegistration.scope)

      // Listen for service worker events
      this.swRegistration.addEventListener('updatefound', () => {
        this.handleServiceWorkerUpdate()
      })

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event)
      })

    } catch (error) {
      console.error('Service Worker registration failed:', error)
      throw error
    }
  }

  private handleServiceWorkerUpdate(): void {
    if (!this.swRegistration) return

    const newWorker = this.swRegistration.installing
    if (!newWorker) return

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // New service worker is available
        this.emit('update-available', {
          available: true,
          skipWaiting: () => this.skipWaiting(),
          reload: () => window.location.reload()
        })
      }
    })
  }

  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, payload } = event.data

    switch (type) {
      case 'CACHE_UPDATED':
        this.emit('cache-updated', payload)
        break
      case 'OFFLINE_MESSAGE_QUEUED':
        this.emit('message-queued', payload)
        break
      case 'BACKGROUND_SYNC_SUCCESS':
        this.emit('sync-success', payload)
        break
      case 'BACKGROUND_SYNC_FAILED':
        this.emit('sync-failed', payload)
        break
      default:
        this.log('Unknown message from service worker:', event.data)
    }
  }

  async skipWaiting(): Promise<void> {
    if (!this.swRegistration) return

    const newWorker = this.swRegistration.waiting || this.swRegistration.installing
    if (newWorker) {
      newWorker.postMessage({ type: 'SKIP_WAITING' })
    }
  }

  async unregisterServiceWorker(): Promise<boolean> {
    if (!this.swRegistration) return false

    try {
      const result = await this.swRegistration.unregister()
      this.swRegistration = null
      this.log('Service Worker unregistered')
      return result
    } catch (error) {
      console.error('Failed to unregister service worker:', error)
      return false
    }
  }

  // App Installation
  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault()
      this.installPrompt = event as any
      this.emit('installable', true)
      this.log('Install prompt ready')
    })

    window.addEventListener('appinstalled', () => {
      this.installPrompt = null
      this.emit('installed', true)
      this.log('App installed')
    })
  }

  async showInstallPrompt(): Promise<boolean> {
    if (!this.installPrompt) {
      throw new Error('Install prompt not available')
    }

    try {
      await this.installPrompt.prompt()
      const choice = await this.installPrompt.userChoice
      
      if (choice.outcome === 'accepted') {
        this.log('User accepted install prompt')
        return true
      } else {
        this.log('User dismissed install prompt')
        return false
      }
    } catch (error) {
      console.error('Install prompt failed:', error)
      return false
    }
  }

  isInstallable(): boolean {
    return this.installPrompt !== null
  }

  isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.matchMedia('(display-mode: fullscreen)').matches ||
           (window.navigator as any).standalone === true
  }

  // Offline Detection
  private setupOfflineDetection(): void {
    const updateOnlineStatus = () => {
      this.emit('online-status', navigator.onLine)
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    // Initial status
    updateOnlineStatus()
  }

  isOnline(): boolean {
    return navigator.onLine
  }

  // Update Checking
  private setupUpdateChecking(): void {
    if (this.config.updateCheckInterval > 0) {
      this.updateCheckInterval = window.setInterval(() => {
        this.checkForUpdates()
      }, this.config.updateCheckInterval)
    }
  }

  async checkForUpdates(): Promise<void> {
    if (!this.swRegistration) return

    try {
      await this.swRegistration.update()
      this.log('Checked for updates')
    } catch (error) {
      console.error('Update check failed:', error)
    }
  }

  // Notifications
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported')
    }

    if (Notification.permission === 'granted') {
      return 'granted'
    }

    const permission = await Notification.requestPermission()
    this.log('Notification permission:', permission)
    return permission
  }

  async showNotification(options: PWANotificationOptions): Promise<void> {
    if (!this.swRegistration) {
      throw new Error('Service Worker not registered')
    }

    if (Notification.permission !== 'granted') {
      throw new Error('Notification permission not granted')
    }

    try {
      await this.swRegistration.showNotification(options.title, {
        body: options.body,
        icon: options.icon || '/icons/icon-192x192.png',
        badge: options.badge || '/icons/badge-72x72.png',
        tag: options.tag,
        data: options.data,
        actions: options.actions
      })

      this.log('Notification shown:', options.title)
    } catch (error) {
      console.error('Failed to show notification:', error)
      throw error
    }
  }

  // Background Sync
  async queueMessage(message: any): Promise<void> {
    if (!this.swRegistration || !this.config.enableBackgroundSync) {
      throw new Error('Background sync not available')
    }

    try {
      await this.sendMessageToSW({
        type: 'QUEUE_MESSAGE',
        payload: message
      })

      // Register background sync
      if ('sync' in this.swRegistration) {
        await this.swRegistration.sync.register('message-sync')
      }

      this.log('Message queued for sync')
    } catch (error) {
      console.error('Failed to queue message:', error)
      throw error
    }
  }

  // Cache Management
  async clearCache(): Promise<void> {
    if (!this.swRegistration) return

    try {
      await this.sendMessageToSW({
        type: 'CLEAR_CACHE'
      })

      this.log('Cache cleared')
    } catch (error) {
      console.error('Failed to clear cache:', error)
    }
  }

  async getCacheSize(): Promise<number> {
    if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
      return 0
    }

    try {
      const estimate = await navigator.storage.estimate()
      return estimate.usage || 0
    } catch (error) {
      console.error('Failed to get cache size:', error)
      return 0
    }
  }

  // Utility Methods
  private async sendMessageToSW(message: any): Promise<any> {
    if (!this.swRegistration) {
      throw new Error('Service Worker not registered')
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel()
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.error) {
          reject(new Error(event.data.error))
        } else {
          resolve(event.data)
        }
      }

      const sw = this.swRegistration.active
      if (sw) {
        sw.postMessage(message, [messageChannel.port2])
      } else {
        reject(new Error('No active service worker'))
      }
    })
  }

  private isPWASupported(): boolean {
    return 'serviceWorker' in navigator && 
           'caches' in window &&
           'indexedDB' in window
  }

  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[PWAService]', ...args)
    }
  }

  // Event Management
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(callback)
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.delete(callback)
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('Event listener error:', error)
        }
      })
    }
  }

  // Lifecycle
  destroy(): void {
    // Clear update check interval
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval)
      this.updateCheckInterval = null
    }

    // Clear event listeners
    this.eventListeners.clear()

    this.log('PWA Service destroyed')
  }

  // Getters
  get registration(): ServiceWorkerRegistration | null {
    return this.swRegistration
  }

  get isSupported(): boolean {
    return this.isPWASupported()
  }
}

// Create and export singleton instance
export const pwaService = new PWAService({
  debug: process.env.NODE_ENV === 'development'
})

// Vue plugin installation helper
export function setupPWA(app: any): void {
  // Provide PWA service globally
  app.provide('pwaService', pwaService)
  
  // Add global properties
  app.config.globalProperties.$pwa = pwaService
}

// Composable for using PWA service
export function usePWA(): PWAService {
  return pwaService
}

export default pwaService