import { MCPServer } from './mcpManager'
import { join, dirname } from 'path'
import { homedir } from 'os'
import { fileURLToPath } from 'url'
import { getOptimizedServerConfig } from './serverConfig'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Built-in MCP servers configuration
export const builtInServers: MCPServer[] = [
  {
    name: 'filesystem',
    command: 'npx',
    args: [
      '-y',
      '@modelcontextprotocol/server-filesystem',
      join(homedir(), 'Documents')
    ]
  },
  {
    name: 'memory',
    command: 'npx',
    args: [
      '-y',
      '@modelcontextprotocol/server-memory'
    ]
  },
  {
    name: 'context7',
    command: 'npx',
    args: [
      '-y',
      '@upstash/context7-mcp'
    ]
  },
]

// User can add custom servers via settings
export function getUserServers(): MCPServer[] {
  // Placeholder for user-defined MCP servers from settings
  // In future, this can be loaded from a configuration file or settings
  return [
    // Example of how a user might add a custom MCP server
    // {
    //   name: 'custom-mcp',
    //   command: 'npx',
    //   args: ['custom-mcp-tool']
    // }
  ]
}

export function getAllServers(): MCPServer[] {
  const allServers = [...builtInServers, ...getUserServers()]
  // 应用优化配置
  return allServers.map(server => getOptimizedServerConfig(server))
}