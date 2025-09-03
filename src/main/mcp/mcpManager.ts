// @ts-nocheck
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { PluginManager } from '../plugins/pluginManager'

export interface MCPServer {
  name: string
  command: string
  args: string[]
  env?: Record<string, string>
}

export class MCPManager {
  private clients: Map<string, Client> = new Map()
  private tools: Map<string, Tool> = new Map()
  private pluginManager: PluginManager | null = null

  constructor() {
    // Test tools removed - using real MCP tools only
    console.log('MCP Manager initialized')
  }

  setPluginManager(pluginManager: PluginManager) {
    this.pluginManager = pluginManager
  }

  async connectServer(server: MCPServer): Promise<void> {
    try {
      // 验证 server 对象完整性
      if (!server || !server.name || !server.command) {
        throw new Error(`Invalid server configuration: ${JSON.stringify(server)}`)
      }

      console.log(`[MCP] Connecting to server: ${server.name}`)
      console.log(`[MCP] Command: ${server.command} ${server.args?.join(' ') || 'no args'}`)

      const transport = new StdioClientTransport({
        command: server.command,
        args: server.args || [],
        env: server.env,
      })

      const client = new Client(
        {
          name: `miaoda-chat-${server.name}`,
          version: '0.1.0',
        },
        {
          capabilities: {
            tools: {},
            resources: {},
          },
        },
      )

      await client.connect(transport)
      this.clients.set(server.name, client)
      console.log(`[MCP] Successfully connected to ${server.name}`)

      // List available tools
      try {
        const toolsResponse = await client.listTools()
        console.log(
          `[MCP] Server ${server.name} provides ${toolsResponse?.tools?.length || 0} tools`,
        )
        if (toolsResponse?.tools) {
          toolsResponse.tools.forEach(tool => {
            if (tool && tool.name) {
              this.tools.set(`${server.name}:${tool.name}`, tool)
            }
          })
        }
      } catch (toolError) {
        console.warn(`[MCP] Failed to list tools for ${server.name}:`, toolError)
      }

      console.log(`Connected to MCP server: ${server.name}`)
    } catch (error) {
      console.error(`Failed to connect to MCP server ${server?.name || 'unknown'}:`, error)
      throw new Error(
        `MCP server connection failed: ${error instanceof Error ? error.message : String(error)}`,
      )
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
    const tools = Array.from(this.tools.values())

    // Add plugin tools if plugin manager is available
    if (this.pluginManager) {
      const pluginTools = this.pluginManager.getAllTools()
      tools.push(...pluginTools)
    }

    return tools
  }

  async callTool(toolName: string, args: any): Promise<CallToolResult> {
    // Check if it's a plugin tool first
    if (this.pluginManager && toolName.includes(':')) {
      const pluginTools = this.pluginManager.getAllTools()
      const pluginTool = pluginTools.find(t => t.name === toolName)
      if (pluginTool) {
        try {
          const result = await this.pluginManager.executeTool(toolName, args)
          return {
            content: [
              {
                type: 'text',
                text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
              },
            ],
          }
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text',
                text: `Plugin error: ${error.message}`,
              },
            ],
            isError: true,
          }
        }
      }
    }

    // Find the tool and its server
    let serverName: string | null = null
    let actualToolName: string = toolName

    for (const [key] of this.tools) {
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

    // Handle test tools (simplified)
    if (serverName === 'test') {
      console.log(`Test tool call: ${actualToolName}`)
      return {
        content: [
          {
            type: 'text',
            text: `Test tool ${actualToolName} executed (placeholder)`,
          },
        ],
      }
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
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`Tool call failed: ${errorMessage}`)
    }
  }

  async disconnectAll(): Promise<void> {
    for (const [name] of this.clients) {
      await this.disconnectServer(name)
    }
  }
}
