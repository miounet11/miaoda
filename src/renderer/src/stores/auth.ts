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

export const useAuthStore = defineStore('auth', () => {
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
      throw new Error(`Account is locked. Try again in ${Math.ceil(timeUntilUnlock.value / 60000)} minutes.`)
    }
    
    try {
      isLoading.value = true
      lastError.value = null
      
      // Mock authentication - replace with actual auth service
      const response = await mockAuthService.login({
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
      
      // Mock SSO authentication
      const response = await mockAuthService.loginWithSSO({
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
      
      const response = await mockAuthService.register({
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
        await mockAuthService.logout({
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
      const response = await mockAuthService.refreshToken(session.value.refreshToken)
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
      
      const updatedUser = await mockAuthService.updateProfile(currentUser.value.id, updates)
      
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
      
      await mockAuthService.changePassword({
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
      
      await mockAuthService.forgotPassword(email)
      
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
      
      await mockAuthService.resetPassword(token, newPassword)
      
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
      const setup = await mockAuthService.setupTwoFactor(currentUser.value.id)
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
      await mockAuthService.verifyTwoFactor(currentUser.value.id, code)
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
      await mockAuthService.disableTwoFactor(currentUser.value.id, password)
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
      const sessions = await mockAuthService.getActiveSessions(currentUser.value.id)
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
      await mockAuthService.revokeSession(sessionIdToRevoke)
      
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
}, {
  persist: {
    key: 'miaoda-auth-store',
    paths: ['session', 'deviceId', 'twoFactorEnabled', 'autoLockEnabled', 'autoLockDelay'],
    storage: localStorage
  }
})

// Mock authentication service - ONLY FOR DEVELOPMENT
// TODO: Replace with real authentication service before production
const mockAuthService = {
  async login(credentials: any): Promise<AuthSession> {
    // Development only - remove in production
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Authentication service not configured for production')
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (credentials.email === 'demo@example.com' && credentials.password === 'password') {
      const user: User = {
        id: 'user123',
        email: credentials.email,
        name: 'Demo User',
        avatar: 'https://ui-avatars.com/api/?name=Demo+User',
        createdAt: new Date('2024-01-01'),
        lastActiveAt: new Date(),
        preferences: {
          theme: 'system',
          language: 'en',
          timezone: 'UTC'
        }
      }
      
      return {
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        user
      }
    } else {
      throw new Error('Invalid email or password')
    }
  },
  
  async loginWithSSO(params: any): Promise<AuthSession> {
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Mock successful SSO login
    const user: User = {
      id: 'sso_user123',
      email: `user@${params.provider}.com`,
      name: `${params.provider} User`,
      avatar: `https://ui-avatars.com/api/?name=${params.provider}+User`,
      createdAt: new Date('2024-01-01'),
      lastActiveAt: new Date(),
      preferences: {
        theme: 'system',
        language: 'en',
        timezone: 'UTC'
      }
    }
    
    return {
      accessToken: 'mock_sso_access_token',
      refreshToken: 'mock_sso_refresh_token',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      user
    }
  },
  
  async register(userData: any): Promise<AuthSession> {
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    const user: User = {
      id: 'new_user_' + Date.now(),
      email: userData.email,
      name: userData.name,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}`,
      createdAt: new Date(),
      lastActiveAt: new Date(),
      preferences: {
        theme: 'system',
        language: 'en',
        timezone: 'UTC'
      }
    }
    
    return {
      accessToken: 'mock_new_access_token',
      refreshToken: 'mock_new_refresh_token',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      user
    }
  },
  
  async logout(params: any): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500))
    // Mock logout
  },
  
  async refreshToken(refreshToken: string): Promise<AuthSession> {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Mock token refresh
    const currentSession = JSON.parse(localStorage.getItem('miaoda-auth-store') || '{}')
    
    return {
      ...currentSession.session,
      accessToken: 'mock_refreshed_access_token',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000)
    }
  },
  
  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Mock profile update
    const currentSession = JSON.parse(localStorage.getItem('miaoda-auth-store') || '{}')
    const currentUser = currentSession.session?.user
    
    return {
      ...currentUser,
      ...updates,
      lastActiveAt: new Date()
    }
  },
  
  async changePassword(params: any): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (params.currentPassword !== 'password') {
      throw new Error('Current password is incorrect')
    }
    
    // Mock password change
  },
  
  async forgotPassword(email: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000))
    // Mock forgot password
  },
  
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000))
    // Mock password reset
  },
  
  async setupTwoFactor(userId: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return {
      qrCode: 'mock_qr_code_data',
      backupCodes: ['123456', '234567', '345678', '456789', '567890']
    }
  },
  
  async verifyTwoFactor(userId: string, code: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    if (code !== '123456') {
      throw new Error('Invalid verification code')
    }
  },
  
  async disableTwoFactor(userId: string, password: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    if (password !== 'password') {
      throw new Error('Invalid password')
    }
  },
  
  async getActiveSessions(userId: string): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 600))
    
    return [
      {
        id: 'session1',
        deviceName: 'MacBook Pro',
        location: 'San Francisco, CA',
        lastActive: new Date(),
        current: true
      },
      {
        id: 'session2',
        deviceName: 'iPhone',
        location: 'San Francisco, CA',
        lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
        current: false
      }
    ]
  },
  
  async revokeSession(sessionId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500))
    // Mock session revoke
  }
}