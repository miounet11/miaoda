// @ts-nocheck
/**
 * Secure Plugin Wrapper
 * Implements security controls and sandboxing for plugins
 */

import { PluginManifest, Plugin, PluginAPI } from '../plugins/types'
import { EventEmitter } from 'events'
import { createHash, randomBytes } from 'crypto'
import { performance } from 'perf_hooks'

export interface SecurityPolicy {
  allowedAPIs: string[]
  maxMemoryUsage: number // MB
  maxExecutionTime: number // milliseconds
  networkAccess: boolean
  fileSystemAccess: boolean
  ipcAccess: boolean
  maxEventListeners: number
}

export interface PluginMetrics {
  memoryUsage: number
  cpuTime: number
  apiCalls: number
  eventsFired: number
  lastActivity: number
}

const DEFAULT_SECURITY_POLICY: SecurityPolicy = {
  allowedAPIs: ['workspace', 'messages'],
  maxMemoryUsage: 50, // 50MB
  maxExecutionTime: 5000, // 5 seconds
  networkAccess: false,
  fileSystemAccess: false,
  ipcAccess: true,
  maxEventListeners: 10
}

/**
 * Secure wrapper that sandboxes plugin execution
 */
export class SecurePluginWrapper extends EventEmitter {
  private plugin: Plugin
  private policy: SecurityPolicy
  private metrics: PluginMetrics
  private apiProxy: PluginAPI
  private executionContext: any
  private isActive = false
  private sessionId: string

  constructor(plugin: Plugin, policy?: Partial<SecurityPolicy>) {
    super()
    this.plugin = plugin
    this.policy = { ...DEFAULT_SECURITY_POLICY, ...policy }
    this.sessionId = this.generateSessionId()
    this.metrics = this.initializeMetrics()
    this.apiProxy = this.createSecureAPIProxy()

    // Set max listeners based on security policy
    this.setMaxListeners(this.policy.maxEventListeners)
  }

  private generateSessionId(): string {
    return createHash('sha256')
      .update(`${this.plugin.manifest.id}-${Date.now()}-${randomBytes(16).toString('hex')}`)
      .digest('hex')
      .substring(0, 16)
  }

  private initializeMetrics(): PluginMetrics {
    return {
      memoryUsage: 0,
      cpuTime: 0,
      apiCalls: 0,
      eventsFired: 0,
      lastActivity: Date.now()
    }
  }

  /**
   * Create a secured API proxy with access controls
   */
  private createSecureAPIProxy(): PluginAPI {
    const originalAPI = this.plugin.api

    return new Proxy(originalAPI, {
      get: (target, property, receiver) => {
        const propName = String(property)

        // Check if API is allowed
        if (!this.policy.allowedAPIs.includes(propName)) {
          throw new Error(
            `Plugin ${this.plugin.manifest.id} does not have permission to access '${propName}'`
          )
        }

        // Track API usage
        this.metrics.apiCalls++
        this.metrics.lastActivity = Date.now()

        const value = Reflect.get(target, property, receiver)

        // Wrap functions with security checks
        if (typeof value === 'function') {
          return (...args: any[]) => {
            return this.executeWithSecurity(() => value.apply(target, args), propName)
          }
        }

        // Wrap objects with nested proxies
        if (typeof value === 'object' && value !== null) {
          return this.createSecureObjectProxy(value)
        }

        return value
      },

      set: () => {
        throw new Error(`Plugin ${this.plugin.manifest.id} cannot modify API objects`)
      },

      deleteProperty: () => {
        throw new Error(`Plugin ${this.plugin.manifest.id} cannot delete API properties`)
      }
    })
  }

  private createSecureObjectProxy(obj: any): any {
    return new Proxy(obj, {
      get: (target, property) => {
        const value = target[property]
        if (typeof value === 'function') {
          return (...args: any[]) => {
            return this.executeWithSecurity(() => value.apply(target, args), String(property))
          }
        }
        return value
      },
      set: () => {
        throw new Error(`Plugin ${this.plugin.manifest.id} cannot modify API objects`)
      }
    })
  }

  /**
   * Execute plugin code with security controls
   */
  private async executeWithSecurity<T>(fn: () => T | Promise<T>, operation: string): Promise<T> {
    if (!this.isActive) {
      throw new Error(`Plugin ${this.plugin.manifest.id} is not active`)
    }

    const startTime = performance.now()
    const initialMemory = process.memoryUsage().heapUsed

    try {
      // Create execution timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              `Plugin ${this.plugin.manifest.id} execution timeout for operation '${operation}'`
            )
          )
        }, this.policy.maxExecutionTime)
      })

      // Execute with timeout
      const result = (await Promise.race([Promise.resolve(fn()), timeoutPromise])) as T

      // Update metrics
      const executionTime = performance.now() - startTime
      const memoryUsed = process.memoryUsage().heapUsed - initialMemory

      this.metrics.cpuTime += executionTime
      this.metrics.memoryUsage = Math.max(this.metrics.memoryUsage, memoryUsed / 1024 / 1024) // Convert to MB
      this.metrics.lastActivity = Date.now()

      // Check memory limits
      if (this.metrics.memoryUsage > this.policy.maxMemoryUsage) {
        this.emit('security-violation', {
          type: 'memory-limit',
          plugin: this.plugin.manifest.id,
          current: this.metrics.memoryUsage,
          limit: this.policy.maxMemoryUsage
        })
        throw new Error(`Plugin ${this.plugin.manifest.id} exceeded memory limit`)
      }

      return result
    } catch (error) {
      this.emit('execution-error', {
        plugin: this.plugin.manifest.id,
        operation,
        error: error.message,
        sessionId: this.sessionId
      })
      throw error
    }
  }

  /**
   * Activate the plugin with security initialization
   */
  async activate(): Promise<void> {
    try {
      // Validate plugin manifest
      this.validateManifest()

      // Initialize plugin in secure context
      if (this.plugin.activate) {
        await this.executeWithSecurity(() => this.plugin.activate!(this.apiProxy), 'activate')
      }

      this.isActive = true
      this.emit('activated', { plugin: this.plugin.manifest.id, sessionId: this.sessionId })
    } catch (error) {
      this.emit('activation-failed', {
        plugin: this.plugin.manifest.id,
        error: error.message,
        sessionId: this.sessionId
      })
      throw error
    }
  }

  /**
   * Deactivate the plugin and cleanup resources
   */
  async deactivate(): Promise<void> {
    try {
      if (this.plugin.deactivate) {
        await this.executeWithSecurity(() => this.plugin.deactivate!(), 'deactivate')
      }

      this.isActive = false
      this.removeAllListeners()

      this.emit('deactivated', { plugin: this.plugin.manifest.id, sessionId: this.sessionId })
    } catch (error) {
      this.emit('deactivation-error', {
        plugin: this.plugin.manifest.id,
        error: error.message,
        sessionId: this.sessionId
      })
    }
  }

  /**
   * Validate plugin manifest for security issues
   */
  private validateManifest(): void {
    const manifest = this.plugin.manifest

    // Required fields validation
    const requiredFields = ['id', 'name', 'version', 'main', 'permissions']
    for (const field of requiredFields) {
      if (!manifest[field as keyof PluginManifest]) {
        throw new Error(`Plugin manifest missing required field: ${field}`)
      }
    }

    // Validate ID format (alphanumeric and dashes only)
    if (!/^[a-zA-Z0-9\-_]+$/.test(manifest.id)) {
      throw new Error('Plugin ID contains invalid characters')
    }

    // Validate version format
    if (!/^\d+\.\d+\.\d+/.test(manifest.version)) {
      throw new Error('Invalid plugin version format')
    }

    // Check for suspicious permissions
    const dangerousPermissions = ['system', 'network', 'filesystem']
    if (manifest.permissions?.some(perm => dangerousPermissions.includes(perm))) {
      console.warn(
        `Plugin ${manifest.id} requests dangerous permissions:`,
        manifest.permissions.filter(perm => dangerousPermissions.includes(perm))
      )
    }

    // Validate entry point
    if (typeof manifest.main !== 'string' || manifest.main.includes('..')) {
      throw new Error('Invalid plugin entry point')
    }
  }

  /**
   * Get current plugin metrics
   */
  getMetrics(): PluginMetrics & { sessionId: string } {
    return {
      ...this.metrics,
      sessionId: this.sessionId
    }
  }

  /**
   * Get plugin security policy
   */
  getSecurityPolicy(): SecurityPolicy {
    return { ...this.policy }
  }

  /**
   * Update security policy (requires plugin restart)
   */
  updateSecurityPolicy(newPolicy: Partial<SecurityPolicy>): void {
    if (this.isActive) {
      throw new Error('Cannot update security policy while plugin is active')
    }
    this.policy = { ...this.policy, ...newPolicy }
  }

  /**
   * Check if plugin is healthy (not violating limits)
   */
  isHealthy(): boolean {
    const now = Date.now()
    const isResponsive = now - this.metrics.lastActivity < 60000 // 1 minute
    const withinMemoryLimit = this.metrics.memoryUsage <= this.policy.maxMemoryUsage

    return this.isActive && isResponsive && withinMemoryLimit
  }

  /**
   * Force stop plugin (emergency shutdown)
   */
  forceStop(): void {
    try {
      this.isActive = false
      this.removeAllListeners()
      this.emit('force-stopped', {
        plugin: this.plugin.manifest.id,
        sessionId: this.sessionId,
        reason: 'Security violation or manual intervention'
      })
    } catch (error) {
      console.error(`Error force stopping plugin ${this.plugin.manifest.id}:`, error)
    }
  }

  /**
   * Get plugin information
   */
  getPlugin(): Plugin {
    return this.plugin
  }

  /**
   * Check if plugin is active
   */
  getIsActive(): boolean {
    return this.isActive
  }
}

/**
 * Security audit logger for plugin activities
 */
export class PluginSecurityAuditor extends EventEmitter {
  private auditLog: Array<{
    timestamp: number
    pluginId: string
    sessionId: string
    event: string
    details: any
  }> = []

  constructor() {
    super()
  }

  logEvent(pluginId: string, sessionId: string, event: string, details: any): void {
    const entry = {
      timestamp: Date.now(),
      pluginId,
      sessionId,
      event,
      details
    }

    this.auditLog.push(entry)

    // Keep only last 1000 entries
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000)
    }

    this.emit('audit-event', entry)

    // Log security violations
    if (event.includes('security-violation') || event.includes('error')) {
      console.warn(`[PLUGIN SECURITY] ${pluginId}:`, entry)
    }
  }

  getAuditLog(pluginId?: string): typeof this.auditLog {
    if (pluginId) {
      return this.auditLog.filter(entry => entry.pluginId === pluginId)
    }
    return [...this.auditLog]
  }

  clearAuditLog(): void {
    this.auditLog = []
  }
}

export const pluginSecurityAuditor = new PluginSecurityAuditor()
