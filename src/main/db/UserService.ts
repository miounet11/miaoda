import Database from 'better-sqlite3'
import { cryptoManager } from '../security/crypto/CryptoManager'
import { BaseDatabaseService } from './BaseDatabaseService'
import { logger } from '../utils/Logger'

/**
 * User data types for authentication system
 */
export interface UserRecord {
  id: string
  email: string
  password_hash: string
  salt: string
  name: string
  avatar_url?: string
  created_at: number
  updated_at: number
  last_active_at?: number
  is_active: number
  email_verified: number
  preferences?: string // JSON blob
  encryption_key_id?: string
  backup_codes?: string // JSON array
  failed_login_attempts: number
  locked_until?: number
  password_changed_at: number
}

export interface SessionRecord {
  id: string
  user_id: string
  device_id: string
  device_name?: string
  device_type?: string
  ip_address?: string
  user_agent?: string
  access_token_hash: string
  refresh_token_hash: string
  expires_at: number
  last_used_at: number
  created_at: number
  is_active: number
  location?: string
}

export interface AuthMethodRecord {
  id: string
  user_id: string
  method_type: string
  method_data: string
  is_enabled: number
  created_at: number
  last_used_at?: number
  setup_completed: number
  backup_codes_generated: number
}

export interface PasswordResetTokenRecord {
  id: string
  user_id: string
  token_hash: string
  expires_at: number
  created_at: number
  used_at?: number
  ip_address?: string
  user_agent?: string
}

export interface AuditLogRecord {
  id: string
  user_id?: string
  session_id?: string
  action: string
  details?: string // JSON blob
  ip_address?: string
  user_agent?: string
  success: number
  created_at: number
  risk_score: number
}

/**
 * User service for managing authentication data
 * Handles user CRUD operations, sessions, and security features
 */
export class UserService extends BaseDatabaseService {
  // Prepared statements for performance
  private statements: {
    createUser: Database.Statement
    getUserByEmail: Database.Statement
    getUserById: Database.Statement
    updateUser: Database.Statement
    updateUserActivity: Database.Statement
    deleteUser: Database.Statement
    createSession: Database.Statement
    getSession: Database.Statement
    getSessionsByUser: Database.Statement
    updateSession: Database.Statement
    deleteSession: Database.Statement
    deleteUserSessions: Database.Statement
    createAuthMethod: Database.Statement
    getAuthMethods: Database.Statement
    updateAuthMethod: Database.Statement
    deleteAuthMethod: Database.Statement
    createPasswordResetToken: Database.Statement
    getPasswordResetToken: Database.Statement
    usePasswordResetToken: Database.Statement
    logAuthAction: Database.Statement
    updateLoginAttempts: Database.Statement
    lockUser: Database.Statement
    unlockUser: Database.Statement
  }

  constructor(db: Database.Database) {
    super(db)
    this.statements = this.prepareStatements()
  }

  private prepareStatements() {
    return {
      // User management
      createUser: this.db.prepare(`
        INSERT INTO users (
          id, email, password_hash, salt, name, avatar_url,
          created_at, updated_at, last_active_at, is_active,
          email_verified, preferences, encryption_key_id,
          failed_login_attempts, password_changed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),

      getUserByEmail: this.db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1'),
      getUserById: this.db.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1'),

      updateUser: this.db.prepare(`
        UPDATE users SET 
          name = ?, avatar_url = ?, preferences = ?, updated_at = ?
        WHERE id = ?
      `),

      updateUserActivity: this.db.prepare('UPDATE users SET last_active_at = ? WHERE id = ?'),

      deleteUser: this.db.prepare('UPDATE users SET is_active = 0, updated_at = ? WHERE id = ?'),

      // Session management
      createSession: this.db.prepare(`
        INSERT INTO user_sessions (
          id, user_id, device_id, device_name, device_type,
          ip_address, user_agent, access_token_hash, refresh_token_hash,
          expires_at, last_used_at, created_at, is_active, location
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),

      getSession: this.db.prepare('SELECT * FROM user_sessions WHERE id = ? AND is_active = 1'),

      getSessionsByUser: this.db.prepare(
        'SELECT * FROM user_sessions WHERE user_id = ? AND is_active = 1'
      ),

      updateSession: this.db.prepare(`
        UPDATE user_sessions SET 
          last_used_at = ?, ip_address = ?, location = ?
        WHERE id = ?
      `),

      deleteSession: this.db.prepare('UPDATE user_sessions SET is_active = 0 WHERE id = ?'),

      deleteUserSessions: this.db.prepare(
        'UPDATE user_sessions SET is_active = 0 WHERE user_id = ?'
      ),

      // Authentication methods
      createAuthMethod: this.db.prepare(`
        INSERT INTO auth_methods (
          id, user_id, method_type, method_data, is_enabled,
          created_at, setup_completed, backup_codes_generated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `),

      getAuthMethods: this.db.prepare(
        'SELECT * FROM auth_methods WHERE user_id = ? AND is_enabled = 1'
      ),

      updateAuthMethod: this.db.prepare(`
        UPDATE auth_methods SET 
          method_data = ?, last_used_at = ?, setup_completed = ?
        WHERE id = ?
      `),

      deleteAuthMethod: this.db.prepare('UPDATE auth_methods SET is_enabled = 0 WHERE id = ?'),

      // Password reset
      createPasswordResetToken: this.db.prepare(`
        INSERT INTO password_reset_tokens (
          id, user_id, token_hash, expires_at, created_at, ip_address, user_agent
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `),

      getPasswordResetToken: this.db.prepare(`
        SELECT * FROM password_reset_tokens 
        WHERE token_hash = ? AND expires_at > ? AND used_at IS NULL
      `),

      usePasswordResetToken: this.db.prepare(
        'UPDATE password_reset_tokens SET used_at = ? WHERE id = ?'
      ),

      // Security features
      logAuthAction: this.db.prepare(`
        INSERT INTO auth_audit_logs (
          id, user_id, session_id, action, details, ip_address, 
          user_agent, success, created_at, risk_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),

      updateLoginAttempts: this.db.prepare(`
        UPDATE users SET 
          failed_login_attempts = ?, updated_at = ?
        WHERE id = ?
      `),

      lockUser: this.db.prepare(`
        UPDATE users SET 
          failed_login_attempts = ?, locked_until = ?, updated_at = ?
        WHERE id = ?
      `),

      unlockUser: this.db.prepare(`
        UPDATE users SET 
          failed_login_attempts = 0, locked_until = NULL, updated_at = ?
        WHERE id = ?
      `)
    }
  }

  /**
   * Create a new user account
   */
  async createUser(userData: {
    id: string
    email: string
    password: string
    name: string
    avatar_url?: string
    preferences?: Record<string, any>
  }): Promise<UserRecord> {
    const now = Date.now()

    // Generate password hash and salt
    const { key: masterKey, salt } = await cryptoManager.generateMasterKey(userData.password)
    const passwordHash = masterKey.toString('base64')

    // Create encryption key for user data
    const { keyId } = await cryptoManager.deriveDataKey('user-data', userData.id)

    const user: UserRecord = {
      id: userData.id,
      email: userData.email.toLowerCase(),
      password_hash: passwordHash,
      salt: salt.toString('base64'),
      name: userData.name,
      avatar_url: userData.avatar_url,
      created_at: now,
      updated_at: now,
      last_active_at: now,
      is_active: 1,
      email_verified: 0,
      preferences: userData.preferences ? JSON.stringify(userData.preferences) : undefined,
      encryption_key_id: keyId,
      failed_login_attempts: 0,
      password_changed_at: now
    }

    this.statements.createUser.run(
      user.id,
      user.email,
      user.password_hash,
      user.salt,
      user.name,
      user.avatar_url,
      user.created_at,
      user.updated_at,
      user.last_active_at,
      user.is_active,
      user.email_verified,
      user.preferences,
      user.encryption_key_id,
      user.failed_login_attempts,
      user.password_changed_at
    )

    // Log user registration
    await this.logAuthAction({
      user_id: user.id,
      action: 'register',
      success: true,
      details: { email: user.email }
    })

    return user
  }

  /**
   * Get user by email
   */
  getUserByEmail(email: string): UserRecord | undefined {
    return this.statements.getUserByEmail.get(email.toLowerCase()) as UserRecord | undefined
  }

  /**
   * Get user by ID
   */
  getUserById(id: string): UserRecord | undefined {
    return this.statements.getUserById.get(id) as UserRecord | undefined
  }

  /**
   * Update user information
   */
  updateUser(
    id: string,
    updates: {
      name?: string
      avatar_url?: string
      preferences?: Record<string, any>
    }
  ): void {
    const current = this.getUserById(id)
    if (!current) throw new Error('User not found')

    const preferences = updates.preferences
      ? JSON.stringify(updates.preferences)
      : current.preferences

    this.statements.updateUser.run(
      updates.name ?? current.name,
      updates.avatar_url ?? current.avatar_url,
      preferences,
      Date.now(),
      id
    )
  }

  /**
   * Update user last active timestamp
   */
  updateUserActivity(id: string): void {
    this.statements.updateUserActivity.run(Date.now(), id)
  }

  /**
   * Soft delete user account
   */
  deleteUser(id: string): void {
    this.statements.deleteUser.run(Date.now(), id)
    this.statements.deleteUserSessions.run(id)
  }

  /**
   * Create a new user session
   */
  createSession(sessionData: {
    id: string
    user_id: string
    device_id: string
    device_name?: string
    device_type?: string
    ip_address?: string
    user_agent?: string
    access_token_hash: string
    refresh_token_hash: string
    expires_at: number
    location?: string
  }): SessionRecord {
    const now = Date.now()

    const session: SessionRecord = {
      ...sessionData,
      last_used_at: now,
      created_at: now,
      is_active: 1
    }

    this.statements.createSession.run(
      session.id,
      session.user_id,
      session.device_id,
      session.device_name,
      session.device_type,
      session.ip_address,
      session.user_agent,
      session.access_token_hash,
      session.refresh_token_hash,
      session.expires_at,
      session.last_used_at,
      session.created_at,
      session.is_active,
      session.location
    )

    return session
  }

  /**
   * Get session by ID
   */
  getSession(id: string): SessionRecord | undefined {
    return this.statements.getSession.get(id) as SessionRecord | undefined
  }

  /**
   * Get all active sessions for a user
   */
  getSessionsByUser(userId: string): SessionRecord[] {
    return this.statements.getSessionsByUser.all(userId) as SessionRecord[]
  }

  /**
   * Update session activity
   */
  updateSession(
    id: string,
    updates: {
      ip_address?: string
      location?: string
    }
  ): void {
    this.statements.updateSession.run(Date.now(), updates.ip_address, updates.location, id)
  }

  /**
   * Delete/deactivate session
   */
  deleteSession(id: string): void {
    this.statements.deleteSession.run(id)
  }

  /**
   * Delete all sessions for a user
   */
  deleteUserSessions(userId: string): void {
    this.statements.deleteUserSessions.run(userId)
  }

  /**
   * Create authentication method (2FA, biometric, etc.)
   */
  createAuthMethod(methodData: {
    id: string
    user_id: string
    method_type: string
    method_data: string
  }): AuthMethodRecord {
    const now = Date.now()

    const method: AuthMethodRecord = {
      ...methodData,
      is_enabled: 1,
      created_at: now,
      setup_completed: 0,
      backup_codes_generated: 0
    }

    this.statements.createAuthMethod.run(
      method.id,
      method.user_id,
      method.method_type,
      method.method_data,
      method.is_enabled,
      method.created_at,
      method.setup_completed,
      method.backup_codes_generated
    )

    return method
  }

  /**
   * Get authentication methods for a user
   */
  getAuthMethods(userId: string): AuthMethodRecord[] {
    return this.statements.getAuthMethods.all(userId) as AuthMethodRecord[]
  }

  /**
   * Update authentication method
   */
  updateAuthMethod(
    id: string,
    updates: {
      method_data?: string
      setup_completed?: boolean
    }
  ): void {
    const current = this.statements.getAuthMethods.get() as AuthMethodRecord

    this.statements.updateAuthMethod.run(
      updates.method_data ?? current.method_data,
      Date.now(),
      updates.setup_completed ? 1 : 0,
      id
    )
  }

  /**
   * Delete authentication method
   */
  deleteAuthMethod(id: string): void {
    this.statements.deleteAuthMethod.run(id)
  }

  /**
   * Create password reset token
   */
  createPasswordResetToken(tokenData: {
    id: string
    user_id: string
    token_hash: string
    expires_at: number
    ip_address?: string
    user_agent?: string
  }): PasswordResetTokenRecord {
    const token: PasswordResetTokenRecord = {
      ...tokenData,
      created_at: Date.now()
    }

    this.statements.createPasswordResetToken.run(
      token.id,
      token.user_id,
      token.token_hash,
      token.expires_at,
      token.created_at,
      token.ip_address,
      token.user_agent
    )

    return token
  }

  /**
   * Get valid password reset token
   */
  getPasswordResetToken(tokenHash: string): PasswordResetTokenRecord | undefined {
    return this.statements.getPasswordResetToken.get(tokenHash, Date.now()) as
      | PasswordResetTokenRecord
      | undefined
  }

  /**
   * Mark password reset token as used
   */
  usePasswordResetToken(id: string): void {
    this.statements.usePasswordResetToken.run(Date.now(), id)
  }

  /**
   * Log authentication action
   */
  async logAuthAction(logData: {
    user_id?: string
    session_id?: string
    action: string
    success: boolean
    details?: Record<string, any>
    ip_address?: string
    user_agent?: string
    risk_score?: number
  }): Promise<void> {
    const id = cryptoManager.generateSecureRandom(16).toString('hex')

    this.statements.logAuthAction.run(
      id,
      logData.user_id,
      logData.session_id,
      logData.action,
      logData.details ? JSON.stringify(logData.details) : null,
      logData.ip_address,
      logData.user_agent,
      logData.success ? 1 : 0,
      Date.now(),
      logData.risk_score ?? 0
    )
  }

  /**
   * Update failed login attempts
   */
  updateLoginAttempts(userId: string, attempts: number): void {
    this.statements.updateLoginAttempts.run(attempts, Date.now(), userId)
  }

  /**
   * Lock user account
   */
  lockUser(userId: string, lockUntil: number, attempts: number): void {
    this.statements.lockUser.run(attempts, lockUntil, Date.now(), userId)
  }

  /**
   * Unlock user account
   */
  unlockUser(userId: string): void {
    this.statements.unlockUser.run(Date.now(), userId)
  }

  /**
   * Verify password for user
   */
  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const user = this.getUserById(userId)
    if (!user) return false

    try {
      // Derive key from password using stored salt
      const salt = Buffer.from(user.salt, 'base64')
      const { key } = await cryptoManager.generateMasterKey(password, { salt })
      const computedHash = key.toString('base64')

      return computedHash === user.password_hash
    } catch (error) {
      logger.error('Password verification error', 'UserService', error)
      return false
    }
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const { key: masterKey, salt } = await cryptoManager.generateMasterKey(newPassword)
    const passwordHash = masterKey.toString('base64')

    this.db
      .prepare(
        `
      UPDATE users SET 
        password_hash = ?, salt = ?, password_changed_at = ?, updated_at = ?
      WHERE id = ?
    `
      )
      .run(passwordHash, salt.toString('base64'), Date.now(), Date.now(), userId)

    // Log password change
    await this.logAuthAction({
      user_id: userId,
      action: 'password_change',
      success: true
    })
  }

  /**
   * Check if user account is locked
   */
  isUserLocked(userId: string): boolean {
    const user = this.getUserById(userId)
    if (!user || !user.locked_until) return false

    return Date.now() < user.locked_until
  }

  /**
   * Clean up expired tokens and sessions
   */
  cleanupExpiredData(): void {
    const now = Date.now()

    // Clean up expired password reset tokens
    this.db.prepare('DELETE FROM password_reset_tokens WHERE expires_at < ?').run(now)

    // Clean up expired email verification tokens
    this.db.prepare('DELETE FROM email_verification_tokens WHERE expires_at < ?').run(now)

    // Deactivate expired sessions
    this.db.prepare('UPDATE user_sessions SET is_active = 0 WHERE expires_at < ?').run(now)
  }
}
