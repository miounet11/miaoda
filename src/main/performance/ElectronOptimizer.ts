import { app, BrowserWindow, ipcMain, powerMonitor } from 'electron'
import { EventEmitter } from 'events'
import { logger } from '../utils/Logger'

export interface ElectronPerformanceMetrics {
  cpu: {
    usage: number
    loadAverage: number[]
  }
  memory: {
    total: number
    used: number
    available: number
    percentage: number
  }
  gpu: {
    enabled: boolean
    vendor: string
    renderer: string
  }
  windows: Array<{
    id: number
    visible: boolean
    focused: boolean
    memoryUsage: number
    cpuUsage: number
  }>
  ipc: {
    totalMessages: number
    messagesPerSecond: number
    averageResponseTime: number
    errorRate: number
  }
  processes: {
    main: number
    renderer: number[]
    utility: number[]
  }
}

export interface OptimizationConfig {
  enableGPUAcceleration: boolean
  enableHardwareAcceleration: boolean
  maxRendererProcesses: number
  memoryThreshold: number // MB
  cpuThreshold: number // Percentage
  powerSaveMode: boolean
  backgroundThrottling: boolean
  v8CacheOptions: {
    enabled: boolean
    maxSize: number
  }
  processOptimization: {
    enableSandbox: boolean
    enableNodeIntegration: boolean
    contextIsolation: boolean
  }
}

export interface WindowOptimizationSettings {
  enableBackgroundThrottling: boolean
  enableOffscreenRendering: boolean
  webSecurity: boolean
  experimentalFeatures: string[]
}

/**
 * Comprehensive Electron main process performance optimizer
 * Handles CPU/Memory optimization, IPC efficiency, window management
 */
export class ElectronPerformanceOptimizer extends EventEmitter {
  private config: OptimizationConfig
  private metrics: ElectronPerformanceMetrics
  private metricsTimer: NodeJS.Timeout | null = null
  private ipcMetrics = {
    messageCount: 0,
    responseTimeSum: 0,
    errorCount: 0,
    startTime: Date.now()
  }
  private windowOptimizations = new Map<number, WindowOptimizationSettings>()
  private backgroundWindowThrottle = new Map<number, NodeJS.Timeout>()

  constructor(config: Partial<OptimizationConfig> = {}) {
    super()

    this.config = {
      enableGPUAcceleration: true,
      enableHardwareAcceleration: true,
      maxRendererProcesses: 4,
      memoryThreshold: 500, // MB
      cpuThreshold: 80, // %
      powerSaveMode: false,
      backgroundThrottling: true,
      v8CacheOptions: {
        enabled: true,
        maxSize: 50 * 1024 * 1024 // 50MB
      },
      processOptimization: {
        enableSandbox: true,
        enableNodeIntegration: false,
        contextIsolation: true
      },
      ...config
    }

    this.metrics = this.initializeMetrics()
    this.initialize()
  }

  private initialize(): void {
    logger.info('Initializing Electron performance optimizer', 'ElectronOptimizer', this.config)

    // Apply app-level optimizations
    this.applyAppOptimizations()

    // Setup IPC monitoring
    this.setupIPCMonitoring()

    // Setup power management
    this.setupPowerManagement()

    // Setup window management
    this.setupWindowManagement()

    // Start metrics collection
    this.startMetricsCollection()

    // Setup cleanup handlers
    this.setupCleanupHandlers()
  }

  /**
   * Apply comprehensive app-level optimizations
   */
  private applyAppOptimizations(): void {
    try {
      // GPU and hardware acceleration
      if (!this.config.enableGPUAcceleration) {
        app.disableHardwareAcceleration()
        logger.info('Hardware acceleration disabled', 'ElectronOptimizer')
      }

      // V8 cache options
      if (this.config.v8CacheOptions.enabled) {
        app.commandLine.appendSwitch(
          'js-flags',
          `--max-old-space-size=${this.config.v8CacheOptions.maxSize / (1024 * 1024)}`
        )
        app.commandLine.appendSwitch('disk-cache-size', '50000000') // 50MB disk cache
      }

      // Process optimization flags
      app.commandLine.appendSwitch('no-sandbox')
      app.commandLine.appendSwitch('disable-web-security')
      app.commandLine.appendSwitch('disable-features', 'VizDisplayCompositor')

      // Memory optimization
      app.commandLine.appendSwitch('memory-pressure-off')
      app.commandLine.appendSwitch('max_old_space_size', '4096')

      // Network optimization
      app.commandLine.appendSwitch('aggressive-cache-discard')

      // Background throttling
      if (this.config.backgroundThrottling) {
        app.commandLine.appendSwitch('enable-background-tracing')
      }

      logger.info('Applied app-level optimizations', 'ElectronOptimizer')
    } catch (error) {
      logger.error('Failed to apply app optimizations', 'ElectronOptimizer', { error })
    }
  }

  /**
   * Create optimized browser window with performance settings
   */
  createOptimizedWindow(options: any = {}): BrowserWindow {
    const optimizedOptions = {
      show: false, // Show only when ready
      paintWhenInitiallyHidden: false,
      titleBarOverlay: false,
      webPreferences: {
        nodeIntegration: this.config.processOptimization.enableNodeIntegration,
        contextIsolation: this.config.processOptimization.contextIsolation,
        sandbox: this.config.processOptimization.enableSandbox,
        enableRemoteModule: false,
        webSecurity: false, // For better performance, disable in dev
        experimentalFeatures: false,
        v8CacheOptions: 'code',
        backgroundThrottling: this.config.backgroundThrottling,
        offscreen: false, // Enable for hidden windows
        spellcheck: false, // Disable for better performance
        ...options.webPreferences
      },
      ...options
    }

    const window = new BrowserWindow(optimizedOptions)

    // Apply window-specific optimizations
    this.optimizeWindow(window)

    // Track window for monitoring
    this.trackWindow(window)

    logger.debug('Created optimized window', 'ElectronOptimizer', {
      id: window.id,
      options: Object.keys(optimizedOptions)
    })

    return window
  }

  /**
   * Optimize existing window
   */
  optimizeWindow(window: BrowserWindow): void {
    const windowId = window.id

    // Set up window lifecycle optimization
    window.once('ready-to-show', () => {
      window.show()
      this.emit('window-ready', windowId)
    })

    // Background throttling
    window.on('hide', () => {
      if (this.config.backgroundThrottling) {
        this.throttleBackgroundWindow(windowId)
      }
    })

    window.on('show', () => {
      this.unthrottleBackgroundWindow(windowId)
    })

    // Memory management
    window.on('focus', () => {
      this.prioritizeWindow(windowId)
    })

    window.on('blur', () => {
      this.deprioritizeWindow(windowId)
    })

    // Clean up on close
    window.on('closed', () => {
      this.untrackWindow(windowId)
    })

    // Set optimization settings
    const settings: WindowOptimizationSettings = {
      enableBackgroundThrottling: this.config.backgroundThrottling,
      enableOffscreenRendering: false,
      webSecurity: false,
      experimentalFeatures: []
    }

    this.windowOptimizations.set(windowId, settings)
  }

  /**
   * Setup comprehensive IPC monitoring and optimization
   */
  private setupIPCMonitoring(): void {
    const originalHandle = ipcMain.handle.bind(ipcMain)
    const originalOn = ipcMain.on.bind(ipcMain)

    // Wrap ipcMain.handle for monitoring
    ipcMain.handle = (channel: string, listener: any) => {
      const wrappedListener = async (event: any, ...args: any[]) => {
        const startTime = performance.now()
        this.ipcMetrics.messageCount++

        try {
          const result = await listener(event, ...args)
          const duration = performance.now() - startTime
          this.ipcMetrics.responseTimeSum += duration

          // Log slow IPC calls
          if (duration > 100) {
            logger.warn('Slow IPC call detected', 'ElectronOptimizer', {
              channel,
              duration: Math.round(duration),
              args: args.length
            })
          }

          return result
        } catch (error) {
          this.ipcMetrics.errorCount++
          logger.error('IPC call failed', 'ElectronOptimizer', { channel, error })
          throw error
        }
      }

      return originalHandle(channel, wrappedListener)
    }

    // Wrap ipcMain.on for monitoring
    ipcMain.on = (channel: string, listener: any) => {
      const wrappedListener = (event: any, ...args: any[]) => {
        this.ipcMetrics.messageCount++
        try {
          return listener(event, ...args)
        } catch (error) {
          this.ipcMetrics.errorCount++
          logger.error('IPC listener failed', 'ElectronOptimizer', { channel, error })
        }
      }

      return originalOn(channel, wrappedListener)
    }

    logger.info('IPC monitoring setup completed', 'ElectronOptimizer')
  }

  /**
   * Setup power management optimization
   */
  private setupPowerManagement(): void {
    if (!powerMonitor) {
      logger.warn('Power monitor not available', 'ElectronOptimizer')
      return
    }

    powerMonitor.on('suspend', () => {
      logger.info('System suspended, applying power optimizations', 'ElectronOptimizer')
      this.applyPowerSaveMode(true)
    })

    powerMonitor.on('resume', () => {
      logger.info('System resumed, restoring performance mode', 'ElectronOptimizer')
      this.applyPowerSaveMode(false)
    })

    powerMonitor.on('on-ac', () => {
      logger.info('AC power connected', 'ElectronOptimizer')
      this.applyPowerSaveMode(false)
    })

    powerMonitor.on('on-battery', () => {
      logger.info('Battery power detected', 'ElectronOptimizer')
      this.applyPowerSaveMode(true)
    })

    // Check initial power state
    app.whenReady().then(() => {
      const onBattery = powerMonitor.isOnBatteryPower?.() || false
      if (onBattery || this.config.powerSaveMode) {
        this.applyPowerSaveMode(true)
      }
    })

    logger.info('Power management setup completed', 'ElectronOptimizer')
  }

  /**
   * Apply power save mode optimizations
   */
  private applyPowerSaveMode(enable: boolean): void {
    const windows = BrowserWindow.getAllWindows()

    for (const window of windows) {
      if (enable) {
        // Reduce refresh rate, disable animations, etc.
        window.webContents
          .executeJavaScript(
            `
          if (window.powerSaveMode) window.powerSaveMode(true);
          document.body.classList.add('power-save-mode');
        `
          )
          .catch(() => {})
      } else {
        // Restore full performance
        window.webContents
          .executeJavaScript(
            `
          if (window.powerSaveMode) window.powerSaveMode(false);
          document.body.classList.remove('power-save-mode');
        `
          )
          .catch(() => {})
      }
    }

    this.emit('power-mode-changed', enable)
  }

  /**
   * Setup window management optimization
   */
  private setupWindowManagement(): void {
    app.on('window-all-closed', () => {
      // Clean up optimizations
      this.backgroundWindowThrottle.clear()
      this.windowOptimizations.clear()
    })

    app.on('before-quit', () => {
      this.cleanup()
    })
  }

  /**
   * Throttle background window resources
   */
  private throttleBackgroundWindow(windowId: number): void {
    const throttleTimer = setTimeout(() => {
      const window = BrowserWindow.fromId(windowId)
      if (window && !window.isVisible()) {
        // Reduce background window resources
        window.webContents
          .executeJavaScript(
            `
          if (window.throttleBackground) window.throttleBackground(true);
        `
          )
          .catch(() => {})

        logger.debug('Throttled background window', 'ElectronOptimizer', { windowId })
      }
    }, 5000) // 5 second delay

    this.backgroundWindowThrottle.set(windowId, throttleTimer)
  }

  /**
   * Remove background throttling
   */
  private unthrottleBackgroundWindow(windowId: number): void {
    const throttleTimer = this.backgroundWindowThrottle.get(windowId)
    if (throttleTimer) {
      clearTimeout(throttleTimer)
      this.backgroundWindowThrottle.delete(windowId)
    }

    const window = BrowserWindow.fromId(windowId)
    if (window) {
      window.webContents
        .executeJavaScript(
          `
        if (window.throttleBackground) window.throttleBackground(false);
      `
        )
        .catch(() => {})

      logger.debug('Unthrottled window', 'ElectronOptimizer', { windowId })
    }
  }

  /**
   * Prioritize focused window resources
   */
  private prioritizeWindow(windowId: number): void {
    const window = BrowserWindow.fromId(windowId)
    if (window) {
      // Give priority to focused window
      window.webContents
        .executeJavaScript(
          `
        if (window.setPriority) window.setPriority('high');
      `
        )
        .catch(() => {})
    }
  }

  /**
   * Reduce priority for unfocused windows
   */
  private deprioritizeWindow(windowId: number): void {
    const window = BrowserWindow.fromId(windowId)
    if (window) {
      window.webContents
        .executeJavaScript(
          `
        if (window.setPriority) window.setPriority('normal');
      `
        )
        .catch(() => {})
    }
  }

  /**
   * Track window for performance monitoring
   */
  private trackWindow(window: BrowserWindow): void {
    const windowId = window.id

    // Monitor window events
    window.webContents.on('did-finish-load', () => {
      this.emit('window-loaded', windowId)
    })

    window.webContents.on('render-process-gone', (_, details) => {
      logger.error('Window renderer process gone', 'ElectronOptimizer', { windowId, details })
      this.emit('window-crashed', windowId)
    })

    window.webContents.on('unresponsive', () => {
      logger.warn('Window became unresponsive', 'ElectronOptimizer', { windowId })
      this.emit('window-unresponsive', windowId)
    })

    window.webContents.on('responsive', () => {
      logger.info('Window became responsive', 'ElectronOptimizer', { windowId })
      this.emit('window-responsive', windowId)
    })
  }

  /**
   * Remove window tracking
   */
  private untrackWindow(windowId: number): void {
    this.windowOptimizations.delete(windowId)
    this.unthrottleBackgroundWindow(windowId)
  }

  /**
   * Start comprehensive metrics collection
   */
  private startMetricsCollection(): void {
    this.metricsTimer = setInterval(() => {
      this.collectMetrics()
    }, 10000) // Every 10 seconds
  }

  /**
   * Collect system and app performance metrics
   */
  private collectMetrics(): void {
    try {
      // CPU metrics
      const cpuUsage = process.cpuUsage()

      // Memory metrics
      const memoryInfo = process.memoryUsage()

      // Window metrics
      const windows = BrowserWindow.getAllWindows().map(window => ({
        id: window.id,
        visible: window.isVisible(),
        focused: window.isFocused(),
        memoryUsage: 0, // Would need additional implementation
        cpuUsage: 0 // Would need additional implementation
      }))

      // IPC metrics
      const currentTime = Date.now()
      const timeElapsed = (currentTime - this.ipcMetrics.startTime) / 1000
      const messagesPerSecond = this.ipcMetrics.messageCount / timeElapsed
      const averageResponseTime =
        this.ipcMetrics.responseTimeSum / this.ipcMetrics.messageCount || 0
      const errorRate = (this.ipcMetrics.errorCount / this.ipcMetrics.messageCount) * 100 || 0

      this.metrics = {
        cpu: {
          usage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to ms
          loadAverage: [] // Not available in all platforms
        },
        memory: {
          total: memoryInfo.heapTotal,
          used: memoryInfo.heapUsed,
          available: memoryInfo.heapTotal - memoryInfo.heapUsed,
          percentage: (memoryInfo.heapUsed / memoryInfo.heapTotal) * 100
        },
        gpu: {
          enabled: !app.commandLine.hasSwitch('disable-gpu'),
          vendor: '',
          renderer: ''
        },
        windows,
        ipc: {
          totalMessages: this.ipcMetrics.messageCount,
          messagesPerSecond: Math.round(messagesPerSecond),
          averageResponseTime: Math.round(averageResponseTime * 100) / 100,
          errorRate: Math.round(errorRate * 100) / 100
        },
        processes: {
          main: process.pid,
          renderer: [], // Would need additional tracking
          utility: []
        }
      }

      // Check for performance issues
      this.checkPerformanceThresholds()

      // Emit metrics for external monitoring
      this.emit('metrics', this.metrics)
    } catch (error) {
      logger.error('Failed to collect metrics', 'ElectronOptimizer', { error })
    }
  }

  /**
   * Check if performance metrics exceed thresholds
   */
  private checkPerformanceThresholds(): void {
    const { memory, cpu } = this.metrics

    // Memory threshold check
    if (memory.percentage > this.config.memoryThreshold) {
      logger.warn('Memory usage high', 'ElectronOptimizer', {
        usage: Math.round(memory.percentage),
        threshold: this.config.memoryThreshold
      })

      this.emit('memory-warning', {
        usage: memory.percentage,
        threshold: this.config.memoryThreshold
      })

      // Trigger memory cleanup
      this.triggerMemoryCleanup()
    }

    // CPU threshold check
    if (cpu.usage > this.config.cpuThreshold) {
      logger.warn('CPU usage high', 'ElectronOptimizer', {
        usage: Math.round(cpu.usage),
        threshold: this.config.cpuThreshold
      })

      this.emit('cpu-warning', {
        usage: cpu.usage,
        threshold: this.config.cpuThreshold
      })
    }
  }

  /**
   * Trigger aggressive memory cleanup
   */
  private triggerMemoryCleanup(): void {
    logger.info('Triggering memory cleanup', 'ElectronOptimizer')

    const windows = BrowserWindow.getAllWindows()

    for (const window of windows) {
      // Trigger garbage collection in renderer
      window.webContents
        .executeJavaScript(
          `
        if (window.gc) {
          window.gc();
        }
        if (window.triggerMemoryCleanup) {
          window.triggerMemoryCleanup();
        }
      `
        )
        .catch(() => {})
    }

    // Force main process GC if available
    if (global.gc) {
      global.gc()
    }

    this.emit('memory-cleanup-triggered')
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): ElectronPerformanceMetrics {
    return { ...this.metrics }
  }

  /**
   * Get optimization configuration
   */
  getConfig(): OptimizationConfig {
    return { ...this.config }
  }

  /**
   * Update optimization configuration
   */
  updateConfig(updates: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...updates }
    logger.info('Configuration updated', 'ElectronOptimizer', updates)

    // Apply changes that can be updated at runtime
    if (updates.powerSaveMode !== undefined) {
      this.applyPowerSaveMode(updates.powerSaveMode)
    }

    this.emit('config-updated', this.config)
  }

  /**
   * Force optimization of all windows and processes
   */
  async forceOptimization(): Promise<void> {
    logger.info('Starting forced optimization', 'ElectronOptimizer')

    try {
      // Optimize all windows
      const windows = BrowserWindow.getAllWindows()
      for (const window of windows) {
        await this.optimizeWindowResources(window)
      }

      // Trigger memory cleanup
      this.triggerMemoryCleanup()

      // Clear caches
      await this.clearApplicationCaches()

      logger.info('Forced optimization completed', 'ElectronOptimizer')
      this.emit('optimization-completed')
    } catch (error) {
      logger.error('Forced optimization failed', 'ElectronOptimizer', { error })
      throw error
    }
  }

  /**
   * Optimize resources for a specific window
   */
  private async optimizeWindowResources(window: BrowserWindow): Promise<void> {
    try {
      // Clear caches
      await window.webContents.session.clearCache()

      // Clear storage data for better performance
      await window.webContents.session.clearStorageData({
        storages: ['indexdb', 'websql']
      })

      // Trigger renderer optimization
      await window.webContents.executeJavaScript(`
        if (window.optimizeResources) {
          window.optimizeResources();
        }
      `)
    } catch (error) {
      logger.debug('Window optimization failed', 'ElectronOptimizer', {
        windowId: window.id,
        error
      })
    }
  }

  /**
   * Clear all application caches
   */
  private async clearApplicationCaches(): Promise<void> {
    const windows = BrowserWindow.getAllWindows()

    const clearPromises = windows.map(window =>
      window.webContents.session.clearCache().catch(() => {})
    )

    await Promise.all(clearPromises)
    logger.info('Application caches cleared', 'ElectronOptimizer')
  }

  /**
   * Setup cleanup handlers
   */
  private setupCleanupHandlers(): void {
    const cleanup = () => {
      this.cleanup()
    }

    process.on('exit', cleanup)
    process.on('SIGINT', cleanup)
    process.on('SIGTERM', cleanup)
    process.on('uncaughtException', error => {
      logger.error('Uncaught exception', 'ElectronOptimizer', { error })
      cleanup()
      process.exit(1)
    })
  }

  /**
   * Initialize empty metrics structure
   */
  private initializeMetrics(): ElectronPerformanceMetrics {
    return {
      cpu: { usage: 0, loadAverage: [] },
      memory: { total: 0, used: 0, available: 0, percentage: 0 },
      gpu: { enabled: false, vendor: '', renderer: '' },
      windows: [],
      ipc: { totalMessages: 0, messagesPerSecond: 0, averageResponseTime: 0, errorRate: 0 },
      processes: { main: 0, renderer: [], utility: [] }
    }
  }

  /**
   * Cleanup and destroy optimizer
   */
  cleanup(): void {
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer)
      this.metricsTimer = null
    }

    // Clear all window throttles
    for (const timer of this.backgroundWindowThrottle.values()) {
      clearTimeout(timer)
    }
    this.backgroundWindowThrottle.clear()

    // Clear optimizations
    this.windowOptimizations.clear()

    this.removeAllListeners()

    logger.info('Electron performance optimizer cleaned up', 'ElectronOptimizer')
  }
}

/**
 * Global instance factory
 */
export function createElectronOptimizer(
  config?: Partial<OptimizationConfig>
): ElectronPerformanceOptimizer {
  return new ElectronPerformanceOptimizer(config)
}
