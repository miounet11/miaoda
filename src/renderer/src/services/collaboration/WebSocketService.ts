/**
 * WebSocket通信服务
 * 处理实时协作的所有WebSocket通信
 */

import { EventEmitter } from 'events'
import type {
  WebSocketMessage,
  WebSocketMessageType,
  CollaborationEvent,
  Operation,
  SyncState,
  CollaborationConfig
} from '../../types/collaboration'

export interface WebSocketServiceEvents {
  connected: () => void
  disconnected: () => void
  reconnecting: (attempt: number) => void
  message: (message: WebSocketMessage) => void
  operation: (operation: Operation) => void
  event: (event: CollaborationEvent) => void
  error: (error: Error) => void
  syncStateChanged: (state: SyncState) => void
}

export class WebSocketService extends EventEmitter {
  private ws: WebSocket | null = null
  private config: CollaborationConfig
  private reconnectAttempts = 0
  private reconnectTimer: NodeJS.Timeout | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private messageQueue: WebSocketMessage[] = []
  private isReconnecting = false
  private lastPingTime = 0
  private roundTripTime = 0

  constructor(config: CollaborationConfig) {
    super()
    this.config = config
  }

  /**
   * 连接到WebSocket服务器
   */
  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.serverUrl)
        
        this.ws.onopen = () => {
          console.log('WebSocket connected')
          this.reconnectAttempts = 0
          this.isReconnecting = false
          this.startHeartbeat()
          this.processMessageQueue()
          this.emit('connected')
          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data)
        }

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason)
          this.stopHeartbeat()
          this.emit('disconnected')
          
          if (!this.isReconnecting && event.code !== 1000) {
            this.scheduleReconnect()
          }
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.emit('error', new Error('WebSocket connection error'))
          reject(error)
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.isReconnecting = false
    this.clearReconnectTimer()
    this.stopHeartbeat()
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }
  }

  /**
   * 发送消息
   */
  async sendMessage(message: Omit<WebSocketMessage, 'id' | 'timestamp'>): Promise<void> {
    const fullMessage: WebSocketMessage = {
      id: this.generateId(),
      timestamp: new Date(),
      ...message
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(fullMessage))
      } catch (error) {
        console.error('Failed to send message:', error)
        this.queueMessage(fullMessage)
        throw error
      }
    } else {
      this.queueMessage(fullMessage)
      if (!this.isReconnecting) {
        this.scheduleReconnect()
      }
    }
  }

  /**
   * 发送操作
   */
  async sendOperation(operation: Operation): Promise<void> {
    await this.sendMessage({
      type: WebSocketMessageType.OPERATION,
      chatId: operation.chatId,
      userId: operation.userId,
      payload: operation
    })
  }

  /**
   * 发送事件
   */
  async sendEvent(event: CollaborationEvent): Promise<void> {
    await this.sendMessage({
      type: WebSocketMessageType.EVENT,
      chatId: event.chatId,
      userId: event.userId,
      payload: event
    })
  }

  /**
   * 加入聊天房间
   */
  async joinChat(chatId: string, userId: string): Promise<void> {
    await this.sendMessage({
      type: WebSocketMessageType.JOIN_CHAT,
      chatId,
      userId,
      payload: { chatId, userId }
    })
  }

  /**
   * 离开聊天房间
   */
  async leaveChat(chatId: string, userId: string): Promise<void> {
    await this.sendMessage({
      type: WebSocketMessageType.LEAVE_CHAT,
      chatId,
      userId,
      payload: { chatId, userId }
    })
  }

  /**
   * 请求同步
   */
  async requestSync(chatId: string, version: number): Promise<void> {
    await this.sendMessage({
      type: WebSocketMessageType.SYNC_REQUEST,
      chatId,
      payload: { chatId, version, timestamp: new Date() }
    })
  }

  /**
   * 获取连接状态
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  /**
   * 获取连接延迟
   */
  getLatency(): number {
    return this.roundTripTime
  }

  /**
   * 处理接收的消息
   */
  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data)
      
      // 处理心跳响应
      if (message.type === WebSocketMessageType.PONG) {
        this.roundTripTime = Date.now() - this.lastPingTime
        return
      }

      this.emit('message', message)

      // 根据消息类型分发事件
      switch (message.type) {
        case WebSocketMessageType.OPERATION:
          this.emit('operation', message.payload as Operation)
          break
        
        case WebSocketMessageType.EVENT:
          this.emit('event', message.payload as CollaborationEvent)
          break
        
        case WebSocketMessageType.SYNC_RESPONSE:
          this.handleSyncResponse(message.payload)
          break
        
        case WebSocketMessageType.ERROR:
          this.emit('error', new Error(message.payload.message))
          break
        
        case WebSocketMessageType.NOTIFICATION:
          // 处理通知消息
          console.log('Notification:', message.payload)
          break
      }
    } catch (error) {
      console.error('Failed to parse message:', error)
      this.emit('error', error as Error)
    }
  }

  /**
   * 处理同步响应
   */
  private handleSyncResponse(payload: any): void {
    const syncState: SyncState = {
      chatId: payload.chatId,
      version: payload.version,
      lastSyncAt: new Date(payload.timestamp),
      pendingOperations: payload.operations || [],
      isOnline: this.isConnected(),
      isSyncing: false,
      conflictsCount: payload.conflicts?.length || 0
    }
    
    this.emit('syncStateChanged', syncState)
  }

  /**
   * 开始心跳检测
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.lastPingTime = Date.now()
        this.sendMessage({
          type: WebSocketMessageType.PING,
          payload: { timestamp: this.lastPingTime }
        }).catch(error => {
          console.error('Failed to send ping:', error)
        })
      }
    }, this.config.heartbeatInterval)
  }

  /**
   * 停止心跳检测
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  /**
   * 安排重连
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached')
      return
    }

    this.isReconnecting = true
    this.reconnectAttempts++
    
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
    
    this.emit('reconnecting', this.reconnectAttempts)
    
    this.reconnectTimer = setTimeout(() => {
      console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`)
      this.connect().catch(error => {
        console.error('Reconnect failed:', error)
        this.scheduleReconnect()
      })
    }, delay)
  }

  /**
   * 清除重连定时器
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  /**
   * 消息入队
   */
  private queueMessage(message: WebSocketMessage): void {
    this.messageQueue.push(message)
    
    // 限制队列大小
    if (this.messageQueue.length > 100) {
      this.messageQueue.shift()
    }
  }

  /**
   * 处理消息队列
   */
  private processMessageQueue(): void {
    const queue = [...this.messageQueue]
    this.messageQueue = []
    
    queue.forEach(message => {
      this.sendMessage(message).catch(error => {
        console.error('Failed to send queued message:', error)
        // 重新入队失败的消息
        this.queueMessage(message)
      })
    })
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.disconnect()
    this.removeAllListeners()
  }
}

/**
 * WebSocket服务工厂
 */
export class WebSocketServiceFactory {
  private static instance: WebSocketService | null = null

  static getInstance(config?: CollaborationConfig): WebSocketService {
    if (!this.instance && config) {
      this.instance = new WebSocketService(config)
    }
    
    if (!this.instance) {
      throw new Error('WebSocketService not initialized. Please provide config.')
    }
    
    return this.instance
  }

  static destroyInstance(): void {
    if (this.instance) {
      this.instance.dispose()
      this.instance = null
    }
  }
}