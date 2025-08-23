/**
 * GDPR/CCPA 合规性管理器
 * 实现数据保护法规的合规要求
 *
 * GDPR 合规特性：
 * - 数据主体权利实施
 * - 同意管理
 * - 数据处理记录
 * - 数据泄露通知
 * - 隐私影响评估
 * - 数据保护官指定
 *
 * CCPA 合规特性：
 * - 消费者权利实施
 * - 选择退出机制
 * - 数据销售披露
 * - 非歧视政策
 */

import { EventEmitter } from 'events'
import { ZeroKnowledgeManager } from '../privacy/ZeroKnowledgeManager'

// 数据主体权利类型
export type DataSubjectRight =
  | 'access' // 访问权 (GDPR Art. 15)
  | 'rectification' // 更正权 (GDPR Art. 16)
  | 'erasure' // 删除权/"被遗忘权" (GDPR Art. 17)
  | 'restrict' // 限制处理权 (GDPR Art. 18)
  | 'portability' // 数据可携权 (GDPR Art. 20)
  | 'object' // 反对权 (GDPR Art. 21)
  | 'withdraw_consent' // 撤回同意权
  | 'know' // 知情权 (CCPA)
  | 'delete_ccpa' // 删除权 (CCPA)
  | 'opt_out' // 选择退出权 (CCPA)
  | 'non_discrimination' // 非歧视权 (CCPA)

// 同意状态
export type ConsentStatus = 'given' | 'withdrawn' | 'expired' | 'pending'

// 处理目的
export type ProcessingPurpose =
  | 'contract_performance'
  | 'legal_obligation'
  | 'vital_interests'
  | 'public_task'
  | 'legitimate_interests'
  | 'consent'
  | 'marketing'
  | 'analytics'
  | 'security'

// 法律基础
export type LegalBasis =
  | 'consent' // 同意 (GDPR Art. 6(1)(a))
  | 'contract' // 合同 (GDPR Art. 6(1)(b))
  | 'legal_obligation' // 法律义务 (GDPR Art. 6(1)(c))
  | 'vital_interests' // 重要利益 (GDPR Art. 6(1)(d))
  | 'public_task' // 公共任务 (GDPR Art. 6(1)(e))
  | 'legitimate_interests' // 合法利益 (GDPR Art. 6(1)(f))

// 同意记录
export interface ConsentRecord {
  id: string
  userId: string
  purpose: ProcessingPurpose
  legalBasis: LegalBasis
  status: ConsentStatus
  givenAt?: number
  withdrawnAt?: number
  expiresAt?: number
  ipAddress?: string
  userAgent?: string
  consentString: string // IAB TCF格式
  version: string
  granular: boolean
  metadata: Record<string, any>
}

// 数据处理记录
export interface ProcessingRecord {
  id: string
  controllerName: string
  controllerContact: string
  dpoContact?: string
  purposes: ProcessingPurpose[]
  legalBasis: LegalBasis[]
  dataCategories: string[]
  dataSubjectCategories: string[]
  recipients: string[]
  thirdCountryTransfers: string[]
  retentionPeriod: number
  securityMeasures: string[]
  timestamp: number
  userId?: string
  dataPackageId?: string
}

// 数据主体请求
export interface DataSubjectRequest {
  id: string
  userId: string
  requestType: DataSubjectRight
  requestedAt: number
  completedAt?: number
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  reason?: string
  verificationMethod: string
  verifiedAt?: number
  responseData?: any
  responseFormat: 'json' | 'pdf' | 'csv' | 'xml'
  deliveryMethod: 'email' | 'portal' | 'mail'
  notes?: string
}

// 数据泄露记录
export interface DataBreachRecord {
  id: string
  reportedAt: number
  discoveredAt: number
  containedAt?: number
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  affectedDataTypes: string[]
  affectedUsers: number
  notificationRequired: boolean
  supervisoryAuthorityNotified: boolean
  dataSubjectsNotified: boolean
  remedialActions: string[]
  rootCause: string
  preventiveMeasures: string[]
  status: 'open' | 'investigating' | 'contained' | 'resolved'
}

// 隐私影响评估
export interface PrivacyImpactAssessment {
  id: string
  processingActivityId: string
  conductedAt: number
  conductedBy: string
  reviewedBy?: string
  description: string
  necessity: string
  proportionality: string
  riskAssessment: {
    identifiedRisks: string[]
    riskLevel: 'low' | 'medium' | 'high'
    mitigationMeasures: string[]
    residualRisk: 'low' | 'medium' | 'high'
  }
  consultation?: {
    dpoConsulted: boolean
    dataSubjectsConsulted: boolean
    consultationNotes: string
  }
  decision: 'approved' | 'rejected' | 'requires_consultation'
  reviewDate: number
}

// CCPA 特定配置
export interface CCPAConfig {
  businessName: string
  businessAddress: string
  businessContact: string
  doNotSellEnabled: boolean
  saleOptOutMechanism: string[]
  categoryDisclosure: Record<string, string[]>
  sourceDisclosure: Record<string, string[]>
  purposeDisclosure: Record<string, string[]>
}

/**
 * GDPR/CCPA 合规性管理器
 */
export class GDPRComplianceManager extends EventEmitter {
  private consentRecords: Map<string, ConsentRecord> = new Map()
  private processingRecords: Map<string, ProcessingRecord> = new Map()
  private subjectRequests: Map<string, DataSubjectRequest> = new Map()
  private breachRecords: Map<string, DataBreachRecord> = new Map()
  private privacyAssessments: Map<string, PrivacyImpactAssessment> = new Map()
  private ccpaConfig?: CCPAConfig
  private zkManager: ZeroKnowledgeManager

  constructor(zkManager: ZeroKnowledgeManager, ccpaConfig?: CCPAConfig) {
    super()
    this.zkManager = zkManager
    this.ccpaConfig = ccpaConfig
  }

  /**
   * 记录用户同意
   */
  async recordConsent(
    userId: string,
    purposes: ProcessingPurpose[],
    legalBasis: LegalBasis[],
    consentDetails: {
      ipAddress?: string
      userAgent?: string
      granular?: boolean
      metadata?: Record<string, any>
    } = {}
  ): Promise<string> {
    const consentId = this.generateConsentId()
    const now = Date.now()

    const consentRecord: ConsentRecord = {
      id: consentId,
      userId,
      purpose: purposes[0], // 简化为单一目的
      legalBasis: legalBasis[0], // 简化为单一法律基础
      status: 'given',
      givenAt: now,
      expiresAt: now + 365 * 24 * 60 * 60 * 1000, // 1年后过期
      ipAddress: consentDetails.ipAddress,
      userAgent: consentDetails.userAgent,
      consentString: this.generateConsentString(purposes, legalBasis),
      version: '1.0',
      granular: consentDetails.granular || false,
      metadata: consentDetails.metadata || {}
    }

    this.consentRecords.set(consentId, consentRecord)

    // 记录处理活动
    await this.recordProcessingActivity({
      controllerName: 'MiaoDa Chat',
      controllerContact: 'privacy@miaodachat.com',
      purposes,
      legalBasis,
      dataCategories: ['chat_messages', 'user_preferences'],
      dataSubjectCategories: ['users'],
      recipients: [],
      thirdCountryTransfers: [],
      retentionPeriod: 365 * 24 * 60 * 60 * 1000,
      securityMeasures: ['encryption', 'access_control', 'audit_logging'],
      userId
    })

    this.emit('consentRecorded', { consentId, userId, purposes })

    return consentId
  }

  /**
   * 撤回同意
   */
  async withdrawConsent(userId: string, purpose: ProcessingPurpose): Promise<boolean> {
    let consentWithdrawn = false

    for (const [consentId, consent] of this.consentRecords.entries()) {
      if (consent.userId === userId && consent.purpose === purpose && consent.status === 'given') {
        consent.status = 'withdrawn'
        consent.withdrawnAt = Date.now()
        consentWithdrawn = true

        this.emit('consentWithdrawn', { consentId, userId, purpose })
      }
    }

    if (consentWithdrawn) {
      // 停止基于同意的数据处理
      await this.stopConsentBasedProcessing(userId, purpose)
    }

    return consentWithdrawn
  }

  /**
   * 检查同意有效性
   */
  checkConsentValidity(userId: string, purpose: ProcessingPurpose): boolean {
    const now = Date.now()

    for (const consent of this.consentRecords.values()) {
      if (
        consent.userId === userId &&
        consent.purpose === purpose &&
        consent.status === 'given' &&
        (!consent.expiresAt || consent.expiresAt > now)
      ) {
        return true
      }
    }

    return false
  }

  /**
   * 处理数据主体请求
   */
  async processDataSubjectRequest(
    userId: string,
    requestType: DataSubjectRight,
    requestDetails: {
      reason?: string
      verificationMethod: string
      responseFormat?: 'json' | 'pdf' | 'csv' | 'xml'
      deliveryMethod?: 'email' | 'portal' | 'mail'
    }
  ): Promise<string> {
    const requestId = this.generateRequestId()
    const now = Date.now()

    const request: DataSubjectRequest = {
      id: requestId,
      userId,
      requestType,
      requestedAt: now,
      status: 'pending',
      reason: requestDetails.reason,
      verificationMethod: requestDetails.verificationMethod,
      responseFormat: requestDetails.responseFormat || 'json',
      deliveryMethod: requestDetails.deliveryMethod || 'email'
    }

    this.subjectRequests.set(requestId, request)

    // 自动处理某些请求类型
    if (requestType === 'access' || requestType === 'know') {
      await this.processAccessRequest(requestId)
    } else if (requestType === 'erasure' || requestType === 'delete_ccpa') {
      await this.processErasureRequest(requestId)
    } else if (requestType === 'portability') {
      await this.processPortabilityRequest(requestId)
    }

    this.emit('dataSubjectRequestReceived', { requestId, userId, requestType })

    return requestId
  }

  /**
   * 处理访问权请求
   */
  private async processAccessRequest(requestId: string): Promise<void> {
    const request = this.subjectRequests.get(requestId)
    if (!request) return

    request.status = 'processing'

    try {
      // 收集用户数据
      const userData = await this.collectUserData(request.userId)

      // 准备响应数据
      const responseData = {
        personalData: userData,
        processingPurposes: this.getProcessingPurposes(request.userId),
        legalBasis: this.getLegalBasisForUser(request.userId),
        dataRetentionPeriods: this.getDataRetentionPeriods(),
        dataRecipients: this.getDataRecipients(),
        dataTransfers: this.getDataTransfers(),
        consentHistory: this.getConsentHistory(request.userId)
      }

      request.responseData = responseData
      request.status = 'completed'
      request.completedAt = Date.now()

      this.emit('accessRequestCompleted', { requestId, userId: request.userId })
    } catch (error) {
      request.status = 'rejected'
      request.reason = `Processing failed: ${error}`

      this.emit('accessRequestFailed', { requestId, userId: request.userId, error })
    }
  }

  /**
   * 处理删除权请求
   */
  private async processErasureRequest(requestId: string): Promise<void> {
    const request = this.subjectRequests.get(requestId)
    if (!request) return

    request.status = 'processing'

    try {
      // 检查是否可以删除
      const canErase = await this.canEraseUserData(request.userId)

      if (canErase) {
        // 执行数据删除
        await this.eraseUserData(request.userId)

        request.status = 'completed'
        request.completedAt = Date.now()

        this.emit('erasureRequestCompleted', { requestId, userId: request.userId })
      } else {
        request.status = 'rejected'
        request.reason = 'Data erasure not possible due to legal obligations'

        this.emit('erasureRequestRejected', { requestId, userId: request.userId })
      }
    } catch (error) {
      request.status = 'rejected'
      request.reason = `Erasure failed: ${error}`

      this.emit('erasureRequestFailed', { requestId, userId: request.userId, error })
    }
  }

  /**
   * 处理数据可携权请求
   */
  private async processPortabilityRequest(requestId: string): Promise<void> {
    const request = this.subjectRequests.get(requestId)
    if (!request) return

    request.status = 'processing'

    try {
      // 导出可携带的数据
      const portableData = await this.exportPortableData(request.userId)

      // 格式化数据
      const formattedData = await this.formatPortableData(portableData, request.responseFormat)

      request.responseData = formattedData
      request.status = 'completed'
      request.completedAt = Date.now()

      this.emit('portabilityRequestCompleted', { requestId, userId: request.userId })
    } catch (error) {
      request.status = 'rejected'
      request.reason = `Portability export failed: ${error}`

      this.emit('portabilityRequestFailed', { requestId, userId: request.userId, error })
    }
  }

  /**
   * 报告数据泄露
   */
  async reportDataBreach(breachDetails: {
    discoveredAt: number
    description: string
    affectedDataTypes: string[]
    affectedUsers: number
    rootCause: string
    severity?: 'low' | 'medium' | 'high' | 'critical'
  }): Promise<string> {
    const breachId = this.generateBreachId()
    const now = Date.now()

    const breach: DataBreachRecord = {
      id: breachId,
      reportedAt: now,
      discoveredAt: breachDetails.discoveredAt,
      description: breachDetails.description,
      severity: breachDetails.severity || 'medium',
      affectedDataTypes: breachDetails.affectedDataTypes,
      affectedUsers: breachDetails.affectedUsers,
      notificationRequired: this.assessNotificationRequirement(breachDetails),
      supervisoryAuthorityNotified: false,
      dataSubjectsNotified: false,
      remedialActions: [],
      rootCause: breachDetails.rootCause,
      preventiveMeasures: [],
      status: 'open'
    }

    this.breachRecords.set(breachId, breach)

    // 如果需要通知监管机构（72小时内）
    if (breach.notificationRequired) {
      this.scheduleAuthorityNotification(breachId)
    }

    // 如果需要通知数据主体
    if (this.requiresDataSubjectNotification(breach)) {
      this.scheduleDataSubjectNotification(breachId)
    }

    this.emit('dataBreachReported', {
      breachId,
      severity: breach.severity,
      affectedUsers: breach.affectedUsers
    })

    return breachId
  }

  /**
   * 进行隐私影响评估
   */
  async conductPrivacyImpactAssessment(
    processingActivityId: string,
    assessmentDetails: {
      description: string
      necessity: string
      proportionality: string
      identifiedRisks: string[]
      mitigationMeasures: string[]
      conductedBy: string
      reviewedBy?: string
    }
  ): Promise<string> {
    const piaId = this.generatePIAId()
    const now = Date.now()

    const pia: PrivacyImpactAssessment = {
      id: piaId,
      processingActivityId,
      conductedAt: now,
      conductedBy: assessmentDetails.conductedBy,
      reviewedBy: assessmentDetails.reviewedBy,
      description: assessmentDetails.description,
      necessity: assessmentDetails.necessity,
      proportionality: assessmentDetails.proportionality,
      riskAssessment: {
        identifiedRisks: assessmentDetails.identifiedRisks,
        riskLevel: this.calculateRiskLevel(assessmentDetails.identifiedRisks),
        mitigationMeasures: assessmentDetails.mitigationMeasures,
        residualRisk: this.calculateResidualRisk(
          assessmentDetails.identifiedRisks,
          assessmentDetails.mitigationMeasures
        )
      },
      decision: 'approved', // 简化决策
      reviewDate: now + 365 * 24 * 60 * 60 * 1000 // 1年后复审
    }

    this.privacyAssessments.set(piaId, pia)

    this.emit('privacyImpactAssessmentCompleted', {
      piaId,
      processingActivityId,
      riskLevel: pia.riskAssessment.riskLevel
    })

    return piaId
  }

  /**
   * 记录处理活动
   */
  private async recordProcessingActivity(activityDetails: {
    controllerName: string
    controllerContact: string
    dpoContact?: string
    purposes: ProcessingPurpose[]
    legalBasis: LegalBasis[]
    dataCategories: string[]
    dataSubjectCategories: string[]
    recipients: string[]
    thirdCountryTransfers: string[]
    retentionPeriod: number
    securityMeasures: string[]
    userId?: string
    dataPackageId?: string
  }): Promise<string> {
    const recordId = this.generateProcessingRecordId()

    const processingRecord: ProcessingRecord = {
      id: recordId,
      ...activityDetails,
      timestamp: Date.now()
    }

    this.processingRecords.set(recordId, processingRecord)

    return recordId
  }

  /**
   * 生成同意字符串 (IAB TCF格式简化版)
   */
  private generateConsentString(purposes: ProcessingPurpose[], legalBasis: LegalBasis[]): string {
    // 简化的同意字符串生成
    const purposeFlags = purposes.map(p => this.purposeToFlag(p)).join('')
    const basisFlags = legalBasis.map(b => this.basisToFlag(b)).join('')
    const timestamp = Math.floor(Date.now() / 1000).toString(16)

    return `${purposeFlags}${basisFlags}${timestamp}`
  }

  /**
   * 目的转换为标志
   */
  private purposeToFlag(purpose: ProcessingPurpose): string {
    const flagMap: Record<ProcessingPurpose, string> = {
      contract_performance: '1',
      legal_obligation: '2',
      vital_interests: '3',
      public_task: '4',
      legitimate_interests: '5',
      consent: '6',
      marketing: '7',
      analytics: '8',
      security: '9'
    }
    return flagMap[purpose] || '0'
  }

  /**
   * 法律基础转换为标志
   */
  private basisToFlag(basis: LegalBasis): string {
    const flagMap: Record<LegalBasis, string> = {
      consent: 'A',
      contract: 'B',
      legal_obligation: 'C',
      vital_interests: 'D',
      public_task: 'E',
      legitimate_interests: 'F'
    }
    return flagMap[basis] || '0'
  }

  /**
   * 停止基于同意的数据处理
   */
  private async stopConsentBasedProcessing(
    userId: string,
    purpose: ProcessingPurpose
  ): Promise<void> {
    // 标记相关数据包为受限处理
    console.log(`Stopping consent-based processing for user ${userId} and purpose ${purpose}`)

    // 在实际应用中，需要:
    // 1. 停止相关的自动化处理
    // 2. 限制数据访问
    // 3. 通知相关系统和服务
  }

  /**
   * 收集用户数据
   */
  private async collectUserData(userId: string): Promise<any> {
    // 收集用户的所有个人数据
    return {
      profile: { id: userId /* 其他个人资料数据 */ },
      chatHistory: [], // 从聊天数据库获取
      settings: {} // 从设置获取
      // 其他数据类别
    }
  }

  /**
   * 获取处理目的
   */
  private getProcessingPurposes(userId: string): ProcessingPurpose[] {
    // 获取用户数据的所有处理目的
    return ['contract_performance', 'security', 'analytics']
  }

  /**
   * 获取法律基础
   */
  private getLegalBasisForUser(userId: string): LegalBasis[] {
    return ['contract', 'legitimate_interests']
  }

  /**
   * 获取数据保留期
   */
  private getDataRetentionPeriods(): Record<string, number> {
    return {
      chat_messages: 365 * 24 * 60 * 60 * 1000, // 1年
      user_preferences: 2 * 365 * 24 * 60 * 60 * 1000, // 2年
      audit_logs: 7 * 365 * 24 * 60 * 60 * 1000 // 7年
    }
  }

  /**
   * 获取数据接收方
   */
  private getDataRecipients(): string[] {
    return ['Cloud Storage Provider', 'Analytics Service']
  }

  /**
   * 获取数据传输信息
   */
  private getDataTransfers(): string[] {
    return [] // 无第三国传输
  }

  /**
   * 获取同意历史
   */
  private getConsentHistory(userId: string): ConsentRecord[] {
    return Array.from(this.consentRecords.values()).filter(consent => consent.userId === userId)
  }

  /**
   * 检查是否可以删除用户数据
   */
  private async canEraseUserData(userId: string): Promise<boolean> {
    // 检查是否存在法律义务阻止删除
    // 例如：会计记录、法律调查等
    return true // 简化实现
  }

  /**
   * 删除用户数据
   */
  private async eraseUserData(userId: string): Promise<void> {
    // 删除所有用户相关数据
    console.log(`Erasing all data for user: ${userId}`)

    // 在实际应用中需要:
    // 1. 删除数据库中的用户记录
    // 2. 删除文件系统中的用户文件
    // 3. 通知相关服务删除缓存
    // 4. 记录删除操作的审计日志
  }

  /**
   * 导出可携带数据
   */
  private async exportPortableData(userId: string): Promise<any> {
    // 导出用户数据，格式为结构化、常用格式
    return await this.collectUserData(userId)
  }

  /**
   * 格式化可携带数据
   */
  private async formatPortableData(
    data: any,
    format: 'json' | 'pdf' | 'csv' | 'xml'
  ): Promise<any> {
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2)
      case 'csv':
        return this.convertToCSV(data)
      case 'xml':
        return this.convertToXML(data)
      case 'pdf':
        return this.convertToPDF(data)
      default:
        return JSON.stringify(data)
    }
  }

  /**
   * 评估通知要求
   */
  private assessNotificationRequirement(breachDetails: any): boolean {
    // 根据GDPR第33条评估是否需要通知监管机构
    return (
      breachDetails.affectedUsers > 100 ||
      breachDetails.affectedDataTypes.includes('sensitive_data')
    )
  }

  /**
   * 是否需要通知数据主体
   */
  private requiresDataSubjectNotification(breach: DataBreachRecord): boolean {
    // 根据GDPR第34条评估
    return breach.severity === 'high' || breach.severity === 'critical'
  }

  /**
   * 安排监管机构通知
   */
  private scheduleAuthorityNotification(breachId: string): void {
    // 72小时内通知监管机构
    setTimeout(() => {
      this.notifySupervisoryAuthority(breachId)
    }, 0) // 立即执行，实际应用中可能有延迟
  }

  /**
   * 安排数据主体通知
   */
  private scheduleDataSubjectNotification(breachId: string): void {
    // 及时通知受影响的数据主体
    setTimeout(() => {
      this.notifyAffectedDataSubjects(breachId)
    }, 0)
  }

  /**
   * 通知监管机构
   */
  private async notifySupervisoryAuthority(breachId: string): Promise<void> {
    const breach = this.breachRecords.get(breachId)
    if (!breach) return

    console.log(`Notifying supervisory authority about breach: ${breachId}`)

    breach.supervisoryAuthorityNotified = true
    this.emit('supervisoryAuthorityNotified', { breachId })
  }

  /**
   * 通知受影响的数据主体
   */
  private async notifyAffectedDataSubjects(breachId: string): Promise<void> {
    const breach = this.breachRecords.get(breachId)
    if (!breach) return

    console.log(`Notifying ${breach.affectedUsers} data subjects about breach: ${breachId}`)

    breach.dataSubjectsNotified = true
    this.emit('dataSubjectsNotified', { breachId, affectedUsers: breach.affectedUsers })
  }

  /**
   * 计算风险级别
   */
  private calculateRiskLevel(risks: string[]): 'low' | 'medium' | 'high' {
    if (risks.length >= 5) return 'high'
    if (risks.length >= 3) return 'medium'
    return 'low'
  }

  /**
   * 计算残余风险
   */
  private calculateResidualRisk(risks: string[], mitigations: string[]): 'low' | 'medium' | 'high' {
    const riskScore = risks.length
    const mitigationScore = mitigations.length
    const residualScore = Math.max(0, riskScore - mitigationScore)

    if (residualScore >= 3) return 'high'
    if (residualScore >= 2) return 'medium'
    return 'low'
  }

  /**
   * 数据转换辅助方法
   */
  private convertToCSV(data: any): string {
    // 简化的CSV转换
    return JSON.stringify(data).replace(/[{}]/g, '').replace(/","/g, '","')
  }

  private convertToXML(data: any): string {
    // 简化的XML转换
    return `<?xml version="1.0"?><data>${JSON.stringify(data)}</data>`
  }

  private convertToPDF(data: any): Buffer {
    // 简化的PDF转换 - 在实际应用中需要PDF库
    return Buffer.from(JSON.stringify(data, null, 2))
  }

  /**
   * ID生成器
   */
  private generateConsentId(): string {
    return `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateRequestId(): string {
    return `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateBreachId(): string {
    return `breach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generatePIAId(): string {
    return `pia_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateProcessingRecordId(): string {
    return `processing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 获取合规状态报告
   */
  getComplianceReport(): {
    consentRecords: number
    activeConsents: number
    withdrawnConsents: number
    pendingRequests: number
    completedRequests: number
    dataBreaches: number
    privacyAssessments: number
  } {
    const activeConsents = Array.from(this.consentRecords.values()).filter(
      c => c.status === 'given'
    ).length
    const withdrawnConsents = Array.from(this.consentRecords.values()).filter(
      c => c.status === 'withdrawn'
    ).length
    const pendingRequests = Array.from(this.subjectRequests.values()).filter(
      r => r.status === 'pending'
    ).length
    const completedRequests = Array.from(this.subjectRequests.values()).filter(
      r => r.status === 'completed'
    ).length

    return {
      consentRecords: this.consentRecords.size,
      activeConsents,
      withdrawnConsents,
      pendingRequests,
      completedRequests,
      dataBreaches: this.breachRecords.size,
      privacyAssessments: this.privacyAssessments.size
    }
  }

  /**
   * 清理过期记录
   */
  cleanupExpiredRecords(): void {
    const now = Date.now()

    // 清理过期的同意记录
    for (const [id, consent] of this.consentRecords.entries()) {
      if (consent.expiresAt && consent.expiresAt < now) {
        consent.status = 'expired'
      }
    }

    this.emit('expiredRecordsCleaned')
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.consentRecords.clear()
    this.processingRecords.clear()
    this.subjectRequests.clear()
    this.breachRecords.clear()
    this.privacyAssessments.clear()
    this.removeAllListeners()
  }
}

export default GDPRComplianceManager
