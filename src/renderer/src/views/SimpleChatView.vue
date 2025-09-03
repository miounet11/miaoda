<template>
  <div class="chat-view">
    <!-- NewAPI 风格的三栏布局 -->
    <div class="main-layout">
      <!-- 左侧侧边栏 - 模型配置面板 -->
      <aside class="model-config-sidebar">
        <ModelConfigPanel
          v-model:config="modelConfig"
          @export-config="handleExportConfig"
          @import-config="handleImportConfig"
        />
      </aside>

      <!-- 中间主内容区 - 聊天界面 -->
      <main class="chat-main-content">
        <!-- 顶部导航栏 -->
        <div class="top-nav">
          <div class="nav-content">
            <div class="brand-section">
              <h1 class="brand">MiaoDa Chat</h1>
              <div class="model-info">
                <span class="model-indicator">
                  <span class="model-dot" :class="getModelStatusClass(currentModel)"></span>
                  {{ getModelDisplayName(currentModel) }}
                </span>
                <!-- API状态指示器 -->
                <div class="api-status" v-if="showApiStatus">
                  <span
                    class="api-status-dot"
                    :class="apiStatusClass"
                    title="API连接状态"
                  ></span>
                  <span class="api-status-text">{{ apiStatusText }}</span>
                </div>
              </div>
            </div>
            <div class="nav-actions">
              <button @click="toggleDebugPanel" class="nav-btn" title="调试面板">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 12l2 2 4-4"></path>
                  <path d="M21 12c-1 0-3-1-3-3s2-3 3-3"></path>
                  <path d="M3 12c1 0 3-1 3-3s-2-3-3-3"></path>
                  <path d="M12 3v18"></path>
                </svg>
              </button>
              <SmartModelSelector
                :current-provider-id="currentProviderId"
                :current-model-id="currentModelId"
                :available-providers="availableProviders"
                @select-model="handleModelSelect"
              />
              <button @click="showSettings" class="nav-btn" title="设置">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 聊天区域 -->
        <div class="chat-container">
          <div class="messages-area" ref="messagesRef">
        <!-- 欢迎消息 -->
        <div v-if="messages.length === 0" class="welcome-message">
          <div class="welcome-content">
            <h2>欢迎使用 MiaoDa Chat</h2>
            <p>我是您的AI助手，可以帮您解答问题、提供建议</p>
            <div class="quick-questions">
              <button @click="sendQuickQuestion('今天天气怎么样？')" class="quick-btn">
                今天天气怎么样？
              </button>
              <button @click="sendQuickQuestion('帮我写一份工作总结')" class="quick-btn">
                帮我写一份工作总结
              </button>
              <button @click="sendQuickQuestion('推荐一部好看的电影')" class="quick-btn">
                推荐一部好看的电影
              </button>
            </div>
          </div>
        </div>

        <!-- 消息列表 -->
        <div v-for="message in messages" :key="message.id" class="message-item"
             :class="{ 'user-message': message.role === 'user', 'ai-message': message.role === 'assistant', 'error-message-item': message.isError }">
          <div class="message-content">
            <!-- 错误消息特殊显示 -->
            <div v-if="message.isError" class="error-message">
              <div class="error-message-header">
                <span>⚠️</span>
                <span>AI 服务错误</span>
              </div>
              <div class="error-message-content" v-html="formatErrorMessage(message.content)"></div>
            </div>
            <!-- 普通消息 -->
            <div v-else class="message-text" v-html="formatMessage(message.content)"></div>

            <div class="message-meta">
              <span class="message-time">{{ formatTime(message.timestamp) }}</span>
              <span v-if="message.responseTime && message.role === 'assistant'" class="response-time">
                {{ message.responseTime }}
              </span>
              <span v-if="message.isError" class="error-badge">错误</span>
            </div>
          </div>
        </div>

        <!-- AI正在输入 -->
        <div v-if="isTyping" class="message-item ai-message">
          <div class="message-content">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div class="response-time">正在思考中...</div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-area">
        <div class="input-container">
          <textarea
            v-model="inputText"
            @keydown.enter.exact.prevent="sendMessage"
            @keydown.enter.shift.exact="addNewLine"
            placeholder="输入您的问题..."
            class="message-input"
            rows="1"
            ref="inputRef"
          ></textarea>
          <button
            @click="sendMessage"
            :disabled="!inputText.trim() || isTyping"
            class="send-btn"
            :class="{ disabled: !inputText.trim() || isTyping }"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22,2 15,22 11,13 2,9"></polygon>
            </svg>
          </button>
        </div>
        <div class="input-footer">
          <span class="footer-text">支持 Shift+Enter 换行</span>
        </div>
      </div>
    </div>

    <!-- 模型切换模态框 -->
    <div v-if="showModelSwitchModal" class="modal-overlay" @click="showModelSwitchModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>选择AI模型</h3>
          <button @click="showModelSwitchModal = false" class="modal-close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="model-list">
            <div
              v-for="model in availableModels"
              :key="model.value"
              @click="switchModel(model.value)"
              class="model-option"
              :class="{ active: model.value === currentModel }"
            >
              <div class="model-info">
                <div class="model-name">{{ model.label }}</div>
                <div class="model-description">{{ model.description }}</div>
              </div>
              <div class="model-status">
                <span :class="getModelStatusClass(model.value)" class="status-dot"></span>
                <span class="status-text">{{ model.value === 'default' ? '免费' : (model.configured ? '已配置' : '未配置') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧调试面板 -->
    <aside v-if="showDebugPanel" class="debug-sidebar" :class="{ hidden: !showDebugPanel }">
      <DebugPanel
        :request-preview="requestPreview"
        :actual-request="actualRequest"
        :response="response"
        @close="showDebugPanel = false"
      />
    </aside>
  </main>
</div>

    <!-- 模型切换模态框 -->
    <div v-if="showModelSwitchModal" class="modal-overlay" @click="showModelSwitchModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>选择AI模型</h3>
          <button @click="showModelSwitchModal = false" class="modal-close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="model-list">
            <div
              v-for="model in availableModels"
              :key="model.value"
              @click="switchModel(model.value)"
              class="model-option"
              :class="{ active: model.value === currentModel }"
            >
              <div class="model-info">
                <div class="model-name">{{ model.label }}</div>
                <div class="model-description">{{ model.description }}</div>
              </div>
              <div class="model-status">
                <span :class="getModelStatusClass(model.value)" class="status-dot"></span>
                <span class="status-text">{{ model.value === 'default' ? '免费' : (model.configured ? '已配置' : '未配置') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 全局状态反馈 -->
    <GlobalStatusFeedback />
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import SmartModelSelector from '@/components/chat/SmartModelSelector.vue'
import GlobalStatusFeedback from '@/components/ui/GlobalStatusFeedback.vue'
import ModelConfigPanel from '@/components/chat/ModelConfigPanel.vue'
import DebugPanel from '@/components/chat/DebugPanel.vue'
import { statusFeedback } from '@/services/StatusFeedbackService'
import { useEnhancedModelConfig } from '@/services/model/EnhancedModelConfigService'

// 消息接口
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  responseTime?: string
}

// 响应式数据
const messages = ref<Message[]>([])
const inputText = ref('')
const isTyping = ref(false)
const inputRef = ref<HTMLTextAreaElement>()
const messagesRef = ref<HTMLDivElement>()
const router = useRouter()
const responseStartTime = ref<number>(0)
const lastResponseTime = ref<string>('')
const currentModel = ref('default')
const showModelSwitchModal = ref(false)
const showDebugPanel = ref(false)

// 模型配置数据
const modelConfig = ref({
  customRequestMode: false,
  group: 'default',
  model: 'claude-opus-4-1-20250805-thinking',
  temperature: 0.7,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  maxTokens: 4096,
  seed: '',
  stream: true,
  imageUrls: [] as string[]
})

// 调试面板数据
const requestPreview = ref('')
const actualRequest = ref('')
const response = ref('')

// API状态相关
const showApiStatus = ref(true)
const apiStatus = ref<'checking' | 'connected' | 'disconnected' | 'error'>('checking')

// SmartModelSelector 所需的数据
const currentProviderId = ref('builtin')
const currentModelId = ref('miaoda-chat')
const currentActiveConfig = ref<any>(null)

// Provider 接口定义
interface Provider {
  id: string
  displayName: string
  icon: string
  isHealthy: boolean
  isCustom: boolean
  models: Model[]
}

interface Model {
  id: string
  displayName: string
  description?: string
  contextLength: number
  capabilities: {
    chat: boolean
    functions: boolean
    vision: boolean
    streaming: boolean
  }
  performance?: {
    avgResponseTime: number
    quality: number
  }
  status: 'available' | 'limited' | 'unavailable'
}

// API状态计算属性
const apiStatusClass = computed(() => {
  switch (apiStatus.value) {
    case 'connected': return 'api-status-connected'
    case 'disconnected': return 'api-status-disconnected'
    case 'error': return 'api-status-error'
    default: return 'api-status-checking'
  }
})

const apiStatusText = computed(() => {
  switch (apiStatus.value) {
    case 'connected': return '已连接'
    case 'disconnected': return '未配置'
    case 'error': return '连接错误'
    default: return '检查中'
  }
})

// 转换现有模型数据为新格式
const availableProviders = computed<Provider[]>(() => [
  {
    id: 'builtin',
    displayName: 'MiaoDa AI',
    icon: '🤖',
    isHealthy: true,
    isCustom: false,
    models: [{
      id: 'miaoda-chat',
      displayName: 'MiaoDa AI',
      description: '内置免费AI，快速响应',
      contextLength: 2048,
      capabilities: { chat: true, functions: false, vision: false, streaming: false },
      performance: { avgResponseTime: 100, quality: 5.0 },
      status: 'available'
    }]
  },
  {
    id: 'openai',
    displayName: 'OpenAI',
    icon: '🔵',
    isHealthy: apiStatus.value === 'connected',
    isCustom: false,
    models: [
      {
        id: 'gpt-4-turbo',
        displayName: 'GPT-4 Turbo',
        description: '最强大的通用模型',
        contextLength: 128000,
        capabilities: { chat: true, functions: true, vision: true, streaming: true },
        performance: { avgResponseTime: 3000, quality: 9.5 },
        status: apiStatus.value === 'connected' ? 'available' : 'unavailable'
      },
      {
        id: 'gpt-3.5-turbo',
        displayName: 'GPT-3.5 Turbo',
        description: '快速且经济的模型',
        contextLength: 16385,
        capabilities: { chat: true, functions: true, vision: false, streaming: true },
        performance: { avgResponseTime: 1000, quality: 7.5 },
        status: apiStatus.value === 'connected' ? 'available' : 'unavailable'
      }
    ]
  }
])

// 可用模型列表
const availableModels = ref([
  {
    value: 'default',
    label: 'MiaoDa AI',
    description: '内置免费AI，快速响应',
    configured: true
  },
  {
    value: 'openai',
    label: 'OpenAI GPT',
    description: 'GPT-4, GPT-3.5-turbo等',
    configured: false
  },
  {
    value: 'claude',
    label: 'Claude',
    description: 'Anthropic的AI模型',
    configured: false
  },
  {
    value: 'gemini',
    label: 'Gemini',
    description: 'Google的AI模型',
    configured: false
  },
  {
    value: 'ollama',
    label: 'Ollama',
    description: '本地运行的开源模型',
    configured: false
  }
])

// 发送消息
const sendMessage = async () => {
  if (!inputText.value.trim() || isTyping.value) return

  const userMessage: Message = {
    id: Date.now().toString(),
    role: 'user',
    content: inputText.value.trim(),
    timestamp: new Date()
  }

  messages.value.push(userMessage)
  const currentInput = inputText.value.trim()
  inputText.value = ''

  // 自动调整输入框高度
  adjustTextareaHeight()

  // 滚动到底部
  await nextTick()
  scrollToBottom()

  // 记录响应开始时间
  responseStartTime.value = Date.now()

  // 调用AI回复
  await simulateAIResponse(currentInput)
}

// 发送快捷问题
const sendQuickQuestion = async (question: string) => {
  inputText.value = question
  await sendMessage()
}

// 添加新行
const addNewLine = () => {
  inputText.value += '\n'
  adjustTextareaHeight()
}

// 调整输入框高度
const adjustTextareaHeight = () => {
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
    inputRef.value.style.height = Math.min(inputRef.value.scrollHeight, 120) + 'px'
  }
}

// 滚动到底部
const scrollToBottom = () => {
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

// 调用AI回复
const simulateAIResponse = async (userInput: string) => {
  isTyping.value = true

  try {
    // 构建消息历史
    const messageHistory = messages.value.map(msg => ({
      role: msg.role,
      content: msg.content
    }))

    // 调用LLM服务
    const aiResponse = await callLLMService(messageHistory)

    // 计算响应时间
    const responseTime = Date.now() - responseStartTime.value
    lastResponseTime.value = responseTime < 1000 ? `${responseTime}ms` : `${(responseTime / 1000).toFixed(1)}s`

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
      responseTime: lastResponseTime.value
    }

    messages.value.push(aiMessage)
  } catch (error) {
    console.error('AI回复错误:', error)

    const errorMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '抱歉，发生了网络错误，请稍后重试。',
      timestamp: new Date()
    }

    messages.value.push(errorMessage)
  } finally {
    isTyping.value = false
    await nextTick()
    scrollToBottom()
  }
}

// 调用LLM服务
const callLLMService = async (messageHistory: Array<{role: string, content: string}>): Promise<string> => {
  try {
    console.log('🚀 调用LLM服务 - 当前配置:', {
      providerId: currentProviderId.value,
      modelId: currentModelId.value,
      hasActiveConfig: !!currentActiveConfig.value
    })

    const electronAPI = (window as any).electronAPI || (window as any).api

    // 检查 API 是否可用
    if (!electronAPI?.llm?.sendMessage) {
      console.warn('⚠️ LLM API 不可用，使用默认回复')
      apiStatus.value = 'disconnected'
      statusFeedback.warning('LLM服务未配置', '当前使用内置默认回复，请在设置中配置API密钥')
      return generateFallbackResponse(messageHistory[messageHistory.length - 1].content)
    }

    // 显示加载状态
    const loadingId = statusFeedback.loading('正在思考中...')

    try {
      console.log('📡 发送消息到LLM服务...')
      const response = await electronAPI.llm.sendMessage(messageHistory)

      // 移除加载状态
      statusFeedback.removeMessage(loadingId)

      console.log('✅ LLM服务响应:', {
        success: true,
        responseLength: response?.length || 0,
        preview: response?.substring(0, 100)
      })

      if (response && typeof response === 'string' && response.trim()) {
        apiStatus.value = 'connected'
        statusFeedback.success('回复生成成功', '已收到AI的智能回复')
        return response
      } else {
        apiStatus.value = 'error'
        console.warn('⚠️ LLM响应为空，使用默认回复')
        statusFeedback.warning('LLM响应为空', '使用内置默认回复')
        return generateFallbackResponse(messageHistory[messageHistory.length - 1].content)
      }
    } catch (apiError: any) {
      // 移除加载状态
      statusFeedback.removeMessage(loadingId)

      apiStatus.value = 'error'
      console.error('❌ LLM API 调用失败:', apiError)

      // 检查是否是LLM错误对象
      if (apiError && typeof apiError === 'object' && apiError.type === 'LLM_ERROR') {
        const llmError = apiError as any
        statusFeedback.error(
          `LLM错误 (${llmError.details?.provider || 'Unknown'})`,
          `${llmError.message}\n\n建议: ${llmError.suggestion || '请检查配置'}`,
          8000
        )

        // 在控制台显示详细错误信息
        console.error('🔍 LLM 详细错误信息:', {
          提供商: llmError.details?.provider,
          模型: llmError.details?.model,
          时间: llmError.details?.timestamp,
          错误: llmError.message,
          堆栈: llmError.details?.stack
        })

        // 显示错误消息给用户
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `🤖 **AI 服务错误**\n\n❌ **错误类型**: ${llmError.details?.provider || '未知'} API 错误\n❌ **错误信息**: ${llmError.message}\n\n💡 **建议解决方案**:\n${llmError.suggestion || '请检查 API 配置和网络连接'}\n\n🔧 **技术详情**:\n- 提供商: ${llmError.details?.provider || 'N/A'}\n- 模型: ${llmError.details?.model || 'N/A'}\n- 时间: ${new Date(llmError.details?.timestamp).toLocaleString('zh-CN')}`,
          timestamp: new Date(),
          isError: true
        }

        messages.value.push(errorMessage)
        return '' // 返回空字符串，因为错误信息已经在消息中显示
      } else {
        // 普通错误
        statusFeedback.error('API调用失败', apiError.message || '网络或配置问题')
        // 返回默认回复
        return generateFallbackResponse(messageHistory[messageHistory.length - 1].content)
      }
    }
  } catch (error: any) {
    console.error('❌ LLM服务调用失败:', error)
    apiStatus.value = 'error'
    statusFeedback.error('LLM服务错误', error.message || '未知错误')

    // 返回默认回复
    return generateFallbackResponse(messageHistory[messageHistory.length - 1].content)
  }
}

// 生成默认回复（当LLM服务不可用时）
const generateFallbackResponse = (userInput: string): string => {
  const responses = [
    "我理解您的问题。让我来帮您解答...",
    "这是一个很有趣的问题！根据我的理解...",
    "谢谢您的提问。我来为您详细解释一下...",
    "您好！关于这个问题，我可以这样回答...",
    "我收到了您的问题。让我为您提供一些建议..."
  ]

  // 根据输入内容生成更相关的回复
  if (userInput.includes('天气')) {
    return "关于天气问题，我建议您查看本地天气预报应用。不过我可以帮您分析一些通用的天气知识..."
  } else if (userInput.includes('电影') || userInput.includes('推荐')) {
    return "关于电影推荐，我可以根据您的喜好来建议。不过首先我想了解一下您喜欢哪种类型的电影呢？"
  } else if (userInput.includes('工作') || userInput.includes('总结')) {
    return "工作总结是一个很好的习惯！我可以帮您梳理一下如何写好工作总结。首先，我们可以从以下几个方面来组织..."
  } else if (userInput.includes('API') || userInput.includes('配置') || userInput.includes('设置')) {
    return "关于API配置，我建议您在设置页面中配置相应的API密钥。不同的AI服务提供商（如OpenAI、Claude等）需要不同的配置方式。"
  } else if (userInput.includes('测试') || userInput.includes('检查')) {
    return "测试功能很重要的！您可以通过发送消息来测试AI的回复质量。如果使用的是真实API，您会看到智能的个性化回复；如果使用默认模式，您会看到预设的通用回复。"
  }

  return responses[Math.floor(Math.random() * responses.length)]
}

// 格式化时间
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 格式化消息内容（支持Markdown风格的格式化）
const formatMessage = (content: string): string => {
  if (!content) return ''

  // 简单的Markdown格式化
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
}

// 格式化错误消息
const formatErrorMessage = (content: string): string => {
  if (!content) return ''

  // 解析错误消息格式
  const lines = content.split('\n')
  let formatted = ''

  for (const line of lines) {
    if (line.startsWith('🤖 **')) {
      formatted += `<div class="error-title">${line.replace(/\*\*/g, '')}</div>`
    } else if (line.startsWith('❌ **')) {
      formatted += `<div class="error-detail">${line.replace(/\*\*/g, '')}</div>`
    } else if (line.startsWith('💡 **')) {
      formatted += `<div class="error-suggestion">${line.replace(/\*\*/g, '')}</div>`
    } else if (line.startsWith('🔧 **')) {
      formatted += `<div class="error-tech">${line.replace(/\*\*/g, '')}</div>`
    } else if (line.startsWith('- ')) {
      formatted += `<div class="error-item">${line}</div>`
    } else if (line.trim() === '') {
      formatted += '<br>'
    } else {
      formatted += `<div class="error-text">${line}</div>`
    }
  }

  return formatted
}

// 显示设置页面
const showSettings = () => {
  router.push('/settings')
}

// 显示模型切换器
const showModelSwitcher = () => {
  showModelSwitchModal.value = true
}

// 获取模型显示名称
const getModelDisplayName = (model: string): string => {
  const modelMap: Record<string, string> = {
    default: 'MiaoDa AI',
    openai: 'OpenAI GPT',
    claude: 'Claude',
    gemini: 'Gemini',
    ollama: 'Ollama'
  }
  return modelMap[model] || model
}

// 获取模型状态样式
const getModelStatusClass = (model: string): string => {
  // 这里可以根据实际配置状态返回不同的样式
  return model === 'default' ? 'model-online' : 'model-configured'
}

// 切换模型
const switchModel = (model: string) => {
  currentModel.value = model
  showModelSwitchModal.value = false
  // 这里可以添加保存当前模型的逻辑
}

// 处理 SmartModelSelector 的模型选择事件
const handleModelSelect = async (providerId: string, modelId: string) => {
  currentProviderId.value = providerId
  currentModelId.value = modelId

  // 更新旧的 currentModel 变量以保持兼容性
  if (providerId === 'builtin') {
    currentModel.value = 'default'
  } else {
    currentModel.value = providerId
  }

  try {
    // 从增强模型配置服务获取提供商配置
    const { getProviderConfig } = useEnhancedModelConfig()
    const providerConfig = getProviderConfig(providerId)
    
    // 构建激活配置
    const activeConfig = {
      providerId,
      modelId,
      providerConfig,
      timestamp: Date.now()
    }

    // 保存到后端作为当前激活配置
    const electronAPI = (window as any).electronAPI || (window as any).api
    if (electronAPI?.enhancedModel?.setActiveConfig) {
      await electronAPI.enhancedModel.setActiveConfig(activeConfig)
      currentActiveConfig.value = activeConfig
    }

    console.log('模型选择成功:', { providerId, modelId, activeConfig })

    // 显示成功反馈
    statusFeedback.success(
      '模型切换成功',
      `已切换到 ${availableProviders.value.find(p => p.id === providerId)?.displayName || providerId}`
    )
  } catch (error) {
    console.error('模型切换失败:', error)
    statusFeedback.error('模型切换失败', '请检查模型配置')
  }
}

// 初始化激活配置
const loadActiveConfig = async () => {
  try {
    const electronAPI = (window as any).electronAPI || (window as any).api
    if (electronAPI?.enhancedModel?.getActiveConfig) {
      const config = await electronAPI.enhancedModel.getActiveConfig()
      if (config) {
        currentActiveConfig.value = config
        currentProviderId.value = config.providerId || 'builtin'
        currentModelId.value = config.modelId || 'miaoda-chat'
        console.log('加载激活配置成功:', config)
      }
    }
  } catch (error) {
    console.error('加载激活配置失败:', error)
  }
}

// 切换调试面板
const toggleDebugPanel = () => {
  showDebugPanel.value = !showDebugPanel.value
}

// 处理配置导出
const handleExportConfig = () => {
  const configData = {
    ...modelConfig.value,
    timestamp: new Date().toISOString(),
    version: '1.0'
  }

  const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `model-config-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 处理配置导入
const handleImportConfig = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target?.result as string)
          if (config.version && config.timestamp) {
            // 合并配置，保留现有配置中未包含的字段
            modelConfig.value = { ...modelConfig.value, ...config }
            alert('配置导入成功')
          } else {
            alert('无效的配置文件')
          }
        } catch (error) {
          alert('配置文件解析失败')
        }
      }
      reader.readAsText(file)
    }
  }
  input.click()
}

// 更新请求预览
const updateRequestPreview = () => {
  const messages = [
    ...messages.value.map(msg => ({ role: msg.role, content: msg.content })),
    { role: 'user', content: inputText.value }
  ]

  const preview = {
    model: modelConfig.value.model,
    group: modelConfig.value.group,
    messages: messages,
    stream: modelConfig.value.stream,
    temperature: modelConfig.value.temperature,
    top_p: modelConfig.value.topP,
    frequency_penalty: modelConfig.value.frequencyPenalty,
    presence_penalty: modelConfig.value.presencePenalty
  }

  if (modelConfig.value.maxTokens !== 4096) {
    preview.max_tokens = modelConfig.value.maxTokens
  }

  if (modelConfig.value.seed) {
    preview.seed = modelConfig.value.seed
  }

  requestPreview.value = JSON.stringify(preview, null, 2)
}

// 监听输入变化更新预览
const updatePreviewOnInput = () => {
  if (showDebugPanel.value && inputText.value.trim()) {
    updateRequestPreview()
  }
}

// 生命周期
onMounted(async () => {
  adjustTextareaHeight()
  await loadActiveConfig()
})

onUnmounted(() => {
  // 清理任何可能存在的定时器或事件监听器
  // 这里主要确保组件卸载时的清理工作
})
</script>

<style scoped>
.chat-view {
  height: 100vh;
}

/* NewAPI 风格的三栏布局 */
.main-layout {
  display: flex;
  height: calc(100vh - 60px); /* 减去顶部导航栏高度 */
  margin-top: 60px;
}

/* 使用全局样式系统，组件样式已移至 unified-design-system.css */



/* 顶部导航 */
.top-nav {
  height: 60px;
  border-bottom: 1px solid #e5e7eb;
  background: white;
  position: sticky;
  top: 0;
  z-index: 10;
}

.nav-content {
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.brand-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brand {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.model-info {
  display: flex;
  align-items: center;
}

.model-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
}

.model-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.model-online {
  background: #10b981;
}

.model-configured {
  background: #f59e0b;
}

.model-offline {
  background: #ef4444;
}



.nav-actions {
  display: flex;
  gap: 8px;
}

.nav-btn {
  padding: 8px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

/* 聊天容器 */
.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* 消息区域 */
.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 欢迎消息 */
.welcome-message {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.welcome-content {
  text-align: center;
  max-width: 600px;
}

.welcome-content h2 {
  font-size: 28px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
}

.welcome-content p {
  font-size: 16px;
  color: #6b7280;
  margin-bottom: 24px;
}

.quick-questions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.quick-btn {
  padding: 12px 16px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  color: #374151;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.quick-btn:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

/* 消息项 */
.message-item {
  display: flex;
  margin-bottom: 16px;
}

.message-item.user-message {
  justify-content: flex-end;
}

.message-item.ai-message {
  justify-content: flex-start;
}

.message-content {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 16px;
  position: relative;
}

.user-message .message-content {
  background: #2563eb;
  color: white;
  border-bottom-right-radius: 4px;
}

.ai-message .message-content {
  background: #f3f4f6;
  color: #1f2937;
  border-bottom-left-radius: 4px;
}

.message-text {
  font-size: 15px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.message-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}

.message-time {
  font-size: 12px;
  color: #9ca3af;
}

.response-time {
  font-size: 11px;
  color: #10b981;
  background: #f0fdf4;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 500;
}

/* 输入打字指示器 */
.typing-indicator {
  display: flex;
  gap: 4px;
  align-items: center;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #9ca3af;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(1) { animation-delay: 0s; }
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

/* 输入区域 */
.input-area {
  border-top: 1px solid #e5e7eb;
  background: white;
  padding: 16px 24px;
}

.input-container {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  max-width: 1200px;
  margin: 0 auto;
}

.message-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 20px;
  font-size: 15px;
  line-height: 1.4;
  resize: none;
  outline: none;
  transition: border-color 0.2s;
}

.message-input:focus {
  border-color: #2563eb;
}

.send-btn {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background: #2563eb;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.send-btn:hover:not(.disabled) {
  background: #1d4ed8;
  transform: scale(1.05);
}

.send-btn.disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.input-footer {
  text-align: center;
  margin-top: 8px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.footer-text {
  font-size: 12px;
  color: #9ca3af;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.modal-close {
  padding: 4px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 24px;
  max-height: 400px;
  overflow-y: auto;
}

.model-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.model-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s;
}

.model-option:hover {
  border-color: #2563eb;
  background: #f8fafc;
}

.model-option.active {
  border-color: #2563eb;
  background: #eff6ff;
}

.model-info {
  flex: 1;
}

.model-name {
  font-size: 16px;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 4px;
}

.model-description {
  font-size: 14px;
  color: #6b7280;
}

.model-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-text {
  font-size: 12px;
  color: #6b7280;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-content {
    padding: 0 16px;
  }

  .messages-area {
    padding: 16px;
  }

  .input-area {
    padding: 12px 16px;
  }

  .message-content {
    max-width: 85%;
  }

  .quick-questions {
    flex-direction: column;
    align-items: center;
  }

  .quick-btn {
    width: 100%;
    max-width: 280px;
  }

  .modal-content {
    width: 95%;
    margin: 20px;
  }

  .modal-header {
    padding: 16px 20px;
  }

  .modal-body {
    padding: 20px;
  }

  /* API状态指示器样式 */
  .api-status {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-left: 12px;
    font-size: 12px;
    color: #6b7280;
  }

  .api-status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .api-status-connected {
    background: #10b981;
    box-shadow: 0 0 6px rgba(16, 185, 129, 0.4);
  }

  .api-status-disconnected {
    background: #f59e0b;
    box-shadow: 0 0 6px rgba(245, 158, 11, 0.4);
  }

  .api-status-error {
    background: #ef4444;
    box-shadow: 0 0 6px rgba(239, 68, 68, 0.4);
  }

  .api-status-checking {
    background: #6b7280;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  /* 错误消息样式 */
  .error-message {
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    border: 1px solid #fecaca;
    border-radius: 12px;
    padding: 16px;
    margin: 8px 0;
    color: #dc2626;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    white-space: pre-wrap;
    line-height: 1.5;
  }

  .error-message-header {
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .error-message-content {
    font-size: 13px;
    opacity: 0.9;
  }

  .error-message-details {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #fca5a5;
    font-size: 12px;
    opacity: 0.8;
  }

  /* 错误消息内部样式 */
  .error-title {
    font-weight: 600;
    font-size: 16px;
    margin-bottom: 12px;
    color: #dc2626;
  }

  .error-detail {
    margin: 8px 0;
    padding: 8px 12px;
    background: rgba(220, 38, 38, 0.1);
    border-left: 3px solid #dc2626;
    border-radius: 4px;
  }

  .error-suggestion {
    margin: 12px 0;
    padding: 12px;
    background: rgba(34, 197, 94, 0.1);
    border-left: 3px solid #16a34a;
    border-radius: 4px;
    color: #16a34a;
  }

  .error-tech {
    margin: 8px 0;
    font-size: 12px;
    opacity: 0.7;
    font-family: 'Consolas', monospace;
  }

  .error-item {
    margin: 4px 0;
    margin-left: 12px;
    font-size: 13px;
  }

  .error-text {
    margin: 4px 0;
    line-height: 1.4;
  }

  .error-badge {
    background: #dc2626;
    color: white;
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 500;
    margin-left: 8px;
  }

  .error-message-item {
    border-left: 3px solid #dc2626;
  }
}
</style>
