<template>
  <div class="smart-model-selector">
    <!-- 当前模型显示按钮 -->
    <button
      ref="buttonRef"
      @click="toggleSelector"
      class="model-button flex items-center gap-2 px-3 py-2 bg-background hover:bg-muted/70 rounded-xl transition-all duration-200 border border-muted-foreground/20 hover:border-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm hover:shadow-md min-w-[140px] max-w-[200px]"
      :class="{
        'border-primary/40 bg-primary/10 shadow-md': isOpen,
        'border-green-500/40 bg-green-500/10': isConnected.value && !isOpen,
        'border-yellow-500/40 bg-yellow-500/10':
          isConfigured.value && !isConnected.value && !isOpen,
        'border-red-500/40 bg-red-500/10': !isConfigured.value && !isOpen
      }"
      :title="getButtonTooltip()"
      aria-label="选择AI模型"
    >
      <!-- 模型图标和信息 -->
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <span class="text-base flex-shrink-0">{{ currentProviderIcon }}</span>
        <div class="flex flex-col items-start min-w-0">
          <span class="text-sm font-medium text-foreground truncate leading-tight">
            {{ currentProviderName }}
          </span>
          <span class="text-xs text-muted-foreground truncate leading-tight">
            {{ currentModelName }}
          </span>
        </div>
      </div>

      <!-- 状态指示器 -->
      <div class="flex items-center gap-1.5 flex-shrink-0">
        <div
          class="w-1.5 h-1.5 rounded-full transition-all duration-300"
          :class="statusIndicatorClass"
        />
        <ChevronDown
          :size="14"
          class="transition-transform duration-200 text-muted-foreground"
          :class="{ 'rotate-180': isOpen }"
        />
      </div>
    </button>

    <!-- 增强版智能选择器 - 支持国内外主流大模型 -->
    <EnhancedModelPicker
      v-if="isOpen"
      ref="pickerRef"
      :show="isOpen"
      @select="handleModelSelect"
      @close="closeSelector"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import EnhancedModelPicker from './EnhancedModelPicker.vue'
import { useEnhancedModelConfig } from '@/services/model/EnhancedModelConfigService'
import type { Provider, Model } from '@/types'

// Props
interface Props {
  currentProviderId: string
  currentModelId: string
  availableProviders: Provider[]
  isConnected?: boolean
  isConfigured?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isConnected: false,
  isConfigured: false,
  disabled: false
})

// Emits
const emit = defineEmits<{
  'select-model': [providerId: string, modelId: string]
}>()

// 使用增强模型配置服务
const { presetProviders, getAllModels, getProviderStatus } = useEnhancedModelConfig()

// Refs
const buttonRef = ref<HTMLElement>()
const pickerRef = ref<InstanceType<typeof EnhancedModelPicker>>()
const isOpen = ref(false)

// 当前选中的提供商和模型ID（用于状态显示）
const selectedProviderId = ref(props.currentProviderId || 'builtin')
const selectedModelId = ref(props.currentModelId || 'miaoda-chat')

// 计算属性
const currentProvider = computed(() =>
  presetProviders.value.find(p => p.id === selectedProviderId.value)
)

const currentModel = computed(() => {
  const allModels = getAllModels()
  return allModels.find(
    m => m.providerId === selectedProviderId.value && m.id === selectedModelId.value
  )
})

const currentProviderIcon = computed(() => {
  return currentProvider.value?.icon || '🤖'
})

const currentProviderName = computed(() => {
  return currentProvider.value?.displayName || '未选择'
})

const currentModelName = computed(() => {
  return currentModel.value?.displayName || '未选择模型'
})

// 基于实际配置状态显示指示器
const statusIndicatorClass = computed(() => {
  const status = getProviderStatus(selectedProviderId.value)
  switch (status) {
    case 'configured':
      return 'bg-green-500'
    case 'testing':
      return 'bg-yellow-500 animate-pulse'
    case 'error':
      return 'bg-red-500'
    default:
      return 'bg-gray-400'
  }
})

const isConnected = computed(() => getProviderStatus(selectedProviderId.value) === 'configured')
const isConfigured = computed(() =>
  ['configured', 'testing'].includes(getProviderStatus(selectedProviderId.value))
)

// 方法
const toggleSelector = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

const closeSelector = () => {
  isOpen.value = false
}

const handleModelSelect = (providerId: string, modelId: string) => {
  // 更新本地选中状态
  selectedProviderId.value = providerId
  selectedModelId.value = modelId

  // 发出选择事件
  emit('select-model', providerId, modelId)
  closeSelector()
}

const getButtonTooltip = () => {
  const status = getProviderStatus(selectedProviderId.value)
  switch (status) {
    case 'configured':
      return '已连接 - 点击切换模型'
    case 'testing':
      return '测试中 - 点击查看状态'
    case 'error':
      return '配置错误 - 点击重新配置'
    default:
      return '未配置 - 点击配置AI模型'
  }
}

// 点击外部关闭
const handleClickOutside = (event: MouseEvent) => {
  if (
    buttonRef.value &&
    !buttonRef.value.contains(event.target as Node) &&
    pickerRef.value &&
    !pickerRef.value.$el.contains(event.target as Node)
  ) {
    closeSelector()
  }
}

// 键盘导航
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeSelector()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.model-button:focus {
  outline: none;
}

.model-button:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}
</style>
