/**
 * OAuth 2.0/OIDC 提供商集成
 * 支持多种身份提供商的安全认证
 *
 * 支持的提供商：
 * - Google OAuth 2.0
 * - Microsoft Azure AD
 * - GitHub OAuth
 * - 自定义OIDC提供商
 *
 * 安全特性：
 * - PKCE (Proof Key for Code Exchange)
 * - 状态参数验证
 * - 代码注入防护
 * - 令牌安全存储
 * - 自动令牌刷新
 */

import { EventEmitter } from 'events'
import { shell } from 'electron'
import { BrowserWindow } from 'electron'
import crypto from 'crypto'
import { URL } from 'url'

// OAuth 提供商配置
export interface OAuthConfig {
  clientId: string
  clientSecret?: string // PKCE模式下可选
  redirectUri: string
  scopes: string[]
  authUrl: string
  tokenUrl: string
  userInfoUrl?: string
  revokeUrl?: string
  usePKCE: boolean
  additionalParams?: Record<string, string>
}

// 预定义的提供商配置
export const OAUTH_PROVIDERS: Record<string, Partial<OAuthConfig>> = {
  google: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    revokeUrl: 'https://oauth2.googleapis.com/revoke',
    scopes: ['openid', 'email', 'profile'],
    usePKCE: true
  },
  microsoft: {
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
    scopes: ['openid', 'email', 'profile'],
    usePKCE: true
  },
  github: {
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    scopes: ['user:email'],
    usePKCE: false
  }
}

// 令牌响应
export interface TokenResponse {
  accessToken: string
  refreshToken?: string
  idToken?: string
  tokenType: string
  expiresIn: number
  scope?: string
}

// 用户信息
export interface UserInfo {
  id: string
  email: string
  name: string
  picture?: string
  verified: boolean
  locale?: string
  provider: string
}

// PKCE 参数
interface PKCEParams {
  codeVerifier: string
  codeChallenge: string
  codeChallengeMethod: 'S256'
}

// 认证状态
interface AuthState {
  state: string
  nonce: string
  pkce?: PKCEParams
  timestamp: number
}

/**
 * OAuth 2.0 提供商管理器
 */
export class OAuthProvider extends EventEmitter {
  private config: OAuthConfig
  private authStates: Map<string, AuthState> = new Map()
  private currentTokens: TokenResponse | null = null

  constructor(
    private providerId: string,
    config: Partial<OAuthConfig>
  ) {
    super()

    // 合并预定义配置
    const baseConfig = OAUTH_PROVIDERS[providerId] || {}
    this.config = {
      ...baseConfig,
      ...config
    } as OAuthConfig

    this.validateConfig()
  }

  /**
   * 验证配置
   */
  private validateConfig(): void {
    const required = ['clientId', 'authUrl', 'tokenUrl', 'redirectUri', 'scopes']

    for (const field of required) {
      if (!this.config[field as keyof OAuthConfig]) {
        throw new Error(`Missing required OAuth config: ${field}`)
      }
    }

    // 验证重定向URI安全性
    if (!this.isSecureRedirectUri(this.config.redirectUri)) {
      throw new Error('Insecure redirect URI. Use HTTPS or localhost for development.')
    }
  }

  /**
   * 验证重定向URI安全性
   */
  private isSecureRedirectUri(uri: string): boolean {
    try {
      const url = new URL(uri)
      // 允许HTTPS或localhost/127.0.0.1用于开发
      return (
        url.protocol === 'https:' || url.hostname === 'localhost' || url.hostname === '127.0.0.1'
      )
    } catch {
      return false
    }
  }

  /**
   * 开始OAuth认证流程
   */
  async authenticate(): Promise<UserInfo> {
    try {
      // 生成安全参数
      const authState = this.generateAuthState()

      // 构建认证URL
      const authUrl = this.buildAuthUrl(authState)

      // 存储认证状态
      this.authStates.set(authState.state, authState)

      // 打开认证窗口
      const authCode = await this.openAuthWindow(authUrl)

      // 验证并交换令牌
      const tokens = await this.exchangeCodeForTokens(authCode, authState)

      // 获取用户信息
      const userInfo = await this.getUserInfo(tokens.accessToken)

      // 存储令牌
      this.currentTokens = tokens

      // 清理认证状态
      this.authStates.delete(authState.state)

      this.emit('authenticated', userInfo)
      return userInfo
    } catch (error) {
      this.emit('authError', error)
      throw error
    }
  }

  /**
   * 生成认证状态参数
   */
  private generateAuthState(): AuthState {
    const state = this.generateSecureRandom(32)
    const nonce = this.generateSecureRandom(32)

    const authState: AuthState = {
      state,
      nonce,
      timestamp: Date.now()
    }

    // 如果使用PKCE，生成PKCE参数
    if (this.config.usePKCE) {
      authState.pkce = this.generatePKCEParams()
    }

    return authState
  }

  /**
   * 生成PKCE参数
   */
  private generatePKCEParams(): PKCEParams {
    const codeVerifier = this.generateSecureRandom(128)
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url')

    return {
      codeVerifier,
      codeChallenge,
      codeChallengeMethod: 'S256'
    }
  }

  /**
   * 生成安全随机字符串
   */
  private generateSecureRandom(length: number): string {
    return crypto.randomBytes(length).toString('base64url').slice(0, length)
  }

  /**
   * 构建认证URL
   */
  private buildAuthUrl(authState: AuthState): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scopes.join(' '),
      state: authState.state,
      nonce: authState.nonce
    })

    // 添加PKCE参数
    if (authState.pkce) {
      params.append('code_challenge', authState.pkce.codeChallenge)
      params.append('code_challenge_method', authState.pkce.codeChallengeMethod)
    }

    // 添加附加参数
    if (this.config.additionalParams) {
      for (const [key, value] of Object.entries(this.config.additionalParams)) {
        params.append(key, value)
      }
    }

    return `${this.config.authUrl}?${params.toString()}`
  }

  /**
   * 打开认证窗口
   */
  private async openAuthWindow(authUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const authWindow = new BrowserWindow({
        width: 500,
        height: 700,
        show: true,
        modal: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: true,
          allowRunningInsecureContent: false
        }
      })

      // 设置安全headers
      authWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            'Content-Security-Policy': ["default-src 'self' 'unsafe-inline'"],
            'X-Frame-Options': ['DENY'],
            'X-Content-Type-Options': ['nosniff']
          }
        })
      })

      authWindow.loadURL(authUrl)

      // 监听URL变化
      authWindow.webContents.on('will-navigate', (event, url) => {
        this.handleNavigationUrl(url, resolve, reject, authWindow)
      })

      authWindow.webContents.on('will-redirect', (event, url) => {
        this.handleNavigationUrl(url, resolve, reject, authWindow)
      })

      // 处理窗口关闭
      authWindow.on('closed', () => {
        reject(new Error('Authentication window closed by user'))
      })

      // 超时处理
      setTimeout(() => {
        if (!authWindow.isDestroyed()) {
          authWindow.close()
          reject(new Error('Authentication timeout'))
        }
      }, 300000) // 5分钟超时
    })
  }

  /**
   * 处理导航URL
   */
  private handleNavigationUrl(
    url: string,
    resolve: (code: string) => void,
    reject: (error: Error) => void,
    authWindow: BrowserWindow
  ): void {
    try {
      const urlObj = new URL(url)

      // 检查是否是重定向URI
      if (urlObj.origin + urlObj.pathname === this.config.redirectUri) {
        const code = urlObj.searchParams.get('code')
        const state = urlObj.searchParams.get('state')
        const error = urlObj.searchParams.get('error')

        if (error) {
          const errorDescription = urlObj.searchParams.get('error_description')
          reject(new Error(`OAuth error: ${error} - ${errorDescription}`))
          authWindow.close()
          return
        }

        if (!code || !state) {
          reject(new Error('Missing code or state parameter'))
          authWindow.close()
          return
        }

        // 验证状态参数
        if (!this.authStates.has(state)) {
          reject(new Error('Invalid state parameter'))
          authWindow.close()
          return
        }

        resolve(code)
        authWindow.close()
      }
    } catch (error) {
      reject(new Error(`Invalid redirect URL: ${error}`))
      authWindow.close()
    }
  }

  /**
   * 交换授权码为令牌
   */
  private async exchangeCodeForTokens(code: string, authState: AuthState): Promise<TokenResponse> {
    const tokenData = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.config.clientId,
      code,
      redirect_uri: this.config.redirectUri
    })

    // 添加客户端密钥（如果不使用PKCE）
    if (this.config.clientSecret && !this.config.usePKCE) {
      tokenData.append('client_secret', this.config.clientSecret)
    }

    // 添加PKCE验证器
    if (authState.pkce) {
      tokenData.append('code_verifier', authState.pkce.codeVerifier)
    }

    try {
      const response = await fetch(this.config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
          'User-Agent': 'MiaoDa-Chat/1.0'
        },
        body: tokenData
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Token exchange failed: ${response.status} - ${errorData}`)
      }

      const tokens = await response.json()

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        idToken: tokens.id_token,
        tokenType: tokens.token_type || 'Bearer',
        expiresIn: tokens.expires_in,
        scope: tokens.scope
      }
    } catch (error) {
      throw new Error(`Failed to exchange code for tokens: ${error}`)
    }
  }

  /**
   * 获取用户信息
   */
  private async getUserInfo(accessToken: string): Promise<UserInfo> {
    if (!this.config.userInfoUrl) {
      throw new Error('User info URL not configured')
    }

    try {
      const response = await fetch(this.config.userInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
          'User-Agent': 'MiaoDa-Chat/1.0'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch user info: ${response.status}`)
      }

      const userData = await response.json()

      return this.normalizeUserInfo(userData)
    } catch (error) {
      throw new Error(`Failed to get user info: ${error}`)
    }
  }

  /**
   * 标准化用户信息
   */
  private normalizeUserInfo(userData: any): UserInfo {
    switch (this.providerId) {
      case 'google':
        return {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          picture: userData.picture,
          verified: userData.verified_email,
          locale: userData.locale,
          provider: 'google'
        }

      case 'microsoft':
        return {
          id: userData.id,
          email: userData.mail || userData.userPrincipalName,
          name: userData.displayName,
          picture: userData.photo,
          verified: true, // Microsoft emails are generally verified
          locale: userData.preferredLanguage,
          provider: 'microsoft'
        }

      case 'github':
        return {
          id: userData.id.toString(),
          email: userData.email,
          name: userData.name || userData.login,
          picture: userData.avatar_url,
          verified: userData.email !== null,
          provider: 'github'
        }

      default:
        // 通用OIDC格式
        return {
          id: userData.sub || userData.id,
          email: userData.email,
          name: userData.name,
          picture: userData.picture,
          verified: userData.email_verified || false,
          locale: userData.locale,
          provider: this.providerId
        }
    }
  }

  /**
   * 刷新访问令牌
   */
  async refreshTokens(): Promise<TokenResponse> {
    if (!this.currentTokens?.refreshToken) {
      throw new Error('No refresh token available')
    }

    const tokenData = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.config.clientId,
      refresh_token: this.currentTokens.refreshToken
    })

    if (this.config.clientSecret) {
      tokenData.append('client_secret', this.config.clientSecret)
    }

    try {
      const response = await fetch(this.config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json'
        },
        body: tokenData
      })

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`)
      }

      const tokens = await response.json()

      const refreshedTokens: TokenResponse = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || this.currentTokens.refreshToken,
        idToken: tokens.id_token,
        tokenType: tokens.token_type || 'Bearer',
        expiresIn: tokens.expires_in,
        scope: tokens.scope
      }

      this.currentTokens = refreshedTokens
      this.emit('tokensRefreshed', refreshedTokens)

      return refreshedTokens
    } catch (error) {
      this.emit('refreshError', error)
      throw error
    }
  }

  /**
   * 撤销令牌
   */
  async revokeTokens(): Promise<void> {
    if (!this.config.revokeUrl || !this.currentTokens) {
      return
    }

    try {
      const revokeData = new URLSearchParams({
        token: this.currentTokens.accessToken,
        client_id: this.config.clientId
      })

      if (this.config.clientSecret) {
        revokeData.append('client_secret', this.config.clientSecret)
      }

      await fetch(this.config.revokeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: revokeData
      })
    } catch (error) {
      console.warn('Failed to revoke tokens:', error)
    } finally {
      this.currentTokens = null
      this.emit('tokensRevoked')
    }
  }

  /**
   * 检查令牌是否即将过期
   */
  isTokenExpiringSoon(bufferMinutes: number = 5): boolean {
    if (!this.currentTokens) return true

    const expirationTime = Date.now() + this.currentTokens.expiresIn * 1000
    const bufferTime = bufferMinutes * 60 * 1000

    return expirationTime - Date.now() < bufferTime
  }

  /**
   * 获取当前令牌
   */
  getCurrentTokens(): TokenResponse | null {
    return this.currentTokens
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.authStates.clear()
    this.currentTokens = null
    this.removeAllListeners()
  }
}

export default OAuthProvider
