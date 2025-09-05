/**
 * 内置提供商配置
 * 这些配置对用户不可见，不可修改
 */

interface BuiltinProviderConfig {
  id: string
  apiKey: string
  baseURL: string
  actualModel: string // 实际请求时使用的模型名称
  headers?: Record<string, string>
}

// 内置提供商的实际配置（对用户隐藏）
export const builtinConfigs: Record<string, BuiltinProviderConfig> = {
  'miaochat': {
    id: 'miaochat',
    apiKey: 'sk-44mAODPoO9EzCVC3Qp8PVpImElGDEByuDGNQjsFJHGRbhPdp',
    baseURL: 'https://ttkk.inping.com/v1',
    actualModel: 'grok-3',
    headers: {
      'Content-Type': 'application/json'
    }
  }
}

/**
 * 获取内置提供商的配置信息
 * @param providerId 提供商ID
 * @returns 配置信息，如果不是内置提供商则返回 null
 */
export function getBuiltinConfig(providerId: string): BuiltinProviderConfig | null {
  return builtinConfigs[providerId] || null
}

/**
 * 检查是否为内置提供商
 * @param providerId 提供商ID
 * @returns 是否为内置提供商
 */
export function isBuiltinProvider(providerId: string): boolean {
  return providerId in builtinConfigs
}

/**
 * 获取用于API请求的实际模型名称
 * @param providerId 提供商ID
 * @param modelId 显示的模型ID
 * @returns 实际的模型名称
 */
export function getActualModelName(providerId: string, modelId: string): string {
  const config = getBuiltinConfig(providerId)
  return config?.actualModel || modelId
}

/**
 * 获取用于API请求的配置信息
 * @param providerId 提供商ID
 * @returns API配置信息
 */
export function getAPIConfig(providerId: string): {
  apiKey: string
  baseURL: string
  headers: Record<string, string>
} | null {
  const config = getBuiltinConfig(providerId)
  if (!config) return null
  
  return {
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    headers: config.headers || {}
  }
}