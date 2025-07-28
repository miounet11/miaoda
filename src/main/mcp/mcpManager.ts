import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js'

export interface MCPServer {
  name: string
  command: string
  args: string[]
  env?: Record<string, string>
}

export class MCPManager {
  private clients: Map<string, Client> = new Map()
  private tools: Map<string, Tool> = new Map()

  async connectServer(server: MCPServer): Promise<void> {
    try {
      const transport = new StdioClientTransport({
        command: server.command,
        args: server.args,
        env: server.env
      })

      const client = new Client({
        name: `miaoda-chat-${server.name}`,
        version: '0.1.0'
      }, {
        capabilities: {}
      })

      await client.connect(transport)
      this.clients.set(server.name, client)

      // List available tools
      const toolsResponse = await client.listTools()
      toolsResponse.tools.forEach(tool => {
        this.tools.set(`${server.name}:${tool.name}`, tool)
      })

      console.log(`Connected to MCP server: ${server.name}`)
    } catch (error) {
      console.error(`Failed to connect to MCP server ${server.name}:`, error)
      throw error
    }
  }

  async disconnectServer(name: string): Promise<void> {
    const client = this.clients.get(name)
    if (client) {
      await client.close()
      this.clients.delete(name)
      
      // Remove tools from this server
      for (const [toolKey] of this.tools) {
        if (toolKey.startsWith(`${name}:`)) {
          this.tools.delete(toolKey)
        }
      }
    }
  }

  getAvailableTools(): Tool[] {
    return Array.from(this.tools.values())
  }

  async callTool(toolName: string, args: any): Promise<CallToolResult> {
    // Find the tool and its server
    let serverName: string | null = null
    let actualToolName: string = toolName

    for (const [key, tool] of this.tools) {
      if (key.endsWith(`:${toolName}`) || key === toolName) {
        const parts = key.split(':')
        serverName = parts[0]
        actualToolName = parts[1]
        break
      }
    }

    if (!serverName) {
      throw new Error(`Tool not found: ${toolName}`)
    }

    const client = this.clients.get(serverName)
    if (!client) {
      throw new Error(`Server not connected: ${serverName}`)
    }

    try {
      const result = await client.callTool({ name: actualToolName, arguments: args })
      return result
    } catch (error) {
      console.error(`Error calling tool ${toolName}:`, error)
      throw error
    }
  }

  async disconnectAll(): Promise<void> {
    for (const [name] of this.clients) {
      await this.disconnectServer(name)
    }
  }
}