import { getAllServers } from './servers'
import { validateServerConfig } from './serverConfig'

// 测试服务器配置
console.log('=== MCP Server Configuration Test ===\n')

const servers = getAllServers()

servers.forEach(server => {
  console.log(`Server: ${server.name}`)
  console.log(`Command: ${server.command} ${server.args.join(' ')}`)
  
  if (server.env) {
    console.log('Environment Variables:')
    Object.entries(server.env).forEach(([key, value]) => {
      // 隐藏敏感信息
      if (key.includes('API_KEY') || key.includes('TOKEN')) {
        console.log(`  ${key}: ${value ? '***' : '(not set)'}`)
      } else {
        console.log(`  ${key}: ${value}`)
      }
    })
  }
  
  const validation = validateServerConfig(server)
  if (!validation.valid) {
    console.log('Validation Errors:')
    validation.errors.forEach(error => {
      console.log(`  - ${error}`)
    })
  } else {
    console.log('✓ Configuration valid')
  }
  
  console.log('---\n')
})

console.log('=== Configuration Test Complete ===')