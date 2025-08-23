/**
 * Secure Store Service
 * Provides encrypted storage for sensitive data like API keys
 * Uses electron-store with CryptoManager for encryption
 */

import Store from 'electron-store'
import { app } from 'electron'
import { cryptoManager, type EncryptedData } from './crypto/CryptoManager'

export interface SecureStoreConfig {
  encryptionKey?: string
  name?: string
  cwd?: string
}

export interface StoredValue {
  encrypted: EncryptedData
  keyId: string
  createdAt: number
  updatedAt: number
}

/**
 * Secure store that encrypts sensitive data before persisting
 */
export class SecureStore {
  private store: Store<Record<string, StoredValue>>
  private isInitialized = false
  private masterPasswordHash: string | null = null

  constructor(config: SecureStoreConfig = {}) {
    // Configure electron-store
    this.store = new Store({
      name: config.name || 'secure-storage',
      cwd: config.cwd || app.getPath('userData'),
      encryptionKey: undefined, // We'll handle encryption ourselves
      serialize: JSON.stringify,
      deserialize: JSON.parse,
      clearInvalidConfig: true
    })
  }

  /**
   * Initialize the secure store with a master password
   */
  async initialize(masterPassword: string): Promise<void> {
    try {
      // Generate/derive master key from password
      const { keyId } = await cryptoManager.generateMasterKey(masterPassword)
      this.masterPasswordHash = keyId
      this.isInitialized = true

      console.log('SecureStore initialized successfully')
    } catch (error) {
      throw new Error(`Failed to initialize SecureStore: ${error}`)
    }
  }

  /**
   * Check if store is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.masterPasswordHash !== null
  }

  /**
   * Store an encrypted value
   */
  async set(key: string, value: string): Promise<void> {
    if (!this.isReady()) {
      throw new Error('SecureStore not initialized. Call initialize() first.')
    }

    try {
      // Encrypt the value using crypto manager
      const encrypted = await cryptoManager.encryptData(value)

      // Store encrypted data with metadata
      const storedValue: StoredValue = {
        encrypted,
        keyId: encrypted.keyId || this.masterPasswordHash!,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      this.store.set(key, storedValue)
    } catch (error) {
      throw new Error(`Failed to store encrypted value: ${error}`)
    }
  }

  /**
   * Retrieve and decrypt a value
   */
  async get(key: string): Promise<string | null> {
    if (!this.isReady()) {
      throw new Error('SecureStore not initialized. Call initialize() first.')
    }

    try {
      const storedValue = this.store.get(key)
      if (!storedValue) {
        return null
      }

      // Decrypt the value
      const decryptedBuffer = await cryptoManager.decryptData(storedValue.encrypted)
      return decryptedBuffer.toString('utf8')
    } catch (error) {
      console.error(`Failed to decrypt value for key "${key}":`, error)
      return null
    }
  }

  /**
   * Check if a key exists
   */
  has(key: string): boolean {
    return this.store.has(key)
  }

  /**
   * Delete a key
   */
  delete(key: string): void {
    this.store.delete(key)
  }

  /**
   * Clear all stored data
   */
  clear(): void {
    this.store.clear()
  }

  /**
   * Get all keys (not decrypted values)
   */
  keys(): string[] {
    return Object.keys(this.store.store)
  }

  /**
   * Get metadata for a stored value
   */
  getMetadata(key: string): Pick<StoredValue, 'keyId' | 'createdAt' | 'updatedAt'> | null {
    const storedValue = this.store.get(key)
    if (!storedValue) {
      return null
    }

    return {
      keyId: storedValue.keyId,
      createdAt: storedValue.createdAt,
      updatedAt: storedValue.updatedAt
    }
  }

  /**
   * Update an existing value (preserves createdAt)
   */
  async update(key: string, value: string): Promise<void> {
    if (!this.isReady()) {
      throw new Error('SecureStore not initialized. Call initialize() first.')
    }

    const existing = this.store.get(key)
    const createdAt = existing?.createdAt || Date.now()

    try {
      const encrypted = await cryptoManager.encryptData(value)

      const storedValue: StoredValue = {
        encrypted,
        keyId: encrypted.keyId || this.masterPasswordHash!,
        createdAt,
        updatedAt: Date.now()
      }

      this.store.set(key, storedValue)
    } catch (error) {
      throw new Error(`Failed to update encrypted value: ${error}`)
    }
  }

  /**
   * Import/export functionality for backup
   */
  async export(): Promise<Record<string, StoredValue>> {
    return { ...this.store.store }
  }

  async import(data: Record<string, StoredValue>, overwrite = false): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      if (!overwrite && this.has(key)) {
        continue
      }
      this.store.set(key, value)
    }
  }

  /**
   * Validate master password by attempting to decrypt existing data
   */
  async validatePassword(password: string): Promise<boolean> {
    try {
      // Try to generate the same key as during initialization
      const { keyId } = await cryptoManager.generateMasterKey(password)

      // Try to decrypt any existing data to validate
      const keys = this.keys()
      if (keys.length === 0) {
        return true // No data to validate against
      }

      // Try to decrypt the first available key
      const testKey = keys[0]
      const testValue = await this.get(testKey)
      return testValue !== null
    } catch (error) {
      return false
    }
  }

  /**
   * Change master password (re-encrypts all data)
   */
  async changeMasterPassword(oldPassword: string, newPassword: string): Promise<void> {
    if (!(await this.validatePassword(oldPassword))) {
      throw new Error('Invalid old password')
    }

    // Backup all decrypted data
    const backup: Record<string, string> = {}
    const keys = this.keys()

    for (const key of keys) {
      const value = await this.get(key)
      if (value !== null) {
        backup[key] = value
      }
    }

    // Clear and reinitialize with new password
    this.clear()
    await this.initialize(newPassword)

    // Re-encrypt and store all data
    for (const [key, value] of Object.entries(backup)) {
      await this.set(key, value)
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.isInitialized = false
    this.masterPasswordHash = null
  }
}

/**
 * Specialized secure store for API keys
 */
export class APIKeyStore extends SecureStore {
  constructor() {
    super({
      name: 'api-keys'
    })
  }

  /**
   * Store API key for a provider
   */
  async setAPIKey(provider: string, apiKey: string): Promise<void> {
    return this.set(`apikey:${provider}`, apiKey)
  }

  /**
   * Get API key for a provider
   */
  async getAPIKey(provider: string): Promise<string | null> {
    return this.get(`apikey:${provider}`)
  }

  /**
   * Delete API key for a provider
   */
  deleteAPIKey(provider: string): void {
    return this.delete(`apikey:${provider}`)
  }

  /**
   * List all providers with stored API keys
   */
  getProviders(): string[] {
    return this.keys()
      .filter(key => key.startsWith('apikey:'))
      .map(key => key.replace('apikey:', ''))
  }

  /**
   * Check if provider has API key stored
   */
  hasAPIKey(provider: string): boolean {
    return this.has(`apikey:${provider}`)
  }
}

// Export singleton instances
export const secureStore = new SecureStore()
export const apiKeyStore = new APIKeyStore()
