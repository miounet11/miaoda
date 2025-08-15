/**
 * 协作管理器 - 管理协作功能的核心服务
 * 协调WebSocket、CRDT和共享服务
 */

import { WebSocketService } from './WebSocketService'
import { CRDTSyncEngine } from './CRDTSyncEngine'
import { SharingService } from './SharingService'
import type { CollaborationConfig, CollaborationSession } from '../../types/collaboration'
import { logger } from '@main/utils/Logger'

export class CollaborationManager {
  private static instance: CollaborationManager
  private wsService: WebSocketService | null = null
  private crdtEngine: CRDTSyncEngine | null = null
  private sharingService: SharingService | null = null
  private isEnabled = false
  private currentSession: CollaborationSession | null = null
  
  private constructor() {}
  
  static getInstance(): CollaborationManager {
    if (!CollaborationManager.instance) {
      CollaborationManager.instance = new CollaborationManager()
    }
    return CollaborationManager.instance
  }
  
  /**
   * 初始化协作功能
   */
  async initialize(config?: Partial<CollaborationConfig>): Promise<void> {
    try {
      // 默认配置
      const defaultConfig: CollaborationConfig = {
        serverUrl: process.env.VITE_COLLAB_SERVER_URL || 'ws://localhost:8080',
        roomId: '',
        userId: this.generateUserId(),
        userName: 'User',
        enableCRDT: true,
        enablePresence: true,
        enableCursors: true,
        enableVoice: false,
        autoSync: true,
        syncInterval: 5000,
        reconnectAttempts: 5,
        reconnectDelay: 3000
      }
      
      const finalConfig = { ...defaultConfig, ...config }
      
      // 初始化各个服务
      this.wsService = new WebSocketService(finalConfig)
      this.crdtEngine = new CRDTSyncEngine(finalConfig)
      this.sharingService = new SharingService()
      
      // 设置事件监听
      this.setupEventListeners()
      
      this.isEnabled = true
      logger.info('Collaboration manager initialized', 'CollaborationManager')
    } catch (error) {
      logger.error('Failed to initialize collaboration manager', 'CollaborationManager', error)
      throw error
    }
  }
  
  /**
   * 启动协作会话
   */
  async startSession(roomId: string, chatId: string): Promise<CollaborationSession> {
    if (!this.isEnabled) {
      throw new Error('Collaboration not initialized')
    }
    
    try {
      // 连接WebSocket
      await this.wsService?.connect()
      
      // 创建会话
      this.currentSession = {
        id: this.generateSessionId(),
        roomId,
        chatId,
        participants: [],
        isActive: true,
        startedAt: new Date(),
        isHost: false
      }
      
      // 加入房间
      await this.joinRoom(roomId)
      
      logger.info(`Started collaboration session for room ${roomId}`, 'CollaborationManager')
      return this.currentSession
    } catch (error) {
      logger.error('Failed to start collaboration session', 'CollaborationManager', error)
      throw error
    }
  }
  
  /**
   * 结束协作会话
   */
  async endSession(): Promise<void> {
    if (!this.currentSession) return
    
    try {
      // 离开房间
      await this.leaveRoom()
      
      // 断开WebSocket
      this.wsService?.disconnect()
      
      // 清理会话
      this.currentSession = null
      
      logger.info('Ended collaboration session', 'CollaborationManager')
    } catch (error) {
      logger.error('Failed to end collaboration session', 'CollaborationManager', error)
    }
  }
  
  /**
   * 分享聊天
   */
  async shareChat(chatId: string, options?: any): Promise<string> {
    if (!this.sharingService) {
      throw new Error('Sharing service not initialized')
    }
    
    try {
      const shareLink = await this.sharingService.createShareLink(chatId, options)
      logger.info(`Created share link for chat ${chatId}`, 'CollaborationManager')
      return shareLink
    } catch (error) {
      logger.error('Failed to share chat', 'CollaborationManager', error)
      throw error
    }
  }
  
  /**
   * 加入共享聊天
   */
  async joinSharedChat(shareCode: string): Promise<void> {
    if (!this.sharingService) {
      throw new Error('Sharing service not initialized')
    }
    
    try {
      const chatData = await this.sharingService.joinSharedChat(shareCode)
      logger.info(`Joined shared chat with code ${shareCode}`, 'CollaborationManager')
      
      // 开始协作会话
      if (chatData.roomId && chatData.chatId) {
        await this.startSession(chatData.roomId, chatData.chatId)
      }
    } catch (error) {
      logger.error('Failed to join shared chat', 'CollaborationManager', error)
      throw error
    }
  }
  
  /**
   * 获取当前会话状态
   */
  getSessionStatus(): CollaborationSession | null {
    return this.currentSession
  }
  
  /**
   * 检查协作是否启用
   */
  isCollaborationEnabled(): boolean {
    return this.isEnabled
  }
  
  // ===== Private Methods =====
  
  private setupEventListeners(): void {
    if (!this.wsService || !this.crdtEngine) return
    
    // WebSocket事件
    this.wsService.on('connected', () => {
      logger.info('WebSocket connected', 'CollaborationManager')
    })
    
    this.wsService.on('disconnected', () => {
      logger.warn('WebSocket disconnected', 'CollaborationManager')
    })
    
    this.wsService.on('operation', (operation) => {
      // 处理远程操作
      this.crdtEngine?.applyRemoteOperation(operation)
    })
    
    // CRDT事件
    this.crdtEngine.on('localOperation', (operation) => {
      // 发送本地操作到远程
      this.wsService?.sendOperation(operation)
    })
    
    this.crdtEngine.on('syncComplete', () => {
      logger.debug('CRDT sync complete', 'CollaborationManager')
    })
  }
  
  private async joinRoom(roomId: string): Promise<void> {
    this.wsService?.sendMessage({
      type: 'join-room',
      payload: { roomId }
    })
  }
  
  private async leaveRoom(): Promise<void> {
    if (!this.currentSession) return
    
    this.wsService?.sendMessage({
      type: 'leave-room',
      payload: { roomId: this.currentSession.roomId }
    })
  }
  
  private generateUserId(): string {
    return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
  
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// 导出单例
export const collaborationManager = CollaborationManager.getInstance()