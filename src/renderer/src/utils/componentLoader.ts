// Optimized component loading utilities for better performance

import { defineAsyncComponent, type AsyncComponentLoader } from 'vue'
import LoadingSpinner from '@/components/ui/SkeletonLoader.vue'
import ErrorFallback from '@/components/ErrorFallback.vue'

// Component loading configuration
interface LoaderOptions {
  delay?: number
  timeout?: number
  suspensible?: boolean
  retryLimit?: number
}

// Default loading options
const DEFAULT_OPTIONS: LoaderOptions = {
  delay: 200,
  timeout: 10000,
  suspensible: false,
  retryLimit: 3
}

// Create optimized async component with proper error handling
export function createAsyncComponent(
  loader: AsyncComponentLoader,
  options: LoaderOptions = {}
) {
  const config = { ...DEFAULT_OPTIONS, ...options }
  
  return defineAsyncComponent({
    loader,
    loadingComponent: LoadingSpinner,
    errorComponent: ErrorFallback,
    delay: config.delay,
    timeout: config.timeout,
    suspensible: config.suspensible,
    onError: (error, retry, fail, attempts) => {
      console.warn(`Component loading failed (attempt ${attempts}):`, error)
      if (attempts < config.retryLimit!) {
        retry()
      } else {
        fail()
      }
    }
  })
}

// Preload components for better UX
export class ComponentPreloader {
  private static preloadedComponents = new Set<string>()
  
  static async preload(componentPath: string): Promise<void> {
    if (this.preloadedComponents.has(componentPath)) {
      return
    }
    
    try {
      await import(componentPath)
      this.preloadedComponents.add(componentPath)
    } catch (error) {
      console.warn(`Failed to preload component ${componentPath}:`, error)
    }
  }
  
  static async preloadCritical(): Promise<void> {
    // Preload critical components that are likely to be used
    const criticalComponents = [
      '@/components/chat/ChatInput.vue',
      '@/components/chat/ChatMessages.vue',
      '@/components/ui/Toast.vue',
      '@/components/ui/ConfirmDialog.vue'
    ]
    
    await Promise.allSettled(
      criticalComponents.map(component => this.preload(component))
    )
  }
  
  static isPreloaded(componentPath: string): boolean {
    return this.preloadedComponents.has(componentPath)
  }
}

// Lazy component factory for common patterns
export const LazyComponents = {
  // Analytics components (heavy)
  AnalyticsChart: () => createAsyncComponent(
    () => import('@/components/analytics/BaseChart.vue'),
    { delay: 100 }
  ),
  
  ModelUsageChart: () => createAsyncComponent(
    () => import('@/components/analytics/ModelUsageChart.vue'),
    { delay: 100 }
  ),
  
  UsageChart: () => createAsyncComponent(
    () => import('@/components/analytics/UsageChart.vue'),
    { delay: 100 }
  ),
  
  // Export components (very heavy)
  ExportDialog: () => createAsyncComponent(
    () => import('@/components/export/ExportDialog.vue'),
    { delay: 300, timeout: 15000 }
  ),
  
  AdvancedExportDialog: () => createAsyncComponent(
    () => import('@/components/export/AdvancedExportDialog.vue'),
    { delay: 300, timeout: 15000 }
  ),
  
  // Plugin components (moderate)
  PluginManager: () => createAsyncComponent(
    () => import('@/components/plugin/PluginManager.vue'),
    { delay: 150 }
  ),
  
  // Search components (moderate)
  GlobalSearch: () => createAsyncComponent(
    () => import('@/components/search/GlobalSearch.vue'),
    { delay: 150 }
  ),
  
  // Voice components (heavy due to media APIs)
  VoiceRecorder: () => createAsyncComponent(
    () => import('@/components/voice/VoiceRecorder.vue'),
    { delay: 200 }
  )
}

export default {
  createAsyncComponent,
  ComponentPreloader,
  LazyComponents
}
