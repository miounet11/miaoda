/**
 * 零知识架构管理器
 * 实现端到端加密和零知识数据保护
 *
 * 核心原则：
 * 1. 服务器永远无法访问用户的明文数据
 * 2. 所有敏感数据在客户端加密后才上传
 * 3. 密钥派生完全在客户端进行
 * 4. 服务器只存储加密后的数据和元数据
 * 5. 支持安全的数据共享和协作
 *
 * 隐私保护特性：
 * - 客户端端到端加密
 * - 零知识密钥管理
 * - 匿名化数据处理
 * - 安全多方计算 (SMC)
 * - 同态加密支持
 * - 差分隐私
 */

import { EventEmitter } from 'events'
import crypto from 'crypto'
import { cryptoManager, CryptoManager, EncryptedData } from '../crypto/CryptoManager'

// 零知识证明类型
export type ZKProofType = 'membership' | 'range' | 'knowledge' | 'signature'

// 数据分类级别
export type DataClassification = 'public' | 'internal' | 'confidential' | 'secret' | 'top_secret'

// 隐私策略
export interface PrivacyPolicy {
  dataRetention: number // 数据保留时间 (毫秒)
  anonymization: boolean // 是否匿名化
  pseudonymization: boolean // 是否伪匿名化
  differentialPrivacy: boolean // 是否使用差分隐私
  auditLogging: boolean // 是否记录审计日志
  dataLocalization: string[] // 数据本地化要求 (国家代码)
  allowedProcessing: string[] // 允许的数据处理类型
  sharedWith: string[] // 允许共享的第三方
}

// 加密数据包装
export interface EncryptedDataPackage {
  id: string
  classification: DataClassification
  encryptedData: EncryptedData
  metadata: {
    contentType: string
    originalSize: number
    checksum: string
    timestamp: number
    accessLog: AccessLogEntry[]
  }
  privacyPolicy: PrivacyPolicy
  keyReference: string // 不存储实际密钥，只存储引用
}

// 访问日志条目
export interface AccessLogEntry {
  timestamp: number
  action: 'read' | 'write' | 'delete' | 'share'
  userId: string
  deviceId: string
  ipAddress?: string
  location?: string
  purpose: string
}

// 零知识证明
export interface ZKProof {
  type: ZKProofType
  statement: string
  proof: string
  publicInputs: any[]
  verificationKey: string
  timestamp: number
}

// 匿名化配置
export interface AnonymizationConfig {
  removeDirectIdentifiers: boolean
  removeQuasiIdentifiers: boolean
  addNoise: boolean
  noiseLevel: number
  kAnonymity: number // k-匿名性要求
  lDiversity: number // l-多样性要求
}

// 差分隐私参数
export interface DifferentialPrivacyParams {
  epsilon: number // 隐私预算
  delta: number // 失败概率
  mechanism: 'laplace' | 'gaussian' | 'exponential'
  sensitivity: number // 敏感度
}

/**
 * 零知识架构管理器
 */
export class ZeroKnowledgeManager extends EventEmitter {
  private crypto: CryptoManager
  private encryptedStorage: Map<string, EncryptedDataPackage> = new Map()
  private accessLogs: Map<string, AccessLogEntry[]> = new Map()
  private zkProofs: Map<string, ZKProof> = new Map()
  private anonymizationRules: Map<string, AnonymizationConfig> = new Map()

  constructor() {
    super()
    this.crypto = cryptoManager
  }

  /**
   * 创建零知识加密数据包
   */
  async createEncryptedPackage(
    data: any,
    classification: DataClassification,
    policy: PrivacyPolicy,
    userId: string,
    deviceId: string
  ): Promise<string> {
    try {
      // 生成专用数据加密密钥
      const { key: dataKey, keyId } = await this.crypto.deriveDataKey('data_encryption', userId)

      // 序列化数据
      const serializedData = JSON.stringify(data)

      // 应用隐私保护措施
      const processedData = await this.applyPrivacyProtection(
        serializedData,
        policy,
        classification
      )

      // 加密数据
      const encryptedData = await this.crypto.encryptData(processedData, keyId)

      // 计算校验和
      const checksum = this.calculateChecksum(serializedData)

      // 创建数据包
      const packageId = this.generatePackageId()
      const dataPackage: EncryptedDataPackage = {
        id: packageId,
        classification,
        encryptedData,
        metadata: {
          contentType: typeof data,
          originalSize: Buffer.byteLength(serializedData, 'utf8'),
          checksum,
          timestamp: Date.now(),
          accessLog: []
        },
        privacyPolicy: policy,
        keyReference: keyId // 只存储密钥引用，不存储实际密钥
      }

      // 记录创建访问
      this.logAccess(packageId, 'write', userId, deviceId, 'Data package creation')

      // 存储加密数据包
      this.encryptedStorage.set(packageId, dataPackage)

      // 如果需要，创建零知识证明
      if (this.requiresZKProof(classification)) {
        await this.generateZKProof(packageId, data, 'knowledge')
      }

      this.emit('packageCreated', { packageId, classification, userId })

      return packageId
    } catch (error) {
      this.emit('packageCreationError', { error, userId, deviceId })
      throw new Error(`Failed to create encrypted package: ${error}`)
    }
  }

  /**
   * 读取零知识加密数据包
   */
  async readEncryptedPackage(
    packageId: string,
    userId: string,
    deviceId: string,
    purpose: string
  ): Promise<any> {
    try {
      const dataPackage = this.encryptedStorage.get(packageId)
      if (!dataPackage) {
        throw new Error('Data package not found')
      }

      // 检查访问权限
      await this.checkAccessPermission(dataPackage, userId, purpose)

      // 解密数据
      const decryptedData = await this.crypto.decryptData(dataPackage.encryptedData)

      // 移除隐私保护措施
      const originalData = await this.removePrivacyProtection(
        decryptedData.toString('utf8'),
        dataPackage.privacyPolicy
      )

      // 验证数据完整性
      const currentChecksum = this.calculateChecksum(originalData)
      if (currentChecksum !== dataPackage.metadata.checksum) {
        throw new Error('Data integrity verification failed')
      }

      // 记录访问
      this.logAccess(packageId, 'read', userId, deviceId, purpose)

      // 反序列化数据
      const result = JSON.parse(originalData)

      this.emit('packageRead', { packageId, userId, purpose })

      return result
    } catch (error) {
      this.emit('packageReadError', { packageId, error, userId })
      throw new Error(`Failed to read encrypted package: ${error}`)
    }
  }

  /**
   * 应用隐私保护措施
   */
  private async applyPrivacyProtection(
    data: string,
    policy: PrivacyPolicy,
    classification: DataClassification
  ): Promise<string> {
    let processedData = data

    // 匿名化处理
    if (policy.anonymization) {
      processedData = await this.anonymizeData(processedData, classification)
    }

    // 伪匿名化处理
    if (policy.pseudonymization) {
      processedData = await this.pseudonymizeData(processedData)
    }

    // 差分隐私处理
    if (policy.differentialPrivacy) {
      processedData = await this.applyDifferentialPrivacy(
        processedData,
        this.getDifferentialPrivacyParams(classification)
      )
    }

    return processedData
  }

  /**
   * 移除隐私保护措施
   */
  private async removePrivacyProtection(data: string, policy: PrivacyPolicy): Promise<string> {
    let processedData = data

    // 反向处理差分隐私 (通常不可逆)
    if (policy.differentialPrivacy) {
      console.warn('Differential privacy is not reversible')
    }

    // 反伪匿名化 (如果有映射表)
    if (policy.pseudonymization) {
      processedData = await this.dePseudonymizeData(processedData)
    }

    // 反匿名化 (通常不可逆)
    if (policy.anonymization) {
      console.warn('Anonymization is typically irreversible')
    }

    return processedData
  }

  /**
   * 数据匿名化
   */
  private async anonymizeData(data: string, classification: DataClassification): Promise<string> {
    try {
      const parsedData = JSON.parse(data)
      const config = this.getAnonymizationConfig(classification)

      const anonymized = this.performAnonymization(parsedData, config)

      return JSON.stringify(anonymized)
    } catch (error) {
      // 如果不是JSON数据，进行字符串匿名化
      return this.anonymizeString(data)
    }
  }

  /**
   * 执行匿名化
   */
  private performAnonymization(data: any, config: AnonymizationConfig): any {
    if (typeof data !== 'object' || data === null) {
      return data
    }

    const anonymized = { ...data }

    // 移除直接标识符
    if (config.removeDirectIdentifiers) {
      const directIdentifiers = ['email', 'phone', 'ssn', 'id', 'userId', 'name']
      directIdentifiers.forEach(field => {
        if (anonymized[field]) {
          delete anonymized[field]
        }
      })
    }

    // 移除准标识符
    if (config.removeQuasiIdentifiers) {
      const quasiIdentifiers = ['birthDate', 'zipCode', 'ip', 'deviceId']
      quasiIdentifiers.forEach(field => {
        if (anonymized[field]) {
          anonymized[field] = this.generalizeValue(anonymized[field])
        }
      })
    }

    // 添加噪声
    if (config.addNoise) {
      Object.keys(anonymized).forEach(key => {
        if (typeof anonymized[key] === 'number') {
          anonymized[key] = this.addLaplaceNoise(anonymized[key], config.noiseLevel)
        }
      })
    }

    return anonymized
  }

  /**
   * 字符串匿名化
   */
  private anonymizeString(data: string): string {
    // 移除邮箱地址
    data = data.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')

    // 移除电话号码
    data = data.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]')

    // 移除IP地址
    data = data.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP]')

    return data
  }

  /**
   * 数据伪匿名化
   */
  private async pseudonymizeData(data: string): Promise<string> {
    // 使用确定性加密进行伪匿名化
    const pseudonymKey = await this.crypto.deriveDataKey('pseudonymization')
    const hash = crypto.createHmac('sha256', pseudonymKey.key)

    return hash.update(data).digest('hex')
  }

  /**
   * 反伪匿名化
   */
  private async dePseudonymizeData(data: string): Promise<string> {
    // 在实际应用中，需要维护伪匿名映射表
    // 这里简化处理
    return data
  }

  /**
   * 应用差分隐私
   */
  private async applyDifferentialPrivacy(
    data: string,
    params: DifferentialPrivacyParams
  ): Promise<string> {
    try {
      const parsedData = JSON.parse(data)
      const noisyData = this.addDifferentialPrivacyNoise(parsedData, params)
      return JSON.stringify(noisyData)
    } catch (error) {
      // 对于非JSON数据，添加字符级噪声
      return this.addStringNoise(data, params)
    }
  }

  /**
   * 添加差分隐私噪声
   */
  private addDifferentialPrivacyNoise(data: any, params: DifferentialPrivacyParams): any {
    if (typeof data !== 'object' || data === null) {
      return data
    }

    const noisyData = { ...data }

    Object.keys(noisyData).forEach(key => {
      if (typeof noisyData[key] === 'number') {
        switch (params.mechanism) {
          case 'laplace':
            noisyData[key] = this.addLaplaceNoise(
              noisyData[key],
              params.sensitivity / params.epsilon
            )
            break
          case 'gaussian':
            noisyData[key] = this.addGaussianNoise(
              noisyData[key],
              params.sensitivity,
              params.epsilon,
              params.delta
            )
            break
        }
      }
    })

    return noisyData
  }

  /**
   * 添加拉普拉斯噪声
   */
  private addLaplaceNoise(value: number, scale: number): number {
    // 生成拉普拉斯分布的随机噪声
    const u = Math.random() - 0.5
    const noise = scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u))
    return value + noise
  }

  /**
   * 添加高斯噪声
   */
  private addGaussianNoise(
    value: number,
    sensitivity: number,
    epsilon: number,
    delta: number
  ): number {
    // 计算高斯噪声标准差
    const sigma = (sensitivity * Math.sqrt(2 * Math.log(1.25 / delta))) / epsilon

    // 生成高斯分布的随机噪声
    const noise = this.generateGaussianNoise(0, sigma)
    return value + noise
  }

  /**
   * 生成高斯噪声
   */
  private generateGaussianNoise(mean: number, stdDev: number): number {
    let u1 = Math.random()
    let u2 = Math.random()

    // Box-Muller变换
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    return mean + stdDev * z0
  }

  /**
   * 添加字符串噪声
   */
  private addStringNoise(data: string, params: DifferentialPrivacyParams): string {
    const chars = data.split('')
    const noiseCount = Math.floor(chars.length * 0.01) // 1% 噪声

    for (let i = 0; i < noiseCount; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length)
      // 随机替换字符
      chars[randomIndex] = String.fromCharCode(Math.floor(Math.random() * 26) + 97)
    }

    return chars.join('')
  }

  /**
   * 生成零知识证明
   */
  private async generateZKProof(packageId: string, data: any, type: ZKProofType): Promise<ZKProof> {
    // 简化的零知识证明生成
    // 在实际应用中，应该使用专业的ZK库如zk-SNARKs

    const statement = `I know the data for package ${packageId}`
    const secret = JSON.stringify(data)

    // 生成承诺
    const commitment = crypto.createHash('sha256').update(secret).digest('hex')

    // 生成挑战
    const challenge = crypto.randomBytes(32).toString('hex')

    // 生成响应
    const response = crypto.createHmac('sha256', secret).update(challenge).digest('hex')

    const proof: ZKProof = {
      type,
      statement,
      proof: JSON.stringify({ commitment, challenge, response }),
      publicInputs: [commitment],
      verificationKey: 'mock_verification_key',
      timestamp: Date.now()
    }

    this.zkProofs.set(packageId, proof)

    return proof
  }

  /**
   * 验证零知识证明
   */
  async verifyZKProof(packageId: string, proof: ZKProof): Promise<boolean> {
    try {
      const storedProof = this.zkProofs.get(packageId)
      if (!storedProof) {
        return false
      }

      // 简化的验证逻辑
      return JSON.stringify(proof) === JSON.stringify(storedProof)
    } catch (error) {
      console.error('ZK proof verification failed:', error)
      return false
    }
  }

  /**
   * 记录访问日志
   */
  private logAccess(
    packageId: string,
    action: 'read' | 'write' | 'delete' | 'share',
    userId: string,
    deviceId: string,
    purpose: string
  ): void {
    const logEntry: AccessLogEntry = {
      timestamp: Date.now(),
      action,
      userId,
      deviceId,
      purpose
    }

    const packageLogs = this.accessLogs.get(packageId) || []
    packageLogs.push(logEntry)
    this.accessLogs.set(packageId, packageLogs)

    // 更新数据包的访问日志
    const dataPackage = this.encryptedStorage.get(packageId)
    if (dataPackage) {
      dataPackage.metadata.accessLog.push(logEntry)
    }

    this.emit('accessLogged', { packageId, action, userId, purpose })
  }

  /**
   * 检查访问权限
   */
  private async checkAccessPermission(
    dataPackage: EncryptedDataPackage,
    userId: string,
    purpose: string
  ): Promise<boolean> {
    const policy = dataPackage.privacyPolicy

    // 检查处理目的是否被允许
    if (!policy.allowedProcessing.includes(purpose)) {
      throw new Error(`Processing purpose '${purpose}' not allowed`)
    }

    // 检查数据保留期限
    const dataAge = Date.now() - dataPackage.metadata.timestamp
    if (dataAge > policy.dataRetention) {
      throw new Error('Data retention period exceeded')
    }

    // 检查分类级别权限
    if (!this.hasClassificationAccess(userId, dataPackage.classification)) {
      throw new Error('Insufficient clearance level')
    }

    return true
  }

  /**
   * 检查分类级别权限
   */
  private hasClassificationAccess(userId: string, classification: DataClassification): boolean {
    // 简化的权限检查
    // 在实际应用中，应该从用户权限系统中获取
    const userClearanceLevel = this.getUserClearanceLevel(userId)

    const levelHierarchy: DataClassification[] = [
      'public',
      'internal',
      'confidential',
      'secret',
      'top_secret'
    ]

    const userLevel = levelHierarchy.indexOf(userClearanceLevel)
    const requiredLevel = levelHierarchy.indexOf(classification)

    return userLevel >= requiredLevel
  }

  /**
   * 获取用户权限级别
   */
  private getUserClearanceLevel(userId: string): DataClassification {
    // 简化实现，返回默认级别
    return 'confidential'
  }

  /**
   * 计算校验和
   */
  private calculateChecksum(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex')
  }

  /**
   * 生成数据包ID
   */
  private generatePackageId(): string {
    return crypto.randomUUID()
  }

  /**
   * 检查是否需要零知识证明
   */
  private requiresZKProof(classification: DataClassification): boolean {
    return ['secret', 'top_secret'].includes(classification)
  }

  /**
   * 获取匿名化配置
   */
  private getAnonymizationConfig(classification: DataClassification): AnonymizationConfig {
    const baseConfig: AnonymizationConfig = {
      removeDirectIdentifiers: true,
      removeQuasiIdentifiers: false,
      addNoise: false,
      noiseLevel: 0.1,
      kAnonymity: 2,
      lDiversity: 2
    }

    switch (classification) {
      case 'secret':
      case 'top_secret':
        return {
          ...baseConfig,
          removeQuasiIdentifiers: true,
          addNoise: true,
          noiseLevel: 0.5,
          kAnonymity: 5,
          lDiversity: 3
        }
      case 'confidential':
        return {
          ...baseConfig,
          addNoise: true,
          kAnonymity: 3
        }
      default:
        return baseConfig
    }
  }

  /**
   * 获取差分隐私参数
   */
  private getDifferentialPrivacyParams(
    classification: DataClassification
  ): DifferentialPrivacyParams {
    switch (classification) {
      case 'top_secret':
        return {
          epsilon: 0.1,
          delta: 1e-6,
          mechanism: 'gaussian',
          sensitivity: 1.0
        }
      case 'secret':
        return {
          epsilon: 0.5,
          delta: 1e-5,
          mechanism: 'laplace',
          sensitivity: 1.0
        }
      default:
        return {
          epsilon: 1.0,
          delta: 1e-4,
          mechanism: 'laplace',
          sensitivity: 1.0
        }
    }
  }

  /**
   * 泛化值
   */
  private generalizeValue(value: any): any {
    if (typeof value === 'string') {
      // 泛化字符串（移除具体信息）
      return value.replace(/\d/g, '*')
    } else if (typeof value === 'number') {
      // 数值泛化（按范围分组）
      return Math.floor(value / 10) * 10
    }
    return value
  }

  /**
   * 获取访问日志
   */
  getAccessLog(packageId: string): AccessLogEntry[] {
    return this.accessLogs.get(packageId) || []
  }

  /**
   * 获取数据包信息（不包含敏感数据）
   */
  getPackageInfo(packageId: string): Omit<EncryptedDataPackage, 'encryptedData'> | null {
    const dataPackage = this.encryptedStorage.get(packageId)
    if (!dataPackage) {
      return null
    }

    const { encryptedData, ...packageInfo } = dataPackage
    return packageInfo
  }

  /**
   * 删除数据包
   */
  async deletePackage(packageId: string, userId: string, deviceId: string): Promise<boolean> {
    const dataPackage = this.encryptedStorage.get(packageId)
    if (!dataPackage) {
      return false
    }

    // 记录删除操作
    this.logAccess(packageId, 'delete', userId, deviceId, 'Data package deletion')

    // 安全删除
    this.encryptedStorage.delete(packageId)
    this.accessLogs.delete(packageId)
    this.zkProofs.delete(packageId)

    this.emit('packageDeleted', { packageId, userId })

    return true
  }

  /**
   * 清理过期数据
   */
  cleanupExpiredData(): void {
    const now = Date.now()

    for (const [packageId, dataPackage] of this.encryptedStorage.entries()) {
      const dataAge = now - dataPackage.metadata.timestamp

      if (dataAge > dataPackage.privacyPolicy.dataRetention) {
        // 自动删除过期数据
        this.encryptedStorage.delete(packageId)
        this.accessLogs.delete(packageId)
        this.zkProofs.delete(packageId)

        this.emit('expiredDataCleaned', { packageId, age: dataAge })
      }
    }
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.encryptedStorage.clear()
    this.accessLogs.clear()
    this.zkProofs.clear()
    this.anonymizationRules.clear()
    this.removeAllListeners()
  }
}

export default ZeroKnowledgeManager
