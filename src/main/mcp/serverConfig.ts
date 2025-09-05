import { MCPServer } from './mcpManager'
import { join } from 'path'
import { homedir } from 'os'
import { logger } from '../utils/Logger'

// MCP 服务器配置优化
export const serverConfigurations: Record<string, Partial<MCPServer>> = {
  filesystem: {
    env: {
      NODE_ENV: 'production',
      // 限制文件系统访问范围
      MCP_FS_ROOT: join(homedir(), 'Documents'),
      MCP_FS_READONLY: 'false'
    }
  },
  memory: {
    env: {
      NODE_ENV: 'production',
      // 内存限制和持久化配置
      MCP_MEMORY_MAX_SIZE: '100MB',
      MCP_MEMORY_PERSIST: 'true',
      MCP_MEMORY_PATH: join(homedir(), '.miaoda-chat', 'memory')
    }
  },
  'code-executor': {
    env: {
      NODE_ENV: 'production',
      // 代码执行安全配置
      MCP_CODE_TIMEOUT: '30000', // 30秒超时
      MCP_CODE_MEMORY_LIMIT: '512MB',
      MCP_CODE_SANDBOX: 'true'
    }
  },
  context7: {
    env: {
      NODE_ENV: 'production',
      // Context7 配置
      MCP_CONTEXT7_API_KEY: process.env.CONTEXT7_API_KEY || '',
      MCP_CONTEXT7_ENDPOINT: process.env.CONTEXT7_ENDPOINT || 'https://api.context7.com',
      MCP_CONTEXT7_CACHE: 'true'
    }
  }
}

// 获取优化后的服务器配置
export function getOptimizedServerConfig(server: MCPServer): MCPServer {
  const config = serverConfigurations[server.name]
  if (!config) {
    return server
  }

  return {
    ...server,
    env: {
      ...(Object.fromEntries(
        Object.entries(process.env).filter(([, v]) => v !== undefined)
      ) as Record<string, string>),
      ...config.env,
      ...server.env
    }
  }
}

// 验证服务器配置
export function validateServerConfig(server: MCPServer): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!server.name) {
    errors.push('Server name is required')
  }

  if (!server.command) {
    errors.push('Server command is required')
  }

  if (!server.args || server.args.length === 0) {
    errors.push('Server args are required')
  }

  // 特定服务器的验证
  if (server.name === 'context7' && !server.env?.MCP_CONTEXT7_API_KEY) {
    logger.warn('Context7 API key not configured. Some features may be limited.', 'ServerConfig')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
