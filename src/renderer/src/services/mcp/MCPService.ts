import { EventEmitter } from '@renderer/src/utils/performance'

// MCP Protocol Types
export interface MCPTool {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, any>
    required?: string[]
  }
  category?: string
  tags?: string[]
  icon?: string
  version?: string
  author?: string
}

export interface MCPToolCall {
  id: string
  name: string
  arguments: Record<string, any>
  timestamp: Date
  status: 'pending' | 'running' | 'completed' | 'failed'
  result?: any
  error?: string
  duration?: number
}

export interface MCPServer {
  id: string
  name: string
  description: string
  version: string
  status: 'connected' | 'disconnected' | 'error'
  capabilities: string[]
  tools: MCPTool[]
  endpoint?: string
  lastHeartbeat?: Date
}

export interface MCPResource {
  uri: string
  name: string
  description?: string
  mimeType?: string
  text?: string
}

export interface MCPPrompt {
  name: string
  description: string
  arguments?: {
    name: string
    description: string
    required: boolean
  }[]
}

export class MCPService extends EventEmitter<{
  'server-connected': [MCPServer]
  'server-disconnected': [string] // server id
  'tool-call-start': [MCPToolCall]
  'tool-call-complete': [MCPToolCall]
  'tool-call-error': [MCPToolCall, Error]
  'resource-updated': [MCPResource]
  'prompt-received': [MCPPrompt]
}> {
  private servers = new Map<string, MCPServer>()
  private activeCalls = new Map<string, MCPToolCall>()
  private resources = new Map<string, MCPResource>()
  private prompts = new Map<string, MCPPrompt>()
  
  // Tool execution history
  private callHistory: MCPToolCall[] = []
  private maxHistorySize = 1000
  
  // Connection management
  private connectionRetryDelays = new Map<string, number>()
  private heartbeatIntervals = new Map<string, NodeJS.Timeout>()
  
  constructor() {
    super()
    this.initialize()
  }
  
  private async initialize() {
    // Initialize MCP connection if available
    if (window.api?.mcp) {
      await this.discoverServers()
      this.setupEventListeners()
    }
  }
  
  private async discoverServers() {
    try {
      const discoveredServers = await window.api.mcp.discoverServers()
      
      for (const serverInfo of discoveredServers) {
        await this.connectToServer(serverInfo)
      }
    } catch (error) {
      console.warn('MCP server discovery failed:', error)
      // Fallback: ignore discovery failures for now
    }
  }
  
  private setupEventListeners() {
    if (!window.api?.mcp) return
    
    // Basic MCP events - extended event system not yet implemented
    console.log('MCP basic event listeners setup')
    
    /* 
    // Advanced event listeners to be implemented:
    window.api.mcp.onServerConnect?.((server: MCPServer) => {
      this.handleServerConnect(server)
    })
    
    window.api.mcp.onServerDisconnect?.((serverId: string) => {
      this.handleServerDisconnect(serverId)
    })
    
    window.api.mcp.onToolResult?.((callId: string, result: any) => {
      this.handleToolResult(callId, result)
    })
    
    window.api.mcp.onToolError?.((callId: string, error: Error) => {
      this.handleToolError(callId, error)
    })
    */
  }
  
  async connectToServer(serverConfig: {
    id: string
    name: string
    endpoint?: string
    command?: string
    args?: string[]
    env?: Record<string, string>
  }): Promise<boolean> {
    try {
      const server = await window.api.mcp.connect(serverConfig)
      
      this.servers.set(server.id, server)
      this.startHeartbeat(server.id)
      this.emit('server-connected', server)
      
      return true
    } catch (error) {
      console.error(`Failed to connect to MCP server ${serverConfig.name}:`, error)
      
      // Schedule retry with exponential backoff
      const retryDelay = this.connectionRetryDelays.get(serverConfig.id) || 1000
      this.connectionRetryDelays.set(serverConfig.id, Math.min(retryDelay * 2, 30000))
      
      setTimeout(() => {
        this.connectToServer(serverConfig)
      }, retryDelay)
      
      return false
    }
  }
  
  async disconnectServer(serverId: string) {
    try {
      await window.api.mcp.disconnect(serverId)
      this.handleServerDisconnect(serverId)
    } catch (error) {
      console.error(`Failed to disconnect MCP server ${serverId}:`, error)
    }
  }
  
  private handleServerConnect(server: MCPServer) {
    this.servers.set(server.id, server)
    this.connectionRetryDelays.delete(server.id)
    this.startHeartbeat(server.id)
    
    // Load server resources and prompts
    this.loadServerResources(server.id)
    this.loadServerPrompts(server.id)
  }
  
  private handleServerDisconnect(serverId: string) {
    this.servers.delete(serverId)
    this.stopHeartbeat(serverId)
    this.emit('server-disconnected', serverId)
  }
  
  private startHeartbeat(serverId: string) {
    const interval = setInterval(async () => {
      try {
        // Simplified heartbeat - advanced ping not implemented yet
        console.log(`Heartbeat check for server ${serverId}`)
        
        /*
        // Advanced heartbeat to be implemented:
        const isAlive = await window.api.mcp.pingServer(serverId)
        if (!isAlive) {
          this.handleServerDisconnect(serverId)
        }
        */
      } catch (error) {
        console.warn(`Heartbeat failed for server ${serverId}:`, error)
        // Don't disconnect on heartbeat failure for now
      }
    }, 30000) // 30 seconds
    
    this.heartbeatIntervals.set(serverId, interval)
  }
  
  private stopHeartbeat(serverId: string) {
    const interval = this.heartbeatIntervals.get(serverId)
    if (interval) {
      clearInterval(interval)
      this.heartbeatIntervals.delete(serverId)
    }
  }
  
  private async loadServerResources(serverId: string) {
    try {
      // Advanced resource loading not implemented yet
      console.log(`Loading resources for server ${serverId}`)
      
      /*
      // Advanced resource loading to be implemented:
      const resources = await window.api.mcp.listResources(serverId)
      
      for (const resource of resources) {
        this.resources.set(resource.uri, resource)
        this.emit('resource-updated', resource)
      }
      */
    } catch (error) {
      console.warn(`Failed to load resources for server ${serverId}:`, error)
    }
  }
  
  private async loadServerPrompts(serverId: string) {
    try {
      // Advanced prompt loading not implemented yet
      console.log(`Loading prompts for server ${serverId}`)
      
      /*
      // Advanced prompt loading to be implemented:
      const prompts = await window.api.mcp.listPrompts(serverId)
      
      for (const prompt of prompts) {
        this.prompts.set(prompt.name, prompt)
        this.emit('prompt-received', prompt)
      }
      */
    } catch (error) {
      console.warn(`Failed to load prompts for server ${serverId}:`, error)
    }
  }
  
  async callTool(
    toolName: string, 
    args: Record<string, any>,
    options?: {
      timeout?: number
      retries?: number
      serverId?: string
    }
  ): Promise<MCPToolCall> {
    const callId = this.generateCallId()
    const call: MCPToolCall = {
      id: callId,
      name: toolName,
      arguments: args,
      timestamp: new Date(),
      status: 'pending'
    }
    
    this.activeCalls.set(callId, call)
    this.emit('tool-call-start', call)
    
    try {
      call.status = 'running'
      const startTime = Date.now()
      
      const result = await window.api.mcp.callTool(
        toolName,
        args,
        {
          timeout: options?.timeout || 30000,
          serverId: options?.serverId
        }
      )
      
      call.status = 'completed'
      call.result = result
      call.duration = Date.now() - startTime
      
      this.handleToolComplete(call)
      
      return call
    } catch (error) {
      call.status = 'failed'
      call.error = error instanceof Error ? error.message : String(error)
      call.duration = Date.now() - call.timestamp.getTime()
      
      this.handleToolError(callId, error as Error)
      
      // Retry logic
      if (options?.retries && options.retries > 0) {
        console.log(`Retrying tool call ${toolName}, ${options.retries} attempts remaining`)
        
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        return this.callTool(toolName, args, {
          ...options,
          retries: options.retries - 1
        })
      }
      
      throw error
    }
  }
  
  private handleToolResult(callId: string, result: any) {
    const call = this.activeCalls.get(callId)
    if (!call) return
    
    call.status = 'completed'
    call.result = result
    call.duration = Date.now() - call.timestamp.getTime()
    
    this.handleToolComplete(call)
  }
  
  private handleToolError(callId: string, error: Error) {
    const call = this.activeCalls.get(callId)
    if (!call) return
    
    call.status = 'failed'
    call.error = error.message
    call.duration = Date.now() - call.timestamp.getTime()
    
    this.activeCalls.delete(callId)
    this.addToHistory(call)
    this.emit('tool-call-error', call, error)
  }
  
  private handleToolComplete(call: MCPToolCall) {
    this.activeCalls.delete(call.id)
    this.addToHistory(call)
    this.emit('tool-call-complete', call)
  }
  
  private addToHistory(call: MCPToolCall) {
    this.callHistory.unshift(call)
    
    // Limit history size
    if (this.callHistory.length > this.maxHistorySize) {
      this.callHistory = this.callHistory.slice(0, this.maxHistorySize)
    }
  }
  
  async getResource(uri: string): Promise<MCPResource | null> {
    try {
      // Advanced resource fetching not implemented yet
      console.log(`Getting resource: ${uri}`)
      return null
      
      /*
      // Advanced resource fetching to be implemented:
      const resource = await window.api.mcp.getResource(uri)
      
      if (resource) {
        this.resources.set(uri, resource)
      }
      
      return resource
      */
    } catch (error) {
      console.error(`Failed to get resource ${uri}:`, error)
      return null
    }
  }
  
  async executePrompt(
    promptName: string,
    args?: Record<string, any>
  ): Promise<string> {
    try {
      // Advanced prompt execution not implemented yet
      console.log(`Executing prompt: ${promptName}`)
      return `Prompt ${promptName} executed (simulated)`
      
      /*
      // Advanced prompt execution to be implemented:
      return await window.api.mcp.executePrompt(promptName, args)
      */
    } catch (error) {
      console.error(`Failed to execute prompt ${promptName}:`, error)
      throw error
    }
  }
  
  // Public API
  getServers(): MCPServer[] {
    return Array.from(this.servers.values())
  }
  
  getServer(serverId: string): MCPServer | null {
    return this.servers.get(serverId) || null
  }
  
  getAvailableTools(): MCPTool[] {
    const tools: MCPTool[] = []
    
    for (const server of this.servers.values()) {
      if (server.status === 'connected') {
        tools.push(...server.tools)
      }
    }
    
    return tools
  }
  
  getTool(toolName: string): MCPTool | null {
    for (const server of this.servers.values()) {
      const tool = server.tools.find(t => t.name === toolName)
      if (tool) return tool
    }
    
    return null
  }
  
  getActiveCalls(): MCPToolCall[] {
    return Array.from(this.activeCalls.values())
  }
  
  getCallHistory(limit?: number): MCPToolCall[] {
    return limit ? this.callHistory.slice(0, limit) : [...this.callHistory]
  }
  
  getResources(): MCPResource[] {
    return Array.from(this.resources.values())
  }
  
  getPrompts(): MCPPrompt[] {
    return Array.from(this.prompts.values())
  }
  
  abortCall(callId: string): boolean {
    const call = this.activeCalls.get(callId)
    if (!call) return false
    
    try {
      // Advanced tool abort not implemented yet
      console.log(`Aborting tool call: ${callId}`)
      
      /*
      // Advanced tool abort to be implemented:
      window.api.mcp.abortToolCall(callId)
      */
      
      call.status = 'failed'
      call.error = 'Aborted by user'
      call.duration = Date.now() - call.timestamp.getTime()
      
      this.activeCalls.delete(callId)
      this.addToHistory(call)
      
      return true
    } catch (error) {
      console.error(`Failed to abort call ${callId}:`, error)
      return false
    }
  }
  
  isConnected(): boolean {
    return Array.from(this.servers.values()).some(server => server.status === 'connected')
  }
  
  getConnectionStatus(): Record<string, 'connected' | 'disconnected' | 'error'> {
    const status: Record<string, 'connected' | 'disconnected' | 'error'> = {}
    
    for (const [id, server] of this.servers) {
      status[id] = server.status
    }
    
    return status
  }
  
  // Tool filtering and search
  searchTools(query: string): MCPTool[] {
    const searchTerm = query.toLowerCase()
    const tools = this.getAvailableTools()
    
    return tools.filter(tool => 
      tool.name.toLowerCase().includes(searchTerm) ||
      tool.description.toLowerCase().includes(searchTerm) ||
      tool.category?.toLowerCase().includes(searchTerm) ||
      tool.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
    )
  }
  
  getToolsByCategory(category: string): MCPTool[] {
    return this.getAvailableTools().filter(tool => tool.category === category)
  }
  
  getToolCategories(): string[] {
    const categories = new Set<string>()
    
    for (const tool of this.getAvailableTools()) {
      if (tool.category) {
        categories.add(tool.category)
      }
    }
    
    return Array.from(categories).sort()
  }
  
  // Statistics
  getCallStats() {
    const stats = {
      totalCalls: this.callHistory.length,
      successfulCalls: 0,
      failedCalls: 0,
      averageCallTime: 0,
      mostUsedTools: new Map<string, number>(),
      callsByHour: new Map<number, number>()
    }
    
    let totalDuration = 0
    
    for (const call of this.callHistory) {
      if (call.status === 'completed') {
        stats.successfulCalls++
      } else if (call.status === 'failed') {
        stats.failedCalls++
      }
      
      if (call.duration) {
        totalDuration += call.duration
      }
      
      // Count tool usage
      const count = stats.mostUsedTools.get(call.name) || 0
      stats.mostUsedTools.set(call.name, count + 1)
      
      // Count calls by hour
      const hour = call.timestamp.getHours()
      const hourCount = stats.callsByHour.get(hour) || 0
      stats.callsByHour.set(hour, hourCount + 1)
    }
    
    stats.averageCallTime = stats.totalCalls > 0 ? totalDuration / stats.totalCalls : 0
    
    return stats
  }
  
  private generateCallId(): string {
    return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  // Cleanup
  destroy() {
    // Disconnect all servers
    for (const serverId of this.servers.keys()) {
      this.disconnectServer(serverId)
    }
    
    // Clear all data
    this.servers.clear()
    this.activeCalls.clear()
    this.resources.clear()
    this.prompts.clear()
    this.callHistory.length = 0
    
    // Clear timers
    for (const interval of this.heartbeatIntervals.values()) {
      clearInterval(interval)
    }
    this.heartbeatIntervals.clear()
    
    this.clear()
  }
}

// Global MCP service instance
export const mcpService = new MCPService()

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    mcpService.destroy()
  })
}