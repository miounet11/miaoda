<template>
  <div 
    v-if="isVisible" 
    class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
    @click="handleOverlayClick"
  >
    <div 
      class="relative w-full max-w-md mx-4 bg-background rounded-2xl shadow-2xl border border-border/20 overflow-hidden"
      @click.stop
    >
      <!-- 进度条 -->
      <div class="absolute top-0 left-0 right-0 h-1 bg-secondary">
        <div 
          class="h-full bg-primary transition-all duration-700 ease-out"
          :style="{ width: `${progress}%` }"
        />
      </div>

      <!-- 内容区域 -->
      <div class="p-8 pt-12">
        <Transition name="slide-fade" mode="out-in">
          <div :key="currentStep" class="text-center">
            <!-- 步骤 1: 欢迎 -->
            <div v-if="currentStep === 0" class="space-y-6">
              <div class="relative inline-flex items-center justify-center w-24 h-24 mb-4">
                <div class="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full animate-pulse-subtle" />
                <Sparkles :size="48" class="text-primary animate-sparkle" />
              </div>
              <div>
                <h2 class="text-2xl font-bold text-foreground mb-3">
                  欢迎使用 MiaoDa Chat
                </h2>
                <p class="text-muted-foreground leading-relaxed">
                  你的智能 AI 助手已准备就绪<br>
                  让我们快速了解一下主要功能
                </p>
              </div>
            </div>

            <!-- 步骤 2: 配置 LLM -->
            <div v-else-if="currentStep === 1" class="space-y-6">
              <div class="relative inline-flex items-center justify-center w-24 h-24 mb-4">
                <div class="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-full" />
                <Settings :size="48" class="text-blue-500" />
              </div>
              <div>
                <h2 class="text-2xl font-bold text-foreground mb-3">
                  配置 AI 模型
                </h2>
                <p class="text-muted-foreground leading-relaxed mb-4">
                  选择你喜欢的 AI 提供商，支持 OpenAI、Claude、Google Gemini 等
                </p>
                <div class="grid grid-cols-2 gap-3">
                  <div 
                    v-for="provider in availableProviders" 
                    :key="provider.id"
                    class="p-3 border border-border/50 rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
                    @click="selectProvider(provider.id)"
                  >
                    <div class="text-2xl mb-1">{{ provider.icon }}</div>
                    <div class="text-sm font-medium">{{ provider.name }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 步骤 3: 基础功能 -->
            <div v-else-if="currentStep === 2" class="space-y-6">
              <div class="relative inline-flex items-center justify-center w-24 h-24 mb-4">
                <div class="absolute inset-0 bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-full" />
                <MessageSquare :size="48" class="text-green-500" />
              </div>
              <div>
                <h2 class="text-2xl font-bold text-foreground mb-3">
                  聊天功能
                </h2>
                <p class="text-muted-foreground leading-relaxed mb-6">
                  支持文本、图片、文件上传，还有语音输入功能
                </p>
                <div class="space-y-4">
                  <div class="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                    <div class="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Type :size="16" class="text-primary" />
                    </div>
                    <div class="text-left">
                      <div class="text-sm font-medium">智能对话</div>
                      <div class="text-xs text-muted-foreground">支持上下文记忆</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                    <div class="flex-shrink-0 w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                      <Image :size="16" class="text-blue-500" />
                    </div>
                    <div class="text-left">
                      <div class="text-sm font-medium">多模态输入</div>
                      <div class="text-xs text-muted-foreground">图片、文件解析</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                    <div class="flex-shrink-0 w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                      <Mic :size="16" class="text-green-500" />
                    </div>
                    <div class="text-left">
                      <div class="text-sm font-medium">语音输入</div>
                      <div class="text-xs text-muted-foreground">快捷键 Ctrl+Shift+M</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 步骤 4: 快捷键 -->
            <div v-else-if="currentStep === 3" class="space-y-6">
              <div class="relative inline-flex items-center justify-center w-24 h-24 mb-4">
                <div class="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-purple-500/5 rounded-full" />
                <Zap :size="48" class="text-purple-500" />
              </div>
              <div>
                <h2 class="text-2xl font-bold text-foreground mb-3">
                  快捷键提升效率
                </h2>
                <p class="text-muted-foreground leading-relaxed mb-6">
                  掌握这些快捷键，让对话更加高效
                </p>
                <div class="space-y-3">
                  <div class="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <span class="text-sm">新建聊天</span>
                    <kbd class="px-3 py-1 bg-secondary/60 rounded-md text-xs font-mono">Cmd+T</kbd>
                  </div>
                  <div class="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <span class="text-sm">全局搜索</span>
                    <kbd class="px-3 py-1 bg-secondary/60 rounded-md text-xs font-mono">Cmd+K</kbd>
                  </div>
                  <div class="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <span class="text-sm">语音输入</span>
                    <kbd class="px-3 py-1 bg-secondary/60 rounded-md text-xs font-mono">Ctrl+Shift+M</kbd>
                  </div>
                  <div class="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <span class="text-sm">打开设置</span>
                    <kbd class="px-3 py-1 bg-secondary/60 rounded-md text-xs font-mono">Cmd+,</kbd>
                  </div>
                </div>
              </div>
            </div>

            <!-- 步骤 5: 完成 -->
            <div v-else-if="currentStep === 4" class="space-y-6">
              <div class="relative inline-flex items-center justify-center w-24 h-24 mb-4">
                <div class="absolute inset-0 bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-full animate-pulse-subtle" />
                <CheckCircle :size="48" class="text-green-500" />
              </div>
              <div>
                <h2 class="text-2xl font-bold text-foreground mb-3">
                  设置完成！
                </h2>
                <p class="text-muted-foreground leading-relaxed mb-6">
                  现在你可以开始与 AI 对话了<br>
                  有任何问题随时查看帮助文档
                </p>
                <div class="flex items-center gap-2 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                  <Lightbulb :size="20" class="text-primary flex-shrink-0" />
                  <div class="text-left">
                    <div class="text-sm font-medium text-foreground">小提示</div>
                    <div class="text-xs text-muted-foreground">
                      试着问："帮我写一个Python函数"开始你的第一次对话吧
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition>

        <!-- 导航按钮 -->
        <div class="flex items-center justify-between mt-8 pt-6 border-t border-border/20">
          <button
            v-if="currentStep > 0"
            @click="previousStep"
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft :size="16" />
            上一步
          </button>
          <div v-else class="invisible">
            <ArrowLeft :size="16" />
          </div>

          <!-- 步骤指示器 -->
          <div class="flex items-center gap-2">
            <div
              v-for="(step, index) in totalSteps"
              :key="index"
              class="w-2 h-2 rounded-full transition-all duration-300"
              :class="[
                index === currentStep 
                  ? 'bg-primary scale-125' 
                  : index < currentStep 
                    ? 'bg-green-500' 
                    : 'bg-secondary'
              ]"
            />
          </div>

          <button
            @click="nextStep"
            class="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {{ isLastStep ? '开始使用' : '下一步' }}
            <component :is="isLastStep ? Sparkles : ArrowRight" :size="16" />
          </button>
        </div>

        <!-- 跳过按钮 -->
        <div class="text-center mt-4">
          <button
            @click="skip"
            class="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
          >
            跳过引导
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { 
  Sparkles, Settings, MessageSquare, CheckCircle, ArrowLeft, ArrowRight, 
  Zap, Lightbulb, Type, Image, Mic
} from 'lucide-vue-next'

interface Provider {
  id: string
  name: string
  icon: string
}

// Props & Emits
interface Props {
  isVisible?: boolean
  skipIfConfigured?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isVisible: false,
  skipIfConfigured: true
})

const emit = defineEmits<{
  completed: []
  skipped: []
  providerSelected: [providerId: string]
}>()

// 状态管理
const currentStep = ref(0)
const totalSteps = 5
const selectedProvider = ref<string>('')

// 可用提供商
const availableProviders: Provider[] = [
  { id: 'openai', name: 'OpenAI', icon: '🤖' },
  { id: 'anthropic', name: 'Claude', icon: '🧠' },
  { id: 'google', name: 'Gemini', icon: '🌟' },
  { id: 'local', name: '本地模型', icon: '🏠' }
]

// 计算属性
const progress = computed(() => (currentStep.value / (totalSteps - 1)) * 100)
const isLastStep = computed(() => currentStep.value === totalSteps - 1)

// 方法
const nextStep = () => {
  if (isLastStep.value) {
    complete()
  } else {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const selectProvider = (providerId: string) => {
  selectedProvider.value = providerId
  emit('providerSelected', providerId)
  // 自动进入下一步
  setTimeout(nextStep, 300)
}

const complete = () => {
  // 保存引导完成状态
  localStorage.setItem('onboarding-completed', 'true')
  emit('completed')
}

const skip = () => {
  localStorage.setItem('onboarding-completed', 'true')
  emit('skipped')
}

const handleOverlayClick = () => {
  // 点击遮罩层不关闭，避免误操作
}

// 生命周期
onMounted(async () => {
  // 检查是否需要跳过引导
  if (props.skipIfConfigured) {
    try {
      const isConfigured = await window.api.llm.isConfigured()
      if (isConfigured) {
        const hasCompletedOnboarding = localStorage.getItem('onboarding-completed')
        if (hasCompletedOnboarding) {
          skip()
        }
      }
    } catch (error) {
      console.error('Failed to check LLM configuration:', error)
    }
  }
})

// 监听步骤变化，添加音效反馈（如果需要）
watch(currentStep, (newStep, oldStep) => {
  // 可以在这里添加步骤切换的音效或触觉反馈
  console.log(`Onboarding step changed from ${oldStep} to ${newStep}`)
})
</script>

<style scoped>
/* 滑动淡入淡出动画 */
.slide-fade-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* 脉冲动画 */
@keyframes pulse-subtle {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

@keyframes sparkle {
  0%, 100% { 
    transform: rotate(0deg) scale(1);
    opacity: 1;
  }
  50% { 
    transform: rotate(180deg) scale(1.1);
    opacity: 0.8;
  }
}

.animate-pulse-subtle {
  animation: pulse-subtle 3s ease-in-out infinite;
}

.animate-sparkle {
  animation: sparkle 4s linear infinite;
}

/* 键盘样式 */
kbd {
  font-family: ui-monospace, 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Droid Sans Mono', monospace;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(var(--border), 0.5);
}

/* 提供商卡片悬停效果 */
.provider-card {
  transition: all 0.2s ease;
}

.provider-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.provider-card:active {
  transform: translateY(0);
}

/* 响应式设计 */
@media (max-width: 640px) {
  .fixed {
    padding: 1rem;
  }
  
  .max-w-md {
    max-width: 100%;
  }
  
  .p-8 {
    padding: 1.5rem;
  }
  
  .pt-12 {
    padding-top: 3rem;
  }
  
  .text-2xl {
    font-size: 1.5rem;
  }
  
  .w-24.h-24 {
    width: 5rem;
    height: 5rem;
  }
  
  .grid-cols-2 {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
}
</style>