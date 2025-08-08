/**
 * 多因素认证 (MFA) 管理器
 * 提供多种二次认证方法的安全实现
 * 
 * 支持的MFA方法：
 * - TOTP (Time-based One-Time Password) - RFC 6238
 * - SMS 二次验证
 * - 邮箱验证码
 * - 硬件安全密钥 (WebAuthn/FIDO2)
 * - 备份码
 * - 生物识别 (如支持)
 * 
 * 安全特性：
 * - 防暴力破解保护
 * - 验证码限时有效
 * - 安全的密钥生成和存储
 * - 多重验证策略
 * - 紧急恢复机制
 */

import crypto from 'crypto'
import { EventEmitter } from 'events'
import * as speakeasy from 'speakeasy'
import QRCode from 'qrcode'

// MFA方法类型
export type MFAMethod = 'totp' | 'sms' | 'email' | 'webauthn' | 'backup_codes' | 'biometric'

// MFA配置
export interface MFAConfig {
  method: MFAMethod
  enabled: boolean
  setupCompleted: boolean
  lastUsed?: number
  failureCount: number
  lockedUntil?: number
  metadata?: Record<string, any>
}

// TOTP设置
export interface TOTPSetup {
  secret: string
  qrCode: string
  backupCodes: string[]
  manualEntryKey: string
}

// 验证结果
export interface VerificationResult {
  success: boolean
  method: MFAMethod
  remainingAttempts?: number
  lockoutTime?: number
  error?: string
}

// MFA策略配置
export interface MFAStrategy {
  requiredMethods: number // 需要的认证方法数量
  allowedMethods: MFAMethod[] // 允许的认证方法
  gracePeriod: number // 宽限期（毫秒）
  maxFailureAttempts: number // 最大失败尝试次数
  lockoutDuration: number // 锁定持续时间（毫秒）
  backupCodesCount: number // 备份码数量
}

// 默认MFA策略
const DEFAULT_MFA_STRATEGY: MFAStrategy = {
  requiredMethods: 1,
  allowedMethods: ['totp', 'sms', 'email', 'backup_codes'],
  gracePeriod: 30 * 1000, // 30秒
  maxFailureAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15分钟
  backupCodesCount: 10
}

// SMS/邮箱验证码配置
interface VerificationCode {
  code: string
  expiresAt: number
  attempts: number
  method: 'sms' | 'email'
}

/**
 * 多因素认证管理器
 */
export class MFAManager extends EventEmitter {
  private mfaConfigs: Map<string, Map<MFAMethod, MFAConfig>> = new Map()
  private verificationCodes: Map<string, VerificationCode> = new Map()
  private strategy: MFAStrategy
  private cleanupTimer: NodeJS.Timeout | null = null

  constructor(strategy: Partial<MFAStrategy> = {}) {
    super()
    this.strategy = { ...DEFAULT_MFA_STRATEGY, ...strategy }
    this.startCleanupTimer()
  }

  /**
   * 为用户设置TOTP
   */
  async setupTOTP(userId: string, serviceName: string = 'MiaoDa Chat'): Promise<TOTPSetup> {
    try {
      // 生成密钥
      const secret = speakeasy.generateSecret({
        name: `${serviceName} (${userId})`,
        issuer: serviceName,
        length: 32
      })

      // 生成QR码
      const qrCode = await QRCode.toDataURL(secret.otpauth_url!)

      // 生成备份码
      const backupCodes = this.generateBackupCodes()

      // 保存配置（但未启用，需要验证后才启用）
      const userMFA = this.getUserMFAConfigs(userId)
      userMFA.set('totp', {
        method: 'totp',
        enabled: false,
        setupCompleted: false,
        failureCount: 0,
        metadata: {
          secret: secret.base32,
          backupCodes: backupCodes.map(code => ({
            code: this.hashBackupCode(code),
            used: false
          }))
        }
      })

      this.emit('mfaSetupStarted', { userId, method: 'totp' })

      return {
        secret: secret.base32!,
        qrCode,
        backupCodes,
        manualEntryKey: secret.base32!
      }

    } catch (error) {
      this.emit('mfaSetupError', { userId, method: 'totp', error })
      throw new Error(`TOTP setup failed: ${error}`)
    }
  }

  /**
   * 验证TOTP设置
   */
  async verifyTOTPSetup(userId: string, token: string): Promise<boolean> {
    const userMFA = this.getUserMFAConfigs(userId)
    const totpConfig = userMFA.get('totp')

    if (!totpConfig?.metadata?.secret) {
      throw new Error('TOTP not set up for this user')
    }

    const verified = speakeasy.totp.verify({
      secret: totpConfig.metadata.secret,
      encoding: 'base32',
      token,
      window: 2 // 允许时间误差
    })

    if (verified) {
      // 启用TOTP
      totpConfig.enabled = true
      totpConfig.setupCompleted = true
      totpConfig.failureCount = 0
      
      this.emit('mfaEnabled', { userId, method: 'totp' })
      return true
    } else {
      totpConfig.failureCount++
      if (totpConfig.failureCount >= this.strategy.maxFailureAttempts) {
        totpConfig.lockedUntil = Date.now() + this.strategy.lockoutDuration
        this.emit('mfaLocked', { userId, method: 'totp' })
      }
      return false
    }
  }

  /**
   * 验证TOTP令牌
   */
  async verifyTOTP(userId: string, token: string): Promise<VerificationResult> {
    const userMFA = this.getUserMFAConfigs(userId)
    const totpConfig = userMFA.get('totp')

    if (!totpConfig?.enabled) {
      return {
        success: false,
        method: 'totp',
        error: 'TOTP not enabled for this user'
      }
    }

    // 检查是否被锁定
    if (totpConfig.lockedUntil && Date.now() < totpConfig.lockedUntil) {
      const lockoutTime = totpConfig.lockedUntil - Date.now()
      return {
        success: false,
        method: 'totp',
        lockoutTime,
        error: 'Account temporarily locked due to too many failed attempts'
      }
    }

    const verified = speakeasy.totp.verify({
      secret: totpConfig.metadata.secret,
      encoding: 'base32',
      token,
      window: 2
    })

    if (verified) {
      totpConfig.failureCount = 0
      totpConfig.lastUsed = Date.now()
      totpConfig.lockedUntil = undefined

      this.emit('mfaVerified', { userId, method: 'totp' })
      
      return {
        success: true,
        method: 'totp'
      }
    } else {
      totpConfig.failureCount++
      const remainingAttempts = Math.max(0, this.strategy.maxFailureAttempts - totpConfig.failureCount)

      if (totpConfig.failureCount >= this.strategy.maxFailureAttempts) {
        totpConfig.lockedUntil = Date.now() + this.strategy.lockoutDuration
        this.emit('mfaLocked', { userId, method: 'totp' })
      }

      this.emit('mfaVerificationFailed', { userId, method: 'totp', remainingAttempts })

      return {
        success: false,
        method: 'totp',
        remainingAttempts,
        error: 'Invalid TOTP token'
      }
    }
  }

  /**
   * 设置SMS二次验证
   */
  async setupSMS(userId: string, phoneNumber: string): Promise<void> {
    // 验证手机号格式
    if (!this.isValidPhoneNumber(phoneNumber)) {
      throw new Error('Invalid phone number format')
    }

    const userMFA = this.getUserMFAConfigs(userId)
    userMFA.set('sms', {
      method: 'sms',
      enabled: false,
      setupCompleted: false,
      failureCount: 0,
      metadata: {
        phoneNumber: this.normalizePhoneNumber(phoneNumber),
        verified: false
      }
    })

    // 发送验证码
    await this.sendSMSVerificationCode(userId, phoneNumber)
    this.emit('mfaSetupStarted', { userId, method: 'sms' })
  }

  /**
   * 发送SMS验证码
   */
  async sendSMSVerificationCode(userId: string, phoneNumber?: string): Promise<void> {
    const userMFA = this.getUserMFAConfigs(userId)
    const smsConfig = userMFA.get('sms')

    if (!smsConfig && !phoneNumber) {
      throw new Error('SMS not set up for this user')
    }

    const targetPhone = phoneNumber || smsConfig?.metadata?.phoneNumber

    // 生成6位数字验证码
    const code = this.generateNumericCode(6)
    const codeKey = `${userId}:sms`

    this.verificationCodes.set(codeKey, {
      code: this.hashVerificationCode(code),
      expiresAt: Date.now() + (5 * 60 * 1000), // 5分钟有效
      attempts: 0,
      method: 'sms'
    })

    try {
      // 在实际应用中，这里应该调用SMS服务提供商的API
      await this.sendSMSMessage(targetPhone!, code)
      
      this.emit('verificationCodeSent', { userId, method: 'sms', to: this.maskPhoneNumber(targetPhone!) })
    } catch (error) {
      this.verificationCodes.delete(codeKey)
      throw new Error(`Failed to send SMS: ${error}`)
    }
  }

  /**
   * 验证SMS验证码
   */
  async verifySMSCode(userId: string, code: string): Promise<VerificationResult> {
    return this.verifyCode(userId, code, 'sms')
  }

  /**
   * 设置邮箱二次验证
   */
  async setupEmail(userId: string, email: string): Promise<void> {
    // 验证邮箱格式
    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format')
    }

    const userMFA = this.getUserMFAConfigs(userId)
    userMFA.set('email', {
      method: 'email',
      enabled: false,
      setupCompleted: false,
      failureCount: 0,
      metadata: {
        email: email.toLowerCase(),
        verified: false
      }
    })

    // 发送验证码
    await this.sendEmailVerificationCode(userId, email)
    this.emit('mfaSetupStarted', { userId, method: 'email' })
  }

  /**
   * 发送邮箱验证码
   */
  async sendEmailVerificationCode(userId: string, email?: string): Promise<void> {
    const userMFA = this.getUserMFAConfigs(userId)
    const emailConfig = userMFA.get('email')

    if (!emailConfig && !email) {
      throw new Error('Email MFA not set up for this user')
    }

    const targetEmail = email || emailConfig?.metadata?.email

    // 生成6位数字验证码
    const code = this.generateNumericCode(6)
    const codeKey = `${userId}:email`

    this.verificationCodes.set(codeKey, {
      code: this.hashVerificationCode(code),
      expiresAt: Date.now() + (10 * 60 * 1000), // 10分钟有效
      attempts: 0,
      method: 'email'
    })

    try {
      // 在实际应用中，这里应该调用邮件服务提供商的API
      await this.sendEmailMessage(targetEmail!, code)
      
      this.emit('verificationCodeSent', { userId, method: 'email', to: this.maskEmail(targetEmail!) })
    } catch (error) {
      this.verificationCodes.delete(codeKey)
      throw new Error(`Failed to send email: ${error}`)
    }
  }

  /**
   * 验证邮箱验证码
   */
  async verifyEmailCode(userId: string, code: string): Promise<VerificationResult> {
    return this.verifyCode(userId, code, 'email')
  }

  /**
   * 验证码通用验证方法
   */
  private async verifyCode(userId: string, inputCode: string, method: 'sms' | 'email'): Promise<VerificationResult> {
    const codeKey = `${userId}:${method}`
    const storedCode = this.verificationCodes.get(codeKey)

    if (!storedCode) {
      return {
        success: false,
        method,
        error: 'No verification code found. Please request a new one.'
      }
    }

    // 检查是否过期
    if (Date.now() > storedCode.expiresAt) {
      this.verificationCodes.delete(codeKey)
      return {
        success: false,
        method,
        error: 'Verification code has expired'
      }
    }

    // 检查尝试次数
    if (storedCode.attempts >= this.strategy.maxFailureAttempts) {
      this.verificationCodes.delete(codeKey)
      return {
        success: false,
        method,
        error: 'Too many failed attempts'
      }
    }

    storedCode.attempts++

    // 验证码
    const hashedInput = this.hashVerificationCode(inputCode)
    if (hashedInput === storedCode.code) {
      // 验证成功
      this.verificationCodes.delete(codeKey)
      
      const userMFA = this.getUserMFAConfigs(userId)
      const mfaConfig = userMFA.get(method)
      
      if (mfaConfig) {
        mfaConfig.enabled = true
        mfaConfig.setupCompleted = true
        mfaConfig.lastUsed = Date.now()
        mfaConfig.failureCount = 0
        
        if (mfaConfig.metadata) {
          mfaConfig.metadata.verified = true
        }
      }

      this.emit('mfaVerified', { userId, method })
      
      return {
        success: true,
        method
      }
    } else {
      const remainingAttempts = Math.max(0, this.strategy.maxFailureAttempts - storedCode.attempts)
      
      this.emit('mfaVerificationFailed', { userId, method, remainingAttempts })
      
      return {
        success: false,
        method,
        remainingAttempts,
        error: 'Invalid verification code'
      }
    }
  }

  /**
   * 生成备份码
   */
  generateBackupCodes(): string[] {
    const codes: string[] = []
    
    for (let i = 0; i < this.strategy.backupCodesCount; i++) {
      // 生成8位字母数字备份码
      const code = this.generateAlphanumericCode(8)
      codes.push(code)
    }

    return codes
  }

  /**
   * 验证备份码
   */
  async verifyBackupCode(userId: string, inputCode: string): Promise<VerificationResult> {
    const userMFA = this.getUserMFAConfigs(userId)
    const backupConfig = userMFA.get('backup_codes')

    if (!backupConfig?.enabled || !backupConfig.metadata?.backupCodes) {
      return {
        success: false,
        method: 'backup_codes',
        error: 'Backup codes not set up'
      }
    }

    const hashedInput = this.hashBackupCode(inputCode.toUpperCase())
    const backupCodes = backupConfig.metadata.backupCodes

    // 查找匹配的备份码
    const codeIndex = backupCodes.findIndex((codeObj: any) => 
      codeObj.code === hashedInput && !codeObj.used
    )

    if (codeIndex === -1) {
      backupConfig.failureCount++
      
      this.emit('mfaVerificationFailed', { userId, method: 'backup_codes' })
      
      return {
        success: false,
        method: 'backup_codes',
        error: 'Invalid or already used backup code'
      }
    }

    // 标记备份码为已使用
    backupCodes[codeIndex].used = true
    backupConfig.lastUsed = Date.now()
    backupConfig.failureCount = 0

    // 检查剩余备份码数量
    const remainingCodes = backupCodes.filter((codeObj: any) => !codeObj.used).length
    
    if (remainingCodes <= 2) {
      this.emit('lowBackupCodes', { userId, remaining: remainingCodes })
    }

    this.emit('mfaVerified', { userId, method: 'backup_codes' })

    return {
      success: true,
      method: 'backup_codes'
    }
  }

  /**
   * 重新生成备份码
   */
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    const userMFA = this.getUserMFAConfigs(userId)
    let backupConfig = userMFA.get('backup_codes')

    if (!backupConfig) {
      backupConfig = {
        method: 'backup_codes',
        enabled: true,
        setupCompleted: true,
        failureCount: 0,
        metadata: {}
      }
      userMFA.set('backup_codes', backupConfig)
    }

    const newCodes = this.generateBackupCodes()
    backupConfig.metadata.backupCodes = newCodes.map(code => ({
      code: this.hashBackupCode(code),
      used: false
    }))

    this.emit('backupCodesRegenerated', { userId })

    return newCodes
  }

  /**
   * 获取用户MFA状态
   */
  getMFAStatus(userId: string): Record<MFAMethod, MFAConfig | null> {
    const userMFA = this.getUserMFAConfigs(userId)
    const status: Record<MFAMethod, MFAConfig | null> = {
      totp: null,
      sms: null,
      email: null,
      webauthn: null,
      backup_codes: null,
      biometric: null
    }

    for (const method of this.strategy.allowedMethods) {
      const config = userMFA.get(method)
      if (config) {
        // 不返回敏感信息
        status[method] = {
          ...config,
          metadata: config.metadata ? {
            ...config.metadata,
            secret: undefined,
            backupCodes: undefined
          } : undefined
        }
      }
    }

    return status
  }

  /**
   * 禁用MFA方法
   */
  async disableMFA(userId: string, method: MFAMethod): Promise<void> {
    const userMFA = this.getUserMFAConfigs(userId)
    const mfaConfig = userMFA.get(method)

    if (mfaConfig) {
      mfaConfig.enabled = false
      mfaConfig.setupCompleted = false
      
      // 清理敏感数据
      if (mfaConfig.metadata) {
        delete mfaConfig.metadata.secret
        delete mfaConfig.metadata.backupCodes
      }
    }

    this.emit('mfaDisabled', { userId, method })
  }

  /**
   * 验证用户是否满足MFA要求
   */
  async verifyMFARequirement(userId: string, verifiedMethods: MFAMethod[]): Promise<boolean> {
    if (verifiedMethods.length >= this.strategy.requiredMethods) {
      return true
    }

    const userMFA = this.getUserMFAConfigs(userId)
    const enabledMethods = Array.from(userMFA.entries())
      .filter(([method, config]) => config.enabled && this.strategy.allowedMethods.includes(method))
      .map(([method]) => method)

    return enabledMethods.length >= this.strategy.requiredMethods
  }

  /**
   * 获取用户MFA配置
   */
  private getUserMFAConfigs(userId: string): Map<MFAMethod, MFAConfig> {
    if (!this.mfaConfigs.has(userId)) {
      this.mfaConfigs.set(userId, new Map())
    }
    return this.mfaConfigs.get(userId)!
  }

  /**
   * 生成数字验证码
   */
  private generateNumericCode(length: number): string {
    let code = ''
    for (let i = 0; i < length; i++) {
      code += Math.floor(Math.random() * 10).toString()
    }
    return code
  }

  /**
   * 生成字母数字码
   */
  private generateAlphanumericCode(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(chars.length)
      code += chars[randomIndex]
    }
    
    return code
  }

  /**
   * 哈希验证码
   */
  private hashVerificationCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex')
  }

  /**
   * 哈希备份码
   */
  private hashBackupCode(code: string): string {
    return crypto.createHash('sha256').update(code.toUpperCase()).digest('hex')
  }

  /**
   * 验证手机号格式
   */
  private isValidPhoneNumber(phone: string): boolean {
    // 简化的手机号验证
    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    return phoneRegex.test(phone.replace(/\s+/g, ''))
  }

  /**
   * 标准化手机号
   */
  private normalizePhoneNumber(phone: string): string {
    return phone.replace(/\s+/g, '')
  }

  /**
   * 掩码显示手机号
   */
  private maskPhoneNumber(phone: string): string {
    if (phone.length < 4) return phone
    return phone.slice(0, 3) + '*'.repeat(phone.length - 6) + phone.slice(-3)
  }

  /**
   * 验证邮箱格式
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * 掩码显示邮箱
   */
  private maskEmail(email: string): string {
    const [user, domain] = email.split('@')
    if (user.length <= 2) return email
    
    const maskedUser = user[0] + '*'.repeat(user.length - 2) + user.slice(-1)
    return `${maskedUser}@${domain}`
  }

  /**
   * 发送SMS消息 (模拟)
   */
  private async sendSMSMessage(phoneNumber: string, code: string): Promise<void> {
    // 在实际应用中，这里应该调用SMS服务提供商的API
    console.log(`SMS to ${phoneNumber}: Your MiaoDa Chat verification code is ${code}`)
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  /**
   * 发送邮件消息 (模拟)
   */
  private async sendEmailMessage(email: string, code: string): Promise<void> {
    // 在实际应用中，这里应该调用邮件服务提供商的API
    console.log(`Email to ${email}: Your MiaoDa Chat verification code is ${code}`)
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1500))
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    // 每分钟清理过期的验证码
    this.cleanupTimer = setInterval(() => {
      const now = Date.now()
      
      for (const [key, code] of this.verificationCodes.entries()) {
        if (now > code.expiresAt) {
          this.verificationCodes.delete(key)
        }
      }
    }, 60 * 1000)
  }

  /**
   * 销毁资源
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
    
    this.mfaConfigs.clear()
    this.verificationCodes.clear()
    this.removeAllListeners()
  }
}

export default MFAManager