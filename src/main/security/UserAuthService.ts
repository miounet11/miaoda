import crypto from 'crypto'
import { UserService, type UserRecord, type SessionRecord } from '../db/UserService'
import { cryptoManager } from './crypto/CryptoManager'
import { PasswordStrengthValidator } from './crypto/CryptoManager'

/**
 * Authentication request interfaces
 */
export interface LoginRequest {
  email: string
  password: string
  deviceId: string
  deviceName?: string
  deviceType?: string
  rememberMe?: boolean
  ipAddress?: string
  userAgent?: string
  location?: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
  acceptTerms: boolean
  deviceId: string
  deviceName?: string
  deviceType?: string
  ipAddress?: string
  userAgent?: string
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    name: string
    avatar_url?: string
    preferences?: Record<string, any>
    created_at: number
    email_verified: boolean
  }
  session: {
    id: string
    access_token: string
    refresh_token: string
    expires_at: number
    device_id: string
  }
  requires_2fa?: boolean
  setup_required?: {
    email_verification?: boolean
    profile_completion?: boolean
  }
}

export interface PasswordResetRequest {
  email: string
  ipAddress?: string
  userAgent?: string
}

export interface PasswordResetConfirmRequest {
  token: string
  newPassword: string
  ipAddress?: string
  userAgent?: string
}

/**
 * Main authentication service
 * Coordinates user authentication, session management, and security features
 */
export class UserAuthService {
  private userService: UserService
  private readonly MAX_LOGIN_ATTEMPTS = 5
  private readonly ACCOUNT_LOCK_DURATION = 30 * 60 * 1000 // 30 minutes
  private readonly SESSION_DURATION = 60 * 60 * 1000 // 1 hour
  private readonly REFRESH_TOKEN_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 days
  private readonly PASSWORD_RESET_TOKEN_DURATION = 60 * 60 * 1000 // 1 hour

  constructor(userService: UserService) {
    this.userService = userService
    
    // Set up periodic cleanup
    this.startPeriodicCleanup()
  }

  /**
   * Register new user account
   */
  async register(request: RegisterRequest): Promise<AuthResponse> {
    const { email, password, name, acceptTerms, deviceId } = request

    // Validation
    if (!email || !password || !name || !acceptTerms) {
      throw new Error('Missing required fields')
    }

    if (!acceptTerms) {
      throw new Error('Must accept terms and conditions')
    }

    // Validate email format
    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format')
    }

    // Validate password strength
    const passwordValidation = PasswordStrengthValidator.validateStrength(password)
    if (!passwordValidation.isStrong) {
      throw new Error(`Password not strong enough: ${passwordValidation.feedback.join(', ')}`)
    }

    // Check if user already exists
    const existingUser = this.userService.getUserByEmail(email)
    if (existingUser) {
      // Log attempted duplicate registration for security monitoring
      await this.userService.logAuthAction({
        action: 'register_duplicate',
        success: false,
        details: { email },
        ip_address: request.ipAddress,
        user_agent: request.userAgent
      })
      throw new Error('An account with this email already exists')
    }

    try {
      // Create user account
      const userId = this.generateUserId()
      const user = await this.userService.createUser({
        id: userId,
        email,
        password,
        name,
        preferences: {
          theme: 'system',
          language: 'en',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      })

      // Create initial session
      const session = await this.createUserSession({
        user_id: userId,
        device_id: deviceId,
        device_name: request.deviceName,
        device_type: request.deviceType,
        ip_address: request.ipAddress,
        user_agent: request.userAgent,
        location: request.location
      })

      // Log successful registration
      await this.userService.logAuthAction({
        user_id: userId,
        session_id: session.id,
        action: 'register',
        success: true,
        details: { email, device_id: deviceId },
        ip_address: request.ipAddress,
        user_agent: request.userAgent
      })

      return this.buildAuthResponse(user, session, {
        setup_required: {
          email_verification: true,
          profile_completion: false
        }
      })

    } catch (error) {
      // Log registration failure
      await this.userService.logAuthAction({
        action: 'register',
        success: false,
        details: { email, error: error instanceof Error ? error.message : 'Unknown error' },
        ip_address: request.ipAddress,
        user_agent: request.userAgent
      })
      throw error
    }
  }

  /**
   * Authenticate user login
   */
  async login(request: LoginRequest): Promise<AuthResponse> {
    const { email, password, deviceId } = request

    // Basic validation
    if (!email || !password || !deviceId) {
      throw new Error('Missing required fields')
    }

    const user = this.userService.getUserByEmail(email)
    if (!user) {
      // Log failed login attempt for non-existent user
      await this.userService.logAuthAction({
        action: 'login',
        success: false,
        details: { email, reason: 'user_not_found' },
        ip_address: request.ipAddress,
        user_agent: request.userAgent,
        risk_score: 30
      })
      throw new Error('Invalid email or password')
    }

    // Check if account is locked
    if (this.userService.isUserLocked(user.id)) {
      await this.userService.logAuthAction({
        user_id: user.id,
        action: 'login',
        success: false,
        details: { email, reason: 'account_locked' },
        ip_address: request.ipAddress,
        user_agent: request.userAgent,
        risk_score: 50
      })
      const lockUntil = user.locked_until ? new Date(user.locked_until) : new Date()
      const minutesRemaining = Math.ceil((lockUntil.getTime() - Date.now()) / 60000)
      throw new Error(`Account is locked. Try again in ${minutesRemaining} minutes.`)
    }

    // Verify password
    const isPasswordValid = await this.userService.verifyPassword(user.id, password)
    
    if (!isPasswordValid) {
      // Increment failed attempts
      const newAttempts = user.failed_login_attempts + 1
      
      if (newAttempts >= this.MAX_LOGIN_ATTEMPTS) {
        // Lock account
        const lockUntil = Date.now() + this.ACCOUNT_LOCK_DURATION
        this.userService.lockUser(user.id, lockUntil, newAttempts)
        
        await this.userService.logAuthAction({
          user_id: user.id,
          action: 'account_locked',
          success: false,
          details: { email, attempts: newAttempts },
          ip_address: request.ipAddress,
          user_agent: request.userAgent,
          risk_score: 80
        })
        
        throw new Error('Too many failed attempts. Account has been locked for 30 minutes.')
      } else {
        // Update failed attempts
        this.userService.updateLoginAttempts(user.id, newAttempts)
        
        await this.userService.logAuthAction({
          user_id: user.id,
          action: 'login',
          success: false,
          details: { email, attempts: newAttempts, reason: 'invalid_password' },
          ip_address: request.ipAddress,
          user_agent: request.userAgent,
          risk_score: 40
        })
        
        throw new Error(`Invalid email or password. ${this.MAX_LOGIN_ATTEMPTS - newAttempts} attempts remaining.`)
      }
    }

    // Reset failed attempts on successful authentication
    if (user.failed_login_attempts > 0) {
      this.userService.updateLoginAttempts(user.id, 0)
    }

    // Check if 2FA is required
    const authMethods = this.userService.getAuthMethods(user.id)
    const has2FA = authMethods.some(method => 
      method.method_type === 'totp' && method.is_enabled && method.setup_completed
    )

    // Create session
    const session = await this.createUserSession({
      user_id: user.id,
      device_id: deviceId,
      device_name: request.deviceName,
      device_type: request.deviceType,
      ip_address: request.ipAddress,
      user_agent: request.userAgent,
      location: request.location,
      remember_me: request.rememberMe
    })

    // Update user activity
    this.userService.updateUserActivity(user.id)

    // Log successful login
    await this.userService.logAuthAction({
      user_id: user.id,
      session_id: session.id,
      action: 'login',
      success: true,
      details: { email, device_id: deviceId, has_2fa: has2FA },
      ip_address: request.ipAddress,
      user_agent: request.userAgent
    })

    return this.buildAuthResponse(user, session, {
      requires_2fa: has2FA
    })
  }

  /**
   * Logout user session
   */
  async logout(sessionId: string, allDevices: boolean = false): Promise<void> {
    const session = this.userService.getSession(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    if (allDevices) {
      // Log out from all devices
      this.userService.deleteUserSessions(session.user_id)
      
      await this.userService.logAuthAction({
        user_id: session.user_id,
        session_id: sessionId,
        action: 'logout_all',
        success: true
      })
    } else {
      // Log out from current session only
      this.userService.deleteSession(sessionId)
      
      await this.userService.logAuthAction({
        user_id: session.user_id,
        session_id: sessionId,
        action: 'logout',
        success: true
      })
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    // Hash the refresh token to find session
    const tokenHash = this.hashToken(refreshToken)
    const sessions = await this.findSessionByRefreshToken(tokenHash)
    
    if (!sessions || sessions.expires_at < Date.now()) {
      throw new Error('Invalid or expired refresh token')
    }

    const user = this.userService.getUserById(sessions.user_id)
    if (!user) {
      throw new Error('User not found')
    }

    // Generate new tokens
    const newSession = await this.createUserSession({
      user_id: user.id,
      device_id: sessions.device_id,
      device_name: sessions.device_name,
      device_type: sessions.device_type,
      ip_address: sessions.ip_address,
      user_agent: sessions.user_agent
    })

    // Invalidate old session
    this.userService.deleteSession(sessions.id)

    // Log token refresh
    await this.userService.logAuthAction({
      user_id: user.id,
      session_id: newSession.id,
      action: 'token_refresh',
      success: true
    })

    return this.buildAuthResponse(user, newSession)
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(request: PasswordResetRequest): Promise<void> {
    const { email } = request
    const user = this.userService.getUserByEmail(email)
    
    // Always return success to prevent email enumeration
    // But only send email if user exists
    if (user) {
      // Generate secure reset token
      const resetToken = this.generateSecureToken(32)
      const tokenHash = this.hashToken(resetToken)
      
      // Store reset token
      const tokenId = this.generateTokenId()
      this.userService.createPasswordResetToken({
        id: tokenId,
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: Date.now() + this.PASSWORD_RESET_TOKEN_DURATION,
        ip_address: request.ipAddress,
        user_agent: request.userAgent
      })

      // Log password reset request
      await this.userService.logAuthAction({
        user_id: user.id,
        action: 'password_reset_request',
        success: true,
        details: { email },
        ip_address: request.ipAddress,
        user_agent: request.userAgent
      })

      // TODO: Send reset email with token
      console.log(`Password reset token for ${email}: ${resetToken}`)
    } else {
      // Log attempted reset for non-existent user
      await this.userService.logAuthAction({
        action: 'password_reset_request',
        success: false,
        details: { email, reason: 'user_not_found' },
        ip_address: request.ipAddress,
        user_agent: request.userAgent,
        risk_score: 20
      })
    }
  }

  /**
   * Confirm password reset with token
   */
  async confirmPasswordReset(request: PasswordResetConfirmRequest): Promise<void> {
    const { token, newPassword } = request
    
    // Validate new password
    const passwordValidation = PasswordStrengthValidator.validateStrength(newPassword)
    if (!passwordValidation.isStrong) {
      throw new Error(`Password not strong enough: ${passwordValidation.feedback.join(', ')}`)
    }

    // Find valid reset token
    const tokenHash = this.hashToken(token)
    const resetToken = this.userService.getPasswordResetToken(tokenHash)
    
    if (!resetToken) {
      await this.userService.logAuthAction({
        action: 'password_reset_confirm',
        success: false,
        details: { reason: 'invalid_token' },
        ip_address: request.ipAddress,
        user_agent: request.userAgent,
        risk_score: 60
      })
      throw new Error('Invalid or expired reset token')
    }

    // Update password
    await this.userService.updatePassword(resetToken.user_id, newPassword)
    
    // Mark token as used
    this.userService.usePasswordResetToken(resetToken.id)
    
    // Invalidate all sessions for security
    this.userService.deleteUserSessions(resetToken.user_id)

    // Log successful password reset
    await this.userService.logAuthAction({
      user_id: resetToken.user_id,
      action: 'password_reset_confirm',
      success: true,
      ip_address: request.ipAddress,
      user_agent: request.userAgent
    })
  }

  /**
   * Get user sessions
   */
  getUserSessions(userId: string): SessionRecord[] {
    return this.userService.getSessionsByUser(userId)
  }

  /**
   * Revoke specific session
   */
  async revokeSession(sessionId: string, requestingSessionId: string): Promise<void> {
    const requestingSession = this.userService.getSession(requestingSessionId)
    if (!requestingSession) {
      throw new Error('Requesting session not found')
    }

    const targetSession = this.userService.getSession(sessionId)
    if (!targetSession) {
      throw new Error('Target session not found')
    }

    // Users can only revoke their own sessions
    if (requestingSession.user_id !== targetSession.user_id) {
      throw new Error('Cannot revoke session for different user')
    }

    this.userService.deleteSession(sessionId)

    await this.userService.logAuthAction({
      user_id: requestingSession.user_id,
      session_id: requestingSessionId,
      action: 'session_revoke',
      success: true,
      details: { revoked_session_id: sessionId }
    })
  }

  /**
   * Validate session and get user
   */
  validateSession(sessionId: string): { user: UserRecord; session: SessionRecord } | null {
    const session = this.userService.getSession(sessionId)
    if (!session || session.expires_at < Date.now()) {
      return null
    }

    const user = this.userService.getUserById(session.user_id)
    if (!user) {
      return null
    }

    // Update session activity
    this.userService.updateSession(sessionId, {})

    return { user, session }
  }

  /**
   * Private helper methods
   */
  private async createUserSession(sessionData: {
    user_id: string
    device_id: string
    device_name?: string
    device_type?: string
    ip_address?: string
    user_agent?: string
    location?: string
    remember_me?: boolean
  }): Promise<SessionRecord> {
    const sessionId = this.generateSessionId()
    const accessToken = this.generateSecureToken(32)
    const refreshToken = this.generateSecureToken(32)
    
    const accessTokenHash = this.hashToken(accessToken)
    const refreshTokenHash = this.hashToken(refreshToken)
    
    // Session duration based on remember me
    const sessionDuration = sessionData.remember_me ? 
      this.REFRESH_TOKEN_DURATION : this.SESSION_DURATION

    const session = this.userService.createSession({
      id: sessionId,
      user_id: sessionData.user_id,
      device_id: sessionData.device_id,
      device_name: sessionData.device_name,
      device_type: sessionData.device_type,
      ip_address: sessionData.ip_address,
      user_agent: sessionData.user_agent,
      access_token_hash: accessTokenHash,
      refresh_token_hash: refreshTokenHash,
      expires_at: Date.now() + sessionDuration,
      location: sessionData.location
    })

    // Store the actual tokens (not hashes) for returning to client
    ;(session as any).access_token = accessToken
    ;(session as any).refresh_token = refreshToken

    return session
  }

  private buildAuthResponse(
    user: UserRecord, 
    session: SessionRecord & { access_token?: string; refresh_token?: string },
    options: {
      requires_2fa?: boolean
      setup_required?: {
        email_verification?: boolean
        profile_completion?: boolean
      }
    } = {}
  ): AuthResponse {
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        preferences: user.preferences ? JSON.parse(user.preferences) : undefined,
        created_at: user.created_at,
        email_verified: user.email_verified === 1
      },
      session: {
        id: session.id,
        access_token: session.access_token!,
        refresh_token: session.refresh_token!,
        expires_at: session.expires_at,
        device_id: session.device_id
      },
      requires_2fa: options.requires_2fa,
      setup_required: options.setup_required
    }
  }

  private generateUserId(): string {
    return 'user_' + cryptoManager.generateSecureRandom(16).toString('hex')
  }

  private generateSessionId(): string {
    return 'sess_' + cryptoManager.generateSecureRandom(16).toString('hex')
  }

  private generateTokenId(): string {
    return 'tok_' + cryptoManager.generateSecureRandom(16).toString('hex')
  }

  private generateSecureToken(length: number): string {
    return cryptoManager.generateSecureRandom(length).toString('base64url')
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  private async findSessionByRefreshToken(tokenHash: string): Promise<SessionRecord | null> {
    // This would need to be implemented in UserService
    // For now, return null
    return null
  }

  private startPeriodicCleanup(): void {
    // Clean up expired data every hour
    setInterval(() => {
      this.userService.cleanupExpiredData()
    }, 60 * 60 * 1000)
  }
}