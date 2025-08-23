import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  createdAt: Date
  lastActiveAt: Date
  preferences: {
    theme: 'light' | 'dark' | 'system'
    language: string
    timezone: string
  }
}

export interface AuthSession {
  accessToken: string
  refreshToken: string
  expiresAt: Date
  user: User
}

export const useAuthStore = defineStore(
  'auth',
  () => {
    // State
    const session = ref<AuthSession | null>(null)
    const isLoading = ref(false)
    const lastError = ref<string | null>(null)
    const loginAttempts = ref(0)
    const isLocked = ref(false)
    const lockoutUntil = ref<Date | null>(null)

    // Device and session tracking
    const deviceId = ref<string>('')
    const sessionId = ref<string>('')
    const activeSessions = ref<any[]>([])

    // Security settings
    const twoFactorEnabled = ref(false)
    const biometricEnabled = ref(false)
    const sessionTimeout = ref(30 * 60 * 1000) // 30 minutes
    const autoLockEnabled = ref(false)
    const autoLockDelay = ref(15 * 60 * 1000) // 15 minutes

    // Computed
    const isAuthenticated = computed(() => {
      return session.value !== null && !isTokenExpired.value
    })

    const currentUser = computed(() => {
      return session.value?.user || null
    })

    const isTokenExpired = computed(() => {
      if (!session.value) return true
      return new Date() >= session.value.expiresAt
    })

    const isAccountLocked = computed(() => {
      if (!isLocked.value) return false
      if (!lockoutUntil.value) return false
      return new Date() < lockoutUntil.value
    })

    const timeUntilUnlock = computed(() => {
      if (!lockoutUntil.value) return 0
      const now = new Date()
      const unlockTime = lockoutUntil.value
      return Math.max(0, unlockTime.getTime() - now.getTime())
    })

    // Actions
    const login = async (email: string, password: string, rememberMe = false) => {
      if (isAccountLocked.value) {
        throw new Error(
          `Account is locked. Try again in ${Math.ceil(timeUntilUnlock.value / 60000)} minutes.`
        )
      }

      try {
        isLoading.value = true
        lastError.value = null

        // Call real backend authentication via IPC
        const response = await authService.login({
          email,
          password,
          deviceId: deviceId.value,
          rememberMe
        })

        session.value = response
        loginAttempts.value = 0
        isLocked.value = false
        lockoutUntil.value = null

        // Start session monitoring
        startSessionMonitoring()

        return response
      } catch (error: any) {
        loginAttempts.value++
        lastError.value = error.message

        // Lock account after 5 failed attempts
        if (loginAttempts.value >= 5) {
          isLocked.value = true
          lockoutUntil.value = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
        }

        throw error
      } finally {
        isLoading.value = false
      }
    }

    const loginWithSSO = async (provider: 'google' | 'github' | 'microsoft') => {
      try {
        isLoading.value = true
        lastError.value = null

        // Call real backend authentication via IPC
        const response = await authService.loginWithSSO({
          provider,
          deviceId: deviceId.value
        })

        session.value = response
        startSessionMonitoring()

        return response
      } catch (error: any) {
        lastError.value = error.message
        throw error
      } finally {
        isLoading.value = false
      }
    }

    const register = async (userData: {
      email: string
      password: string
      name: string
      acceptTerms: boolean
    }) => {
      try {
        isLoading.value = true
        lastError.value = null

        if (!userData.acceptTerms) {
          throw new Error('You must accept the terms and conditions')
        }

        const response = await authService.register({
          ...userData,
          deviceId: deviceId.value
        })

        session.value = response
        startSessionMonitoring()

        return response
      } catch (error: any) {
        lastError.value = error.message
        throw error
      } finally {
        isLoading.value = false
      }
    }

    const logout = async (allDevices = false) => {
      try {
        if (session.value) {
          await authService.logout({
            sessionId: sessionId.value,
            allDevices
          })
        }
      } catch (error) {
        console.warn('Logout error:', error)
      } finally {
        session.value = null
        sessionId.value = ''
        stopSessionMonitoring()
        lastError.value = null
      }
    }

    const refreshToken = async () => {
      if (!session.value?.refreshToken) {
        throw new Error('No refresh token available')
      }

      try {
        const response = await authService.refreshToken(session.value.refreshToken)
        session.value = response
        return response
      } catch (error) {
        // Refresh failed, logout user
        await logout()
        throw error
      }
    }

    const updateProfile = async (updates: Partial<User>) => {
      if (!currentUser.value) {
        throw new Error('No authenticated user')
      }

      try {
        isLoading.value = true

        const updatedUser = await authService.updateProfile(currentUser.value.id, updates)

        if (session.value) {
          session.value.user = updatedUser
        }

        return updatedUser
      } catch (error: any) {
        lastError.value = error.message
        throw error
      } finally {
        isLoading.value = false
      }
    }

    const changePassword = async (currentPassword: string, newPassword: string) => {
      if (!currentUser.value) {
        throw new Error('No authenticated user')
      }

      try {
        isLoading.value = true

        await authService.changePassword({
          userId: currentUser.value.id,
          currentPassword,
          newPassword
        })

        return true
      } catch (error: any) {
        lastError.value = error.message
        throw error
      } finally {
        isLoading.value = false
      }
    }

    const forgotPassword = async (email: string) => {
      try {
        isLoading.value = true

        await authService.forgotPassword(email)

        return true
      } catch (error: any) {
        lastError.value = error.message
        throw error
      } finally {
        isLoading.value = false
      }
    }

    const resetPassword = async (token: string, newPassword: string) => {
      try {
        isLoading.value = true

        await authService.resetPassword(token, newPassword)

        return true
      } catch (error: any) {
        lastError.value = error.message
        throw error
      } finally {
        isLoading.value = false
      }
    }

    const enableTwoFactor = async () => {
      if (!currentUser.value) {
        throw new Error('No authenticated user')
      }

      try {
        const setup = await authService.setupTwoFactor(currentUser.value.id)
        return setup // Returns QR code and backup codes
      } catch (error: any) {
        lastError.value = error.message
        throw error
      }
    }

    const verifyTwoFactor = async (code: string) => {
      if (!currentUser.value) {
        throw new Error('No authenticated user')
      }

      try {
        await authService.verifyTwoFactor(currentUser.value.id, code)
        twoFactorEnabled.value = true
        return true
      } catch (error: any) {
        lastError.value = error.message
        throw error
      }
    }

    const disableTwoFactor = async (password: string) => {
      if (!currentUser.value) {
        throw new Error('No authenticated user')
      }

      try {
        await authService.disableTwoFactor(currentUser.value.id, password)
        twoFactorEnabled.value = false
        return true
      } catch (error: any) {
        lastError.value = error.message
        throw error
      }
    }

    const getActiveSessions = async () => {
      if (!currentUser.value) {
        throw new Error('No authenticated user')
      }

      try {
        const sessions = await authService.getActiveSessions()
        activeSessions.value = sessions
        return sessions
      } catch (error: any) {
        lastError.value = error.message
        throw error
      }
    }

    const revokeSession = async (sessionIdToRevoke: string) => {
      if (!currentUser.value) {
        throw new Error('No authenticated user')
      }

      try {
        await authService.revokeSession(sessionIdToRevoke)

        if (sessionIdToRevoke === sessionId.value) {
          // Current session was revoked
          await logout()
        } else {
          // Refresh active sessions list
          await getActiveSessions()
        }

        return true
      } catch (error: any) {
        lastError.value = error.message
        throw error
      }
    }

    // Session monitoring
    let sessionTimer: NodeJS.Timeout | null = null
    let autoLockTimer: NodeJS.Timeout | null = null

    const startSessionMonitoring = () => {
      // Check token expiration
      if (sessionTimer) clearInterval(sessionTimer)
      sessionTimer = setInterval(async () => {
        if (isTokenExpired.value) {
          try {
            await refreshToken()
          } catch (error) {
            console.warn('Token refresh failed:', error)
          }
        }
      }, 60000) // Check every minute

      // Auto-lock after inactivity
      if (autoLockEnabled.value) {
        resetAutoLockTimer()

        // Listen for user activity
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
        events.forEach(event => {
          document.addEventListener(event, resetAutoLockTimer, true)
        })
      }
    }

    const stopSessionMonitoring = () => {
      if (sessionTimer) {
        clearInterval(sessionTimer)
        sessionTimer = null
      }

      if (autoLockTimer) {
        clearTimeout(autoLockTimer)
        autoLockTimer = null
      }
    }

    const resetAutoLockTimer = () => {
      if (!autoLockEnabled.value) return

      if (autoLockTimer) clearTimeout(autoLockTimer)

      autoLockTimer = setTimeout(() => {
        logout()
      }, autoLockDelay.value)
    }

    const clearError = () => {
      lastError.value = null
    }

    const generateDeviceId = () => {
      return 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()
    }

    // Initialize
    const initialize = () => {
      // Generate device ID if not exists
      if (!deviceId.value) {
        deviceId.value = generateDeviceId()
      }

      // Check for existing session
      if (session.value && !isTokenExpired.value) {
        startSessionMonitoring()
      } else if (session.value && isTokenExpired.value) {
        // Try to refresh token
        refreshToken().catch(() => {
          session.value = null
        })
      }
    }

    return {
      // State
      session,
      isLoading,
      lastError,
      loginAttempts,
      isLocked,
      lockoutUntil,
      deviceId,
      sessionId,
      activeSessions,
      twoFactorEnabled,
      biometricEnabled,
      sessionTimeout,
      autoLockEnabled,
      autoLockDelay,

      // Computed
      isAuthenticated,
      currentUser,
      isTokenExpired,
      isAccountLocked,
      timeUntilUnlock,

      // Actions
      login,
      loginWithSSO,
      register,
      logout,
      refreshToken,
      updateProfile,
      changePassword,
      forgotPassword,
      resetPassword,
      enableTwoFactor,
      verifyTwoFactor,
      disableTwoFactor,
      getActiveSessions,
      revokeSession,
      clearError,
      initialize
    }
  },
  {
    persist: {
      key: 'miaoda-auth-store',
      paths: ['session', 'deviceId', 'twoFactorEnabled', 'autoLockEnabled', 'autoLockDelay'],
      storage: localStorage
    }
  }
)

// Mock authentication service - ONLY FOR DEVELOPMENT
// Replace with real IPC calls to backend authentication service
const authService = {
  async login(credentials: any): Promise<AuthSession> {
    // Call real backend authentication via IPC
    const response = await window.electronAPI.auth.login({
      email: credentials.email,
      password: credentials.password,
      deviceId: credentials.deviceId,
      deviceName: 'MiaoDa Chat Desktop',
      deviceType: 'desktop',
      rememberMe: credentials.rememberMe,
      ipAddress: '127.0.0.1', // Local application
      userAgent: navigator.userAgent
    })

    return {
      accessToken: response.session.access_token,
      refreshToken: response.session.refresh_token,
      expiresAt: new Date(response.session.expires_at),
      user: {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        avatar: response.user.avatar_url,
        createdAt: new Date(response.user.created_at),
        lastActiveAt: new Date(),
        preferences: response.user.preferences || {
          theme: 'system',
          language: 'en',
          timezone: 'UTC'
        }
      }
    }
  },

  async loginWithSSO(params: any): Promise<AuthSession> {
    throw new Error('SSO authentication not yet implemented')
  },

  async register(userData: any): Promise<AuthSession> {
    const response = await window.electronAPI.auth.register({
      email: userData.email,
      password: userData.password,
      name: userData.name,
      acceptTerms: userData.acceptTerms,
      deviceId: userData.deviceId,
      deviceName: 'MiaoDa Chat Desktop',
      deviceType: 'desktop',
      ipAddress: '127.0.0.1',
      userAgent: navigator.userAgent
    })

    return {
      accessToken: response.session.access_token,
      refreshToken: response.session.refresh_token,
      expiresAt: new Date(response.session.expires_at),
      user: {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        avatar: response.user.avatar_url,
        createdAt: new Date(response.user.created_at),
        lastActiveAt: new Date(),
        preferences: response.user.preferences || {
          theme: 'system',
          language: 'en',
          timezone: 'UTC'
        }
      }
    }
  },

  async logout(params: any): Promise<void> {
    if (sessionId.value) {
      await window.electronAPI.auth.logout({
        sessionId: sessionId.value,
        allDevices: params.allDevices
      })
    }
  },

  async refreshToken(refreshToken: string): Promise<AuthSession> {
    const response = await window.electronAPI.auth.refreshToken({
      refreshToken
    })

    return {
      accessToken: response.session.access_token,
      refreshToken: response.session.refresh_token,
      expiresAt: new Date(response.session.expires_at),
      user: {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        avatar: response.user.avatar_url,
        createdAt: new Date(response.user.created_at),
        lastActiveAt: new Date(),
        preferences: response.user.preferences || {
          theme: 'system',
          language: 'en',
          timezone: 'UTC'
        }
      }
    }
  },

  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    const response = await window.electronAPI.auth.updateProfile({
      sessionId: sessionId.value,
      updates
    })

    return {
      id: response.user.id,
      email: response.user.email,
      name: response.user.name,
      avatar: response.user.avatar_url,
      createdAt: new Date(response.user.created_at),
      lastActiveAt: new Date(),
      preferences: response.user.preferences || {
        theme: 'system',
        language: 'en',
        timezone: 'UTC'
      }
    }
  },

  async changePassword(params: any): Promise<void> {
    await window.electronAPI.auth.changePassword({
      sessionId: sessionId.value,
      currentPassword: params.currentPassword,
      newPassword: params.newPassword
    })
  },

  async forgotPassword(email: string): Promise<void> {
    await window.electronAPI.auth.requestPasswordReset({
      email,
      ipAddress: '127.0.0.1',
      userAgent: navigator.userAgent
    })
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await window.electronAPI.auth.confirmPasswordReset({
      token,
      newPassword,
      ipAddress: '127.0.0.1',
      userAgent: navigator.userAgent
    })
  },

  async setupTwoFactor(userId: string): Promise<any> {
    // This will be implemented with MFA integration
    throw new Error('Two-factor authentication setup not yet implemented')
  },

  async verifyTwoFactor(userId: string, code: string): Promise<void> {
    throw new Error('Two-factor authentication verification not yet implemented')
  },

  async disableTwoFactor(userId: string, password: string): Promise<void> {
    throw new Error('Two-factor authentication disable not yet implemented')
  },

  async getActiveSessions(): Promise<any[]> {
    const sessions = await window.electronAPI.auth.getSessions({
      sessionId: sessionId.value
    })

    return sessions.map((session: any) => ({
      id: session.id,
      deviceName: session.device_name || 'Unknown Device',
      location: session.location || 'Unknown Location',
      lastActive: new Date(session.last_used_at),
      current: session.is_current
    }))
  },

  async revokeSession(sessionIdToRevoke: string): Promise<void> {
    await window.electronAPI.auth.revokeSession({
      sessionId: sessionId.value,
      targetSessionId: sessionIdToRevoke
    })
  }
}
