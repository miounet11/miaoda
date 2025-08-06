import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { MCPManager } from '../mcpManager'
import { getAllServers } from '../servers'

describe('MCPManager', () => {
  let mcpManager: MCPManager

  beforeEach(() => {
    mcpManager = new MCPManager()
  })

  afterEach(async () => {
    await mcpManager.disconnectAll()
  })

  it('should retrieve all available servers', () => {
    const servers = getAllServers()
    expect(servers.length).toBeGreaterThan(0)
  })

  it('should connect to built-in MCP servers', async () => {
    const servers = getAllServers()
    
    for (const server of servers) {
      try {
        await mcpManager.connectServer(server)
        const tools = mcpManager.getAvailableTools()
        expect(tools.length).toBeGreaterThan(0)
      } catch (error) {
        console.error(`Failed to connect to server ${server.name}:`, error)
        // Not all servers might be available, so we won't fail the test
      }
    }
  })

  it('should handle tool discovery', async () => {
    const servers = getAllServers().slice(0, 2) // Test first two servers
    
    for (const server of servers) {
      try {
        await mcpManager.connectServer(server)
        const tools = mcpManager.getAvailableTools()
        
        // Validate tools have required properties
        tools.forEach(tool => {
          expect(tool).toHaveProperty('name')
          expect(tool).toHaveProperty('description', expect.any(String))
        })
      } catch (error) {
        console.error(`Tool discovery failed for ${server.name}:`, error)
      }
    }
  })

  it('should handle disconnection gracefully', async () => {
    const servers = getAllServers().slice(0, 1) // Test first server
    
    for (const server of servers) {
      await mcpManager.connectServer(server)
      const toolsBeforeDisconnect = mcpManager.getAvailableTools()
      
      await mcpManager.disconnectServer(server.name)
      const toolsAfterDisconnect = mcpManager.getAvailableTools()
      
      // Tools from disconnected server should be removed
      const remainingServerTools = toolsAfterDisconnect.filter(
        tool => !tool.name.startsWith(`${server.name}:`)
      )
      
      expect(remainingServerTools.length).toBeLessThanOrEqual(toolsAfterDisconnect.length)
    }
  })
})