<template>
  <div class="model-config-panel h-full flex flex-col">
    <!-- 面板头部 -->
    <div class="panel-header flex items-center justify-between mb-6 flex-shrink-0">
      <div class="flex items-center">
        <div class="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings text-white" aria-hidden="true">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </div>
        <h5 class="semi-typography mb-0 semi-typography-primary semi-typography-normal semi-typography-h5">模型配置</h5>
      </div>
    </div>

    <!-- 配置内容区域 -->
    <div class="config-content flex-1 overflow-y-auto pr-2 space-y-6">
      <!-- 自定义请求体模式 -->
      <div class="config-section">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-code text-gray-500" aria-hidden="true">
              <path d="m16 18 6-6-6-6"></path>
              <path d="m8 6-6 6 6 6"></path>
            </svg>
            <span class="text-sm font-medium text-gray-700">自定义请求体模式</span>
          </div>
          <div class="semi-switch semi-switch-small">
            <input
              type="checkbox"
              class="semi-switch-native-control"
              role="switch"
              :checked="config.customRequestMode"
              @change="updateConfig('customRequestMode', ($event.target as HTMLInputElement).checked)"
            >
          </div>
        </div>
      </div>

      <!-- 分组选择 -->
      <div class="config-section">
        <div class="flex items-center gap-2 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users text-gray-500" aria-hidden="true">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <path d="M16 3.128a4 4 0 0 1 0 7.744"></path>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
            <circle cx="9" cy="7" r="4"></circle>
          </svg>
          <span class="text-sm font-medium text-gray-700">分组</span>
        </div>
        <select
          :value="config.group"
          @change="updateConfig('group', ($event.target as HTMLSelectElement).value)"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="default">默认分组</option>
          <option value="work">工作</option>
          <option value="personal">个人</option>
          <option value="research">研究</option>
        </select>
      </div>

      <!-- 模型选择 -->
      <div class="config-section">
        <div class="flex items-center gap-2 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sparkles text-gray-500" aria-hidden="true">
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path>
            <path d="M20 3v4"></path>
            <path d="M22 5h-4"></path>
            <path d="M4 17v2"></path>
            <path d="M5 18H3"></path>
          </svg>
          <span class="text-sm font-medium text-gray-700">模型</span>
        </div>
        <select
          :value="config.model"
          @change="updateConfig('model', ($event.target as HTMLSelectElement).value)"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="claude-opus-4-1-20250805-thinking">claude-opus-4-1-20250805-thinking</option>
          <option value="claude-3-5-sonnet">claude-3-5-sonnet</option>
          <option value="gpt-4">gpt-4</option>
          <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
          <option value="gemini-pro">gemini-pro</option>
        </select>
      </div>

      <!-- 图片地址 -->
      <div class="config-section">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image text-gray-400" aria-hidden="true">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
              <circle cx="9" cy="9" r="2"></circle>
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
            </svg>
            <span class="text-sm font-medium text-gray-700">图片地址</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="semi-switch semi-switch-small">
              <input
                type="checkbox"
                class="semi-switch-native-control"
                role="switch"
                :checked="config.imageUrls.length > 0"
                @change="toggleImageMode(($event.target as HTMLInputElement).checked)"
              >
            </div>
            <button
              v-if="config.imageUrls.length > 0"
              @click="addImageUrl"
              class="w-4 h-4 rounded-full bg-purple-500 hover:bg-purple-600 flex items-center justify-center text-white text-xs"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus" aria-hidden="true">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg>
            </button>
          </div>
        </div>
        <p class="text-xs text-gray-500 mb-2">启用后可添加图片URL进行多模态对话</p>

        <!-- 图片URL列表 -->
        <div v-if="config.imageUrls.length > 0" class="space-y-2 max-h-32 overflow-y-auto">
          <div v-for="(url, index) in config.imageUrls" :key="index" class="flex items-center gap-2">
            <input
              :value="url"
              @input="updateImageUrl(index, ($event.target as HTMLInputElement).value)"
              type="text"
              placeholder="https://example.com/image1.jpg"
              class="flex-1 px-3 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
            <button
              @click="removeImageUrl(index)"
              class="w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white text-xs"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x" aria-hidden="true">
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 参数设置 -->
      <div class="config-section">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-thermometer text-gray-500" aria-hidden="true">
              <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"></path>
            </svg>
            <span class="text-sm font-medium text-gray-700">Temperature</span>
            <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{{ config.temperature }}</span>
          </div>
          <button @click="resetParameter('temperature')" class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">
            ✓
          </button>
        </div>
        <p class="text-xs text-gray-500 mb-2">控制输出的随机性和创造性</p>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          :value="config.temperature"
          @input="updateConfig('temperature', parseFloat(($event.target as HTMLInputElement).value))"
          class="w-full"
        >
      </div>

      <div class="config-section">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-target text-gray-500" aria-hidden="true">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="6"></circle>
              <circle cx="12" cy="12" r="2"></circle>
            </svg>
            <span class="text-sm font-medium text-gray-700">Top P</span>
            <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{{ config.topP }}</span>
          </div>
          <button @click="resetParameter('topP')" class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">
            ✓
          </button>
        </div>
        <p class="text-xs text-gray-500 mb-2">核采样，控制词汇选择的多样性</p>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          :value="config.topP"
          @input="updateConfig('topP', parseFloat(($event.target as HTMLInputElement).value))"
          class="w-full"
        >
      </div>

      <div class="config-section">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-repeat text-gray-500" aria-hidden="true">
              <path d="m17 2 4 4-4 4"></path>
              <path d="M3 11v-1a4 4 0 0 1 4-4h14"></path>
              <path d="m7 22-4-4 4-4"></path>
              <path d="M21 13v1a4 4 0 0 1-4 4H3"></path>
            </svg>
            <span class="text-sm font-medium text-gray-700">Frequency Penalty</span>
            <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{{ config.frequencyPenalty }}</span>
          </div>
          <button @click="resetParameter('frequencyPenalty')" class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">
            ✓
          </button>
        </div>
        <p class="text-xs text-gray-500 mb-2">频率惩罚，减少重复词汇的出现</p>
        <input
          type="range"
          min="-2"
          max="2"
          step="0.1"
          :value="config.frequencyPenalty"
          @input="updateConfig('frequencyPenalty', parseFloat(($event.target as HTMLInputElement).value))"
          class="w-full"
        >
      </div>

      <div class="config-section">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ban text-gray-500" aria-hidden="true">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="m4.9 4.9 14.2 14.2"></path>
            </svg>
            <span class="text-sm font-medium text-gray-700">Presence Penalty</span>
            <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{{ config.presencePenalty }}</span>
          </div>
          <button @click="resetParameter('presencePenalty')" class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">
            ✓
          </button>
        </div>
        <p class="text-xs text-gray-500 mb-2">存在惩罚，鼓励讨论新话题</p>
        <input
          type="range"
          min="-2"
          max="2"
          step="0.1"
          :value="config.presencePenalty"
          @input="updateConfig('presencePenalty', parseFloat(($event.target as HTMLInputElement).value))"
          class="w-full"
        >
      </div>

      <div class="config-section">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-hash text-gray-500" aria-hidden="true">
              <line x1="4" x2="20" y1="9" y2="9"></line>
              <line x1="4" x2="20" y1="15" y2="15"></line>
              <line x1="10" x2="8" y1="3" y2="21"></line>
              <line x1="16" x2="14" y1="3" y2="21"></line>
            </svg>
            <span class="text-sm font-medium text-gray-700">Max Tokens</span>
          </div>
          <button @click="resetParameter('maxTokens')" class="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200">
            ✕
          </button>
        </div>
        <input
          :value="config.maxTokens"
          @input="updateConfig('maxTokens', parseInt(($event.target as HTMLInputElement).value) || 4096)"
          type="number"
          placeholder="4096"
          class="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
      </div>

      <div class="config-section">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shuffle text-gray-500" aria-hidden="true">
              <path d="m18 14 4 4-4 4"></path>
              <path d="m18 2 4 4-4 4"></path>
              <path d="M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22"></path>
              <path d="M2 6h1.972a4 4 0 0 1 3.6 2.2"></path>
              <path d="M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45"></path>
            </svg>
            <span class="text-sm font-medium text-gray-700">Seed</span>
            <span class="text-xs text-gray-400">(可选，用于复现结果)</span>
          </div>
          <button @click="resetParameter('seed')" class="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200">
            ✕
          </button>
        </div>
        <input
          :value="config.seed"
          @input="updateConfig('seed', ($event.target as HTMLInputElement).value)"
          type="text"
          placeholder="随机种子 (留空为随机)"
          class="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
      </div>

      <!-- 流式输出 -->
      <div class="config-section">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-toggle-left text-gray-500" aria-hidden="true">
              <circle cx="9" cy="12" r="3"></circle>
              <rect width="20" height="14" x="2" y="5" rx="7"></rect>
            </svg>
            <span class="text-sm font-medium text-gray-700">流式输出</span>
          </div>
          <div class="semi-switch semi-switch-small">
            <input
              type="checkbox"
              class="semi-switch-native-control"
              role="switch"
              :checked="config.stream"
              @change="updateConfig('stream', ($event.target as HTMLInputElement).checked)"
            >
          </div>
        </div>
      </div>
    </div>

    <!-- 底部操作按钮 -->
    <div class="panel-footer flex-shrink-0 pt-4 space-y-3">
      <div class="flex items-center justify-between text-xs text-gray-500">
        <span>上次保存: {{ lastSaved }}</span>
        <button @click="resetAllSettings" class="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200">
          重置
        </button>
      </div>

      <div class="flex gap-2">
        <button @click="$emit('export-config')" class="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600">
          导出
        </button>
        <button @click="$emit('import-config')" class="flex-1 px-3 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600">
          导入
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  config: {
    customRequestMode: boolean
    group: string
    model: string
    temperature: number
    topP: number
    frequencyPenalty: number
    presencePenalty: number
    maxTokens: number
    seed: string
    stream: boolean
    imageUrls: string[]
  }
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:config': [config: Props['config']]
  'export-config': []
  'import-config': []
}>()

const lastSaved = ref(new Date().toLocaleString('zh-CN'))

// 默认参数值
const defaultValues = {
  temperature: 0.7,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  maxTokens: 4096,
  seed: ''
}

// 更新配置
const updateConfig = (key: keyof Props['config'], value: any) => {
  emit('update:config', {
    ...props.config,
    [key]: value
  })
}

// 重置参数
const resetParameter = (key: keyof typeof defaultValues) => {
  updateConfig(key, defaultValues[key])
}

// 重置所有设置
const resetAllSettings = () => {
  if (confirm('确定要重置所有设置为默认值吗？')) {
    emit('update:config', {
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
      imageUrls: []
    })
  }
}

// 切换图片模式
const toggleImageMode = (enabled: boolean) => {
  if (!enabled) {
    updateConfig('imageUrls', [])
  } else if (props.config.imageUrls.length === 0) {
    updateConfig('imageUrls', [''])
  }
}

// 添加图片URL
const addImageUrl = () => {
  const newUrls = [...props.config.imageUrls, '']
  updateConfig('imageUrls', newUrls)
}

// 更新图片URL
const updateImageUrl = (index: number, value: string) => {
  const newUrls = [...props.config.imageUrls]
  newUrls[index] = value
  updateConfig('imageUrls', newUrls)
}

// 移除图片URL
const removeImageUrl = (index: number) => {
  const newUrls = props.config.imageUrls.filter((_, i) => i !== index)
  updateConfig('imageUrls', newUrls)
}

// 监听配置变化，更新最后保存时间
watch(() => props.config, () => {
  lastSaved.value = new Date().toLocaleString('zh-CN')
}, { deep: true })
</script>

<style scoped>
.model-config-panel {
  padding: 24px;
  background: white;
}

.panel-header {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 16px;
}

.config-content {
  /* 内容区域样式 */
}

.config-section {
  padding: 16px 0;
  border-bottom: 1px solid #f3f4f6;
}

.config-section:last-child {
  border-bottom: none;
}

.panel-footer {
  border-top: 1px solid #e5e7eb;
  margin-top: 16px;
}

/* 滑块样式 */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #2563eb;
  border-radius: 50%;
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #2563eb;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

/* 开关样式 */
.semi-switch {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
}

.semi-switch-small {
  width: 28px;
  height: 16px;
}

.semi-switch-native-control {
  opacity: 0;
  width: 0;
  height: 0;
}

.semi-switch::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #e5e7eb;
  border-radius: 10px;
  transition: background 0.2s;
}

.semi-switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.semi-switch-small::after {
  width: 12px;
  height: 12px;
  top: 2px;
  left: 2px;
}

.semi-switch-native-control:checked + .semi-switch::before {
  background: #2563eb;
}

.semi-switch-native-control:checked + .semi-switch::after {
  transform: translateX(16px);
}

.semi-switch-small .semi-switch-native-control:checked + .semi-switch::after {
  transform: translateX(12px);
}
</style>
