<template>
  <div class="chat-view">
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
          </div>
        </div>
        <div class="nav-actions">
          <button @click="showModelSwitcher" class="nav-btn" title="切换模型">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path>
            </svg>
          </button>
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
             :class="{ 'user-message': message.role === 'user', 'ai-message': message.role === 'assistant' }">
          <div class="message-content">
            <div class="message-text">{{ message.content }}</div>
            <div class="message-meta">
              <span class="message-time">{{ formatTime(message.timestamp) }}</span>
              <span v-if="message.responseTime && message.role === 'assistant'" class="response-time">
                {{ message.responseTime }}
              </span>
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
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'

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
    // 通过Electron IPC调用主进程的LLM服务
    const response = await (window as any).api?.llm?.sendMessage(messageHistory)

    if (response && typeof response === 'string') {
      return response
    } else {
      // 如果没有配置LLM服务，使用默认回复
      return generateFallbackResponse(messageHistory[messageHistory.length - 1].content)
    }
  } catch (error) {
    console.error('LLM服务调用失败:', error)
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

// 生命周期
onMounted(() => {
  adjustTextareaHeight()
})
</script>

<style scoped>
.chat-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: white;
}

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
}
</style>
