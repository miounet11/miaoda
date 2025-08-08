import { Database } from 'better-sqlite3'
import { BaseDatabaseService } from './BaseDatabaseService'
import { nanoid } from 'nanoid'

/**
 * Collaboration Service for conversation sharing and real-time collaboration
 */

interface SharedConversation {
  id: string
  chatId: string
  shareId: string
  creatorId: string
  title: string
  description?: string
  permissions: 'read' | 'comment' | 'edit'
  isPublic: boolean
  expiresAt?: Date
  password?: string
  createdAt: Date
  updatedAt: Date
  accessCount: number
  lastAccessedAt?: Date
}

interface ConversationAccess {
  id: string
  shareId: string
  userId: string
  userEmail?: string
  permissions: 'read' | 'comment' | 'edit'
  invitedBy: string
  joinedAt: Date
  lastActiveAt: Date
  isActive: boolean
}

interface CollaborationComment {
  id: string
  shareId: string
  messageId: string
  userId: string
  userEmail?: string
  userName?: string
  content: string
  parentCommentId?: string
  createdAt: Date
  updatedAt: Date
  isResolved: boolean
}

interface RealTimeSession {
  id: string
  shareId: string
  userId: string
  socketId: string
  userName?: string
  cursor?: { messageId: string; position: number }
  isTyping: boolean
  joinedAt: Date
  lastActivityAt: Date
}

interface ShareAnalytics {
  shareId: string
  totalViews: number
  uniqueViewers: number
  totalComments: number
  activeUsers: number
  popularMessages: Array<{ messageId: string; views: number; comments: number }>
  viewHistory: Array<{ date: string; views: number; users: number }>
}

export class CollaborationService extends BaseDatabaseService {
  constructor(db: Database) {
    super(db)
    this.initializeTables()
  }

  private initializeTables(): void {
    try {
      // Shared conversations table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS shared_conversations (
          id TEXT PRIMARY KEY,
          chat_id TEXT NOT NULL,
          share_id TEXT UNIQUE NOT NULL,
          creator_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          permissions TEXT NOT NULL CHECK (permissions IN ('read', 'comment', 'edit')),
          is_public INTEGER NOT NULL DEFAULT 0,
          expires_at TEXT,
          password TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          access_count INTEGER DEFAULT 0,
          last_accessed_at TEXT,
          metadata TEXT DEFAULT '{}',
          FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_shared_conversations_share_id ON shared_conversations(share_id);
        CREATE INDEX IF NOT EXISTS idx_shared_conversations_creator ON shared_conversations(creator_id);
        CREATE INDEX IF NOT EXISTS idx_shared_conversations_public ON shared_conversations(is_public);
      `)

      // Conversation access control
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS conversation_access (
          id TEXT PRIMARY KEY,
          share_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          user_email TEXT,
          user_name TEXT,
          permissions TEXT NOT NULL CHECK (permissions IN ('read', 'comment', 'edit')),
          invited_by TEXT NOT NULL,
          joined_at TEXT NOT NULL,
          last_active_at TEXT NOT NULL,
          is_active INTEGER NOT NULL DEFAULT 1,
          metadata TEXT DEFAULT '{}',
          FOREIGN KEY (share_id) REFERENCES shared_conversations(share_id) ON DELETE CASCADE,
          UNIQUE(share_id, user_id)
        );

        CREATE INDEX IF NOT EXISTS idx_conversation_access_share ON conversation_access(share_id);
        CREATE INDEX IF NOT EXISTS idx_conversation_access_user ON conversation_access(user_id);
        CREATE INDEX IF NOT EXISTS idx_conversation_access_active ON conversation_access(is_active);
      `)

      // Collaboration comments
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS collaboration_comments (
          id TEXT PRIMARY KEY,
          share_id TEXT NOT NULL,
          message_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          user_email TEXT,
          user_name TEXT,
          content TEXT NOT NULL,
          parent_comment_id TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          is_resolved INTEGER NOT NULL DEFAULT 0,
          metadata TEXT DEFAULT '{}',
          FOREIGN KEY (share_id) REFERENCES shared_conversations(share_id) ON DELETE CASCADE,
          FOREIGN KEY (parent_comment_id) REFERENCES collaboration_comments(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_collab_comments_share ON collaboration_comments(share_id);
        CREATE INDEX IF NOT EXISTS idx_collab_comments_message ON collaboration_comments(message_id);
        CREATE INDEX IF NOT EXISTS idx_collab_comments_user ON collaboration_comments(user_id);
        CREATE INDEX IF NOT EXISTS idx_collab_comments_parent ON collaboration_comments(parent_comment_id);
      `)

      // Real-time sessions for active collaboration
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS realtime_sessions (
          id TEXT PRIMARY KEY,
          share_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          socket_id TEXT NOT NULL,
          user_name TEXT,
          user_email TEXT,
          cursor_data TEXT DEFAULT '{}',
          is_typing INTEGER NOT NULL DEFAULT 0,
          joined_at TEXT NOT NULL,
          last_activity_at TEXT NOT NULL,
          FOREIGN KEY (share_id) REFERENCES shared_conversations(share_id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_realtime_sessions_share ON realtime_sessions(share_id);
        CREATE INDEX IF NOT EXISTS idx_realtime_sessions_user ON realtime_sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_realtime_sessions_socket ON realtime_sessions(socket_id);
      `)

      // Share analytics
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS share_analytics (
          id TEXT PRIMARY KEY,
          share_id TEXT NOT NULL,
          event_type TEXT NOT NULL,
          user_id TEXT,
          user_email TEXT,
          message_id TEXT,
          metadata TEXT DEFAULT '{}',
          created_at TEXT NOT NULL,
          FOREIGN KEY (share_id) REFERENCES shared_conversations(share_id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_share_analytics_share ON share_analytics(share_id);
        CREATE INDEX IF NOT EXISTS idx_share_analytics_event ON share_analytics(event_type);
        CREATE INDEX IF NOT EXISTS idx_share_analytics_created ON share_analytics(created_at);
      `)

      // Share templates for common sharing patterns
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS share_templates (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          permissions TEXT NOT NULL,
          is_public INTEGER NOT NULL DEFAULT 0,
          expires_in_hours INTEGER,
          allow_comments INTEGER NOT NULL DEFAULT 1,
          require_password INTEGER NOT NULL DEFAULT 0,
          creator_id TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
      `)

    } catch (error) {
      throw new Error(`Failed to initialize collaboration tables: ${error}`)
    }
  }

  /**
   * Share a conversation with specified permissions
   */
  async shareConversation(
    chatId: string,
    creatorId: string,
    options: {
      title?: string
      description?: string
      permissions: 'read' | 'comment' | 'edit'
      isPublic?: boolean
      expiresInHours?: number
      password?: string
      template?: string
    }
  ): Promise<SharedConversation> {
    const now = new Date()
    const shareId = nanoid(12) // Short, URL-friendly ID
    
    // Get chat title if not provided
    let title = options.title
    if (!title) {
      const chat = this.db.prepare('SELECT title FROM chats WHERE id = ?').get(chatId) as { title: string } | undefined
      title = chat?.title || 'Shared Conversation'
    }

    const expiresAt = options.expiresInHours 
      ? new Date(now.getTime() + options.expiresInHours * 60 * 60 * 1000)
      : undefined

    const sharedConversation: SharedConversation = {
      id: nanoid(),
      chatId,
      shareId,
      creatorId,
      title,
      description: options.description,
      permissions: options.permissions,
      isPublic: options.isPublic || false,
      expiresAt,
      password: options.password,
      createdAt: now,
      updatedAt: now,
      accessCount: 0
    }

    try {
      this.db.prepare(`
        INSERT INTO shared_conversations 
        (id, chat_id, share_id, creator_id, title, description, permissions, 
         is_public, expires_at, password, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        sharedConversation.id,
        chatId,
        shareId,
        creatorId,
        title,
        options.description || null,
        options.permissions,
        options.isPublic ? 1 : 0,
        expiresAt?.toISOString() || null,
        options.password || null,
        now.toISOString(),
        now.toISOString()
      )

      // Log sharing event
      await this.logShareEvent(shareId, 'share_created', creatorId)

      return sharedConversation
    } catch (error) {
      throw new Error(`Failed to share conversation: ${error}`)
    }
  }

  /**
   * Get shared conversation by share ID
   */
  getSharedConversation(shareId: string): SharedConversation | null {
    try {
      const row = this.db.prepare(`
        SELECT * FROM shared_conversations WHERE share_id = ?
      `).get(shareId) as any

      if (!row) return null

      // Check if expired
      if (row.expires_at && new Date(row.expires_at) < new Date()) {
        return null
      }

      return {
        id: row.id,
        chatId: row.chat_id,
        shareId: row.share_id,
        creatorId: row.creator_id,
        title: row.title,
        description: row.description,
        permissions: row.permissions,
        isPublic: row.is_public === 1,
        expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
        password: row.password,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        accessCount: row.access_count,
        lastAccessedAt: row.last_accessed_at ? new Date(row.last_accessed_at) : undefined
      }
    } catch (error) {
      console.error('Failed to get shared conversation:', error)
      return null
    }
  }

  /**
   * Access a shared conversation (with permission check)
   */
  async accessSharedConversation(
    shareId: string,
    userId: string,
    password?: string,
    userInfo?: { email?: string; name?: string }
  ): Promise<{ allowed: boolean; reason?: string; conversation?: SharedConversation }> {
    try {
      const conversation = this.getSharedConversation(shareId)
      if (!conversation) {
        return { allowed: false, reason: 'Conversation not found or expired' }
      }

      // Check password if required
      if (conversation.password && conversation.password !== password) {
        return { allowed: false, reason: 'Invalid password' }
      }

      // Check if user has access
      const hasAccess = this.userHasAccess(shareId, userId)
      const isCreator = conversation.creatorId === userId

      if (!conversation.isPublic && !hasAccess && !isCreator) {
        return { allowed: false, reason: 'Access denied' }
      }

      // Grant access if not already present
      if (!hasAccess && !isCreator) {
        await this.grantAccess(shareId, userId, 'read', conversation.creatorId, userInfo)
      }

      // Update access statistics
      await this.updateAccessStats(shareId, userId)
      await this.logShareEvent(shareId, 'conversation_accessed', userId)

      return { allowed: true, conversation }
    } catch (error) {
      console.error('Failed to access shared conversation:', error)
      return { allowed: false, reason: 'Internal error' }
    }
  }

  /**
   * Get conversation messages for sharing (with filtering for sensitive content)
   */
  getSharedConversationMessages(shareId: string, userId: string): any[] {
    try {
      const conversation = this.getSharedConversation(shareId)
      if (!conversation) return []

      if (!this.userHasAccess(shareId, userId) && conversation.creatorId !== userId) {
        return []
      }

      // Get messages with comments
      const messages = this.db.prepare(`
        SELECT 
          m.*,
          (
            SELECT COUNT(*) 
            FROM collaboration_comments cc 
            WHERE cc.message_id = m.id AND cc.share_id = ?
          ) as comment_count
        FROM messages m
        WHERE m.chat_id = ?
        ORDER BY m.created_at ASC
      `).all(shareId, conversation.chatId) as any[]

      return messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: new Date(msg.created_at),
        attachments: msg.attachments ? JSON.parse(msg.attachments) : [],
        metadata: msg.metadata ? JSON.parse(msg.metadata) : {},
        commentCount: msg.comment_count
      }))
    } catch (error) {
      console.error('Failed to get shared conversation messages:', error)
      return []
    }
  }

  /**
   * Add comment to a message in shared conversation
   */
  async addComment(
    shareId: string,
    messageId: string,
    userId: string,
    content: string,
    parentCommentId?: string,
    userInfo?: { email?: string; name?: string }
  ): Promise<CollaborationComment | null> {
    try {
      const conversation = this.getSharedConversation(shareId)
      if (!conversation) return null

      const userAccess = this.getUserAccess(shareId, userId)
      if (!userAccess && conversation.creatorId !== userId) {
        return null
      }

      // Check if user has comment permission
      const permissions = userAccess?.permissions || 'read'
      if (permissions === 'read' && conversation.creatorId !== userId) {
        return null
      }

      const now = new Date()
      const comment: CollaborationComment = {
        id: nanoid(),
        shareId,
        messageId,
        userId,
        userEmail: userInfo?.email,
        userName: userInfo?.name,
        content,
        parentCommentId,
        createdAt: now,
        updatedAt: now,
        isResolved: false
      }

      this.db.prepare(`
        INSERT INTO collaboration_comments 
        (id, share_id, message_id, user_id, user_email, user_name, content, 
         parent_comment_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        comment.id,
        shareId,
        messageId,
        userId,
        userInfo?.email || null,
        userInfo?.name || null,
        content,
        parentCommentId || null,
        now.toISOString(),
        now.toISOString()
      )

      await this.logShareEvent(shareId, 'comment_added', userId, { messageId })

      return comment
    } catch (error) {
      console.error('Failed to add comment:', error)
      return null
    }
  }

  /**
   * Get comments for a message
   */
  getMessageComments(shareId: string, messageId: string): CollaborationComment[] {
    try {
      const comments = this.db.prepare(`
        SELECT * FROM collaboration_comments 
        WHERE share_id = ? AND message_id = ?
        ORDER BY created_at ASC
      `).all(shareId, messageId) as any[]

      return comments.map(comment => ({
        id: comment.id,
        shareId: comment.share_id,
        messageId: comment.message_id,
        userId: comment.user_id,
        userEmail: comment.user_email,
        userName: comment.user_name,
        content: comment.content,
        parentCommentId: comment.parent_comment_id,
        createdAt: new Date(comment.created_at),
        updatedAt: new Date(comment.updated_at),
        isResolved: comment.is_resolved === 1
      }))
    } catch (error) {
      console.error('Failed to get message comments:', error)
      return []
    }
  }

  /**
   * Invite user to shared conversation
   */
  async inviteUser(
    shareId: string,
    inviterUserId: string,
    inviteeUserId: string,
    permissions: 'read' | 'comment' | 'edit',
    userInfo?: { email?: string; name?: string }
  ): Promise<boolean> {
    try {
      const conversation = this.getSharedConversation(shareId)
      if (!conversation) return false

      // Check if inviter has permission to invite
      if (conversation.creatorId !== inviterUserId) {
        const inviterAccess = this.getUserAccess(shareId, inviterUserId)
        if (!inviterAccess || inviterAccess.permissions !== 'edit') {
          return false
        }
      }

      await this.grantAccess(shareId, inviteeUserId, permissions, inviterUserId, userInfo)
      await this.logShareEvent(shareId, 'user_invited', inviterUserId, { 
        inviteeUserId, 
        permissions 
      })

      return true
    } catch (error) {
      console.error('Failed to invite user:', error)
      return false
    }
  }

  /**
   * Get active users in shared conversation
   */
  getActiveUsers(shareId: string): any[] {
    try {
      return this.db.prepare(`
        SELECT user_id, user_name, user_email, joined_at, last_active_at
        FROM conversation_access 
        WHERE share_id = ? AND is_active = 1
        ORDER BY last_active_at DESC
      `).all(shareId) as any[]
    } catch (error) {
      console.error('Failed to get active users:', error)
      return []
    }
  }

  /**
   * Get sharing analytics
   */
  getShareAnalytics(shareId: string): ShareAnalytics | null {
    try {
      const totalViews = this.db.prepare(`
        SELECT COUNT(*) as count 
        FROM share_analytics 
        WHERE share_id = ? AND event_type = 'conversation_accessed'
      `).get(shareId) as { count: number }

      const uniqueViewers = this.db.prepare(`
        SELECT COUNT(DISTINCT user_id) as count 
        FROM share_analytics 
        WHERE share_id = ? AND event_type = 'conversation_accessed'
      `).get(shareId) as { count: number }

      const totalComments = this.db.prepare(`
        SELECT COUNT(*) as count 
        FROM collaboration_comments 
        WHERE share_id = ?
      `).get(shareId) as { count: number }

      const activeUsers = this.db.prepare(`
        SELECT COUNT(*) as count 
        FROM conversation_access 
        WHERE share_id = ? AND is_active = 1
      `).get(shareId) as { count: number }

      const popularMessages = this.db.prepare(`
        SELECT 
          message_id,
          COUNT(CASE WHEN event_type = 'message_viewed' THEN 1 END) as views,
          COUNT(CASE WHEN event_type = 'comment_added' THEN 1 END) as comments
        FROM share_analytics 
        WHERE share_id = ? AND message_id IS NOT NULL
        GROUP BY message_id
        ORDER BY views DESC, comments DESC
        LIMIT 10
      `).all(shareId) as Array<{ message_id: string; views: number; comments: number }>

      const viewHistory = this.db.prepare(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as views,
          COUNT(DISTINCT user_id) as users
        FROM share_analytics 
        WHERE share_id = ? AND event_type = 'conversation_accessed'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `).all(shareId) as Array<{ date: string; views: number; users: number }>

      return {
        shareId,
        totalViews: totalViews.count,
        uniqueViewers: uniqueViewers.count,
        totalComments: totalComments.count,
        activeUsers: activeUsers.count,
        popularMessages: popularMessages.map(m => ({
          messageId: m.message_id,
          views: m.views,
          comments: m.comments
        })),
        viewHistory
      }
    } catch (error) {
      console.error('Failed to get share analytics:', error)
      return null
    }
  }

  /**
   * Update user's real-time session
   */
  async updateRealtimeSession(
    shareId: string,
    userId: string,
    socketId: string,
    updates: {
      userName?: string
      userEmail?: string
      cursor?: { messageId: string; position: number }
      isTyping?: boolean
    }
  ): Promise<void> {
    const now = new Date().toISOString()
    
    try {
      this.db.prepare(`
        INSERT OR REPLACE INTO realtime_sessions 
        (id, share_id, user_id, socket_id, user_name, user_email, cursor_data, is_typing, joined_at, last_activity_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `session_${shareId}_${userId}`,
        shareId,
        userId,
        socketId,
        updates.userName || null,
        updates.userEmail || null,
        JSON.stringify(updates.cursor || {}),
        updates.isTyping ? 1 : 0,
        now,
        now
      )
    } catch (error) {
      console.error('Failed to update realtime session:', error)
    }
  }

  /**
   * Get real-time sessions for a shared conversation
   */
  getRealtimeSessions(shareId: string): RealTimeSession[] {
    try {
      const sessions = this.db.prepare(`
        SELECT * FROM realtime_sessions 
        WHERE share_id = ? AND last_activity_at > datetime('now', '-5 minutes')
      `).all(shareId) as any[]

      return sessions.map(session => ({
        id: session.id,
        shareId: session.share_id,
        userId: session.user_id,
        socketId: session.socket_id,
        userName: session.user_name,
        cursor: JSON.parse(session.cursor_data || '{}'),
        isTyping: session.is_typing === 1,
        joinedAt: new Date(session.joined_at),
        lastActivityAt: new Date(session.last_activity_at)
      }))
    } catch (error) {
      console.error('Failed to get realtime sessions:', error)
      return []
    }
  }

  /**
   * Clean up expired shares and old sessions
   */
  async cleanup(): Promise<void> {
    try {
      const now = new Date().toISOString()
      
      // Remove expired shares
      this.db.prepare(`
        DELETE FROM shared_conversations 
        WHERE expires_at IS NOT NULL AND expires_at < ?
      `).run(now)

      // Remove old realtime sessions (older than 1 hour)
      this.db.prepare(`
        DELETE FROM realtime_sessions 
        WHERE last_activity_at < datetime('now', '-1 hour')
      `).run()

      // Clean up old analytics (older than 90 days)
      this.db.prepare(`
        DELETE FROM share_analytics 
        WHERE created_at < datetime('now', '-90 days')
      `).run()

    } catch (error) {
      console.error('Failed to cleanup collaboration data:', error)
    }
  }

  // Private helper methods

  private userHasAccess(shareId: string, userId: string): boolean {
    const access = this.db.prepare(`
      SELECT 1 FROM conversation_access 
      WHERE share_id = ? AND user_id = ? AND is_active = 1
    `).get(shareId, userId)
    
    return !!access
  }

  private getUserAccess(shareId: string, userId: string): ConversationAccess | null {
    const row = this.db.prepare(`
      SELECT * FROM conversation_access 
      WHERE share_id = ? AND user_id = ? AND is_active = 1
    `).get(shareId, userId) as any

    if (!row) return null

    return {
      id: row.id,
      shareId: row.share_id,
      userId: row.user_id,
      userEmail: row.user_email,
      permissions: row.permissions,
      invitedBy: row.invited_by,
      joinedAt: new Date(row.joined_at),
      lastActiveAt: new Date(row.last_active_at),
      isActive: row.is_active === 1
    }
  }

  private async grantAccess(
    shareId: string,
    userId: string,
    permissions: 'read' | 'comment' | 'edit',
    invitedBy: string,
    userInfo?: { email?: string; name?: string }
  ): Promise<void> {
    const now = new Date().toISOString()
    
    this.db.prepare(`
      INSERT OR REPLACE INTO conversation_access 
      (id, share_id, user_id, user_email, user_name, permissions, invited_by, joined_at, last_active_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `access_${shareId}_${userId}`,
      shareId,
      userId,
      userInfo?.email || null,
      userInfo?.name || null,
      permissions,
      invitedBy,
      now,
      now
    )
  }

  private async updateAccessStats(shareId: string, userId: string): Promise<void> {
    const now = new Date().toISOString()

    // Update conversation access count
    this.db.prepare(`
      UPDATE shared_conversations 
      SET access_count = access_count + 1, last_accessed_at = ?
      WHERE share_id = ?
    `).run(now, shareId)

    // Update user's last active time
    this.db.prepare(`
      UPDATE conversation_access 
      SET last_active_at = ?
      WHERE share_id = ? AND user_id = ?
    `).run(now, shareId, userId)
  }

  private async logShareEvent(
    shareId: string,
    eventType: string,
    userId?: string,
    metadata?: any
  ): Promise<void> {
    try {
      this.db.prepare(`
        INSERT INTO share_analytics 
        (id, share_id, event_type, user_id, metadata, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        nanoid(),
        shareId,
        eventType,
        userId || null,
        JSON.stringify(metadata || {}),
        new Date().toISOString()
      )
    } catch (error) {
      // Silent failure for analytics
    }
  }
}