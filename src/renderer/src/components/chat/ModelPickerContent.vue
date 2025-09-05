<template>
  <div class="model-picker-content">
    <!-- 头部 -->
    <div class="flex items-center justify-between p-4 border-b border-border">
      <h3 class="text-lg font-semibold text-foreground">选择AI模型</h3>
      <button
        @click="$emit('close')"
        class="p-2 hover:bg-muted rounded-lg transition-colors"
        aria-label="关闭"
      >
        <X :size="20" class="text-muted-foreground" />
      </button>
    </div>

    <!-- 内容区域 -->
    <div class="flex-1 overflow-y-auto p-4 max-h-[60vh]">
      <!-- 智能推荐 -->
      <div v-if="recommendedModels.length > 0" class="mb-6">
        <h4 class="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <Sparkles :size="16" />
          智能推荐
        </h4>
        <div class="grid gap-2">
          <button
            v-for="model in recommendedModels"
            :key="`${model.providerId}-${model.modelId}`"
            @click="selectModel(model.providerId, model.modelId)"
            class="recommended-model p-3 bg-primary/5 border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors text-left"
          >
            <div class="flex items-center gap-3">
              <span class="text-lg">{{ model.providerIcon }}</span>
              <div class="flex-1">
                <div class="font-medium text-sm">{{ model.modelName }}</div>
                <div class="text-xs text-muted-foreground">{{ model.providerName }}</div>
              </div>
              <div class="text-xs text-primary font-medium">推荐</div>
            </div>
          </button>
        </div>
      </div>

      <!-- Provider 列表 -->
      <div class="space-y-4">
        <div v-for="provider in availableProviders" :key="provider.id" class="provider-section">
          <h4 class="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
            <span class="text-base">{{ provider.icon }}</span>
            {{ provider.displayName }}
            <span v-if="!provider.isHealthy" class="text-xs text-yellow-600">(维护中)</span>
          </h4>

          <div class="grid gap-2">
            <button
              v-for="model in provider.models"
              :key="model.id"
              @click="selectModel(provider.id, model.id)"
              class="model-option p-3 border border-border rounded-lg hover:border-primary/50 hover:bg-muted/30 transition-colors text-left"
              :class="{
                'border-primary bg-primary/5': isSelected(provider.id, model.id),
                'opacity-60': !provider.isHealthy
              }"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="font-medium text-sm">{{ model.displayName }}</div>
                  <div class="text-xs text-muted-foreground">
                    {{ model.description || '暂无描述' }}
                  </div>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                      {{ formatTokens(model.contextLength) }}
                    </span>
                    <span
                      v-if="model.capabilities.vision"
                      class="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded"
                    >
                      视觉
                    </span>
                    <span
                      v-if="model.capabilities.functions"
                      class="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded"
                    >
                      工具
                    </span>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <div class="w-2 h-2 rounded-full" :class="getModelStatusColor(model)" />
                  <Check v-if="isSelected(provider.id, model.id)" :size="16" class="text-primary" />
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部操作区 -->
    <div class="p-4 border-t border-border bg-muted/20">
      <div class="flex items-center justify-between text-sm text-muted-foreground">
        <span>选择最适合您任务的AI模型</span>
        <button @click="$emit('close')" class="text-primary hover:underline">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { X, Check, Sparkles } from 'lucide-vue-next'
import type { Provider, Model } from '@/types'

// Props
interface Props {
  currentProviderId: string
  currentModelId: string
  availableProviders: Provider[]
  isMobile?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isMobile: false
})

// Emits
const emit = defineEmits<{
  select: [data: { providerId: string; modelId: string }]
  close: []
}>()

// 计算属性
const recommendedModels = computed(() => {
  // 基于使用频率和性能推荐模型
  const recommendations = []

  for (const provider of props.availableProviders) {
    if (!provider.models) continue

    // 推荐前2个最快的模型
    const fastModels = provider.models
      .filter(m => m.performance?.avgResponseTime && m.performance.avgResponseTime < 2000)
      .sort((a, b) => (a.performance?.avgResponseTime || 0) - (b.performance?.avgResponseTime || 0))
      .slice(0, 2)

    for (const model of fastModels) {
      recommendations.push({
        providerId: provider.id,
        modelId: model.id,
        providerIcon: provider.icon,
        providerName: provider.displayName,
        modelName: model.displayName
      })
    }
  }

  return recommendations.slice(0, 4) // 最多推荐4个
})

// 方法
const selectModel = (providerId: string, modelId: string) => {
  emit('select', { providerId, modelId })
}

const isSelected = (providerId: string, modelId: string) => {
  return providerId === props.currentProviderId && modelId === props.currentModelId
}

const getModelStatusColor = (model: Model) => {
  if (model.status === 'available') return 'bg-green-500'
  if (model.status === 'limited') return 'bg-yellow-500'
  return 'bg-red-500'
}

const formatTokens = (tokens: number) => {
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M tokens`
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}K tokens`
  return `${tokens} tokens`
}
</script>

<style scoped>
.recommended-model {
  position: relative;
}

.recommended-model::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, hsl(var(--primary));
  border-radius: inherit;
  opacity: 0.1;
  pointer-events: none;
}

.model-option:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

@media (max-width: 767px) {
  .model-picker-content {
    max-height: 80vh;
  }
}
</style>
