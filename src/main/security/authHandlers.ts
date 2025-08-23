import { ipcMain } from 'electron'
import {
  UserAuthService,
  type LoginRequest,
  type RegisterRequest,
  type PasswordResetRequest,
  type PasswordResetConfirmRequest
} from '../security/UserAuthService'
import { UserService } from '../db/UserService'
import { InputValidator, rateLimit, auditLog } from './InputValidator'
import { logger } from '../utils/Logger'

/**
 * Register authentication-related IPC handlers
 * Provides secure authentication endpoints for the frontend
 */
export function registerAuthHandlers(userService: UserService) {
  const authService = new UserAuthService(userService)

  logger.info('Registering authentication IPC handlers', 'Auth')

  /**
   * User Registration
   */
  ipcMain.handle('auth:register', async (event, request: RegisterRequest) => {
    try {
      // Rate limiting for registration attempts
      await rateLimit('register', request.ipAddress || 'unknown', 5, 300) // 5 attempts per 5 minutes

      // Validate registration request
      const validatedRequest = InputValidator.validateRegistrationRequest(request)

      // Perform registration
      const authResponse = await authService.register(validatedRequest)

      // Audit log successful registration
      await auditLog('auth:register', 'success', {
        userId: authResponse.user.id,
        email: authResponse.user.email,
        ipAddress: request.ipAddress
      })

      logger.info('User registered successfully', 'Auth', {
        userId: authResponse.user.id,
        email: authResponse.user.email
      })

      return authResponse
    } catch (error: any) {
      // Audit log failed registration
      await auditLog('auth:register', 'error', {
        error: error.message,
        email: request.email,
        ipAddress: request.ipAddress
      })

      logger.error('Registration failed', 'Auth', error)
      throw new Error(error.message)
    }
  })

  /**
   * User Login
   */
  ipcMain.handle('auth:login', async (event, request: LoginRequest) => {
    try {
      // Rate limiting for login attempts
      await rateLimit('login', request.ipAddress || 'unknown', 10, 300) // 10 attempts per 5 minutes

      // Validate login request
      const validatedRequest = InputValidator.validateLoginRequest(request)

      // Perform login
      const authResponse = await authService.login(validatedRequest)

      // Audit log successful login
      await auditLog('auth:login', 'success', {
        userId: authResponse.user.id,
        email: authResponse.user.email,
        deviceId: request.deviceId,
        ipAddress: request.ipAddress
      })

      logger.info('User logged in successfully', 'Auth', {
        userId: authResponse.user.id,
        email: authResponse.user.email,
        deviceId: request.deviceId
      })

      return authResponse
    } catch (error: any) {
      // Audit log failed login
      await auditLog('auth:login', 'error', {
        error: error.message,
        email: request.email,
        deviceId: request.deviceId,
        ipAddress: request.ipAddress
      })

      logger.error('Login failed', 'Auth', error)
      throw new Error(error.message)
    }
  })

  /**
   * User Logout
   */
  ipcMain.handle(
    'auth:logout',
    async (event, data: { sessionId: string; allDevices?: boolean }) => {
      try {
        const { sessionId, allDevices = false } = data

        // Validate session ID
        if (!sessionId || typeof sessionId !== 'string') {
          throw new Error('Invalid session ID')
        }

        // Get session info before logout for audit
        const sessionInfo = authService.validateSession(sessionId)

        await authService.logout(sessionId, allDevices)

        // Audit log logout
        await auditLog('auth:logout', 'success', {
          userId: sessionInfo?.user.id,
          sessionId,
          allDevices
        })

        logger.info('User logged out successfully', 'Auth', {
          userId: sessionInfo?.user.id,
          sessionId,
          allDevices
        })

        return { success: true }
      } catch (error: any) {
        logger.error('Logout failed', 'Auth', error)
        throw new Error(error.message)
      }
    }
  )

  /**
   * Token Refresh
   */
  ipcMain.handle('auth:refresh-token', async (event, data: { refreshToken: string }) => {
    try {
      const { refreshToken } = data

      if (!refreshToken || typeof refreshToken !== 'string') {
        throw new Error('Invalid refresh token')
      }

      const authResponse = await authService.refreshToken(refreshToken)

      logger.info('Token refreshed successfully', 'Auth', {
        userId: authResponse.user.id
      })

      return authResponse
    } catch (error: any) {
      logger.error('Token refresh failed', 'Auth', error)
      throw new Error(error.message)
    }
  })

  /**
   * Session Validation
   */
  ipcMain.handle('auth:validate-session', async (event, data: { sessionId: string }) => {
    try {
      const { sessionId } = data

      if (!sessionId || typeof sessionId !== 'string') {
        return { valid: false, error: 'Invalid session ID' }
      }

      const sessionInfo = authService.validateSession(sessionId)

      if (!sessionInfo) {
        return { valid: false, error: 'Session not found or expired' }
      }

      return {
        valid: true,
        user: sessionInfo.user,
        session: sessionInfo.session
      }
    } catch (error: any) {
      logger.error('Session validation failed', 'Auth', error)
      return { valid: false, error: error.message }
    }
  })

  /**
   * Password Reset Request
   */
  ipcMain.handle('auth:request-password-reset', async (event, request: PasswordResetRequest) => {
    try {
      // Rate limiting for password reset requests
      await rateLimit('password-reset', request.ipAddress || 'unknown', 3, 600) // 3 attempts per 10 minutes

      // Validate email
      if (!request.email || typeof request.email !== 'string') {
        throw new Error('Invalid email address')
      }

      await authService.requestPasswordReset(request)

      // Audit log password reset request
      await auditLog('auth:password-reset-request', 'success', {
        email: request.email,
        ipAddress: request.ipAddress
      })

      logger.info('Password reset requested', 'Auth', { email: request.email })

      return {
        success: true,
        message: 'If an account with that email exists, a reset link has been sent.'
      }
    } catch (error: any) {
      logger.error('Password reset request failed', 'Auth', error)
      throw new Error(error.message)
    }
  })

  /**
   * Password Reset Confirmation
   */
  ipcMain.handle(
    'auth:confirm-password-reset',
    async (event, request: PasswordResetConfirmRequest) => {
      try {
        // Rate limiting for password reset confirmations
        await rateLimit('password-reset-confirm', request.ipAddress || 'unknown', 5, 600) // 5 attempts per 10 minutes

        // Validate request
        if (!request.token || !request.newPassword) {
          throw new Error('Missing required fields')
        }

        await authService.confirmPasswordReset(request)

        // Audit log successful password reset
        await auditLog('auth:password-reset-confirm', 'success', {
          ipAddress: request.ipAddress
        })

        logger.info('Password reset completed successfully', 'Auth')

        return {
          success: true,
          message: 'Password has been reset successfully. Please log in with your new password.'
        }
      } catch (error: any) {
        // Audit log failed password reset
        await auditLog('auth:password-reset-confirm', 'error', {
          error: error.message,
          ipAddress: request.ipAddress
        })

        logger.error('Password reset confirmation failed', 'Auth', error)
        throw new Error(error.message)
      }
    }
  )

  /**
   * Get User Sessions
   */
  ipcMain.handle('auth:get-sessions', async (event, data: { sessionId: string }) => {
    try {
      const { sessionId } = data

      const sessionInfo = authService.validateSession(sessionId)
      if (!sessionInfo) {
        throw new Error('Invalid session')
      }

      const sessions = authService.getUserSessions(sessionInfo.user.id)

      // Don't return sensitive token hashes, only metadata
      const sanitizedSessions = sessions.map(session => ({
        id: session.id,
        device_id: session.device_id,
        device_name: session.device_name,
        device_type: session.device_type,
        ip_address: session.ip_address,
        location: session.location,
        last_used_at: session.last_used_at,
        created_at: session.created_at,
        is_current: session.id === sessionId
      }))

      return sanitizedSessions
    } catch (error: any) {
      logger.error('Failed to get user sessions', 'Auth', error)
      throw new Error(error.message)
    }
  })

  /**
   * Revoke Session
   */
  ipcMain.handle(
    'auth:revoke-session',
    async (event, data: { sessionId: string; targetSessionId: string }) => {
      try {
        const { sessionId, targetSessionId } = data

        if (!sessionId || !targetSessionId) {
          throw new Error('Missing required session IDs')
        }

        await authService.revokeSession(targetSessionId, sessionId)

        // Audit log session revoke
        await auditLog('auth:revoke-session', 'success', {
          requestingSessionId: sessionId,
          revokedSessionId: targetSessionId
        })

        logger.info('Session revoked successfully', 'Auth', {
          requestingSessionId: sessionId,
          revokedSessionId: targetSessionId
        })

        return { success: true }
      } catch (error: any) {
        logger.error('Failed to revoke session', 'Auth', error)
        throw new Error(error.message)
      }
    }
  )

  /**
   * Update User Profile
   */
  ipcMain.handle(
    'auth:update-profile',
    async (
      event,
      data: {
        sessionId: string
        updates: {
          name?: string
          avatar_url?: string
          preferences?: Record<string, any>
        }
      }
    ) => {
      try {
        const { sessionId, updates } = data

        const sessionInfo = authService.validateSession(sessionId)
        if (!sessionInfo) {
          throw new Error('Invalid session')
        }

        // Validate updates
        if (updates.name && typeof updates.name !== 'string') {
          throw new Error('Invalid name format')
        }

        if (updates.avatar_url && typeof updates.avatar_url !== 'string') {
          throw new Error('Invalid avatar URL format')
        }

        userService.updateUser(sessionInfo.user.id, updates)

        // Get updated user info
        const updatedUser = userService.getUserById(sessionInfo.user.id)

        // Audit log profile update
        await auditLog('auth:update-profile', 'success', {
          userId: sessionInfo.user.id,
          updates: Object.keys(updates)
        })

        logger.info('Profile updated successfully', 'Auth', {
          userId: sessionInfo.user.id,
          updates: Object.keys(updates)
        })

        return {
          user: {
            id: updatedUser!.id,
            email: updatedUser!.email,
            name: updatedUser!.name,
            avatar_url: updatedUser!.avatar_url,
            preferences: updatedUser!.preferences
              ? JSON.parse(updatedUser!.preferences)
              : undefined,
            created_at: updatedUser!.created_at,
            email_verified: updatedUser!.email_verified === 1
          }
        }
      } catch (error: any) {
        logger.error('Failed to update profile', 'Auth', error)
        throw new Error(error.message)
      }
    }
  )

  /**
   * Change Password
   */
  ipcMain.handle(
    'auth:change-password',
    async (
      event,
      data: {
        sessionId: string
        currentPassword: string
        newPassword: string
      }
    ) => {
      try {
        const { sessionId, currentPassword, newPassword } = data

        const sessionInfo = authService.validateSession(sessionId)
        if (!sessionInfo) {
          throw new Error('Invalid session')
        }

        // Validate current password
        const isCurrentPasswordValid = await userService.verifyPassword(
          sessionInfo.user.id,
          currentPassword
        )
        if (!isCurrentPasswordValid) {
          throw new Error('Current password is incorrect')
        }

        // Update password
        await userService.updatePassword(sessionInfo.user.id, newPassword)

        // Invalidate all other sessions for security
        const allSessions = userService.getSessionsByUser(sessionInfo.user.id)
        for (const session of allSessions) {
          if (session.id !== sessionId) {
            userService.deleteSession(session.id)
          }
        }

        // Audit log password change
        await auditLog('auth:change-password', 'success', {
          userId: sessionInfo.user.id
        })

        logger.info('Password changed successfully', 'Auth', {
          userId: sessionInfo.user.id
        })

        return {
          success: true,
          message: 'Password changed successfully. Other sessions have been logged out.'
        }
      } catch (error: any) {
        logger.error('Failed to change password', 'Auth', error)
        throw new Error(error.message)
      }
    }
  )

  logger.info('Authentication IPC handlers registered successfully', 'Auth')
}
