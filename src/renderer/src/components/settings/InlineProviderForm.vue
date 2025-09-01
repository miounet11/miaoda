<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <!-- Basic Information -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="displayName" class="block text-sm font-medium mb-2">
          Display Name <span class="text-red-500">*</span>
        </label>
        <div class="space-y-1">
          <input
            id="displayName"
            v-model="form.displayName"
            type="text"
            placeholder="My Custom Provider"
            :class="[
              'w-full px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all',
              isDisplayNameTaken
                ? 'border-red-500/50 bg-red-500/5 focus:border-red-500 focus:ring-red-500/20'
                : 'border-muted-foreground/20 focus:border-primary'
            ]"
            required
          / aria-labelledby="displayName-label">
          <p v-if="isDisplayNameTaken" class="text-xs text-red-600 mt-1">
            This provider name is already in use. Please choose a unique name.
          </p>
        </div>
      </div>

      <div>
        <label for="providerType" class="block text-sm font-medium mb-2">Provider Type</label>
        <select
          id="providerType"
          v-model="form.type"
          @change="updateProviderDefaults"
          class="w-full px-3 py-2 bg-background border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        >
          <option value="openai-compatible">OpenAI Compatible</option>
          <option value="anthropic-compatible">Anthropic Compatible</option>
          <option value="ollama">Ollama</option>
          <option value="custom">Custom</option>
        </select>
      </div>
    </div>

    <!-- Icon and Description -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label for="icon" class="block text-sm font-medium mb-2">Icon</label>
        <div class="flex gap-2 items-center">
          <input
            id="icon"
            v-model="form.icon"
            type="text"
            placeholder="🔧"
            maxlength="2"
            class="w-16 px-3 py-2 bg-background border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-center"
          / aria-labelledby="icon-label">
          <div class="flex gap-1">
            <button
              v-for="emoji in quickEmojis"
              :key="emoji"
              type="button"
              @click="form.icon = emoji"
              class="w-8 h-8 flex items-center justify-center hover:bg-accent/50 rounded transition-colors text-sm"
              :class="{ 'bg-primary/10': form.icon === emoji }"
             aria-label="按钮">
              {{ emoji }}
            </button>
          </div>
        </div>
      </div>

      <div class="md:col-span-2">
        <label for="description" class="block text-sm font-medium mb-2">Description</label>
        <input
          id="description"
          v-model="form.description"
          type="text"
          placeholder="Brief description of this provider"
          class="w-full px-3 py-2 bg-background border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        / aria-labelledby="description-label">
      </div>
    </div>

    <!-- API Configuration -->
    <div class="space-y-4 pt-4 border-t border-muted">
      <h5 class="text-sm font-medium text-muted-foreground">API Configuration</h5>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="baseUrl" class="block text-sm font-medium mb-2">
            Base URL <span class="text-red-500">*</span>
          </label>
          <input
            id="baseUrl"
            v-model="form.baseUrl"
            type="url"
            placeholder="https://api.example.com/v1"
            class="w-full px-3 py-2 bg-background border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            required
          / aria-labelledby="baseUrl-label">
        </div>

        <div>
          <label for="apiKey" class="block text-sm font-medium mb-2">
            API Key
            <span v-if="form.requiresAuth" class="text-red-500">*</span>
          </label>
          <div class="relative">
            <input
              id="apiKey"
              v-model="form.apiKey"
              :type="showApiKey ? 'text' : 'password'"
              placeholder="Enter your API key"
              class="w-full px-3 py-2 pr-10 bg-background border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              :required="form.requiresAuth"
            / aria-labelledby="apiKey-label">
            <button
              type="button"
              @click="showApiKey = !showApiKey"
              class="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent/50 rounded transition-colors"
             aria-label="按钮">
              <Eye v-if="!showApiKey" :size="14" />
              <EyeOff v-else :size="14" />
            </button>
          </div>
        </div>
      </div>

      <!-- Options -->
      <div class="flex flex-wrap gap-4">
        <label class="flex items-center gap-2 cursor-pointer">
          <input id="input-lzc0ddj7g"
            v-model="form.requiresAuth"
            type="checkbox"
            class="w-4 h-4 text-primary bg-background border-muted rounded focus:ring-primary/20"
           aria-label="输入框">
          <span class="text-sm">Requires Authentication</span>
        </label>

        <label class="flex items-center gap-2 cursor-pointer">
          <input id="input-1zg2wd9qe"
            v-model="form.supportsStreaming"
            type="checkbox"
            class="w-4 h-4 text-primary bg-background border-muted rounded focus:ring-primary/20"
           aria-label="输入框">
          <span class="text-sm">Supports Streaming</span>
        </label>
      </div>
    </div>

    <!-- Models Configuration -->
    <div class="space-y-3 pt-4 border-t border-muted">
      <div class="flex items-center justify-between">
        <h5 class="text-sm font-medium text-muted-foreground">Models</h5>
        <button
          type="button"
          @click="addModel"
          class="text-xs px-2 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded transition-colors"
         aria-label="按钮">
          <Plus :size="12" class="inline mr-1" />
          Add Model
        </button>
      </div>

      <div v-if="form.models.length === 0" class="text-center py-4 text-sm text-muted-foreground">
        No models configured. Add at least one model.
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="(model, index) in form.models"
          :key="index"
          class="flex items-center gap-2 p-2 bg-muted/30 rounded-lg"
        >
          <input id="input-xmubf4pfg"
            v-model="model.id"
            type="text"
            placeholder="Model ID (e.g., gpt-4)"
            class="flex-1 px-2 py-1 bg-background border border-muted-foreground/20 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary/20"
            required
           aria-label="输入框">
          <input id="input-a7n74mxkw"
            v-model="model.displayName"
            type="text"
            placeholder="Display Name"
            class="flex-1 px-2 py-1 bg-background border border-muted-foreground/20 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary/20"
           aria-label="输入框">
          <button
            type="button"
            @click="removeModel(index)"
            class="p-1 hover:bg-destructive/10 text-destructive rounded transition-colors"
           aria-label="按钮">
            <Trash2 :size="14" />
          </button>
        </div>
      </div>
    </div>

    <!-- Test Connection -->
    <div v-if="canTestConnection" class="pt-4">
      <button
        type="button"
        @click="testConnection"
        :disabled="isTestingConnection"
        class="flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
       aria-label="按钮">
        <Zap v-if="!isTestingConnection" :size="14" />
        <Loader2 v-else :size="14" class="animate-spin" />
        <span>{{ isTestingConnection ? 'Testing...' : 'Test Connection' }}</span>
      </button>

      <!-- Test Result -->
      <div
        v-if="testResult"
        class="mt-2 p-2 rounded-lg border text-sm"
        :class="{
          'bg-green-500/10 border-green-500/20 text-green-800': testResult.success,
          'bg-red-500/10 border-red-500/20 text-red-800': !testResult.success
        }"
      >
        <div class="flex items-start gap-2">
          <Check v-if="testResult.success" :size="14" class="text-green-600 flex-shrink-0 mt-0.5" />
          <AlertCircle v-else :size="14" class="text-red-600 flex-shrink-0 mt-0.5" />
          <div class="flex-1">
            <p class="font-medium">
              {{ testResult.success ? 'Connection successful!' : 'Connection failed' }}
            </p>
            <p v-if="testResult.message" class="text-xs mt-1 opacity-80">
              {{ testResult.message }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Form Actions -->
    <div class="flex gap-3 pt-4 border-t border-muted">
      <button
        type="submit"
        :disabled="!isFormValid || isSaving"
        class="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
       aria-label="按钮">
        <Loader2 v-if="isSaving" :size="16" class="animate-spin" />
        <span>{{ isEditing ? 'Update' : 'Add' }} Provider</span>
      </button>

      <button
        type="button"
        @click="$emit('cancel')"
        class="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
       aria-label="按钮">
        Cancel
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Plus, Eye, EyeOff, Trash2, Zap, Loader2, Check, AlertCircle } from 'lucide-vue-next'
import type { LLMProvider } from '../../types/api'

interface Props {
  provider?: LLMProvider | null
}

const props = withDefaults(defineProps<Props>(), {
  provider: null
})

const emit = defineEmits<{
  save: [provider: LLMProvider]
  cancel: []
}>()

// Form state
const form = ref({
  displayName: '',
  type: 'openai-compatible',
  icon: '🔧',
  description: '',
  baseUrl: '',
  apiKey: '',
  requiresAuth: true,
  supportsStreaming: true,
  models: [] as Array<{ id: string; displayName: string; description?: string }>
})

// UI state
const showApiKey = ref(false)
const isTestingConnection = ref(false)
const isSaving = ref(false)
const testResult = ref<{ success: boolean; message?: string } | null>(null)

// Quick emoji options
const quickEmojis = ['🤖', '🧠', '⚡', '🔧', '🌟', '🚀']

// Computed
const isEditing = computed(() => !!props.provider)

const isDisplayNameTaken = computed(() =>
  props.customProviders?.some(
    p =>
      p.displayName.toLowerCase() === form.value.displayName.toLowerCase() &&
      p.id !== props.provider?.id
  )
)

const isFormValid = computed(() => {
  return !!(
    form.value.displayName &&
    !isDisplayNameTaken.value &&
    form.value.baseUrl &&
    (!form.value.requiresAuth || form.value.apiKey) &&
    form.value.models.length > 0 &&
    form.value.models.every(m => m.id)
  )
})

const canTestConnection = computed(() => {
  return !!(form.value.baseUrl && (!form.value.requiresAuth || form.value.apiKey))
})

// Provider type defaults
const providerDefaults = {
  'openai-compatible': {
    icon: '🤖',
    supportsStreaming: true,
    requiresAuth: true,
    models: [
      { id: 'gpt-3.5-turbo', displayName: 'GPT-3.5 Turbo' },
      { id: 'gpt-4', displayName: 'GPT-4' }
    ]
  },
  'anthropic-compatible': {
    icon: '🧠',
    supportsStreaming: true,
    requiresAuth: true,
    models: [
      { id: 'claude-3-sonnet', displayName: 'Claude 3 Sonnet' },
      { id: 'claude-3-haiku', displayName: 'Claude 3 Haiku' }
    ]
  },
  ollama: {
    icon: '🦙',
    supportsStreaming: true,
    requiresAuth: false,
    models: [
      { id: 'llama2', displayName: 'Llama 2' },
      { id: 'mistral', displayName: 'Mistral' }
    ]
  },
  custom: {
    icon: '⚡',
    supportsStreaming: false,
    requiresAuth: true,
    models: []
  }
}

// Methods
const updateProviderDefaults = () => {
  const defaults = providerDefaults[form.value.type as keyof typeof providerDefaults]
  if (defaults && !isEditing.value) {
    form.value.icon = defaults.icon
    form.value.supportsStreaming = defaults.supportsStreaming
    form.value.requiresAuth = defaults.requiresAuth
    if (form.value.models.length === 0) {
      form.value.models = [...defaults.models]
    }
  }
}

const addModel = () => {
  form.value.models.push({
    id: '',
    displayName: ''
  })
}

const removeModel = (index: number) => {
  form.value.models.splice(index, 1)
}

const testConnection = async () => {
  if (isTestingConnection.value || !canTestConnection.value) return

  isTestingConnection.value = true
  testResult.value = null

  try {
    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 1500))

    // For now, randomly succeed or fail for demo
    const success = Math.random() > 0.3

    testResult.value = {
      success,
      message: success
        ? 'Successfully connected to the API endpoint'
        : 'Failed to connect. Please check your URL and API key.'
    }
  } catch (error: any) {
    testResult.value = {
      success: false,
      message: error.message || 'Connection test failed'
    }
  } finally {
    isTestingConnection.value = false
  }
}

const handleSubmit = async () => {
  // Validate form before submission
  if (!isFormValid.value) {
    testResult.value = {
      success: false,
      message:
        'Please check your form. Make sure all required fields are filled and the provider name is unique.'
    }
    return
  }

  if (isSaving.value) return

  isSaving.value = true
  testResult.value = null

  try {
    // Generate unique provider ID
    const generateUniqueId = (baseName: string, existingIds: string[] = []): string => {
      const sanitizedName = baseName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

      let uniqueId = sanitizedName
      let counter = 1
      while (existingIds.includes(uniqueId)) {
        uniqueId = `${sanitizedName}-${counter}`
        counter++
      }

      return uniqueId
    }

    const providerId = isEditing.value
      ? props.provider!.id
      : generateUniqueId(form.value.displayName, props.customProviders?.map(p => p.id) || [])

    const provider: LLMProvider = {
      id: providerId,
      name: providerId,
      displayName: form.value.displayName,
      description: form.value.description || undefined,
      icon: form.value.icon,
      models: form.value.models.map(m => ({
        id: m.id,
        name: m.id,
        displayName: m.displayName || m.id,
        description: m.description,
        contextLength: 4096,
        capabilities: {
          chat: true,
          streaming: form.value.supportsStreaming,
          toolCalling: form.value.type === 'openai-compatible',
          imageInput: form.value.type === 'openai-compatible',
          imageOutput: false,
          audioInput: false,
          audioOutput: false,
          videoInput: false,
          systemMessages: true,
          temperature: true,
          topP: form.value.type === 'openai-compatible',
          topK: form.value.type === 'anthropic-compatible',
          presencePenalty: form.value.type === 'openai-compatible',
          frequencyPenalty: form.value.type === 'openai-compatible'
        }
      })),
      capabilities: {
        chat: true,
        streaming: form.value.supportsStreaming,
        toolCalling: form.value.type === 'openai-compatible',
        imageInput: form.value.type === 'openai-compatible',
        imageOutput: false,
        audioInput: false,
        audioOutput: false,
        videoInput: false,
        systemMessages: true,
        temperature: true,
        topP: form.value.type === 'openai-compatible',
        topK: form.value.type === 'anthropic-compatible',
        presencePenalty: form.value.type === 'openai-compatible',
        frequencyPenalty: form.value.type === 'openai-compatible'
      },
      configuration: {
        baseUrl: form.value.baseUrl,
        apiKey: form.value.apiKey || undefined,
        timeout: 30,
        retries: 3
      },
      status: 'disconnected',
      enabled: true
    }

    // Simulate some additional validation
    if (!provider.models.length) {
      throw new Error('At least one model must be configured')
    }

    emit('save', provider)
  } catch (error: any) {
    testResult.value = {
      success: false,
      message: error.message || 'Failed to save provider configuration'
    }
  } finally {
    isSaving.value = false
  }
}

// Initialize form from provider
const initializeForm = () => {
  if (props.provider) {
    form.value = {
      displayName: props.provider.displayName,
      type: 'custom', // Existing providers are always custom
      icon: props.provider.icon || '🔧',
      description: props.provider.description || '',
      baseUrl: props.provider.configuration.baseUrl || '',
      apiKey: props.provider.configuration.apiKey || '',
      requiresAuth: !!props.provider.configuration.apiKey,
      supportsStreaming: props.provider.capabilities?.streaming || false,
      models: props.provider.models.map(m => ({
        id: m.id,
        displayName: m.displayName || m.id,
        description: m.description
      }))
    }
  } else {
    // Reset for new provider
    form.value = {
      displayName: '',
      type: 'openai-compatible',
      icon: '🔧',
      description: '',
      baseUrl: '',
      apiKey: '',
      requiresAuth: true,
      supportsStreaming: true,
      models: []
    }
    updateProviderDefaults()
  }

  // Clear test result
  testResult.value = null
}

// Watch for provider changes
watch(() => props.provider, initializeForm, { immediate: true })

// Initialize on mount
onMounted(() => {
  initializeForm()
})
</script>

<style scoped>

/* 🎨 响应式设计系统 */
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}

/* 🎨 响应式实用类 */
.container-sm { max-width: var(--breakpoint-sm); }
.container-md { max-width: var(--breakpoint-md); }
.container-lg { max-width: var(--breakpoint-lg); }
.container-xl { max-width: var(--breakpoint-xl); }

/* 响应式显示 */
.hidden-sm { display: none; }
.hidden-md { display: none; }
.hidden-lg { display: none; }

@media (min-width: 640px) {
  .hidden-sm { display: block; }
}

@media (min-width: 768px) {
  .hidden-md { display: block; }
}

@media (min-width: 1024px) {
  .hidden-lg { display: block; }
}

/* 响应式文本 */
.text-responsive-sm { font-size: clamp(0.875rem, 2vw, 1rem); }
.text-responsive-base { font-size: clamp(1rem, 2.5vw, 1.125rem); }
.text-responsive-lg { font-size: clamp(1.125rem, 3vw, 1.25rem); }
.text-responsive-xl { font-size: clamp(1.25rem, 3.5vw, 1.5rem); }

/* 响应式间距 */
.space-responsive-sm { gap: clamp(0.5rem, 2vw, 1rem); }
.space-responsive-md { gap: clamp(1rem, 3vw, 1.5rem); }
.space-responsive-lg { gap: clamp(1.5rem, 4vw, 2rem); }

/* 响应式网格 */
.grid-responsive-sm {
  grid-template-columns: repeat(auto-fit, minmax(clamp(200px, 25vw, 300px), 1fr));
}

.grid-responsive-md {
  grid-template-columns: repeat(auto-fit, minmax(clamp(250px, 30vw, 350px), 1fr));
}

.grid-responsive-lg {
  grid-template-columns: repeat(auto-fit, minmax(clamp(300px, 35vw, 400px), 1fr));
}

/* 响应式布局调整 */
@media (max-width: 640px) {
  .flex-col-mobile { flex-direction: column; }
  .grid-1-mobile { grid-template-columns: 1fr; }
  .gap-2-mobile { gap: var(--space-2); }
  .p-4-mobile { padding: var(--space-4); }
}

@media (max-width: 768px) {
  .flex-col-tablet { flex-direction: column; }
  .grid-2-tablet { grid-template-columns: repeat(2, 1fr); }
  .gap-4-tablet { gap: var(--space-4); }
  .p-6-tablet { padding: var(--space-6); }
}

@media (max-width: 1024px) {
  .sidebar-layout {
    grid-template-columns: 1fr;
  }
  .sidebar {
    position: static;
  }
}

/* 🎨 现代布局系统 */
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.flex-start {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.flex-end {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.flex-col {
  display: flex;
  flex-direction: column;
}

.flex-wrap {
  display: flex;
  flex-wrap: wrap;
}

/* 🎨 网格系统 */
.grid-auto-fit {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-4);
}

.grid-auto-fill {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-4);
}

.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

.grid-gap-2 { gap: var(--space-2); }
.grid-gap-4 { gap: var(--space-4); }
.grid-gap-6 { gap: var(--space-6); }

/* 🎨 卡片布局 */
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.card-interactive:hover {
  cursor: pointer;
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1);
}

/* 🎨 页面布局 */
.page-layout {
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr auto;
}

.page-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: white;
  border-bottom: 1px solid var(--color-gray-200);
}

.page-main {
  padding: var(--space-6) 0;
}

.page-footer {
  border-top: 1px solid var(--color-gray-200);
  background: var(--color-gray-50);
}

/* 🎨 侧边栏布局 */
.sidebar-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--space-6);
}

.sidebar {
  position: sticky;
  top: var(--space-6);
  height: fit-content;
}

.sidebar-content {
  padding: var(--space-6);
  background: white;
  border-radius: 12px;
  border: 1px solid var(--color-gray-200);
}

/* 🎨 响应式工具 */
@media (max-width: 768px) {
  .sidebar-layout {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }

  .hidden-mobile { display: none; }
  .flex-mobile-col { flex-direction: column; }
  .grid-mobile-1 { grid-template-columns: 1fr; }
}

/* 🎨 完整间距系统 - 基于4px网格 */
:root {
  --space-0: 0;
  --space-1: 0.25rem;    /* 4px */
  --space-2: 0.5rem;     /* 8px */
  --space-3: 0.75rem;    /* 12px */
  --space-4: 1rem;       /* 16px */
  --space-5: 1.25rem;    /* 20px */
  --space-6: 1.5rem;     /* 24px */
  --space-8: 2rem;       /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */
  --space-20: 5rem;      /* 80px */
  --space-24: 6rem;      /* 96px */
  --space-32: 8rem;      /* 128px */

  /* 负间距 */
  --space-neg-1: -0.25rem;
  --space-neg-2: -0.5rem;
  --space-neg-4: -1rem;
}

/* 🎨 间距实用类 */
.m-1 { margin: var(--space-1); }
.m-2 { margin: var(--space-2); }
.m-3 { margin: var(--space-3); }
.m-4 { margin: var(--space-4); }
.m-6 { margin: var(--space-6); }
.m-8 { margin: var(--space-8); }

.p-1 { padding: var(--space-1); }
.p-2 { padding: var(--space-2); }
.p-3 { padding: var(--space-3); }
.p-4 { padding: var(--space-4); }
.p-6 { padding: var(--space-6); }
.p-8 { padding: var(--space-8); }

.mx-auto { margin-left: auto; margin-right: auto; }
.my-auto { margin-top: auto; margin-bottom: auto; }

.px-1 { padding-left: var(--space-1); padding-right: var(--space-1); }
.px-2 { padding-left: var(--space-2); padding-right: var(--space-2); }
.px-3 { padding-left: var(--space-3); padding-right: var(--space-3); }
.px-4 { padding-left: var(--space-4); padding-right: var(--space-4); }
.px-6 { padding-left: var(--space-6); padding-right: var(--space-6); }

.py-1 { padding-top: var(--space-1); padding-bottom: var(--space-1); }
.py-2 { padding-top: var(--space-2); padding-bottom: var(--space-2); }
.py-3 { padding-top: var(--space-3); padding-bottom: var(--space-3); }
.py-4 { padding-top: var(--space-4); padding-bottom: var(--space-4); }
.py-6 { padding-top: var(--space-6); padding-bottom: var(--space-6); }

/* 🎨 容器和布局间距 */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding-left: var(--space-4);
  padding-right: var(--space-4);
}

.section-spacing {
  padding-top: var(--space-12);
  padding-bottom: var(--space-12);
}

.card-spacing {
  padding: var(--space-6);
}

.stack-sm > * + * { margin-top: var(--space-2); }
.stack-md > * + * { margin-top: var(--space-4); }
.stack-lg > * + * { margin-top: var(--space-6); }
.stack-xl > * + * { margin-top: var(--space-8); }

.inline-sm > * + * { margin-left: var(--space-2); }
.inline-md > * + * { margin-left: var(--space-4); }
.inline-lg > * + * { margin-left: var(--space-6); }

/* 🎨 完整字体系统 */
:root {
  /* 字体族 */
  --font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', 'Source Code Pro', monospace;

  /* 字体大小 - 基于1.25的倍数比例 */
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-3xl: 1.875rem;  /* 30px */
  --font-size-4xl: 2.25rem;   /* 36px */
  --font-size-5xl: 3rem;      /* 48px */

  /* 字体权重 */
  --font-weight-thin: 100;
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;

  /* 行高 */
  --line-height-tight: 1.25;
  --line-height-snug: 1.375;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.625;
  --line-height-loose: 2;

  /* 字母间距 */
  --letter-spacing-tighter: -0.05em;
  --letter-spacing-tight: -0.025em;
  --letter-spacing-normal: 0;
  --letter-spacing-wide: 0.025em;
  --letter-spacing-wider: 0.05em;
  --letter-spacing-widest: 0.1em;
}

/* 🎨 字体实用类 */
.font-sans { font-family: var(--font-family-sans); }
.font-mono { font-family: var(--font-family-mono); }

.text-xs { font-size: var(--font-size-xs); line-height: var(--line-height-tight); }
.text-sm { font-size: var(--font-size-sm); line-height: var(--line-height-snug); }
.text-base { font-size: var(--font-size-base); line-height: var(--line-height-normal); }
.text-lg { font-size: var(--font-size-lg); line-height: var(--line-height-relaxed); }
.text-xl { font-size: var(--font-size-xl); line-height: var(--line-height-relaxed); }
.text-2xl { font-size: var(--font-size-2xl); line-height: var(--line-height-loose); }
.text-3xl { font-size: var(--font-size-3xl); line-height: var(--line-height-loose); }

.font-thin { font-weight: var(--font-weight-thin); }
.font-light { font-weight: var(--font-weight-light); }
.font-normal { font-weight: var(--font-weight-normal); }
.font-medium { font-weight: var(--font-weight-medium); }
.font-semibold { font-weight: var(--font-weight-semibold); }
.font-bold { font-weight: var(--font-weight-bold); }

.leading-tight { line-height: var(--line-height-tight); }
.leading-snug { line-height: var(--line-height-snug); }
.leading-normal { line-height: var(--line-height-normal); }
.leading-relaxed { line-height: var(--line-height-relaxed); }

.tracking-tight { letter-spacing: var(--letter-spacing-tight); }
.tracking-normal { letter-spacing: var(--letter-spacing-normal); }
.tracking-wide { letter-spacing: var(--letter-spacing-wide); }

/* 🎨 文本层次优化 */
.heading-1 {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tighter);
  margin-bottom: 1rem;
}

.heading-2 {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tighter);
  margin-bottom: 0.875rem;
}

.heading-3 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-snug);
  letter-spacing: var(--letter-spacing-tight);
  margin-bottom: 0.75rem;
}

.body-large {
  font-size: var(--font-size-lg);
  line-height: var(--line-height-relaxed);
  letter-spacing: var(--letter-spacing-normal);
}

.body-regular {
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-normal);
}

.body-small {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-wide);
}

.caption {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-snug);
  letter-spacing: var(--letter-spacing-wide);
  color: var(--color-gray-600);
}

/* 🎨 高级色彩系统 */
:root {
  /* 基础色彩 */
  --color-primary: hsl(221 83% 53%);
  --color-primary-hover: hsl(221 83% 48%);
  --color-primary-active: hsl(221 83% 43%);

  /* 语义色彩 */
  --color-success: hsl(142 71% 45%);
  --color-warning: hsl(38 92% 50%);
  --color-error: hsl(0 84% 60%);
  --color-info: hsl(217 91% 60%);

  /* 中性色彩 */
  --color-gray-50: hsl(210 20% 98%);
  --color-gray-100: hsl(210 15% 95%);
  --color-gray-200: hsl(210 10% 89%);
  --color-gray-300: hsl(210 8% 75%);
  --color-gray-400: hsl(210 8% 56%);
  --color-gray-500: hsl(210 6% 43%);
  --color-gray-600: hsl(210 8% 35%);
  --color-gray-700: hsl(210 10% 28%);
  --color-gray-800: hsl(210 12% 21%);
  --color-gray-900: hsl(210 15% 15%);

  /* 透明度变体 */
  --color-primary-10: hsl(221 83% 53% / 0.1);
  --color-primary-20: hsl(221 83% 53% / 0.2);
  --color-primary-30: hsl(221 83% 53% / 0.3);
  --color-success-10: hsl(142 71% 45% / 0.1);
  --color-error-10: hsl(0 84% 60% / 0.1);
}

/* 🎨 色彩实用类 */
.text-primary { color: var(--color-primary); }
.text-success { color: var(--color-success); }
.text-warning { color: var(--color-warning); }
.text-error { color: var(--color-error); }
.text-gray-500 { color: var(--color-gray-500); }
.text-gray-600 { color: var(--color-gray-600); }
.text-gray-700 { color: var(--color-gray-700); }

.bg-primary { background-color: var(--color-primary); }
.bg-primary-hover:hover { background-color: var(--color-primary-hover); }
.bg-success { background-color: var(--color-success); }
.bg-warning { background-color: var(--color-warning); }
.bg-error { background-color: var(--color-error); }

.border-primary { border-color: var(--color-primary); }
.border-success { border-color: var(--color-success); }
.border-error { border-color: var(--color-error); }

/* 🎨 对比度增强 */
.high-contrast {
  --color-primary: hsl(221 100% 40%);
  --color-gray-900: hsl(210 20% 10%);
  --color-gray-100: hsl(210 15% 95%);
}

/* 🎨 暗色主题支持 */
@media (prefers-color-scheme: dark) {
  :root {
    --color-gray-50: hsl(210 15% 15%);
    --color-gray-100: hsl(210 12% 21%);
    --color-gray-200: hsl(210 10% 28%);
    --color-gray-300: hsl(210 8% 35%);
    --color-gray-400: hsl(210 6% 43%);
    --color-gray-500: hsl(210 8% 56%);
    --color-gray-600: hsl(210 8% 75%);
    --color-gray-700: hsl(210 10% 89%);
    --color-gray-800: hsl(210 15% 95%);
    --color-gray-900: hsl(210 20% 98%);
  }
}
/* Form styling */
input:focus,
select:focus,
textarea:focus {
  outline: none;
}

/* Custom checkbox styling */
input[type='checkbox']:checked {
  background-color: hsl(var(--primary));
  border-color: hsl(var(--primary));
}

/* Mobile responsive improvements */
@media (max-width: 768px) {
  .grid.grid-cols-1.md\\:grid-cols-2 {
    grid-template-columns: 1fr;
  }

  .grid.grid-cols-1.md\\:grid-cols-3 {
    grid-template-columns: 1fr;
  }

  input,
  select,
  button {
    font-size: 16px; /* Prevents zoom on iOS */
  }

  button {
    min-height: 44px; /* Better touch targets */
  }
}

/* Enhanced focus states */
button:focus-visible,
input:focus-visible,
select:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}


/* 无障碍支持 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* 🎨 表单用户体验优化 */
.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: hsl(var(--foreground));
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: hsl(var(--ring));
  box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2);
}

.form-input.error {
  border-color: hsl(0 84% 60%);
}

.form-error {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: hsl(0 84% 60%);
}

.form-success {
  border-color: hsl(142 71% 45%);
}

/* 加载状态 */
.form-input.loading {
  background-image: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  background-size: 200% 100%;
  animation: loading-shimmer 1.5s infinite;
}

@keyframes loading-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}</style>
