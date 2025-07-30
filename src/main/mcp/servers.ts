import { MCPServer } from './mcpManager'
// import { join } from 'path'
// import { homedir } from 'os'

// Built-in MCP servers configuration
export const builtInServers: MCPServer[] = [
  // Temporarily disabled until we properly configure the build
  // {
  //   name: 'filesystem',
  //   command: 'npx',
  //   args: [
  //     '-y',
  //     '@modelcontextprotocol/server-filesystem',
  //     join(homedir(), 'Documents')
  //   ]
  // },
  // {
  //   name: 'memory',
  //   command: 'npx',
  //   args: [
  //     '-y',
  //     '@modelcontextprotocol/server-memory'
  //   ]
  // },
  // {
  //   name: 'code-executor',
  //   command: 'node',
  //   args: [
  //     join(__dirname, 'inMemoryServers/codeExecutor.js')
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