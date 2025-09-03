<template>
  <div class="enhanced-model-picker">
    <!-- 顶部标题和搜索 -->
    <div class="picker-header sticky top-0 bg-background border-b border-border p-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-foreground">选择AI模型</h3>
        <button
          @click="emit('close')"
          class="p-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="关闭"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <!-- 搜索框 -->
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索模型..."
          class="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
        <svg class="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <!-- 分类切换 -->
      <div class="flex gap-2 mt-4 overflow-x-auto">
        <button
          v-for="category in categories"
          :key="category.key"
          @click="activeCategory = category.key"
          class="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
          :class="activeCategory === category.key 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted text-muted-foreground hover:bg-muted/80'"
        >
          <span>{{ category.icon }}</span>
          <span>{{ category.label }}</span>
          <span class="bg-background/20 px-1.5 py-0.5 rounded text-xs">{{ category.count }}</span>
        </button>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="picker-content flex-1 overflow-y-auto">
      <!-- 快速推荐 -->
      <div v-if="activeCategory === 'recommended'" class="p-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="model in recommendedModels"
            :key="`${model.providerId}-${model.id}`"
            @click="selectModel(model.providerId, model.id)"
            class="model-card group cursor-pointer p-4 border border-border rounded-lg hover:border-primary hover:shadow-md transition-all"
          >
            <div class="flex items-start gap-3">
              <span class="text-2xl">{{ model.providerIcon }}</span>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <h4 class="font-medium text-foreground group-hover:text-primary transition-colors">
                    {{ model.displayName }}
                  </h4>
                  <span class="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-medium">推荐</span>
                </div>
                <p class="text-sm text-muted-foreground mt-1">{{ model.description }}</p>
                <div class="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>{{ model.providerName }}</span>
                  <span>{{ formatContextLength(model.contextLength) }}</span>
                  <span v-if="model.pricing">{{ formatPricing(model.pricing) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分类提供商列表 -->
      <div v-else class="p-4">
        <div class="space-y-6">
          <div
            v-for="provider in filteredProviders"
            :key="provider.id"
            class="provider-section"
          >
            <!-- 提供商头部 -->
            <div class="provider-header flex items-center gap-3 mb-3">
              <span class="text-2xl">{{ provider.icon }}</span>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <h3 class="text-lg font-semibold text-foreground">{{ provider.displayName }}</h3>
                  <span
                    class="px-2 py-1 rounded-full text-xs font-medium"
                    :class="getProviderStatusClass(provider.id)"
                  >
                    {{ getProviderStatusText(provider.id) }}
                  </span>
                  <span v-if="provider.popular" class="bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-xs font-medium">
                    热门
                  </span>
                </div>
                <p class="text-sm text-muted-foreground">{{ provider.description }}</p>
              </div>
              
              <!-- 配置按钮 -->
              <button
                v-if="getProviderStatus(provider.id) === 'unconfigured'"
                @click="configureProvider(provider)"
                class="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                配置
              </button>
              <button
                v-else-if="getProviderStatus(provider.id) === 'configured'"
                @click="testProviderConnection(provider.id)"
                :disabled="loading.value"
                class="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {{ loading.value ? '测试中...' : '重新测试' }}
              </button>
            </div>

            <!-- 模型列表 -->
            <div v-if="getProviderStatus(provider.id) === 'configured'" class="models-grid grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                v-for="model in getProviderModels(provider.id)"
                :key="model.id"
                @click="selectModel(provider.id, model.id)"
                class="model-item group cursor-pointer p-3 border border-border rounded-lg hover:border-primary hover:bg-muted/30 transition-all"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <h4 class="font-medium text-foreground group-hover:text-primary transition-colors">
                        {{ model.displayName }}
                      </h4>
                      <span v-if="model.recommended" class="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs">
                        推荐
                      </span>
                    </div>
                    <p class="text-sm text-muted-foreground mt-1 line-clamp-2">{{ model.description }}</p>
                    <div class="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{{ formatContextLength(model.contextLength) }}</span>
                      <span v-if="model.pricing">{{ formatPricing(model.pricing) }}</span>
                    </div>
                  </div>
                  
                  <!-- 能力标签 -->
                  <div class="flex flex-col gap-1 ml-2">
                    <span v-if="model.capabilities.vision" class="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded text-xs">
                      视觉
                    </span>
                    <span v-if="model.capabilities.functions" class="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs">
                      函数
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 未配置状态 -->
            <div v-else class="text-center py-8">
              <div class="text-muted-foreground">
                <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p class="text-sm">需要配置API密钥才能使用</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 配置模态框 -->
    <ModelConfigModal
      v-if="showConfigModal"
      :provider="selectedProvider"
      @close="showConfigModal = false"
      @configured="handleProviderConfigured"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useEnhancedModelConfig } from '@/services/model/EnhancedModelConfigService'
import ModelConfigModal from './ModelConfigModal.vue'

interface Props {
  mobile?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  select: [{ providerId: string; modelId: string }]
  close: []
}>()

const {
  presetProviders,
  domesticProviders,
  internationalProviders,
  localProviders,
  getProviderStatus,
  getProviderConfig,
  testConnection,
  getAllModels,
  getRecommendedModels,
  loading
} = useEnhancedModelConfig()

// 响应式状态
const searchQuery = ref('')
const activeCategory = ref<string>('recommended')
const showConfigModal = ref(false)
const selectedProvider = ref(null)

// 分类定义
const categories = computed(() => [
  { key: 'recommended', label: '推荐', icon: '⭐', count: getRecommendedModels().length },
  { key: 'domestic', label: '国内', icon: '🇨🇳', count: domesticProviders.value.length },
  { key: 'international', label: '国外', icon: '🌍', count: internationalProviders.value.length },
  { key: 'local', label: '本地', icon: '💻', count: localProviders.value.length }
])

// 推荐模型
const recommendedModels = computed(() => getRecommendedModels())

// 根据分类和搜索过滤提供商
const filteredProviders = computed(() => {
  let providers = presetProviders.value
  
  // 按分类过滤
  if (activeCategory.value === 'domestic') {
    providers = domesticProviders.value
  } else if (activeCategory.value === 'international') {
    providers = internationalProviders.value
  } else if (activeCategory.value === 'local') {
    providers = localProviders.value
  }
  
  // 按搜索关键词过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    providers = providers.filter(p => 
      p.displayName.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      (p.models || []).some(m => 
        m.displayName.toLowerCase().includes(query) ||
        m.description.toLowerCase().includes(query)
      )
    )
  }
  
  return providers
})

// 获取提供商状态样式
const getProviderStatusClass = (providerId: string) => {
  const status = getProviderStatus(providerId)
  switch (status) {
    case 'configured':
      return 'bg-green-100 text-green-800'
    case 'testing':
      return 'bg-yellow-100 text-yellow-800'
    case 'error':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// 获取提供商状态文本
const getProviderStatusText = (providerId: string) => {
  const status = getProviderStatus(providerId)
  switch (status) {
    case 'configured':
      return '已配置'
    case 'testing':
      return '测试中'
    case 'error':
      return '配置错误'
    default:
      return '未配置'
  }
}

// 获取提供商的可用模型
const getProviderModels = (providerId: string) => {
  const config = getProviderConfig(providerId)
  const provider = presetProviders.value.find(p => p.id === providerId)
  return config.models || provider?.models || []
}

// 格式化上下文长度
const formatContextLength = (length: number) => {
  if (length >= 1000000) {
    return `${(length / 1000000).toFixed(1)}M tokens`
  } else if (length >= 1000) {
    return `${(length / 1000).toFixed(0)}K tokens`
  }
  return `${length} tokens`
}

// 格式化定价
const formatPricing = (pricing: any) => {
  if (!pricing) return ''
  const symbol = pricing.unit === 'RMB' ? '¥' : '$'
  return `${symbol}${pricing.input}/${symbol}${pricing.output} /1K`
}

// 选择模型
const selectModel = (providerId: string, modelId: string) => {
  emit('select', { providerId, modelId })
}

// 配置提供商
const configureProvider = (provider: any) => {
  selectedProvider.value = provider
  showConfigModal.value = true
}

// 测试提供商连接
const testProviderConnection = async (providerId: string) => {
  try {
    const result = await testConnection(providerId)
    if (result.success) {
      // 显示成功反馈
      console.log('连接测试成功:', result.message)
    } else {
      // 显示错误反馈
      console.error('连接测试失败:', result.message)
    }
  } catch (error) {
    console.error('连接测试失败:', error)
  }
}

// 处理提供商配置完成
const handleProviderConfigured = (providerId: string) => {
  showConfigModal.value = false
  selectedProvider.value = null
  // 自动测试连接
  testProviderConnection(providerId)
}

onMounted(() => {
  // 组件挂载时的初始化逻辑
})
</script>

<style scoped>
.enhanced-model-picker {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.picker-content {
  flex: 1;
  overflow-y: auto;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.model-card:hover {
  transform: translateY(-1px);
}

.model-item:hover {
  transform: translateY(-0.5px);
}

/* 滚动条样式 */
.picker-content::-webkit-scrollbar {
  width: 6px;
}

.picker-content::-webkit-scrollbar-track {
  background: transparent;
}

.picker-content::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.3);
  border-radius: 3px;
}

.picker-content::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.5);
}
</style>