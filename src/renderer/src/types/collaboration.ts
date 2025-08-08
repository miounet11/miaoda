/**
 * 实时协作功能类型定义
 * 支持多用户协作、会话分享、权限控制等功能
 */

// ============ 用户和会话 ============
export interface CollaborationUser {
  id: string
  name: string
  email?: string
  avatar?: string
  role: UserRole
  status: UserStatus
  lastSeen: Date
  cursor?: UserCursor
  permissions: UserPermission[]
}

export interface UserCursor {
  messageId?: string
  position: number
  selection?: {
    start: number
    end: number
  }
  color: string
}

export enum UserRole {
  OWNER = 'owner',
  EDITOR = 'editor',
  VIEWER = 'viewer',
  COMMENTOR = 'commentor'
}

export enum UserStatus {
  ONLINE = 'online',
  AWAY = 'away',
  BUSY = 'busy',
  OFFLINE = 'offline'
}

export interface UserPermission {
  action: PermissionAction
  granted: boolean
  grantedAt: Date
  grantedBy: string
}

export enum PermissionAction {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  SHARE = 'share',
  ADMIN = 'admin',
  EXPORT = 'export'
}

// ============ 协作会话 ============
export interface CollaborativeChat {
  id: string
  baseChat: string // 基础chat ID
  shareId: string // 分享标识
  title: string
  description?: string
  owner: string
  participants: CollaborationUser[]
  shareSettings: ShareSettings
  encryption?: EncryptionSettings
  createdAt: Date
  updatedAt: Date
  lastActivity: Date
  status: CollaborationStatus
  version: number
  conflictResolution: ConflictResolutionStrategy
}

export interface ShareSettings {
  isPublic: boolean
  allowAnonymous: boolean
  expiresAt?: Date
  maxParticipants?: number
  requireApproval: boolean
  allowInvites: boolean
  shareCode?: string
  shareUrl?: string
  accessCount: number
}

export interface EncryptionSettings {
  enabled: boolean
  algorithm: string
  keyId: string
  saltRounds?: number
}

export enum CollaborationStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  ARCHIVED = 'archived',
  EXPIRED = 'expired'
}

export enum ConflictResolutionStrategy {
  LAST_WRITE_WINS = 'last_write_wins',
  MERGE = 'merge',
  MANUAL = 'manual',
  CRDT = 'crdt'
}

// ============ 实时事件 ============
export interface CollaborationEvent {
  id: string
  type: CollaborationEventType
  chatId: string
  userId: string
  timestamp: Date
  data: any
  version: number
  signature?: string // 用于验证事件完整性
}

export enum CollaborationEventType {
  // 用户事件
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
  USER_STATUS_CHANGED = 'user_status_changed',
  USER_CURSOR_MOVED = 'user_cursor_moved',
  
  // 消息事件
  MESSAGE_ADDED = 'message_added',
  MESSAGE_EDITED = 'message_edited',
  MESSAGE_DELETED = 'message_deleted',
  MESSAGE_TYPING_START = 'message_typing_start',
  MESSAGE_TYPING_END = 'message_typing_end',
  
  // 权限事件
  PERMISSION_GRANTED = 'permission_granted',
  PERMISSION_REVOKED = 'permission_revoked',
  ROLE_CHANGED = 'role_changed',
  
  // 分享事件
  SHARE_CREATED = 'share_created',
  SHARE_UPDATED = 'share_updated',
  SHARE_EXPIRED = 'share_expired',
  
  // 系统事件
  SYNC_REQUEST = 'sync_request',
  SYNC_RESPONSE = 'sync_response',
  CONFLICT_DETECTED = 'conflict_detected',
  CONFLICT_RESOLVED = 'conflict_resolved'
}

// ============ 操作变更 ============
export interface Operation {
  id: string
  type: OperationType
  chatId: string
  messageId?: string
  userId: string
  timestamp: Date
  data: OperationData
  causality: string[] // 因果关系，用于CRDT排序
  signature?: string
}

export enum OperationType {
  INSERT_TEXT = 'insert_text',
  DELETE_TEXT = 'delete_text',
  FORMAT_TEXT = 'format_text',
  ADD_MESSAGE = 'add_message',
  DELETE_MESSAGE = 'delete_message',
  EDIT_MESSAGE = 'edit_message',
  ADD_ATTACHMENT = 'add_attachment',
  REMOVE_ATTACHMENT = 'remove_attachment'
}

export interface OperationData {
  position?: number
  length?: number
  content?: string
  messageData?: any
  attachmentData?: any
  metadata?: Record<string, any>
}

// ============ 冲突处理 ============
export interface Conflict {
  id: string
  chatId: string
  messageId?: string
  operations: Operation[]
  detectedAt: Date
  resolvedAt?: Date
  resolution?: ConflictResolution
  status: ConflictStatus
}

export interface ConflictResolution {
  strategy: ConflictResolutionStrategy
  chosenOperation?: string
  mergedResult?: any
  resolvedBy: string
  note?: string
}

export enum ConflictStatus {
  PENDING = 'pending',
  RESOLVED = 'resolved',
  MANUAL_REVIEW = 'manual_review'
}

// ============ 同步状态 ============
export interface SyncState {
  chatId: string
  version: number
  lastSyncAt: Date
  pendingOperations: Operation[]
  isOnline: boolean
  isSyncing: boolean
  conflictsCount: number
  lastError?: SyncError
}

export interface SyncError {
  code: string
  message: string
  timestamp: Date
  retryable: boolean
  retryCount: number
}

// ============ 审计和日志 ============
export interface AuditLog {
  id: string
  chatId: string
  userId: string
  action: string
  resource: string
  timestamp: Date
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

// ============ WebSocket消息 ============
export interface WebSocketMessage {
  id: string
  type: WebSocketMessageType
  chatId?: string
  userId?: string
  timestamp: Date
  payload: any
  signature?: string
}

export enum WebSocketMessageType {
  PING = 'ping',
  PONG = 'pong',
  JOIN_CHAT = 'join_chat',
  LEAVE_CHAT = 'leave_chat',
  OPERATION = 'operation',
  EVENT = 'event',
  SYNC_REQUEST = 'sync_request',
  SYNC_RESPONSE = 'sync_response',
  ERROR = 'error',
  NOTIFICATION = 'notification'
}

// ============ API接口 ============
export interface CreateShareRequest {
  chatId: string
  settings: Partial<ShareSettings>
  encryption?: Partial<EncryptionSettings>
}

export interface CreateShareResponse {
  success: boolean
  shareId?: string
  shareUrl?: string
  shareCode?: string
  error?: string
}

export interface JoinShareRequest {
  shareId?: string
  shareCode?: string
  shareUrl?: string
  userInfo?: {
    name: string
    email?: string
  }
}

export interface JoinShareResponse {
  success: boolean
  chatId?: string
  userRole?: UserRole
  participants?: CollaborationUser[]
  error?: string
}

// ============ 客户端配置 ============
export interface CollaborationConfig {
  serverUrl: string
  reconnectInterval: number
  maxReconnectAttempts: number
  heartbeatInterval: number
  syncInterval: number
  conflictDetectionEnabled: boolean
  encryptionEnabled: boolean
  offlineSyncEnabled: boolean
  maxOfflineOperations: number
}

// ============ 统计和分析 ============
export interface CollaborationStats {
  totalShares: number
  activeShares: number
  totalParticipants: number
  averageSessionDuration: number
  messagesSynced: number
  conflictsResolved: number
  lastUpdated: Date
}

// ============ 导出接口 ============
export interface CollaborationExportOptions {
  includeParticipants: boolean
  includeAuditLog: boolean
  includeConflictHistory: boolean
  format: 'json' | 'csv' | 'pdf'
  dateRange?: {
    start: Date
    end: Date
  }
}