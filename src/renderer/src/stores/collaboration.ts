/**
 * 协作功能状态管理
 * 管理实时协作的所有状态和操作
 */

import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import type {
  CollaborativeChat,
  CollaborationUser,
  Operation,
  CollaborationEvent,
  SyncState,
  Conflict,
  CollaborationConfig,
  CollaborationStats,
  UserRole,
  PermissionAction,
  CreateShareRequest,
  JoinShareRequest
} from '../types/collaboration'
import { WebSocketService, WebSocketServiceFactory } from '../services/collaboration/WebSocketService'
import { SharingService } from '../services/collaboration/SharingService'

export const useCollaborationStore = defineStore('collaboration', () => {
  // ============ 状态定义 ============
  const isInitialized = ref(false)
  const config = ref<CollaborationConfig>({
    serverUrl: 'ws://localhost:8080/collaboration',
    reconnectInterval: 5000,
    maxReconnectAttempts: 5,
    heartbeatInterval: 30000,
    syncInterval: 1000,
    conflictDetectionEnabled: true,
    encryptionEnabled: false,
    offlineSyncEnabled: true,
    maxOfflineOperations: 1000
  })

  // 服务实例
  let webSocketService: WebSocketService | null = null
  let sharingService: SharingService | null = null

  // 协作会话
  const collaborativeChats = reactive(new Map<string, CollaborativeChat>())
  const currentShareId = ref<string | null>(null)
  const currentUserId = ref<string | null>(null)

  // 用户状态
  const onlineUsers = reactive(new Map<string, CollaborationUser>())
  const userCursors = reactive(new Map<string, any>())

  // 同步状态
  const syncStates = reactive(new Map<string, SyncState>())
  const pendingOperations = reactive(new Map<string, Operation[]>())
  const conflicts = reactive(new Map<string, Conflict[]>())

  // 连接状态
  const isConnected = ref(false)
  const isReconnecting = ref(false)
  const connectionLatency = ref(0)

  // 统计信息
  const stats = ref<CollaborationStats>({
    totalShares: 0,
    activeShares: 0,
    totalParticipants: 0,
    averageSessionDuration: 0,
    messagesSynced: 0,
    conflictsResolved: 0,
    lastUpdated: new Date()
  })

  // ============ 计算属性 ============
  const currentShare = computed(() => {
    return currentShareId.value ? collaborativeChats.get(currentShareId.value) : null
  })

  const currentUser = computed(() => {
    return currentUserId.value ? onlineUsers.get(currentUserId.value) : null
  })

  const isOwner = computed(() => {
    return currentShare.value?.owner === currentUserId.value
  })

  const canEdit = computed(() => {
    if (!currentShare.value || !currentUserId.value) return false
    if (isOwner.value) return true
    
    const user = currentShare.value.participants.find(p => p.id === currentUserId.value)
    return user?.permissions.some(p => p.action === PermissionAction.WRITE && p.granted) || false
  })

  const participants = computed(() => {
    return currentShare.value?.participants || []
  })

  const activeConflicts = computed(() => {
    if (!currentShareId.value) return []
    return conflicts.get(currentShareId.value)?.filter(c => c.status === 'pending') || []
  })

  // ============ 初始化和配置 ============
  async function initialize(customConfig?: Partial<CollaborationConfig>) {
    if (isInitialized.value) return

    // 合并配置
    if (customConfig) {
      config.value = { ...config.value, ...customConfig }
    }

    try {
      // 初始化服务
      webSocketService = WebSocketServiceFactory.getInstance(config.value)
      sharingService = new SharingService()

      // 设置事件监听
      setupWebSocketListeners()
      setupSharingServiceListeners()

      isInitialized.value = true
      console.log('Collaboration store initialized')
    } catch (error) {
      console.error('Failed to initialize collaboration store:', error)
      throw error
    }
  }

  function updateConfig(newConfig: Partial<CollaborationConfig>) {
    config.value = { ...config.value, ...newConfig }
  }

  // ============ 连接管理 ============
  async function connect() {
    if (!webSocketService) throw new Error('WebSocket service not initialized')
    
    try {
      await webSocketService.connect()
      isConnected.value = true
    } catch (error) {
      console.error('Failed to connect:', error)
      throw error
    }
  }

  function disconnect() {
    if (webSocketService) {
      webSocketService.disconnect()
      isConnected.value = false
    }
  }

  // ============ 分享管理 ============
  async function createShare(request: CreateShareRequest) {
    if (!sharingService) throw new Error('Sharing service not initialized')
    
    const response = await sharingService.createShare(request)
    if (response.success && response.shareId) {
      const share = sharingService.getShare(response.shareId)
      if (share) {
        collaborativeChats.set(response.shareId, share)
        updateStats()
      }
    }
    return response
  }

  async function joinShare(request: JoinShareRequest) {
    if (!sharingService) throw new Error('Sharing service not initialized')
    
    const response = await sharingService.joinShare(request)
    if (response.success && response.chatId) {
      // 设置当前分享
      currentShareId.value = request.shareId || ''
      
      // 连接到WebSocket
      if (!isConnected.value) {
        await connect()
      }
      
      // 加入聊天房间
      if (webSocketService && currentUserId.value) {
        await webSocketService.joinChat(response.chatId, currentUserId.value)
      }
    }
    return response
  }

  async function leaveShare() {
    if (!currentShareId.value || !currentUserId.value) return

    try {
      // 离开WebSocket房间
      if (webSocketService && currentShare.value) {
        await webSocketService.leaveChat(currentShare.value.baseChat, currentUserId.value)
      }

      // 清理状态
      currentShareId.value = null
      onlineUsers.clear()
      userCursors.clear()
    } catch (error) {
      console.error('Failed to leave share:', error)
      throw error
    }
  }

  // ============ 用户管理 ============
  function setCurrentUser(userId: string, userInfo?: Partial<CollaborationUser>) {
    currentUserId.value = userId
    
    if (userInfo) {
      const user: CollaborationUser = {
        id: userId,
        name: userInfo.name || `User ${userId.slice(-4)}`,
        email: userInfo.email,
        avatar: userInfo.avatar,
        role: userInfo.role || UserRole.VIEWER,
        status: 'online',
        lastSeen: new Date(),
        permissions: userInfo.permissions || []
      }
      onlineUsers.set(userId, user)
    }
  }

  function updateUserStatus(userId: string, status: CollaborationUser['status']) {
    const user = onlineUsers.get(userId)
    if (user) {
      user.status = status
      user.lastSeen = new Date()
      onlineUsers.set(userId, user)
    }
  }

  function updateUserCursor(userId: string, cursor: any) {
    userCursors.set(userId, cursor)
  }

  // ============ 操作处理 ============
  async function sendOperation(operation: Omit<Operation, 'id' | 'timestamp' | 'signature'>) {
    if (!webSocketService || !currentUserId.value) return

    const fullOperation: Operation = {
      id: generateOperationId(),
      timestamp: new Date(),
      causality: [], // Future: Implement causality tracking - Issue #causality-tracking
      userId: currentUserId.value,
      ...operation
    }

    try {
      await webSocketService.sendOperation(fullOperation)
      
      // 添加到待处理操作
      const chatOperations = pendingOperations.get(operation.chatId) || []
      chatOperations.push(fullOperation)
      pendingOperations.set(operation.chatId, chatOperations)
    } catch (error) {
      console.error('Failed to send operation:', error)
      throw error
    }
  }

  async function sendEvent(event: Omit<CollaborationEvent, 'id' | 'timestamp'>) {
    if (!webSocketService || !currentUserId.value) return

    const fullEvent: CollaborationEvent = {
      id: generateEventId(),
      timestamp: new Date(),
      userId: currentUserId.value,
      version: currentShare.value?.version || 1,
      ...event
    }

    try {
      await webSocketService.sendEvent(fullEvent)
    } catch (error) {
      console.error('Failed to send event:', error)
      throw error
    }
  }

  // ============ 同步管理 ============
  async function requestSync(chatId: string) {
    if (!webSocketService) return

    const syncState = syncStates.get(chatId)
    const version = syncState?.version || 0

    await webSocketService.requestSync(chatId, version)
  }

  function updateSyncState(state: SyncState) {
    syncStates.set(state.chatId, state)
  }

  // ============ 冲突处理 ============
  function addConflict(conflict: Conflict) {
    const chatConflicts = conflicts.get(conflict.chatId) || []
    chatConflicts.push(conflict)
    conflicts.set(conflict.chatId, chatConflicts)
  }

  function resolveConflict(conflictId: string, resolution: any) {
    for (const [chatId, chatConflicts] of conflicts.entries()) {
      const conflictIndex = chatConflicts.findIndex(c => c.id === conflictId)
      if (conflictIndex !== -1) {
        chatConflicts[conflictIndex].status = 'resolved'
        chatConflicts[conflictIndex].resolvedAt = new Date()
        chatConflicts[conflictIndex].resolution = resolution
        break
      }
    }
  }

  // ============ 统计更新 ============
  function updateStats() {
    if (sharingService) {
      stats.value = sharingService.generateStats()
    }
  }

  // ============ 事件监听设置 ============
  function setupWebSocketListeners() {
    if (!webSocketService) return

    webSocketService.on('connected', () => {
      isConnected.value = true
      isReconnecting.value = false
      connectionLatency.value = webSocketService!.getLatency()
    })

    webSocketService.on('disconnected', () => {
      isConnected.value = false
    })

    webSocketService.on('reconnecting', (attempt: number) => {
      isReconnecting.value = true
    })

    webSocketService.on('operation', (operation: Operation) => {
      handleIncomingOperation(operation)
    })

    webSocketService.on('event', (event: CollaborationEvent) => {
      handleIncomingEvent(event)
    })

    webSocketService.on('syncStateChanged', (state: SyncState) => {
      updateSyncState(state)
    })

    webSocketService.on('error', (error: Error) => {
      console.error('WebSocket error:', error)
    })
  }

  function setupSharingServiceListeners() {
    if (!sharingService) return

    sharingService.on('shareCreated', (share: CollaborativeChat) => {
      collaborativeChats.set(share.id, share)
      updateStats()
    })

    sharingService.on('userJoined', (shareId: string, user: CollaborationUser) => {
      onlineUsers.set(user.id, user)
      updateStats()
    })

    sharingService.on('userLeft', (shareId: string, userId: string) => {
      onlineUsers.delete(userId)
      userCursors.delete(userId)
      updateStats()
    })
  }

  // ============ 事件处理 ============
  function handleIncomingOperation(operation: Operation) {
    // Future: Implement operation application logic - Issue #operation-application
    console.log('Received operation:', operation)
    
    // 移除对应的待处理操作
    const chatOperations = pendingOperations.get(operation.chatId) || []
    const updatedOperations = chatOperations.filter(op => op.id !== operation.id)
    pendingOperations.set(operation.chatId, updatedOperations)
  }

  function handleIncomingEvent(event: CollaborationEvent) {
    console.log('Received event:', event)
    
    switch (event.type) {
      case 'USER_JOINED':
        // 处理用户加入
        break
      case 'USER_LEFT':
        // 处理用户离开
        break
      case 'USER_CURSOR_MOVED':
        // 更新用户光标
        updateUserCursor(event.userId, event.data)
        break
      // ... 其他事件处理
    }
  }

  // ============ 工具方法 ============
  function generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  function generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // ============ 清理 ============
  function dispose() {
    if (webSocketService) {
      webSocketService.dispose()
      WebSocketServiceFactory.destroyInstance()
    }
    
    // 清理状态
    collaborativeChats.clear()
    onlineUsers.clear()
    userCursors.clear()
    syncStates.clear()
    pendingOperations.clear()
    conflicts.clear()
    
    currentShareId.value = null
    currentUserId.value = null
    isInitialized.value = false
  }

  return {
    // 状态
    isInitialized,
    config,
    collaborativeChats,
    currentShareId,
    currentUserId,
    onlineUsers,
    userCursors,
    syncStates,
    pendingOperations,
    conflicts,
    isConnected,
    isReconnecting,
    connectionLatency,
    stats,

    // 计算属性
    currentShare,
    currentUser,
    isOwner,
    canEdit,
    participants,
    activeConflicts,

    // 方法
    initialize,
    updateConfig,
    connect,
    disconnect,
    createShare,
    joinShare,
    leaveShare,
    setCurrentUser,
    updateUserStatus,
    updateUserCursor,
    sendOperation,
    sendEvent,
    requestSync,
    updateSyncState,
    addConflict,
    resolveConflict,
    updateStats,
    dispose
  }
})