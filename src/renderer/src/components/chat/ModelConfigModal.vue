<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div class="bg-background border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden">
        <!-- 头部 -->
        <div class="flex items-center justify-between p-6 border-b border-border">
          <div class="flex items-center gap-3">
            <span class="text-2xl">{{ provider?.icon }}</span>
            <div>
              <h2 class="text-xl font-semibold text-foreground">配置 {{ provider?.displayName }}</h2>
              <p class="text-sm text-muted-foreground mt-1">{{ provider?.description }}</p>
            </div>
          </div>
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

        <!-- 内容 -->
        <div class="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <!-- 官方链接 -->
          <div v-if="provider?.officialUrl" class="bg-muted/50 rounded-lg p-4">
            <div class="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span>官方网站</span>
            </div>
            <a
              :href="provider.officialUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary hover:text-primary/80 text-sm font-medium"
            >
              {{ provider.officialUrl }}
              <svg class="inline w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          <!-- 配置表单 -->
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <!-- API Key -->
            <div v-if="provider?.requiresApiKey">
              <label class="block text-sm font-medium text-foreground mb-2">
                API 密钥 <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <input
                  v-model="formData.apiKey"
                  :type="showApiKey ? 'text' : 'password'"
                  :placeholder="provider.apiKeyPlaceholder || 'sk-xxxxxxxxxxxxxxxxxxxxxxxx'"
                  class="w-full px-3 py-2 pr-10 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  :class="{ 'border-red-300': errors.apiKey }"
                  required
                >
                <button
                  type="button"
                  @click="showApiKey = !showApiKey"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg v-if="showApiKey" class="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m6-6l2.121 2.121m0 0l-2.121 2.121M21 3l-2.121 2.121" />
                  </svg>
                  <svg v-else class="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
              <p v-if="errors.apiKey" class="mt-1 text-sm text-red-600">{{ errors.apiKey }}</p>
              <p v-else class="mt-1 text-xs text-muted-foreground">
                请在 {{ provider?.displayName }} 官网获取您的 API 密钥
              </p>
            </div>

            <!-- Base URL -->
            <div v-if="provider?.requiresBaseUrl">
              <label class="block text-sm font-medium text-foreground mb-2">
                API 端点地址
              </label>
              <input
                v-model="formData.baseUrl"
                type="url"
                :placeholder="provider.defaultBaseUrl || 'https://api.example.com/v1'"
                class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                :class="{ 'border-red-300': errors.baseUrl }"
              >
              <p v-if="errors.baseUrl" class="mt-1 text-sm text-red-600">{{ errors.baseUrl }}</p>
              <p v-else class="mt-1 text-xs text-muted-foreground">
                默认: {{ provider?.defaultBaseUrl || '官方端点' }}
              </p>
            </div>

            <!-- 自定义配置字段 -->
            <div v-for="field in provider?.configFields || []" :key="field.key">
              <label class="block text-sm font-medium text-foreground mb-2">
                {{ field.label }}
                <span v-if="field.required" class="text-red-500">*</span>
              </label>
              
              <!-- 文本输入 -->
              <input
                v-if="field.type === 'text' || field.type === 'password'"
                v-model="formData[field.key]"
                :type="field.type"
                :placeholder="field.placeholder"
                :required="field.required"
                class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                :class="{ 'border-red-300': errors[field.key] }"
              >
              
              <!-- URL输入 -->
              <input
                v-else-if="field.type === 'url'"
                v-model="formData[field.key]"
                type="url"
                :placeholder="field.placeholder"
                :required="field.required"
                class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                :class="{ 'border-red-300': errors[field.key] }"
              >
              
              <!-- 选择框 -->
              <select
                v-else-if="field.type === 'select'"
                v-model="formData[field.key]"
                :required="field.required"
                class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                :class="{ 'border-red-300': errors[field.key] }"
              >
                <option value="">请选择...</option>
                <option
                  v-for="option in field.options || []"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
              
              <p v-if="errors[field.key]" class="mt-1 text-sm text-red-600">{{ errors[field.key] }}</p>
              <p v-else-if="field.description" class="mt-1 text-xs text-muted-foreground">
                {{ field.description }}
              </p>
            </div>

            <!-- 测试结果 -->
            <div v-if="testResult" class="rounded-lg p-4" :class="testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'">
              <div class="flex items-center gap-2">
                <svg v-if="testResult.success" class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <svg v-else class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="font-medium" :class="testResult.success ? 'text-green-800' : 'text-red-800'">
                  {{ testResult.success ? '连接成功' : '连接失败' }}
                </span>
              </div>
              <p class="mt-1 text-sm" :class="testResult.success ? 'text-green-700' : 'text-red-700'">
                {{ testResult.message }}
              </p>
            </div>
          </form>
        </div>

        <!-- 底部按钮 -->
        <div class="flex items-center justify-end gap-3 p-6 border-t border-border">
          <button
            type="button"
            @click="emit('close')"
            class="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            @click="testConnection"
            :disabled="!isFormValid || testing"
            class="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
          >
            {{ testing ? '测试中...' : '测试连接' }}
          </button>
          <button
            type="button"
            @click="saveConfig"
            :disabled="!testResult?.success"
            class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            保存配置
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useEnhancedModelConfig } from '@/services/model/EnhancedModelConfigService'

interface Props {
  provider: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  configured: [providerId: string]
}>()

const { getProviderConfig, updateProviderConfig, testConnection: testProviderConnection } = useEnhancedModelConfig()

// 表单数据
const formData = ref<Record<string, any>>({})
const showApiKey = ref(false)
const errors = ref<Record<string, string>>({})
const testing = ref(false)
const testResult = ref<{ success: boolean; message: string } | null>(null)

// 表单验证
const isFormValid = computed(() => {
  if (props.provider?.requiresApiKey && !formData.value.apiKey) {
    return false
  }
  
  // 检查自定义字段
  for (const field of props.provider?.configFields || []) {
    if (field.required && !formData.value[field.key]) {
      return false
    }
  }
  
  return true
})

// 验证表单
const validateForm = () => {
  errors.value = {}
  
  if (props.provider?.requiresApiKey) {
    if (!formData.value.apiKey) {
      errors.value.apiKey = 'API密钥不能为空'
    } else if (props.provider.apiKeyPattern && !props.provider.apiKeyPattern.test(formData.value.apiKey)) {
      errors.value.apiKey = 'API密钥格式不正确'
    }
  }
  
  if (props.provider?.requiresBaseUrl && formData.value.baseUrl) {
    try {
      new URL(formData.value.baseUrl)
    } catch {
      errors.value.baseUrl = '请输入有效的URL地址'
    }
  }
  
  // 验证自定义字段
  for (const field of props.provider?.configFields || []) {
    if (field.required && !formData.value[field.key]) {
      errors.value[field.key] = `${field.label}不能为空`
    } else if (field.validation) {
      const value = formData.value[field.key]
      if (value) {
        if (field.validation instanceof RegExp) {
          if (!field.validation.test(value)) {
            errors.value[field.key] = `${field.label}格式不正确`
          }
        } else if (typeof field.validation === 'function') {
          if (!field.validation(value)) {
            errors.value[field.key] = `${field.label}验证失败`
          }
        }
      }
    }
  }
  
  return Object.keys(errors.value).length === 0
}

// 测试连接
const testConnection = async () => {
  if (!validateForm()) return
  
  testing.value = true
  testResult.value = null
  
  try {
    // 先更新配置
    updateProviderConfig(props.provider.id, formData.value)
    
    // 测试连接
    const result = await testProviderConnection(props.provider.id)
    testResult.value = result
  } catch (error) {
    testResult.value = {
      success: false,
      message: error instanceof Error ? error.message : '测试失败'
    }
  } finally {
    testing.value = false
  }
}

// 保存配置
const saveConfig = () => {
  if (testResult.value?.success) {
    updateProviderConfig(props.provider.id, {
      ...formData.value,
      configured: true,
      lastConfigured: new Date().toISOString()
    })
    emit('configured', props.provider.id)
  }
}

// 初始化表单数据
const initFormData = () => {
  const config = getProviderConfig(props.provider.id)
  
  formData.value = {
    apiKey: config.apiKey || '',
    baseUrl: config.baseUrl || props.provider?.defaultBaseUrl || '',
    ...config
  }
  
  // 初始化自定义字段
  for (const field of props.provider?.configFields || []) {
    if (formData.value[field.key] === undefined) {
      formData.value[field.key] = ''
    }
  }
}

// 监听表单变化，清除错误
watch(formData, () => {
  testResult.value = null
}, { deep: true })

onMounted(() => {
  initFormData()
})
</script>

<style scoped>
/* 模态框动画 */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>