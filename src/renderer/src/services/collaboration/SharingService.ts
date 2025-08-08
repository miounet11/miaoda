/**
 * 会话分享服务
 * 处理会话分享、权限管理、访问控制等功能
 */

import { EventEmitter } from 'events'
import type {
  CollaborativeChat,
  ShareSettings,
  CollaborationUser,
  UserRole,
  UserPermission,
  PermissionAction,
  CreateShareRequest,
  CreateShareResponse,
  JoinShareRequest,
  JoinShareResponse,
  AuditLog,
  EncryptionSettings
} from '../../types/collaboration'

export interface SharingServiceEvents {
  shareCreated: (share: CollaborativeChat) => void
  shareUpdated: (share: CollaborativeChat) => void
  shareExpired: (shareId: string) => void
  userJoined: (shareId: string, user: CollaborationUser) => void
  userLeft: (shareId: string, userId: string) => void
  permissionChanged: (shareId: string, userId: string, permission: UserPermission) => void
}

export class SharingService extends EventEmitter {
  private shares: Map<string, CollaborativeChat> = new Map()
  private sharesByCode: Map<string, string> = new Map() // shareCode -> shareId
  private auditLogs: Map<string, AuditLog[]> = new Map()
  
  constructor() {
    super()
    this.startExpirationCheck()
  }

  /**
   * 创建分享
   */
  async createShare(request: CreateShareRequest): Promise<CreateShareResponse> {
    try {
      const shareId = this.generateShareId()
      const shareCode = this.generateShareCode()
      const shareUrl = this.generateShareUrl(shareId)

      const collaborativeChat: CollaborativeChat = {
        id: shareId,
        baseChat: request.chatId,
        shareId,
        title: `Shared Chat ${shareId.slice(-6)}`,
        owner: 'current-user', // TODO: 从用户上下文获取
        participants: [],
        shareSettings: {
          isPublic: false,
          allowAnonymous: true,
          requireApproval: false,
          allowInvites: true,
          shareCode,
          shareUrl,
          accessCount: 0,
          ...request.settings
        },
        encryption: request.encryption,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActivity: new Date(),
        status: 'active',
        version: 1,
        conflictResolution: 'crdt'
      }

      this.shares.set(shareId, collaborativeChat)
      this.sharesByCode.set(shareCode, shareId)

      this.logAudit(shareId, 'current-user', 'SHARE_CREATED', 'share', {
        shareId,
        settings: request.settings
      })

      this.emit('shareCreated', collaborativeChat)

      return {
        success: true,
        shareId,
        shareUrl,
        shareCode
      }
    } catch (error) {
      console.error('Failed to create share:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 加入分享
   */
  async joinShare(request: JoinShareRequest): Promise<JoinShareResponse> {
    try {
      let shareId: string | undefined

      // 通过不同方式查找分享
      if (request.shareId) {
        shareId = request.shareId
      } else if (request.shareCode) {
        shareId = this.sharesByCode.get(request.shareCode)
      } else if (request.shareUrl) {
        shareId = this.extractShareIdFromUrl(request.shareUrl)
      }

      if (!shareId) {
        return {
          success: false,
          error: 'Invalid share identifier'
        }
      }

      const share = this.shares.get(shareId)
      if (!share) {
        return {
          success: false,
          error: 'Share not found'
        }
      }

      // 检查分享是否过期
      if (share.shareSettings.expiresAt && share.shareSettings.expiresAt < new Date()) {
        return {
          success: false,
          error: 'Share has expired'
        }
      }

      // 检查参与者限制
      if (share.shareSettings.maxParticipants && 
          share.participants.length >= share.shareSettings.maxParticipants) {
        return {
          success: false,
          error: 'Maximum participants reached'
        }
      }

      // 创建新用户
      const userId = this.generateUserId()
      const user: CollaborationUser = {
        id: userId,
        name: request.userInfo?.name || `User ${userId.slice(-4)}`,
        email: request.userInfo?.email,
        role: UserRole.VIEWER, // 默认角色
        status: 'online',
        lastSeen: new Date(),
        permissions: this.getDefaultPermissions(UserRole.VIEWER)
      }

      // 添加到参与者列表
      share.participants.push(user)
      share.shareSettings.accessCount++
      share.lastActivity = new Date()

      this.logAudit(shareId, userId, 'USER_JOINED', 'share', {
        userInfo: request.userInfo
      })

      this.emit('userJoined', shareId, user)

      return {
        success: true,
        chatId: share.baseChat,
        userRole: user.role,
        participants: share.participants
      }
    } catch (error) {
      console.error('Failed to join share:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 更新分享设置
   */
  async updateShareSettings(shareId: string, settings: Partial<ShareSettings>): Promise<boolean> {
    const share = this.shares.get(shareId)
    if (!share) {
      return false
    }

    share.shareSettings = { ...share.shareSettings, ...settings }
    share.updatedAt = new Date()

    this.logAudit(shareId, 'current-user', 'SHARE_UPDATED', 'share', {
      settings
    })

    this.emit('shareUpdated', share)
    return true
  }

  /**
   * 更新用户角色
   */
  async updateUserRole(shareId: string, userId: string, role: UserRole): Promise<boolean> {
    const share = this.shares.get(shareId)
    if (!share) {
      return false
    }

    const user = share.participants.find(p => p.id === userId)
    if (!user) {
      return false
    }

    const oldRole = user.role
    user.role = role
    user.permissions = this.getDefaultPermissions(role)

    this.logAudit(shareId, 'current-user', 'ROLE_CHANGED', 'user', {
      userId,
      oldRole,
      newRole: role
    })

    this.emit('permissionChanged', shareId, userId, user.permissions[0])
    return true
  }

  /**
   * 授予权限
   */
  async grantPermission(shareId: string, userId: string, action: PermissionAction): Promise<boolean> {
    const share = this.shares.get(shareId)
    if (!share) {
      return false
    }

    const user = share.participants.find(p => p.id === userId)
    if (!user) {
      return false
    }

    const existingPermission = user.permissions.find(p => p.action === action)
    if (existingPermission) {
      existingPermission.granted = true
      existingPermission.grantedAt = new Date()
      existingPermission.grantedBy = 'current-user'
    } else {
      user.permissions.push({
        action,
        granted: true,
        grantedAt: new Date(),
        grantedBy: 'current-user'
      })
    }

    this.logAudit(shareId, 'current-user', 'PERMISSION_GRANTED', 'permission', {
      userId,
      action
    })

    return true
  }

  /**
   * 撤销权限
   */
  async revokePermission(shareId: string, userId: string, action: PermissionAction): Promise<boolean> {
    const share = this.shares.get(shareId)
    if (!share) {
      return false
    }

    const user = share.participants.find(p => p.id === userId)
    if (!user) {
      return false
    }

    const permission = user.permissions.find(p => p.action === action)
    if (permission) {
      permission.granted = false
    }

    this.logAudit(shareId, 'current-user', 'PERMISSION_REVOKED', 'permission', {
      userId,
      action
    })

    return true
  }

  /**
   * 移除用户
   */
  async removeUser(shareId: string, userId: string): Promise<boolean> {
    const share = this.shares.get(shareId)
    if (!share) {
      return false
    }

    const userIndex = share.participants.findIndex(p => p.id === userId)
    if (userIndex === -1) {
      return false
    }

    share.participants.splice(userIndex, 1)
    share.updatedAt = new Date()

    this.logAudit(shareId, 'current-user', 'USER_REMOVED', 'user', {
      userId
    })

    this.emit('userLeft', shareId, userId)
    return true
  }

  /**
   * 删除分享
   */
  async deleteShare(shareId: string): Promise<boolean> {
    const share = this.shares.get(shareId)
    if (!share) {
      return false
    }

    // 清理索引
    if (share.shareSettings.shareCode) {
      this.sharesByCode.delete(share.shareSettings.shareCode)
    }

    this.shares.delete(shareId)
    this.auditLogs.delete(shareId)

    this.logAudit(shareId, 'current-user', 'SHARE_DELETED', 'share', {})
    return true
  }

  /**
   * 获取分享信息
   */
  getShare(shareId: string): CollaborativeChat | undefined {
    return this.shares.get(shareId)
  }

  /**
   * 获取所有分享
   */
  getAllShares(): CollaborativeChat[] {
    return Array.from(this.shares.values())
  }

  /**
   * 检查用户权限
   */
  hasPermission(shareId: string, userId: string, action: PermissionAction): boolean {
    const share = this.shares.get(shareId)
    if (!share) {
      return false
    }

    const user = share.participants.find(p => p.id === userId)
    if (!user) {
      return false
    }

    // 所有者拥有所有权限
    if (share.owner === userId) {
      return true
    }

    // 检查特定权限
    const permission = user.permissions.find(p => p.action === action)
    return permission?.granted || false
  }

  /**
   * 获取审计日志
   */
  getAuditLogs(shareId: string): AuditLog[] {
    return this.auditLogs.get(shareId) || []
  }

  /**
   * 生成分享统计
   */
  generateStats() {
    const shares = Array.from(this.shares.values())
    const activeShares = shares.filter(s => s.status === 'active')
    
    return {
      totalShares: shares.length,
      activeShares: activeShares.length,
      totalParticipants: shares.reduce((sum, s) => sum + s.participants.length, 0),
      averageSessionDuration: 0, // TODO: 计算平均会话时长
      messagesSynced: 0, // TODO: 从同步服务获取
      conflictsResolved: 0, // TODO: 从冲突解决服务获取
      lastUpdated: new Date()
    }
  }

  /**
   * 根据角色获取默认权限
   */
  private getDefaultPermissions(role: UserRole): UserPermission[] {
    const now = new Date()
    const grantedBy = 'system'

    const permissions: UserPermission[] = [
      { action: PermissionAction.READ, granted: true, grantedAt: now, grantedBy }
    ]

    switch (role) {
      case UserRole.OWNER:
        permissions.push(
          { action: PermissionAction.WRITE, granted: true, grantedAt: now, grantedBy },
          { action: PermissionAction.DELETE, granted: true, grantedAt: now, grantedBy },
          { action: PermissionAction.SHARE, granted: true, grantedAt: now, grantedBy },
          { action: PermissionAction.ADMIN, granted: true, grantedAt: now, grantedBy },
          { action: PermissionAction.EXPORT, granted: true, grantedAt: now, grantedBy }
        )
        break
      
      case UserRole.EDITOR:
        permissions.push(
          { action: PermissionAction.WRITE, granted: true, grantedAt: now, grantedBy },
          { action: PermissionAction.EXPORT, granted: true, grantedAt: now, grantedBy }
        )
        break
      
      case UserRole.COMMENTOR:
        permissions.push(
          { action: PermissionAction.WRITE, granted: true, grantedAt: now, grantedBy }
        )
        break
    }

    return permissions
  }

  /**
   * 记录审计日志
   */
  private logAudit(shareId: string, userId: string, action: string, resource: string, metadata: any): void {
    const log: AuditLog = {
      id: this.generateId(),
      chatId: shareId,
      userId,
      action,
      resource,
      timestamp: new Date(),
      metadata
    }

    const logs = this.auditLogs.get(shareId) || []
    logs.push(log)
    this.auditLogs.set(shareId, logs)

    // 限制日志数量
    if (logs.length > 1000) {
      logs.splice(0, 100)
    }
  }

  /**
   * 开始过期检查
   */
  private startExpirationCheck(): void {
    setInterval(() => {
      const now = new Date()
      
      for (const [shareId, share] of this.shares.entries()) {
        if (share.shareSettings.expiresAt && share.shareSettings.expiresAt < now) {
          share.status = 'expired'
          this.emit('shareExpired', shareId)
          
          this.logAudit(shareId, 'system', 'SHARE_EXPIRED', 'share', {
            expiredAt: now
          })
        }
      }
    }, 60000) // 每分钟检查一次
  }

  /**
   * 生成分享ID
   */
  private generateShareId(): string {
    return `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 生成分享代码
   */
  private generateShareCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  /**
   * 生成用户ID
   */
  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 生成通用ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 生成分享URL
   */
  private generateShareUrl(shareId: string): string {
    const baseUrl = window.location.origin
    return `${baseUrl}/share/${shareId}`
  }

  /**
   * 从URL提取分享ID
   */
  private extractShareIdFromUrl(url: string): string | undefined {
    const match = url.match(/\/share\/([^\/\?]+)/)
    return match ? match[1] : undefined
  }
}