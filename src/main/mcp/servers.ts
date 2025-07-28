import { MCPServer } from './mcpManager'
import { join } from 'path'
import { homedir } from 'os'

// Built-in MCP servers configuration
export const builtInServers: MCPServer[] = [
  // Temporarily disabled until servers are installed
  // {
  //   name: 'filesystem',
  //   command: 'node',
  //   args: [
  //     join(__dirname, '../../../node_modules/@modelcontextprotocol/server-filesystem/dist/index.js'),
  //     join(homedir(), 'Documents')
  //   ]
  // },
  // {
  //   name: 'memory',
  //   command: 'node',
  //   args: [
  //     join(__dirname, '../../../node_modules/@modelcontextprotocol/server-memory/dist/index.js')
  //   ]
  // }
]

// User can add custom servers via settings
export function getUserServers(): MCPServer[] {
  // TODO: Load from user settings
  return []
}

export function getAllServers(): MCPServer[] {
  return [...builtInServers, ...getUserServers()]
}