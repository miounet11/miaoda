/**
 * CRDT同步引擎
 * 实现基于CRDT的无冲突数据同步
 */

import { EventEmitter } from 'events'
import type {
  Operation,
  OperationType,
  Conflict,
  SyncState
} from '../../types/collaboration'

// CRDT操作接口
interface CRDTOperation extends Operation {
  vectorClock: VectorClock
  site: string
  counter: number
}

// 向量时钟
interface VectorClock {
  [siteId: string]: number
}

// 字符操作
interface CharacterOperation {
  type: 'insert' | 'delete'
  position: Position
  character?: string
  id: string
  timestamp: number
}

// 位置标识符
interface Position {
  major: number[]
  minor: number
  site: string
}

// 文档状态
interface DocumentState {
  content: string
  operations: CRDTOperation[]
  vectorClock: VectorClock
  version: number
}

export interface CRDTSyncEngineEvents {
  operationApplied: (operation: CRDTOperation) => void
  conflictDetected: (conflict: Conflict) => void
  documentUpdated: (state: DocumentState) => void
  syncCompleted: (chatId: string) => void
}

export class CRDTSyncEngine extends EventEmitter {
  private documents: Map<string, DocumentState> = new Map()
  private siteId: string
  private counters: Map<string, number> = new Map() // chatId -> counter
  
  constructor(siteId: string) {
    super()
    this.siteId = siteId
  }

  /**
   * 初始化文档
   */
  initializeDocument(chatId: string, initialContent: string = ''): void {
    const state: DocumentState = {
      content: initialContent,
      operations: [],
      vectorClock: { [this.siteId]: 0 },
      version: 1
    }
    
    this.documents.set(chatId, state)
    this.counters.set(chatId, 0)
  }

  /**
   * 获取文档状态
   */
  getDocumentState(chatId: string): DocumentState | undefined {
    return this.documents.get(chatId)
  }

  /**
   * 应用本地操作
   */
  applyLocalOperation(chatId: string, operation: Omit<Operation, 'id' | 'timestamp' | 'causality'>): CRDTOperation | null {
    const doc = this.documents.get(chatId)
    if (!doc) {
      console.error(`Document ${chatId} not found`)
      return null
    }

    // 增加计数器
    const counter = (this.counters.get(chatId) || 0) + 1
    this.counters.set(chatId, counter)

    // 创建CRDT操作
    const crdtOperation: CRDTOperation = {
      id: this.generateOperationId(),
      timestamp: new Date(),
      vectorClock: { ...doc.vectorClock, [this.siteId]: counter },
      site: this.siteId,
      counter,
      causality: this.generateCausality(doc.vectorClock),
      ...operation
    }

    // 应用操作
    this.applyOperation(chatId, crdtOperation, true)
    
    return crdtOperation
  }

  /**
   * 应用远程操作
   */
  applyRemoteOperation(chatId: string, operation: CRDTOperation): boolean {
    const doc = this.documents.get(chatId)
    if (!doc) {
      console.error(`Document ${chatId} not found`)
      return false
    }

    // 检查因果关系
    if (!this.canApplyOperation(doc, operation)) {
      console.warn('Operation cannot be applied due to causality constraints')
      return false
    }

    // 应用操作
    this.applyOperation(chatId, operation, false)
    
    return true
  }

  /**
   * 批量同步操作
   */
  syncOperations(chatId: string, operations: CRDTOperation[]): void {
    const doc = this.documents.get(chatId)
    if (!doc) {
      console.error(`Document ${chatId} not found`)
      return
    }

    // 按时间戳排序
    const sortedOperations = operations.sort((a, b) => {
      if (a.timestamp.getTime() !== b.timestamp.getTime()) {
        return a.timestamp.getTime() - b.timestamp.getTime()
      }
      // 如果时间戳相同，按站点ID排序以保证确定性
      return a.site.localeCompare(b.site)
    })

    let appliedCount = 0
    for (const operation of sortedOperations) {
      if (this.applyRemoteOperation(chatId, operation)) {
        appliedCount++
      }
    }

    if (appliedCount > 0) {
      this.emit('syncCompleted', chatId)
    }
  }

  /**
   * 生成同步状态
   */
  generateSyncState(chatId: string): SyncState | null {
    const doc = this.documents.get(chatId)
    if (!doc) return null

    return {
      chatId,
      version: doc.version,
      lastSyncAt: new Date(),
      pendingOperations: [], // CRDT不需要待处理操作
      isOnline: true,
      isSyncing: false,
      conflictsCount: 0 // CRDT自动解决冲突
    }
  }

  /**
   * 应用操作到文档
   */
  private applyOperation(chatId: string, operation: CRDTOperation, isLocal: boolean): void {
    const doc = this.documents.get(chatId)!

    try {
      // 根据操作类型应用变更
      switch (operation.type) {
        case OperationType.INSERT_TEXT:
          this.applyInsertText(doc, operation)
          break
        case OperationType.DELETE_TEXT:
          this.applyDeleteText(doc, operation)
          break
        case OperationType.ADD_MESSAGE:
          this.applyAddMessage(doc, operation)
          break
        // 添加其他操作类型...
      }

      // 更新向量时钟
      this.updateVectorClock(doc, operation)

      // 添加到操作历史
      doc.operations.push(operation)
      doc.version++

      this.emit('operationApplied', operation)
      this.emit('documentUpdated', doc)
    } catch (error) {
      console.error('Failed to apply operation:', error)
      
      // 创建冲突记录
      const conflict: Conflict = {
        id: this.generateConflictId(),
        chatId,
        operations: [operation],
        detectedAt: new Date(),
        status: 'pending'
      }
      
      this.emit('conflictDetected', conflict)
    }
  }

  /**
   * 应用文本插入操作
   */
  private applyInsertText(doc: DocumentState, operation: CRDTOperation): void {
    const { position = 0, content = '' } = operation.data
    
    if (position < 0 || position > doc.content.length) {
      throw new Error(`Invalid insertion position: ${position}`)
    }

    doc.content = doc.content.slice(0, position) + content + doc.content.slice(position)
  }

  /**
   * 应用文本删除操作
   */
  private applyDeleteText(doc: DocumentState, operation: CRDTOperation): void {
    const { position = 0, length = 0 } = operation.data
    
    if (position < 0 || position >= doc.content.length || length < 0) {
      throw new Error(`Invalid deletion parameters: position=${position}, length=${length}`)
    }

    const endPosition = Math.min(position + length, doc.content.length)
    doc.content = doc.content.slice(0, position) + doc.content.slice(endPosition)
  }

  /**
   * 应用消息添加操作
   */
  private applyAddMessage(doc: DocumentState, operation: CRDTOperation): void {
    // 这里可以处理消息级别的操作
    // 例如：在文档中添加新的消息块
    const messageText = `\n\n[Message ${operation.id}]\n${operation.data.messageData?.content || ''}`
    doc.content += messageText
  }

  /**
   * 检查操作是否可以应用（因果关系检查）
   */
  private canApplyOperation(doc: DocumentState, operation: CRDTOperation): boolean {
    // 检查向量时钟因果关系
    for (const [site, timestamp] of Object.entries(operation.vectorClock)) {
      const docTimestamp = doc.vectorClock[site] || 0
      
      if (site === operation.site) {
        // 来自同一站点的操作必须是连续的
        if (timestamp !== docTimestamp + 1) {
          return false
        }
      } else {
        // 来自其他站点的操作不能超过当前状态
        if (timestamp > docTimestamp) {
          return false
        }
      }
    }
    
    return true
  }

  /**
   * 更新向量时钟
   */
  private updateVectorClock(doc: DocumentState, operation: CRDTOperation): void {
    for (const [site, timestamp] of Object.entries(operation.vectorClock)) {
      doc.vectorClock[site] = Math.max(doc.vectorClock[site] || 0, timestamp)
    }
  }

  /**
   * 生成因果关系数组
   */
  private generateCausality(vectorClock: VectorClock): string[] {
    const causality: string[] = []
    for (const [site, timestamp] of Object.entries(vectorClock)) {
      if (timestamp > 0) {
        causality.push(`${site}:${timestamp}`)
      }
    }
    return causality
  }

  /**
   * 转换操作以解决冲突
   */
  private transformOperation(operation: CRDTOperation, concurrent: CRDTOperation): CRDTOperation {
    // 实现操作转换逻辑
    // 这是一个简化版本，实际实现需要根据具体操作类型进行转换
    
    if (operation.type === OperationType.INSERT_TEXT && concurrent.type === OperationType.INSERT_TEXT) {
      const opPos = operation.data.position || 0
      const concurrentPos = concurrent.data.position || 0
      
      if (opPos >= concurrentPos) {
        // 调整插入位置
        const concurrentLength = concurrent.data.content?.length || 0
        operation.data.position = opPos + concurrentLength
      }
    }
    
    return operation
  }

  /**
   * 生成操作ID
   */
  private generateOperationId(): string {
    return `${this.siteId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 生成冲突ID
   */
  private generateConflictId(): string {
    return `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 获取所有待同步的操作
   */
  getPendingOperations(chatId: string, since?: VectorClock): CRDTOperation[] {
    const doc = this.documents.get(chatId)
    if (!doc) return []

    if (!since) {
      return [...doc.operations]
    }

    // 返回在指定向量时钟之后的操作
    return doc.operations.filter(operation => {
      return this.isAfterVectorClock(operation.vectorClock, since)
    })
  }

  /**
   * 检查向量时钟A是否在B之后
   */
  private isAfterVectorClock(a: VectorClock, b: VectorClock): boolean {
    let hasLater = false
    
    for (const site in { ...a, ...b }) {
      const aTime = a[site] || 0
      const bTime = b[site] || 0
      
      if (aTime < bTime) {
        return false
      } else if (aTime > bTime) {
        hasLater = true
      }
    }
    
    return hasLater
  }

  /**
   * 清理文档
   */
  removeDocument(chatId: string): void {
    this.documents.delete(chatId)
    this.counters.delete(chatId)
  }

  /**
   * 获取文档内容
   */
  getDocumentContent(chatId: string): string {
    const doc = this.documents.get(chatId)
    return doc?.content || ''
  }
}