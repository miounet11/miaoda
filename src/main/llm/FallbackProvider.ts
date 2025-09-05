import { LLMProvider } from './provider'

/**
 * 内置回退Provider - 当没有配置外部API时使用
 * 提供基础的对话功能，不需要外部API
 */
export class FallbackProvider implements LLMProvider {
  name = 'fallback'
  displayName = '内置AI助手'
  isCustom = false

  async sendMessage(
    messages: Array<{ role: string; content: string }>,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    // 获取最后一条用户消息
    const lastMessage = messages[messages.length - 1]?.content || ''

    // 生成智能回复
    let response = ''

    // 根据消息内容生成不同的回复
    if (
      lastMessage.includes('你好') ||
      lastMessage.includes('hi') ||
      lastMessage.includes('hello')
    ) {
      response = '你好！我是MiaoDa AI助手，很高兴为您服务。请问有什么可以帮助您的吗？'
    } else if (lastMessage.includes('你是谁') || lastMessage.includes('who are you')) {
      response =
        '我是MiaoDa Chat的内置AI助手。虽然我目前没有连接到外部AI服务，但我仍然可以为您提供基础的对话功能。如果您想获得更智能的回复，建议您配置一个外部AI模型（如OpenAI、DeepSeek等）。'
    } else if (lastMessage.includes('帮助') || lastMessage.includes('help')) {
      response =
        '我可以帮助您：\n1. 进行基础对话\n2. 回答简单问题\n3. 提供使用指导\n\n如需更高级的功能，请点击顶部模型选择器，配置一个外部AI模型。'
    } else if (lastMessage.includes('天气')) {
      response =
        '抱歉，我目前无法获取实时天气信息。建议您：\n1. 查看手机天气应用\n2. 访问天气网站\n3. 或配置一个外部AI模型来获取更详细的信息'
    } else if (lastMessage.includes('时间') || lastMessage.includes('几点')) {
      const now = new Date()
      response = `现在是北京时间 ${now.toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })}`
    } else if (lastMessage.includes('配置') || lastMessage.includes('设置')) {
      response =
        '要配置外部AI模型：\n1. 点击顶部的模型选择器\n2. 选择您想使用的模型（如DeepSeek、通义千问等）\n3. 输入API密钥\n4. 点击测试连接\n5. 保存配置即可使用'
    } else if (lastMessage.length < 2) {
      response = '您的消息太短了，请提供更多信息，这样我才能更好地帮助您。'
    } else {
      // 默认回复模板
      const templates = [
        `关于"${lastMessage.substring(0, 20)}${lastMessage.length > 20 ? '...' : ''}"，这是一个很好的问题。`,
        `我理解您想了解关于"${lastMessage.substring(0, 20)}${lastMessage.length > 20 ? '...' : ''}"的信息。`,
        `您提到了"${lastMessage.substring(0, 20)}${lastMessage.length > 20 ? '...' : ''}"，让我为您提供一些建议。`
      ]

      const template = templates[Math.floor(Math.random() * templates.length)]
      response = `${template}\n\n由于我是内置的基础AI助手，功能有限。建议您配置一个外部AI模型（如OpenAI GPT、Claude、DeepSeek等）来获得更准确和详细的回答。\n\n点击顶部的模型选择器即可开始配置。`
    }

    // 模拟流式输出
    if (onChunk) {
      const chunks = response.split('')
      for (const chunk of chunks) {
        onChunk(chunk)
        // 模拟延迟，让输出看起来更自然
        await new Promise(resolve => setTimeout(resolve, 5))
      }
    }

    return response
  }

  async validateConnection(): Promise<{ success: boolean; error?: string }> {
    return { success: true }
  }
}
