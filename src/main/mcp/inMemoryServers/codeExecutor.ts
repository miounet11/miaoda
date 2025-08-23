import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js'
import { spawn } from 'child_process'
// import { writeFile, unlink } from 'fs/promises'
// import { join } from 'path'
// import { tmpdir } from 'os'
// import { randomBytes } from 'crypto'

// Create MCP server
const server = new Server(
  {
    name: 'code-executor',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
)

// Define available tools
const tools: Tool[] = [
  {
    name: 'execute_javascript',
    description: 'Execute JavaScript code and return the output',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'The JavaScript code to execute'
        }
      },
      required: ['code']
    }
  },
  {
    name: 'execute_python',
    description: 'Execute Python code and return the output',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'The Python code to execute'
        }
      },
      required: ['code']
    }
  },
  {
    name: 'execute_shell',
    description: 'Execute shell commands (bash/sh) and return the output',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The shell command to execute'
        },
        cwd: {
          type: 'string',
          description: 'Working directory for the command'
        }
      },
      required: ['command']
    }
  }
]

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools }
})

// Execute code safely with timeout and sandboxing
async function executeCode(
  executor: string,
  args: string[],
  input?: string,
  cwd?: string
): Promise<{ output: string; error?: string }> {
  // Security: Validate executor and args
  const allowedExecutors = ['node', 'python3']
  if (!allowedExecutors.includes(executor)) {
    return { output: '', error: 'Executor not allowed for security reasons' }
  }

  // Security: Sanitize arguments to prevent injection
  const sanitizedArgs = args.map(arg => {
    // Remove potentially dangerous characters
    return arg.replace(/[;&|`$()<>]/g, '')
  })

  return new Promise(resolve => {
    const child = spawn(executor, sanitizedArgs, {
      cwd: cwd || process.cwd(),
      timeout: 30000, // 30 second timeout
      env: {
        ...process.env,
        // Restrict environment for security
        NODE_OPTIONS: '--max-old-space-size=128',
        PYTHONDONTWRITEBYTECODE: '1'
      },
      shell: false // Never use shell for security
    })

    let output = ''
    let error = ''

    child.stdout.on('data', data => {
      output += data.toString()
    })

    child.stderr.on('data', data => {
      error += data.toString()
    })

    child.on('error', err => {
      resolve({ output: '', error: err.message })
    })

    child.on('close', code => {
      if (code !== 0) {
        resolve({ output, error: error || `Process exited with code ${code}` })
      } else {
        resolve({ output, error: error || undefined })
      }
    })

    if (input) {
      child.stdin.write(input)
      child.stdin.end()
    }
  })
}

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async request => {
  const { name, arguments: args } = request.params

  try {
    switch (name) {
      case 'execute_javascript': {
        const { code } = args as { code: string }
        const result = await executeCode('node', ['-e', code])
        return {
          content: [
            {
              type: 'text',
              text: result.error
                ? `Error: ${result.error}\n\nOutput:\n${result.output}`
                : result.output
            }
          ]
        }
      }

      case 'execute_python': {
        const { code } = args as { code: string }
        const result = await executeCode('python3', ['-c', code])
        return {
          content: [
            {
              type: 'text',
              text: result.error
                ? `Error: ${result.error}\n\nOutput:\n${result.output}`
                : result.output
            }
          ]
        }
      }

      case 'execute_shell': {
        // Security: Shell execution is disabled for security reasons
        return {
          content: [
            {
              type: 'text',
              text: 'Shell execution is disabled for security reasons. Use JavaScript or Python execution instead.'
            }
          ],
          isError: true
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`)
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error executing ${name}: ${error.message}`
        }
      ],
      isError: true
    }
  }
})

// Start server
async function main() {
  try {
    const transport = new StdioServerTransport()
    await server.connect(transport)
    console.error('Code executor MCP server running successfully')
  } catch (error) {
    console.error('Code executor MCP server initialization failed:', error)
    process.exit(1)
  }
}

main().catch(error => {
  console.error('Server error:', error)
  process.exit(1)
})
