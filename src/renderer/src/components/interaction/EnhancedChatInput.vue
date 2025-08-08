<template>
  <div class="enhanced-chat-input">
    <!-- 输入预处理提示 -->
    <Transition name="slide-down">
      <div
        v-if="showPreprocessingHint && inputValue.length > 0"
        class="preprocessing-hint mb-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg"
      >
        <div class="flex items-center gap-2">
          <Sparkles :size="16" class="text-blue-500" />
          <span class="text-sm text-blue-700 dark:text-blue-300">
            {{ getInputHint() }}
          </span>
        </div>
      </div>
    </Transition>

    <!-- 智能建议栏 -->
    <Transition name="slide-down">
      <div
        v-if="suggestions.length > 0 && showSuggestions"
        class="suggestions-bar mb-3 space-y-2"
      >
        <div class="flex items-center gap-2 mb-2">
          <Lightbulb :size="14" class="text-yellow-500" />
          <span class="text-xs font-medium text-muted-foreground">智能建议</span>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="suggestion in suggestions"
            :key="suggestion.id"
            @click="applySuggestion(suggestion)"
            class="suggestion-chip px-3 py-1.5 bg-secondary/50 hover:bg-secondary text-xs rounded-full transition-colors border border-border/30 hover:border-primary/30"
          >
            <component :is="suggestion.icon" :size="12" class="mr-1" />
            {{ suggestion.text }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- 主输入区域 -->
    <div 
      class="input-container relative"
      :class="[
        'transition-all duration-300 ease-out',
        'bg-secondary/40 rounded-2xl border-2 shadow-sm backdrop-blur-sm',
        isFocused 
          ? 'border-primary/50 shadow-xl bg-background/80 scale-[1.01] animate-focus-breathe' 
          : 'border-transparent hover:border-primary/20 hover:bg-secondary/50',
        isProcessing && 'animate-processing-pulse'
      ]"
    >
      <!-- 顶部工具栏 -->
      <div class="input-toolbar flex items-center justify-between p-3 pb-0">
        <!-- 左侧工具 -->
        <div class="flex items-center gap-2">
          <!-- 输入模式切换 -->
          <div class="mode-switcher flex items-center gap-1 p-1 bg-background/50 rounded-lg">
            <button
              v-for="mode in inputModes"
              :key="mode.id"
              @click="setInputMode(mode.id)"
              :class="[
                'px-2 py-1 text-xs rounded-md transition-all',
                currentMode === mode.id 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              ]"
              :title="mode.title"
            >
              <component :is="mode.icon" :size="12" />
              <span class="hidden sm:inline ml-1">{{ mode.label }}</span>
            </button>
          </div>
        </div>

        <!-- 右侧状态 -->
        <div class="flex items-center gap-2">
          <!-- 字符计数 -->
          <Transition name="counter-bounce">
            <span 
              v-if="characterCount > 0"
              :class="[
                'text-xs font-medium tabular-nums transition-all duration-300',
                characterCount > 4000 ? 'text-destructive animate-error-shake' : 
                characterCount > 3000 ? 'text-warning' : 
                'text-muted-foreground'
              ]"
            >
              {{ characterCount.toLocaleString() }}/4000
            </span>
          </Transition>

          <!-- AI 模型指示器 -->
          <div 
            v-if="currentModel"
            class="model-indicator flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-md"
            :title="`当前模型: ${currentModel.name}`"
          >
            <div class="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span class="text-xs font-medium text-primary">{{ currentModel.shortName }}</span>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-area flex items-end gap-3 p-3">
        <!-- 左侧附件按钮 -->
        <div class="attachment-controls flex flex-col gap-2">
          <button
            @click="selectFiles"
            class="attachment-btn"
            :class="[
              'p-2 rounded-xl transition-all group relative',
              isLoading 
                ? 'text-muted-foreground/50 cursor-not-allowed'
                : 'hover:bg-secondary/60 hover:text-primary hover:scale-110 active:scale-95'
            ]"
            title="添加文件"
            :disabled="isLoading"
          >
            <Paperclip :size="20" class="transition-transform group-hover:rotate-12" />
            
            <!-- 上传进度指示器 -->
            <div 
              v-if="uploadProgress > 0 && uploadProgress < 100"
              class="absolute inset-0 rounded-xl border-2 border-primary/30"
              :style="{ 
                background: `conic-gradient(from 0deg, var(--primary) ${uploadProgress * 3.6}deg, transparent ${uploadProgress * 3.6}deg)` 
              }"
            />
          </button>

          <!-- 图片粘贴指示器 -->
          <Transition name="scale-bounce">
            <div
              v-if="showPasteHint"
              class="paste-hint absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded whitespace-nowrap pointer-events-none"
            >
              图片已复制，粘贴试试
              <div class="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-primary"></div>
            </div>
          </Transition>
        </div>
        
        <!-- 主文本输入 -->
        <div class="text-input-wrapper flex-1 relative">
          <textarea
            v-model="inputValue"
            @keydown="handleKeyDown"
            @focus="handleFocus"
            @blur="handleBlur"
            @paste="handlePaste"
            @input="handleInput"
            @drop="handleDrop"
            @dragover.prevent
            @dragenter.prevent
            :placeholder="getSmartPlaceholder()"
            :disabled="isLoading"
            :rows="Math.min(Math.max(1, inputValue.split('\n').length), 8)"
            class="w-full bg-transparent resize-none outline-none transition-all duration-200"
            :class="[
              'min-h-[52px] max-h-[200px] px-4 py-4 text-base leading-relaxed',
              'placeholder:text-muted-foreground/60 disabled:opacity-50',
              isFocused && 'placeholder:text-muted-foreground/80'
            ]"
            :style="{ fontSize: '16px' }"
            ref="textareaRef"
          />
          
          <!-- 输入装饰器 -->
          <div class="input-decorators absolute bottom-2 right-2">
            <!-- 实时输入指示器 -->
            <Transition name="fade">
              <div 
                v-if="isTyping && inputValue.length > 0"
                class="typing-indicator flex items-center gap-1"
              >
                <div class="flex gap-0.5">
                  <div class="w-1 h-1 bg-primary rounded-full animate-bounce" style="animation-delay: 0s"></div>
                  <div class="w-1 h-1 bg-primary rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                  <div class="w-1 h-1 bg-primary rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                </div>
              </div>
            </Transition>
          </div>

          <!-- 输入增强功能 -->
          <div class="input-enhancers absolute left-2 bottom-2 flex items-center gap-1">
            <!-- Markdown 支持指示器 -->
            <Transition name="fade">
              <div 
                v-if="hasMarkdownContent"
                class="markdown-indicator px-1.5 py-0.5 bg-blue-500/10 text-blue-500 text-xs rounded-md font-mono"
                title="检测到 Markdown 格式"
              >
                MD
              </div>
            </Transition>
            
            <!-- 代码检测指示器 -->
            <Transition name="fade">
              <div 
                v-if="hasCodeContent"
                class="code-indicator px-1.5 py-0.5 bg-green-500/10 text-green-500 text-xs rounded-md font-mono"
                title="检测到代码内容"
              >
                <Code2 :size="10" />
              </div>
            </Transition>
          </div>
        </div>
        
        <!-- 右侧操作按钮 -->
        <div class="action-buttons flex gap-2">
          <!-- 语音输入 -->
          <button
            v-if="isVoiceSupported"
            @click="toggleVoiceRecording"
            :disabled="!isConfigured"
            class="voice-btn relative rounded-xl transition-all duration-300 shadow-sm overflow-hidden"
            :class="[
              'p-3',
              isRecording 
                ? 'bg-destructive text-destructive-foreground shadow-lg scale-110' 
                : isConfigured
                  ? 'bg-secondary/80 text-secondary-foreground hover:bg-secondary hover:scale-105 active:scale-95'
                  : 'bg-secondary/50 text-muted-foreground cursor-not-allowed'
            ]"
            :title="isRecording ? '停止录音' : '语音输入 (Ctrl+Shift+M)'"
            data-tour="voice-btn"
          >
            <!-- 录音波纹效果 -->
            <div v-if="isRecording" class="absolute inset-0">
              <div class="absolute inset-0 rounded-xl border-2 border-destructive/30 animate-ping"></div>
              <div class="absolute inset-0 rounded-xl border-2 border-destructive/20 animate-ping" style="animation-delay: 0.5s;"></div>
            </div>
            
            <!-- 音频可视化 -->
            <div v-if="isRecording" class="absolute bottom-1 left-1 right-1 flex items-end gap-0.5 h-1">
              <div v-for="i in 8" :key="i" class="flex-1 bg-destructive-foreground/60 rounded-full animate-audio-bar" :style="{ animationDelay: `${i * 0.1}s` }"></div>
            </div>
            
            <Mic :size="22" :class="{ 'animate-bounce': isRecording }" />
          </button>
          
          <!-- 发送按钮 -->
          <button
            @click="sendMessage"
            :disabled="!canSend"
            class="send-btn rounded-xl transition-all transform shadow-sm group relative overflow-hidden"
            :class="[
              'p-3 min-w-[48px]',
              canSend
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-110 shadow-lg active:scale-95' 
                : 'bg-secondary/50 text-muted-foreground cursor-not-allowed'
            ]"
            :title="getSendButtonTooltip()"
            data-tour="send-btn"
          >
            <!-- 发送加载动画 -->
            <Transition name="spin-fade" mode="out-in">
              <Loader2 
                v-if="isProcessing"
                :size="22" 
                class="animate-spin"
              />
              <Send 
                v-else
                :size="22" 
                class="transition-all group-hover:translate-x-0.5" 
              />
            </Transition>
            
            <!-- 发送成功反馈 -->
            <div 
              v-if="showSendFeedback"
              class="absolute inset-0 bg-green-500 rounded-xl flex items-center justify-center"
            >
              <Check :size="22" class="text-white animate-bounce" />
            </div>
          </button>
        </div>
      </div>

      <!-- 底部提示栏 -->
      <div class="input-footer flex items-center justify-between px-4 pb-3 text-xs text-muted-foreground">
        <div class="shortcuts flex items-center gap-4">
          <span class="flex items-center gap-1.5">
            <kbd class="kbd-style">Enter</kbd> 发送
          </span>
          <span class="flex items-center gap-1.5">
            <kbd class="kbd-style">Shift+Enter</kbd> 换行
          </span>
          <span class="hidden md:flex items-center gap-1.5">
            <kbd class="kbd-style">⌘K</kbd> 搜索
          </span>
        </div>
        
        <!-- 状态指示器 -->
        <div class="status-indicators flex items-center gap-3">
          <Transition name="status-fade" mode="out-in">
            <div v-if="isProcessing" class="flex items-center gap-1 text-primary animate-pulse">
              <Loader2 :size="12" class="animate-spin" />
              处理中...
            </div>
            <div v-else-if="lastActionFeedback" class="flex items-center gap-1 text-green-500">
              <Check :size="12" />
              {{ lastActionFeedback }}
            </div>
            <div v-else-if="errorMessage" class="flex items-center gap-1 text-destructive">
              <AlertCircle :size="12" />
              {{ errorMessage }}
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { 
  Send, Mic, Paperclip, Code2, Loader2, Check, AlertCircle,
  Sparkles, Lightbulb, MessageSquare, Image, Type, FileText
} from 'lucide-vue-next'

interface InputMode {
  id: string
  label: string
  title: string
  icon: any
}

interface Suggestion {
  id: string
  text: string
  icon: any
  action: () => void
}

interface Model {
  id: string
  name: string
  shortName: string
}

// Props
interface Props {
  modelValue?: string
  isLoading?: boolean
  isConfigured?: boolean
  currentModel?: Model
  placeholder?: string
  maxLength?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  isLoading: false,
  isConfigured: true,
  maxLength: 4000
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'send': [message: string, attachments: any[]]
  'voice-toggle': []
  'file-select': []
  'paste': [data: any]
  'mode-change': [mode: string]
}>()

// 状态管理
const textareaRef = ref<HTMLTextAreaElement>()
const inputValue = ref(props.modelValue)
const isFocused = ref(false)
const isTyping = ref(false)
const isProcessing = ref(false)
const isRecording = ref(false)
const isVoiceSupported = ref(false)
const showSuggestions = ref(true)
const showSendFeedback = ref(false)
const showPasteHint = ref(false)
const lastActionFeedback = ref('')
const errorMessage = ref('')
const uploadProgress = ref(0)
const attachments = ref<any[]>([])
const currentMode = ref<string>('text')

// 输入模式
const inputModes: InputMode[] = [
  { id: 'text', label: '文本', title: '普通文本输入', icon: Type },
  { id: 'code', label: '代码', title: '代码输入模式', icon: Code2 },
  { id: 'image', label: '图像', title: '图像分析模式', icon: Image },
  { id: 'file', label: '文档', title: '文档处理模式', icon: FileText }
]

// 计算属性
const characterCount = computed(() => inputValue.value.length)
const canSend = computed(() => 
  (inputValue.value.trim() || attachments.value.length > 0) && 
  !props.isLoading && 
  props.isConfigured &&
  !isProcessing.value
)

const hasMarkdownContent = computed(() => {
  const mdPatterns = [/\*\*.*\*\*/, /\*.*\*/, /`.*`/, /^#+\s/, /^\d+\.\s/, /^-\s/m]
  return mdPatterns.some(pattern => pattern.test(inputValue.value))
})

const hasCodeContent = computed(() => {
  const codePatterns = [/```[\s\S]*```/, /`[^`\n]+`/, /function\s*\(/, /class\s+\w+/, /import\s+/, /export\s+/]
  return codePatterns.some(pattern => pattern.test(inputValue.value))
})

const showPreprocessingHint = computed(() => 
  inputValue.value.length > 50 && (hasMarkdownContent.value || hasCodeContent.value)
)

const suggestions = computed(() => {
  const baseSuggestions: Suggestion[] = []
  
  // 基于内容提供智能建议
  if (inputValue.value.length === 0) {
    baseSuggestions.push(
      { id: 'hello', text: '你好，介绍一下自己', icon: MessageSquare, action: () => applySuggestionText('你好，请介绍一下你自己') },
      { id: 'code', text: '帮我写代码', icon: Code2, action: () => applySuggestionText('帮我写一个') },
      { id: 'explain', text: '解释概念', icon: Lightbulb, action: () => applySuggestionText('请解释一下') }
    )
  } else if (hasCodeContent.value) {
    baseSuggestions.push(
      { id: 'review', text: '代码审查', icon: Code2, action: () => inputValue.value += '\n\n请帮我审查这段代码，指出可能的问题和改进建议。' },
      { id: 'optimize', text: '优化建议', icon: Sparkles, action: () => inputValue.value += '\n\n请提供优化建议。' }
    )
  }
  
  return baseSuggestions.slice(0, 4)
})

// 方法
const handleFocus = () => {
  isFocused.value = true
}

const handleBlur = () => {
  isFocused.value = false
  setTimeout(() => {
    isTyping.value = false
  }, 500)
}

const handleInput = () => {
  emit('update:modelValue', inputValue.value)
  
  isTyping.value = true
  
  // 自动调整高度
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.style.height = 'auto'
      textareaRef.value.style.height = textareaRef.value.scrollHeight + 'px'
    }
  })
  
  // 延迟停止输入状态
  setTimeout(() => {
    if (!isFocused.value) {
      isTyping.value = false
    }
  }, 1000)
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  } else if (e.key === 'Escape') {
    textareaRef.value?.blur()
  }
}

const handlePaste = async (e: ClipboardEvent) => {
  const items = e.clipboardData?.items
  if (!items) return
  
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault()
      
      showPasteHint.value = true
      setTimeout(() => {
        showPasteHint.value = false
      }, 2000)
      
      const file = item.getAsFile()
      if (file) {
        // 处理图片粘贴
        emit('paste', { type: 'image', file })
      }
    }
  }
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  const files = e.dataTransfer?.files
  if (files) {
    emit('paste', { type: 'files', files: Array.from(files) })
  }
}

const sendMessage = async () => {
  if (!canSend.value) return
  
  isProcessing.value = true
  
  try {
    emit('send', inputValue.value, attachments.value)
    
    // 发送成功反馈
    showSendFeedback.value = true
    setTimeout(() => {
      showSendFeedback.value = false
    }, 1000)
    
    // 清空输入
    inputValue.value = ''
    attachments.value = []
    
    lastActionFeedback.value = '发送成功'
    setTimeout(() => {
      lastActionFeedback.value = ''
    }, 2000)
    
  } catch (error) {
    errorMessage.value = '发送失败'
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
  } finally {
    isProcessing.value = false
  }
}

const selectFiles = () => {
  emit('file-select')
}

const toggleVoiceRecording = () => {
  isRecording.value = !isRecording.value
  emit('voice-toggle')
}

const setInputMode = (mode: string) => {
  currentMode.value = mode
  emit('mode-change', mode)
  
  // 给用户反馈
  lastActionFeedback.value = `已切换到${inputModes.find(m => m.id === mode)?.label}模式`
  setTimeout(() => {
    lastActionFeedback.value = ''
  }, 2000)
}

const applySuggestion = (suggestion: Suggestion) => {
  suggestion.action()
  showSuggestions.value = false
  setTimeout(() => {
    showSuggestions.value = true
  }, 2000)
}

const applySuggestionText = (text: string) => {
  inputValue.value = text
  emit('update:modelValue', text)
  textareaRef.value?.focus()
}

const getSmartPlaceholder = () => {
  if (!props.isConfigured) return '请先配置 LLM 提供商...'
  if (props.isLoading) return 'AI 正在响应...'
  if (isProcessing.value) return '正在处理...'
  
  const modeTexts = {
    text: '输入你的想法...',
    code: '输入或粘贴代码...',
    image: '描述图片或上传图片...',
    file: '上传文档或描述需求...'
  }
  
  return modeTexts[currentMode.value as keyof typeof modeTexts] || props.placeholder || '输入消息...'
}

const getInputHint = () => {
  if (hasCodeContent.value && hasMarkdownContent.value) {
    return '检测到代码和Markdown格式，将自动优化显示效果'
  } else if (hasCodeContent.value) {
    return '检测到代码内容，支持语法高亮和智能补全'
  } else if (hasMarkdownContent.value) {
    return '检测到Markdown格式，支持富文本预览'
  }
  return ''
}

const getSendButtonTooltip = () => {
  if (!props.isConfigured) return '请先配置 LLM 提供商'
  if (props.isLoading || isProcessing.value) return '请稍候...'
  if (!inputValue.value.trim() && attachments.value.length === 0) return '输入消息'
  return 'Enter 发送消息'
}

// 生命周期
onMounted(() => {
  // 检查语音支持
  isVoiceSupported.value = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  
  // 监听全局快捷键
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'M') {
      e.preventDefault()
      if (isVoiceSupported.value && props.isConfigured) {
        toggleVoiceRecording()
      }
    }
  })
})

// 监听 props 变化
watch(() => props.modelValue, (newValue) => {
  if (newValue !== inputValue.value) {
    inputValue.value = newValue
  }
})

watch(inputValue, (newValue) => {
  emit('update:modelValue', newValue)
})

// 暴露方法给父组件
defineExpose({
  focus: () => textareaRef.value?.focus(),
  clear: () => {
    inputValue.value = ''
    attachments.value = []
  },
  insertText: (text: string) => {
    const textarea = textareaRef.value
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      inputValue.value = inputValue.value.substring(0, start) + text + inputValue.value.substring(end)
      nextTick(() => {
        textarea.focus()
        textarea.setSelectionRange(start + text.length, start + text.length)
      })
    } else {
      inputValue.value += text
    }
  }
})
</script>

<style scoped>
/* 键盘样式 */
.kbd-style {
  @apply px-2 py-1 bg-secondary/60 rounded-md text-xs font-mono font-medium border border-border/30;
}

/* 动画定义 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: top;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px) scaleY(0.95);
}

.counter-bounce-enter-active {
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.counter-bounce-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.scale-bounce-enter-active,
.scale-bounce-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.scale-bounce-enter-from,
.scale-bounce-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.spin-fade-enter-active,
.spin-fade-leave-active {
  transition: all 0.2s ease;
}

.spin-fade-enter-from,
.spin-fade-leave-to {
  opacity: 0;
  transform: scale(0.8) rotate(90deg);
}

.status-fade-enter-active,
.status-fade-leave-active {
  transition: all 0.3s ease;
}

.status-fade-enter-from,
.status-fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 呼吸动画 */
@keyframes focus-breathe {
  0%, 100% {
    box-shadow: 0 0 0 2px rgba(var(--primary), 0.2);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(var(--primary), 0.1);
  }
}

.animate-focus-breathe {
  animation: focus-breathe 2s ease-in-out infinite;
}

/* 处理动画 */
@keyframes processing-pulse {
  0%, 100% {
    border-color: rgba(var(--primary), 0.3);
  }
  50% {
    border-color: rgba(var(--primary), 0.6);
  }
}

.animate-processing-pulse {
  animation: processing-pulse 1.5s ease-in-out infinite;
}

/* 音频可视化 */
@keyframes audio-bar {
  0%, 100% {
    transform: scaleY(0.3);
  }
  50% {
    transform: scaleY(1);
  }
}

.animate-audio-bar {
  animation: audio-bar 0.8s ease-in-out infinite alternate;
  transform-origin: bottom;
}

/* 建议芯片悬停效果 */
.suggestion-chip {
  display: inline-flex;
  align-items: center;
  transition: all 0.2s ease;
}

.suggestion-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.suggestion-chip:active {
  transform: translateY(0);
}

/* 响应式设计 */
@media (max-width: 640px) {
  .mode-switcher {
    gap: 0;
  }
  
  .mode-switcher button span {
    display: none;
  }
  
  .shortcuts {
    gap: 1rem;
  }
  
  .shortcuts span:nth-child(n+3) {
    display: none;
  }
  
  .input-toolbar {
    padding: 0.75rem;
    padding-bottom: 0;
  }
  
  .input-area {
    padding: 0.75rem;
  }
  
  .input-footer {
    padding: 0 0.75rem 0.75rem 0.75rem;
  }
  
  .action-buttons .voice-btn,
  .action-buttons .send-btn {
    padding: 0.75rem;
  }
}

/* 确保 textarea 自适应高度 */
.text-input-wrapper textarea {
  field-sizing: content;
  overflow-y: hidden;
  resize: none;
}

/* 拖拽区域样式 */
.input-container.drag-over {
  border-color: rgba(var(--primary), 0.5);
  background-color: rgba(var(--primary), 0.05);
}
</style>