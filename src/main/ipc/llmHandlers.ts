import { ipcMain } from 'electron'
import Store from 'electron-store'
import { MCPManager } from '../mcp/mcpManager'
import { llmManager } from '../llm/SimpleLLMService'
import {
  createLLMManager,
  registerLLMHandlers as registerAdvancedLLMHandlers
} from '../llm/llmManager'
import { logger } from '../utils/Logger'

const store = new Store()

export function registerLLMHandlers(mcpManager: MCPManager) {
  logger.info('注册LLM IPC处理器', 'LLMHandlers')

  // 注册高级LLM管理器
  const advancedLLMManager = createLLMManager(mcpManager)
  registerAdvancedLLMHandlers(advancedLLMManager)

  // 注册简单LLM服务处理器
  registerSimpleLLMHandlers()

  // 注册增强模型配置处理器
  registerEnhancedModelConfigHandlers()

  // LLM 摘要生成处理器 - 简化版本
  ipcMain.handle('llm:generate-summary', async (_, prompt: string) => {
    // 简化为基本功能
    return `总结: ${prompt.substring(0, 50)}...`
  })

  logger.info('LLM IPC处理器注册完成', 'LLMHandlers')
}

// 注册简单的LLM处理器
function registerSimpleLLMHandlers() {
  // 发送消息处理器
  ipcMain.handle(
    'llm:send-message',
    async (_, messages: Array<{ role: string; content: string }>) => {
      // 在try块外面声明变量，以便在catch块中使用
      let llmConfig: any = {
        provider: 'default',
        model: 'gpt-3.5-turbo'
      }

      try {
        logger.info('处理LLM消息请求', 'SimpleLLM', { messageCount: messages.length })

        // 加载用户配置
        const settings = loadLLMSettings()

        // 确定要使用的provider - 默认使用fallback
        const selectedProvider = settings.selectedModel || 'fallback'

        // 获取API配置
        const apiConfig = settings.apiConfig?.[selectedProvider] || {}

        // 设置LLM配置 - 如果没有配置，使用默认的OpenAI配置
        llmConfig = {
          provider: selectedProvider,
          apiKey: apiConfig.apiKey || 'sk-test',
          baseURL: apiConfig.baseUrl,
          model: apiConfig.model || 'gpt-3.5-turbo'
        }

        logger.info('设置LLM配置', 'SimpleLLM', {
          provider: llmConfig.provider,
          model: llmConfig.model
        })

        llmManager.setConfig(llmConfig)

        // 发送消息 - 获取最后一条用户消息
        const lastUserMessage = messages[messages.length - 1].content

        // 调用llmManager发送消息
        const response = await llmManager.sendMessage([{ role: 'user', content: lastUserMessage }])

        logger.info('LLM消息处理完成', 'SimpleLLM', { responseLength: response.length })
        return response
      } catch (error: any) {
        logger.error('LLM消息处理失败', 'SimpleLLM', {
          error: error.message,
          stack: error.stack,
          provider: llmConfig.provider,
          model: llmConfig.model
        })

        // 返回详细的错误信息，让前端能够显示具体的错误
        const errorInfo = {
          type: 'LLM_ERROR',
          message: error.message || '未知错误',
          details: {
            provider: llmConfig.provider,
            model: llmConfig.model,
            timestamp: new Date().toISOString(),
            stack: error.stack
          },
          suggestion: '请检查API配置或网络连接'
        }

        throw errorInfo
      }
    }
  )

  // 获取支持的提供商
  ipcMain.handle('llm:get-providers', async () => {
    try {
      return llmManager.getSupportedProviders()
    } catch (error: any) {
      logger.error('获取LLM提供商失败', 'SimpleLLM', error)
      return []
    }
  })

  // 保存LLM设置
  ipcMain.handle('llm:save-settings', async (_, settings: any) => {
    try {
      saveLLMSettings(settings)
      logger.info('LLM设置保存成功', 'SimpleLLM')
      return true
    } catch (error: any) {
      logger.error('LLM设置保存失败', 'SimpleLLM', error)
      throw new Error(`设置保存失败: ${error.message}`)
    }
  })

  // 加载LLM设置
  ipcMain.handle('llm:load-settings', async () => {
    try {
      const settings = loadLLMSettings()
      logger.info('LLM设置加载成功', 'SimpleLLM')
      return settings
    } catch (error: any) {
      logger.error('LLM设置加载失败', 'SimpleLLM', error)
      return { selectedModel: 'default' }
    }
  })
}

// 增强模型配置处理器 - 桥接EnhancedModelConfigService和后端LLM系统
function registerEnhancedModelConfigHandlers() {
  // 获取所有可用的提供商（包含国内大模型）
  ipcMain.handle('enhanced-model:get-all-providers', async () => {
    try {
      // 从ProviderFactory获取所有内置提供商
      const { ProviderFactory } = await import('../llm/ProviderFactory')
      return ProviderFactory.getBuiltInProviders()
    } catch (error: any) {
      logger.error('获取提供商列表失败', 'EnhancedModel', error)
      return []
    }
  })

  // 测试提供商连接
  ipcMain.handle('enhanced-model:test-connection', async (_, providerConfig: any) => {
    try {
      const { ProviderFactory } = await import('../llm/ProviderFactory')

      // 转换EnhancedModelConfigService格式到LLMConfig格式
      const llmConfig = {
        provider: providerConfig.providerId,
        apiKey: providerConfig.apiKey,
        baseURL: providerConfig.baseUrl,
        model: providerConfig.model,
        secretKey: providerConfig.secretKey, // 百度文心需要
        headers: providerConfig.headers,
        parameters: providerConfig.parameters
      }

      // 创建提供商实例来测试连接
      const provider = ProviderFactory.createProvider(llmConfig)

      // 如果提供商有验证连接方法，使用它
      if (provider.validateConnection) {
        const result = await provider.validateConnection()
        return {
          success: result.success,
          message: result.success ? '连接成功' : result.error || '连接失败',
          error: result.error
        }
      }

      // 否则尝试发送一个简单的测试消息
      try {
        await provider.sendMessage([{ role: 'user', content: 'test' }], () => {})
        return { success: true, message: '连接成功' }
      } catch (error: any) {
        return { success: false, message: error.message || '连接测试失败' }
      }
    } catch (error: any) {
      logger.error('测试提供商连接失败', 'EnhancedModel', error)
      return { success: false, message: error.message || '连接测试失败' }
    }
  })

  // 使用增强模型配置发送消息
  ipcMain.handle(
    'enhanced-model:send-message',
    async (_, messages: Array<{ role: string; content: string }>, modelConfig: any) => {
      try {
        logger.info('处理增强模型消息请求', 'EnhancedModel', {
          messageCount: messages.length,
          provider: modelConfig.providerId,
          model: modelConfig.model
        })

        const { ProviderFactory } = await import('../llm/ProviderFactory')

        // 转换配置格式
        const llmConfig = {
          provider: modelConfig.providerId,
          apiKey: modelConfig.apiKey,
          baseURL: modelConfig.baseUrl,
          model: modelConfig.model,
          secretKey: modelConfig.secretKey, // 百度文心需要
          headers: modelConfig.headers,
          parameters: modelConfig.parameters
        }

        // 创建提供商实例
        const provider = ProviderFactory.createProvider(llmConfig)

        let fullResponse = ''

        // 发送完整消息历史并收集响应
        const response = await provider.sendMessage(messages, (chunk: string) => {
          fullResponse += chunk
        })

        // 如果没有通过回调收集到响应，使用返回值
        if (!fullResponse && response) {
          fullResponse = response
        }

        logger.info('增强模型消息处理完成', 'EnhancedModel', {
          responseLength: fullResponse.length,
          provider: modelConfig.providerId
        })

        return fullResponse || '抱歉，没有收到回复。'
      } catch (error: any) {
        logger.error('增强模型消息处理失败', 'EnhancedModel', error)
        throw new Error(`AI回复失败: ${error.message}`)
      }
    }
  )

  // 保存增强模型配置
  ipcMain.handle('enhanced-model:save-config', async (_, config: any) => {
    try {
      // 将配置保存到electron-store
      store.set('enhanced_model_config', config)
      logger.info('增强模型配置保存成功', 'EnhancedModel')
      return { success: true }
    } catch (error: any) {
      logger.error('增强模型配置保存失败', 'EnhancedModel', error)
      return { success: false, error: error.message }
    }
  })

  // 加载增强模型配置
  ipcMain.handle('enhanced-model:load-config', async () => {
    try {
      const config = store.get('enhanced_model_config', {})
      logger.info('增强模型配置加载成功', 'EnhancedModel')
      return config
    } catch (error: any) {
      logger.error('增强模型配置加载失败', 'EnhancedModel', error)
      return {}
    }
  })

  // 获取当前激活的模型配置
  ipcMain.handle('enhanced-model:get-active-config', async () => {
    try {
      const config = store.get('enhanced_model_active_config', null)
      return config
    } catch (error: any) {
      logger.error('获取激活模型配置失败', 'EnhancedModel', error)
      return null
    }
  })

  // 设置当前激活的模型配置
  ipcMain.handle('enhanced-model:set-active-config', async (_, activeConfig: any) => {
    try {
      store.set('enhanced_model_active_config', activeConfig)
      logger.info('激活模型配置设置成功', 'EnhancedModel', {
        provider: activeConfig.providerId,
        model: activeConfig.model
      })
      return { success: true }
    } catch (error: any) {
      logger.error('激活模型配置设置失败', 'EnhancedModel', error)
      return { success: false, error: error.message }
    }
  })
}

// 加载LLM设置
function loadLLMSettings(): any {
  try {
    const settings = store.get('miaodaLLMSettings', { selectedModel: 'default' })
    return settings
  } catch (error) {
    logger.error('加载LLM设置失败', 'SimpleLLM', error)
    return { selectedModel: 'default' }
  }
}

// 保存LLM设置
function saveLLMSettings(settings: any): void {
  try {
    store.set('miaodaLLMSettings', settings)
  } catch (error) {
    logger.error('保存LLM设置失败', 'SimpleLLM', error)
    throw error
  }
}
