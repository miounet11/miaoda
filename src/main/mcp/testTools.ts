// Test tools for verifying MCP integration
export const testTools = [
  {
    name: 'get_current_time',
    description: 'Get the current date and time',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'calculate',
    description: 'Perform basic math calculations',
    inputSchema: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'Math expression to evaluate (e.g., "2 + 2")'
        }
      },
      required: ['expression']
    }
  },
  {
    name: 'echo',
    description: 'Echo back the provided message',
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Message to echo back'
        }
      },
      required: ['message']
    }
  }
]

export async function executeTestTool(toolName: string, args: any): Promise<any> {
  switch (toolName) {
    case 'get_current_time':
      return {
        time: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    
    case 'calculate':
      try {
        // Simple safe eval for basic math
        const result = Function('"use strict"; return (' + args.expression + ')')()
        return { result }
      } catch (error: any) {
        return { error: `Invalid expression: ${error.message}` }
      }
    
    case 'echo':
      return { message: args.message }
    
    default:
      throw new Error(`Unknown tool: ${toolName}`)
  }
}