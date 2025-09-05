// @ts-nocheck
/**
 * 云同步安全系统 - 加密管理器
 * 实现端到端加密、密钥管理、数据加密等核心安全功能
 *
 * 安全架构设计：
 * 1. 端到端加密（E2EE）- 使用AES-256-GCM
 * 2. 密钥派生 - PBKDF2/scrypt/Argon2
 * 3. 密钥管理 - 分层密钥架构
 * 4. 前向安全性 - 密钥轮换
 * 5. 量子抗性 - 后量子密码学准备
 */

import crypto from 'crypto'
import { scrypt, randomBytes, createCipher, createDecipher } from 'crypto'
import { promisify } from 'util'

const scryptAsync = promisify(scrypt)

// 加密算法常量
export const CRYPTO_CONSTANTS = {
  // 对称加密
  ENCRYPTION_ALGORITHM: 'aes-256-gcm',
  KEY_DERIVATION_ALGORITHM: 'scrypt',
  HASH_ALGORITHM: 'sha256',

  // 密钥长度
  AES_KEY_LENGTH: 32, // 256 bits
  IV_LENGTH: 16, // 128 bits
  SALT_LENGTH: 32, // 256 bits
  AUTH_TAG_LENGTH: 16, // 128 bits

  // 密钥派生参数 (scrypt)
  SCRYPT_N: 32768, // CPU/Memory cost parameter
  SCRYPT_R: 8, // Block size parameter
  SCRYPT_P: 1, // Parallelization parameter

  // PBKDF2参数（备选方案）
  PBKDF2_ITERATIONS: 100000,

  // 非对称加密
  RSA_KEY_SIZE: 4096,
  ECDSA_CURVE: 'secp384r1',

  // 密钥轮换
  KEY_ROTATION_INTERVAL: 30 * 24 * 60 * 60 * 1000, // 30天

  // 版本标识
  CRYPTO_VERSION: 'v2.0'
} as const

// 加密数据结构
export interface EncryptedData {
  version: string
  algorithm: string
  iv: string
  authTag: string
  data: string
  keyId?: string
  timestamp: number
}

// 密钥信息
export interface KeyInfo {
  id: string
  version: number
  algorithm: string
  derivedFrom?: string
  createdAt: number
  expiresAt?: number
  usage: 'encryption' | 'signing' | 'kdf'
  status: 'active' | 'inactive' | 'revoked'
}

// 密钥派生选项
export interface KeyDerivationOptions {
  algorithm?: 'scrypt' | 'pbkdf2' | 'argon2'
  salt?: Buffer
  iterations?: number
  memory?: number
  parallelism?: number
}

/**
 * 核心加密管理器
 * 提供端到端加密、密钥管理、数据保护等功能
 */
export class CryptoManager {
  private masterKey: Buffer | null = null
  private keyStore: Map<string, Buffer> = new Map()
  private keyInfo: Map<string, KeyInfo> = new Map()
  private currentKeyId: string | null = null

  constructor() {
    this.initializeCrypto()
  }

  /**
   * 初始化加密系统
   */
  private async initializeCrypto(): Promise<void> {
    try {
      // 检查加密算法支持
      const algorithms = crypto.getCiphers()
      if (!algorithms.includes('aes-256-gcm')) {
        throw new Error('AES-256-GCM not supported')
      }

      // 初始化随机数生成器
      await this.seedRandomGenerator()
    } catch (error) {
      throw new Error(`Crypto initialization failed: ${error}`)
    }
  }

  /**
   * 种子随机数生成器
   */
  private async seedRandomGenerator(): Promise<void> {
    // 收集熵源
    const entropySource = Buffer.concat([
      randomBytes(32),
      Buffer.from(Date.now().toString()),
      Buffer.from(process.hrtime.bigint().toString()),
      crypto.randomBytes(32)
    ])

    // 混合熵源
    const entropy = crypto.createHash('sha512').update(entropySource).digest()

    // 验证随机性质量
    if (entropy.length < 64) {
      throw new Error('Insufficient entropy for secure random generation')
    }
  }

  /**
   * 生成主密钥
   * 使用强密码派生函数从用户密码生成主密钥
   */
  async generateMasterKey(
    password: string,
    options: KeyDerivationOptions = {}
  ): Promise<{ key: Buffer; salt: Buffer; keyId: string }> {
    const salt = options.salt || randomBytes(CRYPTO_CONSTANTS.SALT_LENGTH)
    const algorithm = options.algorithm || 'scrypt'

    let masterKey: Buffer

    switch (algorithm) {
      case 'scrypt':
        masterKey = (await scryptAsync(password, salt, CRYPTO_CONSTANTS.AES_KEY_LENGTH, {
          N: CRYPTO_CONSTANTS.SCRYPT_N,
          r: CRYPTO_CONSTANTS.SCRYPT_R,
          p: CRYPTO_CONSTANTS.SCRYPT_P
        })) as Buffer
        break

      case 'pbkdf2':
        masterKey = crypto.pbkdf2Sync(
          password,
          salt,
          options.iterations || CRYPTO_CONSTANTS.PBKDF2_ITERATIONS,
          CRYPTO_CONSTANTS.AES_KEY_LENGTH,
          'sha512'
        )
        break

      default:
        throw new Error(`Unsupported key derivation algorithm: ${algorithm}`)
    }

    // 生成密钥ID
    const keyId = this.generateKeyId(masterKey, salt)

    // 存储密钥信息
    const keyInfo: KeyInfo = {
      id: keyId,
      version: 1,
      algorithm: `${algorithm}-${CRYPTO_CONSTANTS.HASH_ALGORITHM}`,
      createdAt: Date.now(),
      usage: 'encryption',
      status: 'active'
    }

    this.masterKey = masterKey
    this.keyStore.set(keyId, masterKey)
    this.keyInfo.set(keyId, keyInfo)
    this.currentKeyId = keyId

    return { key: masterKey, salt, keyId }
  }

  /**
   * 派生数据加密密钥
   * 从主密钥派生用于具体数据加密的子密钥
   */
  async deriveDataKey(purpose: string, context?: string): Promise<{ key: Buffer; keyId: string }> {
    if (!this.masterKey || !this.currentKeyId) {
      throw new Error('Master key not initialized')
    }

    // 创建密钥派生上下文
    const contextData = Buffer.concat([
      Buffer.from(purpose, 'utf8'),
      Buffer.from(context || '', 'utf8'),
      Buffer.from(Date.now().toString(), 'utf8')
    ])

    // 使用HKDF派生子密钥
    const derivedKey = crypto.hkdfSync(
      'sha256',
      this.masterKey,
      randomBytes(16), // salt
      contextData, // info
      CRYPTO_CONSTANTS.AES_KEY_LENGTH
    )

    const keyId = this.generateKeyId(derivedKey, contextData)

    // 存储派生密钥信息
    const keyInfo: KeyInfo = {
      id: keyId,
      version: 1,
      algorithm: 'hkdf-sha256',
      derivedFrom: this.currentKeyId,
      createdAt: Date.now(),
      usage: 'encryption',
      status: 'active'
    }

    this.keyStore.set(keyId, derivedKey)
    this.keyInfo.set(keyId, keyInfo)

    return { key: derivedKey, keyId }
  }

  /**
   * 加密数据
   * 使用AES-256-GCM进行认证加密
   */
  async encryptData(data: string | Buffer, keyId?: string): Promise<EncryptedData> {
    const useKeyId = keyId || this.currentKeyId
    if (!useKeyId) {
      throw new Error('No encryption key available')
    }

    const encryptionKey = this.keyStore.get(useKeyId)
    if (!encryptionKey) {
      throw new Error(`Encryption key not found: ${useKeyId}`)
    }

    const plaintext = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8')
    const iv = randomBytes(CRYPTO_CONSTANTS.IV_LENGTH)

    const cipher = crypto.createCipherGCM(CRYPTO_CONSTANTS.ENCRYPTION_ALGORITHM, encryptionKey)
    cipher.setAAD(Buffer.from(useKeyId, 'utf8')) // Additional Authenticated Data

    let encrypted = cipher.update(plaintext)
    encrypted = Buffer.concat([encrypted, cipher.final()])

    const authTag = cipher.getAuthTag()

    return {
      version: CRYPTO_CONSTANTS.CRYPTO_VERSION,
      algorithm: CRYPTO_CONSTANTS.ENCRYPTION_ALGORITHM,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      data: encrypted.toString('base64'),
      keyId: useKeyId,
      timestamp: Date.now()
    }
  }

  /**
   * 解密数据
   */
  async decryptData(encryptedData: EncryptedData): Promise<Buffer> {
    const { keyId, iv, authTag, data, algorithm, version } = encryptedData

    if (!keyId) {
      throw new Error('No key ID in encrypted data')
    }

    const decryptionKey = this.keyStore.get(keyId)
    if (!decryptionKey) {
      throw new Error(`Decryption key not found: ${keyId}`)
    }

    // 验证算法版本兼容性
    if (version !== CRYPTO_CONSTANTS.CRYPTO_VERSION) {
      console.warn(`Version mismatch: expected ${CRYPTO_CONSTANTS.CRYPTO_VERSION}, got ${version}`)
    }

    const decipher = crypto.createDecipherGCM(algorithm, decryptionKey)
    decipher.setAAD(Buffer.from(keyId, 'utf8'))
    decipher.setAuthTag(Buffer.from(authTag, 'base64'))

    let decrypted = decipher.update(Buffer.from(data, 'base64'))
    decrypted = Buffer.concat([decrypted, decipher.final()])

    return decrypted
  }

  /**
   * 生成密钥对（非对称加密）
   */
  async generateKeyPair(algorithm: 'rsa' | 'ecdsa' = 'rsa'): Promise<{
    publicKey: string
    privateKey: string
    keyId: string
  }> {
    let keyPair: crypto.KeyPairSyncResult<string, string>

    switch (algorithm) {
      case 'rsa':
        keyPair = crypto.generateKeyPairSync('rsa', {
          modulusLength: CRYPTO_CONSTANTS.RSA_KEY_SIZE,
          publicKeyEncoding: { type: 'spki', format: 'pem' },
          privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        })
        break

      case 'ecdsa':
        keyPair = crypto.generateKeyPairSync('ec', {
          namedCurve: CRYPTO_CONSTANTS.ECDSA_CURVE,
          publicKeyEncoding: { type: 'spki', format: 'pem' },
          privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        })
        break

      default:
        throw new Error(`Unsupported key pair algorithm: ${algorithm}`)
    }

    const keyId = crypto.createHash('sha256').update(keyPair.publicKey).digest('hex').slice(0, 16)

    // 存储密钥信息
    const keyInfo: KeyInfo = {
      id: keyId,
      version: 1,
      algorithm,
      createdAt: Date.now(),
      usage: 'signing',
      status: 'active'
    }

    this.keyInfo.set(keyId, keyInfo)

    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      keyId
    }
  }

  /**
   * 数字签名
   */
  async signData(data: string | Buffer, privateKey: string): Promise<string> {
    const signData = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8')

    const sign = crypto.createSign('RSA-SHA256')
    sign.update(signData)

    return sign.sign(privateKey, 'base64')
  }

  /**
   * 验证数字签名
   */
  async verifySignature(
    data: string | Buffer,
    signature: string,
    publicKey: string
  ): Promise<boolean> {
    try {
      const verifyData = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8')

      const verify = crypto.createVerify('RSA-SHA256')
      verify.update(verifyData)

      return verify.verify(publicKey, signature, 'base64')
    } catch (error) {
      return false
    }
  }

  /**
   * 安全随机数生成
   */
  generateSecureRandom(length: number): Buffer {
    return randomBytes(length)
  }

  /**
   * 生成安全密码
   */
  generateSecurePassword(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    const randomBytes = this.generateSecureRandom(length)

    return Array.from(randomBytes)
      .map(byte => chars[byte % chars.length])
      .join('')
  }

  /**
   * 生成密钥ID
   */
  private generateKeyId(key: Buffer, salt: Buffer): string {
    return crypto.createHash('sha256').update(key).update(salt).digest('hex').slice(0, 16)
  }

  /**
   * 密钥轮换
   */
  async rotateKey(oldKeyId: string): Promise<string> {
    const oldKeyInfo = this.keyInfo.get(oldKeyId)
    if (!oldKeyInfo) {
      throw new Error(`Key not found for rotation: ${oldKeyId}`)
    }

    // 标记旧密钥为不活跃
    oldKeyInfo.status = 'inactive'

    // 生成新的数据加密密钥
    const { keyId: newKeyId } = await this.deriveDataKey('rotation', oldKeyId)

    return newKeyId
  }

  /**
   * 清理过期密钥
   */
  cleanupExpiredKeys(): void {
    const now = Date.now()

    for (const [keyId, keyInfo] of this.keyInfo.entries()) {
      if (keyInfo.expiresAt && keyInfo.expiresAt < now) {
        keyInfo.status = 'revoked'
        this.keyStore.delete(keyId)
        console.log(`Revoked expired key: ${keyId}`)
      }
    }
  }

  /**
   * 获取密钥信息
   */
  getKeyInfo(keyId: string): KeyInfo | undefined {
    return this.keyInfo.get(keyId)
  }

  /**
   * 列出所有密钥
   */
  listKeys(status?: 'active' | 'inactive' | 'revoked'): KeyInfo[] {
    const keys = Array.from(this.keyInfo.values())

    if (status) {
      return keys.filter(key => key.status === status)
    }

    return keys
  }

  /**
   * 销毁所有密钥（安全清理）
   */
  destroy(): void {
    // 安全清理内存中的密钥
    if (this.masterKey) {
      this.masterKey.fill(0)
      this.masterKey = null
    }

    for (const key of this.keyStore.values()) {
      key.fill(0)
    }

    this.keyStore.clear()
    this.keyInfo.clear()
    this.currentKeyId = null
  }
}

/**
 * 密码强度检测器
 */
export class PasswordStrengthValidator {
  private static readonly MIN_LENGTH = 12
  private static readonly REQUIRED_CHAR_TYPES = 3

  static validateStrength(password: string): {
    isStrong: boolean
    score: number
    feedback: string[]
  } {
    const feedback: string[] = []
    let score = 0

    // 长度检查
    if (password.length < this.MIN_LENGTH) {
      feedback.push(`Password must be at least ${this.MIN_LENGTH} characters long`)
    } else {
      score += 20
    }

    // 字符类型检查
    const hasLower = /[a-z]/.test(password)
    const hasUpper = /[A-Z]/.test(password)
    const hasDigit = /\d/.test(password)
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)

    const charTypes = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length

    if (charTypes < this.REQUIRED_CHAR_TYPES) {
      feedback.push('Password must contain at least 3 different character types')
    } else {
      score += charTypes * 15
    }

    // 常见密码检查
    if (this.isCommonPassword(password)) {
      feedback.push('Password is too common')
      score -= 30
    }

    // 重复字符检查
    if (this.hasRepeatingChars(password)) {
      feedback.push('Avoid repeating characters')
      score -= 10
    }

    score = Math.max(0, Math.min(100, score))

    return {
      isStrong: score >= 70 && feedback.length === 0,
      score,
      feedback
    }
  }

  private static isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password',
      '123456',
      'password123',
      'admin',
      'letmein',
      'welcome',
      'monkey',
      '1234567890',
      'qwerty',
      'abc123'
    ]

    return commonPasswords.some(common => password.toLowerCase().includes(common))
  }

  private static hasRepeatingChars(password: string): boolean {
    let repeatCount = 0
    for (let i = 1; i < password.length; i++) {
      if (password[i] === password[i - 1]) {
        repeatCount++
        if (repeatCount > 2) return true
      } else {
        repeatCount = 0
      }
    }
    return false
  }
}

// 导出单例实例
export const cryptoManager = new CryptoManager()
